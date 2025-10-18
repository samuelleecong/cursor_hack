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
import { USE_BIOME_FOR_IMAGES } from '../constants';

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
 * Build a prompt for Gemini to generate STYLE-ONLY description
 * LAYOUT is handled 100% by the reference image
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

  // Biome descriptions - STYLE ONLY, no layout (only used if USE_BIOME_FOR_IMAGES is enabled)
  const biomeDescriptions: Record<BiomeType, string> = {
    forest: 'lush forest with ancient trees, moss-covered stones, dappled sunlight filtering through leaves',
    plains: 'open grasslands with rolling hills, wildflowers, and distant mountains in soft focus',
    desert: 'sandy terrain with scattered cacti, rocky outcrops, and shimmering heat haze',
    cave: 'dark cavern with stalactites, underground pools, and glowing crystals casting ethereal light',
    dungeon: 'ancient stone corridors with flickering torches, crumbling walls, and mysterious shadows',
  };

  const biomeStyle = USE_BIOME_FOR_IMAGES ? biomeDescriptions[biome] : 'generic fantasy RPG environment';

  // Summarize objects - VISUAL STYLE, not placement
  const enemies = objects.filter((o) => o.type === 'enemy');
  const npcs = objects.filter((o) => o.type === 'npc');
  const items = objects.filter((o) => o.type === 'item');

  let atmosphereHints = '';
  if (enemies.length > 0) {
    atmosphereHints += `Dangerous, ominous atmosphere with threatening presence. `;
  }
  if (npcs.length > 0) {
    atmosphereHints += `Signs of civilization and friendly inhabitants. `;
  }
  if (items.length > 0) {
    atmosphereHints += `Hints of treasure and discovery. `;
  }

  // Story context integration - THEME ONLY
  let storySection = '';
  if (storyContext) {
    const modeInstructions: Record<StoryMode, string> = {
      recreation: 'Match the visual style and atmosphere from the original story',
      continuation: 'Show a world that has aged and evolved, with weathering and change',
      inspiration: 'Capture the color palette, mood, and aesthetic themes',
    };

    storySection = `
STORY THEME (${storyMode || 'inspiration'} mode):
${storyContext.substring(0, 400)}...
${modeInstructions[storyMode || 'inspiration']}
`;
  }

  return `You are a visual style consultant for pixel art game scenes.

${storySection}

SCENE: Room ${roomNumber} - ${description}
${USE_BIOME_FOR_IMAGES ? `BIOME STYLE: ${biomeStyle}` : `STYLE: ${biomeStyle} based on room description`}
ATMOSPHERE: ${atmosphereHints || 'peaceful, serene environment'}
${previousRoomDescription ? `CONTINUITY: Maintains visual consistency with previous area: ${previousRoomDescription}` : ''}

Generate a STYLE-ONLY prompt for pixel art scene generation. Focus EXCLUSIVELY on:
- Color palette (what colors dominate the scene?)
- Texture and materials (grass, stone, wood, water, etc.)
- Lighting and mood (bright, dark, mysterious, welcoming?)
- Atmospheric effects (fog, sunbeams, shadows, particle effects?)
- Art style consistency (16-bit RPG, Stardew Valley aesthetic, retro gaming)

DO NOT mention:
- Path layout, routes, or directions
- Spatial positioning or geographic layout
- Object placement or location

The reference image will handle ALL layout. Your prompt is for ARTISTIC STYLE ONLY.

Output format: Single paragraph, 2-3 sentences, STYLE ONLY.`;
}

/**
 * Use Gemini to generate a scene image prompt, then fal.ai to create the image
 */
export async function generateSingleRoomScene(
  params: SceneGenerationParams
): Promise<string> {
  const { roomId, biome } = params;

  try {
    console.log(`[SceneGen] USE_BIOME_FOR_IMAGES: ${USE_BIOME_FOR_IMAGES} (${USE_BIOME_FOR_IMAGES ? 'biome styling enabled' : 'generic styling'})`);

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

    // Now use fal.ai to generate the actual image with EXPLICIT layout preservation
    console.log(`[SceneGen] Generating image via fal.ai for room ${roomId}${referenceImage ? ' (with PURE PATH MASK reference)' : ''}...`);

    // Build composition-aware prompt with explicit instructions
    const compositionPrompt = `${imagePrompt}

CRITICAL COMPOSITION RULE:
The reference image shows a YELLOW PATH on BLACK background. This path layout is SACRED and IMMUTABLE.
Preserve the EXACT path coordinates while applying the artistic style described above.
The yellow areas in the reference = walkable path (dirt trail, stone path, wooden planks, etc.).
The black areas in the reference = obstacles/decoration (trees, rocks, water, walls, etc.).
DO NOT move, bend, or reshape the path. ONLY stylize it.`;

    const generatedImage = await generatePixelArt({
      prompt: compositionPrompt,
      type: 'scene',
      customDimensions: { width: 1000, height: 800 },
      referenceImage: referenceImage, // Pure path mask Blob
      imageStrength: 0.98, // 98% adherence - MAXIMUM without being image copy (was 0.85)
      useNanoBanana: true, // Gemini 2.5 Flash Image understands composition better
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

    // Combine prompts for panorama - STYLE ONLY
    const panoramaStylePrompt = `LEFT SECTION: ${currentImagePrompt} | RIGHT SECTION: ${nextImagePrompt}
Seamlessly blended artistic styles with unified lighting and color harmony. Natural visual transition between areas.`;

    console.log(`[SceneGen] Panorama style prompt: ${panoramaStylePrompt.substring(0, 200)}...`);

    // Generate combined tile map reference (2000x800)
    let panoramaReferenceUrl: string | undefined;
    if (currentRoomParams.tileMap && nextRoomParams.tileMap) {
      try {
        console.log(`[SceneGen] Creating panorama PURE PATH MASK reference (current + next)...`);
        panoramaReferenceUrl = await combineTileMapsAsPanorama(
          currentRoomParams.tileMap,
          nextRoomParams.tileMap
        );
        console.log(`[SceneGen] Panorama reference ready (combined pure path masks)`);
      } catch (error) {
        console.warn(`[SceneGen] Failed to create panorama reference:`, error);
      }
    }

    // Build composition-aware panorama prompt
    const panoramaCompositionPrompt = `${panoramaStylePrompt}

CRITICAL COMPOSITION RULE:
The reference image is a 2000x800 panorama showing TWO CONNECTED PATHS in YELLOW on BLACK background.
LEFT HALF (0-1000px): Current room path layout (IMMUTABLE)
RIGHT HALF (1000-2000px): Next room path layout (IMMUTABLE)
These path coordinates are SACRED. Preserve EXACT layout while applying the artistic styles above.
Yellow = walkable paths. Black = obstacles/decoration. DO NOT reshape paths, ONLY stylize them.`;

    // Generate 2000x800 panorama with combined tile map reference
    console.log(`[SceneGen] Generating 2000x800 panorama via fal.ai${panoramaReferenceUrl ? ' (with PURE PATH MASK)' : ''}...`);

    const panoramaImage = await generatePixelArt({
      prompt: panoramaCompositionPrompt,
      type: 'panorama',
      customDimensions: { width: 2000, height: 800 },
      referenceImage: panoramaReferenceUrl,
      imageStrength: 0.98, // 98% adherence - MAXIMUM (was 0.85)
      useNanoBanana: true, // Gemini 2.5 Flash Image for panorama with layout preservation
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
