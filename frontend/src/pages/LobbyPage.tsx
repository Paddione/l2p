import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LobbyView } from '../components/LobbyView'
import { ConnectionStatus } from '../components/ConnectionStatus'
import { ErrorDisplay } from '../components/ErrorBoundary'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useGameStore } from '../stores/gameStore'
import { socketService } from '../services/socketService'
import { navigationService } from '../services/navigationService'
import styles from '../styles/App.module.css'

export const LobbyPage: React.FC = () => {
  const { lobbyId } = useParams<{ lobbyId: string }>()
  const navigate = useNavigate()
  
  const {
    lobbyCode,
    gameStarted,
    isLoading,
    error,
    setError,
    setLobbyCode
  } = useGameStore()

  useEffect(() => {
    const initializeLobby = async () => {
      if (!lobbyId) {
        setError('No lobby ID provided')
        navigate('/')
        return
      }

      // Set lobby code if not already set
      if (lobbyCode !== lobbyId) {
        setLobbyCode(lobbyId)
      }

      // Connect to WebSocket if not connected
      if (!socketService.isConnected()) {
        socketService.connect()
      }

      // Validate the lobby exists
      await navigationService.validateCurrentRoute()
    }

    initializeLobby()
  }, [lobbyId, lobbyCode, navigate, setError, setLobbyCode])

  // Auto-navigate to game when it starts
  useEffect(() => {
    if (gameStarted && lobbyCode) {
      navigationService.navigateToGame(lobbyCode)
    }
  }, [gameStarted, lobbyCode])

  const handleLeaveLobby = async () => {
    if (lobbyCode) {
      await navigationService.leaveLobby(lobbyCode)
    } else {
      navigate('/')
    }
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner />
        <p>Loading lobby...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Error Display */}
      <ErrorDisplay 
        error={error} 
        onClear={() => setError(null)}
        onRetry={() => window.location.reload()}
      />

      <div className={`${styles.flex} ${styles.justifyBetween} ${styles.itemsCenter}`}>
        <div>
          <h1>Game Lobby</h1>
          {lobbyCode && (
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Code: {lobbyCode}
            </p>
          )}
        </div>
        <div className={`${styles.flex} ${styles.itemsCenter} ${styles.gapMd}`}>
          <button 
            onClick={handleLeaveLobby}
            className={`${styles.button} ${styles.buttonSecondary}`}
            style={{ fontSize: '0.875rem' }}
          >
            Leave Lobby
          </button>
          <ConnectionStatus />
        </div>
      </div>
      
      <LobbyView />
    </div>
  )
} 