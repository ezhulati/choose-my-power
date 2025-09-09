/**
 * External API Configuration and Validation
 * Centralizes API endpoint configurations and validation rules
 */

import { zipCoverageConfig } from '../../config/zip-coverage-env.ts';
import type { 
  APIOrchestrationConfig,
  ExternalAPIConfiguration,
  MockAPIConfiguration 
} from '../../types/external-apis.ts';

/**
 * Default orchestration configuration for external APIs
 */
export const DEFAULT_API_ORCHESTRATION_CONFIG: APIOrchestrationConfig = {
  sources: {
    // ERCOT - Highest priority (authoritative for TDSP assignments)
    ercot: {
      priority: 10,
      weight: 0.4,
      timeout: zipCoverageConfig.externalApis.ercot.timeout,
      retries: 3,
      enabled: zipCoverageConfig.sync.enabledSources.includes('ercot')
    },

    // PUCT - High priority (authoritative for deregulation status)
    puct: {
      priority: 9,
      weight: 0.3,
      timeout: zipCoverageConfig.externalApis.puct.timeout,
      retries: 3,
      enabled: zipCoverageConfig.sync.enabledSources.includes('puct')
    },

    // USPS - High priority (authoritative for ZIP code validation)
    usps: {
      priority: 8,
      weight: 0.2,
      timeout: zipCoverageConfig.externalApis.usps.timeout,
      retries: 2,
      enabled: zipCoverageConfig.sync.enabledSources.includes('usps')
    },

    // TDSP APIs - Medium priority (territory-specific validation)
    oncor: {
      priority: 7,
      weight: 0.15,
      timeout: zipCoverageConfig.externalApis.tdsps.oncor.timeout,
      retries: 2,
      enabled: zipCoverageConfig.sync.enabledSources.includes('oncor')
    },

    centerpoint: {
      priority: 7,
      weight: 0.15,
      timeout: zipCoverageConfig.externalApis.tdsps.centerpoint.timeout,
      retries: 2,
      enabled: zipCoverageConfig.sync.enabledSources.includes('centerpoint')
    },

    aep_north: {
      priority: 6,
      weight: 0.1,
      timeout: zipCoverageConfig.externalApis.tdsps.aepNorth.timeout,
      retries: 2,
      enabled: zipCoverageConfig.sync.enabledSources.includes('aep_north')
    },

    aep_central: {
      priority: 6,
      weight: 0.1,
      timeout: zipCoverageConfig.externalApis.tdsps.aepCentral.timeout,
      retries: 2,
      enabled: zipCoverageConfig.sync.enabledSources.includes('aep_central')
    },

    tnmp: {
      priority: 5,
      weight: 0.1,
      timeout: zipCoverageConfig.externalApis.tdsps.tnmp.timeout,
      retries: 2,
      enabled: zipCoverageConfig.sync.enabledSources.includes('tnmp')
    }
  },

  conflictResolution: {
    strategy: 'highest_confidence',
    minimumConfidence: 70,
    requireMultipleSources: true
  },

  caching: {
    enabled: true,
    ttl: zipCoverageConfig.cache.ttl.zipLookup,
    keyPrefix: 'zip_coverage_external_api:'
  }
};

/**
 * External API client configuration
 */
export const EXTERNAL_API_CONFIG: ExternalAPIConfiguration = {
  client: {
    userAgent: 'ChooseMyPower-ZIP-Coverage/1.0 (Texas Electricity Market)',
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    maxConcurrent: zipCoverageConfig.performance.maxConcurrentRequests
  },

  rateLimiting: {
    enabled: true,
    perSourceLimits: {
      ercot: zipCoverageConfig.externalApis.ercot.rateLimits.requestsPerHour,
      puct: zipCoverageConfig.externalApis.puct.rateLimits.requestsPerHour,
      usps: zipCoverageConfig.externalApis.usps.rateLimits.requestsPerHour,
      oncor: zipCoverageConfig.externalApis.tdsps.oncor.rateLimits.requestsPerHour,
      centerpoint: zipCoverageConfig.externalApis.tdsps.centerpoint.rateLimits.requestsPerHour,
      aep_north: zipCoverageConfig.externalApis.tdsps.aepNorth.rateLimits.requestsPerHour,
      aep_central: zipCoverageConfig.externalApis.tdsps.aepCentral.rateLimits.requestsPerHour,
      tnmp: zipCoverageConfig.externalApis.tdsps.tnmp.rateLimits.requestsPerHour
    },
    backoffStrategy: 'exponential'
  },

  monitoring: {
    enableMetrics: true,
    enableDetailedLogging: zipCoverageConfig.development.enableDetailedLogging,
    healthCheckInterval: 300000, // 5 minutes
    alertThresholds: {
      errorRate: 10, // 10% error rate
      responseTime: zipCoverageConfig.performance.responseTimeTarget * 2, // 2x target
      availability: 95 // 95% availability
    }
  },

  fallbacks: {
    enableFallbackSources: true,
    fallbackOrder: ['ercot', 'puct', 'usps', 'oncor', 'centerpoint'],
    fallbackTimeout: 10000
  }
};

/**
 * Mock API configuration for testing
 */
export const MOCK_API_CONFIG: MockAPIConfiguration = {
  enabled: zipCoverageConfig.development.enableMockData,
  latency: {
    min: 100,
    max: 500
  },
  errorRate: 5, // 5% error rate for testing resilience
  rateLimitSimulation: true,
  dataSet: 'comprehensive'
};

/**
 * API endpoint configurations with validation
 */
export const API_ENDPOINTS = {
  ercot: {
    baseUrl: zipCoverageConfig.externalApis.ercot.endpoint,
    paths: {
      territoryLookup: '/api/v1/territory',
      marketData: '/api/v1/market-data',
      loadZones: '/api/v1/load-zones'
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(zipCoverageConfig.externalApis.ercot.apiKey && {
        'Authorization': `Bearer ${zipCoverageConfig.externalApis.ercot.apiKey}`
      })
    }
  },

  puct: {
    baseUrl: zipCoverageConfig.externalApis.puct.endpoint,
    paths: {
      repDirectory: '/api/rep',
      deregulatedAreas: '/api/deregulated-areas',
      providerCertification: '/api/certification'
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(zipCoverageConfig.externalApis.puct.apiKey && {
        'X-API-Key': zipCoverageConfig.externalApis.puct.apiKey
      })
    }
  },

  usps: {
    baseUrl: zipCoverageConfig.externalApis.usps.endpoint,
    paths: {
      addressValidation: '/ShippingAPI.dll',
      zipLookup: '/ShippingAPI.dll'
    },
    headers: {
      'Content-Type': 'application/xml',
      'Accept': 'application/xml'
    },
    auth: {
      userId: zipCoverageConfig.externalApis.usps.apiKey
    }
  },

  tdsps: {
    oncor: {
      baseUrl: zipCoverageConfig.externalApis.tdsps.oncor.endpoint,
      paths: {
        territoryCheck: '/v1/territory/check',
        serviceAreas: '/v1/service-areas',
        outageMap: '/v1/outage-map'
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(zipCoverageConfig.externalApis.tdsps.oncor.apiKey && {
          'X-API-Key': zipCoverageConfig.externalApis.tdsps.oncor.apiKey
        })
      }
    },

    centerpoint: {
      baseUrl: zipCoverageConfig.externalApis.tdsps.centerpoint.endpoint,
      paths: {
        territoryValidation: '/api/v2/territory/validate',
        serviceAreas: '/api/v2/service-areas'
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(zipCoverageConfig.externalApis.tdsps.centerpoint.apiKey && {
          'Authorization': `Token ${zipCoverageConfig.externalApis.tdsps.centerpoint.apiKey}`
        })
      }
    },

    aep_north: {
      baseUrl: zipCoverageConfig.externalApis.tdsps.aepNorth.endpoint,
      paths: {
        territoryLookup: '/territory/lookup',
        serviceInfo: '/service/info'
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(zipCoverageConfig.externalApis.tdsps.aepNorth.apiKey && {
          'X-AEP-API-Key': zipCoverageConfig.externalApis.tdsps.aepNorth.apiKey
        })
      }
    },

    aep_central: {
      baseUrl: zipCoverageConfig.externalApis.tdsps.aepCentral.endpoint,
      paths: {
        territoryLookup: '/territory/lookup',
        serviceInfo: '/service/info'
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(zipCoverageConfig.externalApis.tdsps.aepCentral.apiKey && {
          'X-AEP-API-Key': zipCoverageConfig.externalApis.tdsps.aepCentral.apiKey
        })
      }
    },

    tnmp: {
      baseUrl: zipCoverageConfig.externalApis.tdsps.tnmp.endpoint,
      paths: {
        serviceTerritory: '/api/service-territory',
        zipValidation: '/api/zip-validation'
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(zipCoverageConfig.externalApis.tdsps.tnmp.apiKey && {
          'X-TNMP-Key': zipCoverageConfig.externalApis.tdsps.tnmp.apiKey
        })
      }
    }
  }
};

/**
 * Validate API configuration
 */
export function validateAPIConfiguration(): string[] {
  const errors: string[] = [];

  // Check required API keys
  if (!zipCoverageConfig.externalApis.usps.apiKey) {
    errors.push('USPS API key is required for ZIP code validation');
  }

  // Check endpoint URLs
  const endpoints = [
    zipCoverageConfig.externalApis.ercot.endpoint,
    zipCoverageConfig.externalApis.puct.endpoint,
    zipCoverageConfig.externalApis.usps.endpoint
  ];

  endpoints.forEach((endpoint, index) => {
    const sources = ['ERCOT', 'PUCT', 'USPS'];
    if (!endpoint || !endpoint.startsWith('http')) {
      errors.push(`${sources[index]} endpoint must be a valid HTTP/HTTPS URL`);
    }
  });

  // Validate rate limits
  const rateLimits = [
    zipCoverageConfig.externalApis.ercot.rateLimits.requestsPerHour,
    zipCoverageConfig.externalApis.puct.rateLimits.requestsPerHour,
    zipCoverageConfig.externalApis.usps.rateLimits.requestsPerHour
  ];

  rateLimits.forEach((limit, index) => {
    const sources = ['ERCOT', 'PUCT', 'USPS'];
    if (limit < 1 || limit > 100000) {
      errors.push(`${sources[index]} rate limit must be between 1 and 100,000 requests per hour`);
    }
  });

  // Validate timeout settings
  const timeouts = [
    zipCoverageConfig.externalApis.ercot.timeout,
    zipCoverageConfig.externalApis.puct.timeout,
    zipCoverageConfig.externalApis.usps.timeout
  ];

  timeouts.forEach((timeout, index) => {
    const sources = ['ERCOT', 'PUCT', 'USPS'];
    if (timeout < 1000 || timeout > 120000) {
      errors.push(`${sources[index]} timeout must be between 1,000ms and 120,000ms`);
    }
  });

  return errors;
}

/**
 * Get enabled API sources based on configuration
 */
export function getEnabledAPISources(): string[] {
  return zipCoverageConfig.sync.enabledSources.filter(source => {
    const config = DEFAULT_API_ORCHESTRATION_CONFIG.sources[source];
    return config && config.enabled;
  });
}

/**
 * Get API source priority order for fallbacks
 */
export function getAPISourcePriorityOrder(): string[] {
  const sources = Object.entries(DEFAULT_API_ORCHESTRATION_CONFIG.sources)
    .filter(([_, config]) => config.enabled)
    .sort((a, b) => b[1].priority - a[1].priority)
    .map(([name]) => name);

  return sources;
}

/**
 * Calculate total weight for conflict resolution
 */
export function getTotalSourceWeight(sources: string[]): number {
  return sources.reduce((total, source) => {
    const config = DEFAULT_API_ORCHESTRATION_CONFIG.sources[source];
    return total + (config?.weight || 0);
  }, 0);
}

/**
 * Get source-specific configuration
 */
export function getSourceConfig(source: string) {
  return DEFAULT_API_ORCHESTRATION_CONFIG.sources[source];
}

/**
 * Check if source is enabled and configured
 */
export function isSourceEnabled(source: string): boolean {
  const config = DEFAULT_API_ORCHESTRATION_CONFIG.sources[source];
  return config?.enabled || false;
}

/**
 * Development configuration overrides
 */
export function getDevOverrideConfig(): Partial<ExternalAPIConfiguration> {
  if (!zipCoverageConfig.development.enableMockData) {
    return {};
  }

  return {
    client: {
      ...EXTERNAL_API_CONFIG.client,
      timeout: 5000, // Shorter timeout for dev
      retries: 1     // Fewer retries for faster dev feedback
    },
    monitoring: {
      ...EXTERNAL_API_CONFIG.monitoring,
      enableDetailedLogging: true,
      healthCheckInterval: 60000 // More frequent health checks in dev
    }
  };
}