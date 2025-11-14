extends Node
## Beads Client - Interface to Beads issue tracker CLI for agent memory
## Autoload singleton

var current_project_id: String = ""
var active_issues: Dictionary = {}  # issue_id -> issue_data

signal project_created(project_id: String)
signal issue_created(issue_id: String, issue_data: Dictionary)
signal issue_updated(issue_id: String, issue_data: Dictionary)
signal task_completed(issue_id: String)

func _ready() -> void:
	print("[BeadsClient] Initialized - ready to manage agent memory via Beads")

	# Connect to CLI Manager
	if has_node("/root/CLIManager"):
		var cli_manager = get_node("/root/CLIManager")
		cli_manager.cli_response.connect(_on_cli_response)
		cli_manager.cli_error.connect(_on_cli_error)

func create_project(project_name: String, description: String = "") -> String:
	"""Create a new Beads project for a swarm/space"""
	var request_id = CLIManager.call_beads("create-project", {
		"name": project_name,
		"description": description
	})

	print("[BeadsClient] Creating project: %s" % project_name)
	return request_id

func create_epic(title: String, description: String = "") -> String:
	"""Create a new epic (top-level task)"""
	var request_id = CLIManager.call_beads("create-epic", {
		"title": title,
		"description": description,
		"project_id": current_project_id
	})

	print("[BeadsClient] Creating epic: %s" % title)
	return request_id

func create_task(parent_id: String, title: String, description: String = "", assigned_to: String = "") -> String:
	"""Create a sub-task under an epic or task"""
	var request_id = CLIManager.call_beads("create-task", {
		"parent_id": parent_id,
		"title": title,
		"description": description,
		"assigned_to": assigned_to,
		"project_id": current_project_id
	})

	print("[BeadsClient] Creating task: %s (parent: %s)" % [title, parent_id])
	return request_id

func get_ready_tasks() -> String:
	"""Get tasks that are ready to be worked on"""
	var request_id = CLIManager.call_beads("get-ready", {
		"project_id": current_project_id
	})

	print("[BeadsClient] Fetching ready tasks...")
	return request_id

func update_task_status(issue_id: String, status: String) -> String:
	"""Update task status (ready, in_progress, blocked, done)"""
	var request_id = CLIManager.call_beads("update-status", {
		"issue_id": issue_id,
		"status": status,
		"project_id": current_project_id
	})

	print("[BeadsClient] Updating task %s to status: %s" % [issue_id, status])
	return request_id

func mark_task_complete(issue_id: String) -> String:
	"""Mark a task as completed"""
	return update_task_status(issue_id, "done")

func add_comment(issue_id: String, comment: String, author: String = "") -> String:
	"""Add comment/note to an issue"""
	var request_id = CLIManager.call_beads("add-comment", {
		"issue_id": issue_id,
		"comment": comment,
		"author": author,
		"project_id": current_project_id
	})

	print("[BeadsClient] Adding comment to task %s" % issue_id)
	return request_id

func get_task_dependencies(issue_id: String) -> String:
	"""Get dependencies for a task"""
	var request_id = CLIManager.call_beads("get-dependencies", {
		"issue_id": issue_id,
		"project_id": current_project_id
	})

	return request_id

func create_swarm_backlog(swarm_id: String, goal: String, agent_ids: Array) -> String:
	"""Create a Beads project for a swarm with initial epic"""
	var project_name = "Swarm: %s" % swarm_id
	var description = "Goal: %s\nAgents: %s" % [goal, ", ".join(agent_ids)]

	var request_id = create_project(project_name, description)

	# Store for later epic creation
	var project_data = {
		"swarm_id": swarm_id,
		"goal": goal,
		"agent_ids": agent_ids
	}

	return request_id

func _on_cli_response(request_id: String, response: Dictionary) -> void:
	"""Handle CLI responses"""
	if not request_id.begins_with("beads_"):
		return

	print("[BeadsClient] Received response for: %s" % request_id)

	# Parse response and emit appropriate signals
	match response.get("command", ""):
		"create-project":
			var project_id = response.get("project_id", "")
			if project_id:
				current_project_id = project_id
				emit_signal("project_created", project_id)

		"create-epic", "create-task":
			var issue_id = response.get("issue_id", "")
			var issue_data = response.get("issue_data", {})
			if issue_id:
				active_issues[issue_id] = issue_data
				emit_signal("issue_created", issue_id, issue_data)

		"update-status":
			var issue_id = response.get("issue_id", "")
			var issue_data = response.get("issue_data", {})
			if issue_id:
				active_issues[issue_id] = issue_data
				emit_signal("issue_updated", issue_id, issue_data)

				if issue_data.get("status") == "done":
					emit_signal("task_completed", issue_id)

func _on_cli_error(request_id: String, error: String) -> void:
	"""Handle CLI errors"""
	if request_id.begins_with("beads_"):
		print("[BeadsClient] ERROR: %s" % error)

func get_issue(issue_id: String) -> Dictionary:
	"""Get cached issue data"""
	return active_issues.get(issue_id, {})

func get_all_issues() -> Dictionary:
	"""Get all cached issues"""
	return active_issues.duplicate()
