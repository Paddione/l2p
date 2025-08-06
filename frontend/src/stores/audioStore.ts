import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { audioManager } from '../services/audioManager'

export interface AudioState {
  // Volume settings
  musicVolume: number
  soundVolume: number
  masterVolume: number
  
  // Audio state
  isMuted: boolean
  isPlaying: boolean
  currentTrack: string | null
  
  // Actions
  setMusicVolume: (volume: number) => void
  setSoundVolume: (volume: number) => void
  setMasterVolume: (volume: number) => void
  setIsMuted: (muted: boolean) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentTrack: (track: string | null) => void
  toggleMute: () => void
  playSound: (soundName: string) => void
  stopSound: () => void
  
  // Audio Manager integration
  playCorrectAnswer: (streak: number) => void
  playWrongAnswer: () => void
  playButtonClick: () => void
  playButtonHover: () => void
  playPlayerJoin: () => void
  playPlayerLeave: () => void
  playTimerWarning: () => void
  playTimerUrgent: () => void
  playGameStart: () => void
  playGameEnd: () => void
  playQuestionStart: () => void
  playLobbyCreated: () => void
  playLobbyJoined: () => void
  playApplause: () => void
  playHighScore: () => void
  playPerfectScore: () => void
  playMultiplierUp: () => void
  playMultiplierReset: () => void
  playScorePoints: () => void
  playScoreBonus: () => void
  playBackgroundMusic: (loop?: boolean) => void
  playLobbyMusic: (loop?: boolean) => void
  playNotification: () => void
  playSuccess: () => void
  playError: () => void
  playTick: () => void
  playCountdown: () => void
  playMenuSelect: () => void
  playMenuConfirm: () => void
  playMenuCancel: () => void
  playVolumeChange: () => void
  playLanguageChange: () => void
  playThemeChange: () => void
  stopAllSounds: () => void
  resumeAudioContext: () => void
  isAudioSupported: () => boolean
}

const initialState = {
  musicVolume: 0.7,
  soundVolume: 0.8,
  masterVolume: 1.0,
  isMuted: false,
  isPlaying: false,
  currentTrack: null,
}

export const useAudioStore = create<AudioState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        
        setMusicVolume: (volume) => set({ musicVolume: Math.max(0, Math.min(1, volume)) }),
        setSoundVolume: (volume) => set({ soundVolume: Math.max(0, Math.min(1, volume)) }),
        setMasterVolume: (volume) => set({ masterVolume: Math.max(0, Math.min(1, volume)) }),
        setIsMuted: (muted) => set({ isMuted: muted }),
        setIsPlaying: (playing) => set({ isPlaying: playing }),
        setCurrentTrack: (track) => set({ currentTrack: track }),
        toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
        playSound: (soundName) => {
          try {
            audioManager.playSound(soundName)
          } catch (error) {
            console.warn("Audio playback error:", error)
          }
        },
        stopSound: () => {
          audioManager.stopAllSounds()
        },
        
        // Audio Manager integration methods
        playCorrectAnswer: (streak) => audioManager.playCorrectAnswer(streak),
        playWrongAnswer: () => audioManager.playWrongAnswer(),
        playButtonClick: () => audioManager.playButtonClick(),
        playButtonHover: () => audioManager.playButtonHover(),
        playPlayerJoin: () => audioManager.playPlayerJoin(),
        playPlayerLeave: () => audioManager.playPlayerLeave(),
        playTimerWarning: () => audioManager.playTimerWarning(),
        playTimerUrgent: () => audioManager.playTimerUrgent(),
        playGameStart: () => audioManager.playGameStart(),
        playGameEnd: () => audioManager.playGameEnd(),
        playQuestionStart: () => audioManager.playQuestionStart(),
        playLobbyCreated: () => audioManager.playLobbyCreated(),
        playLobbyJoined: () => audioManager.playLobbyJoined(),
        playApplause: () => audioManager.playApplause(),
        playHighScore: () => audioManager.playHighScore(),
        playPerfectScore: () => audioManager.playPerfectScore(),
        playMultiplierUp: () => audioManager.playMultiplierUp(),
        playMultiplierReset: () => audioManager.playMultiplierReset(),
        playScorePoints: () => audioManager.playScorePoints(),
        playScoreBonus: () => audioManager.playScoreBonus(),
        playBackgroundMusic: (loop) => audioManager.playBackgroundMusic(loop),
        playLobbyMusic: (loop) => audioManager.playLobbyMusic(loop),
        playNotification: () => audioManager.playNotification(),
        playSuccess: () => audioManager.playSuccess(),
        playError: () => audioManager.playError(),
        playTick: () => audioManager.playTick(),
        playCountdown: () => audioManager.playCountdown(),
        playMenuSelect: () => audioManager.playMenuSelect(),
        playMenuConfirm: () => audioManager.playMenuConfirm(),
        playMenuCancel: () => audioManager.playMenuCancel(),
        playVolumeChange: () => audioManager.playVolumeChange(),
        playLanguageChange: () => audioManager.playLanguageChange(),
        playThemeChange: () => audioManager.playThemeChange(),
        stopAllSounds: () => audioManager.stopAllSounds(),
        resumeAudioContext: () => audioManager.resumeAudioContext(),
        isAudioSupported: () => audioManager.isAudioSupported(),
      }),
      {
        name: 'audio-storage',
        partialize: (state) => ({
          musicVolume: state.musicVolume,
          soundVolume: state.soundVolume,
          masterVolume: state.masterVolume,
          isMuted: state.isMuted,
        }),
      }
    ),
    {
      name: 'audio-store',
    }
  )
) 