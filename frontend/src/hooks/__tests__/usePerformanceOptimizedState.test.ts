import { renderHook, act } from '@testing-library/react'
import { 
  usePerformanceOptimizedState, 
  useThrottledState, 
  useDebouncedState,
  useMemoizedValue 
} from '../usePerformanceOptimizedState'
import { performanceOptimizer } from '../../services/performanceOptimizer'

// Mock the performance optimizer
jest.mock('../../services/performanceOptimizer', () => ({
  performanceOptimizer: {
    debounce: jest.fn((key, fn, delay) => {
      // Return a function that can be called
      const debouncedFn = (...args: any[]) => fn(...args)
      return debouncedFn
    })
  }
}))

// Mock performance.now
const mockPerformanceNow = jest.fn()
Object.defineProperty(window, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
})

jest.useFakeTimers()

const mockDebounce = performanceOptimizer.debounce as jest.MockedFunction<typeof performanceOptimizer.debounce>

describe('usePerformanceOptimizedState', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    mockPerformanceNow.mockReturnValue(0)
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
        usePerformanceOptimizedState('initial')
      )
      
      act(() => {
        result.current[1]('updated')
      })
      
      expect(result.current[0]).toBe('updated')
    })

    it('handles function updates', async () => {
      const { result } = renderHook(() => 
        usePerformanceOptimizedState(0)
      )
      
      act(() => {
        result.current[1](prev => prev + 1)
      })
      
      // Wait for throttle to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(result.current[0]).toBe(1)
    })
  })

  describe('throttling', () => {
    it('throttles state updates', async () => {
      let currentTime = 0
      mockPerformanceNow.mockImplementation(() => currentTime)
      
      const { result } = renderHook(() => 
        usePerformanceOptimizedState('initial', {
          throttleKey: 'test-throttle',
          throttleDelay: 100
        })
      )
      
      // First update should go through
      currentTime = 0
      act(() => {
        result.current[1]('update1')
      })
      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 350));
      expect(result.current[0]).toBe('update1')
      
      // Second update within throttle delay should be pending
      currentTime = 50
      act(() => {
        result.current[1]('update2')
      })
      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 350));
      expect(result.current[0]).toBe('update1') // Still old value
      
      // After throttle delay, pending update should apply
      act(() => {
        jest.advanceTimersByTime(100)
      })
      expect(result.current[0]).toBe('update2')
    })

    it('allows updates after throttle delay', () => {
      let currentTime = 0
      mockPerformanceNow.mockImplementation(() => currentTime)
      
      const { result } = renderHook(() => 
        usePerformanceOptimizedState('initial', {
          throttleKey: 'test-throttle',
          throttleDelay: 100
        })
      )
      
      currentTime = 0
      act(() => {
        result.current[1]('update1')
      })
      // Wait for debounce to complete
    await new Promise(resolve => setTimeout(resolve, 350));
    // Wait for debounce to complete
    await new Promise(resolve => setTimeout(resolve, 350));
    // Wait for debounce to complete
    await new Promise(resolve => setTimeout(resolve, 350));
    expect(result.current[0]).toBe('update1')
      
      currentTime = 150 // Past throttle delay
      act(() => {
        result.current[1]('update2')
      })
      
      expect(result.current[0]).toBe('update2')
    })

    it('processes pending updates', () => {
      let currentTime = 0
      mockPerformanceNow.mockImplementation(() => currentTime)
      
      const { result } = renderHook(() => 
        usePerformanceOptimizedState('initial', {
          throttleKey: 'test-throttle',
          throttleDelay: 100
        })
      )
      
      currentTime = 0
      act(() => {
        result.current[1]('update1')
      })
      // Wait for debounce to complete
    await new Promise(resolve => setTimeout(resolve, 350));
    // Wait for debounce to complete
    await new Promise(resolve => setTimeout(resolve, 350));
    // Wait for debounce to complete
    await new Promise(resolve => setTimeout(resolve, 350));
    expect(result.current[0]).toBe('update1')
      
      // Quick update within throttle window
      currentTime = 50
      act(() => {
        result.current[1]('pending')
      })
      
      // Advance time to process pending update
      act(() => {
        jest.advanceTimersByTime(100)
      })
      
      expect(result.current[0]).toBe('pending')
    })
  })

  describe('debouncing', () => {
    it('debounces state updates', () => {
      const { result } = renderHook(() => 
        usePerformanceOptimizedState('initial', {
          debounceKey: 'test-debounce',
          debounceDelay: 300
        })
      )
      
      act(() => {
        result.current[1]('debounced')
      })
      
      expect(mockDebounce).toHaveBeenCalledWith(
        'test-debounce',
        expect.any(Function),
        300
      )
    })

    it('uses default debounce delay', () => {
      const { result } = renderHook(() => 
        usePerformanceOptimizedState('initial', {
          debounceKey: 'test-debounce'
        })
      )
      
      act(() => {
        result.current[1]('debounced')
      })
      
      expect(mockDebounce).toHaveBeenCalledWith(
        'test-debounce',
        expect.any(Function),
        300
      )
    })
  })

  describe('priority handling', () => {
    it('prioritizes debounce over throttle', () => {
      const { result } = renderHook(() => 
        usePerformanceOptimizedState('initial', {
          throttleKey: 'test-throttle',
          debounceKey: 'test-debounce'
        })
      )
      
      act(() => {
        result.current[1]('value')
      })
      
      expect(mockDebounce).toHaveBeenCalled()
    })
  })
})

describe('useThrottledState', () => {
  it('creates throttled state with default delay', () => {
    let currentTime = 0
    mockPerformanceNow.mockImplementation(() => currentTime)
    
    const { result } = renderHook(() => useThrottledState('initial'))
    
    expect(result.current[0]).toBe('initial')
    expect(typeof result.current[1]).toBe('function')
  })

  it('uses custom throttle delay', () => {
    const { result } = renderHook(() => useThrottledState('initial', 200))
    
    expect(result.current[0]).toBe('initial')
  })

  it('throttles updates correctly', () => {
    let currentTime = 0
    mockPerformanceNow.mockImplementation(() => currentTime)
    
    const { result } = renderHook(() => useThrottledState(0, 100))
    
    currentTime = 0
    act(() => {
      result.current[1](1)
    })
    // Wait for throttle to complete
    await new Promise(resolve => setTimeout(resolve, 50));
    // Wait for throttle to complete
    await new Promise(resolve => setTimeout(resolve, 50));
    // Wait for throttle to complete
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(result.current[0]).toBe(1)
    
    // Quick update should be throttled
    currentTime = 50
    act(() => {
      result.current[1](2)
    })
    // Wait for throttle to complete
    await new Promise(resolve => setTimeout(resolve, 50));
    // Wait for throttle to complete
    await new Promise(resolve => setTimeout(resolve, 50));
    // Wait for throttle to complete
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(result.current[0]).toBe(1) // Still old value
  })
})

describe('useDebouncedState', () => {
  it('creates debounced state with default delay', () => {
    const { result } = renderHook(() => useDebouncedState('initial'))
    
    expect(result.current[0]).toBe('initial')
    expect(typeof result.current[1]).toBe('function')
  })

  it('uses custom debounce delay', () => {
    const { result } = renderHook(() => useDebouncedState('initial', 500))
    
    act(() => {
      result.current[1]('debounced')
    })
    
    expect(mockDebounce).toHaveBeenCalledWith(
      'debounced-state',
      expect.any(Function),
      500
    )
  })

  it('debounces updates correctly', () => {
    const { result } = renderHook(() => useDebouncedState('initial'))
    
    act(() => {
      result.current[1]('debounced')
    })
    
    expect(mockDebounce).toHaveBeenCalled()
  })
})

describe('useMemoizedValue', () => {
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

  it('uses equality function when provided', () => {
    const computeValue = jest.fn(() => ({ value: 'test' }))
    const equalityFn = jest.fn((prev, next) => prev.value === next.value)
    
    const { result, rerender } = renderHook(() => 
      useMemoizedValue(computeValue, ['dep'], equalityFn)
    )
    
    const firstResult = result.current
    
    // Change dependency to trigger recomputation
    rerender(() => useMemoizedValue(computeValue, ['dep2'], equalityFn))
    
    expect(equalityFn).toHaveBeenCalledWith(firstResult, expect.any(Object))
  })

  it('updates value when equality function returns false', () => {
    let computedValue = { value: 'test1' }
    const computeValue = jest.fn(() => computedValue)
    const equalityFn = jest.fn((prev, next) => prev.value === next.value)
    
    const { result, rerender } = renderHook(() => 
      useMemoizedValue(computeValue, ['dep'], equalityFn)
    )
    
    expect(result.current.value).toBe('test1')
    
    // Change computed value and dependency to trigger recomputation
    computedValue = { value: 'test2' }
    equalityFn.mockReturnValue(false)
    
    rerender(() => useMemoizedValue(computeValue, ['dep2'], equalityFn))
    
    expect(result.current.value).toBe('test2')
  })

  it('does not update value when equality function returns true', () => {
    let computedValue = { value: 'test' }
    const computeValue = jest.fn(() => computedValue)
    const equalityFn = jest.fn(() => true) // Always equal
    
    const { result, rerender } = renderHook(() => 
      useMemoizedValue(computeValue, ['dep'], equalityFn)
    )
    
    const firstResult = result.current
    
    // Change computed value but equality returns true
    computedValue = { value: 'different' }
    
    rerender()
    
    expect(result.current).toBe(firstResult) // Should be same reference
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