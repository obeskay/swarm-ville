extends Node
## Global game configuration constants

# Gameplay
const TILE_SIZE: int = 64
const AGENT_MOVEMENT_SPEED: float = 100.0
const PROXIMITY_CIRCLE_RADIUS: float = 3.5
const PROXIMITY_CIRCLE_RADIUS_TILES: int = 3
const COLLISION_CHECK_RADIUS: int = 1
const NEAREST_WALKABLE_MAX_RADIUS: int = 5

# Animation
const CHARACTER_ANIMATION_SPEED: float = 0.1
const CHARACTER_MOVEMENT_DURATION: float = 0.3
const CHARACTER_HOVER_SCALE: float = 1.2
const CHARACTER_HOVER_DURATION: float = 0.15
const CHARACTER_HOVER_TEXT_SCALE: float = 1.15
const SPAWN_ANIMATION_START_ALPHA: float = 0.0
const SPAWN_ANIMATION_START_SCALE: float = 0.3
const SPAWN_ANIMATION_END_ALPHA: float = 1.0
const SPAWN_ANIMATION_END_SCALE: float = 1.0
const SPAWN_ANIMATION_SPEED: float = 0.05

# Agent appearance
const CHARACTER_SPRITE_SIZE: int = 96
const CHARACTER_SPRITE_SCALE: float = 2.0
const CHARACTER_MIN_ID: int = 1
const CHARACTER_MAX_ID: int = 50
const CHARACTER_NAME_TEXT_FONT_SIZE: int = 16
const CHARACTER_NAME_TEXT_OFFSET_Y: int = -100
const CHARACTER_PROXIMITY_INDICATOR_OFFSET: int = 12
const CHARACTER_PROXIMITY_INDICATOR_WIDTH: int = 2
const CHARACTER_PROXIMITY_INDICATOR_ALPHA: float = 0.6
const CHARACTER_PROXIMITY_CIRCLE_HOVER_OFFSET: int = 0
const CHARACTER_PROXIMITY_CIRCLE_HOVER_WIDTH: int = 3
const CHARACTER_PROXIMITY_CIRCLE_HOVER_ALPHA: float = 0.8

# UI appearance
const CHARACTER_TEXT_FILL: Color = Color.WHITE
const CHARACTER_TEXT_STROKE_COLOR: Color = Color.BLACK
const CHARACTER_PROXIMITY_CIRCLE_HOVER_COLOR: Color = Color(0.376, 0.647, 0.980, 1.0)  # 60a5fa
const CHARACTER_PROXIMITY_INDICATOR_COLOR: Color = Color(0.065, 0.725, 0.506, 1.0)  # 10b981
const AGENT_NAME_TEXT_FILL: Color = Color.WHITE
const AGENT_NAME_TEXT_FONT_SIZE: int = 14
const AGENT_NAME_TEXT_OFFSET_Y: int = -60
const AGENT_STROKE_COLOR: Color = Color(0.118, 0.251, 0.686, 1.0)  # 1e40af
const AGENT_STROKE_WIDTH: int = 2
const AGENT_CIRCLE_RADIUS_OFFSET: int = 4

# Color defaults
const COLORS: Dictionary = {
	"PRIMARY": 0x3b82f6,  # Blue
	"PRIMARY_LIGHT": 0x60a5fa,
	"SUCCESS": 0x10b981,  # Green
	"ERROR": 0xff4444,  # Red
	"PARTICLE": 0x888888,
	"TILE_HIGHLIGHT": 0x3b82f6,
}

# Movement
const MOVEMENT_THROTTLE_MS: int = 50
const DRAG_THROTTLE_MS: int = 16

# WebSocket
const WS_URL: String = "ws://localhost:8765"
const WS_RECONNECT_DELAY: float = 1.0
const WS_MAX_RECONNECT_ATTEMPTS: int = 10

# Video
const CAMERA_ZOOM_MIN: float = 0.5
const CAMERA_ZOOM_MAX: float = 4.0
const CAMERA_FOLLOW_SPEED: float = 0.3

func _ready() -> void:
	print("[GameConfig] Initialized with TILE_SIZE=%d, AGENT_MOVEMENT_SPEED=%.1f" % [TILE_SIZE, AGENT_MOVEMENT_SPEED])
