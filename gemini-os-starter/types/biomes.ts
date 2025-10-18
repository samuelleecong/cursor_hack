/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BiomeDefinition {
  name: string;
  baseTile: string;
  pathTile: string;
  obstacleTiles: string[];
  colors: {
    base: string;
    path: string;
    obstacles: string[];
  };
  atmosphere: string;
}

export interface BiomeLibrary {
  [biomeKey: string]: BiomeDefinition;
}

export interface BiomeProgression {
  progression: string[]; // Array of biome keys for each room
  generatedAt: number;
}
