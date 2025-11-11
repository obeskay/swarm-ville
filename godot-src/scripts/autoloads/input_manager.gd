extends Node
## Centralized input handling

signal player_move_requested(world_position: Vector2)
signal mouse_position_changed(world_position: Vector2)
signal debug_toggled
signal settings_requested
signal wasd_pressed(direction: Vector2)
signal agent_creation_requested
signal agent_interaction_requested

var is_shift_pressed: bool = false
var is_ctrl_pressed: bool = false
var mouse_position: Vector2 = Vector2.ZERO
var selected_agent_id: String = ""
var movement_input: Vector2 = Vector2.ZERO

func _ready() -> void:
	set_process_input(true)
	set_process(true)
	print("[InputManager] Initialized with WASD support")

func _process(_delta: float) -> void:
	# Handle WASD movement every frame
	var input_vector = Vector2.ZERO
	if Input.is_action_pressed("ui_up"):    # W key
		input_vector.y -= 1
	if Input.is_action_pressed("ui_down"):  # S key (but skip if ctrl)
		input_vector.y += 1
	if Input.is_action_pressed("ui_left"):  # A key
		input_vector.x -= 1
	if Input.is_action_pressed("ui_right"): # D key
		input_vector.x += 1

	if input_vector != Vector2.ZERO:
		movement_input = input_vector.normalized()
		wasd_pressed.emit(movement_input)

func _input(event: InputEvent) -> void:
	# Track modifiers
	if event is InputEventKey:
		is_shift_pressed = Input.is_key_pressed(KEY_SHIFT)
		is_ctrl_pressed = Input.is_key_pressed(KEY_CTRL)

		# D key: toggle debug (only if not part of WASD)
		if event.keycode == KEY_D and event.pressed and is_ctrl_pressed:
			debug_toggled.emit()
			get_tree().root.set_input_as_handled()

		# E key: agent interaction
		elif event.keycode == KEY_E and event.pressed:
			agent_interaction_requested.emit()
			get_tree().root.set_input_as_handled()

		# Space: create agent
		elif event.keycode == KEY_SPACE and event.pressed:
			agent_creation_requested.emit()
			get_tree().root.set_input_as_handled()

	# Track mouse position
	if event is InputEventMouseMotion:
		mouse_position = event.position
		mouse_position_changed.emit(mouse_position)

func request_player_move(world_position: Vector2) -> void:
	player_move_requested.emit(world_position)
