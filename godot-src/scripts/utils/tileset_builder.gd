extends Node
## Tileset Builder - Programmatically create TileSet resources from spritesheets
## Run this tool from Godot Editor to generate .tres files

class_name TileSetBuilder

# Spritesheet configurations
const SPRITESHEETS = {
	"city": {
		"path": "res://assets/sprites/spritesheets/city.png",
		"tile_size": Vector2i(32, 32),
		"grid_offset": Vector2i(0, 0),
		"separation": Vector2i(0, 0)
	},
	"grasslands": {
		"path": "res://assets/sprites/spritesheets/grasslands.png",
		"tile_size": Vector2i(32, 32),
		"grid_offset": Vector2i(0, 0),
		"separation": Vector2i(0, 0)
	},
	"ground": {
		"path": "res://assets/sprites/spritesheets/ground.png",
		"tile_size": Vector2i(32, 32),
		"grid_offset": Vector2i(0, 0),
		"separation": Vector2i(0, 0)
	},
	"village": {
		"path": "res://assets/sprites/spritesheets/village.png",
		"tile_size": Vector2i(32, 32),
		"grid_offset": Vector2i(0, 0),
		"separation": Vector2i(0, 0)
	}
}

## Create all tilesets - call this from @tool script or editor
static func generate_all_tilesets() -> void:
	print("[TileSetBuilder] Generating all TileSets...")

	for tileset_name in SPRITESHEETS:
		var config = SPRITESHEETS[tileset_name]
		var tileset = create_tileset(tileset_name, config)

		if tileset:
			var save_path = "res://assets/sprites/tilesets/%s_tileset.tres" % tileset_name
			var error = ResourceSaver.save(tileset, save_path)

			if error == OK:
				print("[TileSetBuilder] ✅ Saved: %s" % save_path)
			else:
				print("[TileSetBuilder] ❌ Failed to save %s: Error %d" % [save_path, error])

	print("[TileSetBuilder] Done!")

## Create a single tileset from configuration
static func create_tileset(name: String, config: Dictionary) -> TileSet:
	print("[TileSetBuilder] Creating tileset: %s" % name)

	# Load spritesheet texture
	var texture = load(config["path"]) as Texture2D
	if not texture:
		push_error("[TileSetBuilder] Failed to load texture: %s" % config["path"])
		return null

	# Create TileSet
	var tileset = TileSet.new()

	# Add texture as atlas source
	var atlas_source = TileSetAtlasSource.new()
	atlas_source.texture = texture
	atlas_source.texture_region_size = config["tile_size"]

	# Calculate grid dimensions
	var texture_size = texture.get_size()
	var tile_size = config["tile_size"]
	var grid_cols = int(texture_size.x / tile_size.x)
	var grid_rows = int(texture_size.y / tile_size.y)

	print("[TileSetBuilder]   Texture: %dx%d, Tile: %dx%d, Grid: %dx%d" % [
		texture_size.x, texture_size.y,
		tile_size.x, tile_size.y,
		grid_cols, grid_rows
	])

	# Set tile size
	tileset.tile_size = tile_size

	# Create tiles for entire grid
	var tile_count = 0
	for row in range(grid_rows):
		for col in range(grid_cols):
			var atlas_coords = Vector2i(col, row)
			atlas_source.create_tile(atlas_coords)
			tile_count += 1

			# Get tile data for custom properties
			var tile_data = atlas_source.get_tile_data(atlas_coords, 0)

			# Set default properties
			tile_data.set_custom_data("walkable", true)
			tile_data.set_custom_data("tile_type", "floor")
			tile_data.set_custom_data("special", "")

	# Add atlas source to tileset (source_id = 0)
	tileset.add_source(atlas_source, 0)

	# Add physics layer (for collision detection)
	tileset.add_physics_layer(0)

	# Add custom data layers
	tileset.add_custom_data_layer(0)
	tileset.set_custom_data_layer_name(0, "walkable")
	tileset.set_custom_data_layer_type(0, TYPE_BOOL)

	tileset.add_custom_data_layer(1)
	tileset.set_custom_data_layer_name(1, "tile_type")
	tileset.set_custom_data_layer_type(1, TYPE_STRING)

	tileset.add_custom_data_layer(2)
	tileset.set_custom_data_layer_name(2, "special")
	tileset.set_custom_data_layer_type(2, TYPE_STRING)

	print("[TileSetBuilder]   Created %d tiles" % tile_count)

	return tileset

## Mark specific tiles as impassable (obstacles)
static func mark_obstacle_tiles(tileset: TileSet, obstacle_coords: Array[Vector2i]) -> void:
	var atlas_source = tileset.get_source(0) as TileSetAtlasSource
	if not atlas_source:
		return

	for coords in obstacle_coords:
		var tile_data = atlas_source.get_tile_data(coords, 0)
		if tile_data:
			tile_data.set_custom_data("walkable", false)
			tile_data.set_custom_data("tile_type", "object")

			# Add collision polygon (full tile)
			var collision_polygon = PackedVector2Array([
				Vector2(0, 0),
				Vector2(32, 0),
				Vector2(32, 32),
				Vector2(0, 32)
			])
			tile_data.set_collision_polygons_count(0, 1)
			tile_data.set_collision_polygon_points(0, 0, collision_polygon)

## Mark special tiles (spawn, teleport, private)
static func mark_special_tiles(tileset: TileSet, special_tiles: Dictionary) -> void:
	# special_tiles format: {"spawn": [Vector2i(0, 0), ...], "teleport": [...], ...}
	var atlas_source = tileset.get_source(0) as TileSetAtlasSource
	if not atlas_source:
		return

	for special_type in special_tiles:
		var coords_array = special_tiles[special_type]
		for coords in coords_array:
			var tile_data = atlas_source.get_tile_data(coords, 0)
			if tile_data:
				tile_data.set_custom_data("special", special_type)
				tile_data.set_custom_data("tile_type", "special")

## Helper: Print tileset info
static func print_tileset_info(tileset: TileSet) -> void:
	print("TileSet Info:")
	print("  Tile Size: %s" % tileset.tile_size)
	print("  Physics Layers: %d" % tileset.get_physics_layers_count())
	print("  Custom Data Layers: %d" % tileset.get_custom_data_layers_count())
	print("  Sources: %d" % tileset.get_source_count())

	var atlas_source = tileset.get_source(0) as TileSetAtlasSource
	if atlas_source:
		print("  Atlas Source:")
		print("    Texture: %s" % atlas_source.texture.resource_path)
		print("    Region Size: %s" % atlas_source.texture_region_size)
		print("    Tile Count: %d" % atlas_source.get_tiles_count())
