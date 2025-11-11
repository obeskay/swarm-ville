extends Node2D

# Agents dictionary: user_id -> Agent node
var agents: Dictionary = {}
var agent_scene: PackedScene

# Signals
signal agent_joined(agent_data: Dictionary)
signal agent_left(user_id: String)
signal agent_moved(user_id: String, x: float, y: float, direction: String)
signal agent_action(user_id: String, action: String, data: Variant)

func _ready() -> void:
	# Load agent scene from path
	agent_scene = load("res://scenes/agents/agent.tscn")
	if agent_scene == null:
		print("[AgentManager] WARNING: Agent scene not found at res://scenes/agents/agent.tscn")

	# Connect to network signals (autoload)
	var net_mgr = get_tree().root.get_node("NetworkManager")
	net_mgr.user_joined.connect(_on_user_joined)
	net_mgr.user_left.connect(_on_user_left)
	net_mgr.position_update.connect(_on_position_update)
	net_mgr.space_state_received.connect(_on_space_state_received)

func _on_space_state_received(state: Dictionary) -> void:
	"""When space state is received, instantiate all users as agents"""
	var users = state.get("users", [])
	print("[AgentManager] Received %d users" % users.size())

	# Clear existing agents
	_clear_all_agents()

	# Add all users as agents
	for user_data in users:
		add_agent(user_data)

func _on_user_joined(user_data: Dictionary) -> void:
	"""Add a new user/agent to the space"""
	print("[AgentManager] User joined: %s" % user_data.get("name"))
	add_agent(user_data)

func _on_user_left(user_id: String) -> void:
	"""Remove a user/agent from the space"""
	print("[AgentManager] User left: %s" % user_id)
	remove_agent(user_id)

func _on_position_update(user_id: String, x: float, y: float, direction: String) -> void:
	"""Update agent position"""
	if user_id in agents:
		var agent = agents[user_id]
		agent.set_direction(direction)
		agent.move_to(Vector2(x, y))
		agent_moved.emit(user_id, x, y, direction)

func add_agent(agent_data: Dictionary) -> void:
	"""Add a new agent to the space"""
	var user_id = agent_data.get("id", "")

	if user_id in agents:
		print("[AgentManager] Agent %s already exists" % user_id)
		return

	if agent_scene == null:
		print("[AgentManager] ERROR: Cannot instantiate agent, scene not loaded")
		return

	var agent = agent_scene.instantiate()
	agent.setup(agent_data)
	add_child(agent)
	agents[user_id] = agent

	agent_joined.emit(agent_data)
	print("[AgentManager] Agent added: %s at (%.1f, %.1f)" % [user_id, agent_data.get("x", 0), agent_data.get("y", 0)])

func remove_agent(user_id: String) -> void:
	"""Remove an agent from the space"""
	if user_id in agents:
		var agent = agents[user_id]
		agent.queue_free()
		agents.erase(user_id)
		agent_left.emit(user_id)

func get_agent(user_id: String) -> Node:
	"""Get an agent by user_id"""
	return agents.get(user_id, null)

func get_all_agents() -> Dictionary:
	"""Get all agents"""
	return agents.duplicate()

func get_agent_count() -> int:
	"""Get total number of agents"""
	return agents.size()

func get_player_position() -> Vector2:
	"""Get player position (first agent or origin)"""
	if agents.is_empty():
		return Vector2.ZERO
	var first_agent = agents.values()[0]
	return first_agent.global_position

func _clear_all_agents() -> void:
	"""Clear all agents from the scene"""
	for agent in agents.values():
		agent.queue_free()
	agents.clear()

func clear() -> void:
	"""Clear all agents"""
	_clear_all_agents()
