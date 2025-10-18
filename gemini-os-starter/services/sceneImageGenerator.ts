/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import { GoogleGenAI } from '@google/genai';
import { Room, StoryMode, GameObject } from '../types';
import { BiomeType, TileMap } from './mapGenerator';
import { slicePanoramaImage, createFallbackScene } from '../utils/imageSlicing';
import { getCachedImage, cacheImage } from '../utils/imageCache';
import { generatePixelArt } from './falService';
import { tileMapToReferenceImage, resizeTileMapReference, combineTileMapsAsPanorama, tileMapToBlob } from '../utils/tileMapToImage';

if (!process.env.API_KEY) {
  console.error('API_KEY environment variable is not set for scene generation.');
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export interface SceneGenerationParams {
  roomId: string;
  roomNumber: number;
  biome: BiomeType;
  description: string;
  objects: GameObject[];
  storyContext?: string | null;
  storyMode?: StoryMode;
  previousRoomDescription?: string;
  tileMap?: TileMap; // Include tile map for reference image generation
}

/**
 * Build a prompt for Gemini to generate scene description/prompt
 */
function buildScenePromptRequest(params: SceneGenerationParams): string {
  const {
    roomNumber,
    biome,
    description,
    objects,
    storyContext,
    storyMode,
    previousRoomDescription,
  } = params;

  // Biome descriptions
  const biomeDescriptions: Record<BiomeType, string> = {
    forest: 'lush forest with ancient trees, moss-covered stones, and winding paths',
    plains: 'open grasslands with rolling hills, wildflowers, and distant mountains',
    desert: 'sandy dunes with scattered cacti, rocky outcrops, and heat haze',
    cave: 'dark cavern with stalactites, underground pools, and glowing crystals',
    dungeon: 'ancient stone corridors with torches, crumbling walls, and mysterious doors',
  };

  // Summarize objects in the room
  const enemies = objects.filter((o) => o.type === 'enemy');
  const npcs = objects.filter((o) => o.type === 'npc');
  const items = objects.filter((o) => o.type === 'item');

  let objectHints = '';
  if (enemies.length > 0) {
    objectHints += `Dangerous creatures lurking (${enemies.map(e => e.sprite).join(', ')}). `;
  }
  if (npcs.length > 0) {
    objectHints += `Travelers or inhabitants present (${npcs.map(n => n.sprite).join(', ')}). `;
  }
  if (items.length > 0) {
    objectHints += `Treasures or items scattered about (${items.map(i => i.sprite).join(', ')}). `;
  }

  // Story context integration
  let storySection = '';
  if (storyContext) {
    const modeInstructions: Record<StoryMode, string> = {
      recreation: 'Recreate locations and atmosphere from the story',
      continuation: 'Show how the world has evolved after the story events',
      inspiration: 'Capture the themes and atmosphere of the story',
    };

    storySection = `
STORY CONTEXT (${storyMode || 'inspiration'} mode):
${storyContext.substring(0, 500)}...
${modeInstructions[storyMode || 'inspiration']}
`;
  }

  // Previous room context
  let previousContext = '';
  if (previousRoomDescription) {
    previousContext = `\nCONTINUITY: The player just came from: ${previousRoomDescription}`;
  }

  return `You are a creative prompt generator for pixel art game scenes.

${storySection}

CURRENT LOCATION (Room ${roomNumber}):
${description}
Environment: ${biomeDescriptions[biome]}
${objectHints}${previousContext}

Generate a detailed, vivid prompt for creating a beautiful pixel art scene image. The prompt should describe:
- The ${biome} environment in rich visual detail
- **CRITICAL**: A GOLDEN/YELLOW dirt path or walkable trail EXACTLY matching the reference image's bright path layout
- The path must run from left (entrance) to right (exit) following the EXACT route shown in the reference
- The atmosphere (peaceful, dangerous, mysterious, etc.)
- Visual elements that hint at: ${objectHints || 'a serene, empty area'}
- Lighting, colors, and mood appropriate for the scene
- Make it feel like a classic top-down 16-bit RPG scene

**CRITICAL INSTRUCTION**: The visual path in your scene MUST EXACTLY follow the bright yellow/gold path shown in the reference image. Do not deviate from this path layout. The walkable area should be clearly visible as a dirt trail, stone path, or similar walkable surface that matches the reference image's path shape.

IMPORTANT: Output ONLY the image generation prompt, nothing else. Make it detailed and vivid, emphasizing the path following the reference. 2-3 sentences maximum.`;
}

/**
 * Use Gemini to generate a scene image prompt, then fal.ai to create the image
 */
export async function generateSingleRoomScene(
  params: SceneGenerationParams
): Promise<string> {
  const { roomId, biome } = params;

  try {
    // Build the request for Gemini
    const promptRequest = buildScenePromptRequest(params);

    // Check cache first
    const cacheKey = `scene_${roomId}_${biome}`;
    const cachedUrl = getCachedImage(cacheKey);

    if (cachedUrl) {
      console.log(`[SceneGen] Using cached scene for room ${roomId}`);
      return cachedUrl;
    }

    console.log(`[SceneGen] Generating prompt for room ${roomId} using Gemini 2.5 Flash...`);

    // Use Gemini 2.5 Flash for prompt generation (15 req/min vs Pro's 2 req/min)
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: promptRequest,
      config: {},
    });

    // Extract the generated prompt from stream
    let imagePrompt = '';
    for await (const chunk of response) {
      if (chunk.text) {
        imagePrompt += chunk.text;
      }
    }
    console.log(imagePrompt);

    imagePrompt = imagePrompt.trim();
    console.log(`[SceneGen] Gemini generated prompt: ${imagePrompt.substring(0, 150)}...`);

    // Generate reference image from tile map as Blob (more efficient for fal.ai)
    let referenceImage: Blob | undefined;
    if (params.tileMap) {
      try {
        console.log(`[SceneGen] Converting tile map to reference Blob...`);
        referenceImage = await tileMapToBlob(params.tileMap);
        console.log(`[SceneGen] Reference Blob ready (${referenceImage.size} bytes, tile map guide)`);
      } catch (error) {
        console.warn(`[SceneGen] Failed to create reference image:`, error);
      }
    }

    // Now use fal.ai to generate the actual image
    console.log(`[SceneGen] Generating image via fal.ai for room ${roomId}${referenceImage ? ' (with tile map Blob reference)' : ''}...`);

    const generatedImage = await generatePixelArt({
      prompt: imagePrompt,
      type: 'scene',
      customDimensions: { width: 1000, height: 800 },
      referenceImage: referenceImage, // Pass Blob directly - fal.ai auto-uploads
      imageStrength: 0.85, // 85% adherence to reference - MUST follow the path layout closely
      useNanoBanana: true, // Use Gemini 2.5 Flash Image for superior path understanding
    });

    console.log(`[SceneGen] Scene image generated successfully for room ${roomId}`);

    // Cache the result
    cacheImage(cacheKey, generatedImage.url);

    return generatedImage.url;
  } catch (error) {
    console.error(`[SceneGen] Failed to generate scene for room ${roomId}:`, error);

    // Fallback: Create gradient-based scene
    console.warn(`[SceneGen] Using fallback scene for room ${roomId}`);
    return createFallbackScene(biome, 1000, 800);
  }
}

/**
 * Generate a panorama scene (2000x800) for current + next room
 * Uses BOTH tile maps as reference for perfect path continuity
 */
export async function generateScenePanorama(
  currentRoomParams: SceneGenerationParams,
  nextRoomParams: SceneGenerationParams
): Promise<{ currentScene: string; nextScene: string }> {
  try {
    // Build prompts for both rooms
    const currentPromptRequest = buildScenePromptRequest(currentRoomParams);
    const nextPromptRequest = buildScenePromptRequest(nextRoomParams);

    console.log(`[SceneGen] Generating panorama prompts for rooms ${currentRoomParams.roomId} + ${nextRoomParams.roomId}...`);

    // Generate prompts using Gemini 2.5 Flash (15 req/min vs Pro's 2 req/min)
    const currentResponse = ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: currentPromptRequest,
      config: {},
    });

    const nextResponse = ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: nextPromptRequest,
      config: {},
    });

    // Extract prompts from both streams
    let currentImagePrompt = '';
    let nextImagePrompt = '';

    for await (const chunk of await currentResponse) {
      if (chunk.text) currentImagePrompt += chunk.text;
    }

    for await (const chunk of await nextResponse) {
      if (chunk.text) nextImagePrompt += chunk.text;
    }

    currentImagePrompt = currentImagePrompt.trim();
    nextImagePrompt = nextImagePrompt.trim();

    // Combine prompts for panorama
    const panoramaPrompt = `${currentImagePrompt} [LEFT SIDE] seamlessly connected to ${nextImagePrompt} [RIGHT SIDE], continuous path from left to right, unified landscape`;

    console.log(`[SceneGen] Panorama prompt: ${panoramaPrompt.substring(0, 200)}...`);

    // Generate combined tile map reference (2000x800)
    let panoramaReferenceUrl: string | undefined;
    if (currentRoomParams.tileMap && nextRoomParams.tileMap) {
      try {
        console.log(`[SceneGen] Creating panorama tile map reference (current + next)...`);
        panoramaReferenceUrl = await combineTileMapsAsPanorama(
          currentRoomParams.tileMap,
          nextRoomParams.tileMap
        );
        console.log(`[SceneGen] Panorama reference image ready (combined tile maps)`);
      } catch (error) {
        console.warn(`[SceneGen] Failed to create panorama reference:`, error);
      }
    }

    // Generate 2000x800 panorama with combined tile map reference
    console.log(`[SceneGen] Generating 2000x800 panorama via fal.ai${panoramaReferenceUrl ? ' (with combined tile map reference)' : ''}...`);

    const panoramaImage = await generatePixelArt({
      prompt: panoramaPrompt,
      type: 'panorama',
      customDimensions: { width: 2000, height: 800 },
      referenceImage: panoramaReferenceUrl,
      imageStrength: 0.85, // 85% adherence - critical for path alignment
      useNanoBanana: true, // Use Gemini 2.5 Flash Image for panorama generation
    });

    console.log(`[SceneGen] Panorama generated, slicing into sections...`);

    // Slice into current and next scenes
    const sliced = await slicePanoramaImage(panoramaImage.url);

    console.log(`[SceneGen] Panorama sliced successfully! Current scene length: ${sliced.currentScene.length}, Next scene length: ${sliced.nextScene.length}`);

    return sliced;
  } catch (error) {
    console.error('[SceneGen] Failed to generate panorama:', error);

    // Fallback: Generate individual scenes
    const currentScene = await generateSingleRoomScene(currentRoomParams);
    const nextScene = await generateSingleRoomScene(nextRoomParams);

    return { currentScene, nextScene };
  }
}
