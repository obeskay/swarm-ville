extends Node
## Input Handler - Manages keyboard and mouse input

var main_scene: Node2D
var network_manager: Node
var agent_manager: Node
var tilemap_manager: Node
var input_enabled: bool = true
var movement_direction: Vector2 = Vector2.ZERO
var mouse_pos: Vector2 = Vector2.ZERO
var selected_tile: Vector2i = Vector2i.ZERO
var movement_speed: float = 100.0
var action_cooldown: float = 0.5
var last_action_time: float = 0.0

func _ready() -> void:
	main_scene = get_parent()
	network_manager = get_tree().root.get_node("NetworkManager")
	agent_manager = get_tree().root.get_node("AgentManager")

	if main_scene.has_node("TileMapManager"):
		tilemap_manager = main_scene.get_node("TileMapManager")

	print("[InputHandler] Initialized")

func _process(delta: float) -> void:
	if not input_enabled:
		return

	_update_movement_input()

	if movement_direction != Vector2.ZERO:
		_send_movement_update()

	last_action_time -= delta

func _input(event: InputEvent) -> void:
	if not input_enabled:
		return

	if event is InputEventMouseButton:
		_handle_mouse_click(event)
	elif event is InputEventMouseMotion:
		_handle_mouse_motion(event)

	if event is InputEventKey and event.pressed:
		_handle_key_press(event)

func _update_movement_input() -> void:
	movement_direction = Vector2.ZERO

	if Input.is_action_pressed("ui_right"):
		movement_direction.x += 1
	if Input.is_action_pressed("ui_left"):
		movement_direction.x -= 1
	if Input.is_action_pressed("ui_down"):
		movement_direction.y += 1
	if Input.is_action_pressed("ui_up"):
		movement_direction.y -= 1

	if movement_direction != Vector2.ZERO:
		movement_direction = movement_direction.normalized()

func _send_movement_update() -> void:
	var direction_str = "idle"

	if movement_direction.x > 0:
		direction_str = "right"
	elif movement_direction.x < 0:
		direction_str = "left"
	elif movement_direction.y > 0:
		direction_str = "down"
	elif movement_direction.y < 0:
		direction_str = "up"

	network_manager.send_message("update_position", {
		"direction": direction_str,
		"x": agent_manager.get_player_position().x,
		"y": agent_manager.get_player_position().y
	})

func _handle_mouse_click(event: InputEventMouseButton) -> void:
	if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		_handle_left_click(event.position)

func _handle_mouse_motion(event: InputEventMouseMotion) -> void:
	mouse_pos = event.position

	if tilemap_manager:
		var camera = main_scene.get_node_or_null("Camera2D")
		if camera:
			var world_pos = camera.get_global_mouse_position()
			selected_tile = tilemap_manager.world_to_tile_pos(world_pos)

func _handle_key_press(event: InputEventKey) -> void:
	match event.keycode:
		KEY_C:
			print("[InputHandler] Chat")
		KEY_I:
			print("[InputHandler] Inventory")
		KEY_M:
			print("[InputHandler] Map")
		KEY_E:
			_interact_with_tile()
		KEY_ESCAPE:
			print("[InputHandler] Close UI")

func _handle_left_click(click_pos: Vector2) -> void:
	var camera = main_scene.get_node_or_null("Camera2D")
	if not camera:
		return

	var world_pos = camera.get_global_mouse_position()
	var tile_pos = tilemap_manager.world_to_tile_pos(world_pos) if tilemap_manager else Vector2i.ZERO

	if tilemap_manager and tilemap_manager.is_walkable(tile_pos.x, tile_pos.y):
		_move_to_tile(tile_pos)

func _move_to_tile(tile_pos: Vector2i) -> void:
	if not agent_manager:
		return

	print("[InputHandler] Moving to tile: %s" % [tile_pos])
	network_manager.send_message("move_to_tile", {
		"x": tile_pos.x,
		"y": tile_pos.y
	})

func _interact_with_tile() -> void:
	if not tilemap_manager:
		return

	var tile = tilemap_manager.get_tile(selected_tile.x, selected_tile.y)
	print("[InputHandler] Interacting with tile: %s" % [selected_tile])

	network_manager.send_message("interact", {
		"tile_x": selected_tile.x,
		"tile_y": selected_tile.y,
		"tile_data": tile
	})

func set_input_enabled(enabled: bool) -> void:
	input_enabled = enabled
	print("[InputHandler] Input enabled: %s" % enabled)

func get_input_state() -> Dictionary:
	return {
		"movement_direction": movement_direction,
		"selected_tile": selected_tile,
		"mouse_pos": mouse_pos,
		"input_enabled": input_enabled
	}
