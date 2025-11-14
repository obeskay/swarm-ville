extends CanvasLayer
## Game HUD - displays player info, controls, and minimap

@onready var position_label: Label = $TopBar/PositionLabel
@onready var fps_label: Label = $TopBar/FPSLabel
@onready var controls_panel: PanelContainer = $ControlsPanel
@onready var minimap: SubViewportContainer = $MinimapContainer

var player_controller: Node2D = null

func _ready() -> void:
	# Setup top bar
	_setup_top_bar()

	# Setup controls panel
	_setup_controls_panel()

	# Setup minimap
	_setup_minimap()

	print("[GameHUD] Initialized")

func _process(_delta: float) -> void:
	# Update FPS
	fps_label.text = "FPS: %d" % Engine.get_frames_per_second()

	# Update player position
	if player_controller:
		var grid_pos = Vector2i(
			int(player_controller.global_position.x / GameConfig.TILE_SIZE),
			int(player_controller.global_position.y / GameConfig.TILE_SIZE)
		)
		position_label.text = "Position: (%d, %d)" % [grid_pos.x, grid_pos.y]

func set_player_controller(controller: Node2D) -> void:
	"""Set the player controller to track"""
	player_controller = controller

func _setup_top_bar() -> void:
	"""Create top bar with player info"""
	var top_bar = PanelContainer.new()
	top_bar.name = "TopBar"

	# Style
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.1, 0.1, 0.12, 0.9)
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	style.content_margin_left = 16
	style.content_margin_right = 16
	style.content_margin_top = 8
	style.content_margin_bottom = 8
	top_bar.add_theme_stylebox_override("panel", style)

	# Layout
	var hbox = HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 32)
	top_bar.add_child(hbox)

	# Position label
	var pos_label = Label.new()
	pos_label.name = "PositionLabel"
	pos_label.text = "Position: (0, 0)"
	pos_label.add_theme_color_override("font_color", Color(1.0, 1.0, 1.0))
	pos_label.add_theme_font_size_override("font_size", 18)
	hbox.add_child(pos_label)

	# FPS label
	var fps_label_node = Label.new()
	fps_label_node.name = "FPSLabel"
	fps_label_node.text = "FPS: 60"
	fps_label_node.add_theme_color_override("font_color", Color(0.4, 1.0, 0.4))
	fps_label_node.add_theme_font_size_override("font_size", 18)
	hbox.add_child(fps_label_node)

	# Add to scene
	add_child(top_bar)

	# Position at top center
	top_bar.anchor_left = 0.5
	top_bar.anchor_right = 0.5
	top_bar.anchor_top = 0.0
	top_bar.anchor_bottom = 0.0
	top_bar.offset_left = -150
	top_bar.offset_right = 150
	top_bar.offset_top = 16
	top_bar.offset_bottom = 56

func _setup_controls_panel() -> void:
	"""Create controls help panel"""
	var panel = PanelContainer.new()
	panel.name = "ControlsPanel"

	# Style
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.1, 0.1, 0.12, 0.85)
	style.corner_radius_top_left = 8
	style.corner_radius_bottom_left = 8
	style.content_margin_left = 16
	style.content_margin_right = 16
	style.content_margin_top = 12
	style.content_margin_bottom = 12
	panel.add_theme_stylebox_override("panel", style)

	# Layout
	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 8)
	panel.add_child(vbox)

	# Title
	var title = Label.new()
	title.text = "CONTROLS"
	title.add_theme_color_override("font_color", Color(0.9, 0.9, 0.95))
	title.add_theme_font_size_override("font_size", 14)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)

	# Controls list
	var controls = [
		"W/A/S/D - Move",
		"SPACE - Disabled",
		"Mouse Wheel - Zoom",
		"ESC - Close panels"
	]

	for control in controls:
		var label = Label.new()
		label.text = control
		label.add_theme_color_override("font_color", Color(1.0, 1.0, 1.0))
		label.add_theme_font_size_override("font_size", 13)

		# Gray out disabled controls
		if "Disabled" in control:
			label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.65))

		vbox.add_child(label)

	# Add to scene
	add_child(panel)

	# Position at right side
	panel.anchor_left = 1.0
	panel.anchor_right = 1.0
	panel.anchor_top = 0.5
	panel.anchor_bottom = 0.5
	panel.offset_left = -180
	panel.offset_right = -16
	panel.offset_top = -80
	panel.offset_bottom = 80

func _setup_minimap() -> void:
	"""Create minimap in bottom-right corner"""
	var container = SubViewportContainer.new()
	container.name = "MinimapContainer"
	container.stretch = true

	# Style
	var panel_style = StyleBoxFlat.new()
	panel_style.bg_color = Color(0.1, 0.1, 0.12, 0.9)
	panel_style.border_color = Color(0.3, 0.3, 0.35)
	panel_style.border_width_left = 2
	panel_style.border_width_top = 2
	panel_style.border_width_right = 2
	panel_style.border_width_bottom = 2
	panel_style.corner_radius_top_left = 8

	# Wrap in PanelContainer for styling
	var panel = PanelContainer.new()
	panel.add_theme_stylebox_override("panel", panel_style)

	var minimap_vbox = VBoxContainer.new()
	panel.add_child(minimap_vbox)

	# Title
	var title = Label.new()
	title.text = "MINIMAP"
	title.add_theme_color_override("font_color", Color(0.7, 0.7, 0.75))
	title.add_theme_font_size_override("font_size", 10)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	minimap_vbox.add_child(title)

	# Placeholder (actual minimap would need SubViewport + Camera2D)
	var minimap_placeholder = ColorRect.new()
	minimap_placeholder.color = Color(0.15, 0.15, 0.18)
	minimap_placeholder.custom_minimum_size = Vector2(160, 160)
	minimap_vbox.add_child(minimap_placeholder)

	add_child(panel)

	# Position at bottom-right
	panel.anchor_left = 1.0
	panel.anchor_right = 1.0
	panel.anchor_top = 1.0
	panel.anchor_bottom = 1.0
	panel.offset_left = -196
	panel.offset_right = -16
	panel.offset_top = -216
	panel.offset_bottom = -16
