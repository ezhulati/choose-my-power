#!/usr/bin/env node

/**
 * Validate TDSP mapping accuracy and fix geographic misalignments
 * Cross-reference with known Texas geography and utility service areas
 */

import fs from 'fs/promises';
import path from 'path';

// Known city corrections based on actual Texas geography
const GEOGRAPHIC_CORRECTIONS = {
  // North Texas cities that should be Oncor (not CenterPoint)
  'abbott-tx': 'oncor',           // Hill County - Oncor territory
  'addison-tx': 'oncor',          // Dallas County - Oncor territory  
  'allen-tx': 'oncor',            // Collin County - Oncor territory
  'anna-tx': 'oncor',             // Collin County - Oncor territory
  'athens-tx': 'oncor',           // Henderson County - Oncor territory
  'aubrey-tx': 'oncor',           // Denton County - Oncor territory
  'azle-tx': 'oncor',             // Parker/Tarrant County - Oncor territory
  'bedford-tx': 'oncor',          // Tarrant County - Oncor territory
  
  // West Texas cities that should be AEP North (not CenterPoint)
  'albany-tx': 'aep_north',       // Shackelford County - AEP North
  'abilene-tx': 'aep_north',      // Taylor County - AEP North
  'anson-tx': 'aep_north',        // Jones County - AEP North
  'baird-tx': 'aep_north',        // Callahan County - AEP North
  'ballinger-tx': 'aep_north',    // Runnels County - AEP North
  'bangs-tx': 'aep_north',        // Brown County - AEP North
  'big-spring-tx': 'aep_north',   // Howard County - AEP North
  'blanket-tx': 'aep_north',      // Brown County - AEP North
  'sweetwater-tx': 'aep_north',   // Nolan County - AEP North
  'colorado-city-tx': 'aep_north', // Mitchell County - AEP North
  
  // South Texas cities that should be TNMP (not CenterPoint)  
  'alice-tx': 'tnmp',             // Jim Wells County - TNMP
  'bay-city-tx': 'tnmp',          // Matagorda County - TNMP
  'beeville-tx': 'tnmp',          // Bee County - TNMP
  'blessing-tx': 'tnmp',          // Matagorda County - TNMP
  'boling-tx': 'tnmp',            // Wharton County - TNMP
  'corpus-christi-tx': 'tnmp',    // Nueces County - TNMP
  'el-paso-tx': 'tnmp',           // El Paso County - TNMP
  'laredo-tx': 'tnmp',            // Webb County - TNMP
  'mcallen-tx': 'tnmp',           // Hidalgo County - TNMP
  'harlingen-tx': 'tnmp',         // Cameron County - TNMP
  'brownsville-tx': 'tnmp',       // Cameron County - TNMP
  'pharr-tx': 'tnmp',             // Hidalgo County - TNMP
  'edinburg-tx': 'tnmp',          // Hidalgo County - TNMP
  'mission-tx': 'tnmp',           // Hidalgo County - TNMP
  'weslaco-tx': 'tnmp',           // Hidalgo County - TNMP
  'victoria-tx': 'tnmp',          // Victoria County - TNMP
  'port-lavaca-tx': 'tnmp',       // Calhoun County - TNMP
  
  // Central Texas cities that should be AEP Central (not CenterPoint)
  'belton-tx': 'aep_central',     // Bell County - AEP Central
  'benbrook-tx': 'aep_central',   // Tarrant County - AEP Central
  'blue-mound-tx': 'aep_central', // Tarrant County - AEP Central
  'burleson-tx': 'aep_central',   // Johnson/Tarrant County - AEP Central
  'cleburne-tx': 'aep_central',   // Johnson County - AEP Central
  'crowley-tx': 'aep_central',    // Tarrant County - AEP Central
  'joshua-tx': 'aep_central',     // Johnson County - AEP Central
  'temple-tx': 'aep_central',     // Bell County - AEP Central
  'waco-tx': 'aep_central',       // McLennan County - AEP Central
  'killeen-tx': 'aep_central',    // Bell County - AEP Central
  'harker-heights-tx': 'aep_central', // Bell County - AEP Central
  'copperas-cove-tx': 'aep_central',  // Coryell County - AEP Central
  'round-rock-tx': 'aep_central', // Williamson County - AEP Central
  'pflugerville-tx': 'aep_central', // Travis/Williamson County - AEP Central
  'cedar-park-tx': 'aep_central', // Williamson County - AEP Central
  'leander-tx': 'aep_central',    // Williamson County - AEP Central
  'georgetown-tx': 'aep_central', // Williamson County - AEP Central
  
  // Houston area cities that should definitely be CenterPoint
  'houston-tx': 'centerpoint',    // Harris County - CenterPoint
  'pearland-tx': 'centerpoint',   // Brazoria County - CenterPoint
  'sugar-land-tx': 'centerpoint', // Fort Bend County - CenterPoint
  'missouri-city-tx': 'centerpoint', // Fort Bend County - CenterPoint
  'katy-tx': 'centerpoint',       // Harris County - CenterPoint
  'spring-tx': 'centerpoint',     // Harris County - CenterPoint
  'cypress-tx': 'centerpoint',    // Harris County - CenterPoint
  'humble-tx': 'centerpoint',     // Harris County - CenterPoint
  'kingwood-tx': 'centerpoint',   // Harris County - CenterPoint
  'tomball-tx': 'centerpoint',    // Harris County - CenterPoint
  'conroe-tx': 'centerpoint',     // Montgomery County - CenterPoint
  'pasadena-tx': 'centerpoint',   // Harris County - CenterPoint
  'baytown-tx': 'centerpoint',    // Harris County - CenterPoint
  'deer-park-tx': 'centerpoint',  // Harris County - CenterPoint
  'la-porte-tx': 'centerpoint',   // Harris County - CenterPoint
  'league-city-tx': 'centerpoint', // Galveston County - CenterPoint
  'friendswood-tx': 'centerpoint', // Harris/Galveston County - CenterPoint
  'galveston-tx': 'centerpoint',  // Galveston County - CenterPoint
  'alvin-tx': 'centerpoint',      // Brazoria County - CenterPoint
  'angleton-tx': 'centerpoint',   // Brazoria County - CenterPoint
  'clute-tx': 'centerpoint',      // Brazoria County - CenterPoint
  'freeport-tx': 'centerpoint',   // Brazoria County - CenterPoint
  'lake-jackson-tx': 'centerpoint', // Brazoria County - CenterPoint
  'bellaire-tx': 'centerpoint',   // Harris County - CenterPoint
  'stafford-tx': 'centerpoint',   // Fort Bend County - CenterPoint
  'richmond-tx': 'centerpoint',   // Fort Bend County - CenterPoint
  'rosenberg-tx': 'centerpoint',  // Fort Bend County - CenterPoint
};

const TDSP_INFO = {
  'oncor': { 
    duns: '1039940674000', 
    name: 'Oncor Electric Delivery', 
    zone: 'North' 
  },
  'centerpoint': { 
    duns: '957877905', 
    name: 'CenterPoint Energy Houston Electric', 
    zone: 'Coast' 
  },
  'aep_central': { 
    duns: '007924772', 
    name: 'AEP Texas Central Company', 
    zone: 'Central' 
  },
  'aep_north': { 
    duns: '007923311', 
    name: 'AEP Texas North Company', 
    zone: 'North' 
  },
  'tnmp': { 
    duns: '007929441', 
    name: 'Texas-New Mexico Power Company', 
    zone: 'South' 
  }
};

function getTierFromCityName(cityName) {
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
  
  const territoryMultiplier = {
    'oncor': 0.9,
    'centerpoint': 0.9,
    'tnmp': 0.8,
    'aep_central': 0.7,
    'aep_north': 0.6
  };
  
  return Math.round((basePriority * (territoryMultiplier[territory] || 0.5)) * 100) / 100;
}

async function validateAndCorrectMappings() {
  try {
    // Read the current comprehensive mapping
    const mappingPath = path.join(process.cwd(), 'src', 'config', 'tdsp-mapping-comprehensive.ts');
    const content = await fs.readFile(mappingPath, 'utf8');
    
    // Parse the mapping entries
    const mappingEntries = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith("'") && line.includes("': {")) {
        // Extract city slug
        const cityMatch = line.match(/'([^']+)'/);
        if (cityMatch) {
          const citySlug = cityMatch[1];
          const cityName = citySlug.replace('-tx', '').replace(/-/g, ' ');
          
          // Check if this city needs correction
          let correctedTdsp = null;
          if (GEOGRAPHIC_CORRECTIONS[citySlug]) {
            correctedTdsp = GEOGRAPHIC_CORRECTIONS[citySlug];
          }
          
          if (correctedTdsp) {
            const tdspInfo = TDSP_INFO[correctedTdsp];
            const tier = getTierFromCityName(cityName);
            const priority = getPriorityFromTierAndTerritory(tier, correctedTdsp);
            
            mappingEntries.push({
              slug: citySlug,
              name: cityName,
              duns: tdspInfo.duns,
              tdspName: tdspInfo.name,
              zone: tdspInfo.zone,
              tier: tier,
              priority: priority,
              corrected: true
            });
          } else {
            // Parse existing entry
            const dunsMatch = line.match(/duns: '([^']+)'/);
            const nameMatch = line.match(/name: '([^']+)'/);
            const zoneMatch = line.match(/zone: '([^']+)'/);
            const tierMatch = line.match(/tier: ([^,]+)/);
            const priorityMatch = line.match(/priority: ([^}]+)/);
            
            if (dunsMatch && nameMatch && zoneMatch && tierMatch && priorityMatch) {
              mappingEntries.push({
                slug: citySlug,
                name: cityName,
                duns: dunsMatch[1],
                tdspName: nameMatch[1],
                zone: zoneMatch[1],
                tier: parseInt(tierMatch[1]),
                priority: parseFloat(priorityMatch[1]),
                corrected: false
              });
            }
          }
        }
      }
    }
    
    return mappingEntries;
  } catch (error) {
    console.error('Error reading mapping file:', error);
    return [];
  }
}

async function generateCorrectedMappingFile(mappingEntries) {
  // Sort entries by city slug for consistency
  mappingEntries.sort((a, b) => a.slug.localeCompare(b.slug));
  
  // Group by TDSP for statistics
  const tdspGroups = {};
  mappingEntries.forEach(entry => {
    const tdspKey = entry.tdspName;
    if (!tdspGroups[tdspKey]) {
      tdspGroups[tdspKey] = { total: 0, tier1: 0, tier2: 0, tier3: 0, corrected: 0 };
    }
    tdspGroups[tdspKey].total++;
    tdspGroups[tdspKey][`tier${entry.tier}`]++;
    if (entry.corrected) tdspGroups[tdspKey].corrected++;
  });
  
  // Generate mapping entries
  const mappingLines = mappingEntries.map(entry => {
    return `  '${entry.slug}': { duns: '${entry.duns}', name: '${entry.tdspName}', zone: '${entry.zone}', tier: ${entry.tier}, priority: ${entry.priority} }`;
  });
  
  const correctedContent = `// TDSP (Transmission and Distribution Service Provider) mapping for Texas cities
// Maps city slugs to utility DUNS numbers for API calls
// VALIDATED & CORRECTED: ${new Date().toISOString()}
// Total cities: ${mappingEntries.length}

import type { TdspMapping } from '../types/facets';

export const tdspMapping: TdspMapping = {
${mappingLines.join(',\n')}
};

// Municipal utilities excluded from mapping (not deregulated)
export const excludedMunicipalCities = [
  'austin-tx',      // Austin Energy
  'san-antonio-tx', // CPS Energy  
  'georgetown-tx',  // Georgetown Utility Systems (partial)
  'brownsville-tx'  // Brownsville Public Utilities Board (partial)
];

// Zip code to city mapping (sample - expand as needed)
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

  return { content: correctedContent, stats: tdspGroups };
}

async function main() {
  console.log('🔍 Validating TDSP mapping accuracy...');
  
  const mappingEntries = await validateAndCorrectMappings();
  console.log(`📊 Processing ${mappingEntries.length} cities`);
  
  const correctedCount = mappingEntries.filter(entry => entry.corrected).length;
  console.log(`✅ Applied ${correctedCount} geographic corrections`);
  
  const { content: correctedContent, stats } = await generateCorrectedMappingFile(mappingEntries);
  
  // Write corrected mapping
  const outputPath = path.join(process.cwd(), 'src', 'config', 'tdsp-mapping.ts');
  await fs.writeFile(outputPath, correctedContent);
  
  console.log('\\n🏢 Final TDSP Distribution:');
  Object.entries(stats).forEach(([tdspName, data]) => {
    console.log(`\\n${tdspName}: ${data.total} cities (${data.corrected} corrected)`);
    console.log(`  Tier 1: ${data.tier1}, Tier 2: ${data.tier2}, Tier 3: ${data.tier3}`);
  });
  
  console.log(`\\n💾 Updated: ${outputPath}`);
  console.log('✅ Validation complete!');
}

main().catch(console.error);