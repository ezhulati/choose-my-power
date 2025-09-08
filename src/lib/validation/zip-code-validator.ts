/**
 * ZIP Code Validation System for Texas Electricity Market
 * 
 * Implements comprehensive ZIP code validation including:
 * - Format validation (5-digit requirement)
 * - Texas boundary validation  
 * - Deregulated market area verification
 * - TDSP territory integration
 * - Real-time validation feedback
 * 
 * Part of the ZIP Code Validation feature (Branch: 001-add-zip-code)
 * Specification: /specs/001-add-zip-code/spec.md
 */

import { multiTdspMapping, TDSP_INFO, getPrimaryTdspForZip } from '../../config/multi-tdsp-mapping';
import type { TdspInfo } from '../../types/facets';

export interface ZipCodeValidationResult {
  isValid: boolean;
  isTexas: boolean;
  isDeregulated: boolean;
  zipCode: string;
  tdsp?: TdspInfo;
  requiresAddressValidation?: boolean;
  errors: string[];
  warnings: string[];
  city?: string;
  county?: string;
}

export interface ZipCodeValidationOptions {
  strictTexasOnly?: boolean;
  requireDeregulated?: boolean;
  provideFeedback?: boolean;
}

/**
 * Texas ZIP code ranges for boundary validation
 * Based on USPS ZIP code allocation for Texas
 */
const TEXAS_ZIP_RANGES = [
  { min: 73301, max: 73399 }, // East Texas
  { min: 75001, max: 75999 }, // Dallas-Fort Worth area
  { min: 76001, max: 76999 }, // Fort Worth, Waco area  
  { min: 77001, max: 77999 }, // Houston area
  { min: 78001, max: 78999 }, // Austin, San Antonio area
  { min: 79001, max: 79999 }, // West Texas, Panhandle
  { min: 88510, max: 88589 }  // El Paso area
];

/**
 * Regulated utility areas (municipal/co-op utilities)
 * These ZIP codes are NOT part of the deregulated electricity market
 */
const REGULATED_ZIP_CODES = new Set([
  // Austin Energy (City of Austin)
  '78701', '78702', '78703', '78704', '78705', '78712', '78717', '78719',
  '78721', '78722', '78723', '78724', '78725', '78726', '78727', '78728',
  '78729', '78730', '78731', '78732', '78733', '78734', '78735', '78736',
  '78737', '78738', '78739', '78741', '78742', '78744', '78745', '78746',
  '78747', '78748', '78749', '78750', '78751', '78752', '78753', '78754',
  '78756', '78757', '78758', '78759',
  
  // San Antonio (CPS Energy - Municipal)
  '78201', '78202', '78203', '78204', '78205', '78207', '78208', '78209',
  '78210', '78211', '78212', '78213', '78214', '78215', '78216', '78217',
  '78218', '78219', '78220', '78221', '78222', '78223', '78224', '78225',
  '78226', '78227', '78228', '78229', '78230', '78231', '78232', '78233',
  '78234', '78235', '78236', '78237', '78238', '78239', '78240', '78242',
  '78244', '78245', '78247', '78248', '78249', '78250', '78252', '78254',
  '78255', '78256', '78257', '78258', '78259', '78260', '78261', '78263',
  
  // El Paso Electric (Regulated utility)
  '79901', '79902', '79903', '79904', '79905', '79906', '79907', '79908',
  '79910', '79911', '79912', '79913', '79914', '79915', '79916', '79917',
  '79918', '79920', '79924', '79925', '79926', '79927', '79928', '79929',
  '79930', '79931', '79932', '79934', '79935', '79936', '79937', '79938',
  
  // Rural Electric Cooperatives (Sample - many more exist)
  '75925', '75926', '75928', '75929', // East Texas co-ops
  '76310', '76311', '76363', '76364', // North Texas co-ops  
  '78002', '78003', '78013', '78015', // South Texas co-ops
]);

/**
 * Known Texas cities for ZIP code validation
 * Used to provide city information in validation results
 */
const TEXAS_ZIP_TO_CITY: Record<string, { city: string; county: string }> = {
  // Dallas-Fort Worth Metro
  '75201': { city: 'Dallas', county: 'Dallas' },
  '75202': { city: 'Dallas', county: 'Dallas' },
  '75001': { city: 'Addison', county: 'Dallas' },
  '76101': { city: 'Fort Worth', county: 'Tarrant' },
  '75019': { city: 'Coppell', county: 'Dallas' },
  
  // Houston Metro
  '77001': { city: 'Houston', county: 'Harris' },
  '77002': { city: 'Houston', county: 'Harris' },
  '77003': { city: 'Houston', county: 'Harris' },
  '77401': { city: 'Bellaire', county: 'Harris' },
  
  // Austin Metro
  '78701': { city: 'Austin', county: 'Travis' },
  '78702': { city: 'Austin', county: 'Travis' },
  '78660': { city: 'Pflugerville', county: 'Travis' },
  
  // San Antonio Metro
  '78201': { city: 'San Antonio', county: 'Bexar' },
  '78202': { city: 'San Antonio', county: 'Bexar' },
  '78253': { city: 'San Antonio', county: 'Bexar' },
  
  // Other Major Cities
  '79901': { city: 'El Paso', county: 'El Paso' },
  '75701': { city: 'Tyler', county: 'Smith' },
  '76801': { city: 'Brownwood', county: 'Brown' },
  '77901': { city: 'Victoria', county: 'Victoria' }
};

export class ZipCodeValidator {
  
  /**
   * Validate ZIP code format (5 digits exactly)
   * Implements FR-001 from specification
   */
  static validateFormat(zipCode: string): { isValid: boolean; error?: string } {
    if (!zipCode || typeof zipCode !== 'string') {
      return { isValid: false, error: 'ZIP code is required' };
    }
    
    const cleanZip = zipCode.replace(/\D/g, '');
    
    if (cleanZip.length === 0) {
      return { isValid: false, error: 'Please enter a valid 5-digit ZIP code' };
    }
    
    if (cleanZip.length < 5) {
      return { isValid: false, error: 'ZIP code must be 5 digits' };
    }
    
    if (cleanZip.length > 5) {
      return { isValid: false, error: 'ZIP code must be exactly 5 digits' };
    }
    
    // Additional format validation - must be all numeric
    if (!/^\d{5}$/.test(cleanZip)) {
      return { isValid: false, error: 'Please enter a valid 5-digit ZIP code' };
    }
    
    return { isValid: true };
  }
  
  /**
   * Validate ZIP code is within Texas boundaries
   * Implements FR-002 from specification
   */
  static validateTexasBoundary(zipCode: string): { isValid: boolean; error?: string } {
    const formatResult = this.validateFormat(zipCode);
    if (!formatResult.isValid) {
      return formatResult;
    }
    
    const zipNum = parseInt(zipCode, 10);
    
    // Check if ZIP code falls within any Texas range
    const isTexasZip = TEXAS_ZIP_RANGES.some(range => 
      zipNum >= range.min && zipNum <= range.max
    );
    
    if (!isTexasZip) {
      return { 
        isValid: false, 
        error: 'This ZIP code is outside Texas\'s deregulated electricity market' 
      };
    }
    
    return { isValid: true };
  }
  
  /**
   * Validate ZIP code is in deregulated market area
   * Implements FR-003 from specification
   */
  static validateDeregulatedArea(zipCode: string): { 
    isValid: boolean; 
    error?: string; 
    isRegulated?: boolean; 
  } {
    const texasResult = this.validateTexasBoundary(zipCode);
    if (!texasResult.isValid) {
      return texasResult;
    }
    
    // Check if ZIP code is in regulated utility area
    if (REGULATED_ZIP_CODES.has(zipCode)) {
      return {
        isValid: false,
        isRegulated: true,
        error: 'This area has regulated electricity service - plan comparison not available'
      };
    }
    
    return { isValid: true, isRegulated: false };
  }
  
  /**
   * Get TDSP information for ZIP code
   * Implements FR-006 from specification (TDSP integration)
   */
  static getTdspInfo(zipCode: string): {
    tdsp?: TdspInfo;
    requiresAddressValidation: boolean;
    boundaryType?: string;
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    // Check if ZIP code has multi-TDSP configuration
    const multiConfig = multiTdspMapping[zipCode];
    if (multiConfig) {
      return {
        tdsp: multiConfig.primaryTdsp,
        requiresAddressValidation: multiConfig.requiresAddressValidation,
        boundaryType: multiConfig.boundaryType,
        warnings: multiConfig.requiresAddressValidation 
          ? ['This ZIP code spans multiple utility territories. Address validation may be required.']
          : []
      };
    }
    
    // Try to determine primary TDSP based on ZIP code patterns
    const zipNum = parseInt(zipCode, 10);
    
    // Dallas-Fort Worth area (Oncor primary)
    if (zipNum >= 75001 && zipNum <= 75999) {
      return {
        tdsp: TDSP_INFO.ONCOR,
        requiresAddressValidation: false,
        warnings: []
      };
    }
    
    // Fort Worth extended area (mixed Oncor/AEP North)
    if (zipNum >= 76001 && zipNum <= 76999) {
      return {
        tdsp: TDSP_INFO.ONCOR,
        requiresAddressValidation: true,
        warnings: ['This area may have mixed utility coverage. Address validation recommended.']
      };
    }
    
    // Houston area (CenterPoint primary)
    if (zipNum >= 77001 && zipNum <= 77999) {
      return {
        tdsp: TDSP_INFO.CENTERPOINT,
        requiresAddressValidation: false,
        warnings: []
      };
    }
    
    // Austin/San Antonio area (AEP Central primary)
    if (zipNum >= 78001 && zipNum <= 78999) {
      return {
        tdsp: TDSP_INFO.AEP_CENTRAL,
        requiresAddressValidation: false,
        warnings: []
      };
    }
    
    // West Texas/Panhandle (AEP North/TNMP mix)
    if (zipNum >= 79001 && zipNum <= 79999) {
      return {
        tdsp: TDSP_INFO.AEP_NORTH,
        requiresAddressValidation: true,
        warnings: ['This area may have mixed utility coverage. Address validation recommended.']
      };
    }
    
    // Default case - unknown area
    return {
      requiresAddressValidation: true,
      warnings: ['Utility territory information not available for this ZIP code.']
    };
  }
  
  /**
   * Comprehensive ZIP code validation
   * Implements all functional requirements from specification
   */
  static validate(
    zipCode: string, 
    options: ZipCodeValidationOptions = {}
  ): ZipCodeValidationResult {
    const {
      strictTexasOnly = true,
      requireDeregulated = true,
      provideFeedback = true
    } = options;
    
    const result: ZipCodeValidationResult = {
      isValid: false,
      isTexas: false,
      isDeregulated: false,
      zipCode: zipCode?.replace(/\D/g, '') || '',
      errors: [],
      warnings: []
    };
    
    // Step 1: Format validation
    const formatCheck = ZipCodeValidator.validateFormat(zipCode);
    if (!formatCheck.isValid) {
      result.errors.push(formatCheck.error!);
      return result;
    }
    
    result.zipCode = formatCheck.isValid ? zipCode.replace(/\D/g, '') : '';
    
    // Step 2: Texas boundary validation
    const texasCheck = ZipCodeValidator.validateTexasBoundary(result.zipCode);
    result.isTexas = texasCheck.isValid;
    
    if (strictTexasOnly && !texasCheck.isValid) {
      result.errors.push(texasCheck.error!);
      return result;
    }
    
    if (!texasCheck.isValid) {
      result.warnings.push(texasCheck.error!);
    }
    
    // Step 3: Deregulated area validation (only if in Texas)
    if (result.isTexas) {
      const deregCheck = ZipCodeValidator.validateDeregulatedArea(result.zipCode);
      result.isDeregulated = deregCheck.isValid;
      
      if (requireDeregulated && !deregCheck.isValid) {
        result.errors.push(deregCheck.error!);
        return result;
      }
      
      if (!deregCheck.isValid) {
        result.warnings.push(deregCheck.error!);
      }
    }
    
    // Step 4: TDSP information (only if deregulated)
    if (result.isDeregulated) {
      const tdspInfo = ZipCodeValidator.getTdspInfo(result.zipCode);
      result.tdsp = tdspInfo.tdsp;
      result.requiresAddressValidation = tdspInfo.requiresAddressValidation;
      result.warnings.push(...tdspInfo.warnings);
    }
    
    // Step 5: City/county information
    const locationInfo = TEXAS_ZIP_TO_CITY[result.zipCode];
    if (locationInfo) {
      result.city = locationInfo.city;
      result.county = locationInfo.county;
    }
    
    // Final validation
    result.isValid = result.errors.length === 0 && 
                    (result.isTexas || !strictTexasOnly) && 
                    (result.isDeregulated || !requireDeregulated);
    
    return result;
  }
  
  /**
   * Get user-friendly validation message
   * Implements FR-004 from specification (error messages)
   */
  static getValidationMessage(result: ZipCodeValidationResult): {
    type: 'success' | 'warning' | 'error';
    message: string;
    actionable?: string;
  } {
    if (!result.isValid && result.errors.length > 0) {
      return {
        type: 'error',
        message: result.errors[0],
        actionable: result.errors[0].includes('5 digits') 
          ? 'Please enter exactly 5 numbers' 
          : 'Please try a different ZIP code'
      };
    }
    
    if (result.warnings.length > 0) {
      return {
        type: 'warning',
        message: result.warnings[0],
        actionable: result.requiresAddressValidation 
          ? 'Address validation will be required to determine your utility provider'
          : undefined
      };
    }
    
    if (result.isValid && result.city) {
      return {
        type: 'success',
        message: `${result.city} is in the deregulated electricity market`,
        actionable: result.requiresAddressValidation 
          ? 'Address validation may be required for plan availability'
          : 'You can compare electricity plans'
      };
    }
    
    return {
      type: 'success',
      message: 'ZIP code is valid for electricity plan comparison'
    };
  }
  
  /**
   * Check if ZIP code requires address-level validation for TDSP determination
   * Implements FR-008 from specification (mixed TDSP handling)
   */
  static requiresAddressValidation(zipCode: string): boolean {
    const result = ZipCodeValidator.validate(zipCode);
    return result.requiresAddressValidation || false;
  }
  
  /**
   * Get all supported Texas ZIP code ranges
   * Utility function for testing and documentation
   */
  static getSupportedZipRanges(): Array<{ min: number; max: number }> {
    return [...TEXAS_ZIP_RANGES];
  }
  
  /**
   * Check if ZIP code is known to be regulated
   * Utility function for quick regulated area checks
   */
  static isRegulatedArea(zipCode: string): boolean {
    return REGULATED_ZIP_CODES.has(zipCode);
  }
}

// Export utility functions for component integration
export const validateZipCode = ZipCodeValidator.validate;
export const validateZipFormat = ZipCodeValidator.validateFormat;
export const requiresAddressValidation = ZipCodeValidator.requiresAddressValidation;
export const getValidationMessage = ZipCodeValidator.getValidationMessage;

// Export default instance for convenience
export default ZipCodeValidator;