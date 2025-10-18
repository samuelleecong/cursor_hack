/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {GoogleGenAI} from '@google/genai';
import {getSystemPrompt} from '../constants';
import {InteractionData} from '../types';
import {BiomeDefinition} from '../types/biomes';
import {eventLogger} from './eventLogger';

if (!process.env.API_KEY) {
  // This is a critical error. In a real app, you might throw or display a persistent error.
  // For this environment, logging to console is okay, but the app might not function.
  console.error(
    'API_KEY environment variable is not set. The application will not be able to connect to the Gemini API.',
  );
}

const ai = new GoogleGenAI({apiKey: process.env.API_KEY!}); // The "!" asserts API_KEY is non-null after the check.

export async function* streamAppContent(
  interactionHistory: InteractionData[],
  currentMaxHistoryLength: number, // Receive current max history length
  characterClass?: string,
  characterHP?: number,
  storySeed?: number,
  playerLevel?: number,
  consequences?: Array<{type: string; description: string}>,
  storyContext?: string | null,
  storyMode?: string,
): AsyncGenerator<string, void, void> {
  const model = 'gemini-2.5-flash-lite'; // Updated model

  if (!process.env.API_KEY) {
    yield `<div class="p-4 text-red-700 bg-red-100 rounded-lg">
      <p class="font-bold text-lg">Configuration Error</p>
      <p class="mt-2">The API_KEY is not configured. Please set the API_KEY environment variable.</p>
    </div>`;
    return;
  }

  if (interactionHistory.length === 0) {
    yield `<div class="p-4 text-orange-700 bg-orange-100 rounded-lg">
      <p class="font-bold text-lg">No interaction data provided.</p>
    </div>`;
    return;
  }

  const eventContext = eventLogger.getContextForAI();

  const systemPrompt = getSystemPrompt(
    currentMaxHistoryLength,
    characterClass,
    characterHP,
    storySeed,
    playerLevel,
    consequences,
    storyContext,
    storyMode,
    eventContext
  ); // Generate system prompt dynamically with game context

  const currentInteraction = interactionHistory[0];
  // pastInteractions already respects currentMaxHistoryLength due to slicing in App.tsx
  const pastInteractions = interactionHistory.slice(1);

  const currentElementName =
    currentInteraction.elementText ||
    currentInteraction.id ||
    'Unknown Element';
  let currentInteractionSummary = `Current Player Action: ${currentElementName} (Type: ${currentInteraction.type || 'N/A'}, ID: ${currentInteraction.id || 'N/A'}).`;
  if (currentInteraction.value) {
    currentInteractionSummary += ` Associated value: '${currentInteraction.value.substring(0, 100)}'.`;
  }

  let historyPromptSegment = '';
  if (pastInteractions.length > 0) {
    historyPromptSegment = `\n\nPrevious Player Actions (most recent first):`;

    // Iterate over the pastInteractions array
    pastInteractions.forEach((interaction, index) => {
      const pastElementName =
        interaction.elementText || interaction.id || 'Unknown Element';
      historyPromptSegment += `\n${index + 1}. ${pastElementName} (Type: ${interaction.type || 'N/A'}, ID: ${interaction.id || 'N/A'})`;
      if (interaction.value) {
        historyPromptSegment += ` with value '${interaction.value.substring(0, 50)}'`;
      }
      historyPromptSegment += '.';
    });
  }

  const fullPrompt = `${systemPrompt}

${currentInteractionSummary}
${historyPromptSegment}

Full Context for Current Interaction (for your reference):
${JSON.stringify(currentInteraction, null, 1)}

Generate the HTML content for the game story scene:`;

  try {
    const response = await ai.models.generateContentStream({
      model: model,
      contents: fullPrompt,
      // Removed thinkingConfig to use default (enabled thinking) for higher quality responses
      // as this is a general app, not a low-latency game AI.
      config: {},
    });

    for await (const chunk of response) {
      if (chunk.text) {
        // Ensure text property exists and is not empty
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error('Error streaming from Gemini:', error);
    let errorMessage = 'An error occurred while generating content.';
    // Check if error is an instance of Error and has a message property
    if (error instanceof Error && typeof error.message === 'string') {
      errorMessage += ` Details: ${error.message}`;
    } else if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as any).message === 'string'
    ) {
      // Handle cases where error might be an object with a message property (like the API error object)
      errorMessage += ` Details: ${(error as any).message}`;
    } else if (typeof error === 'string') {
      errorMessage += ` Details: ${error}`;
    }

    yield `<div class="p-4 text-red-700 bg-red-100 rounded-lg">
      <p class="font-bold text-lg">Error Generating Content</p>
      <p class="mt-2">${errorMessage}</p>
      <p class="mt-1">This may be due to an API key issue, network problem, or misconfiguration. Please check the developer console for more details.</p>
    </div>`;
  }
}

/**
 * Generate a single biome definition using AI
 */
export async function generateBiomeWithAI(
  biomeName: string,
  storyContext: string
): Promise<BiomeDefinition> {
  const model = 'gemini-2.5-flash-lite';

  if (!process.env.API_KEY) {
    throw new Error('API_KEY not configured');
  }

  const prompt = `Create a game biome definition for "${biomeName}" in this story context: "${storyContext}"

You must return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "name": "Display name for the biome",
  "baseTile": "ground tile type (single word, lowercase)",
  "pathTile": "walkable path tile type (single word, lowercase)",
  "obstacleTiles": ["obstacle1", "obstacle2", "obstacle3"],
  "colors": {
    "base": "#hexcolor for ground",
    "path": "#hexcolor for path",
    "obstacles": ["#hexcolor1", "#hexcolor2", "#hexcolor3"]
  },
  "atmosphere": "Brief atmospheric description (one sentence)"
}

Example for "swamp":
{
  "name": "Swamp",
  "baseTile": "murkyWater",
  "pathTile": "mud",
  "obstacleTiles": ["deadTree", "algae", "rock"],
  "colors": {
    "base": "#2d5a3d",
    "path": "#4a3f2e",
    "obstacles": ["#1a2f1a", "#3d5a3d", "#57534e"]
  },
  "atmosphere": "Murky waters and twisted dead trees create an eerie atmosphere"
}

Return ONLY the JSON object, nothing else.`;

  try {
    console.log(`[GeminiService] Generating biome: ${biomeName}`);

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {},
    });

    const text = response.text || '';

    // Try to extract JSON from response (in case AI wrapped it in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI response did not contain valid JSON');
    }

    const biomeData: BiomeDefinition = JSON.parse(jsonMatch[0]);

    console.log(`[GeminiService] Successfully generated biome: ${biomeName}`);
    return biomeData;
  } catch (error) {
    console.error('[GeminiService] Error generating biome:', error);

    // Fallback to a generic biome
    return {
      name: biomeName,
      baseTile: 'grass',
      pathTile: 'dirt',
      obstacleTiles: ['rock', 'tree', 'bush'],
      colors: {
        base: '#4ade80',
        path: '#92400e',
        obstacles: ['#a1a1aa', '#22c55e', '#16a34a'],
      },
      atmosphere: `A mysterious ${biomeName} area`,
    };
  }
}

/**
 * Generate a biome progression for the entire game based on story context
 */
export async function generateBiomeProgression(
  storyContext: string | null,
  storyMode: string,
  numRooms: number = 20
): Promise<string[]> {
  const model = 'gemini-2.5-flash-lite';

  if (!process.env.API_KEY) {
    // Fallback to default progression
    return Array(numRooms).fill('forest');
  }

  const availableBiomes = [
    'forest', 'swamp', 'desert', 'ice', 'cave', 'dungeon', 'plains',
    'castle', 'volcanic', 'beach', 'darkforest', 'crystalcave', 'ruins',
    'city', 'space'
  ];

  const contextDescription = storyContext
    ? `Story: "${storyContext.slice(0, 500)}..." (${storyMode} mode)`
    : 'Generic fantasy adventure';

  const prompt = `You are a game designer creating a ${numRooms}-room dungeon progression.

${contextDescription}

Available biomes: ${availableBiomes.join(', ')}

Create a logical progression of environments that:
1. Starts appropriate to the story setting
2. Gradually increases in difficulty/intensity
3. Makes narrative sense for this story
4. Ends with a climactic final area

You can suggest new biome names if needed (we'll generate them with AI if they don't exist).

Return ONLY a JSON array of exactly ${numRooms} biome names:
["biome1", "biome2", "biome3", ...]

Example for "Lord of the Rings":
["plains", "forest", "darkforest", "cave", "ruins", "dungeon", "volcanic"]`;

  try {
    console.log('[GeminiService] Generating biome progression...');

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {},
    });

    const text = response.text || '';

    // Extract JSON array
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      throw new Error('AI response did not contain valid JSON array');
    }

    const progression: string[] = JSON.parse(jsonMatch[0]);

    // Ensure we have exactly numRooms
    if (progression.length < numRooms) {
      // Pad with last biome
      while (progression.length < numRooms) {
        progression.push(progression[progression.length - 1]);
      }
    } else if (progression.length > numRooms) {
      // Trim to exact size
      progression.length = numRooms;
    }

    console.log(`[GeminiService] Generated progression: ${progression.slice(0, 5).join(', ')}...`);
    return progression;
  } catch (error) {
    console.error('[GeminiService] Error generating biome progression:', error);

    // Fallback to default progression
    return [
      'forest', 'forest', 'plains', 'plains', 'darkforest',
      'cave', 'cave', 'desert', 'desert', 'ruins',
      'dungeon', 'dungeon', 'dungeon', 'castle', 'castle',
      'volcanic', 'volcanic', 'volcanic', 'dungeon', 'dungeon'
    ];
  }
}
