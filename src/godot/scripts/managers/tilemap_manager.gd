extends Node
## TileMap Manager - Handles tilemap rendering and management

var tilemap: TileMap
var space_manager: Node
var network_manager: Node
var tile_layer_id: int = 0
var tile_set_source_id: int = 0
var tile_size: Vector2i = Vector2i(32, 32)
var current_tilemap_data: Dictionary = {}
var tile_grid: Dictionary = {}

func _ready() -> void:
	space_manager = get_tree().root.get_node("SpaceManager")
	network_manager = get_tree().root.get_node("NetworkManager")

	var parent = get_parent()
	if parent.has_node("TileMap"):
		tilemap = parent.get_node("TileMap")

	space_manager.space_loaded.connect(_on_space_loaded)
	space_manager.tilemap_updated.connect(_on_tilemap_updated)
	space_manager.tile_changed.connect(_on_tile_changed)
	print("[TileMapManager] Initialized")

func load_tilemap(space_data: Dictionary) -> void:
	if not space_data.has("tilemap"):
		return

	var tilemap_data = space_data.get("tilemap", {})
	current_tilemap_data = tilemap_data

	if tilemap_data.has("tiles"):
		var tiles = tilemap_data.get("tiles", [])
		for tile_entry in tiles:
			if tile_entry is Dictionary:
				var x = tile_entry.get("x", 0)
				var y = tile_entry.get("y", 0)
				var tile_id = tile_entry.get("tile_id", 0)
				var tile_data = tile_entry.get("data", {})

				var pos = Vector2i(x, y)
				tile_grid[pos] = {"tile_id": tile_id, "data": tile_data}

				if tilemap:
					var atlas_coords = Vector2i(tile_id % 16, tile_id / 16)
					tilemap.set_cell(tile_layer_id, pos, tile_set_source_id, atlas_coords)

	print("[TileMapManager] Loaded %d tiles" % tile_grid.size())

func update_tile(x: int, y: int, tile_id: int, data: Dictionary = {}) -> void:
	var pos = Vector2i(x, y)
	tile_grid[pos] = {"tile_id": tile_id, "data": data}

	if tilemap:
		var atlas_coords = Vector2i(tile_id % 16, tile_id / 16)
		tilemap.set_cell(tile_layer_id, pos, tile_set_source_id, atlas_coords)

func get_tile(x: int, y: int) -> Dictionary:
	var pos = Vector2i(x, y)
	if tile_grid.has(pos):
		return tile_grid[pos]
	return {}

func is_walkable(x: int, y: int) -> bool:
	var tile = get_tile(x, y)
	if tile.is_empty():
		return true
	var data = tile.get("data", {})
	return data.get("walkable", true)

func world_to_tile_pos(world_pos: Vector2) -> Vector2i:
	return (world_pos / tile_size).round()

func tile_to_world_pos(tile_pos: Vector2i) -> Vector2:
	return tile_pos * tile_size

func get_stats() -> Dictionary:
	return {"tile_count": tile_grid.size(), "tile_size": tile_size, "loaded": current_tilemap_data != {}}

func _on_space_loaded() -> void:
	var space_data = space_manager.get_space_data()
	load_tilemap(space_data)

func _on_tilemap_updated(tilemap_data: Dictionary) -> void:
	load_tilemap({"tilemap": tilemap_data})

func _on_tile_changed(x: int, y: int, tile_id: int, data: Dictionary) -> void:
	update_tile(x, y, tile_id, data)
