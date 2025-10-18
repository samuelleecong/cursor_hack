/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {Room, GameObject} from '../types';

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

  const objects: GameObject[] = [];

  // Determine room type and difficulty
  const roomTypes = ['combat', 'peaceful', 'treasure', 'puzzle', 'mixed'];
  const roomType = roomNumber === 0 ? 'peaceful' : randomChoice(roomTypes);

  // Generate description based on room type
  let description = '';
  switch (roomType) {
    case 'combat':
      description = '⚔️ A dangerous area - enemies lurk nearby';
      break;
    case 'peaceful':
      description = '🌿 A calm area - take a moment to rest';
      break;
    case 'treasure':
      description = '✨ A chamber filled with treasures';
      break;
    case 'puzzle':
      description = '🧩 An mysterious place with strange artifacts';
      break;
    case 'mixed':
      description = '🌍 An area with various opportunities';
      break;
  }

  // Add entrance marker for rooms after first
  if (roomNumber > 0) {
    objects.push({
      id: `entrance_${roomId}`,
      position: {x: 100, y: 300},
      type: 'entrance',
      sprite: '🚪',
      interactionText: 'The way you came from',
      hasInteracted: false,
    });
  }

  // Generate objects based on room type
  if (roomType === 'combat' || roomType === 'mixed') {
    const numEnemies = randomInt(1, 3);
    for (let i = 0; i < numEnemies; i++) {
      objects.push({
        id: `enemy_${roomId}_${i}`,
        position: {
          x: randomInt(200, 600),
          y: randomInt(150, 450),
        },
        type: 'enemy',
        sprite: randomChoice(ENEMY_SPRITES),
        interactionText: 'A hostile creature',
        hasInteracted: false,
      });
    }
  }

  if (roomType === 'peaceful' || roomType === 'mixed') {
    const numNPCs = randomInt(1, 2);
    for (let i = 0; i < numNPCs; i++) {
      objects.push({
        id: `npc_${roomId}_${i}`,
        position: {
          x: randomInt(200, 600),
          y: randomInt(150, 450),
        },
        type: 'npc',
        sprite: randomChoice(NPC_SPRITES),
        interactionText: 'A friendly person',
        hasInteracted: false,
      });
    }
  }

  if (roomType === 'treasure' || roomType === 'mixed' || roomType === 'puzzle') {
    const numItems = randomInt(1, 3);
    for (let i = 0; i < numItems; i++) {
      objects.push({
        id: `item_${roomId}_${i}`,
        position: {
          x: randomInt(200, 600),
          y: randomInt(150, 450),
        },
        type: 'item',
        sprite: randomChoice(ITEM_SPRITES),
        interactionText: 'An interesting item',
        hasInteracted: false,
      });
    }
  }

  // Add exit on the right side
  objects.push({
    id: `exit_${roomId}`,
    position: {x: 700, y: 300},
    type: 'exit',
    sprite: '🚪',
    interactionText: 'Exit to the next area',
    hasInteracted: false,
  });

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
