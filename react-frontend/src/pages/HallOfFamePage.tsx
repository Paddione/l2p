import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
// import apiClient from '../services/api';
import type { Leaderboard, LeaderboardEntry } from '../types/api';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1.125rem;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const FilterSection = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
`;

const FilterButton = styled(Button)<{ active?: boolean }>`
  ${({ active, theme }) => active && `
    background: ${theme.colors.primary};
    color: white;
    border-color: ${theme.colors.primary};
  `}
`;

const LeaderboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
`;

const LeaderboardCard = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  overflow: hidden;
`;

const CardHeader = styled.div`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`;

const CardSubtitle = styled.p`
  font-size: 0.875rem;
  opacity: 0.9;
  margin: 0.5rem 0 0 0;
`;

const LeaderboardList = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const LeaderboardItem = styled.div<{ isCurrentUser?: boolean }>`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  ${({ isCurrentUser, theme }) => isCurrentUser && `
    background: ${theme.colors.primary}10;
    border: 1px solid ${theme.colors.primary}30;
  `}
  
  &:hover {
    background: ${({ theme }) => theme.colors.background.secondary};
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Rank = styled.div<{ rank: number }>`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  margin-right: ${({ theme }) => theme.spacing.md};
  
  ${({ rank, theme }) => {
    if (rank === 1) return `background: #FFD700; color: #000;`;
    if (rank === 2) return `background: #C0C0C0; color: #000;`;
    if (rank === 3) return `background: #CD7F32; color: #000;`;
    return `background: ${theme.colors.background.secondary}; color: ${theme.colors.text.primary};`;
  }}
`;

const PlayerInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const PlayerName = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const PlayerCharacter = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Score = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
`;

const ScoreValue = styled.span`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
`;

const ScoreDetails = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ErrorMessage = styled.div`
  background: ${({ theme }) => theme.colors.error}15;
  border: 1px solid ${({ theme }) => theme.colors.error};
  color: ${({ theme }) => theme.colors.error};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

type FilterType = 'all' | 'today' | 'week' | 'month';

export function HallOfFamePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<FilterType>('all');
  
  const {
    data: leaderboards,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['leaderboards', filter],
    queryFn: async () => {
      // Mock implementation - in real app this would call the API
      const mockLeaderboards: Leaderboard[] = [
        {
          questionSet: 'General Knowledge',
          lastUpdated: new Date().toISOString(),
          entries: [
            { username: 'Player1', character: 'wizard', score: 1250, questionsCorrect: 8, totalQuestions: 10 },
            { username: 'Player2', character: 'knight', score: 1100, questionsCorrect: 7, totalQuestions: 10 },
            { username: 'Player3', character: 'archer', score: 950, questionsCorrect: 6, totalQuestions: 10 },
          ]
        },
        {
          questionSet: 'Science & Technology',
          lastUpdated: new Date().toISOString(),
          entries: [
            { username: 'TechGuru', character: 'robot', score: 1400, questionsCorrect: 9, totalQuestions: 10 },
            { username: 'CodeMaster', character: 'wizard', score: 1200, questionsCorrect: 8, totalQuestions: 10 },
          ]
        }
      ];
      return mockLeaderboards;
    },
    refetchInterval: 30000,
  });

  const formatScore = (score: number): string => {
    return score.toLocaleString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderLeaderboardCard = (leaderboard: Leaderboard) => (
    <LeaderboardCard key={leaderboard.questionSet}>
      <CardHeader>
        <CardTitle>{leaderboard.questionSet}</CardTitle>
        <CardSubtitle>
          {leaderboard.entries.length} players • Updated {formatDate(leaderboard.lastUpdated)}
        </CardSubtitle>
      </CardHeader>
      <LeaderboardList>
        {leaderboard.entries.length === 0 ? (
          <EmptyState>No scores yet. Be the first to play!</EmptyState>
        ) : (
          leaderboard.entries.map((entry: LeaderboardEntry, index: number) => (
            <LeaderboardItem 
              key={`${entry.username}-${index}`}
              isCurrentUser={user?.username === entry.username}
            >
              <Rank rank={index + 1}>{index + 1}</Rank>
              <PlayerInfo>
                <PlayerName>{entry.username}</PlayerName>
                <PlayerCharacter>Character: {entry.character}</PlayerCharacter>
              </PlayerInfo>
              <Score>
                <ScoreValue>{formatScore(entry.score)}</ScoreValue>
                <ScoreDetails>
                  {entry.questionsCorrect || 0}/{entry.totalQuestions || 0} correct
                </ScoreDetails>
              </Score>
            </LeaderboardItem>
          ))
        )}
      </LeaderboardList>
    </LeaderboardCard>
  );

  if (isLoading) {
    return (
      <Container>
        <Header>
          <Title>Hall of Fame</Title>
          <LoadingSpinner size="large" />
        </Header>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>🏆 Hall of Fame</Title>
        <Subtitle>
          Top players and their achievements across all game modes
        </Subtitle>
      </Header>

      <FilterSection>
        <FilterButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'primary' : 'outline'}
        >
          All Time
        </FilterButton>
        <FilterButton
          active={filter === 'month'}
          onClick={() => setFilter('month')}
          variant={filter === 'month' ? 'primary' : 'outline'}
        >
          This Month
        </FilterButton>
        <FilterButton
          active={filter === 'week'}
          onClick={() => setFilter('week')}
          variant={filter === 'week' ? 'primary' : 'outline'}
        >
          This Week
        </FilterButton>
        <FilterButton
          active={filter === 'today'}
          onClick={() => setFilter('today')}
          variant={filter === 'today' ? 'primary' : 'outline'}
        >
          Today
        </FilterButton>
      </FilterSection>

      {error && (
        <ErrorMessage>
          <div>Failed to load leaderboards. Please try again.</div>
          <div style={{ marginTop: '1rem' }}>
            <Button 
              variant="outline" 
              size="small" 
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        </ErrorMessage>
      )}

      {leaderboards && leaderboards.length > 0 ? (
        <LeaderboardGrid>
          {leaderboards.map(renderLeaderboardCard)}
        </LeaderboardGrid>
      ) : (
        !isLoading && !error && (
          <EmptyState>
            <h3>No leaderboards available</h3>
            <p>Start playing to see your scores here!</p>
          </EmptyState>
        )
      )}

      <ActionButtons>
        <Button onClick={() => navigate('/lobby')}>
          Play Game
        </Button>
        <Button variant="outline" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </ActionButtons>
    </Container>
  );
} 