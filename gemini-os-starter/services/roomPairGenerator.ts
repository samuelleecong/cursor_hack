/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import { Room, StoryMode } from '../types';
import { generateRoom } from './roomGenerator';
import { generateScenePanorama } from './sceneImageGenerator';

/**
 * Generate a pair of rooms (current + next) with panoramic scene generation
 * This ensures visual continuity by generating both scenes together
 */
export async function generateRoomPair(
  currentRoomId: string,
  nextRoomId: string,
  storySeed: number,
  currentRoomNumber: number,
  nextRoomNumber: number,
  currentBiomeKey: string,
  nextBiomeKey: string,
  storyContext?: string | null,
  storyMode?: StoryMode,
  previousRoomDescription?: string
): Promise<{ currentRoom: Room; nextRoom: Room }> {
  console.log(`[RoomPairGen] Generating room pair: ${currentRoomId} + ${nextRoomId}`);

  // Generate both rooms WITHOUT scene images first (just tile maps and objects)
  const [currentRoomBase, nextRoomBase] = await Promise.all([
    generateRoom(
      currentRoomId,
      storySeed,
      currentRoomNumber,
      currentBiomeKey,
      storyContext,
      storyMode,
      previousRoomDescription,
      false // Don't generate scene yet
    ),
    generateRoom(
      nextRoomId,
      storySeed,
      nextRoomNumber,
      nextBiomeKey,
      storyContext,
      storyMode,
      undefined,
      false // Don't generate scene yet
    ),
  ]);

  // Now generate panorama scene using both tile maps as reference
  try {
    console.log(`[RoomPairGen] Generating panorama scene for both rooms...`);

    const { currentScene, nextScene } = await generateScenePanorama(
      {
        roomId: currentRoomId,
        roomNumber: currentRoomNumber,
        biome: currentRoomBase.tileMap!.biome,
        description: currentRoomBase.description,
        objects: currentRoomBase.objects,
        storyContext,
        storyMode,
        previousRoomDescription,
        tileMap: currentRoomBase.tileMap,
      },
      {
        roomId: nextRoomId,
        roomNumber: nextRoomNumber,
        biome: nextRoomBase.tileMap!.biome,
        description: nextRoomBase.description,
        objects: nextRoomBase.objects,
        storyContext,
        storyMode,
        previousRoomDescription: currentRoomBase.description,
        tileMap: nextRoomBase.tileMap,
      }
    );

    // Attach scene images to rooms
    currentRoomBase.sceneImage = currentScene;
    currentRoomBase.sceneImageLoading = false;

    nextRoomBase.sceneImage = nextScene;
    nextRoomBase.sceneImageLoading = false;

    console.log(`[RoomPairGen] Room pair generated successfully with panorama scenes`);
    console.log(`[RoomPairGen] Current room scene attached: ${currentScene.substring(0, 50)}...`);
    console.log(`[RoomPairGen] Next room scene attached: ${nextScene.substring(0, 50)}...`);

    return {
      currentRoom: currentRoomBase,
      nextRoom: nextRoomBase,
    };
  } catch (error) {
    console.error(`[RoomPairGen] Failed to generate panorama scenes:`, error);

    // Return rooms without scenes (will use tile fallback)
    return {
      currentRoom: currentRoomBase,
      nextRoom: nextRoomBase,
    };
  }
}
