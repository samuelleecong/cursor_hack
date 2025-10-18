/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CharacterArchetype,
  VoiceProfile,
  VoiceEmotion,
  CharacterVoiceConfig,
  VoiceDesign,
} from '../types/voice';
import { MINIMAX_VOICE_IDS, ELEVENLABS_VOICES } from './falTTSClient';

/**
 * Default voice profiles for different character archetypes
 * NOW USING ELEVENLABS for premium quality and faster generation!
 */
export const DEFAULT_VOICE_PROFILES: Record<CharacterArchetype, VoiceProfile> = {
  hero: {
    model: 'elevenlabs',
    voiceId: ELEVENLABS_VOICES.callum,  // Game character voice
    speed: 1.0,
    emotion: 'heroic',
    stability: 0.6,
    description: 'Confident, brave, inspiring hero voice',
  },
  villain: {
    model: 'elevenlabs',
    voiceId: ELEVENLABS_VOICES.adam,  // Deep, menacing
    speed: 0.9,
    emotion: 'menacing',
    stability: 0.7,
    description: 'Dark, menacing, authoritative villain voice',
  },
  merchant: {
    model: 'elevenlabs',
    voiceId: ELEVENLABS_VOICES.charlie,  // Friendly, conversational
    speed: 1.1,
    emotion: 'friendly',
    stability: 0.5,
    description: 'Cheerful, enthusiastic merchant voice',
  },
  guide: {
    model: 'elevenlabs',
    voiceId: ELEVENLABS_VOICES.rachel,  // Calm, narrative (Bella not supported)
    speed: 1.0,
    emotion: 'neutral',
    stability: 0.7,
    description: 'Calm, knowledgeable guide voice',
  },
  enemy: {
    model: 'elevenlabs',
    voiceId: ELEVENLABS_VOICES.adam,  // Deep, menacing (Sam not supported)
    speed: 1.0,
    emotion: 'angry',
    stability: 0.5,
    description: 'Aggressive, hostile enemy voice',
  },
  narrator: {
    model: 'elevenlabs',
    voiceId: ELEVENLABS_VOICES.george,  // Warm narrator (Josh not supported)
    speed: 0.95,
    emotion: 'neutral',
    stability: 0.8,
    description: 'Clear, authoritative narrator voice with storytelling quality',
  },
  mystic: {
    model: 'elevenlabs',
    voiceId: ELEVENLABS_VOICES.rachel,  // Mysterious female (Glinda not supported)
    speed: 0.85,
    emotion: 'mysterious',
    stability: 0.6,
    description: 'Ethereal, mysterious, ancient voice with mystical qualities',
  },
  warrior: {
    model: 'elevenlabs',
    voiceId: ELEVENLABS_VOICES.callum,  // Strong, game character
    speed: 1.0,
    emotion: 'heroic',
    stability: 0.7,
    description: 'Strong, battle-hardened warrior voice',
  },
  scholar: {
    model: 'elevenlabs',
    voiceId: ELEVENLABS_VOICES.george,  // Warm, thoughtful
    speed: 0.9,
    emotion: 'neutral',
    stability: 0.8,
    description: 'Intelligent, contemplative scholar voice',
  },
  trickster: {
    model: 'elevenlabs',
    voiceId: ELEVENLABS_VOICES.charlie,  // Playful
    speed: 1.15,
    emotion: 'sarcastic',
    stability: 0.4,
    description: 'Playful, mischievous, unpredictable trickster voice',
  },
};

/**
 * Voice design templates for character archetypes
 */
export const VOICE_DESIGNS: Record<CharacterArchetype, VoiceDesign> = {
  hero: {
    gender: 'male',
    age: 'young',
    characteristics: ['confident', 'inspiring', 'courageous', 'warm'],
    description: 'Young hero with a confident, inspiring voice. Brave and determined, with warmth and charisma.',
  },
  villain: {
    gender: 'male',
    age: 'middle-aged',
    characteristics: ['menacing', 'authoritative', 'dark', 'calculated'],
    description: 'Authoritative villain with a menacing, dark voice. Cold and calculating, commanding fear and respect.',
  },
  merchant: {
    gender: 'male',
    age: 'middle-aged',
    characteristics: ['cheerful', 'enthusiastic', 'friendly', 'quick'],
    description: 'Enthusiastic merchant with a cheerful, friendly voice. Quick-talking and persuasive, always upbeat.',
  },
  guide: {
    gender: 'female',
    age: 'middle-aged',
    characteristics: ['wise', 'calm', 'reassuring', 'patient'],
    description: 'Wise guide with a calm, reassuring voice. Patient and knowledgeable, speaking with gentle authority.',
  },
  enemy: {
    gender: 'male',
    age: 'young',
    characteristics: ['aggressive', 'harsh', 'intimidating', 'rough'],
    description: 'Aggressive enemy with a harsh, intimidating voice. Rough and confrontational, full of hostility.',
  },
  narrator: {
    gender: 'neutral',
    age: 'middle-aged',
    characteristics: ['clear', 'authoritative', 'engaging', 'storyteller'],
    description: 'Professional narrator with a clear, authoritative voice. Engaging storyteller with perfect diction.',
  },
  mystic: {
    gender: 'female',
    age: 'elderly',
    characteristics: ['ethereal', 'mysterious', 'ancient', 'wise'],
    description: 'Ancient mystic with an ethereal, mysterious voice. Speaks with otherworldly wisdom and mystical presence.',
  },
  warrior: {
    gender: 'male',
    age: 'middle-aged',
    characteristics: ['strong', 'gruff', 'battle-hardened', 'direct'],
    description: 'Battle-hardened warrior with a strong, gruff voice. Direct and no-nonsense, scarred by combat.',
  },
  scholar: {
    gender: 'male',
    age: 'elderly',
    characteristics: ['intelligent', 'contemplative', 'precise', 'measured'],
    description: 'Learned scholar with an intelligent, contemplative voice. Precise and measured, speaking with academic authority.',
  },
  trickster: {
    gender: 'male',
    age: 'young',
    characteristics: ['playful', 'mischievous', 'quick', 'witty'],
    description: 'Mischievous trickster with a playful, witty voice. Quick and unpredictable, full of humor and sarcasm.',
  },
};

/**
 * Emotion-based voice adjustments
 * These modify the base voice profile based on current emotion
 */
export const EMOTION_ADJUSTMENTS: Record<VoiceEmotion, Partial<VoiceProfile>> = {
  neutral: {
    speed: 1.0,
    stability: 0.8,
  },
  happy: {
    speed: 1.1,
    stability: 0.6,
    pitch: 0.2,
  },
  sad: {
    speed: 0.85,
    stability: 0.7,
    pitch: -0.2,
  },
  angry: {
    speed: 1.15,
    stability: 0.5,
    pitch: 0.1,
  },
  fearful: {
    speed: 1.2,
    stability: 0.4,
    pitch: 0.3,
  },
  surprised: {
    speed: 1.2,
    stability: 0.5,
    pitch: 0.4,
  },
  mysterious: {
    speed: 0.9,
    stability: 0.7,
    pitch: -0.1,
  },
  heroic: {
    speed: 1.0,
    stability: 0.8,
    pitch: 0.1,
  },
  menacing: {
    speed: 0.85,
    stability: 0.8,
    pitch: -0.3,
  },
  friendly: {
    speed: 1.05,
    stability: 0.6,
    pitch: 0.2,
  },
  sarcastic: {
    speed: 1.1,
    stability: 0.5,
    pitch: 0.1,
  },
};

/**
 * Get voice profile for a character archetype
 */
export const getVoiceProfile = (
  archetype: CharacterArchetype,
  emotion?: VoiceEmotion
): VoiceProfile => {
  const baseProfile = { ...DEFAULT_VOICE_PROFILES[archetype] };

  // Apply emotion adjustments if specified
  if (emotion && emotion !== baseProfile.emotion) {
    const adjustments = EMOTION_ADJUSTMENTS[emotion];
    return {
      ...baseProfile,
      ...adjustments,
      emotion,
    };
  }

  return baseProfile;
};

/**
 * Get voice design for a character archetype
 */
export const getVoiceDesign = (archetype: CharacterArchetype): VoiceDesign => {
  return { ...VOICE_DESIGNS[archetype] };
};

/**
 * Create a custom voice profile by merging base profile with overrides
 */
export const createCustomVoiceProfile = (
  baseArchetype: CharacterArchetype,
  overrides: Partial<VoiceProfile>
): VoiceProfile => {
  const baseProfile = DEFAULT_VOICE_PROFILES[baseArchetype];
  return {
    ...baseProfile,
    ...overrides,
  };
};

/**
 * Character voice configuration cache
 */
class VoiceProfileManager {
  private customProfiles: Map<string, CharacterVoiceConfig> = new Map();

  /**
   * Register a custom voice for a character
   */
  registerCharacterVoice(config: CharacterVoiceConfig): void {
    this.customProfiles.set(config.characterId, config);
    console.log(`[VoiceProfile] Registered voice for ${config.characterName}`);
  }

  /**
   * Get voice profile for a specific character
   */
  getCharacterVoice(characterId: string, emotion?: VoiceEmotion): VoiceProfile {
    const config = this.customProfiles.get(characterId);

    if (!config) {
      // Return default hero voice if no custom profile
      return getVoiceProfile('hero', emotion);
    }

    // Check for emotion-specific override
    if (emotion && config.emotionOverrides?.[emotion]) {
      return { ...config.emotionOverrides[emotion]! };
    }

    // Apply emotion adjustments to base profile
    return getVoiceProfile(config.archetype, emotion);
  }

  /**
   * Get voice profile for character archetype
   */
  getArchetypeVoice(archetype: CharacterArchetype, emotion?: VoiceEmotion): VoiceProfile {
    return getVoiceProfile(archetype, emotion);
  }

  /**
   * Clear all custom profiles
   */
  clear(): void {
    this.customProfiles.clear();
  }

  /**
   * Get all registered characters
   */
  getRegisteredCharacters(): CharacterVoiceConfig[] {
    return Array.from(this.customProfiles.values());
  }
}

/**
 * Global voice profile manager instance
 */
export const voiceProfileManager = new VoiceProfileManager();

/**
 * Helper function to determine character archetype from game object type
 */
export const inferArchetypeFromGameObject = (objectType: string): CharacterArchetype => {
  const typeMap: Record<string, CharacterArchetype> = {
    npc: 'guide',
    enemy: 'enemy',
    merchant: 'merchant',
    boss: 'villain',
    ally: 'hero',
    narrator: 'narrator',
  };

  return typeMap[objectType.toLowerCase()] || 'guide';
};

/**
 * Helper to infer emotion from dialogue context
 */
export const inferEmotionFromContext = (text: string, context?: string): VoiceEmotion => {
  const textLower = text.toLowerCase();

  // Battle context
  if (context?.includes('battle') || context?.includes('combat')) {
    if (textLower.includes('die') || textLower.includes('kill') || textLower.includes('destroy')) {
      return 'angry';
    }
    return 'heroic';
  }

  // Sentiment analysis
  if (textLower.includes('!')) {
    if (textLower.includes('no!') || textLower.includes('stop!')) {
      return 'fearful';
    }
    if (textLower.includes('what!') || textLower.includes('how!')) {
      return 'surprised';
    }
    return 'happy';
  }

  if (textLower.includes('?') && textLower.includes('what')) {
    return 'surprised';
  }

  if (textLower.includes('...') || textLower.includes('hmm')) {
    return 'mysterious';
  }

  if (textLower.includes('haha') || textLower.includes('hehe')) {
    return 'sarcastic';
  }

  return 'neutral';
};
