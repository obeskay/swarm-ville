extends Node2D
class_name AgentAvatar
## Visual representation of an AI agent in the 2D space

@onready var sprite: Sprite2D = $Sprite2D
@onready var name_label: Label = $NameLabel
@onready var status_label: Label = $StatusLabel
@onready var proximity_circle: Node2D = $ProximityCircle
@onready var anim_player: AnimationPlayer = $AnimationPlayer

var agent_state: AgentState
var is_selected: bool = false

# Animation
var current_direction: String = "down"
var animation_frame: int = 0
var animation_timer: float = 0.0
var animation_speed: float = 0.15
var frame_size: Vector2i = Vector2i(48, 48)

signal clicked(agent_id: String)
signal proximity_entered(other_agent_id: String)
signal proximity_exited(other_agent_id: String)

func _ready() -> void:
	# Setup sprite
	if sprite:
		sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		sprite.scale = Vector2(2.0, 2.0)
		sprite.region_enabled = true

	# Setup labels
	if name_label:
		name_label.position.y = -80
		name_label.add_theme_font_size_override("font_size", 14)
		name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

	if status_label:
		status_label.position.y = -95
		status_label.add_theme_font_size_override("font_size", 11)
		status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

	# Setup proximity circle (visual indicator)
	if proximity_circle:
		proximity_circle.modulate = Color(1.0, 1.0, 1.0, 0.0)  # Start invisible

func initialize(state: AgentState) -> void:
	"""Initialize avatar with agent state"""
	agent_state = state

	# Set visual properties
	if agent_state.config:
		if name_label:
			name_label.text = agent_state.config.name

		# Load avatar sprite
		if agent_state.config.avatar_sprite and sprite:
			sprite.texture = agent_state.config.avatar_sprite
		else:
			# Use default character sprite
			var default_sprite = load("res://assets/sprites/characters/Character_001.png")
			if default_sprite and sprite:
				sprite.texture = default_sprite

		# Apply color tint
		if sprite:
			sprite.self_modulate = agent_state.config.color_tint

		# Set initial position
		global_position = agent_state.position

	# Connect signals
	if agent_state:
		agent_state.status_changed.connect(_on_status_changed)
		agent_state.position_changed.connect(_on_position_changed)

	_update_status_display()
	_update_animation_frame()

func _process(delta: float) -> void:
	# Animate sprite if moving or active
	if agent_state and agent_state.status != AgentState.Status.IDLE:
		animation_timer += delta
		if animation_timer >= animation_speed:
			animation_timer = 0.0
			animation_frame = (animation_frame + 1) % 4
			_update_animation_frame()

func _update_animation_frame() -> void:
	"""Update sprite region based on direction and frame"""
	if not sprite or not sprite.texture:
		return

	var row = 0
	match current_direction:
		"down": row = 0
		"left": row = 1
		"right": row = 2
		"up": row = 3

	sprite.region_rect = Rect2(
		animation_frame * frame_size.x,
		row * frame_size.y,
		frame_size.x,
		frame_size.y
	)

func _on_status_changed(new_status: AgentState.Status) -> void:
	"""Handle status changes"""
	_update_status_display()

	# Play status-specific animations
	match new_status:
		AgentState.Status.LISTENING:
			if anim_player and anim_player.has_animation("listening"):
				anim_player.play("listening")
		AgentState.Status.THINKING:
			if anim_player and anim_player.has_animation("thinking"):
				anim_player.play("thinking")
		AgentState.Status.SPEAKING:
			if anim_player and anim_player.has_animation("speaking"):
				anim_player.play("speaking")
		_:
			if anim_player:
				anim_player.stop()

func _update_status_display() -> void:
	"""Update status label"""
	if status_label and agent_state:
		status_label.text = agent_state.get_status_text()

		# Color code by status
		match agent_state.status:
			AgentState.Status.IDLE:
				status_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
			AgentState.Status.LISTENING:
				status_label.add_theme_color_override("font_color", Color(0.4, 0.8, 1.0))
			AgentState.Status.THINKING:
				status_label.add_theme_color_override("font_color", Color(1.0, 0.8, 0.2))
			AgentState.Status.SPEAKING:
				status_label.add_theme_color_override("font_color", Color(0.4, 1.0, 0.4))
			AgentState.Status.WORKING:
				status_label.add_theme_color_override("font_color", Color(0.8, 0.4, 1.0))
			AgentState.Status.ERROR:
				status_label.add_theme_color_override("font_color", Color(1.0, 0.3, 0.3))

func _on_position_changed(new_pos: Vector2) -> void:
	"""Handle position changes"""
	# Smooth movement
	var tween = create_tween()
	tween.tween_property(self, "global_position", new_pos, 0.3)

func show_proximity_circle(show: bool) -> void:
	"""Show/hide proximity circle"""
	if proximity_circle:
		var tween = create_tween()
		tween.tween_property(proximity_circle, "modulate:a", 0.3 if show else 0.0, 0.2)

func set_selected(selected: bool) -> void:
	"""Highlight agent when selected"""
	is_selected = selected
	if sprite:
		var target_scale = Vector2(2.2, 2.2) if selected else Vector2(2.0, 2.0)
		var tween = create_tween()
		tween.tween_property(sprite, "scale", target_scale, 0.15)

func _on_input_event(_viewport: Node, event: InputEvent, _shape_idx: int) -> void:
	"""Handle clicks on agent"""
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if agent_state:
			emit_signal("clicked", agent_state.config.id)
