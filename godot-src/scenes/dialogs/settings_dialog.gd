extends Control
## Settings dialog for game configuration

signal settings_closed

var dialog: AcceptDialog
var theme_select: OptionButton
var ui_scale_slider: HSlider
var debug_checkbox: CheckButton

var settings_file: String = "user://swarmville_settings.cfg"
var config: ConfigFile = ConfigFile.new()

func _ready() -> void:
	if dialog == null:
		_create_dialog()
	_load_settings()
	print("[SettingsDialog] Ready")

func _create_dialog() -> void:
	dialog = AcceptDialog.new()
	dialog.title = "Settings"
	dialog.dialog_hide_on_ok = false
	add_child(dialog)

	# Create content
	var vbox = VBoxContainer.new()
	dialog.add_child(vbox)

	# Theme setting
	var theme_label = Label.new()
	theme_label.text = "Theme:"
	vbox.add_child(theme_label)

	theme_select = OptionButton.new()
	theme_select.add_item("Auto Detect", 0)
	theme_select.add_item("Light", 1)
	theme_select.add_item("Dark", 2)
	theme_select.item_selected.connect(_on_theme_changed)
	vbox.add_child(theme_select)

	# UI Scale
	var scale_label = Label.new()
	scale_label.text = "UI Scale:"
	vbox.add_child(scale_label)

	ui_scale_slider = HSlider.new()
	ui_scale_slider.min_value = 0.8
	ui_scale_slider.max_value = 1.5
	ui_scale_slider.value = 1.0
	ui_scale_slider.step = 0.1
	ui_scale_slider.value_changed.connect(_on_scale_changed)
	vbox.add_child(ui_scale_slider)

	# Debug mode
	debug_checkbox = CheckButton.new()
	debug_checkbox.text = "Debug Mode"
	debug_checkbox.toggled.connect(_on_debug_toggled)
	vbox.add_child(debug_checkbox)

	# Connect dialog signals
	dialog.confirmed.connect(_on_dialog_confirmed)
	dialog.canceled.connect(_on_dialog_canceled)

func show_dialog() -> void:
	if dialog:
		dialog.popup_centered_ratio(0.3)

func hide_dialog() -> void:
	if dialog:
		dialog.hide()

func _on_theme_changed(index: int) -> void:
	match index:
		0:  # Auto
			ThemeManager.detect_theme()
		1:  # Light
			ThemeManager.apply_theme("light")
		2:  # Dark
			ThemeManager.apply_theme("dark")
	_save_settings()

func _on_scale_changed(_value: float) -> void:
	_save_settings()

func _on_debug_toggled(_toggled: bool) -> void:
	_save_settings()

func _on_dialog_confirmed() -> void:
	hide_dialog()

func _on_dialog_canceled() -> void:
	_load_settings()
	hide_dialog()
	settings_closed.emit()

func _save_settings() -> void:
	config.set_value("ui", "scale", ui_scale_slider.value)
	config.set_value("ui", "debug", debug_checkbox.button_pressed)
	config.set_value("theme", "mode", theme_select.selected)
	config.save(settings_file)
	print("[SettingsDialog] Settings saved")

func _load_settings() -> void:
	if config.load(settings_file) != OK:
		# Use defaults
		ui_scale_slider.value = 1.0
		debug_checkbox.button_pressed = false
		theme_select.selected = 0
		return

	ui_scale_slider.value = config.get_value("ui", "scale", 1.0)
	debug_checkbox.button_pressed = config.get_value("ui", "debug", false)
	theme_select.selected = config.get_value("theme", "mode", 0)
	print("[SettingsDialog] Settings loaded")
