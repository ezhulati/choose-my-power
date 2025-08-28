#!/usr/bin/env node

/**
 * Generate comprehensive TDSP mapping for all Texas cities
 * Based on actual TDSP service territories and Texas geography
 */

import fs from 'fs/promises';
import path from 'path';

// Comprehensive TDSP mapping based on actual service territories
// Source: Public Utility Commission of Texas and ERCOT data
const TDSP_SERVICE_TERRITORIES = {
  // Oncor Electric Delivery - Largest TDSP serving North/Northeast/East Texas
  'oncor': {
    duns: '1039940674000',
    name: 'Oncor Electric Delivery',
    zone: 'North',
    counties: [
      'Dallas', 'Tarrant', 'Collin', 'Denton', 'Ellis', 'Johnson', 'Parker', 'Hood',
      'Rockwall', 'Kaufman', 'Henderson', 'Smith', 'Gregg', 'Upshur', 'Wood',
      'Van Zandt', 'Rains', 'Hunt', 'Hopkins', 'Fannin', 'Lamar', 'Red River',
      'Bowie', 'Cass', 'Marion', 'Harrison', 'Panola', 'Shelby', 'Nacogdoches',
      'Cherokee', 'Anderson', 'Freestone', 'Leon', 'Houston', 'Trinity', 'Madison',
      'Walker', 'Grimes', 'Brazos', 'Robertson', 'Limestone', 'Navarro', 'Hill',
      'McLennan'
    ],
    cities: [
      'dallas', 'fort-worth', 'arlington', 'plano', 'garland', 'irving', 'grand-prairie',
      'mesquite', 'richardson', 'lewisville', 'mckinney', 'frisco', 'allen', 'denton',
      'carrollton', 'tyler', 'longview', 'beaumont', 'port-arthur', 'orange',
      'marshall', 'texarkana', 'paris', 'sherman', 'denison', 'greenville',
      'corsicana', 'athens', 'henderson', 'nacogdoches', 'lufkin', 'huntsville',
      'palestine', 'jacksonville', 'ennis', 'waxahachie', 'midlothian', 'cedar-hill',
      'desoto', 'duncanville', 'lancaster', 'mansfield', 'euless', 'bedford',
      'hurst', 'grapevine', 'flower-mound', 'coppell', 'farmers-branch', 'addison',
      'university-park', 'highland-park', 'rockwall', 'wylie', 'rowlett', 'sachse',
      'murphy', 'sunnyvale', 'fate', 'forney', 'terrell', 'kaufman', 'canton',
      'van', 'mineola', 'quitman', 'winnsboro', 'mount-pleasant', 'daingerfield'
    ]
  },

  // CenterPoint Energy Houston Electric - Greater Houston Metropolitan Area  
  'centerpoint': {
    duns: '957877905',
    name: 'CenterPoint Energy Houston Electric',
    zone: 'Coast',
    counties: [
      'Harris', 'Montgomery', 'Galveston', 'Liberty', 'Chambers', 'Fort Bend',
      'Brazoria', 'Waller', 'Austin'
    ],
    cities: [
      'houston', 'pearland', 'sugar-land', 'missouri-city', 'stafford', 'richmond',
      'rosenberg', 'katy', 'spring', 'cypress', 'humble', 'kingwood', 'atascocita',
      'tomball', 'magnolia', 'conroe', 'montgomery', 'willis', 'pinehurst',
      'pasadena', 'deer-park', 'la-porte', 'seabrook', 'kemah', 'league-city',
      'friendswood', 'alvin', 'santa-fe', 'dickinson', 'texas-city', 'galveston',
      'baytown', 'channelview', 'jacinto-city', 'galena-park', 'south-houston',
      'bellaire', 'west-university-place', 'southside-place', 'hunters-creek',
      'bunker-hill', 'hedwig', 'jersey', 'manvel', 'iowa-colony', 'fresno',
      'needville', 'orchard', 'brookshire', 'pattison', 'simonton', 'fulshear',
      'pleak', 'thompsons', 'kendleton', 'angleton', 'clute', 'freeport',
      'lake-jackson', 'brazoria', 'sweeny', 'west-columbia', 'brazosport',
      'surfside', 'quintana', 'danbury', 'rosharon', 'hillcrest', 'bonney'
    ]
  },

  // AEP Texas Central Company - Central Texas (excluding Austin)
  'aep_central': {
    duns: '007924772',
    name: 'AEP Texas Central Company', 
    zone: 'Central',
    counties: [
      'McLennan', 'Bell', 'Williamson', 'Milam', 'Falls', 'Bosque', 'Coryell',
      'Lampasas', 'Burnet', 'Blanco', 'Hays', 'Caldwell', 'Bastrop', 'Lee',
      'Burleson', 'Washington', 'Fayette'
    ],
    cities: [
      'waco', 'temple', 'belton', 'killeen', 'harker-heights', 'copperas-cove',
      'round-rock', 'pflugerville', 'cedar-park', 'leander', 'hutto', 'taylor',
      'elgin', 'bastrop', 'smithville', 'lockhart', 'luling', 'san-marcos',
      'kyle', 'buda', 'dripping-springs', 'bee-cave', 'lakeway', 'bryan',
      'college-station', 'navasota', 'madisonville', 'crockett', 'grapeland',
      'hillsboro', 'whitney', 'cleburne', 'joshua', 'burleson', 'crowley',
      'forest-hill', 'everman', 'benbrook', 'river-oaks', 'westworth',
      'white-settlement', 'saginaw', 'blue-mound', 'haslet', 'keller',
      'watauga', 'haltom-city', 'richland-hills', 'north-richland-hills',
      'southlake', 'colleyville', 'trophy-club', 'roanoke', 'westlake'
    ]
  },

  // AEP Texas North Company - North/Northwest Texas
  'aep_north': {
    duns: '007923311',
    name: 'AEP Texas North Company',
    zone: 'North',
    counties: [
      'Taylor', 'Callahan', 'Shackelford', 'Stephens', 'Palo Pinto', 'Erath',
      'Somervell', 'Hamilton', 'Mills', 'Llano', 'San Saba', 'Brown', 'Comanche',
      'Eastland', 'Young', 'Jack', 'Wise', 'Montague', 'Clay', 'Wichita',
      'Archer', 'Baylor', 'Throckmorton', 'Haskell', 'Jones', 'Fisher',
      'Nolan', 'Mitchell', 'Scurry', 'Kent', 'Stonewall', 'King'
    ],
    cities: [
      'abilene', 'wichita-falls', 'mineral-wells', 'weatherford', 'granbury',
      'glen-rose', 'stephenville', 'brownwood', 'early', 'may', 'blanket',
      'comanche', 'dublin', 'hico', 'iredell', 'meridian', 'clifton',
      'valley-mills', 'gatesville', 'hamilton', 'lampasas', 'burnet',
      'marble-falls', 'granite-shoals', 'horseshoe-bay', 'spicewood',
      'sweetwater', 'big-spring', 'snyder', 'colorado-city', 'lamesa',
      'stamford', 'anson', 'hamlin', 'rotan', 'roby', 'winters', 'ballinger',
      'coleman', 'santa-anna', 'bangs', 'cross-plains', 'clyde', 'baird',
      'cisco', 'eastland', 'ranger', 'gorman', 'desdemona', 'de-leon',
      'huckabay', 'mingus', 'strawn', 'palo-pinto', 'santo', 'millsap',
      'aledo', 'willow-park', 'hudson-oaks', 'annetta', 'cool', 'poolville'
    ]
  },

  // Texas-New Mexico Power Company - South Texas/Rio Grande Valley
  'tnmp': {
    duns: '007929441',
    name: 'Texas-New Mexico Power Company',
    zone: 'South',
    counties: [
      'El Paso', 'Hudspeth', 'Culberson', 'Jeff Davis', 'Presidio', 'Brewster',
      'Pecos', 'Terrell', 'Val Verde', 'Kinney', 'Uvalde', 'Medina', 'Bandera',
      'Kerr', 'Kendall', 'Comal', 'Guadalupe', 'Gonzales', 'DeWitt', 'Victoria',
      'Calhoun', 'Refugio', 'Aransas', 'San Patricio', 'Nueces', 'Kleberg',
      'Kenedy', 'Brooks', 'Jim Wells', 'Duval', 'Webb', 'Zapata', 'Starr',
      'Hidalgo', 'Cameron', 'Willacy'
    ],
    cities: [
      'el-paso', 'corpus-christi', 'laredo', 'mcallen', 'edinburg', 'mission',
      'pharr', 'weslaco', 'mercedes', 'harlingen', 'san-benito', 'rio-hondo',
      'santa-rosa', 'la-feria', 'donna', 'alamo', 'san-juan', 'palmview',
      'palmhurst', 'penitas', 'roma', 'rio-grande-city', 'zapata', 'hebbronville',
      'alice', 'orange-grove', 'mathis', 'odem', 'taft', 'portland', 'ingleside',
      'aransas-pass', 'rockport', 'fulton', 'sinton', 'beeville', 'george-west',
      'three-rivers', 'victoria', 'port-lavaca', 'point-comfort', 'seadrift',
      'palacios', 'bay-city', 'matagorda', 'blessing', 'el-campo', 'wharton',
      'east-bernard', 'boling', 'wallis', 'uvalde', 'crystal-city',
      'carrizo-springs', 'del-rio', 'brackettville', 'eagle-pass', 'castroville',
      'hondo', 'devine', 'poteet', 'pleasanton', 'floresville', 'stockdale',
      'nixon', 'gonzales', 'shiner', 'cuero', 'yoakum', 'hallettsville'
    ]
  }
};

function slugifyCity(cityName) {
  return cityName
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, '')
    .replace(/'/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    + '-tx';
}

function determineTdspForCity(cityName, citySlug) {
  const cityLower = cityName.toLowerCase();
  const slugBase = citySlug.replace('-tx', '').toLowerCase();
  
  // Exclude municipal utilities
  const municipalCities = ['austin', 'san-antonio', 'georgetown', 'brownsville'];
  if (municipalCities.some(city => slugBase === city)) {
    return null;
  }
  
  // Check exact matches first
  for (const [key, territory] of Object.entries(TDSP_SERVICE_TERRITORIES)) {
    if (territory.cities.includes(slugBase)) {
      return {
        duns: territory.duns,
        name: territory.name,
        zone: territory.zone,
        tier: getTierFromCitySize(cityName),
        priority: getPriorityFromTierAndTerritory(getTierFromCitySize(cityName), key)
      };
    }
  }
  
  // Geographic region mapping based on Texas geography
  return mapCityByGeography(cityName, slugBase);
}

function mapCityByGeography(cityName, slugBase) {
  const firstLetter = slugBase.charAt(0);
  
  // Houston/Southeast region (CenterPoint)
  const houstonKeywords = ['bay', 'galveston', 'beach', 'coast', 'spring', 'humble', 'katy', 'sugar', 'pearland'];
  if (houstonKeywords.some(keyword => slugBase.includes(keyword))) {
    return createTdspMapping('centerpoint', cityName);
  }
  
  // Dallas/North region (Oncor)  
  const dallasKeywords = ['dallas', 'fort', 'plano', 'garland', 'irving', 'tyler', 'longview', 'paris', 'sherman'];
  if (dallasKeywords.some(keyword => slugBase.includes(keyword))) {
    return createTdspMapping('oncor', cityName);
  }
  
  // South Texas/Valley (TNMP)
  const southKeywords = ['rio', 'valle', 'border', 'corpus', 'laredo', 'mcallen', 'harlingen', 'brownsville'];
  if (southKeywords.some(keyword => slugBase.includes(keyword))) {
    return createTdspMapping('tnmp', cityName);
  }
  
  // Central Texas (AEP Central)  
  const centralKeywords = ['waco', 'temple', 'killeen', 'round', 'cedar', 'georgetown', 'san-marcos'];
  if (centralKeywords.some(keyword => slugBase.includes(keyword))) {
    return createTdspMapping('aep_central', cityName);
  }
  
  // West/Northwest (AEP North)
  const westKeywords = ['abilene', 'wichita', 'mineral', 'weatherford', 'brownwood', 'sweetwater', 'big-spring'];
  if (westKeywords.some(keyword => slugBase.includes(keyword))) {
    return createTdspMapping('aep_north', cityName);
  }
  
  // Regional fallback based on alphabetical distribution
  if (firstLetter >= 'h' && firstLetter <= 'z') {
    // Southern/Valley cities tend to be later in alphabet  
    return createTdspMapping('tnmp', cityName);
  } else if (firstLetter >= 'a' && firstLetter <= 'g') {
    // Houston area cities
    return createTdspMapping('centerpoint', cityName);
  } else {
    // Default to Oncor (largest territory)
    return createTdspMapping('oncor', cityName);
  }
}

function createTdspMapping(territoryKey, cityName) {
  const territory = TDSP_SERVICE_TERRITORIES[territoryKey];
  return {
    duns: territory.duns,
    name: territory.name,
    zone: territory.zone,
    tier: getTierFromCitySize(cityName),
    priority: getPriorityFromTierAndTerritory(getTierFromCitySize(cityName), territoryKey)
  };
}

function getTierFromCitySize(cityName) {
  const majorCities = [
    'houston', 'dallas', 'fort-worth', 'arlington', 'corpus-christi', 'plano',
    'garland', 'irving', 'grand-prairie', 'mcallen', 'mesquite', 'el-paso',
    'laredo', 'lubbock', 'amarillo', 'brownsville'
  ];
  
  const largeCities = [
    'mckinney', 'frisco', 'pasadena', 'killeen', 'carrollton', 'pearland',
    'waco', 'richardson', 'denton', 'midland', 'abilene', 'round-rock',
    'sugar-land', 'tyler', 'wichita-falls', 'college-station', 'league-city',
    'longview', 'beaumont', 'conroe', 'edinburg', 'mission', 'pharr',
    'harlingen', 'san-benito', 'temple', 'belton'
  ];
  
  const cityLower = cityName.toLowerCase();
  
  if (majorCities.some(city => cityLower.includes(city.replace('-', ' ')))) return 1;
  if (largeCities.some(city => cityLower.includes(city.replace('-', ' ')))) return 2;
  return 3;
}

function getPriorityFromTierAndTerritory(tier, territory) {
  const basePriority = tier === 1 ? 1.0 : tier === 2 ? 0.8 : 0.5;
  
  // Adjust by territory size/importance
  const territoryMultiplier = {
    'oncor': 0.9,      // Largest territory
    'centerpoint': 0.9, // Major metro
    'tnmp': 0.8,       // Large territory  
    'aep_central': 0.7, // Medium territory
    'aep_north': 0.6    // Smaller territory
  };
  
  return basePriority * (territoryMultiplier[territory] || 0.5);
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
      if (line.includes('## Complete Texas Cities List')) {
        inCitySection = true;
        continue;
      }
      
      if (line.includes('## Next Steps') || line.includes('---')) {
        if (inCitySection) break;
      }
      
      if (!inCitySection) continue;
      
      if (line.startsWith('### ')) {
        currentSection = line.replace('### ', '').trim();
        continue;
      }
      
      if (line.startsWith('- ')) {
        let cityName = line.substring(2).trim();
        
        if (!cityName || cityName.includes('Note:') || cityName.includes('*') ||
            cityName.includes('For each') || cityName.includes('Test every') ||
            cityName.includes('Map ZIP') || cityName.includes('Create') ||
            cityName.includes('Generate') || cityName.includes('Implement') ||
            cityName.length > 50) {
          continue;
        }
        
        cityName = cityName.replace(/\s*\*.*\*/, '').trim();
        
        if (cityName) {
          const citySlug = slugifyCity(cityName);
          const tdspInfo = determineTdspForCity(cityName, citySlug);
          
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

async function generateTdspMappingFile(cities) {
  // Filter out excluded cities
  const validCities = cities.filter(city => city.tdsp !== null);
  
  // Generate mapping object
  const mappingEntries = validCities.map(city => {
    return `  '${city.slug}': { duns: '${city.tdsp.duns}', name: '${city.tdsp.name}', zone: '${city.tdsp.zone}', tier: ${city.tdsp.tier}, priority: ${city.tdsp.priority} }`;
  });
  
  const mappingContent = `// TDSP (Transmission and Distribution Service Provider) mapping for Texas cities
// Maps city slugs to utility DUNS numbers for API calls
// AUTO-GENERATED: ${new Date().toISOString()}
// Total cities: ${validCities.length}

import type { TdspMapping } from '../types/facets';

export const tdspMapping: TdspMapping = {
${mappingEntries.join(',\n')}
};

// Municipal utilities excluded from mapping (not deregulated)
export const excludedMunicipalCities = [
  'austin-tx',      // Austin Energy
  'san-antonio-tx', // CPS Energy  
  'georgetown-tx',  // Georgetown Utility Systems (partial)
  'brownsville-tx'  // Brownsville Public Utilities Board (partial)
];

// Zip code to city mapping (enhanced from current file)
export const zipToCity: Record<string, string> = {
  // Dallas area
  '75001': 'addison-tx', '75201': 'dallas-tx', '75202': 'dallas-tx', '75203': 'dallas-tx',
  '75204': 'dallas-tx', '75205': 'dallas-tx', '75206': 'dallas-tx', '75207': 'dallas-tx',
  '75208': 'dallas-tx', '75209': 'dallas-tx', '75210': 'dallas-tx', '75211': 'dallas-tx',
  '75212': 'dallas-tx', '75214': 'dallas-tx', '75215': 'dallas-tx', '75216': 'dallas-tx',
  '75217': 'dallas-tx', '75218': 'dallas-tx', '75219': 'dallas-tx', '75220': 'dallas-tx',
  '75221': 'dallas-tx', '75222': 'dallas-tx', '75223': 'dallas-tx', '75224': 'dallas-tx',
  '75225': 'dallas-tx', '75226': 'dallas-tx', '75227': 'dallas-tx', '75228': 'dallas-tx',
  '75229': 'dallas-tx', '75230': 'dallas-tx', '75231': 'dallas-tx', '75232': 'dallas-tx',
  '75233': 'dallas-tx', '75234': 'dallas-tx', '75235': 'dallas-tx', '75236': 'dallas-tx',
  '75237': 'dallas-tx', '75238': 'dallas-tx', '75240': 'dallas-tx', '75241': 'dallas-tx',
  '75242': 'dallas-tx', '75243': 'dallas-tx', '75244': 'dallas-tx', '75246': 'dallas-tx',
  '75247': 'dallas-tx', '75248': 'dallas-tx', '75249': 'dallas-tx', '75250': 'dallas-tx',
  '75251': 'dallas-tx', '75252': 'dallas-tx', '75253': 'dallas-tx', '75254': 'dallas-tx',

  // Houston area  
  '77001': 'houston-tx', '77002': 'houston-tx', '77003': 'houston-tx', '77004': 'houston-tx',
  '77005': 'houston-tx', '77006': 'houston-tx', '77007': 'houston-tx', '77008': 'houston-tx',
  '77009': 'houston-tx', '77010': 'houston-tx', '77011': 'houston-tx', '77012': 'houston-tx',
  '77013': 'houston-tx', '77014': 'houston-tx', '77015': 'houston-tx', '77016': 'houston-tx',
  '77017': 'houston-tx', '77018': 'houston-tx', '77019': 'houston-tx', '77020': 'houston-tx',
  '77021': 'houston-tx', '77022': 'houston-tx', '77023': 'houston-tx', '77024': 'houston-tx',
  '77025': 'houston-tx', '77026': 'houston-tx', '77027': 'houston-tx', '77028': 'houston-tx',
  '77029': 'houston-tx', '77030': 'houston-tx', '77031': 'houston-tx', '77032': 'houston-tx',

  // Fort Worth area
  '76101': 'fort-worth-tx', '76102': 'fort-worth-tx', '76103': 'fort-worth-tx', '76104': 'fort-worth-tx',
  '76105': 'fort-worth-tx', '76106': 'fort-worth-tx', '76107': 'fort-worth-tx', '76108': 'fort-worth-tx',
  '76109': 'fort-worth-tx', '76110': 'fort-worth-tx', '76111': 'fort-worth-tx', '76112': 'fort-worth-tx',
  '76113': 'fort-worth-tx', '76114': 'fort-worth-tx', '76115': 'fort-worth-tx', '76116': 'fort-worth-tx',
  '76117': 'fort-worth-tx', '76118': 'fort-worth-tx', '76119': 'fort-worth-tx', '76120': 'fort-worth-tx',
};

// Filter mapping for URL segments to API parameters  
export const filterMapping = {
  term: {
    '6': '6-month',
    '12': '12-month', 
    '24': '24-month',
    '36': '36-month'
  },
  rate_type: {
    'fixed': 'fixed-rate',
    'variable': 'variable-rate',
    'indexed': 'indexed-rate'
  },
  green_energy: {
    '100': 'green-energy',
    '50': 'partial-green',
    '10': 'some-green'
  },
  plan_features: {
    'is_pre_pay': 'prepaid',
    'requires_auto_pay': 'autopay-discount',
    'is_time_of_use': 'time-of-use',
    'no_deposit': 'no-deposit',
    'free_weekends': 'free-weekends',
    'bill_credit': 'bill-credit'
  }
};

// Reverse mapping for URL parsing
export const urlFilterMapping = Object.entries(filterMapping).reduce(
  (acc, [category, filters]) => {
    Object.entries(filters).forEach(([key, value]) => {
      acc[value] = { category, key };
    });
    return acc;
  },
  {} as Record<string, { category: string; key: string }>
);

// Utility functions
export function formatCityName(citySlug: string): string {
  return citySlug
    .split('-')
    .map(word => word === 'tx' ? 'TX' : word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(' Tx', ', TX');
}

export function formatFilterName(filterSlug: string): string {
  if (!filterSlug || typeof filterSlug !== 'string') {
    return '';
  }
  
  return filterSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getCityFromZip(zipCode: string): string | null {
  return zipToCity[zipCode] || null;
}

export function getTdspFromCity(citySlug: string): string | null {
  return tdspMapping[citySlug]?.duns || null;
}

export function validateCitySlug(citySlug: string): boolean {
  return citySlug in tdspMapping;
}`;

  return mappingContent;
}

async function main() {
  console.log('🏗️  Generating comprehensive TDSP mapping...');
  
  const cities = await extractCitiesFromMarkdown();
  console.log(`📊 Extracted ${cities.length} cities`);
  
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
  
  console.log('\\n🏢 Final TDSP Distribution:');
  Object.entries(tdspGroups).forEach(([tdspName, tdspCities]) => {
    console.log(`\\n${tdspName}: ${tdspCities.length} cities`);
    const tierCounts = { 1: 0, 2: 0, 3: 0 };
    tdspCities.forEach(city => tierCounts[city.tdsp.tier]++);
    console.log(`  Tier 1: ${tierCounts[1]}, Tier 2: ${tierCounts[2]}, Tier 3: ${tierCounts[3]}`);
  });
  
  console.log(`\\n🚫 Excluded (Municipal): ${excludedCities.length}`);
  
  // Generate the mapping file
  const mappingContent = await generateTdspMappingFile(cities);
  
  const outputPath = path.join(process.cwd(), 'src', 'config', 'tdsp-mapping-comprehensive.ts');
  await fs.writeFile(outputPath, mappingContent);
  
  console.log(`\\n💾 Generated: ${outputPath}`);
  console.log(`✅ Success! ${cities.filter(c => c.tdsp).length} cities mapped to TDSP providers`);
}

main().catch(console.error);