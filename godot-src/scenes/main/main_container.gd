extends Control
## Main scene controller - orchestrates all subsystems

@onready var viewport_2d = $VBoxContainer/SplitContainer/Viewport2D
@onready var right_sidebar = $VBoxContainer/SplitContainer/RightSidebar
@onready var top_bar = $VBoxContainer/TopBar
@onready var bottom_bar = $VBoxContainer/BottomBar

func _ready() -> void:
	# Wait for WebSocket connection
	if not WebSocketClient.connected_to_backend:
		WebSocketClient.connected.connect(_on_backend_connected)
		print("[MainContainer] Waiting for backend connection...")
	else:
		_on_backend_connected()

func _on_backend_connected() -> void:
	print("[MainContainer] Backend connected, initializing...")

	# Load test space
	SpaceManager.load_space("test-space-1")

	# Connect agent registry signals
	AgentRegistry.agent_spawned.connect(_on_agent_spawned)
	AgentRegistry.agent_removed.connect(_on_agent_removed)
	AgentRegistry.agent_updated.connect(_on_agent_updated)

	# Connect theme changes
	ThemeManager.theme_changed.connect(_on_theme_changed)

	print("[MainContainer] Ready!")

func _on_agent_spawned(agent_id: String) -> void:
	print("[MainContainer] Agent spawned: %s" % agent_id)
	if right_sidebar:
		right_sidebar.add_agent(agent_id)

func _on_agent_removed(agent_id: String) -> void:
	print("[MainContainer] Agent removed: %s" % agent_id)
	if right_sidebar:
		right_sidebar.remove_agent(agent_id)

func _on_agent_updated(agent_id: String) -> void:
	if right_sidebar:
		right_sidebar.update_agent(agent_id)

func _on_theme_changed(new_theme: String) -> void:
	print("[MainContainer] Theme changed to: %s" % new_theme)
