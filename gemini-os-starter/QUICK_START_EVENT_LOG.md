# Event Logging System - Quick Start

## What Is It?

A system that **remembers everything you do** in the game and **influences how NPCs and the story respond** to you.

## How Does It Help?

✅ **NPCs remember you** - Talk to an NPC twice, they'll remember the first conversation  
✅ **Choices matter** - Being violent vs. merciful affects future encounters  
✅ **Story continuity** - Past events influence new content generation  
✅ **Item callbacks** - NPCs notice items you're carrying  
✅ **Reputation** - Build a reputation through your actions  

## Quick Access (Browser Console)

Open browser DevTools (F12) and type:

```javascript
// View recent events
window.eventLogger.getEventsSummary()

// See what AI knows about you
window.eventLogger.getContextForAI()

// Export your session
window.eventLogger.exportToJSON()
```

## Download Your Event Log

```javascript
const log = window.eventLogger.exportToJSON();
const blob = new Blob([log], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'my_adventure.json';
a.click();
```

## What Gets Tracked?

- Rooms you enter
- NPCs you talk to
- Enemies you fight
- Choices you make
- Items you find
- Dialogue options
- Combat actions
- Level ups

## Example Impact

### Without Event Log:
```
You: *talks to merchant*
Merchant: "Welcome, stranger. What do you need?"
```

### With Event Log (after defeating a dragon):
```
You: *talks to merchant*
Merchant: "The dragonslayer! I heard about your victory. 
          Let me offer you my finest wares at a discount."
```

## How to Reset

Click **"Begin a New Adventure"** - this clears the event log and starts fresh.

## Storage

- Events saved to your browser's localStorage
- Survives page refresh
- Persists until you start a new game
- No server needed

## Need More Info?

- **Full Documentation**: See `EVENT_LOG_USAGE.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Code**: Check `services/eventLogger.ts`

## Technical Limits

- **100 events** kept in memory
- **20 most recent events** sent to AI for context
- Stored in browser localStorage (5-10MB typical limit)

## Pro Tips

1. **Check context before key interactions**: See what the AI knows about you
2. **Export after major story beats**: Save your adventure as JSON
3. **Review your choices**: Use `getEventsSummary()` to see your playstyle
4. **Track your reputation**: Watch how NPCs react to your history

Enjoy your adventure with persistent memory! 🎮✨
