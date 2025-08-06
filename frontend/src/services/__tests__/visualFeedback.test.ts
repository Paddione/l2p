import { VisualFeedbackService, type FlashConfig, type AnimationConfig } from '../visualFeedback'

// Mock requestAnimationFrame and cancelAnimationFrame
const mockRequestAnimationFrame = jest.fn()
const mockCancelAnimationFrame = jest.fn()

// Mock setTimeout and clearTimeout
const mockSetTimeout = jest.fn()
const mockClearTimeout = jest.fn()

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

describe('VisualFeedbackService', () => {
  let service: VisualFeedbackService
  let mockElement: HTMLElement

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Reset static instance
    ;(VisualFeedbackService as any).instance = null
    
    // Create fresh instance
    service = VisualFeedbackService.getInstance()
    
    // Create mock element
    mockElement = document.createElement('div')
    mockElement.style.backgroundColor = 'initial'
    mockElement.style.transition = 'initial'
    mockElement.style.transform = 'initial'
    mockElement.style.color = 'initial'
    mockElement.style.boxShadow = 'initial'
    mockElement.style.animation = 'initial'
    mockElement.style.borderLeft = 'initial'
    mockElement.style.opacity = 'initial'
    
    // Setup setTimeout to return a mock timeout ID
    let timeoutId = 1
    mockSetTimeout.mockImplementation((callback, delay) => {
      const id = timeoutId++
      setTimeout(() => callback(), delay)
      return id
    })
  })

  afterEach(() => {
    // Cleanup
    service.cleanup()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = VisualFeedbackService.getInstance()
      const instance2 = VisualFeedbackService.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should create only one instance', () => {
      const instance1 = VisualFeedbackService.getInstance()
      ;(VisualFeedbackService as any).instance = null
      const instance2 = VisualFeedbackService.getInstance()
      expect(instance1).not.toBe(instance2)
    })
  })

  describe('flashElement', () => {
    it('should flash element with specified color and duration', () => {
      const config: FlashConfig = {
        color: '#ff0000',
        duration: 500,
        intensity: 0.8
      }
      
      service.flashElement(mockElement, config)
      
      expect(mockElement.style.transition).toBe('background-color 500ms ease-in-out')
      expect(mockElement.style.backgroundColor).toBe('#ff0000')
    })

    it('should reset element styles after animation', (done) => {
      const config: FlashConfig = {
        color: '#00ff00',
        duration: 100,
        intensity: 0.5
      }
      
      const originalBackground = mockElement.style.backgroundColor
      const originalTransition = mockElement.style.transition
      
      service.flashElement(mockElement, config)
      
      setTimeout(() => {
        expect(mockElement.style.backgroundColor).toBe(originalBackground)
        expect(mockElement.style.transition).toBe(originalTransition)
        done()
      }, 150)
    })

    it('should handle different flash configurations', () => {
      const config1: FlashConfig = {
        color: '#0000ff',
        duration: 200,
        intensity: 1.0
      }
      
      service.flashElement(mockElement, config1)
      
      expect(mockElement.style.backgroundColor).toBe('#0000ff')
      expect(mockElement.style.transition).toBe('background-color 200ms ease-in-out')
    })
  })

  describe('flashAvatar', () => {
    it('should flash avatar green for correct answer', () => {
      service.flashAvatar(mockElement, true)
      
      expect(mockElement.style.backgroundColor).toBe('#10b981')
      expect(mockElement.style.transition).toBe('background-color 300ms ease-in-out')
    })

    it('should flash avatar red for incorrect answer', () => {
      service.flashAvatar(mockElement, false)
      
      expect(mockElement.style.backgroundColor).toBe('#ef4444')
      expect(mockElement.style.transition).toBe('background-color 300ms ease-in-out')
    })

    it('should reset avatar styles after animation', (done) => {
      const originalBackground = mockElement.style.backgroundColor
      const originalTransition = mockElement.style.transition
      
      service.flashAvatar(mockElement, true)
      
      setTimeout(() => {
        expect(mockElement.style.backgroundColor).toBe(originalBackground)
        expect(mockElement.style.transition).toBe(originalTransition)
        done()
      }, 350)
    })
  })

  describe('animateMultiplierBadge', () => {
    it('should animate multiplier badge with scale effect', () => {
      service.animateMultiplierBadge(mockElement, 2)
      
      expect(mockElement.style.transform).toBe('scale(1.2)')
      expect(mockElement.style.transition).toBe('transform 0.2s ease-out')
    })

    it('should add glow effect based on multiplier', () => {
      service.animateMultiplierBadge(mockElement, 3)
      
      expect(mockElement.style.boxShadow).toBe('0 0 20px #8b5cf6')
    })

    it('should handle high multiplier values', () => {
      service.animateMultiplierBadge(mockElement, 10)
      
      // Should use the last glow color for high multipliers
      expect(mockElement.style.boxShadow).toBe('0 0 20px #ef4444')
    })

    it('should reset badge styles after animation', (done) => {
      const originalTransform = mockElement.style.transform
      const originalTransition = mockElement.style.transition
      const originalBoxShadow = mockElement.style.boxShadow
      
      service.animateMultiplierBadge(mockElement, 2)
      
      setTimeout(() => {
        expect(mockElement.style.transform).toBe(originalTransform)
        expect(mockElement.style.transition).toBe(originalTransition)
        expect(mockElement.style.boxShadow).toBe(originalBoxShadow)
        done()
      }, 250)
    })
  })

  describe('animateScorePoints', () => {
    it('should animate score points with floating effect', () => {
      service.animateScorePoints(mockElement, 100)
      
      expect(mockElement.style.transform).toBe('translateY(-20px) scale(1.1)')
      expect(mockElement.style.transition).toBe('transform 0.5s ease-out')
    })

    it('should color high points green', () => {
      service.animateScorePoints(mockElement, 75)
      
      expect(mockElement.style.color).toBe('#10b981')
    })

    it('should color medium points orange', () => {
      service.animateScorePoints(mockElement, 35)
      
      expect(mockElement.style.color).toBe('#f59e0b')
    })

    it('should color low points red', () => {
      service.animateScorePoints(mockElement, 15)
      
      expect(mockElement.style.color).toBe('#ef4444')
    })

    it('should reset score styles after animation', (done) => {
      const originalTransform = mockElement.style.transform
      const originalTransition = mockElement.style.transition
      const originalColor = mockElement.style.color
      
      service.animateScorePoints(mockElement, 50)
      
      setTimeout(() => {
        expect(mockElement.style.transform).toBe(originalTransform)
        expect(mockElement.style.transition).toBe(originalTransition)
        expect(mockElement.style.color).toBe(originalColor)
        done()
      }, 550)
    })
  })

  describe('animateAnswerSelection', () => {
    it('should animate correct answer with green background and scale up', () => {
      service.animateAnswerSelection(mockElement, true)
      
      expect(mockElement.style.backgroundColor).toBe('#10b981')
      expect(mockElement.style.transform).toBe('scale(1.05)')
      expect(mockElement.style.transition).toBe('all 0.3s ease-in-out')
    })

    it('should animate incorrect answer with red background and scale down', () => {
      service.animateAnswerSelection(mockElement, false)
      
      expect(mockElement.style.backgroundColor).toBe('#ef4444')
      expect(mockElement.style.transform).toBe('scale(0.95)')
      expect(mockElement.style.transition).toBe('all 0.3s ease-in-out')
    })

    it('should reset answer styles after animation', (done) => {
      const originalTransform = mockElement.style.transform
      const originalTransition = mockElement.style.transition
      const originalBackground = mockElement.style.backgroundColor
      
      service.animateAnswerSelection(mockElement, true)
      
      setTimeout(() => {
        expect(mockElement.style.transform).toBe(originalTransform)
        expect(mockElement.style.transition).toBe(originalTransition)
        expect(mockElement.style.backgroundColor).toBe(originalBackground)
        done()
      }, 350)
    })
  })

  describe('animateTimerWarning', () => {
    it('should show red warning for urgent time (≤10 seconds)', () => {
      service.animateTimerWarning(mockElement, 8)
      
      expect(mockElement.style.color).toBe('#ef4444')
      expect(mockElement.style.transition).toBe('color 0.2s ease-in-out')
    })

    it('should show orange warning for warning time (≤20 seconds)', () => {
      service.animateTimerWarning(mockElement, 15)
      
      expect(mockElement.style.color).toBe('#f59e0b')
    })

    it('should show yellow warning for caution time (≤30 seconds)', () => {
      service.animateTimerWarning(mockElement, 25)
      
      expect(mockElement.style.color).toBe('#fbbf24')
    })

    it('should not change color for normal time (>30 seconds)', () => {
      const originalColor = mockElement.style.color
      service.animateTimerWarning(mockElement, 35)
      
      expect(mockElement.style.color).toBe(originalColor)
    })

    it('should reset timer styles after animation', (done) => {
      const originalColor = mockElement.style.color
      const originalTransition = mockElement.style.transition
      
      service.animateTimerWarning(mockElement, 10)
      
      setTimeout(() => {
        expect(mockElement.style.color).toBe(originalColor)
        expect(mockElement.style.transition).toBe(originalTransition)
        done()
      }, 1100)
    })
  })

  describe('scrollToElement', () => {
    it('should call scrollIntoView with smooth behavior', () => {
      const mockContainer = document.createElement('div')
      const scrollIntoViewSpy = jest.spyOn(mockElement, 'scrollIntoView')
      
      service.scrollToElement(mockElement, mockContainer)
      
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      })
    })

    it('should handle getBoundingClientRect', () => {
      const mockContainer = document.createElement('div')
      const getBoundingClientRectSpy = jest.spyOn(mockElement, 'getBoundingClientRect')
      const containerGetBoundingClientRectSpy = jest.spyOn(mockContainer, 'getBoundingClientRect')
      
      service.scrollToElement(mockElement, mockContainer)
      
      expect(getBoundingClientRectSpy).toHaveBeenCalled()
      expect(containerGetBoundingClientRectSpy).toHaveBeenCalled()
    })
  })

  describe('animateLoadingSpinner', () => {
    it('should start spinner animation', () => {
      service.animateLoadingSpinner(mockElement)
      
      expect(mockElement.style.animation).toBe('spin 1s linear infinite')
    })
  })

  describe('stopLoadingSpinner', () => {
    it('should stop spinner animation', () => {
      service.animateLoadingSpinner(mockElement)
      service.stopLoadingSpinner(mockElement)
      
      expect(mockElement.style.animation).toBe('')
    })
  })

  describe('animateMessage', () => {
    it('should animate success message with green border', () => {
      service.animateMessage(mockElement, 'success')
      
      expect(mockElement.style.borderLeft).toBe('4px solid #10b981')
      expect(mockElement.style.transform).toBe('translateY(0)')
      expect(mockElement.style.transition).toBe('transform 0.3s ease-out')
    })

    it('should animate error message with red border', () => {
      service.animateMessage(mockElement, 'error')
      
      expect(mockElement.style.borderLeft).toBe('4px solid #ef4444')
    })

    it('should animate warning message with orange border', () => {
      service.animateMessage(mockElement, 'warning')
      
      expect(mockElement.style.borderLeft).toBe('4px solid #f59e0b')
    })

    it('should slide out message after delay', (done) => {
      service.animateMessage(mockElement, 'success')
      
      setTimeout(() => {
        expect(mockElement.style.transform).toBe('translateY(-100%)')
        done()
      }, 3100)
    })

    it('should reset message styles after animation', (done) => {
      const originalTransform = mockElement.style.transform
      const originalTransition = mockElement.style.transition
      const originalBorderLeft = mockElement.style.borderLeft
      
      service.animateMessage(mockElement, 'success')
      
      setTimeout(() => {
        expect(mockElement.style.transform).toBe(originalTransform)
        expect(mockElement.style.transition).toBe(originalTransition)
        expect(mockElement.style.borderLeft).toBe(originalBorderLeft)
        done()
      }, 3400)
    })
  })

  describe('animateButtonPress', () => {
    it('should animate button press with scale down effect', () => {
      service.animateButtonPress(mockElement)
      
      expect(mockElement.style.transform).toBe('scale(0.95)')
      expect(mockElement.style.transition).toBe('transform 0.1s ease-out')
    })

    it('should reset button styles after animation', (done) => {
      const originalTransform = mockElement.style.transform
      const originalTransition = mockElement.style.transition
      
      service.animateButtonPress(mockElement)
      
      setTimeout(() => {
        expect(mockElement.style.transform).toBe(originalTransform)
        expect(mockElement.style.transition).toBe(originalTransition)
        done()
      }, 150)
    })
  })

  describe('animateModal', () => {
    it('should animate modal opening with scale and opacity', () => {
      service.animateModal(mockElement, true)
      
      expect(mockElement.style.transform).toBe('scale(1)')
      expect(mockElement.style.opacity).toBe('1')
      expect(mockElement.style.transition).toBe('all 0.3s ease-in-out')
    })

    it('should animate modal closing with scale and opacity', () => {
      service.animateModal(mockElement, false)
      
      expect(mockElement.style.transform).toBe('scale(0.9)')
      expect(mockElement.style.opacity).toBe('0')
      expect(mockElement.style.transition).toBe('all 0.3s ease-in-out')
    })

    it('should reset modal styles after animation', (done) => {
      const originalTransform = mockElement.style.transform
      const originalTransition = mockElement.style.transition
      const originalOpacity = mockElement.style.opacity
      
      service.animateModal(mockElement, true)
      
      setTimeout(() => {
        expect(mockElement.style.transform).toBe(originalTransform)
        expect(mockElement.style.transition).toBe(originalTransition)
        expect(mockElement.style.opacity).toBe(originalOpacity)
        done()
      }, 350)
    })
  })

  describe('cleanup', () => {
    it('should cancel animation frame if exists', () => {
      ;(service as any).animationFrameId = 123
      
      service.cleanup()
      
      expect(mockCancelAnimationFrame).toHaveBeenCalledWith(123)
      expect((service as any).animationFrameId).toBeNull()
    })

    it('should handle cleanup when no animation frame exists', () => {
      ;(service as any).animationFrameId = null
      
      service.cleanup()
      
      expect(mockCancelAnimationFrame).not.toHaveBeenCalled()
    })

    it('should handle multiple cleanup calls gracefully', () => {
      ;(service as any).animationFrameId = 123
      
      service.cleanup()
      service.cleanup()
      service.cleanup()
      
      expect(mockCancelAnimationFrame).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle null element gracefully', () => {
      expect(() => {
        service.flashElement(null as any, { color: '#ff0000', duration: 100, intensity: 0.5 })
      }).not.toThrow()
    })

    it('should handle undefined element gracefully', () => {
      expect(() => {
        service.animateMultiplierBadge(undefined as any, 2)
      }).not.toThrow()
    })

    it('should handle missing style properties', () => {
      const elementWithoutStyles = document.createElement('div')
      delete (elementWithoutStyles as any).style
      
      expect(() => {
        service.flashAvatar(elementWithoutStyles, true)
      }).not.toThrow()
    })
  })

  describe('Performance Considerations', () => {
    it('should handle multiple rapid animations', () => {
      for (let i = 0; i < 10; i++) {
        service.flashAvatar(mockElement, true)
        service.animateButtonPress(mockElement)
        service.animateScorePoints(mockElement, 50)
      }
      
      // Should not throw errors
      expect(() => {
        service.cleanup()
      }).not.toThrow()
    })

    it('should handle concurrent animations on same element', () => {
      service.flashAvatar(mockElement, true)
      service.animateMultiplierBadge(mockElement, 2)
      service.animateScorePoints(mockElement, 100)
      
      // Should not throw errors
      expect(() => {
        service.cleanup()
      }).not.toThrow()
    })
  })

  describe('Accessibility Considerations', () => {
    it('should respect reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
        writable: true
      })
      
      // Should still work even with reduced motion
      expect(() => {
        service.flashAvatar(mockElement, true)
      }).not.toThrow()
    })
  })
}) 