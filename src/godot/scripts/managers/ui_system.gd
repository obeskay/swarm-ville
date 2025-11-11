extends CanvasLayer
## UI System - Manages game UI

var main_scene: Node2D
var network_manager: Node
var space_manager: Node
var chat_panel: Control
var inventory_panel: Control
var debug_panel: Control
var open_panels: Array = []
var ui_visible: bool = true

func _ready() -> void:
	main_scene = get_tree().root.get_node("Main")
	network_manager = get_tree().root.get_node("NetworkManager")
	space_manager = get_tree().root.get_node("SpaceManager")

	_setup_ui_panels()

	network_manager.chat_message.connect(_on_chat_message)

	print("[UISystem] Initialized")

func _setup_ui_panels() -> void:
	var ui_node = main_scene.get_node_or_null("UI")
	if not ui_node:
		push_error("[UISystem] UI node not found")
		return

	# Create debug panel
	debug_panel = PanelContainer.new()
	debug_panel.name = "DebugPanel"
	debug_panel.custom_minimum_size = Vector2(300, 150)
	debug_panel.anchor_left = 0.0
	debug_panel.anchor_top = 0.85
	debug_panel.anchor_right = 0.3
	debug_panel.anchor_bottom = 1.0

	var vbox = VBoxContainer.new()
	debug_panel.add_child(vbox)

	var title = Label.new()
	title.text = "Debug"
	title.add_theme_font_size_override("font_size", 14)
	vbox.add_child(title)

	var info_label = TextEdit.new()
	info_label.name = "DebugInfo"
	info_label.read_only = true
	info_label.custom_minimum_size = Vector2(280, 120)
	vbox.add_child(info_label)

	ui_node.add_child(debug_panel)

func toggle_ui() -> void:
	ui_visible = !ui_visible
	if ui_visible:
		show()
	else:
		hide()

func update_debug_info(info: Dictionary) -> void:
	if not debug_panel:
		return

	var debug_label = debug_panel.get_node_or_null("VBoxContainer/DebugInfo")
	if debug_label:
		var text = ""
		for key in info.keys():
			text += "%s: %s\n" % [key, info[key]]
		debug_label.text = text

func _on_chat_message(user_id: String, name: String, message: String) -> void:
	print("[UISystem] Chat from %s: %s" % [name, message])

func get_ui_state() -> Dictionary:
	return {
		"open_panels": open_panels.duplicate(),
		"ui_visible": ui_visible
	}
