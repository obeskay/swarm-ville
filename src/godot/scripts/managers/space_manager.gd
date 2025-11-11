extends Node

class_name SpaceManager

# Current space data
var current_space: Dictionary = {}
var space_version: int = 1
var space_updated_at: int = 0
var tilemap_data: Dictionary = {}

# Signals
signal space_loaded
signal space_updated
signal version_changed(new_version: int)

func _ready() -> void:
	# Connect to network signals
	NetworkManager.space_state_received.connect(_on_space_state_received)
	NetworkManager.space_updated.connect(_on_space_updated)

func _on_space_state_received(state: Dictionary) -> void:
	print("[SpaceManager] Space state received: %s" % state.get("space_id"))

	current_space = state
	space_version = state.get("version", 1)
	space_updated_at = state.get("updated_at", 0)

	# Parse tilemap if available
	var tilemap_json_str = state.get("tilemap", "{}")
	if tilemap_json_str is String:
		tilemap_data = JSON.parse_string(tilemap_json_str)
	else:
		tilemap_data = tilemap_json_str

	space_loaded.emit()
	print("[SpaceManager] Space loaded - version: %d" % space_version)

func _on_space_updated(space_id: String, version: int, updated_at: int) -> void:
	if space_id == current_space.get("id"):
		print("[SpaceManager] Space updated - version: %d → %d" % [space_version, version])
		space_version = version
		space_updated_at = updated_at
		version_changed.emit(version)
		space_updated.emit()

func get_space_id() -> String:
	return current_space.get("id", "")

func get_space_name() -> String:
	return current_space.get("name", "Unknown Space")

func get_space_version() -> int:
	return space_version

func get_space_users() -> Array:
	return current_space.get("users", [])

func get_user_count() -> int:
	return get_space_users().size()

func get_tilemap_data() -> Dictionary:
	return tilemap_data

func clear() -> void:
	current_space = {}
	space_version = 1
	space_updated_at = 0
	tilemap_data = {}
