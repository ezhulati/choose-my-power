#!/usr/bin/env node

/**
 * Test script for Universal ZIP Code Lookup System
 * Tests various Texas ZIP codes including ones not in our static mapping
 */

import { universalZIPService } from '../src/lib/services/universal-zip-service.js';

// Test ZIP codes - mix of known, unknown, and edge cases
const testZIPCodes = [
  // Known ZIP codes (should use static mapping first)
  '77002', // Houston - should be fast (static)
  '75201', // Dallas - should be fast (static)
  '78701', // Austin - should be fast (static) - municipal utility
  
  // Unknown ZIP codes that should work with universal lookup
  '77845', // College Station - should use universal lookup
  '78666', // San Marcos - should use universal lookup  
  '77550', // Galveston - should use universal lookup
  '79401', // Lubbock - should use universal lookup
  '76101', // Fort Worth - should use universal lookup
  '77901', // Victoria - should use universal lookup
  
  // Edge cases
  '73301', // Austin area but different ZIP - should map to Austin (municipal)
  '77999', // High Texas ZIP - may not exist
  '70000', // Non-Texas ZIP (Louisiana) - should fail
  '12345', // Invalid ZIP - should fail
];

async function testUniversalZIPSystem() {
  console.log('🧪 Testing Universal ZIP Code Lookup System');
  console.log('=' .repeat(60));
  
  let successCount = 0;
  let failureCount = 0;
  let staticMappingCount = 0;
  let universalLookupCount = 0;
  
  for (const zipCode of testZIPCodes) {
    console.log(`\n🔍 Testing ZIP: ${zipCode}`);
    console.log('-' .repeat(40));
    
    try {
      const startTime = Date.now();
      const result = await universalZIPService.lookupZIPCode(zipCode);
      const duration = Date.now() - startTime;
      
      console.log(`⏱️  Response time: ${duration}ms`);
      console.log(`📊 Success: ${result.success}`);
      
      if (result.success) {
        console.log(`🏙️  City: ${result.cityName} -> ${result.citySlug}`);
        console.log(`🔗 Redirect: ${result.redirectUrl}`);
        console.log(`📍 County: ${result.county}`);
        console.log(`💯 Confidence: ${result.confidence}%`);
        console.log(`📡 Data Source: ${result.dataSource}`);
        console.log(`⚡ Deregulated: ${result.isDeregulated ? '✅ Yes' : '❌ No'}`);
        
        successCount++;
        if (result.dataSource === 'static_mapping') {
          staticMappingCount++;
        } else {
          universalLookupCount++;
        }
      } else {
        console.log(`❌ Error: ${result.error}`);
        console.log(`🏷️  Error Type: ${result.errorType}`);
        
        if (result.municipalUtility) {
          console.log(`🏛️  Municipal Utility: ${result.utilityName}`);
          console.log(`🔗 Redirect: ${result.redirectUrl}`);
        }
        
        // Count municipal utilities as "success" since they're handled correctly
        if (result.errorType === 'non_deregulated') {
          successCount++;
        } else {
          failureCount++;
        }
      }
      
    } catch (error) {
      console.log(`💥 Exception: ${error.message}`);
      failureCount++;
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📈 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total ZIP codes tested: ${testZIPCodes.length}`);
  console.log(`Successful lookups: ${successCount}`);
  console.log(`Failed lookups: ${failureCount}`);
  console.log(`Static mapping used: ${staticMappingCount}`);
  console.log(`Universal lookup used: ${universalLookupCount}`);
  console.log(`Success rate: ${((successCount / testZIPCodes.length) * 100).toFixed(1)}%`);
  
  const overallSuccess = successCount >= (testZIPCodes.length * 0.8); // 80% success rate
  console.log(`\n${overallSuccess ? '✅' : '❌'} Overall test result: ${overallSuccess ? 'PASS' : 'FAIL'}`);
  
  if (!overallSuccess) {
    process.exit(1);
  }
}

// Run the test
testUniversalZIPSystem().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});