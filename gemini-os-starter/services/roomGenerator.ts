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

const ENEMY_SPRITES = ['⚠️', '🚨', '🏃', '🥊', '🎯', '📉', '🧱'];
const NPC_SPRITES = ['👨', '👩', '🧑‍💼', '🧑‍🎓', '🧑‍🏫', '🧑‍🔬', '🧑‍🚀', '🧑‍⚕️'];
const ITEM_SPRITES = ['📦', '📘', '🧃', '🎒', '💼', '📊', '📝', '🔑'];

// OPTIMIZATION: Memoization cache for story term extraction
// Avoids repeated regex operations on the same story content
const storyTermsCache = new Map<string, string[]>();

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function extractStoryTerms(storyContext: string | null, storyBeat?: any): string[] {
  // Generate cache key from inputs
  const beatTitle = storyBeat?.title || '';
  const beatChars = storyBeat?.keyCharacters?.join(',') || '';
  const contextSnippet = storyContext?.slice(0, 100) || '';
  const cacheKey = `${beatTitle}|${beatChars}|${contextSnippet}`;

  // Return cached result if available
  if (storyTermsCache.has(cacheKey)) {
    return storyTermsCache.get(cacheKey)!;
  }

  const terms = new Set<string>();

  if (storyBeat?.keyCharacters?.length) {
    storyBeat.keyCharacters.forEach((name: string) => {
      const trimmed = name.trim();
      if (trimmed.length > 1) {
        terms.add(trimmed);
      }
    });
  }

  if (storyBeat?.title) {
    const titleTerms = storyBeat.title.split(/\s+/).filter((word: string) => /^[A-Za-z][A-Za-z'-]+$/.test(word));
    titleTerms.forEach((term: string) => {
      if (term.length > 2) {
        terms.add(term);
      }
    });
  }

  if (storyContext) {
    const properNouns = storyContext.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g);
    if (properNouns) {
      properNouns.forEach((match) => {
        const cleaned = match.trim();
        if (cleaned.length > 2 && cleaned.length <= 32) {
          terms.add(cleaned);
        }
      });
    }
  }

  const result = Array.from(terms);

  // Cache the result for future calls
  storyTermsCache.set(cacheKey, result);

  // Limit cache size to prevent memory bloat
  if (storyTermsCache.size > 50) {
    const firstKey = storyTermsCache.keys().next().value;
    storyTermsCache.delete(firstKey);
  }

  return result;
}

function buildStoryItem(
  idPrefix: string,
  name: string,
  sprite: string,
  description: string,
  itemType: Item['type'],
  effect: Item['effect']
): Item {
  return {
    id: `${idPrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    type: itemType,
    sprite,
    description,
    effect,
  };
}

function generateStoryAlignedItems(
  storyContext: string | null,
  storyMode: StoryMode | undefined,
  storyBeat: any,
  biomeName: string
): Item[] {
  const terms = extractStoryTerms(storyContext, storyBeat);
  const baseTerm = terms.length > 0 ? randomChoice(terms) : biomeName || 'Story';
  const focusDescriptor = storyMode === 'recreation' ? 'Authentic' : 'Inspired';

  return [
    buildStoryItem(
      'wellness_pack',
      `${baseTerm} Wellness Kit`,
      '🩹',
      `Restores stamina using support from ${baseTerm}.`,
      'consumable',
      { type: 'heal', value: 30 },
    ),
    buildStoryItem(
      'strategy_notes',
      `${baseTerm} Strategy Notes`,
      '📓',
      `Detailed insights to stay focused on ${baseTerm}'s objectives.`,
      'consumable',
      { type: 'mana', value: 25 },
    ),
    buildStoryItem(
      'momentum_token',
      `${focusDescriptor} Momentum Badge`,
      '🏅',
      `Boosts confidence earned from recent progress.`,
      'equipment',
      { type: 'damage_boost', value: 5 },
    ),
    buildStoryItem(
      'safety_gear',
      `${baseTerm} Safety Vest`,
      '🦺',
      `Protective gear endorsed by ${baseTerm} to stay resilient.`,
      'equipment',
      { type: 'defense_boost', value: 3 },
    ),
  ];
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

function generateRandomItem(
  roomNumber: number,
  storyContext: string | null,
  storyMode: StoryMode | undefined,
  storyBeat: any,
  biomeName: string
): Item | undefined {
  // 50% chance to drop an item
  if (Math.random() < 0.5) return undefined;

  const themedItems = generateStoryAlignedItems(storyContext, storyMode, storyBeat, biomeName);
  return randomChoice(themedItems);
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
  storyBeat?: any, // Story beat from story structure (recreation mode)
): Promise<Room> {
  const roomStartTime = performance.now();

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

  // Generate description based on story beat (recreation mode) or room type
  let description = '';
  const biomeName = biomeDefinition.name;

  if (storyBeat && storyMode === 'recreation') {
    // RECREATION MODE: Use story beat title and description
    description = `📖 ${storyBeat.title}`;
    console.log(`[RoomGenerator] Recreation mode - Room ${roomNumber}: ${storyBeat.title}`);
    console.log(`  Objective: ${storyBeat.objective}`);
    console.log(`  Key Characters: ${storyBeat.keyCharacters.join(', ')}`);
  } else {
    // Regular mode: Use biome name and room type
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
        description = `🧩 ${biomeName} - Strategic Challenge`;
        break;
      case 'mixed':
        description = `🌍 ${biomeName} - Adventure Awaits`;
        break;
    }
  }

  // Place objects strategically along the path
  const pathPoints = [...tileMap.pathPoints];

  // Remove spawn point from placement options
  const safePathPoints = pathPoints.filter(
    p => Math.abs(p.x - tileMap.spawnPoint.x) > 100 || Math.abs(p.y - tileMap.spawnPoint.y) > 100
  );

  // Generate objects based on room type - place them along the path
  // RECREATION MODE: Spawn specific story characters
  if (storyBeat && storyMode === 'recreation' && storyBeat.keyCharacters && storyBeat.keyCharacters.length > 0) {
    console.log(`[RoomGenerator] Recreation mode - spawning story characters: ${storyBeat.keyCharacters.join(', ')}`);

    const combatKeywords = ['fight', 'battle', 'defeat', 'attack', 'confront', 'enemy', 'rival'];
    const isHostile = combatKeywords.some(keyword =>
      storyBeat.objective.toLowerCase().includes(keyword) ||
      storyBeat.description.toLowerCase().includes(keyword)
    );

    // First pass: Determine character types and positions
    const characterData: Array<{
      name: string;
      position: {x: number; y: number};
      isEnemy: boolean;
      index: number;
    }> = [];

    for (let i = 0; i < storyBeat.keyCharacters.length && i < safePathPoints.length; i++) {
      const position = findValidPosition(safePathPoints, objects, 20, 100);
      if (!position) continue;

      const characterName = storyBeat.keyCharacters[i];
      const isEnemy = isHostile && i === 0; // First character is the main antagonist

      characterData.push({
        name: characterName,
        position,
        isEnemy,
        index: i
      });
    }

    // Second pass: Batch generate interaction texts for all NPCs in parallel
    const npcData = characterData.filter(char => !char.isEnemy);
    const npcStartTime = performance.now();

    const npcInteractionTexts = await Promise.all(
      npcData.map(char =>
        generateNPCInteractionText(
          char.name,
          roomNumber,
          `${storyContext}\n\nCurrent scene: ${storyBeat.description}\nObjective: ${storyBeat.objective}`,
          storyMode
        )
      )
    );

    const npcDuration = performance.now() - npcStartTime;
    if (npcData.length > 0) {
      console.log(`[RoomGenerator] ⚡ Generated ${npcData.length} NPC interactions in ${npcDuration.toFixed(0)}ms (parallel)`);
    }

    // Third pass: Create all character objects
    let npcTextIndex = 0;
    for (const char of characterData) {
      if (char.isEnemy) {
        const enemyLevel = Math.max(1, roomNumber + 1);
        objects.push({
          id: `story_enemy_${roomId}_${char.index}`,
          position: char.position,
          type: 'enemy',
          sprite: randomChoice(ENEMY_SPRITES),
          interactionText: `${char.name} stands in your way! (Lv ${enemyLevel})`,
          hasInteracted: false,
          enemyLevel: enemyLevel,
          itemDrop: generateRandomItem(roomNumber, storyContext, storyMode, storyBeat, biomeName),
        });
        console.log(`  - Spawned enemy: ${char.name}`);
      } else {
        const interactionText = npcInteractionTexts[npcTextIndex++];
        objects.push({
          id: `story_npc_${roomId}_${char.index}`,
          position: char.position,
          type: 'npc',
          sprite: randomChoice(NPC_SPRITES),
          interactionText: `${char.name}: ${interactionText}`,
          hasInteracted: false,
        });
        console.log(`  - Spawned NPC: ${char.name}`);
      }
    }
  } else {
    // REGULAR MODE: Random enemies and NPCs
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
          itemDrop: generateRandomItem(roomNumber, storyContext, storyMode, storyBeat, biomeName),
        });
      }
    }

    if (roomType === 'peaceful' || roomType === 'mixed') {
      const numNPCs = randomInt(1, 2);

      // First pass: Determine NPC positions
      const npcPositions: Array<{position: {x: number; y: number}; index: number}> = [];
      for (let i = 0; i < numNPCs && i < safePathPoints.length; i++) {
        const position = findValidPosition(safePathPoints, objects, 20, 100);
        if (!position) continue;

        npcPositions.push({ position, index: i });
      }

      // Second pass: Batch generate all NPC interaction texts in parallel (if story context exists)
      const npcStartTime = performance.now();
      const npcInteractionTexts = storyContext && npcPositions.length > 0
        ? await Promise.all(
            npcPositions.map(() =>
              generateNPCInteractionText('npc', roomNumber, storyContext, storyMode || 'inspiration')
            )
          )
        : npcPositions.map(() => 'A traveler rests here');

      const npcDuration = performance.now() - npcStartTime;
      if (storyContext && npcPositions.length > 0) {
        console.log(`[RoomGenerator] ⚡ Generated ${npcPositions.length} NPC interactions in ${npcDuration.toFixed(0)}ms (parallel)`);
      }

      // Third pass: Create NPC objects with pre-generated texts
      npcPositions.forEach((npcData, idx) => {
        objects.push({
          id: `npc_${roomId}_${npcData.index}`,
          position: npcData.position,
          type: 'npc',
          sprite: randomChoice(NPC_SPRITES),
          interactionText: npcInteractionTexts[idx],
          hasInteracted: false,
        });
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

  const roomDuration = performance.now() - roomStartTime;
  console.log(`[RoomGenerator] ✅ Room ${roomId} generated in ${roomDuration.toFixed(0)}ms (${objects.length} objects, scene: ${generateSceneImage ? 'yes' : 'no'})`);

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
