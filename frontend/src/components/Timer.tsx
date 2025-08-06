import React, { useEffect, useState, useCallback } from 'react'
import { performanceOptimizer } from '../services/performanceOptimizer'
import styles from '../styles/Timer.module.css'

interface TimerProps {
  timeRemaining: number
  totalTime?: number
  isRunning?: boolean
  onTimeUp?: () => void
  showProgress?: boolean
  className?: string
}

export const Timer: React.FC<TimerProps> = ({
  timeRemaining,
  totalTime = 60,
  isRunning = true,
  onTimeUp,
  showProgress = true,
  className = ''
}) => {
  const [isWarning, setIsWarning] = useState(false)
  const [isCritical, setIsCritical] = useState(false)

  // Calculate progress percentage
  const progress = ((totalTime - timeRemaining) / totalTime) * 100

  // Throttled warning state updates
  const updateWarningStates = useCallback(
    performanceOptimizer.throttle('timer-warning-updates', (time: number) => {
      setIsWarning(time <= 10 && time > 5)
      setIsCritical(time <= 5)
    }, 100), // Update every 100ms max
    []
  )

  // Update warning states based on time remaining
  useEffect(() => {
    updateWarningStates(timeRemaining)
  }, [timeRemaining, updateWarningStates])

  // Handle time up
  useEffect(() => {
    if (timeRemaining <= 0 && onTimeUp) {
      onTimeUp()
    }
  }, [timeRemaining, onTimeUp])

  // Format time display
  const formatTime = (seconds: number): string => {
    // Handle negative time by showing 0:00
    if (seconds < 0) {
      return '0:00'
    }
    
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`${styles.timerContainer} ${className}`}>
      <div className={styles.timerDisplay}>
        <div 
          className={`${styles.timeText} ${
            isCritical ? `${styles.critical} critical` : 
            isWarning ? `${styles.warning} warning` : ''
          }`}
          data-testid="timer-display"
        >
          {formatTime(timeRemaining)}
        </div>
        
        {showProgress && (
          <div className={styles.progressContainer}>
            <div 
              className={`${styles.progressBar} ${
                isCritical ? styles.critical : 
                isWarning ? styles.warning : ''
              }`}
              style={{ width: `${progress}%` }}
              data-testid="timer-progress"
            />
          </div>
        )}
      </div>
      
      {isRunning && (
        <div className={`${styles.statusIndicator} ${styles.running} running`}>
          ●
        </div>
      )}
    </div>
  )
} 