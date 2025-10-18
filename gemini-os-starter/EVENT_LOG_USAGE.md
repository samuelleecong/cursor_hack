# Event Logging System

## Overview

The game now includes a persistent event logging system that tracks all player actions, NPC interactions, combat, and choices throughout the game session. This system:

1. **Persists events** to browser localStorage
2. **Influences AI responses** - NPCs remember past interactions and the AI generates contextually aware narrative
3. **Maintains continuity** across game sessions

## How It Works

### Logged Events

The following event types are tracked:

- `room_entered` - When player enters a new room
- `battle_start` - Combat initiated with an enemy
- `battle_end` - Combat concluded (victory)
- `combat` - Combat action taken during AI dialogue
- `npc_interaction` - Player interacts with an NPC
- `dialogue` - Player engages in dialogue
- `loot` - Player finds or collects loot
- `item_acquired` - Specific item added to inventory
- `choice` - Player makes a significant story choice
- `levelup` - Player gains a level
- `death` - Player character dies

### Event Data Structure

Each event includes:
```typescript
{
  id: string;              // Unique identifier
  timestamp: number;       // When the event occurred
  type: string;           // Event type (see above)
  roomId: string;         // Which room it happened in
  playerLevel: number;    // Player level at the time
  playerHP: number;       // Player HP at the time
  description: string;    // Human-readable description
  details?: {             // Additional event-specific data
    npcId?: string;
    npcName?: string;
    enemyName?: string;
    itemName?: string;
    choiceText?: string;
    damageDealt?: number;
    xpGained?: number;
    // ... and more
  }
}
```

### AI Integration

The event log creates contextual summaries that are automatically included in AI prompts:

- **Recent Combat**: Last battles fought and enemies defeated
- **NPC Memory**: NPCs you've previously encountered
- **Choice History**: Your recent decisions and their moral alignments
- **Loot Trail**: Items you've acquired
- **Journey Stats**: Rooms explored, current level and HP

This means:
- NPCs will reference past conversations
- The AI generates consequences based on your choices
- Story continuity is maintained across interactions
- Your reputation/playstyle influences future encounters

## Accessing Event Data

### In Browser Console

During gameplay, open browser console and use:

```javascript
// Get the event logger service
const logger = window.eventLogger;

// View recent events (last 20 by default)
console.log(logger.getRecentEvents());

// Get a human-readable summary
console.log(logger.getEventsSummary());

// Get the AI context being sent
console.log(logger.getContextForAI());

// Export full session as JSON
console.log(logger.exportToJSON());

// Download the log
const log = logger.exportToJSON();
const blob = new Blob([log], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'event_log.json';
a.click();
```

### Programmatic Access

The event logger is imported in `App.tsx` and automatically:
- Initializes when you select a character
- Logs events as they happen
- Persists to localStorage after each event
- Provides context to AI on every interaction

## Storage

- Events are stored in browser **localStorage** under the key `gemini_os_event_log`
- The most recent **100 events** are kept in memory
- Only the last **20 events** are used for AI context (to avoid token limits)
- Data persists across page refreshes within the same browser session
- Calling "Begin a New Adventure" clears the event log

## Example Use Cases

### 1. NPC Memory
**Without event log:**
> Guard: "Who are you, stranger?"

**With event log (you defeated a dragon earlier):**
> Guard: "You're the one who slayed the dragon! Please, come in!"

### 2. Choice Consequences
**After making violent choices:**
> Merchant: "I've heard about your brutal methods. I don't want trouble..."

**After making diplomatic choices:**
> Merchant: "Ah, the peaceful negotiator! Let me offer you a special deal."

### 3. Item References
**Without event log:**
> NPC: "Do you have healing supplies?"

**With event log (you found a healing potion earlier):**
> NPC: "I see you have a healing potion. Perhaps you could share?"

## Developer Notes

### Adding New Event Types

To log a new event type:

```typescript
import { eventLogger } from './services/eventLogger';

eventLogger.logEvent(
  'your_event_type',
  currentRoomId,
  playerLevel,
  playerHP,
  'Human readable description',
  {
    customField1: 'value',
    customField2: 123
  }
);
```

### Customizing AI Context

Edit `services/eventLogger.ts` → `getContextForAI()` method to change how event history is formatted for AI prompts.

### Adjusting History Length

Change constants in `services/eventLogger.ts`:
- `MAX_EVENTS_IN_MEMORY` - How many events to keep (default: 100)
- `MAX_EVENTS_FOR_CONTEXT` - How many to send to AI (default: 20)

## Future Enhancements

Potential additions:
- Server-side persistence for cross-device play
- Analytics dashboard showing playstyle patterns
- Achievements based on event history
- Replay system to review past sessions
- Export to other formats (CSV, markdown timeline)
