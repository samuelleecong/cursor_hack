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
const CACHE_METADATA_KEY = 'pixelart_cache_metadata'; // Track all cache keys

// OPTIMIZATION: In-memory metadata to avoid O(n) localStorage loops
interface CacheMetadata {
  key: string;
  timestamp: number;
}

let cacheMetadata: CacheMetadata[] = [];
let metadataInitialized = false;

/**
 * Initialize cache metadata from localStorage (called once)
 */
function initCacheMetadata(): void {
  if (metadataInitialized) return;

  try {
    const stored = localStorage.getItem(CACHE_METADATA_KEY);
    cacheMetadata = stored ? JSON.parse(stored) : [];
    metadataInitialized = true;
    console.log(`[ImageCache] Initialized with ${cacheMetadata.length} cached images`);
  } catch (error) {
    console.error('[ImageCache] Error loading metadata:', error);
    cacheMetadata = [];
    metadataInitialized = true;
  }
}

/**
 * Save cache metadata to localStorage
 */
function saveCacheMetadata(): void {
  try {
    localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(cacheMetadata));
  } catch (error) {
    console.error('[ImageCache] Error saving metadata:', error);
  }
}

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
  initCacheMetadata(); // Ensure metadata is loaded

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
      // Remove from metadata
      cacheMetadata = cacheMetadata.filter(m => m.key !== cacheKey);
      saveCacheMetadata();
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
  initCacheMetadata(); // Ensure metadata is loaded

  try {
    const cacheKey = getCacheKey(prompt);
    const timestamp = Date.now();
    const cachedData: CachedImage = {
      url,
      prompt,
      timestamp,
    };

    localStorage.setItem(cacheKey, JSON.stringify(cachedData));

    // OPTIMIZATION: Update metadata instead of scanning all keys
    // Remove existing entry if present
    cacheMetadata = cacheMetadata.filter(m => m.key !== cacheKey);
    // Add new entry
    cacheMetadata.push({ key: cacheKey, timestamp });

    // Clean up old cache entries if we exceed max size
    cleanupCache();
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

/**
 * Remove oldest cache entries if we exceed max size
 * OPTIMIZATION: Uses metadata instead of O(n) localStorage loop
 */
function cleanupCache(): void {
  try {
    // If we exceed max size, remove oldest entries
    if (cacheMetadata.length > MAX_CACHE_SIZE) {
      // Sort by timestamp (oldest first)
      cacheMetadata.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest entries
      const toRemove = cacheMetadata.splice(0, cacheMetadata.length - MAX_CACHE_SIZE);

      toRemove.forEach(entry => {
        localStorage.removeItem(entry.key);
      });

      // Save updated metadata
      saveCacheMetadata();

      console.log(`[ImageCache] Cleaned up ${toRemove.length} old cache entries (kept ${cacheMetadata.length}/${MAX_CACHE_SIZE})`);
    } else {
      // Save metadata even if no cleanup needed (tracks new additions)
      saveCacheMetadata();
    }
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
}

/**
 * Clear all cached images
 * OPTIMIZATION: Uses metadata instead of scanning all keys
 */
export function clearImageCache(): void {
  initCacheMetadata(); // Ensure metadata is loaded

  try {
    // Remove all cache entries using metadata
    cacheMetadata.forEach(entry => {
      localStorage.removeItem(entry.key);
    });

    const count = cacheMetadata.length;
    cacheMetadata = [];
    localStorage.removeItem(CACHE_METADATA_KEY);

    console.log(`[ImageCache] Cleared ${count} cached images`);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Get cache statistics
 * OPTIMIZATION: Uses metadata instead of O(n) localStorage loop
 */
export function getCacheStats(): { count: number; oldestTimestamp: number; newestTimestamp: number } {
  initCacheMetadata(); // Ensure metadata is loaded

  let oldest = Date.now();
  let newest = 0;

  try {
    cacheMetadata.forEach(entry => {
      oldest = Math.min(oldest, entry.timestamp);
      newest = Math.max(newest, entry.timestamp);
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
  }

  return { count: cacheMetadata.length, oldestTimestamp: oldest, newestTimestamp: newest };
}
