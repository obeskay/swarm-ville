extends PanelContainer
## Chat panel - displays messages and handles input

@onready var messages_container = VBoxContainer.new()
@onready var scroll_container = ScrollContainer.new()
@onready var input_field = LineEdit.new()

var max_messages: int = 100

func _ready() -> void:
	# Setup scroll container
	scroll_container.custom_minimum_size = Vector2(300, 300)
	add_child(scroll_container)

	# Setup messages container
	messages_container.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll_container.add_child(messages_container)

	# Setup input field
	input_field.placeholder_text = "Type message and press Enter..."
	input_field.text_submitted.connect(_on_text_submitted)
	add_child(input_field)

	# Register with UISystem
	UISystem.register_panel("chat", self)

	# Connect to WebSocket
	WebSocketClient.chat_message.connect(_on_chat_message_received)

	print("[ChatPanel] Ready")

func add_message(sender: String, message: String, color: Color = Color.WHITE) -> void:
	"""Add a message to the chat"""
	var label = Label.new()
	label.text = "%s: %s" % [sender, message]
	label.add_theme_color_override("font_color", color)
	label.custom_minimum_size.x = 280
	label.autowrap_mode = TextServer.AUTOWRAP_WORD
	messages_container.add_child(label)

	# Keep only last N messages
	if messages_container.get_child_count() > max_messages:
		messages_container.get_child(0).queue_free()

	# Auto-scroll to bottom
	await get_tree().process_frame
	if scroll_container:
		scroll_container.scroll_vertical = int(scroll_container.get_v_scroll_bar().max_value)

func _on_text_submitted(text: String) -> void:
	"""Send message when user presses Enter"""
	if text.is_empty():
		return

	UISystem.send_chat_message(text)
	input_field.clear()
	input_field.grab_focus()

func _on_chat_message_received(sender: String, message: String) -> void:
	"""Handle incoming chat messages"""
	add_message(sender, message)
