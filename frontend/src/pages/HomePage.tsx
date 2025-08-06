import React from 'react'
import { GameInterface } from '../components/GameInterface'
import { ConnectionStatus } from '../components/ConnectionStatus'
import { apiService } from '../services/apiService'
import styles from '../styles/App.module.css'

export const HomePage: React.FC = () => {
  const user = apiService.getCurrentUser()

  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${styles.textCenter}`}>
        <h1>Learn2Play</h1>
        <p>Real-time multiplayer quiz game for up to 8 players</p>
        {user && (
          <div data-testid="welcome-message">
            Welcome back, {user.username}!
          </div>
        )}
        {/* Add ConnectionStatus for tests */}
        <ConnectionStatus />
      </div>
      
      <div className={styles.card}>
        <GameInterface />
      </div>
    </div>
  )
} 