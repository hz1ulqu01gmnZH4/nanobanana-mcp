#!/usr/bin/env node

// Simple test without blank image technique - just prompt engineering
import { OpenRouterProvider } from '../dist/providers/openrouter-provider.js';
import { GeminiProvider } from '../dist/providers/gemini-provider.js';

async function testSimple() {
  console.log('=== Simple Aspect Ratio Test (Prompt Only) ===\n');
  
  // Temporarily disable blank image to test
  let provider = null;
  if (process.env.OPENROUTER_API_KEY) {
    provider = new OpenRouterProvider();
    console.log('Using OpenRouter API\n');
  } else if (process.env.GEMINI_API_KEY) {
    provider = new GeminiProvider();
    console.log('Using Gemini API\n');
  } else {
    console.log('No API keys configured');
    return;
  }

  // Test without aspect_ratio parameter to see default behavior
  console.log('Test 1: Without aspect_ratio parameter');
  try {
    const result = await provider.generateImage({
      prompt: 'A red circle on white background'
    });
    console.log('Result:', result.success ? '✅ Success' : '❌ Failed');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test with aspect_ratio but temporarily comment out blank image in code
  console.log('\nTest 2: With aspect_ratio parameter (no blank image)');
  
  // Save original buildPrompt
  const originalBuildPrompt = provider.buildPrompt.bind(provider);
  
  // Override to test just prompt modification
  provider.buildPrompt = function(args) {
    let prompt = args.prompt;
    if (args.aspect_ratio) {
      // More explicit aspect ratio instructions
      const ratioInstructions = {
        'square': 'Create a square image with 1:1 aspect ratio, equal width and height',
        'landscape': 'Create a wide landscape image with 16:9 aspect ratio, much wider than tall',
        'portrait': 'Create a tall portrait image with 9:16 aspect ratio, much taller than wide'
      };
      prompt += `. ${ratioInstructions[args.aspect_ratio] || `Aspect ratio: ${args.aspect_ratio}`}.`;
    }
    return prompt;
  };

  const tests = [
    { ratio: 'square', expected: '1:1' },
    { ratio: 'landscape', expected: '16:9' },
    { ratio: 'portrait', expected: '9:16' }
  ];

  for (const test of tests) {
    console.log(`\nTesting ${test.ratio} (${test.expected})`);
    try {
      const result = await provider.generateImage({
        prompt: 'A simple geometric pattern',
        aspect_ratio: test.ratio
      });
      console.log('Result:', result.success ? '✅ Success' : '❌ Failed');
      if (!result.success && result.error) {
        console.log('Error:', result.error);
      }
    } catch (error) {
      console.log('❌ Exception:', error.message);
    }
  }

  console.log('\n=== Conclusion ===');
  console.log('The Gemini 2.5 Flash Image Preview model may not support');
  console.log('aspect ratio control via blank images as described in the article.');
  console.log('The article might refer to a different version or usage context.');
  console.log('\nAlternative approaches to try:');
  console.log('1. Use more explicit prompt engineering');
  console.log('2. Post-process images to crop/pad to desired ratio');
  console.log('3. Wait for API updates that support aspect ratio parameters');
}

main().catch(console.error);

async function main() {
  await testSimple();
}