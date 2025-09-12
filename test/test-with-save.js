#!/usr/bin/env node

// Test with file saving enabled
import { OpenRouterProvider } from '../dist/providers/openrouter-provider.js';
import { GeminiProvider } from '../dist/providers/gemini-provider.js';
import { saveImages } from '../dist/utils.js';

async function testWithSaving() {
  console.log('=== Nano Banana Test with File Saving ===\n');
  
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
    console.log('No API keys configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY');
    return;
  }

  const tests = [
    {
      name: 'Simple Geometric Test',
      prompt: 'A test pattern with three colored circles (red, green, blue) arranged horizontally on a white background',
      filename: 'test_geometric'
    },
    {
      name: 'Character Design Test',
      prompt: 'A cute cartoon robot character with big eyes and friendly expression, simple flat design style',
      filename: 'test_character',
      scenario: 'character-design'
    },
    {
      name: 'Landscape Test',
      prompt: 'A minimalist landscape: mountains silhouette against sunset sky with gradient colors',
      filename: 'test_landscape',
      aspect_ratio: 'landscape'
    },
    {
      name: 'Style Test',
      prompt: 'An abstract art piece with bold colors and geometric shapes in the style of modern art',
      filename: 'test_abstract',
      negative_prompt: 'realistic, photographic'
    }
  ];

  for (const test of tests) {
    console.log(`\nTesting: ${test.name}`);
    console.log(`Prompt: "${test.prompt.substring(0, 60)}..."`);
    
    try {
      // Generate image
      const result = await provider.generateImage({
        prompt: test.prompt,
        scenario: test.scenario,
        aspect_ratio: test.aspect_ratio,
        negative_prompt: test.negative_prompt
      });
      
      if (result.success && result.images && result.images.length > 0) {
        console.log(`✓ Generated ${result.images.length} image(s)`);
        
        // Save images
        const savedFiles = await saveImages(
          result.images,
          `${providerName.toLowerCase()}_${test.filename}`
        );
        
        if (savedFiles.length > 0) {
          console.log(`✓ Saved to:`);
          savedFiles.forEach(file => {
            console.log(`  - ${file}`);
          });
        } else {
          console.log('✗ Failed to save images');
        }
        
        // Show image details
        result.images.forEach((img, idx) => {
          console.log(`  Image ${idx + 1}: ${img.type}, format: ${img.format || 'unknown'}`);
          if (img.type === 'base64' && img.data) {
            const sizeKB = Math.round(img.data.length / 1024);
            console.log(`    Size: ~${sizeKB}KB`);
          }
        });
        
      } else {
        console.log('✗ Generation failed');
        if (result.error) {
          console.log(`  Error: ${result.error}`);
        }
      }
    } catch (error) {
      console.log('✗ Exception occurred');
      console.log(`  Error: ${error.message}`);
    }
  }
  
  console.log('\n=== Multi-Reference Test with Saving ===\n');
  
  // Create simple test images (1x1 pixels of different colors)
  const referenceImages = [
    {
      // Red pixel
      base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
      description: 'Red color reference'
    },
    {
      // Blue pixel  
      base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADAgH/ef1L2QAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
      description: 'Blue color reference'
    }
  ];
  
  console.log('Testing multi-reference generation with 2 reference images...');
  
  try {
    const result = await provider.generateImage({
      prompt: 'Create a gradient pattern that blends the colors from these reference images',
      images: referenceImages,
      scenario: 'multi-reference'
    });
    
    if (result.success && result.images && result.images.length > 0) {
      console.log(`✓ Generated ${result.images.length} image(s) from references`);
      
      const savedFiles = await saveImages(
        result.images,
        `${providerName.toLowerCase()}_multi_reference`
      );
      
      if (savedFiles.length > 0) {
        console.log(`✓ Saved multi-reference result to:`);
        savedFiles.forEach(file => {
          console.log(`  - ${file}`);
        });
      }
    } else {
      console.log('✗ Multi-reference generation failed');
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    }
  } catch (error) {
    console.log('✗ Exception in multi-reference test');
    console.log(`  Error: ${error.message}`);
  }
}

async function main() {
  console.log('Nano Banana File Saving Test');
  console.log('============================\n');
  console.log('This test will generate images and save them to ./generated_images/\n');
  
  await testWithSaving();
  
  console.log('\n\n=== Test Complete ===');
  console.log('Check the ./generated_images/ directory for saved files');
}

main().catch(console.error);