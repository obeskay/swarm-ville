extends CanvasItem
## Selection ring effect - pulsing ring around selected agent

var ring_radius: float = 40.0
var ring_color: Color
var ring_width: float = 2.0
var pulse_speed: float = 1.0
var pulse_amount: float = 1.2

var time_elapsed: float = 0.0

func _ready() -> void:
	ring_color = ThemeManager.get_color("selection")
	ThemeManager.theme_changed.connect(_on_theme_changed)
	set_process(true)

func _draw() -> void:
	var pulse = 1.0 + sin(time_elapsed * PI * 2.0 * pulse_speed) * 0.3
	var current_radius = ring_radius * pulse
	draw_circle(Vector2.ZERO, current_radius, Color(ring_color, 0.8))

	# Draw outline
	draw_circle(Vector2.ZERO, current_radius, Color.TRANSPARENT)

func _process(delta: float) -> void:
	time_elapsed += delta
	queue_redraw()

func _on_theme_changed(_new_theme: String) -> void:
	ring_color = ThemeManager.get_color("selection")
	queue_redraw()
