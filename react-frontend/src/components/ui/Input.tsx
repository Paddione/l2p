import React, { forwardRef } from 'react';
import styled, { css } from 'styled-components';

interface InputProps {
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string | boolean;
  label?: string;
  helperText?: string;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  name?: string;
  id?: string;
  className?: string;
  testId?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  min?: string | number;
  max?: string | number;
}

const InputContainer = styled.div<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  ${({ fullWidth }) => fullWidth && css`width: 100%;`}
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 0.25rem;
`;

const InputWrapper = styled.div<{ 
  hasError?: boolean; 
  disabled?: boolean; 
  size?: 'small' | 'medium' | 'large';
  hasStartIcon?: boolean;
  hasEndIcon?: boolean;
}>`
  position: relative;
  display: flex;
  align-items: center;
  border: 2px solid ${({ theme, hasError }) => 
    hasError ? theme.colors.error : theme.colors.border};
  border-radius: 8px;
  background: ${({ theme, disabled }) => 
    disabled ? theme.colors.background.secondary : theme.colors.background.paper};
  transition: all 0.2s ease-in-out;
  
  &:focus-within {
    border-color: ${({ theme, hasError }) => 
      hasError ? theme.colors.error : theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme, hasError }) => 
      hasError ? `${theme.colors.error}20` : `${theme.colors.primary}20`};
  }
  
  ${({ size }) => {
    switch (size) {
      case 'small':
        return css`
          min-height: 2rem;
          padding: 0.25rem 0.5rem;
        `;
      case 'large':
        return css`
          min-height: 3rem;
          padding: 0.75rem 1rem;
        `;
      default:
        return css`
          min-height: 2.5rem;
          padding: 0.5rem 0.75rem;
        `;
    }
  }}
  
  ${({ hasStartIcon }) => hasStartIcon && css`
    padding-left: 2.5rem;
  `}
  
  ${({ hasEndIcon }) => hasEndIcon && css`
    padding-right: 2.5rem;
  `}
`;

const StyledInput = styled.input`
  border: none;
  outline: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1rem;
  width: 100%;
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.secondary};
  }
  
  &:disabled {
    cursor: not-allowed;
    color: ${({ theme }) => theme.colors.text.disabled};
  }
`;

const IconContainer = styled.div<{ position: 'start' | 'end' }>`
  position: absolute;
  ${({ position }) => position === 'start' ? 'left: 0.75rem;' : 'right: 0.75rem;'}
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  pointer-events: none;
`;

const HelperText = styled.div<{ isError?: boolean }>`
  font-size: 0.75rem;
  color: ${({ theme, isError }) => 
    isError ? theme.colors.error : theme.colors.text.secondary};
  margin-top: 0.25rem;
`;

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  type = 'text',
  placeholder,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  required = false,
  error,
  label,
  helperText,
  size = 'medium',
  fullWidth = false,
  startIcon,
  endIcon,
  name,
  id,
  className,
  testId,
  autoComplete,
  autoFocus,
  maxLength,
  minLength,
  pattern,
  min,
  max,
  ...props
}, ref) => {
  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : '';
  const displayHelperText = errorMessage || helperText;
  
  return (
    <InputContainer fullWidth={fullWidth} className={className}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span style={{ color: 'red', marginLeft: '0.25rem' }}>*</span>}
        </Label>
      )}
      
      <InputWrapper
        hasError={hasError}
        disabled={disabled}
        size={size}
        hasStartIcon={Boolean(startIcon)}
        hasEndIcon={Boolean(endIcon)}
      >
        {startIcon && (
          <IconContainer position="start">
            {startIcon}
          </IconContainer>
        )}
        
        <StyledInput
          ref={ref}
          type={type}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          name={name}
          id={id}
          data-testid={testId}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          min={min}
          max={max}
          {...props}
        />
        
        {endIcon && (
          <IconContainer position="end">
            {endIcon}
          </IconContainer>
        )}
      </InputWrapper>
      
      {displayHelperText && (
        <HelperText isError={hasError}>
          {displayHelperText}
        </HelperText>
      )}
    </InputContainer>
  );
});

Input.displayName = 'Input';

export default Input; 