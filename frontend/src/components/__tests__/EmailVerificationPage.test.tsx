import '@testing-library/jest-dom'
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils';
// Jest globals: describe, it, expect, beforeEach are automatically available
import { EmailVerificationPage } from '../EmailVerificationPage';
import { useAuthStore } from '../../stores/authStore';

// Mock services that use import.meta
jest.mock('../../services/apiService', () => ({
  apiService: {
    getQuestionSets: jest.fn(),
    getLobby: jest.fn(),
    isAuthenticated: jest.fn(),
    verifyEmail: jest.fn(),
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

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useSearchParams: jest.fn(),
  useNavigate: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('EmailVerificationPage Component', () => {
  const mockVerifyEmail = jest.fn();
  const mockResendVerification = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      verifyEmail: mockVerifyEmail,
      resendVerification: mockResendVerification,
      isLoading: false,
      error: null,
      user: null,
      isAuthenticated: false,
      login: jest.fn(),
      register: jest.fn(),
      resetPassword: jest.fn(),
      logout: jest.fn(),
      clearError: jest.fn()
    });

    // Mock useSearchParams
    const mockSearchParams = new URLSearchParams('?token=test-token-123');
    jest.mocked(require('react-router-dom').useSearchParams).mockReturnValue([mockSearchParams]);

    // Mock useNavigate
    jest.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);
  });

  const renderEmailVerificationPage = () => {
    return renderWithProviders(<EmailVerificationPage />);
  };

  describe('Verification Token Processing', () => {
    it('should extract token from URL parameters', () => {
      renderEmailVerificationPage();

      expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();
    });

    it('should automatically verify email when token is present', async () => {
      mockVerifyEmail.mockResolvedValueOnce({ success: true });

      renderEmailVerificationPage();

      await waitFor(() => {
        expect(mockVerifyEmail).toHaveBeenCalledWith('test-token-123');
      });
    });

    it('should handle missing token parameter', () => {
      const mockSearchParams = new URLSearchParams('');
      jest.mocked(require('react-router-dom').useSearchParams).mockReturnValue([mockSearchParams]);

      renderEmailVerificationPage();

      expect(screen.getByText(/invalid verification link/i)).toBeInTheDocument();
      expect(screen.getByText(/the verification link is missing or invalid/i)).toBeInTheDocument();
    });

    it('should handle malformed token parameter', () => {
      const mockSearchParams = new URLSearchParams('?token=');
      jest.mocked(require('react-router-dom').useSearchParams).mockReturnValue([mockSearchParams]);

      renderEmailVerificationPage();

      expect(screen.getByText(/invalid verification link/i)).toBeInTheDocument();
    });

    it('should validate token format', async () => {
      const invalidToken = 'invalid-token-format';
      const mockSearchParams = new URLSearchParams(`?token=${invalidToken}`);
      jest.mocked(require('react-router-dom').useSearchParams).mockReturnValue([mockSearchParams]);

      mockVerifyEmail.mockRejectedValueOnce(new Error('Invalid token format'));

      renderEmailVerificationPage();

      await waitFor(() => {
        expect(mockVerifyEmail).toHaveBeenCalledWith(invalidToken);
      });
    });
  });

  describe('Success State Handling', () => {
    it('should display success message when verification succeeds', async () => {
      mockVerifyEmail.mockResolvedValueOnce({ success: true });

      renderEmailVerificationPage();

      await waitFor(() => {
        expect(screen.getByText(/email verified successfully/i)).toBeInTheDocument();
        expect(screen.getByText(/your email has been verified/i)).toBeInTheDocument();
      });
    });

    it('should show success animation', async () => {
      mockVerifyEmail.mockResolvedValueOnce({ success: true });

      renderEmailVerificationPage();

      await waitFor(() => {
        const successIcon = screen.getByTestId('success-icon');
        expect(successIcon).toBeInTheDocument();
        expect(successIcon).toHaveClass('success-animation');
      });
    });

    it('should provide navigation options after success', async () => {
      mockVerifyEmail.mockResolvedValueOnce({ success: true });

      renderEmailVerificationPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /go to login/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
      });
    });

    it('should navigate to login when login button is clicked', async () => {
      mockVerifyEmail.mockResolvedValueOnce({ success: true });

      const { user } = renderEmailVerificationPage();

      await waitFor(() => {
        const loginButton = screen.getByRole('button', { name: /go to login/i });
        expect(loginButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /go to login/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should navigate to dashboard when dashboard button is clicked', async () => {
      mockVerifyEmail.mockResolvedValueOnce({ success: true });

      const { user } = renderEmailVerificationPage();

      await waitFor(() => {
        const dashboardButton = screen.getByRole('button', { name: /go to dashboard/i });
        expect(dashboardButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /go to dashboard/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should play success sound effect', async () => {
      const mockPlaySound = jest.fn();
      jest.mocked(require('../../../../frontend/src/stores/audioStore').useAudioStore).mockReturnValue({
        playSound: mockPlaySound
      });

      mockVerifyEmail.mockResolvedValueOnce({ success: true });

      renderEmailVerificationPage();

      await waitFor(() => {
        expect(mockPlaySound).toHaveBeenCalledWith('success');
      });
    });
  });

  describe('Error State Handling', () => {
    it('should display error message when verification fails', async () => {
      mockVerifyEmail.mockRejectedValueOnce(new Error('Token expired'));

      renderEmailVerificationPage();

      await waitFor(() => {
        expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
        expect(screen.getByText(/token expired/i)).toBeInTheDocument();
      });
    });

    it('should display specific error messages for different error types', async () => {
      const errorCases = [
        { error: 'Token expired', expected: /token has expired/i },
        { error: 'Invalid token', expected: /invalid token/i },
        { error: 'Email already verified', expected: /email already verified/i },
        { error: 'User not found', expected: /user not found/i }
      ];

      for (const { error, expected } of errorCases) {
        mockVerifyEmail.mockRejectedValueOnce(new Error(error));
        
        const { unmount } = renderEmailVerificationPage();

        await waitFor(() => {
          expect(screen.getByText(expected)).toBeInTheDocument();
        });

        unmount();
      }
    });

    it('should show error icon when verification fails', async () => {
      mockVerifyEmail.mockRejectedValueOnce(new Error('Verification failed'));

      renderEmailVerificationPage();

      await waitFor(() => {
        const errorIcon = screen.getByTestId('error-icon');
        expect(errorIcon).toBeInTheDocument();
        expect(errorIcon).toHaveClass('error-animation');
      });
    });

    it('should provide retry options after error', async () => {
      mockVerifyEmail.mockRejectedValueOnce(new Error('Verification failed'));

      renderEmailVerificationPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /go to login/i })).toBeInTheDocument();
      });
    });

    it('should retry verification when try again button is clicked', async () => {
      mockVerifyEmail
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce({ success: true });

      const { user } = renderEmailVerificationPage();

      await waitFor(() => {
        const tryAgainButton = screen.getByRole('button', { name: /try again/i });
        expect(tryAgainButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /try again/i }));

      await waitFor(() => {
        expect(mockVerifyEmail).toHaveBeenCalledTimes(2);
        expect(screen.getByText(/email verified successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Resend Verification Email', () => {
    it('should allow resending verification email', async () => {
      mockVerifyEmail.mockRejectedValueOnce(new Error('Token expired'));

      const { user } = renderEmailVerificationPage();

      await waitFor(() => {
        const resendButton = screen.getByRole('button', { name: /resend verification email/i });
        expect(resendButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      expect(mockResendVerification).toHaveBeenCalled();
    });

    it('should show success message when resend succeeds', async () => {
      mockVerifyEmail.mockRejectedValueOnce(new Error('Token expired'));
      mockResendVerification.mockResolvedValueOnce({ success: true });

      const { user } = renderEmailVerificationPage();

      await waitFor(() => {
        const resendButton = screen.getByRole('button', { name: /resend verification email/i });
        expect(resendButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(screen.getByText(/verification email sent/i)).toBeInTheDocument();
        expect(screen.getByText(/check your email for the new verification link/i)).toBeInTheDocument();
      });
    });

    it('should show error message when resend fails', async () => {
      mockVerifyEmail.mockRejectedValueOnce(new Error('Token expired'));
      mockResendVerification.mockRejectedValueOnce(new Error('Failed to send email'));

      const { user } = renderEmailVerificationPage();

      await waitFor(() => {
        const resendButton = screen.getByRole('button', { name: /resend verification email/i });
        expect(resendButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to send verification email/i)).toBeInTheDocument();
      });
    });

    it('should disable resend button during sending', async () => {
      mockVerifyEmail.mockRejectedValueOnce(new Error('Token expired'));

      const { user } = renderEmailVerificationPage();

      await waitFor(() => {
        const resendButton = screen.getByRole('button', { name: /resend verification email/i });
        expect(resendButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      expect(screen.getByRole('button', { name: /resend verification email/i })).toBeDisabled();
    });

    it('should show cooldown timer for resend', async () => {
      mockVerifyEmail.mockRejectedValueOnce(new Error('Token expired'));
      mockResendVerification.mockResolvedValueOnce({ success: true });

      const { user } = renderEmailVerificationPage();

      await waitFor(() => {
        const resendButton = screen.getByRole('button', { name: /resend verification email/i });
        expect(resendButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(screen.getByText(/resend available in/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during verification', () => {
      mockUseAuthStore.mockReturnValue({
        verifyEmail: mockVerifyEmail,
        resendVerification: mockResendVerification,
        isLoading: true,
        error: null,
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        register: jest.fn(),
        resetPassword: jest.fn(),
        logout: jest.fn(),
        clearError: jest.fn()
      });

      renderEmailVerificationPage();

      expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should show loading state during resend', async () => {
      mockVerifyEmail.mockRejectedValueOnce(new Error('Token expired'));

      renderEmailVerificationPage();

      await waitFor(() => {
        mockUseAuthStore.mockReturnValue({
          verifyEmail: mockVerifyEmail,
          resendVerification: mockResendVerification,
          isLoading: true,
          error: null,
          user: null,
          isAuthenticated: false,
          login: jest.fn(),
          register: jest.fn(),
          resetPassword: jest.fn(),
          logout: jest.fn(),
          clearError: jest.fn()
        });
      });

      expect(screen.getByText(/sending verification email/i)).toBeInTheDocument();
    });

    it('should disable buttons during loading', () => {
      mockUseAuthStore.mockReturnValue({
        verifyEmail: mockVerifyEmail,
        resendVerification: mockResendVerification,
        isLoading: true,
        error: null,
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        register: jest.fn(),
        resetPassword: jest.fn(),
        logout: jest.fn(),
        clearError: jest.fn()
      });

      renderEmailVerificationPage();

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('User Feedback and Navigation', () => {
    it('should provide clear instructions to users', () => {
      renderEmailVerificationPage();

      expect(screen.getByText(/please wait while we verify your email/i)).toBeInTheDocument();
    });

    it('should provide helpful error guidance', async () => {
      mockVerifyEmail.mockRejectedValueOnce(new Error('Token expired'));

      renderEmailVerificationPage();

      await waitFor(() => {
        expect(screen.getByText(/if you're having trouble/i)).toBeInTheDocument();
        expect(screen.getByText(/contact support/i)).toBeInTheDocument();
      });
    });

    it('should provide contact support option', async () => {
      mockVerifyEmail.mockRejectedValueOnce(new Error('Verification failed'));

      renderEmailVerificationPage();

      await waitFor(() => {
        const supportLink = screen.getByRole('link', { name: /contact support/i });
        expect(supportLink).toHaveAttribute('href', 'mailto:support@example.com');
      });
    });

    it('should show helpful tips for common issues', async () => {
      mockVerifyEmail.mockRejectedValueOnce(new Error('Token expired'));

      renderEmailVerificationPage();

      await waitFor(() => {
        expect(screen.getByText(/check your spam folder/i)).toBeInTheDocument();
        expect(screen.getByText(/make sure you're using the latest link/i)).toBeInTheDocument();
      });
    });

    it('should provide alternative verification methods', async () => {
      mockVerifyEmail.mockRejectedValueOnce(new Error('Verification failed'));

      renderEmailVerificationPage();

      await waitFor(() => {
        expect(screen.getByText(/alternative verification methods/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /verify with phone/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderEmailVerificationPage();

      expect(screen.getByLabelText(/email verification status/i)).toBeInTheDocument();
    });

    it('should announce status changes', async () => {
      mockVerifyEmail.mockResolvedValueOnce({ success: true });

      renderEmailVerificationPage();

      await waitFor(() => {
        const statusAnnouncement = screen.getByText(/email verified successfully/i);
        expect(statusAnnouncement).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should be keyboard navigable', () => {
      renderEmailVerificationPage();

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabindex', '0');
      });
    });

    it('should support screen readers', () => {
      renderEmailVerificationPage();

      // Check for proper semantic structure
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should have proper focus management', async () => {
      mockVerifyEmail.mockResolvedValueOnce({ success: true });

      renderEmailVerificationPage();

      await waitFor(() => {
        const loginButton = screen.getByRole('button', { name: /go to login/i });
        expect(loginButton).toHaveFocus();
      });
    });
  });

  describe('Email Verification Service Integration', () => {
    it('should call verification service with correct token', async () => {
      renderEmailVerificationPage();

      await waitFor(() => {
        expect(mockVerifyEmail).toHaveBeenCalledWith('test-token-123');
      });
    });

    it('should handle service response correctly', async () => {
      const mockResponse = { success: true, message: 'Email verified successfully' };
      mockVerifyEmail.mockResolvedValueOnce(mockResponse);

      renderEmailVerificationPage();

      await waitFor(() => {
        expect(screen.getByText('Email verified successfully')).toBeInTheDocument();
      });
    });

    it('should handle service errors gracefully', async () => {
      const mockError = new Error('Service unavailable');
      mockVerifyEmail.mockRejectedValueOnce(mockError);

      renderEmailVerificationPage();

      await waitFor(() => {
        expect(screen.getByText(/service unavailable/i)).toBeInTheDocument();
      });
    });

    it('should retry failed requests', async () => {
      mockVerifyEmail
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true });

      const { user } = renderEmailVerificationPage();

      await waitFor(() => {
        const tryAgainButton = screen.getByRole('button', { name: /try again/i });
        expect(tryAgainButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /try again/i }));

      await waitFor(() => {
        expect(mockVerifyEmail).toHaveBeenCalledTimes(2);
      });
    });
  });
}); 