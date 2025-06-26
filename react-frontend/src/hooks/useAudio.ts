import { useState, useEffect, useCallback, useRef } from 'react';

interface AudioSettings {
  masterVolume: number;
  soundEffectsVolume: number;
  enabled: boolean;
  muted: boolean;
}

interface UseAudioReturn {
  // Audio controls
  playCorrectAnswer: () => void;
  playIncorrectAnswer: () => void;
  playButtonClick: () => void;
  playNotification: () => void;
  playGameStart: () => void;
  playGameEnd: () => void;
  playTimeWarning: () => void;
  playMultiplierBonus: () => void;
  playPlayerJoined: () => void;
  playPlayerLeft: () => void;
  
  // Settings
  settings: AudioSettings;
  updateSettings: (newSettings: Partial<AudioSettings>) => void;
  mute: () => void;
  unmute: () => void;
  setVolume: (volume: number) => void;
  testSound: () => void;
  
  // State
  isInitialized: boolean;
  isSupported: boolean;
}

const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 0.7,
  soundEffectsVolume: 0.8,
  enabled: true,
  muted: false,
};

export function useAudio(): UseAudioReturn {
  const [settings, setSettings] = useState<AudioSettings>(() => {
    const saved = localStorage.getItem('audioSettings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const initializePromiseRef = useRef<Promise<void> | null>(null);

  // Initialize audio context on first user interaction
  const initializeAudio = useCallback(async () => {
    if (initializePromiseRef.current) {
      return initializePromiseRef.current;
    }

    initializePromiseRef.current = (async () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
          console.warn('Web Audio API not supported');
          setIsSupported(false);
          return;
        }

        audioContextRef.current = new AudioContext();
        setIsSupported(true);
        setIsInitialized(true);
        console.log('🔊 Audio system initialized');
      } catch (error) {
        console.warn('Failed to initialize audio:', error);
        setIsSupported(false);
      }
    })();

    return initializePromiseRef.current;
  }, []);

  // Set up initialization on first user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      initializeAudio();
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction, { passive: true });
    document.addEventListener('keydown', handleUserInteraction, { passive: true });
    document.addEventListener('touchstart', handleUserInteraction, { passive: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [initializeAudio]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('audioSettings', JSON.stringify(settings));
  }, [settings]);

  // Generate different tones for different sounds
  const createTone = useCallback(async (frequency: number, duration: number, volume: number = 1) => {
    if (!audioContextRef.current || !settings.enabled || settings.muted) return;

    try {
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      const finalVolume = volume * settings.soundEffectsVolume * settings.masterVolume;
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(finalVolume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Failed to play tone:', error);
    }
  }, [settings]);

  // Create chord progression for more complex sounds
  const createChord = useCallback(async (frequencies: number[], duration: number, volume: number = 1) => {
    if (!audioContextRef.current || !settings.enabled || settings.muted) return;

    const promises = frequencies.map(freq => createTone(freq, duration, volume / frequencies.length));
    await Promise.all(promises);
  }, [createTone, settings]);

  // Audio effect functions
  const playCorrectAnswer = useCallback(async () => {
    await initializeAudio();
    // Pleasant ascending chord (C major triad)
    await createChord([523.25, 659.25, 783.99], 0.5, 0.8);
  }, [initializeAudio, createChord]);

  const playIncorrectAnswer = useCallback(async () => {
    await initializeAudio();
    // Lower, descending tone
    await createTone(220, 0.3, 0.6);
    setTimeout(() => createTone(196, 0.3, 0.6), 100);
  }, [initializeAudio, createTone]);

  const playButtonClick = useCallback(async () => {
    await initializeAudio();
    // Quick, sharp click
    await createTone(800, 0.1, 0.4);
  }, [initializeAudio, createTone]);

  const playNotification = useCallback(async () => {
    await initializeAudio();
    // Two-tone notification
    await createTone(800, 0.15, 0.6);
    setTimeout(() => createTone(600, 0.15, 0.6), 150);
  }, [initializeAudio, createTone]);

  const playGameStart = useCallback(async () => {
    await initializeAudio();
    // Triumphant ascending sequence
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    for (let i = 0; i < notes.length; i++) {
      setTimeout(() => createTone(notes[i], 0.3, 0.8), i * 100);
    }
  }, [initializeAudio, createTone]);

  const playGameEnd = useCallback(async () => {
    await initializeAudio();
    // Victory fanfare
    await createChord([523.25, 659.25, 783.99, 1046.50], 1.0, 0.9);
  }, [initializeAudio, createChord]);

  const playTimeWarning = useCallback(async () => {
    await initializeAudio();
    // Urgent beeping
    for (let i = 0; i < 3; i++) {
      setTimeout(() => createTone(1000, 0.2, 0.7), i * 250);
    }
  }, [initializeAudio, createTone]);

  const playMultiplierBonus = useCallback(async () => {
    await initializeAudio();
    // Escalating excitement
    const frequencies = [440, 554, 659, 880];
    for (let i = 0; i < frequencies.length; i++) {
      setTimeout(() => createTone(frequencies[i], 0.2, 0.8), i * 80);
    }
  }, [initializeAudio, createTone]);

  const playPlayerJoined = useCallback(async () => {
    await initializeAudio();
    // Welcoming two-tone
    await createTone(523, 0.2, 0.6);
    setTimeout(() => createTone(659, 0.2, 0.6), 200);
  }, [initializeAudio, createTone]);

  const playPlayerLeft = useCallback(async () => {
    await initializeAudio();
    // Descending farewell
    await createTone(659, 0.2, 0.5);
    setTimeout(() => createTone(523, 0.2, 0.5), 200);
  }, [initializeAudio, createTone]);

  // Settings management
  const updateSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const mute = useCallback(() => {
    updateSettings({ muted: true });
  }, [updateSettings]);

  const unmute = useCallback(() => {
    updateSettings({ muted: false });
  }, [updateSettings]);

  const setVolume = useCallback((volume: number) => {
    updateSettings({ masterVolume: Math.max(0, Math.min(1, volume)) });
  }, [updateSettings]);

  const testSound = useCallback(() => {
    playButtonClick();
  }, [playButtonClick]);

  return {
    // Audio controls
    playCorrectAnswer,
    playIncorrectAnswer,
    playButtonClick,
    playNotification,
    playGameStart,
    playGameEnd,
    playTimeWarning,
    playMultiplierBonus,
    playPlayerJoined,
    playPlayerLeft,
    
    // Settings
    settings,
    updateSettings,
    mute,
    unmute,
    setVolume,
    testSound,
    
    // State
    isInitialized,
    isSupported,
  };
} 