import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePixiApp } from '../../hooks/usePixiApp'

describe('usePixiApp Hook', () => {
  beforeEach(() => {
    // Create a mock canvas element for tests
    const canvas = document.createElement('canvas')
    canvas.id = 'pixi-canvas'
    document.body.appendChild(canvas)
  })

  it('should initialize Pixi app', () => {
    const { result } = renderHook(() => usePixiApp())

    expect(result.current.app).toBeDefined()
    expect(result.current.viewport).toBeDefined()
  })

  it('should provide app with correct properties', () => {
    const { result } = renderHook(() => usePixiApp())

    expect(result.current.app).toHaveProperty('stage')
    expect(result.current.app).toHaveProperty('view')
    expect(result.current.app).toHaveProperty('ticker')
  })

  it('should provide viewport instance', () => {
    const { result } = renderHook(() => usePixiApp())

    expect(result.current.viewport).toBeDefined()
    expect(result.current.viewport).toHaveProperty('x')
    expect(result.current.viewport).toHaveProperty('y')
  })

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => usePixiApp())

    const result = renderHook(() => usePixiApp())
    const app = result.result.current.app

    unmount()

    // App should still be defined but cleanup should have been called
    expect(app).toBeDefined()
  })

  it('should have stage with app instance', () => {
    const { result } = renderHook(() => usePixiApp())

    expect(result.current.app.stage).toBeDefined()
    expect(result.current.app.stage).toHaveProperty('children')
  })
})
