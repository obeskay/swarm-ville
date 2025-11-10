/**
 * Animation System Types
 * Inspired by dioxus-motion design principles
 * Adapted for React + PixiJS architecture
 */

/** 2D Vector for position/movement */
export interface Vector2D {
  x: number
  y: number
}

/** Spring physics configuration */
export interface SpringConfig {
  /** How tight the spring is (100-500, higher = tighter) */
  stiffness: number

  /** How quickly it settles (5-40, higher = faster settle) */
  damping: number

  /** Weight of animated object (0.1-5, higher = heavier) */
  mass: number

  /** Initial velocity */
  velocity: number
}

/** Easing function type */
export type EasingFunction = (t: number) => number

/** Tween animation configuration */
export interface TweenConfig {
  /** Duration in milliseconds */
  duration: number

  /** Easing function */
  easing: EasingFunction
}

/** Animation mode union type */
export type AnimationMode =
  | { type: 'spring'; config: SpringConfig }
  | { type: 'tween'; config: TweenConfig }

/** Loop behavior */
export enum LoopMode {
  Once = 'once',
  Times = 'times',
  Infinite = 'infinite'
}

/** Loop configuration */
export interface LoopConfig {
  mode: LoopMode
  count?: number
}

/** Complete animation configuration */
export interface AnimationConfig {
  mode: AnimationMode
  loop?: LoopConfig
  delay?: number
  onComplete?: () => void
  epsilon?: number
}

/** Animatable trait - types that can be animated */
export interface Animatable<T> {
  /**
   * Linear interpolation between this and target
   * @param target Target value
   * @param t Interpolation factor (0-1)
   */
  interpolate(target: T, t: number): T

  /**
   * Calculate magnitude/distance
   * Used to determine when animation has settled
   */
  magnitude(): number
}

/** Animation state */
export interface AnimationState<T> {
  current: T
  target: T
  velocity: T
  isAnimating: boolean
  startTime: number
  config: AnimationConfig
}

/** Easing functions (common presets) */
export const EASINGS = {
  linear: (t: number) => t,

  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  easeInOut: (t: number) =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
} as const
