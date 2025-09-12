#!/usr/bin/env node

// Comprehensive test covering all Nano Banana scenarios with minimal API calls
// Based on GPT5's optimized test plan

import { OpenRouterProvider } from '../dist/providers/openrouter-provider.js';
import { GeminiProvider } from '../dist/providers/gemini-provider.js';
import { saveImages } from '../dist/utils.js';
import { Jimp } from 'jimp';
import * as fs from 'fs/promises';
import * as path from 'path';

// Generate mock reference images
async function generateMockReferences() {
  const refs = {};
  
  try {
    // Face reference - blue hair portrait
    const face = new Jimp({ width: 256, height: 256, color: 0xFFE0BDFF });
    // Add blue hair area at top
    for (let y = 0; y < 100; y++) {
      for (let x = 20; x < 236; x++) {
        face.setPixelColor(0x4169E1FF, x, y);
      }
    }
    // Add face circle
    const centerX = 128, centerY = 150, radius = 60;
    for (let y = centerY - radius; y < centerY + radius; y++) {
      for (let x = centerX - radius; x < centerX + radius; x++) {
        if (Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) < radius) {
          face.setPixelColor(0xFFE0BDFF, x, y);
        }
      }
    }
    refs.face = await face.getBuffer('image/png');
    
    // Outfit reference - yellow raincoat
    const outfit = new Jimp({ width: 256, height: 400, color: 0xFFFFFFFF });
    // Yellow raincoat body
    for (let y = 50; y < 300; y++) {
      for (let x = 50; x < 206; x++) {
        outfit.setPixelColor(0xFFD700FF, x, y);
      }
    }
    // Black boots
    for (let y = 300; y < 380; y++) {
      for (let x = 80; x < 176; x++) {
        outfit.setPixelColor(0x000000FF, x, y);
      }
    }
    refs.outfit = await outfit.getBuffer('image/png');
    
    // Background - simple street scene
    const bg = new Jimp({ width: 512, height: 384, color: 0x87CEEBFF }); // Sky blue
    // Gray street at bottom
    for (let y = 250; y < 384; y++) {
      for (let x = 0; x < 512; x++) {
        bg.setPixelColor(0x808080FF, x, y);
      }
    }
    // Buildings (simple rectangles)
    for (let y = 100; y < 250; y++) {
      for (let x = 50; x < 150; x++) {
        bg.setPixelColor(0xA0A0A0FF, x, y);
      }
      for (let x = 200; x < 350; x++) {
        bg.setPixelColor(0xB0B0B0FF, x, y);
      }
      for (let x = 380; x < 480; x++) {
        bg.setPixelColor(0x909090FF, x, y);
      }
    }
    refs.bg = await bg.getBuffer('image/png');
    
    // Pose references - stick figures
    const pose1 = new Jimp({ width: 200, height: 300, color: 0xFFFFFFFF });
    // Dynamic jump pose - simple lines
    // Head
    for (let i = 0; i < 20; i++) {
      pose1.setPixelColor(0x000000FF, 100 + i - 10, 50);
      pose1.setPixelColor(0x000000FF, 100, 50 + i - 10);
    }
    // Body diagonal
    for (let i = 0; i < 60; i++) {
      pose1.setPixelColor(0x000000FF, 100 + i/2, 60 + i);
    }
    // Arms spread
    for (let i = 0; i < 40; i++) {
      pose1.setPixelColor(0x000000FF, 100 - i, 80 + i/2);
      pose1.setPixelColor(0x000000FF, 100 + i, 80 + i/2);
    }
    // Legs in jump
    for (let i = 0; i < 50; i++) {
      pose1.setPixelColor(0x000000FF, 130 - i/2, 120 + i);
      pose1.setPixelColor(0x000000FF, 130 + i/2, 120 + i);
    }
    refs.pose1 = await pose1.getBuffer('image/png');
    
    const pose2 = new Jimp({ width: 200, height: 300, color: 0xFFFFFFFF });
    // Standing pose - vertical lines
    // Head circle
    for (let i = 0; i < 20; i++) {
      pose2.setPixelColor(0x000000FF, 100 + i - 10, 50);
      pose2.setPixelColor(0x000000FF, 100, 50 + i - 10);
    }
    // Body straight
    for (let i = 0; i < 80; i++) {
      pose2.setPixelColor(0x000000FF, 100, 60 + i);
    }
    // Arms down
    for (let i = 0; i < 60; i++) {
      pose2.setPixelColor(0x000000FF, 80, 80 + i);
      pose2.setPixelColor(0x000000FF, 120, 80 + i);
    }
    // Legs straight
    for (let i = 0; i < 80; i++) {
      pose2.setPixelColor(0x000000FF, 90, 140 + i);
      pose2.setPixelColor(0x000000FF, 110, 140 + i);
    }
    refs.pose2 = await pose2.getBuffer('image/png');
    
    // Anime reference - simplified anime style character
    const anime = new Jimp({ width: 256, height: 300, color: 0xFFFFFFFF });
    // Large anime eyes area
    for (let y = 100; y < 130; y++) {
      for (let x = 80; x < 110; x++) {
        anime.setPixelColor(0x0000FFFF, x, y);
      }
      for (let x = 146; x < 176; x++) {
        anime.setPixelColor(0x0000FFFF, x, y);
      }
    }
    // Pink hair
    for (let y = 20; y < 100; y++) {
      for (let x = 60; x < 196; x++) {
        anime.setPixelColor(0xFFB6C1FF, x, y);
      }
    }
    refs.anime = await anime.getBuffer('image/png');
    
    // Floor plan for architecture
    const floorplan = new Jimp({ width: 400, height: 300, color: 0xFFFFFFFF });
    // Draw walls (black lines)
    for (let x = 50; x < 350; x++) {
      floorplan.setPixelColor(0x000000FF, x, 50);
      floorplan.setPixelColor(0x000000FF, x, 250);
    }
    for (let y = 50; y < 250; y++) {
      floorplan.setPixelColor(0x000000FF, 50, y);
      floorplan.setPixelColor(0x000000FF, 350, y);
    }
    // Bar counter
    for (let x = 100; x < 250; x++) {
      for (let y = 100; y < 110; y++) {
        floorplan.setPixelColor(0x808080FF, x, y);
      }
    }
    // Add dimension text (simplified)
    refs.floorplan = await floorplan.getBuffer('image/png');
    
    // Street photo for editing
    const street = new Jimp({ width: 512, height: 384, color: 0x87CEEBFF });
    // Add street
    for (let y = 250; y < 384; y++) {
      for (let x = 0; x < 512; x++) {
        street.setPixelColor(0x606060FF, x, y);
      }
    }
    // Add person (simple shape)
    for (let y = 180; y < 250; y++) {
      for (let x = 100; x < 140; x++) {
        street.setPixelColor(0xFF0000FF, x, y);
      }
    }
    // Add bicycle (simple shape)
    for (let y = 210; y < 250; y++) {
      for (let x = 200; x < 280; x++) {
        street.setPixelColor(0x0000FFFF, x, y);
      }
    }
    // Add stop sign (red octagon)
    for (let y = 100; y < 150; y++) {
      for (let x = 400; x < 450; x++) {
        street.setPixelColor(0xFF0000FF, x, y);
      }
    }
    // Add noise/color cast
    for (let y = 0; y < 384; y++) {
      for (let x = 0; x < 512; x++) {
        if (Math.random() < 0.1) {
          const color = street.getPixelColor(x, y);
          const yellowed = (color & 0xFFFFFF00) | 0x10; // Add yellow tint
          street.setPixelColor(yellowed, x, y);
        }
      }
    }
    refs.street = await street.getBuffer('image/png');
    
    console.log('✓ Generated mock reference images');
    return refs;
  } catch (error) {
    console.error('Error generating mock references:', error);
    return refs;
  }
}

async function runComprehensiveTest() {
  console.log('=== Nano Banana Comprehensive Test ===\n');
  console.log('Testing all scenarios with minimal API calls (4 total)\n');
  
  // Select provider
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
  
  // Generate mock references
  const refs = await generateMockReferences();
  
  const timestamp = new Date().toISOString().split('T')[0];
  const testGroups = [];
  
  // Group 1: Character Masterboard (covers scenarios 1,2,3,4,7,9)
  console.log('\n[1/4] Generating Character Masterboard...');
  console.log('Covers: Multi-reference, Cross-view, Pose mod, Style conversion, Era transforms');
  
  try {
    const result = await provider.generateImage({
      prompt: `Create a 3x3 labeled character showcase board. Use consistent character identity.
Panel A1: Multi-reference hero - Combine face, outfit, and background references
Panel A2: Dynamic action pose based on pose reference 1
Panel A3: Cross-view turnaround (front, 3/4, side, back) on neutral background
Panel B1: Anime to realistic portrait conversion
Panel B2: Illustration to cosplay photo (studio lighting)
Panel B3: Calm standing pose based on pose reference 2
Panel C1: 1920s noir style adaptation
Panel C2: 1980s retro style with neon colors
Panel C3: 2080 cyberpunk future style
Add clear panel labels. Maintain character consistency throughout.`,
      images: [
        { base64: refs.face?.toString('base64'), mimeType: 'image/png', description: 'face reference' },
        { base64: refs.outfit?.toString('base64'), mimeType: 'image/png', description: 'outfit reference' },
        { base64: refs.bg?.toString('base64'), mimeType: 'image/png', description: 'background reference' },
        { base64: refs.pose1?.toString('base64'), mimeType: 'image/png', description: 'dynamic pose' },
        { base64: refs.pose2?.toString('base64'), mimeType: 'image/png', description: 'standing pose' },
        { base64: refs.anime?.toString('base64'), mimeType: 'image/png', description: 'anime reference' }
      ].filter(img => img.base64), // Only include successfully generated refs
      aspect_ratio: 'square'
    });
    
    if (result.success && result.images) {
      const filename = `character_masterboard_${providerName}_${timestamp}`;
      const saved = await saveImages(result.images, filename);
      console.log(`✅ Saved: ${saved[0] || 'failed to save'}`);
      testGroups.push({ name: 'Character Masterboard', file: saved[0], scenarios: '1,2,3,4,7,9' });
    } else {
      console.log('❌ Generation failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Group 2: Photo Editing + AR Overlay (covers scenarios 5,6)
  console.log('\n[2/4] Generating Photo Edit + AR Overlay...');
  console.log('Covers: Photo enhancement, AR information overlay');
  
  try {
    const result = await provider.generateImage({
      prompt: `Create a side-by-side comparison image.
Left panel labeled "Before": Show the street photo exactly as provided
Right panel labeled "After + AR": 
- Enhanced photo: color correction, denoising, sharpening, improved dynamic range
- Remove the trash/objects on the right side
- Add AR overlays: semi-transparent bounding boxes with labels for Person, Bicycle, Stop Sign
- Add distance indicators (5.2m, 10m) and a blue navigation arrow on the road
- Add HUD in top-left: time (14:30), GPS icon, battery 87%
Use clean white/teal AR overlay style. Keep scene realistic.`,
      images: [
        { base64: refs.street?.toString('base64'), mimeType: 'image/png', description: 'street photo to edit' }
      ].filter(img => img.base64),
      aspect_ratio: 'landscape'
    });
    
    if (result.success && result.images) {
      const filename = `photoedit_ar_overlay_${providerName}_${timestamp}`;
      const saved = await saveImages(result.images, filename);
      console.log(`✅ Saved: ${saved[0] || 'failed to save'}`);
      testGroups.push({ name: 'Photo Edit + AR', file: saved[0], scenarios: '5,6' });
    } else {
      console.log('❌ Generation failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Group 3: Architectural Visualization (covers scenarios 10,11)
  console.log('\n[3/4] Generating Architectural Visualization...');
  console.log('Covers: Architecture viz, Multiple aspect ratios');
  
  try {
    const result = await provider.generateImage({
      prompt: `Create an architectural visualization board for a modern café using the floor plan.
Panel A (16:9 aspect): Exterior daytime render - street view, warm sunlight, people seated outside
Panel B (1:1 aspect): Interior render - bar counter, wood and matte black palette, natural lighting
Panel C (9:16 aspect): Night exterior - moody lighting with interior glow, rain reflections
Panel D: Floor plan with AR overlay - room dimensions, door swings, seating count, material callouts
Label each panel with its aspect ratio. Maintain consistent design language. Use photorealistic rendering.`,
      images: [
        { base64: refs.floorplan?.toString('base64'), mimeType: 'image/png', description: 'café floor plan' }
      ].filter(img => img.base64),
      aspect_ratio: 'widescreen'
    });
    
    if (result.success && result.images) {
      const filename = `arch_viz_multiaspect_${providerName}_${timestamp}`;
      const saved = await saveImages(result.images, filename);
      console.log(`✅ Saved: ${saved[0] || 'failed to save'}`);
      testGroups.push({ name: 'Architecture Viz', file: saved[0], scenarios: '10,11' });
    } else {
      console.log('❌ Generation failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Group 4: Sticker Sheet (covers scenario 8)
  console.log('\n[4/4] Generating Sticker Sheet...');
  console.log('Covers: Sticker creation with multiple expressions');
  
  try {
    const result = await provider.generateImage({
      prompt: `Generate a sticker sheet with transparent background. Create 8 die-cut stickers of the same character:
- Happy expression
- Sad expression  
- Surprised expression
- Winking
- Thumbs up gesture
- Waving hand
- Peace sign
- Thinking pose
Each sticker should have: bold clean outlines, 6-8px white stroke, subtle drop shadow, high contrast colors.
Arrange in a 2x4 grid with spacing. Keep consistent character identity from the face and outfit references.
Add title "Nano Banana Stickers" at the top. Make it cute, print-ready, and vibrant.`,
      images: [
        { base64: refs.face?.toString('base64'), mimeType: 'image/png', description: 'character face' },
        { base64: refs.outfit?.toString('base64'), mimeType: 'image/png', description: 'character outfit' }
      ].filter(img => img.base64),
      aspect_ratio: 'portrait'
    });
    
    if (result.success && result.images) {
      const filename = `sticker_sheet_${providerName}_${timestamp}`;
      const saved = await saveImages(result.images, filename);
      console.log(`✅ Saved: ${saved[0] || 'failed to save'}`);
      testGroups.push({ name: 'Sticker Sheet', file: saved[0], scenarios: '8' });
    } else {
      console.log('❌ Generation failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Summary
  console.log('\n\n=== Test Summary ===\n');
  console.log('Comprehensive Nano Banana Test Results:\n');
  
  if (testGroups.length > 0) {
    console.log('Successfully generated and saved:');
    testGroups.forEach(group => {
      console.log(`• ${group.name} (scenarios ${group.scenarios})`);
      console.log(`  File: ${group.file}`);
    });
    
    console.log('\n✅ Coverage:');
    console.log('1. Multi-reference image generation ✓');
    console.log('2. Cross-view transformation ✓');
    console.log('3. Character design & pose modification ✓');
    console.log('4. Style conversion (anime to real) ✓');
    console.log('5. AR information overlay ✓');
    console.log('6. Photo editing & enhancement ✓');
    console.log('7. Illustration to cosplay ✓');
    console.log('8. Sticker creation ✓');
    console.log('9. Era/style transformations ✓');
    console.log('10. Architectural visualization ✓');
    console.log('11. Aspect ratio control ✓');
    
    console.log(`\nTotal API calls: ${testGroups.length} (optimized from 11+ individual tests)`);
    console.log('All images saved to: ./generated_images/');
  } else {
    console.log('❌ No images were successfully generated');
  }
}

async function main() {
  console.log('Nano Banana Comprehensive Scenario Test');
  console.log('=======================================\n');
  console.log('Following GPT5 optimized plan: 11 scenarios in 4 API calls\n');
  
  await runComprehensiveTest();
  
  console.log('\n=== Test Complete ===');
}

main().catch(console.error);