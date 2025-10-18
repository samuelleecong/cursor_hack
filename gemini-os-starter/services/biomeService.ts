/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeDefinition, BiomeLibrary } from '../types/biomes';
import { generateBiomeWithAI } from './geminiService';

const CUSTOM_BIOMES_KEY = 'gemini-os-custom-biomes';

let biomeCache: BiomeLibrary | null = null;

/**
 * Load biomes from both the static library and localStorage custom biomes
 */
async function loadBiomeLibrary(): Promise<BiomeLibrary> {
  // Load base library from public/biomes.json
  const response = await fetch('/biomes.json');
  const baseLibrary: BiomeLibrary = await response.json();

  // Load custom biomes from localStorage
  const customBiomesJson = localStorage.getItem(CUSTOM_BIOMES_KEY);
  const customBiomes: BiomeLibrary = customBiomesJson ? JSON.parse(customBiomesJson) : {};

  // Merge both libraries (custom biomes can override base ones)
  return { ...baseLibrary, ...customBiomes };
}

/**
 * Get a biome by key, loading library if needed
 */
export async function getBiome(biomeKey: string): Promise<BiomeDefinition | null> {
  // Load library if not cached
  if (!biomeCache) {
    console.log('[BiomeService] Loading biome library...');
    biomeCache = await loadBiomeLibrary();
    console.log(`[BiomeService] Loaded ${Object.keys(biomeCache).length} biomes`);
  }

  const normalizedKey = biomeKey.toLowerCase().replace(/\s+/g, '');
  return biomeCache[normalizedKey] || null;
}

/**
 * Get or generate a biome - if it doesn't exist, create it with AI and save it
 */
export async function getOrGenerateBiome(
  biomeKey: string,
  storyContext: string | null
): Promise<BiomeDefinition> {
  // Try to get existing biome
  const existing = await getBiome(biomeKey);
  if (existing) {
    console.log(`[BiomeService] Using existing biome: ${biomeKey}`);
    return existing;
  }

  // Generate new biome with AI
  console.log(`[BiomeService] Biome "${biomeKey}" not found, generating with AI...`);
  const newBiome = await generateBiomeWithAI(biomeKey, storyContext || '');

  // Save to localStorage
  await saveBiome(biomeKey, newBiome);

  return newBiome;
}

/**
 * Save a new biome to localStorage
 */
export async function saveBiome(biomeKey: string, biome: BiomeDefinition): Promise<void> {
  const normalizedKey = biomeKey.toLowerCase().replace(/\s+/g, '');

  // Load existing custom biomes
  const customBiomesJson = localStorage.getItem(CUSTOM_BIOMES_KEY);
  const customBiomes: BiomeLibrary = customBiomesJson ? JSON.parse(customBiomesJson) : {};

  // Add new biome
  customBiomes[normalizedKey] = biome;

  // Save back to localStorage
  localStorage.setItem(CUSTOM_BIOMES_KEY, JSON.stringify(customBiomes));

  // Update cache
  if (biomeCache) {
    biomeCache[normalizedKey] = biome;
  }

  console.log(`[BiomeService] Saved new biome: ${normalizedKey}`);
}

/**
 * Get all available biome keys
 */
export async function getAllBiomeKeys(): Promise<string[]> {
  if (!biomeCache) {
    biomeCache = await loadBiomeLibrary();
  }
  return Object.keys(biomeCache);
}

/**
 * Clear custom biomes (useful for debugging)
 */
export function clearCustomBiomes(): void {
  localStorage.removeItem(CUSTOM_BIOMES_KEY);
  biomeCache = null;
  console.log('[BiomeService] Cleared custom biomes');
}

/**
 * Get statistics about the biome library
 */
export async function getBiomeStats(): Promise<{ total: number; custom: number; base: number }> {
  const baseResponse = await fetch('/biomes.json');
  const baseLibrary: BiomeLibrary = await baseResponse.json();
  const baseCount = Object.keys(baseLibrary).length;

  const customBiomesJson = localStorage.getItem(CUSTOM_BIOMES_KEY);
  const customBiomes: BiomeLibrary = customBiomesJson ? JSON.parse(customBiomesJson) : {};
  const customCount = Object.keys(customBiomes).length;

  return {
    total: baseCount + customCount,
    base: baseCount,
    custom: customCount,
  };
}
