/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import { MusicGenerationContext, AudioContext } from '../types/audio';
import { GameState } from '../types';

interface AudioManagerProps {
  gameState: GameState;
}

/**
 * AudioManager component - Manages all game audio based on game state
 */
export const AudioManager: React.FC<AudioManagerProps> = ({ gameState }) => {
  const [musicEnabled, setMusicEnabled] = useState(() => {
    // Check localStorage for user preference
    const saved = localStorage.getItem('gemini-os-music-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('gemini-os-music-volume');
    return saved !== null ? parseFloat(saved) : 0.3; // Lower default volume
  });

  const [showControls, setShowControls] = useState(false);

  const {
    isPlaying,
    isLoading,
    currentTrack,
    error,
    play,
    pause,
    setVolume: setAudioVolume,
    changeMusic,
  } = useBackgroundMusic({
    enabled: musicEnabled,
    volume,
    crossfadeDuration: 2000,
    autoPlay: true,
  });

  // Previous state refs to detect changes
  const [prevRoomId, setPrevRoomId] = useState<string | null>(null);
  const [prevBattleState, setPrevBattleState] = useState<boolean>(false);
  const [prevShowAIDialog, setPrevShowAIDialog] = useState<boolean>(false);

  /**
   * Build music generation context from game state
   */
  const buildMusicContext = useCallback((): MusicGenerationContext => {
    const currentRoom = gameState.rooms.get(gameState.currentRoomId);
    return {
      storyContext: gameState.storyContext,
      storyMode: gameState.storyMode,
      currentRoom,
      playerHP: gameState.currentHP,
      maxHP: gameState.maxHP,
      recentConsequences: gameState.storyConsequences,
      battleState: gameState.battleState,
      characterClass: gameState.selectedCharacter?.name,
      roomCounter: gameState.roomCounter,
    };
  }, [gameState]);

  /**
   * Determine what audio context we should be in
   */
  const getCurrentAudioContext = useCallback((): AudioContext | null => {
    // Priority order:
    // 1. Defeat/Victory
    if (!gameState.isAlive) return 'defeat';
    if (gameState.battleState?.status === 'player_won') return 'victory';

    // 2. Battle
    if (gameState.battleState?.status === 'ongoing') return 'battle';

    // 3. Story moment (AI dialog showing)
    // We'll need to pass this as a prop or detect it another way
    // For now, skip this

    // 4. Room exploration
    if (gameState.isInGame && gameState.currentRoomId) return 'room';

    return null;
  }, [gameState]);

  /**
   * Handle room changes - generate new room music
   */
  useEffect(() => {
    if (!musicEnabled || !gameState.isInGame) return;

    const currentAudioContext = getCurrentAudioContext();

    // Room changed
    if (currentAudioContext === 'room' && gameState.currentRoomId !== prevRoomId) {
      console.log('[AudioManager] Room changed, generating new music...');
      const context = buildMusicContext();
      changeMusic(context, 'room');
      setPrevRoomId(gameState.currentRoomId);
    }
  }, [gameState.currentRoomId, gameState.isInGame, prevRoomId, musicEnabled, getCurrentAudioContext, buildMusicContext, changeMusic]);

  /**
   * Handle battle state changes
   */
  useEffect(() => {
    if (!musicEnabled || !gameState.isInGame) return;

    const inBattle = gameState.battleState?.status === 'ongoing';

    // Battle started
    if (inBattle && !prevBattleState) {
      console.log('[AudioManager] Battle started, generating battle music...');
      const context = buildMusicContext();
      changeMusic(context, 'battle');
    }

    // Battle ended (back to room music)
    if (!inBattle && prevBattleState && gameState.isAlive) {
      console.log('[AudioManager] Battle ended, returning to room music...');
      const context = buildMusicContext();
      changeMusic(context, 'room');
    }

    setPrevBattleState(inBattle);
  }, [gameState.battleState, gameState.isInGame, gameState.isAlive, prevBattleState, musicEnabled, buildMusicContext, changeMusic]);

  /**
   * Handle game over (defeat music)
   */
  useEffect(() => {
    if (!musicEnabled) return;

    if (!gameState.isAlive) {
      console.log('[AudioManager] Player defeated, playing defeat music...');
      const context = buildMusicContext();
      changeMusic(context, 'defeat');
    }
  }, [gameState.isAlive, musicEnabled, buildMusicContext, changeMusic]);

  /**
   * Toggle music on/off
   */
  const toggleMusic = useCallback(() => {
    const newState = !musicEnabled;
    setMusicEnabled(newState);
    localStorage.setItem('gemini-os-music-enabled', JSON.stringify(newState));

    if (newState && !isPlaying) {
      play();
    } else if (!newState && isPlaying) {
      pause();
    }
  }, [musicEnabled, isPlaying, play, pause]);

  /**
   * Change volume
   */
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    setAudioVolume(newVolume);
    localStorage.setItem('gemini-os-music-volume', newVolume.toString());
  }, [setAudioVolume]);

  // Don't render anything if not in game
  if (!gameState.isInGame && !gameState.selectedCharacter) {
    return null;
  }

  // Export music state and controls for use in other components
  (window as any).__gameMusicState = {
    musicEnabled,
    volume,
    isPlaying,
    isLoading,
    currentTrack,
    error,
    toggleMusic,
    handleVolumeChange,
  };

  return (
    <>
      {/* Autoplay blocked banner */}
      {error && error.includes('autoplay') && (
        <div
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          style={{
            fontFamily: 'monospace',
            animation: 'bounce 1s infinite'
          }}
        >
          <div
            style={{
              backgroundColor: '#f4e8d0',
              border: '4px solid #3d2817',
              borderRadius: '4px',
              padding: '12px 20px',
              boxShadow: '0 6px 0 #3d2817, inset 0 3px 0 #fff9e8'
            }}
          >
            <div className="flex items-center gap-3">
              <span style={{ fontSize: '20px' }}>🎵</span>
              <div style={{ color: '#3d2817', fontWeight: 'bold', fontSize: '12px' }}>
                Click anywhere to start music!
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
