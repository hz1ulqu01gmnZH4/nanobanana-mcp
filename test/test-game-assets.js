#!/usr/bin/env node

/**
 * Quick test to regenerate the Game Assets that failed to save
 */

import { GeminiProvider } from '../dist/providers/gemini-provider.js';
import { OpenRouterProvider } from '../dist/providers/openrouter-provider.js';
import { saveImages } from '../dist/utils.js';
import fs from 'fs/promises';

async function testGameAssets() {
  console.log('=== Regenerating Game Assets Test ===\n');
  
  const timestamp = new Date().toISOString().split('T')[0];
  const detailedTimestamp = new Date().toISOString().replace(/:/g, '-');
  
  // Select provider
  const provider = process.env.OPENROUTER_API_KEY ? 
    new OpenRouterProvider(process.env.OPENROUTER_API_KEY) :
    new GeminiProvider(process.env.GOOGLE_AI_API_KEY);
  
  const providerName = provider instanceof OpenRouterProvider ? 'openrouter' : 'gemini';
  console.log(`Using ${providerName === 'openrouter' ? 'OpenRouter' : 'Gemini'} API\n`);
  
  console.log('Generating Game Art & Real-Time Asset Pack...');
  console.log('Covers: Sprites, tilesets, blueprints, PBR textures');
  
  try {
    const result = await provider.generateImage({
      prompt: `Create a 2x2 game asset grid labeled A-D. Professional game art quality.

Panel A - Sprite Sheet: 32x32 pixel art character "Dust Runner". 3 rows: Idle (6 frames), Run (8 frames), Jump (6 frames). Transparent background, consistent pivot, frame numbers.

Panel B - Isometric Tileset: 64x64 diamond tiles - grass, dirt, stone path, water shore, bridge, cliff edge, tree, rock, house pieces. Seamless edges, top-left lighting.

Panel C - Technical Blueprint: Mech suit "APEX-7" blueprint. Multiple views (front, side, 3/4), component callouts, measurements, technical annotations, blueprint grid, title block.

Panel D - PBR Texture Set: Metal panel texture maps - Albedo (worn brushed metal), Normal (rivets, panel gaps), Roughness (variable wear), Metalness (90% metallic), AO shadows. 2048x2048 seamless.`,
      images: [],
      save_to_file: true,
      filename: `game_assets_pack_${providerName}_${timestamp}_${detailedTimestamp}`
    });
    
    if (result.success && result.images) {
      const filename = `game_assets_pack_${providerName}_${timestamp}_${detailedTimestamp}`;
      const saved = await saveImages(result.images, filename);
      console.log(`✅ Successfully saved: ${saved[0]}`);
      
      // Also save with simpler filename for easy access
      const simpleName = `game_assets_pack_latest`;
      const saved2 = await saveImages(result.images, simpleName);
      console.log(`✅ Also saved as: ${saved2[0]}`);
      
      return saved[0];
    } else {
      console.log('❌ Generation failed');
      return null;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

// Run the test
testGameAssets().then(file => {
  if (file) {
    console.log('\n✨ Game Assets regenerated successfully!');
    console.log(`📁 Check: ${file}`);
  } else {
    console.log('\n❌ Failed to regenerate Game Assets');
  }
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});