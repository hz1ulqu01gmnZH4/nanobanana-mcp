#!/usr/bin/env node

// Test script for direct API testing (not through MCP)
import fetch from 'node-fetch';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function testGeminiDirect() {
  if (!GEMINI_API_KEY) {
    console.log('Skipping Gemini test - GEMINI_API_KEY not set');
    return;
  }

  console.log('\n=== Testing Gemini Direct API ===');
  
  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent',
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': GEMINI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: 'Generate a simple test image: A red circle on a white background with the text "Test" in the center' }
            ]
          }]
        }),
      }
    );

    const data = await response.json();
    
    if (response.ok) {
      console.log('✓ Gemini API call successful');
      console.log('Response structure:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
    } else {
      console.error('✗ Gemini API error:', data);
    }
  } catch (error) {
    console.error('✗ Gemini test failed:', error.message);
  }
}

async function testOpenRouterDirect() {
  if (!OPENROUTER_API_KEY) {
    console.log('Skipping OpenRouter test - OPENROUTER_API_KEY not set');
    return;
  }

  console.log('\n=== Testing OpenRouter API ===');
  
  try {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/nanobanana-mcp',
          'X-Title': 'Nano Banana MCP Test',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: 'Generate a simple test image: A blue square on a white background with the text "OpenRouter" in the center'
            }
          ],
        }),
      }
    );

    const data = await response.json();
    
    if (response.ok) {
      console.log('✓ OpenRouter API call successful');
      console.log('Response structure:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
    } else {
      console.error('✗ OpenRouter API error:', data);
    }
  } catch (error) {
    console.error('✗ OpenRouter test failed:', error.message);
  }
}

async function main() {
  console.log('Testing Nano Banana API Access\n');
  console.log('Environment:');
  console.log(`• GEMINI_API_KEY: ${GEMINI_API_KEY ? 'Set (' + GEMINI_API_KEY.substring(0, 10) + '...)' : 'Not set'}`);
  console.log(`• OPENROUTER_API_KEY: ${OPENROUTER_API_KEY ? 'Set (' + OPENROUTER_API_KEY.substring(0, 10) + '...)' : 'Not set'}`);
  
  await testGeminiDirect();
  await testOpenRouterDirect();
  
  console.log('\n=== Test Complete ===');
}

main().catch(console.error);