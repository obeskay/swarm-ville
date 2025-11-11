/**
 * Game Configuration
 * Centralized settings for gameplay feel and balance
 */

export const GAME_CONFIG = {
  // Movement
  MOVEMENT_SPEED: 3.5, // Pixels per frame (increased from 3)
  MOVEMENT_ACCELERATION: 0.2, // Smoothness of movement start
  MOVEMENT_DECELERATION: 0.15, // Smoothness of movement stop

  // Collision
  HITBOX_WIDTH: 20, // Character hitbox width in pixels (smaller than tile)
  HITBOX_HEIGHT: 16, // Character hitbox height
  HITBOX_OFFSET_Y: -8, // Offset from sprite anchor

  // Camera
  CAMERA_LERP_SPEED: 0.15, // Camera follow smoothness (0-1, higher = faster)
  CAMERA_MIN_ZOOM: 1.0, // Minimum zoom level
  CAMERA_MAX_ZOOM: 4.0, // Maximum zoom level
  CAMERA_DEFAULT_ZOOM: 2.5, // Starting zoom level
  CAMERA_ZOOM_SPEED: 0.15, // How fast zoom changes

  // Interaction
  INTERACTION_RADIUS: 48, // Pixels - how close to interact
  PROXIMITY_RADIUS: 96, // Pixels - proximity detection range
  CLICK_THRESHOLD: 5, // Pixels - differentiate click from drag

  // Visual Feedback
  COLLISION_BOUNCE_DISTANCE: 6, // Pixels to bounce back on collision
  COLLISION_SHAKE_AMOUNT: 4, // Camera shake intensity
  HOVER_SCALE: 1.12, // Scale multiplier on hover
  CLICK_SCALE: 0.85, // Scale multiplier on click

  // Performance
  PARTICLE_POOL_SIZE: 100,
  MAX_PARTICLES: 50,
  CULL_PADDING: 200, // Extra pixels around viewport for culling

  // Throttling
  MOVEMENT_THROTTLE_MS: 100, // Max 10 moves per second
  DRAG_THROTTLE_MS: 150, // Throttle drag movement
  POSITION_SYNC_THROTTLE_MS: 100, // WebSocket position sync throttle

  // Grid & Tiles
  TILE_SIZE: 32, // Pixels per tile
  GRID_WIDTH: 48, // Standard grid width in tiles
  GRID_HEIGHT: 48, // Standard grid height in tiles
  CHARACTER_GRID_SIZE: 0.6, // Character size relative to tile (0.6 = 60% of tile)

  // Animations
  SPAWN_ANIMATION_SPEED: 0.08, // Progress increment per frame
  SPAWN_ANIMATION_END_SCALE: 1.0, // Final scale after spawn
  SPAWN_ANIMATION_START_SCALE: 0.5, // Initial scale on spawn
  SPAWN_ANIMATION_START_ALPHA: 0, // Initial alpha on spawn
  SPAWN_ANIMATION_END_ALPHA: 1.0, // Final alpha on spawn

  // Proximity & Detection
  PROXIMITY_CIRCLE_RADIUS_TILES: 5, // Radius in tiles
  WAYPOINT_REACHED_DISTANCE: 10, // Pixels - distance to consider waypoint reached

  // Colors
  COLORS: {
    PRIMARY: 0x3b82f6, // Blue
    PRIMARY_LIGHT: 0x60a5fa, // Light blue
    SUCCESS: 0x10b981, // Green
    ERROR: 0xff4444, // Red
    PARTICLE: 0x888888, // Gray
    TILE_HIGHLIGHT: 0x3b82f6, // Blue
    TILE_HIGHLIGHT_ALPHA: 0.15,
    PROXIMITY_CIRCLE_ALPHA: 0.3,
    PROXIMITY_CIRCLE_FILL_ALPHA: 0.05,
  },

  // Particle Properties
  MOVEMENT_PARTICLE_SPAWN_CHANCE: 0.3, // 30% chance to spawn
  MOVEMENT_PARTICLE_SIZE_MIN: 2,
  MOVEMENT_PARTICLE_SIZE_MAX: 4,
  MOVEMENT_PARTICLE_OFFSET: 8,
  MOVEMENT_PARTICLE_ALPHA: 0.4,
  MOVEMENT_PARTICLE_ALPHA_DECAY: 0.04,
  MOVEMENT_PARTICLE_SCALE_GROWTH: 0.1,

  // Character Sprite
  CHARACTER_SPRITE_SIZE: 48, // Each frame is 48x48 pixels
  CHARACTER_SPRITE_SCALE: 2.0, // 2x size for visibility (96x96 rendered)
  CHARACTER_MOVEMENT_SPEED: 4, // Pixels per frame
  CHARACTER_ANIMATION_SPEED: 0.15, // Animation frame speed
  CHARACTER_SPRITESHEET_COLUMNS: 4, // 4 animation frames per direction
  CHARACTER_SPRITESHEET_ROWS: 4, // 4 directions (DOWN, LEFT, RIGHT, UP)
  CHARACTER_MAX_ID: 83, // Maximum character ID (1-83 range)
  CHARACTER_MIN_ID: 1, // Minimum character ID
  CHARACTER_DEFAULT_ID: 1, // Default character when ID out of range
  CHARACTER_TEXT_FONT_SIZE: 10,
  CHARACTER_TEXT_FILL: 0xffffff,
  CHARACTER_TEXT_STROKE_COLOR: 0x000000,
  CHARACTER_TEXT_STROKE_WIDTH: 2,
  CHARACTER_TEXT_OFFSET_Y: -8, // Offset below sprite
  CHARACTER_NAME_LABEL_OFFSET: -40, // Position above sprite

  // Character Interaction - GSAP Animations
  CHARACTER_HOVER_SCALE: 1.15,
  CHARACTER_HOVER_TEXT_SCALE: 1.1,
  CHARACTER_HOVER_DURATION: 0.2,
  CHARACTER_PROXIMITY_CIRCLE_RADIUS_OFFSET: 6, // TILE_SIZE / 2 + 6
  CHARACTER_PROXIMITY_CIRCLE_HOVER_OFFSET: 6,
  CHARACTER_PROXIMITY_CIRCLE_HOVER_WIDTH: 3,
  CHARACTER_PROXIMITY_CIRCLE_HOVER_ALPHA: 0.8,
  CHARACTER_PROXIMITY_CIRCLE_HOVER_COLOR: 0x60a5fa,
  CHARACTER_CLICK_SCALE_X: 0.8,
  CHARACTER_CLICK_SCALE_Y: 1.1,
  CHARACTER_CLICK_DURATION: 0.1,
  CHARACTER_SPRING_BACK_DURATION: 0.3,
  CHARACTER_SPRING_BACK_DELAY: 0.1,
  CHARACTER_BOUNCE_ROTATION: 0.05,
  CHARACTER_BOUNCE_DURATION: 0.1,
  CHARACTER_TILT_MAX_ANGLE: 0.1,
  CHARACTER_TILT_DIVISOR: 100,
  CHARACTER_TILT_DURATION: 0.15,
  CHARACTER_DRAG_ALPHA: 0.8,
  CHARACTER_DRAG_DURATION: 0.1,
  CHARACTER_DRAG_RESTORE_DURATION: 0.2,
  CHARACTER_TOUCH_SCALE: 1.2,
  CHARACTER_TOUCH_DURATION: 0.15,

  // Character Movement Animation
  CHARACTER_MOVEMENT_STRETCH_AMOUNT: 0.08, // Squash/stretch effect during movement
  CHARACTER_MOVEMENT_STRETCH_Y_SCALE: 0.5, // Vertical squash multiplier
  CHARACTER_PROXIMITY_INDICATOR_COLOR: 0x10b981, // Green
  CHARACTER_PROXIMITY_INDICATOR_WIDTH: 2,
  CHARACTER_PROXIMITY_INDICATOR_ALPHA: 0.6,
  CHARACTER_PROXIMITY_INDICATOR_OFFSET: 4, // TILE_SIZE / 2 + 4

  // Agent Sprite Movement
  AGENT_MOVEMENT_SPEED: 6, // Pixels per frame (smooth like Gather Clone)
  AGENT_NAME_TEXT_FONT_SIZE: 10,
  AGENT_NAME_TEXT_FILL: 0xffffff,
  AGENT_NAME_TEXT_OFFSET_Y: -32, // Position above agent
  AGENT_CIRCLE_RADIUS_OFFSET: 2, // TILE_SIZE / 2 - 2
  AGENT_STROKE_COLOR: 0x1e40af, // Dark blue
  AGENT_STROKE_WIDTH: 2,

  // Collision Detection
  COLLISION_CHECK_RADIUS: 0.6, // Character collision width/height relative to tile
  NEAREST_WALKABLE_MAX_RADIUS: 3, // Max search radius for nearest walkable tile

  // Grid Renderer
  GRID_LAYER_OPACITY_FLOOR: 1,
  GRID_LAYER_OPACITY_ABOVE_FLOOR: 1,
  GRID_LAYER_OPACITY_OBJECT: 1,
} as const;
