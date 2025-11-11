extends CanvasItem
## Click ripple visual effect

var outer_radius: float = 10.0
var inner_radius: float = 6.0
var outer_color: Color
var inner_color: Color
var duration: float = 0.6

func _ready() -> void:
	# Get color from theme
	outer_color = ThemeManager.get_color("effect_positive")
	inner_color = ThemeManager.get_color("effect_positive")

	# Animate
	_animate()

func _draw() -> void:
	draw_circle(Vector2.ZERO, outer_radius, outer_color)
	draw_circle(Vector2.ZERO, inner_radius, inner_color)

func _animate() -> void:
	var tween = create_tween()
	tween.set_trans(Tween.TRANS_LINEAR)

	# Outer ring animation (expand radius and fade)
	tween.tween_property(self, "outer_radius", 100.0, duration).set_trans(Tween.TRANS_LINEAR)

	# Inner ring animation (expand radius and fade) - parallel
	var inner_tween = create_tween()
	inner_tween.set_trans(Tween.TRANS_LINEAR)
	inner_tween.tween_property(self, "inner_radius", 80.0, duration)

	# Animate alpha fade - parallel
	var alpha_tween = create_tween()
	alpha_tween.set_trans(Tween.TRANS_LINEAR)
	alpha_tween.tween_property(self, "modulate:a", 0.0, duration)

	# Connect tween callbacks to redraw
	tween.tween_callback(queue_redraw)
	inner_tween.tween_callback(queue_redraw)
	alpha_tween.tween_callback(queue_redraw)

	# Schedule deletion
	await get_tree().create_timer(duration).timeout
	queue_free()
