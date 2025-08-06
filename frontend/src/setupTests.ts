import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'

// Initialize test environment
let testContext;
try {
  const { TestUtilities } = require('../../shared/test-config/dist/cjs/TestUtilities');
  const { environment } = TestUtilities.getCurrentContext();
  testContext = TestUtilities.configManager?.getEnvironmentConfig(environment);
} catch (error) {
  // Use fallback configuration - this is expected for unit tests
  testContext = null;
}

// Mock Web Audio API
if (!window.AudioContext) {
  Object.defineProperty(window, 'AudioContext', {
    value: class MockAudioContext {
      destination: any
      state: string
      sampleRate: number
      
      constructor() {
        this.destination = { connect: jest.fn() }
        this.state = 'running'
        this.sampleRate = 44100
      }
      
      createGain() {
        return {
          connect: jest.fn(),
          disconnect: jest.fn(),
          gain: { value: 1 }
        }
      }
      
      createBufferSource() {
        return {
          connect: jest.fn(),
          disconnect: jest.fn(),
          start: jest.fn(),
          stop: jest.fn(),
          buffer: null
        }
      }
      
      decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
        return Promise.resolve({
          duration: 1,
          length: 44100,
          numberOfChannels: 2,
          sampleRate: 44100,
          getChannelData: () => new Float32Array(44100),
          copyFromChannel: jest.fn(),
          copyToChannel: jest.fn()
        } as AudioBuffer)
      }
      
      suspend() {
        this.state = 'suspended'
        return Promise.resolve()
      }
      
      resume() {
        this.state = 'running'
        return Promise.resolve()
      }
      
      close() {
        this.state = 'closed'
        return Promise.resolve()
      }
    },
    writable: true,
    configurable: true
  })
}

// Mock requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  value: (callback: FrameRequestCallback) => {
    return setTimeout(() => callback(performance.now()), 16)
  }
})

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: (id: number) => {
    clearTimeout(id)
  }
})

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: () => Date.now(),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => [])
  }
})

// Mock ResizeObserver
Object.defineProperty(window, 'ResizeObserver', {
  value: class MockResizeObserver {
    callback: ResizeObserverCallback
    
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
    }
    
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

// Mock IntersectionObserver
Object.defineProperty(window, 'IntersectionObserver', {
  value: class MockIntersectionObserver {
    callback: IntersectionObserverCallback
    
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback
    }
    
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

// Mock matchMedia
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    }),
    writable: true,
    configurable: true
  })
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

// Configure testing library
configure({
  testIdAttribute: 'data-testid'
})

// Global test utilities
if (!global.ResizeObserver) {
  Object.defineProperty(global, 'ResizeObserver', {
    value: window.ResizeObserver,
    writable: true,
    configurable: true
  })
}

if (!global.IntersectionObserver) {
  Object.defineProperty(global, 'IntersectionObserver', {
    value: window.IntersectionObserver,
    writable: true,
    configurable: true
  })
}

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalConsoleError.call(console, ...args)
  }
  
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: componentWillReceiveProps') ||
       args[0].includes('Warning: componentWillUpdate'))
    ) {
      return
    }
    originalConsoleWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
  localStorageMock.clear()
  sessionStorageMock.clear()
}) 