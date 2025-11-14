extends Node2D
## Complete gameplay demo scene with all features

var viewport_camera: Camera2D
var player_controller: Node2D
var agent_spawner_timer: float = 0.0
var agents_on_screen: Dictionary = {}
var tilemap_layer: Node2D
var tileset_texture: Texture2D
var character_textures: Array = []
var tilemap_sprites: Dictionary = {}  # Store tile sprites for updates
var tile_layers: Dictionary = {  # Organize sprites by layer
	"floor": Node2D.new(),
	"above_floor": Node2D.new(),
	"object": Node2D.new()
}
var camera_zoom_min: float = 0.5
var camera_zoom_max: float = 3.0
var camera_zoom_speed: float = 0.1

func _ready() -> void:
	# Get existing nodes from scene
	viewport_camera = $Camera2D
	player_controller = $PlayerController

	# Setup camera
	viewport_camera.zoom = Vector2(1.0, 1.0)
	viewport_camera.limit_left = 0
	viewport_camera.limit_top = 0
	viewport_camera.make_current()

	# Move background ColorRect to be behind tilemap
	var background = $ColorRect
	if background:
		background.z_index = -20
		print("[GameplayDemo] Background ColorRect z_index set to -20")

	# Load tileset texture for background
	_setup_tileset()

	# Initialize tile layers (add in order: floor, above_floor, object for proper z-order)
	tilemap_layer = Node2D.new()
	tilemap_layer.name = "TilemapLayers"
	tilemap_layer.z_index = -10  # Ensure tilemap is behind everything
	add_child(tilemap_layer)
	move_child(tilemap_layer, 0)  # Put tilemap at back (index 0)
	tilemap_layer.add_child(tile_layers["floor"])
	tilemap_layer.add_child(tile_layers["above_floor"])
	tilemap_layer.add_child(tile_layers["object"])
	tile_layers["floor"].name = "Floor"
	tile_layers["above_floor"].name = "AboveFloor"
	tile_layers["object"].name = "Object"

	print("[GameplayDemo] Tilemap layer initialized with z_index = -10")

	# Draw grid background
	_draw_grid()

	# Connect signals
	GameState.game_started.connect(_on_game_started)
	GameState.score_changed.connect(_on_score_changed)
	WebSocketClient.space_loaded.connect(_on_space_loaded_from_server)

	# Setup input for demo
	InputManager.agent_creation_requested.connect(_on_spawn_agent_demo)
	InputManager.zoom_requested.connect(_on_zoom_requested)

	# Load all character spritesheet textures (cache them)
	_load_character_textures()

	# Start game
	GameState.start_game()
	set_process(true)

	# Generate initial tilemap
	var initial_space_data = {"tilemap": _generate_sample_tilemap()}
	_render_tilemap(initial_space_data)

	print("[GameplayDemo] Ready! Press SPACE to spawn enemies, WASD to move")

func _process(delta: float) -> void:
	# Update camera to follow player
	if player_controller:
		viewport_camera.global_position = viewport_camera.global_position.lerp(player_controller.global_position, 0.15)

	# NOTE: Auto-spawning disabled - agents now spawn only on user request (SPACE key)
	# This prevents agents from moving randomly without player input
	#if GameState.is_playing and agents_on_screen.size() < GameState.game_config.max_agents:
	#	agent_spawner_timer += delta
	#	if agent_spawner_timer > (1.0 / GameState.game_config.spawn_rate):
	#		_spawn_ai_agent()
	#		agent_spawner_timer = 0.0

func _draw() -> void:
	# Draw grid
	var tile_size = GameConfig.TILE_SIZE
	var width = 48
	var height = 48
	var grid_color = ThemeManager.get_color("grid")
	grid_color.a = 0.15

	for x in range(width + 1):
		var x_pos = x * tile_size
		draw_line(Vector2(x_pos, 0), Vector2(x_pos, height * tile_size), grid_color, 1.0)

	for y in range(height + 1):
		var y_pos = y * tile_size
		draw_line(Vector2(0, y_pos), Vector2(width * tile_size, y_pos), grid_color, 1.0)

func _draw_grid() -> void:
	queue_redraw()

func _on_game_started() -> void:
	print("[GameplayDemo] Game started!")

func _on_score_changed(new_score: int) -> void:
	print("[GameplayDemo] Score: %d" % new_score)

func _on_spawn_agent_demo() -> void:
	# Limit spawning to prevent lag - max 50 agents
	if agents_on_screen.size() >= 50:
		print("[GameplayDemo] Max agents reached (50)")
		return

	# Spawn enemy agent near player
	var offset = Vector2(randf_range(-5, 5) * GameConfig.TILE_SIZE, randf_range(-5, 5) * GameConfig.TILE_SIZE)
	var spawn_pos = player_controller.global_position + offset

	# Clamp to grid
	spawn_pos.x = clamp(spawn_pos.x, 0, 48 * GameConfig.TILE_SIZE)
	spawn_pos.y = clamp(spawn_pos.y, 0, 48 * GameConfig.TILE_SIZE)

	_create_enemy_agent(spawn_pos)

func _spawn_ai_agent() -> void:
	# Random spawn position
	var x = randi() % 48
	var y = randi() % 48
	var spawn_pos = Vector2(x * GameConfig.TILE_SIZE, y * GameConfig.TILE_SIZE)

	_create_enemy_agent(spawn_pos)

func _create_enemy_agent(world_pos: Vector2) -> void:
	var agent_id = "enemy_%d" % randi()
	var agent_sprite = Sprite2D.new()
	agent_sprite.centered = true

	# Use cached textures with cropped 48x48 frames from 192x192 spritesheets
	if character_textures.size() > 0:
		var sprite_texture = character_textures[randi() % character_textures.size()]
		var frame_index = randi() % 16  # 4x4 grid = 16 frames

		# Create AtlasTexture to crop 48x48 from 192x192 spritesheet
		var atlas = AtlasTexture.new()
		atlas.atlas = sprite_texture
		atlas.region = Rect2(
			(frame_index % 4) * 48,  # column * frame_width
			(frame_index / 4) * 48,  # row * frame_height
			48,                       # width
			48                        # height
		)
		agent_sprite.texture = atlas

	# Don't tint sprites, use original colors
	agent_sprite.self_modulate = Color.WHITE
	agent_sprite.scale = Vector2(1.5, 1.5)
	agent_sprite.global_position = world_pos

	var label = Label.new()
	label.text = "E%d" % (agents_on_screen.size() + 1)
	label.add_theme_font_size_override("font_size", 10)
	label.position.y = -GameConfig.TILE_SIZE * 0.6
	agent_sprite.add_child(label)

	# Add to scene
	add_child(agent_sprite)
	agents_on_screen[agent_id] = {
		"node": agent_sprite,
		"health": 30,
		"position": world_pos
	}

	print("[GameplayDemo] Spawned %s at (%d, %d)" % [agent_id, int(world_pos.x / GameConfig.TILE_SIZE), int(world_pos.y / GameConfig.TILE_SIZE)])

func _on_player_defeated() -> void:
	GameState.end_game()
	print("[GameplayDemo] Game Over!")

func _on_enemy_defeated(enemy_id: String) -> void:
	if agents_on_screen.has(enemy_id):
		var enemy_node = agents_on_screen[enemy_id]["node"]

		# Removal animation
		var tween = create_tween()
		tween.set_parallel(true)
		tween.tween_property(enemy_node, "scale", Vector2.ZERO, 0.3)
		tween.tween_property(enemy_node, "modulate:a", 0.0, 0.3)
		tween.tween_callback(func(): enemy_node.queue_free())

		agents_on_screen.erase(enemy_id)
		GameState.defeat_agent()

func _load_character_textures() -> void:
	"""Cache all character spritesheet textures from assets/sprites/characters/"""
	character_textures.clear()
	for i in range(1, 84):  # Character_001 to Character_083
		var sprite_path = "res://assets/sprites/characters/Character_%03d.png" % i
		var texture = load(sprite_path)
		if texture:
			character_textures.append(texture)
	print("[GameplayDemo] Loaded %d character textures" % character_textures.size())

func _setup_tileset() -> void:
	"""Load and display tileset background"""
	# Try to load one of the tileset textures as background
	var tileset_path = "res://assets/sprites/spritesheets/grasslands.png"
	tileset_texture = load(tileset_path)
	if tileset_texture:
		print("[GameplayDemo] Loaded tileset from %s" % tileset_path)

func _on_space_loaded_from_server(space_data: Dictionary) -> void:
	"""Render tilemap when space data is loaded from server"""
	_render_tilemap(space_data)

func _render_tilemap(space_data: Dictionary) -> void:
	"""Render all tiles from space_data into tile layers"""
	print("[GameplayDemo] Starting tilemap render...")

	# Clear existing tiles
	if tile_layers["floor"]:
		for child in tile_layers["floor"].get_children():
			child.queue_free()
	if tile_layers["above_floor"]:
		for child in tile_layers["above_floor"].get_children():
			child.queue_free()
	if tile_layers["object"]:
		for child in tile_layers["object"].get_children():
			child.queue_free()
	tilemap_sprites.clear()

	var tilemap_data = space_data.get("tilemap", {})
	if tilemap_data.is_empty():
		print("[GameplayDemo] No tilemap data in space, generating sample tilemap")
		tilemap_data = _generate_sample_tilemap()
		space_data["tilemap"] = tilemap_data

	# Iterate through all tiles and render them by layer
	for key in tilemap_data.keys():
		var tile_data = tilemap_data[key]
		var parts = key.split(",")
		if parts.size() != 2:
			continue

		var grid_x = int(parts[0])
		var grid_y = int(parts[1])
		var world_x = grid_x * GameConfig.TILE_SIZE
		var world_y = grid_y * GameConfig.TILE_SIZE

		# Render floor layer
		if tile_data.get("floor"):
			_place_tile(grid_x, grid_y, world_x, world_y, tile_data.get("floor"), "floor")

		# Render above_floor layer
		if tile_data.get("above_floor"):
			_place_tile(grid_x, grid_y, world_x, world_y, tile_data.get("above_floor"), "above_floor")

		# Render object layer
		if tile_data.get("object"):
			_place_tile(grid_x, grid_y, world_x, world_y, tile_data.get("object"), "object")

	var floor_count = tile_layers["floor"].get_child_count()
	var above_count = tile_layers["above_floor"].get_child_count()
	var object_count = tile_layers["object"].get_child_count()
	print("[GameplayDemo] Rendered tiles - Floor: %d, Above: %d, Object: %d (Total keys: %d)" % [floor_count, above_count, object_count, tilemap_sprites.size()])

func _place_tile(grid_x: int, grid_y: int, world_x: int, world_y: int, _tile_name: String, layer: String) -> void:
	"""Place a single tile sprite using spritesheet or fallback to colored rect"""
	# Try to use spritesheet if available
	if tileset_texture:
		# Create sprite with atlas texture for tileset
		var sprite = Sprite2D.new()
		sprite.centered = false
		sprite.position = Vector2(world_x, world_y)

		# Map tile names to frame indices in spritesheet
		var frame_index = _get_frame_index_for_tile(_tile_name)

		# Create AtlasTexture to crop from tileset
		var atlas = AtlasTexture.new()
		atlas.atlas = tileset_texture

		# Grasslands spritesheet is 1024x1024 with 64px tiles (16x16 grid)
		var tile_frame_size = 64
		atlas.region = Rect2(
			(frame_index % 16) * tile_frame_size,
			(frame_index / 16) * tile_frame_size,
			tile_frame_size,
			tile_frame_size
		)
		atlas.filter_clip = true
		sprite.texture = atlas
		# No scaling needed - tile_frame_size (64) matches GameConfig.TILE_SIZE (64)
		sprite.scale = Vector2(1.0, 1.0)

		tile_layers[layer].add_child(sprite)

		var key = "%d,%d" % [grid_x, grid_y]
		if not tilemap_sprites.has(key):
			tilemap_sprites[key] = {}
		tilemap_sprites[key][layer] = sprite
	else:
		# Fallback: use ColorRect with colors - vibrant palette
		var tile_color = Color(0.34, 0.76, 0.2, 1.0)  # Grass green (brighter)

		match _tile_name:
			"grass":
				tile_color = Color(0.34, 0.76, 0.2, 1.0)  # Bright grass green
			"water":
				tile_color = Color(0.2, 0.6, 0.95, 1.0)  # Bright water blue
			"tree":
				tile_color = Color(0.1, 0.5, 0.1, 1.0)  # Dark forest green
			"stone":
				tile_color = Color(0.6, 0.6, 0.6, 1.0)  # Light gray stone
			"rocky":
				tile_color = Color(0.5, 0.45, 0.35, 1.0)  # Brown rocky
			"sand":
				tile_color = Color(0.9, 0.85, 0.5, 1.0)  # Sandy yellow
			_:
				tile_color = Color(0.34, 0.76, 0.2, 1.0)  # Default to grass

		var tile_rect = ColorRect.new()
		tile_rect.color = tile_color
		tile_rect.size = Vector2(GameConfig.TILE_SIZE, GameConfig.TILE_SIZE)
		tile_rect.position = Vector2(world_x, world_y)

		tile_layers[layer].add_child(tile_rect)

		var key = "%d,%d" % [grid_x, grid_y]
		if not tilemap_sprites.has(key):
			tilemap_sprites[key] = {}
		tilemap_sprites[key][layer] = tile_rect

func _get_frame_index_for_tile(tile_name: String) -> int:
	"""Map tile names to spritesheet frame indices - using simple 4x4 base tiles"""
	# Grasslands spritesheet 1024x1024, 64px tiles = 16x16 grid
	# Keep it simple - use only first 16 frames (4x4) from top-left

	match tile_name:
		"grass":
			# Frames 0-3: grass variants in row 0
			var grass_options = [0, 1, 2, 3]
			return grass_options[randi() % grass_options.size()]

		"water":
			# Frames 4-7: water in row 0, cols 4-7
			var water_options = [4, 5, 6, 7]
			return water_options[randi() % water_options.size()]

		"tree":
			# Frames 8-11: trees in row 0, cols 8-11
			var tree_options = [8, 9, 10, 11]
			return tree_options[randi() % tree_options.size()]

		"stone":
			# Frames 12-15: stone/paths in row 0, cols 12-15
			var stone_options = [12, 13, 14, 15]
			return stone_options[randi() % stone_options.size()]

		"rocky":
			# Same as stone for now
			var rocky_options = [12, 13, 14, 15]
			return rocky_options[randi() % rocky_options.size()]

		"sand":
			# Use water tiles for sand (similar appearance)
			var sand_options = [4, 5, 6, 7]
			return sand_options[randi() % sand_options.size()]

		_:
			return 0  # Default to grass (frame 0)

func _generate_sample_tilemap() -> Dictionary:
	"""Generate a detailed sample tilemap with grass, trees, water, and structures"""
	var tilemap = {}
	var width = 48
	var height = 48

	# Fill with grass base layer
	for x in range(width):
		for y in range(height):
			var key = "%d,%d" % [x, y]
			tilemap[key] = {
				"floor": "grass",
				"above_floor": null,
				"object": null
			}

	# Add water patches (lakes and rivers for visual interest)
	var water_areas = [
		{"x": 10, "y": 10, "size": 4},  # Lake 1
		{"x": 35, "y": 35, "size": 3},  # Lake 2
		{"x": 20, "y": 5, "size": 2}    # Pond
	]

	for area in water_areas:
		for dx in range(-area["size"], area["size"] + 1):
			for dy in range(-area["size"], area["size"] + 1):
				var x = area["x"] + dx
				var y = area["y"] + dy
				if x >= 0 and x < width and y >= 0 and y < height:
					var key = "%d,%d" % [x, y]
					tilemap[key]["floor"] = "water"

	# Add forest areas with clusters of trees
	var forest_areas = [
		{"cx": 8, "cy": 8, "radius": 6},
		{"cx": 40, "cy": 40, "radius": 5},
		{"cx": 30, "cy": 12, "radius": 4}
	]

	for forest in forest_areas:
		for x in range(forest["cx"] - forest["radius"], forest["cx"] + forest["radius"]):
			for y in range(forest["cy"] - forest["radius"], forest["cy"] + forest["radius"]):
				if x >= 0 and x < width and y >= 0 and y < height:
					var dist = Vector2(x - forest["cx"], y - forest["cy"]).length()
					if dist < forest["radius"] and randf() > 0.3:  # 70% chance of tree in forest
						var key = "%d,%d" % [x, y]
						# Don't place trees near player spawn
						if not (abs(x - 5) < 5 and abs(y - 5) < 5):
							tilemap[key]["object"] = "tree"

	# Add scattered trees outside forests
	for i in range(20):
		var x = randi() % width
		var y = randi() % height
		var key = "%d,%d" % [x, y]
		if tilemap[key].get("object") == null and tilemap[key].get("floor") != "water":
			# 60% chance to add scattered tree
			if randf() > 0.4:
				tilemap[key]["object"] = "tree"

	# Add stone paths/roads
	# Horizontal path
	for x in range(0, width):
		var y = 20
		var key = "%d,%d" % [x, y]
		if tilemap[key].get("object") == null:
			tilemap[key]["above_floor"] = "stone"

	# Vertical path
	for y in range(0, height):
		var x = 24
		var key = "%d,%d" % [x, y]
		if tilemap[key].get("object") == null:
			tilemap[key]["above_floor"] = "stone"

	# Add rocky areas
	for i in range(12):
		var cx = randi() % width
		var cy = randi() % height
		for dx in range(-2, 3):
			for dy in range(-2, 3):
				var x = cx + dx
				var y = cy + dy
				if x >= 0 and x < width and y >= 0 and y < height:
					var key = "%d,%d" % [x, y]
					if tilemap[key].get("object") == null and randf() > 0.5:
						tilemap[key]["above_floor"] = "rocky"

	print("[GameplayDemo] Generated enhanced tilemap with %d tiles" % tilemap.size())
	return tilemap

func _on_zoom_requested(delta: float) -> void:
	"""Handle camera zoom with scroll wheel"""
	if not viewport_camera:
		return

	# Calculate new zoom level (zoom is a Vector2, we use x component)
	var current_zoom = viewport_camera.zoom.x
	var new_zoom = current_zoom + (delta * camera_zoom_speed)

	# Clamp between min and max
	new_zoom = clamp(new_zoom, camera_zoom_min, camera_zoom_max)

	# Apply INSTANTLY for responsiveness (no tween delay)
	viewport_camera.zoom = Vector2(new_zoom, new_zoom)

	print("[GameplayDemo] Camera zoom: %.2f" % new_zoom)
