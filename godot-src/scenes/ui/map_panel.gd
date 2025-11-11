extends PanelContainer
## Map panel - minimap display

var minimap: ColorRect

func _ready() -> void:
	var vbox = VBoxContainer.new()

	# Title
	var title = Label.new()
	title.text = "Map"
	vbox.add_child(title)

	# Minimap area
	minimap = ColorRect.new()
	minimap.color = ThemeManager.get_color("background")
	minimap.custom_minimum_size = Vector2(256, 256)
	vbox.add_child(minimap)

	add_child(vbox)
	UISystem.register_panel("map", self)

	# Connect to space updates
	SpaceManager.space_loaded.connect(_on_space_loaded)
	AgentRegistry.agent_spawned.connect(_on_agent_updated)
	AgentRegistry.agent_removed.connect(_on_agent_updated)

	print("[MapPanel] Ready")

func _on_space_loaded(space_id: String) -> void:
	"""Redraw minimap when space loads"""
	minimap.queue_redraw()

func _on_agent_updated(_agent_id: String) -> void:
	"""Update minimap when agents change"""
	minimap.queue_redraw()
