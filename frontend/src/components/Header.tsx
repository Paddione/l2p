import React from 'react'
import { useTheme } from './ThemeProvider'
import { useSettingsStore } from '../stores/settingsStore'
import { apiService } from '../services/apiService'
import styles from '../styles/App.module.css'

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const { language, toggleLanguage } = useSettingsStore()

  const handleLogout = async () => {
    try {
      await apiService.logout()
      // Reload the page to trigger re-authentication
      window.location.reload()
    } catch (error) {
      console.error('Logout failed:', error)
      // Clear auth anyway and reload
      apiService.clearAuth()
      window.location.reload()
    }
  }

  return (
    <header className={styles.header} role="banner">
      <div className={styles.headerContent}>
        <a href="/" className={styles.logo}>
          Learn2Play Quiz
        </a>
        
        <nav className={`${styles.flex} ${styles.gapMd} ${styles.itemsCenter}`} role="navigation">
          <a href="/" className={`${styles.button} ${styles.buttonOutline}`}>
            Home
          </a>
          <a href="/profile" className={`${styles.button} ${styles.buttonOutline}`}>
            Profile
          </a>
          <a href="/question-sets" className={`${styles.button} ${styles.buttonOutline}`}>
            Question Sets
          </a>
        </nav>
        
        <div className={`${styles.flex} ${styles.gapMd} ${styles.itemsCenter}`}>
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className={`${styles.button} ${styles.buttonOutline}`}
            title={language === 'en' ? 'Switch to German' : 'Switch to English'}
            data-testid="language-selector"
          >
            {language === 'en' ? '🇩🇪' : '🇺🇸'}
          </button>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`${styles.button} ${styles.buttonOutline}`}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            data-testid="theme-toggle"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`${styles.button} ${styles.buttonOutline}`}
            title="Logout"
            data-testid="logout-button"
          >
            🚪
          </button>
        </div>
      </div>
    </header>
  )
} 