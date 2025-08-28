#!/usr/bin/env node

/**
 * Extract and categorize all Texas cities from TEXAS_CITIES_COMPREHENSIVE.md
 * Maps cities to TDSP service territories based on geographic analysis
 */

import fs from 'fs/promises';
import path from 'path';

// TDSP Service Territory Analysis based on geographic regions and ZIP code patterns
const TDSP_SERVICE_AREAS = {
  // Oncor Electric Delivery - Largest TDSP in Texas
  // Serves North/Northeast/East Texas including Dallas-Fort Worth Metroplex
  'oncor': {
    duns: '1039940674000',
    name: 'Oncor Electric Delivery',
    zones: ['North', 'Northeast', 'East'],
    counties: [
      'Dallas', 'Tarrant', 'Collin', 'Denton', 'Ellis', 'Johnson', 'Parker',
      'Rockwall', 'Kaufman', 'Henderson', 'Smith', 'Gregg', 'Upshur', 'Wood',
      'Van Zandt', 'Rains', 'Hunt', 'Hopkins', 'Fannin', 'Lamar', 'Red River',
      'Bowie', 'Cass', 'Marion', 'Harrison', 'Marshall', 'Panola', 'Shelby',
      'Nacogdoches', 'Cherokee', 'Anderson', 'Freestone', 'Leon', 'Houston',
      'Trinity', 'Madison', 'Walker', 'Montgomery', 'Grimes', 'Brazos',
      'Robertson', 'Limestone', 'Navarro', 'Hill', 'McLennan'
    ],
    citiesPattern: /north|east|dallas|fort-worth|tyler|longview|marshall|texarkana|paris|sherman|denison|plano|frisco|allen|mckinney|garland|mesquite|richardson|irving|grand-prairie|lewisville|flower-mound|carrollton|addison|farmers-branch/i
  },

  // CenterPoint Energy Houston Electric
  // Serves Greater Houston Metropolitan Area
  'centerpoint': {
    duns: '957877905',
    name: 'CenterPoint Energy Houston Electric',
    zones: ['Coast', 'Southeast'],
    counties: [
      'Harris', 'Montgomery', 'Galveston', 'Liberty', 'Chambers', 'Fort Bend',
      'Brazoria', 'Waller', 'Austin', 'Grimes'
    ],
    citiesPattern: /houston|pearland|sugar-land|missouri-city|league-city|galveston|conroe|katy|spring|cypress|humble|kingwood|tomball|pasadena|baytown|deer-park|la-porte|friendswood|alvin|angleton|bellaire|stafford|richmond|rosenberg/i
  },

  // AEP Texas Central Company
  // Serves Central Texas (excludes Austin - municipal utility)
  'aep_central': {
    duns: '007924772',
    name: 'AEP Texas Central Company',
    zones: ['Central'],
    counties: [
      'McLennan', 'Bell', 'Williamson', 'Milam', 'Falls', 'Bosque', 'Hill',
      'Coryell', 'Lampasas', 'Burnet', 'Blanco', 'Hays', 'Caldwell', 'Bastrop',
      'Lee', 'Burleson', 'Washington', 'Fayette'
    ],
    citiesPattern: /waco|temple|killeen|round-rock|georgetown|pflugerville|cedar-park|leander|belton|harker-heights|copperas-cove|bryan|college-station|huntsville|brenham/i
  },

  // AEP Texas North Company
  // Serves North/Northwest Texas
  'aep_north': {
    duns: '007923311',
    name: 'AEP Texas North Company',
    zones: ['North', 'Northwest'],
    counties: [
      'Taylor', 'Callahan', 'Shackelford', 'Stephens', 'Palo Pinto', 'Parker',
      'Hood', 'Somervell', 'Johnson', 'Bosque', 'Hamilton', 'Mills', 'Lampasas',
      'Burnet', 'Llano', 'San Saba', 'Brown', 'Comanche', 'Eastland', 'Erath',
      'Young', 'Jack', 'Wise', 'Montague', 'Clay', 'Wichita', 'Archer', 'Baylor',
      'Throckmorton', 'Haskell', 'Jones', 'Fisher', 'Nolan', 'Mitchell',
      'Scurry', 'Kent', 'Stonewall', 'King'
    ],
    citiesPattern: /abilene|wichita-falls|brownwood|mineral-wells|weatherford|granbury|cleburne|glen-rose|stephenville|sweetwater|big-spring|snyder|stamford|anson|hamlin|rotan|colorado-city/i
  },

  // Texas-New Mexico Power Company (TNMP)
  // Serves South Texas and Rio Grande Valley
  'tnmp': {
    duns: '007929441',
    name: 'Texas-New Mexico Power Company',
    zones: ['South', 'Valley', 'Coast'],
    counties: [
      'El Paso', 'Hudspeth', 'Culberson', 'Jeff Davis', 'Presidio', 'Brewster',
      'Pecos', 'Terrell', 'Val Verde', 'Kinney', 'Uvalde', 'Medina', 'Bandera',
      'Kerr', 'Kendall', 'Comal', 'Guadalupe', 'Gonzales', 'DeWitt', 'Victoria',
      'Calhoun', 'Refugio', 'Aransas', 'San Patricio', 'Nueces', 'Kleberg',
      'Kenedy', 'Brooks', 'Jim Wells', 'Duval', 'Webb', 'Zapata', 'Starr',
      'Hidalgo', 'Cameron', 'Willacy'
    ],
    citiesPattern: /el-paso|corpus-christi|laredo|mcallen|brownsville|harlingen|edinburg|mission|pharr|weslaco|mercedes|san-benito|rio-grande-city|roma|zapata|hebbronville|alice|kingsville|beeville|victoria|port-lavaca|bay-city|uvalde|del-rio|eagle-pass/i
  }
};

// Cities that should be excluded (municipal utilities - not deregulated)
const EXCLUDED_CITIES = [
  'austin', // Austin Energy
  'san-antonio', // CPS Energy  
  'georgetown', // Georgetown Utility Systems (partial)
  'bryan', // Bryan Texas Utilities (partial)
  'college-station', // College Station Utilities (partial)
  'denton', // Denton Municipal Electric (partial)
  'garland' // Garland Power & Light (partial)
];

// Known municipal utility cities that may appear in the list
const MUNICIPAL_UTILITIES = {
  'austin-tx': 'Austin Energy (municipal utility - not deregulated)',
  'san-antonio-tx': 'CPS Energy (municipal utility - not deregulated)', 
  'brownsville-tx': 'Brownsville Public Utilities Board (municipal - mixed service)'
};

function slugifyCity(cityName) {
  return cityName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    + '-tx';
}

function determineTdsp(cityName, citySlug) {
  // Check for municipal utilities first
  if (MUNICIPAL_UTILITIES[citySlug]) {
    return null; // Exclude municipal utilities
  }

  // Check each TDSP service area
  for (const [key, tdsp] of Object.entries(TDSP_SERVICE_AREAS)) {
    if (tdsp.citiesPattern.test(citySlug) || tdsp.citiesPattern.test(cityName.toLowerCase())) {
      return {
        duns: tdsp.duns,
        name: tdsp.name,
        zone: tdsp.zones[0], // Use primary zone
        tier: getTierFromPopulationEstimate(cityName),
        priority: getPriorityFromTier(getTierFromPopulationEstimate(cityName))
      };
    }
  }

  // Geographic region fallback based on alphabetical patterns and known Texas geography
  const cityLower = cityName.toLowerCase();
  const slugLower = citySlug.toLowerCase();

  // Houston/Southeast Texas region
  if (cityLower.match(/^(a|b|c|d|e|f|g|h)/) && 
      (slugLower.includes('houston') || slugLower.includes('galveston') || 
       slugLower.includes('baytown') || slugLower.includes('pasadena'))) {
    return {
      duns: TDSP_SERVICE_AREAS.centerpoint.duns,
      name: TDSP_SERVICE_AREAS.centerpoint.name,
      zone: 'Coast',
      tier: 3,
      priority: 0.5
    };
  }

  // Dallas/North Texas region (Oncor - largest service area)
  if (cityLower.match(/^(d|f|g|i|l|m|p|r|t|w)/) || 
      slugLower.includes('dallas') || slugLower.includes('fort-worth') ||
      slugLower.includes('tyler') || slugLower.includes('longview')) {
    return {
      duns: TDSP_SERVICE_AREAS.oncor.duns,
      name: TDSP_SERVICE_AREAS.oncor.name,
      zone: 'North',
      tier: 3,
      priority: 0.5
    };
  }

  // South Texas/Valley region (TNMP)
  if (cityLower.match(/^(b|c|e|l|m|p|r|s|z)/) &&
      (slugLower.includes('rio') || slugLower.includes('valle') || 
       slugLower.includes('south') || slugLower.includes('border'))) {
    return {
      duns: TDSP_SERVICE_AREAS.tnmp.duns,
      name: TDSP_SERVICE_AREAS.tnmp.name,
      zone: 'South',
      tier: 3,
      priority: 0.4
    };
  }

  // Central Texas region (AEP Central)
  if (cityLower.match(/^(b|c|f|g|h|k|l|r|t|w)/) &&
      (slugLower.includes('central') || slugLower.includes('bell') || 
       slugLower.includes('temple') || slugLower.includes('waco'))) {
    return {
      duns: TDSP_SERVICE_AREAS.aep_central.duns,
      name: TDSP_SERVICE_AREAS.aep_central.name,
      zone: 'Central',
      tier: 3,
      priority: 0.5
    };
  }

  // West/Northwest Texas region (AEP North) 
  if (cityLower.match(/^(a|b|c|m|s|w)/) &&
      (slugLower.includes('west') || slugLower.includes('abilene') || 
       slugLower.includes('mineral') || slugLower.includes('weatherford'))) {
    return {
      duns: TDSP_SERVICE_AREAS.aep_north.duns,
      name: TDSP_SERVICE_AREAS.aep_north.name,
      zone: 'North',
      tier: 3,
      priority: 0.4
    };
  }

  // Default fallback - Oncor (largest coverage area in Texas)
  return {
    duns: TDSP_SERVICE_AREAS.oncor.duns,
    name: TDSP_SERVICE_AREAS.oncor.name,
    zone: 'North',
    tier: 3,
    priority: 0.3
  };
}

function getTierFromPopulationEstimate(cityName) {
  // Major metropolitan cities (Tier 1)
  const majorCities = [
    'houston', 'dallas', 'fort-worth', 'austin', 'san-antonio', 
    'el-paso', 'arlington', 'corpus-christi', 'plano', 'laredo',
    'lubbock', 'irving', 'garland', 'amarillo', 'grand-prairie'
  ];
  
  // Mid-size cities (Tier 2)  
  const midSizeCities = [
    'mcallen', 'mesquite', 'brownsville', 'mckinney', 'frisco',
    'pasadena', 'killeen', 'carrollton', 'pearland', 'waco',
    'richardson', 'denton', 'midland', 'abilene', 'round-rock',
    'sugar-land', 'tyler', 'wichita-falls', 'college-station'
  ];

  const cityLower = cityName.toLowerCase();
  
  if (majorCities.some(city => cityLower.includes(city))) {
    return 1;
  } else if (midSizeCities.some(city => cityLower.includes(city))) {
    return 2;
  } else {
    return 3;
  }
}

function getPriorityFromTier(tier) {
  switch (tier) {
    case 1: return 0.9;
    case 2: return 0.7;
    case 3: return 0.5;
    default: return 0.3;
  }
}

async function extractCitiesFromMarkdown() {
  try {
    const filePath = path.join(process.cwd(), 'TEXAS_CITIES_COMPREHENSIVE.md');
    const content = await fs.readFile(filePath, 'utf8');
    
    const cities = [];
    const lines = content.split('\n');
    
    let currentSection = '';
    for (const line of lines) {
      // Track current alphabetical section
      if (line.startsWith('### ')) {
        currentSection = line.replace('### ', '').trim();
        continue;
      }
      
      // Extract city names from bullet points
      const cityMatch = line.match(/^-\s+(.+?)(?:\s*\*.*\*)?$/);
      if (cityMatch) {
        let cityName = cityMatch[1].trim();
        
        // Skip notes and empty lines
        if (cityName.includes('Note:') || cityName.includes('*')) {
          continue;
        }
        
        // Clean up city name
        cityName = cityName.replace(/\s*\*.*\*/, '').trim();
        
        if (cityName && cityName !== '') {
          const citySlug = slugifyCity(cityName);
          const tdspInfo = determineTdsp(cityName, citySlug);
          
          cities.push({
            name: cityName,
            slug: citySlug,
            section: currentSection,
            tdsp: tdspInfo
          });
        }
      }
    }
    
    return cities;
  } catch (error) {
    console.error('Error reading cities file:', error);
    return [];
  }
}

async function main() {
  console.log('🏙️  Extracting Texas cities from TEXAS_CITIES_COMPREHENSIVE.md...');
  
  const cities = await extractCitiesFromMarkdown();
  
  console.log(`\n📊 Analysis Results:`);
  console.log(`Total cities extracted: ${cities.length}`);
  
  // Group by TDSP
  const tdspGroups = {};
  const excludedCities = [];
  
  cities.forEach(city => {
    if (!city.tdsp) {
      excludedCities.push(city);
      return;
    }
    
    const tdspName = city.tdsp.name;
    if (!tdspGroups[tdspName]) {
      tdspGroups[tdspName] = [];
    }
    tdspGroups[tdspName].push(city);
  });
  
  // Display results by TDSP
  console.log('\n🏢 Cities by TDSP Provider:');
  Object.entries(tdspGroups).forEach(([tdspName, cities]) => {
    console.log(`\n${tdspName}: ${cities.length} cities`);
    const tierCounts = { 1: 0, 2: 0, 3: 0 };
    cities.forEach(city => tierCounts[city.tdsp.tier]++);
    console.log(`  Tier 1 (Major): ${tierCounts[1]}, Tier 2 (Mid): ${tierCounts[2]}, Tier 3 (Small): ${tierCounts[3]}`);
  });
  
  if (excludedCities.length > 0) {
    console.log(`\n🚫 Excluded cities (Municipal Utilities): ${excludedCities.length}`);
    excludedCities.forEach(city => {
      console.log(`  - ${city.name} (${city.slug})`);
    });
  }
  
  // Save results to JSON file for further processing
  const outputPath = path.join(process.cwd(), 'scripts', 'extracted-cities.json');
  await fs.writeFile(outputPath, JSON.stringify({
    totalCities: cities.length,
    extractedAt: new Date().toISOString(),
    tdspGroups,
    excludedCities,
    allCities: cities
  }, null, 2));
  
  console.log(`\n💾 Results saved to: ${outputPath}`);
  console.log('✅ City extraction complete!');
  
  return cities;
}

// Run the main function
main().catch(console.error);

export { extractCitiesFromMarkdown, determineTdsp, TDSP_SERVICE_AREAS };