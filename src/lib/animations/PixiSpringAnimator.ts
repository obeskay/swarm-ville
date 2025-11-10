/**
 * PixiJS Spring Animator
 * Provides smooth, physics-based animations for PixiJS containers
 *
 * Inspired by dioxus-motion but adapted for PixiJS
 */

import * as PIXI from 'pixi.js'
import { SpringPhysics2D } from './SpringPhysics'
import { AnimationConfig, Vector2D } from './types'

export class PixiSpringAnimator {
  private activeAnimations = new Map<PIXI.Container, PIXI.TickerCallback<PIXI.Ticker>>()

  /**
   * Animate a sprite to target position using spring physics
   *
   * @example
   * ```ts
   * const animator = new PixiSpringAnimator()
   * await animator.animateTo(sprite, { x: 100, y: 200 }, {
   *   mode: { type: 'spring', config: SPRING_PRESETS.bouncy }
   * })
   * ```
   */
  animateTo(
    sprite: PIXI.Container,
    target: Vector2D,
    config: AnimationConfig
  ): Promise<void> {
    return new Promise((resolve) => {
      // Cancel existing animation for this sprite
      this.cancel(sprite)

      if (config.mode.type !== 'spring') {
        throw new Error('PixiSpringAnimator only supports spring mode')
      }

      const physics = new SpringPhysics2D(config.mode.config)
      const ticker = PIXI.Ticker.shared
      const epsilon = config.epsilon ?? 0.01

      // Initial state
      let velocityX = config.mode.config.velocity
      let velocityY = config.mode.config.velocity
      let currentX = sprite.x
      let currentY = sprite.y

      const callback = (ticker: PIXI.Ticker) => {
        // Convert delta from frames to seconds (assuming 60fps)
        const dt = ticker.deltaMS / 1000

        // Step physics simulation
        const result = physics.step(
          currentX, currentY,
          target.x, target.y,
          velocityX, velocityY,
          dt
        )

        // Update state
        currentX = result.position.x
        currentY = result.position.y
        velocityX = result.velocity.x
        velocityY = result.velocity.y

        // Update sprite position
        sprite.position.set(currentX, currentY)

        // Check if settled
        const settled = physics.isSettled(
          currentX, currentY,
          target.x, target.y,
          velocityX, velocityY,
          epsilon
        )

        if (settled) {
          // Snap to exact target
          sprite.position.set(target.x, target.y)

          // Cleanup
          ticker.remove(callback)
          this.activeAnimations.delete(sprite)

          // Call completion callback
          config.onComplete?.()
          resolve()
        }
      }

      // Handle delay
      if (config.delay && config.delay > 0) {
        setTimeout(() => {
          ticker.add(callback)
          this.activeAnimations.set(sprite, callback)
        }, config.delay)
      } else {
        ticker.add(callback)
        this.activeAnimations.set(sprite, callback)
      }
    })
  }

  /**
   * Animate scale with spring physics
   */
  animateScale(
    sprite: PIXI.Container,
    targetScale: number,
    config: AnimationConfig
  ): Promise<void> {
    return new Promise((resolve) => {
      this.cancel(sprite)

      if (config.mode.type !== 'spring') {
        throw new Error('PixiSpringAnimator only supports spring mode')
      }

      const physics = new SpringPhysics2D(config.mode.config)
      const ticker = PIXI.Ticker.shared
      const epsilon = config.epsilon ?? 0.01

      let velocity = config.mode.config.velocity
      let current = sprite.scale.x // Assume uniform scale

      const callback = (ticker: PIXI.Ticker) => {
        const dt = ticker.deltaMS / 1000

        const result = physics.step(
          current, current, // X axis (using for scale)
          targetScale, targetScale, // Target
          velocity, velocity,
          dt
        )

        current = result.position.x
        velocity = result.velocity.x

        sprite.scale.set(current, current)

        if (Math.abs(targetScale - current) < epsilon && Math.abs(velocity) < epsilon) {
          sprite.scale.set(targetScale, targetScale)
          ticker.remove(callback)
          this.activeAnimations.delete(sprite)
          config.onComplete?.()
          resolve()
        }
      }

      if (config.delay && config.delay > 0) {
        setTimeout(() => {
          ticker.add(callback)
          this.activeAnimations.set(sprite, callback)
        }, config.delay)
      } else {
        ticker.add(callback)
        this.activeAnimations.set(sprite, callback)
      }
    })
  }

  /**
   * Animate rotation with spring physics
   */
  animateRotation(
    sprite: PIXI.Container,
    targetRotation: number,
    config: AnimationConfig
  ): Promise<void> {
    return new Promise((resolve) => {
      this.cancel(sprite)

      if (config.mode.type !== 'spring') {
        throw new Error('PixiSpringAnimator only supports spring mode')
      }

      const physics = new SpringPhysics2D(config.mode.config)
      const ticker = PIXI.Ticker.shared
      const epsilon = config.epsilon ?? 0.01

      let velocity = config.mode.config.velocity
      let current = sprite.rotation

      const callback = (ticker: PIXI.Ticker) => {
        const dt = ticker.deltaMS / 1000

        const result = physics.step(
          current, current,
          targetRotation, targetRotation,
          velocity, velocity,
          dt
        )

        current = result.position.x
        velocity = result.velocity.x

        sprite.rotation = current

        if (Math.abs(targetRotation - current) < epsilon && Math.abs(velocity) < epsilon) {
          sprite.rotation = targetRotation
          ticker.remove(callback)
          this.activeAnimations.delete(sprite)
          config.onComplete?.()
          resolve()
        }
      }

      if (config.delay && config.delay > 0) {
        setTimeout(() => {
          ticker.add(callback)
          this.activeAnimations.set(sprite, callback)
        }, config.delay)
      } else {
        ticker.add(callback)
        this.activeAnimations.set(sprite, callback)
      }
    })
  }

  /**
   * Cancel animation for a sprite
   */
  cancel(sprite: PIXI.Container): void {
    const callback = this.activeAnimations.get(sprite)
    if (callback) {
      PIXI.Ticker.shared.remove(callback)
      this.activeAnimations.delete(sprite)
    }
  }

  /**
   * Cancel all animations
   */
  cancelAll(): void {
    for (const [sprite, callback] of this.activeAnimations) {
      PIXI.Ticker.shared.remove(callback)
    }
    this.activeAnimations.clear()
  }

  /**
   * Check if sprite is currently animating
   */
  isAnimating(sprite: PIXI.Container): boolean {
    return this.activeAnimations.has(sprite)
  }

  /**
   * Get count of active animations
   */
  getActiveCount(): number {
    return this.activeAnimations.size
  }
}

/**
 * Global animator instance for convenience
 * Can be used across the application
 */
export const globalPixiAnimator = new PixiSpringAnimator()
