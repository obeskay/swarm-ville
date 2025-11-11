extends HBoxContainer
## Top toolbar - theme toggle and space selector

@onready var theme_toggle = $"../../../TopBar/ThemeToggle"

func _ready() -> void:
	if theme_toggle:
		theme_toggle.pressed.connect(_on_theme_toggle_pressed)
	ThemeManager.theme_changed.connect(_on_theme_changed)

func _on_theme_toggle_pressed() -> void:
	ThemeManager.toggle_theme()

func _on_theme_changed(new_theme: String) -> void:
	print("[TopBar] Theme changed to %s" % new_theme)
