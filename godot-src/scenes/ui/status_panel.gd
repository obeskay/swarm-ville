extends PanelContainer
## Status panel - health, mana, and stats

var health: int = 100
var max_health: int = 100
var mana: int = 50
var max_mana: int = 50

var health_bar: ProgressBar
var mana_bar: ProgressBar

func _ready() -> void:
	var vbox = VBoxContainer.new()

	# Health label and bar
	var health_label = Label.new()
	health_label.text = "Health"
	vbox.add_child(health_label)

	health_bar = ProgressBar.new()
	health_bar.max_value = max_health
	health_bar.value = health
	health_bar.custom_minimum_size = Vector2(200, 20)
	vbox.add_child(health_bar)

	# Mana label and bar
	var mana_label = Label.new()
	mana_label.text = "Mana"
	vbox.add_child(mana_label)

	mana_bar = ProgressBar.new()
	mana_bar.max_value = max_mana
	mana_bar.value = mana
	mana_bar.custom_minimum_size = Vector2(200, 20)
	vbox.add_child(mana_bar)

	add_child(vbox)
	UISystem.register_panel("status", self)
	print("[StatusPanel] Ready")

func update_status(new_health: int, new_max_health: int, new_mana: int = 0, new_max_mana: int = 0) -> void:
	"""Update status bars"""
	health = new_health
	max_health = new_max_health
	mana = new_mana
	max_mana = new_max_mana

	if health_bar:
		health_bar.max_value = max_health
		health_bar.value = health

	if mana_bar:
		mana_bar.max_value = max_mana
		mana_bar.value = mana
