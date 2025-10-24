/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * OPTIMIZATION: Image Preloader
 * Preloads next room's images in the background while player explores current room
 * Makes room transitions feel instant by loading assets ahead of time
 */

// Track preloaded images to avoid duplicate preloads
const preloadCache = new Set<string>();

// Track in-progress preloads
const preloadingPromises = new Map<string, Promise<void>>();

/**
 * Preload a single image
 */
export function preloadImage(url: string): Promise<HTMLImageElement> {
  // Return immediately if already preloaded
  if (preloadCache.has(url)) {
    return Promise.resolve(new Image());
  }

  // Return existing promise if already preloading
  if (preloadingPromises.has(url)) {
    return preloadingPromises.get(url) as any;
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      preloadCache.add(url);
      preloadingPromises.delete(url);
      resolve(img);
    };

    img.onerror = (error) => {
      preloadingPromises.delete(url);
      console.warn(`[ImagePreloader] Failed to preload: ${url.slice(0, 60)}...`, error);
      reject(error);
    };

    img.src = url;
  });

  preloadingPromises.set(url, promise as any);
  return promise;
}

/**
 * Preload multiple images in parallel
 */
export function preloadImages(urls: string[]): Promise<void> {
  const uniqueUrls = urls.filter(url => url && !preloadCache.has(url));

  if (uniqueUrls.length === 0) {
    return Promise.resolve();
  }

  console.log(`[ImagePreloader] Preloading ${uniqueUrls.length} images...`);

  return Promise.allSettled(uniqueUrls.map(url => preloadImage(url)))
    .then(results => {
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`[ImagePreloader] Preloaded ${succeeded}/${uniqueUrls.length} images (${failed} failed)`);
    });
}

/**
 * Preload room assets (scene image + all sprite URLs)
 */
export interface RoomAssets {
  sceneImage?: string;
  spriteUrls: string[];
}

export function preloadRoomAssets(assets: RoomAssets): Promise<void> {
  const urls: string[] = [];

  if (assets.sceneImage) {
    urls.push(assets.sceneImage);
  }

  urls.push(...assets.spriteUrls.filter(Boolean));

  if (urls.length === 0) {
    return Promise.resolve();
  }

  console.log(`[ImagePreloader] Preloading room with ${urls.length} assets (1 scene + ${assets.spriteUrls.length} sprites)`);

  // Use requestIdleCallback to defer preloading during idle time
  return new Promise((resolve) => {
    const doPreload = () => {
      preloadImages(urls).then(resolve);
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(doPreload, { timeout: 1000 });
    } else {
      setTimeout(doPreload, 0);
    }
  });
}

/**
 * Check if an image is already preloaded
 */
export function isPreloaded(url: string): boolean {
  return preloadCache.has(url);
}

/**
 * Clear preload cache (for memory management if needed)
 */
export function clearPreloadCache(): void {
  preloadCache.clear();
  console.log('[ImagePreloader] Cache cleared');
}

/**
 * Get preload cache stats
 */
export function getPreloadStats(): { preloadedCount: number; preloadingCount: number } {
  return {
    preloadedCount: preloadCache.size,
    preloadingCount: preloadingPromises.size
  };
}
