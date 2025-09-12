#!/usr/bin/env node

// Test the MCP server implementation
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testMCPServer() {
  console.log('=== Testing Nano Banana MCP Server ===\n');
  
  const serverPath = join(__dirname, 'dist', 'index.js');
  const server = spawn('node', [serverPath], {
    env: {
      ...process.env,
      NODE_ENV: 'test'
    }
  });

  let output = '';
  let errorOutput = '';

  server.stdout.on('data', (data) => {
    output += data.toString();
  });

  server.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.log(data.toString());
  });

  // Send test requests
  const requests = [
    // List providers
    {
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1
    },
    // Generate text-to-image
    {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'generate_image',
        arguments: {
          prompt: 'A minimalist test pattern: three colored circles (red, green, blue) on a white background',
          provider: 'auto',
          aspect_ratio: 'square'
        }
      },
      id: 2
    },
    // List scenarios
    {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'list_scenarios',
        arguments: {}
      },
      id: 3
    }
  ];

  // Send requests with delay
  for (const request of requests) {
    server.stdin.write(JSON.stringify(request) + '\n');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Wait for responses
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Close server
  server.kill();

  console.log('\n=== Test Results ===');
  console.log('Server output captured');
  console.log('Error output:', errorOutput ? 'See above' : 'None');
}

// Direct API test for comparison
async function testDirectAPI() {
  console.log('\n=== Direct API Test ===');
  
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const { OpenRouterProvider } = await import('../dist/providers/openrouter-provider.js');
      const provider = new OpenRouterProvider();
      
      const result = await provider.generateImage({
        prompt: 'A simple geometric test: a red triangle on white background',
        aspect_ratio: '1:1'
      });
      
      console.log('OpenRouter test result:', {
        success: result.success,
        hasImages: result.images && result.images.length > 0,
        imageCount: result.images?.length,
        error: result.error
      });
    } catch (error) {
      console.error('OpenRouter test error:', error.message);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const { GeminiProvider } = await import('../dist/providers/gemini-provider.js');
      const provider = new GeminiProvider();
      
      const result = await provider.generateImage({
        prompt: 'A simple geometric test: a blue circle on white background',
        aspect_ratio: '1:1'
      });
      
      console.log('Gemini test result:', {
        success: result.success,
        hasImages: result.images && result.images.length > 0,
        imageCount: result.images?.length,
        error: result.error
      });
    } catch (error) {
      console.error('Gemini test error:', error.message);
    }
  }
}

async function main() {
  console.log('Nano Banana MCP Server Test Suite\n');
  console.log('Environment:');
  console.log(`• GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Set' : 'Not set'}`);
  console.log(`• OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? 'Set' : 'Not set'}\n`);
  
  await testMCPServer();
  await testDirectAPI();
  
  console.log('\n=== All Tests Complete ===');
}

main().catch(console.error);