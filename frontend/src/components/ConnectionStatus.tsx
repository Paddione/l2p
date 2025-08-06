import React, { useEffect, useState } from 'react'
import { socketService } from '../services/socketService'
import styles from '../styles/ConnectionStatus.module.css'

interface ConnectionStatusProps {
  className?: string
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const updateStatus = () => {
      setStatus(socketService.getConnectionStatus())
    }

    // Update status immediately
    updateStatus()

    // Set up interval to check status
    const interval = setInterval(updateStatus, 1000)

    // Listen for connection events
    const handleConnect = () => {
      setStatus('connected')
      setError(null)
    }

    const handleDisconnect = () => {
      setStatus('disconnected')
    }

    const handleConnectError = () => {
      setStatus('connecting')
      setError('Connection failed. Retrying...')
    }

    socketService.on('connect', handleConnect)
    socketService.on('disconnect', handleDisconnect)
    socketService.on('connect_error', handleConnectError)

    return () => {
      clearInterval(interval)
      socketService.off('connect', handleConnect)
      socketService.off('disconnect', handleDisconnect)
      socketService.off('connect_error', handleConnectError)
    }
  }, [])

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return styles.connected
      case 'connecting':
        return styles.connecting
      case 'disconnected':
        return styles.disconnected
      default:
        return styles.disconnected
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'disconnected':
        return 'Disconnected'
      default:
        return 'Unknown'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return '●'
      case 'connecting':
        return '⟳'
      case 'disconnected':
        return '○'
      default:
        return '○'
    }
  }

  return (
    <div className={`${styles.connectionStatus} ${className}`} data-testid="connection-status" data-status={status}>
      <div className={`${styles.statusIndicator} ${getStatusColor()}`}>
        <span className={styles.statusIcon}>{getStatusIcon()}</span>
        <span className={styles.statusText}>{getStatusText()}</span>
      </div>
      
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
    </div>
  )
} 