extends Node
## Global theme color management - replaces useGameColors hook

signal theme_changed(new_theme: String)

var current_theme: String = "light"
var current_colors: Dictionary = {}

var light_mode_colors: Dictionary = {
	# Core colors (from Tailwind)
	"background": Color(0.961, 0.961, 0.941),  # f5f5f0
	"foreground": Color(0.227, 0.227, 0.227),  # 3a3a3a
	"card": Color(0.961, 0.961, 0.941),  # f5f5f0
	"card_foreground": Color(0.227, 0.227, 0.227),  # 3a3a3a
	"popover": Color(1.0, 1.0, 1.0),  # ffffff
	"popover_foreground": Color(0.267, 0.229, 0.204),  # 443a34

	# Semantic colors
	"primary": Color(0.420, 0.267, 0.137),  # 6b4423
	"primary_foreground": Color(1.0, 1.0, 1.0),  # ffffff
	"secondary": Color(0.925, 0.616, 0.435),  # ec9d6f
	"secondary_foreground": Color(0.435, 0.314, 0.227),  # 6f503a
	"muted": Color(0.929, 0.910, 0.902),  # ede8e6
	"muted_foreground": Color(0.604, 0.561, 0.541),  # 9a8f8a
	"accent": Color(0.925, 0.616, 0.435),  # ec9d6f
	"accent_foreground": Color(0.267, 0.229, 0.204),  # 443a34
	"destructive": Color(0.227, 0.227, 0.227),  # 3a3a3a (dark for light mode)
	"destructive_foreground": Color(1.0, 1.0, 1.0),  # ffffff
	"border": Color(0.890, 0.867, 0.851),  # e3ddd9
	"input": Color(0.760, 0.729, 0.710),  # c2bab5
	"ring": Color(0.420, 0.267, 0.137),  # 6b4423
	"sidebar": Color(0.961, 0.961, 0.941),  # f5f5f0
	"sidebar_foreground": Color(0.267, 0.229, 0.204),  # 443a34

	# Chart colors
	"chart1": Color(0.545, 0.436, 0.278),  # 8b6f47
	"chart2": Color(0.604, 0.561, 0.541),  # 9a8f8a
	"chart3": Color(0.647, 0.584, 0.533),  # a59688
	"chart4": Color(0.667, 0.533, 0.400),  # aa8866
	"chart5": Color(0.545, 0.647, 0.553),  # 8ba58d

	# Game element colors
	"player_character": Color(0.0, 1.0, 0.0),  # Bright green
	"player": Color(0.0, 1.0, 0.0),  # Bright green
	"agent_friendly": Color(0.0, 1.0, 0.0),  # Bright green
	"agent_neutral": Color(1.0, 1.0, 0.0),  # Yellow
	"agent_hostile": Color(1.0, 0.0, 0.0),  # Bright red
	"agent_enemy": Color(1.0, 0.0, 0.0),  # Bright red
	"tile_grass": Color(0.545, 0.436, 0.278),  # chart1
	"tile_dirt": Color(0.667, 0.533, 0.400),  # chart4
	"tile_water": Color(0.604, 0.561, 0.541),  # chart2
	"tile_obstacle": Color(0.890, 0.867, 0.851),  # border
	"tile_interactive": Color(0.925, 0.616, 0.435),  # accent
	"tile_blocked": Color(0.227, 0.227, 0.227),  # destructive
	"selection": Color(0.420, 0.267, 0.137),  # ring
	"hover": Color(0.925, 0.616, 0.435),  # accent
	"grid": Color(0.667, 0.667, 0.667),  # muted gray
	"effect_positive": Color(0.420, 0.267, 0.137),  # primary
	"effect_negative": Color(0.227, 0.227, 0.227),  # destructive
	"effect_neutral": Color(0.929, 0.910, 0.902),  # muted
}

var dark_mode_colors: Dictionary = {
	# Core colors (dark theme)
	"background": Color(0.267, 0.239, 0.227),  # 443d3a
	"foreground": Color(0.961, 0.961, 0.961),  # f5f5f5
	"card": Color(0.302, 0.275, 0.263),  # 4d4644
	"card_foreground": Color(0.961, 0.961, 0.961),  # f5f5f5
	"popover": Color(0.233, 0.204, 0.192),  # 3b3430
	"popover_foreground": Color(0.961, 0.961, 0.961),  # f5f5f5

	# Semantic colors
	"primary": Color(0.831, 0.647, 0.435),  # d4a574
	"primary_foreground": Color(0.227, 0.227, 0.227),  # 3a3a3a
	"secondary": Color(0.671, 0.667, 0.435),  # ababab (grayed)
	"secondary_foreground": Color(0.961, 0.961, 0.961),  # f5f5f5
	"muted": Color(0.451, 0.416, 0.404),  # 736a67
	"muted_foreground": Color(0.761, 0.741, 0.733),  # c2bcbb
	"accent": Color(0.831, 0.647, 0.435),  # d4a574
	"accent_foreground": Color(0.227, 0.227, 0.227),  # 3a3a3a
	"destructive": Color(1.0, 0.267, 0.267),  # ff4444
	"destructive_foreground": Color(0.961, 0.961, 0.961),  # f5f5f5
	"border": Color(0.451, 0.416, 0.404),  # 736a67
	"input": Color(0.373, 0.341, 0.329),  # 5f5753
	"ring": Color(0.831, 0.647, 0.435),  # d4a574
	"sidebar": Color(0.233, 0.204, 0.192),  # 3b3430
	"sidebar_foreground": Color(0.961, 0.961, 0.961),  # f5f5f5

	# Chart colors (inverted for dark)
	"chart1": Color(0.804, 0.694, 0.537),  # cdal88
	"chart2": Color(0.757, 0.714, 0.702),  # c1b6b3
	"chart3": Color(0.824, 0.745, 0.694),  # d2bebpb
	"chart4": Color(0.855, 0.702, 0.537),  # dab38a
	"chart5": Color(0.686, 0.827, 0.698),  # afb3b2

	# Game element colors (dark)
	"player_character": Color(0.0, 1.0, 0.0),  # Bright green
	"player": Color(0.0, 1.0, 0.0),  # Bright green
	"agent_friendly": Color(0.0, 1.0, 0.0),  # Bright green
	"agent_neutral": Color(1.0, 1.0, 0.0),  # Yellow
	"agent_hostile": Color(1.0, 0.0, 0.0),  # Bright red
	"agent_enemy": Color(1.0, 0.0, 0.0),  # Bright red
	"tile_grass": Color(0.804, 0.694, 0.537),  # chart1
	"tile_dirt": Color(0.855, 0.702, 0.537),  # chart4
	"tile_water": Color(0.757, 0.714, 0.702),  # chart2
	"tile_obstacle": Color(0.451, 0.416, 0.404),  # border
	"tile_interactive": Color(0.831, 0.647, 0.435),  # accent
	"tile_blocked": Color(1.0, 0.267, 0.267),  # destructive
	"selection": Color(0.831, 0.647, 0.435),  # ring
	"hover": Color(0.831, 0.647, 0.435),  # accent
	"grid": Color(0.451, 0.451, 0.451),  # dark gray
	"effect_positive": Color(0.831, 0.647, 0.435),  # primary
	"effect_negative": Color(1.0, 0.267, 0.267),  # destructive
	"effect_neutral": Color(0.451, 0.416, 0.404),  # muted
}

func _ready() -> void:
	detect_theme()
	print("[ThemeManager] Initialized with theme: %s" % current_theme)

func detect_theme() -> void:
	# Check OS dark mode preference
	var is_dark = false
	if DisplayServer.is_dark_mode_supported():
		# For Godot 4.x, check system preference (varies by platform)
		# Default to light mode for now
		is_dark = false
	current_theme = "dark" if is_dark else "light"
	apply_theme(current_theme)

func apply_theme(theme_name: String) -> void:
	current_theme = theme_name
	current_colors = light_mode_colors if theme_name == "light" else dark_mode_colors
	print("[ThemeManager] Switched to %s theme" % theme_name)

func toggle_theme() -> void:
	var new_theme = "dark" if current_theme == "light" else "light"
	apply_theme(new_theme)
	theme_changed.emit(new_theme)
	print("[ThemeManager] Theme toggled to %s" % new_theme)

func get_color(element_type: String) -> Color:
	if element_type in current_colors:
		return current_colors[element_type]
	print("[ThemeManager] Unknown element type: %s, returning white" % element_type)
	return Color.WHITE
