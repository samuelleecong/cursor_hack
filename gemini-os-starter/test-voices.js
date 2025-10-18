/**
 * Quick test to verify which ElevenLabs voices work with turbo-v2.5
 */

import { fal } from "@fal-ai/client";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const envLocalPath = join(__dirname, '.env.local');
  const envConfig = dotenv.parse(readFileSync(envLocalPath));
  process.env = { ...process.env, ...envConfig };
} catch (error) {
  console.error('Could not load .env.local');
  process.exit(1);
}

fal.config({ credentials: process.env.VITE_FAL_KEY });

const voicesToTest = [
  'Josh',     // Used for narrator
  'Callum',   // Used for hero/warrior
  'Adam',     // Used for villain
  'Charlie',  // Used for merchant
  'Bella',    // Used for guide
  'Sam',      // Used for enemy
  'Glinda',   // Used for mystic
  'George',   // Used for scholar
  'Rachel',   // Default
];

console.log('Testing which voices work with turbo-v2.5...\n');

async function testVoice(voiceName) {
  try {
    const result = await fal.subscribe("fal-ai/elevenlabs/tts/turbo-v2.5", {
      input: {
        text: `Testing ${voiceName} voice`,
        voice: voiceName,
        stability: 0.5,
        similarity_boost: 0.75,
        speed: 1.0,
      },
      logs: false,
    });
    console.log(`✅ ${voiceName.padEnd(10)} - WORKS`);
    return true;
  } catch (error) {
    console.log(`❌ ${voiceName.padEnd(10)} - FAILED:`, error.message.substring(0, 50));
    return false;
  }
}

async function runTests() {
  const results = [];

  for (const voice of voicesToTest) {
    const works = await testVoice(voice);
    results.push({ voice, works });
  }

  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));
  const working = results.filter(r => r.works);
  const failing = results.filter(r => !r.works);

  console.log(`\nWorking voices (${working.length}):`);
  working.forEach(r => console.log(`  ✅ ${r.voice}`));

  if (failing.length > 0) {
    console.log(`\nFailing voices (${failing.length}):`);
    failing.forEach(r => console.log(`  ❌ ${r.voice}`));
    console.log('\n⚠️  PROBLEM: Some voices used in game are not supported!');
    console.log('   You need to update voiceProfiles.ts to use only working voices.');
  } else {
    console.log('\n✅ All voices work!');
  }
}

runTests().catch(console.error);
