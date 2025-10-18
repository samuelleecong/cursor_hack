/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import { GameObject, Room } from '../types';
import { generateEnemySprite, generateNPCSprite, generateItemSprite } from './spriteGenerator';

async function preloadSpriteImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload: ${url}`));
    img.src = url;
  });
}

export async function enhanceRoomWithSprites(
  room: Room,
  biome: string,
  storyContext: string | null
): Promise<Room> {
  if (room.objects.every(obj => obj.spriteUrl)) {
    console.log('[RoomSpriteEnhancer] All objects already have sprites, skipping');
    return room;
  }

  const enhancedObjects: GameObject[] = [];

  for (const obj of room.objects) {
    if (obj.spriteUrl) {
      enhancedObjects.push(obj);
      continue;
    }

    const enhancedObj = { ...obj };

    try {
      if (obj.type === 'enemy') {
        const enemyDescription = `hostile creature, ${biome} monster`;
        const sprite = await generateEnemySprite(
          enemyDescription,
          biome,
          obj.enemyLevel || 1,
          obj.sprite,
          storyContext || undefined
        );
        enhancedObj.spriteUrl = sprite.url || undefined;
      } else if (obj.type === 'npc') {
        const npcDescription = 'traveler, friendly character';
        const sprite = await generateNPCSprite(
          npcDescription,
          biome,
          obj.sprite,
          storyContext || undefined
        );
        enhancedObj.spriteUrl = sprite.url || undefined;
      } else if (obj.type === 'item') {
        const itemDescription = 'treasure, collectible';
        const sprite = await generateItemSprite(
          itemDescription,
          'glowing game item',
          obj.sprite,
          biome
        );
        enhancedObj.spriteUrl = sprite.url || undefined;
      }
    } catch (error) {
      console.error(`[RoomSpriteEnhancer] Failed to generate sprite for ${obj.type}:`, error);
    }

    enhancedObjects.push(enhancedObj);
  }

  const spriteUrls = enhancedObjects
    .map(obj => obj.spriteUrl)
    .filter((url): url is string => Boolean(url));

  console.log(`[RoomSpriteEnhancer] Preloading ${spriteUrls.length} sprites...`);
  await Promise.allSettled(spriteUrls.map(url => preloadSpriteImage(url)));
  console.log('[RoomSpriteEnhancer] All sprites preloaded');

  return {
    ...room,
    objects: enhancedObjects,
  };
}

export async function enhanceObjectWithSprite(
  obj: GameObject,
  biome: string,
  storyContext?: string
): Promise<GameObject> {
  const enhanced = { ...obj };

  try {
    if (obj.type === 'enemy') {
      const enemyDescription = `hostile creature, ${biome} monster`;
      const sprite = await generateEnemySprite(
        enemyDescription,
        biome,
        obj.enemyLevel || 1,
        obj.sprite,
        storyContext
      );
      enhanced.spriteUrl = sprite.url || undefined;
    } else if (obj.type === 'npc') {
      const npcDescription = 'traveler, friendly character';
      const sprite = await generateNPCSprite(
        npcDescription,
        biome,
        obj.sprite,
        storyContext
      );
      enhanced.spriteUrl = sprite.url || undefined;
    } else if (obj.type === 'item') {
      const itemDescription = 'treasure, collectible';
      const sprite = await generateItemSprite(
        itemDescription,
        'glowing game item',
        obj.sprite,
        biome
      );
      enhanced.spriteUrl = sprite.url || undefined;
    }
  } catch (error) {
    console.error(`[RoomSpriteEnhancer] Failed to generate sprite for ${obj.type}:`, error);
  }

  return enhanced;
}
