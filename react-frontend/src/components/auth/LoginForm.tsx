import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from './AuthProvider';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const Title = styled.h2`
  text-align: center;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ErrorMessage = styled.div`
  background: ${({ theme }) => theme.colors.error}20;
  color: ${({ theme }) => theme.colors.error};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.error};
  font-size: 0.9rem;
`;

const LinkText = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.9rem;
  
  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = (location.state as any)?.from?.pathname || '/lobby';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await login({
        username: formData.username.trim(),
        password: formData.password,
      });
      
      onSuccess?.();
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login failed:', err);
      // Error is handled by the auth store
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.username.trim() && formData.password;

  return (
    <FormContainer>
      <Title>Welcome Back!</Title>
      
      <form onSubmit={handleSubmit}>
        <Input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleInputChange}
          required
          autoComplete="username"
          disabled={isLoading || isSubmitting}
        />
        
        <Input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleInputChange}
          required
          autoComplete="current-password"
          disabled={isLoading || isSubmitting}
        />
        
        {error && (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        )}
        
        <Button
          type="submit"
          disabled={!isFormValid || isLoading || isSubmitting}
          loading={isLoading || isSubmitting}
          fullWidth
        >
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>
      
      <LinkText>
        Don't have an account?{' '}
        <a href="/register" onClick={(e) => {
          e.preventDefault();
          navigate('/register');
        }}>
          Create one here
        </a>
      </LinkText>
    </FormContainer>
  );
} 