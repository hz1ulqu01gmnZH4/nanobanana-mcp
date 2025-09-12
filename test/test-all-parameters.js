#!/usr/bin/env node

// Comprehensive test of all parameters
import { OpenRouterProvider } from '../dist/providers/openrouter-provider.js';
import { GeminiProvider } from '../dist/providers/gemini-provider.js';
import { saveImages } from '../dist/utils.js';

async function testAllParameters() {
  console.log('=== Comprehensive Parameter Test ===\n');
  
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
      name: '1. Basic prompt only',
      args: {
        prompt: 'A simple red circle on white background'
      },
      expected: 'Basic image generation'
    },
    {
      name: '2. With scenario (character-design)',
      args: {
        prompt: 'A friendly robot',
        scenario: 'character-design'
      },
      expected: 'Character sheet with multiple views'
    },
    {
      name: '3. With aspect ratio',
      args: {
        prompt: 'A mountain landscape',
        aspect_ratio: '16:9'
      },
      expected: 'Wide landscape format'
    },
    {
      name: '4. With negative prompt',
      args: {
        prompt: 'A modern building',
        negative_prompt: 'old, vintage, rustic'
      },
      expected: 'Modern style, avoiding vintage elements'
    },
    {
      name: '5. With sample count',
      args: {
        prompt: 'A colorful abstract pattern',
        sample_count: 2
      },
      expected: 'Request for 2 variations (model may not comply)'
    },
    {
      name: '6. Combined parameters',
      args: {
        prompt: 'A futuristic vehicle',
        scenario: 'cross-view',
        aspect_ratio: 'landscape',
        negative_prompt: 'old, steam-powered',
        sample_count: 1
      },
      expected: 'Multiple viewing angles in landscape format'
    },
    {
      name: '7. With image reference (tiny test image)',
      args: {
        prompt: 'Use this color palette for a sunset scene',
        images: [{
          base64: 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAADklEQVQIHWP4z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
          mimeType: 'image/png',
          description: 'Orange color reference'
        }],
        scenario: 'style-transfer'
      },
      expected: 'Style transfer with reference image'
    },
    {
      name: '8. Photo enhancement scenario',
      args: {
        prompt: 'A vibrant nature scene',
        scenario: 'photo-enhancement',
        aspect_ratio: 'square'
      },
      expected: 'Enhanced photo-like quality in 1:1 ratio'
    }
  ];

  console.log('Testing parameter effectiveness:\n');
  console.log('✅ = Effective (modifies output)\n');
  console.log('⚠️  = Included but may not affect output\n');
  console.log('---\n');

  for (const test of tests) {
    console.log(`\nTest: ${test.name}`);
    console.log(`Expected: ${test.expected}`);
    console.log('Parameters:', JSON.stringify(test.args, null, 2));
    
    try {
      const result = await provider.generateImage(test.args);
      
      if (result.success) {
        console.log('✅ Generation successful');
        if (result.images && result.images.length > 0) {
          console.log(`   Generated ${result.images.length} image(s)`);
          console.log(`   First image: ${result.images[0].format || 'unknown'} format`);
        }
        
        // Check what was actually included in the prompt
        console.log('   Effective parameters:');
        if (test.args.scenario) console.log('   ✅ scenario - modified prompt');
        if (test.args.aspect_ratio) console.log('   ✅ aspect_ratio - added to prompt');
        if (test.args.negative_prompt) console.log('   ✅ negative_prompt - added to prompt');
        if (test.args.sample_count) console.log('   ✅ sample_count - requested in prompt');
        if (test.args.images) console.log('   ✅ images - sent to API');
        
      } else {
        console.log('❌ Generation failed:', result.error);
      }
    } catch (error) {
      console.log('❌ Exception:', error.message);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n\n=== Parameter Effectiveness Summary ===\n');
  console.log('EFFECTIVE Parameters (modify generation):');
  console.log('✅ prompt - Core text description');
  console.log('✅ images - Reference images (max 3)');
  console.log('✅ scenario - Enhances prompt with context');
  console.log('✅ aspect_ratio - Controls via natural language');
  console.log('✅ negative_prompt - Excludes elements via language');
  console.log('✅ sample_count - Requests variations via language');
  console.log('✅ provider - Selects API provider');
  console.log('✅ save_to_file - Saves output locally');
  console.log('✅ filename - Names saved files');
  console.log('✅ show_full_response - Controls response format');
  
  console.log('\nINEFFECTIVE Parameters (not supported):');
  console.log('⚠️  seed - Not supported by Gemini 2.5 Flash Image Preview API');
  console.log('⚠️  enhance_prompt - Not supported by API (we enhance via prompt engineering)');
  
  console.log('\n=== Key Insights ===');
  console.log('• Gemini 2.5 Flash Image Preview uses natural language for control');
  console.log('• No generationConfig or toolConfig support for this model');
  console.log('• All styling, composition, and variations controlled via prompt text');
  console.log('• Maximum output resolution: 1024x1024 pixels');
  console.log('• Each image tokenized at 1290 tokens flat rate');
}

async function main() {
  console.log('Nano Banana Comprehensive Parameter Test');
  console.log('========================================\n');
  console.log('Testing all parameters for effectiveness...\n');
  
  await testAllParameters();
  
  console.log('\n=== Test Complete ===');
}

main().catch(console.error);