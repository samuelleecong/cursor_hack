# 🎙️ Character Voice Speech System - Complete Guide

## Overview

This system provides **AI-powered text-to-speech (TTS)** for character dialogue using fal.ai's voice models. Characters can speak with distinct voices, emotions, and personalities, creating an immersive audio experience.

## 🌟 Features

- **Multiple Voice Models**: Dia TTS (emotional), MiniMax (300+ voices), PlayAI (fast)
- **Character Archetypes**: 10 pre-configured voice profiles (hero, villain, merchant, etc.)
- **Emotion Control**: Dynamic voice modulation based on dialogue context
- **Smart Caching**: Efficient caching reduces API calls and latency
- **Auto-play**: Automatic speech generation for dialogue
- **Preloading**: Background generation for instant playback
- **React Integration**: Easy-to-use hooks for components

---

## 🚀 Quick Start

### 1. Setup

Ensure `VITE_FAL_KEY` is set in your `.env.local`:

```bash
VITE_FAL_KEY=your_fal_api_key_here
```

### 2. Basic Usage

```typescript
import { speechService } from './services/speechService';

// Simple speech
await speechService.speak(
  "Welcome to the dungeon!",
  'narrator',
  'mysterious'
);
```

### 3. Using React Hooks

```typescript
import { useSpeech } from './hooks/useSpeech';

function MyComponent() {
  const { speak, isPlaying } = useSpeech();

  const handleClick = async () => {
    await speak("Hello adventurer!", 'merchant', 'friendly');
  };

  return (
    <button onClick={handleClick} disabled={isPlaying}>
      {isPlaying ? 'Speaking...' : 'Speak'}
    </button>
  );
}
```

---

## 📚 Character Archetypes

Pre-configured voice profiles for different character types:

| Archetype | Voice Model | Description | Use Case |
|-----------|-------------|-------------|----------|
| `hero` | MiniMax | Confident, brave, inspiring | Player character, protagonists |
| `villain` | MiniMax | Dark, menacing, authoritative | Bosses, antagonists |
| `merchant` | MiniMax | Cheerful, enthusiastic, friendly | Shop NPCs, traders |
| `guide` | MiniMax | Calm, knowledgeable, reassuring | Tutorial NPCs, helpers |
| `enemy` | MiniMax | Aggressive, hostile, harsh | Combat enemies |
| `narrator` | Dia TTS | Clear, authoritative, storytelling | Game narration, descriptions |
| `mystic` | Dia TTS | Ethereal, mysterious, ancient | Magic users, oracles |
| `warrior` | MiniMax | Strong, battle-hardened, direct | Fighter NPCs |
| `scholar` | MiniMax | Intelligent, contemplative, precise | Librarians, sages |
| `trickster` | Dia TTS | Playful, mischievous, witty | Rogues, jesters |

---

## 🎭 Emotion System

Available emotions that modulate voice characteristics:

- `neutral` - Balanced, standard delivery
- `happy` - Cheerful, upbeat (+speed, +pitch)
- `sad` - Melancholic, somber (-speed, -pitch)
- `angry` - Intense, forceful (+speed, slight +pitch)
- `fearful` - Nervous, uncertain (faster, higher)
- `surprised` - Shocked, animated (fast, high pitch)
- `mysterious` - Enigmatic, intriguing (slower, lower)
- `heroic` - Confident, inspiring (standard, slight +pitch)
- `menacing` - Dark, threatening (slow, low pitch)
- `friendly` - Warm, welcoming (+speed, +pitch)
- `sarcastic` - Witty, ironic (+speed)

### Automatic Emotion Detection

The system can infer emotion from text:

```typescript
import { inferEmotionFromContext } from './services/voiceProfiles';

const emotion = inferEmotionFromContext(
  "What! How did you find me?!",
  "battle"
);
// Returns: 'surprised' or 'fearful'
```

---

## 🎯 API Reference

### SpeechService

Main service for generating and playing speech.

```typescript
import { speechService } from './services/speechService';

// Generate and play speech
const speechFile = await speechService.speak(
  text: string,
  characterType: CharacterArchetype,
  emotion?: VoiceEmotion,
  autoPlay?: boolean
);

// Generate dialogue speech with full context
const speechFile = await speechService.speakDialogue(
  context: DialogueSpeechContext,
  autoPlay?: boolean
);

// Control playback
speechService.stopSpeech();
speechService.setVolume(0.7); // 0.0 to 1.0
speechService.toggleEnabled();

// Settings
speechService.updateSettings({
  volume: 0.8,
  speed: 1.2,
  autoPlay: true,
  narratorEnabled: true,
});

// Preload for instant playback
await speechService.preloadSpeech(text, characterType, emotion);

// Batch preload
await speechService.preloadBatch([
  { text: "Hello!", characterType: 'merchant', emotion: 'happy' },
  { text: "Goodbye!", characterType: 'merchant', emotion: 'sad' },
]);

// Cache management
const stats = speechService.getCacheStats();
speechService.clearCache();
```

### React Hooks

#### useSpeech()

```typescript
const {
  speak,           // Generate and play speech
  speakDialogue,   // Speak with dialogue context
  stop,            // Stop playback
  preload,         // Preload speech
  isGenerating,    // Is currently generating?
  isPlaying,       // Is currently playing?
  currentSpeech,   // Current speech file
  error,           // Error message if any
} = useSpeech();

// Usage
await speak("Hello!", 'hero', 'happy');
```

#### useAutoSpeech()

Automatically speaks when text changes:

```typescript
const { isGenerating, isPlaying, error } = useAutoSpeech(
  dialogueText,      // Text to speak
  'merchant',        // Character type
  'friendly',        // Emotion
  isEnabled          // Enable/disable
);
```

#### useNPCSpeech()

Simplified for NPC interactions:

```typescript
const { speakNPC, isGenerating, isPlaying } = useNPCSpeech();

await speakNPC(
  'npc',          // Game object type
  "Greetings!",   // Text
  'friendly'      // Optional emotion
);
```

#### useNarrator()

Dedicated narrator voice:

```typescript
const { narrate, isGenerating, isPlaying } = useNarrator();

await narrate("You enter a dark dungeon...", 'mysterious');
```

---

## 🎨 UI Components

### VoiceControls

Pre-built UI for voice settings:

```typescript
import { VoiceControls } from './components/VoiceControls';

// Full controls
<VoiceControls />

// Compact mode
<VoiceControls compact />
```

Features:
- Enable/disable voice
- Volume slider
- Speed adjustment
- Auto-play toggle
- Narrator toggle
- Cache statistics
- Clear cache button

---

## 💡 Integration Examples

### Example 1: NPC Dialogue

```typescript
import { useSpeech } from './hooks/useSpeech';

function NPCDialogue({ npc, text }) {
  const { speak, isPlaying } = useSpeech();

  useEffect(() => {
    if (text) {
      const archetype = npc.type === 'merchant' ? 'merchant' : 'guide';
      speak(text, archetype, 'friendly', true);
    }
  }, [text, npc]);

  return (
    <div>
      {isPlaying && <span>🔊 Speaking...</span>}
      <p>{text}</p>
    </div>
  );
}
```

### Example 2: Battle Dialogue

```typescript
import { speechService } from './services/speechService';

async function handleEnemyTaunt(enemy: GameObject) {
  await speechService.speakDialogue({
    speaker: {
      id: enemy.id,
      name: enemy.sprite,
      type: 'enemy',
    },
    text: enemy.interactionText,
    emotion: 'angry',
    sceneContext: 'battle',
  });
}
```

### Example 3: Narrator for Room Descriptions

```typescript
import { useNarrator } from './hooks/useSpeech';

function RoomDescription({ room }) {
  const { narrate } = useNarrator();

  useEffect(() => {
    if (room.description) {
      narrate(room.description, 'mysterious');
    }
  }, [room.id]);

  return <div>{room.description}</div>;
}
```

### Example 4: Dialogue Choices with Preload

```typescript
import { usePreloadSpeech } from './hooks/useSpeech';

function DialogueChoices({ choices }) {
  const { preloadBatch } = usePreloadSpeech();

  useEffect(() => {
    // Preload all choice responses
    const speeches = choices.map(choice => ({
      text: choice.result,
      characterType: 'narrator' as const,
      emotion: choice.emotion,
    }));

    preloadBatch(speeches);
  }, [choices]);

  // Render choices...
}
```

---

## ⚙️ Advanced Configuration

### Custom Voice Profile

```typescript
import { createCustomVoiceProfile } from './services/voiceProfiles';

const customProfile = createCustomVoiceProfile('hero', {
  model: 'dia-tts',
  speed: 1.2,
  pitch: 0.3,
  emotion: 'heroic',
  description: 'Young, energetic hero with a slight accent',
});

await speechService.speak("For glory!", 'hero', undefined);
```

### Register Character Voice

```typescript
import { voiceProfileManager } from './services/voiceProfiles';

voiceProfileManager.registerCharacterVoice({
  characterId: 'blacksmith-001',
  characterName: 'Gorin the Blacksmith',
  archetype: 'warrior',
  voiceProfile: {
    model: 'minimax-speech',
    voiceId: 'male-qn-jingying',
    speed: 0.9,
    pitch: -0.2,
  },
  emotionOverrides: {
    happy: {
      model: 'minimax-speech',
      voiceId: 'male-qn-jingying',
      speed: 1.0,
      pitch: 0.0,
    },
  },
});
```

### Cache Configuration

```typescript
import { initializeSpeechCache } from './services/speechCache';

initializeSpeechCache({
  maxCacheSize: 200,        // Max entries
  maxMemoryMB: 100,         // Max memory
  preloadEnabled: true,     // Preload buffers
  ttlMinutes: 60,           // Cache lifetime
});
```

---

## 🔧 Troubleshooting

### Speech Not Playing

1. **Check API Key**: Ensure `VITE_FAL_KEY` is set in `.env.local`
2. **Check Settings**: Verify voice is enabled: `speechService.toggleEnabled()`
3. **Check Volume**: Ensure volume > 0: `speechService.setVolume(0.7)`
4. **Browser Console**: Look for `[FalTTS]` and `[SpeechService]` logs

### Slow Generation

1. **Use Cache**: Speech is cached automatically; subsequent uses are instant
2. **Preload**: Use `preloadSpeech()` to generate in background
3. **Model Selection**: MiniMax is slower but higher quality; PlayAI is faster
4. **Batch Preload**: Preload upcoming dialogue during loading screens

### High Memory Usage

1. **Adjust Cache**: Reduce `maxMemoryMB` in cache config
2. **Disable Preload**: Set `preloadEnabled: false` to save memory
3. **Clear Cache**: Call `speechService.clearCache()` periodically

---

## 📊 Performance Tips

1. **Preload Critical Dialogue**: Preload important NPC lines during loading
2. **Smart Caching**: Common phrases are automatically cached
3. **Background Generation**: Generate speech while player reads text
4. **Model Selection**:
   - Use `playai-tts` for fast, frequent dialogue
   - Use `minimax-speech` for important, emotional scenes
   - Use `dia-tts` for narrator and cinematic moments

---

## 🎬 Voice Model Comparison

| Model | Speed | Quality | Emotion Control | Best For |
|-------|-------|---------|-----------------|----------|
| **Dia TTS** | Moderate | High | Excellent | Narrator, cutscenes, emotional dialogue |
| **MiniMax** | Slow | Very High | Good | Main characters, important NPCs |
| **PlayAI** | Fast | Good | Moderate | Background NPCs, frequent dialogue |
| **VibeVoice** | Moderate | High | Good | Multi-speaker scenes, variety |

---

## 📝 Code Architecture

```
types/voice.ts              - Type definitions
services/
  ├── falTTSClient.ts       - fal.ai API integration
  ├── voiceProfiles.ts      - Character voice configurations
  ├── speechCache.ts        - Caching system
  └── speechService.ts      - High-level orchestration
hooks/
  └── useSpeech.ts          - React hooks
components/
  └── VoiceControls.tsx     - UI component
```

---

## 🔗 Related Documentation

- [fal.ai TTS Models](https://fal.ai/models)
- [Music System Guide](./MUSIC_SYSTEM.md)
- [Audio Quick Start](./AUDIO_QUICKSTART.md)

---

## 🎉 Examples in Action

Check the game code for live examples:
- NPC interactions in `App.tsx`
- Battle dialogue
- Room descriptions
- Merchant conversations

---

**Built with ❤️ using fal.ai's powerful TTS models**
