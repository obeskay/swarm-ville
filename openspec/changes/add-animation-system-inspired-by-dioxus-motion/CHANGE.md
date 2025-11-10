# Add Animation System Inspired by Dioxus-Motion

**Status:** `proposed`
**Created:** 2025-11-09
**Author:** AI Assistant
**Affects:** `frontend`, `ui`, `game-engine`

## Overview

Integrate a comprehensive animation system for SwarmVille inspired by the design principles of [dioxus-motion](https://github.com/wheregmis/dioxus-motion), adapted for our React + PixiJS architecture. This change introduces physics-based animations, smooth transitions, and an intuitive API for both UI components and game sprites.

## Problem Statement

Currently, SwarmVille lacks a cohesive animation system:

1. **No UI Animations:** Components appear/disappear abruptly without transitions
2. **Limited Sprite Movement:** Agent movement uses basic position updates without smooth interpolation
3. **No Physics:** All animations are linear, lacking natural spring/bounce effects
4. **Inconsistent API:** Different animation approaches across UI and game layers
5. **Poor UX:** Static interface feels less engaging and professional

### Current Limitations

```typescript
// Current approach - abrupt, no animation
agent.position.x = targetX
agent.position.y = targetY

// No UI transitions
{isOpen && <Dialog />} // Pops in instantly
```

## Solution

Implement a dual-layer animation system:

### Layer 1: Framer Motion for UI Components
Handle React component animations, page transitions, and layout shifts.

### Layer 2: Custom Spring Physics for PixiJS
Provide smooth, physics-based animations for game sprites and agents.

### Layer 3: Unified Animation API
Create a consistent interface bridging both systems.

## Design Principles (from dioxus-motion)

### 1. Simplified API
- Minimal boilerplate
- Composable primitives
- Type-safe contracts

### 2. Physics-Based Motion
- Spring dynamics (stiffness, damping, mass)
- Natural-feeling animations
- Configurable easing

### 3. Sequence Support
- Chain multiple animations
- Delay and timing control
- Loop modes (once, n-times, infinite)

### 4. Cross-Layer Consistency
- Same mental model for UI and game
- Shared configuration types
- Unified timing/easing

## Technical Specification

### Architecture

```
┌─────────────────────────────────────────────┐
│          SwarmVille Animation System         │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────┐  ┌─────────────────┐ │
│  │   UI Layer       │  │   Game Layer    │ │
│  │  (Framer Motion) │  │  (Custom Spring)│ │
│  └──────────────────┘  └─────────────────┘ │
│           │                     │           │
│           └─────────┬───────────┘           │
│                     │                       │
│         ┌───────────▼──────────┐            │
│         │  Unified API Layer   │            │
│         │  - SpringConfig      │            │
│         │  - AnimationSequence │            │
│         │  - LoopMode          │            │
│         └──────────────────────┘            │
└─────────────────────────────────────────────┘
```

### Core Types

```typescript
// src/lib/animations/types.ts

/** Spring physics configuration */
export interface SpringConfig {
  stiffness: number   // How tight the spring (100-500)
  damping: number     // How quickly it settles (5-40)
  mass: number        // Weight of animated object (0.1-5)
  velocity: number    // Initial velocity
}

/** Tween animation configuration */
export interface TweenConfig {
  duration: number    // Milliseconds
  easing: EasingFunction
}

/** Animation mode */
export type AnimationMode =
  | { type: 'spring'; config: SpringConfig }
  | { type: 'tween'; config: TweenConfig }

/** Loop behavior */
export enum LoopMode {
  Once = 'once',
  Times = 'times',
  Infinite = 'infinite'
}

/** Complete animation configuration */
export interface AnimationConfig {
  mode: AnimationMode
  loop?: { mode: LoopMode; count?: number }
  delay?: number
  onComplete?: () => void
}

/** Animatable contract */
export interface Animatable<T> {
  interpolate(target: T, t: number): T
  magnitude(): number
}
```

### Implementation Files

#### 1. Spring Physics Engine

**File:** `src/lib/animations/SpringPhysics.ts`

```typescript
export class SpringPhysics {
  constructor(
    private config: SpringConfig
  ) {}

  /**
   * Compute next state using spring physics
   * Based on Hooke's Law: F = -kx
   */
  step(
    current: number,
    target: number,
    velocity: number,
    deltaTime: number
  ): { position: number; velocity: number } {
    const { stiffness, damping, mass } = this.config

    // Calculate spring force
    const force = (target - current) * stiffness

    // Calculate damping force
    const dampingForce = velocity * damping

    // Calculate acceleration (F = ma => a = F/m)
    const acceleration = (force - dampingForce) / mass

    // Update velocity
    const newVelocity = velocity + acceleration * deltaTime

    // Update position
    const newPosition = current + newVelocity * deltaTime

    return {
      position: newPosition,
      velocity: newVelocity
    }
  }

  /**
   * Check if animation has settled
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
}
```

#### 2. PixiJS Spring Animator

**File:** `src/lib/animations/PixiSpringAnimator.ts`

```typescript
import * as PIXI from 'pixi.js'
import { SpringPhysics } from './SpringPhysics'
import { AnimationConfig, Vector2D } from './types'

export class PixiSpringAnimator {
  private activeAnimations = new Map<PIXI.Container, PIXI.TickerCallback>()

  /**
   * Animate a sprite to target position using spring physics
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

      const physics = new SpringPhysics(config.mode.config)
      const ticker = PIXI.Ticker.shared

      let velocityX = config.mode.config.velocity
      let velocityY = config.mode.config.velocity
      let currentX = sprite.x
      let currentY = sprite.y

      const callback = (delta: number) => {
        // Delta is typically in frames (60fps), convert to seconds
        const dt = delta / 60

        // Compute next state for X axis
        const nextX = physics.step(currentX, target.x, velocityX, dt)
        currentX = nextX.position
        velocityX = nextX.velocity

        // Compute next state for Y axis
        const nextY = physics.step(currentY, target.y, velocityY, dt)
        currentY = nextY.position
        velocityY = nextY.velocity

        // Update sprite position
        sprite.position.set(currentX, currentY)

        // Check if settled
        const settledX = physics.isSettled(currentX, target.x, velocityX)
        const settledY = physics.isSettled(currentY, target.y, velocityY)

        if (settledX && settledY) {
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

      // Start animation
      ticker.add(callback)
      this.activeAnimations.set(sprite, callback)
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
}
```

#### 3. Animation Sequence Builder

**File:** `src/lib/animations/AnimationSequence.ts`

```typescript
export class AnimationSequence<T> {
  private steps: Array<{
    target: T
    config: AnimationConfig
  }> = []

  /**
   * Add animation step to sequence
   */
  then(target: T, config: AnimationConfig): this {
    this.steps.push({ target, config })
    return this
  }

  /**
   * Execute sequence on a motion instance
   */
  async execute(
    animator: { animateTo: (target: T, config: AnimationConfig) => Promise<void> }
  ): Promise<void> {
    for (const step of this.steps) {
      // Apply delay if configured
      if (step.config.delay) {
        await new Promise(r => setTimeout(r, step.config.delay))
      }

      // Execute animation
      await animator.animateTo(step.target, step.config)
    }
  }

  /**
   * Execute with loop support
   */
  async executeWithLoop(
    animator: { animateTo: (target: T, config: AnimationConfig) => Promise<void> },
    loopConfig: { mode: LoopMode; count?: number }
  ): Promise<void> {
    const iterations = loopConfig.mode === LoopMode.Infinite
      ? Infinity
      : loopConfig.mode === LoopMode.Times
      ? loopConfig.count || 1
      : 1

    for (let i = 0; i < iterations; i++) {
      await this.execute(animator)
    }
  }
}
```

#### 4. React Hook for UI Animations

**File:** `src/hooks/useMotion.ts`

```typescript
import { useSpring, UseSpringProps } from 'framer-motion'
import { SpringConfig } from '@/lib/animations/types'

/**
 * Hook for UI component animations using Framer Motion
 * API inspired by dioxus-motion's use_motion
 */
export function useMotion(initialValue: number) {
  const [value, api] = useSpring(initialValue)

  const animateTo = (
    target: number,
    config: SpringConfig
  ) => {
    api.start({
      to: target,
      config: {
        tension: config.stiffness,
        friction: config.damping,
        mass: config.mass,
        velocity: config.velocity
      }
    })
  }

  return {
    value,
    animateTo,
    get: () => value.get(),
    set: (v: number) => value.set(v)
  }
}
```

#### 5. Preset Configurations

**File:** `src/lib/animations/presets.ts`

```typescript
export const SPRING_PRESETS = {
  // Gentle, smooth spring
  gentle: {
    stiffness: 120,
    damping: 14,
    mass: 1,
    velocity: 0
  },

  // Quick, snappy response
  snappy: {
    stiffness: 400,
    damping: 28,
    mass: 1,
    velocity: 0
  },

  // Bouncy, playful
  bouncy: {
    stiffness: 300,
    damping: 8,
    mass: 1,
    velocity: 5
  },

  // Slow, smooth
  slow: {
    stiffness: 60,
    damping: 20,
    mass: 2,
    velocity: 0
  },

  // Default (balanced)
  default: {
    stiffness: 170,
    damping: 26,
    mass: 1,
    velocity: 0
  }
} as const satisfies Record<string, SpringConfig>
```

### Integration Points

#### Agent Movement Animation

**Before:**
```typescript
// src/lib/pixi/CharacterSprite.ts (current)
updatePosition(x: number, y: number) {
  this.container.x = x
  this.container.y = y
}
```

**After:**
```typescript
// src/lib/pixi/CharacterSprite.ts (with animation)
private animator = new PixiSpringAnimator()

async moveTo(x: number, y: number) {
  await this.animator.animateTo(
    this.container,
    { x, y },
    {
      mode: {
        type: 'spring',
        config: SPRING_PRESETS.gentle
      }
    }
  )
}
```

#### UI Component Transitions

**Before:**
```tsx
// src/components/agents/AgentDialog.tsx (current)
{isOpen && <Dialog>...</Dialog>}
```

**After:**
```tsx
// src/components/agents/AgentDialog.tsx (with animation)
import { motion, AnimatePresence } from 'framer-motion'

<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
    >
      <Dialog>...</Dialog>
    </motion.div>
  )}
</AnimatePresence>
```

#### Space Transitions

**File:** `src/lib/animations/transitions.ts`

```typescript
export const PAGE_TRANSITIONS = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },

  slideLeft: {
    initial: { x: 300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 }
  },

  zoomIn: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.2, opacity: 0 }
  }
} as const
```

## Dependencies

```json
{
  "dependencies": {
    "framer-motion": "^11.15.0"
  }
}
```

**No additional backend dependencies required.**

## File Changes

### New Files

```
src/lib/animations/
├── types.ts                    # Core types and interfaces
├── SpringPhysics.ts           # Physics engine
├── PixiSpringAnimator.ts      # PixiJS integration
├── AnimationSequence.ts       # Sequence builder
├── presets.ts                 # Preset configurations
└── transitions.ts             # Page transition presets

src/hooks/
└── useMotion.ts               # React hook for UI animations

src/components/animated/
├── AnimatedDialog.tsx         # Animated dialog wrapper
├── AnimatedPanel.tsx          # Animated panel wrapper
└── AnimatedSprite.tsx         # Animated sprite component
```

### Modified Files

```
src/lib/pixi/CharacterSprite.ts
  + Add PixiSpringAnimator integration
  + Replace direct position updates with animated transitions

src/components/agents/AgentDialog.tsx
  + Wrap with Framer Motion animations
  + Add entrance/exit transitions

src/components/space/SpaceUI.tsx
  + Add animated panel transitions
  + Implement smooth state changes

src/components/agents/AgentSpawner.tsx
  + Animate agent appearance
  + Add spawn effect

package.json
  + Add framer-motion dependency
```

## Testing Strategy

### Unit Tests

```typescript
// src/lib/animations/__tests__/SpringPhysics.test.ts
describe('SpringPhysics', () => {
  it('should converge to target value', () => {
    const physics = new SpringPhysics(SPRING_PRESETS.default)
    let position = 0
    let velocity = 0

    // Simulate 60 frames
    for (let i = 0; i < 60; i++) {
      const result = physics.step(position, 100, velocity, 1/60)
      position = result.position
      velocity = result.velocity
    }

    expect(position).toBeCloseTo(100, 1)
  })
})
```

### Integration Tests

```typescript
// src/__tests__/integration/animations.test.ts
describe('Animation System Integration', () => {
  it('should animate agent movement smoothly', async () => {
    const sprite = new CharacterSprite(...)
    sprite.moveTo(100, 100)

    await vi.waitFor(() => {
      expect(sprite.container.x).toBeCloseTo(100)
      expect(sprite.container.y).toBeCloseTo(100)
    })
  })
})
```

### Visual Tests

```typescript
// src/__tests__/visual/animations.visual.test.ts
describe('Animation Visual Tests', () => {
  it('should match animation snapshot', async () => {
    const { container } = render(<AnimatedDialog />)
    expect(container).toMatchSnapshot()
  })
})
```

## Performance Considerations

### Optimization Strategies

1. **Object Pooling:** Reuse animation instances
2. **RAF Throttling:** Batch PixiJS updates
3. **Will-Change CSS:** Optimize for transforms
4. **GPU Acceleration:** Use CSS transforms over position

### Benchmarks

Target performance metrics:
- **UI Animations:** 60fps (16.67ms per frame)
- **Sprite Animations:** 144fps capable (6.94ms per frame)
- **Memory:** <10MB for animation system
- **CPU:** <5% idle, <15% during heavy animation

## Migration Path

### Phase 1: Foundation (Week 1)
- Install Framer Motion
- Implement core types and SpringPhysics
- Create PixiSpringAnimator
- Add preset configurations

### Phase 2: UI Integration (Week 2)
- Migrate AgentDialog to use animations
- Add transitions to modals and panels
- Implement useMotion hook
- Update SpaceUI with transitions

### Phase 3: Game Integration (Week 3)
- Integrate PixiSpringAnimator with CharacterSprite
- Animate agent movement
- Add spawn/despawn effects
- Implement path following with smooth curves

### Phase 4: Polish (Week 4)
- Add animation sequences
- Implement loop modes
- Performance optimization
- Documentation and examples

## Rollback Plan

If issues arise:

1. **Feature Flag:** Wrap all animations with `ENABLE_ANIMATIONS` flag
2. **Graceful Degradation:** Fall back to instant updates
3. **Incremental Rollout:** Enable per-component basis

```typescript
// Rollback mechanism
const ENABLE_ANIMATIONS = import.meta.env.VITE_ENABLE_ANIMATIONS !== 'false'

if (ENABLE_ANIMATIONS) {
  await sprite.moveTo(x, y) // Animated
} else {
  sprite.container.position.set(x, y) // Instant
}
```

## Success Metrics

### Quantitative
- **Animation Smoothness:** 95%+ frames at 60fps
- **User Engagement:** +20% time in app
- **Perceived Performance:** -30% "feels slow" feedback
- **Bundle Size:** <50KB added (gzipped)

### Qualitative
- Animations feel natural and intuitive
- UI transitions are smooth and polished
- Agent movement appears lifelike
- Overall app feels more professional

## Documentation

### Developer Guide

Create comprehensive docs at `docs/animations/`:
- `getting-started.md` - Quick start guide
- `api-reference.md` - Complete API documentation
- `examples.md` - Common use cases
- `performance.md` - Optimization tips
- `troubleshooting.md` - Common issues

### Code Examples

Include inline documentation:
```typescript
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
```

## Risks and Mitigation

### Risk 1: Performance Degradation
**Mitigation:**
- Implement object pooling
- Use RAF throttling
- Profile regularly
- Add performance monitoring

### Risk 2: Complexity Creep
**Mitigation:**
- Keep API surface minimal
- Document thoroughly
- Use TypeScript for safety
- Regular code reviews

### Risk 3: Breaking Changes
**Mitigation:**
- Feature flags
- Gradual rollout
- Comprehensive testing
- Rollback plan ready

## Future Enhancements

### V2 Features
- Gesture-based animations
- Path-following animations
- Particle system integration
- Sound synchronization

### V3 Features
- Timeline editor
- Visual animation builder
- Animation presets library
- Performance analytics dashboard

## References

### Inspiration
- **dioxus-motion:** https://github.com/wheregmis/dioxus-motion
- Design principles and API structure

### Technologies
- **Framer Motion:** https://www.framer.com/motion/
- **React Spring:** https://www.react-spring.dev/
- **GSAP:** https://greensock.com/
- **PixiJS:** https://pixijs.com/

### Physics
- **Hooke's Law:** Spring force calculation
- **Damped Harmonic Motion:** Physics foundation
- **Interpolation:** Linear and cubic bezier

## Approval

- [ ] Architecture Review
- [ ] Performance Review
- [ ] Security Review
- [ ] UX Review
- [ ] Final Approval

---

**Next Steps After Approval:**
1. Install `framer-motion`
2. Implement core animation system
3. Integrate with existing components
4. Performance testing
5. Documentation
6. Production deployment
