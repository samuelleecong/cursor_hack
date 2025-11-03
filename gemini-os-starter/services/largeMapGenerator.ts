/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameObject, Item, RoomType } from '../types';
import { generateTileMap, BiomeType, TileMap } from './mapGenerator';

// Seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

export interface ScreenExits {
  north: boolean;
  south: boolean;
  east: boolean;
  west: boolean;
}

export interface ScreenData {
  screenX: number;
  screenY: number;
  roomType: RoomType;
  tileMap: TileMap;
  objects: GameObject[];
  exits: ScreenExits;
  visited: boolean;
}

export interface LargeMap {
  id: string;
  name: string;
  biome: BiomeType;
  gridSize: number;
  screens: ScreenData[][];
}

const ENEMY_SPRITES = ['👹', '👻', '🧟', '🐺', '🦇', '🕷️', '🐍'];
const NPC_SPRITES = ['👨', '👩', '🧙', '🧙‍♀️', '🧝', '🧝‍♀️', '👴', '👵'];
const ITEM_SPRITES = ['📦', '💎', '🗝️', '💰', '⚗️', '📜', '🍖', '🛡️'];

/**
 * Generate a random item based on map difficulty
 */
function generateRandomItem(mapNumber: number, random: SeededRandom): Item | undefined {
  // Higher chance of items in later maps
  const dropChance = 0.3 + (mapNumber * 0.1);
  if (random.next() > dropChance) return undefined;

  const itemTypes: Item[] = [
    {
      id: `health_potion_${Date.now()}_${random.next()}`,
      name: 'Health Potion',
      type: 'consumable',
      sprite: '⚗️',
      description: `Restores ${20 + mapNumber * 10} HP`,
      effect: { type: 'heal', value: 20 + mapNumber * 10 },
    },
    {
      id: `mana_potion_${Date.now()}_${random.next()}`,
      name: 'Mana Potion',
      type: 'consumable',
      sprite: '🔮',
      description: `Restores ${15 + mapNumber * 10} Mana`,
      effect: { type: 'mana', value: 15 + mapNumber * 10 },
    },
    {
      id: `strength_charm_${Date.now()}_${random.next()}`,
      name: mapNumber > 2 ? 'Greater Strength Charm' : 'Strength Charm',
      type: 'equipment',
      sprite: '💎',
      description: `Increases damage by ${3 + mapNumber * 2}`,
      effect: { type: 'damage_boost', value: 3 + mapNumber * 2 },
    },
    {
      id: `iron_ring_${Date.now()}_${random.next()}`,
      name: mapNumber > 2 ? 'Steel Ring' : 'Iron Ring',
      type: 'equipment',
      sprite: '💍',
      description: `Increases defense by ${2 + mapNumber * 2}`,
      effect: { type: 'defense_boost', value: 2 + mapNumber * 2 },
    },
  ];

  return random.choice(itemTypes);
}

/**
 * Generate enemies for a screen
 */
function generateEnemiesForScreen(
  screenX: number,
  screenY: number,
  screenType: RoomType,
  mapNumber: number,
  tileMap: TileMap,
  random: SeededRandom
): GameObject[] {
  const enemies: GameObject[] = [];

  // No enemies in certain room types
  if (screenType === 'start' || screenType === 'safe' || screenType === 'boss') {
    return enemies;
  }

  // Determine enemy count based on screen type and map difficulty
  let minEnemies = 2 + mapNumber;
  let maxEnemies = 4 + mapNumber * 2;

  if (screenType === 'reward') {
    minEnemies = 1;
    maxEnemies = 2; // Fewer enemies in reward rooms
  } else if (screenType === 'puzzle') {
    minEnemies = 1;
    maxEnemies = 3;
  }

  const enemyCount = random.nextInt(minEnemies, Math.min(maxEnemies, 8));

  // Get walkable path points
  const pathPoints = tileMap.pathPoints.filter((p, index) => {
    // Filter out spawn point area
    const distFromSpawn = Math.abs(p.x - tileMap.spawnPoint.x) + Math.abs(p.y - tileMap.spawnPoint.y);
    return distFromSpawn > 150;
  });

  // Place enemies along the path
  for (let i = 0; i < enemyCount && i < pathPoints.length; i++) {
    const pointIndex = Math.floor(i * pathPoints.length / enemyCount);
    const point = pathPoints[pointIndex];

    // Add randomness to position
    const offsetX = (random.next() - 0.5) * 60;
    const offsetY = (random.next() - 0.5) * 60;

    // Calculate enemy level based on map number
    const enemyLevel = Math.max(1, mapNumber * 2 + random.nextInt(0, 2));

    enemies.push({
      id: `enemy_${screenX}_${screenY}_${i}`,
      position: {
        x: point.x + offsetX,
        y: point.y + offsetY,
      },
      type: 'enemy',
      sprite: random.choice(ENEMY_SPRITES),
      interactionText: `A hostile creature (Lv ${enemyLevel}) blocks your path!`,
      hasInteracted: false,
      enemyLevel: enemyLevel,
      itemDrop: generateRandomItem(mapNumber, random),
    });
  }

  return enemies;
}

/**
 * Generate items for a screen
 */
function generateItemsForScreen(
  screenX: number,
  screenY: number,
  screenType: RoomType,
  mapNumber: number,
  tileMap: TileMap,
  random: SeededRandom
): GameObject[] {
  const items: GameObject[] = [];

  // Determine item count based on screen type
  let itemCount = 0;
  if (screenType === 'reward') {
    itemCount = random.nextInt(4, 6);
  } else if (screenType === 'puzzle') {
    itemCount = random.nextInt(2, 3);
  } else if (screenType === 'combat') {
    itemCount = random.nextInt(1, 2);
  }

  const pathPoints = tileMap.pathPoints;

  for (let i = 0; i < itemCount && i < pathPoints.length; i++) {
    const pointIndex = random.nextInt(0, pathPoints.length - 1);
    const point = pathPoints[pointIndex];

    const offsetX = (random.next() - 0.5) * 60;
    const offsetY = (random.next() - 0.5) * 60;

    items.push({
      id: `item_${screenX}_${screenY}_${i}`,
      position: {
        x: point.x + offsetX,
        y: point.y + offsetY,
      },
      type: 'item',
      sprite: random.choice(ITEM_SPRITES),
      interactionText: 'A valuable reward!',
      hasInteracted: false,
    });
  }

  return items;
}

/**
 * Generate special objects for specific room types
 */
function generateSpecialObjects(
  screenX: number,
  screenY: number,
  screenType: RoomType,
  mapNumber: number,
  tileMap: TileMap,
  random: SeededRandom
): GameObject[] {
  const objects: GameObject[] = [];

  switch (screenType) {
    case 'start':
      // NPC guide at starting screen
      objects.push({
        id: `npc_guide_${screenX}_${screenY}`,
        position: {
          x: tileMap.spawnPoint.x + 100,
          y: tileMap.spawnPoint.y,
        },
        type: 'npc',
        sprite: '🧙',
        interactionText: `Welcome to the ${mapNumber === 1 ? 'Mystic Forest' : mapNumber === 2 ? 'Scorched Plains' : mapNumber === 3 ? 'Shadow Caverns' : 'Ancient Ruins'}!`,
        hasInteracted: false,
      });
      break;

    case 'safe':
      // Healing shrine
      if (tileMap.pathPoints.length > 0) {
        const centerPoint = tileMap.pathPoints[Math.floor(tileMap.pathPoints.length / 2)];
        objects.push({
          id: `shrine_${screenX}_${screenY}`,
          position: { x: centerPoint.x, y: centerPoint.y },
          type: 'shrine',
          sprite: '⛲',
          interactionText: 'A healing shrine radiates warmth. Press SPACE to restore HP and Mana.',
          hasInteracted: false,
          healAmount: 999,
        });
      }
      // Friendly NPC
      if (tileMap.pathPoints.length > 1) {
        const npcPoint = tileMap.pathPoints[random.nextInt(0, tileMap.pathPoints.length - 1)];
        objects.push({
          id: `npc_${screenX}_${screenY}`,
          position: { x: npcPoint.x, y: npcPoint.y },
          type: 'npc',
          sprite: random.choice(NPC_SPRITES),
          interactionText: 'Rest here, weary traveler. You are safe.',
          hasInteracted: false,
        });
      }
      break;

    case 'puzzle':
      // Puzzle mechanism
      if (tileMap.pathPoints.length > 0) {
        const puzzlePoint = tileMap.pathPoints[0];
        const rewardItem: Item = {
          id: `puzzle_reward_${screenX}_${screenY}`,
          name: `Ancient Artifact ${mapNumber}`,
          type: 'equipment',
          sprite: '💎',
          description: `A powerful relic from solving the puzzle (+${5 + mapNumber * 3} damage)`,
          effect: { type: 'damage_boost', value: 5 + mapNumber * 3 },
        };

        objects.push({
          id: `puzzle_${screenX}_${screenY}`,
          position: { x: puzzlePoint.x, y: puzzlePoint.y },
          type: 'puzzle_element',
          sprite: '🗿',
          interactionText: 'An ancient mechanism awaits your wisdom. Press SPACE to solve.',
          hasInteracted: false,
          puzzleData: {
            id: `puzzle_${screenX}_${screenY}`,
            solved: false,
            rewardItem: rewardItem,
          },
        });
      }
      break;

    case 'boss':
      // Boss enemy
      if (tileMap.pathPoints.length > 0) {
        const bossPoint = tileMap.pathPoints[Math.floor(tileMap.pathPoints.length / 2)];
        const bossLevel = 10 + mapNumber * 5;

        objects.push({
          id: `boss_${screenX}_${screenY}`,
          position: { x: bossPoint.x, y: bossPoint.y },
          type: 'boss',
          sprite: '👿',
          interactionText: `THE DUNGEON LORD (Lv ${bossLevel}) - Prepare for battle!`,
          hasInteracted: false,
          enemyLevel: bossLevel,
          itemDrop: {
            id: `legendary_${screenX}_${screenY}`,
            name: 'Legendary Artifact',
            type: 'equipment',
            sprite: '👑',
            description: 'The ultimate power',
            effect: { type: 'damage_boost', value: 15 + mapNumber * 5 },
          },
        });
      }
      break;
  }

  return objects;
}

/**
 * Define special room locations for a map
 */
function getSpecialRoomLayout(mapNumber: number): Map<string, RoomType> {
  const layout = new Map<string, RoomType>();

  switch (mapNumber) {
    case 1: // Mystic Forest
      layout.set('0,0', 'start');
      layout.set('2,2', 'safe');
      layout.set('1,3', 'reward');
      layout.set('3,1', 'reward');
      layout.set('2,4', 'puzzle');
      layout.set('4,2', 'puzzle');
      layout.set('4,4', 'combat'); // Exit portal location
      break;

    case 2: // Scorched Plains
      layout.set('0,0', 'combat'); // Entry
      layout.set('2,2', 'safe');
      layout.set('1,4', 'reward');
      layout.set('4,1', 'reward');
      layout.set('3,3', 'reward');
      layout.set('3,1', 'puzzle');
      layout.set('4,4', 'combat'); // Exit portal location
      break;

    case 3: // Shadow Caverns
      layout.set('0,0', 'combat'); // Entry
      layout.set('2,2', 'safe');
      layout.set('1,4', 'reward');
      layout.set('4,1', 'reward');
      layout.set('2,4', 'puzzle');
      layout.set('4,2', 'puzzle');
      layout.set('4,4', 'combat'); // Exit portal location
      break;

    case 4: // Ancient Ruins
      layout.set('0,0', 'combat'); // Entry
      layout.set('1,1', 'safe');
      layout.set('2,2', 'reward');
      layout.set('3,3', 'puzzle');
      layout.set('4,4', 'boss'); // FINAL BOSS
      break;
  }

  return layout;
}

/**
 * Generate a single screen
 */
function generateScreen(
  screenX: number,
  screenY: number,
  mapNumber: number,
  biome: BiomeType,
  gridSize: number,
  specialRooms: Map<string, RoomType>,
  seed: number
): ScreenData {
  const random = new SeededRandom(seed + screenX * 100 + screenY * 1000);
  const screenKey = `${screenX},${screenY}`;

  // Determine room type
  const roomType: RoomType = specialRooms.get(screenKey) || 'combat';

  // Generate tile map for this screen
  const screenId = `map${mapNumber}_screen_${screenX}_${screenY}`;
  const tileMap = generateTileMap(screenId, seed, screenX + screenY + mapNumber, biome, exits);

  // Generate enemies
  const enemies = generateEnemiesForScreen(screenX, screenY, roomType, mapNumber, tileMap, random);

  // Generate items
  const items = generateItemsForScreen(screenX, screenY, roomType, mapNumber, tileMap, random);

  // Generate special objects
  const specialObjects = generateSpecialObjects(screenX, screenY, roomType, mapNumber, tileMap, random);

  // Combine all objects
  const objects = [...enemies, ...items, ...specialObjects];

  // Determine exits (all internal screens connect to neighbors, edges are closed except portals)
  const exits: ScreenExits = {
    north: screenY > 0,
    south: screenY < gridSize - 1,
    east: screenX < gridSize - 1,
    west: screenX > 0,
  };

  return {
    screenX,
    screenY,
    roomType,
    tileMap,
    objects,
    exits,
    visited: false,
  };
}

/**
 * Generate a complete large map
 */
export function generateLargeMap(
  mapId: string,
  mapName: string,
  biome: BiomeType,
  mapNumber: number,
  seed: number
): LargeMap {
  const gridSize = 5;
  const screens: ScreenData[][] = [];
  const specialRooms = getSpecialRoomLayout(mapNumber);

  // Generate all screens
  for (let y = 0; y < gridSize; y++) {
    screens[y] = [];
    for (let x = 0; x < gridSize; x++) {
      screens[y][x] = generateScreen(x, y, mapNumber, biome, gridSize, specialRooms, seed);
    }
  }

  console.log(`Generated ${mapName} (${gridSize}x${gridSize} screens, ${biome} biome)`);

  return {
    id: mapId,
    name: mapName,
    biome,
    gridSize,
    screens,
  };
}

/**
 * Generate all 4 maps for the game
 */
export function generateAllMaps(seed: number): LargeMap[] {
  const maps: LargeMap[] = [
    generateLargeMap('map_1', 'Mystic Forest', 'forest', 1, seed),
    generateLargeMap('map_2', 'Scorched Plains', 'desert', 2, seed + 10000),
    generateLargeMap('map_3', 'Shadow Caverns', 'cave', 3, seed + 20000),
    generateLargeMap('map_4', 'Ancient Ruins', 'dungeon', 4, seed + 30000),
  ];

  console.log('=== ALL MAPS GENERATED ===');
  console.log(`Total screens: ${maps.length * 25}`);
  console.log(`Maps: ${maps.map(m => m.name).join(', ')}`);

  return maps;
}

/**
 * Get screen ID for tracking
 */
export function getScreenId(mapId: string, screenX: number, screenY: number): string {
  return `${mapId}_${screenX}_${screenY}`;
}
