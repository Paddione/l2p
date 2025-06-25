import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { QuestionDisplay } from '../components/game/QuestionDisplay';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';

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

export function GamePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
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
    setLoading
  } = useGameStore();

  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<'waiting' | 'playing' | 'finished'>('waiting');

  // WebSocket connection for real-time updates
  const { socket, isConnected } = useWebSocket();

  // Initialize game when component mounts
  useEffect(() => {
    if (!code || !user) {
      navigate('/lobby');
      return;
    }

    // Initialize game state
    setLoading(true);
    
    // Try to get game state from API or WebSocket
    if (socket && isConnected) {
      socket.emit('game:join', { code, player: user });
    }
  }, [code, user, socket, isConnected, navigate, setLoading]);

  // WebSocket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleGameState = (_gameData: any) => {
      setGamePhase('playing');
      setLoading(false);
      setConnectionError(null);
    };

    const handleQuestionStart = (_questionData: any) => {
      // Update question state through the store
      setGamePhase('playing');
    };

    const handleTimerUpdate = (timeData: { timeRemaining: number }) => {
      updateTimer(timeData.timeRemaining);
    };

    const handlePlayerAnswer = (answerData: any) => {
      // Handle other players' answers
      console.log('Player answered:', answerData);
    };

    const handleQuestionEnd = (resultsData: any) => {
      // Show question results
      console.log('Question ended:', resultsData);
    };

    const handleGameEnd = (_finalResults: any) => {
      setGamePhase('finished');
      navigate(`/lobby/${code}?game=finished`);
    };

    const handleGameError = (errorData: any) => {
      setConnectionError(errorData.message || 'Game error occurred');
      setLoading(false);
    };

    const handlePlayerDisconnected = (playerData: any) => {
      console.log('Player disconnected:', playerData);
    };

    // Subscribe to events
    socket.on('game:state', handleGameState);
    socket.on('question:start', handleQuestionStart);
    socket.on('timer:update', handleTimerUpdate);
    socket.on('player:answered', handlePlayerAnswer);
    socket.on('question:end', handleQuestionEnd);
    socket.on('game:end', handleGameEnd);
    socket.on('game:error', handleGameError);
    socket.on('player:disconnected', handlePlayerDisconnected);

    return () => {
      socket.off('game:state', handleGameState);
      socket.off('question:start', handleQuestionStart);
      socket.off('timer:update', handleTimerUpdate);
      socket.off('player:answered', handlePlayerAnswer);
      socket.off('question:end', handleQuestionEnd);
      socket.off('game:end', handleGameEnd);
      socket.off('game:error', handleGameError);
      socket.off('player:disconnected', handlePlayerDisconnected);
    };
  }, [socket, isConnected, code, navigate, updateTimer, setLoading]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (hasAnswered || !currentQuestion) return;
    
    setAnswer(answerIndex);
  };

  const handleAnswerSubmit = async () => {
    if (selectedAnswer === null || hasAnswered || !currentQuestion) return;

    try {
      await submitAnswer(selectedAnswer);
      
      // Emit answer to WebSocket
      if (socket && isConnected) {
        socket.emit('player:answer', {
          code,
          questionId: currentQuestion.id,
          answer: selectedAnswer,
          timeElapsed: timer.totalTime - timer.timeRemaining
        });
      }
    } catch (err: any) {
      setConnectionError(err.message || 'Failed to submit answer');
    }
  };

  const handleLeaveGame = () => {
    if (socket && isConnected) {
      socket.emit('game:leave', { code });
    }
    navigate('/lobby');
  };

  // Loading state
  if (isLoading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner size="large" />
          <LoadingText>
            {gamePhase === 'waiting' ? 'Connecting to game...' : 'Loading question...'}
          </LoadingText>
        </LoadingContainer>
      </Container>
    );
  }

  // Game finished state
  if (gamePhase === 'finished' || gameResults) {
    return (
      <Container>
        <GameOverContainer>
          <GameOverTitle>Game Over!</GameOverTitle>
          <ScoreDisplay>
            <ScoreLabel>Final Score</ScoreLabel>
            <ScoreValue>{playerScore}</ScoreValue>
          </ScoreDisplay>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Button onClick={() => navigate('/lobby')}>
              Back to Lobby
            </Button>
            <Button variant="outline" onClick={() => navigate('/hall-of-fame')}>
              View Hall of Fame
            </Button>
          </div>
        </GameOverContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <GameInfo>
          <Title>Game: {code}</Title>
          <Subtitle>
            Question {questionNumber} of {totalQuestions}
          </Subtitle>
        </GameInfo>
        
        <PlayerInfo>
          <ScoreDisplay>
            <ScoreLabel>Score</ScoreLabel>
            <ScoreValue>{playerScore}</ScoreValue>
          </ScoreDisplay>
          <MultiplierDisplay active={playerMultiplier > 1}>
            {playerMultiplier}x Multiplier
          </MultiplierDisplay>
          <Button 
            variant="outline" 
            size="small" 
            onClick={handleLeaveGame}
          >
            Leave Game
          </Button>
        </PlayerInfo>
      </Header>

      {(error || connectionError) && (
        <ErrorMessage>
          {error || connectionError}
        </ErrorMessage>
      )}

      {!isConnected && (
        <ErrorMessage>
          Connection lost. Attempting to reconnect...
        </ErrorMessage>
      )}

      {currentQuestion && gamePhase === 'playing' && (
        <QuestionDisplay
          question={currentQuestion}
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
          selectedAnswer={selectedAnswer ?? undefined}
          hasAnswered={hasAnswered}
          timeRemaining={timer.timeRemaining}
          totalTime={timer.totalTime}
          currentScore={playerScore}
          onAnswerSelect={handleAnswerSelect}
          onSubmitAnswer={handleAnswerSubmit}
        />
      )}
    </Container>
  );
} 