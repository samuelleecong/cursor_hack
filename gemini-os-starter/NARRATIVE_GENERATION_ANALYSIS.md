# Narrative Generation and Recreation Content Issue Analysis

## Executive Summary

This is a story-based RPG game engine that uses Google Gemini AI to generate game content and narratives. When users recreate stories like "The Social Network" (a modern tech drama), the system is generating inappropriate fantasy elements (mages, dark figures) instead of content matching the story's realistic, corporate setting. This is a **prompt design and content filtering issue** where the AI system prompts lack sufficient guardrails to prevent genre drift.

---

## Application Architecture Overview

### What This Application Does

1. **Story-Driven RPG Generator**: Converts any story/narrative into a playable roguelike RPG adventure
2. **Three Story Modes**:
   - **Recreation Mode**: Play through the actual story's plot with real characters
   - **Continuation Mode**: Play adventures that take place after the story ends
   - **Inspiration Mode**: Original adventures inspired by the story's themes

3. **AI-Generated Content**:
   - Character classes based on story context
   - Room/location progression 
   - NPC interactions and dialogue
   - Enemy encounters
   - Visual generation (pixel art sprites and backgrounds)
   - 16-bit RPG pixel art scene generation

### Key Technologies

- **Frontend**: React + TypeScript with Vite
- **AI Services**: 
  - Google Gemini 2.5 Flash Lite (text generation)
  - FAL.ai (image generation - Flux Schnell)
  - ElevenLabs (voice generation)
- **Game Engine**: Custom tile-based room system with battle mechanics

---

## The Problem: Narrative Content Drift

### Reported Issue

When a user inputs: **"The Social Network - a story about Mark Zuckerberg creating Facebook"**

**With Mode**: Recreation Mode

**Expected**: Game encounters depicting realistic corporate drama - startup scenes, business meetings, rival companies, etc.

**Actual**: System generates inappropriate fantasy elements:
- "mages and dark figures"
- Fantasy RPG elements
- Medieval/dungeon aesthetics
- Magic system encounters

### Root Causes Identified

---

## 1. Insufficient Genre Enforcement in System Prompts

### Location: `/constants.ts` - `getSystemPrompt()` function (Lines 26-167)

**Current Problem**: The main system prompt lacks explicit negative constraints for non-fantasy stories.

```typescript
// CURRENT (INSUFFICIENT):
if (storyMode === 'recreation') {
  storyInstructions = `
**STORY RECREATION MODE**
You are recreating the actual story:
${storyContext}

**IMPORTANT INSTRUCTIONS:**
- Follow the plot and events from the original story
- Include actual characters from the story in encounters
...`;
}
```

**Issues**:
1. No explicit "DO NOT" statements preventing fantasy elements in non-fantasy stories
2. The system prompt relies on Gemini to infer the story genre
3. No enforcement that visual/textual output must match the source material's tone
4. The image prompt guidelines say "16-bit pixel art, top-down RPG style" which defaults to fantasy

### Missing Guardrails

The prompt should include:

```typescript
// WHAT'S MISSING:
**CRITICAL: STORY AUTHENTICITY GUARDRAILS**
${isNonFantasyStory ? `
- DO NOT include magic, spells, wizards, or magical creatures
- DO NOT use medieval/dungeon/fantasy aesthetics
- DO NOT include swords, shields, or fantasy weapons
- Encounters must be realistic to: ${storyContext.substring(0, 100)}
- If this is a modern/sports/sci-fi story, use only modern elements
- NO FANTASY ELEMENTS WHATSOEVER
` : ''}
```

---

## 2. Scene Image Generation Has No Story Enforcement

### Location: `/services/sceneImageGenerator.ts` (Lines 37-140)

**Current Problem**: The Gemini prompt that generates image descriptions lacks story-specific constraints.

```typescript
// CURRENT (Lines 98-105):
storySection = `
**CRITICAL STORY CONTEXT (${storyMode || 'inspiration'} mode):**
"${storyContext.substring(0, 400)}..."

MANDATORY REQUIREMENT: The visual style MUST reflect this specific story setting, NOT generic fantasy.
${modeInstructions[storyMode || 'inspiration']}
If this is a modern, sports, sci-fi, or non-fantasy setting, DO NOT use medieval/fantasy visuals.
`;
```

**Issues**:
1. Uses "DO NOT use medieval/fantasy visuals" but doesn't prevent fantasy **elements** (mages, dark figures)
2. Biome descriptions default to fantasy: "ancient trees", "crystals", "dungeons"
3. The fallback biome descriptions (Lines 50-56) are all fantasy-themed

```typescript
// PROBLEMATIC DEFAULTS (Lines 50-56):
const biomeDescriptions: Record<BiomeType, string> = {
  forest: 'lush forest with ancient trees, moss-covered stones, dappled sunlight',
  plains: 'open grasslands with rolling hills, wildflowers, and distant mountains',
  desert: 'sandy terrain with scattered cacti, rocky outcrops, and shimmering heat haze',
  cave: 'dark cavern with stalactites, underground pools, and glowing crystals', // <- FANTASY
  dungeon: 'ancient stone corridors with flickering torches, crumbling walls', // <- FANTASY
};
```

---

## 3. NPC/Enemy Description Generation Lacks Story-Specific Constraints

### Location: `/services/npcGenerator.ts` (Lines 13-128)

**Current Problem**: The prompts for generating NPCs and enemies don't enforce story-appropriate types.

```typescript
// CURRENT NPC GENERATION (Lines 26-46):
const prompt = `You are helping create NPCs for a procedurally generated story-based game.

Story Context: ${storyContext}
Story Mode: ${storyMode}
Current Location: Room ${roomNumber} in a ${biome} environment
...
IMPORTANT RULES:
- For Recreation mode: Use actual characters from the story (e.g., for Messi story: coach, teammate, sports journalist, rival player, fan)
...`;
```

**Issues**:
1. While the prompt TRIES to be story-aware, it's a weak suggestion
2. No negative examples: "DO NOT create wizards, mages, dark figures, or fantasy creatures"
3. No validation that the returned description matches the story genre
4. The NPC fallback is just `'traveler, wanderer'` (generic fantasy)

### Example of What Should Happen

**For "The Social Network" in Recreation Mode**:

```
// CURRENT (can produce wrong results):
NPC Description: "wise mentor" 
-> Could generate: Fantasy wizard or tech entrepreneur (ambiguous)

// NEEDED:
- "venture capitalist investor"
- "startup engineer" 
- "Facebook competitor CEO"
- "tech journalist"
- NO FANTASY CHARACTERS
```

---

## 4. Character Class Generation Defaults to Fantasy

### Location: `/services/classGenerator.ts` (Lines 12-196)

**Problem**: The prompts generate character classes thematically but with weak story enforcement.

```typescript
// CHARACTER EXTRACTION PROMPT (Lines 12-101):
const CHARACTER_EXTRACTION_PROMPT = (storyContext: string) => `
You are a game design AI. Based on the story provided, extract 5 main characters...
`;

// CLASS GENERATION PROMPT (Lines 103-196):
const CLASS_GENERATION_PROMPT = (storyContext: string) => `
You are a game design AI. Based on the story context provided, generate 5 unique character classes...
`;
```

**Issues**:
1. The prompts DO include story context awareness (lines 149-157)
2. But the fallback examples are fantasy-heavy:

```typescript
// EXAMPLES PROVIDED TO AI (Lines 152-193):
For a sci-fi setting: "Space Marine", "Cyber Hacker"
// These are good - story-appropriate

// BUT when it fails, defaults to:
return CHARACTER_CLASSES; // <- Defaults to hardcoded generic fantasy classes
```

3. No explicit "DO NOT" constraints about genre compliance
4. No validation that generated classes match story tone

---

## 5. Biome Progression Defaults to Fantasy

### Location: `/services/geminiService.ts` - `generateBiomeProgression()` (Lines 237-332)

**Current Logic**:

```typescript
const isFantasyStory = !storyContext ||
  /fantasy|magic|dragon|dungeon|medieval|sword|wizard|elf|dwarf/i.test(storyContext);

if (isFantasyStory) {
  // Use pre-made fantasy biomes
} else {
  // For NON-FANTASY stories, CREATE CUSTOM LOCATION NAMES
}
```

**Problem**: The regex check is too simplistic.
- "The Social Network" doesn't contain fantasy keywords
- So it SHOULD generate modern locations
- But then the system still uses fantasy biome definitions

**The Disconnect**:
1. `generateBiomeProgression()` says "create custom location names" for non-fantasy
2. But it generates names like: "training_ground", "world_cup_final" (good!)
3. Then `roomGenerator.ts` calls `getOrGenerateBiome()` 
4. Which calls `generateBiomeWithAI()` 
5. Which uses a prompt that doesn't know the story context well enough

### Location: `/services/geminiService.ts` - `generateBiomeWithAI()` (Lines 152-232)

```typescript
// LINE 162:
const prompt = `Create a game biome definition for "${biomeName}" in this story context: "${storyContext}"`;

// EXAMPLE (Lines 178-190):
const exampleBiome = {
  "name": "Swamp",
  "baseTile": "murkyWater",
  "pathTile": "mud",
  "atmosphere": "Murky waters and twisted dead trees create an eerie atmosphere"
};
```

**Issue**: The prompt uses a generic biome example (swamp = fantasy). For "The Social Network" and location "office_building", it might generate fantasy atmosphere like "eerie", "mysterious" instead of "modern", "corporate".

---

## 6. Story-Aware Content Filtering is Missing

### No Content Filtering Layer

The system lacks any post-generation validation:

```typescript
// NO CURRENT VALIDATION:
// After Gemini generates NPC/enemy descriptions, there's no check like:
if (generatedContent.includes('mage', 'wizard', 'dark figure', 'spell')) {
  if (!storyContext.toLowerCase().includes('fantasy')) {
    // REJECT and regenerate
  }
}
```

---

## 7. Biome Library Has Fantasy Bias

### Location: `/public/biomes.json` (referenced in `biomeService.ts`)

The default biome library includes:
- `forest`, `plains`, `desert` (neutral)
- `cave`, `dungeon`, `volcanic` (fantasy-leaning)
- `castle`, `darkforest`, `crystalcave`, `ruins` (VERY fantasy)

These bias the system toward fantasy even when user provides non-fantasy story.

---

## Data Flow: Where the Problem Occurs

### "The Social Network" + Recreation Mode

```
1. User Input: "The Social Network - story about Facebook"
   ↓
2. StoryInput Component: Captures story + mode = 'recreation'
   ↓
3. Biome Generation:
   storyContext → geminiService.generateBiomeProgression()
   ✓ Correctly identifies as non-fantasy
   ✓ Returns: ["office_building", "tech_hub", "startup_garage", ...]
   ↓
4. Room Generation (roomGenerator.ts):
   biomeKey = "office_building"
   → biomeService.getOrGenerateBiome("office_building", storyContext)
   → generateBiomeWithAI() is called (biome doesn't exist)
   ⚠️ WEAK PROMPT HERE - may generate fantasy "atmosphere"
   ↓
5. Scene Image Generation (sceneImageGenerator.ts):
   Has story context but uses weak constraints
   → Image prompt might include "ancient", "mysterious", "eerie"
   ↓
6. NPC/Enemy Generation (npcGenerator.ts):
   generateNPCDescription() is called with weak constraints
   ⚠️ NO "DO NOT fantasy" enforcement
   → Could return: "dark figure", "mysterious mage"
   ↓
7. Sprite Generation (spriteGenerator.ts):
   Takes NPC description → image generation prompt
   "dark figure, mage" → pixel art generation
   ✗ GENERATES FANTASY SPRITE
   ↓
8. Result: User sees "mages and dark figures" in The Social Network game
```

---

## Recommendations for Fix

### Priority 1: Add Explicit Negative Constraints

**File**: `constants.ts` - Add genre validation:

```typescript
const isFantasyStory = /fantasy|magic|dragon|dungeon|medieval|sword|wizard|elf|dwarf|spell|enchant|potion|curse/i.test(storyContext || '');

// Add to system prompt:
${!isFantasyStory ? `
**CRITICAL - NON-FANTASY STORY CONSTRAINT**
This is NOT a fantasy story. NEVER include:
- Wizards, mages, sorcerers
- Magic, spells, enchantments
- Dragons, demons, supernatural creatures
- Medieval/dungeon aesthetics
- Dark figures, evil spirits
- Fantasy weapons (swords, shields, bows)

${storyContext.substring(0, 200)}

ONLY create encounters/descriptions appropriate to this genre.
` : ''}
```

### Priority 2: Validate Generated Content

**Create**: `services/contentValidator.ts`

```typescript
export function validateStoryRelevance(
  generatedText: string,
  storyContext: string | null,
  storyMode: StoryMode
): boolean {
  if (!storyContext) return true; // Allow anything for no-story mode
  
  const isFantasy = /fantasy|magic|dragon/i.test(storyContext);
  const hasFantasyElements = /mage|wizard|spell|enchant|curse|demon|dark figure/i.test(generatedText);
  
  if (!isFantasy && hasFantasyElements) {
    console.warn('[ContentValidator] Non-fantasy story has fantasy elements:', generatedText);
    return false;
  }
  
  return true;
}
```

### Priority 3: Strengthen Biome Generation

**File**: `services/geminiService.ts` - `generateBiomeWithAI()`

```typescript
const contextHint = storyContext 
  ? `This location fits the story: "${storyContext.substring(0, 100)}..."`
  : '';

const prompt = `Create a game biome definition for "${biomeName}" 
in this story context: "${storyContext}"

${!isFantasy ? `
IMPORTANT: This is a ${storyContext} story.
Create a REALISTIC location matching the story genre.
NO fantasy elements, NO magic, NO medieval aesthetics.
` : ''}

...`;
```

### Priority 4: Strengthen NPC Generation

**File**: `services/npcGenerator.ts`:

```typescript
const nonFantasyConstraint = !storyContext || !/fantasy|magic|dragon/i.test(storyContext)
  ? `
CRITICAL: This story is NOT fantasy.
DO NOT create:
- Wizards, mages, sorcerers
- Supernatural creatures
- Fantasy NPCs

Instead create realistic characters like:
- Business people
- Technical experts
- Athletes
- Journalists
- Colleagues
` : '';

const prompt = `...${nonFantasyConstraint}...`;
```

### Priority 5: Add Genre Detection

**Create**: `services/genreDetector.ts`

```typescript
export function detectGenre(storyContext: string | null): 'fantasy' | 'modern' | 'sports' | 'scifi' | 'historical' | 'unknown' {
  if (!storyContext) return 'unknown';
  
  const lower = storyContext.toLowerCase();
  
  if (/fantasy|magic|dragon|wizard|dungeon/i.test(lower)) return 'fantasy';
  if (/sport|football|soccer|basketball|olympics/i.test(lower)) return 'sports';
  if (/space|alien|spacecraft|robot|cyber/i.test(lower)) return 'scifi';
  if (/king|queen|emperor|medieval|knight|castle/i.test(lower)) return 'historical';
  
  // Default to modern for unclassified contemporary stories
  if (/startup|company|office|tech|social|network|modern/i.test(lower)) return 'modern';
  
  return 'unknown';
}

export function getGenreConstraints(genre: string): string {
  const constraints: Record<string, string> = {
    fantasy: `This is fantasy. You can use: magic, wizards, dragons, medieval settings, enchantments.`,
    modern: `This is a MODERN story. You CANNOT use: wizards, magic, fantasy creatures, medieval settings.`,
    sports: `This is sports. Use: athletes, coaches, stadiums, training facilities, competitions.`,
    scifi: `This is sci-fi. Use: spaceships, technology, aliens, robots, futuristic settings.`,
    historical: `This is historical. Match the time period and avoid modern elements.`,
  };
  
  return constraints[genre] || `Follow the story context strictly.`;
}
```

---

## Testing Checklist

### Test Case 1: The Social Network + Recreation Mode

- Input: "The Social Network - Mark Zuckerberg creating Facebook in 2004"
- Expected: 
  - Character classes: Software Engineer, Venture Capitalist, Competitor CEO
  - Biome progression: startup_garage, office_building, conference_room, etc.
  - NPCs: "venture investor", "rival programmer", "college friend"
  - Enemies: "aggressive rival company", "patent attorney challenge"
  - NO "mages", "dark figures", "spells"

### Test Case 2: Fantasy Story (Control)

- Input: "A hero's journey through enchanted lands..."
- Expected:
  - Fantasy elements ARE allowed
  - Wizards, dragons, etc. appear

### Test Case 3: Sports Story

- Input: "Lionel Messi's journey to winning World Cup"
- Expected:
  - Character classes: Striker, Midfielder, Coach, Sports Analyst
  - Biome progression: training_ground, local_stadium, world_cup_final
  - NPCs: "rival striker", "supportive coach", "sports journalist"
  - NO fantasy elements

---

## Summary

The application is a well-architected story-based RPG generator, but **lacks explicit genre enforcement** in its AI prompts. When generating content for non-fantasy stories, the system:

1. ✓ Correctly identifies the genre
2. ✓ Generates appropriate location names
3. ✗ BUT fails to enforce genre constraints in downstream systems
4. ✗ Missing validation layer to catch fantasy elements in non-fantasy stories
5. ✗ System prompts use weak suggestions instead of hard constraints

The fix requires adding explicit "DO NOT" clauses to system prompts, implementing a genre-aware validation system, and strengthening the story context enforcement across all content generation pipelines.

