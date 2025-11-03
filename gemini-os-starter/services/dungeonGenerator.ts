/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DungeonGrid, DungeonCell, GridPosition, RoomExits, RoomType } from '../types';

// Seeded random number generator for consistent dungeon generation
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

  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

/**
 * Generates a 9x9 dungeon grid with main path and branches
 */
export function generateDungeonGrid(seed: number): DungeonGrid {
  const GRID_SIZE = 9;
  const random = new SeededRandom(seed);

  // Initialize empty grid
  const cells: DungeonCell[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    cells[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      cells[y][x] = {
        gridX: x,
        gridY: y,
        roomType: 'combat',
        exits: { north: false, south: false, east: false, west: false },
        isOnMainPath: false,
        distanceFromStart: Infinity,
      };
    }
  }

  // Define start and boss positions
  const startPosition: GridPosition = { gridX: 0, gridY: 4 }; // Middle left
  const bossPosition: GridPosition = { gridX: 8, gridY: 4 }; // Middle right

  // Generate main path from start to boss using A* pathfinding
  const mainPath = generateMainPath(startPosition, bossPosition, GRID_SIZE, random);

  // Mark main path cells and set distances
  mainPath.forEach((pos, index) => {
    const cell = cells[pos.gridY][pos.gridX];
    cell.isOnMainPath = true;
    cell.distanceFromStart = index;
  });

  // Connect main path cells
  for (let i = 0; i < mainPath.length - 1; i++) {
    const current = mainPath[i];
    const next = mainPath[i + 1];
    connectCells(cells, current, next);
  }

  // Generate branch paths (5-10 branches)
  const numBranches = random.nextInt(5, 10);
  for (let i = 0; i < numBranches; i++) {
    generateBranch(cells, mainPath, GRID_SIZE, random);
  }

  // Assign room types
  assignRoomTypes(cells, startPosition, bossPosition, mainPath, random);

  // Debug: Log starting cell exits
  const startCell = cells[startPosition.gridY][startPosition.gridX];
  console.log('=== DUNGEON GENERATION DEBUG ===');
  console.log('Start position:', startPosition);
  console.log('Start cell exits:', startCell.exits);
  console.log('Start cell room type:', startCell.roomType);
  console.log('Main path length:', mainPath.length);
  console.log('First few path cells:', mainPath.slice(0, 5));

  return {
    size: GRID_SIZE,
    cells,
    startPosition,
    bossPosition,
  };
}

/**
 * Generate main path using A* algorithm with some randomness for variety
 */
function generateMainPath(
  start: GridPosition,
  end: GridPosition,
  gridSize: number,
  random: SeededRandom
): GridPosition[] {
  const path: GridPosition[] = [start];
  let current = { ...start };

  while (current.gridX !== end.gridX || current.gridY !== end.gridY) {
    const possibleMoves: GridPosition[] = [];

    // Prefer moving towards the goal but allow some variation
    if (current.gridX < end.gridX) possibleMoves.push({ gridX: current.gridX + 1, gridY: current.gridY });
    if (current.gridY < end.gridY) possibleMoves.push({ gridX: current.gridX, gridY: current.gridY + 1 });
    if (current.gridY > end.gridY) possibleMoves.push({ gridX: current.gridX, gridY: current.gridY - 1 });

    // Occasionally allow lateral movement for more interesting paths
    if (possibleMoves.length > 0 && random.next() > 0.3) {
      // 70% chance to move towards goal
      const move = possibleMoves[random.nextInt(0, possibleMoves.length - 1)];
      current = move;
      path.push(current);
    } else {
      // 30% chance for random valid movement
      const allMoves: GridPosition[] = [];
      if (current.gridX < gridSize - 1) allMoves.push({ gridX: current.gridX + 1, gridY: current.gridY });
      if (current.gridX > 0) allMoves.push({ gridX: current.gridX - 1, gridY: current.gridY });
      if (current.gridY < gridSize - 1) allMoves.push({ gridX: current.gridX, gridY: current.gridY + 1 });
      if (current.gridY > 0) allMoves.push({ gridX: current.gridX, gridY: current.gridY - 1 });

      const move = allMoves[random.nextInt(0, allMoves.length - 1)];
      // Avoid backtracking
      if (path.length < 2 || (move.gridX !== path[path.length - 2].gridX || move.gridY !== path[path.length - 2].gridY)) {
        current = move;
        path.push(current);
      }
    }
  }

  return path;
}

/**
 * Generate a branch path from the main path
 */
function generateBranch(
  cells: DungeonCell[][],
  mainPath: GridPosition[],
  gridSize: number,
  random: SeededRandom
): void {
  // Pick a random point on the main path (not start or end)
  const branchStart = mainPath[random.nextInt(1, mainPath.length - 2)];

  // Determine branch direction (perpendicular to main path preferred)
  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  const shuffledDirections = random.shuffle(directions);

  for (const dir of shuffledDirections) {
    const branchLength = random.nextInt(2, 4);
    let current = { ...branchStart };
    let validBranch = true;

    const branchCells: GridPosition[] = [];

    for (let i = 0; i < branchLength; i++) {
      const next = {
        gridX: current.gridX + dir.dx,
        gridY: current.gridY + dir.dy,
      };

      // Check if next position is valid and not already on main path
      if (
        next.gridX < 0 ||
        next.gridX >= gridSize ||
        next.gridY < 0 ||
        next.gridY >= gridSize ||
        cells[next.gridY][next.gridX].isOnMainPath
      ) {
        validBranch = false;
        break;
      }

      branchCells.push(next);
      current = next;
    }

    // If we found a valid branch, connect it
    if (validBranch && branchCells.length > 0) {
      let prev = branchStart;
      for (const cell of branchCells) {
        connectCells(cells, prev, cell);
        cells[cell.gridY][cell.gridX].distanceFromStart = cells[prev.gridY][prev.gridX].distanceFromStart + 1;
        prev = cell;
      }
      break; // Only create one branch per attempt
    }
  }
}

/**
 * Connect two adjacent cells by opening exits between them
 */
function connectCells(cells: DungeonCell[][], from: GridPosition, to: GridPosition): void {
  const fromCell = cells[from.gridY][from.gridX];
  const toCell = cells[to.gridY][to.gridX];

  if (to.gridX > from.gridX) {
    // Moving east
    fromCell.exits.east = true;
    toCell.exits.west = true;
  } else if (to.gridX < from.gridX) {
    // Moving west
    fromCell.exits.west = true;
    toCell.exits.east = true;
  } else if (to.gridY > from.gridY) {
    // Moving south
    fromCell.exits.south = true;
    toCell.exits.north = true;
  } else if (to.gridY < from.gridY) {
    // Moving north
    fromCell.exits.north = true;
    toCell.exits.south = true;
  }
}

/**
 * Assign room types to cells
 */
function assignRoomTypes(
  cells: DungeonCell[][],
  start: GridPosition,
  boss: GridPosition,
  mainPath: GridPosition[],
  random: SeededRandom
): void {
  const gridSize = cells.length;

  // Collect all accessible cells
  const accessibleCells: DungeonCell[] = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cell = cells[y][x];
      const hasAnyExit = cell.exits.north || cell.exits.south || cell.exits.east || cell.exits.west;
      if (hasAnyExit) {
        accessibleCells.push(cell);
      }
    }
  }

  // Set start room
  cells[start.gridY][start.gridX].roomType = 'start';

  // Set boss room
  cells[boss.gridY][boss.gridX].roomType = 'boss';

  // Determine counts for special rooms
  const numReward = random.nextInt(8, 12);
  const numSafe = random.nextInt(4, 6);
  const numPuzzle = random.nextInt(4, 6);

  // Filter out start and boss rooms
  const availableCells = accessibleCells.filter(
    (cell) => !(cell.gridX === start.gridX && cell.gridY === start.gridY) &&
               !(cell.gridX === boss.gridX && cell.gridY === boss.gridY)
  );

  // Shuffle available cells
  const shuffled = random.shuffle(availableCells);

  // Assign special room types
  let index = 0;

  // Reward rooms (prefer branch ends and corners)
  const branchEnds = shuffled.filter((cell) => {
    const exitCount = [cell.exits.north, cell.exits.south, cell.exits.east, cell.exits.west].filter(Boolean).length;
    return exitCount === 1 && !cell.isOnMainPath;
  });

  for (let i = 0; i < Math.min(numReward, branchEnds.length); i++) {
    branchEnds[i].roomType = 'reward';
  }

  // Safe rooms (place along main path for rest stops)
  const mainPathCells = shuffled.filter((cell) => cell.isOnMainPath);
  const safeInterval = Math.floor(mainPathCells.length / (numSafe + 1));
  for (let i = 1; i <= numSafe && i * safeInterval < mainPathCells.length; i++) {
    mainPathCells[i * safeInterval].roomType = 'safe';
  }

  // Puzzle rooms (random placement on branches)
  const puzzleCandidates = shuffled.filter(
    (cell) => cell.roomType === 'combat' && !cell.isOnMainPath
  );
  for (let i = 0; i < Math.min(numPuzzle, puzzleCandidates.length); i++) {
    puzzleCandidates[i].roomType = 'puzzle';
  }

  // Remaining cells are combat rooms (already set as default)
}

/**
 * Get room ID from grid coordinates
 */
export function getRoomIdFromGrid(gridX: number, gridY: number): string {
  return `room_${gridX}_${gridY}`;
}

/**
 * Get grid coordinates from room ID
 */
export function getGridFromRoomId(roomId: string): GridPosition | null {
  const match = roomId.match(/^room_(\d+)_(\d+)$/);
  if (match) {
    return {
      gridX: parseInt(match[1], 10),
      gridY: parseInt(match[2], 10),
    };
  }
  return null;
}

/**
 * Get adjacent cell in a direction
 */
export function getAdjacentCell(
  grid: DungeonGrid,
  position: GridPosition,
  direction: 'north' | 'south' | 'east' | 'west'
): DungeonCell | null {
  let newX = position.gridX;
  let newY = position.gridY;

  switch (direction) {
    case 'north':
      newY--;
      break;
    case 'south':
      newY++;
      break;
    case 'east':
      newX++;
      break;
    case 'west':
      newX--;
      break;
  }

  if (newX < 0 || newX >= grid.size || newY < 0 || newY >= grid.size) {
    return null;
  }

  return grid.cells[newY][newX];
}
