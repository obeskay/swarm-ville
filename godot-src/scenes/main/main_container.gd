extends Control
## Main scene controller - orchestrates all subsystems

@onready var viewport_2d = $VBoxContainer/SplitContainer/Viewport2D
@onready var right_sidebar = $VBoxContainer/SplitContainer/RightSidebar
@onready var top_bar = $VBoxContainer/TopBar
@onready var bottom_bar = $VBoxContainer/BottomBar

var agent_dialog: Node

func _ready() -> void:
	# Create agent dialog
	if not has_node("AgentDialog"):
		agent_dialog = load("res://scenes/dialogs/agent_dialog.gd").new()
		agent_dialog.name = "AgentDialog"
		add_child(agent_dialog)
		agent_dialog.agent_created.connect(_on_agent_created)
	else:
		agent_dialog = $AgentDialog

	# Initialize systems immediately for testing
	_on_backend_connected()

	# Also listen for WebSocket connection
	if not WebSocketClient.connected_to_backend:
		WebSocketClient.connected.connect(_on_websocket_connected)
		print("[MainContainer] Waiting for backend connection...")

	# Connect settings request
	InputManager.settings_requested.connect(_on_settings_requested)

	print("[MainContainer] Ready!")

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

func _on_agent_removed(agent_id: String) -> void:
	print("[MainContainer] Agent removed: %s" % agent_id)

func _on_agent_updated(agent_id: String) -> void:
	print("[MainContainer] Agent updated: %s" % agent_id)

func _on_theme_changed(new_theme: String) -> void:
	print("[MainContainer] Theme changed to: %s" % new_theme)

func _on_websocket_connected() -> void:
	print("[MainContainer] WebSocket connected")

func _on_settings_requested() -> void:
	print("[MainContainer] Settings requested")
	# Future: show settings dialog

func _on_agent_created(agent_data: Dictionary) -> void:
	print("[MainContainer] Agent created locally: %s" % agent_data.get("name", "Unknown"))
