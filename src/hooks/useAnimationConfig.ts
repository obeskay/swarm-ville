/**
 * useAnimationConfig Hook
 * Provides access to animation configuration throughout the app
 * ZERO HARDCODING - all animation timings and easing come from config
 */

import { useContext } from "react";
import { ConfigContext } from "@/providers/ConfigProvider";

/**
 * Hook to access animations configuration
 *
 * Usage:
 * const animations = useAnimationConfig();
 * const duration = animations.duration.normal; // 150ms
 * const easing = animations.easing.easeInOut;
 *
 * @throws Error if used outside of ConfigProvider
 * @returns Animations configuration object
 */
export function useAnimationConfig() {
  const config = useContext(ConfigContext);

  if (!config) {
    throw new Error(
      "useAnimationConfig must be used within a ConfigProvider. " +
        "Make sure your app is wrapped with <ConfigProvider></ConfigProvider>"
    );
  }

  return config.animations;
}

/**
 * Hook to access animation duration presets
 *
 * Usage:
 * const durations = useAnimationDuration();
 * const speed = durations.normal; // 150
 */
export function useAnimationDuration() {
  const animations = useAnimationConfig();
  return animations.duration;
}

/**
 * Hook to access easing functions
 *
 * Usage:
 * const easings = useAnimationEasing();
 * const easeInOut = easings.easeInOut;
 */
export function useAnimationEasing() {
  const animations = useAnimationConfig();
  return animations.easing;
}

/**
 * Hook to access transition specifications for UI elements
 *
 * Usage:
 * const transitions = useTransitions();
 * const buttonTransition = transitions.buttonHover;
 */
export function useTransitions() {
  const animations = useAnimationConfig();
  return animations.transitions;
}

/**
 * Hook to get a transition CSS property string
 *
 * Usage:
 * const transitionCSS = useTransitionCSS('buttonHover');
 * // Returns: "all 150ms cubic-bezier(...)"
 */
export function useTransitionCSS(transitionKey: string) {
  const transitions = useTransitions();
  const transition = (transitions as Record<string, any>)[transitionKey];

  if (!transition) {
    console.warn(`Transition '${transitionKey}' not found in animations config`);
    return "";
  }

  return `${transition.properties} ${transition.duration}ms ${transition.easing}`;
}

/**
 * Hook to access keyframe animations
 *
 * Usage:
 * const keyframes = useKeyframes();
 * const fadeIn = keyframes.fadeIn;
 */
export function useKeyframes() {
  const animations = useAnimationConfig();
  return animations.keyframes;
}

/**
 * Hook to access game-specific animations
 *
 * Usage:
 * const gameAnims = useGameAnimations();
 * const moveSpeed = gameAnims.characterMove.duration;
 */
export function useGameAnimations() {
  const animations = useAnimationConfig();
  return animations.game;
}

/**
 * Hook to access animation delay presets
 *
 * Usage:
 * const delays = useAnimationDelay();
 * const mediumDelay = delays.md; // 150ms
 */
export function useAnimationDelay() {
  const animations = useAnimationConfig();
  return animations.delay;
}
