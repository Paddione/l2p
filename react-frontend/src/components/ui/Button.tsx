import React, { forwardRef } from 'react';
import styled, { css } from 'styled-components';
import { LoadingSpinner } from './LoadingSpinner';
import { useAudio } from '../../hooks/useAudio';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  className?: string;
  testId?: string;
  enableSound?: boolean;
}

const ButtonBase = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
  
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  ${({ fullWidth }) => fullWidth && css`
    width: 100%;
  `}
  
  /* Size variants */
  ${({ size }) => {
    switch (size) {
      case 'small':
        return css`
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          min-height: 2rem;
        `;
      case 'large':
        return css`
          padding: 0.875rem 1.5rem;
          font-size: 1.125rem;
          min-height: 3rem;
        `;
      default:
        return css`
          padding: 0.75rem 1.25rem;
          font-size: 1rem;
          min-height: 2.5rem;
        `;
    }
  }}
  
  /* Variant styles */
  ${({ variant, theme }) => {
    switch (variant) {
      case 'secondary':
        return css`
          background: ${theme.colors.secondary};
          color: ${theme.colors.text.primary};
          
          &:hover:not(:disabled) {
            background: ${theme.colors.secondary}dd;
          }
        `;
      case 'outline':
        return css`
          background: transparent;
          color: ${theme.colors.primary};
          border: 2px solid ${theme.colors.primary};
          
          &:hover:not(:disabled) {
            background: ${theme.colors.primary};
            color: white;
          }
        `;
      case 'ghost':
        return css`
          background: transparent;
          color: ${theme.colors.text.primary};
          
          &:hover:not(:disabled) {
            background: ${theme.colors.background.secondary};
          }
        `;
      case 'danger':
        return css`
          background: ${theme.colors.error};
          color: white;
          
          &:hover:not(:disabled) {
            background: ${theme.colors.error}dd;
          }
        `;
      default:
        return css`
          background: ${theme.colors.primary};
          color: white;
          
          &:hover:not(:disabled) {
            background: ${theme.colors.primary}dd;
          }
        `;
    }
  }}
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    fullWidth = false,
    enableSound = true,
    onClick,
    type = 'button',
    children,
    className,
    testId,
    ...props
  }, ref) => {
    const { playButtonClick } = useAudio();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;
      if (enableSound && !disabled && !loading) {
        playButtonClick();
      }
      onClick?.(event);
    };

    return (
      <ButtonBase
        ref={ref}
        variant={variant}
        size={size}
        disabled={disabled || loading}
        fullWidth={fullWidth}
        onClick={handleClick}
        type={type}
        className={className}
        data-testid={testId}
        {...props}
      >
        {loading ? (
          <LoadingContainer>
            <LoadingSpinner />
            {children}
          </LoadingContainer>
        ) : (
          children
        )}
      </ButtonBase>
    );
  }
);

Button.displayName = 'Button';

export default Button; 