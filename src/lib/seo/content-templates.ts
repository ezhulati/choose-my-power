/**
 * SEO-Optimized Content Templates for Electricity Comparison Platform
 * Designed for 10,000+ scalable pages with semantic content generation
 * Performance target: <50ms per template generation
 */

import { DEFAULT_COUNTS } from '../utils/dynamic-counts';

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
      headline: `${cityName} Electricity Plans`,
      subheadline: `Compare ${context.planCount} electricity plans for ${cityName}. Rates start at ${context.lowestRate}¢/kWh from licensed providers.`,
      cta: `Compare Plans`,
      benefits: [
        `${context.planCount} plans from licensed providers`,
        `Rates from ${context.lowestRate}¢/kWh with all fees included`,
        `Compare plans by rate, term, and features`,
        `Switch online or by phone`,
        `No enrollment fees`
      ]
    },
    introduction: `Compare electricity plans in ${cityName}. We list ${context.planCount} plans from licensed providers with transparent rates and terms. All plans include delivery charges and fees in the displayed rate.`,
    keyPoints: [
      `${localUtility} delivers electricity to all ${cityName} customers`,
      `${DEFAULT_COUNTS.providers} licensed providers serve this area`,
      `Switch anytime without penalties from current provider`,
      `Fixed-rate plans protect against price changes`,
      `Green energy plans use renewable sources`
    ],
    comparison: {
      title: `${cityName} Electricity Comparison`,
      description: `We show ${context.planCount} electricity plans available in ${cityName}. All plans are from licensed providers with transparent pricing and clear terms.`,
      callout: `Your electricity usage varies by home size and appliances. Compare plans based on your actual usage to find the best rate.`
    },
    faq: generateCityFAQ(cityName, context),
    conclusion: `Compare electricity plans in ${cityName} to find the right rate and terms for your home. Switch online or call your chosen provider to enroll.`,
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
      headline: `${filterName} Electricity Plans in ${cityName}`,
      subheadline: `${context.planCount} ${filterName.toLowerCase()} plans available in ${cityName}. Compare rates starting at ${context.lowestRate}¢/kWh.`,
      cta: `Compare ${filterName} Plans`,
      benefits: [
        `${context.planCount} ${filterName.toLowerCase()} plans available`,
        `Rates starting at ${context.lowestRate}¢/kWh`,
        `Clear terms and pricing`,
        `Licensed providers serving ${cityName}`,
        `Switch online or by phone`
      ]
    },
    introduction: `${context.planCount} ${filterName.toLowerCase()} electricity plans are available in ${cityName}. Compare rates, terms, and features from licensed providers.`,
    keyPoints: [
      `${filterBenefits.primary}`,
      `${context.planCount} plans from licensed providers`,
      `Rates from ${context.lowestRate}¢/kWh including delivery`,
      `Served by ${context.tdspName}`,
      `Switch without penalties`
    ],
    comparison: {
      title: `${filterName} Plans in ${cityName}`,
      description: `${context.planCount} ${filterName.toLowerCase()} plans available with rates from ${context.lowestRate}¢/kWh. Compare features and choose the plan that fits your needs.`,
      callout: `${filterName} plans offer ${filterBenefits.primary.toLowerCase()}.`
    },
    faq: generateFilterFAQ(filterName, cityName, context),
    conclusion: `Choose from ${context.planCount} ${filterName.toLowerCase()} plans in ${cityName}. Compare rates and terms to find the right plan for your home.`,
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
      headline: `${filterCombination} Electricity Plans`,
      subheadline: `${context.planCount} plans combining ${primaryFilter.toLowerCase()} and ${secondaryFilter.toLowerCase()} features in ${cityName}. Rates from ${context.lowestRate}¢/kWh.`,
      cta: `Compare Plans`,
      benefits: [
        `${primaryFilter} with ${secondaryFilter} features`,
        `${context.planCount} available plans`,
        `Rates from ${context.lowestRate}¢/kWh`,
        `Licensed providers serving ${cityName}`,
        `${context.tdspName} territory coverage`
      ]
    },
    introduction: `${context.planCount} electricity plans in ${cityName} offer both ${primaryFilter.toLowerCase()} and ${secondaryFilter.toLowerCase()} features.`,
    keyPoints: [
      `${primaryFilter} provides ${getFilterBenefits(context.filters[0]).primary.toLowerCase()}`,
      `${secondaryFilter} adds ${getFilterBenefits(context.filters[1]).primary.toLowerCase()}`,
      `${context.planCount} plans available from top-rated Texas electricity providers`,
      `All plans include transparent pricing with no hidden fees`,
      `${context.tdspName} ensures reliable electricity delivery in ${cityName}`
    ],
    comparison: {
      title: `${filterCombination} Plans in ${cityName}`,
      description: `${getCombinationBenefits(context.filters).advantage} These plans serve customers who ${getCombinationBenefits(context.filters).idealCustomer}.`,
      callout: `${context.planCount} plans available from ${context.topProvider} and other licensed providers.`
    },
    faq: generateCombinationFAQ(filterCombination, cityName, context),
    conclusion: `Compare ${context.planCount} ${filterCombination.toLowerCase()} plans available in ${cityName} from licensed electricity providers.`,
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
      headline: `${providerName} Electricity Plans in ${cityName}`,
      subheadline: `${context.planCount} ${providerName} plans available in ${cityName}. Rates from ${context.lowestRate}¢/kWh from a licensed Texas provider.`,
      cta: `Compare ${providerName} Plans`,
      benefits: [
        providerInfo.primaryBenefit,
        providerInfo.secondaryBenefit,
        `${context.planCount} vetted ${providerName} options in ${cityName}`,
        `Real rates from ${context.lowestRate}¢/kWh (not teaser rates)`,
        `${context.tdspName} delivers it all—same reliable service`
      ]
    },
    introduction: `${providerName} offers ${context.planCount} electricity plans in ${cityName} with rates starting at ${context.lowestRate}¢/kWh.`,
    keyPoints: [
      `${providerName} ${providerInfo.experience}—they know Texas electricity`,
      `${context.planCount} plan options that make sense for ${cityName} families`,
      `${providerInfo.specialization} instead of the usual runaround`,
      `Honest rates from ${context.lowestRate}¢/kWh with no hidden fees`,
      `${context.tdspName} delivers your power—${providerName} just handles billing better`
    ],
    comparison: {
      title: `Why ${providerName} Made Our ${cityName} Quality Cut`,
      description: `${providerInfo.competitive_advantage} ${providerName}'s ${context.planCount} available plans in ${cityName} offer ${providerInfo.unique_value}. We vetted dozens of providers—these are the ones that don't play games.`,
      callout: `${providerName} customers in ${cityName} get ${providerInfo.customer_benefit} and honest ${context.lowestRate}¢/kWh rates. No surprises, no tricks.`
    },
    faq: generateProviderFAQ(providerName, cityName, context),
    conclusion: `Look, ${providerName} made our quality cut for ${cityName} for good reasons. ${context.planCount} solid plan options, rates from ${context.lowestRate}¢/kWh, and ${providerInfo.closing_value}. Simple choice, money saved.`,
    localContext: `${providerName} serves ${cityName}'s ${context.population.toLocaleString()}+ residents through ${context.tdspName} infrastructure. Here's what matters: ${providerInfo.local_advantage} and they understand how to serve Texas families without the runaround.`
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
      primary: 'Rate locked for 12 months',
      secondary: 'Moderate-length contract term', 
      description: 'rate protection for one year',
      keyPoint1: 'Fixed rate for the contract term',
      idealFor: 'want rate stability',
      additionalBenefit: 'Protected from rate increases',
      comparison: '12-month contracts provide rate stability.',
      bestFor: 'want predictable bills',
      localAdvantage: 'protection from seasonal rate changes',
      core: 'rate stability',
    },
    'fixed-rate': {
      primary: 'Rate stays the same throughout contract',
      secondary: 'Protection from market price changes',
      description: 'consistent rate per kWh',
      keyPoint1: 'Rate locked for contract duration',
      idealFor: 'want predictable bills',
      additionalBenefit: 'Budget certainty',
      comparison: 'Fixed rates provide price stability.',
      bestFor: 'want consistent pricing',
      localAdvantage: 'protection from market volatility',
      core: 'price certainty',
    },
    'green-energy': {
      primary: 'Electricity from renewable sources',
      secondary: 'Supports wind and solar power',
      description: 'renewable energy plans',
      keyPoint1: 'Power from wind and solar sources',
      idealFor: 'want renewable energy',
      additionalBenefit: 'Supports clean energy generation',
      comparison: 'Green plans use renewable energy sources.',
      bestFor: 'prefer renewable energy',
      localAdvantage: 'Texas renewable energy resources',
      core: 'renewable energy',
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
      reputation: 'Been around since 1996—they\'re not going anywhere',
      primaryBenefit: 'Actually answers their customer service phone',
      secondaryBenefit: 'Plan options that make sense',
      description: 'reliable service without the runaround',
      marketPosition: 'one of the Texas providers that doesn\'t play games',
      experience: 'has been figuring out Texas electricity for 25+ years',
      specialization: 'Customer service that doesn\'t make you want to scream',
      competitive_advantage: 'Reliant combines experience with plans that actually work.',
      unique_value: 'straightforward terms and customer support that helps',
      customer_benefit: 'customer service that picks up the phone',
      closing_value: 'reliable service without the headaches',
      local_advantage: 'they know Texas and how things work here'
    },
    'txu-energy': {
      reputation: 'Texas\' biggest provider—love them or not, they\'re everywhere',
      primaryBenefit: 'Tons of plan options',
      secondaryBenefit: 'They\'re not going out of business',
      description: 'comprehensive options with the staying power of being huge',
      marketPosition: 'the biggest fish in the Texas electricity pond',
      experience: 'has been doing this longer than most',
      specialization: 'Every type of plan you can think of',
      competitive_advantage: 'TXU\'s size means competitive rates and they\'ll be here tomorrow.',
      unique_value: 'plan variety and "we\'re too big to fail" reliability',
      customer_benefit: 'lots of choices and market stability',
      closing_value: 'comprehensive options and company stability',
      local_advantage: 'they\'re literally everywhere in Texas'
    }
  };
  
  return providers[provider] || {
    reputation: 'One of the quality Texas providers we work with',
    primaryBenefit: 'Honest rates without the games',
    secondaryBenefit: 'Customer service that doesn\'t suck',
    description: 'straightforward service and competitive rates',
    marketPosition: 'a Texas provider that made our quality cut',
    experience: 'knows the Texas electricity market',
    specialization: 'Focuses on rates that work and service that helps',
    competitive_advantage: 'This provider earned a spot in our quality lineup.',
    unique_value: 'honest pricing and reliable service',
    customer_benefit: 'decent service and fair pricing',
    closing_value: 'reliable electricity without the runaround',
    local_advantage: 'understands how Texas electricity actually works'
  };
}

// FAQ Generation Functions

function generateCityFAQ(cityName: string, context: ContentContext) {
  return [
    {
      question: `Should I transfer my current electricity plan to ${cityName}?`,
      answer: `No. Electricity plans are based on usage patterns and home characteristics. Compare new plans for your ${cityName} address to find the best rate for your actual usage.`
    },
    {
      question: `Why do you show ${context.planCount} plans instead of all available plans?`,
      answer: `We display plans from ${DEFAULT_COUNTS.providers} licensed electricity companies that serve ${cityName}. This includes major providers with competitive rates and reliable service.`
    },
    {
      question: `Do you work with all electricity providers in ${cityName}?`,
      answer: `We work with licensed electricity companies serving ${cityName}. ${context.tdspName} delivers electricity to all customers regardless of which provider you choose.`
    },
    {
      question: `How do I choose the right electricity plan in ${cityName}?`,
      answer: `Compare plans by rate, contract length, and features. Fixed-rate plans offer predictable bills. Variable rates may change monthly. Green energy plans use renewable sources and typically cost the same as traditional plans.`
    },
    {
      question: `Are these ${cityName} rates what I'll actually pay?`,
      answer: `The displayed rates include delivery charges and standard fees for ${cityName}. Your total bill depends on your monthly usage and any additional services you choose.`
    }
  ];
}

function generateFilterFAQ(filterName: string, cityName: string, context: ContentContext) {
  return [
    {
      question: `What's the truth about "${filterName.toLowerCase()}" electricity plans?`,
      answer: `Here's what companies don't tell you: Half the plans labeled "${filterName.toLowerCase()}" aren't really ${filterName.toLowerCase()} at all. We found ${context.planCount} in ${cityName} that actually deliver ${getFilterBenefits(context.filters[0]).description} like you'd expect. Real rates from ${context.lowestRate}¢/kWh.`
    },
    {
      question: `Why do some ${filterName.toLowerCase()} plans have 40 pages of fine print?`,
      answer: `Because they're hiding something. Real ${filterName.toLowerCase()} plans are simple—you get ${getFilterBenefits(context.filters[0]).primary.toLowerCase()} like promised. If a ${cityName} company needs a novel to explain their "${filterName.toLowerCase()}" plan, run.`
    },
    {
      question: `Who should pick ${filterName.toLowerCase()} plans in ${cityName}?`,
      answer: `You'll love ${filterName.toLowerCase()} plans if you ${getFilterBenefits(context.filters[0]).idealFor} and want ${getFilterBenefits(context.filters[0]).core}. Perfect for ${cityName} families who are tired of bill surprises and want something that actually works as advertised.`
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
      question: `Should I trust ${providerName} in ${cityName}?`,
      answer: `${providerName} is ${providerInfo.marketPosition} and ${providerInfo.experience} serving Texas families. Here's what matters: ${context.tdspName} delivers your power no matter what—${providerName} just handles billing. They offer ${context.planCount} plans with rates from ${context.lowestRate}¢/kWh.`
    },
    {
      question: `What's actually different about ${providerName}?`,
      answer: `Honest answer: ${providerInfo.primaryBenefit.toLowerCase()} and ${providerInfo.secondaryBenefit.toLowerCase()}. Look, most electricity companies do the same thing—send you bills. ${providerName} focuses on ${providerInfo.specialization.toLowerCase()}, which matters to ${cityName} families who want reliable service.`
    },
    {
      question: `Are ${providerName}'s rates in ${cityName} competitive?`,
      answer: `Yes, you'll find competitive rates starting at ${context.lowestRate}¢/kWh. But here's the key: we only show ${providerName} plans that are actually available in your ${cityName} area. No bait-and-switch, no "rates vary by location" fine print.`
    }
  ];
}

// Local context generation with conversational, helpful tone
function generateLocalContext(cityName: string, context: ContentContext): string {
  const localFactors = [
    `Here's what ${cityName} residents need to know: You're in ${context.tdspName}'s service territory, which means competitive rates and reliable delivery.`,
    `With ${context.population.toLocaleString()}+ people, ${cityName} has serious buying power—providers want your business.`,
    `${cityName}'s ${getSeasonalModifier(context.seasonalContext).context.toLowerCase()} makes this the perfect time to switch and start saving.`,
    `Your electricity gets delivered the same way no matter who you pick—${context.tdspName} handles the wires, companies handle the billing.`
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