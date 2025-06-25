import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button, Input, LoadingSpinner } from '../ui';
import { useAuthStore } from '../../stores/authStore';
import apiClient from '../../services/api';
import type { Catalog, CreateLobbyRequest, GameSettings } from '../../types/api';

const Container = styled.div`
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 2rem;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
`;

const FormSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 0.75rem;
`;

const QuestionSetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const QuestionSetCard = styled.button<{ selected?: boolean }>`
  padding: 1rem;
  border: 2px solid ${({ theme, selected }) => 
    selected ? theme.colors.primary : theme.colors.border};
  border-radius: 8px;
  background: ${({ theme, selected }) => 
    selected ? `${theme.colors.primary}10` : theme.colors.background.secondary};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-align: left;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => `${theme.colors.primary}10`};
  }
  
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const CardTitle = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 0.25rem;
`;

const CardSubtitle = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
`;

const CheckboxContainer = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.875rem;
`;

const Checkbox = styled.input`
  width: 1rem;
  height: 1rem;
  accent-color: ${({ theme }) => theme.colors.primary};
`;

const ErrorMessage = styled.div`
  background: ${({ theme }) => theme.colors.error}10;
  color: ${({ theme }) => theme.colors.error};
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  border-left: 4px solid ${({ theme }) => theme.colors.error};
  margin-bottom: 1rem;
`;

interface LobbyCreationProps {
  onLobbyCreated?: (lobbyCode: string) => void;
  onCancel?: () => void;
}

export const LobbyCreation: React.FC<LobbyCreationProps> = ({
  onLobbyCreated,
  onCancel,
}) => {
  const { user } = useAuthStore();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedCatalog, setSelectedCatalog] = useState<string>('');
  const [maxPlayers, setMaxPlayers] = useState<string>('4');
  const [isPrivate, setIsPrivate] = useState(false);
  const [settings, setSettings] = useState<Partial<GameSettings>>({
    question_time_limit: 30,
    difficulty: 'mixed',
    shuffle_questions: true,
    shuffle_answers: true,
  });

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        setLoading(true);
        const catalogData = await apiClient.getCatalogs();
        setCatalogs(catalogData);
        if (catalogData.length > 0) {
          setSelectedCatalog(catalogData[0].name);
        }
      } catch (err) {
        setError('Failed to load question sets');
        console.error('Failed to fetch catalogs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogs();
  }, []);

  const handleCreateLobby = async () => {
    if (!user || !selectedCatalog) return;

    try {
      setCreating(true);
      setError(null);

      const createRequest: CreateLobbyRequest = {
        host: {
          username: user.username,
          character: user.character,
          score: 0,
          multiplier: 1,
          is_ready: true,
          is_host: true,
          connected: true,
        },
        question_set: selectedCatalog,
        max_players: parseInt(maxPlayers, 10),
        is_private: isPrivate,
        settings: {
          ...settings,
          max_players: parseInt(maxPlayers, 10),
        },
      };

      const response = await apiClient.createLobby(createRequest);
      onLobbyCreated?.(response.code);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create lobby';
      setError(errorMessage);
      console.error('Failed to create lobby:', err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner size="large" />
      </Container>
    );
  }

  return (
    <Container>
      <Title>Create New Game</Title>
      
      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}

      <FormSection>
        <SectionTitle>Question Set</SectionTitle>
        <QuestionSetGrid>
          {catalogs.map((catalog) => (
            <QuestionSetCard
              key={catalog.name}
              selected={selectedCatalog === catalog.name}
              onClick={() => setSelectedCatalog(catalog.name)}
              disabled={creating}
              type="button"
            >
              <CardTitle>{catalog.display_name}</CardTitle>
              <CardSubtitle>{catalog.question_count} questions</CardSubtitle>
            </QuestionSetCard>
          ))}
        </QuestionSetGrid>
      </FormSection>

      <FormSection>
        <SectionTitle>Game Settings</SectionTitle>
        <SettingsGrid>
          <Input
            type="number"
            label="Max Players"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
            min="2"
            max="8"
            disabled={creating}
          />
          
          <Input
            type="number"
            label="Time per Question"
            value={settings.question_time_limit?.toString() || '30'}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              question_time_limit: parseInt(e.target.value, 10) || 30
            }))}
            min="10"
            max="120"
            disabled={creating}
            helperText="seconds"
          />
        </SettingsGrid>
      </FormSection>

      <FormSection>
        <SectionTitle>Options</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              disabled={creating}
            />
            Private lobby (invite only)
          </CheckboxContainer>
          
          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              checked={settings.shuffle_questions || false}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                shuffle_questions: e.target.checked
              }))}
              disabled={creating}
            />
            Shuffle questions
          </CheckboxContainer>
          
          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              checked={settings.shuffle_answers || false}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                shuffle_answers: e.target.checked
              }))}
              disabled={creating}
            />
            Shuffle answer options
          </CheckboxContainer>
        </div>
      </FormSection>
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        {onCancel && (
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={creating}
            fullWidth
          >
            Cancel
          </Button>
        )}
        
        <Button
          onClick={handleCreateLobby}
          loading={creating}
          disabled={!selectedCatalog}
          fullWidth
        >
          Create Lobby
        </Button>
      </div>
    </Container>
  );
};

export default LobbyCreation; 