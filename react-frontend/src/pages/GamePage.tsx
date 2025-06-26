import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { QuestionDisplay } from '../components/game/QuestionDisplay';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { useNotification } from '../components/ui/NotificationProvider';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
`;

const GameInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1rem;
  margin: 0;
`;

const PlayerInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ScoreDisplay = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
`;

const ScoreLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
  font-weight: 500;
`;

const ScoreValue = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.5rem;
  font-weight: 700;
`;

const MultiplierDisplay = styled.div<{ active?: boolean }>`
  background: ${({ theme, active }) => 
    active ? theme.colors.warning : theme.colors.background.secondary};
  color: ${({ theme, active }) => 
    active ? '#000' : theme.colors.text.secondary};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 0.875rem;
  font-weight: 600;
  transition: all ${({ theme }) => theme.transitions.fast};
`;

const TimerDisplay = styled.div<{ urgent?: boolean }>`
  background: ${({ theme, urgent }) => 
    urgent ? theme.colors.error : theme.colors.background.paper};
  color: ${({ theme, urgent }) => 
    urgent ? '#fff' : theme.colors.text.primary};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 1.25rem;
  font-weight: 700;
  text-align: center;
  min-width: 80px;
  transition: all ${({ theme }) => theme.transitions.fast};
  ${({ urgent }) => urgent && 'animation: pulse 1s infinite;'}
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

const ConnectionStatus = styled.div<{ connected: boolean }>`
  position: fixed;
  top: 20px;
  right: 20px;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: ${({ theme, connected }) => 
    connected ? theme.colors.success : theme.colors.error};
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  z-index: 1000;
  transition: all ${({ theme }) => theme.transitions.fast};
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
  min-height: 400px;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const LoadingText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1.125rem;
`;

const GameOverContainer = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const GameOverTitle = styled.h2`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const PlayersList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const PlayerCard = styled.div<{ isCurrentUser?: boolean }>`
  background: ${({ theme, isCurrentUser }) => 
    isCurrentUser ? theme.colors.primary + '15' : theme.colors.background.paper};
  border: 2px solid ${({ theme, isCurrentUser }) => 
    isCurrentUser ? theme.colors.primary : 'transparent'};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const PlayerName = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const PlayerScore = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
`;

export function GamePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showError, showSuccess, showWarning } = useNotification();
  const { 
    currentLobby,
    gameState,
    currentQuestion,
    questionNumber,
    totalQuestions,
    timer,
    hasAnswered,
    selectedAnswer,
    playerScore,
    playerMultiplier,
    gameResults,
    isLoading,
    error,
    submitAnswer,
    setAnswer,
    updateTimer,
    setLoading,
    updateLobby,
    updateScore,
    updateMultiplier
  } = useGameStore();

  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<'waiting' | 'question' | 'results' | 'finished'>('waiting');
  const [players, setPlayers] = useState<any[]>([]);

  // WebSocket connection for real-time updates
  const { socket, isConnected, subscribe } = useWebSocket();

  // Handle WebSocket authentication and initial connection
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    // Authenticate with the WebSocket server
    const token = localStorage.getItem('jwtToken');
    if (token) {
      socket.emit('authenticate', { token, username: user.username });
    }
  }, [socket, isConnected, user]);

  // WebSocket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Authentication success handler
    const unsubscribeAuth = subscribe('authenticated', (data) => {
      console.log('WebSocket authenticated:', data);
      setConnectionError(null);
      
      // Join the game room
      if (code) {
        socket.emit('join_game', { lobbyCode: code });
      }
    });

    // Authentication error handler  
    const unsubscribeAuthError = subscribe('authentication_error', (data) => {
      console.error('WebSocket authentication error:', data);
      setConnectionError('Authentication failed');
             showError('Authentication Failed', 'Failed to authenticate with game server');
    });

    // Game room joined handler
    const unsubscribeGameJoined = subscribe('game_joined', (data) => {
      console.log('Joined game room:', data);
      setConnectionError(null);
    });

    // Main game update handler
    const unsubscribeGameUpdate = subscribe('game_updated', (lobbyData) => {
      console.log('Game state updated:', lobbyData);
      
      if (lobbyData) {
        updateLobby(lobbyData);
        
        // Update players list
        if (lobbyData.players) {
          setPlayers(lobbyData.players);
        }
        
        // Update game phase
        if (lobbyData.game_phase) {
          setGamePhase(lobbyData.game_phase);
        }
        
        // Update question progression
        if (lobbyData.current_question !== undefined) {
          // The backend handles question progression
        }
        
        // Update player scores
        const currentPlayer = lobbyData.players?.find((p: any) => p.username === user?.username);
        if (currentPlayer) {
          updateScore(currentPlayer.score || 0);
          updateMultiplier(currentPlayer.multiplier || 1);
        }
        
        // Handle game phase transitions
        if (lobbyData.game_phase === 'question' && lobbyData.question_start_time) {
          // Start question timer
          startQuestionTimer(lobbyData.question_start_time);
                 } else if (lobbyData.game_phase === 'finished') {
           setGamePhase('finished');
           showSuccess('Game Complete', 'Game completed!');
         }
      }
      
      setLoading(false);
    });

         // Error handler
     const unsubscribeError = subscribe('error', (data) => {
       console.error('WebSocket error:', data);
       setConnectionError(data.message || 'Connection error');
       showError('Game Error', data.message || 'Game server error');
     });

     // Player disconnection handler
     const unsubscribePlayerDisconnected = subscribe('player_disconnected', (data) => {
       console.log('Player disconnected:', data);
       showWarning('Player Disconnected', `${data.username} has disconnected`);
     });

    return () => {
      unsubscribeAuth();
      unsubscribeAuthError();
      unsubscribeGameJoined();
      unsubscribeGameUpdate();
      unsubscribeError();
      unsubscribePlayerDisconnected();
    };
  }, [socket, isConnected, subscribe, code, user, updateLobby, updateScore, updateMultiplier, setLoading]);

  // Timer management for questions
  const startQuestionTimer = useCallback((questionStartTime: string) => {
    const startTime = new Date(questionStartTime);
    const questionDuration = 60; // 60 seconds per question
    
    const updateTimerInterval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const remaining = Math.max(0, questionDuration - elapsed);
      
      updateTimer(remaining);
      
      if (remaining <= 0) {
        clearInterval(updateTimerInterval);
      }
    }, 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(updateTimerInterval);
  }, [updateTimer]);

  // Initialize game when component mounts
  useEffect(() => {
    if (!code || !user) {
      navigate('/lobby');
      return;
    }

    setLoading(true);
  }, [code, user, navigate, setLoading]);

  // Handle answer selection
  const handleAnswerSelect = (answerIndex: number) => {
    if (hasAnswered) return;
    setAnswer(answerIndex);
  };

  // Handle answer submission
  const handleAnswerSubmit = async () => {
    if (selectedAnswer === null || hasAnswered) return;

    try {
      await submitAnswer(selectedAnswer);
      showSuccess('Answer Submitted', 'Answer submitted successfully!');
    } catch (error) {
      console.error('Failed to submit answer:', error);
      showError('Submission Failed', 'Failed to submit answer. Please try again.');
    }
  };

  // Handle leaving the game
  const handleLeaveGame = () => {
    if (socket && code) {
      socket.emit('leave_game', { lobbyCode: code });
    }
    navigate('/lobby');
  };

  // Loading state
  if (isLoading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner size="large" />
          <LoadingText>Connecting to game...</LoadingText>
        </LoadingContainer>
      </Container>
    );
  }

  // Error state
  if (error || connectionError) {
    return (
      <Container>
        <ErrorMessage>
          {error || connectionError}
        </ErrorMessage>
        <Button onClick={() => navigate('/lobby')}>
          Back to Lobby
        </Button>
      </Container>
    );
  }

  // Game finished state
  if (gamePhase === 'finished') {
    return (
      <Container>
        <GameOverContainer>
          <GameOverTitle>🎉 Game Completed!</GameOverTitle>
          <PlayersList>
            {players
              .sort((a, b) => (b.score || 0) - (a.score || 0))
              .map((player, index) => (
                <PlayerCard key={player.username} isCurrentUser={player.username === user?.username}>
                  <PlayerName>
                    {index === 0 ? '🏆 ' : `${index + 1}. `}
                    {player.character} {player.username}
                  </PlayerName>
                  <PlayerScore>{player.score || 0} points</PlayerScore>
                </PlayerCard>
              ))}
          </PlayersList>
          <Button onClick={() => navigate('/hall-of-fame')}>
            View Hall of Fame
          </Button>
          <Button variant="secondary" onClick={() => navigate('/lobby')}>
            Back to Lobby
          </Button>
        </GameOverContainer>
      </Container>
    );
  }

  return (
    <Container>
      {/* Connection Status Indicator */}
      <ConnectionStatus connected={isConnected}>
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </ConnectionStatus>

      {/* Game Header */}
      <Header>
        <GameInfo>
          <Title>Game Room: {code}</Title>
          <Subtitle>
            {gamePhase === 'waiting' && 'Waiting for game to start...'}
            {gamePhase === 'question' && `Question ${(currentLobby?.current_question || 0) + 1} of ${currentLobby?.questions?.length || 0}`}
            {gamePhase === 'results' && 'Viewing Results...'}
          </Subtitle>
        </GameInfo>
        
        <PlayerInfo>
          <ScoreDisplay>
            <ScoreLabel>Your Score</ScoreLabel>
            <ScoreValue>{playerScore}</ScoreValue>
          </ScoreDisplay>
          
          <MultiplierDisplay active={playerMultiplier > 1}>
            {playerMultiplier}x Multiplier
          </MultiplierDisplay>
          
          {gamePhase === 'question' && (
            <TimerDisplay urgent={timer.timeRemaining <= 10}>
              {timer.timeRemaining}s
            </TimerDisplay>
          )}
        </PlayerInfo>
      </Header>

      {/* Players List */}
      {players.length > 0 && (
        <PlayersList>
          {players.map(player => (
            <PlayerCard key={player.username} isCurrentUser={player.username === user?.username}>
              <PlayerName>
                {player.character} {player.username}
                {player.is_host && ' 👑'}
                {player.answered && gamePhase === 'question' && ' ✅'}
              </PlayerName>
              <PlayerScore>{player.score || 0} points</PlayerScore>
            </PlayerCard>
          ))}
        </PlayersList>
      )}

      {/* Game Content */}
      {gamePhase === 'question' && currentLobby?.questions && currentLobby.current_question !== undefined && currentLobby.questions[currentLobby.current_question] && (
        <QuestionDisplay
          question={currentLobby.questions[currentLobby.current_question]}
          questionNumber={(currentLobby.current_question || 0) + 1}
          totalQuestions={currentLobby.questions?.length || 0}
          timeRemaining={timer.timeRemaining}
          selectedAnswer={selectedAnswer ?? undefined}
          hasAnswered={hasAnswered}
          onSelectAnswer={handleAnswerSelect}
          onSubmitAnswer={handleAnswerSubmit}
        />
      )}

      {/* Waiting state */}
      {gamePhase === 'waiting' && (
        <LoadingContainer>
          <LoadingSpinner size="large" />
          <LoadingText>Game will start soon...</LoadingText>
        </LoadingContainer>
      )}

      {/* Leave Game Button */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Button variant="secondary" onClick={handleLeaveGame}>
          Leave Game
        </Button>
      </div>
    </Container>
  );
} 