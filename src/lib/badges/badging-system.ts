/**
 * Smart Badging System
 * Determines which badges to show based on plan data and context
 * Ensures consistent, meaningful badge application across all plan cards
 */

import type { Plan } from '../../types/facets';

export interface Badge {
  text: string;
  variant: 'success' | 'warning' | 'info' | 'texas-primary' | 'texas-secondary' | 'destructive';
  priority: number; // 1-5, lower is higher priority
  reason: string; // Why this badge was awarded
}

export interface BadgingContext {
  allPlans: Plan[];
  planPosition: number; // 1-based position in sorted results
  cityTier?: number; // 1-3, market competitiveness
  filterContext?: {
    hasRateFilter: boolean;
    hasProviderFilter: boolean;
    hasTermFilter: boolean;
  };
}

export class SmartBadgingSystem {
  private readonly MAX_BADGES_PER_PLAN = 2; // Never show more than 2 badges
  
  /**
   * Generate appropriate badges for a plan based on context
   */
  generateBadges(plan: Plan, context: BadgingContext): Badge[] {
    const allBadges: Badge[] = [];
    
    // Performance/Ranking badges (highest priority)
    const rankingBadges = this.getRankingBadges(plan, context);
    allBadges.push(...rankingBadges);
    
    // Value/Savings badges
    const valueBadges = this.getValueBadges(plan, context);
    allBadges.push(...valueBadges);
    
    // Special feature badges (lowest priority)
    const featureBadges = this.getFeatureBadges(plan, context);
    allBadges.push(...featureBadges);
    
    // Sort by priority and return top badges only
    return allBadges
      .sort((a, b) => a.priority - b.priority)
      .slice(0, this.MAX_BADGES_PER_PLAN);
  }
  
  /**
   * Ranking-based badges (Top Choice, etc.)
   */
  private getRankingBadges(plan: Plan, context: BadgingContext): Badge[] {
    const badges: Badge[] = [];
    const { planPosition, allPlans } = context;
    
    // Top Choice - only for #1 plan
    if (planPosition === 1 && allPlans.length >= 3) {
      badges.push({
        text: 'Top Choice',
        variant: 'texas-secondary',
        priority: 1,
        reason: 'Ranked #1 overall'
      });
    }
    
    // Best Value - for plans in positions 2-3 with good rates
    if (planPosition >= 2 && planPosition <= 3 && allPlans.length >= 5) {
      const avgRate = this.calculateAverageRate(allPlans);
      if (plan.pricing.rate1000kWh < avgRate * 0.95) { // 5% below average
        badges.push({
          text: 'Best Value',
          variant: 'warning',
          priority: 2,
          reason: 'Top 3 position with below-average rate'
        });
      }
    }
    
    return badges;
  }
  
  /**
   * Value/savings-based badges
   */
  private getValueBadges(plan: Plan, context: BadgingContext): Badge[] {
    const badges: Badge[] = [];
    const { allPlans, cityTier = 2 } = context;
    
    // Market-specific rate thresholds (cents per kWh)
    const rateThresholds = {
      1: { excellent: 10, good: 12, average: 15 }, // Tier 1 cities (competitive)
      2: { excellent: 11, good: 13, average: 16 }, // Tier 2 cities (moderate)
      3: { excellent: 12, good: 14, average: 17 }  // Tier 3 cities (limited)
    };
    
    const threshold = rateThresholds[cityTier as keyof typeof rateThresholds];
    const planRate = plan.pricing.rate1000kWh;
    
    // Excellent Rate - significantly below market
    if (planRate <= threshold.excellent) {
      badges.push({
        text: 'Excellent Rate',
        variant: 'success',
        priority: 2,
        reason: `Rate ${planRate}¢ is excellent for this market`
      });
    }
    // Low Rate - moderately below average (only if not already marked excellent)
    else if (planRate <= threshold.good && allPlans.length >= 5) {
      const avgRate = this.calculateAverageRate(allPlans);
      if (planRate < avgRate * 0.92) { // 8% below average
        badges.push({
          text: 'Low Rate',
          variant: 'info',
          priority: 3,
          reason: `Rate is ${Math.round((1 - planRate/avgRate) * 100)}% below average`
        });
      }
    }
    
    return badges;
  }
  
  /**
   * Special feature badges (only for truly unique features)
   */
  private getFeatureBadges(plan: Plan, context: BadgingContext): Badge[] {
    const badges: Badge[] = [];
    
    // 100% Green - only if it's rare in the result set
    if (plan.features.greenEnergy >= 100 && context.allPlans.length >= 5) {
      const greenPlans = context.allPlans.filter(p => p.features.greenEnergy >= 100);
      const greenPercentage = (greenPlans.length / context.allPlans.length) * 100;
      
      // Only badge if less than 30% of plans are 100% green
      if (greenPercentage < 30) {
        badges.push({
          text: '100% Green',
          variant: 'success',
          priority: 4,
          reason: `Only ${Math.round(greenPercentage)}% of plans are 100% renewable`
        });
      }
    }
    
    // No Deposit - only for variable rate plans or specific providers like Payless Power
    // Only variable rate plans or Payless Power truly have no deposit requirement
    if (!plan.features.deposit.required && context.allPlans.length >= 5) {
      const isVariable = plan.contract.type === 'variable';
      const isPaylessPower = plan.provider.name.toLowerCase().includes('payless power');
      
      // Only show "No Deposit" badge for truly no-deposit plans
      if (isVariable || isPaylessPower) {
        const depositPlans = context.allPlans.filter(p => p.features.deposit.required);
        const depositPercentage = (depositPlans.length / context.allPlans.length) * 100;
        
        // Only badge if most plans require deposits
        if (depositPercentage > 60) {
          badges.push({
            text: 'No Deposit',
            variant: 'info',
            priority: 4,
            reason: isVariable 
              ? 'Variable rate plans typically require no deposit' 
              : `${plan.provider.name} offers no deposit required`
          });
        }
      }
    }
    
    return badges;
  }
  
  /**
   * Calculate average rate across all plans
   */
  private calculateAverageRate(plans: Plan[]): number {
    if (plans.length === 0) return 15; // Default fallback
    
    const totalRate = plans.reduce((sum, plan) => sum + plan.pricing.rate1000kWh, 0);
    return totalRate / plans.length;
  }
  
  /**
   * Get CSS classes for badge variant
   */
  getBadgeClasses(variant: Badge['variant']): string {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (variant) {
      case 'texas-secondary':
        return `${baseClasses} !bg-texas-red !text-white`;
      case 'warning':
        return `${baseClasses} !bg-texas-gold !text-texas-navy !font-semibold`;
      case 'success':
        return `${baseClasses} !bg-texas-gold !text-texas-navy !font-semibold`;
      case 'info':
        return `${baseClasses} !bg-texas-navy/10 !text-texas-navy`;
      case 'texas-primary':
        return `${baseClasses} !bg-blue-900 !text-white`;
      case 'destructive':
        return `${baseClasses} !bg-texas-red-100 !text-texas-navy`;
      default:
        return `${baseClasses} !bg-gray-100 !text-gray-800`;
    }
  }
}

// Singleton instance
export const badgingSystem = new SmartBadgingSystem();

/**
 * Usage example:
 * 
 * const context: BadgingContext = {
 *   allPlans: plansArray,
 *   planPosition: 1,
 *   cityTier: 2
 * };
 * 
 * const badges = badgingSystem.generateBadges(plan, context);
 */