extends Node2D
## Visual indicator for proximity-based collaboration

@export var ring_color: Color = Color(0.3, 0.7, 1.0, 0.4)  # Blue by default
@export var ring_radius: float = 96.0  # 3 tiles * 32 pixels
@export var pulse_speed: float = 2.0
@export var line_width: float = 2.0

var is_active: bool = false
var pulse_time: float = 0.0
var target_entity: Node2D = null
var zone_type: String = ""

func _ready() -> void:
	z_index = -1  # Draw below characters
	set_process(false)

func activate(entity: Node2D, zone: String = "") -> void:
	"""Activate ring for specific entity"""
	target_entity = entity
	zone_type = zone
	is_active = true
	pulse_time = 0.0

	# Set color based on zone type
	match zone_type:
		"meeting":
			ring_color = Color(0.3, 0.7, 1.0, 0.4)  # Blue
		"private", "focus":
			ring_color = Color(1.0, 0.8, 0.2, 0.4)  # Yellow
		"lounge", "kitchen":
			ring_color = Color(0.4, 1.0, 0.4, 0.4)  # Green
		_:
			ring_color = Color(0.3, 0.7, 1.0, 0.4)  # Default blue

	set_process(true)
	queue_redraw()

func deactivate() -> void:
	"""Deactivate ring"""
	is_active = false
	set_process(false)
	queue_redraw()

func _process(delta: float) -> void:
	if not is_active:
		return

	# Follow target entity
	if target_entity:
		global_position = target_entity.global_position

	# Pulse animation
	pulse_time += delta * pulse_speed
	queue_redraw()

func _draw() -> void:
	if not is_active:
		return

	# Pulsing alpha effect
	var pulse_alpha = 0.3 + 0.2 * sin(pulse_time * TAU)
	var current_color = ring_color
	current_color.a = pulse_alpha

	# Draw outer ring
	draw_arc(Vector2.ZERO, ring_radius, 0, TAU, 64, current_color, line_width)

	# Draw inner filled circle (subtle)
	var inner_color = current_color
	inner_color.a = pulse_alpha * 0.1
	draw_circle(Vector2.ZERO, ring_radius, inner_color)

func pulse_message() -> void:
	"""Trigger pulse effect when message sent"""
	var tween = create_tween()
	tween.set_parallel(true)

	# Quick pulse out and back
	tween.tween_property(self, "ring_radius", ring_radius * 1.2, 0.2)
	tween.chain().tween_property(self, "ring_radius", 96.0, 0.3)
