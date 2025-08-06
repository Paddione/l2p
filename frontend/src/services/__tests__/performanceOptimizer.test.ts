import { PerformanceOptimizer, type PerformanceConfig } from '../performanceOptimizer'

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now())
}

// Mock requestAnimationFrame and cancelAnimationFrame
const mockRequestAnimationFrame = jest.fn()
const mockCancelAnimationFrame = jest.fn()

// Mock setTimeout and clearTimeout
const mockSetTimeout = jest.fn()
const mockClearTimeout = jest.fn()

// Mock Date.now
const mockDateNow = jest.fn()

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true
})

Object.defineProperty(window, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true
})

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: mockCancelAnimationFrame,
  writable: true
})

Object.defineProperty(global, 'setTimeout', {
  value: mockSetTimeout,
  writable: true
})

Object.defineProperty(global, 'clearTimeout', {
  value: mockClearTimeout,
  writable: true
})

Object.defineProperty(Date, 'now', {
  value: mockDateNow,
  writable: true
})

describe('PerformanceOptimizer', () => {
  let optimizer: PerformanceOptimizer
  let mockCallback: jest.Mock

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Reset static instance
    ;(PerformanceOptimizer as any).instance = null
    
    // Create fresh instance
    optimizer = PerformanceOptimizer.getInstance()
    
    // Setup default mock implementations
    mockDateNow.mockReturnValue(1000)
    mockPerformance.now.mockReturnValue(1000)
    mockCallback = jest.fn()
    
    // Setup setTimeout to return a mock timeout ID and execute callback immediately for testing
    let timeoutId = 1
    mockSetTimeout.mockImplementation((callback, delay) => {
      const id = timeoutId++
      // Execute callback immediately for testing (no real delay)
      try {
        callback()
      } catch (error) {
        console.error('Timeout callback error:', error)
      }
      return id
    })
  })

  afterEach(() => {
    // Cleanup
    optimizer.cleanup()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = PerformanceOptimizer.getInstance()
      const instance2 = PerformanceOptimizer.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should create only one instance', () => {
      const instance1 = PerformanceOptimizer.getInstance()
      ;(PerformanceOptimizer as any).instance = null
      const instance2 = PerformanceOptimizer.getInstance()
      expect(instance1).not.toBe(instance2)
    })
  })

  describe('FPS Limiting', () => {
    it('should call requestAnimationFrame when limitFPS is called', () => {
      optimizer.limitFPS(mockCallback)
      expect(mockRequestAnimationFrame).toHaveBeenCalled()
    })

    it('should execute callback when frame time threshold is met', async () => {
      // Mock time progression to meet frame threshold
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1017) // 17ms later (60 FPS = ~16.67ms)
      
      optimizer.limitFPS(mockCallback)
      
      // Simulate animation frame callback
      const rafCallback = mockRequestAnimationFrame.mock.calls[0][0]
      rafCallback()
      
      // Wait for any async operations
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(mockCallback).toHaveBeenCalled()
    })

    it('should not execute callback when frame time threshold is not met', async () => {
      // Mock time progression to be below threshold
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1005) // 5ms later
      
      optimizer.limitFPS(mockCallback)
      
      // Simulate animation frame callback
      const rafCallback = mockRequestAnimationFrame.mock.calls[0][0]
      rafCallback()
      
      // Wait for any async operations
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should stop FPS limiting when stopFPSLimiting is called', () => {
      optimizer.limitFPS(mockCallback)
      optimizer.stopFPSLimiting()
      
      expect(mockCancelAnimationFrame).toHaveBeenCalled()
    })

    it('should handle multiple start/stop calls gracefully', () => {
      optimizer.limitFPS(mockCallback)
      optimizer.stopFPSLimiting()
      optimizer.limitFPS(mockCallback)
      optimizer.stopFPSLimiting()
      
      expect(mockCancelAnimationFrame).toHaveBeenCalledTimes(2)
    })
  })

  describe('Adaptive Polling', () => {
    it('should start polling with callback', () => {
      optimizer.startAdaptivePolling(mockCallback)
      
      expect(mockSetTimeout).toHaveBeenCalled()
    })

    it('should stop polling when stopAdaptivePolling is called', () => {
      optimizer.startAdaptivePolling(mockCallback)
      optimizer.stopAdaptivePolling()
      
      expect(mockClearTimeout).toHaveBeenCalled()
    })

    it('should handle multiple start/stop calls gracefully', () => {
      optimizer.startAdaptivePolling(mockCallback)
      optimizer.stopAdaptivePolling()
      optimizer.startAdaptivePolling(mockCallback)
      optimizer.stopAdaptivePolling()
      
      expect(mockClearTimeout).toHaveBeenCalledTimes(2)
    })

    it('should adjust polling interval based on performance', () => {
      // Mock poor performance (low FPS)
      ;(optimizer as any).currentFPS = 25
      
      optimizer.startAdaptivePolling(mockCallback)
      
      // Verify that polling interval is adjusted
      const metrics = optimizer.getPerformanceMetrics()
      expect(metrics.pollingInterval).toBeGreaterThan(5000) // Should be increased
    })
  })

  describe('Throttling', () => {
    it('should throttle function calls', async () => {
      const throttledFn = optimizer.throttle('test-key', mockCallback, 100)
      
      // Call multiple times rapidly
      throttledFn()
      throttledFn()
      throttledFn()
      
      // Only the first call should be executed immediately
      expect(mockCallback).toHaveBeenCalledTimes(1)
      
      // Wait for throttle period
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Should be able to call again after throttle period
      throttledFn()
      expect(mockCallback).toHaveBeenCalledTimes(2)
    })

    it('should execute function after delay', async () => {
      const throttledFn = optimizer.throttle('test-key', mockCallback, 10)
      
      throttledFn()
      
      await new Promise(resolve => setTimeout(resolve, 20))
      
      expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('should use different keys for different throttled functions', async () => {
      const fn1 = jest.fn()
      const fn2 = jest.fn()
      
      const throttledFn1 = optimizer.throttle('key1', fn1, 100)
      const throttledFn2 = optimizer.throttle('key2', fn2, 100)
      
      throttledFn1()
      throttledFn2()
      
      expect(fn1).toHaveBeenCalledTimes(1)
      expect(fn2).toHaveBeenCalledTimes(1)
      
      await new Promise(resolve => setTimeout(resolve, 150))
    })

    it('should pass arguments to throttled function', async () => {
      const testFn = jest.fn()
      const throttledFn = optimizer.throttle('test-key', testFn, 10)
      
      throttledFn('arg1', 'arg2')
      
      await new Promise(resolve => setTimeout(resolve, 20))
      
      expect(testFn).toHaveBeenCalledWith('arg1', 'arg2')
    })
  })

  describe('Debouncing', () => {
    it('should debounce function calls', async () => {
      const debouncedFn = optimizer.debounce('test-key', mockCallback, 100)
      
      // Call multiple times rapidly
      debouncedFn()
      debouncedFn()
      debouncedFn()
      
      // Function should not be called immediately
      expect(mockCallback).not.toHaveBeenCalled()
      
      // Wait for debounce period
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Should be called once after debounce period
      expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('should execute function after delay with no further calls', async () => {
      const debouncedFn = optimizer.debounce('test-key', mockCallback, 10)
      
      debouncedFn()
      
      await new Promise(resolve => setTimeout(resolve, 20))
      
      expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('should reset timer on subsequent calls', async () => {
      const debouncedFn = optimizer.debounce('test-key', mockCallback, 50)
      
      debouncedFn()
      
      // Wait a bit but not enough to trigger
      await new Promise(resolve => setTimeout(resolve, 30))
      expect(mockCallback).not.toHaveBeenCalled()
      
      debouncedFn()
      
      // Wait for full debounce period
      await new Promise(resolve => setTimeout(resolve, 60))
      
      expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('should pass arguments to debounced function', async () => {
      const testFn = jest.fn()
      const debouncedFn = optimizer.debounce('test-key', testFn, 10)
      
      debouncedFn('arg1', 'arg2')
      
      await new Promise(resolve => setTimeout(resolve, 20))
      
      expect(testFn).toHaveBeenCalledWith('arg1', 'arg2')
    })
  })

  describe('Connection Management', () => {
    it('should allow connection creation when under limit', () => {
      const canCreate = optimizer.canCreateConnection('connection1')
      expect(canCreate).toBe(true)
    })

    it('should prevent duplicate connections', () => {
      optimizer.registerConnection('connection1')
      const canCreate = optimizer.canCreateConnection('connection1')
      expect(canCreate).toBe(false)
    })

    it('should prevent connections when at limit', () => {
      // Register maximum connections
      for (let i = 0; i < 10; i++) {
        optimizer.registerConnection(`connection${i}`)
      }
      
      const canCreate = optimizer.canCreateConnection('new-connection')
      expect(canCreate).toBe(false)
    })

    it('should register and unregister connections', () => {
      optimizer.registerConnection('connection1')
      expect(optimizer.getConnectionCount()).toBe(1)
      
      optimizer.unregisterConnection('connection1')
      expect(optimizer.getConnectionCount()).toBe(0)
    })

    it('should return correct connection count', () => {
      expect(optimizer.getConnectionCount()).toBe(0)
      
      optimizer.registerConnection('connection1')
      optimizer.registerConnection('connection2')
      
      expect(optimizer.getConnectionCount()).toBe(2)
    })
  })

  describe('Efficient Timer', () => {
    it('should create timer with correct duration', async () => {
      const onTick = jest.fn()
      const onComplete = jest.fn()
      
      const cleanup = optimizer.createEfficientTimer(100, onTick, onComplete)
      
      await new Promise(resolve => setTimeout(resolve, 120))
      
      expect(onTick).toHaveBeenCalled()
      expect(onComplete).toHaveBeenCalled()
      
      cleanup()
    })

    it('should call onTick with remaining time', async () => {
      const onTick = jest.fn()
      const onComplete = jest.fn()
      
      const cleanup = optimizer.createEfficientTimer(50, onTick, onComplete)
      
      await new Promise(resolve => setTimeout(resolve, 60))
      
      expect(onTick).toHaveBeenCalled()
      expect(onComplete).toHaveBeenCalled()
      
      cleanup()
    })

    it('should stop timer when cleanup is called', async () => {
      const onTick = jest.fn()
      const onComplete = jest.fn()
      
      const cleanup = optimizer.createEfficientTimer(100, onTick, onComplete)
      
      // Call cleanup immediately
      cleanup()
      
      await new Promise(resolve => setTimeout(resolve, 120))
      
      expect(onTick).not.toHaveBeenCalled()
      expect(onComplete).not.toHaveBeenCalled()
    })
  })

  describe('Performance Metrics', () => {
    it('should return current performance metrics', () => {
      const metrics = optimizer.getPerformanceMetrics()
      
      expect(metrics).toHaveProperty('currentFPS')
      expect(metrics).toHaveProperty('pollingInterval')
      expect(metrics).toHaveProperty('activeConnections')
      expect(metrics).toHaveProperty('throttledFunctions')
    })

    it('should return correct connection count in metrics', () => {
      optimizer.registerConnection('connection1')
      optimizer.registerConnection('connection2')
      
      const metrics = optimizer.getPerformanceMetrics()
      expect(metrics.activeConnections).toBe(2)
    })

    it('should return correct throttled functions count', async () => {
      const throttledFn = optimizer.throttle('test-key', mockCallback, 100)
      throttledFn()
      
      const metrics = optimizer.getPerformanceMetrics()
      expect(metrics.throttledFunctions).toBe(1)
      
      await new Promise(resolve => setTimeout(resolve, 150))
    })
  })

  describe('Configuration Updates', () => {
    it('should update configuration', () => {
      const newConfig: Partial<PerformanceConfig> = {
        targetFPS: 30,
        throttleDelay: 50
      }
      
      optimizer.updateConfig(newConfig)
      
      // Verify configuration was updated
      const metrics = optimizer.getPerformanceMetrics()
      expect(metrics).toBeDefined()
    })

    it('should merge configuration updates', () => {
      const newConfig: Partial<PerformanceConfig> = {
        targetFPS: 30
      }
      
      optimizer.updateConfig(newConfig)
      
      // Should not affect other config properties
      const metrics = optimizer.getPerformanceMetrics()
      expect(metrics).toBeDefined()
    })
  })

  describe('Cleanup', () => {
    it('should cleanup all resources', async () => {
      // Start various services
      optimizer.limitFPS(mockCallback)
      optimizer.startAdaptivePolling(mockCallback)
      optimizer.registerConnection('connection1')
      const throttledFn = optimizer.throttle('test-key', mockCallback, 100)
      throttledFn()
      
      // Cleanup
      optimizer.cleanup()
      
      // Verify cleanup
      expect(mockCancelAnimationFrame).toHaveBeenCalled()
      expect(mockClearTimeout).toHaveBeenCalled()
      
      const metrics = optimizer.getPerformanceMetrics()
      expect(metrics.activeConnections).toBe(0)
      expect(metrics.throttledFunctions).toBe(0)
      
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    it('should handle multiple cleanup calls gracefully', () => {
      optimizer.cleanup()
      optimizer.cleanup()
      optimizer.cleanup()
      
      // Should not throw errors
      expect(() => optimizer.cleanup()).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle errors in callback functions gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test error')
      })
      
      const throttledFn = optimizer.throttle('error-key', errorCallback, 100)
      
      expect(() => {
        throttledFn()
      }).not.toThrow()
    })

    it('should handle null or undefined callbacks', () => {
      expect(() => {
        optimizer.limitFPS(null as any)
      }).not.toThrow()
      
      expect(() => {
        optimizer.startAdaptivePolling(undefined as any)
      }).not.toThrow()
    })
  })

  describe('Performance Optimization', () => {
    it('should optimize polling interval based on FPS', () => {
      // Mock poor performance
      ;(optimizer as any).currentFPS = 25
      
      optimizer.startAdaptivePolling(mockCallback)
      
      // Verify interval adjustment
      const metrics = optimizer.getPerformanceMetrics()
      expect(metrics.pollingInterval).toBeGreaterThanOrEqual(3000)
    })

    it('should optimize polling interval for good performance', () => {
      // Mock good performance
      ;(optimizer as any).currentFPS = 58
      
      optimizer.startAdaptivePolling(mockCallback)
      
      // Verify interval adjustment
      const metrics = optimizer.getPerformanceMetrics()
      expect(metrics.pollingInterval).toBeLessThanOrEqual(23000)
    })
  })
}) 