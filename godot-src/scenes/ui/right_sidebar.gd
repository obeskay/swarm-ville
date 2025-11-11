extends Control
## Right sidebar - agent list and creation

@onready var agent_list_container = $VBoxContainer/AgentList/VBoxContainer

var create_agent_button: Button
var agent_dialog: Node

func _ready() -> void:
	# Create "Create Agent" button if not in scene
	if not has_node("CreateAgentButton"):
		create_agent_button = Button.new()
		create_agent_button.text = "+ Create Agent"
		create_agent_button.pressed.connect(_on_create_agent_pressed)
		$VBoxContainer.add_child(create_agent_button)
		$VBoxContainer.move_child(create_agent_button, 1)  # After title
	else:
		create_agent_button = $CreateAgentButton
		create_agent_button.pressed.connect(_on_create_agent_pressed)

	AgentRegistry.agent_spawned.connect(_on_agent_spawned)
	AgentRegistry.agent_removed.connect(_on_agent_removed)
	AgentRegistry.agent_updated.connect(_on_agent_updated)

	print("[RightSidebar] Ready")

func add_agent(agent_id: String) -> void:
	var agent_data = AgentRegistry.get_agent(agent_id)
	if agent_data.is_empty():
		return

	# Create agent entry with delete button
	var entry = HBoxContainer.new()
	entry.name = agent_id
	entry.size_flags_horizontal = Control.SIZE_EXPAND_FILL

	var label = Label.new()
	label.text = agent_data.get("name", "Unknown")
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	entry.add_child(label)

	var delete_btn = Button.new()
	delete_btn.text = "✕"
	delete_btn.custom_minimum_size = Vector2(30, 0)
	delete_btn.pressed.connect(func(): _on_delete_agent(agent_id))
	entry.add_child(delete_btn)

	agent_list_container.add_child(entry)
	print("[RightSidebar] Added agent: %s" % agent_data.get("name", agent_id))

func remove_agent(agent_id: String) -> void:
	var child = agent_list_container.find_child(agent_id, false, false)
	if child:
		child.queue_free()
		print("[RightSidebar] Removed agent: %s" % agent_id)

func update_agent(agent_id: String) -> void:
	var entry = agent_list_container.find_child(agent_id, false, false)
	if entry and entry is HBoxContainer:
		var label = entry.get_child(0) if entry.get_child_count() > 0 else null
		if label and label is Label:
			var agent_data = AgentRegistry.get_agent(agent_id)
			label.text = agent_data.get("name", "Unknown")

func _on_agent_spawned(agent_id: String) -> void:
	add_agent(agent_id)

func _on_agent_removed(agent_id: String) -> void:
	remove_agent(agent_id)

func _on_agent_updated(agent_id: String) -> void:
	update_agent(agent_id)

func _on_create_agent_pressed() -> void:
	print("[RightSidebar] Create agent requested")
	# Get reference to agent dialog from parent
	var main_container = get_tree().root.get_child(0)
	if main_container and main_container.has_node("AgentDialog"):
		var dialog = main_container.get_node("AgentDialog")
		if dialog and dialog.has_method("show_dialog"):
			dialog.show_dialog()

func _on_delete_agent(agent_id: String) -> void:
	print("[RightSidebar] Delete requested for: %s" % agent_id)
	# Future: send delete request to backend
	AgentRegistry.remove_agent(agent_id)
