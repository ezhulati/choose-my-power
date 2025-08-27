#!/usr/bin/env node
/**
 * API Connectivity Test for ComparePower Integration
 * Tests the API endpoints and validates response format
 */

const API_BASE_URL = 'https://pricing.api.comparepower.com';

async function testApiEndpoint(params) {
  const queryParams = new URLSearchParams({
    group: 'default',
    tdsp_duns: params.tdsp_duns,
    display_usage: String(params.display_usage || 1000),
  });

  // Add optional parameters
  if (params.term) queryParams.set('term', String(params.term));
  if (params.percent_green !== undefined) queryParams.set('percent_green', String(params.percent_green));
  
  const url = `${API_BASE_URL}/api/plans/current?${queryParams}`;
  
  console.log(`🌐 Testing URL: ${url}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ChooseMyPower.org/1.0 API-Test',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response Headers:`);
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid API response format - expected array');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function testApiConnectivity() {
  console.log('🚀 Testing ComparePower API Connectivity...\n');

  // Test with valid DUNS numbers from API error response
  const validDuns = ['007923311', '007924772', '957877905', '1039940674000', '007929441', '0582138934100'];
  
  const testParams = {
    tdsp_duns: validDuns[0], // Test first valid DUNS
    display_usage: 1000
  };

  try {
    console.log('📡 Testing API endpoint...');
    console.log('Parameters:', JSON.stringify(testParams, null, 2));
    
    // Test actual API call
    console.log('\n📊 Fetching electricity plans...');
    const startTime = Date.now();
    
    const plans = await testApiEndpoint(testParams);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`\n✅ API Test Results:`);
    console.log(`   Response Time: ${responseTime}ms`);
    console.log(`   Plans Returned: ${plans.length}`);
    
    if (plans.length > 0) {
      const samplePlan = plans[0];
      console.log(`\n📋 Sample Plan Data (first plan):`);
      console.log(JSON.stringify(samplePlan, null, 2));
    }

    // Test with different parameters
    console.log(`\n🔄 Testing filtered parameters...`);
    const filteredParams = {
      ...testParams,
      term: 12,
      percent_green: 100
    };

    try {
      const filteredPlans = await testApiEndpoint(filteredParams);
      console.log(`   12-month + 100% green plans: ${filteredPlans.length}`);
    } catch (error) {
      console.log(`   Filtered test failed: ${error.message}`);
    }

    console.log('\n🎉 API Integration Test SUCCESSFUL!');
    
    return {
      success: true,
      responseTime,
      planCount: plans.length,
      sampleData: plans.length > 0 ? plans[0] : null
    };

  } catch (error) {
    console.error('\n❌ API Test FAILED!');
    console.error(`Error: ${error.message}`);
    
    if (error.name === 'AbortError') {
      console.error('   Reason: Request timeout (10 seconds)');
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('   Reason: Network connectivity issue');
    }

    return {
      success: false,
      error: error.message
    };
  }
}

// Test different cities/TDSPs
async function testMultipleCities() {
  console.log('\n🏙️  Testing Multiple Cities...\n');

  // Use valid DUNS numbers from API
  const validDuns = ['007923311', '007924772', '957877905', '1039940674000', '007929441', '0582138934100'];
  
  const cities = [
    { name: 'TDSP-1', duns: validDuns[0] },
    { name: 'TDSP-2', duns: validDuns[1] },
    { name: 'TDSP-3', duns: validDuns[2] }
  ];

  const results = [];

  for (const city of cities) {
    try {
      console.log(`📍 Testing ${city.name}...`);
      const plans = await testApiEndpoint({
        tdsp_duns: city.duns,
        display_usage: 1000
      });
      
      console.log(`   ✅ ${city.name}: ${plans.length} plans`);
      results.push({ city: city.name, planCount: plans.length, success: true });
      
      // Add small delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`   ❌ ${city.name}: ${error.message}`);
      results.push({ city: city.name, error: error.message, success: false });
    }
  }

  return results;
}

// Test health endpoint
async function testHealthCheck() {
  console.log('\n🏥 Testing health endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'User-Agent': 'ChooseMyPower.org/1.0 API-Test',
      },
      signal: AbortSignal.timeout(5000)
    });
    
    console.log(`Health endpoint status: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.log(`Health check failed: ${error.message}`);
    return false;
  }
}

// Main execution
async function main() {
  console.log('=' .repeat(60));
  console.log('🔌 COMPAREPOWER API INTEGRATION TEST SUITE');
  console.log('=' .repeat(60));

  // Test health check first
  const isHealthy = await testHealthCheck();
  console.log(`API Health: ${isHealthy ? '✅ Healthy' : '⚠️  Unknown/Unhealthy'}`);

  // Test basic connectivity
  const basicTest = await testApiConnectivity();
  
  if (basicTest.success) {
    // Test multiple cities
    const cityTests = await testMultipleCities();
    
    console.log('\n📊 Summary Report:');
    console.log('─'.repeat(40));
    console.log(`API Response Time: ${basicTest.responseTime}ms`);
    console.log(`Total Plans Found: ${basicTest.planCount}`);
    console.log(`Cities Tested: ${cityTests.length}`);
    
    const successfulCities = cityTests.filter(r => r.success);
    console.log(`Successful: ${successfulCities.length}/${cityTests.length}`);
    
    if (basicTest.responseTime < 500) {
      console.log('🚀 Performance: EXCELLENT (<500ms)');
    } else if (basicTest.responseTime < 1000) {
      console.log('⚡ Performance: GOOD (<1000ms)');
    } else {
      console.log('⏰ Performance: ACCEPTABLE (>1000ms)');
    }

    // Show sample data structure
    if (basicTest.sampleData) {
      console.log('\n📝 Data Structure Analysis:');
      const sample = basicTest.sampleData;
      console.log(`   Plan Fields: ${Object.keys(sample).join(', ')}`);
      console.log(`   Required transformations for our schema: NEEDED`);
      
      if (sample.tdsp) {
        console.log(`\n📍 TDSP Information:`);
        console.log(`   DUNS: ${sample.tdsp.duns_number}`);
        console.log(`   Name: ${sample.tdsp.name}`);
        console.log(`   Short Name: ${sample.tdsp.short_name}`);
        console.log(`   Abbreviation: ${sample.tdsp.abbreviation}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  process.exit(basicTest.success ? 0 : 1);
}

main().catch(console.error);