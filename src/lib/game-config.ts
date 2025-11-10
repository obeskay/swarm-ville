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
} as const;
