/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {Room, GameObject} from '../types';
import {generateTileMap, BiomeType} from './mapGenerator';

const ENEMY_SPRITES = ['👹', '👻', '🧟', '🐺', '🦇', '🕷️', '🐍'];
const NPC_SPRITES = ['👨', '👩', '🧙', '🧙‍♀️', '🧝', '🧝‍♀️', '👴', '👵'];
const ITEM_SPRITES = ['📦', '💎', '🗝️', '💰', '⚗️', '📜', '🍖', '🛡️'];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRoom(
  roomId: string,
  storySeed: number,
  roomNumber: number,
  previousRoomType?: string,
): Room {
  // Use storySeed + roomNumber for consistent randomization
  const seed = storySeed + roomNumber * 1000;
  Math.random = (() => {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  })();

  // Determine biome based on room number
  let biome: BiomeType = 'forest';
  if (roomNumber < 3) biome = 'forest';
  else if (roomNumber < 6) biome = 'plains';
  else if (roomNumber < 10) biome = 'desert';
  else if (roomNumber < 15) biome = 'cave';
  else biome = 'dungeon';

  // Generate tile map with proper pathways
  const tileMap = generateTileMap(roomId, storySeed, roomNumber, biome);

  const objects: GameObject[] = [];

  // Determine room type and difficulty
  const roomTypes = ['combat', 'peaceful', 'treasure', 'puzzle', 'mixed'];
  const roomType = roomNumber === 0 ? 'peaceful' : randomChoice(roomTypes);

  // Generate description based on room type and biome
  let description = '';
  const biomeNames = {
    forest: 'Forest Path',
    plains: 'Open Plains',
    desert: 'Desert Trail',
    cave: 'Dark Cavern',
    dungeon: 'Ancient Dungeon',
  };

  switch (roomType) {
    case 'combat':
      description = `⚔️ ${biomeNames[biome]} - Danger Ahead`;
      break;
    case 'peaceful':
      description = `🌿 ${biomeNames[biome]} - Safe Haven`;
      break;
    case 'treasure':
      description = `✨ ${biomeNames[biome]} - Treasure Found`;
      break;
    case 'puzzle':
      description = `🧩 ${biomeNames[biome]} - Mysterious Place`;
      break;
    case 'mixed':
      description = `🌍 ${biomeNames[biome]} - Adventure Awaits`;
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
      const pointIndex = Math.floor(i * safePathPoints.length / numEnemies);
      const point = safePathPoints[pointIndex];

      // Add slight randomness to position
      const offsetX = (Math.random() - 0.5) * 40;
      const offsetY = (Math.random() - 0.5) * 40;

      objects.push({
        id: `enemy_${roomId}_${i}`,
        position: {
          x: point.x + offsetX,
          y: point.y + offsetY,
        },
        type: 'enemy',
        sprite: randomChoice(ENEMY_SPRITES),
        interactionText: 'A hostile creature blocks your path!',
        hasInteracted: false,
      });
    }
  }

  if (roomType === 'peaceful' || roomType === 'mixed') {
    const numNPCs = randomInt(1, 2);
    for (let i = 0; i < numNPCs && i < safePathPoints.length; i++) {
      const pointIndex = Math.floor(Math.random() * safePathPoints.length);
      const point = safePathPoints[pointIndex];

      const offsetX = (Math.random() - 0.5) * 40;
      const offsetY = (Math.random() - 0.5) * 40;

      objects.push({
        id: `npc_${roomId}_${i}`,
        position: {
          x: point.x + offsetX,
          y: point.y + offsetY,
        },
        type: 'npc',
        sprite: randomChoice(NPC_SPRITES),
        interactionText: 'A traveler rests here',
        hasInteracted: false,
      });
    }
  }

  if (roomType === 'treasure' || roomType === 'mixed' || roomType === 'puzzle') {
    const numItems = randomInt(2, 4);
    for (let i = 0; i < numItems && i < safePathPoints.length; i++) {
      const pointIndex = Math.floor(Math.random() * safePathPoints.length);
      const point = safePathPoints[pointIndex];

      const offsetX = (Math.random() - 0.5) * 40;
      const offsetY = (Math.random() - 0.5) * 40;

      objects.push({
        id: `item_${roomId}_${i}`,
        position: {
          x: point.x + offsetX,
          y: point.y + offsetY,
        },
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

  return {
    id: roomId,
    description,
    objects,
    visited: false,
    exitDirection: 'right',
    tileMap,
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
