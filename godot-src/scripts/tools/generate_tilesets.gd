@tool
extends EditorScript
## Editor Tool: Generate TileSet Resources
##
## HOW TO USE:
## 1. Open this script in Godot Editor
## 2. Go to File → Run
## 3. Check Output panel for results
## 4. TileSets will be saved in assets/sprites/tilesets/

func _run() -> void:
	print("\n" + "=".repeat(60))
	print("TILESET GENERATION TOOL")
	print("=".repeat(60) + "\n")

	# Ensure output directory exists
	var dir = DirAccess.open("res://assets/sprites/")
	if not dir.dir_exists("tilesets"):
		dir.make_dir("tilesets")
		print("[Tool] Created directory: res://assets/sprites/tilesets/\n")

	# Generate all tilesets
	generate_city_tileset()
	generate_grasslands_tileset()
	generate_ground_tileset()
	generate_village_tileset()

	print("\n" + "=".repeat(60))
	print("✅ TILESET GENERATION COMPLETE!")
	print("=".repeat(60) + "\n")
	print("Next steps:")
	print("1. Check res://assets/sprites/tilesets/ for .tres files")
	print("2. Use TileSets in TileMap nodes")
	print("3. Configure special tiles (obstacles, spawn points, etc.)\n")

## CITY TILESET
func generate_city_tileset() -> void:
	print("[City] Generating city tileset...")

	var texture = load("res://assets/sprites/spritesheets/city.png") as Texture2D
	if not texture:
		push_error("[City] ❌ Failed to load city.png")
		return

	var tileset = TileSet.new()
	var atlas_source = TileSetAtlasSource.new()

	# Configure atlas
	atlas_source.texture = texture
	atlas_source.texture_region_size = Vector2i(32, 32)

	# Calculate grid
	var texture_size = texture.get_size()
	var cols = int(texture_size.x / 32)
	var rows = int(texture_size.y / 32)

	print("[City]   Texture: %dx%d, Grid: %dx%d tiles" % [texture_size.x, texture_size.y, cols, rows])

	# Create all tiles
	for row in range(rows):
		for col in range(cols):
			atlas_source.create_tile(Vector2i(col, row))

	# Add to tileset
	tileset.tile_size = Vector2i(32, 32)
	tileset.add_source(atlas_source, 0)

	# Add custom data layers
	setup_custom_data_layers(tileset)

	# Mark obstacles (example: buildings, walls)
	# TODO: Customize based on actual spritesheet layout
	var obstacles = [
		# Vector2i(x, y) coordinates of obstacle tiles
	]
	mark_obstacles(tileset, obstacles)

	# Save
	var save_path = "res://assets/sprites/tilesets/city_tileset.tres"
	var error = ResourceSaver.save(tileset, save_path)

	if error == OK:
		print("[City]   ✅ Saved to: %s" % save_path)
	else:
		push_error("[City]   ❌ Failed to save: Error %d" % error)

## GRASSLANDS TILESET
func generate_grasslands_tileset() -> void:
	print("[Grasslands] Generating grasslands tileset...")

	var texture = load("res://assets/sprites/spritesheets/grasslands.png") as Texture2D
	if not texture:
		push_error("[Grasslands] ❌ Failed to load grasslands.png")
		return

	var tileset = TileSet.new()
	var atlas_source = TileSetAtlasSource.new()

	atlas_source.texture = texture
	atlas_source.texture_region_size = Vector2i(32, 32)

	var texture_size = texture.get_size()
	var cols = int(texture_size.x / 32)
	var rows = int(texture_size.y / 32)

	print("[Grasslands]   Texture: %dx%d, Grid: %dx%d tiles" % [texture_size.x, texture_size.y, cols, rows])

	for row in range(rows):
		for col in range(cols):
			atlas_source.create_tile(Vector2i(col, row))

	tileset.tile_size = Vector2i(32, 32)
	tileset.add_source(atlas_source, 0)

	setup_custom_data_layers(tileset)

	# Grasslands are mostly walkable (trees might be obstacles)
	var obstacles = []
	mark_obstacles(tileset, obstacles)

	var save_path = "res://assets/sprites/tilesets/grasslands_tileset.tres"
	var error = ResourceSaver.save(tileset, save_path)

	if error == OK:
		print("[Grasslands]   ✅ Saved to: %s" % save_path)
	else:
		push_error("[Grasslands]   ❌ Failed to save: Error %d" % error)

## GROUND TILESET
func generate_ground_tileset() -> void:
	print("[Ground] Generating ground tileset...")

	var texture = load("res://assets/sprites/spritesheets/ground.png") as Texture2D
	if not texture:
		push_error("[Ground] ❌ Failed to load ground.png")
		return

	var tileset = TileSet.new()
	var atlas_source = TileSetAtlasSource.new()

	atlas_source.texture = texture
	atlas_source.texture_region_size = Vector2i(32, 32)

	var texture_size = texture.get_size()
	var cols = int(texture_size.x / 32)
	var rows = int(texture_size.y / 32)

	print("[Ground]   Texture: %dx%d, Grid: %dx%d tiles" % [texture_size.x, texture_size.y, cols, rows])

	for row in range(rows):
		for col in range(cols):
			atlas_source.create_tile(Vector2i(col, row))

	tileset.tile_size = Vector2i(32, 32)
	tileset.add_source(atlas_source, 0)

	setup_custom_data_layers(tileset)

	# Ground tiles are usually all walkable
	var obstacles = []
	mark_obstacles(tileset, obstacles)

	var save_path = "res://assets/sprites/tilesets/ground_tileset.tres"
	var error = ResourceSaver.save(tileset, save_path)

	if error == OK:
		print("[Ground]   ✅ Saved to: %s" % save_path)
	else:
		push_error("[Ground]   ❌ Failed to save: Error %d" % error)

## VILLAGE TILESET
func generate_village_tileset() -> void:
	print("[Village] Generating village tileset...")

	var texture = load("res://assets/sprites/spritesheets/village.png") as Texture2D
	if not texture:
		push_error("[Village] ❌ Failed to load village.png")
		return

	var tileset = TileSet.new()
	var atlas_source = TileSetAtlasSource.new()

	atlas_source.texture = texture
	atlas_source.texture_region_size = Vector2i(32, 32)

	var texture_size = texture.get_size()
	var cols = int(texture_size.x / 32)
	var rows = int(texture_size.y / 32)

	print("[Village]   Texture: %dx%d, Grid: %dx%d tiles" % [texture_size.x, texture_size.y, cols, rows])

	for row in range(rows):
		for col in range(cols):
			atlas_source.create_tile(Vector2i(col, row))

	tileset.tile_size = Vector2i(32, 32)
	tileset.add_source(atlas_source, 0)

	setup_custom_data_layers(tileset)

	# Village has houses, fences, etc. as obstacles
	var obstacles = []
	mark_obstacles(tileset, obstacles)

	var save_path = "res://assets/sprites/tilesets/village_tileset.tres"
	var error = ResourceSaver.save(tileset, save_path)

	if error == OK:
		print("[Village]   ✅ Saved to: %s" % save_path)
	else:
		push_error("[Village]   ❌ Failed to save: Error %d" % error)

## HELPER: Setup custom data layers
func setup_custom_data_layers(tileset: TileSet) -> void:
	# Layer 0: walkable (bool)
	tileset.add_custom_data_layer(0)
	tileset.set_custom_data_layer_name(0, "walkable")
	tileset.set_custom_data_layer_type(0, TYPE_BOOL)

	# Layer 1: tile_type (string: "floor", "object", "special")
	tileset.add_custom_data_layer(1)
	tileset.set_custom_data_layer_name(1, "tile_type")
	tileset.set_custom_data_layer_type(1, TYPE_STRING)

	# Layer 2: special (string: "spawn", "teleport", "private", "")
	tileset.add_custom_data_layer(2)
	tileset.set_custom_data_layer_name(2, "special")
	tileset.set_custom_data_layer_type(2, TYPE_STRING)

	# Set all tiles to walkable by default
	var atlas_source = tileset.get_source(0) as TileSetAtlasSource
	if atlas_source:
		for coords in atlas_source.get_tiles_to_be_removed_on_change(atlas_source.texture, atlas_source.texture_region_size):
			var tile_data = atlas_source.get_tile_data(coords, 0)
			if tile_data:
				tile_data.set_custom_data("walkable", true)
				tile_data.set_custom_data("tile_type", "floor")
				tile_data.set_custom_data("special", "")

## HELPER: Mark obstacle tiles
func mark_obstacles(tileset: TileSet, obstacle_coords: Array) -> void:
	if obstacle_coords.is_empty():
		return

	var atlas_source = tileset.get_source(0) as TileSetAtlasSource
	if not atlas_source:
		return

	for coords in obstacle_coords:
		var tile_data = atlas_source.get_tile_data(coords, 0)
		if tile_data:
			tile_data.set_custom_data("walkable", false)
			tile_data.set_custom_data("tile_type", "object")

			# Add collision polygon (full 32x32 tile)
			var collision_polygon = PackedVector2Array([
				Vector2(0, 0),
				Vector2(32, 0),
				Vector2(32, 32),
				Vector2(0, 32)
			])
			tile_data.set_collision_polygons_count(0, 1)
			tile_data.set_collision_polygon_points(0, 0, collision_polygon)

	print("   Marked %d obstacles" % obstacle_coords.size())
