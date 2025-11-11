extends HBoxContainer
## Bottom status bar - connection status, coordinates, FPS

@onready var status_label = $Status
@onready var coordinates_label = $Coordinates
@onready var fps_label = $FPS

var frame_count: int = 0
var last_second: float = 0.0

func _ready() -> void:
	# Connect signals
	WebSocketClient.connected.connect(_on_websocket_connected)
	WebSocketClient.disconnected.connect(_on_websocket_disconnected)
	InputManager.mouse_position_changed.connect(_on_mouse_position_changed)

	# Set initial status
	if WebSocketClient.connected_to_backend:
		_on_websocket_connected()
	else:
		_on_websocket_disconnected()

	print("[BottomBar] Ready")

func _process(_delta: float) -> void:
	# Update FPS counter
	frame_count += 1
	var current_time = Time.get_ticks_msec() / 1000.0

	if current_time - last_second >= 1.0:
		if fps_label:
			fps_label.text = "%d FPS" % frame_count
		frame_count = 0
		last_second = current_time

func _on_websocket_connected() -> void:
	if status_label:
		status_label.text = "Connected"
		status_label.add_theme_color_override("font_color", ThemeManager.get_color("effect_positive"))
	print("[BottomBar] Connected")

func _on_websocket_disconnected() -> void:
	if status_label:
		status_label.text = "Disconnected"
		status_label.add_theme_color_override("font_color", ThemeManager.get_color("effect_negative"))
	print("[BottomBar] Disconnected")

func _on_mouse_position_changed(world_pos: Vector2) -> void:
	if coordinates_label:
		var grid_pos = CoordinateUtils.world_to_grid(world_pos)
		coordinates_label.text = "(%d, %d)" % [grid_pos.x, grid_pos.y]
