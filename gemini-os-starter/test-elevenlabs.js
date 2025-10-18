/**
 * Test script for fal.ai ElevenLabs TTS
 * Run with: node test-elevenlabs.js
 *
 * Make sure you have VITE_FAL_KEY in your .env.local file
 */

import { fal } from "@fal-ai/client";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Load .env.local manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const envLocalPath = join(__dirname, '.env.local');
  const envConfig = dotenv.parse(readFileSync(envLocalPath));
  process.env = { ...process.env, ...envConfig };
  console.log('✅ Loaded .env.local');
} catch (error) {
  console.error('❌ Could not load .env.local:', error.message);
  process.exit(1);
}

const FAL_KEY = process.env.VITE_FAL_KEY;

if (!FAL_KEY) {
  console.error('❌ VITE_FAL_KEY not found in .env.local');
  console.error('   Add VITE_FAL_KEY=your_key_here to .env.local');
  process.exit(1);
}

console.log('✅ FAL_KEY found:', FAL_KEY.substring(0, 10) + '...');

// Configure fal client
fal.config({
  credentials: FAL_KEY,
});

console.log('\n🧪 Testing ElevenLabs TTS endpoints...\n');

/**
 * Test 1: Turbo v2.5 (fastest)
 */
async function testTurboV25() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 1: ElevenLabs Turbo v2.5');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const startTime = Date.now();

    const result = await fal.subscribe("fal-ai/elevenlabs/tts/turbo-v2.5", {
      input: {
        text: "Hello! This is a test of the turbo voice system.",
        voice: "Aria", // Default voice
        stability: 0.5,
        similarity_boost: 0.75,
        speed: 1.0,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log('   Status:', update.status);
        }
      },
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('✅ Success!');
    console.log('   Duration:', duration + 's');
    console.log('   Response structure:', JSON.stringify(result, null, 2));
    console.log('');

    return result;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    console.error('   Full error:', error);
    console.log('');
    return null;
  }
}

/**
 * Test 2: Multilingual v2 (high quality)
 */
async function testMultilingualV2() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 2: ElevenLabs Multilingual v2');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const startTime = Date.now();

    const result = await fal.subscribe("fal-ai/elevenlabs/tts/multilingual-v2", {
      input: {
        text: "Welcome, brave warrior. Your quest begins now.",
        voice: "Adam", // Deep voice
        stability: 0.7,
        similarity_boost: 0.75,
        speed: 0.95,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log('   Status:', update.status);
        }
      },
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('✅ Success!');
    console.log('   Duration:', duration + 's');
    console.log('   Response structure:', JSON.stringify(result, null, 2));
    console.log('');

    return result;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    console.error('   Full error:', error);
    console.log('');
    return null;
  }
}

/**
 * Test 3: Streaming API
 */
async function testStreaming() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 3: Streaming API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const startTime = Date.now();

    const stream = await fal.stream("fal-ai/elevenlabs/tts/turbo-v2.5", {
      input: {
        text: "Testing streaming response. Can you hear me?",
        voice: "Charlie",
        stability: 0.5,
        similarity_boost: 0.75,
        speed: 1.0,
      },
    });

    console.log('   Streaming events:');
    let eventCount = 0;
    for await (const event of stream) {
      eventCount++;
      console.log(`   Event ${eventCount}:`, event);
    }

    const result = await stream.done();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('✅ Success!');
    console.log('   Duration:', duration + 's');
    console.log('   Events received:', eventCount);
    console.log('   Final result:', JSON.stringify(result, null, 2));
    console.log('');

    return result;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    console.error('   Full error:', error);
    console.log('');
    return null;
  }
}

/**
 * Test available voices
 */
async function testDifferentVoices() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 4: Different Voices');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const voicesToTest = ['Aria', 'Adam', 'Charlie', 'Rachel', 'Callum'];
  const results = [];

  for (const voice of voicesToTest) {
    console.log(`\n   Testing voice: ${voice}`);
    try {
      const result = await fal.subscribe("fal-ai/elevenlabs/tts/turbo-v2.5", {
        input: {
          text: `Hello, I am ${voice}.`,
          voice: voice,
          stability: 0.5,
          similarity_boost: 0.75,
          speed: 1.0,
        },
        logs: false,
      });

      console.log(`   ✅ ${voice} works!`);
      results.push({ voice, success: true, result });
    } catch (error) {
      console.log(`   ❌ ${voice} failed:`, error.message);
      results.push({ voice, success: false, error: error.message });
    }
  }

  console.log('\n   Summary:');
  results.forEach(r => {
    console.log(`   - ${r.voice}: ${r.success ? '✅ Works' : '❌ Failed'}`);
  });
  console.log('');

  return results;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting ElevenLabs TTS Tests\n');

  const test1 = await testTurboV25();
  const test2 = await testMultilingualV2();
  const test3 = await testStreaming();
  const test4 = await testDifferentVoices();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Test Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 1 (Turbo v2.5):      ', test1 ? '✅ Passed' : '❌ Failed');
  console.log('Test 2 (Multilingual v2): ', test2 ? '✅ Passed' : '❌ Failed');
  console.log('Test 3 (Streaming):       ', test3 ? '✅ Passed' : '❌ Failed');
  console.log('Test 4 (Voice variants):  ', test4.filter(r => r.success).length + '/' + test4.length + ' voices work');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (test1 || test2) {
    console.log('✅ At least one endpoint works!');
    console.log('   Use the successful endpoint in your code.\n');
  } else {
    console.log('❌ All tests failed. Check your FAL_KEY and internet connection.\n');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
