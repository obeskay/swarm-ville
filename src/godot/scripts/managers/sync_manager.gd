extends Node
## Sync Manager - Handles multi-user synchronization

var network_manager: Node
var agent_manager: Node
var space_manager: Node
var pending_updates: Dictionary = {}
var sync_interval: float = 0.1
var last_sync_time: float = 0.0
var latency: float = 0.0
var local_version: int = 0
var server_version: int = 0
var version_conflicts: Array = []
var enable_client_side_prediction: bool = true
var predicted_positions: Dictionary = {}

func _ready() -> void:
	network_manager = get_tree().root.get_node("NetworkManager")
	agent_manager = get_tree().root.get_node("AgentManager")
	space_manager = get_tree().root.get_node("SpaceManager")

	network_manager.space_updated.connect(_on_space_updated)
	network_manager.position_update.connect(_on_position_update)
	network_manager.user_joined.connect(_on_user_joined)
	network_manager.user_left.connect(_on_user_left)

	print("[SyncManager] Initialized with client-side prediction: %s" % enable_client_side_prediction)

func _process(delta: float) -> void:
	last_sync_time += delta

	if enable_client_side_prediction:
		_update_predictions(delta)

	if last_sync_time >= sync_interval:
		_send_pending_updates()
		last_sync_time = 0.0

func queue_update(user_id: String, update_type: String, data: Dictionary) -> void:
	if not pending_updates.has(user_id):
		pending_updates[user_id] = []

	pending_updates[user_id].append({
		"type": update_type,
		"data": data,
		"timestamp": Time.get_ticks_msec()
	})

func _send_pending_updates() -> void:
	if pending_updates.is_empty():
		return

	var updates_to_send = []

	for user_id in pending_updates.keys():
		var user_updates = pending_updates[user_id]
		if user_updates.is_empty():
			continue

		for update in user_updates:
			updates_to_send.append({
				"user_id": user_id,
				"type": update.get("type"),
				"data": update.get("data"),
				"timestamp": update.get("timestamp"),
				"version": local_version
			})

	if updates_to_send.is_empty():
		return

	network_manager.send_message("batch_update", {
		"updates": updates_to_send,
		"version": local_version
	})

	pending_updates.clear()

func _update_predictions(delta: float) -> void:
	for user_id in predicted_positions.keys():
		var pred = predicted_positions[user_id]

		pred["x"] += pred.get("vx", 0.0) * delta
		pred["y"] += pred.get("vy", 0.0) * delta

func set_prediction(user_id: String, x: float, y: float, vx: float = 0.0, vy: float = 0.0) -> void:
	predicted_positions[user_id] = {
		"x": x,
		"y": y,
		"vx": vx,
		"vy": vy
	}

func get_predicted_position(user_id: String) -> Vector2:
	if predicted_positions.has(user_id):
		var pred = predicted_positions[user_id]
		return Vector2(pred.get("x", 0.0), pred.get("y", 0.0))
	return Vector2.ZERO

func _on_space_updated(space_id: String, version: int, updated_at: int) -> void:
	print("[SyncManager] Space updated: v%d (local: v%d)" % [version, local_version])

	if version > local_version:
		server_version = version
		local_version = version
	elif version < local_version:
		version_conflicts.append({
			"timestamp": Time.get_ticks_msec(),
			"local": local_version,
			"server": version
		})
		print("[SyncManager] Version conflict: local v%d, server v%d" % [local_version, version])

func _on_position_update(user_id: String, x: float, y: float, direction: String) -> void:
	if enable_client_side_prediction:
		var predicted = get_predicted_position(user_id)
		var error = predicted.distance_to(Vector2(x, y))

		if error > 50.0:
			print("[SyncManager] Position correction for %s: error=%.1f" % [user_id, error])
			set_prediction(user_id, x, y)

func _on_user_joined(user_data: Dictionary) -> void:
	var user_id = user_data.get("user_id", "")
	print("[SyncManager] User joined: %s" % user_id)
	set_prediction(user_id, user_data.get("x", 0.0), user_data.get("y", 0.0))

func _on_user_left(user_id: String) -> void:
	predicted_positions.erase(user_id)
	pending_updates.erase(user_id)
	print("[SyncManager] User left: %s" % user_id)

func increment_version() -> int:
	local_version += 1
	return local_version

func set_latency(ms: float) -> void:
	latency = ms

func get_sync_state() -> Dictionary:
	return {
		"local_version": local_version,
		"server_version": server_version,
		"pending_updates": pending_updates.size(),
		"predicted_agents": predicted_positions.size(),
		"latency": latency,
		"conflicts": version_conflicts.size()
	}

func get_stats() -> Dictionary:
	var total_predictions = 0
	var total_pending = 0

	for updates in pending_updates.values():
		total_pending += updates.size()

	total_predictions = predicted_positions.size()

	return {
		"pending_updates": total_pending,
		"predicted_positions": total_predictions,
		"version_conflicts": version_conflicts.size(),
		"latency_ms": latency,
		"sync_interval": sync_interval
	}
