extends Node
## Tilemap management - sparse grid storage, walkability, tile updates

signal tilemap_loaded
signal tile_updated(grid_pos: Vector2i, tile_data: Dictionary)

var tilemap: Dictionary = {}  # "x,y" → {id, type, walkable, data}
var width: int = 48
var height: int = 48
var tile_size: int = 64

func _ready() -> void:
	WebSocketClient.space_loaded.connect(_on_space_loaded)
	WebSocketClient.tile_updated.connect(_on_tile_updated)
	print("[TileMapManager] Initialized")

func load_tilemap(space_data: Dictionary) -> void:
	"""Load tilemap from server JSON"""
	tilemap.clear()

	var dimensions = space_data.get("dimensions", {})
	width = dimensions.get("width", 48)
	height = dimensions.get("height", 48)

	var tilemap_data = space_data.get("tilemap", {})
	for key in tilemap_data.keys():
		var tile_data = tilemap_data[key]
		tilemap[key] = {
			"id": tile_data.get("id", 0),
			"type": tile_data.get("type", "grass"),
			"walkable": tile_data.get("walkable", true),
			"data": tile_data.get("data", {})
		}

	tilemap_loaded.emit()
	print("[TileMapManager] Loaded tilemap: %dx%d with %d tiles" % [width, height, tilemap.size()])

func is_walkable(grid_pos: Vector2i) -> bool:
	"""Check if a tile is walkable"""
	if grid_pos.x < 0 or grid_pos.x >= width or grid_pos.y < 0 or grid_pos.y >= height:
		return false

	var key = "%d,%d" % [grid_pos.x, grid_pos.y]
	var tile_data = tilemap.get(key, {})
	return tile_data.get("walkable", true)

func get_tile(grid_pos: Vector2i) -> Dictionary:
	"""Get tile data at position"""
	var key = "%d,%d" % [grid_pos.x, grid_pos.y]
	return tilemap.get(key, {})

func world_to_tile(world_pos: Vector2) -> Vector2i:
	"""Convert world pixel position to grid position"""
	return Vector2i(int(world_pos.x / tile_size), int(world_pos.y / tile_size))

func tile_to_world(grid_pos: Vector2i) -> Vector2:
	"""Convert grid position to world pixel position"""
	return Vector2(grid_pos.x * tile_size, grid_pos.y * tile_size)

func get_tiles_in_radius(center: Vector2i, radius: int) -> Array[Vector2i]:
	"""Get all walkable tiles within radius"""
	var tiles: Array[Vector2i] = []

	for x in range(center.x - radius, center.x + radius + 1):
		for y in range(center.y - radius, center.y + radius + 1):
			var pos = Vector2i(x, y)
			if is_walkable(pos):
				tiles.append(pos)

	return tiles

func update_tile(grid_pos: Vector2i, tile_data: Dictionary) -> void:
	"""Update a single tile"""
	var key = "%d,%d" % [grid_pos.x, grid_pos.y]
	tilemap[key] = {
		"id": tile_data.get("id", 0),
		"type": tile_data.get("type", "grass"),
		"walkable": tile_data.get("walkable", true),
		"data": tile_data.get("data", {})
	}
	tile_updated.emit(grid_pos, tilemap[key])
	print("[TileMapManager] Updated tile at %s" % grid_pos)

func _on_space_loaded(space_data: Dictionary) -> void:
	load_tilemap(space_data)

func _on_tile_updated(tile_data: Dictionary) -> void:
	var x = tile_data.get("x", 0)
	var y = tile_data.get("y", 0)
	var grid_pos = Vector2i(x, y)
	update_tile(grid_pos, tile_data)
