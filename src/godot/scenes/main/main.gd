extends Node2D

var camera: Camera2D
var agent_layer: Node2D
var version_label: Label
var user_count_label: Label

# Test data
var test_space_id: String = "test-space-001"
var test_user_id: String = "player-001"
var test_user_name: String = "Player"

# References to autoload singletons
var network_manager: Node
var space_manager: Node
var agent_manager: Node

# Game system managers
var tilemap_manager: Node
var input_handler: Node
var animation_controller: Node
var sync_manager: Node
var ui_system: CanvasLayer

func _ready() -> void:
	# Get references to UI elements
	camera = $Camera2D
	agent_layer = $AgentLayer
	version_label = $UI/TopToolbar/VersionLabel
	user_count_label = $UI/TopToolbar/UserCountLabel

	# Get references to autoload singletons
	network_manager = get_tree().root.get_node("NetworkManager")
	space_manager = get_tree().root.get_node("SpaceManager")
	agent_manager = get_tree().root.get_node("AgentManager")

	# Initialize game system managers
	_setup_systems()

	# Connect to space manager signals
	space_manager.space_loaded.connect(_on_space_loaded)
	space_manager.version_changed.connect(_on_version_changed)

	# Connect to agent manager signals
	agent_manager.agent_joined.connect(_on_agent_joined)
	agent_manager.agent_left.connect(_on_agent_left)

	# Move agent layer to be child of this node
	if agent_layer.get_parent() != self:
		agent_layer.reparent(self)

	print("[Main] Scene ready, waiting for network connection...")

	# Wait for network connection then join space
	await network_manager.connected_to_server
	print("[Main] Connected to server, joining space...")
	network_manager.join_space(test_space_id, test_user_id, test_user_name)

func _process(_delta: float) -> void:
	# Update UI
	_update_ui()

	# Update debug info
	if ui_system:
		var debug_info = {
			"FPS": Engine.get_frames_per_second(),
			"Agents": agent_manager.get_agent_count(),
			"Version": space_manager.get_space_version(),
			"Sync": sync_manager.get_sync_state().get("pending_updates"),
			"Tiles": tilemap_manager.get_stats().get("tile_count")
		}
		ui_system.update_debug_info(debug_info)

func _setup_systems() -> void:
	"""Initialize all game system managers"""
	# TileMap Manager
	tilemap_manager = Node.new()
	tilemap_manager.set_script(load("res://scripts/managers/tilemap_manager.gd"))
	add_child(tilemap_manager)

	# Input Handler
	input_handler = Node.new()
	input_handler.set_script(load("res://scripts/managers/input_handler.gd"))
	add_child(input_handler)

	# Animation Controller
	animation_controller = Node.new()
	animation_controller.set_script(load("res://scripts/managers/animation_controller.gd"))
	add_child(animation_controller)

	# Sync Manager
	sync_manager = Node.new()
	sync_manager.set_script(load("res://scripts/managers/sync_manager.gd"))
	add_child(sync_manager)

	# UI System
	ui_system = CanvasLayer.new()
	ui_system.set_script(load("res://scripts/managers/ui_system.gd"))
	add_child(ui_system)

	print("[Main] All game systems initialized")

func _update_ui() -> void:
	# Update version label
	var version = space_manager.get_space_version()
	version_label.text = "Space v%d" % version

	# Update user count
	var user_count = agent_manager.get_agent_count()
	user_count_label.text = "Users: %d" % user_count

func _on_space_loaded() -> void:
	print("[Main] Space loaded")

	# Load tilemap
	if tilemap_manager:
		var space_data = space_manager.get_space_data()
		tilemap_manager.load_tilemap(space_data)

	_update_ui()

func _on_version_changed(new_version: int) -> void:
	print("[Main] Space version changed to %d" % new_version)
	if sync_manager:
		sync_manager.increment_version()
	_update_ui()

func _on_agent_joined(agent_data: Dictionary) -> void:
	print("[Main] Agent joined: %s" % agent_data.get("name"))

	# Setup animation for new agent
	if animation_controller:
		var user_id = agent_data.get("id", "")
		var agent = agent_manager.get_agent(user_id)
		if agent and agent.has_node("Sprite"):
			animation_controller.setup_agent_animation(user_id, agent.get_node("Sprite"))

	_update_ui()

func _on_agent_left(user_id: String) -> void:
	print("[Main] Agent left: %s" % user_id)
	_update_ui()
