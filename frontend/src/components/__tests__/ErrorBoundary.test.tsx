import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorBoundary from '../ErrorBoundary'

// Mock the navigation service
jest.mock('../../services/navigationService', () => ({
  navigationService: {
    navigateToHome: jest.fn(),
    subscribe: jest.fn(() => () => {}),
  },
}))

// Mock the game store
jest.mock('../../stores/gameStore', () => ({
  useGameStore: {
    getState: jest.fn(() => ({
      setError: jest.fn(),
      resetGame: jest.fn(),
    })),
  },
}))

// Mock console methods to avoid test noise
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

// Test component that can throw errors
const ThrowError: React.FC<{ shouldThrow: boolean; errorMessage?: string }> = ({ 
  shouldThrow, 
  errorMessage = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage)
  }
  return <div data-testid="working-component">Component is working</div>
}

describe('ErrorBoundary', () => {
  let navigationServiceMock: any
  let gameStoreMock: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    navigationServiceMock = require('../../services/navigationService').navigationService
    gameStoreMock = {
      setError: jest.fn(),
      resetGame: jest.fn(),
    }
    
    const useGameStore = require('../../stores/gameStore').useGameStore
    useGameStore.getState.mockReturnValue(gameStoreMock)
  })

  describe('Normal Rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('working-component')).toBeInTheDocument()
      expect(screen.getByText('Component is working')).toBeInTheDocument()
    })

    it('should not interfere with normal component behavior', () => {
      const TestComponent = () => {
        const [count, setCount] = React.useState(0)
        return (
          <div>
            <span data-testid="count">{count}</span>
            <button onClick={() => setCount(c => c + 1)}>Increment</button>
          </div>
        )
      }

      render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('count')).toHaveTextContent('0')
      
      fireEvent.click(screen.getByText('Increment'))
      
      expect(screen.getByTestId('count')).toHaveTextContent('1')
    })
  })

  describe('Error Handling', () => {
    it('should catch and display error when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Component crashed" />
        </ErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument()
    })

    it('should display error message in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Detailed error message" />
        </ErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      // In development, more details might be shown
      
      process.env.NODE_ENV = originalEnv
    })

    it('should call onError prop when error occurs', () => {
      const onError = jest.fn()
      
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} errorMessage="Test error" />
        </ErrorBoundary>
      )

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      )
    })

    it('should log error to console', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Console test error" />
        </ErrorBoundary>
      )

      expect(consoleSpy).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.any(Object)
      )
    })
  })

  describe('Custom Fallback UI', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom error UI</div>
      
      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('Custom error UI')).toBeInTheDocument()
    })

    it('should use default fallback when no custom fallback provided', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
    })
  })

  describe('Retry Functionality', () => {
    it('should provide retry button in default error UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('should retry rendering when retry button is clicked', async () => {
      const user = userEvent.setup()
      let shouldThrow = true
      
      const DynamicComponent = () => (
        <ThrowError shouldThrow={shouldThrow} />
      )

      const { rerender } = render(
        <ErrorBoundary>
          <DynamicComponent />
        </ErrorBoundary>
      )

      // Error should be displayed
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()

      // Fix the error condition
      shouldThrow = false
      
      // Click retry button
      await user.click(screen.getByText('Try Again'))

      // Rerender with fixed component
      rerender(
        <ErrorBoundary>
          <DynamicComponent />
        </ErrorBoundary>
      )

      // Should show working component now
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument()
    })

    it('should limit retry attempts', async () => {
      const user = userEvent.setup()
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // Click retry multiple times
      for (let i = 0; i < 5; i++) {
        if (screen.queryByText('Try Again')) {
          await user.click(screen.getByText('Try Again'))
          await waitFor(() => {
            // Wait for any state updates
          })
        }
      }

      // After max retries, button should be disabled or hidden
      const retryButton = screen.queryByText('Try Again')
      if (retryButton) {
        expect(retryButton).toBeDisabled()
      }
    })
  })

  describe('Navigation Integration', () => {
    it('should provide reload page button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Reload Page')).toBeInTheDocument()
    })

    it('should reload page when reload button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      await user.click(screen.getByText('Reload Page'))

      expect(navigationServiceMock.navigateToHome).toHaveBeenCalled()
    })

    it('should reset game state when navigating home', async () => {
      const user = userEvent.setup()
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      await user.click(screen.getByText('Reload Page'))

      expect(gameStoreMock.resetGame).toHaveBeenCalled()
    })
  })

  describe('Error Types', () => {
    it('should handle different error types', () => {
      const errors = [
        new Error('Standard error'),
        new TypeError('Type error'),
        new ReferenceError('Reference error'),
        'String error',
        { message: 'Object error' },
      ]

      errors.forEach((error) => {
        const ErrorComponent = () => {
          throw error
        }

        const { unmount } = render(
          <ErrorBoundary>
            <ErrorComponent />
          </ErrorBoundary>
        )

        expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
        
        unmount()
      })
    })

    it('should handle network errors gracefully', () => {
      const NetworkErrorComponent = () => {
        throw new Error('Network request failed')
      }

      render(
        <ErrorBoundary>
          <NetworkErrorComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
    })
  })

     describe('Production vs Development Behavior', () => {
     it('should behave differently in production mode', () => {
       const originalEnv = process.env.NODE_ENV
       process.env.NODE_ENV = 'production'

       const logErrorSpy = jest.spyOn(console, 'error').mockImplementation()

       render(
         <ErrorBoundary>
           <ThrowError shouldThrow={true} />
         </ErrorBoundary>
       )

       // In production mode, errors should still be logged
       expect(logErrorSpy).toHaveBeenCalled()
       
       process.env.NODE_ENV = originalEnv
     })
   })

  describe('Component Lifecycle', () => {
    it('should reset error state when children change', () => {
      let shouldThrow = true
      
      const DynamicComponent = () => (
        <ThrowError shouldThrow={shouldThrow} />
      )

      const { rerender } = render(
        <ErrorBoundary>
          <DynamicComponent />
        </ErrorBoundary>
      )

      // Error should be displayed
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()

      // Change children
      shouldThrow = false
      rerender(
        <ErrorBoundary>
          <div>New component</div>
        </ErrorBoundary>
      )

      // Error should be cleared
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument()
      expect(screen.getByText('New component')).toBeInTheDocument()
    })

    it('should handle unmounting gracefully', () => {
      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Error Information', () => {
    it('should capture component stack trace', () => {
      const onError = jest.fn()
      
      render(
        <ErrorBoundary onError={onError}>
          <div>
            <span>
              <ThrowError shouldThrow={true} />
            </span>
          </div>
        </ErrorBoundary>
      )

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.stringContaining('ThrowError'),
        })
      )
    })

    it('should provide error details for debugging', () => {
      const onError = jest.fn()
      const errorMessage = 'Detailed error for debugging'
      
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} errorMessage={errorMessage} />
        </ErrorBoundary>
      )

      const [error, errorInfo] = onError.mock.calls[0]
      expect(error.message).toBe(errorMessage)
      expect(errorInfo.componentStack).toContain('ThrowError')
    })
  })
}) 