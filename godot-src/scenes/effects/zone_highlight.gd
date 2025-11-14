extends Node2D
## Visual highlight for office zones

@export var zone_bounds: Rect2i = Rect2i(0, 0, 10, 10)
@export var zone_color: Color = Color(0.3, 0.7, 1.0, 0.15)
@export var border_color: Color = Color(0.3, 0.7, 1.0, 0.3)
@export var border_width: float = 2.0
@export var tile_size: int = 32

var is_visible: bool = true
var zone_name: String = ""
var zone_type: String = ""

func _ready() -> void:
	z_index = -2  # Draw below everything
	queue_redraw()

func setup(zone_data: Dictionary) -> void:
	"""Setup zone from map data"""
	zone_name = zone_data.get("name", "Unknown Zone")
	zone_type = zone_data.get("zone_type", "")

	var bounds = zone_data.get("bounds", {})
	zone_bounds = Rect2i(
		bounds.get("x", 0),
		bounds.get("y", 0),
		bounds.get("w", 10),
		bounds.get("h", 10)
	)

	# Set color based on zone type
	match zone_type:
		"reception":
			zone_color = Color(0.7, 0.3, 1.0, 0.1)  # Purple
			border_color = Color(0.7, 0.3, 1.0, 0.25)
		"meeting":
			zone_color = Color(0.3, 0.7, 1.0, 0.15)  # Blue
			border_color = Color(0.3, 0.7, 1.0, 0.3)
		"desk":
			zone_color = Color(0.3, 1.0, 0.5, 0.1)  # Green
			border_color = Color(0.3, 1.0, 0.5, 0.25)
		"lounge":
			zone_color = Color(1.0, 0.7, 0.3, 0.1)  # Orange
			border_color = Color(1.0, 0.7, 0.3, 0.25)
		"kitchen":
			zone_color = Color(1.0, 0.5, 0.5, 0.1)  # Red
			border_color = Color(1.0, 0.5, 0.5, 0.25)
		"focus":
			zone_color = Color(1.0, 0.8, 0.2, 0.15)  # Yellow
			border_color = Color(1.0, 0.8, 0.2, 0.3)
		_:
			zone_color = Color(0.5, 0.5, 0.5, 0.1)  # Gray
			border_color = Color(0.5, 0.5, 0.5, 0.2)

	# Position at zone origin (in world coordinates)
	position = Vector2(zone_bounds.position.x * tile_size, zone_bounds.position.y * tile_size)
	queue_redraw()

func _draw() -> void:
	if not is_visible:
		return

	var size = Vector2(zone_bounds.size.x * tile_size, zone_bounds.size.y * tile_size)
	var rect = Rect2(Vector2.ZERO, size)

	# Draw filled zone
	draw_rect(rect, zone_color)

	# Draw border
	draw_rect(rect, border_color, false, border_width)

	# Draw zone label (top-left corner)
	if zone_name != "":
		var font = ThemeDB.fallback_font
		var font_size = 12
		draw_string(font, Vector2(4, 14), zone_name, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, Color(1, 1, 1, 0.7))

func set_visible_state(visible: bool) -> void:
	"""Toggle zone visibility"""
	is_visible = visible
	queue_redraw()
