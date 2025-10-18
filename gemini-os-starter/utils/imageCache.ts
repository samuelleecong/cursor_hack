/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */

export interface CachedImage {
  url: string;
  prompt: string;
  timestamp: number;
}

const CACHE_KEY_PREFIX = 'pixelart_cache_';
const MAX_CACHE_SIZE = 50; // Maximum number of cached images
const CACHE_EXPIRY_DAYS = 7; // Images expire after 7 days

/**
 * Generate a cache key from a prompt
 */
function getCacheKey(prompt: string): string {
  // Simple hash function for prompt
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `${CACHE_KEY_PREFIX}${Math.abs(hash)}`;
}

/**
 * Check if cached image exists and is valid
 */
export function getCachedImage(prompt: string): string | null {
  try {
    const cacheKey = getCacheKey(prompt);
    const cached = localStorage.getItem(cacheKey);

    if (!cached) return null;

    const cachedData: CachedImage = JSON.parse(cached);

    // Check if cache is expired
    const now = Date.now();
    const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    if (now - cachedData.timestamp > expiryTime) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return cachedData.url;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

/**
 * Save generated image to cache
 */
export function cacheImage(prompt: string, url: string): void {
  try {
    const cacheKey = getCacheKey(prompt);
    const cachedData: CachedImage = {
      url,
      prompt,
      timestamp: Date.now(),
    };

    localStorage.setItem(cacheKey, JSON.stringify(cachedData));

    // Clean up old cache entries if we exceed max size
    cleanupCache();
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

/**
 * Remove oldest cache entries if we exceed max size
 */
function cleanupCache(): void {
  try {
    const cacheKeys: Array<{ key: string; timestamp: number }> = [];

    // Find all cache keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        const cached = localStorage.getItem(key);
        if (cached) {
          const data: CachedImage = JSON.parse(cached);
          cacheKeys.push({ key, timestamp: data.timestamp });
        }
      }
    }

    // If we exceed max size, remove oldest entries
    if (cacheKeys.length > MAX_CACHE_SIZE) {
      cacheKeys.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = cacheKeys.slice(0, cacheKeys.length - MAX_CACHE_SIZE);

      toRemove.forEach(entry => {
        localStorage.removeItem(entry.key);
      });

      console.log(`Cleaned up ${toRemove.length} old cache entries`);
    }
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
}

/**
 * Clear all cached images
 */
export function clearImageCache(): void {
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${keysToRemove.length} cached images`);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { count: number; oldestTimestamp: number; newestTimestamp: number } {
  let count = 0;
  let oldest = Date.now();
  let newest = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        count++;
        const cached = localStorage.getItem(key);
        if (cached) {
          const data: CachedImage = JSON.parse(cached);
          oldest = Math.min(oldest, data.timestamp);
          newest = Math.max(newest, data.timestamp);
        }
      }
    }
  } catch (error) {
    console.error('Error getting cache stats:', error);
  }

  return { count, oldestTimestamp: oldest, newestTimestamp: newest };
}
