import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuthStore } from '../../stores/authStore';
import { Button, Input } from '../ui';
import type { RegisterFormData } from '../../types/game';

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

const CharacterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const CharacterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CharacterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
`;

const CharacterOption = styled.button<{ selected?: boolean }>`
  aspect-ratio: 1;
  border: 2px solid ${({ theme, selected }) => 
    selected ? theme.colors.primary : theme.colors.border};
  border-radius: 8px;
  background: ${({ theme, selected }) => 
    selected ? `${theme.colors.primary}10` : theme.colors.background.secondary};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => `${theme.colors.primary}10`};
  }
  
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const CharacterError = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
}

const CHARACTERS = ['👨', '👩', '🧑', '👦', '👧', '🧓', '👴', '👵'];

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

const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
};

const validateCharacter = (character: string): string | null => {
  if (!character) {
    return 'Please select a character';
  }
  return null;
};

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onSuccess,
}) => {
  const { register, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState<RegisterFormData>({
    username: { value: '', error: null, touched: false, valid: false },
    password: { value: '', error: null, touched: false, valid: false },
    confirmPassword: { value: '', error: null, touched: false, valid: false },
    character: { value: '', error: null, touched: false, valid: false },
  });

  const handleInputChange = (field: keyof Omit<RegisterFormData, 'character'>) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    let error: string | null = null;
    
    switch (field) {
      case 'username':
        error = validateUsername(value);
        break;
      case 'password':
        error = validatePassword(value);
        // Also revalidate confirm password if it's been touched
        if (formData.confirmPassword.touched) {
          const confirmError = validateConfirmPassword(value, formData.confirmPassword.value);
          setFormData(prev => ({
            ...prev,
            confirmPassword: {
              ...prev.confirmPassword,
              error: confirmError,
              valid: !confirmError,
            },
          }));
        }
        break;
      case 'confirmPassword':
        error = validateConfirmPassword(formData.password.value, value);
        break;
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

  const handleCharacterSelect = (character: string) => {
    const error = validateCharacter(character);
    
    setFormData(prev => ({
      ...prev,
      character: {
        value: character,
        error,
        touched: true,
        valid: !error,
      },
    }));

    clearError();
  };

  const handleInputBlur = (field: keyof RegisterFormData) => () => {
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
    const confirmPasswordError = validateConfirmPassword(
      formData.password.value, 
      formData.confirmPassword.value
    );
    const characterError = validateCharacter(formData.character.value);
    
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
      confirmPassword: {
        ...formData.confirmPassword,
        error: confirmPasswordError,
        touched: true,
        valid: !confirmPasswordError,
      },
      character: {
        ...formData.character,
        error: characterError,
        touched: true,
        valid: !characterError,
      },
    };
    
    setFormData(updatedFormData);
    
    if (usernameError || passwordError || confirmPasswordError || characterError) {
      return;
    }

    try {
      await register({
        username: formData.username.value,
        password: formData.password.value,
        character: formData.character.value,
      });
      onSuccess?.();
    } catch (error) {
      // Error is handled by the store
      console.error('Registration failed:', error);
    }
  };

  const isFormValid = 
    formData.username.valid && 
    formData.password.valid && 
    formData.confirmPassword.valid && 
    formData.character.valid;

  return (
    <FormContainer onSubmit={handleSubmit}>
      <Title>Create Account</Title>
      
      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}
      
      <Input
        type="text"
        label="Username"
        placeholder="Choose a username"
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
        placeholder="Create a password"
        value={formData.password.value}
        onChange={handleInputChange('password')}
        onBlur={handleInputBlur('password')}
        error={formData.password.touched ? (formData.password.error || false) : false}
        required
        autoComplete="new-password"
        disabled={isLoading}
        fullWidth
      />
      
      <Input
        type="password"
        label="Confirm Password"
        placeholder="Confirm your password"
        value={formData.confirmPassword.value}
        onChange={handleInputChange('confirmPassword')}
        onBlur={handleInputBlur('confirmPassword')}
        error={formData.confirmPassword.touched ? (formData.confirmPassword.error || false) : false}
        required
        autoComplete="new-password"
        disabled={isLoading}
        fullWidth
      />
      
      <CharacterSection>
        <CharacterLabel>
          Choose your character *
        </CharacterLabel>
        <CharacterGrid>
          {CHARACTERS.map((char) => (
            <CharacterOption
              key={char}
              type="button"
              selected={formData.character.value === char}
              onClick={() => handleCharacterSelect(char)}
              disabled={isLoading}
            >
              {char}
            </CharacterOption>
          ))}
        </CharacterGrid>
        {formData.character.touched && formData.character.error && (
          <CharacterError>
            {formData.character.error}
          </CharacterError>
        )}
      </CharacterSection>
      
      <Button
        type="submit"
        loading={isLoading}
        disabled={!isFormValid}
        fullWidth
        size="large"
      >
        Create Account
      </Button>
      
      {onSwitchToLogin && (
        <LinkButton
          type="button"
          onClick={onSwitchToLogin}
          disabled={isLoading}
        >
          Already have an account? Sign in
        </LinkButton>
      )}
    </FormContainer>
  );
};

export default RegisterForm; 