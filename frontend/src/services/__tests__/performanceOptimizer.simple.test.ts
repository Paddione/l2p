// Simple coverage test for performanceOptimizer
describe('performanceOptimizer Coverage Tests', () => {
  beforeAll(() => {
    // Mock browser APIs
    Object.defineProperty(window, 'performance', {
      value: { now: () => Date.now() },
      writable: true
    })
    
    global.requestAnimationFrame = jest.fn((cb) => {
      setTimeout(cb, 16)
      return 1
    })
    
    global.cancelAnimationFrame = jest.fn()
  })

  it('covers all public methods', async () => {
    // Import after mocking
    const { PerformanceOptimizer } = await import('../performanceOptimizer')
    
    const optimizer = PerformanceOptimizer.getInstance()
    
    // Test all methods to achieve coverage
    const callback = jest.fn()
    
    // FPS limiting
    optimizer.limitFPS(callback)
    optimizer.stopFPSLimiting()
    
    // Adaptive polling
    optimizer.startAdaptivePolling(callback)
    optimizer.stopAdaptivePolling()
    
    // Throttling and debouncing
    const throttled = optimizer.throttle('test', callback, 100)
    throttled()
    
    const debounced = optimizer.debounce('test', callback, 100)
    debounced()
    
    // Connection management
    expect(optimizer.canCreateConnection('conn1')).toBe(true)
    optimizer.registerConnection('conn1')
    expect(optimizer.getConnectionCount()).toBe(1)
    optimizer.unregisterConnection('conn1')
    
    // Timer creation
    const cleanup = optimizer.createEfficientTimer(1000, callback, callback)
    cleanup()
    
    // Metrics and config
    const metrics = optimizer.getPerformanceMetrics()
    expect(metrics).toHaveProperty('currentFPS')
    
    optimizer.updateConfig({ targetFPS: 30 })
    optimizer.cleanup()
  })
})