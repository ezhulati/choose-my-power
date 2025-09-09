// T020: Filter logic engine
// Real-time filtering with <300ms performance requirement (NFR-005)

import type { ElectricityPlan } from '../types/electricity-plan';
import type { PlanFilter } from '../types/plan-filter';

export class FilterEngine {
  private plans: ElectricityPlan[] = [];
  private filteredPlans: ElectricityPlan[] = [];
  private lastFilterTime: number = 0;

  constructor(initialPlans: ElectricityPlan[] = []) {
    this.plans = initialPlans;
    this.filteredPlans = [...initialPlans];
  }

  /**
   * Update the plans data
   */
  updatePlans(plans: ElectricityPlan[]): void {
    this.plans = plans;
    this.filteredPlans = [...plans];
  }

  /**
   * Apply filters to plans with performance tracking
   */
  applyFilters(filters: PlanFilter): {
    filteredPlans: ElectricityPlan[];
    totalCount: number;
    filterCounts: { [key: string]: number };
    responseTime: number;
  } {
    const startTime = performance.now();

    // Start with all plans
    let results = [...this.plans];

    // Apply each filter sequentially
    results = this.applyContractLengthFilter(results, filters.contractLengths);
    results = this.applyRateTypeFilter(results, filters.rateTypes);
    results = this.applyPriceRangeFilter(results, filters.minRate, filters.maxRate);
    results = this.applyMonthlyFeeFilter(results, filters.maxMonthlyFee);
    results = this.applyGreenEnergyFilter(results, filters.minGreenEnergy);
    results = this.applyProviderFilter(results, filters.selectedProviders);
    results = this.applyProviderRatingFilter(results, filters.minProviderRating);
    results = this.applyFeaturesFilter(results, filters.requiredFeatures);
    results = this.applyPromotionsFilter(results, filters.includePromotions);
    results = this.applyEarlyTerminationFeeFilter(results, filters.excludeEarlyTerminationFee);

    // Apply sorting
    results = this.applySorting(results, filters.sortBy, filters.sortOrder);

    // Generate filter counts for UI
    const filterCounts = this.generateFilterCounts(this.plans);

    const endTime = performance.now();
    this.lastFilterTime = endTime - startTime;

    this.filteredPlans = results;

    return {
      filteredPlans: results,
      totalCount: results.length,
      filterCounts,
      responseTime: Math.round(this.lastFilterTime)
    };
  }

  /**
   * Get last filter performance time
   */
  getLastFilterTime(): number {
    return this.lastFilterTime;
  }

  /**
   * Contract length filtering
   */
  private applyContractLengthFilter(plans: ElectricityPlan[], contractLengths: number[]): ElectricityPlan[] {
    if (contractLengths.length === 0) return plans;
    return plans.filter(plan => contractLengths.includes(plan.contractLength));
  }

  /**
   * Rate type filtering
   */
  private applyRateTypeFilter(plans: ElectricityPlan[], rateTypes: string[]): ElectricityPlan[] {
    if (rateTypes.length === 0) return plans;
    return plans.filter(plan => rateTypes.includes(plan.rateType));
  }

  /**
   * Price range filtering
   */
  private applyPriceRangeFilter(plans: ElectricityPlan[], minRate?: number, maxRate?: number): ElectricityPlan[] {
    return plans.filter(plan => {
      if (minRate !== undefined && plan.baseRate < minRate) return false;
      if (maxRate !== undefined && plan.baseRate > maxRate) return false;
      return true;
    });
  }

  /**
   * Monthly fee filtering
   */
  private applyMonthlyFeeFilter(plans: ElectricityPlan[], maxMonthlyFee?: number): ElectricityPlan[] {
    if (maxMonthlyFee === undefined) return plans;
    return plans.filter(plan => plan.monthlyFee <= maxMonthlyFee);
  }

  /**
   * Green energy filtering
   */
  private applyGreenEnergyFilter(plans: ElectricityPlan[], minGreenEnergy?: number): ElectricityPlan[] {
    if (minGreenEnergy === undefined) return plans;
    return plans.filter(plan => plan.greenEnergyPercentage >= minGreenEnergy);
  }

  /**
   * Provider filtering
   */
  private applyProviderFilter(plans: ElectricityPlan[], selectedProviders: string[]): ElectricityPlan[] {
    if (selectedProviders.length === 0) return plans;
    return plans.filter(plan => selectedProviders.includes(plan.providerName));
  }

  /**
   * Provider rating filtering
   */
  private applyProviderRatingFilter(plans: ElectricityPlan[], minRating?: number): ElectricityPlan[] {
    if (minRating === undefined) return plans;
    return plans.filter(plan => plan.providerRating >= minRating);
  }

  /**
   * Required features filtering
   */
  private applyFeaturesFilter(plans: ElectricityPlan[], requiredFeatures: string[]): ElectricityPlan[] {
    if (requiredFeatures.length === 0) return plans;
    return plans.filter(plan => 
      requiredFeatures.every(feature => plan.planFeatures.includes(feature))
    );
  }

  /**
   * Promotions filtering
   */
  private applyPromotionsFilter(plans: ElectricityPlan[], includePromotions: boolean): ElectricityPlan[] {
    if (includePromotions) return plans;
    return plans.filter(plan => !plan.promotionalOffers || plan.promotionalOffers.length === 0);
  }

  /**
   * Early termination fee filtering
   */
  private applyEarlyTerminationFeeFilter(plans: ElectricityPlan[], excludeETF: boolean): ElectricityPlan[] {
    if (!excludeETF) return plans;
    return plans.filter(plan => plan.earlyTerminationFee === 0);
  }

  /**
   * Apply sorting to plans
   */
  private applySorting(plans: ElectricityPlan[], sortBy: string, sortOrder: 'asc' | 'desc'): ElectricityPlan[] {
    const sortedPlans = [...plans];
    const modifier = sortOrder === 'desc' ? -1 : 1;

    sortedPlans.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'price':
          comparison = (a.baseRate - b.baseRate) * modifier;
          break;
        case 'rating':
          comparison = (a.providerRating - b.providerRating) * modifier;
          break;
        case 'contract':
          comparison = (a.contractLength - b.contractLength) * modifier;
          break;
        case 'provider':
          comparison = a.providerName.localeCompare(b.providerName) * modifier;
          break;
        case 'green':
          comparison = (a.greenEnergyPercentage - b.greenEnergyPercentage) * modifier;
          break;
        default:
          // Default to price sorting
          comparison = (a.baseRate - b.baseRate) * modifier;
      }

      // Secondary sort by plan name for consistency
      if (comparison === 0) {
        comparison = a.planName.localeCompare(b.planName);
      }

      return comparison;
    });

    return sortedPlans;
  }

  /**
   * Generate filter counts for UI indicators (FR-004)
   */
  private generateFilterCounts(plans: ElectricityPlan[]): { [key: string]: number } {
    const counts: { [key: string]: number } = {};

    // Contract length counts
    const contractCounts: { [key: number]: number } = {};
    plans.forEach(plan => {
      contractCounts[plan.contractLength] = (contractCounts[plan.contractLength] || 0) + 1;
    });
    Object.entries(contractCounts).forEach(([length, count]) => {
      counts[`${length}-month`] = count;
    });

    // Rate type counts
    const rateTypeCounts: { [key: string]: number } = {};
    plans.forEach(plan => {
      rateTypeCounts[plan.rateType] = (rateTypeCounts[plan.rateType] || 0) + 1;
    });
    Object.entries(rateTypeCounts).forEach(([type, count]) => {
      counts[`${type}-rate`] = count;
    });

    // Provider counts
    const providerCounts: { [key: string]: number } = {};
    plans.forEach(plan => {
      const providerKey = plan.providerName.toLowerCase().replace(/\s+/g, '-');
      providerCounts[providerKey] = (providerCounts[providerKey] || 0) + 1;
    });
    Object.entries(providerCounts).forEach(([provider, count]) => {
      counts[provider] = count;
    });

    // Green energy categories
    let greenPlansCount = 0;
    let highGreenPlansCount = 0;
    plans.forEach(plan => {
      if (plan.greenEnergyPercentage > 0) greenPlansCount++;
      if (plan.greenEnergyPercentage >= 50) highGreenPlansCount++;
    });
    counts['green-energy'] = greenPlansCount;
    counts['high-green-energy'] = highGreenPlansCount;

    // No deposit plans
    const noDepositCount = plans.filter(plan => 
      plan.planFeatures.some(feature => feature.toLowerCase().includes('no deposit'))
    ).length;
    counts['no-deposit'] = noDepositCount;

    // No ETF plans
    const noETFCount = plans.filter(plan => plan.earlyTerminationFee === 0).length;
    counts['no-etf'] = noETFCount;

    return counts;
  }

  /**
   * Get smart filter suggestions for zero results (FR-011)
   */
  generateSuggestions(filters: PlanFilter): Array<{
    filterCategory: string;
    suggestion: string;
    expectedResults: number;
    priority: 'high' | 'medium' | 'low';
    action: 'increase' | 'decrease' | 'remove' | 'add';
  }> {
    const suggestions = [];

    // Test each filter removal to see impact
    if (filters.contractLengths.length > 0) {
      const withoutContractFilter = { ...filters, contractLengths: [] };
      const results = this.applyFilters(withoutContractFilter);
      if (results.filteredPlans.length > 0) {
        suggestions.push({
          filterCategory: 'contractLengths',
          suggestion: `Include additional contract lengths (${results.filteredPlans.length} more plans available)`,
          expectedResults: results.filteredPlans.length,
          priority: 'high' as const,
          action: 'add' as const
        });
      }
    }

    // Price range suggestions
    if (filters.maxRate !== undefined && filters.maxRate < 15) {
      const relaxedPriceFilter = { ...filters, maxRate: filters.maxRate + 2 };
      const results = this.applyFilters(relaxedPriceFilter);
      if (results.filteredPlans.length > 0) {
        suggestions.push({
          filterCategory: 'maxRate',
          suggestion: `Increase maximum rate to $${(filters.maxRate + 2).toFixed(1)}/kWh`,
          expectedResults: results.filteredPlans.length,
          priority: 'high' as const,
          action: 'increase' as const
        });
      }
    }

    // Green energy suggestions
    if (filters.minGreenEnergy !== undefined && filters.minGreenEnergy > 50) {
      const relaxedGreenFilter = { ...filters, minGreenEnergy: 25 };
      const results = this.applyFilters(relaxedGreenFilter);
      if (results.filteredPlans.length > 0) {
        suggestions.push({
          filterCategory: 'minGreenEnergy',
          suggestion: `Lower green energy requirement to 25%`,
          expectedResults: results.filteredPlans.length,
          priority: 'medium' as const,
          action: 'decrease' as const
        });
      }
    }

    // Provider suggestions
    if (filters.selectedProviders.length === 1) {
      const withoutProviderFilter = { ...filters, selectedProviders: [] };
      const results = this.applyFilters(withoutProviderFilter);
      if (results.filteredPlans.length > 0) {
        suggestions.push({
          filterCategory: 'selectedProviders',
          suggestion: 'Include plans from all providers',
          expectedResults: results.filteredPlans.length,
          priority: 'medium' as const,
          action: 'remove' as const
        });
      }
    }

    // Rate type suggestions
    if (filters.rateTypes.length === 1) {
      const allRateTypes = { ...filters, rateTypes: ['fixed', 'variable', 'indexed'] };
      const results = this.applyFilters(allRateTypes);
      if (results.filteredPlans.length > 0) {
        suggestions.push({
          filterCategory: 'rateTypes',
          suggestion: 'Include all rate types (fixed, variable, indexed)',
          expectedResults: results.filteredPlans.length,
          priority: 'low' as const,
          action: 'add' as const
        });
      }
    }

    // Sort by priority and expected results
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.expectedResults - a.expectedResults;
    });
  }

  /**
   * Find nearby matching plans when exact filters yield zero results
   */
  findNearbyPlans(filters: PlanFilter, maxResults: number = 5): ElectricityPlan[] {
    // Create a relaxed version of filters
    const relaxedFilters: PlanFilter = { ...filters };

    // Relax price range by 20%
    if (relaxedFilters.maxRate) {
      relaxedFilters.maxRate = relaxedFilters.maxRate * 1.2;
    }
    if (relaxedFilters.minRate) {
      relaxedFilters.minRate = relaxedFilters.minRate * 0.8;
    }

    // Relax green energy requirement by 25%
    if (relaxedFilters.minGreenEnergy && relaxedFilters.minGreenEnergy > 25) {
      relaxedFilters.minGreenEnergy = Math.max(0, relaxedFilters.minGreenEnergy - 25);
    }

    // Include adjacent contract lengths
    if (relaxedFilters.contractLengths.length > 0) {
      const validLengths = [1, 6, 12, 24, 36];
      const expandedLengths = new Set(relaxedFilters.contractLengths);
      
      relaxedFilters.contractLengths.forEach(length => {
        const index = validLengths.indexOf(length);
        if (index > 0) expandedLengths.add(validLengths[index - 1]);
        if (index < validLengths.length - 1) expandedLengths.add(validLengths[index + 1]);
      });
      
      relaxedFilters.contractLengths = Array.from(expandedLengths);
    }

    const results = this.applyFilters(relaxedFilters);
    
    // Sort by similarity to original criteria and return top matches
    return results.filteredPlans
      .slice(0, maxResults)
      .sort((a, b) => {
        // Prefer plans closer to original price range
        const originalMaxRate = filters.maxRate || 20;
        const aPriceDistance = Math.abs(a.baseRate - originalMaxRate);
        const bPriceDistance = Math.abs(b.baseRate - originalMaxRate);
        
        return aPriceDistance - bPriceDistance;
      });
  }

  /**
   * Performance monitoring
   */
  getPerformanceMetrics(): {
    lastFilterTime: number;
    averageFilterTime: number;
    performanceGrade: 'excellent' | 'good' | 'poor';
  } {
    const excellent = this.lastFilterTime < 100;
    const good = this.lastFilterTime < 300;
    
    return {
      lastFilterTime: this.lastFilterTime,
      averageFilterTime: this.lastFilterTime, // In real implementation, track rolling average
      performanceGrade: excellent ? 'excellent' : good ? 'good' : 'poor'
    };
  }
}