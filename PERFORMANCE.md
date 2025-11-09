# SwarmVille Performance Optimization Guide

## Overview

This guide covers performance optimization strategies implemented in SwarmVille and best practices for maintaining high performance across the desktop application.

## Performance Targets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Frame Rate | 60 FPS | TBD | 🔄 |
| Initial Load Time | < 2s | TBD | 🔄 |
| Agent Spawn Time | < 200ms | TBD | 🔄 |
| Pathfinding (50 tiles) | < 50ms | TBD | 🔄 |
| Memory Usage | < 200MB | TBD | 🔄 |

## Performance Monitoring

### Built-in Performance Monitor

SwarmVille includes a `performanceMonitor` utility for tracking operation performance:

```typescript
import { performanceMonitor } from '@/lib/performance'

// Measure synchronous function
const result = performanceMonitor.measure('operation-name', () => {
  return expensiveOperation()
})

// Measure async function
const result = await performanceMonitor.measureAsync('async-operation', async () => {
  return await fetchData()
}, { userId: '123' })

// Get statistics
const stats = performanceMonitor.getStats('operation-name')
console.log(stats) // { count, min, max, avg, total }

// Export all metrics
const metrics = performanceMonitor.export()
```

### React Render Performance

Detect slow component renders:

```typescript
import { useRenderPerformance } from '@/lib/performance'

export function MyComponent() {
  useRenderPerformance('MyComponent')
  // Logs warning if render takes > 16.67ms (60fps threshold)
  return <div>...</div>
}
```

### Memory Monitoring

Check memory usage:

```typescript
import { getMemoryUsage } from '@/lib/performance'

const memory = getMemoryUsage()
if (memory && memory.percentage > 80) {
  console.warn('Memory usage high:', memory.percentage + '%')
}
```

## Optimization Techniques

### 1. State Management Optimization

#### Debounced State

Use for frequent updates (form inputs, search):

```typescript
import { useDebouncedState } from '@/hooks/useOptimizedState'

export function SearchComponent() {
  const [displayValue, onChange, actualValue] = useDebouncedState('', 300)

  return (
    <input
      value={displayValue}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
```

#### Batched State

Reduce re-renders when updating multiple state values:

```typescript
import { useBatchedState } from '@/hooks/useOptimizedState'

export function FormComponent() {
  const [state, updateState] = useBatchedState({
    name: '',
    email: '',
    role: ''
  })

  return (
    <>
      <input onChange={(e) => updateState({ name: e.target.value })} />
      <input onChange={(e) => updateState({ email: e.target.value })} />
    </>
  )
}
```

#### Async State

Handle loading/error states efficiently:

```typescript
import { useAsyncState } from '@/hooks/useOptimizedState'

export function DataComponent() {
  const { data, loading, error, refetch } = useAsyncState(
    () => fetchAgents(),
    []
  )

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  return <div>{data?.length} agents</div>
}
```

### 2. Function Optimization

#### Debouncing

Throttle function calls for resize, scroll, input events:

```typescript
import { debounce } from '@/lib/performance'

const handleResize = debounce(() => {
  updateLayout()
}, 300)

window.addEventListener('resize', handleResize)
```

#### Throttling

Rate-limit function calls:

```typescript
import { throttle } from '@/lib/performance'

const handleScroll = throttle(() => {
  loadMoreAgents()
}, 1000)

window.addEventListener('scroll', handleScroll)
```

#### Memoization

Cache function results:

```typescript
import { memoize } from '@/lib/performance'

const getAgentDistance = memoize((agentId: string, x: number, y: number) => {
  return calculateDistance(agentId, x, y)
}, 500) // Max 500 cached results
```

### 3. React Component Optimization

#### Memoization

Prevent unnecessary re-renders:

```typescript
import { memo, useCallback } from 'react'

const AgentCard = memo(function AgentCard({ agent, onSelect }) {
  return (
    <div onClick={() => onSelect(agent.id)}>
      {agent.name}
    </div>
  )
})
```

#### useCallback

Memoize callback functions:

```typescript
import { useCallback } from 'react'

export function AgentList({ agents }) {
  const handleSelect = useCallback((id: string) => {
    // Handle selection
  }, [])

  return agents.map(agent => (
    <AgentCard key={agent.id} agent={agent} onSelect={handleSelect} />
  ))
}
```

#### useMemo

Memoize expensive computations:

```typescript
import { useMemo } from 'react'

export function AgentStats({ agents }) {
  const stats = useMemo(() => ({
    total: agents.length,
    active: agents.filter(a => a.state === 'active').length,
    idle: agents.filter(a => a.state === 'idle').length,
  }), [agents])

  return <div>{stats.active}/{stats.total} active</div>
}
```

### 4. Rendering Optimization

#### Virtual Scrolling

For long lists, render only visible items:

```typescript
// Use react-window or react-virtualized for large agent lists
import { FixedSizeList } from 'react-window'

export function AgentListOptimized({ agents }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={agents.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <AgentCard agent={agents[index]} />
        </div>
      )}
    </FixedSizeList>
  )
}
```

#### Code Splitting

Lazy load components:

```typescript
import { lazy, Suspense } from 'react'

const AgentSettings = lazy(() => import('./AgentSettings'))

export function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AgentSettings />
    </Suspense>
  )
}
```

### 5. Pixi.js Optimization

#### Batch Rendering

Group similar objects for batch rendering:

```typescript
// Already implemented in GridRenderer
// Batch sprites by type to reduce draw calls
```

#### Sprite Pooling

Reuse sprite objects instead of creating new ones:

```typescript
class SpritePool {
  private available: PIXI.Sprite[] = []
  private inUse = new Set<PIXI.Sprite>()

  acquire(): PIXI.Sprite {
    return this.available.pop() || new PIXI.Sprite()
  }

  release(sprite: PIXI.Sprite): void {
    this.available.push(sprite)
  }
}
```

#### Culling

Don't render objects outside viewport:

```typescript
// Pixi Viewport automatically handles culling
// Ensure viewport is properly configured
viewport.on('moved', () => {
  updateVisibleAgents()
})
```

### 6. Asset Optimization

#### Image Optimization

- Use compressed PNG/WebP formats
- Lazy load non-essential images
- Use responsive images

#### Texture Atlas

Combine textures into single atlas:

```typescript
const spritesheet = PIXI.Spritesheet(
  texture,
  atlasData
)
```

### 7. Network Optimization

#### CLI Request Batching

Batch multiple CLI requests:

```typescript
// Instead of multiple CLI calls, batch them
const batchRequests = async (prompts: string[]) => {
  return Promise.all(
    prompts.map(p => sendMessageToCLI('claude', p))
  )
}
```

#### Request Caching

Cache API responses:

```typescript
const cache = new Map<string, any>()

async function getCachedData(key: string, fetcher: () => Promise<any>) {
  if (cache.has(key)) {
    return cache.get(key)
  }
  const data = await fetcher()
  cache.set(key, data)
  return data
}
```

## Profiling & Analysis

### Chrome DevTools

1. Open DevTools (F12)
2. Go to Performance tab
3. Record interactions
4. Analyze flame chart for bottlenecks

### React DevTools Profiler

1. Install React DevTools extension
2. Go to Profiler tab
3. Record render times
4. Identify slow components

### Vitest Coverage

Run coverage to identify untested slow paths:

```bash
npm run test:coverage
```

## Performance Benchmarks

### Pathfinding

```typescript
describe('Pathfinding Performance', () => {
  it('should find path for 50 tiles in < 50ms', () => {
    const start = performance.now()
    const path = findPath(
      { x: 0, y: 0 },
      { x: 50, y: 50 },
      new Set()
    )
    const duration = performance.now() - start
    expect(duration).toBeLessThan(50)
  })
})
```

### Agent Rendering

```typescript
describe('Agent Rendering Performance', () => {
  it('should render 100 agents at 60fps', () => {
    // Add 100 agents
    // Measure frame time
    // Should be < 16.67ms per frame
  })
})
```

## Common Performance Issues

### Issue: Slow Pathfinding

**Symptoms**: Agent takes > 100ms to calculate path

**Solutions**:
1. Increase cell size to reduce search space
2. Use A* with better heuristic
3. Cache frequently used paths
4. Limit search distance

### Issue: High Memory Usage

**Symptoms**: App uses > 300MB RAM

**Solutions**:
1. Clear old agent messages periodically
2. Limit number of sprites on screen
3. Release WebGL resources
4. Use virtual scrolling for long lists

### Issue: Low Frame Rate

**Symptoms**: Jerky animation, < 30 FPS

**Solutions**:
1. Reduce agent count on screen
2. Decrease viewport quality
3. Batch rendering updates
4. Profile with DevTools

### Issue: Slow Initial Load

**Symptoms**: App takes > 5s to start

**Solutions**:
1. Lazy load non-critical features
2. Optimize bundle size
3. Use code splitting
4. Cache initialization data

## Best Practices

✅ **DO**:
- Measure before optimizing
- Use React DevTools Profiler
- Memoize expensive computations
- Lazy load components
- Batch state updates
- Use virtual scrolling for long lists
- Profile in production-like conditions
- Monitor memory usage

❌ **DON'T**:
- Over-optimize prematurely
- Memoize everything (adds overhead)
- Create new objects in render
- Ignore profiler results
- Store large objects in state
- Render large lists without virtualization
- Trust browser dev mode performance
- Ignore memory leaks

## Continuous Performance Monitoring

### Enable Performance Logging

Set in `.env`:

```env
VITE_ENABLE_PERFORMANCE_LOGS=true
```

### Track Key Metrics

1. Time to Interactive (TTI)
2. First Contentful Paint (FCP)
3. Cumulative Layout Shift (CLS)
4. Frame rate stability
5. Memory usage over time

## Resources

- [React Profiler](https://react.dev/reference/react/Profiler)
- [Web Vitals](https://web.dev/vitals/)
- [Pixi.js Performance](https://pixijs.download/latest/docs/guides/advanced-topics/performance.html)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

## Future Optimizations

- [ ] Worker threads for pathfinding
- [ ] WebGL optimization for Pixi.js
- [ ] Service Worker caching
- [ ] Progressive rendering of agent swarms
- [ ] GPU-accelerated rendering
- [ ] Network optimization with bundling

---

**Last Updated**: Phase 7 - Performance Optimization
**Maintained By**: SwarmVille Team
