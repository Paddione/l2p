import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../services/apiService'
import { ErrorDisplay } from './ErrorBoundary'
import { CharacterSelector } from './CharacterSelector'
import styles from '../styles/AuthForm.module.css'

interface AuthFormProps {
  onAuthSuccess: () => void
  onShowPasswordReset?: () => void
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess, onShowPasswordReset }) => {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [selectedCharacter, setSelectedCharacter] = useState('student')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false
  })

  const validatePassword = (password: string) => {
    setPasswordValidation({
      length: password.length >= 8,
      lowercase: /(?=.*[a-z])/.test(password),
      uppercase: /(?=.*[A-Z])/.test(password),
      number: /(?=.*\d)/.test(password),
      special: /(?=.*[@$!%*?&])/.test(password)
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Validate password in real-time for registration
    if (name === 'password' && !isLogin) {
      validatePassword(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (isLogin) {
        console.log('AuthForm: Attempting login for user:', formData.username)
        const response = await apiService.login({
          username: formData.username,
          password: formData.password
        })
        console.log('AuthForm: Login response:', response)
        
        if (response.success) {
          console.log('AuthForm: Login successful, calling onAuthSuccess')
          onAuthSuccess()
          // Force a small delay to ensure state updates
          await new Promise(resolve => setTimeout(resolve, 100))
          console.log('AuthForm: Navigating to dashboard')
          // Navigate to dashboard after successful login
          navigate('/')
        } else {
          setError(response.error || 'Login failed')
        }
      } else {
        // Validate password before submitting registration
        validatePassword(formData.password)
        const isPasswordValid = Object.values(passwordValidation).every(Boolean)
        
        if (!isPasswordValid) {
          setError('Please ensure your password meets all requirements')
          setIsLoading(false)
          return
        }

        // Validate password confirmation
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match')
          setIsLoading(false)
          return
        }

        console.log('AuthForm: Attempting registration for user:', formData.username)
        const response = await apiService.register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          selectedCharacter: selectedCharacter
        })
        console.log('AuthForm: Registration response:', response)
        
        if (response.success) {
          console.log('AuthForm: Registration successful, calling onAuthSuccess')
          onAuthSuccess()
          // Force a small delay to ensure state updates
          await new Promise(resolve => setTimeout(resolve, 100))
          console.log('AuthForm: Navigating to dashboard')
          // Navigate to dashboard after successful registration
          navigate('/')
        } else {
          setError(response.error || 'Registration failed')
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError(null)
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
    setSelectedCharacter('student')
    setPasswordValidation({
      length: false,
      lowercase: false,
      uppercase: false,
      number: false,
      special: false
    })
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <h1>Learn2Play</h1>
          <p>Real-time multiplayer quiz game</p>
        </div>

        <div className={styles.authTabs}>
          <button
            className={isLogin ? `${styles.tab} ${styles.active}` : styles.tab}
            onClick={() => setIsLogin(true)}
            type="button"
            data-testid="login-tab"
          >
            Login
          </button>
          <button
            className={!isLogin ? `${styles.tab} ${styles.active}` : styles.tab}
            onClick={() => setIsLogin(false)}
            type="button"
            data-testid="register-tab"
          >
            Register
          </button>
        </div>

        <ErrorDisplay 
          error={error} 
          onClear={() => setError(null)}
        />

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter your username"
              required
              minLength={3}
              maxLength={30}
              className={styles.input}
              data-testid="username-input"
              aria-describedby="username-error"
            />
            {error && error.includes('username') && (
              <div id="username-error" data-testid="username-error" className={styles.error}>
                {error}
              </div>
            )}
          </div>

          {!isLogin && (
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                className={styles.input}
                data-testid="email-input"
              />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
              minLength={8}
              className={styles.input}
              data-testid="password-input"
            />
            {!isLogin && (
              <div className={styles.passwordRequirements}>
                <p>Password must contain:</p>
                <ul>
                  <li className={passwordValidation.length ? styles.valid : styles.invalid}>
                    At least 8 characters
                  </li>
                  <li className={passwordValidation.lowercase ? styles.valid : styles.invalid}>
                    At least one lowercase letter
                  </li>
                  <li className={passwordValidation.uppercase ? styles.valid : styles.invalid}>
                    At least one uppercase letter
                  </li>
                  <li className={passwordValidation.number ? styles.valid : styles.invalid}>
                    At least one number
                  </li>
                  <li className={passwordValidation.special ? styles.valid : styles.invalid}>
                    At least one special character (@$!%*?&)
                  </li>
                </ul>
              </div>
            )}
            {!isLogin && (
              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  required
                  minLength={8}
                  className={styles.input}
                  data-testid="confirm-password-input"
                />
              </div>
            )}
            {isLogin && onShowPasswordReset && (
              <div className={styles.forgotPassword}>
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={onShowPasswordReset}
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </div>

          {!isLogin && (
            <CharacterSelector
              selectedCharacter={selectedCharacter}
              onCharacterSelect={setSelectedCharacter}
            />
          )}

          <button
            type="submit"
            className={`${styles.button} ${styles.primary}`}
            disabled={isLoading}
            data-testid={isLogin ? "login-button" : "register-button"}
          >
            {isLoading ? (isLogin ? 'Logging in...' : 'Registering...') : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <div className={styles.switchMode}>
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className={styles.linkButton}
              onClick={toggleMode}
              data-testid={isLogin ? "register-link" : "login-link"}
            >
              {isLogin ? 'Register here' : 'Login here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}