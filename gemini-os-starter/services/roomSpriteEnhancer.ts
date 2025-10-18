/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import { GameObject, Room } from '../types';
import { generateEnemySprite, generateNPCSprite, generateItemSprite } from './spriteGenerator';
import { generateNPCDescription, generateEnemyDescription } from './npcGenerator';

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
  storyContext: string | null,
  roomNumber?: number,
  storyMode?: 'inspiration' | 'recreation' | 'continuation'
): Promise<Room> {
  if (room.objects.every(obj => obj.spriteUrl)) {
    console.log('[RoomSpriteEnhancer] All objects already have sprites, skipping');
    return room;
  }

  console.log(`[RoomSpriteEnhancer] 🎨 Starting sprite enhancement for ${room.id} with ${room.objects.length} objects`);
  console.log(`[RoomSpriteEnhancer] Biome: ${biome}, Story context: ${storyContext ? 'Yes' : 'No'}`);

  const enhancedObjects: GameObject[] = [];
  const extractedRoomNumber = roomNumber ?? parseInt(room.id.split('_')[1] || '0');

  for (const obj of room.objects) {
    if (obj.spriteUrl) {
      console.log(`[RoomSpriteEnhancer] ✓ ${obj.type} ${obj.id} already has sprite, skipping`);
      enhancedObjects.push(obj);
      continue;
    }

    console.log(`[RoomSpriteEnhancer] 🖼️ Generating sprite for ${obj.type} ${obj.id} (emoji: ${obj.sprite})...`);
    const enhancedObj = { ...obj };

    try {
      if (obj.type === 'enemy') {
        // Generate story-aware enemy description
        const enemyDescription = await generateEnemyDescription(
          extractedRoomNumber,
          biome,
          obj.enemyLevel || 1,
          storyContext,
          storyMode || 'inspiration'
        );
        const sprite = await generateEnemySprite(
          enemyDescription,
          biome,
          obj.enemyLevel || 1,
          obj.sprite,
          storyContext || undefined
        );
        enhancedObj.spriteUrl = sprite.url || undefined;
        console.log(`[RoomSpriteEnhancer] ✅ Enemy sprite generated: ${sprite.url?.substring(0, 60)}...`);
      } else if (obj.type === 'npc') {
        // Generate story-aware NPC description
        const npcDescription = await generateNPCDescription(
          extractedRoomNumber,
          biome,
          storyContext,
          storyMode || 'inspiration'
        );
        const sprite = await generateNPCSprite(
          npcDescription,
          biome,
          obj.sprite,
          storyContext || undefined
        );
        enhancedObj.spriteUrl = sprite.url || undefined;
        console.log(`[RoomSpriteEnhancer] ✅ NPC sprite generated: ${sprite.url?.substring(0, 60)}...`);
      } else if (obj.type === 'item') {
        const itemDescription = 'treasure, collectible';
        const sprite = await generateItemSprite(
          itemDescription,
          'glowing game item',
          obj.sprite,
          biome
        );
        enhancedObj.spriteUrl = sprite.url || undefined;
        console.log(`[RoomSpriteEnhancer] ✅ Item sprite generated: ${sprite.url?.substring(0, 60)}...`);
      }
    } catch (error) {
      console.error(`[RoomSpriteEnhancer] ❌ Failed to generate sprite for ${obj.type} ${obj.id}:`, error);
      console.error(`[RoomSpriteEnhancer] 🔄 Object will use emoji fallback: ${obj.sprite}`);
    }

    enhancedObjects.push(enhancedObj);
  }

  const spriteUrls = enhancedObjects
    .map(obj => obj.spriteUrl)
    .filter((url): url is string => Boolean(url));

  const totalObjects = room.objects.length;
  const successCount = spriteUrls.length;
  const failureCount = totalObjects - successCount;

  console.log(`[RoomSpriteEnhancer] 📊 Sprite generation summary:`);
  console.log(`  - Total objects: ${totalObjects}`);
  console.log(`  - Sprites generated: ${successCount}`);
  console.log(`  - Using emoji fallback: ${failureCount}`);

  if (spriteUrls.length > 0) {
    console.log(`[RoomSpriteEnhancer] 📥 Preloading ${spriteUrls.length} sprites...`);
    await Promise.allSettled(spriteUrls.map(url => preloadSpriteImage(url)));
    console.log('[RoomSpriteEnhancer] ✅ All sprites preloaded and ready to display');
  } else {
    console.warn('[RoomSpriteEnhancer] ⚠️ No sprites generated - all objects will use emoji fallbacks');
  }

  return {
    ...room,
    objects: enhancedObjects,
  };
}

export async function enhanceObjectWithSprite(
  obj: GameObject,
  biome: string,
  storyContext?: string,
  roomNumber?: number,
  storyMode?: 'inspiration' | 'recreation' | 'continuation'
): Promise<GameObject> {
  const enhanced = { ...obj };

  try {
    if (obj.type === 'enemy') {
      const enemyDescription = await generateEnemyDescription(
        roomNumber || 0,
        biome,
        obj.enemyLevel || 1,
        storyContext || null,
        storyMode || 'inspiration'
      );
      const sprite = await generateEnemySprite(
        enemyDescription,
        biome,
        obj.enemyLevel || 1,
        obj.sprite,
        storyContext
      );
      enhanced.spriteUrl = sprite.url || undefined;
    } else if (obj.type === 'npc') {
      const npcDescription = await generateNPCDescription(
        roomNumber || 0,
        biome,
        storyContext || null,
        storyMode || 'inspiration'
      );
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
