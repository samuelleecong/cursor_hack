# 🎯 Click-to-Play Voice System

**Give users full control - speech plays when THEY click!**

---

## 🎮 What This Does

Instead of auto-playing speech, this system lets users **click speaker icons** to hear dialogue:

```
🔊 Welcome to my shop!
```

Click the 🔊 button → Hear "Welcome to my shop!" in merchant voice!

---

## ⚡ 3-Step Quick Start

### 1. Add Voice Controls

```typescript
import { VoiceControls } from './components/VoiceControls';

<VoiceControls compact />  // In your header
```

### 2. Make Text Speakable

```typescript
import { SpeakableText } from './components/SpeakableText';

<SpeakableText characterType="merchant" emotion="friendly">
  Welcome to my shop!
</SpeakableText>
```

### 3. That's It!

Users now see: **🔊 Welcome to my shop!**

Click 🔊 = hear speech!

---

## 🎨 Ready-to-Use Components

### SpeechButton
Just the button:
```typescript
import { SpeechButton } from './components/SpeechButton';

<SpeechButton
  text="Hello!"
  characterType="hero"
  size="medium"
/>
```

### SpeakableText
Text + button combined:
```typescript
import { SpeakableText } from './components/SpeakableText';

<SpeakableText characterType="narrator" emotion="mysterious">
  A dark dungeon appears before you...
</SpeakableText>
```

### DialogueBox
Styled dialogue with speech:
```typescript
import { DialogueBox } from './components/SpeakableText';

<DialogueBox
  speaker="Mysterious Stranger"
  text="I know your secret..."
  characterType="mystic"
  emotion="mysterious"
/>
```

### NPCInteraction
Complete NPC component:
```typescript
import { NPCInteraction } from './components/SpeakableText';

<NPCInteraction
  npc={{
    sprite: "🧙",
    type: "merchant",
    interactionText: "Best prices in town!"
  }}
  onClick={handleClick}
/>
```

---

## 🎯 Usage Examples

### Example 1: Room Description

```typescript
<SpeakableText
  text={room.description}
  characterType="narrator"
  emotion="mysterious"
>
  {room.description}
</SpeakableText>
```

### Example 2: NPC Dialogue

```typescript
{npcs.map(npc => (
  <NPCInteraction
    key={npc.id}
    npc={npc}
    onClick={() => interact(npc)}
  />
))}
```

### Example 3: Dialogue Choices

```typescript
{choices.map(choice => (
  <button onClick={() => select(choice)}>
    <SpeakableText text={choice.text} characterType="hero">
      {choice.text}
    </SpeakableText>
  </button>
))}
```

### Example 4: Battle Actions

```typescript
{battleLog.map(action => (
  <SpeakableText
    text={action.text}
    characterType={action.actor === 'player' ? 'hero' : 'enemy'}
    emotion="angry"
  >
    {action.text}
  </SpeakableText>
))}
```

---

## 🎨 Visual States

### Button States

| Icon | State | Action |
|------|-------|--------|
| 🔊 | Ready (green) | Click to play |
| ⏳ | Generating | Wait... |
| ⏹️ | Playing (red) | Click to stop |

### Size Options

```typescript
size="small"   // 24px button
size="medium"  // 32px button (default)
size="large"   // 40px button
```

### Position Options

```typescript
buttonPosition="left"   // 🔊 Text
buttonPosition="right"  // Text 🔊
```

---

## 🔧 Customization

### Custom Styling

```typescript
<SpeakableText
  characterType="villain"
  emotion="menacing"
  style={{
    fontSize: '20px',
    color: '#f44336',
    fontWeight: 'bold',
    padding: '12px',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: '8px',
  }}
>
  You will regret this!
</SpeakableText>
```

### Custom Button

```typescript
<SpeechButton
  text="Custom button"
  characterType="hero"
  size="large"
  style={{
    backgroundColor: '#2196F3',
    borderRadius: '8px',
  }}
/>
```

### Callbacks

```typescript
<SpeakableText
  text="Important message"
  characterType="narrator"
  onSpeechStart={() => console.log('Started!')}
  onSpeechEnd={() => console.log('Finished!')}
>
  Important message
</SpeakableText>
```

---

## 📱 Integration Patterns

### Pattern 1: Hover to Reveal

```typescript
const [showButton, setShowButton] = useState(false);

<div
  onMouseEnter={() => setShowButton(true)}
  onMouseLeave={() => setShowButton(false)}
>
  <SpeakableText showButton={showButton}>
    Hover to see speech button
  </SpeakableText>
</div>
```

### Pattern 2: Toggle All Speech Buttons

```typescript
const [speechEnabled, setSpeechEnabled] = useState(true);

<button onClick={() => setSpeechEnabled(!speechEnabled)}>
  Toggle Speech: {speechEnabled ? 'ON' : 'OFF'}
</button>

{dialogues.map(d => (
  <SpeakableText showButton={speechEnabled}>
    {d.text}
  </SpeakableText>
))}
```

### Pattern 3: Auto-play Important, Click for Rest

```typescript
function ImportantMessage({ text, isImportant }) {
  const { speak } = useSpeech();

  useEffect(() => {
    if (isImportant) {
      speak(text, 'narrator', 'surprised', true);
    }
  }, [text, isImportant]);

  return (
    <SpeakableText
      text={text}
      showButton={!isImportant}
    >
      {text}
    </SpeakableText>
  );
}
```

---

## 🎮 Complete Game Example

See [APP_INTEGRATION_EXAMPLE.tsx](./APP_INTEGRATION_EXAMPLE.tsx) for a complete working example!

Quick preview:

```typescript
import {
  SpeakableText,
  DialogueBox,
  NPCInteraction
} from './components/SpeakableText';
import { VoiceControls } from './components/VoiceControls';

function Game() {
  return (
    <div>
      {/* Header */}
      <VoiceControls compact />

      {/* Room description */}
      <SpeakableText
        text={room.description}
        characterType="narrator"
      >
        {room.description}
      </SpeakableText>

      {/* NPCs */}
      {npcs.map(npc => (
        <NPCInteraction
          npc={npc}
          onClick={handleInteract}
        />
      ))}

      {/* AI response */}
      <DialogueBox
        speaker="Narrator"
        text={aiResponse}
        characterType="narrator"
      />
    </div>
  );
}
```

---

## ✅ Benefits

✨ **User Control** - Players choose when to hear audio
🎯 **No Audio Spam** - Speech only when clicked
👁️ **Visual Feedback** - Clear indicators & states
♿ **Accessible** - Read OR listen, user's choice
📱 **Mobile Friendly** - Works on touch devices
⚡ **Performance** - Generates only when needed

---

## 🎓 Learn More

- **Quick Setup**: [VOICE_QUICKSTART.md](./VOICE_QUICKSTART.md)
- **Full Guide**: [CLICK_TO_PLAY_GUIDE.md](./CLICK_TO_PLAY_GUIDE.md)
- **API Reference**: [VOICE_SPEECH_GUIDE.md](./VOICE_SPEECH_GUIDE.md)
- **Examples**: [APP_INTEGRATION_EXAMPLE.tsx](./APP_INTEGRATION_EXAMPLE.tsx)

---

## 🔗 Component API Summary

```typescript
// Just the button
<SpeechButton text="..." characterType="..." />

// Text with button
<SpeakableText characterType="...">Text</SpeakableText>

// Styled dialogue box
<DialogueBox speaker="..." text="..." characterType="..." />

// Complete NPC component
<NPCInteraction npc={{...}} onClick={...} />

// Voice settings panel
<VoiceControls compact />
```

---

**Click-to-play = better UX + user control! 🎯✨**

Start with [VOICE_QUICKSTART.md](./VOICE_QUICKSTART.md) to get going in 5 minutes!
