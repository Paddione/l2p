import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { useNotification } from '../components/ui/NotificationProvider';
import apiClient from '../services/api';

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

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const StatLabel = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
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

const RefreshButton = styled(Button)`
  margin-left: auto;
`;

interface LeaderboardEntry {
  rank: number;
  username: string;
  character: string;
  score: number;
  questions_answered: number;
  questions_correct: number;
  accuracy: number;
  achieved_at: string;
}

interface LeaderboardData {
  catalog: string;
  leaderboard: LeaderboardEntry[];
  total: number;
  catalog_display_name?: string;
  total_players?: number;
}

export function HallOfFamePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showError, showSuccess } = useNotification();
  const [selectedCatalog, setSelectedCatalog] = useState<string | null>(null);
  
  // Fetch available catalogs
  const {
    data: catalogsData,
    isLoading: catalogsLoading,
    error: catalogsError
  } = useQuery({
    queryKey: ['hall-of-fame-catalogs'],
    queryFn: () => apiClient.getHallOfFameCatalogs(20),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch leaderboards for each catalog
  const {
    data: leaderboardsData,
    isLoading: leaderboardsLoading,
    error: leaderboardsError,
    refetch
  } = useQuery({
    queryKey: ['leaderboards', catalogsData?.catalogs],
    queryFn: async () => {
      if (!catalogsData?.catalogs?.length) return [];
      
      const leaderboardPromises = catalogsData.catalogs.map(async (catalog: any) => {
        try {
          const result = await apiClient.getLeaderboard(catalog.catalog_name, 10);
          return {
            ...result,
            catalog_display_name: catalog.catalog_display_name || catalog.catalog_name,
            total_players: catalog.total_entries || 0
          };
        } catch (error) {
          console.warn(`Failed to fetch leaderboard for ${catalog.catalog_name}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(leaderboardPromises);
      return results.filter(Boolean) as LeaderboardData[];
    },
    enabled: !!catalogsData?.catalogs?.length,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch user's personal stats
  const {
    data: myStats,
    isLoading: myStatsLoading
  } = useQuery({
    queryKey: ['my-hall-of-fame-stats'],
    queryFn: () => apiClient.getMyHallOfFameEntries(100),
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute
  });

  // Auto-select first catalog if none selected
  useEffect(() => {
    if (!selectedCatalog && catalogsData?.catalogs && catalogsData.catalogs.length > 0) {
      setSelectedCatalog(catalogsData.catalogs[0].catalog_name);
    }
  }, [catalogsData, selectedCatalog]);

  const handleRefresh = async () => {
    try {
      await refetch();
      showSuccess('Refreshed', 'Leaderboards updated successfully!');
    } catch (error) {
      showError('Refresh Failed', 'Failed to refresh leaderboards');
    }
  };

  const formatScore = (score: number): string => {
    return score.toLocaleString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatAccuracy = (correct: number, total: number): string => {
    if (total === 0) return '0%';
    return `${Math.round((correct / total) * 100)}%`;
  };

  const calculatePersonalStats = () => {
    if (!myStats?.entries?.length) return null;

    const entries = myStats.entries;
    const totalScore = entries.reduce((sum, entry) => sum + (entry.score || 0), 0);
    const totalQuestions = entries.reduce((sum, entry) => sum + (entry.questions_answered || 0), 0);
    const totalCorrect = entries.reduce((sum, entry) => sum + (entry.questions_correct || 0), 0);
    const bestScore = Math.max(...entries.map(entry => entry.score || 0));

    return {
      totalGames: entries.length,
      totalScore,
      bestScore,
      averageScore: Math.round(totalScore / entries.length),
      overallAccuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
    };
  };

  const renderLeaderboardCard = (leaderboardData: LeaderboardData) => (
    <LeaderboardCard key={leaderboardData.catalog}>
      <CardHeader>
        <CardTitle>{leaderboardData.catalog_display_name || leaderboardData.catalog}</CardTitle>
        <CardSubtitle>
          {leaderboardData.leaderboard.length} players • {leaderboardData.total_players || 0} total entries
        </CardSubtitle>
      </CardHeader>
      <LeaderboardList>
        {leaderboardData.leaderboard.length === 0 ? (
          <EmptyState>No scores yet. Be the first to play!</EmptyState>
        ) : (
          leaderboardData.leaderboard.map((entry: LeaderboardEntry, index: number) => (
            <LeaderboardItem 
              key={`${entry.username}-${index}`}
              isCurrentUser={user?.username === entry.username}
            >
              <Rank rank={entry.rank || index + 1}>{entry.rank || index + 1}</Rank>
              <PlayerInfo>
                <PlayerName>{entry.username}</PlayerName>
                <PlayerCharacter>
                  {entry.character} • {formatAccuracy(entry.questions_correct || 0, entry.questions_answered || 1)} accuracy
                </PlayerCharacter>
              </PlayerInfo>
              <Score>
                <ScoreValue>{formatScore(entry.score)}</ScoreValue>
                <ScoreDetails>
                  {entry.questions_correct || 0}/{entry.questions_answered || 0} correct
                </ScoreDetails>
              </Score>
            </LeaderboardItem>
          ))
        )}
      </LeaderboardList>
    </LeaderboardCard>
  );

  const personalStats = calculatePersonalStats();

  if (catalogsLoading || leaderboardsLoading) {
    return (
      <Container>
        <Header>
          <Title>🏆 Hall of Fame</Title>
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
        <RefreshButton variant="outline" onClick={handleRefresh}>
          🔄 Refresh
        </RefreshButton>
      </Header>

      {/* Personal Stats Section (if user is logged in) */}
      {user && personalStats && (
        <>
          <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Your Statistics
          </h3>
          <StatsSection>
            <StatCard>
              <StatValue>{personalStats.totalGames}</StatValue>
              <StatLabel>Games Played</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{formatScore(personalStats.bestScore)}</StatValue>
              <StatLabel>Best Score</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{formatScore(personalStats.averageScore)}</StatValue>
              <StatLabel>Average Score</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{personalStats.overallAccuracy}%</StatValue>
              <StatLabel>Overall Accuracy</StatLabel>
            </StatCard>
          </StatsSection>
        </>
      )}

      {(catalogsError || leaderboardsError) && (
        <ErrorMessage>
          <div>Failed to load leaderboards. Please try again.</div>
          <div style={{ marginTop: '1rem' }}>
            <Button 
              variant="outline" 
              size="small" 
              onClick={handleRefresh}
            >
              Retry
            </Button>
          </div>
        </ErrorMessage>
      )}

      {leaderboardsData && leaderboardsData.length > 0 ? (
        <LeaderboardGrid>
          {leaderboardsData.map(renderLeaderboardCard)}
        </LeaderboardGrid>
      ) : (
        !catalogsLoading && !leaderboardsLoading && (
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