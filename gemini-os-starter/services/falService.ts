/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import * as fal from '@fal-ai/serverless-client';

// Configure fal.ai with API key
fal.config({
  credentials: 'a2570e68-cecf-427f-bac2-8088260cf7cc:71a537235ff88639ac23425615b658ed',
});

const PIXEL_ART_STYLE = '16-bit pixel art, top-down view, RPG game sprite, Stardew Valley style, retro gaming aesthetic';
const NEGATIVE_PROMPT = 'blurry, 3D, realistic, photograph, low quality, modern, detailed shading';

export interface ImageGenerationParams {
  prompt: string;
  type: 'character' | 'enemy' | 'background' | 'item' | 'npc';
  size?: 'small' | 'medium' | 'large';
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  type: string;
}

// Get image size based on type
function getImageSize(type: string, sizePreference?: string): { width: number; height: number } {
  if (type === 'background') {
    return { width: 1024, height: 576 }; // 16:9 aspect ratio for backgrounds
  }

  if (sizePreference === 'small') {
    return { width: 256, height: 256 };
  }
  if (sizePreference === 'large') {
    return { width: 512, height: 512 };
  }

  // Default medium size for characters, enemies, NPCs
  return { width: 384, height: 384 };
}

/**
 * Generate a single pixel art image using fal.ai
 */
export async function generatePixelArt(params: ImageGenerationParams): Promise<GeneratedImage> {
  const { prompt, type, size = 'medium' } = params;

  // Build full prompt with pixel art styling
  const fullPrompt = `${prompt}, ${PIXEL_ART_STYLE}`;

  const dimensions = getImageSize(type, size);

  try {
    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: fullPrompt,
        image_size: {
          width: dimensions.width,
          height: dimensions.height,
        },
        num_inference_steps: 4, // Fast generation
        num_images: 1,
        enable_safety_checker: false,
      },
      logs: false,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log(`Generating ${type}: ${update.logs?.map(l => l.message).join(' ')}`);
        }
      },
    });

    console.log('[falService] Raw result from fal.ai:', result);

    // Defensive access to the image URL
    const imageUrl = result?.images?.[0]?.url;

    if (!imageUrl) {
      console.error('[falService] Image URL not found in fal.ai response. Full response:', result);
      throw new Error('Image URL not found in fal.ai response.');
    }

    return {
      url: imageUrl,
      prompt: fullPrompt,
      type,
    };
  } catch (error) {
    console.error(`Failed to generate ${type} image:`, error);
    throw new Error(`Image generation failed for ${type}: ${error}`);
  }
}

/**
 * Generate multiple images in parallel
 */
export async function generateMultipleImages(
  params: ImageGenerationParams[]
): Promise<GeneratedImage[]> {
  const promises = params.map(param => generatePixelArt(param));
  return Promise.all(promises);
}

/**
 * Generate a complete battle scene (background + characters)
 */
export async function generateBattleScene(scene: {
  backgroundPrompt: string;
  characterPrompt?: string;
  enemyPrompt: string;
}): Promise<{
  background: GeneratedImage;
  character?: GeneratedImage;
  enemy: GeneratedImage;
}> {
  const imagesToGenerate: ImageGenerationParams[] = [
    { prompt: scene.backgroundPrompt, type: 'background', size: 'large' },
    { prompt: scene.enemyPrompt, type: 'enemy', size: 'medium' },
  ];

  if (scene.characterPrompt) {
    imagesToGenerate.push({
      prompt: scene.characterPrompt,
      type: 'character',
      size: 'medium',
    });
  }

  const results = await generateMultipleImages(imagesToGenerate);

  return {
    background: results[0],
    enemy: results[1],
    character: results[2],
  };
}

/**
 * Generate exploration sprites (for GameCanvas)
 */
export async function generateExplorationSprites(spriteDescriptions: {
  player?: string;
  npcs?: string[];
  enemies?: string[];
  items?: string[];
  terrain?: string;
}): Promise<{
  player?: GeneratedImage;
  npcs: GeneratedImage[];
  enemies: GeneratedImage[];
  items: GeneratedImage[];
  terrain?: GeneratedImage;
}> {
  const imagesToGenerate: ImageGenerationParams[] = [];

  if (spriteDescriptions.player) {
    imagesToGenerate.push({
      prompt: spriteDescriptions.player,
      type: 'character',
      size: 'small',
    });
  }

  if (spriteDescriptions.terrain) {
    imagesToGenerate.push({
      prompt: spriteDescriptions.terrain,
      type: 'background',
      size: 'large',
    });
  }

  spriteDescriptions.npcs?.forEach(npc => {
    imagesToGenerate.push({ prompt: npc, type: 'npc', size: 'small' });
  });

  spriteDescriptions.enemies?.forEach(enemy => {
    imagesToGenerate.push({ prompt: enemy, type: 'enemy', size: 'small' });
  });

  spriteDescriptions.items?.forEach(item => {
    imagesToGenerate.push({ prompt: item, type: 'item', size: 'small' });
  });

  const results = await generateMultipleImages(imagesToGenerate);

  // Parse results back into categories
  let resultIndex = 0;
  const parsed: any = {
    npcs: [],
    enemies: [],
    items: [],
  };

  if (spriteDescriptions.player) {
    parsed.player = results[resultIndex++];
  }

  if (spriteDescriptions.terrain) {
    parsed.terrain = results[resultIndex++];
  }

  for (let i = 0; i < (spriteDescriptions.npcs?.length || 0); i++) {
    parsed.npcs.push(results[resultIndex++]);
  }

  for (let i = 0; i < (spriteDescriptions.enemies?.length || 0); i++) {
    parsed.enemies.push(results[resultIndex++]);
  }

  for (let i = 0; i < (spriteDescriptions.items?.length || 0); i++) {
    parsed.items.push(results[resultIndex++]);
  }

  return parsed;
}
