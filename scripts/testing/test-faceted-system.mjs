#!/usr/bin/env node
/**
 * Comprehensive Faceted Navigation Test Runner
 * Runs all faceted navigation tests and generates detailed reports
 * Run with: node scripts/test-faceted-system.mjs
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: projectRoot,
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', reject);
  });
}

async function runCommandWithOutput(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    
    const child = spawn(command, args, {
      cwd: projectRoot,
      ...options
    });
    
    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });
    
    child.on('error', reject);
  });
}

async function main() {
  console.log(colorize('🧪 Comprehensive Faceted Navigation Test Suite', 'cyan'));
  console.log(colorize('=' .repeat(60), 'blue'));
  
  const startTime = Date.now();
  const testResults = {
    unit: { passed: 0, failed: 0, duration: 0, details: null },
    integration: { passed: 0, failed: 0, duration: 0, details: null },
    e2e: { passed: 0, failed: 0, duration: 0, details: null },
    validation: { passed: 0, failed: 0, duration: 0, details: null }
  };

  console.log(colorize('\n📋 Test Plan:', 'blue'));
  console.log('  1. Multi-filter validation tests');
  console.log('  2. Unit tests (Router, Static Generation)');
  console.log('  3. Integration tests (API + Navigation)');
  console.log('  4. E2E tests (Full user flows)');

  try {
    // 1. Run multi-filter validation tests
    console.log(colorize('\n🔍 Running multi-filter validation tests...', 'blue'));
    const validationStart = Date.now();
    
    try {
      const validationResult = await runCommandWithOutput('node', ['scripts/test-multi-filter-validation.mjs']);
      testResults.validation.duration = Date.now() - validationStart;
      testResults.validation.details = validationResult.stdout;
      
      if (validationResult.code === 0) {
        testResults.validation.passed = 1;
        console.log(colorize('  ✅ Multi-filter validation tests passed', 'green'));
      } else {
        testResults.validation.failed = 1;
        console.log(colorize('  ❌ Multi-filter validation tests failed', 'red'));
      }
    } catch (error) {
      testResults.validation.failed = 1;
      testResults.validation.duration = Date.now() - validationStart;
      console.log(colorize(`  ❌ Multi-filter validation tests failed: ${error.message}`, 'red'));
    }

    // 2. Run unit tests for faceted navigation
    console.log(colorize('\n🧩 Running unit tests...', 'blue'));
    const unitStart = Date.now();
    
    try {
      await runCommand('npm', ['run', 'test:run', '--', 'tests/unit/faceted/']);
      testResults.unit.duration = Date.now() - unitStart;
      testResults.unit.passed = 1;
      console.log(colorize('  ✅ Unit tests passed', 'green'));
    } catch (error) {
      testResults.unit.duration = Date.now() - unitStart;
      testResults.unit.failed = 1;
      console.log(colorize(`  ❌ Unit tests failed: ${error.message}`, 'red'));
    }

    // 3. Run integration tests
    console.log(colorize('\n🔗 Running integration tests...', 'blue'));
    const integrationStart = Date.now();
    
    try {
      await runCommand('npm', ['run', 'test:run', '--', 'tests/integration/faceted-navigation.test.ts']);
      testResults.integration.duration = Date.now() - integrationStart;
      testResults.integration.passed = 1;
      console.log(colorize('  ✅ Integration tests passed', 'green'));
    } catch (error) {
      testResults.integration.duration = Date.now() - integrationStart;
      testResults.integration.failed = 1;
      console.log(colorize(`  ❌ Integration tests failed: ${error.message}`, 'red'));
    }

    // 4. Run E2E tests (if requested and environment supports it)
    if (process.argv.includes('--e2e')) {
      console.log(colorize('\n🌐 Running E2E tests...', 'blue'));
      const e2eStart = Date.now();
      
      try {
        await runCommand('npm', ['run', 'test:e2e', '--', 'tests/e2e/faceted-navigation.spec.ts']);
        testResults.e2e.duration = Date.now() - e2eStart;
        testResults.e2e.passed = 1;
        console.log(colorize('  ✅ E2E tests passed', 'green'));
      } catch (error) {
        testResults.e2e.duration = Date.now() - e2eStart;
        testResults.e2e.failed = 1;
        console.log(colorize(`  ❌ E2E tests failed: ${error.message}`, 'red'));
      }
    } else {
      console.log(colorize('\n⏭️  Skipping E2E tests (use --e2e flag to include)', 'yellow'));
    }

    // Calculate overall results
    const totalPassed = Object.values(testResults).reduce((sum, result) => sum + result.passed, 0);
    const totalFailed = Object.values(testResults).reduce((sum, result) => sum + result.failed, 0);
    const totalDuration = Date.now() - startTime;

    // Generate test report
    console.log(colorize('\n📊 Test Results Summary:', 'cyan'));
    console.log(colorize('=' .repeat(40), 'blue'));
    
    Object.entries(testResults).forEach(([testType, result]) => {
      if (result.passed > 0 || result.failed > 0) {
        const status = result.failed === 0 ? colorize('PASS', 'green') : colorize('FAIL', 'red');
        const duration = formatDuration(result.duration);
        console.log(`${testType.padEnd(12)}: ${status} (${duration})`);
      }
    });

    console.log(colorize('\n🎯 Overall Summary:', 'cyan'));
    console.log(`${colorize('Total Duration:', 'blue')} ${formatDuration(totalDuration)}`);
    console.log(`${colorize('Tests Passed:', 'green')} ${totalPassed}`);
    console.log(`${colorize('Tests Failed:', 'red')} ${totalFailed}`);
    console.log(`${colorize('Success Rate:', 'blue')} ${(totalPassed / (totalPassed + totalFailed) * 100).toFixed(1)}%`);

    // Performance analysis
    console.log(colorize('\n⚡ Performance Analysis:', 'blue'));
    if (testResults.validation.duration > 0) {
      console.log(`  Validation: ${formatDuration(testResults.validation.duration)}`);
    }
    if (testResults.unit.duration > 0) {
      console.log(`  Unit tests: ${formatDuration(testResults.unit.duration)}`);
    }
    if (testResults.integration.duration > 0) {
      console.log(`  Integration: ${formatDuration(testResults.integration.duration)}`);
    }
    if (testResults.e2e.duration > 0) {
      console.log(`  E2E tests: ${formatDuration(testResults.e2e.duration)}`);
    }

    // Recommendations
    console.log(colorize('\n💡 Recommendations:', 'blue'));
    
    if (totalFailed === 0) {
      console.log(colorize('  🎉 All tests passed! System is ready for production.', 'green'));
    } else {
      console.log(colorize('  🔧 Some tests failed. Please fix issues before deployment.', 'yellow'));
    }

    if (testResults.unit.duration > 10000) {
      console.log(colorize('  ⚠️  Unit tests are slow. Consider optimizing test setup.', 'yellow'));
    }

    if (testResults.integration.duration > 30000) {
      console.log(colorize('  ⚠️  Integration tests are slow. Check API mocking.', 'yellow'));
    }

    // Save detailed test report
    const report = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      results: testResults,
      summary: {
        totalPassed,
        totalFailed,
        successRate: totalPassed / (totalPassed + totalFailed) * 100
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    const reportPath = join(projectRoot, 'test-results', 'faceted-navigation-report.json');
    await fs.mkdir(join(projectRoot, 'test-results'), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    // Exit with appropriate code
    process.exit(totalFailed > 0 ? 1 : 0);

  } catch (error) {
    console.error(colorize(`\n💥 Test execution failed: ${error.message}`, 'red'));
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Faceted Navigation Test Runner');
  console.log('');
  console.log('Usage: node scripts/test-faceted-system.mjs [options]');
  console.log('');
  console.log('Options:');
  console.log('  --e2e     Include E2E tests (requires browser setup)');
  console.log('  --help    Show this help message');
  console.log('');
  process.exit(0);
}

// Run the test suite
main();