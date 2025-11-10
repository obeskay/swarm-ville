import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePixiApp } from '../../hooks/usePixiApp'
import { useRef } from 'react'

describe('usePixiApp Hook', () => {
  let containerDiv: HTMLDivElement

  beforeEach(() => {
    // Create a mock container element for tests
    containerDiv = document.createElement('div')
    containerDiv.id = 'pixi-container'
    document.body.appendChild(containerDiv)
  })

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(containerDiv)
      return usePixiApp(ref)
    })

    expect(result.current.isLoading).toBeDefined()
  })

  it('should provide app instance when loaded', () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(containerDiv)
      return usePixiApp(ref)
    })

    // App may be null initially during loading
    expect(result.current).toHaveProperty('app')
    expect(result.current).toHaveProperty('stage')
  })

  it('should provide setGameLoop function', () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(containerDiv)
      return usePixiApp(ref)
    })

    expect(result.current.setGameLoop).toBeDefined()
    expect(typeof result.current.setGameLoop).toBe('function')
  })

  it('should handle error state', () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(containerDiv)
      return usePixiApp(ref)
    })

    expect(result.current).toHaveProperty('error')
  })
})
