extends Node2D
## Player agent controller - handles player movement and interactions

var player_agent_id: String = "player_0"
var position_grid: Vector2i = Vector2i(5, 5)
var pixel_position: Vector2 = Vector2.ZERO
var is_moving: bool = false
var movement_speed: float = 200.0  # pixels per second

var sprite: Sprite2D
var name_label: Label
var health: int = 100
var is_player: bool = true

signal player_moved(grid_pos: Vector2i)
signal player_interacted(target_id: String)
signal player_took_damage(amount: int)

func _ready() -> void:
	# Create player sprite
	sprite = Sprite2D.new()
	sprite.centered = true
	var texture = load("res://assets/sprites/characters/Character_001.png")
	sprite.texture = texture
	# Don't tint the sprite, use original colors
	sprite.self_modulate = Color.WHITE
	sprite.scale = Vector2(2.0, 2.0)  # Large visible sprite
	add_child(sprite)

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

func _process(delta: float) -> void:
	# Smooth camera follow
	if is_node_ready():
		get_parent().global_position = get_parent().global_position.lerp(global_position, 0.2)

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

	position_grid = new_grid_pos
	var target_pixel = Vector2(position_grid * GameConfig.TILE_SIZE)

	# Animate movement
	is_moving = true
	var tween = create_tween()
	tween.set_trans(Tween.TRANS_LINEAR)
	tween.set_ease(Tween.EASE_IN_OUT)
	tween.tween_property(self, "pixel_position", target_pixel, 0.3)
	tween.tween_callback(func(): is_moving = false)

	# Update network
	SyncManager.queue_position_update(player_agent_id, position_grid, "move")
	player_moved.emit(position_grid)

	print("[PlayerController] Moved to %s" % position_grid)

func update_position(grid_pos: Vector2i) -> void:
	position_grid = grid_pos
	pixel_position = position_grid * GameConfig.TILE_SIZE
	global_position = pixel_position

func take_damage(amount: int) -> void:
	health -= amount
	health = max(0, health)
	player_took_damage.emit(amount)

	# Visual feedback
	modulate = Color.RED
	await get_tree().create_timer(0.2).timeout
	modulate = Color.WHITE

	print("[PlayerController] Took %d damage. Health: %d" % [amount, health])

func _on_interaction_requested() -> void:
	# Find nearest agent and interact
	var nearest_agent_id = ""
	var nearest_distance = INF

	# This would need access to AgentRegistry
	print("[PlayerController] Interaction requested at %s" % position_grid)
	player_interacted.emit(nearest_agent_id)
