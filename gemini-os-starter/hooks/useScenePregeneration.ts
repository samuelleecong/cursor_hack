/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import { useEffect, useRef, useState } from 'react';
import { Room, StoryMode } from '../types';
import { generateSingleRoomScene } from '../services/sceneImageGenerator';
import { BiomeType } from '../services/mapGenerator';

export interface PregenerationOptions {
  enabled: boolean;
  currentRoomId: string;
  nextRoomId: string;
  nextRoomData?: {
    roomNumber: number;
    biome: BiomeType;
    description: string;
    objects: any[];
  };
  storyContext?: string | null;
  storyMode?: StoryMode;
  previousRoomDescription?: string;
}

export interface PregenerationState {
  isGenerating: boolean;
  generatedSceneUrl: string | null;
  error: string | null;
}

/**
 * Hook to handle pre-generation of next room's scene in the background
 */
export function useScenePregeneration(
  options: PregenerationOptions
): PregenerationState {
  const [state, setState] = useState<PregenerationState>({
    isGenerating: false,
    generatedSceneUrl: null,
    error: null,
  });

  const generationPromiseRef = useRef<Promise<string> | null>(null);
  const currentRoomIdRef = useRef<string>(options.currentRoomId);

  useEffect(() => {
    // Only trigger if enabled and we have next room data
    if (!options.enabled || !options.nextRoomData) {
      return;
    }

    // Skip if we're already generating for this room
    if (currentRoomIdRef.current === options.currentRoomId && generationPromiseRef.current) {
      return;
    }

    // Update current room ref
    currentRoomIdRef.current = options.currentRoomId;

    // Start background generation
    const generateNextScene = async () => {
      setState((prev) => ({ ...prev, isGenerating: true, error: null }));

      try {
        console.log(`[Pregeneration] Starting generation for room ${options.nextRoomId}...`);

        const sceneUrl = await generateSingleRoomScene({
          roomId: options.nextRoomId,
          roomNumber: options.nextRoomData!.roomNumber,
          biome: options.nextRoomData!.biome,
          description: options.nextRoomData!.description,
          objects: options.nextRoomData!.objects,
          storyContext: options.storyContext,
          storyMode: options.storyMode,
          previousRoomDescription: options.previousRoomDescription,
        });

        console.log(`[Pregeneration] Successfully generated scene for room ${options.nextRoomId}`);

        setState({
          isGenerating: false,
          generatedSceneUrl: sceneUrl,
          error: null,
        });

        return sceneUrl;
      } catch (error) {
        console.error(`[Pregeneration] Failed to generate scene for room ${options.nextRoomId}:`, error);

        setState({
          isGenerating: false,
          generatedSceneUrl: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        throw error;
      }
    };

    generationPromiseRef.current = generateNextScene();

    // Cleanup on unmount
    return () => {
      generationPromiseRef.current = null;
    };
  }, [
    options.enabled,
    options.currentRoomId,
    options.nextRoomId,
    options.nextRoomData,
    options.storyContext,
    options.storyMode,
    options.previousRoomDescription,
  ]);

  return state;
}

/**
 * Helper to pre-generate next room's scene and return a promise
 */
export async function pregenerateNextRoomScene(
  nextRoomId: string,
  nextRoomNumber: number,
  nextBiome: BiomeType,
  nextDescription: string,
  nextObjects: any[],
  storyContext?: string | null,
  storyMode?: StoryMode,
  previousRoomDescription?: string
): Promise<string | null> {
  try {
    console.log(`[Pregeneration] Generating scene for next room ${nextRoomId}...`);

    const sceneUrl = await generateSingleRoomScene({
      roomId: nextRoomId,
      roomNumber: nextRoomNumber,
      biome: nextBiome,
      description: nextDescription,
      objects: nextObjects,
      storyContext,
      storyMode,
      previousRoomDescription,
    });

    console.log(`[Pregeneration] Scene ready for room ${nextRoomId}`);
    return sceneUrl;
  } catch (error) {
    console.error(`[Pregeneration] Failed to generate scene for room ${nextRoomId}:`, error);
    return null;
  }
}
