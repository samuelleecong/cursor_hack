/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import * as fal from '@fal-ai/serverless-client';

export interface ComposedScene {
  url: string;
  description: string;
}

export async function composeInteractionScene(
  playerSpriteUrl: string,
  npcSpriteUrl: string,
  biome: string,
  sceneDescription: string
): Promise<ComposedScene> {
  try {
    console.log('[SceneComposer] Composing interaction scene...');

    const prompt = `${sceneDescription}

Create this scene in 16-bit SNES pixel art style. Include the hero character and NPC character in the scene as described. 
Top-down RPG perspective, cohesive retro pixel art aesthetic with detailed environment, atmospheric lighting, and depth.`;

    const result: any = await fal.subscribe('fal-ai/nano-banana/edit', {
      input: {
        prompt,
        image_urls: [playerSpriteUrl, npcSpriteUrl],
        num_images: 1,
      },
      logs: true,
    });

    if (!result?.images?.[0]?.url) {
      throw new Error('No image generated');
    }

    console.log('[SceneComposer] Scene composed successfully');

    return {
      url: result.images[0].url,
      description: result.description || prompt,
    };
  } catch (error) {
    console.error('[SceneComposer] Failed to compose scene:', error);
    throw error;
  }
}

export async function composeSceneWithBackground(
  playerSpriteUrl: string,
  npcSpriteUrl: string,
  backgroundPrompt: string,
  biome: string
): Promise<ComposedScene> {
  try {
    console.log('[SceneComposer] Composing scene with custom background...');

    const prompt = `${backgroundPrompt}. Place the pixel art hero character and NPC character in this scene. 
16-bit SNES style, top-down RPG perspective, cohesive pixel art aesthetic. 
Integrate the characters naturally into the ${biome} environment with atmospheric lighting and depth.`;

    const result: any = await fal.subscribe('fal-ai/nano-banana/edit', {
      input: {
        prompt,
        image_urls: [playerSpriteUrl, npcSpriteUrl],
        num_images: 1,
      },
      logs: true,
    });

    if (!result?.images?.[0]?.url) {
      throw new Error('No image generated');
    }

    console.log('[SceneComposer] Scene with background composed successfully');

    return {
      url: result.images[0].url,
      description: result.description || prompt,
    };
  } catch (error) {
    console.error('[SceneComposer] Failed to compose scene with background:', error);
    throw error;
  }
}
