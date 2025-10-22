# Dungeon System Reference & Implementation Plan

## Current Implementation Overview

### What We Have Now
- **Complex 9x9 dungeon grid system** with procedural generation
- **Main path + branch generation** using pathfinding algorithms
- **6 room types**: start, combat, treasure, safe, puzzle, boss
- **4-directional navigation** with exit indicators
- **Minimap component** showing explored/unexplored areas
- **Special room mechanics**: healing shrines, puzzles, boss battles

### Current Issues
- ❌ Exit indicators not rendering properly
- ❌ North/South navigation spawning issues
- ❌ Overly complex for 81 separate rooms
- ❌ Performance concerns with large dungeon
- ❌ Difficult to debug and maintain

### Current Architecture
```
dungeonGenerator.ts - Generates 9x9 grid with pathfinding
roomGenerator.ts - Creates individual rooms from cells
roomCacheManager.ts - Manages room loading/unloading
App.tsx - Dungeon state management
GameCanvas.tsx - Rendering and exit detection
Minimap.tsx - Visual dungeon map
```

---

## New Proposed Implementation: 4-Map Screen System

### Core Concept
Instead of 81 separate procedural rooms, generate **4 large continuous maps** divided into **screen-sized sections**. Think classic 2D Zelda or early Final Fantasy.

### Map Structure

#### **Map 1: Mystic Forest** (Starting Area)
- **Size**: 5x5 screens (25 total screens)
- **Biome**: Forest
- **Theme**: Peaceful introduction, light combat
- **Features**:
  - Screen [0,0]: Starting area with NPC guide
  - Screens [1-3, 1-3]: Mix of combat and exploration
  - Screen [2,2]: Safe room with healing shrine (center)
  - Screen [4,4]: Exit portal to Map 2
  - 2-3 treasure rooms scattered
  - 1-2 puzzle rooms

#### **Map 2: Scorched Plains** (Mid-Game)
- **Size**: 5x5 screens (25 total screens)
- **Biome**: Desert/Plains
- **Theme**: Moderate difficulty, environmental hazards
- **Features**:
  - Screen [0,0]: Entry from Map 1
  - Screens with varied enemy density (2-5 enemies per screen)
  - Screen [2,2]: Safe room (rest point)
  - Screen [3,1]: Puzzle room with rare loot
  - Screen [4,4]: Exit portal to Map 3
  - 3-4 treasure rooms
  - Mini-boss at screen [3,3]

#### **Map 3: Shadow Caverns** (Late Game)
- **Size**: 5x5 screens (25 total screens)
- **Biome**: Cave/Underground
- **Theme**: High difficulty, dark atmosphere
- **Features**:
  - Screen [0,0]: Entry from Map 2
  - Dense enemy placement (3-6 enemies per screen)
  - Screen [2,2]: Safe room (critical rest point)
  - Screen [1,4]: Treasure vault (heavy guard)
  - Screen [4,4]: Exit portal to Final Dungeon
  - 2-3 puzzle rooms with valuable equipment
  - Stronger enemy variants

#### **Map 4: Ancient Ruins** (Final Area)
- **Size**: 5x5 screens (25 total screens)
- **Biome**: Dungeon/Ruins
- **Theme**: Maximum difficulty, boss preparation
- **Features**:
  - Screen [0,0]: Entry from Map 3
  - Elite enemies throughout (4-8 per screen)
  - Screen [1,1]: Final safe room before boss
  - Screen [2,2]: Treasure hoard (best loot)
  - Screen [4,4]: **BOSS CHAMBER**
  - No random encounters in boss screen
  - Epic final confrontation

---

## Technical Implementation Plan

### Phase 1: Core Map Generation

#### 1.1 Create Map Generator Service
**File**: `/services/largeMapGenerator.ts`

```typescript
interface ScreenData {
  screenX: number;
  screenY: number;
  roomType: RoomType;
  tileMap: TileMap;
  objects: GameObject[];
  exits: { north: boolean; south: boolean; east: boolean; west: boolean };
}

interface LargeMap {
  id: string;
  name: string;
  biome: BiomeType;
  gridSize: number; // 5 for 5x5
  screens: ScreenData[][];
  currentScreen: { x: number; y: number };
}

function generateLargeMap(
  mapId: string,
  biome: BiomeType,
  gridSize: number,
  seed: number,
  mapNumber: number
): LargeMap
```

**Responsibilities**:
- Generate 5x5 grid of screens for each map
- Assign room types based on predefined layouts
- Generate tile maps for each screen
- Place enemies and items randomly per screen
- Define exits (internal screens always connect, edges lead to next map)

#### 1.2 Screen-Specific Generation
Each screen gets:
- **Unique tile layout** (varied terrain within biome)
- **Random enemy placement** (2-6 enemies depending on difficulty)
- **Random item drops** (consumables, equipment)
- **Path variation** (different routes through each screen)
- **Obstacle placement** (trees, rocks, walls)

### Phase 2: Navigation & State Management

#### 2.1 Update App.tsx State
```typescript
interface GameState {
  // ... existing fields
  currentMapId: string; // 'map_1', 'map_2', 'map_3', 'map_4'
  currentScreenPosition: { x: number; y: number };
  largeMaps: Map<string, LargeMap>; // Pre-generated 4 maps
  visitedScreens: Set<string>; // Track "map_1_2_3" format
}
```

#### 2.2 Screen Transition Logic
```typescript
handleScreenExit(direction: 'north' | 'south' | 'east' | 'west') {
  // Calculate new screen position
  // If within map bounds: move to adjacent screen
  // If at map edge: transition to next map
  // Update player position based on entry direction
  // Load new screen's objects and tilemap
}
```

### Phase 3: Rendering & UI Updates

#### 3.1 Update GameCanvas.tsx
- Render current screen only
- Draw exit indicators at screen edges
- Show map transition portals
- Handle spawn positioning per entry direction

#### 3.2 Create Large Map Minimap
**File**: `/components/LargeMapMinimap.tsx`
- Show 5x5 grid of current map
- Highlight current screen
- Indicate visited vs unvisited screens
- Show special room icons
- Display which map (1-4) player is on

### Phase 4: Detail & Polish

#### 4.1 Enemy Randomization
```typescript
function generateEnemiesForScreen(
  screenType: RoomType,
  mapDifficulty: number,
  seed: number
): GameObject[] {
  // Number of enemies scales with map number
  // Position randomized along walkable paths
  // Enemy types vary by biome
  // Levels scale with progression
}
```

#### 4.2 Item Randomization
```typescript
function generateItemsForScreen(
  screenType: RoomType,
  mapNumber: number,
  seed: number
): GameObject[] {
  // Treasure rooms: 4-6 items
  // Combat rooms: 1-2 items
  // Safe rooms: 0 items (just shrine)
  // Item quality increases with map number
}
```

#### 4.3 Environmental Variety
Each screen within a map should feel unique:
- **Varied tile patterns** (different tree/rock layouts)
- **Different path shapes** (curved, straight, winding)
- **Unique object placement** (enemies in formations, items hidden)
- **Visual landmarks** (distinctive features per screen)

---

## Implementation Steps

### Step 1: Create Large Map Generator
- [x] Design LargeMap and ScreenData interfaces
- [ ] Write `generateLargeMap()` function
- [ ] Implement screen-by-screen tile generation
- [ ] Add enemy randomization logic
- [ ] Add item randomization logic
- [ ] Define special room locations per map

### Step 2: Update State Management
- [ ] Modify GameState interface
- [ ] Update handleCharacterSelect to generate 4 maps
- [ ] Rewrite handleScreenExit for screen navigation
- [ ] Add map transition logic
- [ ] Update spawn positioning

### Step 3: Update Rendering
- [ ] Modify GameCanvas for screen rendering
- [ ] Update exit indicators for screen edges
- [ ] Add map transition portal graphics
- [ ] Create LargeMapMinimap component
- [ ] Update GameHUD to show current map info

### Step 4: Special Room Mechanics
- [ ] Implement healing shrines (already done)
- [ ] Implement puzzle rooms (already done)
- [ ] Implement treasure rooms (already done)
- [ ] Implement boss battle (enhance for final boss)
- [ ] Add map transition portals

### Step 5: Testing & Polish
- [ ] Test navigation within maps
- [ ] Test map-to-map transitions
- [ ] Verify spawn positioning
- [ ] Check enemy difficulty scaling
- [ ] Ensure loot progression feels good
- [ ] Remove debug logging

---

## Key Design Decisions

### Why 5x5 Grids?
- **25 screens per map** = 100 total screens across 4 maps
- Manageable size (not overwhelming)
- Clear progression path
- Easy to navigate with minimap

### Why 4 Maps?
- **Clear act structure** (beginning, middle, late, final)
- **Biome variety** without repetition
- **Difficulty progression** (easy → medium → hard → boss)
- **Memorable transitions** between major areas

### Screen Size
- **1000x800 pixels** (current viewport size)
- **25x20 tiles @ 40px** per screen
- Player can see entire screen at once
- No camera scrolling needed (simpler)

### Generation Strategy
- **All 4 maps generated on character select**
- **Seeded random** for consistency
- **Pre-generate all screens** for performance
- **Store in memory** (only 100 screens total, manageable)

---

## Benefits of New Approach

### Simplicity
- ✅ 4 maps instead of 81 dungeon cells
- ✅ Flat screen grid instead of complex pathfinding
- ✅ Easier to reason about navigation
- ✅ Simpler state management

### Performance
- ✅ Pre-generate everything at start
- ✅ No dynamic room generation during gameplay
- ✅ Only render current screen
- ✅ Predictable memory usage

### Player Experience
- ✅ Classic 2D RPG feel
- ✅ Clear sense of progression through maps
- ✅ Coherent world (each map feels like one area)
- ✅ Memorable landmarks and locations
- ✅ Satisfying transitions between major areas

### Debugging
- ✅ Easy to visualize (5x5 grid)
- ✅ Simple to test (navigate screen by screen)
- ✅ Clear exit logic (adjacent screens or map transition)
- ✅ Predictable enemy/item generation

---

## Files to Create
1. `/services/largeMapGenerator.ts` - Main map generation
2. `/components/LargeMapMinimap.tsx` - New minimap for 5x5 screens
3. `/types/largeMap.ts` - Type definitions (or add to existing types.ts)

## Files to Modify
1. `types.ts` - Add LargeMap, ScreenData interfaces
2. `App.tsx` - Update state, generation, navigation
3. `GameCanvas.tsx` - Update rendering, exits
4. `GameHUD.tsx` - Integrate new minimap, show current map

## Files to Remove/Deprecate
1. `/services/dungeonGenerator.ts` - No longer needed
2. `/services/roomCacheManager.ts` - No longer needed
3. `/components/Minimap.tsx` - Replace with LargeMapMinimap

---

## Progress Tracking
- [x] Document current implementation
- [x] Design new system architecture
- [ ] Implement large map generator
- [ ] Update game state management
- [ ] Update rendering system
- [ ] Create new minimap component
- [ ] Test and polish
- [ ] Remove old dungeon system

**Status**: Planning Complete - Ready for Implementation
**Next**: Create largeMapGenerator.ts
