extends Area2D
## Agent sprite and proximity circle with directional animation

signal selected(agent_id: String)
signal clicked(agent_id: String)

var agent_id: String = ""
var agent_data: Dictionary = {}
var grid_position: Vector2i = Vector2i.ZERO
var pixel_position: Vector2 = Vector2.ZERO
var character_textures: Array = []

# Animation properties
var is_moving: bool = false
var current_direction: String = "down"  # down, up, left, right
var animation_frame: int = 0
var animation_timer: float = 0.0
var animation_speed: float = 0.15  # seconds per frame

var sprite: Sprite2D
var name_label: Label
var proximity_circle: Node
var collision_shape: CollisionShape2D
var base_texture: Texture2D = null

func _ready() -> void:
	# Load character textures once
	_load_character_textures()

	# Create sprite with proper size for AtlasTexture
	sprite = Sprite2D.new()
	sprite.centered = true
	sprite.offset.y = -GameConfig.CHARACTER_SPRITE_SIZE / 4
	sprite.scale = Vector2(1.5, 1.5)  # Scale up sprites
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST  # Pixel perfect rendering
	add_child(sprite)

	# Create label
	name_label = Label.new()
	name_label.add_theme_font_size_override("font_size", GameConfig.CHARACTER_NAME_TEXT_FONT_SIZE)
	name_label.position.y = GameConfig.CHARACTER_NAME_TEXT_OFFSET_Y
	add_child(name_label)

	# Create proximity circle (disabled for now - uses CanvasItem which can't be instantiated)
	# proximity_circle = load("res://scripts/utils/circle_2d.gd").new()
	# proximity_circle.radius = GameConfig.PROXIMITY_CIRCLE_RADIUS * GameConfig.TILE_SIZE
	# proximity_circle.visible = false
	# add_child(proximity_circle)

	# Create collision shape for mouse interaction
	collision_shape = CollisionShape2D.new()
	var circle_shape = CircleShape2D.new()
	circle_shape.radius = GameConfig.TILE_SIZE / 2.0
	collision_shape.shape = circle_shape
	add_child(collision_shape)

	# Connect theme changes
	ThemeManager.theme_changed.connect(_on_theme_changed)

	# Connect Area2D signals
	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)
	input_event.connect(_on_input_event)

func setup(data: Dictionary) -> void:
	agent_data = data.duplicate()
	agent_id = data.get("id", "")
	grid_position = Vector2i(data.get("position", {}).get("x", 0), data.get("position", {}).get("y", 0))
	pixel_position = grid_position * GameConfig.TILE_SIZE

	# Ensure _ready() has been called
	if not is_node_ready():
		await tree_entered

	# Update label
	if name_label:
		name_label.text = data.get("name", "Unknown")

	# Set position
	position = pixel_position

	# Load sprite with texture
	if sprite and character_textures.size() > 0:
		base_texture = character_textures[randi() % character_textures.size()]
		_update_animation_frame()
		sprite.self_modulate = Color.WHITE
	else:
		# Fallback: solid color if no textures
		sprite.modulate = ThemeManager.get_color("agent_friendly")

	print("[AgentNode] Setup: %s at %s with base texture" % [agent_id, grid_position])

func set_tint(color: Color) -> void:
	if sprite:
		sprite.self_modulate = color

func set_position_animated(target_grid: Vector2i, duration: float = 0.3) -> void:
	# Determine direction
	var diff = target_grid - grid_position
	if diff.x > 0:
		current_direction = "right"
	elif diff.x < 0:
		current_direction = "left"
	elif diff.y > 0:
		current_direction = "down"
	elif diff.y < 0:
		current_direction = "up"

	# Start animation
	is_moving = true
	animation_timer = 0.0
	animation_frame = 0

	var target_pixel = target_grid * GameConfig.TILE_SIZE
	var tween = create_tween()
	tween.set_trans(Tween.TRANS_LINEAR)
	tween.tween_property(self, "position", target_pixel, duration)
	tween.tween_callback(func():
		is_moving = false
		animation_frame = 0
		_update_animation_frame()
	)

	grid_position = target_grid
	pixel_position = target_pixel

func _process(delta: float) -> void:
	# Update animation frames during movement
	if is_moving:
		animation_timer += delta
		if animation_timer >= animation_speed:
			animation_timer = 0.0
			animation_frame = (animation_frame + 1) % 4  # 4 frames of walk animation
			_update_animation_frame()

func _update_animation_frame() -> void:
	if not sprite or not base_texture:
		return

	# Map direction to row in spritesheet (assuming 4x4 grid)
	# Row 0: right, Row 1: left, Row 2: down, Row 3: up
	var direction_row = 2  # default down
	match current_direction:
		"right":
			direction_row = 0
		"left":
			direction_row = 1
		"down":
			direction_row = 2
		"up":
			direction_row = 3

	# Calculate frame index: row * 4 + column
	var frame_index = direction_row * 4 + animation_frame

	# Create AtlasTexture to crop 48x48 from 192x192 spritesheet
	var atlas = AtlasTexture.new()
	atlas.atlas = base_texture
	atlas.region = Rect2(animation_frame * 48, direction_row * 48, 48, 48)
	atlas.filter_clip = true
	sprite.texture = atlas

func _on_mouse_entered() -> void:
	proximity_circle.visible = true
	proximity_circle.color = ThemeManager.get_color("selection")
	proximity_circle.color.a = 0.5
	selected.emit(agent_id)

func _on_mouse_exited() -> void:
	proximity_circle.visible = false

func _on_input_event(_viewport: Node, event: InputEvent, _shape_idx: int) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		clicked.emit(agent_id)

func _on_theme_changed(_new_theme: String) -> void:
	# Update colors on theme change
	sprite.self_modulate = ThemeManager.get_color("agent_friendly")
	if proximity_circle and proximity_circle.visible:
		proximity_circle.color = ThemeManager.get_color("selection")

func _load_character_textures() -> void:
	# Load all character sprite textures from res://assets/sprites/characters/
	var character_dir = "res://assets/sprites/characters/"
	var file_system = DirAccess.open(character_dir)

	if file_system:
		file_system.list_dir_begin()
		var file_name = file_system.get_next()

		while file_name != "":
			if file_name.ends_with(".png") and not file_name.ends_with(".import"):
				var texture_path = character_dir + file_name
				var texture = load(texture_path)
				if texture:
					character_textures.append(texture)
			file_name = file_system.get_next()

		print("[AgentNode] Loaded %d character textures" % character_textures.size())
	else:
		print("[AgentNode] Could not open character directory: %s" % character_dir)
