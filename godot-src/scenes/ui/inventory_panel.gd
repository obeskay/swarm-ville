extends PanelContainer
## Inventory panel - 5x4 grid of item slots

var inventory_slots: Array[Dictionary] = []

func _ready() -> void:
	# Create 5x4 grid
	var grid = GridContainer.new()
	grid.columns = 5
	grid.custom_minimum_size = Vector2(300, 300)

	for i in range(20):
		var slot = Button.new()
		slot.custom_minimum_size = Vector2(50, 50)
		slot.text = str(i)
		slot.pressed.connect(_on_slot_selected.bindv([i]))
		grid.add_child(slot)
		inventory_slots.append({"index": i, "item": null})

	add_child(grid)
	UISystem.register_panel("inventory", self)
	print("[InventoryPanel] Ready with 20 slots")

func add_item(item: Dictionary, slot_index: int = -1) -> bool:
	"""Add item to inventory"""
	if slot_index == -1:
		# Find first empty slot
		for i in range(20):
			if inventory_slots[i]["item"] == null:
				slot_index = i
				break

	if slot_index >= 0 and slot_index < 20:
		inventory_slots[slot_index]["item"] = item
		return true

	return false

func _on_slot_selected(index: int) -> void:
	"""Handle slot selection"""
	var item = inventory_slots[index]["item"]
	if item:
		print("[InventoryPanel] Selected item: %s" % item.get("name", "Unknown"))
		UISystem.inventory_item_selected.emit(index)
