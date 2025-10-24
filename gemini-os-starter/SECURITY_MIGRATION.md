# 🔒 Security Migration Guide: Securing FAL API Key

## Problem

Your FAL API key is currently **exposed in the browser** because:
- `VITE_FAL_KEY` is bundled into client JavaScript
- Anyone can extract it from DevTools or network requests
- This allows unauthorized usage and potential abuse

## Solution

Move FAL API calls to a **backend proxy** that keeps your key secure.

---

## Migration Steps

### 1. Install Vercel CLI (if deploying to Vercel)

```bash
npm install -g vercel
```

### 2. Update Environment Variables

#### Local Development (.env.local)
```bash
# Remove the VITE_ prefix!
FAL_KEY=your_fal_api_key_here

# Keep Gemini key (it's used client-side for orchestration)
GEMINI_API_KEY=your_gemini_api_key_here
```

#### Vercel Production (Dashboard)
1. Go to vercel.com → Your Project → Settings → Environment Variables
2. Add: `FAL_KEY` = `your_fal_api_key_here`
3. Save

### 3. Run Local Development Server

The Vercel dev server will run both your Vite app AND the serverless function:

```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# Run development server (replaces npm run dev)
vercel dev
```

This starts:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3000/api/fal-proxy

### 4. Migrate Your Services

Replace direct `fal.subscribe()` calls with `falProxySubscribe()`:

#### Before (INSECURE ❌):
```typescript
import * as fal from '@fal-ai/serverless-client';

fal.config({
  credentials: import.meta.env.VITE_FAL_KEY, // EXPOSED!
});

const result = await fal.subscribe('cassetteai/music-generator', {
  input: { prompt, duration },
});
```

#### After (SECURE ✅):
```typescript
import { falProxySubscribe } from './falProxyClient';

const result = await falProxySubscribe('cassetteai/music-generator', {
  input: { prompt, duration },
  logs: true,
});
```

### 5. Update Each Service File

Files to migrate:
- ✅ `services/falAudioClient.ts` → Use `services/falAudioClient.secure.ts` as reference
- `services/falService.ts` (image generation)
- `services/spriteGenerator.ts` (sprites)
- `services/falTTSClient.ts` (voice narration)
- `services/sceneComposer.ts` (scene composition)

### 6. Deploy to Vercel

```bash
# Link your project (first time only)
vercel link

# Deploy to production
vercel --prod
```

Vercel will automatically:
- Deploy your React frontend
- Deploy the `/api/fal-proxy` serverless function
- Use the `FAL_KEY` environment variable from dashboard

---

## Testing

### Local Testing
```bash
# Start Vercel dev server
vercel dev

# In another terminal, test the proxy
curl -X POST http://localhost:3000/api/fal-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "cassetteai/music-generator",
    "input": {
      "prompt": "epic fantasy battle music",
      "duration": 15
    },
    "logs": true
  }'
```

### Production Testing
After deploying, check browser DevTools:
- ❌ You should NOT see `VITE_FAL_KEY` anywhere
- ✅ You should see requests to `/api/fal-proxy`
- ✅ The actual FAL key is hidden on the backend

---

## Security Benefits

✅ **API key never exposed to browser**
✅ **Rate limiting possible** (add to proxy)
✅ **Request logging** (track usage)
✅ **IP-based restrictions** (optional)
✅ **Cost control** (add usage limits)

---

## Rollback Plan

If you need to rollback temporarily:

1. Revert to old services (keep `.secure.ts` files as backup)
2. Re-add `VITE_FAL_KEY` to `.env.local`
3. Deploy without the `/api` folder

---

## Alternative: Netlify Functions

If you're deploying to Netlify instead of Vercel:

1. Move `api/fal-proxy.ts` to `netlify/functions/fal-proxy.ts`
2. Update imports to use Netlify handler format
3. Set `FAL_KEY` in Netlify dashboard

```typescript
// netlify/functions/fal-proxy.ts
import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  // Same logic as Vercel version
};
```

---

## Questions?

- Check Vercel docs: https://vercel.com/docs/functions
- FAL API docs: https://fal.ai/docs
- Contact: rohan@storyforge.ai
