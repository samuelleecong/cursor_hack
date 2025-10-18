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

export interface Item {
  id: string;
  name: string;
  type: 'consumable' | 'equipment' | 'key_item';
  sprite: string;
  description: string;
  effect?: {
    type: 'heal' | 'mana' | 'damage_boost' | 'defense_boost';
    value: number;
  };
}

export interface GameObject {
  id: string;
  position: Position;
  type: 'npc' | 'enemy' | 'item' | 'exit' | 'entrance';
  sprite: string; // emoji or character
  interactionText: string;
  hasInteracted?: boolean;
  itemDrop?: Item; // Optional item dropped when defeated/collected
  enemyLevel?: number; // For scaling enemy difficulty
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
  type: 'damage' | 'heal' | 'combat' | 'loot' | 'dialogue' | 'levelup' | 'item_acquired' | null;
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

export interface StoryConsequence {
  id: string;
  description: string;
  type: 'merciful' | 'violent' | 'clever' | 'diplomatic' | 'greedy';
  timestamp: number;
}

export interface GameState {
  selectedCharacter: CharacterClass | null;
  currentHP: number;
  maxHP: number;
  currentMana: number;
  maxMana: number;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  isAlive: boolean;
  storySeed: number;
  isInGame: boolean;
  playerPosition: Position;
  currentRoomId: string;
  rooms: Map<string, Room>;
  roomCounter: number;
  currentAnimation: GameAnimation | null;
  battleState: BattleState | null;
  inventory: Item[];
  storyConsequences: StoryConsequence[];
}
