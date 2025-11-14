extends Node
class_name ProximitySystem
## Detects and manages proximity relationships between agents

@export var proximity_radius: float = 4.0  # In tiles (4 tiles = 256 pixels with 64px tiles)

var tracked_entities: Dictionary = {}  # entity_id -> {node, position, type}
var proximity_map: Dictionary = {}  # entity_id -> Array[nearby_entity_ids]

signal entities_entered_proximity(entity1_id: String, entity2_id: String)
signal entities_exited_proximity(entity1_id: String, entity2_id: String)
signal proximity_group_formed(group: Array[String])
signal proximity_group_disbanded(group: Array[String])

func _ready() -> void:
	# Process proximity checks every frame
	set_process(true)

func _process(_delta: float) -> void:
	_update_proximity_map()

func register_entity(entity_id: String, entity_node: Node2D, entity_type: String = "agent") -> void:
	"""Register an entity to track for proximity"""
	tracked_entities[entity_id] = {
		"node": entity_node,
		"position": entity_node.global_position,
		"type": entity_type
	}
	proximity_map[entity_id] = []

	print("[ProximitySystem] Registered entity: %s (type: %s)" % [entity_id, entity_type])

func unregister_entity(entity_id: String) -> void:
	"""Remove entity from proximity tracking"""
	if tracked_entities.has(entity_id):
		# Notify others this entity left proximity
		if proximity_map.has(entity_id):
			for nearby_id in proximity_map[entity_id]:
				emit_signal("entities_exited_proximity", entity_id, nearby_id)

		tracked_entities.erase(entity_id)
		proximity_map.erase(entity_id)

		print("[ProximitySystem] Unregistered entity: %s" % entity_id)

func _update_proximity_map() -> void:
	"""Update proximity relationships between all tracked entities"""
	var radius_px = proximity_radius * GameConfig.TILE_SIZE

	for entity_id in tracked_entities.keys():
		var entity_data = tracked_entities[entity_id]
		if not is_instance_valid(entity_data.node):
			continue

		var current_pos = entity_data.node.global_position
		var previous_nearby = proximity_map.get(entity_id, []).duplicate()
		var current_nearby: Array[String] = []

		# Check against all other entities
		for other_id in tracked_entities.keys():
			if other_id == entity_id:
				continue

			var other_data = tracked_entities[other_id]
			if not is_instance_valid(other_data.node):
				continue

			var other_pos = other_data.node.global_position
			var distance = current_pos.distance_to(other_pos)

			if distance <= radius_px:
				current_nearby.append(other_id)

				# Check if this is a new proximity relationship
				if not previous_nearby.has(other_id):
					emit_signal("entities_entered_proximity", entity_id, other_id)
					_notify_entity_proximity_entered(entity_id, other_id)

		# Check for entities that left proximity
		for prev_id in previous_nearby:
			if not current_nearby.has(prev_id):
				emit_signal("entities_exited_proximity", entity_id, prev_id)
				_notify_entity_proximity_exited(entity_id, prev_id)

		proximity_map[entity_id] = current_nearby

		# Update entity state if it's an agent
		var agent_state = AgentRegistry.get_agent(entity_id)
		if agent_state:
			agent_state.update_proximity(current_nearby)

func _notify_entity_proximity_entered(entity_id: String, other_id: String) -> void:
	"""Notify entities they entered each other's proximity"""
	# If entities are AgentAvatars, show proximity circles
	var entity_data = tracked_entities.get(entity_id)
	var other_data = tracked_entities.get(other_id)

	if entity_data and entity_data.node.has_method("show_proximity_circle"):
		entity_data.node.show_proximity_circle(true)

	if other_data and other_data.node.has_method("show_proximity_circle"):
		other_data.node.show_proximity_circle(true)

func _notify_entity_proximity_exited(entity_id: String, other_id: String) -> void:
	"""Notify entities they exited each other's proximity"""
	# Check if entity has any other nearby entities
	var still_has_nearby = proximity_map.get(entity_id, []).size() > 0
	var other_still_has_nearby = proximity_map.get(other_id, []).size() > 0

	var entity_data = tracked_entities.get(entity_id)
	var other_data = tracked_entities.get(other_id)

	if entity_data and not still_has_nearby and entity_data.node.has_method("show_proximity_circle"):
		entity_data.node.show_proximity_circle(false)

	if other_data and not other_still_has_nearby and other_data.node.has_method("show_proximity_circle"):
		other_data.node.show_proximity_circle(false)

func get_nearby_entities(entity_id: String) -> Array[String]:
	"""Get list of entities near the given entity"""
	return proximity_map.get(entity_id, []).duplicate()

func are_entities_nearby(entity1_id: String, entity2_id: String) -> bool:
	"""Check if two entities are in proximity"""
	var nearby = proximity_map.get(entity1_id, [])
	return nearby.has(entity2_id)

func get_proximity_groups() -> Array[Array]:
	"""Get all groups of entities in proximity (clusters)"""
	var groups: Array[Array] = []
	var processed: Array[String] = []

	for entity_id in proximity_map.keys():
		if processed.has(entity_id):
			continue

		var nearby = proximity_map.get(entity_id, [])
		if nearby.is_empty():
			continue

		# Build cluster
		var cluster: Array[String] = [entity_id]
		cluster.append_array(nearby)

		# Mark all as processed
		processed.append(entity_id)
		for nearby_id in nearby:
			if not processed.has(nearby_id):
				processed.append(nearby_id)

		groups.append(cluster)

	return groups

func set_proximity_radius(radius_in_tiles: float) -> void:
	"""Change proximity detection radius"""
	proximity_radius = radius_in_tiles
	print("[ProximitySystem] Proximity radius set to %.1f tiles" % radius_in_tiles)
