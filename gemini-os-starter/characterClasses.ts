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
  spriteUrl?: string;
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
    id: 'protagonist',
    name: 'Protagonist',
    icon: '⭐',
    color: '#ffcdd2',
    description: 'The main character. Balanced attributes suitable for any story.',
    startingHP: 100,
    startingMana: 50,
    attackType: 'Balanced',
    baseDamage: 20,
    defense: 8,
    critChance: 0.15,
    specialAbility: {
      name: 'Determination',
      description: 'A powerful strike fueled by willpower that deals heavy damage',
      manaCost: 25,
      baseDamage: 35,
      effects: ['stun'],
    },
  },
  {
    id: 'challenger',
    name: 'Challenger',
    icon: '💪',
    color: '#e1bee7',
    description: 'A competitive rival. High offense but fragile defense.',
    startingHP: 60,
    startingMana: 100,
    attackType: 'Aggressive',
    baseDamage: 30,
    defense: 3,
    critChance: 0.25,
    specialAbility: {
      name: 'Power Move',
      description: 'An overwhelming attack that devastates opponents',
      manaCost: 40,
      baseDamage: 50,
      effects: ['burn'],
    },
  },
  {
    id: 'wildcard',
    name: 'Wild Card',
    icon: '🎲',
    color: '#c5e1a5',
    description: 'An unpredictable character. High risk, high reward gameplay.',
    startingHP: 75,
    startingMana: 60,
    attackType: 'Unpredictable',
    baseDamage: 18,
    defense: 5,
    critChance: 0.35,
    specialAbility: {
      name: 'Risky Gambit',
      description: 'A high-stakes move with guaranteed critical impact',
      manaCost: 30,
      baseDamage: 40,
      effects: ['guaranteed_crit'],
    },
  },
  {
    id: 'ally',
    name: 'Ally',
    icon: '🤝',
    color: '#fff9c4',
    description: 'A supportive character who can heal and protect.',
    startingHP: 85,
    startingMana: 80,
    attackType: 'Support',
    baseDamage: 15,
    defense: 6,
    critChance: 0.10,
    specialAbility: {
      name: 'Recovery',
      description: 'Restore health and vitality',
      manaCost: 35,
      healing: 40,
      effects: ['heal'],
    },
  },
  {
    id: 'strategist',
    name: 'Strategist',
    icon: '🎯',
    color: '#b2dfdb',
    description: 'A tactical thinker who excels at precision and planning.',
    startingHP: 80,
    startingMana: 70,
    attackType: 'Tactical',
    baseDamage: 22,
    defense: 5,
    critChance: 0.20,
    specialAbility: {
      name: 'Calculated Strike',
      description: 'Execute multiple precise attacks for maximum efficiency',
      manaCost: 35,
      baseDamage: 45,
      effects: ['multi_hit'],
    },
  },
];
