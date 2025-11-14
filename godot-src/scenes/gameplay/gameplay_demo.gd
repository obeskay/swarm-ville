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
var blocked_tiles: Dictionary = {}  # Dictionary of blocked tile positions (for collisions)
var camera_zoom_min: float = 0.5
var camera_zoom_max: float = 3.0
var camera_zoom_speed: float = 0.1

# Visual collaboration indicators
var collaboration_rings: Dictionary = {}  # user_id -> CollaborationRing node
var zone_highlights: Array[Node2D] = []
var effects_layer: Node2D

# UI
var game_hud: CanvasLayer = null

# Agent system
var agent_avatars: Dictionary = {}  # agent_id -> AgentAvatar node
var proximity_system: ProximitySystem = null

func _ready() -> void:
	# Get existing nodes from scene
	viewport_camera = $Camera2D
	player_controller = $PlayerController

	# Connect player controller to this scene for collision checks
	player_controller.gameplay_scene = self

	# Setup game HUD
	_setup_game_hud()

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

	# Setup effects layer for collaboration rings and zone highlights
	effects_layer = Node2D.new()
	effects_layer.name = "EffectsLayer"
	effects_layer.z_index = 10  # Above characters
	add_child(effects_layer)

	# Draw grid background
	_draw_grid()

	# Connect signals
	GameState.game_started.connect(_on_game_started)
	GameState.score_changed.connect(_on_score_changed)
	WebSocketClient.space_loaded.connect(_on_space_loaded_from_server)

	# Setup input for demo
	InputManager.agent_creation_requested.connect(_on_spawn_agent_demo)
	InputManager.zoom_requested.connect(_on_zoom_requested)

	# Connect agent coordinator
	AgentCoordinator.agent_task_completed.connect(_on_agent_task_completed)
	AgentCoordinator.swarm_initialized.connect(_on_swarm_initialized)

	# Connect collaboration system
	CollaborationManager.user_entered_space.connect(_on_user_entered)
	CollaborationManager.user_left_space.connect(_on_user_left)
	CollaborationManager.proximity_chat_received.connect(_on_proximity_chat)
	CollaborationManager.proximity_group_formed.connect(_on_proximity_group_formed)
	CollaborationManager.proximity_group_disbanded.connect(_on_proximity_group_disbanded)
	CollaborationManager.zone_entered.connect(_on_zone_entered)
	CollaborationManager.zone_exited.connect(_on_zone_exited)

	# Load all character spritesheet textures (cache them)
	_load_character_textures()

	# Start game
	GameState.start_game()
	set_process(true)

	# Initialize shared space for collaboration
	SharedSpaceManager.create_space("Main Space", 48, 48)

	# Setup agent system
	_setup_agent_system()
	SharedSpaceManager.add_spawn_point(Vector2i(5, 5), "Main Spawn")

	# Setup chat input panel
	var chat_input = preload("res://scenes/ui/chat_input_panel.tscn").instantiate()
	add_child(chat_input)
	chat_input.message_sent.connect(_on_chat_message_sent)

	# Load office map with zones
	var office_map_path = "res://office_demo_generated.json"
	var map_file = FileAccess.open(office_map_path, FileAccess.READ)

	var space_data = null
	if map_file:
		var json_text = map_file.get_as_text()
		space_data = JSON.parse_string(json_text)
		map_file.close()

		if space_data:
			print("[GameplayDemo] ✅ Loaded office map: %d zones, %d tiles" % [space_data["zones"].size(), space_data["tilemap"].size()])

			# Load zones into CollaborationManager
			CollaborationManager.load_zones_from_map(space_data)

			# Create zone highlights
			create_zone_highlights(space_data)

			# Render tilemap
			_render_tilemap(space_data)
		else:
			print("[GameplayDemo] ⚠️ Failed to parse office map JSON, using fallback")
			space_data = {"tilemap": _generate_sample_tilemap()}
			_render_tilemap(space_data)
	else:
		print("[GameplayDemo] ⚠️ Office map not found, using fallback tilemap")
		space_data = {"tilemap": _generate_sample_tilemap()}
		_render_tilemap(space_data)

	print("[GameplayDemo] Ready!")
	print("[GameplayDemo] SPACE: Add collaborative users | WASD: Move")
	print("[GameplayDemo] System: Gather-clone collaboration with webhooks + zones")

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

func _setup_game_hud() -> void:
	"""Setup game HUD overlay"""
	var GameHUDScript = load("res://scenes/ui/game_hud.gd")
	game_hud = GameHUDScript.new()
	add_child(game_hud)
	game_hud.set_player_controller(player_controller)
	print("[GameplayDemo] Game HUD initialized")

func _setup_agent_system() -> void:
	"""Setup agent system with proximity detection and demo agents"""
	# Create proximity system
	proximity_system = ProximitySystem.new()
	proximity_system.proximity_radius = 4.0  # 4 tiles
	add_child(proximity_system)
	print("[GameplayDemo] Proximity system initialized")

	# Register player controller for proximity
	if player_controller:
		proximity_system.register_entity("player_0", player_controller, "player")

	# Create demo agents
	AgentRegistry.create_demo_agents()

	# Spawn agent avatars
	for agent_state in AgentRegistry.get_all_agents():
		_spawn_agent_avatar(agent_state)

	print("[GameplayDemo] Agent system setup complete with %d agents" % AgentRegistry.get_agent_count())

func _spawn_agent_avatar(agent_state: AgentState) -> void:
	"""Spawn visual avatar for an agent"""
	# Create avatar node
	var avatar = Node2D.new()
	avatar.name = "Agent_" + agent_state.config.id

	# Create sprite
	var sprite = Sprite2D.new()
	sprite.name = "Sprite2D"
	var texture = load("res://assets/sprites/characters/Character_002.png")
	if texture:
		sprite.texture = texture
		sprite.region_enabled = true
		sprite.region_rect = Rect2(0, 0, 48, 48)
		sprite.scale = Vector2(2.0, 2.0)
		sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		sprite.centered = true
	avatar.add_child(sprite)

	# Create name label
	var name_label = Label.new()
	name_label.name = "NameLabel"
	name_label.text = agent_state.config.name
	name_label.position.y = -80
	name_label.add_theme_font_size_override("font_size", 14)
	name_label.add_theme_color_override("font_color", Color(1.0, 1.0, 1.0))
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	avatar.add_child(name_label)

	# Create status label
	var status_label = Label.new()
	status_label.name = "StatusLabel"
	status_label.text = agent_state.get_status_text()
	status_label.position.y = -95
	status_label.add_theme_font_size_override("font_size", 11)
	status_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
	status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	avatar.add_child(status_label)

	# Set position
	avatar.global_position = agent_state.position

	# Add to scene
	add_child(avatar)
	agent_avatars[agent_state.config.id] = avatar

	# Register with proximity system
	if proximity_system:
		proximity_system.register_entity(agent_state.config.id, avatar, "agent")

	print("[GameplayDemo] Spawned agent avatar: %s at %s" % [agent_state.config.name, agent_state.position])

func _draw_grid() -> void:
	queue_redraw()

func _on_game_started() -> void:
	print("[GameplayDemo] Game started!")

func _on_score_changed(new_score: int) -> void:
	print("[GameplayDemo] Score: %d" % new_score)

func _on_spawn_agent_demo() -> void:
	# Disable agent spawning completely (Claude CLI not configured yet)
	print("[GameplayDemo] ⚠️ Agent spawning disabled - Claude CLI integration pending")
	print("[GameplayDemo] SPACE key will be enabled after Claude CLI setup is complete")
	return

	# TODO: Re-enable after Claude CLI integration
	# if agents_on_screen.size() >= 20:
	# 	print("[GameplayDemo] Max collaborative users reached (20)")
	# 	return
	#
	# # Spawn collaborative user near player
	# var offset = Vector2(randf_range(-3, 3) * GameConfig.TILE_SIZE, randf_range(-3, 3) * GameConfig.TILE_SIZE)
	# var spawn_pos = player_controller.global_position + offset
	#
	# # Clamp to grid
	# spawn_pos.x = clamp(spawn_pos.x, 0, 48 * GameConfig.TILE_SIZE)
	# spawn_pos.y = clamp(spawn_pos.y, 0, 48 * GameConfig.TILE_SIZE)
	#
	# _spawn_collaborative_user(spawn_pos)

func _spawn_collaborative_user(world_pos: Vector2) -> void:
	"""Spawn a collaborative user avatar (NPC or networked user)"""
	var grid_pos = Vector2i(int(world_pos.x / GameConfig.TILE_SIZE), int(world_pos.y / GameConfig.TILE_SIZE))
	var user_id = "user_%d" % randi()
	var user_name = ["Alex", "Jamie", "Sam", "Taylor", "Casey", "Morgan"][randi() % 6]

	# Add to collaboration system
	CollaborationManager.user_join(user_id, user_name, grid_pos)

	# Create visual avatar
	var avatar_sprite = Sprite2D.new()
	avatar_sprite.centered = true
	avatar_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST  # Pixel-perfect rendering

	# Use character textures for diverse avatars
	if character_textures.size() > 0:
		var sprite_texture = character_textures[randi() % character_textures.size()]
		# Character textures are typically full-body sprites, use them directly without atlas
		avatar_sprite.texture = sprite_texture
	else:
		# Fallback: create a colored rectangle if no texture available
		print("[GameplayDemo] WARNING: No character textures loaded, using colored rect")

	# Use unique color for each user
	var user_color = CollaborationManager.active_users[user_id]["color"]
	avatar_sprite.self_modulate = user_color
	avatar_sprite.scale = Vector2(2.0, 2.0)  # Make sprites visible (64px at TILE_SIZE=64)
	avatar_sprite.global_position = world_pos

	# Add name label
	var name_label = Label.new()
	name_label.text = user_name
	name_label.add_theme_font_size_override("font_size", 12)
	name_label.add_theme_color_override("font_color", user_color)
	name_label.position.y = -GameConfig.TILE_SIZE * 0.8
	avatar_sprite.add_child(name_label)

	# Add to scene
	add_child(avatar_sprite)
	agents_on_screen[user_id] = {
		"node": avatar_sprite,
		"user_id": user_id,
		"user_name": user_name,
		"position": grid_pos,
		"color": user_color
	}

	print("[GameplayDemo] User joined: %s at (%d, %d)" % [user_name, grid_pos.x, grid_pos.y])

func _on_player_defeated() -> void:
	GameState.end_game()
	print("[GameplayDemo] Game Over!")

func _on_user_entered(user_id: String, position: Vector2i) -> void:
	"""Called when a user enters the space via CollaborationManager signal"""
	# This is already handled by _spawn_collaborative_user, but we track it here
	print("[GameplayDemo] User entered space at (%d, %d)" % [position.x, position.y])

func _on_user_left(user_id: String) -> void:
	"""Handle when a collaborative user leaves the space"""
	if agents_on_screen.has(user_id):
		var user_node = agents_on_screen[user_id]["node"]
		var user_name = agents_on_screen[user_id]["user_name"]

		# Fade out animation
		var tween = create_tween()
		tween.set_parallel(true)
		tween.tween_property(user_node, "scale", Vector2(1.5, 0), 0.3)
		tween.tween_property(user_node, "modulate:a", 0.0, 0.3)
		tween.tween_callback(func(): user_node.queue_free())

		agents_on_screen.erase(user_id)
		print("[GameplayDemo] User left: %s" % user_name)

func _on_proximity_chat(speaker_id: String, message: String, range: float) -> void:
	"""Handle proximity-based chat messages from nearby users"""
	if agents_on_screen.has(speaker_id):
		var speaker_name = agents_on_screen[speaker_id]["user_name"]
		var agent_node = agents_on_screen[speaker_id]["node"]

		# Spawn chat bubble above the speaker
		_spawn_chat_bubble(agent_node, speaker_name, message)

		print("[GameplayDemo] Proximity chat from %s: %s (range: %.1f)" % [speaker_name, message, range])

func _spawn_chat_bubble(avatar_node: Node2D, speaker_name: String, message: String) -> void:
	"""Spawn a chat bubble above an avatar"""
	var bubble = preload("res://scenes/effects/chat_bubble.tscn").instantiate()

	# Position above the avatar
	bubble.global_position = avatar_node.global_position + Vector2(0, -GameConfig.TILE_SIZE)
	bubble.set_message(message, speaker_name)

	# Add to scene
	add_child(bubble)

func _on_chat_message_sent(text: String) -> void:
	"""Handle chat message from player via input panel"""
	# Get player position
	var player_pos = Vector2i(int(player_controller.global_position.x / GameConfig.TILE_SIZE),
							  int(player_controller.global_position.y / GameConfig.TILE_SIZE))

	# Get player ID (for now, use a fixed ID for the player)
	var player_id = "player_001"

	# Broadcast message to nearby users via CollaborationManager
	CollaborationManager.broadcast_proximity_message(player_id, text)

	print("[GameplayDemo] Player sent chat: %s" % text)

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
	# Load city tileset for office environment
	var tileset_path = "res://assets/sprites/spritesheets/city.png"
	tileset_texture = load(tileset_path)
	if tileset_texture:
		print("[GameplayDemo] Loaded tileset from %s (1024x1536, 32x32 tiles)" % tileset_path)

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

	# Clear blocked tiles
	blocked_tiles.clear()

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

		# Check if tile is walkable (office map uses "walkable" property)
		var is_walkable = tile_data.get("walkable", true)
		if not is_walkable:
			blocked_tiles[key] = true

		# Render floor layer
		if tile_data.get("floor"):
			_place_tile(grid_x, grid_y, world_x, world_y, tile_data.get("floor"), "floor")

		# Render above_floor layer
		if tile_data.get("above_floor"):
			_place_tile(grid_x, grid_y, world_x, world_y, tile_data.get("above_floor"), "above_floor")

		# Render object layer (walls, furniture, etc.)
		if tile_data.get("object"):
			_place_tile(grid_x, grid_y, world_x, world_y, tile_data.get("object"), "object")

	var floor_count = tile_layers["floor"].get_child_count()
	var above_count = tile_layers["above_floor"].get_child_count()
	var object_count = tile_layers["object"].get_child_count()
	print("[GameplayDemo] Rendered tiles - Floor: %d, Above: %d, Object: %d (Total keys: %d)" % [floor_count, above_count, object_count, tilemap_sprites.size()])
	print("[GameplayDemo] Blocked tiles: %d" % blocked_tiles.size())

func is_tile_blocked(grid_pos: Vector2i) -> bool:
	"""Check if a tile position is blocked (impassable)"""
	var key = "%d,%d" % [grid_pos.x, grid_pos.y]
	return blocked_tiles.has(key)

func _place_tile(grid_x: int, grid_y: int, world_x: int, world_y: int, _tile_name: String, layer: String) -> void:
	"""Place a single tile using Sprite2D with tileset texture region"""
	if not tileset_texture:
		return

	# Get frame index from tile name (uses _get_frame_index_for_tile)
	var frame_index = _get_frame_index_for_tile(_tile_name)

	# City spritesheet: 1024x1536 with 32x32 tiles = 32x48 grid
	var tile_size = 32
	var tiles_per_row = 32
	var frame_x = frame_index % tiles_per_row
	var frame_y = frame_index / tiles_per_row

	# Create sprite with region cropping
	var tile_sprite = Sprite2D.new()
	tile_sprite.texture = tileset_texture
	tile_sprite.region_enabled = true
	tile_sprite.region_rect = Rect2(
		frame_x * tile_size,
		frame_y * tile_size,
		tile_size,
		tile_size
	)
	tile_sprite.centered = false
	tile_sprite.position = Vector2(world_x, world_y)
	tile_sprite.scale = Vector2(2.0, 2.0)  # Scale 32x32 to 64x64 to match TILE_SIZE
	tile_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST  # Pixel-perfect

	tile_layers[layer].add_child(tile_sprite)

	var key = "%d,%d" % [grid_x, grid_y]
	if not tilemap_sprites.has(key):
		tilemap_sprites[key] = {}
	tilemap_sprites[key][layer] = tile_sprite

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

func _on_swarm_initialized(swarm_id: String) -> void:
	"""Called when agent swarm is initialized"""
	print("[GameplayDemo] Swarm %s initialized - AI collaboration active" % swarm_id)

func _on_agent_task_completed(agent_id: String, result: Dictionary) -> void:
	"""Called when an AI agent completes a task"""
	print("[GameplayDemo] Agent %s completed: %s" % [agent_id, result.get("task", "unknown")])

# ========================================
# VISUAL COLLABORATION INDICATORS
# ========================================

func _on_proximity_group_formed(group_id: String, users: Array) -> void:
	"""Show collaboration rings when users form a proximity group"""
	print("[GameplayDemo] Proximity group formed: %s with %d users" % [group_id, users.size()])

	# Create collaboration ring for each user in the group
	for user_id in users:
		if agents_on_screen.has(user_id):
			_show_collaboration_ring(user_id)

func _on_proximity_group_disbanded(group_id: String, _users: Array) -> void:
	"""Hide collaboration rings when group disbands"""
	print("[GameplayDemo] Proximity group disbanded: %s" % group_id)

	# Remove all rings (will be recreated if new groups form)
	for user_id in collaboration_rings.keys():
		_hide_collaboration_ring(user_id)

func _show_collaboration_ring(user_id: String) -> void:
	"""Show collaboration ring around a user"""
	if not agents_on_screen.has(user_id):
		return

	# Check if ring already exists
	if collaboration_rings.has(user_id):
		return

	# Load collaboration ring script
	var ring_script = load("res://scenes/effects/collaboration_ring.gd")
	var ring = Node2D.new()
	ring.set_script(ring_script)

	# Get user's current zone for color coding
	var user_zone = CollaborationManager.get_user_zone(user_id)
	var zone_type = user_zone.get("zone_type", "")

	# Add to effects layer
	effects_layer.add_child(ring)

	# Activate ring
	var user_node = agents_on_screen[user_id]["node"]
	ring.activate(user_node, zone_type)

	collaboration_rings[user_id] = ring
	print("[GameplayDemo] Collaboration ring shown for %s (zone: %s)" % [user_id, zone_type])

func _hide_collaboration_ring(user_id: String) -> void:
	"""Hide collaboration ring for a user"""
	if not collaboration_rings.has(user_id):
		return

	var ring = collaboration_rings[user_id]
	ring.deactivate()
	ring.queue_free()
	collaboration_rings.erase(user_id)

func _on_zone_entered(user_id: String, zone_data: Dictionary) -> void:
	"""Visual feedback when user enters a zone"""
	var zone_name = zone_data.get("name", "Unknown Zone")
	var zone_type = zone_data.get("zone_type", "")

	print("[GameplayDemo] Zone entered: %s entered %s (%s)" % [user_id, zone_name, zone_type])

	# Update collaboration ring color if exists
	if collaboration_rings.has(user_id):
		var ring = collaboration_rings[user_id]
		var user_node = agents_on_screen[user_id]["node"]
		ring.activate(user_node, zone_type)  # Re-activate with new zone type

func _on_zone_exited(user_id: String, zone_data: Dictionary) -> void:
	"""Visual feedback when user exits a zone"""
	var zone_name = zone_data.get("name", "Unknown Zone")

	print("[GameplayDemo] Zone exited: %s left %s" % [user_id, zone_name])

	# Reset collaboration ring to default color
	if collaboration_rings.has(user_id):
		var ring = collaboration_rings[user_id]
		var user_node = agents_on_screen[user_id]["node"]
		ring.activate(user_node, "")  # No zone = default color

func create_zone_highlights(map_data: Dictionary) -> void:
	"""Create visual highlights for all zones in the map"""
	if not map_data.has("zones"):
		return

	# Clear existing highlights
	for highlight in zone_highlights:
		highlight.queue_free()
	zone_highlights.clear()

	# Load zone highlight script
	var highlight_script = load("res://scenes/effects/zone_highlight.gd")

	# Create highlight for each zone
	for zone in map_data["zones"]:
		var highlight = Node2D.new()
		highlight.set_script(highlight_script)

		# Add to tilemap layer (below everything)
		tilemap_layer.add_child(highlight)

		# Setup zone data
		highlight.setup(zone)

		zone_highlights.append(highlight)

	print("[GameplayDemo] Created %d zone highlights" % zone_highlights.size())
