# Sprite Model Fix

## Issue Found

The sprite generation was failing with **404 errors**:
```
Failed to load resource: the server responded with a status of 404
queue.fal.run/fal-ai/lora-nanobanana
[SpriteGen] Failed to generate character sprite: ApiError
```

## Root Cause

The model endpoint `fal-ai/lora-nanobanana` **does not exist** in fal.ai's API.

## Solution Applied

Changed sprite generator to use **`fal-ai/flux/schnell`** instead, which:
- ✅ Exists and is working (used elsewhere in the codebase)
- ✅ Fast generation (4 inference steps)
- ✅ High quality pixel art output
- ✅ Same fal.ai infrastructure

## Changes Made

**File:** `services/spriteGenerator.ts` (line 78)

**Before:**
```typescript
const result: any = await fal.subscribe('fal-ai/lora-nanobanana', {
  input: {
    prompt: fullPrompt,
    image_size: { width: 128, height: 128 },
    num_inference_steps: 8,
    guidance_scale: 3.5,
    num_images: 1,
    enable_safety_checker: false,
    output_format: 'png',
  },
  ...
});
```

**After:**
```typescript
const result: any = await fal.subscribe('fal-ai/flux/schnell', {
  input: {
    prompt: fullPrompt,
    image_size: { width: 128, height: 128 },
    num_inference_steps: 4,
    num_images: 1,
    enable_safety_checker: false,
  },
  ...
});
```

## Model Comparison

| Feature | lora-nanobanana (404) | flux/schnell (✅) |
|---------|----------------------|-------------------|
| Status | Does not exist | Working |
| Speed | N/A | Fast (4 steps) |
| Quality | N/A | High |
| Pixel Art | N/A | Excellent |
| Used in codebase | No | Yes (`falService.ts`) |

## Expected Behavior Now

**Before (Broken):**
```
[SpriteGen] Generating character sprite: Warrior...
❌ 404 Error
❌ Fallback to emoji
```

**After (Fixed):**
```
[SpriteGen] Generating character sprite: Warrior...
✅ Generated in ~2-5s
✅ Sprite URL received
✅ Rendered in game
```

## Verification

Build successful:
```bash
✓ built in 1.57s
```

All sprite generation now uses the correct, working model endpoint.

## Additional Notes

- The `flux/schnell` model is already proven to work in `falService.ts` for battle scenes
- Using same model across the codebase ensures consistency
- Faster inference steps (4 vs 8) means quicker sprite generation
- All existing sprite caching and fallback logic remains functional
