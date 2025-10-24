# 🚀 Quick Start: Secure FAL API Setup

## Current Status: ⚠️ API Key Exposed

Your `VITE_FAL_KEY` is **visible in the browser**. Follow these steps to secure it:

---

## 5-Minute Setup

### 1. Update `.env.local`

```bash
# Change this:
VITE_FAL_KEY=your_key_here

# To this:
FAL_KEY=your_key_here
```

### 2. Install Vercel CLI

```bash
npm install -g vercel
```

### 3. Run Development Server

```bash
# Instead of: npm run dev
# Use this:
vercel dev
```

Your app will now route FAL requests through `/api/fal-proxy` (secure backend).

### 4. Test It Works

1. Open http://localhost:3000
2. Generate a room or sprite
3. Check browser DevTools → Network tab
4. You should see requests to `/api/fal-proxy` (not directly to fal.ai)
5. Your API key is NOT visible anywhere ✅

---

## Deploy to Production

### Option A: Vercel (Recommended)

```bash
# First time setup
vercel

# Future deployments
vercel --prod
```

**Important:** Add `FAL_KEY` to Vercel dashboard:
1. Go to vercel.com → Your Project → Settings
2. Environment Variables → Add Variable
3. Name: `FAL_KEY`, Value: `your_fal_api_key_here`

### Option B: Other Platforms

See `SECURITY_MIGRATION.md` for Netlify/AWS/custom backend options.

---

## What Changed?

### Before (INSECURE ❌)
```
Browser → fal.ai (with exposed API key)
```

### After (SECURE ✅)
```
Browser → Your Backend Proxy → fal.ai (key hidden)
```

---

## Files Created

- ✅ `api/fal-proxy.ts` - Serverless function (backend)
- ✅ `services/falProxyClient.ts` - Secure client (frontend)
- ✅ `services/falAudioClient.secure.ts` - Example migration
- ✅ `vercel.json` - Deployment config
- ✅ `SECURITY_MIGRATION.md` - Full migration guide

---

## Next Steps

1. Migrate remaining services (see `SECURITY_MIGRATION.md`)
2. Remove `VITE_FAL_KEY` from all code
3. Deploy to production
4. Verify key is no longer exposed (check DevTools)

---

## Need Help?

Check the full guide: `SECURITY_MIGRATION.md`
