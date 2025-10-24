# AI-Powered 2D Roguelike Game Engine - Architecture

> A hybrid 2D roguelike RPG combining traditional game mechanics with dynamic AI storytelling
> Built for the Cursor Singapore Hackathon (24 hours) | Inspired by Hades

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Core Game Systems](#core-game-systems)
5. [AI Integration Layer](#ai-integration-layer)
6. [Data Flow & State Management](#data-flow--state-management)
7. [Services Architecture](#services-architecture)
8. [Component Hierarchy](#component-hierarchy)
9. [Performance Optimizations](#performance-optimizations)
10. [Development & Deployment](#development--deployment)

---

## Project Overview

### Vision
An AI-powered roguelike that dynamically generates narratives, environments, and visual assets in real-time based on user-provided story context, creating unique gameplay experiences for each session.

### Core Features
- **3 Story Modes**: Inspiration, Recreation, and Continuation
- **Dynamic World Generation**: AI-generated biomes, rooms, NPCs, and enemies
- **Procedural Asset Generation**: Real-time sprite and scene generation using fal.ai
- **Adaptive Storytelling**: Context-aware narrative that responds to player choices
- **Voice Narration**: Text-to-speech integration with character-specific voices
- **Visual Consistency System**: Maintains character appearances across encounters

### Technical Highlights
- **Real-time Generation**: Room pair pre-generation system
- **Caching Layer**: Multi-level caching for sprites, rooms, and audio
- **Parallel Processing**: Concurrent API calls for optimal performance
- **Event-Driven Narrative**: Player action tracking influences story progression

---

## Technology Stack

### Frontend Framework
- **React 19.1.0** - UI rendering with latest features
- **TypeScript 5.8.2** - Type-safe development
- **Tailwind CSS 4.1** - Utility-first styling
- **Vite 6.2.0** - Build tool and dev server

### AI/ML Services
- **Google Gemini AI** (@google/genai 1.5.1)
  - Model: `gemini-2.0-flash-lite` (fast narrative generation)
  - Context-aware story generation
  - Dynamic NPC dialogue
  - Biome progression planning

- **fal.ai** (@fal-ai/client 1.7.0)
  - **Image Generation**: FLUX-schnell model (16-bit pixel art)
  - **Text-to-Speech**: Voice synthesis with emotion support
  - **Background Music**: Ambient audio generation

### Development Tools
- **pnpm 10.13.1** - Fast package manager
- **dotenv** - Environment configuration
- **Node.js** - Runtime environment

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         React App                           │
│                        (App.tsx)                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Story     │  │  Character   │  │   Game Canvas   │  │
│  │   Input     │→ │  Selection   │→ │   (Gameplay)    │  │
│  └─────────────┘  └──────────────┘  └─────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                      State Management                       │
│                                                             │
│  • GameState (Map<roomId, Room>)                          │
│  • Player Stats (HP, Mana, XP, Level)                     │
│  • Story Recreation State (beat tracking, alignment)      │
│  • Interaction History (AI context)                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                      Services Layer                         │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐│
│  │  Generation     │  │    Caching      │  │   Audio    ││
│  ├─────────────────┤  ├─────────────────┤  ├────────────┤│
│  │ • roomGenerator │  │ • roomCache     │  │ • speech   ││
│  │ • spriteGen     │  │ • spriteCache   │  │ • music    ││
│  │ • sceneGen      │  │ • imageCache    │  │ • effects  ││
│  │ • npcGenerator  │  │ • audioCache    │  │            ││
│  │ • mapGenerator  │  │ • speechCache   │  │            ││
│  └─────────────────┘  └─────────────────┘  └────────────┘│
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                       AI Integration                        │
│                                                             │
│  ┌──────────────────┐              ┌──────────────────┐   │
│  │  Gemini Service  │              │   fal.ai Client  │   │
│  ├──────────────────┤              ├──────────────────┤   │
│  │ • Story analysis │              │ • Image gen      │   │
│  │ • NPC dialogue   │              │ • TTS synthesis  │   │
│  │ • Biome planning │              │ • Music gen      │   │
│  │ • Narrative gen  │              │ • Sprite gen     │   │
│  └──────────────────┘              └──────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Game Systems

### 1. Story Mode System

The game supports three distinct narrative modes:

#### **Inspiration Mode** (Default, 20 rooms)
- Uses story as thematic inspiration for atmosphere and tone
- Creates original adventures in the style of the provided narrative
- Maintains similar character archetypes and themes

#### **Recreation Mode** (5 rooms)
- Recreates actual events from the provided story
- Includes canonical characters and plot points
- Tracks story beat completion and alignment score
- Player experiences key scenes from source material

#### **Continuation Mode** (20 rooms)
- Takes place after the original story events
- References past characters and events
- Shows world evolution post-story
- Creates new adventures building on established lore

### 2. Room Generation Pipeline

```
Player Approaches Room Boundary
         ↓
Check if room exists in cache/memory
         ↓
┌────────┴────────┐
│                 │
EXISTS         DOESN'T EXIST
│                 │
Retrieve         Generate Room Pair (N+1, N+2)
│                 │
└────────┬────────┘
         ↓
Enhance with AI Sprites
         ↓
Generate Panoramic Scene (1000x800)
         ↓
Generate Tile Map (pathfinding)
         ↓
Save to Cache
         ↓
Pre-generate Next Pair (Background)
```

**Key Innovation**: Room pair generation ensures the next room is always ready, eliminating load times during exploration.

### 3. Character & Combat System

#### Character Classes (Dynamically Generated)
- Each story generates 3 unique character classes
- Stats: HP, Mana, Base Damage, Defense, Crit Chance
- Special abilities with unique effects (heal, guaranteed crit, etc.)
- Custom sprite generation per class

#### Combat Mechanics
- Turn-based battle system
- Attack, Special Ability, and Item actions
- Critical hit calculations with visual feedback
- Enemy scaling based on player level
- Experience gain: `50 XP + (enemy_level - player_level) * 20`
- Level up formula: `100 * 1.5^(level - 1)`

### 4. Visual Consistency System

**Problem**: NPCs and enemies regenerate visually different sprites on re-encounter

**Solution**: Visual Identity Caching
```typescript
interface VisualIdentity {
  imagePrompts: {
    background: string;
    character: string;
  };
  appearance: string;
  cachedImages?: {
    background?: string;
    character?: string;
  };
}
```

- First encounter generates visual identity
- Stored in GameObject's `visualIdentity` field
- Subsequent encounters reuse exact same prompts
- Ensures consistent character appearance

---

## AI Integration Layer

### Gemini AI Integration

**Primary Model**: `gemini-2.0-flash-lite`
- Fast inference (~1-2s response time)
- Optimized for JSON structured output
- Context window: Handles 10+ interaction history

**Use Cases**:
1. **Story Structure Analysis** (Recreation Mode)
   ```typescript
   analyzeStoryStructure(story: string) → {
     storyTitle: string;
     storyBeats: { title, objective, keyCharacters }[];
     mainCharacters: string[];
   }
   ```

2. **Biome Progression Generation**
   - Analyzes story context
   - Generates 5-20 biomes matching narrative arc
   - Returns: `['forest', 'cave', 'ruins', ...]`

3. **Dynamic NPC Dialogue**
   - Context-aware responses based on event history
   - Maintains conversation memory via `interactionHistory`
   - Generates scene + 2-4 choice options

4. **Character Class Generation**
   - Creates 3 thematically appropriate classes
   - Assigns balanced stats and abilities
   - Names and describes based on story context

### fal.ai Integration

**Image Generation**: FLUX-schnell model
- **Style**: "16-bit pixel art, top-down game style"
- **Resolution**: 512x512 (sprites), 1000x800 (scenes)
- **Latency**: ~3-5 seconds per image
- **Caching**: Aggressive caching to minimize API calls

**Text-to-Speech**:
- Character-specific voices (narrator, character, mysterious)
- Emotion control (neutral, excited, sad, angry)
- Auto-play narration for immersion
- Click-to-play UI controls

**Background Music**:
- Biome-specific ambient tracks
- Seamless looping
- Volume controls
- Music mode toggle (exploration/battle)

---

## Data Flow & State Management

### Game State Structure

```typescript
interface GameState {
  // Player
  selectedCharacter: CharacterClass | null;
  currentHP: number;
  maxHP: number;
  currentMana: number;
  maxMana: number;
  level: number;
  experience: number;

  // World
  rooms: Map<string, Room>;
  currentRoomId: string;
  roomCounter: number;
  playerPosition: Position;

  // Story
  storyContext: string | null;
  storyMode: 'inspiration' | 'recreation' | 'continuation';
  biomeProgression: string[];
  storyRecreation: StoryRecreationState | null;
  storyConsequences: StoryConsequence[];

  // Combat
  battleState: BattleState | null;
  currentAnimation: GameAnimation | null;

  // Inventory
  inventory: Item[];
}
```

### State Update Patterns

**Room Transitions**:
```
handleScreenExit(direction)
  → Check recreation mode end condition
  → Increment roomCounter
  → Check cache → Generate room → Enhance sprites
  → Update storyRecreation (beat completion, alignment)
  → Pre-generate next pair (background)
  → Update state (rooms, position, roomCounter)
```

**Combat Flow**:
```
handleObjectInteract(enemy)
  → Mark interaction in room
  → Track story character encounters (recreation mode)
  → Award XP for first NPC interaction
  → Create interaction history entry
  → Call internalHandleLlmRequest (generates scene)
  → Show VisualBattleScene overlay
```

---

## Services Architecture

### Room Generation Services (30 files)

#### **roomPairGenerator.ts**
- Generates two consecutive rooms simultaneously
- Shares narrative context between rooms
- Creates panoramic scene for first room
- Returns: `{ currentRoom, nextRoom }`

#### **roomGenerator.ts**
- Single room generation fallback
- Creates NPCs, enemies, items based on biome
- Integrates story beats (recreation mode)
- Generates room description via Gemini

#### **roomSpriteEnhancer.ts**
- Takes generated room + adds AI sprites
- Parallel sprite generation for all objects
- Caches sprites individually
- Handles sprite generation failures gracefully

#### **roomCache.ts** & **roomCacheManager.ts**
- In-memory cache keyed by seed + roomId
- Prevents duplicate room generation
- Tracks generation promises (prevents race conditions)
- Cache invalidation on restart

#### **mapGenerator.ts**
- Generates 2D tile maps for pathfinding
- 50x40 grid (25px tiles)
- Defines walkable areas, obstacles, spawn points
- Biome-specific tile patterns

#### **sceneImageGenerator.ts**
- Creates 1000x800 panoramic scenes
- Combines biome aesthetic + story context
- Uses FLUX-schnell model
- Fallback to biome defaults on failure

### Sprite Generation Services

#### **spriteGenerator.ts**
- `generateEnemySprite()` - Combat opponents
- `generateNPCSprite()` - Friendly characters
- `generateItemSprite()` - Loot and collectibles
- All return data URLs (base64 encoded images)

#### **spriteCache.ts**
- Singleton cache for sprite URLs
- Format: `{seed}_{objectId}` → sprite URL
- Prevents redundant API calls for same object

### AI Services

#### **geminiService.ts**
- `streamAppContent()` - Narrative generation
- `generateBiomeProgression()` - World planning
- Returns async generators for streaming responses

#### **storyStructureService.ts**
- `analyzeStoryStructure()` - Extracts beats, characters
- `getStoryBeat()` - Returns beat for room number
- `calculateStoryAlignment()` - Scores recreation accuracy (0-100%)

#### **classGenerator.ts**
- Generates 3 character classes per story
- Balanced stat distribution
- Unique special abilities
- Sprite generation per class

### Audio Services

#### **audioService.ts**
- Background music management
- Volume control
- Track switching per biome

#### **speechService.ts**
- Text-to-speech via fal.ai
- Character voice profiles
- Auto-play narration
- Queue management (stop current → play new)

#### **speechCache.ts**
- Caches generated audio blobs
- Key: hash(text + voice + emotion)
- Reduces TTS API calls

---

## Component Hierarchy

```
App.tsx
│
├── StoryInput (initial)
│   └── Story mode selection (3 buttons)
│
├── ClassGenerationLoading
│   └── Progress: analyzing → world → classes → sprites
│
├── CharacterSelection
│   └── Character cards with sprite generation
│
└── Game (when isInGame)
    │
    ├── VoiceControls (top-right overlay)
    │
    ├── AnimationOverlay (damage/heal/levelup)
    │
    ├── AudioManager (background music)
    │
    ├── GameHUD (sidebar)
    │   ├── Character portrait + stats
    │   ├── HP/Mana bars
    │   ├── Level/XP progress
    │   ├── Story objective (recreation mode)
    │   └── Alignment score (recreation mode)
    │
    ├── GameCanvas (main area)
    │   ├── Room scene image (background)
    │   ├── Tile map (pathfinding)
    │   ├── Player sprite
    │   ├── Object sprites (NPCs, enemies, items)
    │   └── Minimap
    │
    └── VisualBattleScene (dialog overlay)
        ├── Scene description (narrated)
        ├── Generated battle image
        ├── Character/Enemy sprites
        └── Choice buttons (combat/dialogue/loot)
```

### Key Components

**GameCanvas** (components/GameCanvas.tsx)
- Handles player movement (WASD/Arrow keys)
- Collision detection with tile map
- Object interaction (E key, click)
- Screen edge detection → room transitions
- Renders sprites using `<img>` positioned absolutely

**VisualBattleScene** (components/VisualBattleScene.tsx)
- Displays AI-generated narrative
- Shows battle/interaction visuals
- 2-4 choice buttons with consequence types
- Auto-narrates scene on mount
- Handles conclude → returns to exploration

**GameHUD** (components/GameHUD.tsx)
- Real-time stat display
- Progress bars (HP, Mana, XP)
- Story objective tracker (recreation mode)
- Alignment score visualization
- Room counter

**BattleUI** (components/BattleUI.tsx)
- Turn-based combat controls
- Attack, Special Ability buttons
- Mana cost display
- Enemy HP bar
- Battle log

---

## Performance Optimizations

### 1. Room Pair Pre-Generation
**Problem**: Room generation takes 5-10 seconds
**Solution**: Pre-generate rooms 2 ahead while player explores
**Result**: Zero perceived load time during gameplay

```typescript
triggerRoomPairPreGeneration(currentRoomCounter, description)
  → Generate rooms N+1 and N+2 in background
  → Store promises in roomGenerationPromises map
  → On player transition, await promise if still pending
  → Otherwise, room already cached and ready
```

### 2. Parallel API Calls
**Before**: Sequential sprite generation (N objects × 5s = 25s total)
**After**: Concurrent sprite generation (5s max)

```typescript
await Promise.all([
  generateNPCSprite(...),
  generateEnemySprite(...),
  generateItemSprite(...)
])
```

### 3. Multi-Level Caching

| Layer | Key | Purpose |
|-------|-----|---------|
| Room Cache | `{seed}_{roomId}` | Prevents room regeneration |
| Sprite Cache | `{seed}_{objectId}` | Reuses sprites across rooms |
| Image Cache | `prompt_hash` | Caches scene images |
| Speech Cache | `{text}_{voice}_{emotion}` | Reuses narration audio |
| Audio Cache | `{biome}_{type}` | Music tracks |

**Cache Invalidation**: Only on `handleRestart()` (new game)

### 4. Lazy Scene Generation
- Scenes generated on-demand (not all at once)
- Background generation while player explores
- Fallback to biome defaults if generation fails

### 5. Event History Optimization
- Keep last 10 interactions for AI context
- Summarize older events
- Prevents token limit issues with Gemini

---

## Development & Deployment

### Environment Setup

**.env.local** (required):
```bash
GEMINI_API_KEY=your_gemini_api_key_here
VITE_FAL_KEY=your_fal_api_key_here
```

### Local Development

```bash
# Install dependencies
pnpm install

# Run dev server (http://localhost:5173)
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

### Project Structure

```
gemini-os-starter/
├── components/          # React UI components (20 files)
│   ├── GameCanvas.tsx
│   ├── VisualBattleScene.tsx
│   ├── CharacterSelection.tsx
│   └── ...
├── services/           # Business logic & AI services (30 files)
│   ├── roomGenerator.ts
│   ├── geminiService.ts
│   ├── spriteGenerator.ts
│   └── ...
├── types/              # TypeScript definitions
│   ├── audio.ts
│   ├── biomes.ts
│   └── voice.ts
├── utils/              # Helper functions
│   ├── imageCache.ts
│   ├── imageSlicing.ts
│   └── tileMapToImage.ts
├── hooks/              # Custom React hooks
│   ├── useSpeech.ts
│   ├── useBackgroundMusic.ts
│   └── useScenePregeneration.ts
├── docs/               # Extensive documentation (35+ MD files)
├── public/             # Static assets
├── App.tsx             # Main game component (1800 lines)
├── index.tsx           # React entry point
├── constants.ts        # Game configuration
├── types.ts            # Core type definitions
└── vite.config.ts      # Build configuration
```

### Key Configuration Files

**vite.config.ts**:
```typescript
export default defineConfig({
  plugins: [react()],
  // API proxy for development
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true
  }
}
```

---

## Performance Metrics

### Load Times (Typical)
- Initial class generation: ~8-12s
- First room pair (game start): ~10-15s
- Subsequent room transitions: <1s (pre-generated)
- Sprite generation: ~3-5s (parallel)
- Scene generation: ~4-6s (FLUX-schnell)
- TTS narration: ~2-3s

### API Call Reduction (with caching)
- Room re-entry: 100% cache hit (no API calls)
- Sprite re-use: ~70% cache hit across rooms
- Scene re-generation: ~90% cache hit (same biome)
- Speech re-play: ~80% cache hit (common phrases)

---

## Future Enhancements

### Planned Features
- [ ] Multiplayer co-op mode
- [ ] Save/load game state
- [ ] More biomes (ocean, desert, volcano)
- [ ] Equipment system with visual updates
- [ ] Skill tree progression
- [ ] Boss battles with unique mechanics
- [ ] Achievement system

### Technical Improvements
- [ ] WebGL renderer for smoother animations
- [ ] Service worker for offline caching
- [ ] IndexedDB for persistent cache
- [ ] Sprite sheet optimization
- [ ] Lazy component loading (code splitting)

---

## Credits & Licenses

**Built For**: Cursor Singapore Hackathon
**Development Time**: 24 hours
**License**: Apache-2.0

**Technologies**:
- Google Gemini AI (narrative generation)
- fal.ai (image & audio generation)
- React 19 (UI framework)
- Vite (build tool)

**Inspired By**: Hades (Supergiant Games)

---

## Contact & Resources

- **Documentation**: See `/docs` directory for detailed guides
- **AI Studio Preview**: https://ai.studio/apps/bundled/gemini_os
- **GitHub**: [Link to repository]

For questions or contributions, please open an issue or pull request.

---

**Last Updated**: October 2025
**Version**: 0.0.0 (Hackathon Build)
