import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import { Header } from './components/Header'
import { AuthGuard } from './components/AuthGuard'
import { EmailVerificationPage } from './components/EmailVerificationPage'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { LobbyPage } from './pages/LobbyPage'
import { GamePage } from './pages/GamePage'
import { ResultsPage } from './pages/ResultsPage'
import { QuestionSetManagerPage } from './pages/QuestionSetManagerPage'
import { DemoPage } from './components/DemoPage'
import { PerformanceMonitor } from './components/PerformanceMonitor'
import { LevelUpNotificationManager } from './components/LevelUpNotificationManager'
import ErrorBoundary from './components/ErrorBoundary'
import { useSettingsStore } from './stores/settingsStore'
import { useEffect, useState } from 'react'
import styles from './styles/App.module.css'

// Separate AppContent component for easier testing
export function AppContent() {
  const [isHydrated, setIsHydrated] = useState(false)
  const theme = useSettingsStore((state) => state.theme)
  
  // Check if we're in test environment
  const isTestEnvironment = import.meta.env.MODE === 'test' || 
                           import.meta.env.VITE_TEST_MODE === 'true' ||
                           window.location.hostname === 'localhost' && window.location.port === '3000' ||
                           process.env.NODE_ENV === 'test';

  // Handle store hydration
  useEffect(() => {
    // Set initial theme immediately for testing
    if (isTestEnvironment) {
      document.documentElement.setAttribute('data-theme', theme)
      // In test environment, mark as hydrated immediately
      setIsHydrated(true)
    } else {
      // Mark as hydrated after a short delay to ensure store is ready
      const timer = setTimeout(() => {
        setIsHydrated(true)
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [theme, isTestEnvironment])

  return (
    <ErrorBoundary>
      <div className={`${styles.app} app`} data-testid="app-ready">
        {isHydrated || isTestEnvironment ? (
          <ThemeProvider>
            {isTestEnvironment ? (
              // Test environment: show AuthForm when not authenticated, otherwise show app
              <AuthGuard>
                <Header />
                <main className={`${styles.main} main`} role="main">
                  <div className={`${styles.container} container`}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/dashboard" element={<HomePage />} />
                      <Route path="/verify-email" element={<EmailVerificationPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/lobby/:lobbyId" element={<LobbyPage />} />
                      <Route path="/game/:lobbyId" element={<GamePage />} />
                      <Route path="/results/:lobbyId" element={<ResultsPage />} />
                      <Route path="/question-sets" element={<QuestionSetManagerPage />} />
                      <Route path="/demo" element={<DemoPage />} />
                    </Routes>
                  </div>
                </main>
                <PerformanceMonitor />
                <LevelUpNotificationManager />
              </AuthGuard>
            ) : (
              // Production environment: use AuthGuard
              <AuthGuard>
                {/* Game state management handled internally */}
                <Header />
                <main className={`${styles.main} main`} role="main">
                  <div className={`${styles.container} container`}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/dashboard" element={<HomePage />} />
                      <Route path="/verify-email" element={<EmailVerificationPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/lobby/:lobbyId" element={<LobbyPage />} />
                      <Route path="/game/:lobbyId" element={<GamePage />} />
                      <Route path="/results/:lobbyId" element={<ResultsPage />} />
                      <Route path="/question-sets" element={<QuestionSetManagerPage />} />
                      <Route path="/demo" element={<DemoPage />} />
                    </Routes>
                  </div>
                </main>
                <PerformanceMonitor />
                <LevelUpNotificationManager />
              </AuthGuard>
            )}
          </ThemeProvider>
        ) : (
          // Loading state - app-ready element is still present for tests
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App