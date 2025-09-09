# Service Layer Implementation: Complete Business Logic

**Document**: Complete Service Layer Implementation Guide  
**Version**: 1.0  
**Date**: 2025-09-09  
**Purpose**: Provide complete service layer implementation with real data architecture

## Service Layer Architecture Overview

The service layer provides a clean abstraction between React components and data sources, implementing the constitutional requirement for **100% real data** with **zero mock data** usage.

### **Data Flow Pattern**
1. **Database First**: PostgreSQL with Drizzle ORM as primary data source
2. **JSON Fallback**: Generated data files provide resilience 
3. **Service Abstraction**: Components never directly access data sources
4. **Error Handling**: Graceful degradation with comprehensive logging
5. **Caching**: Redis integration for performance optimization

## Core Service Implementations

### **Provider Service (src/lib/services/provider-service.ts)**
```typescript
import { db } from '../database/connection';
import { providers, electricityPlans, cities } from '../database/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { cache } from '../cache/redis-client';
import { RealProvider, RealCity, RealPlan } from '../../types/service-types';

export class ProviderService {
  private static readonly CACHE_TTL = 3600; // 1 hour
  
  /**
   * Get all electricity providers for a state
   * Constitutional requirement: Real data only, no mock data
   */
  async getProviders(state: string = 'TX'): Promise<RealProvider[]> {
    const cacheKey = `providers:${state}`;
    
    try {
      // Check cache first
      const cached = await cache.get<RealProvider[]>(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Query database with plan counts
      const providersWithStats = await db
        .select({
          id: providers.id,
          name: providers.name,
          displayName: providers.displayName,
          slug: providers.slug,
          logoUrl: providers.logoUrl,
          websiteUrl: providers.websiteUrl,
          description: providers.description,
          rating: providers.rating,
          planCount: count(electricityPlans.id),
          isActive: providers.isActive,
          yearFounded: providers.yearFounded,
          headquarters: providers.headquarters,
          serviceAreas: providers.serviceAreas,
          tdspSupported: providers.tdspSupported,
        })
        .from(providers)
        .leftJoin(electricityPlans, eq(providers.id, electricityPlans.providerId))
        .where(eq(providers.isActive, true))
        .groupBy(providers.id)
        .orderBy(desc(count(electricityPlans.id)));
      
      const realProviders: RealProvider[] = providersWithStats.map(p => ({
        id: p.id,
        name: p.name,
        displayName: p.displayName || p.name,
        slug: p.slug,
        logoUrl: p.logoUrl,
        websiteUrl: p.websiteUrl,
        description: p.description,
        rating: p.rating ? parseFloat(p.rating) : null,
        planCount: p.planCount,
        isActive: p.isActive,
        yearFounded: p.yearFounded,
        headquarters: p.headquarters,
        serviceAreas: p.serviceAreas || [],
        tdspSupported: p.tdspSupported || [],
      }));
      
      // Cache results
      await cache.set(cacheKey, realProviders, ProviderService.CACHE_TTL);
      
      return realProviders;
      
    } catch (error) {
      console.error('[ProviderService] Database error, falling back to JSON:', error);
      return this.getFallbackProviders(state);
    }
  }
  
  /**
   * Get provider by slug with detailed statistics
   */
  async getProviderBySlug(slug: string): Promise<RealProvider | null> {
    const cacheKey = `provider:${slug}`;
    
    try {
      const cached = await cache.get<RealProvider>(cacheKey);
      if (cached) {
        return cached;
      }
      
      const [provider] = await db
        .select({
          id: providers.id,
          name: providers.name,
          displayName: providers.displayName,
          slug: providers.slug,
          logoUrl: providers.logoUrl,
          websiteUrl: providers.websiteUrl,
          description: providers.description,
          rating: providers.rating,
          planCount: count(electricityPlans.id),
          isActive: providers.isActive,
          yearFounded: providers.yearFounded,
          headquarters: providers.headquarters,
          serviceAreas: providers.serviceAreas,
          tdspSupported: providers.tdspSupported,
        })
        .from(providers)
        .leftJoin(electricityPlans, eq(providers.id, electricityPlans.providerId))
        .where(and(
          eq(providers.slug, slug),
          eq(providers.isActive, true)
        ))
        .groupBy(providers.id);
      
      if (!provider) {
        return null;
      }
      
      const realProvider: RealProvider = {
        id: provider.id,
        name: provider.name,
        displayName: provider.displayName || provider.name,
        slug: provider.slug,
        logoUrl: provider.logoUrl,
        websiteUrl: provider.websiteUrl,
        description: provider.description,
        rating: provider.rating ? parseFloat(provider.rating) : null,
        planCount: provider.planCount,
        isActive: provider.isActive,
        yearFounded: provider.yearFounded,
        headquarters: provider.headquarters,
        serviceAreas: provider.serviceAreas || [],
        tdspSupported: provider.tdspSupported || [],
      };
      
      await cache.set(cacheKey, realProvider, ProviderService.CACHE_TTL);
      return realProvider;
      
    } catch (error) {
      console.error('[ProviderService] Provider lookup error:', error);
      return this.getFallbackProviderBySlug(slug);
    }
  }
  
  /**
   * JSON fallback for providers (resilience pattern)
   */
  private async getFallbackProviders(state: string): Promise<RealProvider[]> {
    try {
      // Load from generated JSON files
      const { providers: jsonProviders } = await import(`../../data/generated/providers-${state.toLowerCase()}.json`);
      return jsonProviders.map(p => ({
        ...p,
        planCount: p.planCount || 0,
        rating: typeof p.rating === 'string' ? parseFloat(p.rating) : p.rating,
      }));
    } catch (error) {
      console.error('[ProviderService] Fallback failed:', error);
      return []; // Return empty array, never mock data
    }
  }
  
  private async getFallbackProviderBySlug(slug: string): Promise<RealProvider | null> {
    try {
      const providers = await this.getFallbackProviders('TX');
      return providers.find(p => p.slug === slug) || null;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const providerService = new ProviderService();

// Export convenience functions for components
export const getProviders = (state?: string) => providerService.getProviders(state);
export const getProviderBySlug = (slug: string) => providerService.getProviderBySlug(slug);
```

### **City Service (src/lib/services/city-service.ts)**
```typescript
import { db } from '../database/connection';
import { cities, zipCodeMappings, electricityPlans } from '../database/schema';
import { eq, and, ilike, count, avg } from 'drizzle-orm';
import { cache } from '../cache/redis-client';
import { RealCity } from '../../types/service-types';

export class CityService {
  private static readonly CACHE_TTL = 3600; // 1 hour
  
  /**
   * Get all cities for a state with plan statistics
   */
  async getCities(state: string = 'TX'): Promise<RealCity[]> {
    const cacheKey = `cities:${state}`;
    
    try {
      const cached = await cache.get<RealCity[]>(cacheKey);
      if (cached) {
        return cached;
      }
      
      const citiesWithStats = await db
        .select({
          id: cities.id,
          name: cities.name,
          slug: cities.slug,
          state: cities.state,
          county: cities.county,
          zipCodes: cities.zipCodes,
          primaryZip: cities.primaryZip,
          tdspDuns: cities.tdspDuns,
          population: cities.population,
          medianIncome: cities.medianIncome,
          isDeregulated: cities.isDeregulated,
          planCount: count(electricityPlans.id),
          avgRate: avg(electricityPlans.rate1000Kwh),
        })
        .from(cities)
        .leftJoin(electricityPlans, sql`${cities.slug} = ANY(${electricityPlans.citySlugs})`)
        .where(and(
          eq(cities.state, state),
          eq(cities.isDeregulated, true)
        ))
        .groupBy(cities.id)
        .orderBy(cities.population);
      
      const realCities: RealCity[] = citiesWithStats.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        state: c.state,
        county: c.county,
        zipCodes: c.zipCodes || [],
        primaryZip: c.primaryZip,
        tdspDuns: c.tdspDuns,
        population: c.population,
        medianIncome: c.medianIncome,
        isDeregulated: c.isDeregulated,
        planCount: c.planCount,
        avgRate: c.avgRate ? parseFloat(c.avgRate) : null,
      }));
      
      await cache.set(cacheKey, realCities, CityService.CACHE_TTL);
      return realCities;
      
    } catch (error) {
      console.error('[CityService] Database error, falling back to JSON:', error);
      return this.getFallbackCities(state);
    }
  }
  
  /**
   * Get city by slug with comprehensive data
   */
  async getCityBySlug(slug: string, state: string = 'TX'): Promise<RealCity | null> {
    const cacheKey = `city:${slug}:${state}`;
    
    try {
      const cached = await cache.get<RealCity>(cacheKey);
      if (cached) {
        return cached;
      }
      
      const [city] = await db
        .select({
          id: cities.id,
          name: cities.name,
          slug: cities.slug,
          state: cities.state,
          county: cities.county,
          zipCodes: cities.zipCodes,
          primaryZip: cities.primaryZip,
          tdspDuns: cities.tdspDuns,
          population: cities.population,
          medianIncome: cities.medianIncome,
          isDeregulated: cities.isDeregulated,
          planCount: count(electricityPlans.id),
          avgRate: avg(electricityPlans.rate1000Kwh),
        })
        .from(cities)
        .leftJoin(electricityPlans, sql`${cities.slug} = ANY(${electricityPlans.citySlugs})`)
        .where(and(
          eq(cities.slug, slug),
          eq(cities.state, state)
        ))
        .groupBy(cities.id);
      
      if (!city) {
        return null;
      }
      
      const realCity: RealCity = {
        id: city.id,
        name: city.name,
        slug: city.slug,
        state: city.state,
        county: city.county,
        zipCodes: city.zipCodes || [],
        primaryZip: city.primaryZip,
        tdspDuns: city.tdspDuns,
        population: city.population,
        medianIncome: city.medianIncome,
        isDeregulated: city.isDeregulated,
        planCount: city.planCount,
        avgRate: city.avgRate ? parseFloat(city.avgRate) : null,
      };
      
      await cache.set(cacheKey, realCity, CityService.CACHE_TTL);
      return realCity;
      
    } catch (error) {
      console.error('[CityService] City lookup error:', error);
      return this.getFallbackCityBySlug(slug, state);
    }
  }
  
  /**
   * Validate ZIP code and return city information
   * Constitutional requirement: Real TDSP mapping
   */
  async validateZipCode(zipCode: string): Promise<{
    isValid: boolean;
    city?: RealCity;
    tdspDuns?: string;
    isDeregulated?: boolean;
  }> {
    const cacheKey = `zip:${zipCode}`;
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      const [zipMapping] = await db
        .select({
          zipCode: zipCodeMappings.zipCode,
          cityId: zipCodeMappings.cityId,
          cityName: zipCodeMappings.cityName,
          tdspDuns: zipCodeMappings.tdspDuns,
          isDeregulated: zipCodeMappings.isDeregulated,
        })
        .from(zipCodeMappings)
        .where(eq(zipCodeMappings.zipCode, zipCode));
      
      if (!zipMapping || !zipMapping.isDeregulated) {
        const result = { isValid: false };
        await cache.set(cacheKey, result, CityService.CACHE_TTL);
        return result;
      }
      
      // Get full city data
      const city = zipMapping.cityId ? 
        await db.select().from(cities).where(eq(cities.id, zipMapping.cityId)).then(r => r[0]) :
        null;
      
      const result = {
        isValid: true,
        city: city ? {
          id: city.id,
          name: city.name,
          slug: city.slug,
          state: city.state,
          county: city.county,
          zipCodes: city.zipCodes || [],
          primaryZip: city.primaryZip,
          tdspDuns: city.tdspDuns,
          population: city.population,
          medianIncome: city.medianIncome,
          isDeregulated: city.isDeregulated,
          planCount: 0, // Will be populated separately if needed
          avgRate: null,
        } as RealCity : undefined,
        tdspDuns: zipMapping.tdspDuns,
        isDeregulated: zipMapping.isDeregulated,
      };
      
      await cache.set(cacheKey, result, CityService.CACHE_TTL);
      return result;
      
    } catch (error) {
      console.error('[CityService] ZIP validation error:', error);
      return { isValid: false };
    }
  }
  
  /**
   * JSON fallback methods
   */
  private async getFallbackCities(state: string): Promise<RealCity[]> {
    try {
      const { cities } = await import(`../../data/generated/cities-${state.toLowerCase()}.json`);
      return cities.map(c => ({
        ...c,
        zipCodes: c.zipCodes || [],
        planCount: c.planCount || 0,
        avgRate: typeof c.avgRate === 'string' ? parseFloat(c.avgRate) : c.avgRate,
      }));
    } catch (error) {
      console.error('[CityService] Fallback failed:', error);
      return [];
    }
  }
  
  private async getFallbackCityBySlug(slug: string, state: string): Promise<RealCity | null> {
    try {
      const cities = await this.getFallbackCities(state);
      return cities.find(c => c.slug === slug) || null;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const cityService = new CityService();

// Export convenience functions
export const getCities = (state?: string) => cityService.getCities(state);
export const getCityBySlug = (slug: string, state?: string) => cityService.getCityBySlug(slug, state);
export const validateZipCode = (zipCode: string) => cityService.validateZipCode(zipCode);
```

### **Plan Service (src/lib/services/plan-service.ts)**
```typescript
import { db } from '../database/connection';
import { electricityPlans, providers, tdspTerritories } from '../database/schema';
import { eq, and, sql, gte, lte, desc, asc } from 'drizzle-orm';
import { cache } from '../cache/redis-client';
import { RealPlan, PlanFilters } from '../../types/service-types';

export class PlanService {
  private static readonly CACHE_TTL = 1800; // 30 minutes (plans change more frequently)
  
  /**
   * Get electricity plans for a city with comprehensive filtering
   * Constitutional requirement: Dynamic plan IDs only
   */
  async getPlansForCity(
    citySlug: string, 
    state: string = 'TX',
    filters: PlanFilters = {}
  ): Promise<RealPlan[]> {
    const cacheKey = `plans:${citySlug}:${state}:${JSON.stringify(filters)}`;
    
    try {
      const cached = await cache.get<RealPlan[]>(cacheKey);
      if (cached) {
        return cached;
      }
      
      let query = db
        .select({
          // Plan data
          id: electricityPlans.id,
          externalId: electricityPlans.externalId,
          name: electricityPlans.name,
          family: electricityPlans.family,
          headline: electricityPlans.headline,
          description: electricityPlans.description,
          termMonths: electricityPlans.termMonths,
          rateType: electricityPlans.rateType,
          rate500Kwh: electricityPlans.rate500Kwh,
          rate1000Kwh: electricityPlans.rate1000Kwh,
          rate2000Kwh: electricityPlans.rate2000Kwh,
          monthlyFee: electricityPlans.monthlyFee,
          cancellationFee: electricityPlans.cancellationFee,
          percentGreen: electricityPlans.percentGreen,
          isPrepay: electricityPlans.isPrepay,
          isTimeOfUse: electricityPlans.isTimeOfUse,
          requiresAutoPay: electricityPlans.requiresAutoPay,
          requiresDeposit: electricityPlans.requiresDeposit,
          customerRating: electricityPlans.customerRating,
          reviewCount: electricityPlans.reviewCount,
          
          // Provider data
          providerId: providers.id,
          providerName: providers.name,
          providerDisplayName: providers.displayName,
          providerSlug: providers.slug,
          providerLogoUrl: providers.logoUrl,
          providerRating: providers.rating,
          
          // TDSP data
          tdspDuns: tdspTerritories.duns,
          tdspName: tdspTerritories.name,
          tdspAbbreviation: tdspTerritories.abbreviation,
        })
        .from(electricityPlans)
        .innerJoin(providers, eq(electricityPlans.providerId, providers.id))
        .innerJoin(tdspTerritories, eq(electricityPlans.tdspDuns, tdspTerritories.duns))
        .where(and(
          eq(electricityPlans.isActive, true),
          eq(providers.isActive, true),
          sql`${citySlug} = ANY(${electricityPlans.citySlugs})`
        ));
      
      // Apply filters
      if (filters.termMonths) {
        query = query.where(eq(electricityPlans.termMonths, filters.termMonths));
      }
      
      if (filters.rateType) {
        query = query.where(eq(electricityPlans.rateType, filters.rateType));
      }
      
      if (filters.minGreenPercent) {
        query = query.where(gte(electricityPlans.percentGreen, filters.minGreenPercent));
      }
      
      if (filters.maxRate) {
        query = query.where(lte(electricityPlans.rate1000Kwh, filters.maxRate.toString()));
      }
      
      if (filters.providerId) {
        query = query.where(eq(electricityPlans.providerId, filters.providerId));
      }
      
      // Apply sorting
      if (filters.sortBy === 'rate') {
        query = query.orderBy(asc(electricityPlans.rate1000Kwh));
      } else if (filters.sortBy === 'rating') {
        query = query.orderBy(desc(electricityPlans.customerRating));
      } else {
        // Default sort by rate
        query = query.orderBy(asc(electricityPlans.rate1000Kwh));
      }
      
      const planResults = await query;
      
      const realPlans: RealPlan[] = planResults.map(p => ({
        // Constitutional requirement: MongoDB ObjectId format
        id: p.id, // e.g., "68b4f2c8e1234567890abcde"
        externalId: p.externalId,
        name: p.name,
        family: p.family,
        headline: p.headline,
        description: p.description,
        termMonths: p.termMonths,
        rateType: p.rateType as 'fixed' | 'variable' | 'indexed',
        
        // Pricing (convert from string to number)
        rate500Kwh: p.rate500Kwh ? parseFloat(p.rate500Kwh) : null,
        rate1000Kwh: parseFloat(p.rate1000Kwh),
        rate2000Kwh: p.rate2000Kwh ? parseFloat(p.rate2000Kwh) : null,
        monthlyFee: parseFloat(p.monthlyFee || '0'),
        cancellationFee: parseFloat(p.cancellationFee || '0'),
        
        // Features
        percentGreen: p.percentGreen,
        isPrepay: p.isPrepay,
        isTimeOfUse: p.isTimeOfUse,
        requiresAutoPay: p.requiresAutoPay,
        requiresDeposit: p.requiresDeposit,
        
        // Ratings
        customerRating: p.customerRating ? parseFloat(p.customerRating) : null,
        reviewCount: p.reviewCount,
        
        // Provider information
        provider: {
          id: p.providerId,
          name: p.providerName,
          displayName: p.providerDisplayName || p.providerName,
          slug: p.providerSlug,
          logoUrl: p.providerLogoUrl,
          rating: p.providerRating ? parseFloat(p.providerRating) : null,
        },
        
        // TDSP information
        tdsp: {
          duns: p.tdspDuns,
          name: p.tdspName,
          abbreviation: p.tdspAbbreviation,
        },
      }));
      
      await cache.set(cacheKey, realPlans, PlanService.CACHE_TTL);
      return realPlans;
      
    } catch (error) {
      console.error('[PlanService] Database error, falling back to JSON:', error);
      return this.getFallbackPlansForCity(citySlug, state, filters);
    }
  }
  
  /**
   * Get plan by MongoDB ObjectId
   * Constitutional requirement: Dynamic resolution only
   */
  async getPlanById(planId: string): Promise<RealPlan | null> {
    // Validate MongoDB ObjectId format
    if (!/^[0-9a-f]{24}$/.test(planId)) {
      throw new Error('Invalid plan ID format - must be MongoDB ObjectId');
    }
    
    const cacheKey = `plan:${planId}`;
    
    try {
      const cached = await cache.get<RealPlan>(cacheKey);
      if (cached) {
        return cached;
      }
      
      const [plan] = await db
        .select({
          id: electricityPlans.id,
          externalId: electricityPlans.externalId,
          name: electricityPlans.name,
          family: electricityPlans.family,
          headline: electricityPlans.headline,
          description: electricityPlans.description,
          termMonths: electricityPlans.termMonths,
          rateType: electricityPlans.rateType,
          rate500Kwh: electricityPlans.rate500Kwh,
          rate1000Kwh: electricityPlans.rate1000Kwh,
          rate2000Kwh: electricityPlans.rate2000Kwh,
          monthlyFee: electricityPlans.monthlyFee,
          cancellationFee: electricityPlans.cancellationFee,
          percentGreen: electricityPlans.percentGreen,
          isPrepay: electricityPlans.isPrepay,
          isTimeOfUse: electricityPlans.isTimeOfUse,
          requiresAutoPay: electricityPlans.requiresAutoPay,
          requiresDeposit: electricityPlans.requiresDeposit,
          customerRating: electricityPlans.customerRating,
          reviewCount: electricityPlans.reviewCount,
          
          providerId: providers.id,
          providerName: providers.name,
          providerDisplayName: providers.displayName,
          providerSlug: providers.slug,
          providerLogoUrl: providers.logoUrl,
          providerRating: providers.rating,
          
          tdspDuns: tdspTerritories.duns,
          tdspName: tdspTerritories.name,
          tdspAbbreviation: tdspTerritories.abbreviation,
        })
        .from(electricityPlans)
        .innerJoin(providers, eq(electricityPlans.providerId, providers.id))
        .innerJoin(tdspTerritories, eq(electricityPlans.tdspDuns, tdspTerritories.duns))
        .where(eq(electricityPlans.id, planId));
      
      if (!plan) {
        return null;
      }
      
      const realPlan: RealPlan = {
        id: plan.id,
        externalId: plan.externalId,
        name: plan.name,
        family: plan.family,
        headline: plan.headline,
        description: plan.description,
        termMonths: plan.termMonths,
        rateType: plan.rateType as 'fixed' | 'variable' | 'indexed',
        rate500Kwh: plan.rate500Kwh ? parseFloat(plan.rate500Kwh) : null,
        rate1000Kwh: parseFloat(plan.rate1000Kwh),
        rate2000Kwh: plan.rate2000Kwh ? parseFloat(plan.rate2000Kwh) : null,
        monthlyFee: parseFloat(plan.monthlyFee || '0'),
        cancellationFee: parseFloat(plan.cancellationFee || '0'),
        percentGreen: plan.percentGreen,
        isPrepay: plan.isPrepay,
        isTimeOfUse: plan.isTimeOfUse,
        requiresAutoPay: plan.requiresAutoPay,
        requiresDeposit: plan.requiresDeposit,
        customerRating: plan.customerRating ? parseFloat(plan.customerRating) : null,
        reviewCount: plan.reviewCount,
        provider: {
          id: plan.providerId,
          name: plan.providerName,
          displayName: plan.providerDisplayName || plan.providerName,
          slug: plan.providerSlug,
          logoUrl: plan.providerLogoUrl,
          rating: plan.providerRating ? parseFloat(plan.providerRating) : null,
        },
        tdsp: {
          duns: plan.tdspDuns,
          name: plan.tdspName,
          abbreviation: plan.tdspAbbreviation,
        },
      };
      
      await cache.set(cacheKey, realPlan, PlanService.CACHE_TTL);
      return realPlan;
      
    } catch (error) {
      console.error('[PlanService] Plan lookup error:', error);
      return null;
    }
  }
  
  /**
   * Search for plan by name, provider, and city
   * Constitutional requirement: Dynamic MongoDB ObjectId resolution
   */
  async searchPlan(planName: string, providerName: string, citySlug: string): Promise<string | null> {
    const cacheKey = `plan-search:${planName}:${providerName}:${citySlug}`;
    
    try {
      const cached = await cache.get<string>(cacheKey);
      if (cached) {
        return cached;
      }
      
      const [result] = await db
        .select({ id: electricityPlans.id })
        .from(electricityPlans)
        .innerJoin(providers, eq(electricityPlans.providerId, providers.id))
        .where(and(
          eq(electricityPlans.name, planName),
          eq(providers.name, providerName),
          sql`${citySlug} = ANY(${electricityPlans.citySlugs})`,
          eq(electricityPlans.isActive, true)
        ))
        .limit(1);
      
      const planId = result?.id || null;
      
      if (planId) {
        await cache.set(cacheKey, planId, PlanService.CACHE_TTL);
      }
      
      return planId;
      
    } catch (error) {
      console.error('[PlanService] Plan search error:', error);
      return null;
    }
  }
  
  /**
   * JSON fallback methods
   */
  private async getFallbackPlansForCity(
    citySlug: string, 
    state: string,
    filters: PlanFilters
  ): Promise<RealPlan[]> {
    try {
      const { plans } = await import(`../../data/generated/plans-${citySlug}.json`);
      
      let filteredPlans = plans.filter(p => p.isActive);
      
      // Apply filters
      if (filters.termMonths) {
        filteredPlans = filteredPlans.filter(p => p.termMonths === filters.termMonths);
      }
      
      if (filters.rateType) {
        filteredPlans = filteredPlans.filter(p => p.rateType === filters.rateType);
      }
      
      if (filters.minGreenPercent) {
        filteredPlans = filteredPlans.filter(p => p.percentGreen >= filters.minGreenPercent);
      }
      
      return filteredPlans.map(p => ({
        ...p,
        rate500Kwh: typeof p.rate500Kwh === 'string' ? parseFloat(p.rate500Kwh) : p.rate500Kwh,
        rate1000Kwh: typeof p.rate1000Kwh === 'string' ? parseFloat(p.rate1000Kwh) : p.rate1000Kwh,
        rate2000Kwh: typeof p.rate2000Kwh === 'string' ? parseFloat(p.rate2000Kwh) : p.rate2000Kwh,
        monthlyFee: typeof p.monthlyFee === 'string' ? parseFloat(p.monthlyFee) : p.monthlyFee,
        cancellationFee: typeof p.cancellationFee === 'string' ? parseFloat(p.cancellationFee) : p.cancellationFee,
        customerRating: typeof p.customerRating === 'string' ? parseFloat(p.customerRating) : p.customerRating,
      }));
    } catch (error) {
      console.error('[PlanService] Fallback failed:', error);
      return [];
    }
  }
}

// Export singleton instance
export const planService = new PlanService();

// Export convenience functions
export const getPlansForCity = (citySlug: string, state?: string, filters?: PlanFilters) => 
  planService.getPlansForCity(citySlug, state, filters);

export const getPlanById = (planId: string) => planService.getPlanById(planId);

export const searchPlan = (planName: string, providerName: string, citySlug: string) =>
  planService.searchPlan(planName, providerName, citySlug);
```

### **Redis Cache Client (src/lib/cache/redis-client.ts)**
```typescript
import { Redis } from 'ioredis';

class CacheClient {
  private redis: Redis | null = null;
  private isEnabled: boolean = false;
  
  constructor() {
    this.initializeRedis();
  }
  
  private initializeRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL);
        this.isEnabled = true;
        console.log('✅ Redis cache connected');
      } else {
        console.log('ℹ️ Redis not configured, caching disabled');
      }
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      this.isEnabled = false;
    }
  }
  
  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled || !this.redis) {
      return null;
    }
    
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('[Cache] Get error:', error);
      return null;
    }
  }
  
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    if (!this.isEnabled || !this.redis) {
      return false;
    }
    
    try {
      const serialized = JSON.stringify(value);
      
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      console.error('[Cache] Set error:', error);
      return false;
    }
  }
  
  async del(key: string): Promise<boolean> {
    if (!this.isEnabled || !this.redis) {
      return false;
    }
    
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('[Cache] Delete error:', error);
      return false;
    }
  }
  
  async flush(): Promise<boolean> {
    if (!this.isEnabled || !this.redis) {
      return false;
    }
    
    try {
      await this.redis.flushall();
      return true;
    } catch (error) {
      console.error('[Cache] Flush error:', error);
      return false;
    }
  }
}

export const cache = new CacheClient();
```

### **Service Types (src/types/service-types.ts)**
```typescript
// Real data types (constitutional requirement: no mock data)
export interface RealProvider {
  id: number;
  name: string;
  displayName: string;
  slug: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  description: string | null;
  rating: number | null;
  planCount: number;
  isActive: boolean;
  yearFounded: number | null;
  headquarters: string | null;
  serviceAreas: string[];
  tdspSupported: string[];
}

export interface RealCity {
  id: number;
  name: string;
  slug: string;
  state: string;
  county: string | null;
  zipCodes: string[];
  primaryZip: string | null;
  tdspDuns: string | null;
  population: number | null;
  medianIncome: number | null;
  isDeregulated: boolean;
  planCount: number;
  avgRate: number | null;
}

export interface RealPlan {
  id: string; // MongoDB ObjectId format
  externalId: string;
  name: string;
  family: string | null;
  headline: string | null;
  description: string | null;
  termMonths: number;
  rateType: 'fixed' | 'variable' | 'indexed';
  rate500Kwh: number | null;
  rate1000Kwh: number;
  rate2000Kwh: number | null;
  monthlyFee: number;
  cancellationFee: number;
  percentGreen: number;
  isPrepay: boolean;
  isTimeOfUse: boolean;
  requiresAutoPay: boolean;
  requiresDeposit: boolean;
  customerRating: number | null;
  reviewCount: number;
  provider: {
    id: number;
    name: string;
    displayName: string;
    slug: string;
    logoUrl: string | null;
    rating: number | null;
  };
  tdsp: {
    duns: string;
    name: string;
    abbreviation: string | null;
  };
}

export interface PlanFilters {
  termMonths?: number;
  rateType?: 'fixed' | 'variable' | 'indexed';
  minGreenPercent?: number;
  maxRate?: number;
  providerId?: number;
  sortBy?: 'rate' | 'rating' | 'name';
}
```

This complete service layer implementation provides:
- ✅ Database-first architecture with JSON fallbacks
- ✅ Constitutional compliance (real data only, MongoDB ObjectIds)
- ✅ Comprehensive error handling and resilience
- ✅ Redis caching for performance optimization
- ✅ TypeScript type safety throughout
- ✅ Clean separation of concerns
- ✅ Singleton pattern for easy component integration