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

# Simplified movement - no queue complexity
var frame_size: Vector2i = Vector2i(48, 48)

var sprite: Sprite2D
var name_label: Label
var health: int = 100
var is_player: bool = true
var gameplay_scene: Node2D = null  # Reference to gameplay scene for collision checks

signal player_moved(grid_pos: Vector2i)
signal player_interacted(target_id: String)
signal player_took_damage(amount: int)

func _ready() -> void:
	# Create player sprite with animation support
	sprite = Sprite2D.new()
	sprite.centered = true
	base_texture = load("res://assets/sprites/characters/Character_001.png")
	sprite.texture = base_texture
	sprite.self_modulate = Color.WHITE
	sprite.scale = Vector2(2.0, 2.0)
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	sprite.region_enabled = true  # Enable region cropping
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
		return  # Ignore input durante movimiento

	# Solo 4 direcciones, no diagonales
	var grid_dir = Vector2i.ZERO

	# Priorizar vertical sobre horizontal
	if abs(direction.y) > abs(direction.x):
		if direction.y > 0:
			grid_dir = Vector2i(0, 1)
			current_direction = "down"
		else:
			grid_dir = Vector2i(0, -1)
			current_direction = "up"
	else:
		if direction.x > 0:
			grid_dir = Vector2i(1, 0)
			current_direction = "right"
		else:
			grid_dir = Vector2i(-1, 0)
			current_direction = "left"

	if grid_dir != Vector2i.ZERO:
		move_to(position_grid + grid_dir)

func move_to(new_grid_pos: Vector2i) -> void:
	# Validate position (simple bounds check)
	if new_grid_pos.x < 0 or new_grid_pos.y < 0:
		return
	if new_grid_pos.x > 48 or new_grid_pos.y > 48:
		return

	# Check collision with blocked tiles (walls, furniture)
	if gameplay_scene and gameplay_scene.has_method("is_tile_blocked"):
		if gameplay_scene.is_tile_blocked(new_grid_pos):
			print("[PlayerController] Blocked by wall/object at (%d, %d)" % [new_grid_pos.x, new_grid_pos.y])
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
	# Wait for tween to finish
	await tween.finished

	# Update network
	SyncManager.queue_position_update(player_agent_id, position_grid, "move")
	player_moved.emit(position_grid)

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

	# Dirección a row (192x192 spritesheet, 4x4 grid de 48x48)
	var row = 0
	match current_direction:
		"down": row = 0
		"left": row = 1
		"right": row = 2
		"up": row = 3

	# Simple region_rect - NO usar AtlasTexture
	sprite.region_rect = Rect2(
		animation_frame * frame_size.x,
		row * frame_size.y,
		frame_size.x,
		frame_size.y
	)

func _on_interaction_requested() -> void:
	# Find nearest agent and interact
	var nearest_agent_id = ""
	var _nearest_distance = INF

	# This would need access to AgentRegistry
	print("[PlayerController] Interaction requested at %s" % position_grid)
	player_interacted.emit(nearest_agent_id)
