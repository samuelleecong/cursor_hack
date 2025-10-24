/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * OPTIMIZATION: Audio Buffer Pool
 * Reuses AudioBuffer objects to reduce garbage collection pressure
 * Particularly beneficial for games with frequent audio playback
 */

interface PooledBuffer {
  buffer: AudioBuffer;
  lastUsed: number;
}

class AudioBufferPool {
  private pool: PooledBuffer[] = [];
  private readonly maxPoolSize = 20; // Maximum buffers to keep in pool
  private readonly maxAge = 60000; // 1 minute - buffers older than this are removed
  private context: AudioContext | null = null;

  /**
   * Initialize the audio context
   */
  private getContext(): AudioContext {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.context;
  }

  /**
   * Get a buffer from the pool or create a new one
   * @param channels - Number of audio channels (1 = mono, 2 = stereo)
   * @param duration - Duration in seconds
   * @param sampleRate - Sample rate (default: 48000 Hz)
   */
  getBuffer(channels: number, duration: number, sampleRate: number = 48000): AudioBuffer {
    // Clean up old buffers first
    this.cleanup();

    // Try to find a suitable buffer in the pool
    const targetLength = Math.ceil(duration * sampleRate);
    const poolIndex = this.pool.findIndex(
      item =>
        item.buffer.numberOfChannels === channels &&
        item.buffer.length >= targetLength &&
        item.buffer.sampleRate === sampleRate
    );

    if (poolIndex !== -1) {
      // Found a suitable buffer, remove from pool and return
      const item = this.pool.splice(poolIndex, 1)[0];
      console.log(`[AudioBufferPool] Reusing buffer (pool size: ${this.pool.length})`);
      return item.buffer;
    }

    // No suitable buffer found, create a new one
    console.log(`[AudioBufferPool] Creating new buffer (pool size: ${this.pool.length})`);
    const context = this.getContext();
    return context.createBuffer(channels, targetLength, sampleRate);
  }

  /**
   * Return a buffer to the pool for reuse
   */
  returnBuffer(buffer: AudioBuffer): void {
    // Don't add if pool is full
    if (this.pool.length >= this.maxPoolSize) {
      console.log(`[AudioBufferPool] Pool full, discarding buffer`);
      return;
    }

    // Add to pool with timestamp
    this.pool.push({
      buffer,
      lastUsed: Date.now()
    });

    console.log(`[AudioBufferPool] Buffer returned to pool (pool size: ${this.pool.length})`);
  }

  /**
   * Remove old buffers from the pool
   */
  private cleanup(): void {
    const now = Date.now();
    const initialSize = this.pool.length;

    this.pool = this.pool.filter(item => now - item.lastUsed < this.maxAge);

    if (this.pool.length < initialSize) {
      console.log(`[AudioBufferPool] Cleaned up ${initialSize - this.pool.length} old buffers`);
    }
  }

  /**
   * Clear all buffers from the pool
   */
  clear(): void {
    this.pool = [];
    console.log(`[AudioBufferPool] Pool cleared`);
  }

  /**
   * Get pool statistics
   */
  getStats(): { poolSize: number; maxPoolSize: number } {
    return {
      poolSize: this.pool.length,
      maxPoolSize: this.maxPoolSize
    };
  }

  /**
   * Close the audio context
   */
  close(): void {
    if (this.context && this.context.state !== 'closed') {
      this.context.close();
      this.context = null;
      console.log(`[AudioBufferPool] Audio context closed`);
    }
  }
}

// Export singleton instance
export const audioBufferPool = new AudioBufferPool();

/**
 * Helper: Create an audio element with pooled buffer optimization
 * For use with Web Audio API
 */
export function createOptimizedAudio(url: string): HTMLAudioElement {
  const audio = new Audio();
  audio.crossOrigin = 'anonymous';
  audio.src = url;
  audio.preload = 'auto';
  return audio;
}

/**
 * Helper: Preload and decode audio data using pooled buffer
 */
export async function preloadAudioWithPool(
  url: string,
  channels: number = 2,
  estimatedDuration: number = 30
): Promise<AudioBuffer> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);

    console.log(`[AudioBufferPool] Audio preloaded: ${url.slice(0, 60)}...`);
    return audioBuffer;
  } catch (error) {
    console.error(`[AudioBufferPool] Failed to preload audio:`, error);
    throw error;
  }
}
