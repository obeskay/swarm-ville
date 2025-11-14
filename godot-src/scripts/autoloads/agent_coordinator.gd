extends Node
## Multi-Agent Coordinator - Integrates Claude Code CLI for AI collaboration

signal agent_task_started(agent_id: String, task: String)
signal agent_task_completed(agent_id: String, result: Dictionary)
signal swarm_initialized(swarm_id: String)
signal collaboration_updated(status: Dictionary)
signal agent_behavior_changed(agent_id: String, behavior: String, zone_type: String)

var active_agents: Dictionary = {}
var claude_cli_available: bool = false
var swarm_topology: String = "mesh"
var max_agents: int = 8

func _ready() -> void:
	_check_claude_cli()

	# Connect to collaboration manager for zone-based behaviors
	CollaborationManager.zone_entered.connect(_on_agent_zone_entered)
	CollaborationManager.zone_exited.connect(_on_agent_zone_exited)

	print("[AgentCoordinator] Initialized - Multi-agent system ready")

func _check_claude_cli() -> void:
	"""Check if Claude Code CLI is available"""
	var output = []
	var exit_code = OS.execute("which", ["claude"], output)
	claude_cli_available = (exit_code == 0)

	if claude_cli_available:
		print("[AgentCoordinator] Claude CLI detected - AI agents enabled")
	else:
		print("[AgentCoordinator] Claude CLI not found - using fallback agents")

func initialize_swarm(topology: String = "mesh", agents: int = 4) -> Dictionary:
	"""Initialize multi-agent swarm for collaborative tasks"""
	swarm_topology = topology
	max_agents = agents

	var swarm_id = "swarm_%d" % Time.get_ticks_msec()

	# Create agent pool
	var agent_pool = []
	for i in range(max_agents):
		var agent = _create_agent("agent_%d" % i, "general")
		agent_pool.append(agent)
		active_agents[agent["id"]] = agent

	swarm_initialized.emit(swarm_id)

	print("[AgentCoordinator] Swarm initialized: %s with %d agents" % [swarm_id, max_agents])

	return {
		"swarm_id": swarm_id,
		"topology": topology,
		"agent_count": max_agents,
		"agents": agent_pool
	}

func _create_agent(agent_id: String, agent_type: String) -> Dictionary:
	"""Create individual agent with capabilities"""
	return {
		"id": agent_id,
		"type": agent_type,
		"status": "idle",
		"capabilities": _get_agent_capabilities(agent_type),
		"current_task": null,
		"position": Vector2i.ZERO
	}

func _get_agent_capabilities(agent_type: String) -> Array:
	"""Return capabilities based on agent type"""
	match agent_type:
		"general":
			return ["move", "interact", "observe", "coordinate"]
		"explorer":
			return ["pathfind", "scan_area", "map", "report"]
		"builder":
			return ["construct", "modify_terrain", "place_objects"]
		"communicator":
			return ["message", "broadcast", "relay", "translate"]
		_:
			return ["basic_action"]

func assign_task_to_agent(agent_id: String, task: Dictionary) -> void:
	"""Assign task to specific agent"""
	if not active_agents.has(agent_id):
		print("[AgentCoordinator] Agent not found: %s" % agent_id)
		return

	var agent = active_agents[agent_id]
	agent["current_task"] = task
	agent["status"] = "working"

	agent_task_started.emit(agent_id, task["description"])

	print("[AgentCoordinator] Task assigned to %s: %s" % [agent_id, task["description"]])

	# Execute task
	_execute_agent_task(agent_id, task)

func _execute_agent_task(agent_id: String, task: Dictionary) -> void:
	"""Execute agent task using available systems"""
	var agent = active_agents[agent_id]

	# If Claude CLI available, use for intelligent decision making
	if claude_cli_available and task.get("use_ai", false):
		_execute_with_claude_cli(agent_id, task)
	else:
		# Use built-in behavior
		_execute_basic_task(agent_id, task)

func _execute_with_claude_cli(agent_id: String, task: Dictionary) -> void:
	"""Execute task using Claude CLI for AI reasoning"""
	var prompt = _build_agent_prompt(agent_id, task)

	# Call Claude CLI asynchronously
	var output = []
	var args = ["--prompt", prompt, "--format", "json"]
	var exit_code = OS.execute("claude", args, output, true)

	if exit_code == 0 and output.size() > 0:
		var result = JSON.parse_string(output[0])
		if result:
			_complete_agent_task(agent_id, result)
	else:
		# Fallback to basic execution
		_execute_basic_task(agent_id, task)

func _build_agent_prompt(agent_id: String, task: Dictionary) -> String:
	"""Build prompt for Claude CLI based on agent context"""
	var agent = active_agents[agent_id]

	var prompt = """
	You are agent %s in a multi-agent game world.

	Current Status:
	- Position: %s
	- Capabilities: %s
	- Task: %s

	Provide a JSON response with:
	{
		"action": "action_name",
		"target": {"x": 0, "y": 0},
		"reasoning": "why this action",
		"next_steps": ["step1", "step2"]
	}
	""" % [
		agent_id,
		str(agent.get("position", Vector2i.ZERO)),
		str(agent["capabilities"]),
		task["description"]
	]

	return prompt

func _execute_basic_task(agent_id: String, task: Dictionary) -> void:
	"""Execute task with built-in logic (fallback)"""
	var result = {
		"success": true,
		"agent_id": agent_id,
		"task": task["description"],
		"action_taken": "completed_basic"
	}

	# Simulate async completion
	await get_tree().create_timer(randf_range(0.5, 2.0)).timeout
	_complete_agent_task(agent_id, result)

func _complete_agent_task(agent_id: String, result: Dictionary) -> void:
	"""Mark task as completed and notify"""
	if not active_agents.has(agent_id):
		return

	var agent = active_agents[agent_id]
	agent["status"] = "idle"
	agent["current_task"] = null

	agent_task_completed.emit(agent_id, result)

	print("[AgentCoordinator] Task completed by %s" % agent_id)

func coordinate_multi_agent_task(task_description: String, required_agents: int = 2) -> void:
	"""Coordinate multiple agents to work on complex task"""
	print("[AgentCoordinator] Coordinating %d agents for: %s" % [required_agents, task_description])

	# Get idle agents
	var available_agents = _get_idle_agents(required_agents)

	if available_agents.size() < required_agents:
		print("[AgentCoordinator] Not enough idle agents available")
		return

	# Decompose task into subtasks
	var subtasks = _decompose_task(task_description, available_agents.size())

	# Assign subtasks to agents
	for i in range(subtasks.size()):
		var agent_id = available_agents[i]
		var subtask = subtasks[i]
		assign_task_to_agent(agent_id, subtask)

	collaboration_updated.emit({
		"task": task_description,
		"agents": available_agents,
		"status": "in_progress"
	})

func _get_idle_agents(count: int) -> Array:
	"""Get list of idle agent IDs"""
	var idle = []
	for agent_id in active_agents:
		var agent = active_agents[agent_id]
		if agent["status"] == "idle":
			idle.append(agent_id)
			if idle.size() >= count:
				break
	return idle

func _decompose_task(task: String, agent_count: int) -> Array:
	"""Decompose complex task into subtasks"""
	var subtasks = []

	# Simple decomposition strategy
	for i in range(agent_count):
		subtasks.append({
			"description": "%s (Part %d/%d)" % [task, i + 1, agent_count],
			"use_ai": claude_cli_available,
			"priority": 1.0 / (i + 1)
		})

	return subtasks

func get_swarm_status() -> Dictionary:
	"""Get current status of all agents"""
	var status = {
		"total_agents": active_agents.size(),
		"idle_agents": 0,
		"working_agents": 0,
		"topology": swarm_topology
	}

	for agent_id in active_agents:
		var agent = active_agents[agent_id]
		if agent["status"] == "idle":
			status["idle_agents"] += 1
		else:
			status["working_agents"] += 1

	return status

# ========================================
# ZONE-BASED AGENT BEHAVIORS (Gather-clone pattern)
# ========================================

func _on_agent_zone_entered(user_id: String, zone_data: Dictionary) -> void:
	"""Adjust agent behavior when entering a zone"""
	# Only process for actual AI agents, not all users
	if not active_agents.has(user_id):
		return

	var zone_type = zone_data.get("zone_type", "")
	var zone_name = zone_data.get("name", "Unknown Zone")
	var agent = active_agents[user_id]

	# Apply zone-specific behavior
	var behavior = _get_zone_behavior(zone_type)
	agent["current_behavior"] = behavior
	agent["current_zone"] = zone_data

	agent_behavior_changed.emit(user_id, behavior, zone_type)

	print("[AgentCoordinator] Agent %s entered %s - behavior: %s" % [user_id, zone_name, behavior])

	# Trigger zone-specific tasks
	match zone_type:
		"meeting":
			_trigger_meeting_behavior(user_id, zone_data)
		"desk":
			_trigger_work_behavior(user_id, zone_data)
		"lounge":
			_trigger_social_behavior(user_id, zone_data)
		"kitchen":
			_trigger_casual_behavior(user_id, zone_data)
		"focus":
			_trigger_deep_work_behavior(user_id, zone_data)

func _on_agent_zone_exited(user_id: String, zone_data: Dictionary) -> void:
	"""Reset agent behavior when exiting zone"""
	if not active_agents.has(user_id):
		return

	var agent = active_agents[user_id]
	agent["current_behavior"] = "idle"
	agent["current_zone"] = null

	# Cancel zone-specific tasks
	if agent.get("current_task") and agent["current_task"].get("zone_specific", false):
		agent["current_task"] = null
		agent["status"] = "idle"

	print("[AgentCoordinator] Agent %s exited zone - returning to idle" % user_id)

func _get_zone_behavior(zone_type: String) -> String:
	"""Map zone type to agent behavior"""
	match zone_type:
		"reception":
			return "greeting"
		"meeting":
			return "collaborative"
		"desk":
			return "focused_work"
		"lounge":
			return "social"
		"kitchen":
			return "casual"
		"focus":
			return "deep_work"
		_:
			return "idle"

func _trigger_meeting_behavior(agent_id: String, zone_data: Dictionary) -> void:
	"""Trigger collaborative tasks in meeting rooms"""
	var task = {
		"description": "Participate in collaborative meeting",
		"zone_specific": true,
		"zone_type": "meeting",
		"behavior": "collaborative",
		"use_ai": true,
		"subtasks": [
			"Share ideas with nearby agents",
			"Brainstorm solutions",
			"Document meeting outcomes"
		]
	}

	assign_task_to_agent(agent_id, task)

	# Check if other agents in same zone for group collaboration
	var nearby_agents = _get_agents_in_zone(zone_data)
	if nearby_agents.size() > 1:
		print("[AgentCoordinator] %d agents in meeting - enabling group collaboration" % nearby_agents.size())
		_enable_group_collaboration(nearby_agents, zone_data)

func _trigger_work_behavior(agent_id: String, zone_data: Dictionary) -> void:
	"""Trigger focused work tasks at desks"""
	var task = {
		"description": "Complete focused work assignment",
		"zone_specific": true,
		"zone_type": "desk",
		"behavior": "focused_work",
		"use_ai": true,
		"subtasks": [
			"Process assigned tasks",
			"Minimal interruptions",
			"Produce deliverables"
		]
	}

	assign_task_to_agent(agent_id, task)

func _trigger_social_behavior(agent_id: String, zone_data: Dictionary) -> void:
	"""Trigger social/networking behavior in lounge"""
	var task = {
		"description": "Engage in social interaction",
		"zone_specific": true,
		"zone_type": "lounge",
		"behavior": "social",
		"use_ai": false,
		"subtasks": [
			"Chat with nearby agents",
			"Share casual updates",
			"Build team rapport"
		]
	}

	assign_task_to_agent(agent_id, task)

func _trigger_casual_behavior(agent_id: String, zone_data: Dictionary) -> void:
	"""Trigger casual interaction in kitchen"""
	var task = {
		"description": "Take casual break",
		"zone_specific": true,
		"zone_type": "kitchen",
		"behavior": "casual",
		"use_ai": false,
		"subtasks": [
			"Informal conversation",
			"Quick status updates",
			"Recharge energy"
		]
	}

	assign_task_to_agent(agent_id, task)

func _trigger_deep_work_behavior(agent_id: String, zone_data: Dictionary) -> void:
	"""Trigger deep work mode in focus booths"""
	var task = {
		"description": "Enter deep work mode - no interruptions",
		"zone_specific": true,
		"zone_type": "focus",
		"behavior": "deep_work",
		"use_ai": true,
		"priority": 10.0,  # High priority
		"subtasks": [
			"Complete complex analysis",
			"Block all interruptions",
			"Deep concentration task"
		]
	}

	assign_task_to_agent(agent_id, task)

func _get_agents_in_zone(zone_data: Dictionary) -> Array:
	"""Get all agents currently in a specific zone"""
	var agents_in_zone = []
	var zone_id = zone_data.get("zone_id", "")

	for agent_id in active_agents:
		var agent = active_agents[agent_id]
		if agent.get("current_zone") and agent["current_zone"].get("zone_id") == zone_id:
			agents_in_zone.append(agent_id)

	return agents_in_zone

func _enable_group_collaboration(agent_ids: Array, zone_data: Dictionary) -> void:
	"""Enable group collaboration for multiple agents in same zone"""
	var group_task = {
		"description": "Group collaboration in %s" % zone_data.get("name", "zone"),
		"zone_specific": true,
		"zone_type": zone_data.get("zone_type", ""),
		"behavior": "group_collaborative",
		"participants": agent_ids,
		"use_ai": claude_cli_available
	}

	# Broadcast to all agents in group
	for agent_id in agent_ids:
		if active_agents.has(agent_id):
			var agent = active_agents[agent_id]
			agent["group_task"] = group_task

	print("[AgentCoordinator] Group collaboration enabled for %d agents" % agent_ids.size())
