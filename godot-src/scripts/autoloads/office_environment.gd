extends Node
## Office Environment Tileset & Spritesheet Configuration
## Based on gather-clone spritesheet architecture
## Environment: Modern Office Space

class_name OfficeEnvironment

# Spritesheet metadata
const SPRITESHEET_SIZE = Vector2i(1024, 1024)
const SPRITESHEET_PATH = "res://assets/sprites/spritesheets/office.png"
const TILE_SIZE = 32  # 32x32 pixel tiles

# Layer definitions (same as gather-clone)
enum Layer {
	FLOOR = 0,
	ABOVE_FLOOR = 1,
	OBJECT = 2
}

# Office tile definitions (x, y, width, height, layer, colliders)
class OfficeTile:
	var name: String
	var x: int
	var y: int
	var width: int
	var height: int
	var layer: int
	var colliders: Array = []

	func _init(p_name: String, p_x: int, p_y: int, p_width: int, p_height: int, p_layer: int, p_colliders: Array = []):
		name = p_name
		x = p_x
		y = p_y
		width = p_width
		height = p_height
		layer = p_layer
		colliders = p_colliders

# Floor tiles (light & dark variations)
var floor_tiles = [
	# Light wood floor
	OfficeTile("light_wood_1", 0, 0, 32, 32, Layer.FLOOR),
	OfficeTile("light_wood_2", 32, 0, 32, 32, Layer.FLOOR),
	OfficeTile("light_wood_3", 64, 0, 32, 32, Layer.FLOOR),
	OfficeTile("light_wood_4", 96, 0, 32, 32, Layer.FLOOR),

	# Dark wood floor
	OfficeTile("dark_wood_1", 0, 32, 32, 32, Layer.FLOOR),
	OfficeTile("dark_wood_2", 32, 32, 32, 32, Layer.FLOOR),
	OfficeTile("dark_wood_3", 64, 32, 32, 32, Layer.FLOOR),
	OfficeTile("dark_wood_4", 96, 32, 32, 32, Layer.FLOOR),

	# Tile floor (kitchen/bathrooms)
	OfficeTile("tile_1", 0, 64, 32, 32, Layer.FLOOR),
	OfficeTile("tile_2", 32, 64, 32, 32, Layer.FLOOR),
	OfficeTile("tile_3", 64, 64, 32, 32, Layer.FLOOR),
	OfficeTile("tile_4", 96, 64, 32, 32, Layer.FLOOR),

	# Carpet
	OfficeTile("carpet_1", 0, 96, 32, 32, Layer.FLOOR),
	OfficeTile("carpet_2", 32, 96, 32, 32, Layer.FLOOR),
	OfficeTile("carpet_3", 64, 96, 32, 32, Layer.FLOOR),
	OfficeTile("carpet_4", 96, 96, 32, 32, Layer.FLOOR),
]

# Furniture & fixtures (above floor - can walk over)
var furniture_tiles = [
	# Desks
	OfficeTile("desk_horizontal", 0, 128, 64, 32, Layer.ABOVE_FLOOR, [{x: 0, y: 0}, {x: 1, y: 0}]),
	OfficeTile("desk_vertical", 64, 128, 32, 64, Layer.ABOVE_FLOOR, [{x: 0, y: 0}, {x: 0, y: 1}]),

	# Tables
	OfficeTile("conference_table_small", 96, 128, 64, 32, Layer.ABOVE_FLOOR, [{x: 0, y: 0}, {x: 1, y: 0}]),
	OfficeTile("conference_table_large", 0, 192, 128, 64, Layer.ABOVE_FLOOR, [
		{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0},
		{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}
	]),

	# Chairs
	OfficeTile("chair_down", 128, 128, 32, 32, Layer.ABOVE_FLOOR),
	OfficeTile("chair_up", 160, 128, 32, 32, Layer.ABOVE_FLOOR),
	OfficeTile("chair_left", 128, 160, 32, 32, Layer.ABOVE_FLOOR),
	OfficeTile("chair_right", 160, 160, 32, 32, Layer.ABOVE_FLOOR),

	# Sofas
	OfficeTile("sofa_left", 0, 256, 32, 32, Layer.ABOVE_FLOOR),
	OfficeTile("sofa_middle", 32, 256, 32, 32, Layer.ABOVE_FLOOR),
	OfficeTile("sofa_right", 64, 256, 32, 32, Layer.ABOVE_FLOOR),

	# Shelves & storage
	OfficeTile("shelf_1", 192, 192, 32, 32, Layer.ABOVE_FLOOR, [{x: 0, y: 0}]),
	OfficeTile("shelf_2", 224, 192, 32, 32, Layer.ABOVE_FLOOR, [{x: 0, y: 0}]),
	OfficeTile("bookcase_tall", 192, 160, 32, 64, Layer.ABOVE_FLOOR, [{x: 0, y: 0}, {x: 0, y: 1}]),

	# Kitchen items
	OfficeTile("sink", 96, 192, 32, 32, Layer.ABOVE_FLOOR, [{x: 0, y: 0}]),
	OfficeTile("stove", 128, 192, 32, 32, Layer.ABOVE_FLOOR, [{x: 0, y: 0}]),
	OfficeTile("fridge", 160, 192, 32, 32, Layer.ABOVE_FLOOR, [{x: 0, y: 0}]),
	OfficeTile("counter_1", 256, 192, 32, 32, Layer.ABOVE_FLOOR),
	OfficeTile("counter_2", 288, 192, 32, 32, Layer.ABOVE_FLOOR),
]

# Objects (obstacles - cannot walk through)
var object_tiles = [
	# Doors
	OfficeTile("door_closed", 0, 320, 32, 64, Layer.OBJECT, [{x: 0, y: 0}, {x: 0, y: 1}]),
	OfficeTile("door_open", 32, 320, 32, 64, Layer.OBJECT, [{x: 0, y: 0}, {x: 0, y: 1}]),
	OfficeTile("door_horizontal", 64, 320, 64, 32, Layer.OBJECT, [{x: 0, y: 0}, {x: 1, y: 0}]),

	# Walls
	OfficeTile("wall_vertical", 0, 384, 32, 32, Layer.OBJECT, [{x: 0, y: 0}]),
	OfficeTile("wall_horizontal", 32, 384, 32, 32, Layer.OBJECT, [{x: 0, y: 0}]),
	OfficeTile("wall_corner_tl", 64, 384, 32, 32, Layer.OBJECT, [{x: 0, y: 0}]),
	OfficeTile("wall_corner_tr", 96, 384, 32, 32, Layer.OBJECT, [{x: 0, y: 0}]),
	OfficeTile("wall_corner_bl", 128, 384, 32, 32, Layer.OBJECT, [{x: 0, y: 0}]),
	OfficeTile("wall_corner_br", 160, 384, 32, 32, Layer.OBJECT, [{x: 0, y: 0}]),

	# Columns/pillars
	OfficeTile("column_single", 192, 384, 32, 32, Layer.OBJECT, [{x: 0, y: 0}]),
	OfficeTile("column_double", 224, 384, 64, 32, Layer.OBJECT, [{x: 0, y: 0}, {x: 1, y: 0}]),
	OfficeTile("column_quad", 192, 416, 64, 64, Layer.OBJECT, [
		{x: 0, y: 0}, {x: 1, y: 0},
		{x: 0, y: 1}, {x: 1, y: 1}
	]),

	# Elevators
	OfficeTile("elevator_closed", 0, 448, 64, 64, Layer.OBJECT, [
		{x: 0, y: 0}, {x: 1, y: 0},
		{x: 0, y: 1}, {x: 1, y: 1}
	]),
	OfficeTile("elevator_open", 64, 448, 64, 64, Layer.OBJECT, [
		{x: 0, y: 0}, {x: 1, y: 0},
		{x: 0, y: 1}, {x: 1, y: 1}
	]),

	# Stairs
	OfficeTile("stairs_down", 128, 448, 64, 64, Layer.OBJECT, [
		{x: 0, y: 2}, {x: 1, y: 2},
		{x: 0, y: 3}, {x: 1, y: 3}
	]),

	# Windows
	OfficeTile("window_single", 0, 512, 32, 64, Layer.OBJECT, [{x: 0, y: 0}]),
	OfficeTile("window_double", 32, 512, 64, 64, Layer.OBJECT, [{x: 0, y: 0}, {x: 1, y: 0}]),

	# Plants & decoration
	OfficeTile("plant_small", 192, 448, 32, 32, Layer.OBJECT, [{x: 0, y: 0}]),
	OfficeTile("plant_large", 224, 448, 32, 64, Layer.OBJECT, [{x: 0, y: 0}, {x: 0, y: 1}]),
	OfficeTile("plant_corner", 256, 448, 64, 64, Layer.OBJECT, [
		{x: 0, y: 0}, {x: 1, y: 0},
		{x: 0, y: 1}, {x: 1, y: 1}
	]),

	# Whiteboards & fixtures
	OfficeTile("whiteboard_small", 96, 512, 32, 64, Layer.OBJECT, [{x: 0, y: 0}]),
	OfficeTile("whiteboard_large", 128, 512, 64, 64, Layer.OBJECT, [{x: 0, y: 0}, {x: 1, y: 0}]),
	OfficeTile("projector_screen", 192, 512, 64, 96, Layer.OBJECT, [{x: 0, y: 0}, {x: 1, y: 0}]),

	# Reception desk
	OfficeTile("reception_desk", 0, 576, 96, 32, Layer.OBJECT, [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}]),
]

# All tiles combined
var all_tiles: Array = []

func _ready() -> void:
	all_tiles = floor_tiles + furniture_tiles + object_tiles
	print("[OfficeEnvironment] Initialized with %d tiles" % all_tiles.size())

# Get tile by name
func get_tile(tile_name: String) -> OfficeTile:
	for tile in all_tiles:
		if tile.name == tile_name:
			return tile
	return null

# Get tiles by layer
func get_tiles_by_layer(layer_type: int) -> Array:
	var result = []
	for tile in all_tiles:
		if tile.layer == layer_type:
			result.append(tile)
	return result

# Get spritesheet texture region for a tile
func get_tile_region(tile: OfficeTile) -> Rect2i:
	return Rect2i(tile.x, tile.y, tile.width, tile.height)

# Create a default office floor layout
func generate_default_office() -> Dictionary:
	var layout = {}

	# Create a 48x48 office grid
	for x in range(48):
		for y in range(48):
			var key = "%d,%d" % [x, y]

			# Outer walls
			if x == 0 or x == 47 or y == 0 or y == 47:
				layout[key] = {
					"floor": "light_wood_1",
					"above_floor": null,
					"object": "wall_vertical" if x == 0 or x == 47 else "wall_horizontal"
				}
			# Interior with alternating floor pattern
			elif (x + y) % 4 == 0:
				layout[key] = {
					"floor": "dark_wood_1",
					"above_floor": null,
					"object": null
				}
			else:
				layout[key] = {
					"floor": "light_wood_1",
					"above_floor": null,
					"object": null
				}

	# Add some columns in the middle
	for col_x in [12, 24, 36]:
		for col_y in [12, 24, 36]:
			var key = "%d,%d" % [col_x, col_y]
			layout[key] = {
				"floor": "light_wood_1",
				"above_floor": null,
				"object": "column_single"
			}

	# Add doors
	layout["8,0"] = {"floor": "light_wood_1", "above_floor": null, "object": "door_horizontal"}
	layout["24,0"] = {"floor": "light_wood_1", "above_floor": null, "object": "door_horizontal"}
	layout["40,0"] = {"floor": "light_wood_1", "above_floor": null, "object": "door_horizontal"}

	# Add some furniture in the middle
	for desk_x in range(5, 45, 8):
		for desk_y in range(5, 45, 8):
			var key = "%d,%d" % [desk_x, desk_y]
			if key in layout and layout[key]["object"] == null:
				layout[key] = {
					"floor": "light_wood_1",
					"above_floor": "desk_horizontal",
					"object": null
				}

	print("[OfficeEnvironment] Generated default office layout (%dx%d)" % [48, 48])
	return layout

# Export office spritesheet data (Godot format)
func export_spritesheet_data() -> String:
	var data = ""
	data += "# Office Environment Spritesheet\n"
	data += "# Spritesheet: %s\n" % SPRITESHEET_PATH
	data += "# Size: %dx%d pixels\n\n" % [SPRITESHEET_SIZE.x, SPRITESHEET_SIZE.y]

	for tile in all_tiles:
		data += "Tile: %s\n" % tile.name
		data += "  Position: (%d, %d)\n" % [tile.x, tile.y]
		data += "  Size: %dx%d\n" % [tile.width, tile.height]
		data += "  Layer: %s\n" % Layer.keys()[tile.layer]
		if tile.colliders.size() > 0:
			data += "  Colliders: %s\n" % str(tile.colliders)
		data += "\n"

	return data
