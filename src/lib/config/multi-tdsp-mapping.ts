// Multi-TDSP Mapping Configuration
// Handles ZIP codes and cities that are served by multiple TDSPs
// Created: 2025-08-28 for test infrastructure stabilization

export interface MultiTdspMapping {
  [zipCode: string]: {
    tdsps: Array<{
      duns: string;
      name: string;
      marketShare: number; // Percentage of area served
      priority: number; // Default selection priority
    }>;
    primaryTdsp: string; // DUNS of primary TDSP
    notes?: string;
  };
}

export interface TdspInfo {
  [duns: string]: {
    name: string;
    shortName: string;
    zone: string;
    coverage: string[];
  };
}

// Multi-TDSP ZIP codes that have overlapping service areas
export const multiTdspMapping: MultiTdspMapping = {
  // Example entries for areas with multiple TDSP coverage
  '75001': { // Example: Addison area with potential overlap
    tdsps: [
      { duns: '1039940674000', name: 'Oncor Electric Delivery', marketShare: 85, priority: 1 },
      { duns: '007923311', name: 'AEP Texas North Company', marketShare: 15, priority: 2 }
    ],
    primaryTdsp: '1039940674000',
    notes: 'Oncor primary in most of ZIP code'
  },
  '77002': { // Example: Downtown Houston area
    tdsps: [
      { duns: '957877905', name: 'CenterPoint Energy Houston Electric', marketShare: 100, priority: 1 }
    ],
    primaryTdsp: '957877905'
  }
};

// TDSP information lookup
export const TDSP_INFO: TdspInfo = {
  '1039940674000': {
    name: 'Oncor Electric Delivery',
    shortName: 'Oncor',
    zone: 'North',
    coverage: ['Dallas', 'Fort Worth', 'Tyler', 'Waco']
  },
  '957877905': {
    name: 'CenterPoint Energy Houston Electric',
    shortName: 'CenterPoint',
    zone: 'Coast',
    coverage: ['Houston', 'Galveston', 'Beaumont', 'Baytown']
  },
  '007923311': {
    name: 'AEP Texas North Company',
    shortName: 'AEP North',
    zone: 'North',
    coverage: ['Abilene', 'San Angelo', 'Sweetwater']
  },
  '1039940674401': {
    name: 'AEP Texas Central Company',
    shortName: 'AEP Central',
    zone: 'Central',
    coverage: ['Corpus Christi', 'McAllen', 'Brownsville']
  },
  '007929441': {
    name: 'Texas-New Mexico Power Company',
    shortName: 'TNMP',
    zone: 'South',
    coverage: ['Lewisville', 'Bryan', 'Huntsville']
  }
};

// Get all ZIP codes that have multiple TDSP coverage
export function getMultiTdspZipCodes(): string[] {
  return Object.keys(multiTdspMapping).filter(zipCode => 
    multiTdspMapping[zipCode].tdsps.length > 1
  );
}

// Get statistics about multi-TDSP coverage
export const MULTI_TDSP_STATS = {
  totalMultiTdspZips: getMultiTdspZipCodes().length,
  totalTdsps: Object.keys(TDSP_INFO).length,
  coverageZones: ['North', 'Coast', 'Central', 'South'],
  lastUpdated: '2025-08-28T17:42:00.000Z'
};

// Get TDSP information by DUNS number
export function getTdspInfo(duns: string) {
  return TDSP_INFO[duns] || null;
}

// Check if ZIP code has multiple TDSP options
export function hasMultipleTdsps(zipCode: string): boolean {
  const mapping = multiTdspMapping[zipCode];
  return mapping ? mapping.tdsps.length > 1 : false;
}

// Get primary TDSP for a ZIP code
export function getPrimaryTdsp(zipCode: string): string | null {
  const mapping = multiTdspMapping[zipCode];
  return mapping ? mapping.primaryTdsp : null;
}

// Get primary TDSP for ZIP (alias for compatibility)
export function getPrimaryTdspForZip(zipCode: string): string | null {
  return getPrimaryTdsp(zipCode);
}

// Get alternative TDSPs for a ZIP code
export function getAlternativeTdsps(zipCode: string): string[] {
  const mapping = multiTdspMapping[zipCode];
  if (!mapping) return [];
  
  return mapping.tdsps
    .filter(tdsp => tdsp.duns !== mapping.primaryTdsp)
    .map(tdsp => tdsp.duns);
}

// Check if ZIP requires address validation (has multiple TDSPs)
export function requiresAddressValidation(zipCode: string): boolean {
  return hasMultipleTdsps(zipCode);
}

// Get boundary type for a ZIP code
export function getBoundaryType(zipCode: string): 'single' | 'multi' | 'complex' {
  const mapping = multiTdspMapping[zipCode];
  if (!mapping) return 'single';
  
  if (mapping.tdsps.length === 1) return 'single';
  if (mapping.tdsps.length === 2) return 'multi';
  return 'complex';
}

export default {
  multiTdspMapping,
  TDSP_INFO,
  getMultiTdspZipCodes,
  MULTI_TDSP_STATS,
  getTdspInfo,
  hasMultipleTdsps,
  getPrimaryTdsp,
  getPrimaryTdspForZip,
  getAlternativeTdsps,
  requiresAddressValidation,
  getBoundaryType
};