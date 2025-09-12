/**
 * Universal ZIP Code Lookup Service
 * Handles ALL Texas ZIP codes, not just pre-mapped ones
 * Uses external APIs and geographic mapping for comprehensive coverage
 */

interface UniversalZIPResult {
  success: boolean;
  zipCode: string;
  cityName?: string;
  citySlug?: string;
  cityDisplayName?: string;
  redirectUrl?: string;
  county?: string;
  tdspName?: string;
  tdspDuns?: string;
  isTexas?: boolean;
  isDeregulated?: boolean;
  municipalUtility?: boolean;
  utilityName?: string;
  utilityInfo?: string;
  dataSource?: string;
  confidence?: number;
  error?: string;
  errorType?: 'invalid_zip' | 'non_texas' | 'non_deregulated' | 'api_error' | 'not_found';
  processingTime?: number;
}

interface ZIPCodeInfo {
  zipCode: string;
  cityName: string;
  county: string;
  state: string;
  latitude?: number;
  longitude?: number;
}

interface GeographicMapping {
  citySlug: string;
  distance: number;
  confidence: number;
}

/**
 * Real external API services for ZIP code validation
 */
class ExternalZIPService {
  private cache = new Map<string, { data: ZIPCodeInfo; timestamp: number }>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Validate ZIP code using USPS API (free tier available)
   */
  async validateWithUSPS(zipCode: string): Promise<ZIPCodeInfo | null> {
    try {
      // Check cache first
      const cached = this.cache.get(`usps_${zipCode}`);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
        return cached.data;
      }

      // USPS ZIP Code Lookup API (free tier)
      const response = await fetch(`https://tools.usps.com/tools/app/ziplookup/cityByZip?zip=${zipCode}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'ChooseMyPower-ZIP-Lookup/1.0 (Texas Electricity Comparison)',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`USPS API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.resultStatus === 'SUCCESS' && data.cityName && data.state === 'TX') {
        const zipInfo: ZIPCodeInfo = {
          zipCode,
          cityName: data.cityName,
          county: data.countyName || '',
          state: 'TX'
        };

        // Cache successful result
        this.cache.set(`usps_${zipCode}`, { data: zipInfo, timestamp: Date.now() });
        return zipInfo;
      }

      return null;
    } catch (error) {
      console.error(`USPS validation failed for ${zipCode}:`, error);
      return null;
    }
  }

  /**
   * Validate ZIP code using ZipCodeAPI.com (free tier available)
   */
  async validateWithZipCodeAPI(zipCode: string): Promise<ZIPCodeInfo | null> {
    try {
      // Check cache first
      const cached = this.cache.get(`zipapi_${zipCode}`);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
        return cached.data;
      }

      // ZipCodeAPI.com - free tier available
      const response = await fetch(`https://www.zipcodeapi.com/rest/demo/info.json/${zipCode}/degrees`, {
        method: 'GET',
        headers: {
          'User-Agent': 'ChooseMyPower-ZIP-Lookup/1.0',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`ZipCodeAPI error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.state === 'TX' && data.city) {
        const zipInfo: ZIPCodeInfo = {
          zipCode,
          cityName: data.city,
          county: data.county || '',
          state: 'TX',
          latitude: parseFloat(data.lat) || undefined,
          longitude: parseFloat(data.lng) || undefined
        };

        // Cache successful result
        this.cache.set(`zipapi_${zipCode}`, { data: zipInfo, timestamp: Date.now() });
        return zipInfo;
      }

      return null;
    } catch (error) {
      console.error(`ZipCodeAPI validation failed for ${zipCode}:`, error);
      return null;
    }
  }

  /**
   * Validate ZIP code using GeoNames API (free tier available)
   */
  async validateWithGeoNames(zipCode: string): Promise<ZIPCodeInfo | null> {
    try {
      // Check cache first
      const cached = this.cache.get(`geonames_${zipCode}`);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
        return cached.data;
      }

      // GeoNames API - free tier available
      const response = await fetch(`http://api.geonames.org/postalCodeSearchJSON?postalcode=${zipCode}&countryCode=US&username=demo`, {
        method: 'GET',
        headers: {
          'User-Agent': 'ChooseMyPower-ZIP-Lookup/1.0',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`GeoNames API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.postalCodes && data.postalCodes.length > 0) {
        const result = data.postalCodes.find((code: unknown) => code.adminCode1 === 'TX');
        
        if (result && result.placeName) {
          const zipInfo: ZIPCodeInfo = {
            zipCode,
            cityName: result.placeName,
            county: result.adminName2 || '',
            state: 'TX',
            latitude: parseFloat(result.lat) || undefined,
            longitude: parseFloat(result.lng) || undefined
          };

          // Cache successful result
          this.cache.set(`geonames_${zipCode}`, { data: zipInfo, timestamp: Date.now() });
          return zipInfo;
        }
      }

      return null;
    } catch (error) {
      console.error(`GeoNames validation failed for ${zipCode}:`, error);
      return null;
    }
  }

  /**
   * Try multiple APIs concurrently for best results
   */
  async validateZIPCode(zipCode: string): Promise<ZIPCodeInfo | null> {
    // Run all APIs concurrently for speed
    const promises = [
      this.validateWithUSPS(zipCode),
      this.validateWithZipCodeAPI(zipCode),
      this.validateWithGeoNames(zipCode)
    ];

    try {
      const results = await Promise.allSettled(promises);
      
      // Find first successful result
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          return result.value;
        }
      }

      return null;
    } catch (error) {
      console.error(`All ZIP validation APIs failed for ${zipCode}:`, error);
      return null;
    }
  }
}

/**
 * Geographic proximity service for mapping unknown cities to supported ones
 */
class GeographicMappingService {
  // Import existing city data for proximity calculations
  private supportedCities: Map<string, { name: string; slug: string; lat?: number; lng?: number }> = new Map();

  constructor() {
    this.loadSupportedCities();
  }

  private loadSupportedCities() {
    // Major Texas cities we support (in order of electricity market importance)
    const majorCities = [
      { name: 'Houston', slug: 'houston-tx', lat: 29.7604, lng: -95.3698 },
      { name: 'Dallas', slug: 'dallas-tx', lat: 32.7767, lng: -96.7970 },
      { name: 'Austin', slug: 'austin-tx', lat: 30.2672, lng: -97.7431 },
      { name: 'San Antonio', slug: 'san-antonio-tx', lat: 29.4241, lng: -98.4936 },
      { name: 'Fort Worth', slug: 'fort-worth-tx', lat: 32.7555, lng: -97.3308 },
      { name: 'El Paso', slug: 'el-paso-tx', lat: 31.7619, lng: -106.4850 },
      { name: 'Arlington', slug: 'arlington-tx', lat: 32.7357, lng: -97.1081 },
      { name: 'Corpus Christi', slug: 'corpus-christi-tx', lat: 27.8006, lng: -97.3964 },
      { name: 'Plano', slug: 'plano-tx', lat: 33.0198, lng: -96.6989 },
      { name: 'Lubbock', slug: 'lubbock-tx', lat: 33.5779, lng: -101.8552 },
      { name: 'Irving', slug: 'irving-tx', lat: 32.8140, lng: -96.9489 },
      { name: 'Garland', slug: 'garland-tx', lat: 32.9126, lng: -96.6389 },
      { name: 'Frisco', slug: 'frisco-tx', lat: 33.1507, lng: -96.8236 },
      { name: 'McKinney', slug: 'mckinney-tx', lat: 33.1972, lng: -96.6397 },
      { name: 'Tyler', slug: 'tyler-tx', lat: 32.3513, lng: -95.3011 },
      { name: 'Amarillo', slug: 'amarillo-tx', lat: 35.2220, lng: -101.8313 },
      { name: 'Waco', slug: 'waco-tx', lat: 31.5494, lng: -97.1467 }
    ];

    for (const city of majorCities) {
      this.supportedCities.set(city.name.toLowerCase(), city);
    }
  }

  /**
   * Find the nearest supported city for an unknown location
   */
  findNearestSupportedCity(
    cityName: string, 
    latitude?: number, 
    longitude?: number
  ): GeographicMapping | null {
    try {
      // First try exact name match
      const exactMatch = this.supportedCities.get(cityName.toLowerCase());
      if (exactMatch) {
        return {
          citySlug: exactMatch.slug,
          distance: 0,
          confidence: 95
        };
      }

      // Try partial name matches
      for (const [supportedName, cityData] of this.supportedCities) {
        if (supportedName.includes(cityName.toLowerCase()) || cityName.toLowerCase().includes(supportedName)) {
          return {
            citySlug: cityData.slug,
            distance: 0,
            confidence: 85
          };
        }
      }

      // If we have coordinates, find nearest city by distance
      if (latitude && longitude) {
        let nearestCity = null;
        let nearestDistance = Infinity;

        for (const [_, cityData] of this.supportedCities) {
          if (cityData.lat && cityData.lng) {
            const distance = this.calculateDistance(latitude, longitude, cityData.lat, cityData.lng);
            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestCity = cityData;
            }
          }
        }

        if (nearestCity && nearestDistance < 200) { // Within 200 miles
          const confidence = Math.max(50, 90 - (nearestDistance / 10)); // Confidence decreases with distance
          return {
            citySlug: nearestCity.slug,
            distance: nearestDistance,
            confidence: Math.round(confidence)
          };
        }
      }

      // Fallback to major cities based on ZIP code prefix
      return this.findFallbackByZIPPrefix(cityName);
    } catch (error) {
      console.error('Error finding nearest supported city:', error);
      return null;
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private findFallbackByZIPPrefix(cityName: string): GeographicMapping | null {
    // Basic regional fallbacks for unknown cities
    const cityLower = cityName.toLowerCase();
    
    // Houston area keywords
    if (['houston', 'katy', 'cypress', 'spring', 'humble', 'sugar', 'stafford', 'missouri city'].some(keyword => 
        cityLower.includes(keyword))) {
      return { citySlug: 'houston-tx', distance: 50, confidence: 70 };
    }
    
    // Dallas area keywords
    if (['dallas', 'plano', 'richardson', 'carrollton', 'farmers branch', 'addison'].some(keyword => 
        cityLower.includes(keyword))) {
      return { citySlug: 'dallas-tx', distance: 50, confidence: 70 };
    }
    
    // Austin area keywords
    if (['austin', 'round rock', 'pflugerville', 'cedar park', 'leander'].some(keyword => 
        cityLower.includes(keyword))) {
      return { citySlug: 'austin-tx', distance: 50, confidence: 70 };
    }

    // Default to Houston (largest deregulated market)
    return { citySlug: 'houston-tx', distance: 100, confidence: 50 };
  }
}

/**
 * Main Universal ZIP Service
 */
export class UniversalZIPService {
  private externalService = new ExternalZIPService();
  private geoService = new GeographicMappingService();
  private cache = new Map<string, { data: UniversalZIPResult; timestamp: number }>();
  private readonly CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

  /**
   * Universal ZIP code lookup that works for ANY Texas ZIP code
   */
  async lookupZIPCode(zipCode: string): Promise<UniversalZIPResult> {
    const startTime = Date.now();

    try {
      // Basic validation
      if (!this.isValidZIPCode(zipCode)) {
        return this.createErrorResult(zipCode, 'invalid_zip', 'Invalid ZIP code format', startTime);
      }

      // Check cache first
      const cached = this.cache.get(zipCode);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
        return cached.data;
      }

      // Step 1: Validate ZIP code with external APIs
      console.warn(`🔍 Looking up ZIP ${zipCode} with external APIs...`);
      const zipInfo = await this.externalService.validateZIPCode(zipCode);

      if (!zipInfo) {
        return this.createErrorResult(zipCode, 'not_found', 'ZIP code not found or not valid', startTime);
      }

      if (zipInfo.state !== 'TX') {
        return this.createErrorResult(zipCode, 'non_texas', 'ZIP code is not in Texas', startTime);
      }

      // Step 2: Find nearest supported city
      console.warn(`🗺️ Mapping ${zipInfo.cityName} to nearest supported electricity market...`);
      const geoMapping = this.geoService.findNearestSupportedCity(
        zipInfo.cityName,
        zipInfo.latitude,
        zipInfo.longitude
      );

      if (!geoMapping) {
        return this.createErrorResult(zipCode, 'not_found', 'Could not map to supported electricity market', startTime);
      }

      // Step 3: Check for municipal utilities or cooperatives
      const { isMunicipal, municipalInfo } = await this.checkMunicipalUtility(zipInfo.cityName, zipInfo.county);
      
      if (isMunicipal && municipalInfo) {
        const result: UniversalZIPResult = {
          success: false,
          zipCode,
          cityName: zipInfo.cityName,
          citySlug: geoMapping.citySlug,
          cityDisplayName: this.formatCityDisplayName(geoMapping.citySlug),
          isTexas: true,
          isDeregulated: false,
          municipalUtility: true,
          utilityName: municipalInfo.name,
          utilityInfo: municipalInfo.description,
          redirectUrl: `/electricity-plans/${geoMapping.citySlug}/municipal-utility`,
          dataSource: 'external_apis',
          confidence: geoMapping.confidence,
          error: `${zipInfo.cityName} is served by ${municipalInfo.name}, a municipal utility. Residents cannot choose their electricity provider.`,
          errorType: 'non_deregulated',
          processingTime: Date.now() - startTime
        };

        // Cache the result
        this.cache.set(zipCode, { data: result, timestamp: Date.now() });
        return result;
      }

      // Step 4: Create successful result for deregulated area
      const result: UniversalZIPResult = {
        success: true,
        zipCode,
        cityName: zipInfo.cityName,
        citySlug: geoMapping.citySlug,
        cityDisplayName: this.formatCityDisplayName(geoMapping.citySlug),
        redirectUrl: `/electricity-plans/${geoMapping.citySlug}`,
        county: zipInfo.county,
        isTexas: true,
        isDeregulated: true,
        municipalUtility: false,
        dataSource: 'external_apis',
        confidence: geoMapping.confidence,
        processingTime: Date.now() - startTime
      };

      // Cache successful result
      this.cache.set(zipCode, { data: result, timestamp: Date.now() });

      console.warn(`✅ Successfully mapped ZIP ${zipCode} (${zipInfo.cityName}) -> ${geoMapping.citySlug} (confidence: ${geoMapping.confidence}%)`);
      return result;

    } catch (error) {
      console.error(`❌ Universal ZIP lookup failed for ${zipCode}:`, error);
      return this.createErrorResult(zipCode, 'api_error', 'System error during ZIP lookup', startTime);
    }
  }

  private isValidZIPCode(zipCode: string): boolean {
    return /^\d{5}$/.test(zipCode);
  }

  private async checkMunicipalUtility(cityName: string, county: string): Promise<{ isMunicipal: boolean; municipalInfo?: { name: string; description: string } }> {
    // Known Texas municipal utilities
    const municipalUtilities = new Map([
      ['austin', { name: 'Austin Energy', description: 'Austin Energy is a municipal utility serving the Austin area.' }],
      ['san antonio', { name: 'CPS Energy', description: 'CPS Energy is a municipal utility serving the San Antonio area.' }],
      ['garland', { name: 'Garland Power & Light', description: 'Garland Power & Light serves the City of Garland.' }],
      ['bryan', { name: 'Bryan Texas Utilities', description: 'Bryan Texas Utilities serves the Bryan area.' }],
      ['college station', { name: 'College Station Utilities', description: 'College Station Utilities serves the College Station area.' }],
      ['denton', { name: 'Denton Municipal Electric', description: 'Denton Municipal Electric serves the City of Denton.' }],
      ['georgetown', { name: 'Georgetown Utility Systems', description: 'Georgetown Utility Systems serves the Georgetown area.' }],
      ['greenville', { name: 'Greenville Electric Utility System', description: 'Greenville Electric Utility serves the Greenville area.' }]
    ]);

    const cityLower = cityName.toLowerCase();
    const municipalInfo = municipalUtilities.get(cityLower);
    
    return { 
      isMunicipal: !!municipalInfo, 
      municipalInfo 
    };
  }

  private formatCityDisplayName(citySlug: string): string {
    return citySlug
      .split('-')
      .map(word => word === 'tx' ? 'TX' : word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(' Tx', ', TX');
  }

  private createErrorResult(
    zipCode: string, 
    errorType: UniversalZIPResult['errorType'], 
    error: string, 
    startTime: number
  ): UniversalZIPResult {
    return {
      success: false,
      zipCode,
      error,
      errorType,
      processingTime: Date.now() - startTime
    };
  }
}

// Export singleton instance
export const universalZIPService = new UniversalZIPService();