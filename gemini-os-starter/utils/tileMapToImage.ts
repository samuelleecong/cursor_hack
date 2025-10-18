/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import { TileMap } from '../services/mapGenerator';

/**
 * Convert a TileMap to a visual reference image (data URL)
 * This shows the walkable paths and obstacles as a guide for image generation
 */
export function tileMapToReferenceImage(tileMap: TileMap): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const mapWidth = tileMap.width * tileMap.tileSize;
  const mapHeight = tileMap.height * tileMap.tileSize;

  canvas.width = mapWidth;
  canvas.height = mapHeight;

  // Draw the tile map with VERY clear walkable/obstacle distinction
  for (let y = 0; y < tileMap.height; y++) {
    for (let x = 0; x < tileMap.width; x++) {
      const tile = tileMap.tiles[y][x];
      const tileX = x * tileMap.tileSize;
      const tileY = y * tileMap.tileSize;

      // Color code: bright yellow = walkable path, dark gray = obstacles
      if (tile.walkable) {
        ctx.fillStyle = '#FFD700'; // Bright gold/yellow for paths (VERY visible)
      } else {
        ctx.fillStyle = '#222222'; // Dark gray for obstacles
      }

      ctx.fillRect(tileX, tileY, tileMap.tileSize, tileMap.tileSize);
    }
  }

  // Highlight the main path with THICK bright overlay
  ctx.fillStyle = 'rgba(255, 215, 0, 0.8)'; // Bright gold overlay
  tileMap.pathPoints.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, tileMap.tileSize * 0.8, 0, Math.PI * 2); // Larger circles
    ctx.fill();
  });

  // Draw thick path outline for extra clarity
  if (tileMap.pathPoints.length > 1) {
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = tileMap.tileSize * 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(tileMap.pathPoints[0].x, tileMap.pathPoints[0].y);
    for (let i = 1; i < tileMap.pathPoints.length; i++) {
      ctx.lineTo(tileMap.pathPoints[i].x, tileMap.pathPoints[i].y);
    }
    ctx.stroke();
  }

  // Mark spawn point in blue
  ctx.fillStyle = 'rgba(0, 100, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(tileMap.spawnPoint.x, tileMap.spawnPoint.y, tileMap.tileSize, 0, Math.PI * 2);
  ctx.fill();

  // Add grid lines for clarity
  ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
  ctx.lineWidth = 1;

  for (let x = 0; x <= tileMap.width; x++) {
    ctx.beginPath();
    ctx.moveTo(x * tileMap.tileSize, 0);
    ctx.lineTo(x * tileMap.tileSize, mapHeight);
    ctx.stroke();
  }

  for (let y = 0; y <= tileMap.height; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * tileMap.tileSize);
    ctx.lineTo(mapWidth, y * tileMap.tileSize);
    ctx.stroke();
  }

  // Convert to data URL
  return canvas.toDataURL('image/png');
}

/**
 * Convert tile map to a Blob for efficient upload to fal.ai
 */
export async function tileMapToBlob(tileMap: TileMap): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const mapWidth = tileMap.width * tileMap.tileSize;
  const mapHeight = tileMap.height * tileMap.tileSize;

  canvas.width = mapWidth;
  canvas.height = mapHeight;

  // Same rendering logic as tileMapToReferenceImage
  for (let y = 0; y < tileMap.height; y++) {
    for (let x = 0; x < tileMap.width; x++) {
      const tile = tileMap.tiles[y][x];
      const tileX = x * tileMap.tileSize;
      const tileY = y * tileMap.tileSize;

      if (tile.walkable) {
        ctx.fillStyle = '#FFD700';
      } else {
        ctx.fillStyle = '#222222';
      }

      ctx.fillRect(tileX, tileY, tileMap.tileSize, tileMap.tileSize);
    }
  }

  // Highlight path
  ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
  tileMap.pathPoints.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, tileMap.tileSize * 0.8, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw path outline
  if (tileMap.pathPoints.length > 1) {
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = tileMap.tileSize * 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(tileMap.pathPoints[0].x, tileMap.pathPoints[0].y);
    for (let i = 1; i < tileMap.pathPoints.length; i++) {
      ctx.lineTo(tileMap.pathPoints[i].x, tileMap.pathPoints[i].y);
    }
    ctx.stroke();
  }

  // Convert canvas to Blob (more efficient than data URL)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to convert canvas to blob'));
      }
    }, 'image/png');
  });
}

/**
 * Resize tile map reference to target dimensions for fal.ai
 */
export function resizeTileMapReference(
  tileMapDataUrl: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Draw and resize
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      reject(new Error('Failed to load tile map image'));
    };

    img.src = tileMapDataUrl;
  });
}

/**
 * Combine two tile maps side-by-side into a panorama reference (2000x800)
 * Left half = current room, Right half = next room
 */
export function combineTileMapsAsPanorama(
  currentTileMap: TileMap,
  nextTileMap: TileMap
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Create 2000x800 panorama canvas
  canvas.width = 2000;
  canvas.height = 800;

  // Generate both tile map images
  const currentImage = tileMapToReferenceImage(currentTileMap);
  const nextImage = tileMapToReferenceImage(nextTileMap);

  // Load and draw both images side by side
  return new Promise<string>((resolve, reject) => {
    const currentImg = new Image();
    const nextImg = new Image();
    let loadedCount = 0;

    const onBothLoaded = () => {
      loadedCount++;
      if (loadedCount === 2) {
        // Draw current map on left half (0, 0, 1000, 800)
        ctx.drawImage(currentImg, 0, 0, 1000, 800);

        // Draw next map on right half (1000, 0, 1000, 800)
        ctx.drawImage(nextImg, 1000, 0, 1000, 800);

        // Add a subtle divider line
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(1000, 0);
        ctx.lineTo(1000, 800);
        ctx.stroke();

        resolve(canvas.toDataURL('image/png'));
      }
    };

    currentImg.onload = onBothLoaded;
    nextImg.onload = onBothLoaded;

    currentImg.onerror = () => reject(new Error('Failed to load current tile map'));
    nextImg.onerror = () => reject(new Error('Failed to load next tile map'));

    currentImg.src = currentImage;
    nextImg.src = nextImage;
  }) as any; // Type workaround for Promise return
}
