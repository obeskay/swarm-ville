import { useState, useCallback, useRef, useEffect } from 'react'
import { debounce } from '../lib/performance'

/**
 * Optimized state hook that debounces updates
 * Useful for frequent state changes (e.g., from input events)
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, (value: T) => void, T] {
  const [displayValue, setDisplayValue] = useState<T>(initialValue)
  const [actualValue, setActualValue] = useState<T>(initialValue)
  const debouncedUpdate = useCallback(
    debounce((value: T) => {
      setActualValue(value)
    }, delay),
    [delay]
  )

  const handleChange = useCallback(
    (value: T) => {
      setDisplayValue(value)
      debouncedUpdate(value)
    },
    [debouncedUpdate]
  )

  return [displayValue, handleChange, actualValue]
}

/**
 * Optimized state hook that batches updates
 * Useful for reducing re-renders when updating multiple state values
 */
export function useBatchedState<T extends Record<string, any>>(
  initialValue: T
): [T, (updates: Partial<T>) => void] {
  const [state, setState] = useState<T>(initialValue)
  const batchRef = useRef<Partial<T> | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const updateState = useCallback((updates: Partial<T>) => {
    if (!batchRef.current) {
      batchRef.current = {}
    }
    batchRef.current = { ...batchRef.current, ...updates }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        ...batchRef.current,
      }))
      batchRef.current = null
      timeoutRef.current = null
    }, 0)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [state, updateState]
}

/**
 * Optimized state hook that prevents unnecessary re-renders
 * Only updates if the new value is different from the previous value
 */
export function useShallowState<T>(
  initialValue: T
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(initialValue)
  const prevValueRef = useRef<T>(initialValue)

  const updateState = useCallback((newValue: T) => {
    if (JSON.stringify(prevValueRef.current) !== JSON.stringify(newValue)) {
      prevValueRef.current = newValue
      setState(newValue)
    }
  }, [])

  return [state, updateState]
}

/**
 * Optimized state hook that lazily initializes state
 * Initial function is only called once
 */
export function useLazyState<T>(
  initializer: () => T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => initializer())
  return [state, setState]
}

/**
 * Optimized previous value hook
 * Tracks the previous value of a dependency
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

/**
 * Optimized async state hook
 * Handles loading, error, and data states
 */
export function useAsyncState<T, E = Error>(
  asyncFn: () => Promise<T>,
  dependencies: any[] = []
): {
  data: T | null
  loading: boolean
  error: E | null
  refetch: () => Promise<void>
} {
  const [state, setState] = useState<{
    data: T | null
    loading: boolean
    error: E | null
  }>({
    data: null,
    loading: true,
    error: null,
  })

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }))
    try {
      const data = await asyncFn()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error as E,
      }))
    }
  }, [asyncFn])

  useEffect(() => {
    refetch()
  }, dependencies)

  return { ...state, refetch }
}
