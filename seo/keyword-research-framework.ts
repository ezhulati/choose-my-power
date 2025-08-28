/**
 * Comprehensive Keyword Research Framework for Mass SEO
 * Handles keyword mapping, competitive analysis, and search intent classification
 * for 881 cities × multiple filter combinations = 10,000+ target keywords
 * 
 * FEATURES:
 * - Automated keyword generation based on city + filter combinations
 * - Search volume estimation using market data and population correlation
 * - Competitive difficulty scoring for strategic prioritization
 * - Search intent classification (informational, commercial, transactional)
 * - Long-tail keyword discovery for low-competition opportunities
 * - Seasonal keyword variation tracking
 * - Local SEO optimization with geographic modifiers
 * 
 * KEYWORD STRATEGY:
 * - Primary Keywords: High-volume, high-competition core terms
 * - Secondary Keywords: Medium-volume supporting terms
 * - Long-tail Keywords: Low-competition, high-intent specific phrases
 * - Location Keywords: Geographic variations and local modifiers
 * - Commercial Keywords: Transaction-focused electricity shopping terms
 * - Brand Keywords: Provider-specific and comparison terms
 */

import { tdspMapping, formatCityName } from '../src/config/tdsp-mapping';

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  competition: 'low' | 'medium' | 'high';
  cpc: number;
  difficulty: number; // 1-100 scale
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  category: 'primary' | 'secondary' | 'long-tail' | 'location' | 'commercial' | 'brand';
  seasonality: SeasonalData[];
  relatedKeywords: string[];
  targetPage: string;
  priority: number; // 1-10 scale for implementation priority
}

export interface SeasonalData {
  month: number;
  relativeVolume: number; // Percentage of annual average
}

export interface KeywordCluster {
  seedKeyword: string;
  clusterKeywords: KeywordData[];
  totalVolume: number;
  averageDifficulty: number;
  contentGaps: string[];
  competitorAnalysis: CompetitorKeywordData[];
}

export interface CompetitorKeywordData {
  domain: string;
  ranking: number;
  trafficShare: number;
  contentQuality: number; // 1-100 score
  backlinks: number;
  weaknesses: string[];
}

export interface CityKeywordProfile {
  city: string;
  population: number;
  economicIndicators: EconomicData;
  primaryKeywords: KeywordData[];
  filterKeywords: Record<string, KeywordData[]>;
  longTailOpportunities: KeywordData[];
  competitiveGaps: string[];
  marketPotential: number; // 1-100 score
}

export interface EconomicData {
  medianIncome: number;
  homeOwnershipRate: number;
  businessCount: number;
  energyUsageIndex: number; // Relative to state average
}

/**
 * Advanced Keyword Research Engine
 */
export class KeywordResearchFramework {
  private cityPopulationData: Record<string, number>;
  private electricityTerms: string[];
  private modifiers: string[];
  private filterTerms: Record<string, string[]>;
  private competitorDomains: string[];

  constructor() {
    this.cityPopulationData = this.initializeCityPopulation();
    this.electricityTerms = this.initializeElectricityTerms();
    this.modifiers = this.initializeModifiers();
    this.filterTerms = this.initializeFilterTerms();
    this.competitorDomains = this.initializeCompetitorDomains();
  }

  /**
   * Generate comprehensive keyword map for all cities and filter combinations
   */
  async generateMassKeywordMap(): Promise<Record<string, CityKeywordProfile>> {
    const keywordMap: Record<string, CityKeywordProfile> = {};
    const cities = Object.keys(tdspMapping);

    console.log(`🔍 Generating keywords for ${cities.length} cities...`);

    for (const citySlug of cities) {
      try {
        const profile = await this.generateCityKeywordProfile(citySlug);
        keywordMap[citySlug] = profile;
        
        // Log progress every 50 cities
        if (Object.keys(keywordMap).length % 50 === 0) {
          console.log(`✅ Processed ${Object.keys(keywordMap).length}/${cities.length} cities`);
        }
      } catch (error) {
        console.error(`❌ Failed to generate keywords for ${citySlug}:`, error);
      }
    }

    // Generate summary statistics
    const totalKeywords = Object.values(keywordMap).reduce((sum, profile) => 
      sum + profile.primaryKeywords.length + 
      Object.values(profile.filterKeywords).flat().length +
      profile.longTailOpportunities.length, 0);

    console.log(`🎯 Generated ${totalKeywords} keywords across ${cities.length} cities`);
    
    return keywordMap;
  }

  /**
   * Generate keyword profile for a specific city
   */
  async generateCityKeywordProfile(citySlug: string): Promise<CityKeywordProfile> {
    const cityData = tdspMapping[citySlug];
    const cityName = formatCityName(citySlug);
    const cleanCityName = citySlug.replace('-tx', '');
    const population = this.getCityPopulation(citySlug);
    const economicData = this.getEconomicData(citySlug);

    // Generate primary keywords (city-level)
    const primaryKeywords = await this.generatePrimaryKeywords(cleanCityName, cityName, population);

    // Generate filter-specific keywords
    const filterKeywords: Record<string, KeywordData[]> = {};
    const filterTypes = ['12-month', '24-month', 'fixed-rate', 'variable-rate', 'green-energy', 'prepaid', 'no-deposit'];
    
    for (const filter of filterTypes) {
      filterKeywords[filter] = await this.generateFilterKeywords(cleanCityName, cityName, filter, population);
    }

    // Generate long-tail opportunities
    const longTailOpportunities = await this.generateLongTailKeywords(cleanCityName, cityName, population);

    // Identify competitive gaps
    const competitiveGaps = await this.identifyCompetitiveGaps(cleanCityName, cityName);

    // Calculate market potential
    const marketPotential = this.calculateMarketPotential(population, economicData, primaryKeywords);

    return {
      city: cityName,
      population,
      economicIndicators: economicData,
      primaryKeywords,
      filterKeywords,
      longTailOpportunities,
      competitiveGaps,
      marketPotential
    };
  }

  /**
   * Generate primary city-level keywords
   */
  private async generatePrimaryKeywords(cleanCityName: string, cityName: string, population: number): Promise<KeywordData[]> {
    const keywords: KeywordData[] = [];
    const baseVolume = this.estimateBaseSearchVolume(population);

    // Core electricity terms
    const coreTerms = [
      `${cleanCityName} electricity`,
      `${cleanCityName} electric rates`,
      `${cleanCityName} power companies`,
      `electricity plans ${cleanCityName}`,
      `${cleanCityName} energy rates`,
      `electricity providers ${cleanCityName}`,
      `${cleanCityName} electric plans`,
      `power plans ${cleanCityName}`,
      `${cleanCityName} tx electricity`,
      `electricity ${cleanCityName} texas`
    ];

    for (const term of coreTerms) {
      const keyword = await this.analyzeKeyword(term, baseVolume, 'primary');
      keywords.push(keyword);
    }

    // Add commercial intent variations
    const commercialTerms = [
      `best electricity rates ${cleanCityName}`,
      `cheap electricity ${cleanCityName}`,
      `compare electricity ${cleanCityName}`,
      `switch electricity ${cleanCityName}`,
      `${cleanCityName} electricity comparison`,
      `${cleanCityName} power plan comparison`
    ];

    for (const term of commercialTerms) {
      const keyword = await this.analyzeKeyword(term, baseVolume * 0.4, 'commercial');
      keywords.push(keyword);
    }

    return keywords.sort((a, b) => b.searchVolume - a.searchVolume);
  }

  /**
   * Generate filter-specific keywords
   */
  private async generateFilterKeywords(cleanCityName: string, cityName: string, filter: string, population: number): Promise<KeywordData[]> {
    const keywords: KeywordData[] = [];
    const baseVolume = this.estimateBaseSearchVolume(population) * 0.3; // Filter-specific terms have lower volume
    const filterVariations = this.getFilterVariations(filter);

    for (const variation of filterVariations) {
      const terms = [
        `${variation} electricity ${cleanCityName}`,
        `${cleanCityName} ${variation} plans`,
        `${variation} power ${cleanCityName}`,
        `${cleanCityName} ${variation} rates`,
        `best ${variation} electricity ${cleanCityName}`,
        `${cleanCityName} ${variation} energy plans`
      ];

      for (const term of terms) {
        const keyword = await this.analyzeKeyword(term, baseVolume * 0.7, 'secondary');
        keyword.targetPage = `/texas/${cleanCityName}/${filter}/`;
        keywords.push(keyword);
      }
    }

    return keywords.sort((a, b) => b.searchVolume - a.searchVolume).slice(0, 15); // Top 15 per filter
  }

  /**
   * Generate long-tail keyword opportunities
   */
  private async generateLongTailKeywords(cleanCityName: string, cityName: string, population: number): Promise<KeywordData[]> {
    const keywords: KeywordData[] = [];
    const baseVolume = this.estimateBaseSearchVolume(population) * 0.1; // Long-tail has very low volume but high intent

    const longTailTemplates = [
      `how to choose electricity provider ${cleanCityName}`,
      `${cleanCityName} electricity rates comparison 2024`,
      `switching electricity companies ${cleanCityName}`,
      `${cleanCityName} green energy electricity plans`,
      `best fixed rate electricity ${cleanCityName}`,
      `${cleanCityName} prepaid electricity no deposit`,
      `electricity plans for small business ${cleanCityName}`,
      `moving to ${cleanCityName} electricity setup`,
      `${cleanCityName} variable rate electricity plans`,
      `renewable energy plans ${cleanCityName} texas`,
      `${cleanCityName} apartment electricity plans`,
      `electricity bill calculator ${cleanCityName}`,
      `${cleanCityName} time of use electricity rates`,
      `solar electricity plans ${cleanCityName}`,
      `commercial electricity rates ${cleanCityName}`
    ];

    for (const template of longTailTemplates) {
      const keyword = await this.analyzeKeyword(template, baseVolume, 'long-tail');
      keyword.intent = this.classifyIntent(template);
      keywords.push(keyword);
    }

    return keywords.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Analyze individual keyword for volume, competition, and metrics
   */
  private async analyzeKeyword(keyword: string, estimatedVolume: number, category: KeywordData['category']): Promise<KeywordData> {
    // Estimate search volume based on keyword characteristics
    const searchVolume = this.adjustVolumeForKeyword(keyword, estimatedVolume);
    
    // Estimate competition level
    const competition = this.estimateCompetition(keyword);
    
    // Estimate CPC
    const cpc = this.estimateCPC(keyword, competition);
    
    // Calculate difficulty score
    const difficulty = this.calculateDifficulty(keyword, competition);
    
    // Classify intent
    const intent = this.classifyIntent(keyword);
    
    // Generate seasonal data
    const seasonality = this.generateSeasonalData(keyword);
    
    // Find related keywords
    const relatedKeywords = this.generateRelatedKeywords(keyword);
    
    // Calculate priority
    const priority = this.calculatePriority(searchVolume, competition, intent, category);

    return {
      keyword,
      searchVolume,
      competition,
      cpc,
      difficulty,
      intent,
      category,
      seasonality,
      relatedKeywords,
      targetPage: this.determineTargetPage(keyword),
      priority
    };
  }

  /**
   * Helper methods for keyword analysis
   */
  
  private estimateBaseSearchVolume(population: number): number {
    // Estimate monthly searches based on city population
    // Formula: Population * 0.3 (households) * 0.15 (annual switch rate) / 12 (monthly)
    return Math.round((population * 0.3 * 0.15 / 12) * 1.5); // 1.5x factor for research volume
  }

  private adjustVolumeForKeyword(keyword: string, baseVolume: number): number {
    let multiplier = 1;

    // Brand terms get higher volume
    if (keyword.includes('best') || keyword.includes('compare')) multiplier *= 1.5;
    if (keyword.includes('cheap') || keyword.includes('rates')) multiplier *= 1.3;
    if (keyword.includes('plans') || keyword.includes('electricity')) multiplier *= 1.2;
    
    // Long-tail terms get lower volume but higher intent
    if (keyword.split(' ').length > 4) multiplier *= 0.4;
    if (keyword.includes('how to') || keyword.includes('what is')) multiplier *= 0.3;
    
    // Commercial intent terms
    if (keyword.includes('switch') || keyword.includes('sign up')) multiplier *= 0.8;

    return Math.max(10, Math.round(baseVolume * multiplier));
  }

  private estimateCompetition(keyword: string): 'low' | 'medium' | 'high' {
    const competitiveTerms = ['best', 'compare', 'cheap', 'rates', 'electricity'];
    const lowCompetitionTerms = ['how to', 'what is', 'prepaid', 'time of use'];
    
    const competitiveScore = competitiveTerms.filter(term => keyword.includes(term)).length;
    const lowCompetitionScore = lowCompetitionTerms.filter(term => keyword.includes(term)).length;
    
    if (lowCompetitionScore > 0 && competitiveScore === 0) return 'low';
    if (competitiveScore >= 2) return 'high';
    return 'medium';
  }

  private estimateCPC(keyword: string, competition: string): number {
    const baseCPC = competition === 'high' ? 8.50 : competition === 'medium' ? 4.25 : 2.10;
    
    // Adjust for electricity market CPCs
    let multiplier = 1;
    if (keyword.includes('commercial') || keyword.includes('business')) multiplier *= 1.8;
    if (keyword.includes('green') || keyword.includes('solar')) multiplier *= 1.3;
    if (keyword.includes('prepaid') || keyword.includes('no deposit')) multiplier *= 0.7;
    
    return Math.round((baseCPC * multiplier) * 100) / 100;
  }

  private calculateDifficulty(keyword: string, competition: string): number {
    let difficulty = competition === 'high' ? 75 : competition === 'medium' ? 45 : 25;
    
    // Adjust for specific factors
    if (keyword.includes('best') || keyword.includes('compare')) difficulty += 15;
    if (keyword.split(' ').length > 4) difficulty -= 20; // Long-tail is easier
    if (keyword.includes('2024') || keyword.includes('2025')) difficulty -= 10; // Temporal terms
    
    return Math.max(10, Math.min(95, difficulty));
  }

  private classifyIntent(keyword: string): KeywordData['intent'] {
    if (keyword.includes('how to') || keyword.includes('what is') || keyword.includes('guide')) {
      return 'informational';
    }
    if (keyword.includes('best') || keyword.includes('compare') || keyword.includes('review')) {
      return 'commercial';
    }
    if (keyword.includes('sign up') || keyword.includes('enroll') || keyword.includes('switch')) {
      return 'transactional';
    }
    if (keyword.includes('login') || keyword.includes('customer service')) {
      return 'navigational';
    }
    return 'commercial'; // Default for electricity shopping
  }

  private generateSeasonalData(keyword: string): SeasonalData[] {
    const seasonal: SeasonalData[] = [];
    
    // Base seasonal pattern for electricity (higher in summer/winter)
    const basePattern = [85, 85, 90, 95, 105, 120, 130, 125, 115, 100, 90, 85]; // Jan-Dec
    
    // Adjust for specific keywords
    let pattern = [...basePattern];
    if (keyword.includes('green') || keyword.includes('solar')) {
      pattern = pattern.map((val, idx) => idx >= 3 && idx <= 8 ? val * 1.15 : val); // Spring/Summer boost
    }
    if (keyword.includes('heating') || keyword.includes('winter')) {
      pattern = pattern.map((val, idx) => idx <= 2 || idx >= 10 ? val * 1.25 : val); // Winter boost
    }
    
    pattern.forEach((value, index) => {
      seasonal.push({
        month: index + 1,
        relativeVolume: Math.round(value)
      });
    });
    
    return seasonal;
  }

  private generateRelatedKeywords(keyword: string): string[] {
    const related: string[] = [];
    const cityMatch = keyword.match(/([a-z\s]+)\s+(electricity|power|energy|rates)/i);
    
    if (cityMatch) {
      const city = cityMatch[1].trim();
      related.push(
        `${city} electric companies`,
        `${city} utility providers`,
        `electricity service ${city}`,
        `power service ${city}`,
        `energy providers ${city}`
      );
    }
    
    return related.slice(0, 5);
  }

  private calculatePriority(volume: number, competition: string, intent: string, category: string): number {
    let priority = 5; // Base priority
    
    // Volume factor
    if (volume > 1000) priority += 2;
    else if (volume > 500) priority += 1;
    else if (volume < 50) priority -= 1;
    
    // Competition factor (inverse)
    if (competition === 'low') priority += 2;
    else if (competition === 'high') priority -= 1;
    
    // Intent factor
    if (intent === 'transactional') priority += 2;
    else if (intent === 'commercial') priority += 1;
    
    // Category factor
    if (category === 'primary') priority += 1;
    else if (category === 'long-tail') priority += 1; // High-intent long-tail
    
    return Math.max(1, Math.min(10, priority));
  }

  private determineTargetPage(keyword: string): string {
    const cityMatch = keyword.match(/([a-z-]+)\s+(electricity|power|energy)/i);
    if (!cityMatch) return '/';
    
    const city = cityMatch[1].replace(/\s/g, '-');
    
    // Check for filter-specific keywords
    if (keyword.includes('fixed rate') || keyword.includes('fixed-rate')) return `/texas/${city}/fixed-rate/`;
    if (keyword.includes('green') || keyword.includes('renewable')) return `/texas/${city}/green-energy/`;
    if (keyword.includes('12 month') || keyword.includes('annual')) return `/texas/${city}/12-month/`;
    if (keyword.includes('prepaid')) return `/texas/${city}/prepaid/`;
    if (keyword.includes('no deposit')) return `/texas/${city}/no-deposit/`;
    
    return `/texas/${city}/`;
  }

  /**
   * Competitive gap analysis
   */
  private async identifyCompetitiveGaps(cleanCityName: string, cityName: string): Promise<string[]> {
    const gaps: string[] = [];
    
    // Common gaps in electricity comparison sites
    const gapOpportunities = [
      `${cleanCityName} electricity for seniors`,
      `${cleanCityName} student electricity discounts`,
      `${cleanCityName} military electricity rates`,
      `${cleanCityName} small business electricity`,
      `${cleanCityName} apartment electricity tips`,
      `${cleanCityName} renewable energy incentives`,
      `${cleanCityName} electricity emergency assistance`,
      `understanding ${cleanCityName} electricity bill`,
      `${cleanCityName} power outage information`,
      `${cleanCityName} energy efficiency programs`
    ];
    
    // Filter for actual gaps (this would use real competitor analysis in production)
    return gapOpportunities.slice(0, 5);
  }

  private calculateMarketPotential(population: number, economic: EconomicData, keywords: KeywordData[]): number {
    let score = 50; // Base score
    
    // Population factor
    if (population > 500000) score += 20;
    else if (population > 100000) score += 10;
    else if (population < 25000) score -= 10;
    
    // Economic factors
    if (economic.medianIncome > 70000) score += 15;
    if (economic.homeOwnershipRate > 0.65) score += 10;
    if (economic.businessCount > 1000) score += 5;
    
    // Keyword opportunity
    const avgSearchVolume = keywords.reduce((sum, kw) => sum + kw.searchVolume, 0) / keywords.length;
    if (avgSearchVolume > 500) score += 10;
    else if (avgSearchVolume < 100) score -= 10;
    
    return Math.max(10, Math.min(100, score));
  }

  /**
   * Initialization methods
   */
  
  private initializeCityPopulation(): Record<string, number> {
    // This would be loaded from a comprehensive database in production
    return {
      'houston-tx': 2304580,
      'dallas-tx': 1343573,
      'austin-tx': 978908,
      'fort-worth-tx': 918915,
      'san-antonio-tx': 1547253,
      'arlington-tx': 398854,
      'corpus-christi-tx': 326586,
      'plano-tx': 288061,
      'lubbock-tx': 258862,
      'laredo-tx': 261639,
      'garland-tx': 246018,
      'irving-tx': 239798,
      'amarillo-tx': 200393,
      'grand-prairie-tx': 196100,
      'brownsville-tx': 186738,
      'mcallen-tx': 142696,
      'mesquite-tx': 150108,
      // Add more cities...
    };
  }

  private getCityPopulation(citySlug: string): number {
    return this.cityPopulationData[citySlug] || this.estimatePopulationFromTier(citySlug);
  }

  private estimatePopulationFromTier(citySlug: string): number {
    const cityTier = tdspMapping[citySlug]?.tier || 3;
    
    if (cityTier === 1) return 250000; // Major metros
    if (cityTier === 2) return 75000;  // Medium cities
    return 25000; // Small cities
  }

  private getEconomicData(citySlug: string): EconomicData {
    // This would come from census and economic databases in production
    const cityTier = tdspMapping[citySlug]?.tier || 3;
    
    return {
      medianIncome: cityTier === 1 ? 65000 : cityTier === 2 ? 55000 : 45000,
      homeOwnershipRate: cityTier === 1 ? 0.62 : cityTier === 2 ? 0.68 : 0.72,
      businessCount: cityTier === 1 ? 5000 : cityTier === 2 ? 1500 : 500,
      energyUsageIndex: cityTier === 1 ? 1.1 : cityTier === 2 ? 1.0 : 0.9
    };
  }

  private initializeElectricityTerms(): string[] {
    return [
      'electricity', 'electric', 'power', 'energy', 'utility',
      'rates', 'plans', 'providers', 'companies', 'service',
      'bill', 'billing', 'cost', 'price', 'fee', 'charge'
    ];
  }

  private initializeModifiers(): string[] {
    return [
      'best', 'cheap', 'affordable', 'low-cost', 'competitive',
      'compare', 'comparison', 'review', 'rating', 'top',
      'switch', 'change', 'new', 'sign up', 'enroll'
    ];
  }

  private initializeFilterTerms(): Record<string, string[]> {
    return {
      'contract-length': ['12 month', 'annual', '24 month', '2 year', 'month to month', 'no contract'],
      'rate-type': ['fixed rate', 'variable rate', 'indexed rate', 'flat rate'],
      'green-energy': ['green energy', 'renewable', '100% green', 'wind power', 'solar power'],
      'payment': ['prepaid', 'no deposit', 'pay as you go', 'postpaid'],
      'features': ['free nights', 'free weekends', 'bill credit', 'autopay discount', 'time of use']
    };
  }

  private getFilterVariations(filter: string): string[] {
    const variations: Record<string, string[]> = {
      '12-month': ['12 month', 'annual', '1 year', 'yearly'],
      '24-month': ['24 month', '2 year', 'two year'],
      'fixed-rate': ['fixed rate', 'locked rate', 'stable rate'],
      'variable-rate': ['variable rate', 'flexible rate', 'market rate'],
      'green-energy': ['green energy', '100% green', 'renewable', 'clean energy'],
      'prepaid': ['prepaid', 'pay as you go', 'no deposit'],
      'no-deposit': ['no deposit', 'zero deposit', 'deposit free']
    };
    
    return variations[filter] || [filter.replace('-', ' ')];
  }

  private initializeCompetitorDomains(): string[] {
    return [
      'powertochoose.org',
      'energy.com',
      'directenergy.com',
      'reliant.com',
      'txuenergy.com',
      'gexa.com',
      'greenmountainenergy.com'
    ];
  }

  /**
   * Export keyword data for CSV generation
   */
  exportToCSV(keywordMap: Record<string, CityKeywordProfile>): string {
    const csvRows: string[] = [];
    csvRows.push('City,Keyword,Search Volume,Competition,CPC,Difficulty,Intent,Category,Target Page,Priority');

    Object.entries(keywordMap).forEach(([citySlug, profile]) => {
      // Add primary keywords
      profile.primaryKeywords.forEach(keyword => {
        csvRows.push(this.formatCSVRow(profile.city, keyword));
      });

      // Add filter keywords
      Object.values(profile.filterKeywords).forEach(filterKeywords => {
        filterKeywords.forEach(keyword => {
          csvRows.push(this.formatCSVRow(profile.city, keyword));
        });
      });

      // Add long-tail keywords (top 5)
      profile.longTailOpportunities.slice(0, 5).forEach(keyword => {
        csvRows.push(this.formatCSVRow(profile.city, keyword));
      });
    });

    return csvRows.join('\n');
  }

  private formatCSVRow(city: string, keyword: KeywordData): string {
    return [
      city,
      `"${keyword.keyword}"`,
      keyword.searchVolume,
      keyword.competition,
      keyword.cpc,
      keyword.difficulty,
      keyword.intent,
      keyword.category,
      keyword.targetPage,
      keyword.priority
    ].join(',');
  }

  /**
   * Generate competitor analysis report
   */
  generateCompetitorReport(keywordMap: Record<string, CityKeywordProfile>): CompetitorAnalysisReport {
    const totalKeywords = Object.values(keywordMap).reduce((sum, profile) => 
      sum + profile.primaryKeywords.length + 
      Object.values(profile.filterKeywords).flat().length, 0);

    const avgSearchVolume = Object.values(keywordMap).reduce((sum, profile) => {
      const profileVolume = [...profile.primaryKeywords, ...Object.values(profile.filterKeywords).flat()]
        .reduce((total, kw) => total + kw.searchVolume, 0);
      return sum + profileVolume;
    }, 0) / totalKeywords;

    const competitionBreakdown = {
      low: 0,
      medium: 0,
      high: 0
    };

    Object.values(keywordMap).forEach(profile => {
      [...profile.primaryKeywords, ...Object.values(profile.filterKeywords).flat()].forEach(kw => {
        competitionBreakdown[kw.competition]++;
      });
    });

    const opportunityScore = this.calculateOpportunityScore(keywordMap);

    return {
      totalKeywords,
      avgSearchVolume: Math.round(avgSearchVolume),
      competitionBreakdown,
      opportunityScore,
      topOpportunities: this.identifyTopOpportunities(keywordMap),
      recommendations: this.generateSEORecommendations(keywordMap)
    };
  }

  private calculateOpportunityScore(keywordMap: Record<string, CityKeywordProfile>): number {
    let totalScore = 0;
    let cityCount = 0;

    Object.values(keywordMap).forEach(profile => {
      totalScore += profile.marketPotential;
      cityCount++;
    });

    return Math.round(totalScore / cityCount);
  }

  private identifyTopOpportunities(keywordMap: Record<string, CityKeywordProfile>): KeywordOpportunity[] {
    const opportunities: KeywordOpportunity[] = [];

    Object.entries(keywordMap).forEach(([citySlug, profile]) => {
      [...profile.primaryKeywords, ...Object.values(profile.filterKeywords).flat()]
        .filter(kw => kw.competition === 'low' && kw.searchVolume > 100)
        .slice(0, 3)
        .forEach(keyword => {
          opportunities.push({
            keyword: keyword.keyword,
            city: profile.city,
            searchVolume: keyword.searchVolume,
            difficulty: keyword.difficulty,
            estimatedTraffic: Math.round(keyword.searchVolume * 0.3), // 30% CTR estimate
            targetPage: keyword.targetPage
          });
        });
    });

    return opportunities
      .sort((a, b) => b.estimatedTraffic - a.estimatedTraffic)
      .slice(0, 20);
  }

  private generateSEORecommendations(keywordMap: Record<string, CityKeywordProfile>): string[] {
    const recommendations: string[] = [];

    const totalCities = Object.keys(keywordMap).length;
    const avgKeywordsPerCity = Object.values(keywordMap).reduce((sum, profile) => 
      sum + profile.primaryKeywords.length, 0) / totalCities;

    recommendations.push(`Focus on ${totalCities} cities with average ${Math.round(avgKeywordsPerCity)} keywords per city`);

    // Competition analysis
    const highCompetitionCities = Object.values(keywordMap).filter(profile => 
      profile.primaryKeywords.filter(kw => kw.competition === 'high').length > 5).length;

    if (highCompetitionCities > totalCities * 0.3) {
      recommendations.push('Consider long-tail keyword strategy for highly competitive markets');
    }

    // Long-tail opportunities
    const longTailOpportunities = Object.values(keywordMap).reduce((sum, profile) => 
      sum + profile.longTailOpportunities.length, 0);

    recommendations.push(`Capitalize on ${longTailOpportunities} long-tail keyword opportunities`);

    // Seasonal recommendations
    recommendations.push('Implement seasonal content strategy for summer/winter electricity demand spikes');
    recommendations.push('Create dedicated landing pages for high-volume filter combinations');
    recommendations.push('Develop local content hubs for major metropolitan areas');

    return recommendations;
  }
}

/**
 * Additional interfaces for reporting
 */
export interface CompetitorAnalysisReport {
  totalKeywords: number;
  avgSearchVolume: number;
  competitionBreakdown: {
    low: number;
    medium: number;
    high: number;
  };
  opportunityScore: number;
  topOpportunities: KeywordOpportunity[];
  recommendations: string[];
}

export interface KeywordOpportunity {
  keyword: string;
  city: string;
  searchVolume: number;
  difficulty: number;
  estimatedTraffic: number;
  targetPage: string;
}

/**
 * Export utility functions
 */
export async function generateComprehensiveKeywordMap(): Promise<Record<string, CityKeywordProfile>> {
  const framework = new KeywordResearchFramework();
  return await framework.generateMassKeywordMap();
}

export function exportKeywordMapToCSV(keywordMap: Record<string, CityKeywordProfile>): string {
  const framework = new KeywordResearchFramework();
  return framework.exportToCSV(keywordMap);
}

export function generateKeywordReport(keywordMap: Record<string, CityKeywordProfile>): CompetitorAnalysisReport {
  const framework = new KeywordResearchFramework();
  return framework.generateCompetitorReport(keywordMap);
}