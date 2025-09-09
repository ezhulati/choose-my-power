/**
 * Environment Variables Configuration for ZIP Coverage System
 * Centralizes all external API configurations and validation
 */

/**
 * ZIP Coverage System Environment Variables
 */
export interface ZIPCoverageEnvironment {
  // Database Configuration
  database: {
    connectionString: string;
    maxConnections: number;
    queryTimeout: number;
  };

  // Redis Cache Configuration  
  cache: {
    redisUrl: string;
    ttl: {
      zipLookup: number;      // 24 hours
      cityTerritory: number;   // 7 days
      tdspInfo: number;        // 30 days
      validationLog: number;   // 1 hour
    };
  };

  // External API Configuration
  externalApis: {
    // ERCOT Market Information System
    ercot: {
      endpoint: string;
      apiKey?: string;
      rateLimits: {
        requestsPerHour: number;
        requestsPerDay: number;
      };
      timeout: number;
    };

    // Public Utility Commission of Texas
    puct: {
      endpoint: string;
      apiKey?: string;
      rateLimits: {
        requestsPerHour: number;
        requestsPerDay: number;
      };
      timeout: number;
    };

    // TDSP-specific APIs
    tdsps: {
      oncor: {
        endpoint: string;
        apiKey?: string;
        rateLimits: {
          requestsPerHour: number;
          requestsPerDay: number;
        };
        timeout: number;
      };
      centerpoint: {
        endpoint: string;
        apiKey?: string;
        rateLimits: {
          requestsPerHour: number;
          requestsPerDay: number;
        };
        timeout: number;
      };
      aepNorth: {
        endpoint: string;
        apiKey?: string;
        rateLimits: {
          requestsPerHour: number;
          requestsPerDay: number;
        };
        timeout: number;
      };
      aepCentral: {
        endpoint: string;
        apiKey?: string;
        rateLimits: {
          requestsPerHour: number;
          requestsPerDay: number;
        };
        timeout: number;
      };
      tnmp: {
        endpoint: string;
        apiKey?: string;
        rateLimits: {
          requestsPerHour: number;
          requestsPerDay: number;
        };
        timeout: number;
      };
    };

    // USPS Address/ZIP Validation
    usps: {
      endpoint: string;
      apiKey: string;
      rateLimits: {
        requestsPerHour: number;
        requestsPerDay: number;
      };
      timeout: number;
    };
  };

  // Data Synchronization Configuration
  sync: {
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string; // HH:MM format
    };
    batchSize: number;
    maxRetries: number;
    backoffMultiplier: number;
    enabledSources: string[];
  };

  // Performance and Quality Targets
  performance: {
    maxConcurrentRequests: number;
    responseTimeTarget: number; // milliseconds
    accuracyTarget: number;     // percentage
    cacheHitRateTarget: number; // percentage
  };

  // Development and Testing Configuration
  development: {
    enableMockData: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    enableDetailedLogging: boolean;
    testDataSource: boolean;
  };
}

/**
 * Load and validate environment configuration
 */
export function loadZIPCoverageEnvironment(): ZIPCoverageEnvironment {
  return {
    database: {
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || '',
      maxConnections: parseInt(process.env.ZIP_COVERAGE_MAX_DB_CONNECTIONS || '10'),
      queryTimeout: parseInt(process.env.ZIP_COVERAGE_DB_QUERY_TIMEOUT || '30000')
    },

    cache: {
      redisUrl: process.env.REDIS_URL || process.env.ZIP_COVERAGE_REDIS_URL || '',
      ttl: {
        zipLookup: parseInt(process.env.ZIP_COVERAGE_CACHE_TTL_ZIP || '86400'),        // 24 hours
        cityTerritory: parseInt(process.env.ZIP_COVERAGE_CACHE_TTL_CITY || '604800'),  // 7 days
        tdspInfo: parseInt(process.env.ZIP_COVERAGE_CACHE_TTL_TDSP || '2592000'),      // 30 days
        validationLog: parseInt(process.env.ZIP_COVERAGE_CACHE_TTL_LOG || '3600')     // 1 hour
      }
    },

    externalApis: {
      ercot: {
        endpoint: process.env.ERCOT_API_ENDPOINT || 'https://www.ercot.com/mktrpt/mis',
        apiKey: process.env.ERCOT_API_KEY,
        rateLimits: {
          requestsPerHour: parseInt(process.env.ERCOT_RATE_LIMIT_HOUR || '100'),
          requestsPerDay: parseInt(process.env.ERCOT_RATE_LIMIT_DAY || '1000')
        },
        timeout: parseInt(process.env.ERCOT_API_TIMEOUT || '30000')
      },

      puct: {
        endpoint: process.env.PUCT_API_ENDPOINT || 'https://www.puc.texas.gov/industry/electric/directories/rep',
        apiKey: process.env.PUCT_API_KEY,
        rateLimits: {
          requestsPerHour: parseInt(process.env.PUCT_RATE_LIMIT_HOUR || '50'),
          requestsPerDay: parseInt(process.env.PUCT_RATE_LIMIT_DAY || '500')
        },
        timeout: parseInt(process.env.PUCT_API_TIMEOUT || '30000')
      },

      tdsps: {
        oncor: {
          endpoint: process.env.ONCOR_API_ENDPOINT || 'https://www.oncor.com/api/territory',
          apiKey: process.env.ONCOR_API_KEY,
          rateLimits: {
            requestsPerHour: parseInt(process.env.ONCOR_RATE_LIMIT_HOUR || '1000'),
            requestsPerDay: parseInt(process.env.ONCOR_RATE_LIMIT_DAY || '10000')
          },
          timeout: parseInt(process.env.ONCOR_API_TIMEOUT || '15000')
        },

        centerpoint: {
          endpoint: process.env.CENTERPOINT_API_ENDPOINT || 'https://www.centerpointenergy.com/api/territory',
          apiKey: process.env.CENTERPOINT_API_KEY,
          rateLimits: {
            requestsPerHour: parseInt(process.env.CENTERPOINT_RATE_LIMIT_HOUR || '1000'),
            requestsPerDay: parseInt(process.env.CENTERPOINT_RATE_LIMIT_DAY || '10000')
          },
          timeout: parseInt(process.env.CENTERPOINT_API_TIMEOUT || '15000')
        },

        aepNorth: {
          endpoint: process.env.AEP_NORTH_API_ENDPOINT || 'https://www.aeptexas.com/api/territory/north',
          apiKey: process.env.AEP_NORTH_API_KEY,
          rateLimits: {
            requestsPerHour: parseInt(process.env.AEP_NORTH_RATE_LIMIT_HOUR || '500'),
            requestsPerDay: parseInt(process.env.AEP_NORTH_RATE_LIMIT_DAY || '5000')
          },
          timeout: parseInt(process.env.AEP_NORTH_API_TIMEOUT || '20000')
        },

        aepCentral: {
          endpoint: process.env.AEP_CENTRAL_API_ENDPOINT || 'https://www.aeptexas.com/api/territory/central',
          apiKey: process.env.AEP_CENTRAL_API_KEY,
          rateLimits: {
            requestsPerHour: parseInt(process.env.AEP_CENTRAL_RATE_LIMIT_HOUR || '500'),
            requestsPerDay: parseInt(process.env.AEP_CENTRAL_RATE_LIMIT_DAY || '5000')
          },
          timeout: parseInt(process.env.AEP_CENTRAL_API_TIMEOUT || '20000')
        },

        tnmp: {
          endpoint: process.env.TNMP_API_ENDPOINT || 'https://www.tnmp.com/api/territory',
          apiKey: process.env.TNMP_API_KEY,
          rateLimits: {
            requestsPerHour: parseInt(process.env.TNMP_RATE_LIMIT_HOUR || '500'),
            requestsPerDay: parseInt(process.env.TNMP_RATE_LIMIT_DAY || '5000')
          },
          timeout: parseInt(process.env.TNMP_API_TIMEOUT || '20000')
        }
      },

      usps: {
        endpoint: process.env.USPS_API_ENDPOINT || 'https://www.usps.com/business/web-tools-apis/address-information-api.htm',
        apiKey: process.env.USPS_API_KEY || '',
        rateLimits: {
          requestsPerHour: parseInt(process.env.USPS_RATE_LIMIT_HOUR || '5000'),
          requestsPerDay: parseInt(process.env.USPS_RATE_LIMIT_DAY || '50000')
        },
        timeout: parseInt(process.env.USPS_API_TIMEOUT || '10000')
      }
    },

    sync: {
      schedule: {
        frequency: (process.env.ZIP_COVERAGE_SYNC_FREQUENCY as 'daily' | 'weekly' | 'monthly') || 'daily',
        time: process.env.ZIP_COVERAGE_SYNC_TIME || '02:00'
      },
      batchSize: parseInt(process.env.ZIP_COVERAGE_SYNC_BATCH_SIZE || '100'),
      maxRetries: parseInt(process.env.ZIP_COVERAGE_SYNC_MAX_RETRIES || '3'),
      backoffMultiplier: parseFloat(process.env.ZIP_COVERAGE_SYNC_BACKOFF || '2.0'),
      enabledSources: (process.env.ZIP_COVERAGE_ENABLED_SOURCES || 'ercot,puct,oncor,centerpoint').split(',')
    },

    performance: {
      maxConcurrentRequests: parseInt(process.env.ZIP_COVERAGE_MAX_CONCURRENT || '10'),
      responseTimeTarget: parseInt(process.env.ZIP_COVERAGE_RESPONSE_TIME_TARGET || '200'),
      accuracyTarget: parseInt(process.env.ZIP_COVERAGE_ACCURACY_TARGET || '99'),
      cacheHitRateTarget: parseInt(process.env.ZIP_COVERAGE_CACHE_HIT_TARGET || '85')
    },

    development: {
      enableMockData: process.env.ZIP_COVERAGE_ENABLE_MOCK_DATA === 'true',
      logLevel: (process.env.ZIP_COVERAGE_LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info',
      enableDetailedLogging: process.env.ZIP_COVERAGE_DETAILED_LOGGING === 'true',
      testDataSource: process.env.ZIP_COVERAGE_TEST_DATA_SOURCE === 'true'
    }
  };
}

/**
 * Validate required environment variables
 */
export function validateZIPCoverageEnvironment(config: ZIPCoverageEnvironment): string[] {
  const errors: string[] = [];

  // Required database configuration
  if (!config.database.connectionString) {
    errors.push('DATABASE_URL or POSTGRES_URL is required for ZIP coverage database connection');
  }

  // Validate USPS API key (required for ZIP validation)
  if (!config.externalApis.usps.apiKey) {
    errors.push('USPS_API_KEY is required for ZIP code validation');
  }

  // Validate performance targets
  if (config.performance.accuracyTarget < 90) {
    errors.push('ZIP_COVERAGE_ACCURACY_TARGET must be at least 90%');
  }

  if (config.performance.responseTimeTarget > 1000) {
    errors.push('ZIP_COVERAGE_RESPONSE_TIME_TARGET should be under 1000ms for good UX');
  }

  // Validate sync configuration
  if (!['daily', 'weekly', 'monthly'].includes(config.sync.schedule.frequency)) {
    errors.push('ZIP_COVERAGE_SYNC_FREQUENCY must be daily, weekly, or monthly');
  }

  if (!/^\d{2}:\d{2}$/.test(config.sync.schedule.time)) {
    errors.push('ZIP_COVERAGE_SYNC_TIME must be in HH:MM format');
  }

  // Validate batch size
  if (config.sync.batchSize < 1 || config.sync.batchSize > 1000) {
    errors.push('ZIP_COVERAGE_SYNC_BATCH_SIZE must be between 1 and 1000');
  }

  return errors;
}

/**
 * Get configuration with validation
 */
export function getValidatedZIPCoverageConfig(): ZIPCoverageEnvironment {
  const config = loadZIPCoverageEnvironment();
  const errors = validateZIPCoverageEnvironment(config);

  if (errors.length > 0) {
    throw new Error(`ZIP Coverage Environment Configuration Errors:\n${errors.join('\n')}`);
  }

  return config;
}

// Export default configuration instance
export const zipCoverageConfig = loadZIPCoverageEnvironment();

// Environment variable names for documentation
export const ZIP_COVERAGE_ENV_VARS = {
  // Database
  DATABASE_URL: 'PostgreSQL connection string',
  ZIP_COVERAGE_MAX_DB_CONNECTIONS: 'Maximum database connections (default: 10)',
  ZIP_COVERAGE_DB_QUERY_TIMEOUT: 'Database query timeout in ms (default: 30000)',

  // Cache
  REDIS_URL: 'Redis connection string for caching',
  ZIP_COVERAGE_CACHE_TTL_ZIP: 'ZIP lookup cache TTL in seconds (default: 86400)',
  ZIP_COVERAGE_CACHE_TTL_CITY: 'City territory cache TTL in seconds (default: 604800)',
  ZIP_COVERAGE_CACHE_TTL_TDSP: 'TDSP info cache TTL in seconds (default: 2592000)',
  ZIP_COVERAGE_CACHE_TTL_LOG: 'Validation log cache TTL in seconds (default: 3600)',

  // External APIs
  ERCOT_API_ENDPOINT: 'ERCOT MIS API endpoint',
  ERCOT_API_KEY: 'ERCOT API key (if required)',
  ERCOT_RATE_LIMIT_HOUR: 'ERCOT hourly rate limit (default: 100)',
  ERCOT_RATE_LIMIT_DAY: 'ERCOT daily rate limit (default: 1000)',

  PUCT_API_ENDPOINT: 'PUCT REP directory API endpoint',
  PUCT_API_KEY: 'PUCT API key (if required)',
  PUCT_RATE_LIMIT_HOUR: 'PUCT hourly rate limit (default: 50)',
  PUCT_RATE_LIMIT_DAY: 'PUCT daily rate limit (default: 500)',

  USPS_API_ENDPOINT: 'USPS address validation API endpoint',
  USPS_API_KEY: 'USPS API key (REQUIRED)',
  USPS_RATE_LIMIT_HOUR: 'USPS hourly rate limit (default: 5000)',
  USPS_RATE_LIMIT_DAY: 'USPS daily rate limit (default: 50000)',

  // TDSP APIs
  ONCOR_API_ENDPOINT: 'Oncor territory API endpoint',
  ONCOR_API_KEY: 'Oncor API key',
  CENTERPOINT_API_ENDPOINT: 'CenterPoint territory API endpoint',
  CENTERPOINT_API_KEY: 'CenterPoint API key',
  AEP_NORTH_API_ENDPOINT: 'AEP Texas North territory API endpoint',
  AEP_NORTH_API_KEY: 'AEP North API key',
  AEP_CENTRAL_API_ENDPOINT: 'AEP Texas Central territory API endpoint',
  AEP_CENTRAL_API_KEY: 'AEP Central API key',
  TNMP_API_ENDPOINT: 'TNMP territory API endpoint',
  TNMP_API_KEY: 'TNMP API key',

  // Sync Configuration
  ZIP_COVERAGE_SYNC_FREQUENCY: 'Sync frequency: daily, weekly, monthly (default: daily)',
  ZIP_COVERAGE_SYNC_TIME: 'Sync time in HH:MM format (default: 02:00)',
  ZIP_COVERAGE_SYNC_BATCH_SIZE: 'Sync batch size (default: 100)',
  ZIP_COVERAGE_SYNC_MAX_RETRIES: 'Max sync retries (default: 3)',
  ZIP_COVERAGE_SYNC_BACKOFF: 'Backoff multiplier (default: 2.0)',
  ZIP_COVERAGE_ENABLED_SOURCES: 'Comma-separated list of enabled sources',

  // Performance
  ZIP_COVERAGE_MAX_CONCURRENT: 'Maximum concurrent requests (default: 10)',
  ZIP_COVERAGE_RESPONSE_TIME_TARGET: 'Response time target in ms (default: 200)',
  ZIP_COVERAGE_ACCURACY_TARGET: 'Accuracy target percentage (default: 99)',
  ZIP_COVERAGE_CACHE_HIT_TARGET: 'Cache hit rate target percentage (default: 85)',

  // Development
  ZIP_COVERAGE_ENABLE_MOCK_DATA: 'Enable mock data for testing (default: false)',
  ZIP_COVERAGE_LOG_LEVEL: 'Log level: error, warn, info, debug (default: info)',
  ZIP_COVERAGE_DETAILED_LOGGING: 'Enable detailed logging (default: false)',
  ZIP_COVERAGE_TEST_DATA_SOURCE: 'Use test data sources (default: false)'
} as const;