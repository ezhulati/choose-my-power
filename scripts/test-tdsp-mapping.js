#!/usr/bin/env node

/**
 * Test TDSP mapping accuracy with spot checks
 */

import fs from 'fs/promises';
import path from 'path';

// Test cases with known correct mappings
const TEST_CASES = [
  // Major Oncor cities (Dallas-Fort Worth)
  { city: 'dallas-tx', expectedDuns: '1039940674000', expectedTdsp: 'Oncor Electric Delivery' },
  { city: 'fort-worth-tx', expectedDuns: '1039940674000', expectedTdsp: 'Oncor Electric Delivery' },
  { city: 'arlington-tx', expectedDuns: '1039940674000', expectedTdsp: 'Oncor Electric Delivery' },
  { city: 'plano-tx', expectedDuns: '1039940674000', expectedTdsp: 'Oncor Electric Delivery' },
  { city: 'addison-tx', expectedDuns: '1039940674000', expectedTdsp: 'Oncor Electric Delivery' },
  { city: 'allen-tx', expectedDuns: '1039940674000', expectedTdsp: 'Oncor Electric Delivery' },
  
  // Major CenterPoint cities (Houston area)
  { city: 'houston-tx', expectedDuns: '957877905', expectedTdsp: 'CenterPoint Energy Houston Electric' },
  { city: 'pearland-tx', expectedDuns: '957877905', expectedTdsp: 'CenterPoint Energy Houston Electric' },
  { city: 'sugar-land-tx', expectedDuns: '957877905', expectedTdsp: 'CenterPoint Energy Houston Electric' },
  { city: 'katy-tx', expectedDuns: '957877905', expectedTdsp: 'CenterPoint Energy Houston Electric' },
  { city: 'conroe-tx', expectedDuns: '957877905', expectedTdsp: 'CenterPoint Energy Houston Electric' },
  
  // AEP Texas Central cities
  { city: 'waco-tx', expectedDuns: '007924772', expectedTdsp: 'AEP Texas Central Company' },
  { city: 'temple-tx', expectedDuns: '007924772', expectedTdsp: 'AEP Texas Central Company' },
  { city: 'killeen-tx', expectedDuns: '007924772', expectedTdsp: 'AEP Texas Central Company' },
  { city: 'round-rock-tx', expectedDuns: '007924772', expectedTdsp: 'AEP Texas Central Company' },
  { city: 'belton-tx', expectedDuns: '007924772', expectedTdsp: 'AEP Texas Central Company' },
  
  // AEP Texas North cities  
  { city: 'abilene-tx', expectedDuns: '007923311', expectedTdsp: 'AEP Texas North Company' },
  { city: 'wichita-falls-tx', expectedDuns: '007923311', expectedTdsp: 'AEP Texas North Company' },
  { city: 'big-spring-tx', expectedDuns: '007923311', expectedTdsp: 'AEP Texas North Company' },
  { city: 'sweetwater-tx', expectedDuns: '007923311', expectedTdsp: 'AEP Texas North Company' },
  
  // TNMP cities (South Texas/Valley)
  { city: 'corpus-christi-tx', expectedDuns: '007929441', expectedTdsp: 'Texas-New Mexico Power Company' },
  { city: 'laredo-tx', expectedDuns: '007929441', expectedTdsp: 'Texas-New Mexico Power Company' },
  { city: 'mcallen-tx', expectedDuns: '007929441', expectedTdsp: 'Texas-New Mexico Power Company' },
  { city: 'harlingen-tx', expectedDuns: '007929441', expectedTdsp: 'Texas-New Mexico Power Company' },
  { city: 'el-paso-tx', expectedDuns: '007929441', expectedTdsp: 'Texas-New Mexico Power Company' },
];

async function loadTdspMapping() {
  try {
    const mappingPath = path.join(process.cwd(), 'src', 'config', 'tdsp-mapping.ts');
    const content = await fs.readFile(mappingPath, 'utf8');
    
    const mapping = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("'") && trimmed.includes("': {")) {
        const cityMatch = trimmed.match(/'([^']+)'/);
        const dunsMatch = trimmed.match(/duns: '([^']+)'/);
        const nameMatch = trimmed.match(/name: '([^']+)'/);
        const zoneMatch = trimmed.match(/zone: '([^']+)'/);
        const tierMatch = trimmed.match(/tier: ([^,]+)/);
        const priorityMatch = trimmed.match(/priority: ([^}]+)/);
        
        if (cityMatch && dunsMatch && nameMatch && zoneMatch && tierMatch && priorityMatch) {
          mapping[cityMatch[1]] = {
            duns: dunsMatch[1],
            name: nameMatch[1],
            zone: zoneMatch[1],
            tier: parseInt(tierMatch[1]),
            priority: parseFloat(priorityMatch[1])
          };
        }
      }
    }
    
    return mapping;
  } catch (error) {
    console.error('Error loading TDSP mapping:', error);
    return {};
  }
}

async function runTests() {
  console.log('🧪 Testing TDSP mapping accuracy...');
  
  const mapping = await loadTdspMapping();
  const totalCities = Object.keys(mapping).length;
  
  console.log(`📊 Loaded mapping for ${totalCities} cities`);
  
  let passed = 0;
  let failed = 0;
  const failures = [];
  
  for (const testCase of TEST_CASES) {
    const cityData = mapping[testCase.city];
    
    if (!cityData) {
      failed++;
      failures.push(`❌ ${testCase.city}: Not found in mapping`);
      continue;
    }
    
    if (cityData.duns === testCase.expectedDuns && cityData.name === testCase.expectedTdsp) {
      passed++;
      console.log(`✅ ${testCase.city}: ${cityData.name} (${cityData.duns}) - Tier ${cityData.tier}`);
    } else {
      failed++;
      failures.push(`❌ ${testCase.city}: Expected ${testCase.expectedTdsp} (${testCase.expectedDuns}), got ${cityData.name} (${cityData.duns})`);
    }
  }
  
  console.log('\\n📈 Test Results:');
  console.log(`✅ Passed: ${passed}/${TEST_CASES.length}`);
  console.log(`❌ Failed: ${failed}/${TEST_CASES.length}`);
  console.log(`📊 Success Rate: ${Math.round((passed / TEST_CASES.length) * 100)}%`);
  
  if (failures.length > 0) {
    console.log('\\n❌ Failures:');
    failures.forEach(failure => console.log(failure));
  }
  
  // Distribution analysis
  const tdspCounts = {};
  Object.values(mapping).forEach(city => {
    const tdspName = city.name;
    if (!tdspCounts[tdspName]) {
      tdspCounts[tdspName] = { total: 0, tier1: 0, tier2: 0, tier3: 0 };
    }
    tdspCounts[tdspName].total++;
    tdspCounts[tdspName][`tier${city.tier}`]++;
  });
  
  console.log('\\n🏢 TDSP Distribution Summary:');
  Object.entries(tdspCounts).forEach(([tdspName, counts]) => {
    console.log(`${tdspName}: ${counts.total} cities`);
    console.log(`  Tier 1 (Major): ${counts.tier1}`);
    console.log(`  Tier 2 (Medium): ${counts.tier2}`);  
    console.log(`  Tier 3 (Small): ${counts.tier3}\\n`);
  });
  
  return { passed, failed, totalCities };
}

async function main() {
  const results = await runTests();
  
  if (results.failed === 0) {
    console.log('🎉 All tests passed! TDSP mapping is accurate.');
  } else {
    console.log('⚠️  Some tests failed. Review mappings for accuracy.');
  }
  
  console.log(`\\n📋 Summary:`);
  console.log(`- Total cities mapped: ${results.totalCities}`);
  console.log(`- Test coverage: ${TEST_CASES.length} key cities`);
  console.log(`- Accuracy: ${Math.round((results.passed / TEST_CASES.length) * 100)}%`);
}

main().catch(console.error);