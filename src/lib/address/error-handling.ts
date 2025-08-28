/**
 * Error Handling and Fallback Strategies
 * 
 * Comprehensive error handling for the multi-TDSP address resolution system.
 * Provides graceful degradation and user-friendly error messages.
 * 
 * Error Categories:
 * - Address Validation Errors
 * - TDSP Resolution Errors  
 * - API Integration Errors
 * - Cache/Performance Errors
 * - Configuration Errors
 */

import type { TdspInfo, AddressInfo, NormalizedAddress } from '../../types/facets';
import { TDSP_INFO } from '../config/multi-tdsp-mapping';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  ADDRESS_VALIDATION = 'address_validation',
  TDSP_RESOLUTION = 'tdsp_resolution',
  API_INTEGRATION = 'api_integration',
  CACHE_PERFORMANCE = 'cache_performance',
  CONFIGURATION = 'configuration',
  USER_INPUT = 'user_input',
  NETWORK = 'network',
  UNKNOWN = 'unknown'
}

export interface AddressError {
  code: string;
  message: string;
  userMessage: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoverable: boolean;
  retryable: boolean;
  context?: any;
  suggestedActions?: string[];
  fallbackStrategy?: string;
  timestamp: Date;
}

export interface FallbackResult {
  success: boolean;
  tdsp: TdspInfo | null;
  confidence: 'high' | 'medium' | 'low';
  method: string;
  warnings: string[];
  originalError?: AddressError;
}

export class AddressErrorHandler {
  private errorCounts: Map<string, number> = new Map();
  private errorHistory: AddressError[] = [];
  private readonly MAX_HISTORY = 100;

  /**
   * Create standardized error objects
   */
  createError(
    code: string,
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    context?: any
  ): AddressError {
    const error: AddressError = {
      code,
      message,
      userMessage: this.generateUserMessage(code, category, context),
      category,
      severity,
      recoverable: this.isRecoverable(category, code),
      retryable: this.isRetryable(category, code),
      context,
      suggestedActions: this.generateSuggestedActions(code, category, context),
      fallbackStrategy: this.determineFallbackStrategy(category, code),
      timestamp: new Date()
    };

    this.logError(error);
    return error;
  }

  /**
   * Handle address validation errors with fallbacks
   */
  async handleAddressValidationError(
    error: any,
    originalAddress: AddressInfo
  ): Promise<{ 
    normalizedAddress: NormalizedAddress | null; 
    warnings: string[];
    confidence: 'high' | 'medium' | 'low';
  }> {
    const addressError = this.createError(
      'ADDRESS_VALIDATION_FAILED',
      error.message || 'Address validation failed',
      ErrorCategory.ADDRESS_VALIDATION,
      ErrorSeverity.MEDIUM,
      { originalAddress, originalError: error }
    );

    // Fallback 1: Basic address parsing
    try {
      const basicParsed = this.parseAddressBasic(originalAddress);
      return {
        normalizedAddress: basicParsed,
        warnings: [addressError.userMessage, 'Using basic address parsing'],
        confidence: 'low'
      };
    } catch (parseError) {
      // Fallback 2: Use original address as-is
      return {
        normalizedAddress: this.createMinimalNormalizedAddress(originalAddress),
        warnings: [addressError.userMessage, 'Using original address format'],
        confidence: 'low'
      };
    }
  }

  /**
   * Handle TDSP resolution errors with comprehensive fallbacks
   */
  async handleTdspResolutionError(
    error: any,
    address: AddressInfo | NormalizedAddress,
    zipCode: string
  ): Promise<FallbackResult> {
    const tdspError = this.createError(
      'TDSP_RESOLUTION_FAILED',
      error.message || 'TDSP resolution failed',
      ErrorCategory.TDSP_RESOLUTION,
      ErrorSeverity.HIGH,
      { address, zipCode, originalError: error }
    );

    // Try fallback strategies in order of preference
    const fallbackStrategies = [
      () => this.fallbackToZipMapping(zipCode),
      () => this.fallbackToGeographicHeuristics(address),
      () => this.fallbackToMostCommonTdsp(zipCode),
      () => this.fallbackToDefaultTdsp()
    ];

    for (const strategy of fallbackStrategies) {
      try {
        const result = await strategy();
        if (result.success) {
          return {
            ...result,
            warnings: [tdspError.userMessage, ...result.warnings],
            originalError: tdspError
          };
        }
      } catch (strategyError) {
        console.warn(`Fallback strategy failed:`, strategyError);
      }
    }

    // All fallbacks failed
    return {
      success: false,
      tdsp: null,
      confidence: 'low',
      method: 'all-fallbacks-failed',
      warnings: [tdspError.userMessage, 'All fallback strategies failed'],
      originalError: tdspError
    };
  }

  /**
   * Handle API integration errors
   */
  handleApiError(error: any, context?: any): AddressError {
    let code = 'API_ERROR';
    let severity = ErrorSeverity.MEDIUM;

    // Categorize API errors
    if (error.message?.includes('timeout') || error.name === 'AbortError') {
      code = 'API_TIMEOUT';
      severity = ErrorSeverity.HIGH;
    } else if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
      code = 'API_UNAUTHORIZED';
      severity = ErrorSeverity.CRITICAL;
    } else if (error.message?.includes('404') || error.message?.includes('not found')) {
      code = 'API_NOT_FOUND';
      severity = ErrorSeverity.MEDIUM;
    } else if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      code = 'API_RATE_LIMITED';
      severity = ErrorSeverity.HIGH;
    } else if (error.message?.includes('500') || error.message?.includes('server error')) {
      code = 'API_SERVER_ERROR';
      severity = ErrorSeverity.HIGH;
    }

    return this.createError(
      code,
      error.message || 'API integration failed',
      ErrorCategory.API_INTEGRATION,
      severity,
      { ...context, originalError: error }
    );
  }

  /**
   * Handle network errors with retry strategies
   */
  async handleNetworkError(
    error: any,
    operation: () => Promise<any>,
    maxRetries: number = 3
  ): Promise<any> {
    const networkError = this.createError(
      'NETWORK_ERROR',
      error.message || 'Network operation failed',
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      { originalError: error, maxRetries }
    );

    if (!networkError.retryable || maxRetries <= 0) {
      throw networkError;
    }

    // Exponential backoff retry
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.delay(Math.pow(2, attempt) * 1000); // 2s, 4s, 8s
        return await operation();
      } catch (retryError) {
        if (attempt === maxRetries) {
          throw this.createError(
            'NETWORK_ERROR_MAX_RETRIES',
            `Network operation failed after ${maxRetries} retries`,
            ErrorCategory.NETWORK,
            ErrorSeverity.HIGH,
            { originalError: error, attempts: maxRetries }
          );
        }
      }
    }
  }

  /**
   * Validate system configuration and provide actionable feedback
   */
  async validateConfiguration(): Promise<{
    isValid: boolean;
    errors: AddressError[];
    warnings: AddressError[];
    recommendations: string[];
  }> {
    const errors: AddressError[] = [];
    const warnings: AddressError[] = [];
    const recommendations: string[] = [];

    // Check environment variables
    if (!process.env.COMPAREPOWER_API_URL) {
      errors.push(this.createError(
        'MISSING_API_URL',
        'ComparePower API URL not configured',
        ErrorCategory.CONFIGURATION,
        ErrorSeverity.CRITICAL,
        { envVar: 'COMPAREPOWER_API_URL' }
      ));
    }

    if (!process.env.COMPAREPOWER_API_KEY) {
      warnings.push(this.createError(
        'MISSING_API_KEY',
        'ComparePower API key not configured - using public access',
        ErrorCategory.CONFIGURATION,
        ErrorSeverity.MEDIUM,
        { envVar: 'COMPAREPOWER_API_KEY' }
      ));
      recommendations.push('Configure API key for enhanced rate limits and features');
    }

    // Check external service configurations
    if (!process.env.USPS_API_KEY && !process.env.SMARTYSTREETS_API_KEY) {
      warnings.push(this.createError(
        'NO_ADDRESS_VALIDATION_SERVICE',
        'No external address validation service configured',
        ErrorCategory.CONFIGURATION,
        ErrorSeverity.LOW,
        { availableServices: ['USPS', 'SmartyStreets'] }
      ));
      recommendations.push('Configure USPS or SmartyStreets API for enhanced address validation');
    }

    if (!process.env.REDIS_URL) {
      warnings.push(this.createError(
        'NO_REDIS_CACHE',
        'Redis cache not configured - using memory cache only',
        ErrorCategory.CONFIGURATION,
        ErrorSeverity.LOW,
        { impact: 'Reduced caching performance' }
      ));
      recommendations.push('Configure Redis for improved caching across instances');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations
    };
  }

  // Fallback Strategy Implementations

  private async fallbackToZipMapping(zipCode: string): Promise<FallbackResult> {
    // Try to find TDSP from existing ZIP-to-city mappings
    // This is a simplified implementation
    
    if (zipCode.startsWith('75') || zipCode.startsWith('76')) {
      return {
        success: true,
        tdsp: TDSP_INFO.ONCOR,
        confidence: 'medium',
        method: 'zip-geographic-fallback',
        warnings: ['Using geographic ZIP code fallback for Dallas/Fort Worth area']
      };
    }
    
    if (zipCode.startsWith('77')) {
      return {
        success: true,
        tdsp: TDSP_INFO.CENTERPOINT,
        confidence: 'medium',
        method: 'zip-geographic-fallback',
        warnings: ['Using geographic ZIP code fallback for Houston area']
      };
    }
    
    if (zipCode.startsWith('78')) {
      return {
        success: true,
        tdsp: TDSP_INFO.AEP_CENTRAL,
        confidence: 'medium',
        method: 'zip-geographic-fallback',
        warnings: ['Using geographic ZIP code fallback for Austin/Central Texas area']
      };
    }

    return {
      success: false,
      tdsp: null,
      confidence: 'low',
      method: 'zip-mapping-failed',
      warnings: ['No ZIP code mapping available']
    };
  }

  private async fallbackToGeographicHeuristics(
    address: AddressInfo | NormalizedAddress
  ): Promise<FallbackResult> {
    const city = 'city' in address ? address.city.toLowerCase() : '';
    
    // Major city heuristics
    if (city.includes('dallas') || city.includes('fort worth') || city.includes('plano') || city.includes('irving')) {
      return {
        success: true,
        tdsp: TDSP_INFO.ONCOR,
        confidence: 'medium',
        method: 'city-name-heuristics',
        warnings: ['Using city name heuristics for TDSP determination']
      };
    }
    
    if (city.includes('houston') || city.includes('katy') || city.includes('sugar land')) {
      return {
        success: true,
        tdsp: TDSP_INFO.CENTERPOINT,
        confidence: 'medium',
        method: 'city-name-heuristics',
        warnings: ['Using city name heuristics for TDSP determination']
      };
    }
    
    if (city.includes('austin') || city.includes('round rock') || city.includes('cedar park')) {
      return {
        success: true,
        tdsp: TDSP_INFO.AEP_CENTRAL,
        confidence: 'medium',
        method: 'city-name-heuristics',
        warnings: ['Using city name heuristics for TDSP determination']
      };
    }

    return {
      success: false,
      tdsp: null,
      confidence: 'low',
      method: 'geographic-heuristics-failed',
      warnings: ['No geographic heuristics match found']
    };
  }

  private async fallbackToMostCommonTdsp(zipCode: string): Promise<FallbackResult> {
    // Return the most common TDSP in Texas (Oncor)
    return {
      success: true,
      tdsp: TDSP_INFO.ONCOR,
      confidence: 'low',
      method: 'most-common-tdsp-fallback',
      warnings: ['Using most common TDSP in Texas as fallback']
    };
  }

  private async fallbackToDefaultTdsp(): Promise<FallbackResult> {
    // Ultimate fallback - return Oncor as it's the largest TDSP
    return {
      success: true,
      tdsp: TDSP_INFO.ONCOR,
      confidence: 'low',
      method: 'default-tdsp-fallback',
      warnings: ['Using default TDSP as last resort fallback']
    };
  }

  // Helper Methods

  private generateUserMessage(code: string, category: ErrorCategory, context?: any): string {
    const messages: Record<string, string> = {
      'ADDRESS_VALIDATION_FAILED': 'We had trouble validating your address. We\'ll use the information you provided.',
      'TDSP_RESOLUTION_FAILED': 'Unable to determine your exact utility provider. Using best guess based on your location.',
      'API_TIMEOUT': 'The service is taking longer than expected. Please try again in a moment.',
      'API_UNAUTHORIZED': 'There\'s a configuration issue with our service. Please contact support.',
      'API_RATE_LIMITED': 'We\'re receiving high traffic. Please wait a moment and try again.',
      'NETWORK_ERROR': 'Connection issue detected. Please check your internet connection and try again.',
      'ZIP_CODE_INVALID': 'Please enter a valid 5-digit ZIP code.',
      'ADDRESS_INCOMPLETE': 'Please provide a complete street address.',
      'MULTIPLE_TDSP_BOUNDARY': 'Your location is served by multiple utility providers. Please select your provider or provide more address details.'
    };

    return messages[code] || 'An unexpected error occurred. Please try again or contact support.';
  }

  private generateSuggestedActions(code: string, category: ErrorCategory, context?: any): string[] {
    const actions: Record<string, string[]> = {
      'ADDRESS_VALIDATION_FAILED': [
        'Verify your street address is complete and correct',
        'Try entering the address in a different format',
        'Check for typos in street name or number'
      ],
      'TDSP_RESOLUTION_FAILED': [
        'Provide your complete street address',
        'Verify your ZIP code is correct',
        'Try again with additional address details (apartment number, etc.)'
      ],
      'API_TIMEOUT': [
        'Wait a moment and try again',
        'Check your internet connection',
        'Try using a different device or browser'
      ],
      'ZIP_CODE_INVALID': [
        'Enter a 5-digit ZIP code',
        'Verify the ZIP code is for a Texas location',
        'Try a nearby ZIP code if unsure'
      ]
    };

    return actions[code] || ['Try again', 'Contact support if the problem persists'];
  }

  private isRecoverable(category: ErrorCategory, code: string): boolean {
    const nonRecoverableErrors = [
      'API_UNAUTHORIZED',
      'CONFIGURATION_MISSING',
      'SYSTEM_FAILURE'
    ];
    
    return !nonRecoverableErrors.includes(code);
  }

  private isRetryable(category: ErrorCategory, code: string): boolean {
    const retryableErrors = [
      'API_TIMEOUT',
      'NETWORK_ERROR',
      'API_SERVER_ERROR',
      'API_RATE_LIMITED'
    ];
    
    return retryableErrors.includes(code);
  }

  private determineFallbackStrategy(category: ErrorCategory, code: string): string {
    const strategies: Record<string, string> = {
      'ADDRESS_VALIDATION_FAILED': 'basic-parsing',
      'TDSP_RESOLUTION_FAILED': 'geographic-fallback',
      'API_TIMEOUT': 'cache-fallback',
      'API_SERVER_ERROR': 'cached-data'
    };

    return strategies[code] || 'default-fallback';
  }

  private parseAddressBasic(address: AddressInfo): NormalizedAddress {
    // Simple address parsing fallback
    const streetMatch = address.street.match(/^(\d+)\s+(.+)$/);
    const streetNumber = streetMatch ? streetMatch[1] : '';
    const streetName = streetMatch ? streetMatch[2] : address.street;

    return {
      streetNumber,
      streetName: streetName.trim(),
      streetType: '',
      city: address.city.trim(),
      state: 'TX',
      zipCode: address.zipCode,
      zip4: address.zip4,
      fullAddress: `${address.street}, ${address.city}, TX ${address.zipCode}`
    };
  }

  private createMinimalNormalizedAddress(address: AddressInfo): NormalizedAddress {
    return {
      streetNumber: '',
      streetName: address.street,
      streetType: '',
      city: address.city,
      state: 'TX',
      zipCode: address.zipCode,
      zip4: address.zip4,
      fullAddress: `${address.street}, ${address.city}, TX ${address.zipCode}`
    };
  }

  private logError(error: AddressError): void {
    // Track error frequency
    const count = this.errorCounts.get(error.code) || 0;
    this.errorCounts.set(error.code, count + 1);

    // Add to history
    this.errorHistory.push(error);
    if (this.errorHistory.length > this.MAX_HISTORY) {
      this.errorHistory.shift();
    }

    // Log based on severity
    if (error.severity === ErrorSeverity.CRITICAL) {
      console.error('CRITICAL ADDRESS ERROR:', error);
    } else if (error.severity === ErrorSeverity.HIGH) {
      console.error('HIGH SEVERITY ADDRESS ERROR:', error);
    } else {
      console.warn('Address Error:', error.code, error.message);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    mostFrequentErrors: Array<{ code: string; count: number }>;
    recentErrors: AddressError[];
  } {
    const errorsByCategory = {} as Record<ErrorCategory, number>;
    const errorsBySeverity = {} as Record<ErrorSeverity, number>;

    this.errorHistory.forEach(error => {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });

    const mostFrequentErrors = Array.from(this.errorCounts.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors: this.errorHistory.length,
      errorsByCategory,
      errorsBySeverity,
      mostFrequentErrors,
      recentErrors: this.errorHistory.slice(-10)
    };
  }

  /**
   * Clear error history and stats
   */
  clearErrorHistory(): void {
    this.errorHistory.length = 0;
    this.errorCounts.clear();
  }
}

// Export default instance
export const addressErrorHandler = new AddressErrorHandler();

// Export utility functions for creating common errors
export function createZipCodeError(zipCode: string): AddressError {
  return addressErrorHandler.createError(
    'ZIP_CODE_INVALID',
    `Invalid ZIP code: ${zipCode}`,
    ErrorCategory.USER_INPUT,
    ErrorSeverity.LOW,
    { zipCode }
  );
}

export function createAddressIncompleteError(address: Partial<AddressInfo>): AddressError {
  return addressErrorHandler.createError(
    'ADDRESS_INCOMPLETE',
    'Incomplete address provided',
    ErrorCategory.USER_INPUT,
    ErrorSeverity.MEDIUM,
    { address }
  );
}

export function createMultiTdspBoundaryError(zipCode: string, tdsps: TdspInfo[]): AddressError {
  return addressErrorHandler.createError(
    'MULTIPLE_TDSP_BOUNDARY',
    `ZIP code ${zipCode} is served by multiple TDSPs`,
    ErrorCategory.TDSP_RESOLUTION,
    ErrorSeverity.MEDIUM,
    { zipCode, availableTdsps: tdsps }
  );
}