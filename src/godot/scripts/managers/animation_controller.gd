extends Node
## Animation Controller - Manages character animations

var agent_manager: Node
var network_manager: Node
var agent_animations: Dictionary = {}
var animation_fps: float = 8.0
var animation_scale: float = 1.0
var idle_frames: int = 1
var walk_frames: int = 4
var run_frames: int = 6
var frame_time: float = 1.0 / 8.0
var elapsed_time: float = 0.0

func _ready() -> void:
	agent_manager = get_tree().root.get_node("AgentManager")
	network_manager = get_tree().root.get_node("NetworkManager")

	agent_manager.agent_joined.connect(_on_agent_joined)
	agent_manager.agent_left.connect(_on_agent_left)
	agent_manager.agent_moved.connect(_on_agent_moved)
	agent_manager.agent_action.connect(_on_agent_action)

	print("[AnimationController] Initialized with FPS: %f" % animation_fps)

func _process(delta: float) -> void:
	elapsed_time += delta

	for user_id in agent_animations.keys():
		_update_agent_animation(user_id)

func setup_agent_animation(user_id: String, sprite: Sprite2D) -> void:
	agent_animations[user_id] = {
		"sprite": sprite,
		"current_animation": "idle",
		"current_frame": 0,
		"frame_time": 0.0,
		"is_playing": true,
		"loop": true,
		"direction": "down"
	}
	print("[AnimationController] Setup animation for agent: %s" % user_id)

func _update_agent_animation(user_id: String) -> void:
	if not agent_animations.has(user_id):
		return

	var anim_data = agent_animations[user_id]
	var sprite = anim_data.get("sprite")

	if not is_instance_valid(sprite):
		agent_animations.erase(user_id)
		return

	if not anim_data.get("is_playing"):
		return

	anim_data["frame_time"] += get_physics_process_delta_time()

	var frames_per_animation = _get_frames_for_animation(anim_data.get("current_animation"))

	if anim_data["frame_time"] >= frame_time:
		anim_data["frame_time"] = 0.0
		anim_data["current_frame"] += 1

		if anim_data["current_frame"] >= frames_per_animation:
			if anim_data.get("loop"):
				anim_data["current_frame"] = 0
			else:
				anim_data["is_playing"] = false
				anim_data["current_frame"] = frames_per_animation - 1

func _get_frames_for_animation(animation_name: String) -> int:
	match animation_name:
		"idle":
			return idle_frames
		"walk":
			return walk_frames
		"run":
			return run_frames
		"attack":
			return 6
		"hurt":
			return 4
		_:
			return 1

func play_animation(user_id: String, animation_name: String, loop: bool = true) -> void:
	if not agent_animations.has(user_id):
		return

	var anim_data = agent_animations[user_id]
	anim_data["current_animation"] = animation_name
	anim_data["current_frame"] = 0
	anim_data["frame_time"] = 0.0
	anim_data["is_playing"] = true
	anim_data["loop"] = loop

	print("[AnimationController] Playing animation for %s: %s" % [user_id, animation_name])

func set_agent_direction(user_id: String, direction: String) -> void:
	if not agent_animations.has(user_id):
		return

	agent_animations[user_id]["direction"] = direction

func _on_agent_joined(agent_data: Dictionary) -> void:
	var user_id = agent_data.get("user_id", "")
	print("[AnimationController] Agent joined: %s" % user_id)

func _on_agent_left(user_id: String) -> void:
	agent_animations.erase(user_id)
	print("[AnimationController] Agent left: %s" % user_id)

func _on_agent_moved(user_id: String, x: float, y: float, direction: String) -> void:
	set_agent_direction(user_id, direction)

	if direction == "idle":
		play_animation(user_id, "idle")
	else:
		play_animation(user_id, "walk")

func _on_agent_action(user_id: String, action: String, data: Variant) -> void:
	print("[AnimationController] Agent action: %s - %s" % [user_id, action])

	match action:
		"attack":
			play_animation(user_id, "attack", false)
		"hurt":
			play_animation(user_id, "hurt", false)
		"emote":
			play_animation(user_id, "emote", false)

func get_animation_state(user_id: String) -> Dictionary:
	if not agent_animations.has(user_id):
		return {}
	return agent_animations[user_id].duplicate()

func get_all_animations() -> Dictionary:
	var state = {}
	for user_id in agent_animations.keys():
		state[user_id] = get_animation_state(user_id)
	return state
