/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {Room, GameObject, Item, StoryMode} from '../types';
import {generateTileMap, BiomeType} from './mapGenerator';
import {generateSingleRoomScene} from './sceneImageGenerator';
import {getOrGenerateBiome} from './biomeService';
import {generateEnemySprite, generateNPCSprite, generateItemSprite} from './spriteGenerator';
import {generateNPCInteractionText} from './npcGenerator';

const ENEMY_SPRITES = ['👹', '👻', '🧟', '🐺', '🦇', '🕷️', '🐍'];
const NPC_SPRITES = ['👨', '👩', '🧙', '🧙‍♀️', '🧝', '🧝‍♀️', '👴', '👵'];
const ITEM_SPRITES = ['📦', '💎', '🗝️', '💰', '⚗️', '📜', '🍖', '🛡️'];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Check if a position is far enough from all existing objects
 * to prevent collision/overlap issues
 */
function isPositionValidForObject(
  position: {x: number; y: number},
  existingObjects: GameObject[],
  minDistance: number = 100
): boolean {
  for (const obj of existingObjects) {
    const distance = Math.sqrt(
      Math.pow(position.x - obj.position.x, 2) +
      Math.pow(position.y - obj.position.y, 2)
    );
    if (distance < minDistance) {
      return false;
    }
  }
  return true;
}

/**
 * Find a valid position for an object with collision avoidance
 */
function findValidPosition(
  pathPoints: {x: number; y: number}[],
  existingObjects: GameObject[],
  maxAttempts: number = 20,
  minDistance: number = 100
): {x: number; y: number} | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pointIndex = Math.floor(Math.random() * pathPoints.length);
    const point = pathPoints[pointIndex];

    // Add randomness to position (but less than before to stay on path)
    const offsetX = (Math.random() - 0.5) * 60;
    const offsetY = (Math.random() - 0.5) * 60;

    const position = {
      x: point.x + offsetX,
      y: point.y + offsetY,
    };

    if (isPositionValidForObject(position, existingObjects, minDistance)) {
      return position;
    }
  }

  // If we couldn't find a valid position, return null
  return null;
}

function generateRandomItem(roomNumber: number): Item | undefined {
  // 50% chance to drop an item
  if (Math.random() < 0.5) return undefined;

  const itemTypes: Item[] = [
    {
      id: `health_potion_${Date.now()}`,
      name: 'Health Potion',
      type: 'consumable',
      sprite: '⚗️',
      description: 'Restores 30 HP',
      effect: { type: 'heal', value: 30 },
    },
    {
      id: `mana_potion_${Date.now()}`,
      name: 'Mana Potion',
      type: 'consumable',
      sprite: '🔮',
      description: 'Restores 25 Mana',
      effect: { type: 'mana', value: 25 },
    },
    {
      id: `strength_charm_${Date.now()}`,
      name: 'Strength Charm',
      type: 'equipment',
      sprite: '💎',
      description: 'Increases damage by 5',
      effect: { type: 'damage_boost', value: 5 },
    },
    {
      id: `iron_ring_${Date.now()}`,
      name: 'Iron Ring',
      type: 'equipment',
      sprite: '💍',
      description: 'Increases defense by 3',
      effect: { type: 'defense_boost', value: 3 },
    },
  ];

  return randomChoice(itemTypes);
}

export async function generateRoom(
  roomId: string,
  storySeed: number,
  roomNumber: number,
  biomeKey: string,
  storyContext: string | null,
  storyMode?: StoryMode,
  previousRoomDescription?: string,
  generateSceneImage: boolean = true, // Flag to control scene generation
): Promise<Room> {
  // Use storySeed + roomNumber for consistent randomization
  const seed = storySeed + roomNumber * 1000;
  Math.random = (() => {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  })();

  // Get or generate biome definition dynamically
  const biomeDefinition = await getOrGenerateBiome(biomeKey, storyContext);

  // Generate tile map with dynamic biome definition
  const tileMap = generateTileMap(roomId, storySeed, roomNumber, undefined, biomeDefinition);

  const objects: GameObject[] = [];

  // Determine room type and difficulty
  const roomTypes = ['combat', 'peaceful', 'treasure', 'puzzle', 'mixed'];
  const roomType = roomNumber === 0 ? 'peaceful' : randomChoice(roomTypes);

  // Generate description based on room type and biome
  let description = '';
  const biomeName = biomeDefinition.name;

  switch (roomType) {
    case 'combat':
      description = `⚔️ ${biomeName} - Danger Ahead`;
      break;
    case 'peaceful':
      description = `🌿 ${biomeName} - Safe Haven`;
      break;
    case 'treasure':
      description = `✨ ${biomeName} - Treasure Found`;
      break;
    case 'puzzle':
      description = `🧩 ${biomeName} - Mysterious Place`;
      break;
    case 'mixed':
      description = `🌍 ${biomeName} - Adventure Awaits`;
      break;
  }

  // Place objects strategically along the path
  const pathPoints = [...tileMap.pathPoints];

  // Remove spawn point from placement options
  const safePathPoints = pathPoints.filter(
    p => Math.abs(p.x - tileMap.spawnPoint.x) > 100 || Math.abs(p.y - tileMap.spawnPoint.y) > 100
  );

  // Generate objects based on room type - place them along the path
  if (roomType === 'combat' || roomType === 'mixed') {
    const numEnemies = randomInt(2, 4);
    for (let i = 0; i < numEnemies && i < safePathPoints.length; i++) {
      // Use collision-aware placement
      const position = findValidPosition(safePathPoints, objects, 20, 100);

      // Skip if we couldn't find a valid position
      if (!position) continue;

      const enemyLevel = Math.max(1, Math.floor(roomNumber / 2) + 1);
      const fallbackSprite = randomChoice(ENEMY_SPRITES);

      objects.push({
        id: `enemy_${roomId}_${i}`,
        position,
        type: 'enemy',
        sprite: fallbackSprite,
        interactionText: `A hostile creature (Lv ${enemyLevel}) blocks your path!`,
        hasInteracted: false,
        enemyLevel: enemyLevel,
        itemDrop: generateRandomItem(roomNumber),
      });
    }
  }

  if (roomType === 'peaceful' || roomType === 'mixed') {
    const numNPCs = randomInt(1, 2);
    for (let i = 0; i < numNPCs && i < safePathPoints.length; i++) {
      // Use collision-aware placement
      const position = findValidPosition(safePathPoints, objects, 20, 100);

      // Skip if we couldn't find a valid position
      if (!position) continue;

      // Generate story-aware NPC description (we'll use this in roomSpriteEnhancer)
      // For now, use generic but mark for AI enhancement
      const interactionText = storyContext
        ? await generateNPCInteractionText('npc', roomNumber, storyContext, storyMode || 'inspiration')
        : 'A traveler rests here';

      objects.push({
        id: `npc_${roomId}_${i}`,
        position,
        type: 'npc',
        sprite: randomChoice(NPC_SPRITES),
        interactionText,
        hasInteracted: false,
      });
    }
  }

  if (roomType === 'treasure' || roomType === 'mixed' || roomType === 'puzzle') {
    const numItems = randomInt(2, 4);
    for (let i = 0; i < numItems && i < safePathPoints.length; i++) {
      // Use collision-aware placement
      const position = findValidPosition(safePathPoints, objects, 20, 100);

      // Skip if we couldn't find a valid position
      if (!position) continue;

      objects.push({
        id: `item_${roomId}_${i}`,
        position,
        type: 'item',
        sprite: randomChoice(ITEM_SPRITES),
        interactionText: 'Something glimmers on the path',
        hasInteracted: false,
      });
    }
  }

  // Reset Math.random to default
  Math.random = (() => {
    const original = Math.random;
    return original;
  })();

  // Generate scene image asynchronously with tile map reference
  // (Only if flag is set - panorama generation will handle it otherwise)
  let sceneImage: string | undefined;
  if (generateSceneImage) {
    try {
      sceneImage = await generateSingleRoomScene({
        roomId,
        roomNumber,
        biome: biomeKey,
        description,
        objects,
        storyContext,
        storyMode,
        previousRoomDescription,
        tileMap, // Pass tile map for reference image generation
      });
    } catch (error) {
      console.error(`Failed to generate scene for room ${roomId}:`, error);
      sceneImage = undefined; // Will fallback to tiles
    }
  }

  return {
    id: roomId,
    description,
    objects,
    visited: false,
    exitDirection: 'right',
    tileMap,
    sceneImage,
    sceneImageLoading: false,
  };
}

export function generateRoomDescription(
  roomType: string,
  objectTypes: string[],
): string {
  const hasEnemies = objectTypes.includes('enemy');
  const hasNPCs = objectTypes.includes('npc');
  const hasItems = objectTypes.includes('item');

  if (hasEnemies && hasNPCs) return '⚔️ A tense area with both friends and foes';
  if (hasEnemies) return '⚔️ Danger ahead - enemies detected';
  if (hasNPCs && hasItems) return '🏛️ A settlement with traders and treasures';
  if (hasNPCs) return '🏘️ A peaceful area with inhabitants';
  if (hasItems) return '✨ A treasure chamber awaits';
  return '🌿 A mysterious empty area';
}
