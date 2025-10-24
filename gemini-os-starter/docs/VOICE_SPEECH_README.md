# 🎙️ AI Character Voice Speech System

**Give your game characters realistic voices using fal.ai's advanced text-to-speech models!**

---

## 🌟 What This System Does

Transform your text-based game into an **immersive audio experience** where:

- 🗣️ **NPCs speak** when you interact with them
- ⚔️ **Enemies taunt** you in battle with menacing voices
- 📖 **Narrators** tell your story with professional voices
- 🏪 **Merchants** greet you enthusiastically
- 🎭 **Different emotions** change how characters sound
- 💾 **Smart caching** makes voices instant on replay
- 🎮 **Easy integration** with React hooks

---

## 🚀 Quick Start (5 Minutes)

### 1. Add API Key

```bash
# .env.local
VITE_FAL_KEY=your_fal_api_key_here
```

### 2. Make a Character Speak

```typescript
import { speechService } from './services/speechService';

await speechService.speak(
  "Welcome to my shop!",
  'merchant',
  'friendly'
);
```

### 3. Add to UI

```typescript
import { VoiceControls } from './components/VoiceControls';

<VoiceControls compact />
```

**That's it!** Your characters can now speak! 🎉

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [**VOICE_QUICKSTART.md**](./VOICE_QUICKSTART.md) | 5-minute setup guide |
| [**VOICE_SPEECH_GUIDE.md**](./VOICE_SPEECH_GUIDE.md) | Complete API reference |
| [**INTEGRATION_EXAMPLE.md**](./INTEGRATION_EXAMPLE.md) | Step-by-step integration |

---

## 🎭 Character Types

Pre-configured voices for different character archetypes:

| Type | Voice | Best For |
|------|-------|----------|
| `hero` | Confident, brave | Player characters |
| `villain` | Dark, menacing | Bosses, antagonists |
| `merchant` | Cheerful, friendly | Shop NPCs |
| `guide` | Calm, wise | Tutorial NPCs |
| `enemy` | Aggressive, hostile | Combat enemies |
| `narrator` | Clear, storytelling | Narration |
| `mystic` | Ethereal, ancient | Magic users |
| `warrior` | Strong, gruff | Fighter NPCs |
| `scholar` | Intelligent, precise | Librarians, sages |
| `trickster` | Playful, witty | Rogues, jesters |

---

## 🎨 Features

### Multiple Voice Models
- **Dia TTS** - Emotional, natural dialogue
- **MiniMax** - 300+ high-quality voices
- **PlayAI** - Fast generation, multilingual
- **VibeVoice** - Expressive multi-voice

### Emotion Control
Voices adapt based on emotion:
- Neutral, Happy, Sad, Angry
- Fearful, Surprised, Mysterious
- Heroic, Menacing, Friendly, Sarcastic

### Smart Caching
- First generation: 3-5 seconds
- Cached playback: **instant!**
- Automatic memory management
- Preload upcoming dialogue

### React Integration
- `useSpeech()` - Full control
- `useAutoSpeech()` - Auto-play on text change
- `useNPCSpeech()` - NPC interactions
- `useNarrator()` - Story narration
- `usePreloadSpeech()` - Background loading

---

## 💡 Usage Examples

### NPC Dialogue

```typescript
import { useSpeech } from './hooks/useSpeech';

function NPC({ text }) {
  const { speak } = useSpeech();

  return (
    <div onClick={() => speak(text, 'merchant', 'friendly')}>
      🧙 Merchant: {text}
    </div>
  );
}
```

### Battle Taunts

```typescript
const { speak } = useSpeech();

// Enemy taunts
await speak(
  "You dare challenge me?!",
  'enemy',
  'angry'
);
```

### Room Narration

```typescript
import { useNarrator } from './hooks/useSpeech';

function RoomEntry({ description }) {
  const { narrate } = useNarrator();

  useEffect(() => {
    narrate(description, 'mysterious');
  }, [description]);

  return <p>{description}</p>;
}
```

---

## 🏗️ Architecture

```
Voice Speech System
├── Types (types/voice.ts)
│   └── Voice profiles, emotions, settings
├── TTS Client (services/falTTSClient.ts)
│   └── fal.ai API integration
├── Voice Profiles (services/voiceProfiles.ts)
│   └── Character archetypes & emotions
├── Speech Cache (services/speechCache.ts)
│   └── Efficient caching & preloading
├── Speech Service (services/speechService.ts)
│   └── High-level orchestration
├── React Hooks (hooks/useSpeech.ts)
│   └── Easy component integration
└── UI Controls (components/VoiceControls.tsx)
    └── Settings & playback controls
```

---

## ⚡ Performance

| Operation | Time |
|-----------|------|
| First generation | 3-5 seconds |
| Cached playback | Instant! |
| Preloading | Background, non-blocking |
| Memory usage | ~50MB for 100 cached speeches |

### Optimization Tips

1. **Preload** important dialogue during loading screens
2. **Cache** automatically stores frequently used phrases
3. **Choose model** based on needs (PlayAI for speed, MiniMax for quality)
4. **Batch preload** dialogue choices for instant response

---

## 🎯 Use Cases

### ✅ Perfect For:
- NPC interactions
- Dialogue choices
- Battle commentary
- Story narration
- Merchant conversations
- Tutorial guidance
- Cutscenes
- Character taunts

### 🔧 Advanced Features:
- Custom voice profiles per character
- Emotion overrides for specific situations
- Voice design with AI
- Multi-language support
- Streaming playback
- Queue management

---

## 📊 API Overview

### Core Service

```typescript
import { speechService } from './services/speechService';

// Generate and play
await speechService.speak(text, characterType, emotion);

// Dialogue with context
await speechService.speakDialogue({
  speaker: { id, name, type },
  text,
  emotion,
  sceneContext,
});

// Preload
await speechService.preloadSpeech(text, type, emotion);

// Control
speechService.stopSpeech();
speechService.setVolume(0.7);
speechService.updateSettings({ autoPlay: true });
```

### React Hooks

```typescript
import { useSpeech, useNarrator, useNPCSpeech } from './hooks/useSpeech';

const { speak, isPlaying, isGenerating } = useSpeech();
const { narrate } = useNarrator();
const { speakNPC } = useNPCSpeech();
```

### UI Component

```typescript
import { VoiceControls } from './components/VoiceControls';

<VoiceControls />          // Full controls
<VoiceControls compact />  // Compact toggle
```

---

## 🛠️ Customization

### Custom Character Voice

```typescript
import { voiceProfileManager } from './services/voiceProfiles';

voiceProfileManager.registerCharacterVoice({
  characterId: 'npc-001',
  characterName: 'Mysterious Stranger',
  archetype: 'mystic',
  voiceProfile: {
    model: 'dia-tts',
    speed: 0.85,
    pitch: -0.3,
    description: 'Ancient, ethereal voice with otherworldly echo',
  },
});
```

### Cache Settings

```typescript
import { initializeSpeechCache } from './services/speechCache';

initializeSpeechCache({
  maxCacheSize: 200,      // Max entries
  maxMemoryMB: 100,       // Max memory
  preloadEnabled: true,   // Auto-preload
  ttlMinutes: 60,        // Lifetime
});
```

---

## 🔍 Monitoring & Debugging

### Check Cache Stats

```typescript
const stats = speechService.getCacheStats();
console.log(stats);
// {
//   totalEntries: 25,
//   memoryUsedMB: "12.34",
//   avgAccessCount: "3.2",
//   byCharacterType: { merchant: 10, hero: 15 }
// }
```

### Clear Cache

```typescript
speechService.clearCache();
```

### Console Logs

Look for these in browser console:
- `[FalTTS]` - Generation progress
- `[SpeechService]` - Playback events
- `[SpeechCache]` - Cache operations

---

## 🌐 Supported Models

| Model | Speed | Quality | Voices | Best For |
|-------|-------|---------|--------|----------|
| Dia TTS | ⭐⭐⭐ | ⭐⭐⭐⭐ | Emotion-based | Cutscenes, narration |
| MiniMax | ⭐⭐ | ⭐⭐⭐⭐⭐ | 300+ | Important characters |
| PlayAI | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Many | Frequent dialogue |
| VibeVoice | ⭐⭐⭐ | ⭐⭐⭐⭐ | Various | Multi-speaker |

---

## 🎓 Learn More

- **Quick Start**: [VOICE_QUICKSTART.md](./VOICE_QUICKSTART.md)
- **Full Guide**: [VOICE_SPEECH_GUIDE.md](./VOICE_SPEECH_GUIDE.md)
- **Integration**: [INTEGRATION_EXAMPLE.md](./INTEGRATION_EXAMPLE.md)
- **fal.ai Docs**: [https://fal.ai/models](https://fal.ai/models)

---

## ❓ FAQ

**Q: How much does it cost?**
A: See [fal.ai pricing](https://fal.ai/pricing). Typical: $0.04 per 1000 characters.

**Q: Does it work offline?**
A: No, requires internet for generation. Cached speeches play offline.

**Q: Can I use my own voice?**
A: Yes! Use voice cloning models on fal.ai.

**Q: How long does generation take?**
A: 3-5 seconds first time, instant when cached.

**Q: How many voices are there?**
A: MiniMax alone has 300+ voices across 30+ languages.

**Q: Can I adjust voice settings?**
A: Yes! Control speed, pitch, emotion, and more.

---

## 🎉 What You Can Build

With this system, you can create:

- 🎮 **Fully voice-acted RPGs**
- 📖 **Interactive stories** with narration
- 🗡️ **Tactical games** with commander voices
- 🏰 **Adventure games** with NPC dialogue
- 🎭 **Visual novels** with character voices
- 🎲 **Dungeon crawlers** with atmospheric narration
- 🌟 **Any text-based game** with immersive audio!

---

## 🙏 Credits

Built with:
- **fal.ai** - AI voice models
- **React** - UI framework
- **Web Audio API** - Audio playback
- **TypeScript** - Type safety

---

## 📝 License

Apache-2.0

---

**Ready to give your characters a voice? Start with [VOICE_QUICKSTART.md](./VOICE_QUICKSTART.md)!** 🎙️✨
