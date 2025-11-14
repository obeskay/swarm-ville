extends Node
## Office Map Generator - Create coherent office layouts with zones
## Based on gather-clone patterns

class_name OfficeMapGenerator

## Zone definitions for collaboration
class OfficeZone:
	var zone_id: String
	var zone_type: String  # "reception", "meeting", "desk", "lounge", "kitchen", "focus"
	var bounds: Rect2i
	var name: String
	var channel_id: String  # For collaboration grouping
	var is_private: bool = false
	var allowed_users: Array[String] = []

	func _init(id: String, type: String, zone_bounds: Rect2i, zone_name: String):
		zone_id = id
		zone_type = type
		bounds = zone_bounds
		name = zone_name
		channel_id = "zone_%s" % id

## Generate a complete office map with zones
static func generate_office_map(width: int = 48, height: int = 48) -> Dictionary:
	print("[OfficeMapGenerator] Generating %dx%d office map..." % [width, height])

	var map_data = {
		"dimensions": {"width": width, "height": height},
		"spawnpoint": {"room": 0, "x": width / 2, "y": height - 5},
		"zones": [],
		"tilemap": {},
		"special_tiles": []
	}

	# Create zones first (defines layout)
	var zones = _create_office_zones(width, height)
	map_data["zones"] = zones

	# Generate tilemap based on zones
	_generate_tilemap_for_zones(map_data, zones)

	# Add special tiles
	_add_special_tiles(map_data, zones)

	print("[OfficeMapGenerator] ✅ Generated map with %d zones" % zones.size())
	return map_data

## Create office zones layout
static func _create_office_zones(width: int, height: int) -> Array[OfficeZone]:
	var zones: Array[OfficeZone] = []

	# RECEPTION AREA (bottom center)
	zones.append(OfficeZone.new(
		"reception",
		"reception",
		Rect2i(width/2 - 6, height - 8, 12, 6),
		"Reception & Lobby"
	))

	# MEETING ROOMS (left side, 3 rooms)
	for i in range(3):
		var y_offset = 10 + (i * 12)
		zones.append(OfficeZone.new(
			"meeting_%d" % (i + 1),
			"meeting",
			Rect2i(2, y_offset, 10, 10),
			"Meeting Room %d" % (i + 1)
		))

	# DESK CLUSTERS (center area, 4 clusters of 3x3)
	var desk_positions = [
		Vector2i(15, 10), Vector2i(28, 10),  # Top row
		Vector2i(15, 22), Vector2i(28, 22)   # Bottom row
	]
	for i in range(desk_positions.size()):
		var pos = desk_positions[i]
		zones.append(OfficeZone.new(
			"desk_cluster_%d" % (i + 1),
			"desk",
			Rect2i(pos.x, pos.y, 8, 8),
			"Desk Cluster %d" % (i + 1)
		))

	# LOUNGE AREA (right side, top)
	zones.append(OfficeZone.new(
		"lounge",
		"lounge",
		Rect2i(width - 12, 8, 10, 10),
		"Lounge & Breakout"
	))

	# KITCHEN (right side, middle)
	zones.append(OfficeZone.new(
		"kitchen",
		"kitchen",
		Rect2i(width - 12, 22, 10, 8),
		"Kitchen & Coffee"
	))

	# FOCUS BOOTHS (right side, bottom) - PRIVATE
	for i in range(2):
		var y_offset = 34 + (i * 6)
		var zone = OfficeZone.new(
			"focus_%d" % (i + 1),
			"focus",
			Rect2i(width - 10, y_offset, 8, 5),
			"Focus Booth %d" % (i + 1)
		)
		zone.is_private = true
		zones.append(zone)

	return zones

## Generate tilemap data for zones
static func _generate_tilemap_for_zones(map_data: Dictionary, zones: Array[OfficeZone]) -> void:
	var width = map_data["dimensions"]["width"]
	var height = map_data["dimensions"]["height"]
	var tilemap = map_data["tilemap"]

	# Fill entire map with default floor
	for x in range(width):
		for y in range(height):
			var key = "%d,%d" % [x, y]
			tilemap[key] = {
				"floor": "light_wood",
				"above_floor": null,
				"object": null,
				"walkable": true
			}

	# Add walls around perimeter
	for x in range(width):
		tilemap["%d,0" % x]["object"] = "wall_horizontal"
		tilemap["%d,0" % x]["walkable"] = false
		tilemap["%d,%d" % [x, height - 1]]["object"] = "wall_horizontal"
		tilemap["%d,%d" % [x, height - 1]]["walkable"] = false

	for y in range(height):
		tilemap["0,%d" % y]["object"] = "wall_vertical"
		tilemap["0,%d" % y]["walkable"] = false
		tilemap["%d,%d" % [width - 1, y]]["object"] = "wall_vertical"
		tilemap["%d,%d" % [width - 1, y]]["walkable"] = false

	# Add main entrance (reception area)
	var entrance_x = width / 2
	tilemap["%d,%d" % [entrance_x, height - 1]]["object"] = "door_open"
	tilemap["%d,%d" % [entrance_x, height - 1]]["walkable"] = true

	# Fill zones with appropriate content
	for zone in zones:
		match zone.zone_type:
			"reception":
				_fill_reception_zone(tilemap, zone)
			"meeting":
				_fill_meeting_zone(tilemap, zone)
			"desk":
				_fill_desk_zone(tilemap, zone)
			"lounge":
				_fill_lounge_zone(tilemap, zone)
			"kitchen":
				_fill_kitchen_zone(tilemap, zone)
			"focus":
				_fill_focus_zone(tilemap, zone)

## Fill reception zone
static func _fill_reception_zone(tilemap: Dictionary, zone: OfficeZone) -> void:
	var bounds = zone.bounds

	# Add reception desk in center
	var desk_y = bounds.position.y + 2
	var desk_x = bounds.position.x + bounds.size.x / 2 - 2

	for i in range(4):
		var key = "%d,%d" % [desk_x + i, desk_y]
		tilemap[key]["above_floor"] = "reception_desk"

	# Add waiting chairs
	for i in range(3):
		var key = "%d,%d" % [bounds.position.x + 2 + i * 3, bounds.position.y + 4]
		tilemap[key]["above_floor"] = "chair_down"

## Fill meeting room zone
static func _fill_meeting_zone(tilemap: Dictionary, zone: OfficeZone) -> void:
	var bounds = zone.bounds

	# Add walls around meeting room
	for x in range(bounds.position.x, bounds.position.x + bounds.size.x):
		tilemap["%d,%d" % [x, bounds.position.y]]["object"] = "wall_horizontal"
		tilemap["%d,%d" % [x, bounds.position.y]]["walkable"] = false
		tilemap["%d,%d" % [x, bounds.position.y + bounds.size.y - 1]]["object"] = "wall_horizontal"
		tilemap["%d,%d" % [x, bounds.position.y + bounds.size.y - 1]]["walkable"] = false

	for y in range(bounds.position.y, bounds.position.y + bounds.size.y):
		tilemap["%d,%d" % [bounds.position.x, y]]["object"] = "wall_vertical"
		tilemap["%d,%d" % [bounds.position.x, y]]["walkable"] = false
		tilemap["%d,%d" % [bounds.position.x + bounds.size.x - 1, y]]["object"] = "wall_vertical"
		tilemap["%d,%d" % [bounds.position.x + bounds.size.x - 1, y]]["walkable"] = false

	# Add door
	var door_x = bounds.position.x + bounds.size.x - 1
	var door_y = bounds.position.y + bounds.size.y / 2
	tilemap["%d,%d" % [door_x, door_y]]["object"] = "door_closed"
	tilemap["%d,%d" % [door_x, door_y]]["walkable"] = true

	# Add conference table in center
	var table_x = bounds.position.x + 2
	var table_y = bounds.position.y + 2
	for dx in range(4):
		for dy in range(4):
			var key = "%d,%d" % [table_x + dx, table_y + dy]
			tilemap[key]["above_floor"] = "conference_table"

	# Add chairs around table
	var chair_positions = [
		Vector2i(table_x - 1, table_y + 1),
		Vector2i(table_x - 1, table_y + 2),
		Vector2i(table_x + 4, table_y + 1),
		Vector2i(table_x + 4, table_y + 2)
	]
	for pos in chair_positions:
		tilemap["%d,%d" % [pos.x, pos.y]]["above_floor"] = "chair"

	# Add whiteboard
	tilemap["%d,%d" % [bounds.position.x + 1, bounds.position.y + 1]]["object"] = "whiteboard"
	tilemap["%d,%d" % [bounds.position.x + 1, bounds.position.y + 1]]["walkable"] = false

## Fill desk zone
static func _fill_desk_zone(tilemap: Dictionary, zone: OfficeZone) -> void:
	var bounds = zone.bounds

	# Add 6 desks in 2x3 grid
	for row in range(2):
		for col in range(3):
			var desk_x = bounds.position.x + 1 + (col * 2)
			var desk_y = bounds.position.y + 1 + (row * 3)

			tilemap["%d,%d" % [desk_x, desk_y]]["above_floor"] = "desk_horizontal"
			tilemap["%d,%d" % [desk_x, desk_y + 1]]["above_floor"] = "chair_down"

## Fill lounge zone
static func _fill_lounge_zone(tilemap: Dictionary, zone: OfficeZone) -> void:
	var bounds = zone.bounds

	# Add carpet floor
	for x in range(bounds.position.x, bounds.position.x + bounds.size.x):
		for y in range(bounds.position.y, bounds.position.y + bounds.size.y):
			tilemap["%d,%d" % [x, y]]["floor"] = "carpet"

	# Add sofa
	for i in range(3):
		tilemap["%d,%d" % [bounds.position.x + 2 + i, bounds.position.y + 3]]["above_floor"] = "sofa"

	# Add small tables
	tilemap["%d,%d" % [bounds.position.x + 6, bounds.position.y + 3]]["above_floor"] = "table_small"

	# Add plants
	tilemap["%d,%d" % [bounds.position.x + 1, bounds.position.y + 1]]["object"] = "plant_small"
	tilemap["%d,%d" % [bounds.position.x + 1, bounds.position.y + 1]]["walkable"] = false

## Fill kitchen zone
static func _fill_kitchen_zone(tilemap: Dictionary, zone: OfficeZone) -> void:
	var bounds = zone.bounds

	# Add tile floor
	for x in range(bounds.position.x, bounds.position.x + bounds.size.x):
		for y in range(bounds.position.y, bounds.position.y + bounds.size.y):
			tilemap["%d,%d" % [x, y]]["floor"] = "tile"

	# Add appliances along one wall
	tilemap["%d,%d" % [bounds.position.x + 1, bounds.position.y + 1]]["above_floor"] = "fridge"
	tilemap["%d,%d" % [bounds.position.x + 3, bounds.position.y + 1]]["above_floor"] = "sink"
	tilemap["%d,%d" % [bounds.position.x + 5, bounds.position.y + 1]]["above_floor"] = "stove"

	# Add counter
	for i in range(4):
		tilemap["%d,%d" % [bounds.position.x + 1 + i, bounds.position.y + 3]]["above_floor"] = "counter"

	# Add table and chairs
	tilemap["%d,%d" % [bounds.position.x + 5, bounds.position.y + 5]]["above_floor"] = "table_small"
	for i in range(4):
		var offset = [Vector2i(-1, 0), Vector2i(1, 0), Vector2i(0, -1), Vector2i(0, 1)][i]
		var pos = Vector2i(bounds.position.x + 5, bounds.position.y + 5) + offset
		tilemap["%d,%d" % [pos.x, pos.y]]["above_floor"] = "chair"

## Fill focus booth (private)
static func _fill_focus_zone(tilemap: Dictionary, zone: OfficeZone) -> void:
	var bounds = zone.bounds

	# Add walls
	for x in range(bounds.position.x, bounds.position.x + bounds.size.x):
		tilemap["%d,%d" % [x, bounds.position.y]]["object"] = "wall_horizontal"
		tilemap["%d,%d" % [x, bounds.position.y]]["walkable"] = false
		tilemap["%d,%d" % [x, bounds.position.y + bounds.size.y - 1]]["object"] = "wall_horizontal"
		tilemap["%d,%d" % [x, bounds.position.y + bounds.size.y - 1]]["walkable"] = false

	for y in range(bounds.position.y, bounds.position.y + bounds.size.y):
		tilemap["%d,%d" % [bounds.position.x, y]]["object"] = "wall_vertical"
		tilemap["%d,%d" % [bounds.position.x, y]]["walkable"] = false
		tilemap["%d,%d" % [bounds.position.x + bounds.size.x - 1, y]]["object"] = "wall_vertical"
		tilemap["%d,%d" % [bounds.position.x + bounds.size.x - 1, y]]["walkable"] = false

	# Add door
	tilemap["%d,%d" % [bounds.position.x, bounds.position.y + 2]]["object"] = "door_closed"
	tilemap["%d,%d" % [bounds.position.x, bounds.position.y + 2]]["walkable"] = true

	# Add single desk and chair
	tilemap["%d,%d" % [bounds.position.x + 3, bounds.position.y + 2]]["above_floor"] = "desk_horizontal"
	tilemap["%d,%d" % [bounds.position.x + 3, bounds.position.y + 3]]["above_floor"] = "chair_down"

	# Mark as private zone
	tilemap["%d,%d" % [bounds.position.x + 2, bounds.position.y + 1]]["special"] = "private"

## Add special tiles (spawn, teleport, etc.)
static func _add_special_tiles(map_data: Dictionary, zones: Array[OfficeZone]) -> void:
	var tilemap = map_data["tilemap"]
	var spawn = map_data["spawnpoint"]

	# Mark spawn point
	var spawn_key = "%d,%d" % [spawn["x"], spawn["y"]]
	tilemap[spawn_key]["special"] = "spawn"
	map_data["special_tiles"].append({
		"type": "spawn",
		"position": Vector2i(spawn["x"], spawn["y"])
	})

	# Add teleporter in lounge (to second floor - future feature)
	var lounge_zone = zones.filter(func(z): return z.zone_type == "lounge")[0]
	var teleport_pos = Vector2i(
		lounge_zone.bounds.position.x + 8,
		lounge_zone.bounds.position.y + 8
	)
	var teleport_key = "%d,%d" % [teleport_pos.x, teleport_pos.y]
	tilemap[teleport_key]["special"] = "teleport"
	tilemap[teleport_key]["teleporter"] = {"roomIndex": 1, "x": 5, "y": 5}
	map_data["special_tiles"].append({
		"type": "teleport",
		"position": teleport_pos,
		"target": {"room": 1, "x": 5, "y": 5}
	})

## Export map to JSON file
static func save_map_to_json(map_data: Dictionary, file_path: String) -> void:
	var file = FileAccess.open(file_path, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(map_data, "\t"))
		file.close()
		print("[OfficeMapGenerator] ✅ Saved map to: %s" % file_path)
	else:
		push_error("[OfficeMapGenerator] ❌ Failed to save map to: %s" % file_path)

## Helper: Print zone info
static func print_zone_info(zones: Array[OfficeZone]) -> void:
	print("\n=== OFFICE ZONES ===")
	for zone in zones:
		print("  [%s] %s" % [zone.zone_type.to_upper(), zone.name])
		print("    Bounds: %s" % zone.bounds)
		print("    Channel: %s" % zone.channel_id)
		print("    Private: %s" % zone.is_private)
	print("=" * 40 + "\n")
