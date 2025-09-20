#!/usr/bin/env node

/**
 * Test file path support for reference images
 */

import { GeminiProvider } from '../dist/providers/gemini-provider.js';
import { OpenRouterProvider } from '../dist/providers/openrouter-provider.js';
import { saveImages } from '../dist/utils.js';
import { Jimp } from 'jimp';
import * as fs from 'fs/promises';
import * as path from 'path';

// Create a test image first
async function createTestImage() {
  const testDir = './test-images';
  await fs.mkdir(testDir, { recursive: true });

  const imagePath = path.join(testDir, 'test-reference.png');

  // Create a simple test image
  const image = new Jimp({ width: 512, height: 512, color: 0xFFFFFFFF });

  // Add gradient for visual interest
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const r = Math.floor((x / 512) * 255);
      const g = Math.floor((y / 512) * 255);
      const b = 128;
      const color = ((r & 0xFF) << 24) | ((g & 0xFF) << 16) | ((b & 0xFF) << 8) | 0xFF;
      image.setPixelColor(color >>> 0, x, y);
    }
  }

  // Add text
  await image.write(imagePath);
  console.log(`✓ Created test image: ${imagePath}`);

  return imagePath;
}

async function testFilePathSupport() {
  console.log('=== Testing File Path Support ===\n');

  // Create test image
  const testImagePath = await createTestImage();

  // Select provider
  const provider = process.env.OPENROUTER_API_KEY ?
    new OpenRouterProvider() :
    new GeminiProvider();

  if (!provider.isAvailable()) {
    console.log('❌ No API key found. Set OPENROUTER_API_KEY or GEMINI_API_KEY');
    return;
  }

  const providerName = provider instanceof OpenRouterProvider ? 'OpenRouter' : 'Gemini';
  console.log(`Using ${providerName} API\n`);

  // Test 1: File path reference
  console.log('Test 1: Using local file path as reference image');
  try {
    const result = await provider.generateImage({
      prompt: 'Transform this gradient pattern into a vibrant abstract artwork with swirls and dynamic energy',
      images: [{
        path: testImagePath,
        description: 'Gradient reference pattern'
      }],
      save_to_file: true,
      filename: 'test_file_path_result'
    });

    if (result.success) {
      console.log('✅ File path test successful!');
      if (result.saved_files) {
        console.log(`   Saved to: ${result.saved_files[0]}`);
      }
    } else {
      console.log('❌ File path test failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 2: Mixed inputs (file path + URL)
  console.log('\nTest 2: Mixed inputs (file path + URL)');
  try {
    const result = await provider.generateImage({
      prompt: 'Combine these two reference images into a creative fusion artwork',
      images: [
        {
          path: testImagePath,
          description: 'Local gradient pattern'
        },
        {
          url: 'https://picsum.photos/200',
          description: 'Random online image'
        }
      ],
      save_to_file: true,
      filename: 'test_mixed_inputs'
    });

    if (result.success) {
      console.log('✅ Mixed inputs test successful!');
      if (result.saved_files) {
        console.log(`   Saved to: ${result.saved_files[0]}`);
      }
    } else {
      console.log('❌ Mixed inputs test failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 3: Non-existent file path (error handling)
  console.log('\nTest 3: Error handling for non-existent file');
  try {
    const result = await provider.generateImage({
      prompt: 'This should fail gracefully',
      images: [{
        path: './non-existent-file.jpg'
      }]
    });

    console.log('❌ Should have thrown an error for non-existent file');
  } catch (error) {
    console.log('✅ Correctly handled non-existent file:', error.message);
  }

  // Clean up
  console.log('\nCleaning up test images...');
  try {
    await fs.rm('./test-images', { recursive: true, force: true });
    console.log('✓ Cleaned up test images');
  } catch (err) {
    console.log('Note: Could not clean up test images:', err.message);
  }

  console.log('\n✨ File path support tests complete!');
}

// Run tests
testFilePathSupport().catch(console.error);