#!/usr/bin/env node
/**
 * Final Integration Test Suite
 * Validates the complete ComparePower API integration
 */

import { readFile } from 'fs/promises';

async function testStaticDataIntegration() {
  console.log('🧪 FINAL INTEGRATION TEST SUITE');
  console.log('=' .repeat(50));
  
  const results = {
    dataValidation: [],
    pagePerformance: [],
    apiValidation: [],
    summary: {}
  };

  // Test 1: Validate generated data files
  console.log('\n1. 📁 Testing Generated Data Files');
  console.log('-'.repeat(30));

  const cities = ['dallas', 'fort-worth', 'houston'];
  
  for (const city of cities) {
    try {
      const dataFile = `./src/data/generated/${city}.json`;
      const cityDataRaw = await readFile(dataFile, 'utf-8');
      const cityData = JSON.parse(cityDataRaw);
      
      console.log(`✅ ${city.toUpperCase()}:`);
      console.log(`   TDSP: ${cityData.tdsp.name} (${cityData.tdsp.duns})`);
      console.log(`   Filters: ${Object.keys(cityData.filters).join(', ')}`);
      console.log(`   Base plans: ${cityData.filters['no-filters'].count}`);
      console.log(`   Green energy: ${cityData.filters['green-energy'].count}`);
      console.log(`   Rate range: ${(cityData.filters['no-filters'].lowestRate * 100).toFixed(1)}¢ - ${(cityData.filters['no-filters'].highestRate * 100).toFixed(1)}¢`);
      
      results.dataValidation.push({
        city,
        status: 'success',
        planCount: cityData.filters['no-filters'].count,
        filterCount: Object.keys(cityData.filters).length
      });
      
    } catch (error) {
      console.log(`❌ ${city.toUpperCase()}: ${error.message}`);
      results.dataValidation.push({
        city,
        status: 'error',
        error: error.message
      });
    }
  }

  // Test 2: Performance benchmarks
  console.log('\n2. ⚡ Testing Page Performance');
  console.log('-'.repeat(30));

  const DEV_SERVER = 'http://localhost:4324';
  
  for (const city of cities) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${DEV_SERVER}/texas/${city}/electricity-plans`, {
        signal: AbortSignal.timeout(5000)
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        const content = await response.text();
        const hasPlans = content.includes('plans available');
        const hasRates = content.includes('per kWh');
        
        console.log(`✅ ${city.toUpperCase()}: ${response.status} (${responseTime}ms)`);
        console.log(`   Content validation: ${hasPlans && hasRates ? 'PASS' : 'FAIL'}`);
        
        results.pagePerformance.push({
          city,
          status: response.status,
          responseTime,
          contentValid: hasPlans && hasRates
        });
      } else {
        console.log(`❌ ${city.toUpperCase()}: ${response.status}`);
        results.pagePerformance.push({
          city,
          status: response.status,
          responseTime,
          contentValid: false
        });
      }
      
    } catch (error) {
      console.log(`❌ ${city.toUpperCase()}: ${error.message}`);
      results.pagePerformance.push({
        city,
        status: 'error',
        error: error.message
      });
    }
  }

  // Test 3: Live API validation (quick test)
  console.log('\n3. 🌐 Testing Live API Connection');
  console.log('-'.repeat(30));

  const API_BASE_URL = 'https://pricing.api.comparepower.com';
  const testDuns = '1039940674000'; // Dallas/Oncor
  
  try {
    const queryParams = new URLSearchParams({
      group: 'default',
      tdsp_duns: testDuns,
      display_usage: '1000'
    });
    
    const apiUrl = `${API_BASE_URL}/api/plans/current?${queryParams}`;
    const startTime = Date.now();
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'ChooseMyPower.org/1.0 Integration-Test',
      },
      signal: AbortSignal.timeout(10000)
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API Connection: ${response.status} (${responseTime}ms)`);
      console.log(`   Plans returned: ${data.length}`);
      console.log(`   Data structure: Valid JSON array`);
      
      results.apiValidation.push({
        status: 'success',
        responseTime,
        planCount: data.length
      });
    } else {
      console.log(`❌ API Connection: ${response.status}`);
      results.apiValidation.push({
        status: 'error',
        httpStatus: response.status
      });
    }
    
  } catch (error) {
    console.log(`❌ API Connection: ${error.message}`);
    results.apiValidation.push({
      status: 'error',
      error: error.message
    });
  }

  // Generate summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 INTEGRATION TEST SUMMARY');
  console.log('='.repeat(50));
  
  const dataSuccess = results.dataValidation.filter(r => r.status === 'success').length;
  const pageSuccess = results.pagePerformance.filter(r => r.status === 200 && r.contentValid).length;
  const apiSuccess = results.apiValidation.filter(r => r.status === 'success').length;
  
  console.log(`Data Files: ${dataSuccess}/${cities.length} ✅`);
  console.log(`Page Performance: ${pageSuccess}/${cities.length} ✅`);
  console.log(`API Connection: ${apiSuccess}/1 ✅`);
  
  const totalPlans = results.dataValidation
    .filter(r => r.status === 'success')
    .reduce((sum, r) => sum + r.planCount, 0);
    
  const avgResponseTime = results.pagePerformance
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + r.responseTime, 0) / results.pagePerformance.length;
  
  console.log(`\nTotal Plans Available: ${totalPlans}`);
  console.log(`Average Page Load: ${avgResponseTime.toFixed(1)}ms`);
  
  // Performance rating
  if (avgResponseTime < 10) {
    console.log('🚀 Performance: EXCELLENT (<10ms)');
  } else if (avgResponseTime < 100) {
    console.log('⚡ Performance: VERY GOOD (<100ms)');
  } else {
    console.log('⏰ Performance: GOOD');
  }
  
  // Final status
  const allTestsPassed = dataSuccess === cities.length && 
                         pageSuccess === cities.length && 
                         apiSuccess === 1;
  
  if (allTestsPassed) {
    console.log('\n🎉 ALL TESTS PASSED - INTEGRATION SUCCESSFUL!');
    console.log('✅ Ready for production deployment');
  } else {
    console.log('\n⚠️  Some tests failed - Review results above');
  }
  
  console.log('\n' + '='.repeat(50));
  return results;
}

// Run the tests
testStaticDataIntegration().catch(console.error);