import React from 'react';
import styled from 'styled-components';
import { Button } from '../ui';
import type { LobbyState, Player } from '../../types/api';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const LobbyCode = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 0.5rem;
  letter-spacing: 0.2em;
`;

const LobbyInfo = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PlayerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`;

const PlayerCard = styled.div<{ isHost?: boolean; isCurrentUser?: boolean }>`
  padding: 1rem;
  border: 2px solid ${({ theme, isHost, isCurrentUser }) => {
    if (isCurrentUser) return theme.colors.primary;
    if (isHost) return theme.colors.secondary;
    return theme.colors.border;
  }};
  border-radius: 8px;
  background: ${({ theme, isHost, isCurrentUser }) => {
    if (isCurrentUser) return `${theme.colors.primary}10`;
    if (isHost) return `${theme.colors.secondary}10`;
    return theme.colors.background.secondary;
  }};
  position: relative;
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const PlayerCharacter = styled.div`
  font-size: 2rem;
`;

const PlayerDetails = styled.div`
  flex: 1;
`;

const PlayerName = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const PlayerStatus = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const StatusBadge = styled.div<{ status: 'ready' | 'not-ready' | 'host' | 'disconnected' }>`
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  ${({ status, theme }) => {
    switch (status) {
      case 'ready':
        return `
          background: ${theme.colors.success}20;
          color: ${theme.colors.success};
        `;
      case 'not-ready':
        return `
          background: ${theme.colors.warning}20;
          color: ${theme.colors.warning};
        `;
      case 'host':
        return `
          background: ${theme.colors.primary}20;
          color: ${theme.colors.primary};
        `;
      case 'disconnected':
        return `
          background: ${theme.colors.error}20;
          color: ${theme.colors.error};
        `;
      default:
        return `
          background: ${theme.colors.background.secondary};
          color: ${theme.colors.text.secondary};
        `;
    }
  }}
`;

const GameSettings = styled.div`
  background: ${({ theme }) => theme.colors.background.secondary};
  padding: 1rem;
  border-radius: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
`;

const SettingItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const SettingLabel = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const SettingValue = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
`;

const EmptySlot = styled.div`
  padding: 1rem;
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
`;

interface LobbyProps {
  lobby: LobbyState;
  currentUsername?: string;
  onReady?: () => void;
  onStart?: () => void;
  onLeave?: () => void;
  onCopyCode?: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  lobby,
  currentUsername,
  onReady,
  onStart,
  onLeave,
  onCopyCode,
}) => {
  const currentPlayer = lobby.players.find(p => p.username === currentUsername);
  const isHost = currentPlayer?.is_host || false;
  const canStart = isHost && lobby.players.every(p => p.is_ready) && lobby.players.length >= 2;

  const getPlayerStatus = (player: Player) => {
    if (!player.connected) return 'disconnected';
    if (player.is_host) return 'host';
    if (player.is_ready) return 'ready';
    return 'not-ready';
  };

  // Create empty slots for visualization
  const emptySlots = Array.from({ 
    length: Math.max(0, lobby.max_players - lobby.players.length) 
  });

  return (
    <Container>
      <Header>
        <LobbyCode onClick={onCopyCode} style={{ cursor: 'pointer' }}>
          {lobby.code}
        </LobbyCode>
        <LobbyInfo>
          Click to copy lobby code • {lobby.players.length}/{lobby.max_players} players
        </LobbyInfo>
      </Header>

      <Section>
        <SectionTitle>
          👥 Players ({lobby.players.length}/{lobby.max_players})
        </SectionTitle>
        <PlayerGrid>
          {lobby.players.map((player) => (
            <PlayerCard
              key={player.username}
              isHost={player.is_host}
              isCurrentUser={player.username === currentUsername}
            >
              <PlayerInfo>
                <PlayerCharacter>{player.character}</PlayerCharacter>
                <PlayerDetails>
                  <PlayerName>{player.username}</PlayerName>
                  <PlayerStatus>
                    <StatusBadge status={getPlayerStatus(player)}>
                      {getPlayerStatus(player)}
                    </StatusBadge>
                    {player.score > 0 && (
                      <span>Score: {player.score}</span>
                    )}
                  </PlayerStatus>
                </PlayerDetails>
              </PlayerInfo>
            </PlayerCard>
          ))}
          
          {emptySlots.map((_, index) => (
            <EmptySlot key={`empty-${index}`}>
              Waiting for player...
            </EmptySlot>
          ))}
        </PlayerGrid>
      </Section>

      <Section>
        <SectionTitle>⚙️ Game Settings</SectionTitle>
        <GameSettings>
          <SettingItem>
            <SettingLabel>Question Set</SettingLabel>
            <SettingValue>{lobby.question_set}</SettingValue>
          </SettingItem>
          
          <SettingItem>
            <SettingLabel>Time Limit</SettingLabel>
            <SettingValue>{lobby.settings?.question_time_limit || 30}s</SettingValue>
          </SettingItem>
          
          <SettingItem>
            <SettingLabel>Difficulty</SettingLabel>
            <SettingValue>{lobby.settings?.difficulty || 'Mixed'}</SettingValue>
          </SettingItem>
          
          <SettingItem>
            <SettingLabel>Privacy</SettingLabel>
            <SettingValue>{lobby.is_private ? 'Private' : 'Public'}</SettingValue>
          </SettingItem>
        </GameSettings>
      </Section>

      <ActionButtons>
        {onLeave && (
          <Button variant="outline" onClick={onLeave}>
            Leave Lobby
          </Button>
        )}
        
        {currentPlayer && !currentPlayer.is_ready && onReady && (
          <Button onClick={onReady}>
            Ready Up
          </Button>
        )}
        
        {isHost && canStart && onStart && (
          <Button variant="primary" size="large" onClick={onStart}>
            Start Game
          </Button>
        )}
        
        {isHost && !canStart && (
          <Button variant="secondary" disabled>
            {lobby.players.length < 2 
              ? 'Need at least 2 players' 
              : 'Waiting for all players to be ready'
            }
          </Button>
        )}
      </ActionButtons>
    </Container>
  );
};

export default Lobby; 