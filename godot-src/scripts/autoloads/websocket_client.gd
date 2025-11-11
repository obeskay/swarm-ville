extends Node
## Backend communication via WebSocket

signal connected
signal disconnected
signal agent_spawned(agent_data: Dictionary)
signal agent_moved(agent_id: String, position: Vector2i)
signal agent_removed(agent_id: String)
signal message_received(message_data: Dictionary)
signal space_loaded(space_data: Dictionary)

var ws: WebSocketPeer
var connected_to_backend: bool = false
var reconnect_attempts: int = 0
var reconnect_timer: Timer

func _ready() -> void:
	reconnect_timer = Timer.new()
	add_child(reconnect_timer)
	reconnect_timer.timeout.connect(_on_reconnect_timeout)
	connect_to_backend()

func connect_to_backend() -> void:
	ws = WebSocketPeer.new()
	var error = ws.connect_to_url(GameConfig.WS_URL)
	if error != OK:
		print("[WebSocketClient] Connection failed: %d" % error)
		schedule_reconnect()
		return
	print("[WebSocketClient] Connecting to %s..." % GameConfig.WS_URL)

func _process(_delta: float) -> void:
	if not ws:
		return

	ws.poll()
	var state = ws.get_ready_state()

	if state == WebSocketPeer.STATE_OPEN:
		if not connected_to_backend:
			connected_to_backend = true
			reconnect_attempts = 0
			connected.emit()
			print("[WebSocketClient] Connected!")

		# Process messages
		while ws.get_available_packet_count() > 0:
			var message = ws.get_message().get_string_from_utf8()
			_on_message_received(message)

	elif state == WebSocketPeer.STATE_CLOSED:
		if connected_to_backend:
			connected_to_backend = false
			disconnected.emit()
			print("[WebSocketClient] Disconnected")
			schedule_reconnect()

func _on_message_received(message: String) -> void:
	var data = JSON.parse_string(message)
	if data == null:
		print("[WebSocketClient] Failed to parse message: %s" % message)
		return

	var msg_type = data.get("type", "")
	match msg_type:
		"agent_joined":
			agent_spawned.emit(data.get("agent", {}))
		"agent_moved":
			agent_moved.emit(data.get("id", ""), Vector2i(data.get("x", 0), data.get("y", 0)))
		"agent_left":
			agent_removed.emit(data.get("id", ""))
		"message":
			message_received.emit(data)
		"space_loaded":
			space_loaded.emit(data.get("space", {}))
		_:
			print("[WebSocketClient] Unknown message type: %s" % msg_type)

func send_action(action: String, data: Dictionary = {}) -> void:
	if not connected_to_backend:
		print("[WebSocketClient] Not connected, cannot send: %s" % action)
		return

	var message = {"type": action}
	if not data.is_empty():
		message["data"] = data

	var json_str = JSON.stringify(message)
	ws.send_text(json_str)
	print("[WebSocketClient] Sent: %s with %d params" % [action, data.size()])

func schedule_reconnect() -> void:
	if reconnect_attempts >= GameConfig.WS_MAX_RECONNECT_ATTEMPTS:
		print("[WebSocketClient] Max reconnect attempts reached")
		return

	reconnect_attempts += 1
	var delay = GameConfig.WS_RECONNECT_DELAY * pow(2.0, reconnect_attempts - 1)
	print("[WebSocketClient] Reconnecting in %.1fs (attempt %d/%d)" % [delay, reconnect_attempts, GameConfig.WS_MAX_RECONNECT_ATTEMPTS])
	reconnect_timer.start(delay)

func _on_reconnect_timeout() -> void:
	reconnect_timer.stop()
	connect_to_backend()
