extends Node
class_name SwarmCoordinator
## Coordinates multiple agents working together on a shared goal

var swarm_id: String
var goal: String
var agent_ids: Array[String] = []
var beads_project_id: String = ""
var root_epic_id: String = ""

var active: bool = false
var created_at: float = 0.0

signal swarm_started()
signal swarm_completed()
signal agent_assigned_task(agent_id: String, task_id: String)
signal task_progress_updated(task_id: String, progress: float)

func _init(id: String, swarm_goal: String, agents: Array[String]) -> void:
	swarm_id = id
	goal = swarm_goal
	agent_ids = agents.duplicate()
	created_at = Time.get_unix_time_from_system()

func start_swarm() -> void:
	"""Initialize swarm and create Beads backlog"""
	active = true

	# Create Beads project for this swarm
	var request_id = BeadsClient.create_swarm_backlog(swarm_id, goal, agent_ids)

	# Wait for project creation, then create root epic
	await BeadsClient.project_created
	beads_project_id = BeadsClient.current_project_id

	# Create root epic for the goal
	var epic_request = BeadsClient.create_epic(goal, "Root epic for swarm: %s" % swarm_id)
	await BeadsClient.issue_created

	print("[SwarmCoordinator] Swarm '%s' started with %d agents" % [swarm_id, agent_ids.size()])
	emit_signal("swarm_started")

	# Begin task distribution
	_distribute_initial_tasks()

func _distribute_initial_tasks() -> void:
	"""Distribute initial tasks to agents"""
	# For now, create a planning task for each agent role
	for agent_id in agent_ids:
		var agent_state = AgentRegistry.get_agent(agent_id)
		if not agent_state:
			continue

		var role_name = AgentConfig.Role.keys()[agent_state.config.role]
		var task_title = "Plan %s approach for: %s" % [role_name, goal]
		var task_desc = "As a %s, create a plan for achieving this goal" % role_name

		BeadsClient.create_task(root_epic_id, task_title, task_desc, agent_id)

		# Set agent status
		agent_state.set_status(AgentState.Status.THINKING)
		agent_state.current_task = task_title

func assign_task_to_agent(agent_id: String, task_id: String, task_description: String) -> void:
	"""Assign a specific task to an agent"""
	var agent_state = AgentRegistry.get_agent(agent_id)
	if not agent_state:
		print("[SwarmCoordinator] Agent not found: %s" % agent_id)
		return

	agent_state.current_task = task_description
	agent_state.set_status(AgentState.Status.WORKING)

	# Update Beads
	BeadsClient.update_task_status(task_id, "in_progress")

	emit_signal("agent_assigned_task", agent_id, task_id)
	print("[SwarmCoordinator] Assigned task '%s' to agent '%s'" % [task_description, agent_id])

func report_task_progress(task_id: String, progress: float, notes: String = "") -> void:
	"""Report progress on a task"""
	emit_signal("task_progress_updated", task_id, progress)

	if notes:
		BeadsClient.add_comment(task_id, "Progress: %.0f%% - %s" % [progress * 100, notes])

	# If complete, mark as done
	if progress >= 1.0:
		BeadsClient.mark_task_complete(task_id)

func complete_swarm() -> void:
	"""Mark swarm as completed"""
	active = false

	# Set all agents back to idle
	for agent_id in agent_ids:
		var agent_state = AgentRegistry.get_agent(agent_id)
		if agent_state:
			agent_state.set_status(AgentState.Status.IDLE)
			agent_state.current_task = ""

	print("[SwarmCoordinator] Swarm '%s' completed" % swarm_id)
	emit_signal("swarm_completed")

func get_swarm_status() -> Dictionary:
	"""Get current swarm status"""
	var agents_status = {}
	for agent_id in agent_ids:
		var agent_state = AgentRegistry.get_agent(agent_id)
		if agent_state:
			agents_status[agent_id] = {
				"name": agent_state.config.name,
				"status": agent_state.get_status_text(),
				"task": agent_state.current_task
			}

	return {
		"swarm_id": swarm_id,
		"goal": goal,
		"active": active,
		"agent_count": agent_ids.size(),
		"agents": agents_status,
		"beads_project": beads_project_id,
		"created_at": created_at
	}
