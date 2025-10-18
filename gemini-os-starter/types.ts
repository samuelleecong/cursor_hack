/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {CharacterClass} from './characterClasses';

export interface AppDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface InteractionData {
  id: string;
  type: string;
  value?: string;
  elementType: string;
  elementText: string;
  appContext: string | null;
}

export interface Position {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  position: Position;
  type: 'npc' | 'enemy' | 'item' | 'exit' | 'entrance';
  sprite: string; // emoji or character
  interactionText: string;
  hasInteracted?: boolean;
}

export interface Room {
  id: string;
  description: string;
  objects: GameObject[];
  visited: boolean;
  exitDirection: 'right' | 'left' | 'up' | 'down' | null;
}

export interface GameAnimation {
  type: 'damage' | 'heal' | 'combat' | 'loot' | 'dialogue' | null;
  value?: number;
  text?: string;
  timestamp: number;
}

export interface GameState {
  selectedCharacter: CharacterClass | null;
  currentHP: number;
  isAlive: boolean;
  storySeed: number;
  isInGame: boolean;
  playerPosition: Position;
  currentRoomId: string;
  rooms: Map<string, Room>;
  roomCounter: number;
  currentAnimation: GameAnimation | null;
}
