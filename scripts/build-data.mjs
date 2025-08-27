#!/usr/bin/env node
/**
 * Build-time data fetching script
 * Pre-fetches electricity plan data for all cities and filter combinations
 * Saves data to JSON files for static site generation
 */

import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

const API_BASE_URL = 'https://pricing.api.comparepower.com';
const DATA_DIR = './src/data/generated';

// TDSP mapping (copied from config)
const tdspMapping = {
  'dallas-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  'fort-worth-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' },
  'houston-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' },
  'austin-tx': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' },
  'san-antonio-tx': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' }
};

async function ensureDir(filePath) {
  await mkdir(dirname(filePath), { recursive: true });
}

function formatCityName(citySlug) {
  return citySlug
    .split('-')
    .map(word => word === 'tx' ? 'TX' : word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(' Tx', ', TX');
}

async function fetchPlans(params) {
  const queryParams = new URLSearchParams({
    group: 'default',
    tdsp_duns: params.tdsp_duns,
    display_usage: String(params.display_usage || 1000),
  });

  if (params.term) queryParams.set('term', String(params.term));
  if (params.percent_green !== undefined) queryParams.set('percent_green', String(params.percent_green));
  
  const url = `${API_BASE_URL}/api/plans/current?${queryParams}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ChooseMyPower.org/1.0 Build-Data',
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid API response format - expected array');
    }

    return transformPlans(data);
  } catch (error) {
    console.error(`API Error for ${url}:`, error.message);
    throw error;
  }
}

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

async function buildCityData() {
  console.log('🏗️  BUILDING ELECTRICITY PLAN DATA');
  console.log('=' .repeat(50));

  const texasCities = Object.keys(tdspMapping);
  
  const buildResults = {
    cities: [],
    totalPlans: 0,
    buildTime: new Date().toISOString(),
    errors: []
  };

  // Build data for first 3 cities to test
  const citiesToBuild = texasCities.slice(0, 3);
  
  console.log(`📍 Building data for ${citiesToBuild.length} cities: ${citiesToBuild.join(', ')}`);

  for (const citySlug of citiesToBuild) {
    const cityName = citySlug.replace('-tx', '');
    const tdspInfo = tdspMapping[citySlug];
    
    console.log(`\n🏙️  Processing ${formatCityName(citySlug)}...`);

    try {
      // Fetch base plans (no filters)
      console.log('   Fetching base plans...');
      const basePlans = await fetchPlans({
        tdsp_duns: tdspInfo.duns,
        display_usage: 1000
      });

      const cityData = {
        citySlug,
        cityName: formatCityName(citySlug),
        tdsp: tdspInfo,
        baseApiUrl: citySlug.replace('-tx', ''),
        filters: {
          'no-filters': {
            plans: basePlans,
            count: basePlans.length,
            lowestRate: basePlans.length > 0 ? Math.min(...basePlans.map(p => p.pricing.rate1000kWh)) : 0,
            highestRate: basePlans.length > 0 ? Math.max(...basePlans.map(p => p.pricing.rate1000kWh)) : 0
          }
        }
      };

      console.log(`   ✅ Base plans: ${basePlans.length}`);

      // Generate common filter combinations
      const filterCombinations = [
        { filters: ['12-month'], apiParams: { term: 12 } },
        { filters: ['24-month'], apiParams: { term: 24 } },
        { filters: ['green-energy'], apiParams: { percent_green: 100 } }
      ];

      for (const combo of filterCombinations) {
        const filterKey = combo.filters.join('+');
        console.log(`   Fetching ${filterKey} plans...`);

        try {
          const apiParams = {
            tdsp_duns: tdspInfo.duns,
            display_usage: 1000,
            ...combo.apiParams
          };

          const filteredPlans = await fetchPlans(apiParams);
          
          cityData.filters[filterKey] = {
            plans: filteredPlans,
            count: filteredPlans.length,
            lowestRate: filteredPlans.length > 0 ? Math.min(...filteredPlans.map(p => p.pricing.rate1000kWh)) : 0,
            highestRate: filteredPlans.length > 0 ? Math.max(...filteredPlans.map(p => p.pricing.rate1000kWh)) : 0
          };

          console.log(`      ✅ ${filteredPlans.length} plans found`);
        } catch (error) {
          console.log(`      ❌ Failed: ${error.message}`);
          buildResults.errors.push(`${citySlug}/${filterKey}: ${error.message}`);
        }

        // Be respectful to API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Save city data to JSON file
      const cityFile = `${DATA_DIR}/${cityName}.json`;
      await ensureDir(cityFile);
      await writeFile(cityFile, JSON.stringify(cityData, null, 2));
      
      buildResults.cities.push({
        citySlug,
        cityName: formatCityName(citySlug),
        filtersBuilt: Object.keys(cityData.filters).length,
        totalPlans: cityData.filters['no-filters'].count
      });

      buildResults.totalPlans += cityData.filters['no-filters'].count;
      
      console.log(`   ✅ Saved data to ${cityFile}`);

    } catch (error) {
      console.error(`   ❌ Failed to process ${citySlug}:`, error.message);
      buildResults.errors.push(`${citySlug}: ${error.message}`);
    }

    // Delay between cities to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Save build summary
  const summaryFile = `${DATA_DIR}/build-summary.json`;
  await ensureDir(summaryFile);
  await writeFile(summaryFile, JSON.stringify(buildResults, null, 2));

  console.log('\n' + '='.repeat(50));
  console.log('📊 BUILD SUMMARY');
  console.log('='.repeat(50));
  console.log(`Cities processed: ${buildResults.cities.length}`);
  console.log(`Total plans fetched: ${buildResults.totalPlans}`);
  console.log(`Errors: ${buildResults.errors.length}`);
  
  if (buildResults.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    buildResults.errors.forEach(error => console.log(`   ${error}`));
  }

  console.log('\n✅ Build data generation complete!');
  console.log(`📁 Data saved to: ${DATA_DIR}/`);

  return buildResults;
}

// Run the build
buildCityData().catch(console.error);