// import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  max-width: 600px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  justify-content: center;
`;

const HomeButton = styled(Button)`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  font-size: 1rem;
  min-width: 180px;
`;

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <Container>
      <Title>Welcome to Learn2Play!</Title>
      <Subtitle>
        A feature-rich, real-time multiplayer quiz game with advanced scoring, 
        leaderboards, and comprehensive localization support.
      </Subtitle>
      <ButtonGroup>
        <HomeButton onClick={() => navigate('/lobby')}>
          🎮 {user ? 'Create/Join Game' : 'Play as Guest'}
        </HomeButton>
        <HomeButton variant="outline" onClick={() => navigate('/hall-of-fame')}>
          🏆 Hall of Fame
        </HomeButton>
        {!user ? (
          <HomeButton variant="secondary" onClick={() => navigate('/login')}>
            🔐 Login
          </HomeButton>
        ) : (
          <HomeButton variant="ghost" onClick={() => navigate('/lobby')}>
            👋 Welcome, {user.username}!
          </HomeButton>
        )}
      </ButtonGroup>
    </Container>
  );
} 