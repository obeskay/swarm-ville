extends Node2D
## Complete gameplay demo scene with all features

var viewport_camera: Camera2D
var player_controller: Node2D
var agent_spawner_timer: float = 0.0
var agents_on_screen: Dictionary = {}
var tilemap_layer: TileMap
var tileset_texture: Texture2D
var character_textures: Array = []

func _ready() -> void:
	# Get existing nodes from scene
	viewport_camera = $Camera2D
	player_controller = $PlayerController

	# Setup camera
	viewport_camera.zoom = Vector2(1.0, 1.0)
	viewport_camera.limit_left = 0
	viewport_camera.limit_top = 0
	viewport_camera.make_current()

	# Load tileset texture for background
	_setup_tileset()

	# Draw grid background
	_draw_grid()

	# Connect signals
	GameState.game_started.connect(_on_game_started)
	GameState.score_changed.connect(_on_score_changed)

	# Setup input for demo
	InputManager.agent_creation_requested.connect(_on_spawn_agent_demo)

	# Load all character spritesheet textures (cache them)
	_load_character_textures()

	# Start game
	GameState.start_game()
	set_process(true)

	print("[GameplayDemo] Ready! Press SPACE to spawn enemies, WASD to move")

func _process(delta: float) -> void:
	# Update camera to follow player
	if player_controller:
		viewport_camera.global_position = viewport_camera.global_position.lerp(player_controller.global_position, 0.15)

	# Spawn enemies periodically (if room)
	if GameState.is_playing and agents_on_screen.size() < GameState.game_config.max_agents:
		agent_spawner_timer += delta
		if agent_spawner_timer > (1.0 / GameState.game_config.spawn_rate):
			_spawn_ai_agent()
			agent_spawner_timer = 0.0

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
