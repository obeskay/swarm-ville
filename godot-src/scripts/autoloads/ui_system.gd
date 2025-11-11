extends Node
## UI system - manages all UI panels and their interactions

signal chat_message_sent(message: String)
signal inventory_item_selected(slot_index: int)
signal settings_changed(setting: String, value)

var ui_panels: Dictionary = {}  # panel_name → panel_node
var active_panels: Array[String] = []
var input_focus_target: Node = null

func _ready() -> void:
	InputManager.debug_toggled.connect(_on_debug_toggle)
	InputManager.settings_requested.connect(_on_settings_requested)
	WebSocketClient.message_received.connect(_on_chat_message_received)
	print("[UISystem] Initialized")

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed:
		match event.keycode:
			KEY_C:
				toggle_panel("chat")
				get_tree().root.set_input_as_handled()
			KEY_I:
				toggle_panel("inventory")
				get_tree().root.set_input_as_handled()
			KEY_M:
				toggle_panel("map")
				get_tree().root.set_input_as_handled()
			KEY_E:
				_on_interact_requested()
				get_tree().root.set_input_as_handled()
			KEY_ESCAPE:
				close_all_panels()
				get_tree().root.set_input_as_handled()

func register_panel(panel_name: String, panel_node: Node) -> void:
	"""Register a UI panel"""
	ui_panels[panel_name] = panel_node
	print("[UISystem] Registered panel: %s" % panel_name)

func toggle_panel(panel_name: String) -> void:
	"""Toggle panel visibility"""
	if panel_name not in ui_panels:
		print("[UISystem] Panel not found: %s" % panel_name)
		return

	var panel = ui_panels[panel_name]
	panel.visible = not panel.visible

	if panel.visible:
		if panel_name not in active_panels:
			active_panels.append(panel_name)
		print("[UISystem] Opened panel: %s" % panel_name)
	else:
		active_panels.erase(panel_name)
		print("[UISystem] Closed panel: %s" % panel_name)

func close_all_panels() -> void:
	"""Close all open panels"""
	for panel_name in active_panels.duplicate():
		toggle_panel(panel_name)
	print("[UISystem] Closed all panels")

func add_chat_message(sender: String, message: String, color: Color = Color.WHITE) -> void:
	"""Add message to chat panel"""
	if "chat" not in ui_panels:
		return

	var chat_panel = ui_panels["chat"]
	if chat_panel.has_method("add_message"):
		chat_panel.add_message(sender, message, color)

func send_chat_message(message: String) -> void:
	"""Send chat message via WebSocket"""
	if message.is_empty():
		return

	WebSocketClient.send_action("chat_message", {
		"message": message
	})
	chat_message_sent.emit(message)

func update_status(health: int, max_health: int, mana: int = 0, max_mana: int = 0) -> void:
	"""Update status panel"""
	if "status" not in ui_panels:
		return

	var status_panel = ui_panels["status"]
	if status_panel.has_method("update_status"):
		status_panel.update_status(health, max_health, mana, max_mana)

func _on_debug_toggle() -> void:
	toggle_panel("debug")

func _on_settings_requested() -> void:
	toggle_panel("settings")

func _on_chat_message_received(data: Dictionary) -> void:
	var sender = data.get("sender", "Unknown")
	var message = data.get("message", "")
	add_chat_message(sender, message)

func _on_interact_requested() -> void:
	# Send interact action to server
	WebSocketClient.send_action("interact", {
		"tile_x": 0,
		"tile_y": 0
	})
	print("[UISystem] Interact requested")
