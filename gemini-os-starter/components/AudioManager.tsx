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
    return saved !== null ? parseFloat(saved) : 0.15; // Subtle background music
  });

  const [showControls, setShowControls] = useState(false);

  const {
    isPlaying,
    isLoading,
    currentTrack,
    mainTheme,
    overlayTrack,
    error,
    play,
    pause,
    setVolume: setAudioVolume,
    changeMusic,
    loadMainTheme,
    playOverlay,
    stopOverlay,
    duckMainTheme,
    restoreMainTheme,
    stopMainTheme,
  } = useBackgroundMusic({
    enabled: musicEnabled,
    volume,
    crossfadeDuration: 2000,
    autoPlay: true,
  });

  // Previous state refs to detect changes
  const [prevBattleState, setPrevBattleState] = useState<boolean>(false);
  const [prevIsAlive, setPrevIsAlive] = useState<boolean>(true);
  const [mainThemeLoaded, setMainThemeLoaded] = useState<boolean>(false);

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
   * Load main theme after character selection
   */
  useEffect(() => {
    // Don't load music if disabled
    if (!musicEnabled) {
      console.log('[AudioManager] Music disabled, skipping main theme load');
      return;
    }

    // Load main theme when character is selected and game starts
    if (gameState.selectedCharacter && gameState.isInGame && !mainThemeLoaded) {
      console.log('[AudioManager] Loading main theme after character selection...');
      const context = buildMusicContext();
      loadMainTheme(context);
      setMainThemeLoaded(true);
    }
  }, [gameState.selectedCharacter, gameState.isInGame, mainThemeLoaded, musicEnabled, buildMusicContext, loadMainTheme]);

  /**
   * Handle battle state changes - layer battle music over main theme
   */
  useEffect(() => {
    // Don't play battle music if music is disabled
    if (!musicEnabled || !gameState.isInGame) {
      console.log('[AudioManager] Music disabled or not in game, skipping battle music');
      return;
    }

    const inBattle = gameState.battleState?.status === 'ongoing';

    // Battle started - play overlay and duck main theme
    if (inBattle && !prevBattleState) {
      console.log('[AudioManager] Battle started, layering battle music...');
      const context = buildMusicContext();

      // Duck main theme to 20% volume
      duckMainTheme(0.2);

      // Play battle music overlay
      playOverlay(context, 'battle');
    }

    // Battle ended - stop overlay and restore main theme
    if (!inBattle && prevBattleState && gameState.isAlive) {
      console.log('[AudioManager] Battle ended, removing overlay...');

      // Stop overlay music
      stopOverlay();

      // Restore main theme to full volume
      restoreMainTheme();
    }

    setPrevBattleState(inBattle);
  }, [gameState.battleState, gameState.isInGame, gameState.isAlive, prevBattleState, musicEnabled, buildMusicContext, playOverlay, stopOverlay, duckMainTheme, restoreMainTheme]);

  /**
   * Handle character death and restart - regenerate main theme on restart
   */
  useEffect(() => {
    // Don't play defeat/restart music if music is disabled
    if (!musicEnabled) {
      console.log('[AudioManager] Music disabled, skipping defeat/restart music');
      return;
    }

    // Player just died
    if (!gameState.isAlive && prevIsAlive) {
      console.log('[AudioManager] Player defeated, stopping main theme and playing defeat music...');

      // Stop overlay if any
      if (overlayTrack) {
        stopOverlay();
      }

      // Stop main theme and play defeat music
      stopMainTheme();
      const context = buildMusicContext();
      changeMusic(context, 'defeat');

      setMainThemeLoaded(false);
    }

    // Player restarted after death
    if (gameState.isAlive && !prevIsAlive && gameState.selectedCharacter && gameState.isInGame) {
      console.log('[AudioManager] Player restarted, loading new main theme...');
      const context = buildMusicContext();
      loadMainTheme(context);
      setMainThemeLoaded(true);
    }

    setPrevIsAlive(gameState.isAlive);
  }, [gameState.isAlive, gameState.selectedCharacter, gameState.isInGame, prevIsAlive, musicEnabled, overlayTrack, buildMusicContext, changeMusic, stopMainTheme, stopOverlay, loadMainTheme]);

  /**
   * Toggle music on/off
   */
  const toggleMusic = useCallback(() => {
    const newState = !musicEnabled;
    setMusicEnabled(newState);
    localStorage.setItem('gemini-os-music-enabled', JSON.stringify(newState));

    if (newState) {
      // Turning music ON - resume playback
      console.log('[AudioManager] Music enabled, resuming playback...');
      play(); // Now properly resumes main theme
    } else {
      // Turning music OFF - pause ALL audio (main theme, overlay, everything)
      console.log('[AudioManager] Music disabled, pausing all audio...');
      pause(); // Now pauses ALL audio including main theme and overlay
    }
  }, [musicEnabled, play, pause]);

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

              {/* Main theme and overlay info */}
              {musicEnabled && (mainTheme || overlayTrack || currentTrack) && (
                <div className="border-t border-gray-700 pt-3 mt-3">
                  {/* Main Theme */}
                  {mainTheme && (
                    <div className="mb-2">
                      <div className="text-xs text-gray-400 mb-1">🎵 Main Theme:</div>
                      <div className="text-xs text-purple-300 truncate" title={mainTheme.prompt}>
                        {mainTheme.prompt.slice(0, 50)}...
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Model: {mainTheme.model} • {mainTheme.duration}s loop
                      </div>
                    </div>
                  )}

                  {/* Battle Overlay */}
                  {overlayTrack && (
                    <div className="mb-2 bg-red-900/20 p-2 rounded border border-red-500/30">
                      <div className="text-xs text-red-300 mb-1">⚔️ Battle Layer:</div>
                      <div className="text-xs text-red-200 truncate" title={overlayTrack.prompt}>
                        {overlayTrack.prompt.slice(0, 50)}...
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Model: {overlayTrack.model}
                      </div>
                    </div>
                  )}

                  {/* Legacy single track (defeat/victory) */}
                  {currentTrack && !mainTheme && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Now Playing:</div>
                      <div className="text-xs text-purple-300 truncate" title={currentTrack.prompt}>
                        {currentTrack.prompt.slice(0, 60)}...
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Model: {currentTrack.model}
                      </div>
                    </div>
                  )}
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
