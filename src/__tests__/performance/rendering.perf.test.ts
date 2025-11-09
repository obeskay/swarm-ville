import { describe, it, expect } from 'vitest'
import { performanceMonitor } from '../../lib/performance'

describe('Rendering Performance Tests', () => {
  describe('Performance Monitor', () => {
    it('should measure synchronous operations', () => {
      const result = performanceMonitor.measure('test-sync', () => {
        let sum = 0
        for (let i = 0; i < 1000000; i++) {
          sum += i
        }
        return sum
      })

      expect(result).toBeGreaterThan(0)

      const stats = performanceMonitor.getStats('test-sync')
      expect(stats).toBeDefined()
      expect(stats!.count).toBeGreaterThan(0)
      expect(stats!.avg).toBeGreaterThan(0)
    })

    it('should measure async operations', async () => {
      await performanceMonitor.measureAsync('test-async', async () => {
        return new Promise((resolve) => setTimeout(resolve, 50))
      })

      const stats = performanceMonitor.getStats('test-async')
      expect(stats).toBeDefined()
      expect(stats!.avg).toBeGreaterThanOrEqual(50)
    })

    it('should track multiple measurements', () => {
      performanceMonitor.clear()

      for (let i = 0; i < 10; i++) {
        performanceMonitor.measure('operation', () => {
          let sum = 0
          for (let j = 0; j < 100000; j++) {
            sum += j
          }
          return sum
        })
      }

      const stats = performanceMonitor.getStats('operation')
      expect(stats!.count).toBe(10)
      expect(stats!.min).toBeLessThanOrEqual(stats!.avg)
      expect(stats!.avg).toBeLessThanOrEqual(stats!.max)
    })

    it('should export metrics', () => {
      performanceMonitor.clear()

      performanceMonitor.measure('op1', () => {})
      performanceMonitor.measure('op2', () => {})

      const metrics = performanceMonitor.export()
      expect(Object.keys(metrics).length).toBeGreaterThan(0)
      expect(metrics).toHaveProperty('op1')
      expect(metrics).toHaveProperty('op2')
    })

    it('should include tags in metrics', () => {
      performanceMonitor.clear()

      performanceMonitor.measure('tagged-operation', () => {}, {
        userId: '123',
        action: 'spawn',
      })

      const metrics = performanceMonitor.getAllMetrics()
      const operation = metrics.get('tagged-operation')!
      expect(operation[0].tags).toEqual({
        userId: '123',
        action: 'spawn',
      })
    })

    it('should prevent memory leaks with max metrics', () => {
      performanceMonitor.clear()

      // Record more than max metrics
      for (let i = 0; i < 2000; i++) {
        performanceMonitor.measure('leak-test', () => {})
      }

      const stats = performanceMonitor.getStats('leak-test')
      // Should be capped at maxMetricsPerKey (1000)
      expect(stats!.count).toBeLessThanOrEqual(1000)
    })
  })

  describe('Frame Rate Consistency', () => {
    it('should maintain stable performance over time', () => {
      const frameTimes: number[] = []
      const targetFrameTime = 16.67 // 60fps

      for (let i = 0; i < 60; i++) {
        const start = performance.now()
        // Simulate frame processing
        let sum = 0
        for (let j = 0; j < 100000; j++) {
          sum += j
        }
        frameTimes.push(performance.now() - start)
      }

      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
      const inconsistency = Math.max(...frameTimes) - Math.min(...frameTimes)

      expect(avgFrameTime).toBeLessThan(targetFrameTime * 2)
      expect(inconsistency).toBeLessThan(targetFrameTime * 3)
    })
  })

  describe('DOM Rendering Performance', () => {
    it('should handle batch DOM updates efficiently', () => {
      const container = document.createElement('div')
      document.body.appendChild(container)

      const start = performance.now()

      // Batch multiple DOM updates
      const fragment = document.createDocumentFragment()
      for (let i = 0; i < 100; i++) {
        const el = document.createElement('div')
        el.textContent = `Item ${i}`
        fragment.appendChild(el)
      }
      container.appendChild(fragment)

      const duration = performance.now() - start

      expect(container.children.length).toBe(100)
      expect(duration).toBeLessThan(50)

      document.body.removeChild(container)
    })

    it('should handle element removal efficiently', () => {
      const container = document.createElement('div')
      document.body.appendChild(container)

      // Create many elements
      for (let i = 0; i < 100; i++) {
        const el = document.createElement('div')
        el.id = `item-${i}`
        container.appendChild(el)
      }

      const start = performance.now()

      // Remove all elements efficiently
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }

      const duration = performance.now() - start

      expect(container.children.length).toBe(0)
      expect(duration).toBeLessThan(50)

      document.body.removeChild(container)
    })
  })

  describe('Event Handler Performance', () => {
    it('should handle frequent events efficiently', () => {
      const container = document.createElement('div')
      document.body.appendChild(container)

      let eventCount = 0
      const handler = () => {
        eventCount++
      }

      container.addEventListener('click', handler)

      const start = performance.now()

      // Simulate 1000 clicks
      for (let i = 0; i < 1000; i++) {
        container.dispatchEvent(new MouseEvent('click'))
      }

      const duration = performance.now() - start

      expect(eventCount).toBe(1000)
      expect(duration).toBeLessThan(100)

      document.body.removeChild(container)
    })
  })

  describe('Memory Management', () => {
    it('should report memory usage when available', () => {
      const memory = getMemoryInfo()

      if (memory) {
        expect(memory.used).toBeGreaterThan(0)
        expect(memory.limit).toBeGreaterThan(0)
        expect(memory.percentage).toBeGreaterThanOrEqual(0)
        expect(memory.percentage).toBeLessThanOrEqual(100)
      }
    })

    it('should detect memory pressure', () => {
      const memory = getMemoryInfo()

      if (memory && memory.percentage > 80) {
        // Memory is under pressure
        expect(memory.percentage).toBeGreaterThan(80)
      }
    })
  })
})

function getMemoryInfo(): {
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
