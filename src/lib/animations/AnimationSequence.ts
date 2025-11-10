/**
 * Animation Sequence Builder
 * Chain multiple animations together
 *
 * Inspired by dioxus-motion's sequence system
 */

import { AnimationConfig, LoopMode } from './types'

export interface Animator<T> {
  animateTo(target: T, config: AnimationConfig): Promise<void>
}

export class AnimationSequence<T> {
  private steps: Array<{
    target: T
    config: AnimationConfig
  }> = []

  /**
   * Add animation step to sequence
   *
   * @example
   * ```ts
   * const sequence = new AnimationSequence()
   *   .then(100, { mode: { type: 'spring', config: SPRING_PRESETS.bouncy } })
   *   .then(50, { mode: { type: 'spring', config: SPRING_PRESETS.gentle } })
   *   .then(0, { mode: { type: 'spring', config: SPRING_PRESETS.default } })
   * ```
   */
  then(target: T, config: AnimationConfig): this {
    this.steps.push({ target, config })
    return this
  }

  /**
   * Add delay step (no animation, just wait)
   */
  wait(milliseconds: number): this {
    // Add current target with delay
    if (this.steps.length > 0) {
      const lastStep = this.steps[this.steps.length - 1]
      this.steps.push({
        target: lastStep.target,
        config: {
          ...lastStep.config,
          delay: milliseconds
        }
      })
    }
    return this
  }

  /**
   * Execute sequence on an animator
   */
  async execute(animator: Animator<T>): Promise<void> {
    for (const step of this.steps) {
      // Apply delay if configured
      if (step.config.delay && step.config.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, step.config.delay))
      }

      // Execute animation
      await animator.animateTo(step.target, step.config)
    }
  }

  /**
   * Execute with loop support
   */
  async executeWithLoop(
    animator: Animator<T>,
    loopConfig: { mode: LoopMode; count?: number }
  ): Promise<void> {
    const iterations = loopConfig.mode === LoopMode.Infinite
      ? Infinity
      : loopConfig.mode === LoopMode.Times && loopConfig.count
      ? loopConfig.count
      : 1

    for (let i = 0; i < iterations; i++) {
      await this.execute(animator)

      // For infinite loops, add small delay to prevent blocking
      if (loopConfig.mode === LoopMode.Infinite) {
        await new Promise(resolve => setTimeout(resolve, 16)) // ~1 frame
      }
    }
  }

  /**
   * Get sequence steps
   */
  getSteps(): ReadonlyArray<{ target: T; config: AnimationConfig }> {
    return [...this.steps]
  }

  /**
   * Clear all steps
   */
  clear(): this {
    this.steps = []
    return this
  }

  /**
   * Get number of steps
   */
  get length(): number {
    return this.steps.length
  }
}
