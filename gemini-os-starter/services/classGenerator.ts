/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import {GoogleGenAI} from '@google/genai';
import {CharacterClass, CHARACTER_CLASSES} from '../characterClasses';
import {StoryMode} from '../types';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

const CHARACTER_EXTRACTION_PROMPT = (storyContext: string) => `
You are a game design AI. Based on the story provided, extract 5 main characters from the story that the player could play AS.

**STORY:**
${storyContext}

**YOUR TASK:**
Extract 5 actual characters from this story. These should be characters that appear in the story with defined roles and personalities.

**RESPONSE FORMAT: JSON ONLY**
Your entire response must be a single, valid JSON array. Do not use markdown. Do not add comments or explanations.

**JSON STRUCTURE:**
[
  {
    "id": "(string) lowercase_underscore_id based on character name",
    "name": "(string) The character's actual name from the story",
    "icon": "(string) A single emoji that represents this character",
    "color": "(string) A hex color code like '#ffcdd2'",
    "description": "(string) A 1-2 sentence description of who this character is in the story",
    "startingHP": (number) Starting health points (60-100, based on character archetype),
    "startingMana": (number) Starting mana points (50-100, based on character archetype),
    "attackType": "(string) What kind of combat/skills they use",
    "baseDamage": (number) Base damage per attack (15-30),
    "defense": (number) Defense rating (3-8),
    "critChance": (number) Critical hit chance (0.10-0.35),
    "specialAbility": {
      "name": "(string) Ability name",
      "description": "(string) What the ability does",
      "manaCost": (number) Mana cost (25-40),
      "baseDamage": (number, optional) Damage if it's a damage ability (30-50),
      "healing": (number, optional) Healing if it's a heal ability (30-50),
      "effects": (array of strings, optional) Special effects like ["stun", "burn", "guaranteed_crit", "heal"]
    }
  }
]

**REQUIREMENTS:**
1. Extract EXACTLY 5 characters from the story
2. Use their actual names and roles from the story
3. HP should be based on their archetype (warriors/strong = 90-100, mages/fragile = 60-70, balanced = 75-85)
4. Attack types and abilities should reflect what they actually do in the story
5. If there aren't 5 clear main characters, include important supporting characters

**EXAMPLE for Romeo & Juliet:**
[
  {
    "id": "romeo",
    "name": "Romeo Montague",
    "icon": "💘",
    "color": "#e91e63",
    "description": "The passionate young heir of House Montague, skilled in swordplay and driven by love.",
    "startingHP": 80,
    "startingMana": 60,
    "attackType": "Sword Fighting",
    "baseDamage": 22,
    "defense": 6,
    "critChance": 0.20,
    "specialAbility": {
      "name": "Passionate Strike",
      "description": "A powerful strike fueled by emotion",
      "manaCost": 30,
      "baseDamage": 40,
      "effects": ["guaranteed_crit"]
    }
  },
  {
    "id": "juliet",
    "name": "Juliet Capulet",
    "icon": "🌹",
    "color": "#f48fb1",
    "description": "The intelligent daughter of House Capulet, clever and resourceful.",
    "startingHP": 75,
    "startingMana": 80,
    "attackType": "Cunning & Deception",
    "baseDamage": 18,
    "defense": 5,
    "critChance": 0.25,
    "specialAbility": {
      "name": "Feigned Death",
      "description": "Appear to be defeated, then strike back with deadly precision",
      "manaCost": 35,
      "baseDamage": 45,
      "effects": ["deception"]
    }
  }
]

Now extract 5 characters from the provided story. Output ONLY the JSON array, nothing else.
`;

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
    "startingMana": (number) Starting mana points (50-100, balanced across classes),
    "attackType": "(string) Type of attack (e.g., 'Energy Weapons', 'Hacking', 'Melee Combat')",
    "baseDamage": (number) Base damage per attack (15-30),
    "defense": (number) Defense rating (3-8),
    "critChance": (number) Critical hit chance (0.10-0.35),
    "specialAbility": {
      "name": "(string) Ability name",
      "description": "(string) What the ability does",
      "manaCost": (number) Mana cost (25-40),
      "baseDamage": (number, optional) Damage if it's a damage ability (30-50),
      "healing": (number, optional) Healing if it's a heal ability (30-50),
      "effects": (array of strings, optional) Special effects like ["stun", "burn", "guaranteed_crit", "heal", "multi_hit"]
    }
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
    "startingMana": 50,
    "attackType": "Plasma Rifle",
    "baseDamage": 20,
    "defense": 8,
    "critChance": 0.15,
    "specialAbility": {
      "name": "Orbital Strike",
      "description": "Call down devastating fire from orbit",
      "manaCost": 30,
      "baseDamage": 45,
      "effects": ["area_damage"]
    }
  },
  {
    "id": "cyber_hacker",
    "name": "Cyber Hacker",
    "icon": "💻",
    "color": "#00e676",
    "description": "A tech specialist who manipulates systems and machinery. Fragile but versatile.",
    "startingHP": 65,
    "startingMana": 100,
    "attackType": "Digital Warfare",
    "baseDamage": 28,
    "defense": 3,
    "critChance": 0.25,
    "specialAbility": {
      "name": "System Override",
      "description": "Hack enemy systems to disable defenses",
      "manaCost": 40,
      "baseDamage": 50,
      "effects": ["disable"]
    }
  }
]

Now generate 5 classes for the provided story context. Output ONLY the JSON array, nothing else.
`;

export async function generateCharacterClasses(
  storyContext: string | null,
  mode: StoryMode = 'inspiration',
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

    // Use different prompts based on mode
    let prompt: string;
    if (mode === 'recreation') {
      prompt = CHARACTER_EXTRACTION_PROMPT(storyContext);
    } else {
      // For 'inspiration' and 'continuation', generate new classes
      prompt = CLASS_GENERATION_PROMPT(storyContext);
    }

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
        !cls.startingMana ||
        !cls.attackType ||
        !cls.baseDamage ||
        cls.defense === undefined ||
        cls.critChance === undefined ||
        !cls.specialAbility ||
        typeof cls.specialAbility !== 'object' ||
        !cls.specialAbility.name ||
        !cls.specialAbility.description ||
        !cls.specialAbility.manaCost
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
  // Return the properly defined character classes from characterClasses.ts
  return CHARACTER_CLASSES;
}
