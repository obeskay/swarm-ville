extends Area2D
## Agent sprite and proximity circle

signal selected(agent_id: String)
signal clicked(agent_id: String)

var agent_id: String = ""
var agent_data: Dictionary = {}
var grid_position: Vector2i = Vector2i.ZERO
var pixel_position: Vector2 = Vector2.ZERO

var sprite: Sprite2D
var name_label: Label
var proximity_circle: CanvasItem
var collision_shape: CollisionShape2D

func _ready() -> void:
	# Create sprite
	sprite = Sprite2D.new()
	sprite.centered = true
	sprite.offset.y = -GameConfig.CHARACTER_SPRITE_SIZE / 4
	add_child(sprite)

	# Create label
	name_label = Label.new()
	name_label.add_theme_font_size_override("font_size", GameConfig.CHARACTER_NAME_TEXT_FONT_SIZE)
	name_label.position.y = GameConfig.CHARACTER_NAME_TEXT_OFFSET_Y
	add_child(name_label)

	# Create proximity circle
	proximity_circle = Node.new()
	proximity_circle = load("res://scripts/utils/circle_2d.gd").new()
	proximity_circle.radius = GameConfig.PROXIMITY_CIRCLE_RADIUS * GameConfig.TILE_SIZE
	proximity_circle.visible = false
	add_child(proximity_circle)

	# Create collision shape for mouse interaction
	collision_shape = CollisionShape2D.new()
	var circle_shape = CircleShape2D.new()
	circle_shape.radius = GameConfig.TILE_SIZE / 2.0
	collision_shape.shape = circle_shape
	add_child(collision_shape)

	# Connect theme changes
	ThemeManager.theme_changed.connect(_on_theme_changed)

	# Connect Area2D signals
	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)
	input_event.connect(_on_input_event)

func setup(data: Dictionary) -> void:
	agent_data = data.duplicate()
	agent_id = data.get("id", "")
	grid_position = Vector2i(data.get("position", {}).get("x", 0), data.get("position", {}).get("y", 0))
	pixel_position = grid_position * GameConfig.TILE_SIZE

	# Update label
	name_label.text = data.get("name", "Unknown")

	# Set position
	position = pixel_position

	# Load sprite (placeholder)
	# In real implementation, load from character spritesheets
	sprite.modulate = ThemeManager.get_color("agent_friendly")

	print("[AgentNode] Setup: %s at %s" % [agent_id, grid_position])

func set_tint(color: Color) -> void:
	if sprite:
		sprite.self_modulate = color

func set_position_animated(target_grid: Vector2i, duration: float = 0.3) -> void:
	var target_pixel = target_grid * GameConfig.TILE_SIZE
	var tween = create_tween()
	tween.set_trans(Tween.TRANS_LINEAR)
	tween.tween_property(self, "position", target_pixel, duration)
	grid_position = target_grid
	pixel_position = target_pixel

func _on_mouse_entered() -> void:
	proximity_circle.visible = true
	proximity_circle.color = ThemeManager.get_color("selection")
	proximity_circle.color.a = 0.5
	selected.emit(agent_id)

func _on_mouse_exited() -> void:
	proximity_circle.visible = false

func _on_input_event(_viewport: Node, event: InputEvent, _shape_idx: int) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		clicked.emit(agent_id)

func _on_theme_changed(new_theme: String) -> void:
	# Update colors on theme change
	sprite.self_modulate = ThemeManager.get_color("agent_friendly")
	if proximity_circle.visible:
		proximity_circle.color = ThemeManager.get_color("selection")
