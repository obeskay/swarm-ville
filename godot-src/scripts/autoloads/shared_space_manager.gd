extends Node
## Shared Space Manager - Handle persistent shared spaces like Gather.town

signal space_loaded(space_data: Dictionary)
signal space_updated(space_data: Dictionary)
signal object_placed(object_data: Dictionary)
signal object_removed(object_id: String)

var current_space: Dictionary = {}
var space_objects: Dictionary = {}  # object_id -> object_data
var space_directory: String = "user://"  # Persist spaces

func _ready() -> void:
	if not DirAccess.dir_exists_absolute(space_directory + "spaces"):
		DirAccess.make_dir_absolute(space_directory + "spaces")

	print("[SharedSpaceManager] Initialized - Space persistence enabled")

func create_space(space_name: String, width: int = 48, height: int = 48) -> Dictionary:
	"""Create a new shared space"""
	var space_id = "space_%d" % Time.get_ticks_msec()

	current_space = {
		"id": space_id,
		"name": space_name,
		"width": width,
		"height": height,
		"created_at": Time.get_unix_time_from_system(),
		"last_modified": Time.get_unix_time_from_system(),
		"owner": "system",
		"objects": {},
		"tilemap": {},
		"spawn_points": []
	}

	print("[SharedSpaceManager] Space created: %s (%dx%d)" % [space_name, width, height])
	space_loaded.emit(current_space)

	return current_space

func place_object(object_id: String, object_type: String, position: Vector2i, properties: Dictionary = {}) -> Dictionary:
	"""Place an object in the shared space"""
	var obj = {
		"id": object_id,
		"type": object_type,
		"position": {"x": position.x, "y": position.y},
		"properties": properties,
		"placed_at": Time.get_unix_time_from_system()
	}

	space_objects[object_id] = obj
	current_space["objects"][object_id] = obj

	object_placed.emit(obj)
	_mark_modified()

	print("[SharedSpaceManager] Object placed: %s at (%d, %d)" % [object_type, position.x, position.y])
	return obj

func remove_object(object_id: String) -> void:
	"""Remove object from space"""
	if space_objects.has(object_id):
		space_objects.erase(object_id)
		current_space["objects"].erase(object_id)

		object_removed.emit(object_id)
		_mark_modified()

		print("[SharedSpaceManager] Object removed: %s" % object_id)

func add_spawn_point(position: Vector2i, name: String = "") -> void:
	"""Add spawn point for users"""
	current_space["spawn_points"].append({
		"position": {"x": position.x, "y": position.y},
		"name": name if name else "Spawn_%d" % current_space["spawn_points"].size()
	})

	_mark_modified()
	print("[SharedSpaceManager] Spawn point added at (%d, %d)" % [position.x, position.y])

func set_tilemap_data(tilemap_data: Dictionary) -> void:
	"""Update tilemap for space"""
	current_space["tilemap"] = tilemap_data
	_mark_modified()
	print("[SharedSpaceManager] Tilemap updated")

func get_spawn_point(index: int = 0) -> Vector2i:
	"""Get a spawn point"""
	if current_space["spawn_points"].size() == 0:
		return Vector2i(5, 5)  # Default

	if index >= current_space["spawn_points"].size():
		index = index % current_space["spawn_points"].size()

	var spawn = current_space["spawn_points"][index]
	return Vector2i(spawn["position"]["x"], spawn["position"]["y"])

func save_space(space_id: String = "") -> bool:
	"""Save space to persistent storage"""
	if space_id.is_empty():
		space_id = current_space["id"]

	var path = space_directory + "spaces/%s.json" % space_id
	var file = FileAccess.open(path, FileAccess.WRITE)

	if file == null:
		print("[SharedSpaceManager] Failed to save space: %s" % space_id)
		return false

	file.store_var(current_space)
	print("[SharedSpaceManager] Space saved: %s" % space_id)
	return true

func load_space(space_id: String) -> Dictionary:
	"""Load space from persistent storage"""
	var path = space_directory + "spaces/%s.json" % space_id

	if not FileAccess.file_exists(path):
		print("[SharedSpaceManager] Space not found: %s" % space_id)
		return {}

	var file = FileAccess.open(path, FileAccess.READ)
	current_space = file.get_var()

	print("[SharedSpaceManager] Space loaded: %s" % space_id)
	space_loaded.emit(current_space)
	return current_space

func list_spaces() -> Array:
	"""List all available spaces"""
	var spaces = []
	var dir = DirAccess.open(space_directory + "spaces")

	if dir:
		dir.list_dir_begin()
		var file_name = dir.get_next()

		while file_name != "":
			if file_name.ends_with(".json"):
				var space_data = load_space(file_name.trim_suffix(".json"))
				if not space_data.is_empty():
					spaces.append({
						"id": space_data["id"],
						"name": space_data["name"],
						"created_at": space_data["created_at"],
						"objects_count": space_data["objects"].size()
					})

			file_name = dir.get_next()

		dir.list_dir_end()

	return spaces

func _mark_modified() -> void:
	"""Mark space as recently modified"""
	current_space["last_modified"] = Time.get_unix_time_from_system()
	space_updated.emit(current_space)
