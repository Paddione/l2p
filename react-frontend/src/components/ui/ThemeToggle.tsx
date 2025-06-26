import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: ${props => props.theme.borderRadius.md};
  transition: ${props => props.theme.transitions.fast};
  background: ${props => props.theme.colors.background.secondary};
  
  &:hover {
    background: ${props => props.theme.colors.background.paper};
    transform: translateY(-1px);
  }
`;

const ToggleSwitch = styled.div<{ $isDark: boolean }>`
  position: relative;
  width: 50px;
  height: 24px;
  border-radius: 12px;
  background: ${props => props.$isDark ? props.theme.colors.primary : props.theme.colors.secondary};
  transition: ${props => props.theme.transitions.normal};
  cursor: pointer;
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.$isDark ? '26px' : '2px'};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    transition: ${props => props.theme.transitions.normal};
    box-shadow: ${props => props.theme.shadows.sm};
  }
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 1.2rem;
  user-select: none;
`;

const Label = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
  user-select: none;
`;

export const ThemeToggle: React.FC = () => {
  const { themeMode, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = themeMode === 'dark';

  return (
    <ToggleContainer 
      onClick={toggleTheme} 
      title={t('theme.switchTo', { mode: isDark ? t('theme.light') : t('theme.dark') })}
    >
      <IconContainer>
        {isDark ? '🌙' : '☀️'}
      </IconContainer>
      <ToggleSwitch $isDark={isDark} />
      <Label>{isDark ? t('theme.dark') : t('theme.light')}</Label>
    </ToggleContainer>
  );
}; 