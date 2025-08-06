import React, { useState, useEffect } from 'react'
import { apiService } from '../services/apiService'
import { AuthForm } from './AuthForm'
import { PasswordResetForm } from './PasswordResetForm'

interface AuthGuardProps {
  children: React.ReactNode
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isValidating, setIsValidating] = useState(true)
  const [showPasswordReset, setShowPasswordReset] = useState(false)

  useEffect(() => {
    validateAuthentication()
  }, [])

  // Add a listener for storage changes to detect when auth state changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        console.log('AuthGuard: Storage change detected, re-validating')
        validateAuthentication()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const validateAuthentication = async () => {
    try {
      // First check if we have a token
      const hasToken = apiService.isAuthenticated()
      console.log('AuthGuard: Has token:', hasToken)
      
      if (!hasToken) {
        setIsAuthenticated(false)
        setIsValidating(false)
        return
      }

      // Validate the token with the server
      const response = await apiService.validateToken()
      console.log('AuthGuard: Token validation response:', response)
      
      if (response.success && response.data?.valid) {
        console.log('AuthGuard: Token is valid, setting authenticated')
        setIsAuthenticated(true)
      } else {
        // Token is invalid, clear it
        console.log('AuthGuard: Token invalid, clearing auth')
        apiService.clearAuth()
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Authentication validation failed:', error)
      // Clear potentially invalid token
      apiService.clearAuth()
      setIsAuthenticated(false)
    } finally {
      setIsValidating(false)
    }
  }

  const handleAuthSuccess = () => {
    console.log('AuthGuard: Auth success callback called')
    setIsAuthenticated(true)
  }

  const handleShowPasswordReset = () => {
    setShowPasswordReset(true)
  }

  const handleBackToLogin = () => {
    setShowPasswordReset(false)
  }

  // Show loading state while validating
  if (isValidating) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--background-color)',
        color: 'var(--text-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid var(--border-color)', 
            borderTop: '3px solid var(--primary-color)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Validating authentication...</p>
        </div>
      </div>
    )
  }

  // Show password reset form if requested
  if (showPasswordReset) {
    return <PasswordResetForm onBackToLogin={handleBackToLogin} />
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} onShowPasswordReset={handleShowPasswordReset} />
  }

  // Show protected content if authenticated
  return <>{children}</>
}