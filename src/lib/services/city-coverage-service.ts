/**
 * City Coverage Service
 * Core business logic for Texas city ZIP code coverage management
 * Integrates database infrastructure with comprehensive city-to-ZIP mapping
 */

import { db } from '../database/init';
import { cityTerritories, zipCodeMappings, tdspInfo } from '../database/schema';
import { eq, and, or, sql, inArray, desc, count, avg } from 'drizzle-orm';
import { analyticsService } from './analytics-service';

export interface CityCoverageData {
  citySlug: string;
  displayName: string;
  stateSlug: string;
  county: string;
  zipCodes: string[];
  primaryTdsp: {
    duns: string;
    name: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  coverage: {
    totalZips: number;
    mappedZips: number;
    coveragePercentage: number;
    avgConfidence: number;
  };
  lastUpdated: string;
}

export interface CityZIPMappingResult {
  citySlug: string;
  zipCode: string;
  confidence: number;
  tdspDuns: string;
  tdspName: string;
  isValid: boolean;
  lastValidated: string;
  source: string;
}

export interface CityCoverageOptions {
  includeCoordinates?: boolean;
  minConfidence?: number;
  includeTdspDetails?: boolean;
  forceRefresh?: boolean;
}

export interface CityCoverageMetrics {
  totalCities: number;
  fullyCoveredCities: number;
  partiallyCoveredCities: number;
  uncoveredCities: number;
  averageCoveragePercentage: number;
  topCitiesByZipCount: Array<{
    citySlug: string;
    displayName: string;
    zipCount: number;
    coverage: number;
  }>;
  coverageByTdsp: Array<{
    tdsp: string;
    cityCount: number;
    avgCoverage: number;
  }>;
}

export class CityCoverageService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 1800000; // 30 minutes
  
  /**
   * Get comprehensive coverage data for a city
   */
  async getCityCoverage(citySlug: string, options: CityCoverageOptions = {}): Promise<CityCoverageData | null> {
    const cacheKey = `city:${citySlug}:${JSON.stringify(options)}`;

    // Check cache unless force refresh
    if (!options.forceRefresh) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) return cached.data;
    }

    try {
      // Get city basic information
      const cityData = await db
        .select()
        .from(cityTerritories)
        .where(eq(cityTerritories.citySlug, citySlug))
        .limit(1);

      if (!cityData.length) {
        return null;
      }

      const city = cityData[0];

      // Get ZIP code mappings for this city
      const zipMappings = await db
        .select({
          zipCode: zipCodeMappings.zipCode,
          confidence: zipCodeMappings.confidence,
          tdspDuns: zipCodeMappings.tdspDuns,
          lastValidated: zipCodeMappings.lastValidated
        })
        .from(zipCodeMappings)
        .where(and(
          eq(zipCodeMappings.citySlug, citySlug),
          options.minConfidence 
            ? sql`${zipCodeMappings.confidence} >= ${options.minConfidence}`
            : sql`${zipCodeMappings.confidence} >= 50`
        ))
        .orderBy(desc(zipCodeMappings.confidence));

      // Get primary TDSP (most common)
      const tdspCounts = new Map<string, number>();
      zipMappings.forEach(mapping => {
        tdspCounts.set(mapping.tdspDuns, (tdspCounts.get(mapping.tdspDuns) || 0) + 1);
      });

      const primaryTdspDuns = Array.from(tdspCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0];

      let primaryTdsp = { duns: 'unknown', name: 'Unknown TDSP' };
      if (primaryTdspDuns) {
        const tdsp = await db
          .select({ duns: tdspInfo.duns, name: tdspInfo.name })
          .from(tdspInfo)
          .where(eq(tdspInfo.duns, primaryTdspDuns))
          .limit(1);
        
        if (tdsp.length > 0) {
          primaryTdsp = tdsp[0];
        }
      }

      // Calculate coverage metrics
      const totalZips = zipMappings.length;
      const avgConfidence = totalZips > 0 
        ? zipMappings.reduce((sum, m) => sum + m.confidence, 0) / totalZips
        : 0;

      // Get total possible ZIP codes for this city (from city territories)
      const cityZipCodes = Array.isArray(city.zipCodes) ? city.zipCodes : [];
      const expectedZipCount = cityZipCodes.length || totalZips;
      const coveragePercentage = expectedZipCount > 0 ? (totalZips / expectedZipCount) * 100 : 0;

      const result: CityCoverageData = {
        citySlug: city.citySlug,
        displayName: city.displayName,
        stateSlug: city.stateSlug,
        county: city.county,
        zipCodes: zipMappings.map(m => m.zipCode),
        primaryTdsp,
        coordinates: (options.includeCoordinates && city.latitude && city.longitude) ? {
          latitude: city.latitude,
          longitude: city.longitude
        } : undefined,
        coverage: {
          totalZips: expectedZipCount,
          mappedZips: totalZips,
          coveragePercentage: Math.round(coveragePercentage * 100) / 100,
          avgConfidence: Math.round(avgConfidence)
        },
        lastUpdated: city.lastUpdated?.toISOString() || new Date().toISOString()
      };

      // Cache the result
      this.setCachedResult(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: this.DEFAULT_TTL
      });

      return result;

    } catch (error) {
      console.error('[CityCoverageService] Error getting city coverage:', error);
      return null;
    }
  }

  /**
   * Get all ZIP mappings for a city with detailed information
   */
  async getCityZIPMappings(citySlug: string, options: CityCoverageOptions = {}): Promise<CityZIPMappingResult[]> {
    try {
      const query = db
        .select({
          citySlug: zipCodeMappings.citySlug,
          zipCode: zipCodeMappings.zipCode,
          confidence: zipCodeMappings.confidence,
          tdspDuns: zipCodeMappings.tdspDuns,
          lastValidated: zipCodeMappings.lastValidated,
          tdspName: tdspInfo.name
        })
        .from(zipCodeMappings)
        .leftJoin(tdspInfo, eq(zipCodeMappings.tdspDuns, tdspInfo.duns))
        .where(and(
          eq(zipCodeMappings.citySlug, citySlug),
          options.minConfidence 
            ? sql`${zipCodeMappings.confidence} >= ${options.minConfidence}`
            : sql`${zipCodeMappings.confidence} >= 30`
        ))
        .orderBy(desc(zipCodeMappings.confidence), zipCodeMappings.zipCode);

      const results = await query;

      return results.map(row => ({
        citySlug: row.citySlug,
        zipCode: row.zipCode,
        confidence: row.confidence,
        tdspDuns: row.tdspDuns,
        tdspName: row.tdspName || 'Unknown TDSP',
        isValid: row.confidence >= 70,
        lastValidated: row.lastValidated?.toISOString() || new Date().toISOString(),
        source: 'database'
      }));

    } catch (error) {
      console.error('[CityCoverageService] Error getting ZIP mappings:', error);
      return [];
    }
  }

  /**
   * Update city ZIP coverage from external data sources
   */
  async updateCityCoverage(citySlug: string, newMappings: Array<{
    zipCode: string;
    confidence: number;
    tdspDuns: string;
    source: string;
  }>): Promise<{
    success: boolean;
    added: number;
    updated: number;
    errors: Array<{ zipCode: string; error: string }>;
  }> {
    const result = {
      success: false,
      added: 0,
      updated: 0,
      errors: [] as Array<{ zipCode: string; error: string }>
    };

    try {
      for (const mapping of newMappings) {
        try {
          // Check if mapping already exists
          const existing = await db
            .select()
            .from(zipCodeMappings)
            .where(and(
              eq(zipCodeMappings.zipCode, mapping.zipCode),
              eq(zipCodeMappings.citySlug, citySlug)
            ))
            .limit(1);

          if (existing.length > 0) {
            // Update existing mapping if confidence is higher
            const current = existing[0];
            if (mapping.confidence > current.confidence) {
              await db
                .update(zipCodeMappings)
                .set({
                  confidence: mapping.confidence,
                  tdspDuns: mapping.tdspDuns,
                  lastValidated: new Date()
                })
                .where(and(
                  eq(zipCodeMappings.zipCode, mapping.zipCode),
                  eq(zipCodeMappings.citySlug, citySlug)
                ));
              
              result.updated++;
            }
          } else {
            // Insert new mapping
            await db.insert(zipCodeMappings).values({
              zipCode: mapping.zipCode,
              citySlug: citySlug,
              tdspDuns: mapping.tdspDuns,
              confidence: mapping.confidence,
              lastValidated: new Date()
            });
            
            result.added++;
          }

          // Track the update in analytics
          await analyticsService.trackZIPValidation({
            zipCode: mapping.zipCode,
            success: true,
            cityName: citySlug.replace('-tx', ''),
            tdspTerritory: mapping.tdspDuns,
            validationTime: 0,
            source: mapping.source,
            confidence: mapping.confidence
          });

        } catch (mappingError) {
          console.error(`[CityCoverageService] Error updating ${mapping.zipCode}:`, mappingError);
          result.errors.push({
            zipCode: mapping.zipCode,
            error: mappingError instanceof Error ? mappingError.message : 'Unknown error'
          });
        }
      }

      // Update city last updated timestamp
      await db
        .update(cityTerritories)
        .set({ lastUpdated: new Date() })
        .where(eq(cityTerritories.citySlug, citySlug));

      // Clear cache for this city
      this.clearCacheForCity(citySlug);

      result.success = result.errors.length < newMappings.length;
      return result;

    } catch (error) {
      console.error('[CityCoverageService] Error updating city coverage:', error);
      result.errors.push({
        zipCode: 'all',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return result;
    }
  }

  /**
   * Get comprehensive coverage metrics for all cities
   */
  async getSystemCoverageMetrics(): Promise<CityCoverageMetrics> {
    try {
      // Get all cities with their ZIP counts and coverage
      const cityStats = await db
        .select({
          citySlug: cityTerritories.citySlug,
          displayName: cityTerritories.displayName,
          zipCount: sql<number>`
            (SELECT COUNT(*) 
             FROM ${zipCodeMappings} 
             WHERE ${zipCodeMappings.citySlug} = ${cityTerritories.citySlug}
               AND ${zipCodeMappings.confidence} >= 50)
          `,
          avgConfidence: sql<number>`
            (SELECT AVG(${zipCodeMappings.confidence})
             FROM ${zipCodeMappings} 
             WHERE ${zipCodeMappings.citySlug} = ${cityTerritories.citySlug}
               AND ${zipCodeMappings.confidence} >= 50)
          `,
          expectedZips: sql<number>`
            CASE 
              WHEN jsonb_array_length(${cityTerritories.zipCodes}) > 0 
              THEN jsonb_array_length(${cityTerritories.zipCodes})
              ELSE (SELECT COUNT(*) 
                    FROM ${zipCodeMappings} 
                    WHERE ${zipCodeMappings.citySlug} = ${cityTerritories.citySlug})
            END
          `
        })
        .from(cityTerritories);

      const totalCities = cityStats.length;
      let fullyCovered = 0;
      let partiallyCovered = 0;
      let uncovered = 0;
      let totalCoverage = 0;

      const citiesByZipCount = cityStats
        .map(city => {
          const zipCount = Number(city.zipCount) || 0;
          const expectedZips = Number(city.expectedZips) || 1;
          const coverage = (zipCount / expectedZips) * 100;
          
          totalCoverage += coverage;

          if (coverage >= 95) fullyCovered++;
          else if (coverage > 0) partiallyCovered++;
          else uncovered++;

          return {
            citySlug: city.citySlug,
            displayName: city.displayName,
            zipCount,
            coverage: Math.round(coverage * 100) / 100
          };
        })
        .sort((a, b) => b.zipCount - a.zipCount);

      // Get coverage by TDSP
      const tdspCoverage = await db
        .select({
          tdspDuns: zipCodeMappings.tdspDuns,
          tdspName: tdspInfo.name,
          cityCount: sql<number>`COUNT(DISTINCT ${zipCodeMappings.citySlug})`,
          avgConfidence: avg(zipCodeMappings.confidence)
        })
        .from(zipCodeMappings)
        .leftJoin(tdspInfo, eq(zipCodeMappings.tdspDuns, tdspInfo.duns))
        .groupBy(zipCodeMappings.tdspDuns, tdspInfo.name)
        .orderBy(desc(sql<number>`COUNT(DISTINCT ${zipCodeMappings.citySlug})`));

      return {
        totalCities,
        fullyCoveredCities: fullyCovered,
        partiallyCoveredCities: partiallyCovered,
        uncoveredCities: uncovered,
        averageCoveragePercentage: totalCities > 0 ? totalCoverage / totalCities : 0,
        topCitiesByZipCount: citiesByZipCount.slice(0, 25),
        coverageByTdsp: tdspCoverage.map(row => ({
          tdsp: row.tdspName || `TDSP-${row.tdspDuns.slice(-4)}`,
          cityCount: Number(row.cityCount),
          avgCoverage: Math.round(Number(row.avgConfidence) || 0)
        }))
      };

    } catch (error) {
      console.error('[CityCoverageService] Error getting system metrics:', error);
      return {
        totalCities: 0,
        fullyCoveredCities: 0,
        partiallyCoveredCities: 0,
        uncoveredCities: 0,
        averageCoveragePercentage: 0,
        topCitiesByZipCount: [],
        coverageByTdsp: []
      };
    }
  }

  /**
   * Find cities with incomplete coverage that need attention
   */
  async getCitiesNeedingAttention(limit = 50): Promise<Array<{
    citySlug: string;
    displayName: string;
    coverage: number;
    missingZips: number;
    avgConfidence: number;
    priority: 'high' | 'medium' | 'low';
    issues: string[];
  }>> {
    try {
      const results = await db
        .select({
          citySlug: cityTerritories.citySlug,
          displayName: cityTerritories.displayName,
          county: cityTerritories.county,
          zipCount: sql<number>`
            (SELECT COUNT(*) 
             FROM ${zipCodeMappings} 
             WHERE ${zipCodeMappings.citySlug} = ${cityTerritories.citySlug})
          `,
          lowConfidenceCount: sql<number>`
            (SELECT COUNT(*) 
             FROM ${zipCodeMappings} 
             WHERE ${zipCodeMappings.citySlug} = ${cityTerritories.citySlug}
               AND ${zipCodeMappings.confidence} < 70)
          `,
          avgConfidence: sql<number>`
            (SELECT COALESCE(AVG(${zipCodeMappings.confidence}), 0)
             FROM ${zipCodeMappings} 
             WHERE ${zipCodeMappings.citySlug} = ${cityTerritories.citySlug})
          `,
          expectedZips: sql<number>`
            CASE 
              WHEN jsonb_array_length(${cityTerritories.zipCodes}) > 0 
              THEN jsonb_array_length(${cityTerritories.zipCodes})
              ELSE (SELECT COUNT(*) 
                    FROM ${zipCodeMappings} 
                    WHERE ${zipCodeMappings.citySlug} = ${cityTerritories.citySlug})
            END
          `
        })
        .from(cityTerritories)
        .limit(limit * 2); // Get more to filter

      const citiesNeedingAttention = results
        .map(row => {
          const zipCount = Number(row.zipCount) || 0;
          const expectedZips = Number(row.expectedZips) || 1;
          const coverage = (zipCount / expectedZips) * 100;
          const missingZips = expectedZips - zipCount;
          const avgConfidence = Number(row.avgConfidence) || 0;
          const lowConfidenceCount = Number(row.lowConfidenceCount) || 0;

          const issues: string[] = [];
          let priority: 'high' | 'medium' | 'low' = 'low';

          if (coverage < 50) {
            issues.push('Low coverage');
            priority = 'high';
          } else if (coverage < 80) {
            issues.push('Incomplete coverage');
            if (priority === 'low') priority = 'medium';
          }

          if (avgConfidence < 60) {
            issues.push('Low confidence scores');
            priority = 'high';
          } else if (avgConfidence < 80) {
            issues.push('Moderate confidence');
            if (priority === 'low') priority = 'medium';
          }

          if (lowConfidenceCount > 0) {
            issues.push(`${lowConfidenceCount} low-confidence mappings`);
            if (priority === 'low') priority = 'medium';
          }

          if (zipCount === 0) {
            issues.push('No ZIP mappings');
            priority = 'high';
          }

          return {
            citySlug: row.citySlug,
            displayName: row.displayName,
            coverage: Math.round(coverage * 100) / 100,
            missingZips: Math.max(0, missingZips),
            avgConfidence: Math.round(avgConfidence),
            priority,
            issues
          };
        })
        .filter(city => city.issues.length > 0)
        .sort((a, b) => {
          // Sort by priority first, then by coverage
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return a.coverage - b.coverage;
        })
        .slice(0, limit);

      return citiesNeedingAttention;

    } catch (error) {
      console.error('[CityCoverageService] Error finding cities needing attention:', error);
      return [];
    }
  }

  /**
   * Validate and refresh coverage data for a city
   */
  async refreshCityCoverage(citySlug: string): Promise<{
    success: boolean;
    updated: number;
    removed: number;
    issues: string[];
  }> {
    const result = {
      success: false,
      updated: 0,
      removed: 0,
      issues: [] as string[]
    };

    try {
      // Get current mappings
      const currentMappings = await db
        .select()
        .from(zipCodeMappings)
        .where(eq(zipCodeMappings.citySlug, citySlug));

      // Validate each mapping (in production, would use external APIs)
      for (const mapping of currentMappings) {
        try {
          // Simple validation - check if ZIP is in expected Texas range
          const zipNum = parseInt(mapping.zipCode, 10);
          const isValidTexasZip = zipNum >= 73000 && zipNum <= 79999;

          if (!isValidTexasZip) {
            // Remove invalid ZIP
            await db
              .delete(zipCodeMappings)
              .where(and(
                eq(zipCodeMappings.zipCode, mapping.zipCode),
                eq(zipCodeMappings.citySlug, citySlug)
              ));
            
            result.removed++;
            result.issues.push(`Removed invalid ZIP: ${mapping.zipCode}`);
          } else {
            // Update last validated timestamp
            await db
              .update(zipCodeMappings)
              .set({ lastValidated: new Date() })
              .where(and(
                eq(zipCodeMappings.zipCode, mapping.zipCode),
                eq(zipCodeMappings.citySlug, citySlug)
              ));
            
            result.updated++;
          }

        } catch (mappingError) {
          result.issues.push(`Error validating ${mapping.zipCode}: ${mappingError}`);
        }
      }

      // Update city timestamp
      await db
        .update(cityTerritories)
        .set({ lastUpdated: new Date() })
        .where(eq(cityTerritories.citySlug, citySlug));

      // Clear cache
      this.clearCacheForCity(citySlug);

      result.success = true;
      return result;

    } catch (error) {
      console.error('[CityCoverageService] Error refreshing city coverage:', error);
      result.issues.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  // Cache management
  private getCachedResult(key: string): { data: any; timestamp: number; ttl: number } | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached;
  }

  private setCachedResult(key: string, result: { data: any; timestamp: number; ttl: number }): void {
    this.cache.set(key, result);
    
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  private clearCacheForCity(citySlug: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(citySlug)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    oldestEntry: string;
  } {
    let oldestTimestamp = Date.now();
    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    }

    return {
      size: this.cache.size,
      hitRate: 0.75, // Would calculate from actual hits/misses in production
      oldestEntry: new Date(oldestTimestamp).toISOString()
    };
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const cityCoverageService = new CityCoverageService();