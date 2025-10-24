/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */

/**
 * Centralized Gemini API client configuration
 *
 * This module provides a singleton GoogleGenAI instance and model configurations
 * to avoid duplicate initialization across services.
 */

import { GoogleGenAI } from '@google/genai';

// Model name constants for consistent usage across services
export const GEMINI_MODELS = {
  FLASH_LITE: 'gemini-2.5-flash-lite',
  FLASH: 'gemini-2.5-flash',
  PRO: 'gemini-2.5-pro',
  FLASH_EXP: 'gemini-2.0-flash-exp',
} as const;

// Check API key on module load
if (!process.env.API_KEY) {
  console.error(
    '[GeminiClient] API_KEY environment variable is not set. The application will not be able to connect to the Gemini API.'
  );
}

// Singleton GoogleGenAI instance
let aiInstance: GoogleGenAI | null = null;

// Rate limit tracking (Gemini API: 15 req/min for Flash-Lite/Flash, 2 req/min for Pro)
interface RateLimitTracker {
  requests: number[];
  limit: number;
  window: number; // milliseconds
}

const rateLimiters: { [model: string]: RateLimitTracker } = {
  [GEMINI_MODELS.FLASH_LITE]: { requests: [], limit: 15, window: 60000 },
  [GEMINI_MODELS.FLASH]: { requests: [], limit: 15, window: 60000 },
  [GEMINI_MODELS.PRO]: { requests: [], limit: 2, window: 60000 },
  [GEMINI_MODELS.FLASH_EXP]: { requests: [], limit: 15, window: 60000 },
};

/**
 * Get the singleton GoogleGenAI instance
 * @returns GoogleGenAI instance
 * @throws Error if API_KEY is not configured
 */
export function getGeminiClient(): GoogleGenAI {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY environment variable is not set');
  }

  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  return aiInstance;
}

/**
 * Check if API key is configured
 * @returns true if API_KEY is set
 */
export function isApiKeyConfigured(): boolean {
  return !!process.env.API_KEY;
}

/**
 * Get error message for missing API key
 * @returns HTML error message
 */
export function getApiKeyErrorMessage(): string {
  return `<div class="p-4 text-red-700 bg-red-100 rounded-lg">
    <p class="font-bold text-lg">Configuration Error</p>
    <p class="mt-2">The API_KEY is not configured. Please set the API_KEY environment variable.</p>
  </div>`;
}

/**
 * Track API request for rate limiting
 * Logs warnings when approaching rate limits
 * @param model - The model being used
 */
export function trackApiRequest(model: string): void {
  const tracker = rateLimiters[model];
  if (!tracker) {
    console.warn(`[GeminiClient] Unknown model for rate limiting: ${model}`);
    return;
  }

  const now = Date.now();

  // Remove requests older than the time window
  tracker.requests = tracker.requests.filter(time => now - time < tracker.window);

  // Add current request
  tracker.requests.push(now);

  // Log warnings when approaching limit
  const requestCount = tracker.requests.length;
  const percentUsed = (requestCount / tracker.limit) * 100;

  if (requestCount >= tracker.limit) {
    console.warn(`[GeminiClient] ⚠️ RATE LIMIT REACHED for ${model}: ${requestCount}/${tracker.limit} requests in last minute`);
  } else if (percentUsed >= 80) {
    console.warn(`[GeminiClient] ⚠️ Approaching rate limit for ${model}: ${requestCount}/${tracker.limit} requests (${percentUsed.toFixed(0)}%)`);
  }
}

/**
 * Check if a request would exceed rate limits
 * @param model - The model to check
 * @returns true if request is safe, false if at limit
 */
export function canMakeRequest(model: string): boolean {
  const tracker = rateLimiters[model];
  if (!tracker) return true;

  const now = Date.now();
  tracker.requests = tracker.requests.filter(time => now - time < tracker.window);

  return tracker.requests.length < tracker.limit;
}

/**
 * Get time to wait (in ms) before next request is safe
 * @param model - The model to check
 * @returns milliseconds to wait, or 0 if can proceed immediately
 */
export function getWaitTime(model: string): number {
  const tracker = rateLimiters[model];
  if (!tracker || tracker.requests.length < tracker.limit) return 0;

  const now = Date.now();
  const oldestRequest = Math.min(...tracker.requests);
  const waitTime = tracker.window - (now - oldestRequest);

  return Math.max(0, waitTime);
}

/**
 * Delay execution to respect rate limits
 * @param model - The model being used
 */
export async function waitForRateLimit(model: string): Promise<void> {
  const waitTime = getWaitTime(model);
  if (waitTime > 0) {
    console.log(`[GeminiClient] ⏳ Rate limit reached, waiting ${(waitTime / 1000).toFixed(1)}s before next request...`);
    await new Promise(resolve => setTimeout(resolve, waitTime + 100)); // Add 100ms buffer
  }
}
