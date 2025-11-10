/**
 * Animation System - Main Export
 * Inspired by dioxus-motion design principles
 * Adapted for React + PixiJS
 */

// Core types
export * from './types'

// Physics engine
export { SpringPhysics, SpringPhysics2D } from './SpringPhysics'

// PixiJS integration
export { PixiSpringAnimator, globalPixiAnimator } from './PixiSpringAnimator'

// Utilities
export { AnimationSequence } from './AnimationSequence'
export { SPRING_PRESETS, ANIMATION_PRESETS, createSpringConfig, createAnimationConfig } from './presets'

// Re-export commonly used types for convenience
export type {
  Vector2D,
  SpringConfig,
  TweenConfig,
  AnimationMode,
  AnimationConfig,
  Animatable
} from './types'

export { LoopMode, EASINGS } from './types'
