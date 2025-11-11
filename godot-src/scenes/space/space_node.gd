extends Node2D
## Space background and tile rendering

var space_data: Dictionary = {}
var tilemap_node: TileMap

func _ready() -> void:
	# Create TileMap node
	tilemap_node = TileMap.new()
	add_child(tilemap_node)

	# Load space
	SpaceManager.space_loaded.connect(_on_space_loaded)
	space_data = SpaceManager.get_current_space()
	if not space_data.is_empty():
		_on_space_loaded(space_data.get("id", ""))

	# Connect theme changes to update colors
	ThemeManager.theme_changed.connect(_on_theme_changed)

	print("[SpaceNode] Ready")

func _on_space_loaded(space_id: String) -> void:
	space_data = SpaceManager.get_current_space()
	print("[SpaceNode] Space loaded: %s" % space_id)

func _on_theme_changed(new_theme: String) -> void:
	print("[SpaceNode] Theme changed, will update tile colors")
