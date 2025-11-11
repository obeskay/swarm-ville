extends Node2D
## Player agent controller - handles player movement and interactions with directional animation

var player_agent_id: String = "player_0"
var position_grid: Vector2i = Vector2i(5, 5)
var pixel_position: Vector2 = Vector2.ZERO
var is_moving: bool = false
var movement_speed: float = 200.0  # pixels per second

# Animation properties
var current_direction: String = "down"
var animation_frame: int = 0
var animation_timer: float = 0.0
var animation_speed: float = 0.15  # seconds per frame
var base_texture: Texture2D = null

var sprite: Sprite2D
var name_label: Label
var health: int = 100
var is_player: bool = true

signal player_moved(grid_pos: Vector2i)
signal player_interacted(target_id: String)
signal player_took_damage(amount: int)

func _ready() -> void:
	# Create player sprite with animation support
	sprite = Sprite2D.new()
	sprite.centered = true
	base_texture = load("res://assets/sprites/characters/Character_001.png")
	# Don't tint the sprite, use original colors
	sprite.self_modulate = Color.WHITE
	sprite.scale = Vector2(2.0, 2.0)  # Large visible sprite
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST  # Pixel perfect rendering
	add_child(sprite)

	# Initialize animation
	_update_animation_frame()

	# Create label
	name_label = Label.new()
	name_label.add_theme_font_size_override("font_size", 12)
	name_label.text = "YOU"
	name_label.position.y = -GameConfig.TILE_SIZE
	add_child(name_label)

	# Setup physics area
	var area = Area2D.new()
	var shape = CircleShape2D.new()
	shape.radius = GameConfig.TILE_SIZE * 0.4
	var collision = CollisionShape2D.new()
	collision.shape = shape
	area.add_child(collision)
	add_child(area)

	# Set initial position
	update_position(position_grid)

	# Connect input
	InputManager.wasd_pressed.connect(_on_wasd_input)
	InputManager.agent_interaction_requested.connect(_on_interaction_requested)

	print("[PlayerController] Ready at %s" % position_grid)

func _process(_delta: float) -> void:
	# Keep global position in sync
	pass

func _physics_process(delta: float) -> void:
	# Update animation frames during movement
	if is_moving:
		animation_timer += delta
		if animation_timer >= animation_speed:
			animation_timer = 0.0
			animation_frame = (animation_frame + 1) % 4  # 4 frames of walk animation
			_update_animation_frame()

func _on_wasd_input(direction: Vector2) -> void:
	if is_moving:
		return

	# Convert direction to grid movement
	var grid_direction = Vector2i.ZERO
	if direction.x > 0.5:
		grid_direction.x = 1
	elif direction.x < -0.5:
		grid_direction.x = -1

	if direction.y > 0.5:
		grid_direction.y = 1
	elif direction.y < -0.5:
		grid_direction.y = -1

	if grid_direction != Vector2i.ZERO:
		print("[PlayerController] Input received: %s, moving to %s" % [direction, position_grid + grid_direction])
		move_to(position_grid + grid_direction)

func move_to(new_grid_pos: Vector2i) -> void:
	# Validate position (simple bounds check)
	if new_grid_pos.x < 0 or new_grid_pos.y < 0:
		return
	if new_grid_pos.x > 48 or new_grid_pos.y > 48:
		return

	# Determine direction
	var diff = new_grid_pos - position_grid
	if diff.x > 0:
		current_direction = "right"
	elif diff.x < 0:
		current_direction = "left"
	elif diff.y > 0:
		current_direction = "down"
	elif diff.y < 0:
		current_direction = "up"

	position_grid = new_grid_pos
	var target_pixel = Vector2(position_grid * GameConfig.TILE_SIZE)

	# Start animation
	is_moving = true
	animation_timer = 0.0
	animation_frame = 0

	# Animate movement
	var tween = create_tween()
	tween.set_trans(Tween.TRANS_LINEAR)
	tween.set_ease(Tween.EASE_IN_OUT)
	tween.tween_property(self, "global_position", target_pixel, 0.3)
	tween.tween_callback(func():
		is_moving = false
		animation_frame = 0
		_update_animation_frame()
		update_position(position_grid)
	)

	# Update network
	SyncManager.queue_position_update(player_agent_id, position_grid, "move")
	player_moved.emit(position_grid)

	print("[PlayerController] Moved to %s" % position_grid)

func update_position(grid_pos: Vector2i) -> void:
	position_grid = grid_pos
	pixel_position = Vector2(grid_pos * GameConfig.TILE_SIZE)
	global_position = pixel_position

	# Ensure sprite is visible and at correct position
	if sprite:
		sprite.global_position = global_position

	print("[PlayerController] Moved to %s" % position_grid)

func take_damage(amount: int) -> void:
	health -= amount
	health = max(0, health)
	player_took_damage.emit(amount)

	# Visual feedback
	modulate = Color.RED
	await get_tree().create_timer(0.2).timeout
	modulate = Color.WHITE

	print("[PlayerController] Took %d damage. Health: %d" % [amount, health])

func _update_animation_frame() -> void:
	if not sprite or not base_texture:
		return

	# Map direction to row in spritesheet (assuming 4x4 grid)
	# Row 0: right, Row 1: left, Row 2: down, Row 3: up
	var direction_row = 2  # default down
	match current_direction:
		"right":
			direction_row = 0
		"left":
			direction_row = 1
		"down":
			direction_row = 2
		"up":
			direction_row = 3



	# Create AtlasTexture to crop 48x48 from 192x192 spritesheet
	var atlas = AtlasTexture.new()
	atlas.atlas = base_texture
	atlas.region = Rect2(animation_frame * 48, direction_row * 48, 48, 48)
	atlas.filter_clip = true
	sprite.texture = atlas

func _on_interaction_requested() -> void:
	# Find nearest agent and interact
	var nearest_agent_id = ""
	var _nearest_distance = INF

	# This would need access to AgentRegistry
	print("[PlayerController] Interaction requested at %s" % position_grid)
	player_interacted.emit(nearest_agent_id)
