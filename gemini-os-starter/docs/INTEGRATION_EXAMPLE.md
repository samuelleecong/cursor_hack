# 🎮 Voice Speech Integration Example

## Complete Step-by-Step Integration Guide

This guide shows you exactly how to add voice speech to your game's NPC interactions, dialogue, and narration.

---

## 📋 Step 1: Import Required Dependencies

```typescript
import { useSpeech, useNarrator } from './hooks/useSpeech';
import { VoiceControls } from './components/VoiceControls';
import { speechService } from './services/speechService';
import { CharacterArchetype } from './types/voice';
```

---

## 🎯 Step 2: Add Voice Controls to UI

Add the voice control panel to your game UI:

```typescript
function GameUI() {
  return (
    <div>
      {/* Compact voice toggle in header */}
      <div className="game-header">
        <VoiceControls compact />
      </div>

      {/* Full controls in settings panel */}
      <div className="settings-panel">
        <VoiceControls />
      </div>

      {/* Rest of your UI */}
    </div>
  );
}
```

---

## 💬 Step 3: Add Speech to NPC Interactions

### Option A: Using the Hook in Components

```typescript
function NPCInteraction({ npc, interactionText }) {
  const { speakNPC, isPlaying } = useNPCSpeech();

  const handleInteract = async () => {
    // Automatically determines voice based on NPC type
    await speakNPC(npc.type, interactionText);
  };

  return (
    <div onClick={handleInteract}>
      <div>{npc.sprite} {npc.type}</div>
      <p>{interactionText}</p>
      {isPlaying && <span>🔊</span>}
    </div>
  );
}
```

### Option B: Direct Service Call

```typescript
const handleNPCClick = async (npc: GameObject) => {
  const archetype: CharacterArchetype =
    npc.type === 'npc' ? 'guide' :
    npc.type === 'enemy' ? 'enemy' :
    'narrator';

  await speechService.speak(
    npc.interactionText,
    archetype,
    undefined, // Auto-detect emotion
    true       // Auto-play
  );
};
```

---

## 📖 Step 4: Add Narrator for Room Descriptions

```typescript
function RoomDescription({ room, visible }) {
  const { narrate, isPlaying } = useNarrator();

  useEffect(() => {
    if (visible && room.description) {
      // Narrate room description when entering
      narrate(room.description, 'mysterious');
    }
  }, [room.id, visible]);

  return (
    <div className="room-description">
      {isPlaying && <span className="speaking-indicator">🎙️</span>}
      <p>{room.description}</p>
    </div>
  );
}
```

---

## ⚔️ Step 5: Add Speech to Battle System

```typescript
function BattleDialogue({ battleState }) {
  const { speak } = useSpeech();

  // Speak when battle starts
  useEffect(() => {
    if (battleState?.status === 'ongoing') {
      const enemy = battleState.enemy;
      speak(
        `A wild ${enemy.sprite} appears!`,
        'enemy',
        'menacing',
        true
      );
    }
  }, [battleState?.status]);

  // Speak battle actions
  const speakBattleAction = async (action: BattleAction) => {
    const archetype = action.actor === 'player' ? 'hero' : 'enemy';
    const emotion = action.damage && action.damage > 0 ? 'angry' : 'neutral';

    await speak(action.text, archetype, emotion, true);
  };

  return (
    <div>
      {battleState?.history.map((action, i) => (
        <div key={i} onClick={() => speakBattleAction(action)}>
          {action.text}
        </div>
      ))}
    </div>
  );
}
```

---

## 🗣️ Step 6: Add Speech to Dialogue Choices

```typescript
function DialogueChoice({ choice, onSelect }) {
  const { speak, isPlaying } = useSpeech();
  const { preloadBatch } = usePreloadSpeech();

  // Preload the result text for instant playback
  useEffect(() => {
    if (choice.result) {
      preloadBatch([{
        text: choice.result,
        characterType: 'narrator',
        emotion: choice.emotion,
      }]);
    }
  }, [choice]);

  const handleSelect = async () => {
    // Speak the player's choice
    await speak(choice.text, 'hero', 'neutral', true);

    // Wait a moment, then speak the result
    setTimeout(async () => {
      await speak(choice.result, 'narrator', choice.emotion, true);
    }, 1000);

    onSelect(choice);
  };

  return (
    <button onClick={handleSelect} disabled={isPlaying}>
      {choice.text}
    </button>
  );
}
```

---

## 🏪 Step 7: Merchant Interactions

```typescript
function MerchantDialogue({ item, action }) {
  const { speak } = useSpeech();

  const merchantGreeting = async () => {
    await speak(
      "Welcome to my shop! Looking for something special?",
      'merchant',
      'friendly',
      true
    );
  };

  const merchantSale = async (itemName: string) => {
    await speak(
      `Excellent choice! This ${itemName} is top quality!`,
      'merchant',
      'happy',
      true
    );
  };

  const merchantFarewell = async () => {
    await speak(
      "Come back anytime, adventurer!",
      'merchant',
      'friendly',
      true
    );
  };

  return (
    <div>
      <button onClick={merchantGreeting}>Talk to Merchant</button>
      <button onClick={() => merchantSale(item.name)}>Buy Item</button>
      <button onClick={merchantFarewell}>Leave</button>
    </div>
  );
}
```

---

## 🎬 Step 8: Cutscenes and Story Moments

```typescript
function StoryCutscene({ storyText, characterType, emotion }) {
  const { speak, isPlaying } = useSpeech();

  useEffect(() => {
    // Auto-play story narration
    speak(storyText, characterType || 'narrator', emotion || 'neutral', true);
  }, [storyText]);

  return (
    <div className="cutscene">
      {isPlaying && (
        <div className="speaking-animation">
          🎙️ Speaking...
        </div>
      )}
      <p className="story-text">{storyText}</p>
    </div>
  );
}
```

---

## ⚡ Step 9: Preload Common Phrases

```typescript
// Preload frequently used dialogue during game initialization
useEffect(() => {
  const commonPhrases = [
    { text: "Welcome, adventurer!", characterType: 'guide' as const },
    { text: "You died!", characterType: 'narrator' as const, emotion: 'sad' as const },
    { text: "Victory!", characterType: 'narrator' as const, emotion: 'happy' as const },
    { text: "What would you like to buy?", characterType: 'merchant' as const },
  ];

  speechService.preloadBatch(commonPhrases);
}, []);
```

---

## 🎮 Step 10: Complete Game Integration

Here's a complete example integrating speech into your game loop:

```typescript
function GameEngine() {
  const { speak } = useSpeech();
  const { narrate } = useNarrator();
  const [gameState, setGameState] = useState<GameState>();

  // Narrate room on entry
  useEffect(() => {
    if (gameState?.currentRoom) {
      const room = gameState.rooms.get(gameState.currentRoomId);
      if (room && !room.visited) {
        narrate(room.description, 'mysterious');
      }
    }
  }, [gameState?.currentRoomId]);

  // Handle NPC interaction
  const handleObjectInteraction = async (obj: GameObject) => {
    const archetype: CharacterArchetype =
      obj.type === 'npc' ? 'guide' :
      obj.type === 'enemy' ? 'enemy' :
      'narrator';

    // Speak the interaction text
    await speak(obj.interactionText, archetype);

    // Start battle if enemy
    if (obj.type === 'enemy') {
      await speak(
        "Prepare for battle!",
        'narrator',
        'heroic',
        true
      );
    }
  };

  // Handle dialogue choice
  const handleChoice = async (choice: any) => {
    // Player speaks their choice
    await speak(choice.text, 'hero', 'neutral');

    // Wait, then narrate result
    setTimeout(async () => {
      await narrate(choice.result);
    }, 1500);
  };

  return (
    <div className="game-container">
      <VoiceControls compact />

      {/* Game UI */}
      <div className="game-view">
        {/* Room and objects */}
        {gameState?.currentRoom?.objects.map(obj => (
          <div key={obj.id} onClick={() => handleObjectInteraction(obj)}>
            {obj.sprite}
          </div>
        ))}
      </div>

      {/* Dialogue choices */}
      <div className="choices">
        {choices.map(choice => (
          <button key={choice.id} onClick={() => handleChoice(choice)}>
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔧 Advanced: Character-Specific Voices

Register custom voices for important NPCs:

```typescript
import { voiceProfileManager } from './services/voiceProfiles';

// Register a unique voice for the final boss
voiceProfileManager.registerCharacterVoice({
  characterId: 'final-boss',
  characterName: 'Dark Lord Malthor',
  archetype: 'villain',
  voiceProfile: {
    model: 'dia-tts',
    speed: 0.8,
    pitch: -0.4,
    emotion: 'menacing',
    description: 'Deep, booming voice with ancient power and malice',
  },
  emotionOverrides: {
    angry: {
      model: 'dia-tts',
      speed: 1.2,
      pitch: -0.2,
      emotion: 'angry',
      description: 'Furious, explosive rage',
    },
  },
});

// Use the custom voice
const boss = findNPC('final-boss');
const profile = voiceProfileManager.getCharacterVoice(boss.id, 'menacing');
await generateSpeech(boss.dialogue, profile);
```

---

## 📊 Performance Optimization

```typescript
// Preload upcoming dialogue during loading screens
function LoadingScreen({ nextRoomId }) {
  const { preloadBatch } = usePreloadSpeech();

  useEffect(() => {
    // Fetch next room data
    const nextRoom = getRoom(nextRoomId);

    // Preload all dialogue from next room
    const speeches = nextRoom.objects.map(obj => ({
      text: obj.interactionText,
      characterType: inferArchetype(obj.type),
    }));

    preloadBatch(speeches);
  }, [nextRoomId]);

  return <div>Loading...</div>;
}
```

---

## 🎯 Testing Voice Speech

```typescript
// Test component for voice system
function VoiceTester() {
  const { speak } = useSpeech();

  const testVoices = async () => {
    await speak("I am a hero!", 'hero', 'heroic');
    await new Promise(r => setTimeout(r, 2000));

    await speak("Muhaha! Fear me!", 'villain', 'menacing');
    await new Promise(r => setTimeout(r, 2000));

    await speak("Best prices in town!", 'merchant', 'happy');
  };

  return (
    <button onClick={testVoices}>
      Test All Voices
    </button>
  );
}
```

---

## ✅ Integration Checklist

- [ ] Add `VITE_FAL_KEY` to `.env.local`
- [ ] Import voice hooks in components
- [ ] Add VoiceControls to UI
- [ ] Add speech to NPC interactions
- [ ] Add narrator for room descriptions
- [ ] Add speech to battle system
- [ ] Add speech to dialogue choices
- [ ] Preload common phrases
- [ ] Test with different character types
- [ ] Adjust voice settings for your game
- [ ] Monitor cache stats and performance

---

## 🎉 You're Done!

Your characters can now speak! Players will hear:
- **NPCs** talking when interacted with
- **Enemies** taunting in battle
- **Merchants** greeting customers
- **Narration** for room descriptions
- **Dialogue** choices spoken aloud

Enjoy your immersive audio experience! 🎮🔊

---

## 🆘 Need Help?

Check the logs in browser console:
- `[FalTTS]` - TTS generation logs
- `[SpeechService]` - Playback logs
- `[SpeechCache]` - Cache operations

See [VOICE_SPEECH_GUIDE.md](./VOICE_SPEECH_GUIDE.md) for full API documentation.
