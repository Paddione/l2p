import React, { useState } from 'react'
import { PlayerGrid } from './PlayerGrid'
import { QuestionSetSelector } from './QuestionSetSelector'
import { useGameStore } from '../stores/gameStore'
import styles from '../styles/LobbyView.module.css'

interface LobbyViewProps {
  className?: string
}

export const LobbyView: React.FC<LobbyViewProps> = ({ className = '' }) => {
  const [isReady, setIsReady] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showQuestionSetSelector, setShowQuestionSetSelector] = useState(false)
  
  const { 
    lobbyCode, 
    isHost, 
    players, 
    setGameStarted,
    error 
  } = useGameStore()

  const handleReadyToggle = () => {
    setIsReady(!isReady)
    // TODO: Send ready state to server via WebSocket
  }

  const handleStartGame = () => {
    if (players.filter(p => p.isReady).length < 2) {
      // Show error - need at least 2 players ready
      return
    }
    setGameStarted(true)
    // TODO: Send start game signal to server
  }

  const handleSettingsUpdate = () => {
    // Refresh lobby data after settings update
    setShowQuestionSetSelector(false)
  }

  const handleCopyCode = async () => {
    if (lobbyCode) {
      try {
        await navigator.clipboard.writeText(lobbyCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = lobbyCode
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const readyPlayers = players.filter(p => p.isReady).length
  const totalPlayers = players.length
  const canStart = isHost && readyPlayers >= 2 && readyPlayers === totalPlayers

  return (
    <div className={`${styles.lobbyView} ${className}`.trim()}>
      <div className={styles.header}>
        <h1 className={styles.title}>Game Lobby</h1>
        <div className={styles.lobbyInfo}>
          <div className={styles.codeSection}>
            <label>Lobby Code</label>
            <div className={styles.codeDisplay}>
              <span className={styles.code} data-testid="lobby-code">{lobbyCode}</span>
              <button
                className={copied ? `${styles.copyButton} ${styles.copied}` : styles.copyButton}
                onClick={handleCopyCode}
                title="Copy to clipboard"
              >
                {copied ? '✓' : '📋'}
              </button>
            </div>
          </div>
          
          <div className={styles.statusSection}>
            <div className={styles.playerCount}>
              {readyPlayers} / {totalPlayers} Ready
            </div>
            <div className={styles.hostIndicator} data-testid="host-indicator">
              {isHost ? '👑 Host' : 'Player'}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {/* Player Grid */}
        <div className={styles.playerSection}>
          <h2>Players</h2>
          <PlayerGrid 
            players={players} 
            showScores={false}
            showMultipliers={false}
            data-testid="player-list"
          />
        </div>

        {/* Ready Status */}
        <div className={styles.readySection}>
          <div className={styles.readyStatus}>
            <div className={styles.readyIndicator}>
              <div className={isReady ? `${styles.readyDot} ${styles.ready}` : styles.readyDot} />
              <span>{isReady ? 'Ready' : 'Not Ready'}</span>
            </div>
            
            <button
              className={isReady ? `${styles.readyButton} ${styles.ready}` : styles.readyButton}
              onClick={handleReadyToggle}
            >
              {isReady ? 'Not Ready' : 'Ready'}
            </button>
          </div>
        </div>

        {/* Question Set Management */}
        <div className={styles.questionSetSection}>
          <div className={styles.sectionHeader}>
            <h2>Question Sets</h2>
            {isHost && (
              <button
                className={styles.toggleButton}
                onClick={() => setShowQuestionSetSelector(!showQuestionSetSelector)}
              >
                {showQuestionSetSelector ? 'Hide Settings' : 'Manage Sets'}
              </button>
            )}
          </div>
          
          {showQuestionSetSelector ? (
            <QuestionSetSelector onSettingsUpdate={handleSettingsUpdate} />
          ) : (
            <QuestionSetSelector />
          )}
        </div>

        {/* Host Controls */}
        {isHost && (
          <div className={styles.hostControls}>
            <h2>Host Controls</h2>
            <div className={styles.hostInfo}>
              <p>Waiting for players to join and get ready...</p>
              <p>Minimum 2 players required to start</p>
            </div>
            
            <button
              className={canStart ? `${styles.startButton} ${styles.canStart}` : styles.startButton}
              onClick={handleStartGame}
              disabled={!canStart}
            >
              Start Game
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
} 