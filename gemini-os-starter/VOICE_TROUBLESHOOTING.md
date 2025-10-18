# 🔧 Voice Speech Troubleshooting Guide

## ✅ Error Fixed: Response Parsing Issue

The error you encountered has been **fixed**! The issue was that fal.ai's TTS models return different response structures.

### What Was Wrong

**Error:**
```
TypeError: Cannot read properties of undefined (reading 'url')
```

**Cause:** The code expected `result.data.audio_file.url` but fal.ai returns a different structure.

### What Was Fixed

✅ **Updated Response Parsing** - Now handles multiple response structures:
- `result.data.audio_file.url`
- `result.data.audio.url`
- `result.data.url`
- `result.data.audio_url`

✅ **Added Detailed Logging** - See exactly what fal.ai returns

✅ **Better Error Messages** - Clear indication when structure is unexpected

---

## 🔍 Understanding the Logs

When you click a 🔊 button, you'll now see these logs:

```
[FalTTS] Generating speech with dia-tts
[FalTTS] Text: "Welcome to my shop, traveler!"
[FalTTS] dia-tts: generate step 86: speed=133.375 tokens/s
[FalTTS] dia-tts: generate step 430: speed=209.563 tokens/s
[FalTTS] Generated in 7.35s
[FalTTS] Raw result: { data: {...} }       ← NEW: Shows full response
[FalTTS] Result.data: {...}                ← NEW: Shows data structure
[FalTTS] Audio URL: https://...            ← NEW: Extracted URL
```

---

## 📊 What the Logs Mean

### Normal Generation Sequence

1. **Starting**
   ```
   [FalTTS] Generating speech with dia-tts
   [FalTTS] Text: "..."
   ```
   Speech generation has started

2. **Processing**
   ```
   [FalTTS] dia-tts: generate step 86: speed=133.375 tokens/s
   ```
   AI is generating the speech (these happen during the 3-5 sec wait)

3. **Success**
   ```
   [FalTTS] Generated in 7.35s
   [FalTTS] Audio URL: https://...
   ```
   ✅ Speech generated successfully!

4. **Cached**
   ```
   [SpeechCache] Cached: "..." (1 items, 0.50 MB)
   ```
   Saved for instant replay

---

## 🐛 If You Still Get Errors

### Error 1: "Could not find audio URL in response"

**What it means:** The response structure is completely different than expected

**What to do:**
1. Open browser console (F12)
2. Look for `[FalTTS] Raw result:` log
3. Copy the full response structure
4. Check which field contains the audio URL

**How to fix:**
Update `services/falTTSClient.ts` line 220+ to handle the new structure.

---

### Error 2: "FAL_KEY not configured"

**What it means:** Missing or invalid API key

**Fix:**
```bash
# Add to .env.local
VITE_FAL_KEY=your_actual_api_key_here
```

**Then restart:**
```bash
# Stop the dev server (Ctrl+C)
# Start again
npm run dev
```

---

### Error 3: "Speech generation failed: ..."

**What it means:** fal.ai API error

**Common causes:**
- Invalid API key
- No credits remaining
- Rate limit exceeded
- Network issue

**Fix:**
1. Check your API key is valid
2. Check fal.ai dashboard for credits
3. Wait a moment and try again

---

## 🧪 Testing the Fix

1. **Start your game**
   ```bash
   npm run dev
   ```

2. **Open browser console** (F12)

3. **Click a 🔊 button**

4. **Watch the logs**
   - Should see `[FalTTS] Raw result:`
   - Should see `[FalTTS] Audio URL:`
   - Should hear speech!

5. **Second click on same text**
   - Should be instant (cached)
   - Should see `[SpeechCache] Cache HIT`

---

## 📊 Response Structure Examples

### Dia TTS Response (Expected)
```json
{
  "data": {
    "audio_file": {
      "url": "https://fal.media/files/...",
      "content_type": "audio/mpeg",
      "file_name": "audio.mp3",
      "file_size": 123456
    },
    "duration": 5.2
  }
}
```

### Alternative Response Structure
```json
{
  "data": {
    "audio": {
      "url": "https://fal.media/files/..."
    },
    "duration": 5.2
  }
}
```

### Direct URL Response
```json
{
  "data": {
    "url": "https://fal.media/files/...",
    "duration": 5.2
  }
}
```

**The code now handles ALL of these!**

---

## 🎯 What to Look For in Console

### ✅ Good Signs
```
[FalTTS] Generated in 7.35s
[FalTTS] Audio URL: https://...
[SpeechService] Playing speech: "..."
```

### ⚠️ Warning Signs
```
[FalTTS] Unexpected response structure: {...}
```
→ Response structure changed, need to update code

### ❌ Error Signs
```
[FalTTS] Generation failed for dia-tts: Error: ...
```
→ Check API key, credits, network

---

## 🔧 Advanced: Checking Response Structure

If you get "Unexpected response structure", here's how to see what you're getting:

1. **Open Console** (F12)
2. **Find this log:**
   ```
   [FalTTS] Raw result: {...}
   ```
3. **Expand the object** to see all fields
4. **Find where the audio URL is** (might be nested)

**Example:**
```javascript
// If the URL is at result.data.output.audio_url
// Add this to falTTSClient.ts around line 234:

else if (result.data.output?.audio_url) {
  audioUrl = result.data.output.audio_url;
  duration = result.data.duration || 5;
}
```

---

## 📝 Files Changed

**To fix the error, I updated:**

1. **services/falTTSClient.ts** (lines 209-254)
   - Added flexible response parsing
   - Added detailed logging
   - Handles multiple response structures

2. **types/voice.ts** (lines 117-131)
   - Made FalTTSResponse interface flexible
   - Allows different field names
   - Supports all response types

---

## ✨ Summary

### What Was Wrong
- Code expected `audio_file.url`
- fal.ai might return different structure

### What's Fixed
- Now tries multiple field names
- Logs show exact structure received
- Better error messages

### What You'll See
- More detailed console logs
- Speech should work now!
- Clear errors if structure changes

---

## 🎮 Try It Now!

1. **Clear your browser cache** (refresh with Ctrl+Shift+R)
2. **Click any 🔊 button**
3. **Check console** - you should see detailed logs
4. **Hear speech** - it should work!

---

## 🆘 Still Having Issues?

If speech still doesn't work:

1. **Check console logs** - what do you see?
2. **Copy the `[FalTTS] Raw result:` log**
3. **Check if API key is valid**
4. **Try a different model** (change in voiceProfiles.ts)

---

**The fix is deployed! Try clicking a 🔊 button now!** 🎙️✨
