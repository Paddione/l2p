import { useGameStore } from '../stores/gameStore'
import { apiService } from './apiService'

export type GameState = 'home' | 'lobby' | 'game' | 'results' | 'error'

export interface NavigationContext {
  lobbyCode?: string
  gameState?: GameState
  error?: string
  redirectTo?: string
}

class NavigationService {
  private listeners: Array<(context: NavigationContext) => void> = []

  constructor() {
    // Listen to browser navigation
    window.addEventListener('popstate', this.handlePopState.bind(this))
    // Validate current route on initialization
    this.validateCurrentRoute()
  }

  private handlePopState() {
    this.validateCurrentRoute()
  }

  // Subscribe to navigation changes
  subscribe(callback: (context: NavigationContext) => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  private notify(context: NavigationContext) {
    this.listeners.forEach(listener => listener(context))
  }

  // Navigate to different pages with state validation
  async navigateToHome() {
    try {
      this.navigate('/')
      useGameStore.getState().resetGame()
      this.notify({ gameState: 'home' })
    } catch (error) {
      this.handleNavigationError('Failed to navigate to home', error)
    }
  }

  async navigateToLobby(lobbyCode: string) {
    try {
      // Validate lobby exists
      const response = await apiService.getLobby(lobbyCode)
      if (!response.success || !response.data) {
        throw new Error('Lobby not found')
      }

      this.navigate(`/lobby/${lobbyCode}`)
      useGameStore.getState().setLobbyCode(lobbyCode)
      this.notify({ 
        gameState: 'lobby', 
        lobbyCode 
      })
    } catch (error) {
      this.handleNavigationError('Failed to navigate to lobby', error)
    }
  }

  async navigateToGame(lobbyCode: string) {
    try {
      // Validate lobby exists and is in playing state
      const response = await apiService.getLobby(lobbyCode)
      if (!response.success || !response.data) {
        throw new Error('Lobby not found')
      }
      
      if (response.data.status !== 'playing') {
        throw new Error('Game has not started yet')
      }

      this.navigate(`/game/${lobbyCode}`)
      this.notify({ 
        gameState: 'game', 
        lobbyCode 
      })
    } catch (error) {
      this.handleNavigationError('Failed to navigate to game', error)
    }
  }

  async navigateToResults(lobbyCode: string) {
    try {
      // Validate lobby exists
      const response = await apiService.getLobby(lobbyCode)
      if (!response.success || !response.data) {
        throw new Error('Lobby not found')
      }
      
      this.navigate(`/results/${lobbyCode}`)
      this.notify({ 
        gameState: 'results', 
        lobbyCode 
      })
    } catch (error) {
      this.handleNavigationError('Failed to navigate to results', error)
    }
  }

  async leaveLobby(lobbyCode?: string) {
    try {
      // TODO: Call API to leave lobby if lobbyCode is provided
      if (lobbyCode) {
        console.log(`Leaving lobby: ${lobbyCode}`)
        // TODO: Implement actual API call to leave specific lobby
      }
      // For now, just navigate to home
      await this.navigateToHome()
    } catch (error) {
      this.handleNavigationError('Failed to leave lobby', error)
    }
  }

  // Navigation based on game state changes
  async handleGameStateChange() {
    try {
      const gameStore = useGameStore.getState()
      const currentPath = window.location.pathname

      // Auto-navigate based on game state
      if (gameStore.gameStarted && !currentPath.includes('/game/')) {
        if (gameStore.lobbyCode) {
          await this.navigateToGame(gameStore.lobbyCode)
        }
      } else if (gameStore.gameEnded && !currentPath.includes('/results/')) {
        if (gameStore.lobbyCode) {
          await this.navigateToResults(gameStore.lobbyCode)
        }
      }
    } catch (error) {
      this.handleNavigationError('Failed to handle game state change', error)
    }
  }

  // Validate current route - now public
  async validateCurrentRoute() {
    const currentState = this.getCurrentGameState()
    this.notify({ gameState: currentState })
  }

  // Navigate method helper
  private navigate(path: string) {
    window.history.pushState({}, '', path)
  }

  // Error handling with consistent message format
  private handleNavigationError(context: string, error: unknown, isCritical = false) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Navigation error - ${context}:`, error)
    
    useGameStore.getState().setError(`${context}: ${errorMessage}`)
    this.notify({ 
      gameState: 'error', 
      error: errorMessage 
    })

    if (isCritical) {
      this.navigate('/error')
    }
  }

  // Get current game state based on URL
  getCurrentGameState(): GameState {
    const path = window.location.pathname
    
    if (path === '/') return 'home'
    if (path.includes('/lobby/')) return 'lobby'
    if (path.includes('/game/')) return 'game'
    if (path.includes('/results/')) return 'results'
    
    return 'home'
  }

  // Get lobby code from current URL
  getCurrentLobbyCode(): string | null {
    const match = window.location.pathname.match(/\/(lobby|game|results)\/([A-Z0-9]{6})/)
    return match ? match[2] : null
  }

  // Extract lobby code from a given path
  extractLobbyCodeFromPath(path: string): string | null {
    const match = path.match(/^\/(?:lobby|game|results)\/([A-Z0-9]{6,8})$/)
    return match ? match[1] : null
  }

  // Validate lobby code format
  isValidLobbyCode(code: string): boolean {
    return /^[A-Z0-9]{6,8}$/.test(code)
  }

  // Authentication check - redirects to home if not authenticated
  private requireAuthentication(): boolean {
    if (!apiService.isAuthenticated()) {
      console.warn('Authentication required - redirecting to home')
      this.navigate('/')
      return false
    }
    return true
  }

  // Cleanup
  destroy() {
    window.removeEventListener('popstate', this.handlePopState.bind(this))
    this.listeners = []
  }
}

// Export singleton instance
export const navigationService = new NavigationService() 