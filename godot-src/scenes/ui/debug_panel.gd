extends PanelContainer
## Debug panel - performance stats and diagnostics

var fps_label: Label
var agent_count_label: Label
var version_label: Label
var connection_label: Label

func _ready() -> void:
	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 5)

	# FPS
	fps_label = Label.new()
	fps_label.text = "FPS: 0"
	vbox.add_child(fps_label)

	# Agent count
	agent_count_label = Label.new()
	agent_count_label.text = "Agents: 0"
	vbox.add_child(agent_count_label)

	# Space version
	version_label = Label.new()
	version_label.text = "Version: 0"
	vbox.add_child(version_label)

	# Connection status
	connection_label = Label.new()
	connection_label.text = "Connection: Disconnected"
	vbox.add_child(connection_label)

	add_child(vbox)
	UISystem.register_panel("debug", self)

	# Connect to signals
	WebSocketClient.connected.connect(_on_connected)
	WebSocketClient.disconnected.connect(_on_disconnected)
	SyncManager.space_version_updated.connect(_on_version_updated)
	AgentRegistry.agent_spawned.connect(_on_agent_changed)
	AgentRegistry.agent_removed.connect(_on_agent_changed)

	print("[DebugPanel] Ready")

func _process(_delta: float) -> void:
	"""Update debug info every frame"""
	fps_label.text = "FPS: %d" % Engine.get_frames_per_second()
	agent_count_label.text = "Agents: %d" % AgentRegistry.agents.size()

func _on_connected() -> void:
	connection_label.text = "Connection: Connected"
	connection_label.add_theme_color_override("font_color", Color.GREEN)

func _on_disconnected() -> void:
	connection_label.text = "Connection: Disconnected"
	connection_label.add_theme_color_override("font_color", Color.RED)

func _on_version_updated(new_version: int) -> void:
	version_label.text = "Version: %d" % new_version

func _on_agent_changed(_agent_id: String) -> void:
	agent_count_label.text = "Agents: %d" % AgentRegistry.agents.size()
