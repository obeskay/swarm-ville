extends Control
## Main scene controller - orchestrates all subsystems

var ui_panels: Dictionary = {}

func _ready() -> void:
	# Create UI panels
	_create_ui_panels()

	# Initialize systems
	WebSocketClient.connected.connect(_on_websocket_connected)
	WebSocketClient.disconnected.connect(_on_websocket_disconnected)

	# Load test space when backend connects
	SpaceManager.space_loaded.connect(_on_space_loaded)

	# Connect agent registry signals
	AgentRegistry.agent_spawned.connect(_on_agent_spawned)
	AgentRegistry.agent_removed.connect(_on_agent_removed)

	# Load initial space
	if not WebSocketClient.connected_to_backend:
		print("[MainContainer] Waiting for backend connection...")
	else:
		_on_websocket_connected()

	print("[MainContainer] Ready!")

func _create_ui_panels() -> void:
	"""Create and register all UI panels"""
	# Create chat panel
	var chat_scene = load("res://scenes/ui/chat_panel.tscn").instantiate()
	add_child(chat_scene)
	chat_scene.visible = false

	# Create inventory panel
	var inventory_scene = load("res://scenes/ui/inventory_panel.tscn").instantiate()
	add_child(inventory_scene)
	inventory_scene.visible = false

	# Create map panel
	var map_scene = load("res://scenes/ui/map_panel.tscn").instantiate()
	add_child(map_scene)
	map_scene.visible = false

	# Create status panel
	var status_scene = load("res://scenes/ui/status_panel.tscn").instantiate()
	add_child(status_scene)
	status_scene.visible = false

	# Create debug panel
	var debug_scene = load("res://scenes/ui/debug_panel.tscn").instantiate()
	add_child(debug_scene)
	debug_scene.visible = false

	print("[MainContainer] Created all UI panels")

func _on_websocket_connected() -> void:
	print("[MainContainer] WebSocket connected, loading space...")
	SpaceManager.load_space("test-space-001")

func _on_websocket_disconnected() -> void:
	print("[MainContainer] WebSocket disconnected")

func _on_space_loaded(space_id: String) -> void:
	print("[MainContainer] Space loaded: %s" % space_id)

func _on_agent_spawned(agent_id: String) -> void:
	var agent_data = AgentRegistry.get_agent(agent_id)
	print("[MainContainer] Agent spawned: %s (%s)" % [agent_id, agent_data.get("name", "Unknown")])

func _on_agent_removed(agent_id: String) -> void:
	print("[MainContainer] Agent removed: %s" % agent_id)
