extends Node
## State synchronization manager - handles version tracking, position prediction, and conflict resolution

signal position_predicted(agent_id: String, predicted_pos: Vector2)
signal position_reconciled(agent_id: String, final_pos: Vector2)
signal space_version_updated(new_version: int)

var space_version: int = 0
var pending_updates: Dictionary = {}  # agent_id → {position, direction, timestamp}
var predicted_positions: Dictionary = {}  # agent_id → {pos, velocity, time}
var sync_interval: float = 0.1
var last_sync_time: float = 0.0

func _ready() -> void:
	WebSocketClient.connected.connect(_on_connected)
	WebSocketClient.space_updated.connect(_on_space_updated)
	print("[SyncManager] Initialized")

func _process(delta: float) -> void:
	# Update position predictions
	for agent_id in predicted_positions.keys():
		var pred = predicted_positions[agent_id]
		pred["time"] += delta
		# Simple linear extrapolation
		var new_pos = pred["pos"] + pred["velocity"] * delta
		predicted_positions[agent_id]["predicted_pos"] = new_pos

	# Send batched updates every sync_interval
	last_sync_time += delta
	if last_sync_time >= sync_interval and not pending_updates.is_empty():
		_flush_pending_updates()
		last_sync_time = 0.0

func predict_position(agent_id: String, current_pos: Vector2, velocity: Vector2) -> void:
	"""Client-side position prediction for smooth movement"""
	predicted_positions[agent_id] = {
		"pos": current_pos,
		"velocity": velocity,
		"time": 0.0,
		"predicted_pos": current_pos
	}

func queue_position_update(agent_id: String, grid_pos: Vector2i, direction: String) -> void:
	"""Queue a position update to be sent in batch"""
	pending_updates[agent_id] = {
		"position": grid_pos,
		"direction": direction,
		"timestamp": Time.get_ticks_msec()
	}

func _flush_pending_updates() -> void:
	"""Send all pending updates in a single batch message"""
	if pending_updates.is_empty():
		return

	var batch = {
		"type": "batch_update",
		"updates": [],
		"version": space_version
	}

	for agent_id in pending_updates.keys():
		var update = pending_updates[agent_id]
		batch["updates"].append({
			"agent_id": agent_id,
			"x": update["position"].x,
			"y": update["position"].y,
			"direction": update["direction"]
		})

	WebSocketClient.send_action("batch_update", batch)
	pending_updates.clear()
	print("[SyncManager] Flushed %d updates" % batch["updates"].size())

func reconcile_position(agent_id: String, server_pos: Vector2i, server_version: int) -> void:
	"""Reconcile client prediction with server position"""
	if server_version > space_version:
		space_version = server_version
		space_version_updated.emit(space_version)

	# If we have a prediction, compare and correct
	if agent_id in predicted_positions:
		var pred = predicted_positions[agent_id]
		var server_pixel_pos = server_pos * GameConfig.TILE_SIZE
		var error = pred["predicted_pos"].distance_to(server_pixel_pos)

		if error > GameConfig.TILE_SIZE:  # Large error = conflict
			print("[SyncManager] Position conflict for %s, error: %.1f" % [agent_id, error])
			# Server wins - snap to server position
			position_reconciled.emit(agent_id, server_pixel_pos)
		else:
			# Minor difference - smooth correction
			position_reconciled.emit(agent_id, server_pixel_pos)

	predicted_positions.erase(agent_id)

func get_predicted_position(agent_id: String) -> Vector2:
	"""Get current predicted position for an agent"""
	if agent_id in predicted_positions:
		return predicted_positions[agent_id]["predicted_pos"]
	return Vector2.ZERO

func _on_connected() -> void:
	print("[SyncManager] Backend connected")

func _on_space_updated(space_data: Dictionary) -> void:
	var new_version = space_data.get("version", 0)
	if new_version > space_version:
		space_version = new_version
		space_version_updated.emit(new_version)
		print("[SyncManager] Space version updated to %d" % new_version)
