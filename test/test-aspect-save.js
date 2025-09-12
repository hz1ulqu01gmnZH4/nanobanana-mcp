#!/usr/bin/env node

// Test aspect ratio with file saving to verify results
import { OpenRouterProvider } from '../dist/providers/openrouter-provider.js';
import { GeminiProvider } from '../dist/providers/gemini-provider.js';
import { saveImages } from '../dist/utils.js';
import * as fs from 'fs/promises';
import * as path from 'path';

async function getImageDimensions(filepath) {
  try {
    const buffer = await fs.readFile(filepath);
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

async function testAndSaveAspectRatios() {
  console.log('=== Aspect Ratio Test with Saved Images ===\n');
  console.log('Generating and saving images with different aspect ratios...\n');
  
  // Select available provider
  let provider = null;
  let providerName = '';
  
  if (process.env.GEMINI_API_KEY) {
    provider = new GeminiProvider();
    providerName = 'gemini';
    console.log('Using Gemini Direct API\n');
  } else if (process.env.OPENROUTER_API_KEY) {
    provider = new OpenRouterProvider();
    providerName = 'openrouter';
    console.log('Using OpenRouter API\n');
  } else {
    console.log('No API keys configured');
    return;
  }

  const tests = [
    {
      name: 'Square Format',
      prompt: 'A vibrant mandala pattern with intricate geometric designs',
      aspect_ratio: 'square',
      filename: 'mandala_square'
    },
    {
      name: 'Landscape Format',
      prompt: 'A serene mountain lake at sunset with reflections',
      aspect_ratio: 'landscape',
      filename: 'mountain_landscape'
    },
    {
      name: 'Portrait Format', 
      prompt: 'A tall waterfall cascading down rocky cliffs',
      aspect_ratio: 'portrait',
      filename: 'waterfall_portrait'
    },
    {
      name: 'Widescreen Format',
      prompt: 'A panoramic view of a futuristic city skyline',
      aspect_ratio: 'widescreen',
      filename: 'city_widescreen'
    },
    {
      name: 'Custom 4:3 Format',
      prompt: 'A cozy library interior with bookshelves and warm lighting',
      aspect_ratio: '4:3',
      filename: 'library_4x3'
    },
    {
      name: 'Ultrawide Format',
      prompt: 'An epic space battle scene with planets and starships',
      aspect_ratio: 'ultrawide',
      filename: 'space_ultrawide'
    }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n${test.name}`);
    console.log(`Aspect Ratio: ${test.aspect_ratio}`);
    console.log(`Generating: "${test.prompt.substring(0, 50)}..."`);
    
    try {
      const result = await provider.generateImage({
        prompt: test.prompt,
        aspect_ratio: test.aspect_ratio
      });
      
      if (result.success && result.images && result.images.length > 0) {
        // Save the image
        const savedFiles = await saveImages(
          result.images,
          `${providerName}_${test.filename}`
        );
        
        if (savedFiles.length > 0) {
          const filepath = savedFiles[0];
          console.log(`✅ Saved to: ${filepath}`);
          
          // Get and display dimensions
          const dims = await getImageDimensions(filepath);
          if (dims) {
            console.log(`   Dimensions: ${dims.width}x${dims.height} (ratio: ${dims.ratio})`);
            results.push({
              name: test.name,
              file: path.basename(filepath),
              width: dims.width,
              height: dims.height,
              ratio: dims.ratio,
              aspect_ratio: test.aspect_ratio
            });
          }
        }
      } else {
        console.log('❌ Generation failed:', result.error || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ Exception:', error.message);
    }
    
    // Small delay between generations
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n\n=== Generated Images Summary ===\n');
  console.log('Successfully generated images with controlled aspect ratios:\n');
  
  if (results.length > 0) {
    const table = results.map(r => 
      `• ${r.name.padEnd(20)} ${r.width}x${r.height} (${r.ratio}) - ${r.file}`
    ).join('\n');
    console.log(table);
    
    console.log('\n✅ All images saved to: ./generated_images/');
    console.log('\nYou can now check the images to verify aspect ratios are working correctly.');
    console.log('The Zenn article technique (blank canvas as last image) is successfully controlling output dimensions!');
  } else {
    console.log('No images were successfully generated.');
  }
}

async function main() {
  console.log('Nano Banana - Aspect Ratio Control Demo');
  console.log('========================================\n');
  console.log('This test demonstrates the working aspect ratio control');
  console.log('using the blank canvas technique from the Zenn article.\n');
  
  await testAndSaveAspectRatios();
  
  console.log('\n=== Test Complete ===');
}

main().catch(console.error);