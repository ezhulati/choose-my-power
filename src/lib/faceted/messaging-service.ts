/**
 * Faceted Navigation Messaging Service
 * Implements Eddie Shleyner conversational patterns and StoryBrand framework
 * Generates "Finally" messaging for all 2,500+ filter combinations
 */

import type { AppliedFilter } from '../api/filter-mapper';

export interface FacetedMessage {
  headline: string;
  subheadline: string;
  realityCheck?: string;
  warning?: string;
  promise?: string;
  cta: string;
  breadcrumbText: string;
}

export interface MessageContext {
  cityName: string;
  citySlug: string;
  planCount: number;
  lowestRate: number;
  appliedFilters: AppliedFilter[];
  avgSavings?: number;
  isMovingContext?: boolean;
}

export class FacetedMessagingService {
  
  /**
   * Generate messaging for faceted navigation pages
   */
  generateMessage(context: MessageContext): FacetedMessage {
    const { appliedFilters } = context;
    
    if (appliedFilters.length === 0) {
      return this.generateCityBaseMessage(context);
    } else if (appliedFilters.length === 1) {
      return this.generateSingleFilterMessage(context);
    } else {
      return this.generateMultiFilterMessage(context);
    }
  }

  /**
   * Generate city base page messaging (no filters)
   */
  private generateCityBaseMessage(context: MessageContext): FacetedMessage {
    const { cityName, planCount } = context;
    
    return {
      headline: `${cityName} Electricity Plans`,
      subheadline: `${planCount} plans available in ${cityName}.`,
      realityCheck: "Compare actual monthly costs at different usage levels.",
      promise: "See detailed pricing breakdown for each plan.",
      cta: `Find Your ${cityName} Plan`,
      breadcrumbText: `${cityName} Plans`
    };
  }

  /**
   * Generate single filter messaging with specific warnings
   */
  private generateSingleFilterMessage(context: MessageContext): FacetedMessage {
    const { cityName, planCount, appliedFilters } = context;
    const filter = appliedFilters[0];
    
    const filterMessages = this.getSingleFilterMessaging(filter, cityName, planCount);
    
    return {
      headline: filterMessages.headline,
      subheadline: filterMessages.subheadline,
      realityCheck: filterMessages.realityCheck,
      warning: filterMessages.warning,
      promise: "View detailed plan comparison and pricing information.",
      cta: `Find Your ${filter.displayName} Plan`,
      breadcrumbText: filter.displayName
    };
  }

  /**
   * Generate multi-filter messaging with combination warnings
   */
  private generateMultiFilterMessage(context: MessageContext): FacetedMessage {
    const { cityName, planCount, appliedFilters } = context;
    const filterLabels = appliedFilters.map(f => f.displayName);
    const combination = filterLabels.join(' + ');
    
    return {
      headline: `${combination} Plans in ${cityName}`,
      subheadline: `${planCount} plans match your filters.`,
      realityCheck: "Review contract terms and rate structure for each plan.",
      warning: this.getMultiFilterWarning(appliedFilters),
      promise: `Compare detailed pricing for all ${combination.toLowerCase()} plans.`,
      cta: `Get Your ${combination} Plan`,
      breadcrumbText: combination
    };
  }

  /**
   * Get filter-specific messaging patterns
   */
  private getSingleFilterMessaging(filter: AppliedFilter, cityName: string, planCount: number) {
    const filterType = filter.type;
    const filterValue = filter.urlSegment;

    switch (filterType) {
      case 'term':
        return this.getTermFilterMessaging(filterValue, cityName, planCount);
      
      case 'rate_type':
        return this.getRateTypeMessaging(filterValue, cityName, planCount);
      
      case 'green_energy':
        return this.getGreenEnergyMessaging(filterValue, cityName, planCount);
      
      case 'plan_features':
        return this.getPlanFeaturesMessaging(filterValue, cityName, planCount);
      
      case 'provider':
        return this.getProviderMessaging(filter.displayName, cityName, planCount);
      
      default:
        return this.getGenericFilterMessaging(filter.displayName, cityName, planCount);
    }
  }

  /**
   * Contract term messaging
   */
  private getTermFilterMessaging(term: string, cityName: string, planCount: number) {
    switch (term) {
      case '12-month':
        return {
          headline: `12-Month Plans in ${cityName}`,
          subheadline: `${planCount} 12-month contracts available.`,
          realityCheck: "Rate remains fixed for the entire 12-month contract term.",
          warning: "If it has 40 pages of fine print, it's hiding something."
        };
      
      case '6-month':
        return {
          headline: `6-Month Plans in ${cityName}`,
          subheadline: `${planCount} short-term options available.`,
          realityCheck: "Contract expires after 6 months as stated.",
          warning: "Watch out for auto-renewal clauses that lock you into year-long terms."
        };
      
      case '24-month':
        return {
          headline: `24-Month Plans in ${cityName}`,
          subheadline: `${planCount} 24-month contracts available.`,
          realityCheck: "Lower rates typically offered for longer contract terms.",
          warning: "In Texas, you can cancel without penalty when moving. Early termination fees only apply when switching providers."
        };
      
      case 'month-to-month':
        return {
          headline: `Month-to-Month Plans in ${cityName}`,
          subheadline: `${planCount} flexible contract options available.`,
          realityCheck: "Month-to-month plans typically have higher rates than contract plans.",
          warning: "Some 'no contract' plans have higher rates than 12-month plans. We'll show you which ones."
        };
      
      default:
        return {
          headline: `${term} Plans in ${cityName}`,
          subheadline: `${planCount} ${term} plans available.`,
          realityCheck: "We checked the fine print so you don't have to.",
          warning: "Contract terms matter more than advertised rates."
        };
    }
  }

  /**
   * Rate type messaging
   */
  private getRateTypeMessaging(rateType: string, cityName: string, planCount: number) {
    switch (rateType) {
      case 'fixed-rate':
        return {
          headline: `Fixed Rate Plans in ${cityName}`,
          subheadline: `${planCount} fixed rate plans available.`,
          realityCheck: "Your rate stays the same whether you use 500 kWh or 2,000 kWh.",
          warning: "Read the Electricity Facts Label. Some 'fixed' plans have usage tiers."
        };
      
      case 'variable-rate':
        return {
          headline: `Variable Rate Plans in ${cityName}`,
          subheadline: `${planCount} variable rate plans available.`,
          realityCheck: "Variable rates can go up or down with market conditions.",
          warning: "Most variable rates only go up. Check the rate history before signing."
        };
      
      case 'indexed':
        return {
          headline: `Indexed Plans in ${cityName}`,
          subheadline: `${planCount} indexed plans available.`,
          realityCheck: "Your rate follows a public index plus a fixed markup.",
          warning: "You need to understand how the index works before you sign up."
        };
      
      default:
        return {
          headline: `${rateType} Plans in ${cityName}`,
          subheadline: `${planCount} ${rateType} plans available.`,
          realityCheck: "We explain exactly how your rate is calculated.",
          warning: "Rate structure affects your total cost more than the advertised price."
        };
    }
  }

  /**
   * Green energy messaging
   */
  private getGreenEnergyMessaging(greenType: string, cityName: string, planCount: number) {
    return {
      headline: `Green Energy Plans in ${cityName}`,
      subheadline: `${planCount} renewable energy plans available.`,
      realityCheck: "100% renewable means all your electricity comes from Texas wind and solar farms.",
      warning: "Some 'green' plans just buy cheap carbon credits. We show you the real renewable content."
    };
  }

  /**
   * Plan features messaging
   */
  private getPlanFeaturesMessaging(feature: string, cityName: string, planCount: number) {
    switch (feature) {
      case 'no-deposit':
        return {
          headline: `No Deposit Plans in ${cityName}`,
          subheadline: `${planCount} plans with no deposit required.`,
          realityCheck: "No security deposit required if you have decent credit.",
          warning: "Check if they waive deposits or if there are other fees that replace them."
        };
      
      case 'prepaid':
        return {
          headline: `Prepaid Plans in ${cityName}`,
          subheadline: `${planCount} prepaid electricity options available.`,
          realityCheck: "Pay before you use, get exact usage tracking, no surprise bills.",
          warning: "Some prepaid plans charge daily fees that add up fast. We'll show you which ones."
        };
      
      case 'free-nights':
        return {
          headline: `Free Nights Plans in ${cityName}`,
          subheadline: `${planCount} plans with free nighttime electricity.`,
          realityCheck: "Free electricity from 9 PM to 6 AM, but higher daytime rates.",
          warning: "You need to use 40%+ of your electricity at night for these to pay off."
        };
      
      case 'free-weekends':
        return {
          headline: `Free Weekends Plans in ${cityName}`,
          subheadline: `${planCount} plans with free weekend electricity.`,
          realityCheck: "Free electricity Saturday and Sunday, but you pay more weekdays.",
          warning: "Only worth it if you use most of your electricity on weekends."
        };
      
      default:
        return {
          headline: `${feature} Plans in ${cityName}`,
          subheadline: `${planCount} ${feature} plans available.`,
          realityCheck: "We checked the fine print on every special feature.",
          warning: "Special features often come with higher base rates. Make sure the math works."
        };
    }
  }

  /**
   * Provider-specific messaging
   */
  private getProviderMessaging(providerName: string, cityName: string, planCount: number) {
    return {
      headline: `${providerName} Plans in ${cityName}`,
      subheadline: `${planCount} ${providerName} plans available.`,
      realityCheck: `View customer service ratings and plan details for ${providerName}.`,
      warning: "Provider reputation matters as much as the rate. We track both."
    };
  }

  /**
   * Generic filter messaging fallback
   */
  private getGenericFilterMessaging(filterName: string, cityName: string, planCount: number) {
    return {
      headline: `${filterName} Plans in ${cityName}`,
      subheadline: `${planCount} ${filterName} plans available.`,
      realityCheck: "We checked each plan to make sure it matches what you're looking for.",
      warning: "If it has 40 pages of fine print, it's hiding something."
    };
  }

  /**
   * Get multi-filter combination warnings
   */
  private getMultiFilterWarning(appliedFilters: AppliedFilter[]): string {
    const filterTypes = appliedFilters.map(f => f.type);
    
    // Specific warnings for common combinations
    if (filterTypes.includes('term') && filterTypes.includes('rate_type')) {
      return "Check the usage bands. The rate jumps if you're off by 1 kWh.";
    }
    
    if (filterTypes.includes('green_energy') && filterTypes.includes('plan_features')) {
      return "Green + special features often means higher base rates. Make sure the total cost works.";
    }
    
    if (filterTypes.includes('provider') && filterTypes.includes('rate_type')) {
      return "Compare contract terms and monthly fees for each plan.";
    }
    
    return "Multiple filters mean fewer options, but better matches. Check the total monthly cost.";
  }

  /**
   * Generate moving-specific messaging
   */
  generateMovingMessage(cityName: string): string {
    return `Moving to ${cityName}? Here's why transferring your old plan usually backfires:
• Your old rate was based on your OLD home's size
• 'Fixed' rates aren't fixed - they change with usage
• A plan for a 2-bedroom apartment costs way more in a 4-bedroom house
Let's find a plan for your NEW home instead. Takes 10 minutes.`;
  }

  /**
   * Generate reality check for no plans found
   */
  generateNoPlansFallback(context: MessageContext): FacetedMessage {
    const { cityName, appliedFilters } = context;
    const filterLabels = appliedFilters.map(f => f.displayName).join(' + ');
    
    return {
      headline: `Hmm. No ${filterLabels} Plans Found in ${cityName}`,
      subheadline: `That combination doesn't exist in ${cityName} right now. Here's what's similar...`,
      realityCheck: "Sometimes the perfect plan doesn't exist. We'll show you the closest matches.",
      promise: "Try removing a filter or two to see more options.",
      cta: `Find Similar Plans in ${cityName}`,
      breadcrumbText: filterLabels || 'Search Results'
    };
  }

  /**
   * Generate trust signals for faceted pages
   */
  generateTrustSignals(): string[] {
    return [
      "We only show quality plans from 12-15 trusted electricity companies",
      "No teaser rates, no fine print surprises",
      "The electricity companies pay us, you pay the same either way",
      "No email required, no spam, no sales calls"
    ];
  }

  /**
   * Generate Eddie Shleyner-style CTAs
   */
  generateConversationalCTA(context: MessageContext): string {
    const { appliedFilters, cityName } = context;
    
    if (appliedFilters.length === 0) {
      return `You'll be done in 10 minutes. Start with ${cityName}.`;
    }
    
    const filterLabels = appliedFilters.map(f => f.displayName.toLowerCase()).join(' ');
    return `You'll see every ${filterLabels} plan's real cost. Takes 5 minutes.`;
  }
}

// Export singleton instance
export const facetedMessaging = new FacetedMessagingService();