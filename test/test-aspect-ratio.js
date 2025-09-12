#!/usr/bin/env node

// Test aspect ratio implementation with blank image technique
import { OpenRouterProvider } from '../dist/providers/openrouter-provider.js';
import { GeminiProvider } from '../dist/providers/gemini-provider.js';
import { saveImages } from '../dist/utils.js';
import * as fs from 'fs/promises';
import * as path from 'path';

async function getImageDimensions(filepath) {
  try {
    // Read the first few bytes to get PNG dimensions
    const buffer = await fs.readFile(filepath);
    
    // PNG dimensions are at bytes 16-24
    if (buffer[0] === 0x89 && buffer[1] === 0x50) { // PNG signature
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height, ratio: (width / height).toFixed(2) };
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function testAspectRatios() {
  console.log('=== Aspect Ratio Test with Blank Image Technique ===\n');
  console.log('Based on Zenn article: The last image determines output aspect ratio\n');
  console.log('We add a blank image at the end to control dimensions\n');
  
  // Select available provider
  let provider = null;
  let providerName = '';
  
  if (process.env.GEMINI_API_KEY) {
    provider = new GeminiProvider();
    providerName = 'Gemini';
    console.log('Using Gemini Direct API\n');
  } else if (process.env.OPENROUTER_API_KEY) {
    provider = new OpenRouterProvider();
    providerName = 'OpenRouter';
    console.log('Using OpenRouter API\n');
  } else {
    console.log('No API keys configured');
    return;
  }

  const tests = [
    {
      name: 'Square (1:1)',
      args: {
        prompt: 'A colorful mandala pattern',
        aspect_ratio: 'square'
      },
      expected: { width: 1024, height: 1024, ratio: '1.00' }
    },
    {
      name: 'Landscape (16:9)',
      args: {
        prompt: 'A wide panoramic mountain view at sunset',
        aspect_ratio: '16:9'
      },
      expected: { width: 1024, height: 576, ratio: '1.78' }
    },
    {
      name: 'Portrait (9:16)',
      args: {
        prompt: 'A tall skyscraper reaching into clouds',
        aspect_ratio: 'portrait'
      },
      expected: { width: 576, height: 1024, ratio: '0.56' }
    },
    {
      name: 'Widescreen (16:10)',
      args: {
        prompt: 'A cinematic space scene with planets',
        aspect_ratio: 'widescreen'
      },
      expected: { width: 1024, height: 640, ratio: '1.60' }
    },
    {
      name: 'Custom ratio (4:3)',
      args: {
        prompt: 'A classic television test pattern',
        aspect_ratio: '4:3'
      },
      expected: { width: 1024, height: 768, ratio: '1.33' }
    },
    {
      name: 'With reference image + aspect control',
      args: {
        prompt: 'Use this color but make it landscape format',
        images: [{
          // Small red square as reference
          base64: 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAADklEQVQIHWP4z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
          mimeType: 'image/png'
        }],
        aspect_ratio: 'landscape'
      },
      expected: { width: 1024, height: 576, ratio: '1.78' }
    }
  ];

  console.log('Testing aspect ratios:\n');

  for (const test of tests) {
    console.log(`\nTest: ${test.name}`);
    console.log(`Requested: ${test.args.aspect_ratio}`);
    console.log(`Expected dimensions: ${test.expected.width}x${test.expected.height} (ratio: ${test.expected.ratio})`);
    
    try {
      const result = await provider.generateImage(test.args);
      
      if (result.success && result.images && result.images.length > 0) {
        // Save the image to check dimensions
        const savedFiles = await saveImages(
          result.images,
          `test_aspect_${test.args.aspect_ratio.replace(':', 'x')}`
        );
        
        if (savedFiles.length > 0) {
          const dimensions = await getImageDimensions(savedFiles[0]);
          
          if (dimensions) {
            console.log(`✅ Generated: ${dimensions.width}x${dimensions.height} (ratio: ${dimensions.ratio})`);
            
            // Check if ratio matches (with some tolerance)
            const expectedRatio = parseFloat(test.expected.ratio);
            const actualRatio = parseFloat(dimensions.ratio);
            const difference = Math.abs(expectedRatio - actualRatio);
            
            if (difference < 0.1) {
              console.log('   ✅ Aspect ratio matches!');
            } else {
              console.log(`   ⚠️  Aspect ratio mismatch (diff: ${difference.toFixed(2)})`);
            }
            
            // Clean up test file
            await fs.unlink(savedFiles[0]);
          } else {
            console.log('   Could not read image dimensions');
          }
        }
      } else {
        console.log('❌ Generation failed:', result.error || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ Exception:', error.message);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n\n=== Aspect Ratio Implementation Summary ===\n');
  console.log('Technique: Adding blank image at the end of parts array');
  console.log('Rationale: Last image determines output aspect ratio (Zenn article)');
  console.log('\nSupported ratios:');
  console.log('• square (1:1) - 1024x1024');
  console.log('• landscape (16:9) - 1024x576');
  console.log('• portrait (9:16) - 576x1024');
  console.log('• widescreen (16:10) - 1024x640');
  console.log('• ultrawide (21:9) - 1024x439');
  console.log('• panoramic (2:1) - 1024x512');
  console.log('• Custom ratios (e.g., 4:3, 3:2)');
  
  console.log('\nNote: Actual output may vary slightly from requested dimensions');
  console.log('due to model limitations (max 1024x1024)');
}

async function main() {
  console.log('Nano Banana Aspect Ratio Control Test');
  console.log('=====================================\n');
  
  await testAspectRatios();
  
  console.log('\n=== Test Complete ===');
}

main().catch(console.error);