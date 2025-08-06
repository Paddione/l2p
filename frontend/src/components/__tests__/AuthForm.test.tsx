import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
// Jest globals: describe, it, expect, beforeEach are automatically available
import { AuthForm } from '../AuthForm';
import { useAuthStore } from '../../stores/authStore';

// Mock services that use import.meta

// Mock services that use import.meta

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

// Mock the audio store
jest.mock('../../stores/audioStore', () => ({
  useAudioStore: jest.fn(() => ({
    playSound: jest.fn()
  }))
}));

// Mock the theme store
jest.mock('../../stores/themeStore', () => ({
  useThemeStore: jest.fn(() => ({
    theme: 'dark'
  }))
}));

// Mock the settings store
jest.mock('../../stores/settingsStore', () => ({
  useSettingsStore: jest.fn(() => ({
    language: 'en'
  }))
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('AuthForm Component', () => {
  const mockLogin = jest.fn();
  const mockRegister = jest.fn();
  const mockResetPassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      register: mockRegister,
      resetPassword: mockResetPassword,
      isLoading: false,
      error: null,
      user: null,
      isAuthenticated: false,
      logout: jest.fn(),
      clearError: jest.fn()
    });
  });

  const renderAuthForm = (mode: 'login' | 'register' | 'reset' = 'login') => {
    const mockOnAuthSuccess = jest.fn();
    const mockOnShowPasswordReset = jest.fn();
    
    return render(
      <BrowserRouter>
        <AuthForm 
          onAuthSuccess={mockOnAuthSuccess}
          onShowPasswordReset={mockOnShowPasswordReset}
        />
      </BrowserRouter>
    );
  };

  describe('Form Validation', () => {
    it('should validate required fields in login mode', async () => {
      renderAuthForm('login');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should validate required fields in register mode', async () => {
      renderAuthForm('register');

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
        expect(screen.getByText(/confirm password is required/i)).toBeInTheDocument();
      });
    });

    it('should validate email format in register mode', async () => {
      renderAuthForm('register');

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('should validate password strength in register mode', async () => {
      renderAuthForm('register');

      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: 'weak' } });

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate password confirmation in register mode', async () => {
      renderAuthForm('register');

      const passwordInput = screen.getByLabelText(/password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPass123!' } });

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should validate email format in reset mode', async () => {
      renderAuthForm('reset');

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Input Handling', () => {
    it('should handle username input in login mode', () => {
      renderAuthForm('login');

      const usernameInput = screen.getByLabelText(/username/i);
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });

      expect(usernameInput).toHaveValue('testuser');
    });

    it('should handle password input in login mode', () => {
      renderAuthForm('login');

      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: 'testpass123' } });

      expect(passwordInput).toHaveValue('testpass123');
    });

    it('should handle all inputs in register mode', () => {
      renderAuthForm('register');

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPass123!' } });

      expect(usernameInput).toHaveValue('testuser');
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('StrongPass123!');
      expect(confirmPasswordInput).toHaveValue('StrongPass123!');
    });

    it('should handle email input in reset mode', () => {
      renderAuthForm('reset');

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(emailInput).toHaveValue('test@example.com');
    });
  });

  describe('Form Submission', () => {
    it('should submit login form with valid data', async () => {
      mockLogin.mockResolvedValueOnce({ success: true });
      renderAuthForm('login');

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'testpass123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'testpass123'
        });
      });
    });

    it('should submit register form with valid data', async () => {
      mockRegister.mockResolvedValueOnce({ success: true });
      renderAuthForm('register');

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          username: 'testuser',
          email: 'test@example.com',
          password: 'StrongPass123!'
        });
      });
    });

    it('should submit reset password form with valid data', async () => {
      mockResetPassword.mockResolvedValueOnce({ success: true });
      renderAuthForm('reset');

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith({
          email: 'test@example.com'
        });
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during login submission', () => {
      mockUseAuthStore.mockReturnValue({
        login: mockLogin,
        register: mockRegister,
        resetPassword: mockResetPassword,
        isLoading: true,
        error: null,
        user: null,
        isAuthenticated: false,
        logout: jest.fn(),
        clearError: jest.fn()
      });

      renderAuthForm('login');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should show loading state during register submission', () => {
      mockUseAuthStore.mockReturnValue({
        login: mockLogin,
        register: mockRegister,
        resetPassword: mockResetPassword,
        isLoading: true,
        error: null,
        user: null,
        isAuthenticated: false,
        logout: jest.fn(),
        clearError: jest.fn()
      });

      renderAuthForm('register');

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should show loading state during reset password submission', () => {
      mockUseAuthStore.mockReturnValue({
        login: mockLogin,
        register: mockRegister,
        resetPassword: mockResetPassword,
        isLoading: true,
        error: null,
        user: null,
        isAuthenticated: false,
        logout: jest.fn(),
        clearError: jest.fn()
      });

      renderAuthForm('reset');

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display login error message', () => {
      mockUseAuthStore.mockReturnValue({
        login: mockLogin,
        register: mockRegister,
        resetPassword: mockResetPassword,
        isLoading: false,
        error: 'Invalid username or password',
        user: null,
        isAuthenticated: false,
        logout: jest.fn(),
        clearError: jest.fn()
      });

      renderAuthForm('login');

      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
    });

    it('should display register error message', () => {
      mockUseAuthStore.mockReturnValue({
        login: mockLogin,
        register: mockRegister,
        resetPassword: mockResetPassword,
        isLoading: false,
        error: 'Username already exists',
        user: null,
        isAuthenticated: false,
        logout: jest.fn(),
        clearError: jest.fn()
      });

      renderAuthForm('register');

      expect(screen.getByText(/username already exists/i)).toBeInTheDocument();
    });

    it('should display reset password error message', () => {
      mockUseAuthStore.mockReturnValue({
        login: mockLogin,
        register: mockRegister,
        resetPassword: mockResetPassword,
        isLoading: false,
        error: 'Email not found',
        user: null,
        isAuthenticated: false,
        logout: jest.fn(),
        clearError: jest.fn()
      });

      renderAuthForm('reset');

      expect(screen.getByText(/email not found/i)).toBeInTheDocument();
    });

    it('should clear error when user starts typing', async () => {
      const mockClearError = jest.fn();
      mockUseAuthStore.mockReturnValue({
        login: mockLogin,
        register: mockRegister,
        resetPassword: mockResetPassword,
        isLoading: false,
        error: 'Invalid credentials',
        user: null,
        isAuthenticated: false,
        logout: jest.fn(),
        clearError: mockClearError
      });

      renderAuthForm('login');

      const usernameInput = screen.getByLabelText(/username/i);
      fireEvent.change(usernameInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalled();
      });
    });
  });

  describe('Success Feedback', () => {
    it('should show success message after successful login', async () => {
      mockLogin.mockResolvedValueOnce({ success: true });
      renderAuthForm('login');

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'testpass123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    it('should show success message after successful registration', async () => {
      mockRegister.mockResolvedValueOnce({ success: true });
      renderAuthForm('register');

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });
    });

    it('should show success message after successful password reset', async () => {
      mockResetPassword.mockResolvedValueOnce({ success: true });
      renderAuthForm('reset');

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalled();
      });
    });
  });

  describe('Form Mode Switching', () => {
    it('should render login form by default', () => {
      renderAuthForm('login');

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });

    it('should render register form correctly', () => {
      renderAuthForm('register');

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    });

    it('should render reset password form correctly', () => {
      renderAuthForm('reset');

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
      expect(screen.getByText(/back to login/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderAuthForm('login');

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should have proper form labels in register mode', () => {
      renderAuthForm('register');

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('should have proper form labels in reset mode', () => {
      renderAuthForm('reset');

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      renderAuthForm('login');

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should handle keyboard navigation', () => {
      renderAuthForm('login');

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);

      usernameInput.focus();
      expect(usernameInput).toHaveFocus();

      fireEvent.keyDown(usernameInput, { key: 'Tab' });
      expect(passwordInput).toHaveFocus();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility in login mode', () => {
      renderAuthForm('login');

      const passwordInput = screen.getByLabelText(/password/i);
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });

      expect(passwordInput).toHaveAttribute('type', 'password');

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should toggle password visibility in register mode', () => {
      renderAuthForm('register');

      const passwordInput = screen.getByLabelText(/password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const toggleButtons = screen.getAllByRole('button', { name: /toggle password visibility/i });

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      fireEvent.click(toggleButtons[0]);
      expect(passwordInput).toHaveAttribute('type', 'text');

      fireEvent.click(toggleButtons[1]);
      expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    });
  });
}); 