import React from 'react'
import { useGameStore } from '../stores/gameStore'
import { LevelUpNotification } from './LevelUpNotification'

export const LevelUpNotificationManager: React.FC = () => {
  const { levelUpNotifications, removeLevelUpNotification } = useGameStore()

  const handleCloseNotification = (index: number) => {
    removeLevelUpNotification(index)
  }

  if (levelUpNotifications.length === 0) {
    return null
  }

  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
      {levelUpNotifications.map((notification, index) => (
        <div
          key={`${notification.playerId}-${notification.newLevel}-${index}`}
          style={{
            marginBottom: '10px',
            transform: `translateY(${index * 10}px)`
          }}
        >
          <LevelUpNotification
            notification={notification}
            onClose={() => handleCloseNotification(index)}
          />
        </div>
      ))}
    </div>
  )
} 