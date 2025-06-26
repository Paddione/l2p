import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const CharacterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};
  margin: ${({ theme }) => theme.spacing.sm} 0;
`;

const CharacterButton = styled.button<{ selected: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm};
  border: 2px solid ${({ theme, selected }) => 
    selected ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme, selected }) => 
    selected ? theme.colors.primary + '20' : theme.colors.surface};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  font-size: 1.5rem;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const FieldLabel = styled.label`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
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

const characters = ['🐱', '🐶', '🐺', '🦊', '🐻', '🐨', '🐯', '🦁'];

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    character: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 20) {
      errors.username = 'Username must be less than 20 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, hyphens, and underscores';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    // Character validation
    if (!formData.character) {
      errors.character = 'Please select a character';
    }
    
    return errors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation errors for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Clear API error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleCharacterSelect = (character: string) => {
    setFormData(prev => ({ ...prev, character }));
    
    // Clear character validation error
    if (validationErrors.character) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.character;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      await register({
        username: formData.username.trim(),
        password: formData.password,
        character: formData.character,
      });
      
      onSuccess?.();
      navigate('/lobby');
    } catch (err) {
      console.error('Registration failed:', err);
      // Error is handled by the auth store
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = Object.keys(validateForm()).length === 0;

  return (
    <FormContainer>
      <Title>Join Learn2Play!</Title>
      
      <form onSubmit={handleSubmit}>
        <div>
          <FieldLabel>Username</FieldLabel>
          <Input
            type="text"
            name="username"
            placeholder="Choose a username"
            value={formData.username}
            onChange={handleInputChange}
            required
            autoComplete="username"
            disabled={isLoading || isSubmitting}
            error={validationErrors.username}
          />
        </div>
        
        <div>
          <FieldLabel>Password</FieldLabel>
          <Input
            type="password"
            name="password"
            placeholder="Choose a password"
            value={formData.password}
            onChange={handleInputChange}
            required
            autoComplete="new-password"
            disabled={isLoading || isSubmitting}
            error={validationErrors.password}
          />
        </div>
        
        <div>
          <FieldLabel>Confirm Password</FieldLabel>
          <Input
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
            autoComplete="new-password"
            disabled={isLoading || isSubmitting}
            error={validationErrors.confirmPassword}
          />
        </div>
        
        <div>
          <FieldLabel>Choose Your Character</FieldLabel>
          <CharacterGrid>
            {characters.map((char) => (
              <CharacterButton
                key={char}
                type="button"
                selected={formData.character === char}
                onClick={() => handleCharacterSelect(char)}
                disabled={isLoading || isSubmitting}
              >
                {char}
              </CharacterButton>
            ))}
          </CharacterGrid>
          {validationErrors.character && (
            <ErrorMessage>{validationErrors.character}</ErrorMessage>
          )}
        </div>
        
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
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
      
      <LinkText>
        Already have an account?{' '}
        <a href="/login" onClick={(e) => {
          e.preventDefault();
          navigate('/login');
        }}>
          Sign in here
        </a>
      </LinkText>
    </FormContainer>
  );
} 