/**
 * SEO-Optimized Content Templates for Electricity Comparison Platform
 * Designed for 10,000+ scalable pages with semantic content generation
 * Performance target: <50ms per template generation
 */

interface ContentContext {
  city: string;
  state: string;
  filters: string[];
  planCount: number;
  lowestRate: number;
  averageRate: number;
  topProvider: string;
  tdspName: string;
  population: number;
  seasonalContext?: 'winter' | 'summer' | 'spring' | 'fall';
  marketData?: {
    searchVolume: number;
    competition: number;
    trending: boolean;
  };
}

interface ContentTemplate {
  hero: {
    headline: string;
    subheadline: string;
    cta: string;
    benefits: string[];
  };
  introduction: string;
  keyPoints: string[];
  comparison: {
    title: string;
    description: string;
    callout: string;
  };
  faq: Array<{
    question: string;
    answer: string;
  }>;
  conclusion: string;
  localContext: string;
}

// Performance optimization: Cache frequently generated content templates
const templateCache = new Map<string, ContentTemplate>();
const heroCache = new Map<string, any>();
const faqCache = new Map<string, any>();
const localContextCache = new Map<string, string>();

/**
 * City Hub Page Templates - Tier 1 Priority (e.g., /electricity-plans/dallas-tx/)
 * Focus: Comprehensive city overview with local context
 */
export function generateCityHubContent(context: ContentContext): ContentTemplate {
  const cacheKey = `city-hub-${context.city}-${context.state}-${context.planCount}`;
  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey)!;
  }

  const cityName = context.city.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const seasonalModifier = getSeasonalModifier(context.seasonalContext);
  const localUtility = context.tdspName || 'local utility';
  
  const template: ContentTemplate = {
    hero: {
      headline: `Compare ${cityName}, Texas Electricity Plans - Save ${seasonalModifier.savings}% ${seasonalModifier.period}`,
      subheadline: `${context.planCount}+ electricity plans available in ${cityName}. Rates starting at ${context.lowestRate}¢/kWh with ${context.topProvider} and other top providers.`,
      cta: `Find My ${cityName} Electricity Plan`,
      benefits: [
        `${context.planCount}+ plans from trusted Texas providers`,
        `Rates as low as ${context.lowestRate}¢/kWh in ${cityName}`,
        `${localUtility} service area coverage`,
        `Free plan switching with no deposits`,
        `100% renewable energy options available`
      ]
    },
    introduction: `Finding the right electricity plan in ${cityName}, Texas doesn't have to be complicated. Our comprehensive comparison tool shows you all ${context.planCount} available electricity plans in your area, with transparent pricing and no hidden fees. ${cityName} residents served by ${localUtility} can choose from competitive rates starting at just ${context.lowestRate}¢/kWh.`,
    keyPoints: [
      `${cityName} is served by ${localUtility}, ensuring reliable electricity delivery throughout the city`,
      `With ${context.planCount} available plans, ${cityName} residents have extensive choice in electricity providers`,
      `Current market rates in ${cityName} range from ${context.lowestRate}¢/kWh to competitive variable options`,
      `${seasonalModifier.context} makes it an ideal time to switch electricity plans in ${cityName}`,
      `Popular plan types include fixed-rate, variable, and 100% renewable energy options`
    ],
    comparison: {
      title: `Why Choose ChooseMyPower for ${cityName} Electricity Plans?`,
      description: `Unlike Power to Choose, we provide transparent comparisons of all electricity plans available in ${cityName}, Texas. Our platform eliminates confusing teaser rates and shows you real costs based on actual usage patterns.`,
      callout: `${cityName} residents save an average of $${Math.round((context.averageRate - context.lowestRate) * 12)}+ per year by switching to lower-rate plans.`
    },
    faq: generateCityFAQ(cityName, context),
    conclusion: `Ready to save on your ${cityName} electricity bill? Compare all ${context.planCount} available plans and switch to a better rate today. With transparent pricing and trusted providers like ${context.topProvider}, finding your perfect electricity plan has never been easier.`,
    localContext: generateLocalContext(cityName, context)
  };

  templateCache.set(cacheKey, template);
  return template;
}

/**
 * Single Filter Pages - Tier 2 Priority (e.g., /electricity-plans/dallas-tx/12-month/)
 * Focus: Specific filter benefits with comparative analysis
 */
export function generateSingleFilterContent(context: ContentContext): ContentTemplate {
  const cacheKey = `single-filter-${context.city}-${context.filters[0]}-${context.planCount}`;
  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey)!;
  }

  const cityName = context.city.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const filterName = formatFilterName(context.filters[0]);
  const filterBenefits = getFilterBenefits(context.filters[0]);
  
  const template: ContentTemplate = {
    hero: {
      headline: `${filterName} Electricity Plans in ${cityName}, TX - Compare & Save`,
      subheadline: `${context.planCount} ${filterName.toLowerCase()} electricity plans available in ${cityName}. ${filterBenefits.primary} with rates from ${context.lowestRate}¢/kWh.`,
      cta: `Compare ${filterName} Plans in ${cityName}`,
      benefits: [
        filterBenefits.primary,
        filterBenefits.secondary,
        `Available in ${cityName} through ${context.tdspName}`,
        `${context.planCount} plans to choose from`,
        `Starting at ${context.lowestRate}¢/kWh`
      ]
    },
    introduction: `${filterName} electricity plans offer ${cityName} residents ${filterBenefits.description}. With ${context.planCount} ${filterName.toLowerCase()} options available through ${context.tdspName}, you can find the perfect plan that matches your energy usage and budget preferences.`,
    keyPoints: [
      `${filterBenefits.keyPoint1} - ideal for ${cityName} residents who ${filterBenefits.idealFor}`,
      `${context.planCount} ${filterName.toLowerCase()} plans available from trusted Texas providers`,
      `Rates starting at ${context.lowestRate}¢/kWh with transparent pricing`,
      `All plans include ${context.tdspName} delivery charges and regulatory fees`,
      `${filterBenefits.additionalBenefit} for enhanced value`
    ],
    comparison: {
      title: `${filterName} vs. Other Plan Types in ${cityName}`,
      description: `${filterBenefits.comparison} This makes ${filterName.toLowerCase()} plans particularly attractive for ${cityName} residents who ${filterBenefits.bestFor}.`,
      callout: `${context.topProvider} offers competitive ${filterName.toLowerCase()} rates starting at ${context.lowestRate}¢/kWh in ${cityName}.`
    },
    faq: generateFilterFAQ(filterName, cityName, context),
    conclusion: `Choose from ${context.planCount} ${filterName.toLowerCase()} electricity plans in ${cityName}, Texas. Compare rates, terms, and benefits to find your ideal electricity plan with transparent pricing and trusted providers.`,
    localContext: `${cityName} residents benefit from ${filterName.toLowerCase()} plans due to ${filterBenefits.localAdvantage}. The ${context.tdspName} service territory ensures reliable delivery of your chosen electricity plan.`
  };

  templateCache.set(cacheKey, template);
  return template;
}

/**
 * Multi-Filter Combination Pages - Tier 3 Priority (e.g., /electricity-plans/dallas-tx/12-month/fixed-rate/)
 * Focus: Highly targeted content for specific user intent
 */
export function generateMultiFilterContent(context: ContentContext): ContentTemplate {
  const cacheKey = `multi-filter-${context.city}-${context.filters.join('-')}-${context.planCount}`;
  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey)!;
  }

  const cityName = context.city.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const filterCombination = context.filters.map(f => formatFilterName(f)).join(' ');
  const primaryFilter = formatFilterName(context.filters[0]);
  const secondaryFilter = formatFilterName(context.filters[1]);
  
  const template: ContentTemplate = {
    hero: {
      headline: `${filterCombination} Electricity Plans in ${cityName}, TX`,
      subheadline: `${context.planCount} ${filterCombination.toLowerCase()} plans combining ${primaryFilter.toLowerCase()} and ${secondaryFilter.toLowerCase()} benefits. Rates from ${context.lowestRate}¢/kWh.`,
      cta: `Find ${filterCombination} Plans`,
      benefits: [
        `Perfect combination: ${primaryFilter} + ${secondaryFilter}`,
        `${context.planCount} specialized plans available`,
        `Optimized for ${cityName} usage patterns`,
        `Rates starting at ${context.lowestRate}¢/kWh`,
        `Served by reliable ${context.tdspName} infrastructure`
      ]
    },
    introduction: `${filterCombination} electricity plans offer ${cityName} residents the perfect combination of ${getFilterBenefits(context.filters[0]).core} and ${getFilterBenefits(context.filters[1]).core}. These specialized plans are designed for customers who want ${getCombinationBenefits(context.filters).description}.`,
    keyPoints: [
      `${primaryFilter} provides ${getFilterBenefits(context.filters[0]).primary.toLowerCase()}`,
      `${secondaryFilter} adds ${getFilterBenefits(context.filters[1]).primary.toLowerCase()}`,
      `${context.planCount} plans available from top-rated Texas electricity providers`,
      `All plans include transparent pricing with no hidden fees`,
      `${context.tdspName} ensures reliable electricity delivery in ${cityName}`
    ],
    comparison: {
      title: `Why Choose ${filterCombination} Plans in ${cityName}?`,
      description: `${getCombinationBenefits(context.filters).advantage} This combination is particularly valuable for ${cityName} residents who ${getCombinationBenefits(context.filters).idealCustomer}.`,
      callout: `${context.topProvider} leads ${cityName} with competitive ${filterCombination.toLowerCase()} rates at ${context.lowestRate}¢/kWh.`
    },
    faq: generateCombinationFAQ(filterCombination, cityName, context),
    conclusion: `Compare ${context.planCount} ${filterCombination.toLowerCase()} electricity plans in ${cityName}, Texas. These specialized plans offer the perfect balance of ${primaryFilter.toLowerCase()} and ${secondaryFilter.toLowerCase()} benefits for discerning electricity customers.`,
    localContext: `${cityName}'s ${context.population.toLocaleString()}+ residents benefit from ${filterCombination.toLowerCase()} plans that match local usage patterns and preferences. ${context.tdspName} infrastructure supports all plan types with reliable delivery.`
  };

  templateCache.set(cacheKey, template);
  return template;
}

/**
 * Provider-Specific Pages (e.g., /electricity-plans/dallas-tx/reliant-energy/)
 * Focus: Brand-specific benefits with local context
 */
export function generateProviderContent(context: ContentContext & { provider: string }): ContentTemplate {
  const cacheKey = `provider-${context.provider}-${context.city}-${context.planCount}`;
  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey)!;
  }

  const cityName = context.city.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const providerName = context.provider.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const providerInfo = getProviderInfo(context.provider);
  
  const template: ContentTemplate = {
    hero: {
      headline: `${providerName} Electricity Plans in ${cityName}, TX - Compare Rates`,
      subheadline: `${context.planCount} ${providerName} electricity plans available in ${cityName}. ${providerInfo.reputation} with rates starting at ${context.lowestRate}¢/kWh.`,
      cta: `View ${providerName} Plans in ${cityName}`,
      benefits: [
        providerInfo.primaryBenefit,
        providerInfo.secondaryBenefit,
        `${context.planCount} plan options in ${cityName}`,
        `Competitive rates from ${context.lowestRate}¢/kWh`,
        `${context.tdspName} reliable service delivery`
      ]
    },
    introduction: `${providerName} offers ${cityName} residents ${providerInfo.description}. As ${providerInfo.marketPosition}, ${providerName} provides ${context.planCount} electricity plan options with competitive rates starting at ${context.lowestRate}¢/kWh through the ${context.tdspName} service territory.`,
    keyPoints: [
      `${providerName} ${providerInfo.experience} serving Texas electricity customers`,
      `${context.planCount} diverse plan options available in ${cityName}`,
      `${providerInfo.specialization} with focus on customer satisfaction`,
      `Transparent pricing with rates starting at ${context.lowestRate}¢/kWh`,
      `All plans include ${context.tdspName} delivery and standard regulatory fees`
    ],
    comparison: {
      title: `${providerName} vs. Other Providers in ${cityName}`,
      description: `${providerInfo.competitive_advantage} ${providerName}'s ${context.planCount} available plans in ${cityName} offer ${providerInfo.unique_value}.`,
      callout: `${providerName} customers in ${cityName} benefit from ${providerInfo.customer_benefit} and competitive ${context.lowestRate}¢/kWh rates.`
    },
    faq: generateProviderFAQ(providerName, cityName, context),
    conclusion: `Choose ${providerName} for reliable electricity service in ${cityName}, Texas. With ${context.planCount} plan options and competitive rates starting at ${context.lowestRate}¢/kWh, ${providerName} delivers ${providerInfo.closing_value}.`,
    localContext: `${providerName} serves ${cityName}'s ${context.population.toLocaleString()}+ residents through ${context.tdspName} infrastructure. Local customer support and ${providerInfo.local_advantage} make ${providerName} a trusted choice.`
  };

  templateCache.set(cacheKey, template);
  return template;
}

// Helper Functions for Content Generation

function getSeasonalModifier(season?: string) {
  const modifiers = {
    winter: { savings: '15', period: 'this winter', context: 'Winter heating season' },
    summer: { savings: '20', period: 'this summer', context: 'Peak cooling season' },
    spring: { savings: '12', period: 'this spring', context: 'Mild spring weather' },
    fall: { savings: '10', period: 'this fall', context: 'Pleasant fall temperatures' }
  };
  return modifiers[season as keyof typeof modifiers] || modifiers.spring;
}

function formatFilterName(filter: string): string {
  const filterNames: Record<string, string> = {
    '12-month': '12-Month',
    '24-month': '24-Month',
    'fixed-rate': 'Fixed Rate',
    'variable-rate': 'Variable Rate',
    'green-energy': 'Green Energy',
    'no-deposit': 'No Deposit',
    'prepaid': 'Prepaid',
    'time-of-use': 'Time of Use',
    'weekend-free': 'Weekend Free',
    'bill-credit': 'Bill Credit'
  };
  return filterNames[filter] || filter.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getFilterBenefits(filter: string) {
  const benefits: Record<string, any> = {
    '12-month': {
      primary: 'Predictable rates for one full year',
      secondary: 'Budget-friendly 12-month rate protection',
      description: 'stable pricing and budget predictability',
      keyPoint1: 'Rate protection for 12 months',
      idealFor: 'want stable electricity costs',
      additionalBenefit: 'No rate surprises for a full year',
      comparison: '12-month plans provide the perfect balance of rate stability and flexibility.',
      bestFor: 'value predictable monthly bills',
      localAdvantage: 'local weather patterns and seasonal usage variations',
      core: 'rate stability',
    },
    'fixed-rate': {
      primary: 'Guaranteed rate that never changes',
      secondary: 'Protection from market price fluctuations',
      description: 'complete rate certainty throughout your contract term',
      keyPoint1: 'Locked-in rate protection',
      idealFor: 'prioritize budget certainty',
      additionalBenefit: 'Protection from market volatility',
      comparison: 'Fixed-rate plans eliminate the uncertainty of variable pricing.',
      bestFor: 'want guaranteed stable rates',
      localAdvantage: 'Texas market volatility and seasonal price swings',
      core: 'price certainty',
    },
    'green-energy': {
      primary: '100% renewable energy sourcing',
      secondary: 'Environmental responsibility with competitive rates',
      description: 'clean energy from wind and solar sources',
      keyPoint1: 'Sustainable electricity from renewable sources',
      idealFor: 'care about environmental impact',
      additionalBenefit: 'Carbon-neutral electricity consumption',
      comparison: 'Green energy plans support Texas renewable energy leadership.',
      bestFor: 'prioritize environmental sustainability',
      localAdvantage: 'Texas leadership in wind and solar energy production',
      core: 'environmental benefits',
    }
  };
  return benefits[filter] || {
    primary: 'Specialized plan benefits',
    secondary: 'Tailored for specific customer needs',
    description: 'unique advantages',
    keyPoint1: 'Customized plan features',
    idealFor: 'have specific electricity needs',
    additionalBenefit: 'Enhanced value proposition',
    comparison: 'Specialized plans offer targeted benefits.',
    bestFor: 'have unique requirements',
    localAdvantage: 'local market conditions',
    core: 'specialized benefits',
  };
}

function getCombinationBenefits(filters: string[]) {
  const primary = getFilterBenefits(filters[0]);
  const secondary = getFilterBenefits(filters[1]);
  
  return {
    description: `${primary.core} combined with ${secondary.core}`,
    advantage: `This combination provides ${primary.primary.toLowerCase()} while also delivering ${secondary.primary.toLowerCase()}.`,
    idealCustomer: `want both ${primary.core} and ${secondary.core}`
  };
}

function getProviderInfo(provider: string) {
  const providers: Record<string, any> = {
    'reliant-energy': {
      reputation: 'Trusted Texas electricity provider since 1996',
      primaryBenefit: 'Award-winning customer service',
      secondaryBenefit: 'Innovative electricity plan options',
      description: 'reliable electricity service with innovative plan features',
      marketPosition: 'one of Texas\' most established electricity providers',
      experience: 'has over 25 years of experience',
      specialization: 'Focus on customer satisfaction and plan innovation',
      competitive_advantage: 'Reliant Energy combines experience with innovation to deliver superior value.',
      unique_value: 'flexible terms and customer-focused features',
      customer_benefit: 'award-winning customer service',
      closing_value: 'reliable service with innovative features',
      local_advantage: 'established local presence'
    },
    'txu-energy': {
      reputation: 'Texas\' largest electricity provider',
      primaryBenefit: 'Extensive plan variety and options',
      secondaryBenefit: 'Proven reliability and customer base',
      description: 'comprehensive electricity solutions with extensive plan variety',
      marketPosition: 'Texas\' largest electricity provider',
      experience: 'has been serving Texas for decades',
      specialization: 'Comprehensive plan portfolio',
      competitive_advantage: 'TXU Energy\'s market leadership ensures competitive rates and reliable service.',
      unique_value: 'extensive plan variety and proven reliability',
      customer_benefit: 'market-leading plan options',
      closing_value: 'comprehensive solutions and reliable service',
      local_advantage: 'extensive Texas market presence'
    }
  };
  
  return providers[provider] || {
    reputation: 'Competitive Texas electricity provider',
    primaryBenefit: 'Competitive electricity rates',
    secondaryBenefit: 'Quality customer service',
    description: 'reliable electricity service with competitive rates',
    marketPosition: 'a competitive Texas electricity provider',
    experience: 'brings years of experience',
    specialization: 'Focus on competitive rates and service quality',
    competitive_advantage: 'This provider offers competitive advantages in the Texas electricity market.',
    unique_value: 'competitive rates and reliable service',
    customer_benefit: 'quality service and competitive pricing',
    closing_value: 'reliable electricity service',
    local_advantage: 'local market knowledge'
  };
}

// FAQ Generation Functions

function generateCityFAQ(cityName: string, context: ContentContext) {
  return [
    {
      question: `How many electricity plans are available in ${cityName}, Texas?`,
      answer: `${cityName} residents have access to ${context.planCount} electricity plans from various Texas electricity providers. These plans range from fixed-rate to variable-rate options, with competitive rates starting at ${context.lowestRate}¢/kWh.`
    },
    {
      question: `Who is the electricity utility company in ${cityName}?`,
      answer: `${cityName} is served by ${context.tdspName}, which is the Transmission and Distribution Service Provider (TDSP) responsible for maintaining power lines and delivering electricity to your home. You can choose your electricity provider while ${context.tdspName} handles delivery.`
    },
    {
      question: `What is the lowest electricity rate available in ${cityName}?`,
      answer: `The lowest electricity rate currently available in ${cityName} is ${context.lowestRate}¢/kWh from ${context.topProvider}. However, rates can vary based on your usage level and contract terms, so it's important to compare all available options.`
    },
    {
      question: `Can I switch electricity providers in ${cityName}?`,
      answer: `Yes! ${cityName} is in the deregulated Texas electricity market, which means you can choose your electricity provider. You can switch providers at any time, though you may be subject to early termination fees if you break a current contract.`
    }
  ];
}

function generateFilterFAQ(filterName: string, cityName: string, context: ContentContext) {
  return [
    {
      question: `What are ${filterName.toLowerCase()} electricity plans?`,
      answer: `${filterName} electricity plans offer ${getFilterBenefits(context.filters[0]).description}. In ${cityName}, ${context.planCount} ${filterName.toLowerCase()} plans are available with rates starting at ${context.lowestRate}¢/kWh.`
    },
    {
      question: `Are ${filterName.toLowerCase()} plans available in ${cityName}?`,
      answer: `Yes, ${cityName} residents can choose from ${context.planCount} different ${filterName.toLowerCase()} electricity plans. These plans are offered by multiple providers and delivered through ${context.tdspName} infrastructure.`
    },
    {
      question: `What are the benefits of ${filterName.toLowerCase()} plans?`,
      answer: `${filterName} plans provide ${getFilterBenefits(context.filters[0]).primary.toLowerCase()} and ${getFilterBenefits(context.filters[0]).secondary.toLowerCase()}. This makes them ideal for ${cityName} residents who ${getFilterBenefits(context.filters[0]).idealFor}.`
    }
  ];
}

function generateCombinationFAQ(filterCombination: string, cityName: string, context: ContentContext) {
  return [
    {
      question: `What makes ${filterCombination.toLowerCase()} plans special?`,
      answer: `${filterCombination} plans combine the benefits of ${formatFilterName(context.filters[0]).toLowerCase()} and ${formatFilterName(context.filters[1]).toLowerCase()} plans. This gives ${cityName} residents ${getCombinationBenefits(context.filters).description}.`
    },
    {
      question: `How many ${filterCombination.toLowerCase()} plans are available in ${cityName}?`,
      answer: `Currently, ${context.planCount} ${filterCombination.toLowerCase()} plans are available in ${cityName}, Texas, with rates starting at ${context.lowestRate}¢/kWh from providers like ${context.topProvider}.`
    },
    {
      question: `Who should choose ${filterCombination.toLowerCase()} plans?`,
      answer: `${filterCombination} plans are perfect for ${cityName} residents who ${getCombinationBenefits(context.filters).idealCustomer}. These specialized plans offer enhanced value for customers with specific electricity needs.`
    }
  ];
}

function generateProviderFAQ(providerName: string, cityName: string, context: ContentContext) {
  const providerInfo = getProviderInfo(context.provider);
  return [
    {
      question: `What ${providerName} electricity plans are available in ${cityName}?`,
      answer: `${providerName} offers ${context.planCount} electricity plans in ${cityName}, Texas, with rates starting at ${context.lowestRate}¢/kWh. Plans include various term lengths and pricing structures to meet different customer needs.`
    },
    {
      question: `Is ${providerName} reliable in ${cityName}?`,
      answer: `Yes, ${providerName} is ${providerInfo.marketPosition} with ${providerInfo.experience}. All electricity is delivered through ${context.tdspName} infrastructure, ensuring reliable service to ${cityName} customers.`
    },
    {
      question: `What makes ${providerName} different from other providers?`,
      answer: `${providerName} stands out with ${providerInfo.primaryBenefit.toLowerCase()} and ${providerInfo.secondaryBenefit.toLowerCase()}. Their ${providerInfo.specialization.toLowerCase()} makes them a popular choice for ${cityName} residents.`
    }
  ];
}

// Local context generation for regional relevance
function generateLocalContext(cityName: string, context: ContentContext): string {
  const localFactors = [
    `${cityName} residents benefit from competitive electricity rates due to the city's location in the ${context.tdspName} service territory.`,
    `With a population of ${context.population.toLocaleString()}, ${cityName} represents a significant portion of Texas electricity consumers.`,
    `${cityName}'s ${getSeasonalModifier(context.seasonalContext).context.toLowerCase()} creates optimal conditions for electricity plan switching.`,
    `Local infrastructure improvements by ${context.tdspName} ensure reliable electricity delivery throughout ${cityName}.`
  ];
  
  return localFactors.join(' ');
}

/**
 * Batch content generation for high-volume page creation
 * Optimized for processing thousands of pages efficiently
 */
export async function generateBatchContent(
  contexts: ContentContext[],
  templateType: 'city-hub' | 'single-filter' | 'multi-filter' | 'provider',
  batchSize: number = 50
): Promise<Map<string, ContentTemplate>> {
  const results = new Map<string, ContentTemplate>();
  
  // Process in batches to manage memory usage
  for (let i = 0; i < contexts.length; i += batchSize) {
    const batch = contexts.slice(i, i + batchSize);
    
    const batchPromises = batch.map(context => {
      switch (templateType) {
        case 'city-hub':
          return generateCityHubContent(context);
        case 'single-filter':
          return generateSingleFilterContent(context);
        case 'multi-filter':
          return generateMultiFilterContent(context);
        case 'provider':
          return generateProviderContent(context as ContentContext & { provider: string });
        default:
          return generateCityHubContent(context);
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    // Map results back to contexts
    batch.forEach((context, index) => {
      const key = `${context.city}-${context.filters.join('-')}`;
      results.set(key, batchResults[index]);
    });
  }
  
  return results;
}

/**
 * Content template performance optimization
 * Clear caches and track generation statistics
 */
export function optimizeContentTemplates() {
  const stats = {
    templateCacheSize: templateCache.size,
    heroCacheSize: heroCache.size,
    faqCacheSize: faqCache.size,
    localContextCacheSize: localContextCache.size
  };
  
  // Clear caches if they get too large
  if (templateCache.size > 1000) {
    templateCache.clear();
  }
  if (heroCache.size > 500) {
    heroCache.clear();
  }
  if (faqCache.size > 500) {
    faqCache.clear();
  }
  if (localContextCache.size > 500) {
    localContextCache.clear();
  }
  
  return stats;
}