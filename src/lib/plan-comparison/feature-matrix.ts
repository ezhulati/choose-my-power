// T024: Feature comparison matrix
// Visual feature comparison for side-by-side plan analysis (FR-006, FR-009)

import type { ElectricityPlan } from '../types/electricity-plan';

export interface FeatureCategory {
  id: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  icon?: string;
}

export interface FeatureComparison {
  categoryId: string;
  categoryName: string;
  feature: string;
  planValues: FeaturePlanValue[];
  analysisType: 'boolean' | 'numeric' | 'text' | 'rating';
  displayFormat: 'check' | 'text' | 'badge' | 'rating' | 'currency' | 'percentage';
  importance: 'critical' | 'important' | 'nice-to-have';
  helpText?: string;
}

export interface FeaturePlanValue {
  planId: string;
  planName: string;
  value: boolean | number | string;
  displayValue: string;
  isHighlight: boolean; // True if this is the best value in comparison
  hasValue: boolean; // True if plan offers this feature
  warningLevel?: 'none' | 'caution' | 'warning';
  tooltip?: string;
}

export interface FeatureMatrix {
  plans: ElectricityPlan[];
  categories: FeatureCategory[];
  comparisons: FeatureComparison[];
  summary: {
    totalFeatures: number;
    sharedFeatures: number;
    uniqueFeatures: { [planId: string]: number };
    bestOverall?: string; // Plan ID with best feature score
    featureLeaders: { [categoryId: string]: string }; // Plan ID that leads in each category
  };
  generatedAt: Date;
  settings: {
    showOnlyDifferences: boolean;
    highlightBestValues: boolean;
    includeAllFeatures: boolean;
    priorityFilter: 'all' | 'high' | 'high-medium';
  };
}

export class FeatureMatrixBuilder {
  private readonly STANDARD_CATEGORIES: FeatureCategory[] = [
    {
      id: 'pricing',
      name: 'Pricing & Fees',
      description: 'Rate structure, fees, and cost components',
      priority: 'high',
      icon: 'dollar-sign'
    },
    {
      id: 'contract',
      name: 'Contract Terms',
      description: 'Contract length, termination, and flexibility',
      priority: 'high',
      icon: 'file-text'
    },
    {
      id: 'green-energy',
      name: 'Green Energy',
      description: 'Renewable energy content and environmental impact',
      priority: 'medium',
      icon: 'leaf'
    },
    {
      id: 'billing',
      name: 'Billing & Payments',
      description: 'Payment options, billing features, and account management',
      priority: 'medium',
      icon: 'credit-card'
    },
    {
      id: 'customer-service',
      name: 'Customer Service',
      description: 'Support availability, ratings, and communication options',
      priority: 'medium',
      icon: 'headphones'
    },
    {
      id: 'promotions',
      name: 'Promotions & Rewards',
      description: 'Special offers, rewards programs, and incentives',
      priority: 'low',
      icon: 'gift'
    },
    {
      id: 'features',
      name: 'Plan Features',
      description: 'Special plan characteristics and additional services',
      priority: 'low',
      icon: 'star'
    }
  ];

  /**
   * Build comprehensive feature matrix for plan comparison
   */
  buildMatrix(
    plans: ElectricityPlan[],
    settings: Partial<FeatureMatrix['settings']> = {}
  ): FeatureMatrix {
    if (plans.length === 0) {
      throw new Error('At least one plan is required to build feature matrix');
    }

    const matrixSettings: FeatureMatrix['settings'] = {
      showOnlyDifferences: false,
      highlightBestValues: true,
      includeAllFeatures: true,
      priorityFilter: 'all',
      ...settings
    };

    // Build comparisons for each category
    const comparisons = this.buildCategoryComparisons(plans, matrixSettings);

    // Filter comparisons based on settings
    const filteredComparisons = this.filterComparisons(comparisons, matrixSettings);

    // Generate summary statistics
    const summary = this.generateSummary(plans, filteredComparisons);

    return {
      plans,
      categories: this.getRelevantCategories(filteredComparisons),
      comparisons: filteredComparisons,
      summary,
      generatedAt: new Date(),
      settings: matrixSettings
    };
  }

  /**
   * Build comparisons for all feature categories
   */
  private buildCategoryComparisons(
    plans: ElectricityPlan[],
    settings: FeatureMatrix['settings']
  ): FeatureComparison[] {
    const comparisons: FeatureComparison[] = [];

    // Pricing & Fees category
    comparisons.push(...this.buildPricingComparisons(plans));
    
    // Contract Terms category
    comparisons.push(...this.buildContractComparisons(plans));
    
    // Green Energy category
    comparisons.push(...this.buildGreenEnergyComparisons(plans));
    
    // Billing & Payments category
    comparisons.push(...this.buildBillingComparisons(plans));
    
    // Customer Service category
    comparisons.push(...this.buildCustomerServiceComparisons(plans));
    
    // Promotions & Rewards category
    comparisons.push(...this.buildPromotionsComparisons(plans));
    
    // Plan Features category
    comparisons.push(...this.buildPlanFeaturesComparisons(plans));

    return comparisons;
  }

  /**
   * Build pricing and fees comparisons
   */
  private buildPricingComparisons(plans: ElectricityPlan[]): FeatureComparison[] {
    const comparisons: FeatureComparison[] = [];

    // Base rate comparison
    const baseRates = plans.map(plan => plan.baseRate);
    const minRate = Math.min(...baseRates);
    comparisons.push({
      categoryId: 'pricing',
      categoryName: 'Pricing & Fees',
      feature: 'Base Electricity Rate',
      planValues: plans.map(plan => ({
        planId: plan.id,
        planName: plan.planName,
        value: plan.baseRate,
        displayValue: `${plan.baseRate.toFixed(2)}¢/kWh`,
        isHighlight: plan.baseRate === minRate,
        hasValue: true,
        warningLevel: plan.baseRate > minRate * 1.2 ? 'warning' : 'none',
        tooltip: `${plan.rateType} rate`
      })),
      analysisType: 'numeric',
      displayFormat: 'text',
      importance: 'critical',
      helpText: 'The rate you pay per kilowatt-hour of electricity used'
    });

    // Monthly fee comparison
    const monthlyFees = plans.map(plan => plan.monthlyFee);
    const minFee = Math.min(...monthlyFees);
    comparisons.push({
      categoryId: 'pricing',
      categoryName: 'Pricing & Fees',
      feature: 'Monthly Service Fee',
      planValues: plans.map(plan => ({
        planId: plan.id,
        planName: plan.planName,
        value: plan.monthlyFee,
        displayValue: plan.monthlyFee === 0 ? 'No Fee' : `$${plan.monthlyFee.toFixed(2)}`,
        isHighlight: plan.monthlyFee === minFee,
        hasValue: true,
        warningLevel: plan.monthlyFee > 15 ? 'caution' : 'none'
      })),
      analysisType: 'numeric',
      displayFormat: 'currency',
      importance: 'important',
      helpText: 'Fixed monthly fee charged regardless of usage'
    });

    // Connection fee comparison
    const connectionFees = plans.map(plan => plan.connectionFee);
    const minConnectFee = Math.min(...connectionFees);
    comparisons.push({
      categoryId: 'pricing',
      categoryName: 'Pricing & Fees',
      feature: 'Connection Fee',
      planValues: plans.map(plan => ({
        planId: plan.id,
        planName: plan.planName,
        value: plan.connectionFee,
        displayValue: plan.connectionFee === 0 ? 'No Fee' : `$${plan.connectionFee.toFixed(2)}`,
        isHighlight: plan.connectionFee === minConnectFee,
        hasValue: true,
        warningLevel: plan.connectionFee > 50 ? 'caution' : 'none'
      })),
      analysisType: 'numeric',
      displayFormat: 'currency',
      importance: 'important',
      helpText: 'One-time fee to start service'
    });

    // Rate type comparison
    comparisons.push({
      categoryId: 'pricing',
      categoryName: 'Pricing & Fees',
      feature: 'Rate Type',
      planValues: plans.map(plan => ({
        planId: plan.id,
        planName: plan.planName,
        value: plan.rateType,
        displayValue: this.formatRateType(plan.rateType),
        isHighlight: plan.rateType === 'fixed',
        hasValue: true,
        warningLevel: plan.rateType === 'variable' ? 'caution' : 'none',
        tooltip: this.getRateTypeDescription(plan.rateType)
      })),
      analysisType: 'text',
      displayFormat: 'badge',
      importance: 'critical',
      helpText: 'How your electricity rate is determined'
    });

    return comparisons;
  }

  /**
   * Build contract terms comparisons
   */
  private buildContractComparisons(plans: ElectricityPlan[]): FeatureComparison[] {
    const comparisons: FeatureComparison[] = [];

    // Contract length comparison
    const contractLengths = plans.map(plan => plan.contractLength);
    const shortestContract = Math.min(...contractLengths);
    comparisons.push({
      categoryId: 'contract',
      categoryName: 'Contract Terms',
      feature: 'Contract Length',
      planValues: plans.map(plan => ({
        planId: plan.id,
        planName: plan.planName,
        value: plan.contractLength,
        displayValue: `${plan.contractLength} ${plan.contractLength === 1 ? 'month' : 'months'}`,
        isHighlight: plan.contractLength === shortestContract,
        hasValue: true,
        warningLevel: plan.contractLength > 24 ? 'caution' : 'none'
      })),
      analysisType: 'numeric',
      displayFormat: 'text',
      importance: 'important',
      helpText: 'How long you are committed to this plan'
    });

    // Early termination fee comparison
    const etfFees = plans.map(plan => plan.earlyTerminationFee);
    const minETF = Math.min(...etfFees);
    comparisons.push({
      categoryId: 'contract',
      categoryName: 'Contract Terms',
      feature: 'Early Termination Fee',
      planValues: plans.map(plan => ({
        planId: plan.id,
        planName: plan.planName,
        value: plan.earlyTerminationFee,
        displayValue: plan.earlyTerminationFee === 0 ? 'No Fee' : `$${plan.earlyTerminationFee}`,
        isHighlight: plan.earlyTerminationFee === minETF,
        hasValue: true,
        warningLevel: plan.earlyTerminationFee > 200 ? 'warning' : plan.earlyTerminationFee > 100 ? 'caution' : 'none'
      })),
      analysisType: 'numeric',
      displayFormat: 'currency',
      importance: 'important',
      helpText: 'Fee charged if you cancel before contract expires'
    });

    return comparisons;
  }

  /**
   * Build green energy comparisons
   */
  private buildGreenEnergyComparisons(plans: ElectricityPlan[]): FeatureComparison[] {
    const comparisons: FeatureComparison[] = [];

    // Green energy percentage
    const greenPercentages = plans.map(plan => plan.greenEnergyPercentage);
    const maxGreen = Math.max(...greenPercentages);
    comparisons.push({
      categoryId: 'green-energy',
      categoryName: 'Green Energy',
      feature: 'Renewable Energy Content',
      planValues: plans.map(plan => ({
        planId: plan.id,
        planName: plan.planName,
        value: plan.greenEnergyPercentage,
        displayValue: `${plan.greenEnergyPercentage}%`,
        isHighlight: plan.greenEnergyPercentage === maxGreen && maxGreen > 0,
        hasValue: plan.greenEnergyPercentage > 0,
        warningLevel: 'none'
      })),
      analysisType: 'numeric',
      displayFormat: 'percentage',
      importance: 'nice-to-have',
      helpText: 'Percentage of electricity from renewable sources'
    });

    return comparisons;
  }

  /**
   * Build billing and payments comparisons
   */
  private buildBillingComparisons(plans: ElectricityPlan[]): FeatureComparison[] {
    const comparisons: FeatureComparison[] = [];

    // AutoPay discount
    comparisons.push({
      categoryId: 'billing',
      categoryName: 'Billing & Payments',
      feature: 'AutoPay Discount',
      planValues: plans.map(plan => ({
        planId: plan.id,
        planName: plan.planName,
        value: plan.planFeatures.some(f => f.toLowerCase().includes('autopay')),
        displayValue: plan.planFeatures.some(f => f.toLowerCase().includes('autopay')) ? 'Available' : 'Not Available',
        isHighlight: plan.planFeatures.some(f => f.toLowerCase().includes('autopay')),
        hasValue: plan.planFeatures.some(f => f.toLowerCase().includes('autopay')),
        warningLevel: 'none'
      })),
      analysisType: 'boolean',
      displayFormat: 'check',
      importance: 'nice-to-have',
      helpText: 'Discount for automatic payment enrollment'
    });

    // Payment options
    comparisons.push({
      categoryId: 'billing',
      categoryName: 'Billing & Payments',
      feature: 'Payment Options',
      planValues: plans.map(plan => ({
        planId: plan.id,
        planName: plan.planName,
        value: plan.paymentOptions.length,
        displayValue: plan.paymentOptions.join(', '),
        isHighlight: plan.paymentOptions.length >= 3,
        hasValue: plan.paymentOptions.length > 0,
        warningLevel: plan.paymentOptions.length < 2 ? 'caution' : 'none'
      })),
      analysisType: 'text',
      displayFormat: 'text',
      importance: 'nice-to-have',
      helpText: 'Available methods to pay your bill'
    });

    return comparisons;
  }

  /**
   * Build customer service comparisons
   */
  private buildCustomerServiceComparisons(plans: ElectricityPlan[]): FeatureComparison[] {
    const comparisons: FeatureComparison[] = [];

    // Provider rating
    const ratings = plans.map(plan => plan.providerRating);
    const maxRating = Math.max(...ratings);
    comparisons.push({
      categoryId: 'customer-service',
      categoryName: 'Customer Service',
      feature: 'Provider Rating',
      planValues: plans.map(plan => ({
        planId: plan.id,
        planName: plan.planName,
        value: plan.providerRating,
        displayValue: `${plan.providerRating.toFixed(1)} / 5.0`,
        isHighlight: plan.providerRating === maxRating,
        hasValue: plan.providerRating > 0,
        warningLevel: plan.providerRating < 3.0 ? 'warning' : plan.providerRating < 3.5 ? 'caution' : 'none'
      })),
      analysisType: 'rating',
      displayFormat: 'rating',
      importance: 'important',
      helpText: 'Customer satisfaction rating out of 5 stars'
    });

    // Customer service hours
    comparisons.push({
      categoryId: 'customer-service',
      categoryName: 'Customer Service',
      feature: 'Support Hours',
      planValues: plans.map(plan => ({
        planId: plan.id,
        planName: plan.planName,
        value: plan.customerServiceHours,
        displayValue: plan.customerServiceHours,
        isHighlight: plan.customerServiceHours.includes('24/7'),
        hasValue: true,
        warningLevel: plan.customerServiceHours.includes('business') ? 'caution' : 'none'
      })),
      analysisType: 'text',
      displayFormat: 'text',
      importance: 'nice-to-have',
      helpText: 'When customer support is available'
    });

    return comparisons;
  }

  /**
   * Build promotions comparisons
   */
  private buildPromotionsComparisons(plans: ElectricityPlan[]): FeatureComparison[] {
    const comparisons: FeatureComparison[] = [];

    // Promotional offers
    comparisons.push({
      categoryId: 'promotions',
      categoryName: 'Promotions & Rewards',
      feature: 'Current Promotions',
      planValues: plans.map(plan => ({
        planId: plan.id,
        planName: plan.planName,
        value: plan.promotionalOffers.length,
        displayValue: plan.promotionalOffers.length > 0 
          ? plan.promotionalOffers.join('; ') 
          : 'None',
        isHighlight: plan.promotionalOffers.length > 0,
        hasValue: plan.promotionalOffers.length > 0,
        warningLevel: 'none'
      })),
      analysisType: 'text',
      displayFormat: 'text',
      importance: 'nice-to-have',
      helpText: 'Special offers and promotions currently available'
    });

    return comparisons;
  }

  /**
   * Build plan features comparisons
   */
  private buildPlanFeaturesComparisons(plans: ElectricityPlan[]): FeatureComparison[] {
    const comparisons: FeatureComparison[] = [];

    // Collect all unique features across plans
    const allFeatures = new Set<string>();
    plans.forEach(plan => {
      plan.planFeatures.forEach(feature => allFeatures.add(feature));
    });

    // Create comparison for common features
    const commonFeatures = Array.from(allFeatures).filter(feature => {
      const planCount = plans.filter(plan => plan.planFeatures.includes(feature)).length;
      return planCount >= Math.ceil(plans.length * 0.3); // Feature in 30%+ of plans
    });

    commonFeatures.forEach(feature => {
      comparisons.push({
        categoryId: 'features',
        categoryName: 'Plan Features',
        feature: this.formatFeatureName(feature),
        planValues: plans.map(plan => ({
          planId: plan.id,
          planName: plan.planName,
          value: plan.planFeatures.includes(feature),
          displayValue: plan.planFeatures.includes(feature) ? 'Included' : 'Not Included',
          isHighlight: plan.planFeatures.includes(feature),
          hasValue: plan.planFeatures.includes(feature),
          warningLevel: 'none'
        })),
        analysisType: 'boolean',
        displayFormat: 'check',
        importance: this.getFeatureImportance(feature),
        helpText: this.getFeatureDescription(feature)
      });
    });

    return comparisons;
  }

  /**
   * Filter comparisons based on settings
   */
  private filterComparisons(
    comparisons: FeatureComparison[],
    settings: FeatureMatrix['settings']
  ): FeatureComparison[] {
    let filtered = [...comparisons];

    // Filter by priority
    if (settings.priorityFilter !== 'all') {
      const allowedPriorities = settings.priorityFilter === 'high' 
        ? ['critical'] 
        : ['critical', 'important'];
      filtered = filtered.filter(comp => allowedPriorities.includes(comp.importance));
    }

    // Show only differences
    if (settings.showOnlyDifferences) {
      filtered = filtered.filter(comp => {
        const values = comp.planValues.map(pv => pv.value);
        return new Set(values).size > 1; // More than one unique value
      });
    }

    return filtered;
  }

  /**
   * Get relevant categories based on comparisons
   */
  private getRelevantCategories(comparisons: FeatureComparison[]): FeatureCategory[] {
    const usedCategoryIds = new Set(comparisons.map(comp => comp.categoryId));
    return this.STANDARD_CATEGORIES.filter(cat => usedCategoryIds.has(cat.id));
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(
    plans: ElectricityPlan[],
    comparisons: FeatureComparison[]
  ): FeatureMatrix['summary'] {
    const totalFeatures = comparisons.length;
    
    // Count shared features (features where all plans have the same value)
    const sharedFeatures = comparisons.filter(comp => {
      const values = comp.planValues.map(pv => pv.value);
      return new Set(values).size === 1;
    }).length;

    // Count unique features per plan
    const uniqueFeatures: { [planId: string]: number } = {};
    plans.forEach(plan => {
      uniqueFeatures[plan.id] = comparisons.filter(comp => {
        const planValue = comp.planValues.find(pv => pv.planId === plan.id);
        return planValue?.isHighlight || false;
      }).length;
    });

    // Find best overall plan (most highlights)
    const bestOverall = Object.entries(uniqueFeatures)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    // Find feature leaders by category
    const featureLeaders: { [categoryId: string]: string } = {};
    const categoryGroups = comparisons.reduce((groups, comp) => {
      if (!groups[comp.categoryId]) groups[comp.categoryId] = [];
      groups[comp.categoryId].push(comp);
      return groups;
    }, {} as { [categoryId: string]: FeatureComparison[] });

    Object.entries(categoryGroups).forEach(([categoryId, categoryComps]) => {
      const categoryScores: { [planId: string]: number } = {};
      plans.forEach(plan => {
        categoryScores[plan.id] = categoryComps.filter(comp => {
          const planValue = comp.planValues.find(pv => pv.planId === plan.id);
          return planValue?.isHighlight || false;
        }).length;
      });
      
      featureLeaders[categoryId] = Object.entries(categoryScores)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
    });

    return {
      totalFeatures,
      sharedFeatures,
      uniqueFeatures,
      bestOverall,
      featureLeaders
    };
  }

  /**
   * Utility methods for formatting and descriptions
   */
  private formatRateType(rateType: string): string {
    const typeMap: { [key: string]: string } = {
      'fixed': 'Fixed Rate',
      'variable': 'Variable Rate',
      'indexed': 'Indexed Rate'
    };
    return typeMap[rateType] || rateType;
  }

  private getRateTypeDescription(rateType: string): string {
    const descriptions: { [key: string]: string } = {
      'fixed': 'Rate stays the same throughout your contract',
      'variable': 'Rate can change monthly based on market conditions',
      'indexed': 'Rate tied to market index and changes monthly'
    };
    return descriptions[rateType] || '';
  }

  private formatFeatureName(feature: string): string {
    return feature.charAt(0).toUpperCase() + feature.slice(1);
  }

  private getFeatureImportance(feature: string): 'critical' | 'important' | 'nice-to-have' {
    const lowerFeature = feature.toLowerCase();
    
    if (lowerFeature.includes('no deposit') || 
        lowerFeature.includes('fixed rate') ||
        lowerFeature.includes('autopay')) {
      return 'important';
    }
    
    return 'nice-to-have';
  }

  private getFeatureDescription(feature: string): string {
    const lowerFeature = feature.toLowerCase();
    
    if (lowerFeature.includes('no deposit')) {
      return 'No upfront security deposit required';
    }
    if (lowerFeature.includes('autopay')) {
      return 'Automatic payment discount available';
    }
    if (lowerFeature.includes('online')) {
      return 'Online account management tools';
    }
    
    return `Plan includes ${feature.toLowerCase()}`;
  }

  /**
   * Export matrix data for external use (Excel, CSV, etc.)
   */
  exportMatrixData(matrix: FeatureMatrix): {
    csvData: string;
    jsonData: string;
    summaryData: any;
  } {
    // CSV format
    const headers = ['Feature', ...matrix.plans.map(p => p.planName)];
    const csvRows = [headers.join(',')];
    
    matrix.comparisons.forEach(comp => {
      const row = [
        `"${comp.feature}"`,
        ...comp.planValues.map(pv => `"${pv.displayValue}"`)
      ];
      csvRows.push(row.join(','));
    });
    
    const csvData = csvRows.join('\n');

    // JSON format
    const jsonData = JSON.stringify(matrix, null, 2);

    // Summary data
    const summaryData = {
      planCount: matrix.plans.length,
      featureCount: matrix.comparisons.length,
      categoryCount: matrix.categories.length,
      bestOverall: matrix.summary.bestOverall,
      featureLeaders: matrix.summary.featureLeaders
    };

    return { csvData, jsonData, summaryData };
  }
}

// Export singleton instance
export const featureMatrixBuilder = new FeatureMatrixBuilder();

// Utility functions for matrix operations
export const FeatureMatrixUtils = {
  /**
   * Find plans that excel in specific categories
   */
  findCategoryLeaders(matrix: FeatureMatrix): {
    [categoryId: string]: {
      categoryName: string;
      leader: ElectricityPlan;
      score: number;
    };
  } {
    const leaders: any = {};
    
    matrix.categories.forEach(category => {
      const categoryComparisons = matrix.comparisons.filter(c => c.categoryId === category.id);
      const planScores: { [planId: string]: number } = {};
      
      matrix.plans.forEach(plan => {
        planScores[plan.id] = categoryComparisons.filter(comp => {
          const planValue = comp.planValues.find(pv => pv.planId === plan.id);
          return planValue?.isHighlight || false;
        }).length;
      });
      
      const leaderEntry = Object.entries(planScores)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (leaderEntry) {
        const leaderPlan = matrix.plans.find(p => p.id === leaderEntry[0]);
        if (leaderPlan) {
          leaders[category.id] = {
            categoryName: category.name,
            leader: leaderPlan,
            score: leaderEntry[1]
          };
        }
      }
    });
    
    return leaders;
  },

  /**
   * Get comparison highlights for quick overview
   */
  getComparisonHighlights(matrix: FeatureMatrix): {
    lowestRate: { plan: ElectricityPlan; rate: number };
    lowestFees: { plan: ElectricityPlan; totalFees: number };
    highestRating: { plan: ElectricityPlan; rating: number };
    mostGreen: { plan: ElectricityPlan; percentage: number };
    bestContract: { plan: ElectricityPlan; length: number; etf: number };
  } {
    const rates = matrix.plans.map(p => ({ plan: p, rate: p.baseRate }));
    const fees = matrix.plans.map(p => ({ 
      plan: p, 
      totalFees: p.monthlyFee + p.connectionFee 
    }));
    const ratings = matrix.plans.map(p => ({ plan: p, rating: p.providerRating }));
    const green = matrix.plans.map(p => ({ plan: p, percentage: p.greenEnergyPercentage }));
    const contracts = matrix.plans.map(p => ({ 
      plan: p, 
      length: p.contractLength,
      etf: p.earlyTerminationFee
    }));

    return {
      lowestRate: rates.sort((a, b) => a.rate - b.rate)[0],
      lowestFees: fees.sort((a, b) => a.totalFees - b.totalFees)[0],
      highestRating: ratings.sort((a, b) => b.rating - a.rating)[0],
      mostGreen: green.sort((a, b) => b.percentage - a.percentage)[0],
      bestContract: contracts.sort((a, b) => (a.length + a.etf/100) - (b.length + b.etf/100))[0]
    };
  }
};