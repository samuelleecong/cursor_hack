/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AudioFile, CachedAudio, AudioCacheStore, AudioContext } from '../types/audio';
import { preloadAudioBuffer } from './falAudioClient';

/**
 * Maximum cache size (number of tracks to keep in memory)
 */
const MAX_CACHE_SIZE = 20;

/**
 * In-memory cache for generated music
 * Uses LRU (Least Recently Used) eviction policy
 */
class AudioCache {
  private store: AudioCacheStore = {
    roomMusic: new Map(),
    battleMusic: new Map(),
    storyMusic: new Map(),
    maxCacheSize: MAX_CACHE_SIZE,
    currentSize: 0,
  };

  /**
   * Generate cache key from context
   */
  private generateCacheKey(context: string, audioContext: AudioContext): string {
    // Create a hash-like key from the context
    const normalized = context.toLowerCase().trim().replace(/\s+/g, '_');
    return `${audioContext}_${normalized}`;
  }

  /**
   * Get the appropriate cache map for the audio context
   */
  private getCacheMap(audioContext: AudioContext): Map<string, CachedAudio> {
    switch (audioContext) {
      case 'room':
        return this.store.roomMusic;
      case 'battle':
        return this.store.battleMusic;
      case 'story-moment':
        return this.store.storyMusic;
      default:
        return this.store.roomMusic;
    }
  }

  /**
   * Get cached audio if it exists
   */
  async get(contextKey: string, audioContext: AudioContext): Promise<CachedAudio | null> {
    const cacheKey = this.generateCacheKey(contextKey, audioContext);
    const cacheMap = this.getCacheMap(audioContext);
    const cached = cacheMap.get(cacheKey);

    if (cached) {
      // Update access metadata
      cached.lastAccessed = Date.now();
      cached.accessCount += 1;

      console.log(`[AudioCache] HIT for ${cacheKey} (accessed ${cached.accessCount} times)`);
      return cached;
    }

    console.log(`[AudioCache] MISS for ${cacheKey}`);
    return null;
  }

  /**
   * Store audio in cache
   */
  async set(
    contextKey: string,
    audioContext: AudioContext,
    audioFile: AudioFile,
    preload: boolean = false
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(contextKey, audioContext);
    const cacheMap = this.getCacheMap(audioContext);

    // Evict old entries if cache is full
    if (this.store.currentSize >= this.store.maxCacheSize) {
      this.evictLRU();
    }

    // Optionally preload the audio buffer for instant playback
    let audioBuffer: AudioBuffer | undefined;
    if (preload) {
      try {
        audioBuffer = await preloadAudioBuffer(audioFile.url);
        console.log(`[AudioCache] Preloaded buffer for ${cacheKey}`);
      } catch (error) {
        console.warn(`[AudioCache] Failed to preload buffer for ${cacheKey}:`, error);
      }
    }

    const cached: CachedAudio = {
      cacheKey,
      audioFile,
      audioBuffer,
      lastAccessed: Date.now(),
      accessCount: 1,
    };

    cacheMap.set(cacheKey, cached);
    this.store.currentSize += 1;

    console.log(`[AudioCache] STORED ${cacheKey} (cache size: ${this.store.currentSize}/${this.store.maxCacheSize})`);
  }

  /**
   * Evict the least recently used item from cache
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    let oldestMap: Map<string, CachedAudio> | null = null;

    // Find the least recently used item across all caches
    const allMaps = [
      this.store.roomMusic,
      this.store.battleMusic,
      this.store.storyMusic,
    ];

    for (const cacheMap of allMaps) {
      for (const [key, cached] of cacheMap.entries()) {
        if (cached.lastAccessed < oldestTime) {
          oldestTime = cached.lastAccessed;
          oldestKey = key;
          oldestMap = cacheMap;
        }
      }
    }

    if (oldestKey && oldestMap) {
      oldestMap.delete(oldestKey);
      this.store.currentSize -= 1;
      console.log(`[AudioCache] EVICTED ${oldestKey} (LRU)`);
    }
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.store.roomMusic.clear();
    this.store.battleMusic.clear();
    this.store.storyMusic.clear();
    this.store.currentSize = 0;
    console.log('[AudioCache] CLEARED all caches');
  }

  /**
   * Clear specific context cache
   */
  clearContext(audioContext: AudioContext): void {
    const cacheMap = this.getCacheMap(audioContext);
    const size = cacheMap.size;
    cacheMap.clear();
    this.store.currentSize -= size;
    console.log(`[AudioCache] CLEARED ${audioContext} cache (${size} items)`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      totalSize: this.store.currentSize,
      maxSize: this.store.maxCacheSize,
      roomTracks: this.store.roomMusic.size,
      battleTracks: this.store.battleMusic.size,
      storyTracks: this.store.storyMusic.size,
      utilizationPercent: (this.store.currentSize / this.store.maxCacheSize) * 100,
    };
  }

  /**
   * Check if a specific track is cached
   */
  has(contextKey: string, audioContext: AudioContext): boolean {
    const cacheKey = this.generateCacheKey(contextKey, audioContext);
    const cacheMap = this.getCacheMap(audioContext);
    return cacheMap.has(cacheKey);
  }
}

// Export singleton instance
export const audioCache = new AudioCache();
