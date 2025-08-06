import React, { useState, useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import { apiService } from '../services/apiService'
import { socketService } from '../services/socketService'
import styles from '../styles/QuestionSetSelector.module.css'

interface QuestionSet {
  id: number
  name: string
  category: string
  difficulty: string
  questionCount: number
  isActive: boolean
}

interface QuestionSetInfo {
  selectedSets: Array<{ id: number; name: string; questionCount: number }>
  totalQuestions: number
  selectedQuestionCount: number
  maxQuestionCount: number
}

interface QuestionSetSelectorProps {
  className?: string
  onSettingsUpdate?: () => void
}

export const QuestionSetSelector: React.FC<QuestionSetSelectorProps> = ({ 
  className = '',
  onSettingsUpdate 
}) => {
  const { lobbyCode, isHost } = useGameStore()
  
  const [availableQuestionSets, setAvailableQuestionSets] = useState<QuestionSet[]>([])
  const [questionSetInfo, setQuestionSetInfo] = useState<QuestionSetInfo | null>(null)
  const [selectedSetIds, setSelectedSetIds] = useState<number[]>([])
  const [questionCount, setQuestionCount] = useState<number>(10)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Load available question sets
  useEffect(() => {
    const loadQuestionSets = async () => {
      if (!lobbyCode) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await apiService.getAvailableQuestionSets()
        if (response.success && response.data) {
          setAvailableQuestionSets(response.data)
        } else {
          setError(response.error || 'Failed to load question sets')
        }
      } catch (err) {
        setError('Failed to load question sets')
        console.error('Load question sets error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadQuestionSets()
  }, [lobbyCode])

  // Load current question set info
  useEffect(() => {
    const loadQuestionSetInfo = async () => {
      if (!lobbyCode) return
      
      try {
        const response = await apiService.getLobbyQuestionSetInfo(lobbyCode)
        if (response.success && response.data) {
          const info = response.data as QuestionSetInfo
          setQuestionSetInfo(info)
          setSelectedSetIds(info.selectedSets.map(set => set.id))
          setQuestionCount(info.selectedQuestionCount)
        }
      } catch (err) {
        console.error('Load question set info error:', err)
      }
    }

    loadQuestionSetInfo()
  }, [lobbyCode])

  const handleQuestionSetToggle = (setId: number) => {
    setSelectedSetIds(prev => {
      if (prev.includes(setId)) {
        return prev.filter(id => id !== setId)
      } else {
        return [...prev, setId]
      }
    })
  }

  const handleQuestionCountChange = (count: number) => {
    setQuestionCount(Math.max(5, Math.min(count, questionSetInfo?.maxQuestionCount || 100)))
  }

  const handleSaveSettings = async () => {
    if (!lobbyCode || !isHost || selectedSetIds.length === 0) return
    
    setIsUpdating(true)
    setError(null)
    
    try {
      // Use socket service for real-time updates
      const currentUser = useGameStore.getState()
      const hostId = currentUser.players.find(p => p.isHost)?.id || ''
      
      socketService.updateQuestionSets(lobbyCode, hostId, selectedSetIds, questionCount)
      
      // The socket service will handle the response and update the store
      onSettingsUpdate?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update question set settings')
      console.error('Update question sets error:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#10b981'
      case 'medium': return '#f59e0b'
      case 'hard': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
  }

  if (!isHost) {
    return (
      <div className={`${styles.questionSetSelector} ${className}`}>
        <h3>Question Sets</h3>
        {questionSetInfo && (
          <div className={styles.infoDisplay}>
            <div className={styles.selectedSets}>
              {questionSetInfo.selectedSets.length > 0 ? (
                questionSetInfo.selectedSets.map(set => (
                  <div key={set.id} className={styles.setInfo}>
                    <span className={styles.setName}>{set.name}</span>
                    <span className={styles.setCount}>({set.questionCount} questions)</span>
                  </div>
                ))
              ) : (
                <p className={styles.noSets}>No question sets selected</p>
              )}
            </div>
            <div className={styles.questionCount}>
              <span>Questions per game: {questionSetInfo.selectedQuestionCount}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`${styles.questionSetSelector} ${className}`}>
      <h3>Question Set Management</h3>
      
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className={styles.loading}>Loading question sets...</div>
      ) : (
        <>
          <div className={styles.questionSetsList}>
            <h4>Available Question Sets</h4>
            {availableQuestionSets.length === 0 ? (
              <p className={styles.noSets}>No question sets available</p>
            ) : (
              availableQuestionSets.map(set => (
                <div 
                  key={set.id} 
                  className={`${styles.questionSetItem} ${selectedSetIds.includes(set.id) ? styles.selected : ''}`}
                >
                  <label className={styles.setCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedSetIds.includes(set.id)}
                      onChange={() => handleQuestionSetToggle(set.id)}
                      disabled={!set.isActive}
                    />
                    <span className={styles.checkmark}></span>
                  </label>
                  
                  <div className={styles.setDetails}>
                    <div className={styles.setHeader}>
                      <span className={styles.setName}>{set.name}</span>
                      <span 
                        className={styles.difficulty}
                        style={{ backgroundColor: getDifficultyColor(set.difficulty) }}
                      >
                        {getDifficultyLabel(set.difficulty)}
                      </span>
                    </div>
                    <div className={styles.setMeta}>
                      <span className={styles.category}>{set.category}</span>
                      <span className={styles.questionCount}>{set.questionCount} questions</span>
                    </div>
                    {!set.isActive && (
                      <span className={styles.inactive}>Inactive</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className={styles.questionCountSection}>
            <h4>Questions per Game</h4>
            <div className={styles.questionCountControl}>
              <input
                type="range"
                min="5"
                max={questionSetInfo?.maxQuestionCount || 100}
                value={questionCount}
                onChange={(e) => handleQuestionCountChange(parseInt(e.target.value))}
                className={styles.questionCountSlider}
              />
              <div className={styles.questionCountDisplay}>
                <span>{questionCount} questions</span>
                {questionSetInfo && (
                  <span className={styles.maxQuestions}>
                    (max: {questionSetInfo.maxQuestionCount})
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className={styles.actions}>
            <button
              onClick={handleSaveSettings}
              disabled={isUpdating || selectedSetIds.length === 0}
              className={styles.saveButton}
            >
              {isUpdating ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
          
          {questionSetInfo && selectedSetIds.length > 0 && (
            <div className={styles.summary}>
              <h4>Summary</h4>
              <div className={styles.summaryContent}>
                <div className={styles.selectedSets}>
                  <strong>Selected Sets:</strong>
                  {questionSetInfo.selectedSets.map(set => (
                    <div key={set.id} className={styles.setInfo}>
                      • {set.name} ({set.questionCount} questions)
                    </div>
                  ))}
                </div>
                <div className={styles.totalInfo}>
                  <div>Total Questions Available: {questionSetInfo.totalQuestions}</div>
                  <div>Questions per Game: {questionCount}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
} 