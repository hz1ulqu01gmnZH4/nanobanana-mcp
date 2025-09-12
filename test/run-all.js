#!/usr/bin/env node

/**
 * Run ALL tests - basic functionality and full coverage
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const testSuites = [
  {
    name: 'Basic Functionality',
    runner: 'run-basic.js',
    tests: ['test-direct.js', 'test-mcp.js', 'test-scenarios.js', 'test-with-save.js']
  },
  {
    name: 'Parameter Tests',
    tests: ['test-all-parameters.js', 'test-aspect-ratio.js', 'test-final.js']
  },
  {
    name: 'Coverage Tests',
    runner: 'run-coverage.js',
    tests: ['test-comprehensive.js', 'test-complete-coverage.js', 'test-full-coverage.js']
  }
];

console.log('=== Running ALL Nano Banana Tests ===\n');

async function runTestFile(testFile) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [path.join(__dirname, testFile)], {
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      resolve(code === 0);
    });
    
    child.on('error', (error) => {
      console.error(`Error running ${testFile}: ${error.message}`);
      resolve(false);
    });
  });
}

async function runSuite(suite) {
  console.log(`\n📦 ${suite.name}`);
  console.log('─'.repeat(40));
  
  if (suite.runner) {
    // Run the suite runner
    const passed = await runTestFile(suite.runner);
    return { suite: suite.name, passed, tests: suite.tests.length };
  } else {
    // Run individual tests
    let passed = 0;
    let failed = 0;
    
    for (const test of suite.tests) {
      console.log(`Running ${test}...`);
      const success = await runTestFile(test);
      if (success) {
        console.log(`✅ ${test} passed`);
        passed++;
      } else {
        console.log(`❌ ${test} failed`);
        failed++;
      }
    }
    
    return { 
      suite: suite.name, 
      passed: failed === 0, 
      tests: suite.tests.length,
      details: { passed, failed }
    };
  }
}

async function runAllTests() {
  const startTime = Date.now();
  const results = [];
  
  console.log('This will run all test suites including:');
  console.log('• Basic functionality tests');
  console.log('• Parameter validation tests');
  console.log('• Full coverage tests (12 API calls)');
  console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  for (const suite of testSuites) {
    const result = await runSuite(suite);
    results.push(result);
  }
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  console.log('\n' + '='.repeat(50));
  console.log('=== FINAL TEST REPORT ===');
  console.log('='.repeat(50));
  
  console.log(`\n⏱️ Total Duration: ${duration} seconds`);
  
  console.log('\n📊 Suite Results:');
  for (const result of results) {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.suite} (${result.tests} tests)`);
    if (result.details) {
      console.log(`   Passed: ${result.details.passed}, Failed: ${result.details.failed}`);
    }
  }
  
  const allPassed = results.every(r => r.passed);
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✨ Nano Banana MCP is fully tested and operational');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

runAllTests().catch(console.error);