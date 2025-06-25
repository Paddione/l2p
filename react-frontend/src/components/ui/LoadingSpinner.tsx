import React from 'react';
import styled, { keyframes } from 'styled-components';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'white';
  fullPage?: boolean;
  className?: string;
  testId?: string;
}

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const SpinnerContainer = styled.div<{ fullPage?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  
  ${({ fullPage }) => fullPage && `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    z-index: 999;
  `}
`;

const Spinner = styled.div<{ 
  size: LoadingSpinnerProps['size']; 
  variant: LoadingSpinnerProps['variant'] 
}>`
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  
  ${({ size }) => {
    switch (size) {
      case 'small':
        return `
          width: 1rem;
          height: 1rem;
          border-width: 2px;
        `;
      case 'large':
        return `
          width: 3rem;
          height: 3rem;
          border-width: 4px;
        `;
      default:
        return `
          width: 1.5rem;
          height: 1.5rem;
          border-width: 3px;
        `;
    }
  }}
  
  ${({ variant, theme }) => {
    switch (variant) {
      case 'secondary':
        return `
          border: 3px solid ${theme.colors.secondary}20;
          border-top-color: ${theme.colors.secondary};
        `;
      case 'white':
        return `
          border: 3px solid rgba(255, 255, 255, 0.2);
          border-top-color: white;
        `;
      default:
        return `
          border: 3px solid ${theme.colors.primary}20;
          border-top-color: ${theme.colors.primary};
        `;
    }
  }}
`;

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  variant = 'primary',
  fullPage = false,
  className,
  testId,
}) => {
  return (
    <SpinnerContainer 
      fullPage={fullPage} 
      className={className}
      data-testid={testId}
    >
      <Spinner size={size} variant={variant} />
    </SpinnerContainer>
  );
};

export default LoadingSpinner; 