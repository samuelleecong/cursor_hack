/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import { Room } from '../types';

const ROOM_CACHE_KEY = 'roguelike_room_cache';
const CACHE_VERSION = 1;

interface CachedRoomData {
  version: number;
  storySeed: number;
  rooms: { [roomId: string]: Room };
  timestamp: number;
}

export class RoomCache {
  private storySeed: number = 0;

  initialize(storySeed: number): void {
    this.storySeed = storySeed;
  }

  getCachedRooms(): Map<string, Room> | null {
    try {
      const cached = localStorage.getItem(ROOM_CACHE_KEY);
      if (!cached) return null;

      const data: CachedRoomData = JSON.parse(cached);

      if (data.version !== CACHE_VERSION || data.storySeed !== this.storySeed) {
        console.log('[RoomCache] Cache invalid: version or seed mismatch');
        return null;
      }

      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000;
      if (now - data.timestamp > maxAge) {
        console.log('[RoomCache] Cache expired');
        return null;
      }

      const rooms = new Map<string, Room>();
      Object.entries(data.rooms).forEach(([id, room]) => {
        rooms.set(id, room);
      });

      console.log(`[RoomCache] Loaded ${rooms.size} rooms from cache`);
      return rooms;
    } catch (error) {
      console.error('[RoomCache] Failed to load cache:', error);
      return null;
    }
  }

  getRoom(roomId: string): Room | null {
    try {
      const cached = localStorage.getItem(ROOM_CACHE_KEY);
      if (!cached) return null;

      const data: CachedRoomData = JSON.parse(cached);

      if (data.version !== CACHE_VERSION || data.storySeed !== this.storySeed) {
        return null;
      }

      const room = data.rooms[roomId];
      if (room) {
        console.log(`[RoomCache] Cache hit for ${roomId}`);
        return room;
      }

      return null;
    } catch (error) {
      console.error('[RoomCache] Failed to get room:', error);
      return null;
    }
  }

  saveRoom(room: Room): void {
    try {
      let data: CachedRoomData;
      const cached = localStorage.getItem(ROOM_CACHE_KEY);

      if (cached) {
        data = JSON.parse(cached);
        if (data.version !== CACHE_VERSION || data.storySeed !== this.storySeed) {
          data = {
            version: CACHE_VERSION,
            storySeed: this.storySeed,
            rooms: {},
            timestamp: Date.now(),
          };
        }
      } else {
        data = {
          version: CACHE_VERSION,
          storySeed: this.storySeed,
          rooms: {},
          timestamp: Date.now(),
        };
      }

      data.rooms[room.id] = room;
      data.timestamp = Date.now();

      localStorage.setItem(ROOM_CACHE_KEY, JSON.stringify(data));
      console.log(`[RoomCache] Saved ${room.id} to cache`);
    } catch (error) {
      console.error('[RoomCache] Failed to save room:', error);
    }
  }

  saveRooms(rooms: Map<string, Room>): void {
    try {
      const roomsObj: { [key: string]: Room } = {};
      rooms.forEach((room, id) => {
        roomsObj[id] = room;
      });

      const data: CachedRoomData = {
        version: CACHE_VERSION,
        storySeed: this.storySeed,
        rooms: roomsObj,
        timestamp: Date.now(),
      };

      localStorage.setItem(ROOM_CACHE_KEY, JSON.stringify(data));
      console.log(`[RoomCache] Saved ${rooms.size} rooms to cache`);
    } catch (error) {
      console.error('[RoomCache] Failed to save rooms:', error);
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(ROOM_CACHE_KEY);
      console.log('[RoomCache] Cache cleared');
    } catch (error) {
      console.error('[RoomCache] Failed to clear cache:', error);
    }
  }

  reset(): void {
    this.clear();
    this.storySeed = 0;
  }
}

export const roomCache = new RoomCache();
