/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {CharacterClass} from './characterClasses';
import {TileMap} from './services/mapGenerator';

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
  tileMap?: TileMap; // Tile-based map for this room
}

export interface GameAnimation {
  type: 'damage' | 'heal' | 'combat' | 'loot' | 'dialogue' | null;
  value?: number;
  text?: string;
  timestamp: number;
}

export interface BattleAction {
  actor: 'player' | 'enemy';
  type: 'attack' | 'spell' | 'item';
  damage?: number;
  text: string;
}

export type AnimationType = 'slash' | 'damageNumber';

export interface BattleAnimation {
  type: AnimationType;
  target: 'player' | 'enemy';
  value?: number | string;
  timestamp: number;
}

export interface BattleState {
  enemy: GameObject;
  enemyHP: number;
  maxEnemyHP: number;
  status: 'ongoing' | 'player_won' | 'player_lost';
  turn: 'player' | 'enemy';
  history: BattleAction[];
  animationQueue: BattleAnimation[];
}

export interface GameState {
  selectedCharacter: CharacterClass | null;
  currentHP: number;
  isAlive: boolean;
  storySeed: number;
  storyContext: string | null; // User-provided story for narrative generation
  isInGame: boolean;
  playerPosition: Position;
  currentRoomId: string;
  rooms: Map<string, Room>;
  roomCounter: number;
  currentAnimation: GameAnimation | null;
  battleState: BattleState | null;
}
