#!/usr/bin/env node

/**
 * Extract and categorize Texas cities from TEXAS_CITIES_COMPREHENSIVE.md
 * Fixed version - extracts only actual city names, not instructions
 */

import fs from 'fs/promises';
import path from 'path';

// TDSP Service Territory definitions based on actual Texas utility service areas
const TDSP_TERRITORIES = {
  'oncor': {
    duns: '1039940674000',
    name: 'Oncor Electric Delivery',
    keywords: [
      'dallas', 'fort-worth', 'arlington', 'plano', 'garland', 'irving', 'grand-prairie',
      'mesquite', 'richardson', 'lewisville', 'mckinney', 'frisco', 'allen', 'denton',
      'carrollton', 'tyler', 'longview', 'beaumont', 'port-arthur', 'orange', 'marshall',
      'texarkana', 'paris', 'sherman', 'denison', 'greenville', 'corsicana', 'athens',
      'henderson', 'nacogdoches', 'lufkin', 'huntsville', 'palestine', 'jacksonville',
      'ennis', 'waxahachie', 'midlothian', 'cedar-hill', 'desoto', 'duncanville',
      'lancaster', 'mansfield', 'euless', 'bedford', 'hurst', 'grapevine', 'flower-mound',
      'coppell', 'farmers-branch', 'addison', 'university-park', 'highland-park',
      'rockwall', 'wylie', 'rowlett', 'sachse', 'murphy', 'sunnyvale', 'fate',
      'forney', 'terrell', 'kaufman', 'canton', 'van', 'mineola', 'quitman',
      'winnsboro', 'mount-pleasant', 'daingerfield', 'hughes-springs', 'ore-city',
      'hallsville', 'carthage', 'panola', 'beckville', 'tatum', 'overton',
      'kilgore', 'gladewater', 'white-oak', 'big-sandy', 'hawkins', 'morgansville'
    ],
    zones: ['North', 'Northeast', 'East'],
    priority: 0.8
  },
  
  'centerpoint': {
    duns: '957877905',
    name: 'CenterPoint Energy Houston Electric',
    keywords: [
      'houston', 'pearland', 'sugar-land', 'missouri-city', 'stafford', 'richmond',
      'rosenberg', 'katy', 'spring', 'cypress', 'humble', 'kingwood', 'atascocita',
      'tomball', 'magnolia', 'conroe', 'montgomery', 'willis', 'pinehurst',
      'pasadena', 'deer-park', 'la-porte', 'seabrook', 'kemah', 'league-city',
      'friendswood', 'pearland', 'alvin', 'santa-fe', 'dickinson', 'texas-city',
      'galveston', 'baytown', 'channelview', 'jacinto-city', 'galena-park',
      'south-houston', 'bellaire', 'west-university-place', 'southside-place',
      'hunters-creek', 'bunker-hill', 'hedwig', 'jersey', 'manvel', 'iowa-colony',
      'fresno', 'needville', 'orchard', 'brookshire', 'pattison', 'simonton',
      'fulshear', 'richmond', 'rosenberg', 'pleak', 'thompsons', 'kendleton'
    ],
    zones: ['Coast', 'Southeast'],
    priority: 0.9
  },
  
  'aep_central': {
    duns: '007924772',
    name: 'AEP Texas Central Company',
    keywords: [
      'waco', 'temple', 'belton', 'killeen', 'harker-heights', 'copperas-cove',
      'round-rock', 'pflugerville', 'cedar-park', 'leander', 'georgetown',
      'hutto', 'taylor', 'elgin', 'bastrop', 'smithville', 'lockhart', 'luling',
      'san-marcos', 'kyle', 'buda', 'dripping-springs', 'bee-cave', 'lakeway',
      'bryan', 'college-station', 'navasota', 'huntsville', 'madisonville',
      'crockett', 'grapeland', 'palestine', 'athens', 'corsicana', 'hillsboro',
      'whitney', 'cleburne', 'joshua', 'burleson', 'crowley', 'forest-hill',
      'everman', 'benbrook', 'river-oaks', 'westworth', 'white-settlement',
      'saginaw', 'blue-mound', 'haslet', 'keller', 'watauga', 'haltom-city',
      'richland-hills', 'north-richland-hills', 'southlake', 'colleyville',
      'trophy-club', 'roanoke', 'westlake', 'highland-village', 'double-oak'
    ],
    zones: ['Central'],
    priority: 0.7
  },
  
  'aep_north': {
    duns: '007923311', 
    name: 'AEP Texas North Company',
    keywords: [
      'abilene', 'wichita-falls', 'mineral-wells', 'weatherford', 'granbury',
      'cleburne', 'glen-rose', 'stephenville', 'brownwood', 'early', 'may',
      'blanket', 'comanche', 'dublin', 'hico', 'iredell', 'meridian', 'clifton',
      'valley-mills', 'lagrange', 'gatesville', 'hamilton', 'lampasas',
      'burnet', 'marble-falls', 'granite-shoals', 'horseshoe-bay', 'spicewood',
      'sweetwater', 'big-spring', 'snyder', 'colorado-city', 'lamesa',
      'stamford', 'anson', 'hamlin', 'rotan', 'roby', 'winters', 'ballinger',
      'coleman', 'santa-anna', 'bangs', 'cross-plains', 'clyde', 'baird',
      'cisco', 'eastland', 'ranger', 'gorman', 'desdemona', 'de-leon',
      'huckabay', 'mingus', 'strawn', 'palo-pinto', 'santo', 'millsap',
      'aledo', 'willow-park', 'hudson-oaks', 'annetta', 'cool', 'poolville'
    ],
    zones: ['North', 'Northwest'],
    priority: 0.6
  },
  
  'tnmp': {
    duns: '007929441',
    name: 'Texas-New Mexico Power Company',
    keywords: [
      'el-paso', 'corpus-christi', 'laredo', 'mcallen', 'edinburg', 'mission',
      'pharr', 'weslaco', 'mercedes', 'harlingen', 'san-benito', 'brownsville',
      'port-isabel', 'los-fresnos', 'rio-hondo', 'santa-rosa', 'la-feria',
      'donna', 'alamo', 'san-juan', 'palmview', 'palmhurst', 'penitas',
      'roma', 'rio-grande-city', 'zapata', 'hebbronville', 'alice', 'orange-grove',
      'mathis', 'odem', 'taft', 'portland', 'ingleside', 'aransas-pass',
      'rockport', 'fulton', 'sinton', 'beeville', 'george-west', 'three-rivers',
      'victoria', 'port-lavaca', 'point-comfort', 'seadrift', 'palacios',
      'bay-city', 'matagorda', 'blessing', 'el-campo', 'wharton', 'east-bernard',
      'boling', 'wallis', 'orchard', 'uvalde', 'crystal-city', 'carrizo-springs',
      'del-rio', 'brackettville', 'eagle-pass', 'castroville', 'hondo',
      'devine', 'poteet', 'pleasanton', 'floresville', 'stockdale', 'nixon',
      'gonzales', 'shiner', 'cuero', 'yoakum', 'hallettsville', 'schulenburg'
    ],
    zones: ['South', 'Valley', 'Coast'],
    priority: 0.7
  }
};

function slugifyCity(cityName) {
  return cityName
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, '') // Keep apostrophes and hyphens
    .replace(/'/g, '') // Remove apostrophes
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    + '-tx';
}

function determineTdsp(cityName, citySlug) {
  const cityLower = cityName.toLowerCase();
  const slugLower = citySlug.toLowerCase().replace('-tx', '');
  
  // Exclude known municipal utilities
  const municipalUtilities = ['austin', 'san-antonio', 'georgetown', 'garland'];
  if (municipalUtilities.some(city => slugLower.includes(city))) {
    return null;
  }
  
  // Check each TDSP territory for keyword matches
  for (const [key, territory] of Object.entries(TDSP_TERRITORIES)) {
    if (territory.keywords.some(keyword => 
      slugLower.includes(keyword) || cityLower.includes(keyword.replace('-', ' '))
    )) {
      return {
        duns: territory.duns,
        name: territory.name,
        zone: territory.zones[0],
        tier: getTier(cityName),
        priority: territory.priority * getTierMultiplier(getTier(cityName))
      };
    }
  }
  
  // Geographic fallback patterns
  if (cityLower.match(/^[h-z]/) || slugLower.includes('south') || slugLower.includes('rio')) {
    return {
      duns: TDSP_TERRITORIES.tnmp.duns,
      name: TDSP_TERRITORIES.tnmp.name,
      zone: 'South',
      tier: 3,
      priority: 0.4
    };
  }
  
  if (cityLower.match(/^[a-g]/) || slugLower.includes('bay') || slugLower.includes('galveston')) {
    return {
      duns: TDSP_TERRITORIES.centerpoint.duns,
      name: TDSP_TERRITORIES.centerpoint.name,
      zone: 'Coast',
      tier: 3,
      priority: 0.4
    };
  }
  
  // Default to Oncor (largest service territory)
  return {
    duns: TDSP_TERRITORIES.oncor.duns,
    name: TDSP_TERRITORIES.oncor.name,
    zone: 'North',
    tier: 3,
    priority: 0.3
  };
}

function getTier(cityName) {
  const majorCities = [
    'houston', 'dallas', 'fort-worth', 'arlington', 'corpus-christi', 'plano',
    'garland', 'irving', 'grand-prairie', 'mcallen', 'mesquite', 'el-paso',
    'laredo', 'lubbock', 'amarillo'
  ];
  
  const midSizeCities = [
    'brownsville', 'mckinney', 'frisco', 'pasadena', 'killeen', 'carrollton',
    'pearland', 'waco', 'richardson', 'denton', 'midland', 'abilene',
    'round-rock', 'sugar-land', 'tyler', 'wichita-falls', 'college-station',
    'league-city', 'longview', 'beaumont', 'conroe', 'edinburg'
  ];
  
  const cityLower = cityName.toLowerCase();
  
  if (majorCities.some(city => cityLower.includes(city))) return 1;
  if (midSizeCities.some(city => cityLower.includes(city))) return 2;
  return 3;
}

function getTierMultiplier(tier) {
  return tier === 1 ? 1.0 : tier === 2 ? 0.8 : 0.6;
}

async function extractCitiesFromMarkdown() {
  try {
    const filePath = path.join(process.cwd(), 'TEXAS_CITIES_COMPREHENSIVE.md');
    const content = await fs.readFile(filePath, 'utf8');
    
    const cities = [];
    const lines = content.split('\n');
    
    let inCitySection = false;
    let currentSection = '';
    
    for (const line of lines) {
      // Start of city sections
      if (line.includes('## Complete Texas Cities List')) {
        inCitySection = true;
        continue;
      }
      
      // End of city sections  
      if (line.includes('## Next Steps') || line.includes('---')) {
        if (inCitySection) break;
      }
      
      if (!inCitySection) continue;
      
      // Track alphabetical sections
      if (line.startsWith('### ')) {
        currentSection = line.replace('### ', '').trim();
        continue;
      }
      
      // Extract city names - only lines starting with "- " followed by a city name
      if (line.startsWith('- ')) {
        let cityName = line.substring(2).trim();
        
        // Skip empty lines or lines with notes
        if (!cityName || cityName.includes('Note:') || cityName.includes('*')) {
          continue;
        }
        
        // Clean up city name - remove any asterisk notes
        cityName = cityName.replace(/\s*\*.*\*/, '').trim();
        
        // Skip if this looks like instructions or non-city content
        if (cityName.includes('For each city') || 
            cityName.includes('Test every') || 
            cityName.includes('Map ZIP') || 
            cityName.includes('Create') ||
            cityName.includes('Generate') ||
            cityName.includes('Implement') ||
            cityName.length > 50) {
          continue;
        }
        
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
  console.log('🏙️  Extracting Texas cities (fixed version)...');
  
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
  
  // Display results
  console.log('\n🏢 Cities by TDSP Provider:');
  Object.entries(tdspGroups).forEach(([tdspName, tdspCities]) => {
    console.log(`\n${tdspName}: ${tdspCities.length} cities`);
    const tierCounts = { 1: 0, 2: 0, 3: 0 };
    tdspCities.forEach(city => tierCounts[city.tdsp.tier]++);
    console.log(`  Tier 1: ${tierCounts[1]}, Tier 2: ${tierCounts[2]}, Tier 3: ${tierCounts[3]}`);
    
    // Show sample cities for verification
    const samples = tdspCities.slice(0, 5).map(city => city.name).join(', ');
    console.log(`  Samples: ${samples}`);
  });
  
  if (excludedCities.length > 0) {
    console.log(`\n🚫 Excluded cities (Municipal Utilities): ${excludedCities.length}`);
    excludedCities.forEach(city => console.log(`  - ${city.name}`));
  }
  
  // Save to JSON
  const outputPath = path.join(process.cwd(), 'scripts', 'texas-cities-mapped.json');
  await fs.writeFile(outputPath, JSON.stringify({
    totalCities: cities.length,
    extractedAt: new Date().toISOString(),
    tdspGroups,
    excludedCities,
    allCities: cities
  }, null, 2));
  
  console.log(`\n💾 Saved to: ${outputPath}`);
  console.log('✅ Complete!');
}

main().catch(console.error);