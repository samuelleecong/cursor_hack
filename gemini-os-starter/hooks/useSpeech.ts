/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SpeechFile,
  CharacterArchetype,
  VoiceEmotion,
  DialogueSpeechContext,
} from '../types/voice';
import { speechService } from '../services/speechService';
import { inferArchetypeFromGameObject, inferEmotionFromContext } from '../services/voiceProfiles';

/**
 * Hook for managing character speech in React components
 */
export const useSpeech = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSpeech, setCurrentSpeech] = useState<SpeechFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track playback state
  useEffect(() => {
    const interval = setInterval(() => {
      const playbackState = speechService.getPlaybackState();
      setIsPlaying(playbackState.isPlaying);
      setCurrentSpeech(playbackState.currentSpeech);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  /**
   * Generate and optionally play speech
   */
  const speak = useCallback(
    async (
      text: string,
      characterType: CharacterArchetype = 'narrator',
      emotion?: VoiceEmotion,
      autoPlay: boolean = true
    ): Promise<SpeechFile | null> => {
      setError(null);
      setIsGenerating(true);

      try {
        const speechFile = await speechService.speak(text, characterType, emotion, autoPlay);
        return speechFile;
      } catch (err: any) {
        console.error('[useSpeech] Failed to generate speech:', err);
        setError(err.message || 'Speech generation failed');
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  /**
   * Generate and play dialogue speech with context
   */
  const speakDialogue = useCallback(
    async (
      context: DialogueSpeechContext,
      autoPlay: boolean = true
    ): Promise<SpeechFile | null> => {
      setError(null);
      setIsGenerating(true);

      try {
        const speechFile = await speechService.speakDialogue(context, autoPlay);
        return speechFile;
      } catch (err: any) {
        console.error('[useSpeech] Failed to generate dialogue speech:', err);
        setError(err.message || 'Speech generation failed');
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  /**
   * Stop current speech playback
   */
  const stop = useCallback(() => {
    speechService.stopSpeech();
  }, []);

  /**
   * Preload speech for later use
   */
  const preload = useCallback(
    async (
      text: string,
      characterType: CharacterArchetype,
      emotion?: VoiceEmotion
    ): Promise<void> => {
      try {
        await speechService.preloadSpeech(text, characterType, emotion);
      } catch (err) {
        console.warn('[useSpeech] Preload failed:', err);
      }
    },
    []
  );

  return {
    speak,
    speakDialogue,
    stop,
    preload,
    isGenerating,
    isPlaying,
    currentSpeech,
    error,
  };
};

/**
 * Hook for automatic dialogue speech
 * Automatically speaks when dialogue text changes
 */
export const useAutoSpeech = (
  text: string | null,
  characterType: CharacterArchetype = 'narrator',
  emotion?: VoiceEmotion,
  enabled: boolean = true
) => {
  const { speak, isGenerating, isPlaying, error } = useSpeech();
  const previousTextRef = useRef<string | null>(null);

  useEffect(() => {
    // Only speak if text changed and is not empty
    if (enabled && text && text !== previousTextRef.current) {
      previousTextRef.current = text;

      // Auto-detect emotion if not provided
      const actualEmotion = emotion || inferEmotionFromContext(text);

      // Speak with auto-play
      speak(text, characterType, actualEmotion, true);
    }
  }, [text, characterType, emotion, enabled, speak]);

  return {
    isGenerating,
    isPlaying,
    error,
  };
};

/**
 * Hook for NPC/object interaction speech
 * Integrates with game objects
 */
export const useNPCSpeech = () => {
  const { speak, isGenerating, isPlaying } = useSpeech();

  /**
   * Speak NPC dialogue based on game object
   */
  const speakNPC = useCallback(
    async (
      npcType: string,
      text: string,
      emotion?: VoiceEmotion
    ): Promise<void> => {
      const archetype = inferArchetypeFromGameObject(npcType);
      const actualEmotion = emotion || inferEmotionFromContext(text);

      await speak(text, archetype, actualEmotion, true);
    },
    [speak]
  );

  return {
    speakNPC,
    isGenerating,
    isPlaying,
  };
};

/**
 * Hook for narrator voice
 * Specifically for game narration
 */
export const useNarrator = () => {
  const { speak, isGenerating, isPlaying } = useSpeech();

  const narrate = useCallback(
    async (text: string, emotion: VoiceEmotion = 'neutral'): Promise<void> => {
      await speak(text, 'narrator', emotion, true);
    },
    [speak]
  );

  return {
    narrate,
    isGenerating,
    isPlaying,
  };
};

/**
 * Hook for batch preloading speech
 * Useful for preloading dialogue options or upcoming scenes
 */
export const usePreloadSpeech = () => {
  const [isPreloading, setIsPreloading] = useState(false);

  const preloadBatch = useCallback(
    async (
      speeches: Array<{
        text: string;
        characterType: CharacterArchetype;
        emotion?: VoiceEmotion;
      }>
    ): Promise<void> => {
      setIsPreloading(true);
      try {
        await speechService.preloadBatch(speeches);
      } catch (err) {
        console.error('[usePreloadSpeech] Batch preload failed:', err);
      } finally {
        setIsPreloading(false);
      }
    },
    []
  );

  return {
    preloadBatch,
    isPreloading,
  };
};

export default useSpeech;
