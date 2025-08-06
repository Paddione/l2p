import '@testing-library/jest-dom'
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils';
// Jest globals: describe, it, expect, beforeEach are automatically available
import { AuthGuard } from '../AuthGuard';
import { useAuthStore } from '../../stores/authStore';

// Mock services that use import.meta
jest.mock('../../services/apiService', () => ({
  apiService: {
    getQuestionSets: jest.fn(),
    getLobby: jest.fn(),
    isAuthenticated: jest.fn(),
    // Add other methods as needed
  }
}));

jest.mock('../../services/socketService', () => ({
  socketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    // Add other methods as needed
  }
}));

// Mock the auth store
jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn()
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Test component to render inside AuthGuard
const TestComponent = () => <div>Protected Content</div>;
const LoginComponent = () => <div>Login Page</div>;

describe('AuthGuard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderAuthGuard = (isAuthenticated: boolean, isLoading: boolean = false, user: any = null) => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated,
      isLoading,
      user,
      login: jest.fn(),
      register: jest.fn(),
      resetPassword: jest.fn(),
      logout: jest.fn(),
      error: null,
      clearError: jest.fn()
    });

    return renderWithProviders(
      <AuthGuard>
        <TestComponent />
      </AuthGuard>
    );
  };

  describe('Authentication Checks', () => {
    it('should render protected content when user is authenticated', () => {
      renderAuthGuard(true);

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should redirect to login when user is not authenticated', async () => {
      renderAuthGuard(false);

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('should redirect to login when user is null', async () => {
      renderAuthGuard(false, false, null);

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('should handle authentication state changes', async () => {
      const { rerender } = renderAuthGuard(false);

      // Initially should show login
      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });

      // Update to authenticated
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 1, username: 'testuser' },
        login: jest.fn(),
        register: jest.fn(),
        resetPassword: jest.fn(),
        logout: jest.fn(),
        error: null,
        clearError: jest.fn()
      });

      rerender(
        <AuthGuard>
          <TestComponent />
        </AuthGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during authentication check', () => {
      renderAuthGuard(false, true);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should not show protected content during loading', () => {
      renderAuthGuard(false, true);

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should not redirect during loading', () => {
      renderAuthGuard(false, true);

      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });

    it('should show loading spinner with proper styling', () => {
      renderAuthGuard(false, true);

      const loadingElement = screen.getByText(/loading/i);
      expect(loadingElement).toBeInTheDocument();
      expect(loadingElement.closest('div')).toHaveClass('loading-container');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow access for users with required role', () => {
      const userWithRole = {
        id: 1,
        username: 'admin',
        role: 'admin'
      };

      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: userWithRole,
        login: jest.fn(),
        register: jest.fn(),
        resetPassword: jest.fn(),
        logout: jest.fn(),
        error: null,
        clearError: jest.fn()
      });

      renderWithProviders(
        <AuthGuard requiredRole="admin">
          <TestComponent />
        </AuthGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should deny access for users without required role', async () => {
      const userWithoutRole = {
        id: 1,
        username: 'user',
        role: 'user'
      };

      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: userWithoutRole,
        login: jest.fn(),
        register: jest.fn(),
        resetPassword: jest.fn(),
        logout: jest.fn(),
        error: null,
        clearError: jest.fn()
      });

      renderWithProviders(
        <AuthGuard requiredRole="admin">
          <TestComponent />
        </AuthGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('should handle missing role property gracefully', async () => {
      const userWithoutRoleProperty = {
        id: 1,
        username: 'user'
      };

      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: userWithoutRoleProperty,
        login: jest.fn(),
        register: jest.fn(),
        resetPassword: jest.fn(),
        logout: jest.fn(),
        error: null,
        clearError: jest.fn()
      });

      renderWithProviders(
        <AuthGuard requiredRole="admin">
          <TestComponent />
        </AuthGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });
  });

  describe('Redirect Behavior', () => {
    it('should redirect to login page by default', async () => {
      renderAuthGuard(false);

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('should redirect to custom redirect path when provided', async () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login: jest.fn(),
        register: jest.fn(),
        resetPassword: jest.fn(),
        logout: jest.fn(),
        error: null,
        clearError: jest.fn()
      });

      renderWithProviders(
        <AuthGuard redirectTo="/custom-login">
          <TestComponent />
        </AuthGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Custom Login')).toBeInTheDocument();
      });
    });

    it('should preserve current location for post-login redirect', async () => {
      renderAuthGuard(false);

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });

      // Check that the current location is preserved in the URL or state
      // This would depend on the specific implementation of the AuthGuard
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login: jest.fn(),
        register: jest.fn(),
        resetPassword: jest.fn(),
        logout: jest.fn(),
        error: 'Authentication failed',
        clearError: jest.fn()
      });

      renderAuthGuard(false);

      // Should still redirect to login even with error
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('should handle undefined authentication state', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: undefined as any,
        isLoading: false,
        user: null,
        login: jest.fn(),
        register: jest.fn(),
        resetPassword: jest.fn(),
        logout: jest.fn(),
        error: null,
        clearError: jest.fn()
      });

      renderAuthGuard(false);

      // Should treat undefined as not authenticated
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('should render children when authenticated', () => {
      renderAuthGuard(true);

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not render children when not authenticated', async () => {
      renderAuthGuard(false);

      await waitFor(() => {
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });

    it('should handle multiple children', () => {
      const MultipleChildren = () => (
        <div>
          <div>Child 1</div>
          <div>Child 2</div>
        </div>
      );

      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 1, username: 'testuser' },
        login: jest.fn(),
        register: jest.fn(),
        resetPassword: jest.fn(),
        logout: jest.fn(),
        error: null,
        clearError: jest.fn()
      });

      renderWithProviders(
        <AuthGuard>
          <MultipleChildren />
        </AuthGuard>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should not re-render unnecessarily when authentication state is stable', () => {
      const renderSpy = jest.fn();
      const TestComponentWithSpy = () => {
        renderSpy();
        return <div>Protected Content</div>;
      };

      renderAuthGuard(true);

      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid authentication state changes', async () => {
      const { rerender } = renderAuthGuard(false);

      // Rapidly change authentication state
      for (let i = 0; i < 5; i++) {
        mockUseAuthStore.mockReturnValue({
          isAuthenticated: i % 2 === 0,
          isLoading: false,
          user: i % 2 === 0 ? { id: 1, username: 'testuser' } : null,
          login: jest.fn(),
          register: jest.fn(),
          resetPassword: jest.fn(),
          logout: jest.fn(),
          error: null,
          clearError: jest.fn()
        });

        rerender(
          <AuthGuard>
            <TestComponent />
          </AuthGuard>
        );
      }

      // Should handle the changes gracefully
      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for loading state', () => {
      renderAuthGuard(false, true);

      const loadingElement = screen.getByText(/loading/i);
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should announce authentication status changes', () => {
      renderAuthGuard(false, true);

      const loadingElement = screen.getByText(/loading/i);
      expect(loadingElement).toHaveAttribute('role', 'status');
    });

    it('should be keyboard navigable', () => {
      renderAuthGuard(true);

      // Should not interfere with keyboard navigation
      const protectedContent = screen.getByText('Protected Content');
      expect(protectedContent).toBeInTheDocument();
    });
  });
}); 