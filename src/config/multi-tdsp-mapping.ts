/**
 * Multi-TDSP ZIP Code Configuration
 * 
 * This configuration handles ZIP codes that span multiple TDSP territories in Texas.
 * Based on research of boundary areas between major utility service territories.
 * 
 * Research Findings:
 * - TNMP has non-contiguous service areas creating boundary complexities
 * - Dallas/Fort Worth suburban areas have the most boundary issues
 * - Houston metro edges have CenterPoint/TNMP boundaries
 * - San Antonio area has AEP/CenterPoint boundaries
 * 
 * Implementation Strategy:
 * 1. Primary TDSP: Most common/likely TDSP for the ZIP code
 * 2. Alternative TDSPs: Other TDSPs that serve parts of the ZIP
 * 3. Address validation: Required when street-level boundaries exist
 */

import type { MultiTdspMapping, TdspInfo } from '../types/facets';

// TDSP Information Constants
export const TDSP_INFO: Record<string, TdspInfo> = {
  ONCOR: {
    duns: '1039940674000',
    name: 'Oncor Electric Delivery',
    zone: 'North',
    tier: 1,
    priority: 1.0,
    coverage: 'primary'
  },
  CENTERPOINT: {
    duns: '957877905',
    name: 'CenterPoint Energy Houston Electric',
    zone: 'Coast',
    tier: 1,
    priority: 1.0,
    coverage: 'primary'
  },
  AEP_NORTH: {
    duns: '007923311',
    name: 'AEP Texas North Company',
    zone: 'North',
    tier: 2,
    priority: 0.8,
    coverage: 'primary'
  },
  AEP_CENTRAL: {
    duns: '007924772',
    name: 'AEP Texas Central Company',
    zone: 'Central',
    tier: 2,
    priority: 0.8,
    coverage: 'primary'
  },
  TNMP: {
    duns: '007929441',
    name: 'Texas-New Mexico Power Company',
    zone: 'South',
    tier: 2,
    priority: 0.7,
    coverage: 'boundary'
  }
};

/**
 * Multi-TDSP ZIP Code Configuration
 * 
 * These ZIP codes require address-level validation due to multiple TDSP boundaries.
 * Organized by metro area and boundary type for easier maintenance.
 */
export const multiTdspMapping: MultiTdspMapping = {
  // =================================================================
  // DALLAS-FORT WORTH METROPLEX BOUNDARY AREAS
  // =================================================================
  
  // North Dallas Suburbs - Oncor/TNMP Boundary
  '75001': {
    primaryTdsp: { ...TDSP_INFO.ONCOR, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.TNMP, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'street-level',
    notes: 'Addison area - Some streets served by TNMP instead of Oncor'
  },

  '75019': {
    primaryTdsp: { ...TDSP_INFO.ONCOR, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.TNMP, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'street-level',
    notes: 'Coppell area - TNMP serves some neighborhoods'
  },

  '75034': {
    primaryTdsp: { ...TDSP_INFO.ONCOR, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.TNMP, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'street-level',
    notes: 'Frisco area - Mixed TDSP coverage in older sections'
  },

  '75056': {
    primaryTdsp: { ...TDSP_INFO.ONCOR, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.TNMP, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'block-level',
    notes: 'The Colony - Block-by-block TDSP boundaries'
  },

  '75067': {
    primaryTdsp: { ...TDSP_INFO.ONCOR, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.TNMP, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'street-level',
    notes: 'Lewisville - Some areas served by TNMP'
  },

  // West Dallas Areas - Oncor/TNMP Boundary
  '75039': {
    primaryTdsp: { ...TDSP_INFO.ONCOR, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.TNMP, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'street-level',
    notes: 'Irving - Mixed coverage in western sections'
  },

  '75062': {
    primaryTdsp: { ...TDSP_INFO.ONCOR, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.TNMP, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'zip4-level',
    notes: 'Irving - ZIP+4 level boundaries'
  },

  // South Dallas/Fort Worth - Oncor/TNMP/AEP Boundary
  '76020': {
    primaryTdsp: { ...TDSP_INFO.ONCOR, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.AEP_NORTH, coverage: 'boundary' },
      { ...TDSP_INFO.TNMP, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'street-level',
    notes: 'Azle - Three-way TDSP boundary area'
  },

  '76116': {
    primaryTdsp: { ...TDSP_INFO.ONCOR, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.AEP_NORTH, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'street-level',
    notes: 'Fort Worth west - AEP serves some areas'
  },

  // =================================================================
  // HOUSTON METROPLEX BOUNDARY AREAS
  // =================================================================

  // North Houston - CenterPoint/TNMP Boundary
  '77002': {
    primaryTdsp: { ...TDSP_INFO.CENTERPOINT, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.TNMP, coverage: 'boundary' }
    ],
    requiresAddressValidation: false, // Primarily CenterPoint, but validation recommended
    boundaryType: 'zip4-level',
    notes: 'Downtown Houston - Mostly CenterPoint with some TNMP areas'
  },

  '77064': {
    primaryTdsp: { ...TDSP_INFO.CENTERPOINT, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.TNMP, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'street-level',
    notes: 'Northwest Houston - TNMP serves some neighborhoods'
  },

  '77084': {
    primaryTdsp: { ...TDSP_INFO.CENTERPOINT, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.TNMP, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'street-level',
    notes: 'West Houston - Mixed TDSP coverage'
  },

  // South Houston - CenterPoint/TNMP Boundary
  '77459': {
    primaryTdsp: { ...TDSP_INFO.CENTERPOINT, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.TNMP, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'street-level',
    notes: 'Missouri City - TNMP serves western areas'
  },

  '77498': {
    primaryTdsp: { ...TDSP_INFO.CENTERPOINT, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.TNMP, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'block-level',
    notes: 'Katy - Complex boundary area'
  },

  // =================================================================
  // CENTRAL TEXAS BOUNDARY AREAS
  // =================================================================

  // Austin Area - AEP Central/Oncor Boundary
  '78660': {
    primaryTdsp: { ...TDSP_INFO.AEP_CENTRAL, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.ONCOR, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'street-level',
    notes: 'Pflugerville - Oncor serves northern areas'
  },

  '78664': {
    primaryTdsp: { ...TDSP_INFO.AEP_CENTRAL, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.ONCOR, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'zip4-level',
    notes: 'Round Rock - Mixed coverage based on ZIP+4'
  },

  // San Antonio Area - AEP Central/CenterPoint Boundary
  '78253': {
    primaryTdsp: { ...TDSP_INFO.AEP_CENTRAL, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.CENTERPOINT, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'street-level',
    notes: 'Northwest San Antonio - CenterPoint serves some areas'
  },

  '78251': {
    primaryTdsp: { ...TDSP_INFO.AEP_CENTRAL, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.CENTERPOINT, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'street-level',
    notes: 'West San Antonio - Mixed TDSP boundaries'
  },

  // =================================================================
  // EAST TEXAS BOUNDARY AREAS
  // =================================================================

  // Tyler Area - Oncor/AEP North Boundary
  '75701': {
    primaryTdsp: { ...TDSP_INFO.ONCOR, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.AEP_NORTH, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'street-level',
    notes: 'Tyler - AEP North serves some eastern areas'
  },

  '75703': {
    primaryTdsp: { ...TDSP_INFO.ONCOR, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.AEP_NORTH, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'street-level',
    notes: 'Tyler south - Mixed TDSP coverage'
  },

  // =================================================================
  // WEST TEXAS BOUNDARY AREAS
  // =================================================================

  // Abilene Area - AEP North/TNMP Boundary
  '79601': {
    primaryTdsp: { ...TDSP_INFO.AEP_NORTH, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.TNMP, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'street-level',
    notes: 'Abilene - TNMP serves some western areas'
  },

  '79606': {
    primaryTdsp: { ...TDSP_INFO.AEP_NORTH, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.TNMP, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'zip4-level',
    notes: 'West Abilene - ZIP+4 level boundaries'
  },

  // =================================================================
  // SOUTH TEXAS BOUNDARY AREAS  
  // =================================================================

  // Corpus Christi Area - AEP Central/TNMP Boundary
  '78418': {
    primaryTdsp: { ...TDSP_INFO.AEP_CENTRAL, coverage: 'primary' },
    alternativeTdsps: [
      { ...TDSP_INFO.TNMP, coverage: 'boundary' }
    ],
    requiresAddressValidation: true,
    boundaryType: 'street-level',
    notes: 'Corpus Christi west - TNMP serves some areas'
  }
};

/**
 * Get all ZIP codes that require multi-TDSP handling
 */
export function getMultiTdspZipCodes(): string[] {
  return Object.keys(multiTdspMapping);
}

/**
 * Check if a ZIP code requires address validation for TDSP determination
 */
export function requiresAddressValidation(zipCode: string): boolean {
  const config = multiTdspMapping[zipCode];
  return config?.requiresAddressValidation || false;
}

/**
 * Get primary TDSP for a ZIP code (fallback if address validation fails)
 */
export function getPrimaryTdspForZip(zipCode: string): TdspInfo | null {
  return multiTdspMapping[zipCode]?.primaryTdsp || null;
}

/**
 * Get alternative TDSPs for a ZIP code
 */
export function getAlternativeTdsps(zipCode: string): TdspInfo[] {
  return multiTdspMapping[zipCode]?.alternativeTdsps || [];
}

/**
 * Get boundary type for a ZIP code
 */
export function getBoundaryType(zipCode: string): 'street-level' | 'block-level' | 'zip4-level' | null {
  return multiTdspMapping[zipCode]?.boundaryType || null;
}

/**
 * Statistics about multi-TDSP coverage
 */
export const MULTI_TDSP_STATS = {
  totalZipCodes: Object.keys(multiTdspMapping).length,
  byBoundaryType: {
    'street-level': Object.values(multiTdspMapping).filter(config => config.boundaryType === 'street-level').length,
    'block-level': Object.values(multiTdspMapping).filter(config => config.boundaryType === 'block-level').length,
    'zip4-level': Object.values(multiTdspMapping).filter(config => config.boundaryType === 'zip4-level').length
  },
  byMetroArea: {
    dallasfortworth: Object.keys(multiTdspMapping).filter(zip => 
      zip.startsWith('75') || zip.startsWith('76')
    ).length,
    houston: Object.keys(multiTdspMapping).filter(zip => 
      zip.startsWith('77')
    ).length,
    austin: Object.keys(multiTdspMapping).filter(zip => 
      zip.startsWith('786') || zip.startsWith('787')
    ).length,
    sanantonio: Object.keys(multiTdspMapping).filter(zip => 
      zip.startsWith('782')
    ).length
  },
  requiresValidation: Object.values(multiTdspMapping).filter(config => config.requiresAddressValidation).length
};