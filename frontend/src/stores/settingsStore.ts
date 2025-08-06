import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'
export type Language = 'en' | 'de'

export interface SettingsState {
  // Theme settings
  theme: Theme
  
  // Language settings
  language: Language
  
  // UI settings
  autoScroll: boolean
  showAnimations: boolean
  
  // Actions
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
  setAutoScroll: (enabled: boolean) => void
  setShowAnimations: (enabled: boolean) => void
  toggleTheme: () => void
  toggleLanguage: () => void
}

const initialState = {
  theme: 'light' as Theme,
  language: 'en' as Language,
  autoScroll: true,
  showAnimations: true,
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        
        setTheme: (theme) => set({ theme }),
        setLanguage: (language) => set({ language }),
        setAutoScroll: (enabled) => set({ autoScroll: enabled }),
        setShowAnimations: (enabled) => set({ showAnimations: enabled }),
        toggleTheme: () => set((state) => ({ 
          theme: state.theme === 'light' ? 'dark' : 'light' 
        })),
        toggleLanguage: () => set((state) => ({ 
          language: state.language === 'en' ? 'de' : 'en' 
        })),
      }),
      {
        name: 'settings-storage',
        partialize: (state) => ({
          theme: state.theme,
          language: state.language,
          autoScroll: state.autoScroll,
          showAnimations: state.showAnimations,
        }),
      }
    ),
    {
      name: 'settings-store',
    }
  )
) 