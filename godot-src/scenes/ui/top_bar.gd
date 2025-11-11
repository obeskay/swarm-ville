extends HBoxContainer
## Top toolbar - theme toggle, space selector, and settings

@onready var title = $Title
@onready var theme_toggle = $ThemeToggle

var space_selector: OptionButton
var settings_button: Button

func _ready() -> void:
	# Create space selector if not in scene
	if not has_node("SpaceSelector"):
		space_selector = OptionButton.new()
		space_selector.name = "SpaceSelector"
		space_selector.item_selected.connect(_on_space_selected)
		add_child(space_selector)
		move_child(space_selector, 1)  # After title
	else:
		space_selector = $SpaceSelector

	# Create settings button if not in scene
	if not has_node("SettingsButton"):
		settings_button = Button.new()
		settings_button.name = "SettingsButton"
		settings_button.text = "⚙ Settings"
		settings_button.pressed.connect(_on_settings_pressed)
		add_child(settings_button)
	else:
		settings_button = $SettingsButton

	# Connect signals
	if theme_toggle:
		theme_toggle.pressed.connect(_on_theme_toggle_pressed)
	ThemeManager.theme_changed.connect(_on_theme_changed)
	WebSocketClient.connected.connect(_on_websocket_connected)
	SpaceManager.space_loaded.connect(_on_space_loaded)

	# Populate space selector
	_populate_spaces()

	print("[TopBar] Ready")

func _populate_spaces() -> void:
	if not space_selector:
		return

	space_selector.clear()
	var spaces = SpaceManager.get_spaces()
	for space in spaces:
		var space_id = space.get("id", "")
		var space_name = space.get("name", space_id)
		space_selector.add_item(space_name, 0)

	# Add current space if not in list
	var current_space = SpaceManager.get_current_space()
	if not current_space.is_empty():
		var current_name = current_space.get("name", "Current Space")
		if space_selector.item_count == 0:
			space_selector.add_item(current_name, 0)

func _on_space_selected(index: int) -> void:
	# Handle space selection (future: load different space)
	print("[TopBar] Space selected: %d" % index)

func _on_theme_toggle_pressed() -> void:
	ThemeManager.toggle_theme()

func _on_theme_changed(new_theme: String) -> void:
	print("[TopBar] Theme changed to %s" % new_theme)

func _on_settings_pressed() -> void:
	print("[TopBar] Settings requested")
	# Future: open settings dialog

func _on_websocket_connected() -> void:
	_populate_spaces()

func _on_space_loaded(_space_id: String) -> void:
	_populate_spaces()
