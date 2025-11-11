extends CharacterBody2D

class_name Agent

# Agent data
var agent_id: String = ""
var agent_name: String = ""
var is_agent: bool = false

# Movement
var target_position: Vector2 = Vector2.ZERO
var current_position: Vector2 = Vector2.ZERO
var direction: String = "down"
var speed: float = 100.0
var movement_speed: float = 4.0  # pixels per frame at 60fps

# References
var sprite: Sprite2D
var name_label: Label
var animation_player: AnimationPlayer

# Direction vectors
var direction_vectors = {
	"up": Vector2(0, -1),
	"down": Vector2(0, 1),
	"left": Vector2(-1, 0),
	"right": Vector2(1, 0)
}

func _ready() -> void:
	sprite = $Sprite
	name_label = $NameLabel
	animation_player = $AnimationPlayer

	target_position = global_position
	current_position = global_position

	# Create a simple colored circle as placeholder sprite
	_create_placeholder_sprite()

func _process(delta: float) -> void:
	# Move towards target position
	if global_position.distance_to(target_position) > 1.0:
		var direction_to_target = (target_position - global_position).normalized()
		global_position += direction_to_target * movement_speed
	else:
		global_position = target_position

func setup(agent_data: Dictionary) -> void:
	"""Initialize agent with data from server"""
	agent_id = agent_data.get("id", "")
	agent_name = agent_data.get("name", "Unknown")
	is_agent = agent_data.get("is_agent", false)
	direction = agent_data.get("direction", "down")

	# Set position
	var x = agent_data.get("x", 0.0)
	var y = agent_data.get("y", 0.0)
	global_position = Vector2(x, y)
	target_position = global_position
	current_position = global_position

	# Update UI
	name_label.text = agent_name

	print("[Agent] Setup: %s at (%.1f, %.1f)" % [agent_name, x, y])

func move_to(new_position: Vector2, duration: float = 0.5) -> void:
	"""Move agent to new position with animation"""
	target_position = new_position

	# Optional: Use tween for smooth movement
	var tween = create_tween()
	tween.set_trans(Tween.TRANS_LINEAR)
	tween.set_ease(Tween.EASE_IN_OUT)
	tween.tween_property(self, "global_position", new_position, duration)

func set_direction(new_direction: String) -> void:
	"""Update agent direction"""
	direction = new_direction
	# Update sprite orientation based on direction
	_update_sprite_direction()

func set_color(color: Color) -> void:
	"""Set agent sprite color"""
	if sprite and sprite.self_modulate is Color:
		sprite.self_modulate = color

func _create_placeholder_sprite() -> void:
	"""Create a simple colored circle as placeholder"""
	if not sprite:
		return

	# Create a simple circle image
	var image = Image.create(32, 32, false, Image.FORMAT_RGBA8)
	var radius = 16

	# Draw a filled circle
	for x in range(32):
		for y in range(32):
			var dx = x - 16
			var dy = y - 16
			var dist = sqrt(dx * dx + dy * dy)
			if dist < radius:
				image.set_pixel(x, y, Color.CYAN)
			else:
				image.set_pixel(x, y, Color.TRANSPARENT)

	# Create texture from image
	var texture = ImageTexture.create_from_image(image)
	sprite.texture = texture

func _update_sprite_direction() -> void:
	"""Update sprite rotation based on direction"""
	match direction:
		"up":
			sprite.rotation = -PI / 2
		"down":
			sprite.rotation = PI / 2
		"left":
			sprite.rotation = PI
		"right":
			sprite.rotation = 0
