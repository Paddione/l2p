import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { Lobby } from '../components/lobby/Lobby';
import { LobbyCreation } from '../components/lobby/LobbyCreation';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const Header = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 2rem;
  font-weight: 700;
`;

const ErrorMessage = styled.div`
  background: ${({ theme }) => theme.colors.error}15;
  border: 1px solid ${({ theme }) => theme.colors.error};
  color: ${({ theme }) => theme.colors.error};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
`;

export function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    currentLobby, 
    joinLobby,
    leaveLobby,
    startGame 
  } = useGameStore();
  
  const [showCreation, setShowCreation] = useState(!code);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // WebSocket connection for real-time updates
  const { socket, isConnected } = useWebSocket();

  // Effect to handle lobby code from URL
  useEffect(() => {
    if (code && !currentLobby) {
      handleJoinLobby(code);
    }
  }, [code, currentLobby]);

  // WebSocket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleLobbyUpdate = (lobbyData: any) => {
      console.log('Lobby updated:', lobbyData);
    };

    const handlePlayerJoined = (playerData: any) => {
      console.log('Player joined:', playerData);
    };

    const handlePlayerLeft = (playerId: string) => {
      console.log('Player left:', playerId);
    };

    const handleGameStart = (gameData: any) => {
      navigate(`/game/${gameData.code}`);
    };

    const handleLobbyError = (errorData: any) => {
      setError(errorData.message || 'An error occurred');
      setIsLoading(false);
    };

    // Subscribe to events
    socket.on('lobby:updated', handleLobbyUpdate);
    socket.on('player:joined', handlePlayerJoined);
    socket.on('player:left', handlePlayerLeft);
    socket.on('game:start', handleGameStart);
    socket.on('lobby:error', handleLobbyError);

    return () => {
      socket.off('lobby:updated', handleLobbyUpdate);
      socket.off('player:joined', handlePlayerJoined);
      socket.off('player:left', handlePlayerLeft);
      socket.off('game:start', handleGameStart);
      socket.off('lobby:error', handleLobbyError);
    };
  }, [socket, isConnected, currentLobby, navigate]);

  const handleJoinLobby = async (lobbyCode: string) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await joinLobby(lobbyCode, { 
        username: user.username, 
        character: user.character 
      });
      setShowCreation(false);
      
      // Emit join event to WebSocket
      if (socket && isConnected) {
        socket.emit('lobby:join', { code: lobbyCode, player: user });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join lobby');
    } finally {
      setIsLoading(false);
    }
  };



  const handleLeaveLobby = async () => {
    if (!currentLobby || !user) return;
    
    try {
      await leaveLobby(currentLobby.code, user.username);
      
      // Emit leave event to WebSocket
      if (socket && isConnected) {
        socket.emit('lobby:leave', { code: currentLobby.code, playerId: user.username });
      }
      
      navigate('/lobby', { replace: true });
      setShowCreation(true);
    } catch (err: any) {
      setError(err.message || 'Failed to leave lobby');
    }
  };

  const handleStartGame = async () => {
    if (!currentLobby || !user) return;
    
    try {
      await startGame(currentLobby.code);
      
      // Emit start game event to WebSocket
      if (socket && isConnected) {
        socket.emit('game:start', { code: currentLobby.code });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start game');
    }
  };

  if (isLoading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner size="large" />
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          {currentLobby ? `Lobby: ${currentLobby.code}` : 'Game Lobby'}
        </Title>
        {currentLobby && (
          <Button 
            variant="outline" 
            onClick={handleLeaveLobby}
          >
            Leave Lobby
          </Button>
        )}
      </Header>

      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}

      {!isConnected && (
        <ErrorMessage>
          Connecting to game server...
        </ErrorMessage>
      )}

      {showCreation && (
                <LobbyCreation
          onLobbyCreated={(code) => handleJoinLobby(code)}
          onCancel={() => setShowCreation(false)}
        />
      )}

      {currentLobby && (
        <Lobby
          lobby={currentLobby}
          currentUsername={user?.username}
          onStart={handleStartGame}
          onLeave={handleLeaveLobby}
        />
      )}
    </Container>
  );
} 