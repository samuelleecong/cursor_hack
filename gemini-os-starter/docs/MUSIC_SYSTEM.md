# 🎵 Adaptive Music System Documentation

## Overview

Your roguelike adventure game now features a **fully adaptive, AI-generated soundtrack** that responds dynamically to gameplay, story context, and player choices using fal.ai's music generation models.

## 🎯 How It Works

The music system uses **three different AI models** optimized for different scenarios:

| Model | Use Case | Duration | Generation Speed | Best For |
|-------|----------|----------|------------------|----------|
| **CassetteAI** | Room exploration | 30s | ~2s | Fast, loopable ambient music |
| **Stable Audio 2.5** | Battle scenes | 47s | ~5s | Epic orchestral combat music |
| **MiniMax Music 1.5** | Story moments | 60s | ~10s | Cinematic narrative music |

## 🏗️ Architecture

```
/services
  ├── falAudioClient.ts       # Direct fal.ai API integration
  ├── audioService.ts          # Smart prompt generation & orchestration
  └── audioCache.ts            # LRU cache (max 20 tracks)

/hooks
  └── useBackgroundMusic.ts    # React hook with crossfading

/components
  └── AudioManager.tsx         # Global audio controller

/types
  └── audio.ts                 # TypeScript interfaces
```

## 🎮 User Experience

### Music Controls

A floating music control panel appears in the bottom-right corner when in-game:

- **🎵 Music Button**: Toggle music on/off
- **Volume Slider**: Adjust music volume (0-100%)
- **Now Playing**: Shows current track info and generation model

### Automatic Music Changes

Music automatically adapts to:

1. **Room Changes**: New music when entering a new room (procedurally generated based on room type)
2. **Battle Start**: Epic battle music when combat begins
3. **Battle End**: Returns to room music when battle concludes
4. **Player Death**: Somber defeat music on game over

### Persistence

User preferences are saved to localStorage:
- Music enabled/disabled state
- Volume level

## 🧠 Intelligent Prompt Generation

The system analyzes game state to create contextual music prompts:

### Story Context Analysis

```typescript
// Extracts genre from user's story input
"ancient kingdom of Eldergrove" → "medieval fantasy"
"cyberpunk city" → "sci-fi electronic"
"haunted mansion" → "dark horror ambient"
```

### Player State Integration

```typescript
// HP-based intensity
HP > 75%: "confident, exploratory"
HP 50-75%: "moderate, steady"
HP 25-50%: "cautious, suspenseful"
HP < 25%: "tense, desperate, urgent"
```

### Moral Alignment Tracking

The system tracks your recent choices:
- **Violent** → "aggressive, battle-hardened" undertones
- **Merciful** → "compassionate, gentle" themes
- **Clever** → "cunning, tactical" atmosphere
- **Diplomatic** → "peaceful, harmonious" mood
- **Greedy** → "ambitious, intense" energy

## 🎼 Example Generated Prompts

### Room Exploration
```
"Medieval fantasy music for dungeon. Mysterious, ancient atmosphere.
Moderate, steady pacing. Setting: A dark corridor with flickering torches.
Inspired by story themes. Loopable, instrumental, ambient game soundtrack."
```

### Boss Battle
```
"Music for medieval fantasy Dragon battle. Epic, overwhelming, boss battle
combat. Knight vs Dragon. Epic orchestral battle theme with dynamic percussion.
Heroic, energetic, game soundtrack."
```

### Story Moment
```
"Medieval fantasy cinematic music for story moment. Mysterious, ancient emotional tone.
Reflecting compassionate, gentle journey. Narrative, atmospheric, potentially with
subtle vocals. Game cutscene soundtrack."
```

## 💾 Caching System

### LRU Cache Strategy

- **Max Capacity**: 20 tracks
- **Eviction Policy**: Least Recently Used (LRU)
- **Preloading**: Room and battle music are preloaded as AudioBuffers for instant playback
- **Cache Keys**: Generated from room type, enemy type, story mode, etc.

### Cache Hit Rates

Expected cache performance:
- **Room Music**: ~60% hit rate (similar room types reuse music)
- **Battle Music**: ~80% hit rate (enemy types cached)
- **Story Moments**: ~10% hit rate (intentionally unique)

## 🎨 Crossfade Transitions

Music transitions use smooth 2-second crossfades:

1. New track starts at 0% volume
2. Over 2 seconds:
   - Old track: 100% → 0%
   - New track: 0% → 100%
3. Old track stops, memory freed

## 💰 Cost Estimation

Based on 500 rooms, 100 battles, 50 story moments per month:

| Category | Generations | Cache Hit Rate | API Calls | Cost/Call | Monthly Cost |
|----------|-------------|----------------|-----------|-----------|--------------|
| Rooms | 500 | 60% | 200 | $0.015 | $3.00 |
| Battles | 100 | 80% | 20 | $0.04 | $0.80 |
| Story | 50 | 10% | 45 | $0.035 | $1.58 |
| **Total** | 650 | **59%** | **265** | - | **$5.38** |

## 🔧 Configuration

### Environment Variables

Add to `.env.local`:

```bash
# Your fal.ai API key
VITE_FAL_KEY=your_key_here
```

Get your key at: https://fal.ai/dashboard/keys

### Customization Options

#### Change Default Volume

In `AudioManager.tsx`:

```typescript
const [volume, setVolume] = useState(() => {
  const saved = localStorage.getItem('gemini-os-music-volume');
  return saved !== null ? parseFloat(saved) : 0.3; // <- Change this
});
```

#### Adjust Crossfade Duration

In `useBackgroundMusic.ts`:

```typescript
crossfadeDuration?: number; // Default: 2000ms
```

#### Modify Cache Size

In `audioCache.ts`:

```typescript
const MAX_CACHE_SIZE = 20; // <- Adjust this
```

## 🐛 Debugging

### Enable Detailed Logs

All audio operations log to the console with the `[AudioService]`, `[AudioCache]`, or `[FalAudio]` prefix.

### Common Issues

**Music not playing?**
- Check VITE_FAL_KEY is set in `.env.local`
- Check browser console for errors
- Verify fal.ai API key is valid
- Check music is enabled (floating control button)

**Slow generation?**
- First generation is always slower (no cache)
- CassetteAI is fastest (~2s)
- Check your internet connection

**No crossfade?**
- Crossfade only works when transitioning between playing tracks
- First track plays immediately without fade

## 📊 Performance Monitoring

### Cache Statistics

Access cache stats in console:

```javascript
import { getAudioCacheStats } from './services/audioService';

console.log(getAudioCacheStats());
// {
//   totalSize: 15,
//   maxSize: 20,
//   roomTracks: 10,
//   battleTracks: 4,
//   storyTracks: 1,
//   utilizationPercent: 75
// }
```

### Clear Cache

```javascript
import { clearAudioCache } from './services/audioService';

clearAudioCache(); // Clears all cached music
```

## 🎯 Future Enhancements

Potential improvements:

1. **Dynamic Tempo**: Adjust music BPM based on player actions
2. **Layered Music**: Add/remove instrumental layers based on threat level
3. **Vocal Triggers**: Enable vocals for dramatic story moments
4. **Music Memory**: Remember and reuse music for recurring characters
5. **Playlist Mode**: Pre-generate multiple tracks to avoid generation delays
6. **Spatial Audio**: Positional audio based on player location

## 🎮 How to Test

1. **Start the game**: `npm run dev`
2. **Enter a story**: Try different genres to hear different musical styles
3. **Explore rooms**: Notice music changes between rooms
4. **Start a battle**: Hear the transition to epic battle music
5. **Adjust volume**: Use the floating controls
6. **Check console**: Watch the generation and caching logs

## 🎼 Musical Styles by Story Genre

| Story Keywords | Detected Genre | Musical Style |
|----------------|----------------|---------------|
| "magic", "dragon", "kingdom" | Medieval fantasy | Orchestral, mystical |
| "space", "robot", "cyberpunk" | Sci-fi electronic | Synth, futuristic |
| "horror", "dark", "nightmare" | Dark horror ambient | Eerie, unsettling |
| "western", "cowboy" | Western | Acoustic guitar, harmonica |
| "detective", "noir" | Noir jazz | Saxophone, moody |
| "pirate", "ocean" | Pirate adventure | Sea shanties, accordion |

## 📝 Code Example: Manual Music Trigger

If you want to manually trigger music from your code:

```typescript
import { getMusicForContext } from './services/audioService';

// Build context
const context = {
  storyContext: "A dark fantasy world",
  storyMode: 'inspiration',
  currentRoom: myRoom,
  playerHP: 50,
  maxHP: 100,
};

// Generate music
const audioFile = await getMusicForContext(context, 'room');
console.log('Music URL:', audioFile.url);
```

## 🎊 Enjoy Your Adaptive Soundtrack!

Your game now has a living, breathing soundtrack that evolves with every decision, battle, and story beat. The music truly becomes part of the narrative experience!

---

**Built with:**
- fal.ai API
- React hooks
- Web Audio API
- TypeScript
- LRU caching

**Generation time:** 2-10 seconds per track
**Cache efficiency:** ~60% hit rate
**Monthly cost:** ~$5-10 for active gameplay
