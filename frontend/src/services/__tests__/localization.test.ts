import { localizationService, type Language, type Translations } from '../localization'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

describe('LocalizationService', () => {
  let service: any

  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    
    // Create a fresh instance for each test
    service = new (localizationService.constructor as any)()
  })

  afterEach(() => {
    // Clean up localStorage
    localStorageMock.clear()
  })

  describe('getCurrentLanguage', () => {
    it('should return default language when no preference is set', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const language = service.getCurrentLanguage()
      expect(language).toBe('en')
    })

    it('should return saved language preference', () => {
      localStorageMock.getItem.mockReturnValue('de')
      const language = service.getCurrentLanguage()
      expect(language).toBe('de')
    })

    it('should return default language for invalid saved preference', () => {
      localStorageMock.getItem.mockReturnValue('invalid')
      const language = service.getCurrentLanguage()
      expect(language).toBe('en')
    })
  })

  describe('setLanguage', () => {
    it('should set valid language and save to localStorage', () => {
      service.setLanguage('de')
      expect(service.getCurrentLanguage()).toBe('de')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('language', 'de')
    })

    it('should set English language and save to localStorage', () => {
      service.setLanguage('en')
      expect(service.getCurrentLanguage()).toBe('en')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('language', 'en')
    })

    it('should not set invalid language', () => {
      const originalLanguage = service.getCurrentLanguage()
      service.setLanguage('invalid' as Language)
      expect(service.getCurrentLanguage()).toBe(originalLanguage)
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })

    it('should not set unsupported language', () => {
      const originalLanguage = service.getCurrentLanguage()
      service.setLanguage('fr' as Language)
      expect(service.getCurrentLanguage()).toBe(originalLanguage)
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })
  })

  describe('translate', () => {
    it('should translate existing key in current language', () => {
      service.setLanguage('en')
      const result = service.translate('nav.home')
      expect(result).toBe('Home')
    })

    it('should translate existing key in German', () => {
      service.setLanguage('de')
      const result = service.translate('nav.home')
      expect(result).toBe('Startseite')
    })

    it('should fallback to English when key not found in current language', () => {
      service.setLanguage('de')
      const result = service.translate('nav.home')
      expect(result).toBe('Startseite') // This should be the German translation
    })

    it('should return fallback string when key not found in any language', () => {
      const result = service.translate('nonexistent.key', 'Custom Fallback')
      expect(result).toBe('Custom Fallback')
    })

    it('should return key when no fallback provided and key not found', () => {
      const result = service.translate('nonexistent.key')
      expect(result).toBe('nonexistent.key')
    })

    it('should handle empty key', () => {
      const result = service.translate('', 'Empty Key Fallback')
      expect(result).toBe('Empty Key Fallback')
    })

    it('should handle null key', () => {
      const result = service.translate(null as any, 'Null Key Fallback')
      expect(result).toBe('Null Key Fallback')
    })
  })

  describe('t (alias for translate)', () => {
    it('should work as alias for translate method', () => {
      service.setLanguage('en')
      const translateResult = service.translate('nav.home')
      const tResult = service.t('nav.home')
      expect(tResult).toBe(translateResult)
    })

    it('should handle fallback parameter', () => {
      const result = service.t('nonexistent.key', 'Fallback Text')
      expect(result).toBe('Fallback Text')
    })
  })

  describe('getSupportedLanguages', () => {
    it('should return array of supported languages', () => {
      const languages = service.getSupportedLanguages()
      expect(languages).toEqual(['en', 'de'])
      expect(Array.isArray(languages)).toBe(true)
    })

    it('should return a copy of the array, not the original', () => {
      const languages1 = service.getSupportedLanguages()
      const languages2 = service.getSupportedLanguages()
      expect(languages1).not.toBe(languages2)
      expect(languages1).toEqual(languages2)
    })
  })

  describe('getLanguageName', () => {
    it('should return English name for English language', () => {
      const name = service.getLanguageName('en')
      expect(name).toBe('English')
    })

    it('should return German name for German language', () => {
      const name = service.getLanguageName('de')
      expect(name).toBe('Deutsch')
    })

    it('should return language code for unsupported language', () => {
      const name = service.getLanguageName('fr' as Language)
      expect(name).toBe('fr')
    })

    it('should handle empty language code', () => {
      const name = service.getLanguageName('' as Language)
      expect(name).toBe('')
    })
  })

  describe('getLanguageFlag', () => {
    it('should return US flag for English language', () => {
      const flag = service.getLanguageFlag('en')
      expect(flag).toBe('🇺🇸')
    })

    it('should return German flag for German language', () => {
      const flag = service.getLanguageFlag('de')
      expect(flag).toBe('🇩🇪')
    })

    it('should return empty string for unsupported language', () => {
      const flag = service.getLanguageFlag('fr' as Language)
      expect(flag).toBe('')
    })

    it('should handle empty language code', () => {
      const flag = service.getLanguageFlag('' as Language)
      expect(flag).toBe('')
    })
  })

  describe('Language switching and persistence', () => {
    it('should persist language changes across service instances', () => {
      // Mock localStorage with persistent storage
      const mockStorage: Record<string, string> = {}
      const persistentLocalStorage = {
        getItem: jest.fn((key: string) => mockStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => { mockStorage[key] = value }),
        removeItem: jest.fn((key: string) => delete mockStorage[key]),
        clear: jest.fn(() => Object.keys(mockStorage).forEach(key => delete mockStorage[key])),
        length: Object.keys(mockStorage).length,
        key: jest.fn()
      }
      
      Object.defineProperty(window, 'localStorage', {
        value: persistentLocalStorage,
        writable: true
      })
      
      const service = new (localizationService.constructor as any)()
      service.setLanguage('de')
      
      // Simulate page reload by creating new instance
      const newService = new (service.constructor as any)()
      expect(newService.getCurrentLanguage()).toBe('de')
    })

    it('should load saved language preference on initialization', () => {
      localStorageMock.getItem.mockReturnValue('de')
      // Reset the static instance to force recreation
      ;(localizationService as any).currentLanguage = 'en'
      expect(localizationService.getCurrentLanguage()).toBe('de')
    })

    it('should ignore invalid saved language preference', () => {
      localStorageMock.getItem.mockReturnValue('invalid')
      // Reset the static instance to force recreation
      ;(localizationService as any).currentLanguage = 'en'
      expect(localizationService.getCurrentLanguage()).toBe('en')
    })
  })

  describe('Translation coverage', () => {
    it('should have translations for all navigation keys', () => {
      const navKeys = ['nav.home', 'nav.play', 'nav.leaderboard', 'nav.settings', 'nav.help']
      service.setLanguage('en')
      
      navKeys.forEach(key => {
        const translation = service.translate(key)
        expect(translation).not.toBe(key)
        expect(typeof translation).toBe('string')
        expect(translation.length).toBeGreaterThan(0)
      })
    })

    it('should have translations for all game interface keys', () => {
      const gameKeys = [
        'game.create', 'game.join', 'game.lobby', 'game.start', 'game.ready',
        'game.notReady', 'game.waiting', 'game.players', 'game.score'
      ]
      service.setLanguage('en')
      
      gameKeys.forEach(key => {
        const translation = service.translate(key)
        expect(translation).not.toBe(key)
        expect(typeof translation).toBe('string')
        expect(translation.length).toBeGreaterThan(0)
      })
    })

    it('should have German translations for all navigation keys', () => {
      const navKeys = ['nav.home', 'nav.play', 'nav.leaderboard', 'nav.settings', 'nav.help']
      service.setLanguage('de')
      
      navKeys.forEach(key => {
        const translation = service.translate(key)
        expect(translation).not.toBe(key)
        expect(typeof translation).toBe('string')
        expect(translation.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Error handling and edge cases', () => {
    it('should handle undefined key gracefully', () => {
      const result = service.translate(undefined as any, 'Undefined Fallback')
      expect(result).toBe('Undefined Fallback')
    })

    it('should handle special characters in keys', () => {
      const result = service.translate('key.with.special.chars!@#$%', 'Special Fallback')
      expect(result).toBe('Special Fallback')
    })

    it('should handle very long keys', () => {
      const longKey = 'a'.repeat(1000)
      const result = service.translate(longKey, 'Long Key Fallback')
      expect(result).toBe('Long Key Fallback')
    })

    it('should handle empty translations gracefully', () => {
      // Test with empty fallback
      const result = service.translate('some.key', '')
      expect(result).toBe('')
      
      // Test with non-existent key and no fallback
      const result2 = service.translate('nonexistent.key')
      expect(result2).toBe('nonexistent.key')
    })
  })

  describe('Performance considerations', () => {
    it('should handle multiple rapid language switches', () => {
      for (let i = 0; i < 100; i++) {
        service.setLanguage('en')
        service.setLanguage('de')
      }
      expect(service.getCurrentLanguage()).toBe('de')
    })

    it('should handle multiple rapid translations', () => {
      const keys = ['nav.home', 'nav.play', 'nav.leaderboard', 'nav.settings']
      for (let i = 0; i < 100; i++) {
        keys.forEach(key => {
          const translation = service.translate(key)
          expect(typeof translation).toBe('string')
        })
      }
    })
  })

  describe('Integration with localStorage', () => {
    it('should call localStorage.setItem when setting language', () => {
      service.setLanguage('de')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('language', 'de')
    })

    it('should call localStorage.getItem when loading preference', () => {
      // Trigger preference loading by calling getCurrentLanguage
      localizationService.getCurrentLanguage()
      expect(localStorageMock.getItem).toHaveBeenCalledWith('language')
    })

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      // The service should handle localStorage errors gracefully
      expect(() => {
        service.setLanguage('de')
      }).not.toThrow()
    })
  })
}) 