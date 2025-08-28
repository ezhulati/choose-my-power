#!/usr/bin/env node
/**
 * Multi-Filter URL Validation Test Script
 * Tests thousands of filter combinations to ensure robustness
 * Run with: node scripts/test-multi-filter-validation.mjs
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock environment for testing
process.env.NODE_ENV = 'test';

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

async function runTests() {
  console.log(colorize('🧪 Multi-Filter URL Validation Test Suite', 'cyan'));
  console.log(colorize('=' .repeat(50), 'blue'));

  try {
    // Dynamic import to handle ES modules
    const { multiFilterValidator, testFilterCombinations, generateCombinationsForCity } = await import('../src/lib/faceted/multi-filter-validator.ts');
    const { tdspMapping } = await import('../src/config/tdsp-mapping.ts');

    console.log(colorize('\n📋 Running comprehensive validation tests...', 'blue'));
    
    // Run basic validation tests
    const testResults = await testFilterCombinations();
    
    console.log(`\n${colorize('✅ Tests Passed:', 'green')} ${testResults.passed}`);
    console.log(`${colorize('❌ Tests Failed:', 'red')} ${testResults.failed}`);
    
    if (testResults.failed > 0) {
      console.log(colorize('\n⚠️  Some tests failed. Check implementation.', 'yellow'));
    } else {
      console.log(colorize('\n🎉 All validation tests passed!', 'green'));
    }

    // Test popular Texas cities
    console.log(colorize('\n🏙️  Testing major Texas cities...', 'blue'));
    const majorCities = ['dallas-tx', 'houston-tx', 'austin-tx', 'fort-worth-tx', 'san-antonio-tx'];
    
    for (const city of majorCities) {
      if (tdspMapping[city]) {
        console.log(colorize(`\n🔍 Testing ${city}:`, 'magenta'));
        
        const combinations = generateCombinationsForCity(city);
        const validCombinations = combinations.filter(c => c.isValid);
        const highValueCombinations = combinations.filter(c => c.seoValue === 'high');
        const shouldGenerate = combinations.filter(c => c.shouldGenerate);
        
        console.log(`  Total combinations tested: ${combinations.length}`);
        console.log(`  ${colorize('Valid combinations:', 'green')} ${validCombinations.length}`);
        console.log(`  ${colorize('High SEO value:', 'yellow')} ${highValueCombinations.length}`);
        console.log(`  ${colorize('Recommended for generation:', 'cyan')} ${shouldGenerate.length}`);
        
        // Show some example URLs
        const examples = shouldGenerate.slice(0, 5);
        if (examples.length > 0) {
          console.log(colorize('  Example URLs:', 'blue'));
          examples.forEach(ex => {
            console.log(`    ${ex.url} (${ex.seoValue} value)`);
          });
        }
      }
    }

    // Test URL structure validation
    console.log(colorize('\n🔗 Testing URL structure validation...', 'blue'));
    const testUrls = [
      '/electricity-plans/dallas-tx/',
      '/electricity-plans/dallas-tx/12-month/',
      '/electricity-plans/dallas-tx/12-month/fixed-rate/',
      '/electricity-plans/dallas-tx/12-month/fixed-rate/green-energy/',
      '/electricity-plans/dallas-tx/invalid space/',
      '/electricity-plans//double-slash/',
      '/electricity-plans/dallas-tx/too/many/filters/here/now/'
    ];

    testUrls.forEach(url => {
      const validation = multiFilterValidator.validateUrlStructure(url);
      const status = validation.isValid ? colorize('✅', 'green') : colorize('❌', 'red');
      console.log(`  ${status} ${url}`);
      if (!validation.isValid) {
        validation.issues.forEach(issue => {
          console.log(`    ${colorize('⚠️', 'yellow')} ${issue}`);
        });
      }
    });

    // Performance test
    console.log(colorize('\n⚡ Performance testing...', 'blue'));
    const startTime = Date.now();
    
    let totalCombinations = 0;
    for (const city of majorCities.slice(0, 3)) { // Test first 3 cities
      if (tdspMapping[city]) {
        const combinations = generateCombinationsForCity(city, 2); // Max depth 2 for performance
        totalCombinations += combinations.length;
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`  Generated ${totalCombinations} combinations in ${duration}ms`);
    console.log(`  Average: ${(totalCombinations / duration * 1000).toFixed(2)} combinations/second`);
    
    if (duration > 5000) {
      console.log(colorize('  ⚠️  Performance warning: Generation took longer than 5 seconds', 'yellow'));
    } else {
      console.log(colorize('  ✅ Performance acceptable', 'green'));
    }

    // Summary
    console.log(colorize('\n📊 Test Summary:', 'cyan'));
    console.log(colorize('=' .repeat(30), 'blue'));
    console.log(`${colorize('Validation Tests:', 'blue')} ${testResults.passed}/${testResults.passed + testResults.failed}`);
    console.log(`${colorize('Performance:', 'blue')} ${duration}ms for ${totalCombinations} combinations`);
    console.log(`${colorize('Status:', 'blue')} ${testResults.failed === 0 ? colorize('READY FOR PRODUCTION', 'green') : colorize('NEEDS FIXES', 'red')}`);

    // Generate sample sitemap data
    console.log(colorize('\n🗺️  Sample sitemap generation...', 'blue'));
    const sampleCity = 'dallas-tx';
    const sitemapUrls = generateCombinationsForCity(sampleCity, 2)
      .filter(c => c.shouldGenerate)
      .slice(0, 10)
      .map(c => c.url);
    
    console.log(`Sample URLs for ${sampleCity} sitemap:`);
    sitemapUrls.forEach(url => {
      console.log(`  ${url}`);
    });

    if (testResults.failed === 0) {
      console.log(colorize('\n🚀 Multi-filter URL system is ready for production!', 'green'));
      process.exit(0);
    } else {
      console.log(colorize('\n🔧 Please fix failing tests before deployment.', 'red'));
      process.exit(1);
    }

  } catch (error) {
    console.error(colorize(`\n💥 Test execution failed: ${error.message}`, 'red'));
    console.error(error.stack);
    process.exit(1);
  }
}

// Execute tests
runTests();