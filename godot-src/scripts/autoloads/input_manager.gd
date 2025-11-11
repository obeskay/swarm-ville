extends Node
## Centralized input handling

signal player_move_requested(world_position: Vector2)
signal mouse_position_changed(world_position: Vector2)
signal debug_toggled
signal settings_requested

var is_shift_pressed: bool = false
var is_ctrl_pressed: bool = false
var mouse_position: Vector2 = Vector2.ZERO
var selected_agent_id: String = ""

func _ready() -> void:
	set_process_input(true)
	print("[InputManager] Initialized")

func _input(event: InputEvent) -> void:
	# Track modifiers
	if event is InputEventKey:
		is_shift_pressed = Input.is_key_pressed(KEY_SHIFT)
		is_ctrl_pressed = Input.is_key_pressed(KEY_CTRL)

		if event.keycode == KEY_D and event.pressed:
			debug_toggled.emit()
			get_tree().root.set_input_as_handled()
		elif event.keycode == KEY_S and event.pressed:
			settings_requested.emit()
			get_tree().root.set_input_as_handled()

	# Track mouse position
	if event is InputEventMouseMotion:
		mouse_position = event.position
		mouse_position_changed.emit(mouse_position)

func request_player_move(world_position: Vector2) -> void:
	player_move_requested.emit(world_position)
