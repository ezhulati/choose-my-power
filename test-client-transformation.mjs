#!/usr/bin/env node
/**
 * Test the client transformation logic with actual API data
 */

const API_BASE_URL = 'https://pricing.api.comparepower.com';

// Simulate the transformation logic
function transformPlans(apiData) {
  return apiData.map(plan => ({
    id: plan._id,
    name: plan.product.name,
    provider: {
      name: plan.product.brand.name,
      logo: '',
      rating: 0,
      reviewCount: 0,
    },
    pricing: {
      rate500kWh: plan.display_pricing_500?.avg || 0,
      rate1000kWh: plan.display_pricing_1000?.avg || 0,
      rate2000kWh: plan.display_pricing_2000?.avg || 0,
      ratePerKwh: plan.display_pricing_1000?.avg || 0,
    },
    contract: {
      length: plan.product.term,
      type: determineRateType(plan.product),
      earlyTerminationFee: plan.product.early_termination_fee || 0,
      autoRenewal: false,
      satisfactionGuarantee: false,
    },
    features: {
      greenEnergy: plan.product.percent_green || 0,
      billCredit: 0,
      freeTime: plan.product.is_time_of_use ? parseTimeOfUse(plan.product.headline) : undefined,
      deposit: {
        required: plan.product.is_pre_pay || false,
        amount: 0,
      },
    },
    availability: {
      enrollmentType: 'both',
      serviceAreas: [plan.tdsp.name],
    },
  }));
}

function determineRateType(product) {
  const name = product.name.toLowerCase();
  const headline = product.headline?.toLowerCase() || '';
  
  if (name.includes('variable') || headline.includes('variable')) return 'variable';
  if (name.includes('indexed') || headline.includes('indexed')) return 'indexed';
  return 'fixed';
}

function parseTimeOfUse(headline) {
  const timeMatch = headline.match(/(\d{1,2}:\d{2}\s*(?:am|pm))\s*to\s*(\d{1,2}:\d{2}\s*(?:am|pm))/i);
  const weekendMatch = headline.toLowerCase().includes('weekend');
  
  if (timeMatch) {
    return {
      hours: `${timeMatch[1]}-${timeMatch[2]}`,
      days: weekendMatch ? ['Saturday', 'Sunday'] : ['All'],
    };
  }
  
  return {
    hours: 'Off-peak hours',
    days: ['All'],
  };
}

async function testTransformation() {
  console.log('🔄 Testing Client Transformation Logic...\n');

  try {
    // Fetch real API data
    const queryParams = new URLSearchParams({
      group: 'default',
      tdsp_duns: '1039940674000', // Dallas/Oncor
      display_usage: 1000
    });

    const url = `${API_BASE_URL}/api/plans/current?${queryParams}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ChooseMyPower.org/1.0 Test-Transform',
      },
    });

    const apiData = await response.json();
    
    console.log(`📊 Fetched ${apiData.length} plans from API`);
    console.log(`🔄 Transforming to internal format...\n`);

    // Transform the data
    const transformedPlans = transformPlans(apiData);
    
    // Show sample transformation
    const samplePlan = transformedPlans[0];
    console.log('📋 Sample Transformed Plan:');
    console.log(JSON.stringify(samplePlan, null, 2));
    
    console.log('\n✅ Transformation successful!');
    console.log(`📈 Transformation Summary:`);
    console.log(`   Original API plans: ${apiData.length}`);
    console.log(`   Transformed plans: ${transformedPlans.length}`);
    console.log(`   Rate types found: ${[...new Set(transformedPlans.map(p => p.contract.type))].join(', ')}`);
    console.log(`   Green energy plans: ${transformedPlans.filter(p => p.features.greenEnergy > 0).length}`);
    console.log(`   Time-of-use plans: ${transformedPlans.filter(p => p.features.freeTime).length}`);
    
  } catch (error) {
    console.error('❌ Transformation test failed:', error.message);
  }
}

testTransformation();