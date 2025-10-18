/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SpeechRequest,
  SpeechFile,
  VoiceSettings,
  CharacterArchetype,
  VoiceEmotion,
  DialogueSpeechContext,
  SpeechPlaybackState,
} from '../types/voice';
import { generateSpeech } from './falTTSClient';
import { voiceProfileManager, inferArchetypeFromGameObject, inferEmotionFromContext } from './voiceProfiles';
import { speechCache } from './speechCache';

/**
 * Default voice settings
 * NOTE: autoPlay is FALSE by default - user must click to play speech
 */
const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: true,
  volume: 0.7,
  autoPlay: false, // Click-to-play by default
  narratorEnabled: true,
  speed: 1.0,
  preferredModel: 'elevenlabs', // Using ElevenLabs for premium quality
};

/**
 * Speech Service
 * High-level API for generating and playing character speech
 */
class SpeechService {
  private settings: VoiceSettings = { ...DEFAULT_VOICE_SETTINGS };
  private playbackState: SpeechPlaybackState = {
    isPlaying: false,
    currentSpeech: null,
    queue: [],
    volume: 0.7,
  };
  private audioContext?: AudioContext;
  private currentSource?: AudioBufferSourceNode;
  private gainNode?: GainNode;

  /**
   * Initialize Web Audio API context
   */
  private initAudioContext(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.settings.volume;
    }
  }

  /**
   * Generate speech for a dialogue line
   */
  async generateDialogueSpeech(context: DialogueSpeechContext): Promise<SpeechFile> {
    const { speaker, text, emotion, sceneContext } = context;

    // Infer emotion if not provided
    const actualEmotion = emotion || inferEmotionFromContext(text, sceneContext);

    // Get voice profile for character
    const voiceProfile = voiceProfileManager.getArchetypeVoice(
      speaker.type,
      actualEmotion
    );

    // Apply global speed setting
    if (voiceProfile.speed) {
      voiceProfile.speed *= this.settings.speed;
    }

    // Check cache first
    const cached = await speechCache.get(text, speaker.type, actualEmotion);
    if (cached) {
      console.log(`[SpeechService] Using cached speech for "${speaker.name}"`);
      return cached.speechFile;
    }

    // Generate new speech
    console.log(`[SpeechService] Generating speech for "${speaker.name}": "${text.slice(0, 50)}..."`);
    const speechFile = await generateSpeech(text, voiceProfile);

    // Cache the result
    await speechCache.set(speechFile, speaker.type, actualEmotion, this.settings.autoPlay);

    return speechFile;
  }

  /**
   * Generate speech for a simple text (with character type)
   */
  async generateSpeech(
    text: string,
    characterType: CharacterArchetype = 'narrator',
    emotion?: VoiceEmotion
  ): Promise<SpeechFile> {
    // Check cache first
    const cached = await speechCache.get(text, characterType, emotion);
    if (cached) {
      return cached.speechFile;
    }

    // Get voice profile
    const voiceProfile = voiceProfileManager.getArchetypeVoice(characterType, emotion);

    // Apply global speed setting
    if (voiceProfile.speed) {
      voiceProfile.speed *= this.settings.speed;
    }

    // Generate speech
    const speechFile = await generateSpeech(text, voiceProfile);

    // Cache it
    await speechCache.set(speechFile, characterType, emotion, this.settings.autoPlay);

    return speechFile;
  }

  /**
   * Play speech audio
   */
  async playSpeech(speechFile: SpeechFile): Promise<void> {
    console.log('[SpeechService] playSpeech called for:', speechFile.text.substring(0, 50));

    if (!this.settings.enabled) {
      console.log('[SpeechService] Speech disabled in settings');
      return;
    }

    console.log('[SpeechService] Initializing audio context...');
    this.initAudioContext();

    // Stop current playback if any
    this.stopSpeech();

    try {
      // Try to use cached buffer first
      const cached = await speechCache.get(
        speechFile.text,
        undefined, // We don't have character type here
        speechFile.voiceProfile.emotion
      );

      let audioBuffer: AudioBuffer;

      if (cached?.audioBuffer) {
        console.log('[SpeechService] Using cached audio buffer');
        audioBuffer = cached.audioBuffer;
      } else {
        // Fetch and decode audio
        console.log('[SpeechService] Fetching audio from URL:', speechFile.url);
        const response = await fetch(speechFile.url);
        console.log('[SpeechService] Fetch response status:', response.status);
        const arrayBuffer = await response.arrayBuffer();
        console.log('[SpeechService] Got array buffer, size:', arrayBuffer.byteLength);
        audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        console.log('[SpeechService] Audio decoded, duration:', audioBuffer.duration);
      }

      // Create source and connect to gain node
      console.log('[SpeechService] Creating audio source...');
      const source = this.audioContext!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode!);
      console.log('[SpeechService] Audio source connected to gain node');

      // Handle playback end
      source.onended = () => {
        this.playbackState.isPlaying = false;
        this.playbackState.currentSpeech = null;
        this.currentSource = undefined;

        // Play next in queue if any
        this.playNextInQueue();
      };

      // Start playback
      console.log('[SpeechService] Starting audio playback...');
      source.start(0);
      this.currentSource = source;

      // Update state
      this.playbackState.isPlaying = true;
      this.playbackState.currentSpeech = speechFile;

      console.log(`[SpeechService] ✅ NOW PLAYING: "${speechFile.text.slice(0, 50)}..."`);
      console.log(`[SpeechService] Volume: ${this.gainNode!.gain.value}, Duration: ${audioBuffer.duration}s`);
    } catch (error) {
      console.error('[SpeechService] ❌ Playback failed:', error);
      this.playbackState.isPlaying = false;
      this.playbackState.currentSpeech = null;
      throw error;
    }
  }

  /**
   * Stop current speech playback
   */
  stopSpeech(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (error) {
        // Ignore errors if already stopped
      }
      this.currentSource = undefined;
    }

    this.playbackState.isPlaying = false;
    this.playbackState.currentSpeech = null;
  }

  /**
   * Queue speech for playback
   */
  queueSpeech(request: SpeechRequest): void {
    this.playbackState.queue.push(request);

    // Auto-play if enabled and nothing is playing
    if (this.settings.autoPlay && !this.playbackState.isPlaying) {
      this.playNextInQueue();
    }
  }

  /**
   * Play next speech in queue
   */
  private async playNextInQueue(): Promise<void> {
    if (this.playbackState.queue.length === 0) {
      return;
    }

    const request = this.playbackState.queue.shift()!;

    try {
      const speechFile = await generateSpeech(request.text, request.voiceProfile);
      await this.playSpeech(speechFile);
    } catch (error) {
      console.error('[SpeechService] Queue playback failed:', error);
      // Continue to next in queue
      this.playNextInQueue();
    }
  }

  /**
   * Clear speech queue
   */
  clearQueue(): void {
    this.playbackState.queue = [];
  }

  /**
   * Generate and play speech in one call
   */
  async speak(
    text: string,
    characterType: CharacterArchetype = 'narrator',
    emotion?: VoiceEmotion,
    autoPlay: boolean = true
  ): Promise<SpeechFile> {
    const speechFile = await this.generateSpeech(text, characterType, emotion);

    // If autoPlay parameter is explicitly true, play regardless of global setting
    // This allows buttons to override the global autoPlay setting
    if (autoPlay) {
      await this.playSpeech(speechFile);
    }

    return speechFile;
  }

  /**
   * Generate and play dialogue speech
   */
  async speakDialogue(context: DialogueSpeechContext, autoPlay: boolean = true): Promise<SpeechFile> {
    const speechFile = await this.generateDialogueSpeech(context);

    // If autoPlay parameter is explicitly true, play regardless of global setting
    if (autoPlay) {
      await this.playSpeech(speechFile);
    }

    return speechFile;
  }

  /**
   * Update voice settings
   */
  updateSettings(settings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...settings };

    // Update gain if volume changed
    if (settings.volume !== undefined && this.gainNode) {
      this.gainNode.gain.value = settings.volume;
      this.playbackState.volume = settings.volume;
    }

    console.log('[SpeechService] Settings updated:', this.settings);
  }

  /**
   * Get current settings
   */
  getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  /**
   * Get playback state
   */
  getPlaybackState(): SpeechPlaybackState {
    return { ...this.playbackState };
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.updateSettings({ volume: clampedVolume });
  }

  /**
   * Toggle speech enabled/disabled
   */
  toggleEnabled(): boolean {
    this.settings.enabled = !this.settings.enabled;

    if (!this.settings.enabled) {
      this.stopSpeech();
      this.clearQueue();
    }

    return this.settings.enabled;
  }

  /**
   * Preload speech for upcoming dialogue
   * Useful for reducing latency
   */
  async preloadSpeech(
    text: string,
    characterType: CharacterArchetype,
    emotion?: VoiceEmotion
  ): Promise<void> {
    // Check if already cached
    if (speechCache.has(text, characterType, emotion)) {
      return;
    }

    // Generate and cache in background
    try {
      await this.generateSpeech(text, characterType, emotion);
      console.log(`[SpeechService] Preloaded: "${text.slice(0, 30)}..."`);
    } catch (error) {
      console.warn('[SpeechService] Preload failed:', error);
    }
  }

  /**
   * Batch preload multiple speeches
   */
  async preloadBatch(
    speeches: Array<{
      text: string;
      characterType: CharacterArchetype;
      emotion?: VoiceEmotion;
    }>
  ): Promise<void> {
    console.log(`[SpeechService] Preloading ${speeches.length} speeches...`);

    const promises = speeches.map((s) =>
      this.preloadSpeech(s.text, s.characterType, s.emotion)
    );

    await Promise.allSettled(promises);

    console.log('[SpeechService] Batch preload complete');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return speechCache.getStats();
  }

  /**
   * Clear speech cache
   */
  clearCache(): void {
    speechCache.clear();
  }
}

/**
 * Global speech service instance
 */
export const speechService = new SpeechService();

/**
 * Convenience exports for common operations
 */

/**
 * Generate and play speech for text
 */
export const speak = (
  text: string,
  characterType: CharacterArchetype = 'narrator',
  emotion?: VoiceEmotion
): Promise<SpeechFile> => {
  return speechService.speak(text, characterType, emotion);
};

/**
 * Generate speech without playing
 */
export const generateSpeechOnly = (
  text: string,
  characterType: CharacterArchetype = 'narrator',
  emotion?: VoiceEmotion
): Promise<SpeechFile> => {
  return speechService.generateSpeech(text, characterType, emotion);
};

/**
 * Play pre-generated speech
 */
export const playSpeechFile = (speechFile: SpeechFile): Promise<void> => {
  return speechService.playSpeech(speechFile);
};

/**
 * Stop current speech
 */
export const stopSpeech = (): void => {
  speechService.stopSpeech();
};

/**
 * Preload speech for later use
 */
export const preloadSpeech = (
  text: string,
  characterType: CharacterArchetype,
  emotion?: VoiceEmotion
): Promise<void> => {
  return speechService.preloadSpeech(text, characterType, emotion);
};
