/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import {GoogleGenAI} from '@google/genai';
import {CharacterClass} from '../characterClasses';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

const CLASS_GENERATION_PROMPT = (storyContext: string) => `
You are a game design AI. Based on the story context provided, generate 5 unique character classes that fit the setting and theme.

**STORY CONTEXT:**
${storyContext}

**YOUR TASK:**
Generate 5 character classes that are thematically appropriate for this story. Each class should be unique and fit the world/setting described.

**RESPONSE FORMAT: JSON ONLY**
Your entire response must be a single, valid JSON array. Do not use markdown. Do not add comments or explanations.

**JSON STRUCTURE:**
[
  {
    "id": "(string) lowercase_underscore_id",
    "name": "(string) Class name (e.g., 'Space Marine', 'Cyber Hacker', 'Wasteland Scavenger')",
    "icon": "(string) A single emoji that represents this class",
    "color": "(string) A hex color code like '#ffcdd2'",
    "description": "(string) A 1-2 sentence description of the class",
    "startingHP": (number) Starting health points (60-100, balanced across classes),
    "attackType": "(string) Type of attack (e.g., 'Energy Weapons', 'Hacking', 'Melee Combat')",
    "specialAbility": "(string) Name of a unique special ability for this class"
  }
]

**REQUIREMENTS:**
1. Generate EXACTLY 5 classes
2. Each class must have a unique playstyle and role
3. HP should be balanced: 60-100 range, with tankier classes having more HP
4. Attack types should vary and fit the setting (avoid generic fantasy terms unless it's a fantasy setting)
5. Special abilities should be creative and thematic
6. Icons should be relevant emojis (use sci-fi emojis for sci-fi, etc.)
7. Colors should be diverse hex codes

**EXAMPLES:**

For a sci-fi setting:
[
  {
    "id": "space_marine",
    "name": "Space Marine",
    "icon": "🚀",
    "color": "#1e88e5",
    "description": "A heavily armored soldier trained in zero-gravity combat. High durability and firepower.",
    "startingHP": 100,
    "attackType": "Plasma Rifle",
    "specialAbility": "Orbital Strike"
  },
  {
    "id": "cyber_hacker",
    "name": "Cyber Hacker",
    "icon": "💻",
    "color": "#00e676",
    "description": "A tech specialist who manipulates systems and machinery. Fragile but versatile.",
    "startingHP": 65,
    "attackType": "Digital Warfare",
    "specialAbility": "System Override"
  }
]

For a horror setting:
[
  {
    "id": "occult_investigator",
    "name": "Occult Investigator",
    "icon": "🔍",
    "color": "#8d6e63",
    "description": "A researcher of dark mysteries with knowledge of forbidden rituals.",
    "startingHP": 75,
    "attackType": "Arcane Research",
    "specialAbility": "Banishment Ritual"
  }
]

Now generate 5 classes for the provided story context. Output ONLY the JSON array, nothing else.
`;

export async function generateCharacterClasses(
  storyContext: string | null,
): Promise<CharacterClass[]> {
  // If no story context, return default classes
  if (!storyContext) {
    return getDefaultClasses();
  }

  if (!process.env.API_KEY) {
    console.error('API_KEY not configured, using default classes');
    return getDefaultClasses();
  }

  try {
    const model = 'gemini-2.5-flash-lite';
    const prompt = CLASS_GENERATION_PROMPT(storyContext);

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {},
    });

    let jsonText = response.text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```json?\s*/i, '').replace(/```\s*$/, '');
    }

    const generatedClasses: CharacterClass[] = JSON.parse(jsonText);

    // Validate the response
    if (!Array.isArray(generatedClasses) || generatedClasses.length !== 5) {
      console.error('Invalid class generation response, using defaults');
      return getDefaultClasses();
    }

    // Validate each class has required fields
    for (const cls of generatedClasses) {
      if (
        !cls.id ||
        !cls.name ||
        !cls.icon ||
        !cls.color ||
        !cls.description ||
        !cls.startingHP ||
        !cls.attackType ||
        !cls.specialAbility
      ) {
        console.error('Generated class missing required fields, using defaults');
        return getDefaultClasses();
      }
    }

    console.log('Successfully generated character classes:', generatedClasses);
    return generatedClasses;
  } catch (error) {
    console.error('Error generating character classes:', error);
    return getDefaultClasses();
  }
}

function getDefaultClasses(): CharacterClass[] {
  return [
    {
      id: 'warrior',
      name: 'Warrior',
      icon: '⚔️',
      color: '#ffcdd2',
      description:
        'A brave fighter skilled in melee combat. High strength and endurance.',
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
}
