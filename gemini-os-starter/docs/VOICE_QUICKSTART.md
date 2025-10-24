# 🚀 Voice Speech - 5 Minute Quick Start

Get character speech working in your game in just 5 minutes!

## ⚡ Step 1: Setup (1 minute)

Add your fal.ai API key to `.env.local`:

```bash
VITE_FAL_KEY=your_api_key_here
```

## 🎯 Step 2: Simple Usage (1 minute)

```typescript
import { speechService } from './services/speechService';

// Make any character speak!
await speechService.speak(
  "Hello, adventurer!",  // Text to speak
  'merchant',            // Character type
  'friendly'             // Emotion
);
```

That's it! The character will speak with AI voice.

## 🎮 Step 3: Add to Your Game (2 minutes)

### For NPCs:

```typescript
import { useSpeech } from './hooks/useSpeech';

function NPCInteraction({ npc }) {
  const { speak } = useSpeech();

  return (
    <div onClick={() => speak(npc.text, 'guide', 'friendly')}>
      {npc.sprite} {npc.text}
    </div>
  );
}
```

### For Narration:

```typescript
import { useNarrator } from './hooks/useSpeech';

function RoomDescription({ description }) {
  const { narrate } = useNarrator();

  useEffect(() => {
    narrate(description, 'mysterious');
  }, [description]);

  return <p>{description}</p>;
}
```

## 🎨 Step 4: Add Voice Controls (1 minute)

```typescript
import { VoiceControls } from './components/VoiceControls';

function GameUI() {
  return (
    <div>
      <VoiceControls compact />  {/* Simple toggle */}
      {/* Your game UI */}
    </div>
  );
}
```

## 🎉 You're Done!

Your game now has character speech!

### Available Character Types:

- `hero` - Brave, confident
- `villain` - Dark, menacing
- `merchant` - Cheerful, friendly
- `guide` - Calm, wise
- `enemy` - Aggressive, hostile
- `narrator` - Clear, storytelling
- `mystic` - Mysterious, ancient
- `warrior` - Strong, battle-hardened
- `scholar` - Intelligent, thoughtful
- `trickster` - Playful, mischievous

### Available Emotions:

- `neutral`, `happy`, `sad`, `angry`, `fearful`, `surprised`
- `mysterious`, `heroic`, `menacing`, `friendly`, `sarcastic`

## 📚 Next Steps

- Read [VOICE_SPEECH_GUIDE.md](./VOICE_SPEECH_GUIDE.md) for complete API
- Check [INTEGRATION_EXAMPLE.md](./INTEGRATION_EXAMPLE.md) for detailed examples
- Customize voices with character profiles

## 💡 Pro Tips

1. **Caching**: Speech is automatically cached - second playback is instant!
2. **Preload**: Use `preloadSpeech()` for upcoming dialogue
3. **Auto-detect**: Emotion can be auto-detected from text
4. **Performance**: First generation takes 3-5 seconds, then cached

## 🆘 Troubleshooting

**No sound?**
- Check API key in `.env.local`
- Verify voice is enabled (toggle in VoiceControls)
- Check browser console for errors

**Slow?**
- First time generates speech (3-5s)
- Subsequent plays use cache (instant!)
- Preload important dialogue

---

**That's it! Enjoy your talking characters! 🎙️✨**
