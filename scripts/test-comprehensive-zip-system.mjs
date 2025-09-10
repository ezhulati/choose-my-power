#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Universal ZIP Code System
 * Tests the system's ability to handle ALL Texas ZIP codes
 */

// Test ZIP codes representing different categories
const testCases = [
  // Static mapping (should be fast - 0-1ms)
  { zip: '77002', expected: 'success', city: 'houston', type: 'static-deregulated', description: 'Houston (static mapping)' },
  { zip: '75205', expected: 'success', city: 'dallas', type: 'static-deregulated', description: 'Dallas (static mapping)' },
  
  // Municipal utilities (should be handled correctly)
  { zip: '78701', expected: 'municipal', city: 'austin', type: 'municipal-utility', description: 'Austin Energy (municipal)' },
  { zip: '77845', expected: 'municipal', city: 'college-station', type: 'municipal-utility', description: 'College Station Utilities (municipal)' },
  { zip: '78201', expected: 'municipal', city: 'san-antonio', type: 'municipal-utility', description: 'CPS Energy San Antonio (municipal)' },
  { zip: '77801', expected: 'municipal', city: 'bryan', type: 'municipal-utility', description: 'Bryan Texas Utilities (municipal)' },
  
  // Comprehensive database lookups (should work via offline database)
  { zip: '79401', expected: 'success', city: 'lubbock', type: 'comprehensive-deregulated', description: 'Lubbock (comprehensive database)' },
  { zip: '76101', expected: 'success', city: 'fort-worth', type: 'comprehensive-deregulated', description: 'Fort Worth (comprehensive database)' },
  { zip: '78401', expected: 'success', city: 'corpus-christi', type: 'comprehensive-deregulated', description: 'Corpus Christi (comprehensive database)' },
  { zip: '79101', expected: 'success', city: 'amarillo', type: 'comprehensive-deregulated', description: 'Amarillo (comprehensive database)' },
  { zip: '75701', expected: 'success', city: 'tyler', type: 'comprehensive-deregulated', description: 'Tyler (comprehensive database)' },
  { zip: '76701', expected: 'success', city: 'waco', type: 'comprehensive-deregulated', description: 'Waco (comprehensive database)' },
  { zip: '79901', expected: 'success', city: 'el-paso', type: 'comprehensive-deregulated', description: 'El Paso (comprehensive database)' },
  
  // Pattern matching for unknown ZIPs (should use intelligent mapping)
  { zip: '77199', expected: 'success', city: 'houston', type: 'pattern-match', description: 'Unknown Houston area (pattern match)' },
  { zip: '75399', expected: 'success', city: 'dallas', type: 'pattern-match', description: 'Unknown Dallas area (pattern match)' },
  { zip: '79499', expected: 'success', city: 'lubbock', type: 'pattern-match', description: 'Unknown Lubbock area (pattern match)' },
  { zip: '79999', expected: 'success', city: 'el-paso', type: 'pattern-match', description: 'Unknown El Paso area (pattern match)' },
  
  // Edge cases and error handling
  { zip: '90210', expected: 'error', errorType: 'non_texas', type: 'error-case', description: 'California ZIP (should reject)' },
  { zip: '12345', expected: 'error', errorType: 'non_texas', type: 'error-case', description: 'New York ZIP (should reject)' },
  { zip: '74999', expected: 'error', errorType: 'non_texas', type: 'error-case', description: 'Just below Texas range (should reject)' },
  { zip: '80000', expected: 'error', errorType: 'non_texas', type: 'error-case', description: 'Just above Texas range (should reject)' },
  { zip: 'abcde', expected: 'error', errorType: 'invalid_zip', type: 'error-case', description: 'Invalid format (should reject)' },
  { zip: '7520', expected: 'error', errorType: 'invalid_zip', type: 'error-case', description: 'Too short (should reject)' },
  { zip: '752055', expected: 'error', errorType: 'invalid_zip', type: 'error-case', description: 'Too long (should reject)' }
];

async function testZIPCode(testCase) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`http://localhost:4326/api/zip-lookup?zip=${testCase.zip}`);
    const result = await response.json();
    const duration = Date.now() - startTime;
    
    let success = false;
    let details = '';
    
    if (testCase.expected === 'success') {
      success = result.success === true;
      if (success) {
        details = `→ ${result.cityDisplayName} (${result.redirectUrl})`;
      } else {
        details = `✗ Expected success but got: ${result.error}`;
      }
    } else if (testCase.expected === 'municipal') {
      success = result.municipalUtility === true;
      if (success) {
        details = `→ ${result.utilityName} (${result.redirectUrl})`;
      } else {
        details = `✗ Expected municipal but got success: ${result.cityDisplayName}`;
      }
    } else if (testCase.expected === 'error') {
      success = result.success === false;
      if (success && testCase.errorType) {
        success = result.errorType === testCase.errorType;
        details = success ? `→ Correctly rejected: ${result.errorType}` : `✗ Wrong error type: got ${result.errorType}, expected ${testCase.errorType}`;
      } else if (success) {
        details = `→ Correctly rejected: ${result.error}`;
      } else {
        details = `✗ Expected error but got success: ${result.cityDisplayName}`;
      }
    }
    
    return {
      zip: testCase.zip,
      description: testCase.description,
      type: testCase.type,
      success,
      duration,
      details,
      response: result
    };
    
  } catch (error) {
    return {
      zip: testCase.zip,
      description: testCase.description,
      type: testCase.type,
      success: false,
      duration: Date.now() - startTime,
      details: `✗ Request failed: ${error.message}`,
      error: error.message
    };
  }
}

async function runComprehensiveTest() {
  console.log('🧪 COMPREHENSIVE UNIVERSAL ZIP CODE SYSTEM TEST');
  console.log('=' .repeat(70));
  console.log(`Testing ${testCases.length} ZIP codes across all categories...`);
  console.log('');
  
  const results = [];
  const categoryStats = {};
  let totalDuration = 0;
  
  // Run tests
  for (const testCase of testCases) {
    process.stdout.write(`Testing ${testCase.zip} (${testCase.description})... `);
    
    const result = await testCompound(testCase);
    results.push(result);
    totalDuration += result.duration;
    
    // Track category stats
    if (!categoryStats[result.type]) {
      categoryStats[result.type] = { total: 0, success: 0, totalTime: 0 };
    }
    categoryStats[result.type].total++;
    categoryStats[result.type].totalTime += result.duration;
    if (result.success) {
      categoryStats[result.type].success++;
    }
    
    // Display result
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.duration}ms ${result.details}`);
  }
  
  // Summary by category
  console.log('\n' + '=' .repeat(70));
  console.log('📊 RESULTS BY CATEGORY');
  console.log('=' .repeat(70));
  
  for (const [category, stats] of Object.entries(categoryStats)) {
    const successRate = ((stats.success / stats.total) * 100).toFixed(1);
    const avgTime = (stats.totalTime / stats.total).toFixed(1);
    const categoryName = category.replace(/-/g, ' ').toUpperCase();
    
    console.log(`${categoryName}:`);
    console.log(`  Success: ${stats.success}/${stats.total} (${successRate}%)`);
    console.log(`  Avg Time: ${avgTime}ms`);
    console.log('');
  }
  
  // Overall summary
  const totalTests = results.length;
  const successfulTests = results.filter(r => r.success).length;
  const successRate = ((successfulTests / totalTests) * 100).toFixed(1);
  const avgResponseTime = (totalDuration / totalTests).toFixed(1);
  
  console.log('📈 OVERALL SUMMARY');
  console.log('=' .repeat(70));
  console.log(`Total ZIP codes tested: ${totalTests}`);
  console.log(`Successful tests: ${successfulTests}/${totalTests} (${successRate}%)`);
  console.log(`Average response time: ${avgResponseTime}ms`);
  console.log(`Total test duration: ${(totalDuration / 1000).toFixed(2)}s`);
  
  // Performance analysis
  const staticTests = results.filter(r => r.type === 'static-deregulated');
  const comprehensiveTests = results.filter(r => r.type === 'comprehensive-deregulated');
  const patternTests = results.filter(r => r.type === 'pattern-match');
  
  if (staticTests.length > 0) {
    const staticAvg = (staticTests.reduce((sum, r) => sum + r.duration, 0) / staticTests.length).toFixed(1);
    console.log(`Static mapping avg: ${staticAvg}ms (fastest)`);
  }
  
  if (comprehensiveTests.length > 0) {
    const comprehensiveAvg = (comprehensiveTests.reduce((sum, r) => sum + r.duration, 0) / comprehensiveTests.length).toFixed(1);
    console.log(`Comprehensive DB avg: ${comprehensiveAvg}ms`);
  }
  
  if (patternTests.length > 0) {
    const patternAvg = (patternTests.reduce((sum, r) => sum + r.duration, 0) / patternTests.length).toFixed(1);
    console.log(`Pattern matching avg: ${patternAvg}ms`);
  }
  
  // Final verdict
  const overallSuccess = successRate >= 95; // 95% success rate required
  console.log(`\n${overallSuccess ? '✅' : '❌'} UNIVERSAL ZIP SYSTEM: ${overallSuccess ? 'FULLY OPERATIONAL' : 'NEEDS ATTENTION'}`);
  
  if (overallSuccess) {
    console.log('\n🎉 SUCCESS: The universal ZIP system can handle ANY Texas ZIP code!');
    console.log('   • Static mapping for known ZIPs (sub-millisecond)');
    console.log('   • Comprehensive database for 459+ cities (fast lookups)');
    console.log('   • Intelligent pattern matching for unknown ZIPs');
    console.log('   • Proper municipal utility detection');
    console.log('   • Robust error handling for invalid/non-Texas ZIPs');
  } else {
    console.log('\n⚠️  Some tests failed. Review the results above.');
  }
  
  return overallSuccess;
}

// Helper function for individual tests
async function testCompound(testCase) {
  return await testZIPCode(testCase);
}

// Run the comprehensive test
runComprehensiveTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});