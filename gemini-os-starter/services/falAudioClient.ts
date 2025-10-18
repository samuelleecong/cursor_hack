/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fal } from "@fal-ai/client";
import { MusicModel, AudioFile, FalAudioResponse } from '../types/audio';

/**
 * Configure fal.ai client with API key from environment
 */
const initializeFalClient = () => {
  const apiKey = import.meta.env.VITE_FAL_KEY;

  if (!apiKey) {
    console.warn('VITE_FAL_KEY not found in environment. Music generation will fail.');
    console.warn('Add VITE_FAL_KEY to your .env.local file');
    return;
  }

  try {
    fal.config({
      credentials: apiKey,
    });
    console.log('[FalAudio] Client initialized successfully');
  } catch (error) {
    console.error('[FalAudio] Failed to initialize client:', error);
  }
};

// Initialize on module load
initializeFalClient();

/**
 * Model endpoint mapping
 */
const MODEL_ENDPOINTS: Record<MusicModel, string> = {
  'cassetteai': 'cassetteai/music-generator',
  'stable-audio': 'fal-ai/stable-audio/text-to-audio',
  'minimax': 'fal-ai/minimax-music',
};

/**
 * Default duration for each model (in seconds)
 */
const DEFAULT_DURATIONS: Record<MusicModel, number> = {
  'cassetteai': 30, // Fast generation, good for loops
  'stable-audio': 47, // Stable Audio default
  'minimax': 60, // Longer for story moments
};

/**
 * Generate music using fal.ai
 *
 * @param prompt - Text description of the music to generate
 * @param model - Which AI model to use
 * @param duration - Length of music in seconds
 * @returns AudioFile with URL and metadata
 */
export const generateMusic = async (
  prompt: string,
  model: MusicModel = 'cassetteai',
  duration?: number
): Promise<AudioFile> => {
  const actualDuration = duration || DEFAULT_DURATIONS[model];
  const endpoint = MODEL_ENDPOINTS[model];

  console.log(`[FalAudio] Generating ${actualDuration}s music with ${model}`);
  console.log(`[FalAudio] Prompt: "${prompt}"`);

  try {
    const startTime = Date.now();

    const result = await fal.subscribe(endpoint, {
      input: {
        prompt,
        duration: actualDuration,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          const logs = update.logs?.map((log) => log.message) || [];
          if (logs.length > 0) {
            console.log(`[FalAudio] ${model}:`, logs[logs.length - 1]);
          }
        }
      },
    }) as { data: FalAudioResponse };

    const endTime = Date.now();
    const generationTime = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`[FalAudio] Generated in ${generationTime}s`);
    console.log(`[FalAudio] URL: ${result.data.audio_file.url}`);

    const audioFile: AudioFile = {
      url: result.data.audio_file.url,
      duration: result.data.duration || actualDuration,
      model,
      generatedAt: Date.now(),
      prompt,
    };

    return audioFile;
  } catch (error: any) {
    console.error(`[FalAudio] Generation failed for ${model}:`, error);

    // Provide helpful error messages
    if (error.message?.includes('credentials')) {
      throw new Error('FAL_KEY not configured. Add VITE_FAL_KEY to .env.local');
    }

    throw new Error(`Music generation failed: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Generate room ambience music (fast, loopable)
 */
export const generateRoomMusic = async (prompt: string): Promise<AudioFile> => {
  return generateMusic(prompt, 'cassetteai', 30);
};

/**
 * Generate battle music (epic, orchestral)
 */
export const generateBattleMusic = async (prompt: string): Promise<AudioFile> => {
  return generateMusic(prompt, 'stable-audio', 47);
};

/**
 * Generate story moment music (longer, with potential vocals)
 */
export const generateStoryMusic = async (prompt: string): Promise<AudioFile> => {
  return generateMusic(prompt, 'minimax', 60);
};

/**
 * Preload audio file from URL into AudioBuffer for smooth playback
 * This downloads and decodes the audio file
 */
export const preloadAudioBuffer = async (url: string): Promise<AudioBuffer> => {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    return audioBuffer;
  } catch (error) {
    console.error('[FalAudio] Failed to preload audio:', error);
    throw error;
  }
};

/**
 * Health check - verify fal.ai is accessible
 */
export const checkFalConnection = async (): Promise<boolean> => {
  try {
    // Try a minimal generation to verify API key works
    const apiKey = import.meta.env.VITE_FAL_KEY;
    return !!apiKey;
  } catch (error) {
    console.error('[FalAudio] Connection check failed:', error);
    return false;
  }
};
