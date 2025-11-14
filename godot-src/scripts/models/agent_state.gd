extends Node
class_name AgentState
## Runtime state for an AI agent

enum Status {
	IDLE,          # Not doing anything
	LISTENING,     # Receiving input (STT or text)
	THINKING,      # Processing request (waiting for CLI)
	SPEAKING,      # Outputting response
	WORKING,       # Executing task
	ERROR          # Error state
}

var config: AgentConfig
var position: Vector2 = Vector2.ZERO
var grid_position: Vector2i = Vector2i.ZERO
var status: Status = Status.IDLE
var current_task: String = ""
var memory_context_id: String = ""  # Beads project/issue ID

# Conversation history
var conversation_history: Array[Dictionary] = []
var last_response: String = ""
var last_error: String = ""

# Proximity tracking
var nearby_agents: Array[String] = []  # IDs of agents in proximity
var in_private_area: bool = false

# Performance metrics
var total_requests: int = 0
var total_responses: int = 0
var average_response_time: float = 0.0

signal status_changed(new_status: Status)
signal response_received(response: String)
signal error_occurred(error: String)
signal position_changed(new_pos: Vector2)

func _init(agent_config: AgentConfig = null) -> void:
	if agent_config:
		config = agent_config
		position = config.default_position * 64.0  # Convert grid to pixels
		grid_position = Vector2i(config.default_position)

func set_status(new_status: Status) -> void:
	if status != new_status:
		status = new_status
		emit_signal("status_changed", new_status)
		print("[AgentState:%s] Status changed to %s" % [config.name if config else "Unknown", Status.keys()[new_status]])

func add_message(role: String, content: String) -> void:
	"""Add message to conversation history"""
	conversation_history.append({
		"role": role,
		"content": content,
		"timestamp": Time.get_unix_time_from_system()
	})

	# Keep last 50 messages to manage memory
	if conversation_history.size() > 50:
		conversation_history = conversation_history.slice(-50)

func set_position(new_pos: Vector2) -> void:
	"""Update agent position"""
	position = new_pos
	grid_position = Vector2i(int(new_pos.x / 64.0), int(new_pos.y / 64.0))
	emit_signal("position_changed", new_pos)

func update_proximity(agent_ids: Array[String]) -> void:
	"""Update list of nearby agents"""
	nearby_agents = agent_ids.duplicate()

func get_status_text() -> String:
	"""Get human-readable status"""
	return Status.keys()[status].capitalize()
