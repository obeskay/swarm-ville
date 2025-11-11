extends Node2D
## Blocked tile indicator (red X)

var lines: Array[Line2D] = []
var duration: float = 0.3

func _ready() -> void:
	var color = ThemeManager.get_color("effect_negative")

	# Create X mark (two diagonal lines)
	var offset = 6.0
	for i in range(2):
		var line = Line2D.new()
		line.color = color
		line.width = 3.0
		if i == 0:
			line.add_point(Vector2(-offset, -offset))
			line.add_point(Vector2(offset, offset))
		else:
			line.add_point(Vector2(offset, -offset))
			line.add_point(Vector2(-offset, offset))
		add_child(line)
		lines.append(line)

	_animate()

func _animate() -> void:
	var tween = create_tween()
	tween.set_parallel(true)

	# Animate scale
	tween.tween_property(self, "scale", Vector2(1.0, 1.0), duration)

	# Animate alpha
	var alpha_tween = create_tween()
	for line in lines:
		alpha_tween.tween_property(line, "color:a", 0.0, duration)

	# Schedule deletion
	await get_tree().create_timer(duration).timeout
	queue_free()
