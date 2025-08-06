import { render, screen, act } from '@testing-library/react'
import { PlayerGrid } from '@/components/PlayerGrid'

// Mock services that use import.meta
jest.mock('../../services/apiService', () => ({
  apiService: {
    getQuestionSets: jest.fn(),
    getLobby: jest.fn(),
    isAuthenticated: jest.fn(),
    // Add other methods as needed
  }
}));

jest.mock('../../services/socketService', () => ({
  socketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    // Add other methods as needed
  }
}));

const mockPlayers = [
  { 
    id: '1', 
    username: 'Alice', 
    character: 'wizard', 
    isReady: true, 
    isHost: true, 
    score: 1250, 
    multiplier: 3, 
    correctAnswers: 5, 
    isConnected: true 
  },
  { 
    id: '2', 
    username: 'Bob', 
    character: 'knight', 
    isReady: true, 
    isHost: false, 
    score: 890, 
    multiplier: 2, 
    correctAnswers: 3, 
    isConnected: true 
  },
  { 
    id: '3', 
    username: 'Charlie', 
    character: 'archer', 
    isReady: false, 
    isHost: false, 
    score: 0, 
    multiplier: 1, 
    correctAnswers: 0, 
    isConnected: true 
  },
  { 
    id: '4', 
    username: 'Diana', 
    character: 'mage', 
    isReady: true, 
    isHost: false, 
    score: 2100, 
    multiplier: 5, 
    correctAnswers: 7, 
    isConnected: false 
  }
]

describe('PlayerGrid Component', () => {
  it('renders without crashing', () => {
    render(<PlayerGrid players={[]} />)
    expect(screen.getByTestId('empty-slot-0')).toBeInTheDocument()
  })

  it('displays all players', () => {
    render(<PlayerGrid players={mockPlayers} />)
    
    mockPlayers.forEach(player => {
      expect(screen.getByText(player.username)).toBeInTheDocument()
    })
  })

  it('shows host indicator for host player', () => {
    render(<PlayerGrid players={mockPlayers} />)
    
    const hostPlayer = screen.getByTestId('player-1')
    expect(hostPlayer).toHaveTextContent('👑') // Crown emoji for host
  })

  it('displays ready status correctly', () => {
    render(<PlayerGrid players={mockPlayers} />)
    
    const readyPlayers = mockPlayers.filter(p => p.isReady)
    readyPlayers.forEach(player => {
      const playerCard = screen.getByTestId(`player-${player.id}`)
      expect(playerCard).toHaveTextContent('✓')
    })
  })

  it('shows disconnection indicator', () => {
    render(<PlayerGrid players={mockPlayers} />)
    
    const disconnectedPlayer = screen.getByTestId('player-4')
    expect(disconnectedPlayer).toHaveTextContent('🔌')
  })

  it('displays character names as fallback', () => {
    render(<PlayerGrid players={mockPlayers} />)
    
    // Since images will fail to load in test environment, character names should be visible
    mockPlayers.forEach(player => {
      expect(screen.getByText(player.character)).toBeInTheDocument()
    })
  })

  it('displays scores for all players', () => {
    render(<PlayerGrid players={mockPlayers} />)
    
    expect(screen.getByText('1250')).toBeInTheDocument()
    expect(screen.getByText('890')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('2100')).toBeInTheDocument()
  })

  it('shows multipliers when > 1', () => {
    render(<PlayerGrid players={mockPlayers} />)
    
    expect(screen.getByText('×3')).toBeInTheDocument()
    expect(screen.getByText('×2')).toBeInTheDocument()
    expect(screen.queryByText('×1')).not.toBeInTheDocument() // 1x multiplier not shown
    expect(screen.getByText('×5')).toBeInTheDocument()
  })

  it('handles empty players list', () => {
    render(<PlayerGrid players={[]} />)
    
    const emptySlots = screen.getAllByText('Empty')
    expect(emptySlots).toHaveLength(8) // Default maxPlayers
  })

  it('shows placeholder slots for missing players', () => {
    const twoPlayers = mockPlayers.slice(0, 2)
    render(<PlayerGrid players={twoPlayers} maxPlayers={4} />)
    
    const emptySlots = screen.getAllByText('Empty')
    expect(emptySlots).toHaveLength(2)
  })

  it('applies custom className', () => {
    const { container } = render(<PlayerGrid players={mockPlayers} className="custom-grid" />)
    
    expect(container.firstChild).toHaveClass('custom-grid')
  })

  it('displays correct answers count as streak', () => {
    render(<PlayerGrid players={mockPlayers} />)
    
    expect(screen.getByText('🔥 5')).toBeInTheDocument()
    expect(screen.getByText('🔥 3')).toBeInTheDocument()
    expect(screen.getByText('🔥 7')).toBeInTheDocument()
    expect(screen.queryByText('🔥 0')).not.toBeInTheDocument() // Zero streak not shown
  })

  it('can hide scores', () => {
    render(<PlayerGrid players={mockPlayers} showScores={false} />)
    
    expect(screen.queryByText('1250')).not.toBeInTheDocument()
    expect(screen.queryByText('890')).not.toBeInTheDocument()
  })

  it('can hide multipliers', () => {
    render(<PlayerGrid players={mockPlayers} showMultipliers={false} />)
    
    expect(screen.queryByText('×3')).not.toBeInTheDocument()
    expect(screen.queryByText('×2')).not.toBeInTheDocument()
  })

  it('respects maxPlayers setting', () => {
    render(<PlayerGrid players={mockPlayers} maxPlayers={6} />)
    
    const allSlots = screen.getAllByTestId(/^(player-|empty-slot-)/);
    expect(allSlots).toHaveLength(6)
  })

  it('handles players with zero scores', () => {
    render(<PlayerGrid players={mockPlayers} />)
    
    const charlieSlot = screen.getByTestId('player-3')
    expect(charlieSlot).toHaveTextContent('Charlie')
    expect(charlieSlot).toHaveTextContent('0')
  })

  it('handles image load errors with fallback', () => {
    render(<PlayerGrid players={mockPlayers} />)
    
    const avatarImage = screen.getByAltText('wizard')
    
    // Simulate image load error
    act(() => {
      const errorEvent = new Event('error')
      Object.defineProperty(errorEvent, 'target', {
        value: {
          style: { display: '' },
          nextElementSibling: {
            classList: {
              remove: jest.fn()
            }
          }
        }
      })
      avatarImage.dispatchEvent(errorEvent)
    })
    
    // Image should be hidden and character name should be shown
    expect(avatarImage.style.display).toBe('none')
  })
}) 