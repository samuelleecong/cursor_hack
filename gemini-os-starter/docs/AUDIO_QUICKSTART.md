# 🎵 Audio System Quick Start

## ✅ Installation Complete!

Your game now has **adaptive AI-generated music** powered by fal.ai!

## 🚀 How to Use

### 1. Set Your API Key

Make sure `VITE_FAL_KEY` is in your `.env.local`:

```bash
VITE_FAL_KEY=47f84acc-025a-469c-bb57-d2b315f6cfeb:62e47f16812e38af21abce9c56fd7e60
```

✅ Already configured!

### 2. Run the Game

```bash
npm run dev
```

### 3. Experience Adaptive Music

🎮 **In-Game Controls** (bottom-right corner):
- Click the 🎵 button to toggle music on/off
- Adjust volume with the slider
- See what's currently playing

## 🎼 What Happens Automatically

| Event | Music Response |
|-------|----------------|
| 🚶 Enter a new room | Generates contextual exploration music (CassetteAI, ~2s) |
| ⚔️ Battle starts | Epic battle music (Stable Audio 2.5, ~5s) |
| 🎭 Story moment | Cinematic music (MiniMax, ~10s) |
| 💀 Player dies | Somber defeat music |

## 🧠 Smart Features

### Story-Aware Music
- **Your Story:** "cyberpunk city in the rain"
- **Generated Music:** Futuristic synth, electronic beats, noir atmosphere

### Player State Adaptation
- **High HP:** Confident, exploratory music
- **Low HP:** Tense, urgent music

### Choice Consequences
- **Violent choices:** Aggressive undertones
- **Merciful choices:** Gentle, compassionate themes

## 💾 Performance

- **Caching:** Up to 20 tracks cached (LRU eviction)
- **Crossfading:** Smooth 2-second transitions
- **Looping:** Room/battle music loops automatically

## 📊 Expected Costs

With smart caching (~60% hit rate):
- **Light usage:** ~$3-5/month
- **Heavy usage:** ~$10-15/month

## 🐛 Troubleshooting

### Music Not Playing?

1. **Check API Key:**
   ```bash
   # Make sure VITE_FAL_KEY is set
   cat .env.local | grep VITE_FAL_KEY
   ```

2. **Check Console:**
   Open browser dev tools (F12) and look for:
   ```
   [FalAudio] Client initialized successfully
   [AudioService] Generating room music...
   ```

3. **Check Music Controls:**
   Click the 🎵 button in bottom-right to ensure music is enabled

### First Track Takes Longer?

✅ Normal! First generation has no cache. Subsequent similar rooms/battles will be instant.

### Want to Disable Music?

Click the floating 🎵 button, or edit `AudioManager.tsx` to set default to `false`.

## 📖 Full Documentation

See [MUSIC_SYSTEM.md](./MUSIC_SYSTEM.md) for complete details on:
- Architecture
- Customization
- API usage
- Cost optimization
- Advanced features

## 🎯 Quick Test

1. Start game: `npm run dev`
2. Enter a story like: "A dark fantasy castle with ancient magic"
3. Choose a character
4. **Listen!** Music should start within 2-10 seconds
5. Move between rooms - notice music changes
6. Start a battle - epic music kicks in!
7. Adjust volume using the floating controls

## 🎊 That's It!

Your game now has a fully adaptive, story-aware soundtrack. Enjoy! 🎮🎵

---

**Questions?** Check the [MUSIC_SYSTEM.md](./MUSIC_SYSTEM.md) documentation.

**Issues?** Look for `[FalAudio]`, `[AudioService]`, or `[AudioCache]` logs in the browser console.
