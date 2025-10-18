/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Voice Speech System - Main Export
 *
 * Import everything you need for voice speech from this file:
 *
 * import { speechService, useSpeech, VoiceControls } from './services/voice';
 */

// Types
export * from '../types/voice';

// Services
export { speechService, speak, generateSpeechOnly, playSpeechFile, stopSpeech, preloadSpeech } from './speechService';
export { generateSpeech, generateDiaSpeech, generateMinimaxSpeech, generatePlayAISpeech, generateElevenLabsSpeech, generateSpeechStreaming, MINIMAX_VOICE_IDS, ELEVENLABS_VOICES } from './falTTSClient';
export { voiceProfileManager, getVoiceProfile, getVoiceDesign, createCustomVoiceProfile, inferArchetypeFromGameObject, inferEmotionFromContext, DEFAULT_VOICE_PROFILES, EMOTION_ADJUSTMENTS } from './voiceProfiles';
export { speechCache, initializeSpeechCache } from './speechCache';

// Hooks (re-export from hooks directory)
export { useSpeech, useAutoSpeech, useNPCSpeech, useNarrator, usePreloadSpeech } from '../hooks/useSpeech';

// Components (re-export from components directory)
export { VoiceControls } from '../components/VoiceControls';
export { SpeechButton } from '../components/SpeechButton';
export { SpeakableText, DialogueBox, NPCInteraction } from '../components/SpeakableText';
