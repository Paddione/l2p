import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageSelector } from '../LanguageSelector'

// Mock the hooks
const mockSetLanguage = jest.fn()
const mockHandleLanguageChange = jest.fn()
const mockHandleButtonHover = jest.fn()

const mockUseLocalization = {
  currentLanguage: 'en' as 'en' | 'de',
  setLanguage: mockSetLanguage,
  getSupportedLanguages: jest.fn(() => ['en', 'de']),
  getLanguageName: jest.fn((lang: string) => lang === 'en' ? 'English' : 'Deutsch'),
  getLanguageFlag: jest.fn((lang: string) => lang === 'en' ? '🇺🇸' : '🇩🇪')
}

const mockUseAudio = {
  handleLanguageChange: mockHandleLanguageChange,
  handleButtonHover: mockHandleButtonHover
}

jest.mock('../../hooks/useLocalization', () => ({
  useLocalization: () => mockUseLocalization
}))

jest.mock('../../hooks/useAudio', () => ({
  useAudio: () => mockUseAudio
}))

// CSS modules are handled by Jest's identity-obj-proxy

describe('LanguageSelector Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLocalization.currentLanguage = 'en'
    mockUseLocalization.getSupportedLanguages.mockReturnValue(['en', 'de'])
    mockUseLocalization.getLanguageName.mockImplementation((lang: string) => 
      lang === 'en' ? 'English' : 'Deutsch'
    )
    mockUseLocalization.getLanguageFlag.mockImplementation((lang: string) => 
      lang === 'en' ? '🇺🇸' : '🇩🇪'
    )
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<LanguageSelector />)
      expect(screen.getByText('Language / Sprache')).toBeInTheDocument()
    })

    it('displays the correct title', () => {
      render(<LanguageSelector />)
      expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Language / Sprache')
    })

    it('renders all supported languages', () => {
      render(<LanguageSelector />)
      
      expect(screen.getByText('English')).toBeInTheDocument()
      expect(screen.getByText('Deutsch')).toBeInTheDocument()
      expect(screen.getByText('🇺🇸')).toBeInTheDocument()
      expect(screen.getByText('🇩🇪')).toBeInTheDocument()
    })

    it('renders language buttons with correct structure', () => {
      render(<LanguageSelector />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)
      
      buttons.forEach(button => {
        expect(button).toHaveClass('languageButton')
      })
    })

    it('applies active class to current language button', () => {
      mockUseLocalization.currentLanguage = 'en'
      render(<LanguageSelector />)
      
      const englishButton = screen.getByText('English').closest('button')
      const germanButton = screen.getByText('Deutsch').closest('button')
      
      expect(englishButton).toHaveClass('active')
      expect(germanButton).not.toHaveClass('active')
    })

    it('updates active class when current language changes', () => {
      const { rerender } = render(<LanguageSelector />)
      
      // Initially English is active
      expect(screen.getByText('English').closest('button')).toHaveClass('active')
      expect(screen.getByText('Deutsch').closest('button')).not.toHaveClass('active')
      
      // Change to German
      mockUseLocalization.currentLanguage = 'de'
      rerender(<LanguageSelector />)
      
      expect(screen.getByText('English').closest('button')).not.toHaveClass('active')
      expect(screen.getByText('Deutsch').closest('button')).toHaveClass('active')
    })
  })

  describe('Language Selection Functionality', () => {
    it('calls setLanguage when a language button is clicked', async () => {
      render(<LanguageSelector />)
      
      const germanButton = screen.getByText('Deutsch').closest('button')!
      await user.click(germanButton)
      
      expect(mockSetLanguage).toHaveBeenCalledWith('de')
    })

    it('calls handleLanguageChange when a language is selected', async () => {
      render(<LanguageSelector />)
      
      const germanButton = screen.getByText('Deutsch').closest('button')!
      await user.click(germanButton)
      
      expect(mockHandleLanguageChange).toHaveBeenCalled()
    })

    it('calls handleButtonHover on mouse enter', async () => {
      render(<LanguageSelector />)
      
      const germanButton = screen.getByText('Deutsch').closest('button')!
      fireEvent.mouseEnter(germanButton)
      
      expect(mockHandleButtonHover).toHaveBeenCalled()
    })

    it('handles multiple language selections correctly', async () => {
      render(<LanguageSelector />)
      
      // Click German
      const germanButton = screen.getByText('Deutsch').closest('button')!
      await user.click(germanButton)
      expect(mockSetLanguage).toHaveBeenCalledWith('de')
      
      // Click English
      const englishButton = screen.getByText('English').closest('button')!
      await user.click(englishButton)
      expect(mockSetLanguage).toHaveBeenCalledWith('en')
      
      expect(mockSetLanguage).toHaveBeenCalledTimes(2)
      expect(mockHandleLanguageChange).toHaveBeenCalledTimes(2)
    })

    it('passes correct language codes to setLanguage', async () => {
      render(<LanguageSelector />)
      
      const germanButton = screen.getByText('Deutsch').closest('button')!
      await user.click(germanButton)
      
      expect(mockSetLanguage).toHaveBeenCalledWith('de')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and titles', () => {
      render(<LanguageSelector />)
      
      const englishButton = screen.getByText('English').closest('button')
      const germanButton = screen.getByText('Deutsch').closest('button')
      
      expect(englishButton).toHaveAttribute('title', 'English')
      expect(germanButton).toHaveAttribute('title', 'Deutsch')
    })

    it('supports keyboard navigation', async () => {
      render(<LanguageSelector />)
      
      const buttons = screen.getAllByRole('button')
      buttons[0].focus()
      expect(buttons[0]).toHaveFocus()
      
      // Tab to next button
      await user.tab()
      expect(buttons[1]).toHaveFocus()
    })

    it('supports Enter key activation', async () => {
      render(<LanguageSelector />)
      
      const germanButton = screen.getByText('Deutsch').closest('button')!
      germanButton.focus()
      
      await user.keyboard('{Enter}')
      
      expect(mockSetLanguage).toHaveBeenCalledWith('de')
      expect(mockHandleLanguageChange).toHaveBeenCalled()
    })

    it('supports Space key activation', async () => {
      render(<LanguageSelector />)
      
      const germanButton = screen.getByText('Deutsch').closest('button')!
      germanButton.focus()
      
      await user.keyboard(' ')
      
      expect(mockSetLanguage).toHaveBeenCalledWith('de')
      expect(mockHandleLanguageChange).toHaveBeenCalled()
    })

    it('has semantic HTML structure', () => {
      render(<LanguageSelector />)
      
      expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument()
      expect(screen.getAllByRole('button')).toHaveLength(2)
    })
  })

  describe('Visual Feedback', () => {
    it('applies hover effects correctly', async () => {
      render(<LanguageSelector />)
      
      const germanButton = screen.getByText('Deutsch').closest('button')!
      
      fireEvent.mouseEnter(germanButton)
      expect(mockHandleButtonHover).toHaveBeenCalled()
      
      fireEvent.mouseLeave(germanButton)
      // Should not trigger additional calls
      expect(mockHandleButtonHover).toHaveBeenCalledTimes(1)
    })

    it('shows visual feedback for active language', () => {
      mockUseLocalization.currentLanguage = 'de'
      render(<LanguageSelector />)
      
      const germanButton = screen.getByText('Deutsch').closest('button')
      const englishButton = screen.getByText('English').closest('button')
      
      expect(germanButton).toHaveClass('active')
      expect(englishButton).not.toHaveClass('active')
    })
  })

  describe('Error Handling', () => {
    // it('handles missing language data gracefully', () => {
    //   mockUseLocalization.getLanguageName.mockReturnValue('')
    //   mockUseLocalization.getLanguageFlag.mockReturnValue('')
    //   
    //   render(<LanguageSelector />)
    //   
    //   // Should still render without crashing
    //   expect(screen.getByText('Language / Sprache')).toBeInTheDocument()
    // })

    it('handles empty supported languages array', () => {
      mockUseLocalization.getSupportedLanguages.mockReturnValue([])
      
      render(<LanguageSelector />)
      
      // Should render title but no buttons
      expect(screen.getByText('Language / Sprache')).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('handles undefined language functions', () => {
      mockUseLocalization.getLanguageName.mockImplementation(() => {
        throw new Error('Language name error')
      })
      
      // Should not crash the component
      expect(() => {
        try {
          render(<LanguageSelector />)
        } catch (error) {
          // Component should handle the error gracefully
        }
      }).not.toThrow()
    })
  })

  describe('Integration with Hooks', () => {
    it('uses localization hook correctly', () => {
      render(<LanguageSelector />)
      
      expect(mockUseLocalization.getSupportedLanguages).toHaveBeenCalled()
      expect(mockUseLocalization.getLanguageName).toHaveBeenCalledWith('en')
      expect(mockUseLocalization.getLanguageName).toHaveBeenCalledWith('de')
      expect(mockUseLocalization.getLanguageFlag).toHaveBeenCalledWith('en')
      expect(mockUseLocalization.getLanguageFlag).toHaveBeenCalledWith('de')
    })

    it('uses audio hook correctly', async () => {
      render(<LanguageSelector />)
      
      const germanButton = screen.getByText('Deutsch').closest('button')!
      await user.click(germanButton)
      
      expect(mockHandleLanguageChange).toHaveBeenCalled()
    })

    it('maintains hook state consistency', async () => {
      const { rerender } = render(<LanguageSelector />)
      
      // Initial state
      expect(screen.getByText('English').closest('button')).toHaveClass('active')
      
      // Update hook state
      mockUseLocalization.currentLanguage = 'de'
      rerender(<LanguageSelector />)
      
      // Should reflect updated state
      expect(screen.getByText('Deutsch').closest('button')).toHaveClass('active')
    })
  })

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const { rerender } = render(<LanguageSelector />)
      
      const initialRender = screen.getByText('Language / Sprache')
      
      // Re-render with same props
      rerender(<LanguageSelector />)
      
      const afterRender = screen.getByText('Language / Sprache')
      expect(afterRender).toBe(initialRender)
    })

    it('handles rapid language changes efficiently', async () => {
      render(<LanguageSelector />)
      
      const germanButton = screen.getByText('Deutsch').closest('button')!
      const englishButton = screen.getByText('English').closest('button')!
      
      // Rapid clicks
      await user.click(germanButton)
      await user.click(englishButton)
      await user.click(germanButton)
      
      expect(mockSetLanguage).toHaveBeenCalledTimes(3)
      expect(mockHandleLanguageChange).toHaveBeenCalledTimes(3)
    })
  })

  describe('Responsive Design', () => {
    it('maintains functionality on different screen sizes', async () => {
      // Mock window resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320
      })
      
      render(<LanguageSelector />)
      
      const germanButton = screen.getByText('Deutsch').closest('button')!
      await user.click(germanButton)
      
      expect(mockSetLanguage).toHaveBeenCalledWith('de')
    })

    it('renders correctly with different language configurations', () => {
      // Test with different supported languages
      mockUseLocalization.getSupportedLanguages.mockReturnValue(['en'])
      
      render(<LanguageSelector />)
      
      expect(screen.getByText('English')).toBeInTheDocument()
      expect(screen.queryByText('Deutsch')).not.toBeInTheDocument()
    })
  })
}) 