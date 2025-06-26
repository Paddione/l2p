import { Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../components/auth/AuthProvider';
import { LoginForm } from '../components/auth/LoginForm';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: ${({ theme }) => theme.spacing.xl};
`;

export function LoginPage() {
  const { isAuthenticated } = useAuth();

  // Redirect to home if already logged in
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container>
      <LoginForm />
    </Container>
  );
} 