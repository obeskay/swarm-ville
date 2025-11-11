extends Node2D
## Space background and tile rendering

var space_data: Dictionary = {}
var camera_node: Camera2D
var grid_container: Node2D  # Container for visual grid
var agent_container: Node2D  # Container for agent nodes
var camera_zoom: float = 1.0
var is_panning: bool = false
var pan_start_pos: Vector2 = Vector2.ZERO
var player_agent_id: String = ""  # Track player for camera follow
var camera_follow_speed: float = 0.3  # Smooth follow lag

func _ready() -> void:
	# Create camera
	camera_node = Camera2D.new()
	camera_node.zoom = Vector2(camera_zoom, camera_zoom)
	camera_node.limit_left = 0
	camera_node.limit_top = 0
	camera_node.global_position = Vector2(640, 360)  # Center of 1920x1080
	add_child(camera_node)

	# Create grid container for background
	grid_container = Node2D.new()
	grid_container.name = "GridContainer"
	add_child(grid_container)

	# Create agent container
	agent_container = Node2D.new()
	agent_container.name = "AgentContainer"
	add_child(agent_container)

	# Load space
	SpaceManager.space_loaded.connect(_on_space_loaded)
	space_data = SpaceManager.get_current_space()
	if not space_data.is_empty():
		_on_space_loaded(space_data.get("id", ""))

	# Connect theme changes to update colors
	ThemeManager.theme_changed.connect(_on_theme_changed)

	# Connect agent signals
	AgentRegistry.agent_spawned.connect(_on_agent_spawned)
	AgentRegistry.agent_removed.connect(_on_agent_removed)
	AgentRegistry.agent_updated.connect(_on_agent_updated)

	# Connect input manager for WASD and agent creation
	InputManager.wasd_pressed.connect(_on_wasd_pressed)
	InputManager.agent_creation_requested.connect(_on_agent_creation_requested)
	InputManager.agent_interaction_requested.connect(_on_agent_interaction_requested)

	# Setup input for camera controls
	set_process_unhandled_input(true)

	print("[SpaceNode] Ready - Camera initialized with WASD support")

func _process(_delta: float) -> void:
	# Update camera follow for player
	if not player_agent_id.is_empty():
		for child in agent_container.get_children():
			if child.agent_id == player_agent_id:
				var target_pos = child.position
				camera_node.global_position = camera_node.global_position.lerp(target_pos, camera_follow_speed)
				break

func _draw() -> void:
	# Draw grid background
	_draw_grid()

func _draw_grid() -> void:
	if space_data.is_empty():
		return

	var dimensions = space_data.get("dimensions", {})
	var width = dimensions.get("width", 48)
	var height = dimensions.get("height", 48)
	var tile_size = GameConfig.TILE_SIZE
	var grid_color = ThemeManager.get_color("grid")
	grid_color.a = 0.2  # Low opacity for grid

	# Draw vertical lines
	for x in range(width + 1):
		var x_pos = x * tile_size
		draw_line(Vector2(x_pos, 0), Vector2(x_pos, height * tile_size), grid_color, 1.0)

	# Draw horizontal lines
	for y in range(height + 1):
		var y_pos = y * tile_size
		draw_line(Vector2(0, y_pos), Vector2(width * tile_size, y_pos), grid_color, 1.0)

	# Draw blocked tiles
	var blocked_tiles = SpaceManager.get_blocked_tiles()
	var blocked_color = ThemeManager.get_color("tile_blocked")
	blocked_color.a = 0.3

	for blocked_pos in blocked_tiles:
		var rect = Rect2(blocked_pos * tile_size, Vector2(tile_size, tile_size))
		draw_rect(rect, blocked_color, true)

func _unhandled_input(event: InputEvent) -> void:
	# Camera zoom with mouse wheel
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			camera_zoom = min(camera_zoom + 0.1, GameConfig.CAMERA_ZOOM_MAX)
			camera_node.zoom = Vector2(camera_zoom, camera_zoom)
			get_tree().root.set_input_as_handled()
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			camera_zoom = max(camera_zoom - 0.1, GameConfig.CAMERA_ZOOM_MIN)
			camera_node.zoom = Vector2(camera_zoom, camera_zoom)
			get_tree().root.set_input_as_handled()
		elif event.button_index == MOUSE_BUTTON_MIDDLE:
			is_panning = event.pressed
			if is_panning:
				pan_start_pos = get_global_mouse_position()
			get_tree().root.set_input_as_handled()

	# Camera pan with middle mouse drag
	if event is InputEventMouseMotion and is_panning:
		var delta_pos = pan_start_pos - get_global_mouse_position()
		camera_node.global_position += delta_pos
		pan_start_pos = get_global_mouse_position()
		get_tree().root.set_input_as_handled()

func _on_space_loaded(space_id: String) -> void:
	space_data = SpaceManager.get_current_space()

	# Update space limits for camera
	if camera_node:
		var dimensions = space_data.get("dimensions", {})
		var width = dimensions.get("width", 48)
		var height = dimensions.get("height", 48)
		var tile_size = GameConfig.TILE_SIZE

		camera_node.limit_right = width * tile_size
		camera_node.limit_bottom = height * tile_size
		camera_node.global_position = Vector2(width * tile_size / 2, height * tile_size / 2)

	# Redraw grid
	queue_redraw()
	print("[SpaceNode] Space loaded: %s" % space_id)

func _on_agent_spawned(agent_id: String) -> void:
	var agent_data = AgentRegistry.get_agent(agent_id)
	if agent_data.is_empty():
		return

	# Create agent node
	var agent_node = load("res://scenes/space/agent_node.tscn").instantiate()
	agent_node.setup(agent_data)
	agent_container.add_child(agent_node)

	# Detect if this is the player agent
	if agent_data.get("name", "").to_lower().contains("player") or agent_data.get("role", "") == "player":
		player_agent_id = agent_id
		print("[SpaceNode] Found player agent: %s" % agent_id)

	# Create spawn animation
	agent_node.scale = Vector2(GameConfig.SPAWN_ANIMATION_START_SCALE, GameConfig.SPAWN_ANIMATION_START_SCALE)
	agent_node.modulate.a = GameConfig.SPAWN_ANIMATION_START_ALPHA

	var tween = create_tween()
	tween.set_parallel(true)
	tween.tween_property(agent_node, "scale", Vector2.ONE, GameConfig.SPAWN_ANIMATION_SPEED)
	tween.tween_property(agent_node, "modulate:a", GameConfig.SPAWN_ANIMATION_END_ALPHA, GameConfig.SPAWN_ANIMATION_SPEED)

	print("[SpaceNode] Agent spawned: %s" % agent_id)

func _on_agent_removed(agent_id: String) -> void:
	# Find and remove agent node
	for child in agent_container.get_children():
		if child.agent_id == agent_id:
			child.queue_free()
			print("[SpaceNode] Agent removed: %s" % agent_id)
			return

func _on_agent_updated(agent_id: String) -> void:
	var agent_data = AgentRegistry.get_agent(agent_id)
	if agent_data.is_empty():
		return

	# Find and update agent node
	for child in agent_container.get_children():
		if child.agent_id == agent_id:
			child.agent_data = agent_data.duplicate()
			break

func _on_theme_changed(new_theme: String) -> void:
	# Redraw grid with new colors
	queue_redraw()
	print("[SpaceNode] Theme changed, updated tile colors")

func _on_wasd_pressed(direction: Vector2) -> void:
	# Move camera in WASD direction (pannable view)
	var move_speed = 200.0  # pixels per frame
	var move_direction = direction * move_speed
	camera_node.global_position += move_direction
	print("[SpaceNode] Camera moved by: %s" % move_direction)

func _on_agent_creation_requested() -> void:
	# Create a new agent at random position
	var dimensions = space_data.get("dimensions", {})
	var width = dimensions.get("width", 48)
	var height = dimensions.get("height", 48)

	var random_x = randi() % width
	var random_y = randi() % height

	var agent_id = "agent_%d" % randi()
	var agent_data = {
		"id": agent_id,
		"name": "Agent %s" % agent_id.split("_")[1],
		"position": {"x": random_x, "y": random_y},
		"role": "assistant"
	}

	AgentRegistry.create_agent(agent_data)
	print("[SpaceNode] Agent creation requested: %s at (%d, %d)" % [agent_id, random_x, random_y])

func _on_agent_interaction_requested() -> void:
	# Send message to nearest agent
	if agent_container.get_child_count() == 0:
		print("[SpaceNode] No agents to interact with")
		return

	var nearest_agent = null
	var nearest_distance = INF

	for agent_node in agent_container.get_children():
		var distance = agent_node.position.distance_to(Vector2.ZERO)
		if distance < nearest_distance:
			nearest_distance = distance
			nearest_agent = agent_node

	if nearest_agent:
		var test_message = "Hello from player!"
		WebSocketClient.send_message({
			"type": "chat_message",
			"agent_id": nearest_agent.agent_id,
			"text": test_message,
			"timestamp": Time.get_ticks_msec()
		})
		print("[SpaceNode] Sent interaction to agent: %s" % nearest_agent.agent_id)
