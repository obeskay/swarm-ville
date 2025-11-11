extends Node
## Central agent management and tracking

signal agent_spawned(agent_id: String)
signal agent_updated(agent_id: String)
signal agent_removed(agent_id: String)

var agents: Dictionary = {}  # id → agent_data

func _ready() -> void:
	# Listen to WebSocket events ONLY if WebSocket is enabled
	if WebSocketClient.ws_enabled:
		WebSocketClient.agent_spawned.connect(_on_agent_spawned)
		WebSocketClient.agent_moved.connect(_on_agent_moved)
		WebSocketClient.agent_removed.connect(_on_agent_removed)
		print("[AgentRegistry] Initialized with WebSocket")
	else:
		print("[AgentRegistry] Initialized in demo mode (WebSocket disabled)")

func create_agent(agent_data: Dictionary) -> void:
	var agent_id = agent_data.get("id", "")
	if agent_id.is_empty():
		print("[AgentRegistry] Cannot create agent without ID")
		return

	agents[agent_id] = agent_data
	agent_spawned.emit(agent_id)
	print("[AgentRegistry] Created agent: %s (%s)" % [agent_data.get("name", "Unknown"), agent_id])

func get_agent(agent_id: String) -> Dictionary:
	return agents.get(agent_id, {})

func get_all_agents() -> Dictionary:
	return agents.duplicate()

func update_agent(agent_id: String, updates: Dictionary) -> void:
	if agent_id not in agents:
		print("[AgentRegistry] Agent not found: %s" % agent_id)
		return

	agents[agent_id].merge(updates)
	agent_updated.emit(agent_id)

func move_agent(agent_id: String, position: Vector2i) -> void:
	if agent_id not in agents:
		return
	agents[agent_id]["position"] = {"x": position.x, "y": position.y}
	agent_updated.emit(agent_id)

func remove_agent(agent_id: String) -> void:
	if agent_id not in agents:
		return
	agents.erase(agent_id)
	agent_removed.emit(agent_id)
	print("[AgentRegistry] Removed agent: %s" % agent_id)

func _on_agent_spawned(agent_data: Dictionary) -> void:
	create_agent(agent_data)

func _on_agent_moved(agent_id: String, position: Vector2i) -> void:
	move_agent(agent_id, position)

func _on_agent_removed(agent_id: String) -> void:
	remove_agent(agent_id)
