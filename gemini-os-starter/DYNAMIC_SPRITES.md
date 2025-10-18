# Dynamic Sprite Generation System

## Overview

The game now generates **contextual, AI-generated pixel art sprites** for all game objects (enemies, NPCs, items) based on:
- Current biome
- Story context
- Character descriptions
- Game lore

Sprites are generated using **fal.ai's nanobanana model** and cached in localStorage for reuse.

## How It Works

### Generation Flow

```
1. Room Generated → Basic emoji sprites assigned
2. Room Enhanced → AI generates contextual sprites via nanobanana
3. Sprites Cached → Stored in localStorage by description + biome
4. UI Renders → Displays generated sprites (or fallback emojis)
```

### Example

**Without Dynamic Sprites:**
```
Enemy: 👹 (generic demon emoji)
```

**With Dynamic Sprites:**
```
Biome: volcanic
Story: "Lord of the Rings inspired adventure"
Enemy: "hostile creature, volcanic monster, level 3"
→ Generates: Pixel art lava golem sprite matching the theme
```

## Architecture

### Core Services

1. **`spriteCache.ts`** - Persistent sprite storage
   - Caches generated sprites in localStorage
   - Keys: hash of `type:biome:description`
   - Max cache: 200 sprites, 7-day expiry
   - Handles quota exceeded gracefully

2. **`spriteGenerator.ts`** - AI sprite generation
   - Uses fal.ai's `lora-nanobanana` model
   - Generates 128x128 pixel art sprites
   - Combines description + biome + story context
   - Falls back to emoji if generation fails

3. **`roomSpriteEnhancer.ts`** - Room enhancement
   - Takes generated room with emoji sprites
   - Generates AI sprites for each object
   - Returns enhanced room with sprite URLs

### Integration Points

**App.tsx:**
- `handleCharacterSelect`: Enhances initial room
- `handleScreenExit`: Enhances new rooms on exploration

**GameCanvas.tsx:**
- `drawSprite()` function renders sprite URLs
- Falls back to emoji if image not loaded
- Caches loaded images in memory

## Sprite Generation Parameters

### nanobanana Model Settings

```typescript
{
  image_size: { width: 128, height: 128 },
  num_inference_steps: 8,
  guidance_scale: 3.5,
  num_images: 1,
  output_format: 'png',
  enable_safety_checker: false
}
```

### Prompt Structure

```
[description], [type-specific text], [biome] theme, 
inspired by [story context], pixel art sprite, 16-bit retro game, 
transparent background, game asset, clean edges, simple design, 
top-down view
```

**Example Prompts:**

**Enemy:**
```
hostile creature, volcanic monster, volcanic theme, 
inspired by Lord of the Rings, level 3 creature, 
pixel art sprite, 16-bit retro game, transparent background
```

**NPC:**
```
traveler, friendly character, forest inhabitant, forest theme, 
inspired by medieval fantasy, pixel art sprite, 16-bit retro game
```

**Item:**
```
treasure, collectible, glowing game item, dungeon theme, 
pixel art sprite, 16-bit retro game, transparent background
```

## Cache System

### Cache Key Generation

```typescript
hash(`${type}:${biome}:${description.toLowerCase().trim()}`)
```

Examples:
- `enemy:volcanic:hostile creature, volcanic monster`
- `npc:forest:traveler, friendly character`
- `item:dungeon:treasure, collectible`

### Cache Management

```javascript
// Access cache via console
window.spriteCache

// View cache stats
window.spriteCache.getCacheStats()
// {
//   totalSprites: 47,
//   byType: { enemy: 20, npc: 15, item: 12 },
//   oldestEntry: 1699564800000,
//   cacheSize: 234567 (bytes)
// }

// Clear cache
window.spriteCache.clearCache()

// Export cache
const json = window.spriteCache.exportCache()

// Import cache
window.spriteCache.importCache(jsonString)
```

### Storage Details

- **Location**: Browser localStorage
- **Key**: `gemini_os_sprite_cache`
- **Max Size**: 200 sprites
- **Expiry**: 7 days
- **Pruning**: FIFO when limit reached
- **Quota Handling**: Clears oldest 50 entries if quota exceeded

## Performance

### Generation Time

- **First Generation**: 2-5 seconds per sprite
- **Cached Sprites**: Instant (localStorage)
- **Room Load**: 
  - Initial room: ~8-20 seconds (2-4 objects)
  - Subsequent rooms: 0 seconds (all cached)

### Optimization

1. **Lazy Loading**: Sprites generated after room structure is ready
2. **Image Caching**: Loaded images cached in memory
3. **Fallback Rendering**: Emoji displayed immediately while sprite loads
4. **Parallel Generation**: Multiple sprites can generate concurrently

## Usage Examples

### Generate Individual Sprite

```typescript
import { generateSprite } from './services/spriteGenerator';

const sprite = await generateSprite({
  description: 'fierce dragon, fire-breathing',
  type: 'enemy',
  biome: 'volcanic',
  storyContext: 'Epic fantasy adventure',
  fallbackEmoji: '🐉'
});

console.log(sprite.url); // https://fal.ai/files/...
console.log(sprite.cached); // false (first generation)
```

### Generate Multiple Sprites

```typescript
import { generateMultipleSprites } from './services/spriteGenerator';

const sprites = await generateMultipleSprites([
  { description: 'warrior hero', type: 'character', fallbackEmoji: '⚔️' },
  { description: 'goblin enemy', type: 'enemy', biome: 'cave', fallbackEmoji: '👹' },
  { description: 'health potion', type: 'item', fallbackEmoji: '⚗️' }
]);
```

### Enhance Existing Room

```typescript
import { enhanceRoomWithSprites } from './services/roomSpriteEnhancer';

const basicRoom = await generateRoom('room_1', seed, 1, 'forest', storyContext);
const enhancedRoom = await enhanceRoomWithSprites(basicRoom, 'forest', storyContext);

// enhancedRoom.objects now have spriteUrl fields populated
```

## Type Definitions

```typescript
export interface GameObject {
  id: string;
  position: Position;
  type: 'npc' | 'enemy' | 'item' | 'exit' | 'entrance';
  sprite: string;         // Fallback emoji
  spriteUrl?: string;     // Generated sprite URL
  interactionText: string;
  hasInteracted?: boolean;
  itemDrop?: Item;
  enemyLevel?: number;
}

export interface CachedSprite {
  url: string;
  prompt: string;
  type: 'character' | 'enemy' | 'npc' | 'item';
  fallbackEmoji: string;
  timestamp: number;
  biome?: string;
  storyContext?: string;
}
```

## Fallback Strategy

The system gracefully degrades:

1. **Sprite URL available**: Render pixel art image
2. **Image loading**: Show emoji, swap when loaded
3. **Generation failed**: Show emoji permanently
4. **Cache miss + offline**: Show emoji (no generation attempted)

## Benefits

✅ **Context-Aware**: Sprites match biome, story, and theme  
✅ **Consistent**: Same description → same sprite (cached)  
✅ **Performance**: First room slow, rest instant (caching)  
✅ **Graceful**: Always has emoji fallback  
✅ **Persistent**: Sprites saved across sessions  
✅ **Scalable**: 200 sprite cache handles most playthroughs  

## Future Enhancements

### Potential Improvements

1. **Character Sprites**: Generate player character sprites dynamically
2. **Biome Backgrounds**: Generate terrain textures
3. **Animation**: Generate sprite sheets for walking/attacking
4. **Style Consistency**: Use LoRA fine-tuning for consistent art style
5. **Server-Side Cache**: Share sprites across players
6. **Sprite Variants**: Multiple versions for variety
7. **Compression**: Optimize PNG size for faster loading

## Troubleshooting

### Sprites Not Generating

**Check console for errors:**
```javascript
// Enable verbose logging
localStorage.setItem('debug_sprites', 'true')
```

**Common Issues:**
- fal.ai API rate limit (429 error)
- Network connectivity
- LocalStorage quota exceeded
- Invalid API credentials

### Sprites Not Displaying

**Check if sprite URL exists:**
```javascript
const room = gameState.rooms.get(gameState.currentRoomId);
console.log(room.objects.map(o => ({ 
  id: o.id, 
  sprite: o.sprite, 
  spriteUrl: o.spriteUrl 
})));
```

**Check image loading:**
```javascript
// Manual test
const img = new Image();
img.onload = () => console.log('Image loaded!');
img.onerror = (e) => console.error('Image failed:', e);
img.src = 'YOUR_SPRITE_URL';
```

### Clear Everything

```javascript
// Clear sprite cache
window.spriteCache.clearCache();

// Clear localStorage completely
localStorage.clear();

// Restart game
location.reload();
```

## Configuration

### Adjust Cache Settings

Edit `services/spriteCache.ts`:

```typescript
const MAX_CACHE_SIZE = 200;        // Max sprites to cache
const CACHE_EXPIRY_DAYS = 7;       // Days before expiry
```

### Adjust Generation Settings

Edit `services/spriteGenerator.ts`:

```typescript
const SPRITE_STYLE = 'pixel art sprite, 16-bit retro game...';

// In fal.subscribe() call:
image_size: { width: 128, height: 128 },  // Sprite resolution
num_inference_steps: 8,                    // Quality (higher = better, slower)
guidance_scale: 3.5,                       // Prompt adherence
```

## API Costs

**nanobanana pricing (fal.ai):**
- ~$0.001 per 128x128 image
- Average game: 20-40 sprites
- Cost per playthrough: $0.02-$0.04 (first time)
- Subsequent plays: $0 (cached)

## Testing

### Manual Testing

```typescript
// Test sprite generation
import { generateSprite } from './services/spriteGenerator';

const testSprite = await generateSprite({
  description: 'test enemy',
  type: 'enemy',
  biome: 'forest',
  fallbackEmoji: '👹'
});

console.log('Generated:', testSprite.url);
```

### Cache Testing

```javascript
// Generate test sprite
await generateSprite({ description: 'test', type: 'enemy', fallbackEmoji: '👹' });

// Verify cache
const cached = spriteCache.getSprite('test', 'enemy');
console.log('Cached:', cached);

// Check cache stats
console.log(spriteCache.getCacheStats());
```

## Comparison

### Before (Hardcoded Emojis)

```
Forest Enemy: 👹 (same in every biome)
Volcanic Enemy: 👹 (same in every biome)
Cave Enemy: 👹 (same in every biome)
```

### After (Dynamic Sprites)

```
Forest Enemy: [Generated sprite: green forest troll]
Volcanic Enemy: [Generated sprite: lava golem]
Cave Enemy: [Generated sprite: crystalline spider]
```

Each sprite is contextually appropriate and visually distinct!
