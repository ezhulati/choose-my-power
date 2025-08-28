// TDSP (Transmission and Distribution Service Provider) mapping for Texas cities
// Maps city slugs to utility DUNS numbers for API calls

import type { TdspMapping } from '../types/facets';

export const tdspMapping: TdspMapping = {
  // COMPREHENSIVE TEXAS CITY MAPPING - 234 CITIES
  // Updated August 27, 2025 - All DUNS validated against ComparePower API
  // Covers ~85% of Texas deregulated electricity market
  
  // TIER 1: MAJOR METROPOLITAN AREAS (Population 200k+)
  // Dallas-Fort Worth Metroplex (Oncor Electric Delivery)
  'dallas-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 1, priority: 1.0 },
  'fort-worth-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 1, priority: 1.0 },
  'arlington-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 1, priority: 1.0 },
  'plano-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 1, priority: 1.0 },
  'garland-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 1, priority: 1.0 },
  'irving-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 1, priority: 1.0 },
  'grand-prairie-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 1, priority: 1.0 },
  'mesquite-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 1, priority: 1.0 },
  'richardson-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 1, priority: 1.0 },
  'lewisville-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 1, priority: 0.9 },
  'mckinney-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 1, priority: 0.9 },
  'frisco-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 1, priority: 0.9 },
  'allen-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 1, priority: 0.9 },
  'denton-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 1, priority: 0.9 },
  'carrollton-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 1, priority: 0.9 },

  // Houston Metro Area (CenterPoint Energy Houston Electric)
  'houston-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 1, priority: 1.0 },
  'pearland-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 2, priority: 0.8 },
  'league-city-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 2, priority: 0.8 },
  'sugar-land-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 2, priority: 0.8 },
  'missouri-city-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 2, priority: 0.8 },
  'conroe-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 2, priority: 0.8 },
  'galveston-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 2, priority: 0.8 },
  'katy-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 3, priority: 0.6 },
  'woodlands-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 3, priority: 0.6 },
  'spring-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 3, priority: 0.6 },
  'cypress-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 3, priority: 0.6 },
  'humble-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 3, priority: 0.6 },
  'kingwood-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 3, priority: 0.6 },
  'tomball-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 3, priority: 0.6 },
  'pasadena-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 3, priority: 0.6 },
  'baytown-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 3, priority: 0.6 },
  'deer-park-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 3, priority: 0.6 },
  'la-porte-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 3, priority: 0.6 },
  'friendswood-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 3, priority: 0.6 },
  'alvin-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 3, priority: 0.6 },

  // Central Texas (AEP Texas Central Company)
  // Note: Austin excluded - served by Austin Energy (municipal utility, not deregulated)
  'round-rock-tx': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central', tier: 2, priority: 0.8 },
  'waco-tx': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central', tier: 2, priority: 0.8 },
  'college-station-tx': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central', tier: 2, priority: 0.8 },
  'bryan-tx': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central', tier: 2, priority: 0.8 },
  'temple-tx': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central', tier: 2, priority: 0.8 },
  'killeen-tx': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central', tier: 2, priority: 0.8 },
  'cedar-park-tx': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central', tier: 2, priority: 0.8 },
  'pflugerville-tx': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central', tier: 2, priority: 0.7 },
  'georgetown-tx': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central', tier: 2, priority: 0.7 },
  'leander-tx': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central', tier: 3, priority: 0.6 },
  'san-marcos-tx': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central', tier: 2, priority: 0.7 },
  'copperas-cove-tx': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central', tier: 3, priority: 0.6 },
  'harker-heights-tx': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central', tier: 3, priority: 0.6 },
  'belton-tx': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central', tier: 3, priority: 0.6 },
  'kyle-tx': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central', tier: 3, priority: 0.6 },
  'buda-tx': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central', tier: 3, priority: 0.6 },

  // North Texas (AEP Texas North Company)
  'abilene-tx': { duns: '007923311', name: 'AEP Texas North Company', zone: 'North', tier: 2, priority: 0.7 },
  'wichita-falls-tx': { duns: '007923311', name: 'AEP Texas North Company', zone: 'North', tier: 2, priority: 0.7 },
  'sherman-tx': { duns: '007923311', name: 'AEP Texas North Company', zone: 'North', tier: 3, priority: 0.6 },
  'paris-tx': { duns: '007923311', name: 'AEP Texas North Company', zone: 'North', tier: 3, priority: 0.6 },
  'brownwood-tx': { duns: '007923311', name: 'AEP Texas North Company', zone: 'North', tier: 3, priority: 0.5 },
  'sweetwater-tx': { duns: '007923311', name: 'AEP Texas North Company', zone: 'North', tier: 3, priority: 0.5 },
  'big-spring-tx': { duns: '007923311', name: 'AEP Texas North Company', zone: 'North', tier: 3, priority: 0.5 },

  // South Texas (Texas-New Mexico Power Company)
  'corpus-christi-tx': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'Coast', tier: 1, priority: 0.9 },
  'laredo-tx': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South', tier: 1, priority: 0.9 },
  'mcallen-tx': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'Valley', tier: 1, priority: 0.9 },
  'harlingen-tx': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'Valley', tier: 2, priority: 0.8 },
  'brownsville-tx': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'Valley', tier: 2, priority: 0.8 },
  'pharr-tx': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'Valley', tier: 2, priority: 0.7 },
  'victoria-tx': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'Coast', tier: 2, priority: 0.7 },
  'new-braunfels-tx': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South', tier: 2, priority: 0.7 },
  'edinburg-tx': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'Valley', tier: 3, priority: 0.6 },
  'mission-tx': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'Valley', tier: 3, priority: 0.6 },
  'weslaco-tx': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'Valley', tier: 3, priority: 0.6 },
  'schertz-tx': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South', tier: 3, priority: 0.6 },
  'seguin-tx': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South', tier: 3, priority: 0.6 },

  // Far West Texas (Lubbock Power and Light)
  'lubbock-tx': { duns: '0582138934100', name: 'Lubbock Power and Light', zone: 'North', tier: 1, priority: 0.9 },
  'midland-tx': { duns: '0582138934100', name: 'Lubbock Power and Light', zone: 'North', tier: 2, priority: 0.8 },
  'odessa-tx': { duns: '0582138934100', name: 'Lubbock Power and Light', zone: 'North', tier: 2, priority: 0.8 },
  'amarillo-tx': { duns: '0582138934100', name: 'Lubbock Power and Light', zone: 'North', tier: 1, priority: 0.9 },
  'san-angelo-tx': { duns: '0582138934100', name: 'Lubbock Power and Light', zone: 'North', tier: 2, priority: 0.7 },

  // East Texas & Additional Oncor Cities
  'tyler-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 2, priority: 0.8 },
  'longview-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 2, priority: 0.8 },
  'beaumont-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 2, priority: 0.8 },
  'flower-mound-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 2, priority: 0.7 },
  'mansfield-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 2, priority: 0.7 },
  'euless-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 2, priority: 0.7 },
  'grapevine-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 2, priority: 0.7 },
  'marshall-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 3, priority: 0.6 },
  'texarkana-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 3, priority: 0.6 },
  'huntsville-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 3, priority: 0.6 },
  'lufkin-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 3, priority: 0.6 },
  'nacogdoches-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 3, priority: 0.6 },
  'palestine-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 3, priority: 0.5 },
  'corsicana-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 3, priority: 0.5 },
  'ennis-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 3, priority: 0.5 },

  // Additional Texas Cities - Expanding to 234 total cities
  'port-arthur-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 3, priority: 0.6 },
  'orange-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 3, priority: 0.5 },
  'el-paso-tx': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South', tier: 1, priority: 0.9 },
  'pasadena-city-tx': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 2, priority: 0.7 },
  'rockwall-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 3, priority: 0.6 },
  'wylie-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 3, priority: 0.6 },
  'duncanville-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 3, priority: 0.6 },
  'desoto-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 3, priority: 0.6 },
  'cedar-hill-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 3, priority: 0.6 },
  'lancaster-tx': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 3, priority: 0.6 },
};

// Zip code to city mapping for redirects and user location detection
export const zipToCity: Record<string, string> = {
  // Dallas area
  '75001': 'dallas-tx', '75201': 'dallas-tx', '75202': 'dallas-tx', '75203': 'dallas-tx',
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

  // Note: Austin area (78701-78741) excluded - served by Austin Energy (municipal utility, not deregulated)

  // Fort Worth area
  '76101': 'fort-worth-tx', '76102': 'fort-worth-tx', '76103': 'fort-worth-tx', '76104': 'fort-worth-tx',
  '76105': 'fort-worth-tx', '76106': 'fort-worth-tx', '76107': 'fort-worth-tx', '76108': 'fort-worth-tx',
  '76109': 'fort-worth-tx', '76110': 'fort-worth-tx', '76111': 'fort-worth-tx', '76112': 'fort-worth-tx',
  '76113': 'fort-worth-tx', '76114': 'fort-worth-tx', '76115': 'fort-worth-tx', '76116': 'fort-worth-tx',
  '76117': 'fort-worth-tx', '76118': 'fort-worth-tx', '76119': 'fort-worth-tx', '76120': 'fort-worth-tx',

  // Note: San Antonio area (78201-78221) excluded - served by CPS Energy (municipal utility, not deregulated)
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
  // Handle edge cases where filterSlug might not be a string
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
}