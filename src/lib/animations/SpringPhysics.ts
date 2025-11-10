/**
 * Spring Physics Engine
 * Based on Hooke's Law: F = -kx (spring force)
 * And damping: F_damping = -cv (velocity damping)
 *
 * Inspired by dioxus-motion's spring implementation
 */

import { SpringConfig } from './types'

export interface SpringStepResult {
  position: number
  velocity: number
}

/**
 * Spring physics simulator
 * Implements realistic spring dynamics with damping
 */
export class SpringPhysics {
  constructor(private config: SpringConfig) {}

  /**
   * Compute next state using spring physics
   *
   * Physics equations:
   * - Spring Force: F_spring = -k * (x - x_target) where k = stiffness
   * - Damping Force: F_damping = -c * v where c = damping
   * - Total Force: F = F_spring - F_damping
   * - Acceleration: a = F / m where m = mass
   * - Velocity: v_new = v + a * dt
   * - Position: x_new = x + v * dt
   *
   * @param current Current position
   * @param target Target position
   * @param velocity Current velocity
   * @param deltaTime Time step in seconds
   * @returns New position and velocity
   */
  step(
    current: number,
    target: number,
    velocity: number,
    deltaTime: number
  ): SpringStepResult {
    const { stiffness, damping, mass } = this.config

    // Calculate spring force (Hooke's Law)
    // F = -k * displacement
    const displacement = current - target
    const springForce = -stiffness * displacement

    // Calculate damping force
    // F = -c * velocity
    const dampingForce = -damping * velocity

    // Total force
    const totalForce = springForce + dampingForce

    // Calculate acceleration (F = ma, so a = F/m)
    const acceleration = totalForce / mass

    // Update velocity using Euler integration
    const newVelocity = velocity + acceleration * deltaTime

    // Update position using Euler integration
    const newPosition = current + newVelocity * deltaTime

    return {
      position: newPosition,
      velocity: newVelocity
    }
  }

  /**
   * Check if animation has settled
   *
   * Animation is considered settled when:
   * 1. Position is within epsilon of target
   * 2. Velocity is near zero
   *
   * @param current Current position
   * @param target Target position
   * @param velocity Current velocity
   * @param epsilon Threshold for "close enough" (default 0.01)
   */
  isSettled(
    current: number,
    target: number,
    velocity: number,
    epsilon = 0.01
  ): boolean {
    const positionDiff = Math.abs(target - current)
    const velocityMag = Math.abs(velocity)

    return positionDiff < epsilon && velocityMag < epsilon
  }

  /**
   * Get spring configuration
   */
  getConfig(): Readonly<SpringConfig> {
    return { ...this.config }
  }

  /**
   * Update spring configuration
   */
  setConfig(config: Partial<SpringConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

/**
 * 2D Spring Physics for vector animations
 */
export class SpringPhysics2D {
  private xPhysics: SpringPhysics
  private yPhysics: SpringPhysics

  constructor(config: SpringConfig) {
    this.xPhysics = new SpringPhysics(config)
    this.yPhysics = new SpringPhysics(config)
  }

  /**
   * Step both X and Y physics
   */
  step(
    currentX: number,
    currentY: number,
    targetX: number,
    targetY: number,
    velocityX: number,
    velocityY: number,
    deltaTime: number
  ): {
    position: { x: number; y: number }
    velocity: { x: number; y: number }
  } {
    const xResult = this.xPhysics.step(currentX, targetX, velocityX, deltaTime)
    const yResult = this.yPhysics.step(currentY, targetY, velocityY, deltaTime)

    return {
      position: { x: xResult.position, y: yResult.position },
      velocity: { x: xResult.velocity, y: yResult.velocity }
    }
  }

  /**
   * Check if both axes have settled
   */
  isSettled(
    currentX: number,
    currentY: number,
    targetX: number,
    targetY: number,
    velocityX: number,
    velocityY: number,
    epsilon = 0.01
  ): boolean {
    return (
      this.xPhysics.isSettled(currentX, targetX, velocityX, epsilon) &&
      this.yPhysics.isSettled(currentY, targetY, velocityY, epsilon)
    )
  }

  /**
   * Update configuration for both axes
   */
  setConfig(config: Partial<SpringConfig>): void {
    this.xPhysics.setConfig(config)
    this.yPhysics.setConfig(config)
  }
}
