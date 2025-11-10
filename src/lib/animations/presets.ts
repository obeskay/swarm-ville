/**
 * Animation Presets
 * Pre-configured spring and animation settings for common use cases
 *
 * Inspired by dioxus-motion's preset system
 */

import { SpringConfig, AnimationConfig, LoopMode } from './types'

/**
 * Spring physics presets
 * Each preset is optimized for different animation feels
 */
export const SPRING_PRESETS = {
  /** Gentle, smooth spring - Best for UI transitions */
  gentle: {
    stiffness: 120,
    damping: 14,
    mass: 1,
    velocity: 0
  },

  /** Quick, snappy response - Best for buttons and interactions */
  snappy: {
    stiffness: 400,
    damping: 28,
    mass: 1,
    velocity: 0
  },

  /** Bouncy, playful - Best for attention-grabbing animations */
  bouncy: {
    stiffness: 300,
    damping: 8,
    mass: 1,
    velocity: 5
  },

  /** Slow, smooth - Best for large movements */
  slow: {
    stiffness: 60,
    damping: 20,
    mass: 2,
    velocity: 0
  },

  /** Default (balanced) - Good for most use cases */
  default: {
    stiffness: 170,
    damping: 26,
    mass: 1,
    velocity: 0
  },

  /** Wobbly - Lots of overshoot, fun effect */
  wobbly: {
    stiffness: 180,
    damping: 12,
    mass: 1,
    velocity: 0
  },

  /** Stiff - Almost no overshoot, very direct */
  stiff: {
    stiffness: 500,
    damping: 35,
    mass: 1,
    velocity: 0
  },

  /** Molasses - Very slow and smooth */
  molasses: {
    stiffness: 30,
    damping: 25,
    mass: 3,
    velocity: 0
  }
} as const satisfies Record<string, SpringConfig>

/**
 * Complete animation presets with common configurations
 */
export const ANIMATION_PRESETS = {
  /** Fade in effect */
  fadeIn: {
    mode: { type: 'spring' as const, config: SPRING_PRESETS.gentle }
  },

  /** Pop in effect (scale + fade) */
  popIn: {
    mode: { type: 'spring' as const, config: SPRING_PRESETS.bouncy }
  },

  /** Slide in from direction */
  slideIn: {
    mode: { type: 'spring' as const, config: SPRING_PRESETS.snappy }
  },

  /** Pulsing animation (infinite loop) */
  pulse: {
    mode: { type: 'spring' as const, config: SPRING_PRESETS.bouncy },
    loop: { mode: LoopMode.Infinite }
  },

  /** Shake animation */
  shake: {
    mode: { type: 'spring' as const, config: SPRING_PRESETS.stiff }
  },

  /** Smooth movement */
  smoothMove: {
    mode: { type: 'spring' as const, config: SPRING_PRESETS.default }
  }
} as const satisfies Record<string, AnimationConfig>

/**
 * Helper to create custom spring config
 */
export function createSpringConfig(
  overrides: Partial<SpringConfig> = {}
): SpringConfig {
  return {
    ...SPRING_PRESETS.default,
    ...overrides
  }
}

/**
 * Helper to create custom animation config
 */
export function createAnimationConfig(
  overrides: Partial<AnimationConfig> = {}
): AnimationConfig {
  return {
    mode: { type: 'spring', config: SPRING_PRESETS.default },
    ...overrides
  }
}
