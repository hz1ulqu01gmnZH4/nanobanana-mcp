#!/usr/bin/env node

/**
 * Run basic functionality tests
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const tests = [
  'test-direct.js',
  'test-mcp.js',
  'test-scenarios.js',
  'test-with-save.js'
];

console.log('=== Running Basic Functionality Tests ===\n');

async function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`Running ${testFile}...`);
    const child = spawn('node', [path.join(__dirname, testFile)], {
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ ${testFile} failed with code ${code}\n`);
        resolve(false);
      } else {
        console.log(`✅ ${testFile} passed\n`);
        resolve(true);
      }
    });
    
    child.on('error', (error) => {
      console.error(`❌ ${testFile} error: ${error.message}\n`);
      resolve(false);
    });
  });
}

async function runAllTests() {
  const results = [];
  
  for (const test of tests) {
    const passed = await runTest(test);
    results.push({ test, passed });
  }
  
  console.log('\n=== Test Summary ===');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All basic tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the output above.');
    process.exit(1);
  }
}

runAllTests().catch(console.error);