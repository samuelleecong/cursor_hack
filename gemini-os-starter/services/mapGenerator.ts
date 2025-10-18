/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */

export type TileType =
  | 'grass'
  | 'path'
  | 'stone'
  | 'water'
  | 'tree'
  | 'bush'
  | 'wall'
  | 'floor'
  | 'dirt'
  | 'sand'
  | 'rock'
  | 'flowers';

export type BiomeType = 'forest' | 'dungeon' | 'plains' | 'desert' | 'cave';

export interface Tile {
  type: TileType;
  walkable: boolean;
  color: string;
  emoji?: string;
}

export interface TileMap {
  width: number;
  height: number;
  tileSize: number;
  tiles: Tile[][];
  biome: BiomeType;
  spawnPoint: { x: number; y: number };
  pathPoints: { x: number; y: number }[]; // Points along the main path for enemy placement
}

const TILE_CONFIGS: Record<TileType, Tile> = {
  grass: { type: 'grass', walkable: false, color: '#4ade80', emoji: '🌱' },
  path: { type: 'path', walkable: true, color: '#a8a29e', emoji: '⬜' },
  stone: { type: 'stone', walkable: true, color: '#78716c', emoji: '🪨' },
  water: { type: 'water', walkable: false, color: '#3b82f6', emoji: '💧' },
  tree: { type: 'tree', walkable: false, color: '#22c55e', emoji: '🌲' },
  bush: { type: 'bush', walkable: false, color: '#16a34a', emoji: '🌿' },
  wall: { type: 'wall', walkable: false, color: '#57534e', emoji: '🧱' },
  floor: { type: 'floor', walkable: true, color: '#d6d3d1', emoji: '⬜' },
  dirt: { type: 'dirt', walkable: true, color: '#92400e', emoji: '🟫' },
  sand: { type: 'sand', walkable: true, color: '#fbbf24', emoji: '🏜️' },
  rock: { type: 'rock', walkable: false, color: '#a1a1aa', emoji: '🪨' },
  flowers: { type: 'flowers', walkable: false, color: '#f472b6', emoji: '🌸' },
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Generate a winding path through the map using A* algorithm variant
 */
function generatePath(
  width: number,
  height: number,
  start: { x: number; y: number },
  end: { x: number; y: number },
  random: () => number,
): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = [];

  let current = { ...start };
  path.push({ ...current });

  // Create a winding path with some randomness
  while (current.x !== end.x || current.y !== end.y) {
    const dx = end.x - current.x;
    const dy = end.y - current.y;

    // Add some randomness to path direction
    const moveX = Math.abs(dx) > Math.abs(dy) || random() > 0.5;

    if (moveX && dx !== 0) {
      current.x += dx > 0 ? 1 : -1;
    } else if (dy !== 0) {
      current.y += dy > 0 ? 1 : -1;
    } else if (dx !== 0) {
      current.x += dx > 0 ? 1 : -1;
    }

    path.push({ ...current });

    // Occasionally add a detour for more natural looking paths
    if (random() < 0.2 && path.length > 3) {
      const detour = random() < 0.5 ? { x: 0, y: random() < 0.5 ? 1 : -1 } : { x: random() < 0.5 ? 1 : -1, y: 0 };
      const detourPoint = { x: current.x + detour.x, y: current.y + detour.y };

      if (detourPoint.x >= 0 && detourPoint.x < width && detourPoint.y >= 0 && detourPoint.y < height) {
        current = detourPoint;
        path.push({ ...current });
      }
    }
  }

  return path;
}

/**
 * Expand path to make it wider (2-3 tiles wide)
 */
function expandPath(
  path: { x: number; y: number }[],
  width: number,
  height: number,
): Set<string> {
  const expandedPath = new Set<string>();

  path.forEach((point) => {
    // Add the center point
    expandedPath.add(`${point.x},${point.y}`);

    // Add surrounding points to make path wider
    const offsets = [
      { x: -1, y: 0 }, { x: 1, y: 0 },
      { x: 0, y: -1 }, { x: 0, y: 1 },
      { x: -1, y: -1 }, { x: 1, y: 1 },
      { x: -1, y: 1 }, { x: 1, y: -1 },
    ];

    offsets.forEach((offset) => {
      const newX = point.x + offset.x;
      const newY = point.y + offset.y;

      if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
        expandedPath.add(`${newX},${newY}`);
      }
    });
  });

  return expandedPath;
}

/**
 * Generate a tile-based map for a specific biome
 * ALWAYS creates a horizontal left-to-right path for consistency
 */
export function generateTileMap(
  roomId: string,
  storySeed: number,
  roomNumber: number,
  biomeType?: BiomeType,
): TileMap {
  const seed = storySeed + roomNumber * 1000;
  const random = seededRandom(seed);

  // Map dimensions (in tiles)
  const width = 25; // 25 tiles * 40px = 1000px
  const height = 20; // 20 tiles * 40px = 800px
  const tileSize = 40;

  // Determine biome
  let biome: BiomeType = biomeType || 'forest';
  if (!biomeType) {
    if (roomNumber < 3) biome = 'forest';
    else if (roomNumber < 6) biome = 'plains';
    else if (roomNumber < 10) biome = 'desert';
    else biome = 'dungeon';
  }

  // Set biome-specific tiles
  let baseTile: TileType;
  let pathTile: TileType;
  let obstacleTiles: TileType[];

  switch (biome) {
    case 'forest':
      baseTile = 'grass';
      pathTile = 'dirt';
      obstacleTiles = ['tree', 'bush'];
      break;
    case 'plains':
      baseTile = 'grass';
      pathTile = 'path';
      obstacleTiles = ['bush', 'flowers', 'rock'];
      break;
    case 'desert':
      baseTile = 'sand';
      pathTile = 'stone';
      obstacleTiles = ['rock', 'bush'];
      break;
    case 'dungeon':
      baseTile = 'floor';
      pathTile = 'floor';
      obstacleTiles = ['wall'];
      break;
    case 'cave':
      baseTile = 'stone';
      pathTile = 'floor';
      obstacleTiles = ['wall', 'rock'];
      break;
  }

  // Initialize map with base tiles
  const tiles: Tile[][] = [];
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = { ...TILE_CONFIGS[baseTile] };
    }
  }

  // ALWAYS create horizontal path from left to right at middle height
  // This ensures consistent entry/exit points across all rooms
  const midY = Math.floor(height / 2);
  const start = { x: 0, y: midY };
  const end = { x: width - 1, y: midY };

  // Generate and expand path
  const pathLine = generatePath(width, height, start, end, random);
  const pathSet = expandPath(pathLine, width, height);

  // Apply path to tiles
  const pathPoints: { x: number; y: number }[] = [];
  pathSet.forEach((key) => {
    const [x, y] = key.split(',').map(Number);
    tiles[y][x] = { ...TILE_CONFIGS[pathTile] };

    // Store path points for enemy placement (sample every few tiles)
    if (pathLine.some(p => p.x === x && p.y === y) && pathPoints.length < 15) {
      pathPoints.push({ x, y });
    }
  });

  // Add obstacles around the path (but not blocking it)
  const obstacleChance = biome === 'dungeon' ? 0.10 : 0.20;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      // Don't place obstacles on path tiles
      if (!pathSet.has(key) && random() < obstacleChance) {
        // Make sure we don't block the path
        const adjacentToPath =
          pathSet.has(`${x-1},${y}`) ||
          pathSet.has(`${x+1},${y}`) ||
          pathSet.has(`${x},${y-1}`) ||
          pathSet.has(`${x},${y+1}`);

        // Only place obstacles if not too close to path edges
        if (!adjacentToPath || random() > 0.7) {
          const obstacleTile = obstacleTiles[Math.floor(random() * obstacleTiles.length)];
          tiles[y][x] = { ...TILE_CONFIGS[obstacleTile] };
        }
      }
    }
  }

  // Create borders for dungeons
  if (biome === 'dungeon' || biome === 'cave') {
    for (let x = 0; x < width; x++) {
      // Don't block path at edges
      if (!pathSet.has(`${x},0`)) {
        tiles[0][x] = { ...TILE_CONFIGS['wall'] };
      }
      if (!pathSet.has(`${x},${height-1}`)) {
        tiles[height - 1][x] = { ...TILE_CONFIGS['wall'] };
      }
    }
    for (let y = 0; y < height; y++) {
      // Don't block path at edges
      if (!pathSet.has(`0,${y}`)) {
        tiles[y][0] = { ...TILE_CONFIGS['wall'] };
      }
      if (!pathSet.has(`${width-1},${y}`)) {
        tiles[y][width - 1] = { ...TILE_CONFIGS['wall'] };
      }
    }
  }

  // CRITICAL: Spawn point is always at left-center of path (consistent entry)
  // This ensures smooth transitions between rooms
  return {
    width,
    height,
    tileSize,
    tiles,
    biome,
    spawnPoint: { x: 2 * tileSize, y: midY * tileSize + tileSize / 2 },
    pathPoints: pathPoints.map(p => ({ x: p.x * tileSize + tileSize / 2, y: p.y * tileSize + tileSize / 2 })),
  };
}

/**
 * Check if a position is walkable on the map
 */
export function isPositionWalkable(
  tileMap: TileMap,
  x: number,
  y: number,
): boolean {
  const tileX = Math.floor(x / tileMap.tileSize);
  const tileY = Math.floor(y / tileMap.tileSize);

  if (tileX < 0 || tileX >= tileMap.width || tileY < 0 || tileY >= tileMap.height) {
    return false;
  }

  return tileMap.tiles[tileY][tileX].walkable;
}

/**
 * Get tile color at position for rendering
 */
export function getTileColor(tileMap: TileMap, tileX: number, tileY: number): string {
  if (tileX < 0 || tileX >= tileMap.width || tileY < 0 || tileY >= tileMap.height) {
    return '#000000';
  }
  return tileMap.tiles[tileY][tileX].color;
}
