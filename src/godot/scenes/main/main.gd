extends Node2D

var camera: Camera2D
var agent_layer: Node2D
var version_label: Label
var user_count_label: Label

# Test data
var test_space_id: String = "test-space-001"
var test_user_id: String = "player-001"
var test_user_name: String = "Player"

func _ready() -> void:
	# Get references to UI elements
	camera = $Camera2D
	agent_layer = $AgentLayer
	version_label = $UI/TopToolbar/VersionLabel
	user_count_label = $UI/TopToolbar/UserCountLabel

	# Connect to space manager signals
	SpaceManager.space_loaded.connect(_on_space_loaded)
	SpaceManager.version_changed.connect(_on_version_changed)

	# Connect to agent manager signals
	AgentManager.agent_joined.connect(_on_agent_joined)
	AgentManager.agent_left.connect(_on_agent_left)

	# Move agent layer to be child of this node
	if agent_layer.get_parent() != self:
		agent_layer.reparent(self)

	# Reparent AgentManager to AgentLayer if it exists
	var agent_mgr = get_tree().root.get_node_or_null("AgentManager")
	if agent_mgr and agent_mgr.get_parent() != agent_layer:
		agent_mgr.reparent(agent_layer)

	print("[Main] Scene ready, waiting for network connection...")

	# Wait for network connection then join space
	await NetworkManager.connected_to_server
	print("[Main] Connected to server, joining space...")
	NetworkManager.join_space(test_space_id, test_user_id, test_user_name)

func _process(_delta: float) -> void:
	# Update UI
	_update_ui()

func _update_ui() -> void:
	# Update version label
	var version = SpaceManager.get_space_version()
	version_label.text = "Space v%d" % version

	# Update user count
	var user_count = AgentManager.get_agent_count()
	user_count_label.text = "Users: %d" % user_count

func _on_space_loaded() -> void:
	print("[Main] Space loaded")
	_update_ui()

func _on_version_changed(new_version: int) -> void:
	print("[Main] Space version changed to %d" % new_version)
	_update_ui()

func _on_agent_joined(agent_data: Dictionary) -> void:
	print("[Main] Agent joined: %s" % agent_data.get("name"))
	_update_ui()

func _on_agent_left(user_id: String) -> void:
	print("[Main] Agent left: %s" % user_id)
	_update_ui()
