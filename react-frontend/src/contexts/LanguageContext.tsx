import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { en } from '../locales/en';
import { de } from '../locales/de';

type Language = 'en' | 'de';
type TranslationKey = keyof typeof en;

const translations = {
  en,
  de,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
  availableLanguages: { code: Language; name: string; flag: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Helper function to get nested translation
const getNestedTranslation = (obj: any, path: string): string => {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; // Return the key if translation is not found
    }
  }
  
  return typeof result === 'string' ? result : path;
};

// Simple template replacement function
const interpolate = (text: string, params: Record<string, string> = {}): string => {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key] || match;
  });
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Check for saved language preference or default to English
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('l2p-language');
    const browserLanguage = navigator.language.split('-')[0];
    
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'de')) {
      return savedLanguage as Language;
    }
    
    // Use browser language if supported, otherwise default to English
    return (browserLanguage === 'de') ? 'de' : 'en';
  });

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('l2p-language', language);
    // Update document language attribute for accessibility
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  // Translation function
  const t = (key: string, params?: Record<string, string>): string => {
    const translation = getNestedTranslation(translations[language], key);
    return params ? interpolate(translation, params) : translation;
  };

  const availableLanguages = [
    { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
    { code: 'de' as Language, name: 'Deutsch', flag: '🇩🇪' },
  ];

  const contextValue = {
    language,
    setLanguage,
    t,
    availableLanguages,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}; 