extends CanvasItem
## Simple Circle2D implementation for Godot 4

var radius: float = 10.0
var color: Color = Color.WHITE

func _draw() -> void:
	draw_circle(Vector2.ZERO, radius, color)

func _on_property_changed() -> void:
	queue_redraw()

func _get_property_list() -> Array:
	var props: Array = []
	props.append({"name": "radius", "type": TYPE_FLOAT})
	props.append({"name": "color", "type": TYPE_COLOR})
	return props
