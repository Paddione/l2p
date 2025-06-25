// import React from 'react';
import { Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuthStore } from '../stores/authStore';
import { AuthModal } from '../components/auth/AuthModal';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  font-size: 2rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  font-size: 1rem;
`;

export function RegisterPage() {
  const { user } = useAuthStore();

  // Redirect to home if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container>
      <Card>
        <Title>Join Learn2Play!</Title>
        <Subtitle>Create your account to start playing multiplayer quiz games</Subtitle>
        <AuthModal 
          isOpen={true} 
          onClose={() => {}} 
          initialMode="register"
        />
      </Card>
    </Container>
  );
} 