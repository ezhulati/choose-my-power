// T023: Cost analysis calculations
// Comprehensive cost analysis for transparent plan comparison (FR-009, FR-011)

import type { ElectricityPlan } from '../types/electricity-plan';

export interface CostAnalysisSettings {
  monthlyUsageKwh: number;
  analysisMonths: number;
  includePromotions: boolean;
  includeConnectFees: boolean;
  taxRate: number; // Texas electricity tax rate (typically 0% for residential)
}

export interface CostBreakdown {
  energyCost: number;
  monthlyFee: number;
  connectionFee: number;
  earlyTerminationFee: number;
  promotionalSavings: number;
  taxes: number;
  totalCost: number;
}

export interface MonthlyProjection {
  month: number;
  energyUsage: number;
  baseEnergyCost: number;
  monthlyFees: number;
  promotionalSavings: number;
  netMonthlyCost: number;
  cumulativeCost: number;
}

export interface CostAnalysisResult {
  planId: string;
  planName: string;
  providerName: string;
  settings: CostAnalysisSettings;
  
  // Summary metrics
  totalCost: number;
  averageMonthlyCost: number;
  effectiveRate: number; // Total cost / total kWh consumed
  
  // Detailed breakdown
  breakdown: CostBreakdown;
  monthlyProjections: MonthlyProjection[];
  
  // Comparison metrics
  costPerKwh: number;
  firstYearTotal: number;
  breakEvenMonth?: number; // For promotional plans
  
  // Savings analysis
  potentialSavings: number; // Compared to average market rate
  costRank: number; // 1 = most expensive, populated by comparison
  
  // Analysis metadata
  calculatedAt: Date;
  isEstimate: boolean;
  assumptions: string[];
  disclaimers: string[];
}

export interface ComparisonAnalysis {
  plans: CostAnalysisResult[];
  settings: CostAnalysisSettings;
  summary: {
    lowestCost: CostAnalysisResult;
    highestCost: CostAnalysisResult;
    averageCost: number;
    costSpread: number;
    bestValue?: CostAnalysisResult; // Best cost/feature ratio
  };
  insights: {
    shortTermBest: CostAnalysisResult; // Best for first 6 months
    longTermBest: CostAnalysisResult; // Best for full contract term
    promotionalWinners: CostAnalysisResult[]; // Plans with significant promo savings
    stablePricing: CostAnalysisResult[]; // Plans with minimal rate variability
  };
  updatedAt: Date;
}

export class CostAnalysisEngine {
  private readonly DEFAULT_SETTINGS: CostAnalysisSettings = {
    monthlyUsageKwh: 1000, // Texas average residential usage
    analysisMonths: 12,
    includePromotions: true,
    includeConnectFees: true,
    taxRate: 0.0 // Texas has no electricity tax for residential
  };

  private readonly TEXAS_AVERAGE_RATE = 12.8; // cents per kWh (2024 average)

  /**
   * Analyze single plan costs with detailed breakdown
   */
  analyzePlan(plan: ElectricityPlan, settings?: Partial<CostAnalysisSettings>): CostAnalysisResult {
    const analysisSettings = { ...this.DEFAULT_SETTINGS, ...settings };
    const assumptions: string[] = [];
    const disclaimers: string[] = [];

    // Validate plan data
    if (!plan.baseRate || plan.baseRate <= 0) {
      throw new Error(`Invalid base rate for plan ${plan.planName}: ${plan.baseRate}`);
    }

    // Calculate total energy consumption
    const totalKwh = analysisSettings.monthlyUsageKwh * analysisSettings.analysisMonths;
    
    // Base energy cost calculation
    const baseEnergyCost = this.calculateEnergyCost(plan, totalKwh, analysisSettings);
    
    // Monthly fees over analysis period
    const totalMonthlyFees = plan.monthlyFee * analysisSettings.analysisMonths;
    
    // One-time connection fee
    const connectionFee = analysisSettings.includeConnectFees ? plan.connectionFee : 0;
    
    // Promotional savings calculation
    const promotionalSavings = this.calculatePromotionalSavings(plan, analysisSettings);
    
    // Tax calculation (typically 0 in Texas for residential)
    const subtotal = baseEnergyCost + totalMonthlyFees + connectionFee - promotionalSavings;
    const taxes = subtotal * analysisSettings.taxRate;
    
    // Total cost
    const totalCost = subtotal + taxes;
    const averageMonthlyCost = totalCost / analysisSettings.analysisMonths;
    const effectiveRate = (totalCost / totalKwh) * 100; // Convert to cents per kWh

    // Generate monthly projections
    const monthlyProjections = this.generateMonthlyProjections(plan, analysisSettings, promotionalSavings);

    // Cost breakdown
    const breakdown: CostBreakdown = {
      energyCost: baseEnergyCost,
      monthlyFee: totalMonthlyFees,
      connectionFee,
      earlyTerminationFee: plan.earlyTerminationFee, // Not included in total unless terminated
      promotionalSavings,
      taxes,
      totalCost
    };

    // Determine break-even month for promotional plans
    const breakEvenMonth = this.calculateBreakEvenMonth(plan, analysisSettings, promotionalSavings);

    // Calculate potential savings vs market average
    const marketBaseline = this.TEXAS_AVERAGE_RATE * totalKwh / 100;
    const potentialSavings = Math.max(0, marketBaseline - totalCost);

    // Add assumptions and disclaimers
    assumptions.push(`Monthly usage: ${analysisSettings.monthlyUsageKwh} kWh`);
    assumptions.push(`Analysis period: ${analysisSettings.analysisMonths} months`);
    if (plan.rateType === 'variable') {
      assumptions.push('Variable rates may change - calculation uses current rate');
      disclaimers.push('Actual costs may vary with rate changes');
    }
    if (promotionalSavings > 0) {
      assumptions.push('Promotional offers applied as advertised');
    }

    return {
      planId: plan.id,
      planName: plan.planName,
      providerName: plan.providerName,
      settings: analysisSettings,
      totalCost: Math.round(totalCost * 100) / 100,
      averageMonthlyCost: Math.round(averageMonthlyCost * 100) / 100,
      effectiveRate: Math.round(effectiveRate * 100) / 100,
      breakdown,
      monthlyProjections,
      costPerKwh: plan.baseRate,
      firstYearTotal: analysisSettings.analysisMonths === 12 ? totalCost : this.calculateYearlyTotal(plan, analysisSettings),
      breakEvenMonth,
      potentialSavings: Math.round(potentialSavings * 100) / 100,
      costRank: 1, // Will be set by comparison analysis
      calculatedAt: new Date(),
      isEstimate: plan.rateType === 'variable' || promotionalSavings > 0,
      assumptions,
      disclaimers
    };
  }

  /**
   * Compare multiple plans with comprehensive analysis
   */
  comparePlans(plans: ElectricityPlan[], settings?: Partial<CostAnalysisSettings>): ComparisonAnalysis {
    if (plans.length === 0) {
      throw new Error('At least one plan is required for comparison');
    }

    const analysisSettings = { ...this.DEFAULT_SETTINGS, ...settings };
    const analyses = plans.map(plan => this.analyzePlan(plan, analysisSettings));

    // Sort by total cost and assign rankings
    const sortedByCost = [...analyses].sort((a, b) => a.totalCost - b.totalCost);
    sortedByCost.forEach((analysis, index) => {
      analysis.costRank = index + 1;
    });

    // Calculate summary metrics
    const totalCosts = analyses.map(a => a.totalCost);
    const lowestCost = sortedByCost[0];
    const highestCost = sortedByCost[sortedByCost.length - 1];
    const averageCost = totalCosts.reduce((sum, cost) => sum + cost, 0) / totalCosts.length;
    const costSpread = highestCost.totalCost - lowestCost.totalCost;

    // Find best value (cost efficiency considering features)
    const bestValue = this.findBestValuePlan(analyses);

    // Generate insights
    const insights = this.generateInsights(analyses, analysisSettings);

    return {
      plans: analyses,
      settings: analysisSettings,
      summary: {
        lowestCost,
        highestCost,
        averageCost: Math.round(averageCost * 100) / 100,
        costSpread: Math.round(costSpread * 100) / 100,
        bestValue
      },
      insights,
      updatedAt: new Date()
    };
  }

  /**
   * Calculate energy cost considering rate structure
   */
  private calculateEnergyCost(plan: ElectricityPlan, totalKwh: number, settings: CostAnalysisSettings): number {
    // For indexed plans, add risk premium to base rate
    let effectiveRate = plan.baseRate;
    if (plan.rateType === 'indexed') {
      effectiveRate += 0.5; // Add 0.5¢ risk premium for indexed rate volatility
    }

    // Basic calculation (most Texas plans use simple per-kWh pricing)
    return (effectiveRate / 100) * totalKwh;
  }

  /**
   * Calculate promotional savings over analysis period
   */
  private calculatePromotionalSavings(plan: ElectricityPlan, settings: CostAnalysisSettings): number {
    if (!settings.includePromotions || plan.promotionalOffers.length === 0) {
      return 0;
    }

    let totalSavings = 0;

    plan.promotionalOffers.forEach(offer => {
      const offerLower = offer.toLowerCase();
      
      // Free month promotions
      if (offerLower.includes('first month free') || offerLower.includes('1 month free')) {
        const monthlyCost = (settings.monthlyUsageKwh * plan.baseRate / 100) + plan.monthlyFee;
        totalSavings += monthlyCost;
      }
      
      // Free weekend electricity
      if (offerLower.includes('free weekends') || offerLower.includes('weekend free')) {
        // Assume 30% of usage is on weekends
        const weekendSavings = (settings.monthlyUsageKwh * 0.3 * plan.baseRate / 100) * settings.analysisMonths;
        totalSavings += weekendSavings;
      }
      
      // Free nights (9PM-6AM typically)
      if (offerLower.includes('free nights') || offerLower.includes('night free')) {
        // Assume 40% of usage is at night
        const nightSavings = (settings.monthlyUsageKwh * 0.4 * plan.baseRate / 100) * settings.analysisMonths;
        totalSavings += nightSavings;
      }
      
      // Bill credit promotions
      const creditMatch = offerLower.match(/\$(\d+).*credit/);
      if (creditMatch) {
        totalSavings += parseInt(creditMatch[1], 10);
      }
      
      // Percentage discounts
      const percentMatch = offerLower.match(/(\d+)%.*off|(\d+)%.*discount/);
      if (percentMatch) {
        const discount = parseInt(percentMatch[1] || percentMatch[2], 10) / 100;
        const discountMonths = Math.min(6, settings.analysisMonths); // Usually limited to 6 months
        const baseCost = (settings.monthlyUsageKwh * plan.baseRate / 100) * discountMonths;
        totalSavings += baseCost * discount;
      }
    });

    return totalSavings;
  }

  /**
   * Generate monthly cost projections
   */
  private generateMonthlyProjections(
    plan: ElectricityPlan, 
    settings: CostAnalysisSettings,
    totalPromotionalSavings: number
  ): MonthlyProjection[] {
    const projections: MonthlyProjection[] = [];
    let cumulativeCost = 0;
    
    // Distribute promotional savings across eligible months
    const promoMonths = Math.min(6, settings.analysisMonths); // Most promos limited to 6 months
    const monthlyPromoSavings = totalPromotionalSavings / promoMonths;

    for (let month = 1; month <= settings.analysisMonths; month++) {
      const energyUsage = settings.monthlyUsageKwh;
      const baseEnergyCost = (energyUsage * plan.baseRate) / 100;
      const monthlyFees = plan.monthlyFee;
      const promotionalSavings = month <= promoMonths ? monthlyPromoSavings : 0;
      
      const netMonthlyCost = baseEnergyCost + monthlyFees - promotionalSavings;
      cumulativeCost += netMonthlyCost;

      projections.push({
        month,
        energyUsage,
        baseEnergyCost: Math.round(baseEnergyCost * 100) / 100,
        monthlyFees: Math.round(monthlyFees * 100) / 100,
        promotionalSavings: Math.round(promotionalSavings * 100) / 100,
        netMonthlyCost: Math.round(netMonthlyCost * 100) / 100,
        cumulativeCost: Math.round(cumulativeCost * 100) / 100
      });
    }

    return projections;
  }

  /**
   * Calculate break-even month for promotional plans
   */
  private calculateBreakEvenMonth(
    plan: ElectricityPlan,
    settings: CostAnalysisSettings, 
    promotionalSavings: number
  ): number | undefined {
    if (promotionalSavings === 0) return undefined;

    // Find when cumulative costs without promo equal cumulative costs with promo
    const monthlyCostWithoutPromo = (settings.monthlyUsageKwh * plan.baseRate / 100) + plan.monthlyFee;
    const promoMonths = Math.min(6, settings.analysisMonths);
    const monthlyPromoSavings = promotionalSavings / promoMonths;

    for (let month = promoMonths + 1; month <= settings.analysisMonths; month++) {
      const costWithPromo = (promoMonths * (monthlyCostWithoutPromo - monthlyPromoSavings)) + 
                           ((month - promoMonths) * monthlyCostWithoutPromo);
      const costWithoutPromo = month * monthlyCostWithoutPromo;

      if (costWithPromo >= costWithoutPromo) {
        return month;
      }
    }

    return undefined; // Promotional plan remains cheaper throughout analysis period
  }

  /**
   * Calculate yearly total for non-12-month analyses
   */
  private calculateYearlyTotal(plan: ElectricityPlan, settings: CostAnalysisSettings): number {
    const yearlySettings = { ...settings, analysisMonths: 12 };
    const yearlyAnalysis = this.analyzePlan(plan, yearlySettings);
    return yearlyAnalysis.totalCost;
  }

  /**
   * Find best value plan considering cost and features
   */
  private findBestValuePlan(analyses: CostAnalysisResult[]): CostAnalysisResult | undefined {
    if (analyses.length === 0) return undefined;

    // Score plans based on cost efficiency and features
    const scoredPlans = analyses.map(analysis => {
      const plan = analyses.find(a => a.planId === analysis.planId);
      if (!plan) return { analysis, score: 0 };

      let score = 0;
      
      // Cost efficiency (30% weight) - inverse relationship
      const maxCost = Math.max(...analyses.map(a => a.totalCost));
      const costEfficiency = (maxCost - analysis.totalCost) / maxCost;
      score += costEfficiency * 0.3;

      // Rate stability (20% weight)
      if (analysis.planName.toLowerCase().includes('fixed')) {
        score += 0.2;
      }

      // Green energy (15% weight)
      // Would need access to plan data for green energy percentage
      
      // Low fees (15% weight)
      const avgMonthlyFee = analyses.reduce((sum, a) => sum + a.breakdown.monthlyFee, 0) / analyses.length;
      if (analysis.breakdown.monthlyFee < avgMonthlyFee) {
        score += 0.15;
      }

      // No early termination fee (10% weight)
      if (analysis.breakdown.earlyTerminationFee === 0) {
        score += 0.1;
      }

      // Promotional value (10% weight)
      if (analysis.breakdown.promotionalSavings > 0) {
        score += 0.1;
      }

      return { analysis, score };
    });

    return scoredPlans.sort((a, b) => b.score - a.score)[0]?.analysis;
  }

  /**
   * Generate insights for comparison analysis
   */
  private generateInsights(analyses: CostAnalysisResult[], settings: CostAnalysisSettings): ComparisonAnalysis['insights'] {
    const sortedByCost = [...analyses].sort((a, b) => a.totalCost - b.totalCost);
    
    // Short-term best (first 6 months)
    let shortTermBest = sortedByCost[0];
    if (settings.analysisMonths >= 6) {
      const shortTermAnalyses = analyses.map(analysis => {
        const shortTermCost = analysis.monthlyProjections
          .slice(0, 6)
          .reduce((sum, proj) => sum + proj.netMonthlyCost, 0);
        return { ...analysis, shortTermCost };
      });
      shortTermBest = shortTermAnalyses.sort((a, b) => a.shortTermCost - b.shortTermCost)[0];
    }

    // Long-term best (full contract)
    const longTermBest = sortedByCost[0];

    // Promotional winners (significant savings from promotions)
    const promotionalWinners = analyses
      .filter(a => a.breakdown.promotionalSavings > 50) // $50+ in savings
      .sort((a, b) => b.breakdown.promotionalSavings - a.breakdown.promotionalSavings);

    // Stable pricing (fixed rates with low fees)
    const stablePricing = analyses
      .filter(a => 
        a.planName.toLowerCase().includes('fixed') && 
        a.breakdown.monthlyFee < 10 &&
        a.breakdown.earlyTerminationFee === 0
      )
      .sort((a, b) => a.totalCost - b.totalCost);

    return {
      shortTermBest,
      longTermBest,
      promotionalWinners,
      stablePricing
    };
  }

  /**
   * Calculate usage scenario analysis (low, medium, high usage)
   */
  calculateUsageScenarios(plan: ElectricityPlan): {
    lowUsage: CostAnalysisResult;    // 500 kWh/month
    mediumUsage: CostAnalysisResult; // 1000 kWh/month  
    highUsage: CostAnalysisResult;   // 2000 kWh/month
  } {
    return {
      lowUsage: this.analyzePlan(plan, { monthlyUsageKwh: 500 }),
      mediumUsage: this.analyzePlan(plan, { monthlyUsageKwh: 1000 }),
      highUsage: this.analyzePlan(plan, { monthlyUsageKwh: 2000 })
    };
  }

  /**
   * Generate cost comparison chart data
   */
  generateChartData(comparison: ComparisonAnalysis): {
    monthlyComparison: Array<{
      month: number;
      [planName: string]: number;
    }>;
    costBreakdown: Array<{
      planName: string;
      energyCost: number;
      monthlyFees: number;
      promotionalSavings: number;
      totalCost: number;
    }>;
  } {
    const monthlyData: Array<{ month: number; [planName: string]: number }> = [];
    const maxMonths = Math.max(...comparison.plans.map(p => p.monthlyProjections.length));

    for (let month = 1; month <= maxMonths; month++) {
      const monthData: unknown = { month };
      comparison.plans.forEach(plan => {
        const projection = plan.monthlyProjections.find(p => p.month === month);
        monthData[plan.planName] = projection ? projection.cumulativeCost : 0;
      });
      monthlyData.push(monthData);
    }

    const breakdownData = comparison.plans.map(plan => ({
      planName: plan.planName,
      energyCost: plan.breakdown.energyCost,
      monthlyFees: plan.breakdown.monthlyFee,
      promotionalSavings: -plan.breakdown.promotionalSavings, // Negative for chart display
      totalCost: plan.breakdown.totalCost
    }));

    return {
      monthlyComparison: monthlyData,
      costBreakdown: breakdownData
    };
  }
}

// Export singleton instance
export const costAnalysisEngine = new CostAnalysisEngine();

// Utility functions for common calculations
export const CostAnalysisUtils = {
  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },

  /**
   * Format rate for display (cents per kWh)
   */
  formatRate(rate: number): string {
    return `${rate.toFixed(2)}¢/kWh`;
  },

  /**
   * Calculate savings percentage
   */
  calculateSavingsPercentage(actualCost: number, comparisonCost: number): number {
    if (comparisonCost === 0) return 0;
    return Math.round(((comparisonCost - actualCost) / comparisonCost) * 10000) / 100;
  },

  /**
   * Determine if plan has significant promotional value
   */
  hasSignificantPromoValue(analysis: CostAnalysisResult): boolean {
    return analysis.breakdown.promotionalSavings > 50 || 
           (analysis.breakdown.promotionalSavings / analysis.totalCost) > 0.05; // 5%+ savings
  },

  /**
   * Get cost level description
   */
  getCostLevelDescription(analysis: CostAnalysisResult, comparison: ComparisonAnalysis): string {
    const costRank = analysis.costRank;
    const totalPlans = comparison.plans.length;
    
    if (costRank === 1) return 'Lowest Cost';
    if (costRank === totalPlans) return 'Highest Cost';
    if (costRank <= Math.ceil(totalPlans / 3)) return 'Low Cost';
    if (costRank <= Math.ceil(2 * totalPlans / 3)) return 'Moderate Cost';
    return 'Higher Cost';
  }
};