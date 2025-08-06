import React from 'react'
import { Player } from '../types'
import styles from '../styles/PlayerGrid.module.css'
import { CharacterDisplay } from './CharacterDisplay'
import { useCharacterStore } from '../stores/characterStore'

interface PlayerGridProps {
  players: Player[]
  maxPlayers?: number
  showScores?: boolean
  showMultipliers?: boolean
  className?: string
  'data-testid'?: string
}

export const PlayerGrid: React.FC<PlayerGridProps> = ({
  players,
  maxPlayers = 8,
  showScores = true,
  showMultipliers = true,
  className = '',
  'data-testid': dataTestId
}) => {
  const { characters } = useCharacterStore()
  
  // Create empty slots for up to maxPlayers
  const slots = Array.from({ length: maxPlayers }, (_, index) => {
    const player = players[index]
    return player || null
  })

  const getCharacterById = (characterId: string) => {
    return characters.find(char => char.id === characterId) || {
      id: characterId,
      name: characterId,
      emoji: '👤',
      description: 'Unknown character',
      unlockLevel: 1
    }
  }

  return (
    <div className={`${styles.playerGrid} ${className}`} data-testid={dataTestId}>
      {slots.map((player, index) => (
        <div
          key={player?.id || `empty-${index}`}
          className={`${styles.playerSlot} ${player ? styles.occupied : styles.empty}`}
          data-testid={player ? `player-${player.id}` : `empty-slot-${index}`}
        >
          {player ? (
            <>
              <div className={styles.avatarContainer}>
                <CharacterDisplay
                  character={getCharacterById(player.character)}
                  level={player.characterLevel || 1}
                  size="small"
                  showLevel={true}
                  showProgress={false}
                />
                {player.isHost && <div className={styles.hostBadge}>👑</div>}
                {!player.isConnected && <div className={styles.disconnectedBadge}>🔌</div>}
              </div>
              
              <div className={styles.playerInfo}>
                <div className={styles.username}>{player.username}</div>
                
                {showScores && (
                  <div className={styles.scoreContainer}>
                    <span className={styles.score}>{player.score}</span>
                    {showMultipliers && player.multiplier > 1 && (
                      <span className={`${styles.multiplier} ${styles[`multiplier-${player.multiplier}`]}`}>
                        ×{player.multiplier}
                      </span>
                    )}
                  </div>
                )}
                
                <div className={styles.statusIndicators}>
                  {player.isReady && <div className={styles.readyIndicator}>✓</div>}
                  {player.correctAnswers > 0 && (
                    <div className={styles.streakIndicator}>
                      🔥 {player.correctAnswers}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className={styles.emptySlot}>
              <div className={styles.emptyAvatar}>?</div>
              <div className={styles.emptyText}>Empty</div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
} 