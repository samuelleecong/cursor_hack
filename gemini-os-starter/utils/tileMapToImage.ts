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
  // Fill background with white
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, mapWidth, mapHeight);

  // Draw obstacles as black areas
  ctx.fillStyle = '#000000';
  for (let y = 0; y < tileMap.height; y++) {
    for (let x = 0; x < tileMap.width; x++) {
      const tile = tileMap.tiles[y][x];
      if (!tile.walkable) {
        const tileX = x * tileMap.tileSize;
        const tileY = y * tileMap.tileSize;
        ctx.fillRect(tileX, tileY, tileMap.tileSize, tileMap.tileSize);
      }
    }
  }

  // Draw thick black path outline for extra clarity
  if (tileMap.pathPoints.length > 1) {
    ctx.strokeStyle = '#000000';
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

  // Highlight the main path points with black outlined circles
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = tileMap.tileSize * 0.3;
  tileMap.pathPoints.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, tileMap.tileSize * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  });

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
 * ENHANCED: Creates a PURE PATH MASK for exact layout adherence
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

  // WHITE BACKGROUND - path will have black outlines
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, mapWidth, mapHeight);

  // Draw obstacles as black areas
  ctx.fillStyle = '#000000';
  for (let y = 0; y < tileMap.height; y++) {
    for (let x = 0; x < tileMap.width; x++) {
      const tile = tileMap.tiles[y][x];
      if (!tile.walkable) {
        const tileX = x * tileMap.tileSize;
        const tileY = y * tileMap.tileSize;
        ctx.fillRect(tileX, tileY, tileMap.tileSize, tileMap.tileSize);
      }
    }
  }

  // THICK BLACK PATH OUTLINE for absolute clarity
  // This is the SACRED LAYOUT that must be preserved
  if (tileMap.pathPoints.length > 1) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = tileMap.tileSize * 2.0; // Thick black outline
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 10; // Add subtle shadow for emphasis

    ctx.beginPath();
    ctx.moveTo(tileMap.pathPoints[0].x, tileMap.pathPoints[0].y);
    for (let i = 1; i < tileMap.pathPoints.length; i++) {
      ctx.lineTo(tileMap.pathPoints[i].x, tileMap.pathPoints[i].y);
    }
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;
  }

  // Overlay path points with BLACK outlined circles
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = tileMap.tileSize * 0.3;
  tileMap.pathPoints.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, tileMap.tileSize * 0.7, 0, Math.PI * 2);
    ctx.stroke();
  });

  console.log(`[TileMapToImage] Created PATH OUTLINE MASK: ${tileMap.pathPoints.length} path points, white background with thick black path outlines`);

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
 * Combine two tile maps side-by-side into a panorama PATH OUTLINE MASK (2000x800)
 * Left half = current room, Right half = next room
 * ENHANCED: Creates black outline path mask on white background for maximum layout adherence
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

  // WHITE BACKGROUND
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 2000, 800);

  console.log('[CombinePanorama] Drawing left tile map (0-1000px)...');
  // Draw LEFT tile map (current room) at 0-1000px
  drawPurePathMask(ctx, currentTileMap, 0, 0);

  console.log('[CombinePanorama] Drawing right tile map (1000-2000px)...');
  // Draw RIGHT tile map (next room) at 1000-2000px
  drawPurePathMask(ctx, nextTileMap, 1000, 0);

  console.log('[CombinePanorama] Panorama black outline path mask created: 2000x800');

  // Convert to data URL
  return canvas.toDataURL('image/png');
}

/**
 * Helper: Draw a path outline mask on canvas at specified offset
 */
function drawPurePathMask(
  ctx: CanvasRenderingContext2D,
  tileMap: TileMap,
  offsetX: number,
  offsetY: number
): void {
  const mapWidth = tileMap.width * tileMap.tileSize;
  const mapHeight = tileMap.height * tileMap.tileSize;

  // Draw obstacles as black areas
  ctx.fillStyle = '#000000';
  for (let y = 0; y < tileMap.height; y++) {
    for (let x = 0; x < tileMap.width; x++) {
      const tile = tileMap.tiles[y][x];
      if (!tile.walkable) {
        const tileX = offsetX + (x * tileMap.tileSize);
        const tileY = offsetY + (y * tileMap.tileSize);
        ctx.fillRect(tileX, tileY, tileMap.tileSize, tileMap.tileSize);
      }
    }
  }

  // THICK BLACK PATH OUTLINE
  if (tileMap.pathPoints.length > 1) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = tileMap.tileSize * 2.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(offsetX + tileMap.pathPoints[0].x, offsetY + tileMap.pathPoints[0].y);
    for (let i = 1; i < tileMap.pathPoints.length; i++) {
      ctx.lineTo(offsetX + tileMap.pathPoints[i].x, offsetY + tileMap.pathPoints[i].y);
    }
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  // Overlay path points with BLACK outlined circles
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = tileMap.tileSize * 0.3;
  tileMap.pathPoints.forEach((point) => {
    ctx.beginPath();
    ctx.arc(offsetX + point.x, offsetY + point.y, tileMap.tileSize * 0.7, 0, Math.PI * 2);
    ctx.stroke();
  });
}
