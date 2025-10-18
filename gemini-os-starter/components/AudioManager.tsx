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

  return (
    <>
      {/* Autoplay blocked banner */}
      {error && error.includes('autoplay') && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-purple-900/95 backdrop-blur border-2 border-purple-400 rounded-lg px-6 py-3 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎵</span>
              <div className="text-white font-semibold">
                Click anywhere to start music!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating music controls */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="relative">
          {/* Main control button */}
          <button
            onClick={() => setShowControls(!showControls)}
            className={`p-3 rounded-full shadow-lg transition-all ${
              musicEnabled
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-gray-700 hover:bg-gray-600'
            } ${isLoading ? 'animate-pulse' : ''}`}
            title={musicEnabled ? 'Music On' : 'Music Off'}
          >
            {isLoading ? (
              <span className="text-white text-xl">⏳</span>
            ) : musicEnabled ? (
              <span className="text-white text-xl">{isPlaying ? '🎵' : '🔇'}</span>
            ) : (
              <span className="text-white text-xl">🔇</span>
            )}
          </button>

          {/* Expanded controls */}
          {showControls && (
            <div className="absolute bottom-full right-0 mb-2 bg-gray-900/95 backdrop-blur rounded-lg p-4 shadow-2xl border-2 border-purple-500 min-w-[250px]">
              <h3 className="text-purple-300 font-bold mb-3 text-sm">Music Controls</h3>

              {/* Enable/Disable */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-300 text-sm">Music</span>
                <button
                  onClick={toggleMusic}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                    musicEnabled
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {musicEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Volume slider */}
              {musicEnabled && (
                <div className="mb-3">
                  <label className="text-gray-300 text-xs mb-1 block">
                    Volume: {Math.round(volume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                </div>
              )}

              {/* Current track info */}
              {currentTrack && musicEnabled && (
                <div className="border-t border-gray-700 pt-3 mt-3">
                  <div className="text-xs text-gray-400 mb-1">Now Playing:</div>
                  <div className="text-xs text-purple-300 truncate" title={currentTrack.prompt}>
                    {currentTrack.prompt.slice(0, 60)}...
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Model: {currentTrack.model}
                  </div>
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="bg-red-900/50 border border-red-500 rounded p-2 mt-3">
                  <div className="text-xs text-red-200">{error}</div>
                </div>
              )}

              {/* Loading indicator */}
              {isLoading && (
                <div className="bg-blue-900/50 border border-blue-500 rounded p-2 mt-3">
                  <div className="text-xs text-blue-200">Generating music...</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
