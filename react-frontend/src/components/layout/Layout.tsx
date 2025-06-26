import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageToggle } from '../ui/LanguageToggle';
import { useAuth } from '../auth/AuthProvider';
import { useLanguage } from '../../contexts/LanguageContext';

const LayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  transition: ${({ theme }) => theme.transitions.normal};
`;

const Header = styled.header`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
  
  &:hover {
    opacity: 0.8;
  }
`;

const Nav = styled.nav`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
`;

const NavLink = styled(Link)<{ $isActive?: boolean }>`
  color: white;
  text-decoration: none;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ $isActive }) => $isActive ? '600' : '400'};
  background: ${({ $isActive, theme }) => $isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  transition: ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const UserInfo = styled.span`
  color: white;
  font-weight: 500;
`;

const LogoutButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  font-weight: 500;
  transition: ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
`;

const Main = styled.main`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md};
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const handleLogout = () => {
    logout();
  };

  return (
    <LayoutContainer>
      <Header>
        <HeaderContent>
          <Logo to="/">Learn2Play 🎮</Logo>
          
          <Nav>
            <NavLink to="/" $isActive={location.pathname === '/'}>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/hall-of-fame" $isActive={location.pathname === '/hall-of-fame'}>
              {t('nav.hallOfFame')}
            </NavLink>
            {user && (
              <NavLink to="/lobby" $isActive={location.pathname.startsWith('/lobby')}>
                {t('nav.lobby')}
              </NavLink>
            )}
          </Nav>

          <UserSection>
            <LanguageToggle />
            <ThemeToggle />
            {user ? (
              <>
                <UserInfo>👤 {user.username}</UserInfo>
                <LogoutButton onClick={handleLogout}>{t('nav.logout')}</LogoutButton>
              </>
            ) : (
              <Nav>
                <NavLink to="/login" $isActive={location.pathname === '/login'}>
                  {t('nav.login')}
                </NavLink>
                <NavLink to="/register" $isActive={location.pathname === '/register'}>
                  {t('nav.register')}
                </NavLink>
              </Nav>
            )}
          </UserSection>
        </HeaderContent>
      </Header>
      <Main>
        {children}
      </Main>
    </LayoutContainer>
  );
} 