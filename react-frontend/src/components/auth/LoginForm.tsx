import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuthStore } from '../../stores/authStore';
import { Button, Input } from '../ui';
import type { LoginFormData } from '../../types/game';

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
`;

const ErrorMessage = styled.div`
  background: ${({ theme }) => theme.colors.error}10;
  color: ${({ theme }) => theme.colors.error};
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  border-left: 4px solid ${({ theme }) => theme.colors.error};
`;

const LinkButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.875rem;
  text-align: center;
  padding: 0.5rem 0;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary}dd;
  }
`;

interface LoginFormProps {
  onSwitchToRegister?: () => void;
  onSuccess?: () => void;
}

const validateUsername = (username: string): string | null => {
  if (!username.trim()) {
    return 'Username is required';
  }
  if (username.length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (username.length > 20) {
    return 'Username must be less than 20 characters';
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return 'Username can only contain letters, numbers, hyphens, and underscores';
  }
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onSuccess,
}) => {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState<LoginFormData>({
    username: { value: '', error: null, touched: false, valid: false },
    password: { value: '', error: null, touched: false, valid: false },
  });

  const handleInputChange = (field: keyof LoginFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    let error: string | null = null;
    
    if (field === 'username') {
      error = validateUsername(value);
    } else if (field === 'password') {
      error = validatePassword(value);
    }

    setFormData(prev => ({
      ...prev,
      [field]: {
        value,
        error,
        touched: true,
        valid: !error,
      },
    }));

    // Clear global error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleInputBlur = (field: keyof LoginFormData) => () => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        touched: true,
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate all fields
    const usernameError = validateUsername(formData.username.value);
    const passwordError = validatePassword(formData.password.value);
    
    const updatedFormData = {
      username: {
        ...formData.username,
        error: usernameError,
        touched: true,
        valid: !usernameError,
      },
      password: {
        ...formData.password,
        error: passwordError,
        touched: true,
        valid: !passwordError,
      },
    };
    
    setFormData(updatedFormData);
    
    if (usernameError || passwordError) {
      return;
    }

    try {
      await login({
        username: formData.username.value,
        password: formData.password.value,
      });
      onSuccess?.();
    } catch (error) {
      // Error is handled by the store
      console.error('Login failed:', error);
    }
  };

  const isFormValid = formData.username.valid && formData.password.valid;

  return (
    <FormContainer onSubmit={handleSubmit}>
      <Title>Welcome Back</Title>
      
      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}
      
      <Input
        type="text"
        label="Username"
        placeholder="Enter your username"
        value={formData.username.value}
        onChange={handleInputChange('username')}
        onBlur={handleInputBlur('username')}
        error={formData.username.touched ? (formData.username.error || false) : false}
        required
        autoComplete="username"
        disabled={isLoading}
        fullWidth
      />
      
      <Input
        type="password"
        label="Password"
        placeholder="Enter your password"
        value={formData.password.value}
        onChange={handleInputChange('password')}
        onBlur={handleInputBlur('password')}
        error={formData.password.touched ? (formData.password.error || false) : false}
        required
        autoComplete="current-password"
        disabled={isLoading}
        fullWidth
      />
      
      <Button
        type="submit"
        loading={isLoading}
        disabled={!isFormValid}
        fullWidth
        size="large"
      >
        Sign In
      </Button>
      
      {onSwitchToRegister && (
        <LinkButton
          type="button"
          onClick={onSwitchToRegister}
          disabled={isLoading}
        >
          Don't have an account? Sign up
        </LinkButton>
      )}
    </FormContainer>
  );
};

export default LoginForm; 