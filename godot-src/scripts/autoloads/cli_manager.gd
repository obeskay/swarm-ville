extends Node
## CLI Manager - Detects and manages external CLI tools (Claude, Cursor, Beads, etc.)
## Autoload singleton

var detected_clis: Dictionary = {}  # cli_name -> {path, version, available}
var active_requests: Dictionary = {}  # request_id -> {cli, callback, timestamp}

signal cli_detected(cli_name: String, version: String)
signal cli_response(request_id: String, response: Dictionary)
signal cli_error(request_id: String, error: String)

func _ready() -> void:
	print("[CLIManager] Initializing...")
	detect_available_clis()

func detect_available_clis() -> void:
	"""Detect which CLIs are installed on the system"""
	var clis_to_check = [
		"claude",
		"cursor-agent",
		"codex",
		"bd",  # Beads
		"openai",
		"gemini"
	]

	for cli in clis_to_check:
		_check_cli_availability(cli)

func _check_cli_availability(cli_name: String) -> void:
	"""Check if a CLI is available"""
	# In Web builds, we can't execute OS commands
	if OS.has_feature("web"):
		print("[CLIManager] Web build - CLI detection disabled")
		detected_clis[cli_name] = {
			"available": false,
			"path": "",
			"version": "",
			"reason": "Web build - CLI not available"
		}
		return

	# Desktop builds can check for CLI availability
	# For now, mark all as unavailable until proper OS.execute is implemented
	detected_clis[cli_name] = {
		"available": false,
		"path": "",
		"version": "",
		"reason": "Desktop CLI detection pending"
	}

	print("[CLIManager] Detected %s: %s" % [cli_name, "not available" if not detected_clis[cli_name].available else "available"])

func is_cli_available(cli_name: String) -> bool:
	"""Check if a CLI is available"""
	return detected_clis.get(cli_name, {}).get("available", false)

func call_cli_async(cli: String, args: PackedStringArray, payload: Dictionary, request_id: String) -> void:
	"""Call a CLI asynchronously and emit response via signal"""
	if OS.has_feature("web"):
		emit_signal("cli_error", request_id, "CLI calls not supported in Web build")
		return

	if not is_cli_available(cli):
		emit_signal("cli_error", request_id, "CLI '%s' not available" % cli)
		return

	# Store request
	active_requests[request_id] = {
		"cli": cli,
		"timestamp": Time.get_unix_time_from_system(),
		"args": args,
		"payload": payload
	}

	# For now, simulate response (actual OS.execute implementation pending)
	_simulate_cli_response(request_id, cli, payload)

func _simulate_cli_response(request_id: String, cli: String, payload: Dictionary) -> void:
	"""Simulate CLI response for testing"""
	await get_tree().create_timer(randf_range(0.5, 2.0)).timeout

	var simulated_response = {
		"cli": cli,
		"status": "simulated",
		"content": "This is a simulated response from %s CLI. In production, this would call the actual CLI." % cli,
		"timestamp": Time.get_unix_time_from_system()
	}

	emit_signal("cli_response", request_id, simulated_response)
	active_requests.erase(request_id)

func call_beads(command: String, args: Dictionary = {}) -> String:
	"""Call Beads CLI (bd) for task/issue management"""
	var request_id = "beads_" + str(randi())

	var payload = {
		"command": command,
		"args": args
	}

	call_cli_async("bd", PackedStringArray([command]), payload, request_id)
	return request_id

func call_claude(messages: Array, context: Dictionary = {}) -> String:
	"""Call Claude CLI"""
	var request_id = "claude_" + str(randi())

	var payload = {
		"messages": messages,
		"context": context
	}

	call_cli_async("claude", PackedStringArray(["chat"]), payload, request_id)
	return request_id

func call_cursor(prompt: String, context: Dictionary = {}) -> String:
	"""Call Cursor Agent CLI"""
	var request_id = "cursor_" + str(randi())

	var payload = {
		"prompt": prompt,
		"context": context
	}

	call_cli_async("cursor-agent", PackedStringArray(["execute"]), payload, request_id)
	return request_id

func get_available_clis() -> Array[String]:
	"""Get list of available CLIs"""
	var available: Array[String] = []
	for cli_name in detected_clis.keys():
		if detected_clis[cli_name].get("available", false):
			available.append(cli_name)
	return available

func get_cli_count() -> int:
	"""Get number of detected CLIs"""
	var count = 0
	for cli_data in detected_clis.values():
		if cli_data.get("available", false):
			count += 1
	return count
