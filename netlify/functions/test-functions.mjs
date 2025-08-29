#!/usr/bin/env node
/**
 * Comprehensive test suite for Netlify Functions
 * Tests API contracts, infrastructure integration, and production readiness
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const config = {
  testTimeout: 30000, // 30 seconds
  baseUrl: process.env.NETLIFY_FUNCTION_URL || 'http://localhost:8888/.netlify/functions',
  verbose: process.argv.includes('--verbose'),
  skipIntegration: process.argv.includes('--skip-integration')
};

console.log('🚀 Starting Netlify Functions Test Suite');
console.log(`Base URL: ${config.baseUrl}`);
console.log(`Timeout: ${config.testTimeout}ms`);
console.log('');

// Test data sets
const testData = {
  validZipCodes: [
    '75201', // Dallas - Oncor
    '77001', // Houston - CenterPoint  
    '78701', // Austin - AEP Central
    '78201'  // San Antonio - CenterPoint
  ],
  multiTdspZipCodes: [
    '75001', // Addison - Multi-TDSP
    '75019', // Coppell - Multi-TDSP
    '75034', // Frisco - Multi-TDSP
  ],
  invalidZipCodes: [
    '12345', // New York
    '90210', // California
    '00000', // Invalid
    'ABCDE'  // Non-numeric
  ],
  validAddresses: [
    {
      address: '1234 Main Street',
      zipCode: '75201',
      city: 'Dallas'
    },
    {
      address: '5678 Post Oak Blvd',
      zipCode: '77027',
      city: 'Houston'
    }
  ],
  testUsageValues: [500, 1000, 2000],
  testFilters: {
    basicFilters: {
      term: 12,
      green: 100,
      rateType: 'fixed'
    },
    advancedFilters: {
      term: 24,
      green: 50,
      rateType: 'variable',
      prepaid: false,
      timeOfUse: true
    }
  }
};

// Utility functions
class TestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
  }

  async runTest(name, testFn) {
    this.results.total++;
    
    if (config.verbose) {
      console.log(`\n🔍 Running: ${name}`);
    }

    try {
      const startTime = Date.now();
      await testFn();
      const duration = Date.now() - startTime;
      
      this.results.passed++;
      console.log(`✅ ${name} (${duration}ms)`);
    } catch (error) {
      this.results.failed++;
      this.results.errors.push({ test: name, error: error.message });
      console.log(`❌ ${name}: ${error.message}`);
      
      if (config.verbose) {
        console.log(`   Stack: ${error.stack}`);
      }
    }
  }

  skip(name, reason) {
    this.results.total++;
    this.results.skipped++;
    console.log(`⏭️ ${name}: ${reason}`);
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Skipped: ${this.results.skipped}`);
    console.log(`Success Rate: ${((this.results.passed / (this.results.total - this.results.skipped)) * 100).toFixed(1)}%`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.errors.forEach(({ test, error }) => {
        console.log(`  - ${test}: ${error}`);
      });
    }
    
    console.log('');
    return this.results.failed === 0;
  }
}

// HTTP client with timeout
async function makeRequest(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.testTimeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ChooseMyPower-Test/1.0',
        ...options.headers
      }
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${config.testTimeout}ms`);
    }
    throw error;
  }
}

// Test suites
const testRunner = new TestRunner();

// Main test runner function
async function runAllTests() {
  // 1. Basic Function Health Tests
  await testRunner.runTest('Search Plans Function - Health Check', async () => {
  const response = await makeRequest(`${config.baseUrl}/search-plans`, {
    method: 'POST',
    body: JSON.stringify({
      zipCode: '75201'
    })
  });
  
  if (!response) {
    throw new Error('No response received');
  }
  
  const data = await response.json();
  
  if (!data.meta) {
    throw new Error('Missing meta object in response');
  }
  
  if (!data.meta.requestId) {
    throw new Error('Missing requestId in response');
  }
});

await testRunner.runTest('ESIID Lookup Function - Health Check', async () => {
  const response = await makeRequest(`${config.baseUrl}/lookup-esiid`, {
    method: 'POST',
    body: JSON.stringify({
      address: '1234 Main Street',
      zipCode: '75201'
    })
  });
  
  if (!response) {
    throw new Error('No response received');
  }
  
  const data = await response.json();
  
  if (!data.meta) {
    throw new Error('Missing meta object in response');
  }
});

// 2. API Contract Validation Tests
await testRunner.runTest('Search Plans - Valid ZIP Code Contract', async () => {
  const response = await makeRequest(`${config.baseUrl}/search-plans`, {
    method: 'POST',
    body: JSON.stringify({
      zipCode: testData.validZipCodes[0],
      usage: 1000
    })
  });
  
  const data = await response.json();
  
  // Validate response structure
  if (!data.success && !data.error) {
    throw new Error('Response must have either success or error');
  }
  
  if (data.success) {
    if (!data.data) throw new Error('Missing data object');
    if (!data.data.plans) throw new Error('Missing plans array');
    if (!data.data.tdspInfo) throw new Error('Missing tdspInfo');
    if (!data.data.searchMeta) throw new Error('Missing searchMeta');
    
    // Validate TDSP info structure
    const tdsp = data.data.tdspInfo;
    if (!tdsp.duns || !tdsp.name || !tdsp.zone) {
      throw new Error('Invalid TDSP info structure');
    }
    
    // Validate search meta
    const meta = data.data.searchMeta;
    if (typeof meta.totalPlans !== 'number' || 
        typeof meta.filteredPlans !== 'number' ||
        !meta.zipCode || 
        !meta.method) {
      throw new Error('Invalid searchMeta structure');
    }
  }
  
  // Validate meta object
  if (!data.meta.requestId || !data.meta.timestamp || !data.meta.version) {
    throw new Error('Invalid meta object structure');
  }
});

await testRunner.runTest('ESIID Lookup - Valid Address Contract', async () => {
  const testAddress = testData.validAddresses[0];
  
  const response = await makeRequest(`${config.baseUrl}/lookup-esiid`, {
    method: 'POST',
    body: JSON.stringify(testAddress)
  });
  
  const data = await response.json();
  
  if (data.success) {
    if (!data.data) throw new Error('Missing data object');
    if (!data.data.resolution) throw new Error('Missing resolution object');
    if (!data.data.apiParams) throw new Error('Missing apiParams');
    if (!data.data.splitZipInfo) throw new Error('Missing splitZipInfo');
    
    // Validate resolution structure
    const resolution = data.data.resolution;
    if (!resolution.tdsp || !resolution.confidence || !resolution.method) {
      throw new Error('Invalid resolution structure');
    }
    
    if (!resolution.tdsp.duns || !resolution.tdsp.name || !resolution.tdsp.zone) {
      throw new Error('Invalid TDSP structure in resolution');
    }
  }
});

// 3. Error Handling Tests
await testRunner.runTest('Search Plans - Invalid ZIP Code Handling', async () => {
  const response = await makeRequest(`${config.baseUrl}/search-plans`, {
    method: 'POST',
    body: JSON.stringify({
      zipCode: testData.invalidZipCodes[0]
    })
  });
  
  const data = await response.json();
  
  if (response.status !== 400 && response.status !== 422) {
    throw new Error(`Expected 400 or 422 status, got ${response.status}`);
  }
  
  if (data.success !== false) {
    throw new Error('Expected success to be false for invalid ZIP');
  }
  
  if (!data.error) {
    throw new Error('Missing error object for invalid request');
  }
  
  if (!data.error.userMessage) {
    throw new Error('Missing user-friendly error message');
  }
});

await testRunner.runTest('Search Plans - Malformed JSON Handling', async () => {
  const response = await makeRequest(`${config.baseUrl}/search-plans`, {
    method: 'POST',
    body: 'invalid json'
  });
  
  if (response.status !== 400) {
    throw new Error(`Expected 400 status for malformed JSON, got ${response.status}`);
  }
  
  const data = await response.json();
  if (data.error.code !== 'INVALID_JSON') {
    throw new Error('Expected INVALID_JSON error code');
  }
});

await testRunner.runTest('Search Plans - Method Not Allowed', async () => {
  const response = await makeRequest(`${config.baseUrl}/search-plans`, {
    method: 'GET'
  });
  
  if (response.status !== 405) {
    throw new Error(`Expected 405 status for GET request, got ${response.status}`);
  }
});

await testRunner.runTest('ESIID Lookup - Missing Required Fields', async () => {
  const response = await makeRequest(`${config.baseUrl}/lookup-esiid`, {
    method: 'POST',
    body: JSON.stringify({
      zipCode: '75201'
      // Missing address
    })
  });
  
  if (response.status !== 400) {
    throw new Error(`Expected 400 status for missing address, got ${response.status}`);
  }
  
  const data = await response.json();
  if (data.error.code !== 'VALIDATION_ERROR') {
    throw new Error('Expected VALIDATION_ERROR code');
  }
});

// 4. Performance Tests
await testRunner.runTest('Search Plans - Response Time', async () => {
  const startTime = Date.now();
  
  const response = await makeRequest(`${config.baseUrl}/search-plans`, {
    method: 'POST',
    body: JSON.stringify({
      zipCode: testData.validZipCodes[0],
      usage: 1000
    })
  });
  
  const duration = Date.now() - startTime;
  
  if (duration > 10000) { // 10 seconds threshold
    throw new Error(`Response time too slow: ${duration}ms`);
  }
  
  // Check for performance headers
  const responseTime = response.headers.get('X-Response-Time');
  if (responseTime && parseInt(responseTime) > 5000) {
    throw new Error(`Server-reported response time too slow: ${responseTime}`);
  }
});

await testRunner.runTest('ESIID Lookup - Response Time', async () => {
  const startTime = Date.now();
  
  const response = await makeRequest(`${config.baseUrl}/lookup-esiid`, {
    method: 'POST',
    body: JSON.stringify(testData.validAddresses[0])
  });
  
  const duration = Date.now() - startTime;
  
  if (duration > 15000) { // 15 seconds threshold (more lenient for ESIID)
    throw new Error(`Response time too slow: ${duration}ms`);
  }
});

// 5. Rate Limiting Tests
await testRunner.runTest('Search Plans - Rate Limiting Headers', async () => {
  const response = await makeRequest(`${config.baseUrl}/search-plans`, {
    method: 'POST',
    body: JSON.stringify({
      zipCode: testData.validZipCodes[0]
    })
  });
  
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');
  
  if (!remaining) {
    console.warn('Missing X-RateLimit-Remaining header');
  }
  
  if (!reset) {
    console.warn('Missing X-RateLimit-Reset header');
  }
});

// 6. Multi-TDSP and Split ZIP Tests
if (!config.skipIntegration) {
  await testRunner.runTest('Search Plans - Multi-TDSP ZIP Handling', async () => {
    const response = await makeRequest(`${config.baseUrl}/search-plans`, {
      method: 'POST',
      body: JSON.stringify({
        zipCode: testData.multiTdspZipCodes[0],
        address: '1234 Test Street' // Provide address for better resolution
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (!data.data.splitZipInfo) {
        throw new Error('Missing splitZipInfo for multi-TDSP ZIP');
      }
      
      if (!data.data.splitZipInfo.isMultiTdsp) {
        throw new Error('Multi-TDSP ZIP not properly identified');
      }
      
      if (data.data.tdspInfo.confidence === 'high' && !data.data.splitZipInfo.alternativeTdsps) {
        console.warn('High confidence result but no alternatives provided');
      }
    }
  });

  await testRunner.runTest('ESIID Lookup - Split ZIP Resolution', async () => {
    const response = await makeRequest(`${config.baseUrl}/lookup-esiid`, {
      method: 'POST',
      body: JSON.stringify({
        address: '1234 Test Street',
        zipCode: testData.multiTdspZipCodes[0]
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (!data.data.splitZipInfo.isKnownSplitZip) {
        throw new Error('Split ZIP not properly identified');
      }
      
      if (data.data.resolution.confidence === 'low') {
        console.warn('Low confidence resolution for split ZIP with address');
      }
    }
  });
} else {
  testRunner.skip('Multi-TDSP ZIP Handling', 'Integration tests disabled');
  testRunner.skip('Split ZIP Resolution', 'Integration tests disabled');
}

// 7. Filter and Parameter Tests
await testRunner.runTest('Search Plans - Complex Filters', async () => {
  const response = await makeRequest(`${config.baseUrl}/search-plans`, {
    method: 'POST',
    body: JSON.stringify({
      zipCode: testData.validZipCodes[0],
      usage: 1500,
      filters: testData.testFilters.advancedFilters
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Verify filters were applied by checking that filtered count <= total count
    if (data.data.searchMeta.filteredPlans > data.data.searchMeta.totalPlans) {
      throw new Error('Filtered plans count exceeds total plans');
    }
    
    // If we got plans back, verify they match the filters where possible
    if (data.data.plans.length > 0) {
      const firstPlan = data.data.plans[0];
      if (testData.testFilters.advancedFilters.term === 24 && 
          firstPlan.contract && 
          firstPlan.contract.length !== 24) {
        console.warn('Filter may not have been applied correctly: term length mismatch');
      }
    }
  }
});

// 8. Idempotency Tests
await testRunner.runTest('Search Plans - Idempotency Support', async () => {
  const idempotencyKey = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const requestBody = JSON.stringify({
    zipCode: testData.validZipCodes[0],
    usage: 1000
  });
  
  // Make first request
  const response1 = await makeRequest(`${config.baseUrl}/search-plans`, {
    method: 'POST',
    body: requestBody,
    headers: {
      'X-Idempotency-Key': idempotencyKey
    }
  });
  
  // Make second request with same idempotency key
  const response2 = await makeRequest(`${config.baseUrl}/search-plans`, {
    method: 'POST',
    body: requestBody,
    headers: {
      'X-Idempotency-Key': idempotencyKey
    }
  });
  
  if (response1.status !== response2.status) {
    throw new Error('Idempotent requests returned different status codes');
  }
  
  const data1 = await response1.json();
  const data2 = await response2.json();
  
  if (data1.success && data2.success) {
    if (data1.data.searchMeta.totalPlans !== data2.data.searchMeta.totalPlans) {
      console.warn('Idempotent requests may have returned different results');
    }
  }
  
  // Check for idempotency header in second response
  const idempotencyReplay = response2.headers.get('X-Idempotency-Replay');
  if (response2.status === 200 && !idempotencyReplay) {
    console.warn('Missing X-Idempotency-Replay header in repeated request');
  }
});

// 9. CORS Tests
await testRunner.runTest('Search Plans - CORS Headers', async () => {
  const response = await makeRequest(`${config.baseUrl}/search-plans`, {
    method: 'OPTIONS'
  });
  
  if (response.status !== 204) {
    throw new Error(`Expected 204 for OPTIONS request, got ${response.status}`);
  }
  
  const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
  const corsMethods = response.headers.get('Access-Control-Allow-Methods');
  const corsHeaders = response.headers.get('Access-Control-Allow-Headers');
  
  if (!corsOrigin) throw new Error('Missing Access-Control-Allow-Origin header');
  if (!corsMethods) throw new Error('Missing Access-Control-Allow-Methods header');
  if (!corsHeaders) throw new Error('Missing Access-Control-Allow-Headers header');
});

// 10. Data Validation Tests
await testRunner.runTest('Search Plans - Data Quality Validation', async () => {
  const response = await makeRequest(`${config.baseUrl}/search-plans`, {
    method: 'POST',
    body: JSON.stringify({
      zipCode: testData.validZipCodes[0],
      usage: 1000
    })
  });
  
  const data = await response.json();
  
  if (data.success && data.data.plans.length > 0) {
    const plan = data.data.plans[0];
    
    // Validate plan structure
    if (!plan.id) throw new Error('Plan missing required id field');
    if (!plan.name) throw new Error('Plan missing required name field');
    if (!plan.provider) throw new Error('Plan missing provider information');
    if (!plan.pricing) throw new Error('Plan missing pricing information');
    if (!plan.contract) throw new Error('Plan missing contract information');
    
    // Validate pricing data
    if (typeof plan.pricing.rate1000kWh !== 'number' || plan.pricing.rate1000kWh <= 0) {
      throw new Error('Invalid pricing data: rate1000kWh');
    }
    
    // Validate provider data
    if (!plan.provider.name) throw new Error('Plan missing provider name');
    
    // Validate contract data
    if (typeof plan.contract.length !== 'number' || plan.contract.length <= 0) {
      throw new Error('Invalid contract length');
    }
  }
});

  // Print final results
  const success = testRunner.printSummary();

  if (success) {
    console.log('🎉 All tests passed! Functions are ready for production.');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed. Please review and fix issues before deploying.');
    process.exit(1);
  }
}

// Run all tests
runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});