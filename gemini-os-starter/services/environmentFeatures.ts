/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */
import {EnvironmentalFeatureType} from '../types';

const FEATURE_KEYWORDS: Array<{feature: EnvironmentalFeatureType; keywords: string[]}> = [
  {
    feature: 'water',
    keywords: ['river', 'stream', 'waterfall', 'lake', 'pond', 'marsh', 'swamp', 'bog', 'shore', 'ocean', 'sea'],
  },
  {
    feature: 'ruins',
    keywords: ['ruin', 'ruins', 'temple', 'altar', 'statue', 'pillar', 'columns', 'ancient stone', 'monolith', 'catacomb'],
  },
  {
    feature: 'flora',
    keywords: ['mushroom', 'fungi', 'fungus', 'flower', 'blossom', 'bloom', 'vines', 'overgrown', 'grove', 'foliage'],
  },
  {
    feature: 'arcane',
    keywords: ['arcane', 'rune', 'sigil', 'glyph', 'magic circle', 'enchanted', 'crystal', 'glow', 'ethereal'],
  },
];

export function extractEnvironmentalFeatures(
  ...sources: Array<string | undefined | null>
): EnvironmentalFeatureType[] {
  const normalized = sources.filter(Boolean).join(' ').toLowerCase();
  if (!normalized) return [];

  const found = new Set<EnvironmentalFeatureType>();

  FEATURE_KEYWORDS.forEach(({feature, keywords}) => {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      found.add(feature);
    }
  });

  return Array.from(found);
}
