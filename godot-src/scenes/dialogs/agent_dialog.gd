extends Control
## Agent creation dialog

signal agent_created(agent_data: Dictionary)
signal dialog_closed

var dialog: AcceptDialog
var name_edit: LineEdit
var role_select: OptionButton
var model_select: OptionButton

var is_visible_flag: bool = false

func _ready() -> void:
	# Create dialog if not already created
	if dialog == null:
		_create_dialog()
	print("[AgentDialog] Ready")

func _create_dialog() -> void:
	dialog = AcceptDialog.new()
	dialog.title = "Create Agent"
	dialog.dialog_hide_on_ok = false
	add_child(dialog)

	# Create content container
	var vbox = VBoxContainer.new()
	dialog.add_child(vbox)

	# Name input
	var name_label = Label.new()
	name_label.text = "Agent Name:"
	vbox.add_child(name_label)

	name_edit = LineEdit.new()
	name_edit.placeholder_text = "Enter agent name..."
	vbox.add_child(name_edit)

	# Role selector
	var role_label = Label.new()
	role_label.text = "Role:"
	vbox.add_child(role_label)

	role_select = OptionButton.new()
	role_select.add_item("Researcher", 0)
	role_select.add_item("Coder", 1)
	role_select.add_item("Designer", 2)
	role_select.add_item("Manager", 3)
	vbox.add_child(role_select)

	# Model selector
	var model_label = Label.new()
	model_label.text = "Model:"
	vbox.add_child(model_label)

	model_select = OptionButton.new()
	model_select.add_item("Claude 3.5 Sonnet", 0)
	model_select.add_item("Claude 3 Opus", 1)
	model_select.add_item("Claude 3 Haiku", 2)
	vbox.add_child(model_select)

	# Connect signals
	dialog.confirmed.connect(_on_create_confirmed)
	dialog.canceled.connect(_on_dialog_canceled)
	dialog.visibility_changed.connect(_on_visibility_changed)

func show_dialog() -> void:
	if dialog:
		dialog.popup_centered_ratio(0.3)
		name_edit.grab_focus()
		is_visible_flag = true

func hide_dialog() -> void:
	if dialog:
		dialog.hide()
		is_visible_flag = false

func _on_create_confirmed() -> void:
	var agent_name = name_edit.text.strip_edges()
	if agent_name.is_empty():
		# Show error
		print("[AgentDialog] Name cannot be empty")
		return

	var agent_data = {
		"name": agent_name,
		"role": role_select.get_item_text(role_select.selected),
		"model": model_select.get_item_text(model_select.selected),
		"position": {"x": 5, "y": 5},
		"state": "idle"
	}

	# Send to backend
	WebSocketClient.send_action("agent_create", agent_data)

	# Clear form
	name_edit.clear()
	hide_dialog()
	agent_created.emit(agent_data)
	print("[AgentDialog] Agent created: %s" % agent_name)

func _on_dialog_canceled() -> void:
	hide_dialog()
	dialog_closed.emit()

func _on_visibility_changed() -> void:
	is_visible_flag = dialog.visible if dialog else false
