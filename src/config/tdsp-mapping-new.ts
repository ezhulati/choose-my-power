// TDSP (Transmission and Distribution Service Provider) mapping for Texas cities
// Maps city slugs to utility DUNS numbers for API calls
// VALIDATED & CORRECTED: 2025-08-31 (UPDATED: Removed -tx suffixes for cleaner URLs)
// Total cities: 880

import type { TdspMapping } from '../types/facets';

export const tdspMapping: TdspMapping = {
  'abbott': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 3, priority: 0.45 },
  'abilene': { duns: '007923311', name: 'AEP Texas North Company', zone: 'North', tier: 2, priority: 0.48 },
  'abram': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 3, priority: 0.45 },
  'ackerly': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 3, priority: 0.45 },
  'addison': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 3, priority: 0.45 },
  'alamo': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South', tier: 3, priority: 0.4 },
  'albany': { duns: '007923311', name: 'AEP Texas North Company', zone: 'North', tier: 3, priority: 0.3 },
  'aledo': { duns: '007923311', name: 'AEP Texas North Company', zone: 'North', tier: 3, priority: 0.3 },
  'alice': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South', tier: 3, priority: 0.4 },
  'allen': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North', tier: 3, priority: 0.45 },
  'alleyton': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 3, priority: 0.45 },
  'alma': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast', tier: 3, priority: 0.45 },