import { useState } from 'react';
import styled from 'styled-components';
import { useAudio } from '../../hooks/useAudio';
import { Button } from './Button';
import { Modal } from './Modal';

const SettingsContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  min-width: 350px;
`;

const SettingGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const SettingLabel = styled.label`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const VolumeValue = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: 500;
  min-width: 40px;
  text-align: right;
`;

const VolumeSlider = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: ${({ theme }) => theme.colors.background.secondary};
  outline: none;
  appearance: none;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
    box-shadow: ${({ theme }) => theme.shadows.sm};
    transition: all ${({ theme }) => theme.transitions.fast};
    
    &:hover {
      transform: scale(1.1);
      box-shadow: ${({ theme }) => theme.shadows.md};
    }
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
    border: none;
    box-shadow: ${({ theme }) => theme.shadows.sm};
    transition: all ${({ theme }) => theme.transitions.fast};
    
    &:hover {
      transform: scale(1.1);
      box-shadow: ${({ theme }) => theme.shadows.md};
    }
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border || '#e0e0e0'};
`;

const ToggleSwitch = styled.div<{ enabled: boolean }>`
  position: relative;
  width: 50px;
  height: 26px;
  background: ${({ enabled, theme }) => enabled ? theme.colors.primary : theme.colors.background.secondary};
  border-radius: 13px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ enabled }) => enabled ? '26px' : '2px'};
    width: 22px;
    height: 22px;
    background: white;
    border-radius: 50%;
    transition: left ${({ theme }) => theme.transitions.fast};
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`;

const TestButton = styled(Button)`
  align-self: flex-start;
`;

const StatusIndicator = styled.div<{ supported: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: ${({ supported, theme }) => 
    supported ? theme.colors.success + '15' : theme.colors.warning + '15'};
  color: ${({ supported, theme }) => 
    supported ? theme.colors.success : theme.colors.warning};
  font-size: 0.875rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding-top: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.border || '#e0e0e0'};
`;

interface AudioSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AudioSettings({ isOpen, onClose }: AudioSettingsProps) {
  const {
    settings,
    updateSettings,
    mute,
    unmute,
    setVolume,
    testSound,
    isSupported,
    isInitialized
  } = useAudio();

  const [localSettings, setLocalSettings] = useState(settings);

  const handleVolumeChange = (key: 'masterVolume' | 'soundEffectsVolume', value: number) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    updateSettings(newSettings);
  };

  const handleToggleEnabled = () => {
    const newSettings = { ...localSettings, enabled: !localSettings.enabled };
    setLocalSettings(newSettings);
    updateSettings(newSettings);
  };

  const handleToggleMute = () => {
    if (localSettings.muted) {
      unmute();
      setLocalSettings({ ...localSettings, muted: false });
    } else {
      mute();
      setLocalSettings({ ...localSettings, muted: true });
    }
  };

  const handleTestSound = () => {
    testSound();
  };

  const handleReset = () => {
    const defaultSettings = {
      masterVolume: 0.7,
      soundEffectsVolume: 0.8,
      enabled: true,
      muted: false,
    };
    setLocalSettings(defaultSettings);
    updateSettings(defaultSettings);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="🔊 Audio Settings"
      size="medium"
    >
      <SettingsContainer>
        {/* Audio Support Status */}
        <StatusIndicator supported={isSupported}>
          {isSupported ? '✅' : '⚠️'} 
          {isSupported 
            ? `Audio system ${isInitialized ? 'ready' : 'initializing...'}`
            : 'Audio not supported in this browser'
          }
        </StatusIndicator>

        {/* Main Audio Toggle */}
        <ToggleContainer>
          <div>
            <strong>Enable Audio</strong>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Master audio control
            </div>
          </div>
          <ToggleSwitch 
            enabled={localSettings.enabled} 
            onClick={handleToggleEnabled}
          />
        </ToggleContainer>

        {/* Mute Toggle */}
        <ToggleContainer>
          <div>
            <strong>Mute All Sounds</strong>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Temporarily disable audio
            </div>
          </div>
          <ToggleSwitch 
            enabled={!localSettings.muted} 
            onClick={handleToggleMute}
          />
        </ToggleContainer>

        {/* Volume Controls */}
        <SettingGroup>
          <SettingLabel>
            Master Volume
            <VolumeValue>{Math.round(localSettings.masterVolume * 100)}%</VolumeValue>
          </SettingLabel>
          <VolumeSlider
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={localSettings.masterVolume}
            onChange={(e) => handleVolumeChange('masterVolume', parseFloat(e.target.value))}
            disabled={!localSettings.enabled || localSettings.muted}
          />
        </SettingGroup>

        <SettingGroup>
          <SettingLabel>
            Sound Effects Volume
            <VolumeValue>{Math.round(localSettings.soundEffectsVolume * 100)}%</VolumeValue>
          </SettingLabel>
          <VolumeSlider
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={localSettings.soundEffectsVolume}
            onChange={(e) => handleVolumeChange('soundEffectsVolume', parseFloat(e.target.value))}
            disabled={!localSettings.enabled || localSettings.muted}
          />
        </SettingGroup>

        {/* Test Sound */}
        <TestButton 
          onClick={handleTestSound}
          disabled={!localSettings.enabled || localSettings.muted || !isSupported}
          variant="outline"
        >
          🔊 Test Sound
        </TestButton>

        {/* Action Buttons */}
        <ActionButtons>
          <Button variant="outline" onClick={handleReset}>
            Reset to Default
          </Button>
          <Button onClick={onClose}>
            Done
          </Button>
        </ActionButtons>
      </SettingsContainer>
    </Modal>
  );
}

// Audio control button for easy access
const AudioControlButton = styled(Button)`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  
  @media (max-width: 768px) {
    bottom: 80px;
  }
`;

export function AudioControlWidget() {
  const [showSettings, setShowSettings] = useState(false);
  const { settings, mute, unmute } = useAudio();

  const handleButtonClick = () => {
    setShowSettings(true);
  };

  return (
    <>
      <AudioControlButton
        onClick={handleButtonClick}
        variant="primary"
      >
        {!settings.enabled ? '🔇' : settings.muted ? '🔈' : '🔊'}
      </AudioControlButton>
      
      <AudioSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </>
  );
} 