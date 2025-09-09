/**
 * ZIP Error Recovery Service
 * Phase 3.4 Enhancement: T029 - Smart error recovery and suggestion system
 * Provides intelligent suggestions and recovery options for failed ZIP lookups
 */

import type { 
  ZIPErrorCode,
  ZIPRoutingResult
} from '../types/zip-navigation';

interface ZIPSuggestion {
  zipCode: string;
  cityName: string;
  distance?: number;
  reason: 'nearby' | 'popular' | 'similar' | 'typo_correction';
}

interface ErrorRecoveryResult {
  suggestions: ZIPSuggestion[];
  recoveryActions: string[];
  helpfulTips: string[];
}

export class ZIPErrorRecoveryService {
  // Common Texas ZIP code patterns for typo detection
  private readonly texasZipPatterns = [
    { prefix: '75', region: 'Dallas-Fort Worth' },
    { prefix: '76', region: 'Fort Worth-Waco' },
    { prefix: '77', region: 'Houston' },
    { prefix: '78', region: 'Austin-San Antonio' },
    { prefix: '79', region: 'West Texas' }
  ];

  // Popular Texas ZIP codes for fallback suggestions
  private readonly popularTexasZips = [
    { zip: '75201', city: 'Dallas', region: 'Dallas-Fort Worth' },
    { zip: '75701', city: 'Tyler', region: 'East Texas' },
    { zip: '77001', city: 'Houston', region: 'Houston' },
    { zip: '77002', city: 'Houston', region: 'Houston' },
    { zip: '78701', city: 'Austin', region: 'Austin' },
    { zip: '78201', city: 'San Antonio', region: 'San Antonio' },
    { zip: '76101', city: 'Fort Worth', region: 'Dallas-Fort Worth' },
    { zip: '79401', city: 'Lubbock', region: 'West Texas' }
  ];

  /**
   * Provide intelligent error recovery suggestions for failed ZIP lookups
   */
  async getErrorRecovery(zipCode: string, errorCode: ZIPErrorCode): Promise<ErrorRecoveryResult> {
    const suggestions: ZIPSuggestion[] = [];
    const recoveryActions: string[] = [];
    const helpfulTips: string[] = [];

    switch (errorCode) {
      case 'INVALID_FORMAT':
        return this.handleInvalidFormat(zipCode);
        
      case 'NOT_TEXAS':
        return this.handleNotTexas(zipCode);
        
      case 'NOT_FOUND':
        return this.handleNotFound(zipCode);
        
      case 'NOT_DEREGULATED':
        return this.handleNotDeregulated(zipCode);
        
      case 'MUNICIPAL_UTILITY':
      case 'COOPERATIVE':
        return this.handleRegulatedArea(zipCode, errorCode);
        
      case 'NO_PLANS':
        return this.handleNoPlans(zipCode);
        
      default:
        return this.handleGenericError(zipCode);
    }
  }

  private async handleInvalidFormat(zipCode: string): Promise<ErrorRecoveryResult> {
    const suggestions: ZIPSuggestion[] = [];
    
    // Try to fix common formatting issues
    const cleaned = zipCode.replace(/\D/g, '');
    
    if (cleaned.length === 4) {
      // Missing leading zero - try common Texas patterns
      for (const pattern of this.texasZipPatterns) {
        const suggested = pattern.prefix[0] + cleaned;
        suggestions.push({
          zipCode: suggested,
          cityName: pattern.region,
          reason: 'typo_correction'
        });
      }
    } else if (cleaned.length === 6) {
      // Extra digit - try removing last digit
      const suggested = cleaned.slice(0, 5);
      if (this.isLikelyTexasZip(suggested)) {
        suggestions.push({
          zipCode: suggested,
          cityName: 'Corrected ZIP',
          reason: 'typo_correction'
        });
      }
    }

    // Add popular fallbacks
    suggestions.push(...this.getPopularSuggestions(3));

    return {
      suggestions,
      recoveryActions: [
        'Double-check the ZIP code format (should be 5 digits)',
        'Try entering your city name instead',
        'Select from popular Texas ZIP codes below'
      ],
      helpfulTips: [
        'Texas ZIP codes typically start with 75, 76, 77, 78, or 79',
        'Make sure you\'re entering a 5-digit ZIP code',
        'If you\'re unsure, try using your city name to find your ZIP code'
      ]
    };
  }

  private async handleNotTexas(zipCode: string): Promise<ErrorRecoveryResult> {
    const suggestions: ZIPSuggestion[] = [];
    
    // Detect if they might have meant a Texas ZIP code
    const correctedSuggestions = this.getTypoCorrectionSuggestions(zipCode);
    suggestions.push(...correctedSuggestions);
    
    // Add popular Texas ZIPs
    suggestions.push(...this.getPopularSuggestions(4));

    return {
      suggestions,
      recoveryActions: [
        'Enter a Texas ZIP code instead',
        'Check if you have family or business locations in Texas',
        'Select from popular Texas areas below'
      ],
      helpfulTips: [
        'Our service only covers Texas deregulated electricity markets',
        'Texas ZIP codes start with 75, 76, 77, 78, or 79',
        'If you\'re moving to Texas, these are popular areas with many plan options'
      ]
    };
  }

  private async handleNotFound(zipCode: string): Promise<ErrorRecoveryResult> {
    const suggestions: ZIPSuggestion[] = [];
    
    // Find nearby ZIP codes with similar patterns
    const nearbySuggestions = this.getNearbyZipSuggestions(zipCode);
    suggestions.push(...nearbySuggestions);
    
    // Add typo corrections
    const typoSuggestions = this.getTypoCorrectionSuggestions(zipCode);
    suggestions.push(...typoSuggestions);

    return {
      suggestions,
      recoveryActions: [
        'Check for typos in the ZIP code',
        'Try a nearby ZIP code',
        'Use your city name to find the correct ZIP code'
      ],
      helpfulTips: [
        'Some ZIP codes might be new or have changed recently',
        'Try using a ZIP code from a nearby neighborhood',
        'Commercial ZIP codes might not show residential plans'
      ]
    };
  }

  private async handleNotDeregulated(zipCode: string): Promise<ErrorRecoveryResult> {
    const suggestions = this.getPopularSuggestions(5);

    return {
      suggestions,
      recoveryActions: [
        'Try a ZIP code from a deregulated area',
        'Check nearby cities that have competitive electricity markets'
      ],
      helpfulTips: [
        'This area is served by a municipal utility with fixed rates',
        'Deregulated areas have competitive electricity markets',
        'Major Texas cities like Dallas, Houston, and Austin are deregulated'
      ]
    };
  }

  private async handleRegulatedArea(zipCode: string, errorCode: ZIPErrorCode): Promise<ErrorRecoveryResult> {
    const suggestions = this.getPopularSuggestions(4);
    const utilityType = errorCode === 'MUNICIPAL_UTILITY' ? 'municipal utility' : 'electric cooperative';

    return {
      suggestions,
      recoveryActions: [
        'Try a ZIP code from a competitive electricity market',
        'Check neighboring areas for deregulated options'
      ],
      helpfulTips: [
        `This area is served by a ${utilityType} with regulated rates`,
        'You can still compare plans in nearby deregulated areas',
        'Consider areas served by major utilities like Oncor or CenterPoint'
      ]
    };
  }

  private async handleNoPlans(zipCode: string): Promise<ErrorRecoveryResult> {
    const suggestions = this.getNearbyZipSuggestions(zipCode);

    return {
      suggestions,
      recoveryActions: [
        'Try a nearby ZIP code with active plans',
        'Check back later as new plans are added regularly'
      ],
      helpfulTips: [
        'Plans may be temporarily unavailable in this specific ZIP code',
        'Nearby areas often have similar plan options',
        'New plans are added regularly as providers expand coverage'
      ]
    };
  }

  private async handleGenericError(zipCode: string): Promise<ErrorRecoveryResult> {
    const suggestions = this.getPopularSuggestions(3);

    return {
      suggestions,
      recoveryActions: [
        'Try again in a moment',
        'Use a popular Texas ZIP code',
        'Contact support if the problem persists'
      ],
      helpfulTips: [
        'This might be a temporary service issue',
        'Popular ZIP codes are more likely to work',
        'Try clearing your browser cache if problems continue'
      ]
    };
  }

  /**
   * Get popular Texas ZIP code suggestions
   */
  private getPopularSuggestions(limit: number): ZIPSuggestion[] {
    return this.popularTexasZips
      .slice(0, limit)
      .map(zip => ({
        zipCode: zip.zip,
        cityName: zip.city,
        reason: 'popular' as const
      }));
  }

  /**
   * Find nearby ZIP codes with similar numeric patterns
   */
  private getNearbyZipSuggestions(zipCode: string): ZIPSuggestion[] {
    const suggestions: ZIPSuggestion[] = [];
    const baseNumber = parseInt(zipCode);
    
    if (isNaN(baseNumber)) return suggestions;

    // Try ZIP codes within +/- 10 range
    for (let i = -10; i <= 10; i += 2) {
      if (i === 0) continue;
      
      const candidate = (baseNumber + i).toString().padStart(5, '0');
      if (this.isLikelyTexasZip(candidate)) {
        const region = this.getRegionFromZip(candidate);
        if (region) {
          suggestions.push({
            zipCode: candidate,
            cityName: region,
            distance: Math.abs(i),
            reason: 'nearby'
          });
        }
      }
    }

    return suggestions.slice(0, 3);
  }

  /**
   * Get typo correction suggestions
   */
  private getTypoCorrectionSuggestions(zipCode: string): ZIPSuggestion[] {
    const suggestions: ZIPSuggestion[] = [];
    
    if (zipCode.length !== 5) return suggestions;

    // Try swapping adjacent digits (common typo)
    for (let i = 0; i < 4; i++) {
      const chars = zipCode.split('');
      [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
      const swapped = chars.join('');
      
      if (this.isLikelyTexasZip(swapped)) {
        const region = this.getRegionFromZip(swapped);
        if (region) {
          suggestions.push({
            zipCode: swapped,
            cityName: region,
            reason: 'typo_correction'
          });
        }
      }
    }

    return suggestions.slice(0, 2);
  }

  /**
   * Check if a ZIP code looks like it could be from Texas
   */
  private isLikelyTexasZip(zipCode: string): boolean {
    if (zipCode.length !== 5) return false;
    const prefix = zipCode.substring(0, 2);
    return ['75', '76', '77', '78', '79'].includes(prefix);
  }

  /**
   * Get region name from ZIP code pattern
   */
  private getRegionFromZip(zipCode: string): string | null {
    const prefix = zipCode.substring(0, 2);
    const pattern = this.texasZipPatterns.find(p => p.prefix === prefix);
    return pattern?.region || null;
  }

  /**
   * Format suggestions for display
   */
  formatSuggestionsForDisplay(suggestions: ZIPSuggestion[]): string[] {
    return suggestions.map(suggestion => {
      switch (suggestion.reason) {
        case 'typo_correction':
          return `${suggestion.zipCode} (Did you mean this?)`;
        case 'nearby':
          return `${suggestion.zipCode} (${suggestion.cityName})`;
        case 'popular':
          return `${suggestion.zipCode} (${suggestion.cityName} - Popular)`;
        case 'similar':
          return `${suggestion.zipCode} (${suggestion.cityName} - Similar)`;
        default:
          return suggestion.zipCode;
      }
    });
  }
}

// Export singleton instance
export const zipErrorRecoveryService = new ZIPErrorRecoveryService();