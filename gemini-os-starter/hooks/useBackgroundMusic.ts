/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { AudioFile, AudioContext, MusicGenerationContext } from '../types/audio';
import { getMusicForContext } from '../services/audioService';

interface UseBackgroundMusicOptions {
  enabled?: boolean;
  volume?: number;
  crossfadeDuration?: number;
  autoPlay?: boolean;
}

interface UseBackgroundMusicReturn {
  isPlaying: boolean;
  isLoading: boolean;
  currentTrack: AudioFile | null;
  error: string | null;
  play: () => void;
  pause: () => void;
  setVolume: (volume: number) => void;
  changeMusic: (context: MusicGenerationContext, audioContext: AudioContext) => Promise<void>;
}

/**
 * React hook for managing background music with smooth transitions
 */
export const useBackgroundMusic = (
  options: UseBackgroundMusicOptions = {}
): UseBackgroundMusicReturn => {
  const {
    enabled = true,
    volume: initialVolume = 0.5,
    crossfadeDuration = 2000,
    autoPlay = true,
  } = options;

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<AudioFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs for audio elements
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef(initialVolume);

  // Audio context for advanced playback
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  /**
   * Initialize Web Audio API context
   */
  useEffect(() => {
    if (!enabled) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContextClass();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.connect(audioContextRef.current.destination);
    gainNodeRef.current.gain.value = volumeRef.current;

    return () => {
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, [enabled]);

  /**
   * Set volume
   */
  const setVolume = useCallback((newVolume: number) => {
    volumeRef.current = Math.max(0, Math.min(1, newVolume));
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volumeRef.current;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = volumeRef.current;
    }
  }, []);

  /**
   * Play current track
   */
  const play = useCallback(() => {
    if (currentAudioRef.current && enabled) {
      currentAudioRef.current.play().catch((err) => {
        console.error('[useBackgroundMusic] Play failed:', err);
        setError('Failed to play music');
      });
      setIsPlaying(true);
    }
  }, [enabled]);

  /**
   * Pause current track
   */
  const pause = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  /**
   * Crossfade from current track to next track
   */
  const crossfade = useCallback(
    (fromAudio: HTMLAudioElement, toAudio: HTMLAudioElement, duration: number): Promise<void> => {
      return new Promise((resolve) => {
        const steps = 50;
        const stepDuration = duration / steps;
        let step = 0;

        const interval = setInterval(() => {
          step++;
          const progress = step / steps;

          fromAudio.volume = volumeRef.current * (1 - progress);
          toAudio.volume = volumeRef.current * progress;

          if (step >= steps) {
            clearInterval(interval);
            fromAudio.pause();
            fromAudio.volume = volumeRef.current;
            resolve();
          }
        }, stepDuration);
      });
    },
    []
  );

  /**
   * Change music to a new track with crossfade
   */
  const changeMusic = useCallback(
    async (context: MusicGenerationContext, audioContext: AudioContext) => {
      if (!enabled) return;

      setIsLoading(true);
      setError(null);

      try {
        // Generate or retrieve music
        const audioFile = await getMusicForContext(context, audioContext);
        setCurrentTrack(audioFile);

        console.log(`[useBackgroundMusic] Loading: ${audioFile.url}`);

        // Create new audio element
        const newAudio = new Audio();
        newAudio.crossOrigin = 'anonymous'; // Enable CORS for external audio
        newAudio.src = audioFile.url; // Set source
        newAudio.loop = audioContext === 'room' || audioContext === 'battle'; // Loop room and battle music
        newAudio.preload = 'auto';
        newAudio.load(); // Explicitly start loading

        console.log(`[useBackgroundMusic] Audio element created, loading started...`);

        // Wait for audio to be ready - try multiple events
        try {
          await new Promise((resolve, reject) => {
            let resolved = false;
            const handleResolve = () => {
              if (!resolved) {
                resolved = true;
                resolve(undefined);
              }
            };

            // Multiple events - whichever fires first
            newAudio.addEventListener('canplaythrough', handleResolve, { once: true });
            newAudio.addEventListener('loadeddata', handleResolve, { once: true });
            newAudio.addEventListener('loadedmetadata', handleResolve, { once: true });
            newAudio.addEventListener('error', (e) => {
              if (!resolved) {
                resolved = true;
                reject(e);
              }
            }, { once: true });

            // Longer timeout - WAV files can be large
            setTimeout(() => {
              if (!resolved) {
                resolved = true;
                console.warn('[useBackgroundMusic] Load events did not fire, trying to play anyway...');
                resolve(undefined); // Don't reject, just try to play
              }
            }, 30000); // 30 seconds
          });

          console.log(`[useBackgroundMusic] Audio loaded, ready to play`);
        } catch (loadError) {
          console.warn('[useBackgroundMusic] Audio load error, attempting to play anyway:', loadError);
          // Continue anyway - sometimes audio works even if load events fail
        }

        // Crossfade if there's a current track
        if (currentAudioRef.current && isPlaying) {
          // Start new track at volume 0 for crossfade
          newAudio.volume = 0;

          try {
            await newAudio.play();
            console.log('[useBackgroundMusic] Starting crossfade...');

            nextAudioRef.current = newAudio;
            await crossfade(currentAudioRef.current, newAudio, crossfadeDuration);
            currentAudioRef.current = newAudio;
            nextAudioRef.current = null;

            console.log(`[useBackgroundMusic] Crossfade complete`);
          } catch (playError: any) {
            console.error('[useBackgroundMusic] Crossfade play failed:', playError);
            // Fall back to direct replacement
            if (currentAudioRef.current) {
              currentAudioRef.current.pause();
            }
            currentAudioRef.current = newAudio;
            newAudio.volume = volumeRef.current;
            await newAudio.play();
            console.log('[useBackgroundMusic] Direct play (crossfade failed)');
          }
        } else {
          // No crossfade, just start playing at full volume
          currentAudioRef.current = newAudio;
          newAudio.volume = volumeRef.current;

          if (autoPlay) {
            try {
              console.log(`[useBackgroundMusic] Attempting to play at volume ${volumeRef.current}...`);
              const playPromise = newAudio.play();

              if (playPromise !== undefined) {
                await playPromise;
                setIsPlaying(true);
                console.log(`[useBackgroundMusic] ✅ Playing successfully!`);
              }
            } catch (playError: any) {
              console.error('[useBackgroundMusic] Autoplay blocked by browser:', playError);
              setError('Click anywhere to enable music (browser autoplay policy)');

              // Attach a one-time click handler to start music
              const handleClick = async () => {
                try {
                  await newAudio.play();
                  setIsPlaying(true);
                  setError(null);
                  console.log('[useBackgroundMusic] ✅ Music started after user interaction');
                  document.removeEventListener('click', handleClick);
                } catch (e) {
                  console.error('[useBackgroundMusic] Failed to play after click:', e);
                }
              };
              document.addEventListener('click', handleClick, { once: true });
            }
          }
        }

        console.log(`[useBackgroundMusic] Now playing: ${audioFile.prompt.slice(0, 50)}...`);
      } catch (err: any) {
        console.error('[useBackgroundMusic] Failed to change music:', err);
        setError(err.message || 'Failed to load music');
      } finally {
        setIsLoading(false);
      }
    },
    [enabled, isPlaying, crossfadeDuration, crossfade, autoPlay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (nextAudioRef.current) {
        nextAudioRef.current.pause();
        nextAudioRef.current = null;
      }
    };
  }, []);

  return {
    isPlaying,
    isLoading,
    currentTrack,
    error,
    play,
    pause,
    setVolume,
    changeMusic,
  };
};
