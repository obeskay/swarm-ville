/**
 * React Hook for UI Animations
 * Uses Framer Motion under the hood
 * API inspired by dioxus-motion's use_motion
 */

import { useSpring, useMotionValue, animate, AnimationPlaybackControls } from 'framer-motion'
import { useState, useRef, useCallback } from 'react'
import { SpringConfig, AnimationConfig } from '@/lib/animations/types'

/**
 * Hook for animating a single value with spring physics
 *
 * @example
 * ```tsx
 * function Component() {
 *   const scale = useMotion(1.0)
 *
 *   const handleClick = () => {
 *     scale.animateTo(1.2, {
 *       mode: { type: 'spring', config: SPRING_PRESETS.bouncy }
 *     })
 *   }
 *
 *   return (
 *     <motion.div style={{ scale: scale.value }}>
 *       <button onClick={handleClick}>Animate</button>
 *     </motion.div>
 *   )
 * }
 * ```
 */
export function useMotion(initialValue: number) {
  const motionValue = useMotionValue(initialValue)
  const animationRef = useRef<AnimationPlaybackControls | null>(null)

  const animateTo = useCallback((
    target: number,
    config: AnimationConfig
  ) => {
    // Cancel existing animation
    if (animationRef.current) {
      animationRef.current.stop()
    }

    if (config.mode.type === 'spring') {
      const springConfig = config.mode.config

      // Convert our spring config to Framer Motion format
      const controls = animate(motionValue, target, {
        type: "spring",
        stiffness: springConfig.stiffness,
        damping: springConfig.damping,
        mass: springConfig.mass,
        velocity: springConfig.velocity,
        delay: (config.delay ?? 0) / 1000, // Convert ms to seconds
        onComplete: config.onComplete
      })

      animationRef.current = controls
      return controls
    } else if (config.mode.type === 'tween') {
      const tweenConfig = config.mode.config

      const controls = animate(motionValue, target, {
        duration: tweenConfig.duration / 1000, // Convert ms to seconds
        ease: config.mode.config.easing,
        delay: (config.delay ?? 0) / 1000,
        onComplete: config.onComplete
      })

      animationRef.current = controls
      return controls
    }
  }, [motionValue])

  const get = useCallback(() => motionValue.get(), [motionValue])
  const set = useCallback((value: number) => motionValue.set(value), [motionValue])
  const stop = useCallback(() => animationRef.current?.stop(), [])

  return {
    value: motionValue,
    animateTo,
    get,
    set,
    stop
  }
}

/**
 * Hook for animating multiple values together
 *
 * @example
 * ```tsx
 * const { x, y, scale } = useMotionValues({
 *   x: 0,
 *   y: 0,
 *   scale: 1
 * })
 *
 * const animateAll = () => {
 *   x.animateTo(100, springConfig)
 *   y.animateTo(100, springConfig)
 *   scale.animateTo(1.5, springConfig)
 * }
 * ```
 */
export function useMotionValues<T extends Record<string, number>>(
  initialValues: T
): Record<keyof T, ReturnType<typeof useMotion>> {
  const [motions] = useState(() => {
    const result: any = {}
    for (const key in initialValues) {
      result[key] = {
        value: useMotionValue(initialValues[key]),
        animationRef: { current: null }
      }
    }
    return result
  })

  const result: any = {}
  for (const key in motions) {
    const motion = motions[key]
    result[key] = {
      value: motion.value,
      animateTo: useCallback((target: number, config: AnimationConfig) => {
        if (motion.animationRef.current) {
          motion.animationRef.current.stop()
        }

        if (config.mode.type === 'spring') {
          const springConfig = config.mode.config
          const controls = animate(motion.value, target, {
            type: "spring",
            stiffness: springConfig.stiffness,
            damping: springConfig.damping,
            mass: springConfig.mass,
            velocity: springConfig.velocity,
            delay: (config.delay ?? 0) / 1000,
            onComplete: config.onComplete
          })
          motion.animationRef.current = controls
          return controls
        }
      }, [motion]),
      get: useCallback(() => motion.value.get(), [motion]),
      set: useCallback((value: number) => motion.value.set(value), [motion]),
      stop: useCallback(() => motion.animationRef.current?.stop(), [motion])
    }
  }

  return result
}
