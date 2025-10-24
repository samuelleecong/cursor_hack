/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SECURE VERSION - Uses backend proxy instead of exposing API key
 *
 * Migration guide:
 * 1. Replace all fal.subscribe() calls with falProxySubscribe()
 * 2. Remove fal.config() initialization
 * 3. Deploy backend proxy to Vercel/Netlify
 */

import { MusicModel, AudioFile } from '../types/audio';
import { falProxySubscribe } from './falProxyClient';

/**
 * Model endpoint mapping
 */
const MODEL_ENDPOINTS: Record<MusicModel, string> = {
  'cassetteai': 'cassetteai/music-generator',
  'minimax': 'fal-ai/minimax-music',
};

/**
 * Default duration for each model (in seconds)
 */
const DEFAULT_DURATIONS: Record<MusicModel, number> = {
  'cassetteai': 15,
  'minimax': 20,
};

/**
 * Generate music using secure backend proxy
 */
export const generateMusic = async (
  prompt: string,
  model: MusicModel = 'cassetteai',
  duration?: number,
  enableFallback: boolean = true
): Promise<AudioFile> => {
  const actualDuration = duration || DEFAULT_DURATIONS[model];
  const endpoint = MODEL_ENDPOINTS[model];

  console.log(`[FalAudio] Generating ${actualDuration}s music with ${model}`);
  console.log(`[FalAudio] Prompt: "${prompt}"`);

  try {
    const startTime = Date.now();

    // Use secure backend proxy instead of direct fal.subscribe
    const result = await falProxySubscribe(endpoint, {
      input: {
        prompt,
        duration: actualDuration,
      },
      logs: true,
    });

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

    // Automatic fallback to cassetteai
    if (enableFallback && model !== 'cassetteai') {
      console.warn(`[FalAudio] Falling back to cassetteai...`);
      return generateMusic(prompt, 'cassetteai', 15, false);
    }

    throw new Error(`Music generation failed: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Generate room ambience music
 */
export const generateRoomMusic = async (prompt: string): Promise<AudioFile> => {
  return generateMusic(prompt, 'cassetteai', 15);
};

/**
 * Generate battle music
 */
export const generateBattleMusic = async (prompt: string): Promise<AudioFile> => {
  return generateMusic(prompt, 'cassetteai', 18);
};

/**
 * Generate story moment music
 */
export const generateStoryMusic = async (prompt: string): Promise<AudioFile> => {
  return generateMusic(prompt, 'minimax', 20);
};
