/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Text-to-Speech models available on fal.ai
 */
export type TTSModel = 'dia-tts' | 'minimax-speech' | 'playai-tts' | 'vibevoice' | 'elevenlabs';

/**
 * Voice emotion/tone settings
 */
export type VoiceEmotion =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'fearful'
  | 'surprised'
  | 'mysterious'
  | 'heroic'
  | 'menacing'
  | 'friendly'
  | 'sarcastic';

/**
 * Character archetype for voice selection
 */
export type CharacterArchetype =
  | 'hero'
  | 'villain'
  | 'merchant'
  | 'guide'
  | 'enemy'
  | 'narrator'
  | 'mystic'
  | 'warrior'
  | 'scholar'
  | 'trickster';

/**
 * Voice configuration for a character
 */
export interface VoiceProfile {
  model: TTSModel;
  voiceId?: string; // For MiniMax/PlayAI predefined voices
  pitch?: number; // -1.0 to 1.0
  speed?: number; // 0.5 to 2.0
  emotion?: VoiceEmotion;
  stability?: number; // 0.0 to 1.0 (voice consistency)
  style?: number; // 0.0 to 1.0 (expressiveness)
  description?: string; // For Dia TTS voice design
}

/**
 * Speech generation request
 */
export interface SpeechRequest {
  text: string;
  voiceProfile: VoiceProfile;
  characterType?: CharacterArchetype;
  contextEmotion?: VoiceEmotion;
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Generated speech audio file
 */
export interface SpeechFile {
  url: string;
  duration: number;
  model: TTSModel;
  generatedAt: number;
  text: string;
  voiceProfile: VoiceProfile;
}

/**
 * Cached speech with metadata
 */
export interface CachedSpeech {
  cacheKey: string;
  speechFile: SpeechFile;
  audioBuffer?: AudioBuffer;
  lastAccessed: number;
  accessCount: number;
  characterType?: CharacterArchetype;
}

/**
 * Speech playback state
 */
export interface SpeechPlaybackState {
  isPlaying: boolean;
  currentSpeech: SpeechFile | null;
  queue: SpeechRequest[];
  volume: number;
}

/**
 * Voice settings that user can control
 */
export interface VoiceSettings {
  enabled: boolean;
  volume: number;
  autoPlay: boolean; // Auto-play dialogue speech
  narratorEnabled: boolean; // Enable narrator voice for descriptions
  speed: number; // Global speed multiplier
  preferredModel: TTSModel;
}

/**
 * Result from fal.ai TTS generation
 * Note: Different models may have different response structures
 */
export interface FalTTSResponse {
  audio_file?: {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  };
  audio?: {
    url: string;
  };
  url?: string;
  audio_url?: string;
  duration?: number;
  [key: string]: any; // Allow additional fields
}

/**
 * Voice design parameters (for models that support it)
 */
export interface VoiceDesign {
  gender?: 'male' | 'female' | 'neutral';
  age?: 'young' | 'middle-aged' | 'elderly';
  accent?: string;
  characteristics: string[]; // e.g., ['deep', 'authoritative', 'warm']
  description: string; // Natural language description for AI voice design
}

/**
 * Character-specific voice configuration
 */
export interface CharacterVoiceConfig {
  characterId: string;
  characterName: string;
  archetype: CharacterArchetype;
  voiceProfile: VoiceProfile;
  voiceDesign?: VoiceDesign;
  emotionOverrides?: Partial<Record<VoiceEmotion, VoiceProfile>>;
}

/**
 * Dialogue speech context
 */
export interface DialogueSpeechContext {
  speaker: {
    id: string;
    name: string;
    type: CharacterArchetype;
  };
  text: string;
  emotion?: VoiceEmotion;
  isPlayerChoice?: boolean; // If this is player-selected dialogue
  sceneContext?: string; // Battle, exploration, story moment, etc.
}

/**
 * Speech generation error types
 */
export type SpeechError =
  | 'GENERATION_FAILED'
  | 'CACHE_ERROR'
  | 'PLAYBACK_ERROR'
  | 'INVALID_TEXT'
  | 'API_KEY_MISSING'
  | 'NETWORK_ERROR'
  | 'VOICE_NOT_FOUND';

/**
 * Speech event for tracking
 */
export interface SpeechEvent {
  type: 'generation_started' | 'generation_completed' | 'playback_started' | 'playback_stopped' | 'error';
  characterType?: CharacterArchetype;
  timestamp: number;
  error?: SpeechError;
  metadata?: Record<string, any>;
}
