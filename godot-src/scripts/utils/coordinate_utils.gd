extends Node
## Coordinate conversion utilities for viewport to world space

## Convert world position to grid position
static func world_to_grid(world_pos: Vector2) -> Vector2i:
	return Vector2i(
		int(world_pos.x / GameConfig.TILE_SIZE),
		int(world_pos.y / GameConfig.TILE_SIZE)
	)

## Convert grid position to world position
static func grid_to_world(grid_pos: Vector2i) -> Vector2:
	return Vector2(
		float(grid_pos.x) * GameConfig.TILE_SIZE,
		float(grid_pos.y) * GameConfig.TILE_SIZE
	)

## Convert grid position to center of tile
static func grid_to_world_center(grid_pos: Vector2i) -> Vector2:
	return grid_to_world(grid_pos) + Vector2(GameConfig.TILE_SIZE / 2.0, GameConfig.TILE_SIZE / 2.0)

## Get distance between two grid positions
static func grid_distance(pos1: Vector2i, pos2: Vector2i) -> float:
	return pos1.distance_to(pos2)

## Get adjacent grid positions
static func get_adjacent_tiles(grid_pos: Vector2i) -> Array[Vector2i]:
	var adjacent: Array[Vector2i] = []
	adjacent.append(grid_pos + Vector2i.RIGHT)
	adjacent.append(grid_pos + Vector2i.LEFT)
	adjacent.append(grid_pos + Vector2i.DOWN)
	adjacent.append(grid_pos + Vector2i.UP)
	return adjacent

## Get tiles within radius
static func get_tiles_in_radius(center: Vector2i, radius: int) -> Array[Vector2i]:
	var tiles: Array[Vector2i] = []
	for x in range(center.x - radius, center.x + radius + 1):
		for y in range(center.y - radius, center.y + radius + 1):
			var pos = Vector2i(x, y)
			if center.distance_to(pos) <= radius:
				tiles.append(pos)
	return tiles
