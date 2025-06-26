import React from 'react';
import styled from 'styled-components';
import { useLanguage } from '../../contexts/LanguageContext';

const ToggleContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.background.secondary};
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: ${props => props.theme.transitions.fast};
  
  &:hover {
    background: ${props => props.theme.colors.background.paper};
    transform: translateY(-1px);
  }
`;

const FlagIcon = styled.span`
  font-size: 1.2rem;
  user-select: none;
`;

const LanguageText = styled.span`
  user-select: none;
  min-width: 60px;
  text-align: left;
`;

const Dropdown = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.25rem;
  background: ${props => props.theme.colors.background.paper};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.lg};
  z-index: 1000;
  min-width: 140px;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.$isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  transition: ${props => props.theme.transitions.fast};
`;

const DropdownItem = styled.button<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  border: none;
  background: ${props => props.$isSelected 
    ? props.theme.colors.primary + '20' 
    : 'transparent'};
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  font-size: 0.875rem;
  transition: ${props => props.theme.transitions.fast};
  
  &:first-child {
    border-top-left-radius: ${props => props.theme.borderRadius.md};
    border-top-right-radius: ${props => props.theme.borderRadius.md};
  }
  
  &:last-child {
    border-bottom-left-radius: ${props => props.theme.borderRadius.md};
    border-bottom-right-radius: ${props => props.theme.borderRadius.md};
  }
  
  &:hover {
    background: ${props => props.theme.colors.primary + '30'};
  }
`;

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage, availableLanguages, t } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);

  const currentLanguage = availableLanguages.find(lang => lang.code === language);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!event.target || !(event.target as Element).closest('[data-language-toggle]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode as 'en' | 'de');
    setIsOpen(false);
  };

  return (
    <ToggleContainer data-language-toggle>
      <ToggleButton
        onClick={() => setIsOpen(!isOpen)}
        title={t('language.switchLanguage')}
      >
        <FlagIcon>{currentLanguage?.flag}</FlagIcon>
        <LanguageText>{currentLanguage?.name}</LanguageText>
        <span style={{ fontSize: '0.7rem' }}>▼</span>
      </ToggleButton>

      <Dropdown $isOpen={isOpen}>
        {availableLanguages.map((lang) => (
          <DropdownItem
            key={lang.code}
            $isSelected={lang.code === language}
            onClick={() => handleLanguageChange(lang.code)}
          >
            <FlagIcon>{lang.flag}</FlagIcon>
            <span>{lang.name}</span>
          </DropdownItem>
        ))}
      </Dropdown>
    </ToggleContainer>
  );
}; 