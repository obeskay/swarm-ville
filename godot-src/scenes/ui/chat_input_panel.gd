extends Control
## Chat input panel for in-world messaging

signal message_sent(text: String)

@onready var input_field: TextEdit = $VBoxContainer/ChatInput
@onready var send_button: Button = $VBoxContainer/SendButton

func _ready() -> void:
	# Connect button signal
	send_button.pressed.connect(_on_send_pressed)

	# Connect TextEdit input (send on Enter)
	input_field.text_changed.connect(_on_input_changed)

	print("[ChatInputPanel] Chat input panel ready")

func _on_send_pressed() -> void:
	"""Handle send button press"""
	var text = input_field.text.strip_edges()

	if text.is_empty():
		print("[ChatInputPanel] Empty message, ignoring")
		return

	# Emit signal with message
	message_sent.emit(text)

	# Clear input field
	input_field.text = ""
	input_field.grab_focus()

	print("[ChatInputPanel] Message sent: %s" % text)

func _on_input_changed() -> void:
	"""Called when input text changes"""
	# Could add typing indicator here later
	pass

func _process(_delta: float) -> void:
	# Handle Enter key to send
	if Input.is_action_just_pressed("ui_accept"):
		if input_field.has_focus():
			_on_send_pressed()
