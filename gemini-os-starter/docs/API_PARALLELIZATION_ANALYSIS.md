# API Parallelization Analysis

## Overview
Analysis of current API request patterns and opportunities for parallelization to improve performance.

## Current State

### ✅ **Already Parallelized**

1. **multiRoomGenerator.ts:198**
   ```typescript
   const roomBases = await Promise.all(
     roomIds.map((roomId, idx) => generateRoom(...))
   );
   ```
   - Generates multiple rooms in parallel
   - Good pattern ✅

2. **falService.ts:258**
   ```typescript
   return Promise.all(promises);
   ```
   - Generates multiple images in parallel
   - Good pattern ✅

3. **roomSpriteEnhancer.ts:116**
   ```typescript
   await Promise.allSettled(spriteUrls.map(url => preloadSpriteImage(url)));
   ```
   - Preloads images in parallel
   - Good pattern ✅

### ⚠️ **Sequential Patterns (Opportunities)**

#### 1. **Scene Generation (HIGH IMPACT)**
**File:** `sceneImageGenerator.ts:311-312`

**Current (Sequential):**
```typescript
const currentScene = await generateSingleRoomScene(currentRoomParams);
const nextScene = await generateSingleRoomScene(nextRoomParams);
```

**Issue:** Two independent scene generations happening sequentially
**Impact:** ~2x time for scene generation fallback
**Potential:** Can be parallelized ✅

---

#### 2. **Sprite Enhancement Loop (MEDIUM-HIGH IMPACT)**
**File:** `roomSpriteEnhancer.ts:37-99`

**Current (Sequential):**
```typescript
for (const obj of room.objects) {
  if (obj.type === 'enemy') {
    const enemyDescription = await generateEnemyDescription(...);
    const sprite = await generateEnemySprite(...);
  } else if (obj.type === 'npc') {
    const npcDescription = await generateNPCDescription(...);
    const sprite = await generateNPCSprite(...);
  }
  // ...
}
```

**Issues:**
1. Loop processes objects sequentially (not in parallel)
2. Within each iteration, description + sprite are sequential

**Impact:** For 3 objects, time = 3 × (description_time + sprite_time)
**Potential:** Can be parallelized to ~(description_time + sprite_time) ✅

---

#### 3. **Class Generation Retry (LOW IMPACT)**
**File:** `classGenerator.ts:330-344`

**Current (Sequential):**
```typescript
for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  const result = await attemptClassGeneration(prompt, model, attempt);
  if (result) return result;
  await new Promise(resolve => setTimeout(resolve, delay));
}
```

**Issue:** Retries with exponential backoff (intentionally sequential)
**Impact:** Only affects error cases
**Potential:** Should NOT be parallelized (retry pattern is correct) ❌

---

## Parallelization Strategy

### Google Gemini API Limits

According to Gemini API documentation:
- **Rate Limits:** Varies by model
  - `gemini-2.5-flash-lite`: 15 requests/min
  - `gemini-2.5-flash`: 15 requests/min
  - `gemini-2.5-pro`: 2 requests/min
- **Concurrent Requests:** Supported (no explicit batch API needed)
- **Best Practice:** Use Promise.all() for independent requests

### Recommended Changes

#### Priority 1: Scene Generation (HIGH)
**Estimated Speed Improvement:** 50% reduction in fallback scene generation time

```typescript
// Before
const currentScene = await generateSingleRoomScene(currentRoomParams);
const nextScene = await generateSingleRoomScene(nextRoomParams);

// After
const [currentScene, nextScene] = await Promise.all([
  generateSingleRoomScene(currentRoomParams),
  generateSingleRoomScene(nextRoomParams)
]);
```

#### Priority 2: Sprite Enhancement (HIGH)
**Estimated Speed Improvement:** 70-80% reduction for rooms with multiple objects

```typescript
// Before
for (const obj of room.objects) {
  const description = await generateDescription(...);
  const sprite = await generateSprite(...);
  enhancedObjects.push({ ...obj, spriteUrl: sprite.url });
}

// After
const enhancedObjects = await Promise.all(
  room.objects.map(async (obj) => {
    if (obj.spriteUrl) return obj;

    try {
      const description = await generateDescription(...);
      const sprite = await generateSprite(...);
      return { ...obj, spriteUrl: sprite.url };
    } catch (error) {
      console.error('Sprite generation failed:', error);
      return obj; // Return without sprite
    }
  })
);
```

### Considerations

#### Rate Limiting
- **Current:** Sequential calls naturally respect rate limits
- **Parallel:** Need to consider burst requests
- **Solution:** Current limits are generous enough (15 req/min) for typical usage

#### Error Handling
- **Sequential:** Easy to track which specific call failed
- **Parallel:** Use `Promise.allSettled()` to continue even if some fail
- **Solution:** Wrap each parallel call in try-catch

#### API Costs
- **No change:** Same number of requests, just faster
- Parallelization doesn't increase API usage

## Implementation Plan

### Phase 1: Scene Generation (Quick Win) ✅
1. Update `sceneImageGenerator.ts:311-312`
2. Use `Promise.all()` for independent scene generation
3. Test with 2-3 room scenarios

### Phase 2: Sprite Enhancement (Bigger Impact) ✅
1. Refactor `roomSpriteEnhancer.ts` loop
2. Use `Promise.all()` with `.map()`
3. Update error handling to use `Promise.allSettled()`
4. Test with rooms containing multiple objects

### Phase 3: Monitor & Optimize
1. Add performance timing logs
2. Monitor rate limit hits
3. Consider adding request queue if needed

## Performance Estimates

### Before Parallelization
- **Scene generation (2 scenes):** ~4-6 seconds
- **Sprite enhancement (3 objects):** ~9-15 seconds
- **Total for typical room:** ~13-21 seconds

### After Parallelization
- **Scene generation (2 scenes):** ~2-3 seconds (50% faster)
- **Sprite enhancement (3 objects):** ~3-5 seconds (70% faster)
- **Total for typical room:** ~5-8 seconds (60% improvement)

## Code Patterns

### ✅ Good Pattern: Promise.all() for Independent Operations
```typescript
const [result1, result2, result3] = await Promise.all([
  asyncOperation1(),
  asyncOperation2(),
  asyncOperation3()
]);
```

### ✅ Good Pattern: Promise.allSettled() for Optional Operations
```typescript
const results = await Promise.allSettled([
  optionalOperation1(),
  optionalOperation2()
]);

results.forEach((result, i) => {
  if (result.status === 'fulfilled') {
    console.log(`Operation ${i} succeeded:`, result.value);
  } else {
    console.error(`Operation ${i} failed:`, result.reason);
  }
});
```

### ❌ Anti-pattern: Awaiting in Loops
```typescript
// Slow - sequential
for (const item of items) {
  const result = await processItem(item);
  results.push(result);
}

// Fast - parallel
const results = await Promise.all(
  items.map(item => processItem(item))
);
```

## Monitoring

### Add Performance Metrics
```typescript
const startTime = performance.now();
const results = await Promise.all([/* operations */]);
const duration = performance.now() - startTime;
console.log(`[Perf] Parallel operations completed in ${duration}ms`);
```

### Track Rate Limits
```typescript
let requestCount = 0;
const resetInterval = 60000; // 1 minute

setInterval(() => {
  console.log(`[RateLimit] ${requestCount} requests in last minute`);
  requestCount = 0;
}, resetInterval);
```

## Conclusion

✅ **Parallelization is possible and beneficial**
- Gemini API supports concurrent requests
- Significant performance improvements possible (50-70%)
- No API cost increase
- Requires careful error handling

**Recommended:** Implement Phase 1 & 2 for immediate performance gains

---

**Status:** Ready for Implementation
**Risk Level:** Low (independent operations)
**Expected Gain:** 50-70% performance improvement
