#!/usr/bin/env node
/**
 * TDSP Identification Script
 * Tests all valid DUNS numbers to identify which TDSP serves which areas
 */

const API_BASE_URL = 'https://pricing.api.comparepower.com';

async function testTdsp(duns) {
  const queryParams = new URLSearchParams({
    group: 'default',
    tdsp_duns: duns,
    display_usage: 1000,
  });

  const url = `${API_BASE_URL}/api/plans/current?${queryParams}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ChooseMyPower.org/1.0 TDSP-Identifier',
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return { duns, error: 'No plans found' };
    }

    const samplePlan = data[0];
    return {
      duns,
      tdsp: samplePlan.tdsp,
      planCount: data.length,
      success: true
    };

  } catch (error) {
    return { duns, error: error.message, success: false };
  }
}

async function identifyAllTdsps() {
  console.log('🔍 IDENTIFYING ALL TEXAS TDSPs');
  console.log('=' .repeat(50));

  // Valid DUNS numbers from API error response
  const validDuns = [
    '007923311',
    '007924772', 
    '957877905',
    '1039940674000',
    '007929441',
    '0582138934100'
  ];

  const results = [];

  for (const duns of validDuns) {
    console.log(`\n🔍 Testing DUNS: ${duns}...`);
    
    const result = await testTdsp(duns);
    
    if (result.success) {
      console.log(`✅ ${result.tdsp.name}`);
      console.log(`   Short Name: ${result.tdsp.short_name}`);
      console.log(`   Abbreviation: ${result.tdsp.abbreviation}`);
      console.log(`   Plans Available: ${result.planCount}`);
      
      results.push(result);
    } else {
      console.log(`❌ Error: ${result.error}`);
    }
    
    // Be respectful with API calls
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📋 TDSP MAPPING SUMMARY');
  console.log('=' .repeat(50));

  results.forEach(result => {
    if (result.success) {
      console.log(`DUNS: ${result.duns}`);
      console.log(`  Company: ${result.tdsp.name}`);
      console.log(`  Short: ${result.tdsp.short_name}`);
      console.log(`  Code: ${result.tdsp.abbreviation}`);
      console.log(`  Plans: ${result.planCount}`);
      console.log();
    }
  });

  return results;
}

identifyAllTdsps().catch(console.error);