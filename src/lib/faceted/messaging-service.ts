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
      headline: `Finally. ${cityName} Electricity That Makes Sense`,
      subheadline: `You've got ${planCount} electricity plans to choose from in ${cityName}. Most people pick wrong - here's how to pick right.`,
      realityCheck: "Skip the teaser rates and marketing tricks - here's what you'll actually pay each month.",
      promise: "No overwhelming lists, no sneaky math. Just honest help from someone who's figured this out.",
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
      promise: "We've done the homework on these plans so you don't have to.",
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
      headline: `Finally. ${combination} Plans That Don't Lie`,
      subheadline: `Most companies make you pick one. We found ${planCount} plans in ${cityName} that deliver both.`,
      realityCheck: "Check the usage bands. The rate jumps if you're off by 1 kWh.",
      warning: this.getMultiFilterWarning(appliedFilters),
      promise: `You'll see every ${combination.toLowerCase()} plan's real cost, not the marketing rate.`,
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
          headline: `Finally. 12-Month Plans in ${cityName} That Actually Work`,
          subheadline: `Half of them aren't really 12-month at all. Found ${planCount} that actually lock your rate for a full year.`,
          realityCheck: "No rate jumps. No renewal games. Just honest 12-month pricing.",
          warning: "If it has 40 pages of fine print, it's hiding something."
        };
      
      case '6-month':
        return {
          headline: `Finally. 6-Month Plans in ${cityName} Without the Catch`,
          subheadline: `Short-term doesn't mean expensive. ${planCount} fair options that won't trap you.`,
          realityCheck: "These plans end when they say they'll end. Novel concept.",
          warning: "Watch out for auto-renewal clauses that lock you into year-long terms."
        };
      
      case '24-month':
        return {
          headline: `Finally. 24-Month Plans in ${cityName} Worth Committing To`,
          subheadline: `Two years is a long time. These ${planCount} plans actually earn your commitment.`,
          realityCheck: "Lower rates in exchange for longer commitment. Fair trade when it's honest.",
          warning: "Make sure there's no early termination fees if you move."
        };
      
      case 'month-to-month':
        return {
          headline: `Finally. Flexible Plans in ${cityName} That Don't Punish You`,
          subheadline: `No contracts doesn't mean triple the price anymore. ${planCount} options that make sense.`,
          realityCheck: "Freedom has a small premium, but not a crazy one.",
          warning: "Some 'no contract' plans have higher rates than 12-month plans. We'll show you which ones."
        };
      
      default:
        return {
          headline: `Finally. ${term} Plans in ${cityName} That Actually Work`,
          subheadline: `Found ${planCount} ${term} plans that do what they promise.`,
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
          headline: `Finally. Fixed Rates in ${cityName} That Are Actually Fixed`,
          subheadline: `Not 'fixed unless you use too much or too little.' These ${planCount} plans are actually fixed.`,
          realityCheck: "Your rate stays the same whether you use 500 kWh or 2,000 kWh.",
          warning: "Read the Electricity Facts Label. Some 'fixed' plans have usage tiers."
        };
      
      case 'variable-rate':
        return {
          headline: `Finally. Variable Rates in ${cityName} That Make Sense`,
          subheadline: `We show when variable beats fixed (hint: rarely, but sometimes). ${planCount} honest options.`,
          realityCheck: "Variable rates can go up or down with market conditions.",
          warning: "Most variable rates only go up. Check the rate history before signing."
        };
      
      case 'indexed':
        return {
          headline: `Finally. Indexed Plans in ${cityName} Explained Honestly`,
          subheadline: `Complex? Yes. Right for you? These ${planCount} plans might be worth the homework.`,
          realityCheck: "Your rate follows a public index plus a fixed markup.",
          warning: "You need to understand how the index works before you sign up."
        };
      
      default:
        return {
          headline: `Finally. ${rateType} Plans in ${cityName} Without the Tricks`,
          subheadline: `${planCount} ${rateType} plans that work like they should.`,
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
      headline: `Finally. Green Energy in ${cityName} Without the Greenwashing`,
      subheadline: `Real Texas wind and solar, not marketing certificates from Ohio. ${planCount} plans that are actually green.`,
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
          headline: `Finally. $0 Deposit Plans in ${cityName} That Don't Suck`,
          subheadline: `Good credit shouldn't mean paying deposits. ${planCount} options with $0 down.`,
          realityCheck: "No security deposit required if you have decent credit.",
          warning: "Check if they waive deposits or if there are other fees that replace them."
        };
      
      case 'prepaid':
        return {
          headline: `Finally. Prepaid Electricity in ${cityName} That's Not a Ripoff`,
          subheadline: `Control your budget without paying poverty penalties. ${planCount} fair prepaid options.`,
          realityCheck: "Pay before you use, get exact usage tracking, no surprise bills.",
          warning: "Some prepaid plans charge daily fees that add up fast. We'll show you which ones."
        };
      
      case 'free-nights':
        return {
          headline: `Finally. Free Nights Plans in ${cityName} That Actually Save Money`,
          subheadline: `Free nights only help if you use electricity at night. ${planCount} plans worth considering.`,
          realityCheck: "Free electricity from 9 PM to 6 AM, but higher daytime rates.",
          warning: "You need to use 40%+ of your electricity at night for these to pay off."
        };
      
      case 'free-weekends':
        return {
          headline: `Finally. Free Weekends Plans in ${cityName} That Make Sense`,
          subheadline: `Weekend warriors can save real money. ${planCount} plans that actually deliver savings.`,
          realityCheck: "Free electricity Saturday and Sunday, but you pay more weekdays.",
          warning: "Only worth it if you use most of your electricity on weekends."
        };
      
      default:
        return {
          headline: `Finally. ${feature} Plans in ${cityName} That Work`,
          subheadline: `${planCount} ${feature} plans that deliver what they promise.`,
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
      headline: `Finally. ${providerName} Plans in ${cityName} That Make Sense`,
      subheadline: `${planCount} ${providerName} plans analyzed. Here's what you actually get with each one.`,
      realityCheck: `We show what ${providerName} is actually like to deal with.`,
      warning: "Provider reputation matters as much as the rate. We track both."
    };
  }

  /**
   * Generic filter messaging fallback
   */
  private getGenericFilterMessaging(filterName: string, cityName: string, planCount: number) {
    return {
      headline: `Finally. ${filterName} Plans in ${cityName} That Actually Work`,
      subheadline: `Half of them aren't really ${filterName} at all. Found ${planCount} that actually deliver.`,
      realityCheck: "We checked every plan to make sure it matches what you're looking for.",
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
      return "Same provider can have very different customer service for different plan types.";
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