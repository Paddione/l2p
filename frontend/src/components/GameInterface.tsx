import React, { useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import { socketService } from '../services/socketService'
import { navigationService } from '../services/navigationService'
import { apiService } from '../services/apiService'
import { ErrorDisplay } from './ErrorBoundary'
import styles from '../styles/GameInterface.module.css'

interface GameInterfaceProps {
  className?: string
}

export const GameInterface: React.FC<GameInterfaceProps> = ({ className = '' }) => {
  const [lobbyCode, setLobbyCode] = useState('')
  
  const { 
    setLobbyCode: setGameLobbyCode, 
    setIsHost, 
    setLoading, 
    setError,
    error,
    isLoading
  } = useGameStore()
  
  // Default question count since we removed the dropdown
  const questionCount = 10



  const handleCreateLobby = async () => {
    // Check authentication
    if (!apiService.isAuthenticated()) {
      setError('You must be logged in to create a lobby')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Connect to WebSocket if not already connected
      if (!socketService.isConnected()) {
        socketService.connect()
      }

      // Create lobby via API and WebSocket
      const response = await socketService.createLobby(
        { questionCount }
      )

      if (response && response.success && response.data) {
        setGameLobbyCode(response.data.code)
        setIsHost(true)
        
        // Navigate to lobby
        await navigationService.navigateToLobby(response.data.code)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create lobby'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinLobby = async () => {
    if (!lobbyCode.trim() || lobbyCode.length !== 6) {
      setError('Please enter a valid 6-character lobby code')
      return
    }

    // Check authentication
    if (!apiService.isAuthenticated()) {
      setError('You must be logged in to join a lobby')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Connect to WebSocket if not already connected
      if (!socketService.isConnected()) {
        socketService.connect()
      }

      // Join lobby via API and WebSocket
      const response = await socketService.joinLobby(
        lobbyCode.toUpperCase().trim()
      )

      if (response && response.success && response.data) {
        setGameLobbyCode(response.data.code)
        setIsHost(false)
        
        // Navigate to lobby
        await navigationService.navigateToLobby(response.data.code)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join lobby'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${styles.gameInterface} ${className}`.trim()}>
      <div className={styles.header}>
        <h1 className={styles.title}>Learn2Play Quiz</h1>
        <p className={styles.subtitle}>Create or join a multiplayer quiz game</p>
      </div>

      {/* Error Display */}
      <ErrorDisplay 
        error={error} 
        onClear={() => setError(null)}
      />

      <div className={styles.content}>
        {/* Create Lobby Section */}
        <div className={styles.section}>
          <h2>Create New Game</h2>
          
          <button
            className={`${styles.button} ${styles.primary}`}
            onClick={handleCreateLobby}
            disabled={isLoading}
            data-testid="create-lobby-button"
          >
            {isLoading ? 'Creating...' : 'Create Lobby'}
          </button>
        </div>

        {/* Join Lobby Section */}
        <div className={styles.section}>
          <h2>Join Existing Game</h2>
          <div className={styles.inputGroup}>
            <label htmlFor="lobbyCode">Lobby Code</label>
            <input
              id="lobbyCode"
              type="text"
              value={lobbyCode}
              onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className={styles.input}
              data-testid="lobby-code-input"
            />
          </div>
          
          <button
            className={`${styles.button} ${styles.secondary}`}
            onClick={handleJoinLobby}
            disabled={!lobbyCode.trim() || isLoading}
            data-testid="join-lobby-confirm"
          >
            {isLoading ? 'Joining...' : 'Join Lobby'}
          </button>
        </div>

      </div>
    </div>
  )
} 