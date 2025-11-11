extends Node

class_name NetworkManager

# Signals
signal connected_to_server
signal disconnected_from_server
signal space_state_received(state: Dictionary)
signal space_updated(space_id: String, version: int, updated_at: int)
signal position_update(user_id: String, x: float, y: float, direction: String)
signal user_joined(user: Dictionary)
signal user_left(user_id: String)
signal chat_message(user_id: String, name: String, message: String)
signal agent_action(agent_id: String, action: String, data: Variant)
signal error_received(message: String)

# WebSocket connection
var websocket: WebSocketPeer
var server_url: String = "ws://127.0.0.1:8080"
var is_connected: bool = false
var reconnect_timer: Timer

# Connection state
var current_space_id: String = ""
var user_id: String = ""
var user_name: String = ""

func _ready() -> void:
	# Create reconnect timer
	reconnect_timer = Timer.new()
	add_child(reconnect_timer)
	reconnect_timer.timeout.connect(_on_reconnect_timer_timeout)
	reconnect_timer.wait_time = 5.0

	# Connect to server
	connect_to_server()

func _process(_delta: float) -> void:
	if websocket == null:
		return

	websocket.poll()
	var state = websocket.get_ready_state()

	match state:
		WebSocketPeer.STATE_OPEN:
			if not is_connected:
				is_connected = true
				reconnect_timer.stop()
				connected_to_server.emit()
				print("[NetworkManager] Connected to WebSocket server")

			# Process all pending messages
			while websocket.get_available_packet_count():
				var packet = websocket.get_message()
				if packet is String:
					_handle_message(packet)

		WebSocketPeer.STATE_CLOSED:
			if is_connected:
				is_connected = false
				disconnected_from_server.emit()
				print("[NetworkManager] Disconnected from server")
				# Start reconnect timer
				if not reconnect_timer.is_stopped():
					reconnect_timer.start()

func connect_to_server() -> void:
	print("[NetworkManager] Attempting to connect to %s" % server_url)
	websocket = WebSocketPeer.new()
	websocket.connect_to_url(server_url)

func send_message(type: String, data: Dictionary = {}) -> void:
	if not is_connected:
		print("[NetworkManager] Not connected, cannot send message")
		return

	var message = {"type": type}
	message.merge(data)
	var json_str = JSON.stringify(message)
	websocket.send_text(json_str)

func _handle_message(message: String) -> void:
	var json = JSON.parse_string(message)
	if json == null:
		print("[NetworkManager] Failed to parse message: %s" % message)
		return

	var msg_type = json.get("type", "")
	print("[NetworkManager] Received: %s" % msg_type)

	match msg_type:
		"space_state":
			_handle_space_state(json)
		"space_updated":
			_handle_space_updated(json)
		"user_joined":
			_handle_user_joined(json)
		"user_left":
			_handle_user_left(json)
		"position_update":
			_handle_position_update(json)
		"chat_broadcast":
			_handle_chat_message(json)
		"agent_broadcast":
			_handle_agent_action(json)
		"error":
			_handle_error(json)
		_:
			print("[NetworkManager] Unknown message type: %s" % msg_type)

func _handle_space_state(data: Dictionary) -> void:
	var space_id = data.get("space_id", "")
	var users = data.get("users", [])
	var version = data.get("version", 1)
	var updated_at = data.get("updated_at", 0)

	var state = {
		"space_id": space_id,
		"users": users,
		"version": version,
		"updated_at": updated_at
	}
	space_state_received.emit(state)

func _handle_space_updated(data: Dictionary) -> void:
	var space_id = data.get("space_id", "")
	var version = data.get("version", 1)
	var updated_at = data.get("updated_at", 0)
	space_updated.emit(space_id, version, updated_at)

func _handle_user_joined(data: Dictionary) -> void:
	var user = data.get("user", {})
	user_joined.emit(user)

func _handle_user_left(data: Dictionary) -> void:
	var user_id = data.get("user_id", "")
	user_left.emit(user_id)

func _handle_position_update(data: Dictionary) -> void:
	var user_id = data.get("user_id", "")
	var x = data.get("x", 0.0)
	var y = data.get("y", 0.0)
	var direction = data.get("direction", "down")
	position_update.emit(user_id, x, y, direction)

func _handle_chat_message(data: Dictionary) -> void:
	var user_id = data.get("user_id", "")
	var name = data.get("name", "")
	var message = data.get("message", "")
	chat_message.emit(user_id, name, message)

func _handle_agent_action(data: Dictionary) -> void:
	var agent_id = data.get("agent_id", "")
	var action = data.get("action", "")
	var action_data = data.get("data", null)
	agent_action.emit(agent_id, action, action_data)

func _handle_error(data: Dictionary) -> void:
	var error_msg = data.get("message", "Unknown error")
	error_received.emit(error_msg)
	print("[NetworkManager] Error: %s" % error_msg)

func _on_reconnect_timer_timeout() -> void:
	print("[NetworkManager] Reconnecting...")
	connect_to_server()

# Public API methods

func join_space(space_id: String, uid: String, name: String, is_agent: bool = false) -> void:
	current_space_id = space_id
	user_id = uid
	user_name = name

	send_message("join_space", {
		"space_id": space_id,
		"user_id": uid,
		"name": name,
		"is_agent": is_agent
	})

func leave_space(space_id: String) -> void:
	send_message("leave_space", {
		"space_id": space_id
	})
	current_space_id = ""

func update_position(x: float, y: float, direction: String) -> void:
	send_message("update_position", {
		"x": x,
		"y": y,
		"direction": direction
	})

func send_chat(message: String) -> void:
	send_message("chat_message", {
		"message": message
	})

func send_agent_action(action: String, target: String = "", data: Dictionary = {}) -> void:
	var payload = {
		"action": action,
		"target": target
	}
	if not data.is_empty():
		payload["data"] = data
	send_message("agent_action", payload)
