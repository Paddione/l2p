import { renderHook, act } from '@testing-library/react'
import { 
  usePerformanceOptimizedState, 
  useThrottledState, 
  useDebouncedState,
  useMemoizedValue 
} from '../usePerformanceOptimizedState'

// Mock the performance optimizer
jest.mock('../../services/performanceOptimizer', () => {
  const mockDebounce = jest.fn((key, fn, delay) => {
    console.log('Mock debounce called with:', key, fn, delay)
    // Return a function that immediately calls the original function
    return () => {
      console.log('Mock debounced function called')
      fn()
    }
  })
  
  return {
    performanceOptimizer: {
      debounce: mockDebounce
    }
  }
})

describe('usePerformanceOptimizedState - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('basic functionality', () => {
    it('returns initial state and setter', () => {
      const { result } = renderHook(() => 
        usePerformanceOptimizedState('initial')
      )
      
      expect(result.current[0]).toBe('initial')
      expect(typeof result.current[1]).toBe('function')
    })

    it('updates state normally without optimization options', () => {
      const { result } = renderHook(() => 
        usePerformanceOptimizedState('initial', { priority: 'none' })
      )
      
      act(() => {
        result.current[1]('updated')
      })
      
      expect(result.current[0]).toBe('updated')
    })

    it('handles function updates', () => {
      const { result } = renderHook(() => 
        usePerformanceOptimizedState(0)
      )
      
      act(() => {
        result.current[1](prev => prev + 1)
      })
      
      expect(result.current[0]).toBe(1)
    })
  })

  describe('debouncing', () => {
    it('debounces state updates', async () => {
      const { result } = renderHook(() => 
        usePerformanceOptimizedState('initial', {
          debounceKey: 'test-debounce',
          debounceDelay: 10
        })
      )
      
      act(() => {
        result.current[1]('debounced')
      })
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 20))
      
      expect(result.current[0]).toBe('debounced')
    })

    it('uses default debounce delay', async () => {
      const { result } = renderHook(() => 
        usePerformanceOptimizedState('initial', {
          debounceKey: 'test-debounce'
        })
      )
      
      act(() => {
        result.current[1]('debounced')
      })
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 350))
      
      expect(result.current[0]).toBe('debounced')
    })
  })

  describe('priority handling', () => {
    it('prioritizes debounce over throttle', async () => {
      const { result } = renderHook(() => 
        usePerformanceOptimizedState('initial', {
          debounceKey: 'test-debounce',
          throttleKey: 'test-throttle'
        })
      )
      
      act(() => {
        result.current[1]('prioritized')
      })
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 350))
      
      expect(result.current[0]).toBe('prioritized')
    })
  })
})

describe('useThrottledState - Simple Tests', () => {
  it('creates throttled state with default delay', () => {
    const { result } = renderHook(() => useThrottledState('initial'))
    
    expect(result.current[0]).toBe('initial')
    expect(typeof result.current[1]).toBe('function')
  })

  it('uses custom throttle delay', () => {
    const { result } = renderHook(() => useThrottledState('initial', 200))
    
    expect(result.current[0]).toBe('initial')
  })

  it('updates state', () => {
    const { result } = renderHook(() => useThrottledState(0, 100))
    
    act(() => {
      result.current[1](1)
    })
    expect(result.current[0]).toBe(1)
  })
})

describe('useDebouncedState - Simple Tests', () => {
  it('creates debounced state with default delay', () => {
    const { result } = renderHook(() => useDebouncedState('initial'))
    
    expect(result.current[0]).toBe('initial')
    expect(typeof result.current[1]).toBe('function')
  })

  it('uses custom debounce delay', async () => {
    const { result } = renderHook(() => useDebouncedState('initial', 10))
    
    act(() => {
      result.current[1]('debounced')
    })
    
    // Wait for debounce delay
    await new Promise(resolve => setTimeout(resolve, 20))
    
    expect(result.current[0]).toBe('debounced')
  })

  it('debounces updates', async () => {
    const { result } = renderHook(() => useDebouncedState('initial'))
    
    act(() => {
      result.current[1]('debounced')
    })
    
    // Wait for debounce delay
    await new Promise(resolve => setTimeout(resolve, 350))
    
    expect(result.current[0]).toBe('debounced')
  })
})

describe('useMemoizedValue - Simple Tests', () => {
  it('computes initial value', () => {
    const computeValue = jest.fn(() => 'computed')
    
    const { result } = renderHook(() => 
      useMemoizedValue(computeValue, [])
    )
    
    expect(result.current).toBe('computed')
    expect(computeValue).toHaveBeenCalledTimes(1)
  })

  it('recomputes when dependencies change', () => {
    const computeValue = jest.fn(() => 'computed')
    let dep = 'dep1'
    
    const { result, rerender } = renderHook(() => 
      useMemoizedValue(computeValue, [dep])
    )
    
    expect(result.current).toBe('computed')
    expect(computeValue).toHaveBeenCalledTimes(1)
    
    // Change dependency
    dep = 'dep2'
    rerender()
    
    expect(computeValue).toHaveBeenCalledTimes(2)
  })

  it('does not recompute when dependencies are unchanged', () => {
    const computeValue = jest.fn(() => 'computed')
    const dep = 'unchanged'
    
    const { result, rerender } = renderHook(() => 
      useMemoizedValue(computeValue, [dep])
    )
    
    expect(computeValue).toHaveBeenCalledTimes(1)
    
    rerender()
    
    expect(computeValue).toHaveBeenCalledTimes(1) // Should not recompute
  })

  it('handles complex dependency arrays', () => {
    const computeValue = jest.fn(() => 'computed')
    let deps = [1, 'string', { obj: true }]
    
    const { result, rerender } = renderHook(() => 
      useMemoizedValue(computeValue, deps)
    )
    
    expect(computeValue).toHaveBeenCalledTimes(1)
    
    // Change one dependency
    deps = [1, 'string', { obj: false }]
    rerender()
    
    expect(computeValue).toHaveBeenCalledTimes(2)
  })

  it('handles empty dependency array', () => {
    const computeValue = jest.fn(() => 'computed')
    
    const { result, rerender } = renderHook(() => 
      useMemoizedValue(computeValue, [])
    )
    
    expect(computeValue).toHaveBeenCalledTimes(1)
    
    rerender()
    
    expect(computeValue).toHaveBeenCalledTimes(1) // Should not recompute
  })
})