extends Node
## Space and map state management

signal space_loaded(space_id: String)
signal space_changed(space_id: String)

var current_space_id: String = ""
var current_space: Dictionary = {}
var spaces: Array[Dictionary] = []

func _ready() -> void:
	WebSocketClient.space_loaded.connect(_on_space_loaded)
	print("[SpaceManager] Initialized")

func load_space(space_id: String) -> void:
	current_space_id = space_id
	# In real implementation, fetch from WebSocket
	# For now, create dummy space
	current_space = {
		"id": space_id,
		"name": "Space %s" % space_id,
		"dimensions": {"width": 48, "height": 48},
		"tilemap": {}
	}
	space_loaded.emit(space_id)
	print("[SpaceManager] Loaded space: %s" % space_id)

func get_current_space() -> Dictionary:
	return current_space.duplicate()

func get_tile_at(grid_pos: Vector2i) -> Dictionary:
	var tilemap = current_space.get("tilemap", {})
	var key = "%d,%d" % [grid_pos.x, grid_pos.y]
	return tilemap.get(key, {})

func is_walkable(grid_pos: Vector2i) -> bool:
	var tile = get_tile_at(grid_pos)
	var has_object = tile.get("object", false)
	var is_impassable = tile.get("impassable", false)
	return not (has_object or is_impassable)

func get_blocked_tiles() -> Array[Vector2i]:
	var blocked: Array[Vector2i] = []
	var tilemap = current_space.get("tilemap", {})

	for key in tilemap.keys():
		var parts = key.split(",")
		if parts.size() == 2:
			var x = int(parts[0])
			var y = int(parts[1])
			if not is_walkable(Vector2i(x, y)):
				blocked.append(Vector2i(x, y))

	return blocked

func get_spaces() -> Array:
	# Placeholder - would fetch from backend
	return []

func _on_space_loaded(space_data: Dictionary) -> void:
	current_space = space_data
	current_space_id = space_data.get("id", "")
	space_changed.emit(current_space_id)
	print("[SpaceManager] Space loaded: %s" % current_space_id)
