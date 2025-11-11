extends Node
## Automated gameplay recording script - Simplified version
## Captures complete gameplay with agent spawning, movement, and UI interactions

var is_recording: bool = false
var recording_time: float = 0.0
var max_recording_time: float = 300.0  # 5 minutes
var gameplay_demo: Node2D
var target_agent_count: int = 30
var spawn_rate_boost: float = 5.0

func _ready() -> void:
	gameplay_demo = get_parent()
	if not gameplay_demo:
		push_error("GameplayRecorder must be a child of GameplayDemo!")
		return

	print("[GameplayRecorder] Ready - will auto-record gameplay")
	set_process(true)

func _process(delta: float) -> void:
	if not is_recording:
		# Auto-start recording after a short delay
		if recording_time < 1.0:
			recording_time += delta
		else:
			start_recording()
	else:
		update_recording(delta)

func start_recording() -> void:
	if is_recording:
		return

	is_recording = true
	recording_time = 0.0

	print("[GameplayRecorder] === STARTING GAMEPLAY RECORDING ===")
	print("[GameplayRecorder] Target: 30+ agents, Full UI demonstration, 5 minute gameplay")

	# Boost spawn rate temporarily
	if GameState.game_config:
		GameState.game_config["spawn_rate"] = spawn_rate_boost
		GameState.game_config["max_agents"] = target_agent_count

func update_recording(delta: float) -> void:
	recording_time += delta

	# Simulate WASD input for player movement
	_simulate_movement()

	# Log progress every 30 seconds
	if fmod(recording_time, 30.0) < delta:
		var agent_count = gameplay_demo.agents_on_screen.size() if gameplay_demo else 0
		var elapsed = int(recording_time)
		var minutes = elapsed / 60
		var seconds = elapsed % 60
		print("[GameplayRecorder] %02d:%02d - Agents: %d/%d | Score: %d" % [
			minutes, seconds, agent_count, target_agent_count, GameState.current_score
		])

	# Stop recording after max time
	if recording_time >= max_recording_time:
		stop_recording()

func stop_recording() -> void:
	if not is_recording:
		return

	is_recording = false

	print("\n[GameplayRecorder] === RECORDING COMPLETE ===")
	print("[GameplayRecorder] Total time: %.1f seconds" % recording_time)

	var agent_count = gameplay_demo.agents_on_screen.size() if gameplay_demo else 0
	print("[GameplayRecorder] Final agents: %d" % agent_count)
	print("[GameplayRecorder] Final score: %d" % GameState.current_score)
	print("[GameplayRecorder] Waves completed: %d" % GameState.current_wave)
	print("[GameplayRecorder] Ready for export to Web!")

func _simulate_movement() -> void:
	# Simulate movement pattern: circle around the map
	var time_cycle = fmod(recording_time, 20.0)  # 20 second cycles

	if time_cycle < 5.0:
		# Move right (D)
		Input.action_press("ui_right")
		Input.action_release("ui_left")
		Input.action_release("ui_up")
		Input.action_release("ui_down")
	elif time_cycle < 10.0:
		# Move down (S)
		Input.action_release("ui_right")
		Input.action_release("ui_left")
		Input.action_release("ui_up")
		Input.action_press("ui_down")
	elif time_cycle < 15.0:
		# Move left (A)
		Input.action_release("ui_right")
		Input.action_press("ui_left")
		Input.action_release("ui_up")
		Input.action_release("ui_down")
	else:
		# Move up (W)
		Input.action_release("ui_right")
		Input.action_release("ui_left")
		Input.action_press("ui_up")
		Input.action_release("ui_down")

	# Simulate agent spawning via SPACE every 2 seconds
	if fmod(recording_time, 2.0) < 0.016:  # ~1 frame at 60fps
		Input.action_press("ui_accept")
	else:
		Input.action_release("ui_accept")

# Helper to get recording stats
func get_stats() -> Dictionary:
	var agent_count = gameplay_demo.agents_on_screen.size() if gameplay_demo else 0
	return {
		"recording_time": recording_time,
		"agents_spawned": agent_count,
		"score": GameState.current_score,
		"waves": GameState.current_wave,
		"is_recording": is_recording
	}
