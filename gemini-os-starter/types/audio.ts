/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Room, StoryMode, StoryConsequence, BattleState } from './index';

/**
 * Available music generation models on fal.ai
 * Note: stable-audio removed due to 404 errors, using cassetteai for all music types
 */
export type MusicModel = 'cassetteai' | 'minimax';

/**
 * Audio context types for different game situations
 */
export type AudioContext = 'room' | 'battle' | 'story-moment' | 'victory' | 'defeat' | 'menu';

/**
 * Music mood/intensity levels
 */
export type MusicMood = 'calm' | 'tense' | 'epic' | 'mysterious' | 'triumphant' | 'somber' | 'energetic';

/**
 * Audio file data structure
 */
export interface AudioFile {
  url: string;
  duration: number;
  model: MusicModel;
  generatedAt: number;
  prompt: string;
}

/**
 * Cached audio data with metadata
 */
export interface CachedAudio {
  cacheKey: string;
  audioFile: AudioFile;
  audioBuffer?: AudioBuffer;
  lastAccessed: number;
  accessCount: number;
}

/**
 * Audio cache storage
 */
export interface AudioCacheStore {
  roomMusic: Map<string, CachedAudio>;
  battleMusic: Map<string, CachedAudio>;
  storyMusic: Map<string, CachedAudio>;
  maxCacheSize: number;
  currentSize: number;
}

/**
 * Music generation context - all the game state needed to generate appropriate music
 */
export interface MusicGenerationContext {
  storyContext: string | null;
  storyMode: StoryMode;
  currentRoom?: Room;
  playerHP?: number;
  maxHP?: number;
  recentConsequences?: StoryConsequence[];
  battleState?: BattleState | null;
  characterClass?: string;
  roomCounter?: number;
}

/**
 * Music generation request
 */
export interface MusicGenerationRequest {
  context: MusicGenerationContext;
  audioContext: AudioContext;
  model: MusicModel;
  duration?: number;
  forceRegenerate?: boolean;
}

/**
 * Music playback state
 */
export interface MusicPlaybackState {
  isPlaying: boolean;
  currentTrack: AudioFile | null;
  volume: number;
  isFading: boolean;
  currentContext: AudioContext | null;
}

/**
 * Audio settings that user can control
 */
export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  crossfadeDuration: number; // in milliseconds
}

/**
 * Result from fal.ai music generation
 */
export interface FalAudioResponse {
  audio_file: {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  };
  duration?: number;
  seed?: number;
}

/**
 * Error types for audio system
 */
export type AudioError =
  | 'GENERATION_FAILED'
  | 'CACHE_ERROR'
  | 'PLAYBACK_ERROR'
  | 'INVALID_CONTEXT'
  | 'API_KEY_MISSING'
  | 'NETWORK_ERROR';

/**
 * Audio event for tracking
 */
export interface AudioEvent {
  type: 'generation_started' | 'generation_completed' | 'playback_started' | 'playback_stopped' | 'error';
  context: AudioContext;
  timestamp: number;
  error?: AudioError;
  metadata?: Record<string, any>;
}
