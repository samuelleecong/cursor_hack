/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

export interface CharacterClass {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  startingHP: number;
  attackType: string;
  specialAbility: string;
}

export const CHARACTER_CLASSES: CharacterClass[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    icon: '⚔️',
    color: '#ffcdd2',
    description: 'A brave fighter skilled in melee combat. High strength and endurance.',
    startingHP: 100,
    attackType: 'Melee',
    specialAbility: 'Shield Bash',
  },
  {
    id: 'mage',
    name: 'Mage',
    icon: '🔮',
    color: '#e1bee7',
    description: 'A master of arcane arts. Powerful spells but fragile.',
    startingHP: 60,
    attackType: 'Magic',
    specialAbility: 'Fireball',
  },
  {
    id: 'thief',
    name: 'Thief',
    icon: '🗡️',
    color: '#c5e1a5',
    description: 'A nimble rogue skilled in stealth and quick strikes.',
    startingHP: 75,
    attackType: 'Ranged',
    specialAbility: 'Shadow Strike',
  },
  {
    id: 'cleric',
    name: 'Cleric',
    icon: '✨',
    color: '#fff9c4',
    description: 'A holy warrior who can heal and protect allies.',
    startingHP: 85,
    attackType: 'Divine',
    specialAbility: 'Healing Light',
  },
  {
    id: 'ranger',
    name: 'Ranger',
    icon: '🏹',
    color: '#b2dfdb',
    description: 'A skilled hunter who excels at ranged combat and tracking.',
    startingHP: 80,
    attackType: 'Ranged',
    specialAbility: 'Arrow Volley',
  },
];
