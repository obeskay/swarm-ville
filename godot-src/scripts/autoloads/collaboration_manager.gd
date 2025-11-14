extends Node
## Collaboration Manager - Gather-clone style proximity-based interaction

signal user_entered_space(user_id: String, position: Vector2i)
signal user_left_space(user_id: String)
signal user_moved(user_id: String, position: Vector2i)
signal proximity_chat_received(speaker_id: String, message: String, range: float)
signal webhook_event(event_type: String, data: Dictionary)
signal space_state_changed(new_state: Dictionary)

# Gather-clone style proximity groups
signal proximity_group_formed(group_id: String, users: Array)
signal proximity_group_disbanded(group_id: String, users: Array)
signal zone_entered(user_id: String, zone_data: Dictionary)
signal zone_exited(user_id: String, zone_data: Dictionary)

var active_users: Dictionary = {}  # user_id -> user_data
var space_id: String = "space_001"
var space_state: Dictionary = {}
var proximity_range: float = 3.0  # tiles
var webhook_enabled: bool = true
var webhook_url: String = ""

# Proximity groups (gather-clone pattern)
var proximity_groups: Dictionary = {}  # group_id -> Array[user_ids]
var user_to_group: Dictionary = {}  # user_id -> group_id
var zones: Array[Dictionary] = []  # Office zones from map
var user_current_zone: Dictionary = {}  # user_id -> zone_data

func _ready() -> void:
	print("[CollaborationManager] Initialized - Gather-clone collaboration system")
	_initialize_space()

func _initialize_space() -> void:
	"""Initialize shared space state"""
	space_state = {
		"id": space_id,
		"created_at": Time.get_unix_time_from_system(),
		"users": {},
		"messages": [],
		"objects": {},
		"area_locks": {}  # private areas
	}
	print("[CollaborationManager] Space created: %s" % space_id)

func user_join(user_id: String, user_name: String, position: Vector2i) -> void:
	"""User joins the space"""
	if active_users.has(user_id):
		print("[CollaborationManager] User already in space: %s" % user_id)
		return

	var user_data = {
		"id": user_id,
		"name": user_name,
		"position": position,
		"entered_at": Time.get_unix_time_from_system(),
		"color": Color.from_hsv(randf() * 360, 0.7, 0.9)
	}

	active_users[user_id] = user_data
	space_state["users"][user_id] = user_data

	user_entered_space.emit(user_id, position)
	_trigger_webhook("user.joined", {
		"user_id": user_id,
		"user_name": user_name,
		"position": {"x": position.x, "y": position.y},
		"total_users": active_users.size()
	})

	print("[CollaborationManager] User joined: %s at %s (Total: %d)" % [user_name, position, active_users.size()])

func user_leave(user_id: String) -> void:
	"""User leaves the space"""
	if not active_users.has(user_id):
		return

	var user_name = active_users[user_id]["name"]
	active_users.erase(user_id)
	space_state["users"].erase(user_id)

	user_left_space.emit(user_id)
	_trigger_webhook("user.left", {
		"user_id": user_id,
		"user_name": user_name,
		"total_users": active_users.size()
	})

	print("[CollaborationManager] User left: %s (Total: %d)" % [user_name, active_users.size()])

func move_user(user_id: String, new_position: Vector2i) -> void:
	"""Update user position and trigger proximity events"""
	if not active_users.has(user_id):
		return

	var user = active_users[user_id]
	var old_position = user["position"]
	user["position"] = new_position

	user_moved.emit(user_id, new_position)

	# Update proximity groups (gather-clone pattern)
	_update_proximity_groups(user_id, new_position)

	# Check zone transitions
	_check_zone_transition(user_id, new_position)

	# Check proximity for chat activation
	_check_proximity_events(user_id, new_position)

func broadcast_proximity_message(speaker_id: String, message: String) -> void:
	"""Send message only to users in proximity"""
	if not active_users.has(speaker_id):
		return

	var speaker = active_users[speaker_id]
	var speaker_pos = speaker["position"]

	# Find users in range
	var listeners = []
	for user_id in active_users:
		var user = active_users[user_id]
		var distance = speaker_pos.distance_to(user["position"])

		if distance <= proximity_range:
			listeners.append(user_id)
			proximity_chat_received.emit(speaker_id, message, distance)

	# Log message
	space_state["messages"].append({
		"speaker": speaker_id,
		"text": message,
		"timestamp": Time.get_unix_time_from_system(),
		"listeners": listeners.size()
	})

	_trigger_webhook("chat.message", {
		"speaker_id": speaker_id,
		"speaker_name": speaker["name"],
		"message": message,
		"listeners": listeners.size(),
		"position": {"x": speaker_pos.x, "y": speaker_pos.y}
	})

	print("[CollaborationManager] Chat from %s to %d users: %s" % [speaker["name"], listeners.size(), message])

func _check_proximity_events(user_id: String, position: Vector2i) -> void:
	"""Check for proximity-based interactions"""
	var user = active_users[user_id]
	var nearby_users = []

	for other_id in active_users:
		if other_id == user_id:
			continue

		var other = active_users[other_id]
		var distance = position.distance_to(other["position"])

		if distance <= proximity_range:
			nearby_users.append({
				"id": other_id,
				"name": other["name"],
				"distance": distance
			})

	if nearby_users.size() > 0:
		_trigger_webhook("proximity.users_nearby", {
			"user_id": user_id,
			"nearby_count": nearby_users.size(),
			"nearby_users": nearby_users
		})

func create_private_area(area_id: String, area_name: String, bounds: Rect2i, allowed_users: Array) -> void:
	"""Create a private area for video chat/collaboration"""
	space_state["area_locks"][area_id] = {
		"id": area_id,
		"name": area_name,
		"bounds": {"x": bounds.position.x, "y": bounds.position.y, "w": bounds.size.x, "h": bounds.size.y},
		"allowed_users": allowed_users,
		"created_at": Time.get_unix_time_from_system()
	}

	_trigger_webhook("area.created", {
		"area_id": area_id,
		"area_name": area_name,
		"allowed_users": allowed_users.size()
	})

	print("[CollaborationManager] Private area created: %s" % area_name)

func can_access_area(user_id: String, area_id: String) -> bool:
	"""Check if user can access private area"""
	if not space_state["area_locks"].has(area_id):
		return true

	var area = space_state["area_locks"][area_id]
	return user_id in area["allowed_users"]

func get_space_state() -> Dictionary:
	"""Export current space state"""
	return space_state.duplicate(true)

func _trigger_webhook(event_type: String, data: Dictionary) -> void:
	"""Trigger webhook event if enabled"""
	if not webhook_enabled or webhook_url.is_empty():
		return

	var event = {
		"space_id": space_id,
		"event_type": event_type,
		"timestamp": Time.get_unix_time_from_system(),
		"data": data
	}

	webhook_event.emit(event_type, event)

	# In real implementation, would POST to webhook_url
	print("[CollaborationManager] Webhook: %s" % event_type)

func set_webhook_url(url: String) -> void:
	"""Configure webhook endpoint"""
	webhook_url = url
	webhook_enabled = not url.is_empty()
	print("[CollaborationManager] Webhook configured: %s" % url)

func get_nearby_users(position: Vector2i) -> Array:
	"""Get all users within proximity range"""
	var nearby = []

	for user_id in active_users:
		var user = active_users[user_id]
		var distance = position.distance_to(user["position"])

		if distance <= proximity_range:
			nearby.append({
				"id": user_id,
				"name": user["name"],
				"position": user["position"],
				"distance": distance,
				"color": user["color"]
			})

	nearby.sort_custom(func(a, b): return a["distance"] < b["distance"])
	return nearby

func get_user_data(user_id: String) -> Dictionary:
	"""Get specific user data"""
	if active_users.has(user_id):
		return active_users[user_id].duplicate()
	return {}

# ========================================
# PROXIMITY GROUP MANAGEMENT (Gather-clone pattern)
# ========================================

func _update_proximity_groups(user_id: String, position: Vector2i) -> void:
	"""Update proximity groups based on 3-tile range (gather-clone algorithm)"""
	var nearby_users = _get_users_in_proximity_range(position)

	# If no nearby users, remove from current group
	if nearby_users.is_empty():
		_remove_from_proximity_group(user_id)
		return

	# Check if any nearby user is in an existing group
	var existing_group_id = ""
	for nearby in nearby_users:
		if user_to_group.has(nearby["id"]):
			existing_group_id = user_to_group[nearby["id"]]
			break

	# Join existing group or create new one
	if existing_group_id != "":
		_add_to_proximity_group(user_id, existing_group_id)
		# Add any other nearby users without group
		for nearby in nearby_users:
			if not user_to_group.has(nearby["id"]):
				_add_to_proximity_group(nearby["id"], existing_group_id)
	else:
		# Create new group with UUID-style ID
		var new_group_id = _generate_group_id()
		_add_to_proximity_group(user_id, new_group_id)
		for nearby in nearby_users:
			_add_to_proximity_group(nearby["id"], new_group_id)

		proximity_group_formed.emit(new_group_id, proximity_groups[new_group_id])

func _get_users_in_proximity_range(position: Vector2i) -> Array:
	"""Get users within 3-tile Manhattan distance (gather-clone pattern)"""
	var nearby = []

	for user_id in active_users:
		var user = active_users[user_id]
		var user_pos = user["position"]

		# Manhattan distance (|dx| + |dy|)
		var distance = abs(position.x - user_pos.x) + abs(position.y - user_pos.y)

		if distance <= proximity_range:
			nearby.append({
				"id": user_id,
				"position": user_pos,
				"distance": distance
			})

	return nearby

func _add_to_proximity_group(user_id: String, group_id: String) -> void:
	"""Add user to proximity group"""
	if user_to_group.has(user_id) and user_to_group[user_id] == group_id:
		return  # Already in this group

	# Remove from old group if exists
	if user_to_group.has(user_id):
		_remove_from_proximity_group(user_id)

	# Add to new group
	if not proximity_groups.has(group_id):
		proximity_groups[group_id] = []

	proximity_groups[group_id].append(user_id)
	user_to_group[user_id] = group_id

	print("[CollaborationManager] User %s joined proximity group %s (size: %d)" %
		[user_id, group_id, proximity_groups[group_id].size()])

func _remove_from_proximity_group(user_id: String) -> void:
	"""Remove user from their proximity group"""
	if not user_to_group.has(user_id):
		return

	var group_id = user_to_group[user_id]
	var group = proximity_groups[group_id]

	group.erase(user_id)
	user_to_group.erase(user_id)

	# Disband group if empty
	if group.is_empty():
		proximity_groups.erase(group_id)
		proximity_group_disbanded.emit(group_id, [])
		print("[CollaborationManager] Proximity group %s disbanded" % group_id)
	else:
		print("[CollaborationManager] User %s left proximity group %s (remaining: %d)" %
			[user_id, group_id, group.size()])

func _generate_group_id() -> String:
	"""Generate UUID-style group ID (gather-clone pattern)"""
	return "group_%d_%d" % [Time.get_ticks_usec(), randi()]

func get_proximity_group(user_id: String) -> Array:
	"""Get all users in same proximity group"""
	if not user_to_group.has(user_id):
		return []

	var group_id = user_to_group[user_id]
	return proximity_groups[group_id].duplicate()

# ========================================
# ZONE MANAGEMENT
# ========================================

func load_zones_from_map(map_data: Dictionary) -> void:
	"""Load office zones from generated map data"""
	if not map_data.has("zones"):
		print("[CollaborationManager] No zones in map data")
		return

	zones.clear()
	for zone in map_data["zones"]:
		var zone_data = {
			"zone_id": zone["zone_id"],
			"zone_type": zone["zone_type"],
			"name": zone.get("name", zone["zone_id"]),
			"bounds": Rect2i(
				zone["bounds"]["x"],
				zone["bounds"]["y"],
				zone["bounds"]["w"],
				zone["bounds"]["h"]
			),
			"channel_id": zone.get("channel_id", ""),
			"is_private": zone.get("is_private", false)
		}
		zones.append(zone_data)

	print("[CollaborationManager] Loaded %d zones from map" % zones.size())

func _check_zone_transition(user_id: String, position: Vector2i) -> void:
	"""Check if user entered/exited a zone"""
	var current_zone = _get_zone_at_position(position)
	var previous_zone = user_current_zone.get(user_id, null)

	# Exited previous zone
	if previous_zone != null and (current_zone == null or current_zone["zone_id"] != previous_zone["zone_id"]):
		zone_exited.emit(user_id, previous_zone)
		user_current_zone.erase(user_id)
		print("[CollaborationManager] User %s exited zone: %s" % [user_id, previous_zone["name"]])

	# Entered new zone
	if current_zone != null and (previous_zone == null or current_zone["zone_id"] != previous_zone["zone_id"]):
		user_current_zone[user_id] = current_zone
		zone_entered.emit(user_id, current_zone)
		print("[CollaborationManager] User %s entered zone: %s (%s)" %
			[user_id, current_zone["name"], current_zone["zone_type"]])

func _get_zone_at_position(position: Vector2i) -> Dictionary:
	"""Get zone at specific position (null if none)"""
	for zone in zones:
		if zone["bounds"].has_point(position):
			return zone
	return {}

func get_user_zone(user_id: String) -> Dictionary:
	"""Get current zone of user"""
	return user_current_zone.get(user_id, {})
