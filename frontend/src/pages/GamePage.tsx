import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PlayerGrid } from '../components/PlayerGrid'
import { ScoreDisplay } from '../components/ScoreDisplay'
import { ConnectionStatus } from '../components/ConnectionStatus'
import { ErrorDisplay } from '../components/ErrorBoundary'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useGameStore } from '../stores/gameStore'
import { socketService } from '../services/socketService'
import { navigationService } from '../services/navigationService'
import styles from '../styles/App.module.css'

export const GamePage: React.FC = () => {
  const { lobbyId } = useParams<{ lobbyId: string }>()
  const navigate = useNavigate()
  
  const {
    players,
    currentQuestion,
    questionIndex,
    totalQuestions,
    timeRemaining,
    gameStarted,
    gameEnded,
    isLoading,
    error,
    setError,
    lobbyCode
  } = useGameStore()

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)

  // Initialize and validate game state
  useEffect(() => {
    const initializeGame = async () => {
      if (!lobbyId) {
        setError('No lobby ID provided')
        navigate('/')
        return
      }

      // Validate that we're in a game state
      if (!gameStarted) {
        await navigationService.navigateToLobby(lobbyId)
        return
      }

      // Connect to WebSocket if not connected
      if (!socketService.isConnected()) {
        socketService.connect()
      }
    }

    initializeGame()
  }, [lobbyId, gameStarted, navigate])

  // Reset answer state when question changes
  useEffect(() => {
    setSelectedAnswer(null)
    setHasAnswered(false)
  }, [questionIndex])

  const handleAnswerClick = async (answerIndex: number) => {
    if (hasAnswered || !currentQuestion) return

    try {
      setSelectedAnswer(answerIndex)
      setHasAnswered(true)

      // Submit answer via WebSocket
      socketService.submitAnswer(answerIndex)
    } catch (error) {
      console.error('Failed to submit answer:', error)
      setError('Failed to submit answer')
      setHasAnswered(false)
      setSelectedAnswer(null)
    }
  }

  const handleLeaveLobby = async () => {
    if (lobbyCode) {
      await navigationService.leaveLobby(lobbyCode)
    } else {
      navigate('/')
    }
  }

  // Show loading spinner while initializing
  if (isLoading || !currentQuestion) {
    return (
      <div className={styles.container}>
        <LoadingSpinner />
        <p>Loading game...</p>
      </div>
    )
  }

  // Show error if game ended or not started
  if (gameEnded) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Game Ended</h2>
          <p>The game has ended. Redirecting to results...</p>
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!gameStarted) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Game Not Started</h2>
          <p>Waiting for game to start...</p>
          <button onClick={handleLeaveLobby} className={styles.button}>
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  const currentPlayer = players.find(p => p.isHost) || players[0]
  const { score, multiplier, correctAnswers } = currentPlayer

  return (
    <div className={styles.container}>
      {/* Error Display */}
      <ErrorDisplay 
        error={error} 
        onClear={() => setError(null)}
        onRetry={() => window.location.reload()}
      />

      {/* Header with connection status */}
      <div className={`${styles.flex} ${styles.justifyBetween} ${styles.itemsCenter}`} style={{marginBottom: 'var(--spacing-xl)'}}>
        <div>
          <h2>Question {questionIndex + 1} of {totalQuestions}</h2>
          <button 
            onClick={handleLeaveLobby}
            className={`${styles.button} ${styles.buttonSecondary}`}
            style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}
          >
            Leave Game
          </button>
        </div>
        <ConnectionStatus />
      </div>

      {/* Questions Container */}
      <div className={`${styles.flex} ${styles.justifyCenter}`} style={{marginBottom: 'var(--spacing-xl)'}}>
        <ScoreDisplay
          score={score}
          multiplier={multiplier}
          correctAnswers={correctAnswers}
        />
      </div>

      {/* Player Grid */}
      <div style={{marginBottom: 'var(--spacing-xl)'}}>
        <PlayerGrid players={players} />
      </div>

      {/* Question Section */}
      <div className={styles.card} style={{marginBottom: 'var(--spacing-xl)'}}>
        <h3 className={styles.textCenter}>{currentQuestion.text}</h3>
        <div className={`${styles.grid} ${styles.gridCols2} ${styles.gapMd}`} style={{marginTop: 'var(--spacing-xl)'}}>
          {currentQuestion.answers.map((answer, index) => (
            <button
              key={index}
              className={`${styles.button} ${
                selectedAnswer === index 
                  ? styles.button 
                  : ''
              }`}
              style={{
                backgroundColor: selectedAnswer === index 
                  ? 'var(--color-primary)' 
                  : undefined,
                color: selectedAnswer === index 
                  ? 'white' 
                  : undefined
              }}
              onClick={() => handleAnswerClick(index)}
              disabled={hasAnswered || timeRemaining === 0}
            >
              {String.fromCharCode(65 + index)}. {answer}
            </button>
          ))}
        </div>
        
        {hasAnswered && (
          <div style={{ marginTop: 'var(--spacing-md)', textAlign: 'center' }}>
            <p>Answer submitted! Waiting for other players...</p>
          </div>
        )}
      </div>

      {/* Current Player Score */}
      {currentPlayer && (
        <div className={`${styles.flex} ${styles.justifyCenter}`}>
          <ScoreDisplay 
            score={currentPlayer.score} 
            multiplier={currentPlayer.multiplier} 
            correctAnswers={currentPlayer.correctAnswers} 
            totalQuestions={totalQuestions} 
          />
        </div>
      )}
    </div>
  )
} 