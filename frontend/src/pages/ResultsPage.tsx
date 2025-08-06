import React from 'react'
import { PlayerGrid } from '../components/PlayerGrid'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../stores/gameStore'
import styles from '../styles/App.module.css'

export const ResultsPage: React.FC = () => {
  const navigate = useNavigate()
  const { gameResults, lobbyCode } = useGameStore()
  
  // Use actual game results or fallback to mock data
  const finalPlayers = gameResults.length > 0 ? gameResults : [
    { 
      id: '4', 
      username: 'Diana', 
      character: 'professor', 
      characterLevel: 5,
      finalScore: 2100, 
      correctAnswers: 7, 
      experienceAwarded: 2100,
      levelUp: true,
      newLevel: 6,
      oldLevel: 5
    },
    { 
      id: '1', 
      username: 'Alice', 
      character: 'student', 
      characterLevel: 3,
      finalScore: 1250, 
      correctAnswers: 5, 
      experienceAwarded: 1250,
      levelUp: false,
      newLevel: 3,
      oldLevel: 3
    },
    { 
      id: '2', 
      username: 'Bob', 
      character: 'librarian', 
      characterLevel: 2,
      finalScore: 890, 
      correctAnswers: 3, 
      experienceAwarded: 890,
      levelUp: false,
      newLevel: 2,
      oldLevel: 2
    },
    { 
      id: '3', 
      username: 'Charlie', 
      character: 'researcher', 
      characterLevel: 1,
      finalScore: 450, 
      correctAnswers: 2, 
      experienceAwarded: 450,
      levelUp: false,
      newLevel: 1,
      oldLevel: 1
    },
  ]

  const handlePlayAgain = () => {
    navigate('/')
  }

  const getCharacterEmoji = (character: string) => {
    switch (character) {
      case 'professor': return '👨‍🏫'
      case 'student': return '👨‍🎓'
      case 'librarian': return '👩‍💼'
      case 'researcher': return '👨‍🔬'
      case 'dean': return '👩‍⚖️'
      case 'graduate': return '🎓'
      case 'lab_assistant': return '👨‍🔬'
      case 'teaching_assistant': return '👩‍🏫'
      default: return '👤'
    }
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${styles.textCenter}`} style={{marginBottom: 'var(--spacing-xl)'}}>
        <h1>🏆 Game Results</h1>
        <p>Final scores, rankings, and experience gained</p>
      </div>

      {/* Winner Announcement */}
      <div className={`${styles.card} ${styles.textCenter}`} style={{marginBottom: 'var(--spacing-xl)'}}>
        <h2>🎉 Winner: {finalPlayers[0].username}!</h2>
        <div className={styles.flex} style={{ justifyContent: 'center', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
          <span style={{ fontSize: '2rem' }}>{getCharacterEmoji(finalPlayers[0].character)}</span>
          <div>
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>
              Level {finalPlayers[0].newLevel} {finalPlayers[0].character}
            </p>
            {finalPlayers[0].levelUp && (
              <p style={{ margin: 0, color: 'var(--color-success)', fontSize: '0.9rem' }}>
                🎉 Leveled up from {finalPlayers[0].oldLevel}!
              </p>
            )}
          </div>
        </div>
        <p>Final Score: {finalPlayers[0].finalScore} points</p>
        <p>Experience Gained: +{finalPlayers[0].experienceAwarded} XP</p>
        <p>Correct Answers: {finalPlayers[0].correctAnswers}/10</p>
      </div>

      {/* Final Rankings with Experience */}
      <div className={styles.card}>
        <h3>Final Rankings & Experience</h3>
        <div style={{marginBottom: 'var(--spacing-xl)'}}>
          {finalPlayers.map((player, index) => (
            <div key={player.id} className={`${styles.flex} ${styles.justifyBetween} ${styles.itemsCenter}`} style={{
              padding: 'var(--spacing-md)', 
              marginBottom: 'var(--spacing-sm)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)',
              backgroundColor: player.levelUp ? 'rgba(76, 175, 80, 0.1)' : 'transparent'
            }}>
              <div className={`${styles.flex} ${styles.itemsCenter} ${styles.gapSm}`}>
                <span style={{
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: index === 0 ? 'var(--primary-color)' : 'var(--secondary-color)',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  #{index + 1}
                </span>
                <div className={styles.flex} style={{ alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <span style={{ fontSize: '1.5rem' }}>{getCharacterEmoji(player.character)}</span>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{player.username}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Level {player.newLevel} {player.character}
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.textRight}>
                <div style={{ fontWeight: 'bold' }}>{player.finalScore} pts</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-success)' }}>
                  +{player.experienceAwarded} XP
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {player.correctAnswers}/10 correct
                </div>
                {player.levelUp && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 'bold' }}>
                    🎉 Level {player.oldLevel} → {player.newLevel}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experience Summary */}
      <div className={styles.card} style={{marginBottom: 'var(--spacing-xl)'}}>
        <h3>Experience Summary</h3>
        <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
          {finalPlayers.map(player => (
            <div key={player.id} style={{
              padding: 'var(--spacing-md)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)' }}>
                {getCharacterEmoji(player.character)}
              </div>
              <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
                {player.username}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                Level {player.newLevel}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
                +{player.experienceAwarded} XP
              </div>
              {player.levelUp && (
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--color-success)', 
                  fontWeight: 'bold',
                  marginTop: 'var(--spacing-xs)'
                }}>
                  🎉 Level Up!
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className={`${styles.flex} ${styles.justifyCenter} ${styles.gapLg}`}>
        <button 
          className={styles.button}
          onClick={handlePlayAgain}
        >
          Play Again
        </button>
        <button 
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    </div>
  )
} 