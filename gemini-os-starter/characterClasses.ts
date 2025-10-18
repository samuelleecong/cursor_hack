/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

export interface SpecialAbility {
  name: string;
  description: string;
  manaCost: number;
  baseDamage?: number;
  healing?: number;
  effects?: string[];
}

export interface CharacterClass {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  startingHP: number;
  startingMana: number;
  attackType: string;
  baseDamage: number;
  defense: number;
  critChance: number;
  specialAbility: SpecialAbility;
}

export const CHARACTER_CLASSES: CharacterClass[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    icon: '⚔️',
    color: '#ffcdd2',
    description: 'A brave fighter skilled in melee combat. High strength and endurance.',
    startingHP: 100,
    startingMana: 50,
    attackType: 'Melee',
    baseDamage: 20,
    defense: 8,
    critChance: 0.15,
    specialAbility: {
      name: 'Shield Bash',
      description: 'A powerful bash that deals heavy damage and stuns the enemy',
      manaCost: 25,
      baseDamage: 35,
      effects: ['stun'],
    },
  },
  {
    id: 'mage',
    name: 'Mage',
    icon: '🔮',
    color: '#e1bee7',
    description: 'A master of arcane arts. Powerful spells but fragile.',
    startingHP: 60,
    startingMana: 100,
    attackType: 'Magic',
    baseDamage: 30,
    defense: 3,
    critChance: 0.25,
    specialAbility: {
      name: 'Fireball',
      description: 'A devastating ball of fire that burns enemies',
      manaCost: 40,
      baseDamage: 50,
      effects: ['burn'],
    },
  },
  {
    id: 'thief',
    name: 'Thief',
    icon: '🗡️',
    color: '#c5e1a5',
    description: 'A nimble rogue skilled in stealth and quick strikes.',
    startingHP: 75,
    startingMana: 60,
    attackType: 'Ranged',
    baseDamage: 18,
    defense: 5,
    critChance: 0.35,
    specialAbility: {
      name: 'Shadow Strike',
      description: 'Strike from the shadows with guaranteed critical hit',
      manaCost: 30,
      baseDamage: 40,
      effects: ['guaranteed_crit'],
    },
  },
  {
    id: 'cleric',
    name: 'Cleric',
    icon: '✨',
    color: '#fff9c4',
    description: 'A holy warrior who can heal and protect allies.',
    startingHP: 85,
    startingMana: 80,
    attackType: 'Divine',
    baseDamage: 15,
    defense: 6,
    critChance: 0.10,
    specialAbility: {
      name: 'Healing Light',
      description: 'Channel divine energy to restore health',
      manaCost: 35,
      healing: 40,
      effects: ['heal'],
    },
  },
  {
    id: 'ranger',
    name: 'Ranger',
    icon: '🏹',
    color: '#b2dfdb',
    description: 'A skilled hunter who excels at ranged combat and tracking.',
    startingHP: 80,
    startingMana: 70,
    attackType: 'Ranged',
    baseDamage: 22,
    defense: 5,
    critChance: 0.20,
    specialAbility: {
      name: 'Arrow Volley',
      description: 'Fire multiple arrows at once for devastating damage',
      manaCost: 35,
      baseDamage: 45,
      effects: ['multi_hit'],
    },
  },
];
