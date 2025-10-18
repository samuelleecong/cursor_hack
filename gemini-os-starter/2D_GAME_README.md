# 🎮 2D AI-Powered Roguelike RPG

A **proper 2D roguelike game** with character movement, procedurally generated rooms, and AI-driven story encounters powered by Google's Gemini AI.

## 🎯 What Makes This Different?

This is NOT just a text-based choice game. This is a **real 2D game** where you:
- **Move your character** using WASD or Arrow keys
- **Explore rooms** visually on a canvas-based 2D world
- **Discover objects** (enemies 👹, NPCs 🧙, items 💎) placed in the game world
- **Transition between screens** by walking to the edge
- **Trigger AI-generated encounters** by interacting with objects (press SPACE)

## 🕹️ How to Play

### Setup
```bash
npm install
npm run dev
```
Make sure your `GEMINI_API_KEY` is set in `.env.local`

### Controls
- **WASD / Arrow Keys** - Move your character
- **SPACE** - Interact with nearby objects (shows "SPACE" prompt when close)
- **Walk to screen edge** - Enter a new procedurally generated room
- **Click choices** - In AI dialog windows, click to make decisions

### Game Flow

1. **Character Selection**
   - Choose from 5 character classes (Warrior, Mage, Thief, Cleric, Ranger)
   - Each character has unique stats and gets class-specific story encounters

2. **Exploration**
   - You spawn in a 2D room with a grid-based world
   - Move your character freely using keyboard
   - See objects placed around the room (enemies, NPCs, items)
   - Walk to the RIGHT EDGE to progress to a new room

3. **Room Transitions**
   - Each time you exit a screen, a **new room is generated**
   - Rooms contain procedurally placed:
     - **Enemies** 👹👻🧟 - Combat encounters
     - **NPCs** 🧙👨🧝 - Dialogue and quests
     - **Items** 💎🗝️📦 - Treasures and discoveries
     - **Exit** 🚪 - Portal to next area (right side)

4. **Object Interactions**
   - Walk near any object (enemy, NPC, item)
   - Press **SPACE** when you see the prompt
   - AI generates a unique story encounter based on:
     - Object type (combat for enemies, dialogue for NPCs, etc.)
     - Your character class
     - Previous interactions
     - Story seed (for consistency)

5. **AI Story Encounters**
   - A dialog window appears with the AI-generated encounter
   - Read the narrative description
   - Choose from 2-4 action buttons
   - Consequences affect your HP, story progression, and can lead to death

6. **Death & Restart**
   - When HP reaches 0 (or you make fatal choices), you die
   - Game Over screen appears
   - Restart to play with a **NEW story seed** = different rooms and encounters

## 🎨 Visual Features

### 2D Canvas Rendering
- **800x600 pixel game world**
- Grid-based floor design
- Character sprites (emoji-based)
- Object sprites with shadows
- Player glow effect (class color)
- Interaction prompts

### Room Types
Rooms are procedurally generated with themes:
- **Combat rooms** ⚔️ - Multiple enemies
- **Peaceful rooms** 🌿 - NPCs and rest areas
- **Treasure rooms** ✨ - Items and loot
- **Puzzle rooms** 🧩 - Mysterious artifacts
- **Mixed rooms** 🌍 - Combination of elements

### Character Classes (Visual Differences)
Each character has a unique color glow:
- **Warrior** ⚔️ - Red glow
- **Mage** 🔮 - Purple glow
- **Thief** 🗡️ - Green glow
- **Cleric** ✨ - Yellow glow
- **Ranger** 🏹 - Cyan glow

## 🤖 AI Integration

### When AI Generates Content
1. **Object Interactions** - When you press SPACE near an object
2. **Follow-up Choices** - When you click action buttons in encounters
3. **Consequences** - AI narrates results of your decisions

### What AI Knows
- Your character class
- Current HP
- Story seed (for narrative consistency)
- Interaction history (what you've done before)
- Object type you're interacting with

### AI-Generated Elements
- **Encounter descriptions** - What happens when you interact
- **Action choices** - 2-4 buttons with different options
- **Consequences** - Combat results, dialogue outcomes, item effects
- **Death scenarios** - When you fail critically

## 🎲 Roguelike Features

✅ **Permadeath** - Death resets the game
✅ **Procedural Generation** - Rooms are generated on-the-fly
✅ **Story Seed System** - Each playthrough has a unique seed
✅ **No Backtracking** - Forward progression only
✅ **Character Variety** - 5 different classes with unique playstyles
✅ **Infinite Rooms** - Keep exploring as long as you survive

## 🏗️ Technical Architecture

### Components
- **GameCanvas.tsx** - 2D canvas renderer with game loop
- **CharacterSelection.tsx** - Character class picker
- **GameHUD.tsx** - HP bar and character info display
- **GeneratedContent.tsx** - AI dialog renderer

### Services
- **geminiService.ts** - AI story generation API
- **roomGenerator.ts** - Procedural room/object generation

### Game State
Tracks:
- Player position (x, y coordinates)
- Current room ID
- All generated rooms (Map)
- Room counter
- Character stats
- Interaction history

### Room Generation Algorithm
```
1. Generate room based on: story seed + room number
2. Determine room type (combat, peaceful, treasure, etc.)
3. Place 1-3 objects based on room type
4. Add entrance (if not first room)
5. Add exit (right side)
6. Return room with description and objects
```

## 🎯 Key Differences from Text Version

| Feature | Old (Text-Based) | New (2D Game) |
|---------|------------------|---------------|
| **Movement** | Button clicks only | WASD/Arrow keys |
| **Exploration** | Fixed story screens | Free 2D movement |
| **World** | Text descriptions | Visual canvas |
| **Progression** | Choice-driven | Movement + choices |
| **Objects** | Described in text | Visible sprites |
| **Rooms** | Abstract concepts | Actual game areas |
| **Interaction** | Click buttons | Walk + press SPACE |

## 🚀 For Hackathon Judges

### What We Built
1. **Full 2D game engine** with canvas rendering
2. **Real-time character movement** with WASD controls
3. **Procedural room generation** algorithm
4. **AI-powered storytelling** triggered by game events
5. **Hybrid gameplay** - 2D exploration + AI narrative

### Technical Highlights
- ✅ Custom game loop with requestAnimationFrame
- ✅ Collision detection for interactions
- ✅ Screen transition system
- ✅ Procedural content generation
- ✅ Real-time AI story integration
- ✅ State management for complex game data

### Innovation
🔥 **Unique combination**: 2D roguelike exploration + AI-generated narrative encounters
🔥 **Infinite replayability**: Procedural rooms + AI stories = never the same twice
🔥 **Accessibility**: Simple controls, visual feedback, clear UI

## 🎮 Gameplay Tips

1. **Explore carefully** - Not all encounters are friendly
2. **Manage HP** - Combat can be deadly
3. **Use your class abilities** - AI gives class-specific options
4. **Read carefully** - Some choices have consequences
5. **Don't rush** - Take time to interact with NPCs for lore
6. **Try different classes** - Each plays differently

## 📈 Future Enhancements

If we had more time:
- Multiple room exit directions (up, down, left, right)
- Inventory system (collect and use items)
- Boss battles (special enemy encounters)
- Save/load system
- Mini-map display
- Sound effects and music
- Particle effects (combat, spells)
- More character animations
- Multiplayer co-op

---

**This is a real game, not just a chatbot.** Move, explore, fight, and let AI tell your story!

🎮 **Ready to adventure? Run `npm run dev` and open http://localhost:3001/**
