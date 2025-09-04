// Test script to verify address-to-ESIID mapping and plan ID lookup
import fetch from 'node-fetch';

const testAddresses = [
  { address: '123 Main St', zipCode: '75001', expectedArea: 'Dallas' },
  { address: '456 Oak Ave', zipCode: '77001', expectedArea: 'Houston' },
  { address: '789 Elm Dr', zipCode: '78701', expectedArea: 'Austin' },
  { address: '321 Pine St', zipCode: '79901', expectedArea: 'El Paso' }
];

const testPlans = [
  { name: 'Frontier Saver Plus 12', provider: 'Frontier Utilities' },
  { name: 'TXU Energy Everyday Value 12', provider: 'TXU Energy' },
  { name: 'Some Random Plan', provider: 'Unknown Provider' } // Should fallback
];

const baseUrl = 'http://localhost:4324';

console.log('🧪 Testing Address-to-ESIID Mapping System\n');

// Test 1: Address Search API
for (const testCase of testAddresses) {
  try {
    console.log(`🔍 Testing address: ${testCase.address}, ${testCase.zipCode} (${testCase.expectedArea} area)`);
    
    const response = await fetch(`${baseUrl}/api/ercot/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: testCase.address,
        zipCode: testCase.zipCode
      })
    });
    
    if (response.ok) {
      const locations = await response.json();
      console.log(`  ✅ Found ${locations.length} location(s):`);
      locations.forEach((loc, i) => {
        console.log(`    ${i+1}. ESIID: ${loc.esiid}`);
        console.log(`       Address: ${loc.address}`);
        console.log(`       TDSP: ${loc.tdsp}`);
        console.log(`       City: ${loc.city}, ${loc.state} ${loc.zip}`);
      });
      
      // Test that same address returns same ESIID (consistency)
      const response2 = await fetch(`${baseUrl}/api/ercot/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: testCase.address,
          zipCode: testCase.zipCode
        })
      });
      
      if (response2.ok) {
        const locations2 = await response2.json();
        if (locations[0]?.esiid === locations2[0]?.esiid) {
          console.log(`  ✅ ESIID consistency check passed`);
        } else {
          console.log(`  ❌ ESIID consistency check failed - different ESIIDs for same address`);
        }
      }
    } else {
      console.log(`  ❌ Request failed: ${response.status}`);
    }
    console.log('');
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}\n`);
  }
}

console.log('📋 Testing Plan ID Lookup System\n');

// Test 2: Plan Search API
for (const testPlan of testPlans) {
  try {
    console.log(`🔍 Searching for plan: "${testPlan.name}" by ${testPlan.provider}`);
    
    const response = await fetch(`${baseUrl}/api/plans/search?name=${encodeURIComponent(testPlan.name)}&provider=${encodeURIComponent(testPlan.provider)}`);
    
    if (response.ok) {
      const plans = await response.json();
      if (plans.length > 0) {
        console.log(`  ✅ Found plan ID: ${plans[0].id}`);
        console.log(`     Plan: ${plans[0].name}`);
        console.log(`     Provider: ${plans[0].provider}`);
        console.log(`     Rate: ${plans[0].rate}¢/kWh`);
      } else {
        console.log(`  ❌ No matching plan found`);
      }
    } else {
      console.log(`  ❌ Request failed: ${response.status}`);
    }
    console.log('');
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}\n`);
  }
}

console.log('🎯 Testing Complete Address-to-Order Flow\n');

// Test 3: Complete flow simulation
const sampleFlow = {
  address: '123 Main St',
  zipCode: '75001',
  planName: 'Frontier Saver Plus 12',
  provider: 'Frontier Utilities'
};

try {
  console.log(`🔄 Simulating complete flow for: ${sampleFlow.address}, ${sampleFlow.zipCode}`);
  console.log(`   Plan: "${sampleFlow.planName}" by ${sampleFlow.provider}`);
  
  // Step 1: Get ESIID for address
  const addressResponse = await fetch(`${baseUrl}/api/ercot/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: sampleFlow.address,
      zipCode: sampleFlow.zipCode
    })
  });
  
  const locations = await addressResponse.json();
  const selectedLocation = locations[0];
  
  // Step 2: Get real plan ID
  const planResponse = await fetch(`${baseUrl}/api/plans/search?name=${encodeURIComponent(sampleFlow.planName)}&provider=${encodeURIComponent(sampleFlow.provider)}`);
  const plans = await planResponse.json();
  const selectedPlan = plans[0];
  
  if (selectedLocation && selectedPlan) {
    // Step 3: Generate ComparePower URL
    const orderUrl = `https://orders.comparepower.com/order/service_location?esiid=${selectedLocation.esiid}&plan_id=${selectedPlan.id}&usage=1000&zip_code=${sampleFlow.zipCode}`;
    
    console.log(`\n🎯 COMPLETE FLOW SUCCESS!`);
    console.log(`   Selected ESIID: ${selectedLocation.esiid} (${selectedLocation.tdsp})`);
    console.log(`   Selected Plan ID: ${selectedPlan.id}`);
    console.log(`   Order URL: ${orderUrl}`);
    console.log(`\n   ✅ This URL should work on ComparePower's site!`);
    
  } else {
    console.log(`❌ Flow failed - missing location or plan data`);
  }
  
} catch (error) {
  console.log(`❌ Flow test error: ${error.message}`);
}

console.log('\n🏁 All tests completed!');