extends Control
## Right sidebar - agent list

@onready var agent_list_container = $VBoxContainer/AgentList/VBoxContainer

func _ready() -> void:
	AgentRegistry.agent_spawned.connect(_on_agent_spawned)
	AgentRegistry.agent_removed.connect(_on_agent_removed)

func add_agent(agent_id: String) -> void:
	var agent_data = AgentRegistry.get_agent(agent_id)
	if agent_data.is_empty():
		return

	var label = Label.new()
	label.text = agent_data.get("name", "Unknown")
	label.name = agent_id
	agent_list_container.add_child(label)
	print("[RightSidebar] Added agent: %s" % agent_data.get("name", agent_id))

func remove_agent(agent_id: String) -> void:
	var child = agent_list_container.find_child(agent_id, false, false)
	if child:
		child.queue_free()
		print("[RightSidebar] Removed agent: %s" % agent_id)

func update_agent(agent_id: String) -> void:
	var child = agent_list_container.find_child(agent_id, false, false)
	if child and child is Label:
		var agent_data = AgentRegistry.get_agent(agent_id)
		child.text = agent_data.get("name", "Unknown")

func _on_agent_spawned(agent_id: String) -> void:
	add_agent(agent_id)

func _on_agent_removed(agent_id: String) -> void:
	remove_agent(agent_id)
