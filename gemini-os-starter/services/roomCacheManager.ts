/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Room, DungeonGrid, GridPosition, DungeonCell } from '../types';
import { getAdjacentCell, getRoomIdFromGrid } from './dungeonGenerator';

/**
 * Manages room loading, caching, and unloading for optimal performance
 */
export class RoomCacheManager {
  private loadedRooms: Set<string>;
  private roomGenerationQueue: Set<string>;

  constructor() {
    this.loadedRooms = new Set();
    this.roomGenerationQueue = new Set();
  }

  /**
   * Get rooms that should be loaded based on current position
   */
  getRoomsToLoad(
    currentPosition: GridPosition,
    dungeonGrid: DungeonGrid,
    existingRooms: Map<string, Room>
  ): string[] {
    const roomsToLoad: string[] = [];
    const currentRoomId = getRoomIdFromGrid(currentPosition.gridX, currentPosition.gridY);

    // Always load current room
    if (!existingRooms.has(currentRoomId)) {
      roomsToLoad.push(currentRoomId);
    }

    // Load adjacent rooms (1 step away)
    const currentCell = dungeonGrid.cells[currentPosition.gridY][currentPosition.gridX];
    const directions: Array<'north' | 'south' | 'east' | 'west'> = ['north', 'south', 'east', 'west'];

    for (const direction of directions) {
      if (currentCell.exits[direction]) {
        const adjacentCell = getAdjacentCell(dungeonGrid, currentPosition, direction);
        if (adjacentCell) {
          const adjacentRoomId = getRoomIdFromGrid(adjacentCell.gridX, adjacentCell.gridY);
          if (!existingRooms.has(adjacentRoomId)) {
            roomsToLoad.push(adjacentRoomId);
          }
        }
      }
    }

    return roomsToLoad;
  }

  /**
   * Get rooms that should be unloaded based on current position
   */
  getRoomsToUnload(
    currentPosition: GridPosition,
    dungeonGrid: DungeonGrid,
    existingRooms: Map<string, Room>
  ): string[] {
    const roomsToUnload: string[] = [];
    const currentRoomId = getRoomIdFromGrid(currentPosition.gridX, currentPosition.gridY);

    // Get all adjacent room IDs (should be kept loaded)
    const keepLoadedIds = new Set<string>();
    keepLoadedIds.add(currentRoomId);

    const currentCell = dungeonGrid.cells[currentPosition.gridY][currentPosition.gridX];
    const directions: Array<'north' | 'south' | 'east' | 'west'> = ['north', 'south', 'east', 'west'];

    for (const direction of directions) {
      if (currentCell.exits[direction]) {
        const adjacentCell = getAdjacentCell(dungeonGrid, currentPosition, direction);
        if (adjacentCell) {
          const adjacentRoomId = getRoomIdFromGrid(adjacentCell.gridX, adjacentCell.gridY);
          keepLoadedIds.add(adjacentRoomId);
        }
      }
    }

    // Find rooms to unload (not in keep list)
    for (const [roomId] of existingRooms) {
      if (!keepLoadedIds.has(roomId)) {
        // Check if this room should be unloaded (more than 1 step away)
        const gridPos = this.getRoomGridPosition(roomId);
        if (gridPos) {
          const distance = this.getManhattanDistance(currentPosition, gridPos);
          if (distance > 1) {
            roomsToUnload.push(roomId);
          }
        }
      }
    }

    return roomsToUnload;
  }

  /**
   * Calculate Manhattan distance between two grid positions
   */
  private getManhattanDistance(pos1: GridPosition, pos2: GridPosition): number {
    return Math.abs(pos1.gridX - pos2.gridX) + Math.abs(pos1.gridY - pos2.gridY);
  }

  /**
   * Extract grid position from room ID
   */
  private getRoomGridPosition(roomId: string): GridPosition | null {
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
   * Mark room as loaded
   */
  markRoomLoaded(roomId: string): void {
    this.loadedRooms.add(roomId);
  }

  /**
   * Mark room as unloaded
   */
  markRoomUnloaded(roomId: string): void {
    this.loadedRooms.delete(roomId);
  }

  /**
   * Check if room is loaded
   */
  isRoomLoaded(roomId: string): boolean {
    return this.loadedRooms.has(roomId);
  }

  /**
   * Get all currently loaded rooms
   */
  getLoadedRooms(): string[] {
    return Array.from(this.loadedRooms);
  }

  /**
   * Clear all cache data
   */
  clearCache(): void {
    this.loadedRooms.clear();
    this.roomGenerationQueue.clear();
  }

  /**
   * Pre-load adjacent rooms in the background (optional optimization)
   */
  preloadAdjacentRooms(
    currentPosition: GridPosition,
    dungeonGrid: DungeonGrid,
    existingRooms: Map<string, Room>
  ): GridPosition[] {
    const toPreload: GridPosition[] = [];
    const currentCell = dungeonGrid.cells[currentPosition.gridY][currentPosition.gridX];
    const directions: Array<'north' | 'south' | 'east' | 'west'> = ['north', 'south', 'east', 'west'];

    for (const direction of directions) {
      if (currentCell.exits[direction]) {
        const adjacentCell = getAdjacentCell(dungeonGrid, currentPosition, direction);
        if (adjacentCell) {
          const adjacentRoomId = getRoomIdFromGrid(adjacentCell.gridX, adjacentCell.gridY);
          if (!existingRooms.has(adjacentRoomId) && !this.roomGenerationQueue.has(adjacentRoomId)) {
            toPreload.push({ gridX: adjacentCell.gridX, gridY: adjacentCell.gridY });
            this.roomGenerationQueue.add(adjacentRoomId);
          }
        }
      }
    }

    return toPreload;
  }

  /**
   * Remove room from generation queue
   */
  removeFromQueue(roomId: string): void {
    this.roomGenerationQueue.delete(roomId);
  }
}

// Singleton instance
export const roomCacheManager = new RoomCacheManager();
