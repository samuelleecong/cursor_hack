# 🎯 Click-to-Play Voice System Guide

**User-controlled speech playback - characters speak when YOU click!**

---

## 🚀 Quick Start

### 1. Simple Click Button

Add a speaker button next to any text:

```typescript
import { SpeechButton } from './components/SpeechButton';

<div>
  <SpeechButton
    text="Welcome to my shop!"
    characterType="merchant"
    emotion="friendly"
  />
  <span>Welcome to my shop!</span>
</div>
```

**Result:** 🔊 Click the button to hear the merchant speak!

---

## 🎨 Ready-to-Use Components

### 1. SpeakableText

Text with integrated speech button:

```typescript
import { SpeakableText } from './components/SpeakableText';

// Basic usage
<SpeakableText characterType="merchant" emotion="friendly">
  Welcome to my shop!
</SpeakableText>

// Custom styling
<SpeakableText
  characterType="villain"
  emotion="menacing"
  buttonPosition="right"
  buttonSize="large"
  style={{ fontSize: '18px', color: '#f44336' }}
>
  You dare challenge me?!
</SpeakableText>
```

**Visual:**
```
🔊 Welcome to my shop!
```

---

### 2. DialogueBox

Pre-styled dialogue box with speech:

```typescript
import { DialogueBox } from './components/SpeakableText';

<DialogueBox
  speaker="Mysterious Merchant"
  text="I have rare items for sale..."
  characterType="merchant"
  emotion="mysterious"
/>
```

**Visual:**
```
┌────────────────────────────────┐
│ Mysterious Merchant            │
│ 🔊 I have rare items for sale...│
└────────────────────────────────┘
```

---

### 3. NPCInteraction

Complete NPC interaction with speech:

```typescript
import { NPCInteraction } from './components/SpeakableText';

<NPCInteraction
  npc={{
    sprite: "🧙",
    type: "merchant",
    interactionText: "Welcome, traveler!"
  }}
  onClick={() => handleNPCClick()}
/>
```

**Visual:**
```
┌────────────────────────────────┐
│ 🧙  🔊 Welcome, traveler!      │
└────────────────────────────────┘
```

---

## 🎮 Integration Examples

### Example 1: Game Dialogue

```typescript
import { SpeakableText } from './components/SpeakableText';

function GameDialogue({ text, character }) {
  return (
    <div className="dialogue-container">
      <SpeakableText
        text={text}
        characterType={character.type}
        emotion={character.emotion}
        buttonPosition="left"
      >
        {text}
      </SpeakableText>
    </div>
  );
}

// Usage
<GameDialogue
  text="The dungeon grows darker..."
  character={{ type: 'narrator', emotion: 'mysterious' }}
/>
```

---

### Example 2: NPC List

```typescript
import { NPCInteraction } from './components/SpeakableText';

function NPCList({ npcs }) {
  return (
    <div className="npc-list">
      {npcs.map(npc => (
        <NPCInteraction
          key={npc.id}
          npc={npc}
          onClick={() => console.log(`Interacting with ${npc.sprite}`)}
        />
      ))}
    </div>
  );
}
```

---

### Example 3: Battle Dialogue

```typescript
import { DialogueBox, SpeechButton } from './components/SpeakableText';

function BattleDialogue({ action }) {
  return (
    <div className="battle-log">
      {/* Enemy taunt */}
      <DialogueBox
        speaker={action.enemy.name}
        text="You'll never defeat me!"
        characterType="enemy"
        emotion="angry"
      />

      {/* Player response */}
      <DialogueBox
        speaker="Hero"
        text="We'll see about that!"
        characterType="hero"
        emotion="heroic"
      />
    </div>
  );
}
```

---

### Example 4: Room Description with Clickable Narration

```typescript
import { SpeakableText } from './components/SpeakableText';

function RoomDescription({ room }) {
  return (
    <div className="room-description">
      <h3>{room.name}</h3>
      <SpeakableText
        text={room.description}
        characterType="narrator"
        emotion="mysterious"
        buttonSize="medium"
      >
        {room.description}
      </SpeakableText>
    </div>
  );
}
```

---

### Example 5: Dialogue Choices

```typescript
import { SpeakableText } from './components/SpeakableText';

function DialogueChoices({ choices, onSelect }) {
  return (
    <div className="choices">
      {choices.map(choice => (
        <button
          key={choice.id}
          onClick={() => onSelect(choice)}
          className="choice-button"
        >
          <SpeakableText
            text={choice.text}
            characterType="hero"
            buttonSize="small"
          >
            {choice.text}
          </SpeakableText>
        </button>
      ))}
    </div>
  );
}
```

---

## 🎯 Component API

### SpeechButton Props

```typescript
interface SpeechButtonProps {
  text: string;                    // Text to speak (required)
  characterType?: CharacterArchetype; // Default: 'narrator'
  emotion?: VoiceEmotion;          // Auto-detected if not provided
  size?: 'small' | 'medium' | 'large'; // Default: 'medium'
  disabled?: boolean;              // Disable button
  onSpeechStart?: () => void;      // Callback when speech starts
  onSpeechEnd?: () => void;        // Callback when speech ends
}
```

**Button States:**
- 🔊 Ready (green) - Click to play
- ⏳ Generating (disabled) - Creating speech
- ⏹️ Playing (red) - Click to stop

---

### SpeakableText Props

```typescript
interface SpeakableTextProps {
  children: React.ReactNode;       // Text content
  text?: string;                   // Override text for speech
  characterType?: CharacterArchetype;
  emotion?: VoiceEmotion;
  showButton?: boolean;            // Default: true
  buttonPosition?: 'left' | 'right'; // Default: 'left'
  buttonSize?: 'small' | 'medium' | 'large';
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}
```

---

### DialogueBox Props

```typescript
interface DialogueBoxProps {
  speaker?: string;                // Optional speaker name
  text: string;                    // Dialogue text
  characterType?: CharacterArchetype;
  emotion?: VoiceEmotion;
}
```

---

### NPCInteraction Props

```typescript
interface NPCInteractionProps {
  npc: {
    sprite: string;                // Emoji/icon
    type: string;                  // NPC type
    interactionText: string;       // What they say
  };
  onClick?: () => void;            // Click handler
}
```

---

## 🎨 Styling & Customization

### Custom Button Styles

```typescript
<SpeechButton
  text="Custom styled button"
  characterType="hero"
  style={{
    backgroundColor: '#2196F3',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
  }}
  size="large"
/>
```

### Custom Text Styles

```typescript
<SpeakableText
  characterType="mystic"
  emotion="mysterious"
  style={{
    fontSize: '20px',
    fontStyle: 'italic',
    color: '#9C27B0',
    padding: '12px',
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    borderRadius: '8px',
  }}
>
  Ancient wisdom awaits...
</SpeakableText>
```

---

## 💡 Usage Patterns

### Pattern 1: Hover to Show Button

```typescript
function HoverSpeakText({ text, characterType }) {
  const [showButton, setShowButton] = useState(false);

  return (
    <div
      onMouseEnter={() => setShowButton(true)}
      onMouseLeave={() => setShowButton(false)}
    >
      <SpeakableText
        text={text}
        characterType={characterType}
        showButton={showButton}
      >
        {text}
      </SpeakableText>
    </div>
  );
}
```

### Pattern 2: Auto-speak First Time, Then Manual

```typescript
function AutoFirstThenManual({ text, characterType }) {
  const [hasPlayed, setHasPlayed] = useState(false);
  const { speak } = useSpeech();

  useEffect(() => {
    if (!hasPlayed) {
      speak(text, characterType);
      setHasPlayed(true);
    }
  }, []);

  return (
    <SpeakableText text={text} characterType={characterType}>
      {text}
    </SpeakableText>
  );
}
```

### Pattern 3: Batch Buttons with Shared State

```typescript
function NPCConversation({ lines }) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  return (
    <div>
      {lines.map((line, index) => (
        <SpeakableText
          key={index}
          text={line.text}
          characterType={line.characterType}
          onSpeechStart={() => setPlayingIndex(index)}
          onSpeechEnd={() => setPlayingIndex(null)}
          style={{
            opacity: playingIndex === null || playingIndex === index ? 1 : 0.5,
          }}
        >
          {line.text}
        </SpeakableText>
      ))}
    </div>
  );
}
```

---

## 🔧 Advanced: Programmatic Control

You can still control speech programmatically while using click-to-play UI:

```typescript
import { speechService } from './services/speechService';
import { SpeakableText } from './components/SpeakableText';

function MixedControl() {
  const handleSpecialEvent = async () => {
    // Programmatically trigger speech
    await speechService.speak("Important event!", 'narrator', 'surprised', true);
  };

  return (
    <div>
      {/* User-controlled */}
      <SpeakableText characterType="guide">
        Click me to hear this
      </SpeakableText>

      {/* Program-controlled */}
      <button onClick={handleSpecialEvent}>
        Trigger Alert
      </button>
    </div>
  );
}
```

---

## 📊 User Experience Benefits

✅ **User Control** - Players choose when to hear audio
✅ **Visual Feedback** - Clear indicators show what's speakable
✅ **No Audio Spam** - Prevents unwanted audio interruptions
✅ **Accessibility** - Users can read OR listen
✅ **Mobile Friendly** - Works great on touch devices
✅ **Performance** - Audio generated only when requested

---

## 🎯 Best Practices

### DO ✅
- Show speech buttons on important dialogue
- Use appropriate character types for voices
- Provide visual feedback during generation/playback
- Let users see text before hearing it
- Cache frequently used phrases

### DON'T ❌
- Auto-play speech without user consent (unless opt-in)
- Hide the speech button on hover-only
- Block UI while generating speech
- Play multiple speeches simultaneously
- Remove text when speech is playing

---

## 🎮 Complete Game Example

```typescript
import { SpeakableText, DialogueBox, NPCInteraction } from './components/SpeakableText';

function GameUI({ gameState }) {
  return (
    <div className="game">
      {/* Room description */}
      <div className="room">
        <SpeakableText
          text={gameState.currentRoom.description}
          characterType="narrator"
          emotion="mysterious"
        >
          {gameState.currentRoom.description}
        </SpeakableText>
      </div>

      {/* NPCs in room */}
      <div className="npcs">
        {gameState.currentRoom.npcs.map(npc => (
          <NPCInteraction
            key={npc.id}
            npc={npc}
            onClick={() => handleNPCClick(npc)}
          />
        ))}
      </div>

      {/* Active dialogue */}
      {gameState.activeDialogue && (
        <DialogueBox
          speaker={gameState.activeDialogue.speaker}
          text={gameState.activeDialogue.text}
          characterType={gameState.activeDialogue.characterType}
          emotion={gameState.activeDialogue.emotion}
        />
      )}

      {/* Dialogue choices */}
      {gameState.choices && (
        <div className="choices">
          {gameState.choices.map(choice => (
            <button key={choice.id} onClick={() => selectChoice(choice)}>
              <SpeakableText
                text={choice.text}
                characterType="hero"
                buttonSize="small"
              >
                {choice.text}
              </SpeakableText>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🔗 Related Documentation

- [VOICE_QUICKSTART.md](./VOICE_QUICKSTART.md) - Basic setup
- [VOICE_SPEECH_GUIDE.md](./VOICE_SPEECH_GUIDE.md) - Complete API
- [INTEGRATION_EXAMPLE.md](./INTEGRATION_EXAMPLE.md) - Detailed examples

---

**Click-to-play gives users full control while adding immersive voice to your game! 🎯🔊**
