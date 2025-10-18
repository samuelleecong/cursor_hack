/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import { Room, StoryMode } from '../types';
import { generateRoom } from './roomGenerator';
import { generatePixelArt } from './falService';
import { GoogleGenAI } from '@google/genai';
import { TileMap } from './mapGenerator';

if (!process.env.API_KEY) {
  console.error('API_KEY environment variable is not set for scene generation.');
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Configuration for multi-room batch generation
 */
export interface MultiRoomConfig {
  numRooms: 2 | 3; // Number of rooms to generate at once
  useAnchorImage: boolean; // Use previous scene as anchor
}

/**
 * Calculate optimal dimensions for X-room panorama using native aspect ratios
 */
function getPanoramaDimensions(numRooms: 2 | 3): {
  aspectRatio: string;
  totalWidth: number;
  totalHeight: number;
  roomWidth: number;
  roomHeight: number;
} {
  if (numRooms === 2) {
    // Use 16:9 aspect ratio for 2 rooms
    return {
      aspectRatio: '16:9',
      totalWidth: 1600,
      totalHeight: 900,
      roomWidth: 800,
      roomHeight: 900,
    };
  } else {
    // Use 21:9 aspect ratio for 3 rooms
    return {
      aspectRatio: '21:9',
      totalWidth: 2100,
      totalHeight: 900,
      roomWidth: 700,
      roomHeight: 900,
    };
  }
}

/**
 * Stitch X tile maps into one horizontal panorama reference image
 */
export async function stitchTileMaps(tileMaps: TileMap[]): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Calculate total width
  const totalWidth = tileMaps.reduce((sum, tm) => sum + tm.width * tm.tileSize, 0);
  const maxHeight = Math.max(...tileMaps.map(tm => tm.height * tm.tileSize));

  canvas.width = totalWidth;
  canvas.height = maxHeight;

  let xOffset = 0;

  // Draw each tile map side by side
  for (const tileMap of tileMaps) {
    const mapWidth = tileMap.width * tileMap.tileSize;
    const mapHeight = tileMap.height * tileMap.tileSize;

    // Draw tiles
    for (let y = 0; y < tileMap.height; y++) {
      for (let x = 0; x < tileMap.width; x++) {
        const tile = tileMap.tiles[y][x];
        const tileX = xOffset + x * tileMap.tileSize;
        const tileY = y * tileMap.tileSize;

        if (tile.walkable) {
          ctx.fillStyle = '#FFD700'; // Bright gold for paths
        } else {
          ctx.fillStyle = '#222222'; // Dark for obstacles
        }

        ctx.fillRect(tileX, tileY, tileMap.tileSize, tileMap.tileSize);
      }
    }

    // Highlight path
    ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
    tileMap.pathPoints.forEach((point) => {
      ctx.beginPath();
      ctx.arc(xOffset + point.x, point.y, tileMap.tileSize * 0.8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw path outline
    if (tileMap.pathPoints.length > 1) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = tileMap.tileSize * 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(xOffset + tileMap.pathPoints[0].x, tileMap.pathPoints[0].y);
      for (let i = 1; i < tileMap.pathPoints.length; i++) {
        ctx.lineTo(xOffset + tileMap.pathPoints[i].x, tileMap.pathPoints[i].y);
      }
      ctx.stroke();
    }

    xOffset += mapWidth;
  }

  // Convert to Blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to convert stitched tile maps to blob'));
      }
    }, 'image/png');
  });
}

/**
 * Slice a panorama into X individual room scenes and scale to target dimensions
 * Dynamically calculates slice width from actual panorama dimensions
 */
export async function slicePanorama(
  imageUrl: string,
  numRooms: number,
  targetWidth: number = 1000,  // Target canvas viewport width
  targetHeight: number = 800    // Target canvas viewport height
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      console.log(`[MultiRoomGen] Received panorama: ${img.width}x${img.height}, slicing into ${numRooms} rooms`);

      // Calculate slice dimensions from actual panorama
      const sliceWidth = img.width / numRooms;
      const sliceHeight = img.height;

      // Create single canvas for slicing and scaling
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Set up canvas for target viewport dimensions
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const scenes: string[] = [];

      console.log(`[MultiRoomGen] Slice size: ${sliceWidth}x${sliceHeight}, scaling to ${targetWidth}x${targetHeight}`);

      for (let i = 0; i < numRooms; i++) {
        const sourceX = i * sliceWidth;

        // Slice from panorama and scale to viewport in one operation
        ctx.clearRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(
          img,
          sourceX, 0, sliceWidth, sliceHeight,  // source (slice from panorama)
          0, 0, targetWidth, targetHeight        // destination (scaled to viewport)
        );

        // Convert scaled image to data URL
        scenes.push(canvas.toDataURL('image/png'));

        console.log(`[MultiRoomGen] Room ${i + 1}: sliced from x=${sourceX.toFixed(0)}, scaled to viewport`);
      }

      resolve(scenes);
    };

    img.onerror = () => reject(new Error('Failed to load panorama image'));
    img.src = imageUrl;
  });
}

/**
 * Build scene prompt for multi-room panorama
 */
function buildMultiRoomPrompt(
  rooms: Array<{
    roomNumber: number;
    biome: string;
    description: string;
  }>,
  storyContext?: string | null,
  storyMode?: StoryMode
): string {
  const roomDescriptions = rooms.map((room, idx) =>
    `[Room ${room.roomNumber} (${idx === 0 ? 'LEFT' : idx === rooms.length - 1 ? 'RIGHT' : 'CENTER'})]: ${room.description}`
  ).join(' → ');

  let storySection = '';
  if (storyContext) {
    storySection = `\n\nSTORY CONTEXT: ${storyContext.substring(0, 300)}...\n`;
  }

  return `You are a creative prompt generator for pixel art game scenes.
${storySection}

MULTI-ROOM PANORAMA (${rooms.length} connected rooms):
${roomDescriptions}

Generate a detailed, vivid prompt for creating a seamless horizontal panorama showing these ${rooms.length} connected locations. The prompt should describe:
- A continuous landscape flowing from left to right
- **CRITICAL**: Golden/yellow paths EXACTLY matching the reference tile map layout
- Smooth transitions between the different areas
- Consistent lighting and atmosphere across all sections
- Visual elements that match each room's description
- Make it feel like a classic top-down 16-bit RPG panorama

**CRITICAL**: The walkable paths must EXACTLY follow the bright gold paths in the reference image. Do not deviate.

Output ONLY the image generation prompt, 2-3 sentences maximum.`;
}

/**
 * Generate X rooms at once as a panorama with dual reference system
 */
export async function generateMultiRoomBatch(
  roomIds: string[],
  storySeed: number,
  startingRoomNumber: number,
  config: MultiRoomConfig,
  previousSceneUrl?: string, // Anchor image for continuity
  storyContext?: string | null,
  storyMode?: StoryMode
): Promise<Room[]> {
  const numRooms = config.numRooms;

  if (roomIds.length !== numRooms) {
    throw new Error(`Expected ${numRooms} room IDs, got ${roomIds.length}`);
  }

  console.log(`[MultiRoomGen] Generating batch of ${numRooms} rooms: ${roomIds.join(', ')}`);

  // Step 1: Generate all rooms WITHOUT scene images (just tile maps + objects)
  const roomBases = await Promise.all(
    roomIds.map((roomId, idx) =>
      generateRoom(
        roomId,
        storySeed,
        startingRoomNumber + idx,
        undefined,
        storyContext,
        storyMode,
        undefined,
        false // Don't generate scene yet
      )
    )
  );

  // Step 2: Stitch tile maps into one reference image
  const tileMaps = roomBases.map(room => room.tileMap!);
  const stitchedTileMapBlob = await stitchTileMaps(tileMaps);

  console.log(`[MultiRoomGen] Stitched ${numRooms} tile maps into reference image`);

  // Step 3: Generate panorama prompt using Gemini 2.5 Pro
  const promptRequest = buildMultiRoomPrompt(
    roomBases.map((room, idx) => ({
      roomNumber: startingRoomNumber + idx,
      biome: room.tileMap!.biome,
      description: room.description,
    })),
    storyContext,
    storyMode
  );

  console.log(`[MultiRoomGen] Generating panorama prompt using Gemini 2.5 Pro...`);

  const response = await ai.models.generateContentStream({
    model: 'gemini-2.5-pro',
    contents: promptRequest,
    config: {},
  });

  let imagePrompt = '';
  for await (const chunk of response) {
    if (chunk.text) {
      imagePrompt += chunk.text;
    }
  }

  imagePrompt = imagePrompt.trim();
  console.log(`[MultiRoomGen] Prompt: ${imagePrompt.substring(0, 150)}...`);

  // Step 4: Upload reference images to fal.ai
  const stitchedTileMapUrl = await (async () => {
    const uploaded = await import('@fal-ai/serverless-client').then(fal =>
      fal.default.storage.upload(stitchedTileMapBlob)
    );
    return uploaded;
  })();

  console.log(`[MultiRoomGen] Tile map reference uploaded: ${stitchedTileMapUrl}`);

  // Step 5: Prepare image references (dual anchor system)
  const imageReferences: string[] = [stitchedTileMapUrl];

  if (config.useAnchorImage && previousSceneUrl) {
    imageReferences.unshift(previousSceneUrl); // Add previous scene as first reference (primary anchor)
    console.log(`[MultiRoomGen] Using previous scene as visual anchor: ${previousSceneUrl.substring(0, 50)}...`);
  }

  // Step 6: Generate panorama using Nano Banana with dual references
  const dimensions = getPanoramaDimensions(numRooms);

  console.log(`[MultiRoomGen] Generating ${dimensions.aspectRatio} panorama (${dimensions.totalWidth}x${dimensions.totalHeight}) with ${imageReferences.length} reference images...`);

  // Prepare reference images array (previous scene + tile map for anchoring)
  const referenceImagesArray: string[] = [];

  if (config.useAnchorImage && previousSceneUrl) {
    referenceImagesArray.push(previousSceneUrl); // Visual style anchor
    console.log(`[MultiRoomGen] Reference 1: Previous scene (visual anchor)`);
  }

  referenceImagesArray.push(stitchedTileMapUrl); // Path layout guide
  console.log(`[MultiRoomGen] Reference 2: Stitched tile map (path guide)`);

  const generatedImage = await generatePixelArt({
    prompt: imagePrompt,
    type: 'panorama',
    customDimensions: {
      width: dimensions.totalWidth,
      height: dimensions.totalHeight,
    },
    referenceImages: referenceImagesArray, // Dual anchor: previous scene + tile map
    useNanoBanana: true,
  });

  console.log(`[MultiRoomGen] Panorama generated successfully`);

  // Step 7: Slice panorama into individual room scenes and scale to viewport
  const TARGET_VIEWPORT_WIDTH = 1000;  // Standard canvas viewport width
  const TARGET_VIEWPORT_HEIGHT = 800;  // Standard canvas viewport height

  const slicedScenes = await slicePanorama(
    generatedImage.url,
    numRooms,
    TARGET_VIEWPORT_WIDTH,  // Scale to match canvas viewport
    TARGET_VIEWPORT_HEIGHT
  );

  console.log(`[MultiRoomGen] Sliced panorama into ${numRooms} scenes and scaled to ${TARGET_VIEWPORT_WIDTH}x${TARGET_VIEWPORT_HEIGHT}`);

  // Step 8: Attach scenes to rooms
  roomBases.forEach((room, idx) => {
    room.sceneImage = slicedScenes[idx];
    room.sceneImageLoading = false;
  });

  return roomBases;
}
