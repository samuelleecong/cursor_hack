/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */

export interface SlicedImages {
  currentScene: string;
  nextScene: string;
}

/**
 * Slice a panorama image into two equal sections (current + next scene)
 * Dynamically handles any panorama dimensions and scales to 1000x800 viewport
 */
export async function slicePanoramaImage(imageUrl: string): Promise<SlicedImages> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS if needed

    img.onload = () => {
      try {
        console.log(`[ImageSlicing] Received panorama: ${img.width}x${img.height}`);

        // Calculate slice width (half of panorama)
        const sliceWidth = img.width / 2;
        const sliceHeight = img.height;

        // Target viewport dimensions
        const targetWidth = 1000;
        const targetHeight = 800;

        // Create canvas for slicing and scaling
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Slice and scale left half (current scene)
        ctx.clearRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(
          img,
          0, 0, sliceWidth, sliceHeight,           // source (left half)
          0, 0, targetWidth, targetHeight          // destination (scaled to viewport)
        );
        const currentSceneUrl = canvas.toDataURL('image/png');
        console.log(`[ImageSlicing] Current scene: sliced ${sliceWidth}x${sliceHeight}, scaled to ${targetWidth}x${targetHeight}`);

        // Slice and scale right half (next scene)
        ctx.clearRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(
          img,
          sliceWidth, 0, sliceWidth, sliceHeight,  // source (right half)
          0, 0, targetWidth, targetHeight          // destination (scaled to viewport)
        );
        const nextSceneUrl = canvas.toDataURL('image/png');
        console.log(`[ImageSlicing] Next scene: sliced ${sliceWidth}x${sliceHeight}, scaled to ${targetWidth}x${targetHeight}`);

        resolve({
          currentScene: currentSceneUrl,
          nextScene: nextSceneUrl,
        });
      } catch (error) {
        reject(new Error(`Failed to slice image: ${error}`));
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image from URL: ${imageUrl}`));
    };

    img.src = imageUrl;
  });
}

/**
 * Create a fallback scene image with biome-appropriate gradient
 */
export function createFallbackScene(biome: string, width: number = 1000, height: number = 800): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return '';
  }

  // Biome color schemes
  const biomeColors: Record<string, { top: string; bottom: string }> = {
    forest: { top: '#1e3a20', bottom: '#4ade80' },
    plains: { top: '#87ceeb', bottom: '#90ee90' },
    desert: { top: '#f4a460', bottom: '#ffd700' },
    cave: { top: '#1a1a1a', bottom: '#4a4a4a' },
    dungeon: { top: '#2d1b3d', bottom: '#5a4a6a' },
  };

  const colors = biomeColors[biome] || { top: '#1a1a1a', bottom: '#3a3a3a' };

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, colors.top);
  gradient.addColorStop(1, colors.bottom);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add some texture
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 3;
    ctx.fillRect(x, y, size, size);
  }

  return canvas.toDataURL('image/png');
}

/**
 * Validate if a URL is a valid image data URL or blob URL
 */
export function isValidImageUrl(url: string): boolean {
  return url.startsWith('data:image/') || url.startsWith('blob:');
}
