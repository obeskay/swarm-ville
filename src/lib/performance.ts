/**
 * Performance monitoring and optimization utilities for SwarmVille
 */

export interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  tags?: Record<string, string | number>
}

export interface PerformanceStats {
  count: number
  min: number
  max: number
  avg: number
  total: number
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private maxMetricsPerKey = 1000 // Prevent memory leaks

  /**
   * Measure performance of a synchronous function
   */
  measure<T>(
    name: string,
    fn: () => T,
    tags?: Record<string, string | number>
  ): T {
    const start = performance.now()
    try {
      return fn()
    } finally {
      const duration = performance.now() - start
      this.recordMetric(name, duration, tags)
    }
  }

  /**
   * Measure performance of an async function
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string | number>
  ): Promise<T> {
    const start = performance.now()
    try {
      return await fn()
    } finally {
      const duration = performance.now() - start
      this.recordMetric(name, duration, tags)
    }
  }

  /**
   * Record a metric
   */
  private recordMetric(
    name: string,
    duration: number,
    tags?: Record<string, string | number>
  ): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      tags,
    }

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const metricsList = this.metrics.get(name)!
    metricsList.push(metric)

    // Keep only recent metrics to prevent memory leak
    if (metricsList.length > this.maxMetricsPerKey) {
      metricsList.shift()
    }

    // Log slow operations in development
    if (duration > 100) {
      console.warn(
        `[Performance] ${name} took ${duration.toFixed(2)}ms`,
        tags
      )
    }
  }

  /**
   * Get statistics for a metric
   */
  getStats(name: string): PerformanceStats | null {
    const metrics = this.metrics.get(name)
    if (!metrics || metrics.length === 0) {
      return null
    }

    const durations = metrics.map((m) => m.duration)
    return {
      count: metrics.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      total: durations.reduce((a, b) => a + b, 0),
    }
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, PerformanceMetric[]> {
    return new Map(this.metrics)
  }

  /**
   * Clear metrics for a specific name or all if name is not provided
   */
  clear(name?: string): void {
    if (name) {
      this.metrics.delete(name)
    } else {
      this.metrics.clear()
    }
  }

  /**
   * Export metrics as JSON
   */
  export(): Record<string, PerformanceStats> {
    const result: Record<string, PerformanceStats> = {}
    for (const [name] of this.metrics) {
      const stats = this.getStats(name)
      if (stats) {
        result[name] = stats
      }
    }
    return result
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Hook for React components to track render performance
 */
export function useRenderPerformance(componentName: string): void {
  const renderStart = performance.now()

  // This will run after render
  return (() => {
    const renderTime = performance.now() - renderStart
    if (renderTime > 16.67) {
      // 60fps threshold
      console.warn(
        `[Render Performance] ${componentName} took ${renderTime.toFixed(2)}ms`
      )
    }
  })() as any
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastCall >= delay) {
      fn(...args)
      lastCall = now
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        fn(...args)
        lastCall = Date.now()
        timeoutId = null
      }, delay - (now - lastCall))
    }
  }
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  maxSize: number = 100
): T {
  const cache = new Map<string, any>()

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = fn(...args)
    cache.set(key, result)

    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }

    return result
  }) as T
}

/**
 * Request idle callback with fallback
 */
export function scheduleIdleTask(callback: () => void): number {
  if ('requestIdleCallback' in window) {
    return (window as any).requestIdleCallback(callback)
  } else {
    return setTimeout(callback, 0) as any
  }
}

/**
 * Cancel idle task
 */
export function cancelIdleTask(id: number): void {
  if ('cancelIdleCallback' in window) {
    (window as any).cancelIdleCallback(id)
  } else {
    clearTimeout(id)
  }
}

/**
 * Measure memory usage (if available)
 */
export function getMemoryUsage(): {
  used: number
  limit: number
  percentage: number
} | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    return {
      used: memory.usedJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    }
  }
  return null
}
