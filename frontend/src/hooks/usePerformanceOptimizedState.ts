import { useState, useRef, useCallback, useEffect } from 'react'

interface PerformanceOptimizedStateOptions {
  debounceDelay?: number
  throttleDelay?: number
  debounceKey?: string
  throttleKey?: string
  priority?: 'debounce' | 'throttle' | 'none'
}

export function usePerformanceOptimizedState<T>(
  initialState: T,
  options: PerformanceOptimizedStateOptions = {}
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(initialState)
  
  const {
    debounceDelay = 300,
    throttleDelay = 100,
    debounceKey = 'default',
    throttleKey = 'default',
    priority = 'debounce'
  } = options

  const debouncedFnRef = useRef<((value: T) => void) | null>(null)
  const throttledFnRef = useRef<((value: T) => void) | null>(null)
  const lastCallTimeRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize debounced function
  useEffect(() => {
    debouncedFnRef.current = (value: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        setState(value)
      }, debounceDelay)
    }
  }, [debounceDelay])

  // Initialize throttled function
  useEffect(() => {
    throttledFnRef.current = (value: T) => {
      const now = Date.now()
      if (now - lastCallTimeRef.current >= throttleDelay) {
        setState(value)
        lastCallTimeRef.current = now
      }
    }
  }, [throttleDelay])

  const updateState = useCallback((value: T) => {
    if (priority === 'debounce' && debouncedFnRef.current) {
      debouncedFnRef.current(value)
    } else if (priority === 'throttle' && throttledFnRef.current) {
      throttledFnRef.current(value)
    } else if (priority === 'none') {
      setState(value)
    } else {
      setState(value)
    }
  }, [priority, debounceDelay, throttleDelay])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [state, updateState]
}

// Simple debounced state hook
export function useDebouncedState<T>(
  initialState: T,
  delay: number = 300
): [T, (value: T) => void] {
  return usePerformanceOptimizedState(initialState, {
    debounceDelay: delay,
    priority: 'debounce'
  })
}

// Simple throttled state hook
export function useThrottledState<T>(
  initialState: T,
  delay: number = 100
): [T, (value: T) => void] {
  return usePerformanceOptimizedState(initialState, {
    throttleDelay: delay,
    priority: 'throttle'
  })
}

// Memoized value hook
export function useMemoizedValue<T>(
  computeValue: () => T,
  dependencies: React.DependencyList
): T {
  const [value, setValue] = useState<T>(() => computeValue())

  useEffect(() => {
    setValue(computeValue())
  }, dependencies)

  return value
}
