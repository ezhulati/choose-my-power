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
      headline: `Finally. ${cityName} Electricity That Makes Sense`,
      subheadline: `Moving to ${cityName}? Here's why transferring your old plan usually backfires: Your old rate was based on your OLD home's size. "Fixed" rates aren't fixed—they change with usage. A plan for a 2-bedroom apartment costs way more in a 4-bedroom house.`,
      cta: `Show Me Plans That Actually Work in ${cityName}`,
      benefits: [
        `${context.planCount} plans from quality providers (we filtered out the garbage)`,
        `Real rates starting at ${context.lowestRate}¢/kWh—no teaser games`,
        `We've been there, got fooled, figured it out for ${cityName}`,
        `No sales calls after—promise`,
        `10 minutes to pick, hundreds saved all year`
      ]
    },
    introduction: `Finally, someone decoded ${cityName}'s electricity mess. Look, we got tricked by those "9.5¢ teaser rates" too—until we figured out the game. Now we show you ${context.planCount} plans that actually work, with real math instead of marketing nonsense. You'll find honest comparisons here, not 40-page contracts full of gotchas.`,
    keyPoints: [
      `Here's what they don't tell you: ${localUtility} delivers your power no matter who you pick—companies just send bills`,
      `We work with ${DEFAULT_COUNTS.providers} quality providers in ${cityName} (not "all" providers—that's impossible)`,
      `Your savings start the moment you switch—but only if you pick right`,
      `${seasonalModifier.context} means smart ${cityName} families are switching now, before rates jump`,
      `"Green" energy costs the same as regular—we'll show you real Texas wind power, not marketing fluff`
    ],
    comparison: {
      title: `Why Smart ${cityName} Residents Skip Power to Choose`,
      description: `Power to Choose lists 500+ plans designed to confuse you. We show ${context.planCount} that actually work. You'll find plans from trusted providers here—we already read the 40-page contracts and filtered out the tricks. No "free nights" that cost more, no F-rated companies, no bait-and-switch rates.`,
      callout: `Moving warning: That "8.9¢" plan from your old apartment? In ${cityName}, it'll probably cost 14¢+ because your new home uses electricity differently. Don't transfer—compare fresh.`
    },
    faq: generateCityFAQ(cityName, context),
    conclusion: `Look, ${cityName}'s electricity market is designed to trick you into overpaying. We've been there—got fooled, learned the hard way, figured it out. Now you get the shortcuts. Ten minutes here, hundreds saved all year. That's the deal.`,
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
      headline: `Finally. ${filterName} Plans in ${cityName} Without the Games`,
      subheadline: `Tired of "${filterName.toLowerCase()}" plans that aren't really ${filterName.toLowerCase()}? We found ${context.planCount} that actually deliver what they promise. You'll find real rates from ${context.lowestRate}¢/kWh with zero fine-print tricks.`,
      cta: `Show Me Real ${filterName} Options`,
      benefits: [
        `${context.planCount} ${filterName.toLowerCase()} plans that aren't scams`,
        `Actual prices starting at ${context.lowestRate}¢/kWh (at YOUR usage, not just 1000 kWh)`,
        `We read the contracts so you don't have to`,
        `What "${filterName.toLowerCase()}" really means (spoiler: not what you think)`,
        `10 minutes to pick, no sales calls after`
      ]
    },
    introduction: `Here's the truth about "${filterName.toLowerCase()}" plans in ${cityName}: Most companies use that label to trick you. We checked the fine print on dozens of plans and found ${context.planCount} that actually work like you'd expect. You'll find honest ${filterName.toLowerCase()} options here—no page 37 gotchas.`,
    keyPoints: [
      `${filterBenefits.keyPoint1} - ideal for ${cityName} residents who ${filterBenefits.idealFor}`,
      `${context.planCount} ${filterName.toLowerCase()} plans available from trusted Texas providers`,
      `Rates starting at ${context.lowestRate}¢/kWh with transparent pricing`,
      `All plans include ${context.tdspName} delivery charges and regulatory fees`,
      `${filterBenefits.additionalBenefit} for enhanced value`
    ],
    comparison: {
      title: `Why Most ${filterName} Plans in ${cityName} Are Fake`,
      description: `Companies slap "${filterName.toLowerCase()}" on anything to get clicks. Like "fixed rates" that jump if you use 999 or 1001 kWh—that's not fixed. We found the ${context.planCount} plans that actually work like ${cityName} families expect.`,
      callout: `Red flag: If a "${filterName.toLowerCase()}" plan needs 40 pages to explain itself, run. Real ${filterName.toLowerCase()} plans are simple.`
    },
    faq: generateFilterFAQ(filterName, cityName, context),
    conclusion: `Stop falling for fake "${filterName.toLowerCase()}" marketing. We got burned by it too, then figured out which ${context.planCount} plans in ${cityName} actually deliver. Ten minutes to pick, then you're set. Simple.`,
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
      headline: `Finally. ${filterCombination} Plans That Actually Work`,
      subheadline: `Want ${primaryFilter.toLowerCase()} AND ${secondaryFilter.toLowerCase()}? Most ${cityName} companies force you to choose. We found ${context.planCount} plans that give you both without the usual compromises. You'll find real rates from ${context.lowestRate}¢/kWh.`,
      cta: `Show Me ${filterCombination} That Works`,
      benefits: [
        `Real ${primaryFilter} + actual ${secondaryFilter} (not marketing fluff)`,
        `${context.planCount} plans that passed our quality filter`,
        `Built for how ${cityName} families actually use electricity`,
        `True rates starting at ${context.lowestRate}¢/kWh (we did the math)`,
        `${context.tdspName} delivers it all—same wires, better deal`
      ]
    },
    introduction: `Here's the game ${cityName} electricity companies play: Want ${primaryFilter.toLowerCase()}? Give up ${secondaryFilter.toLowerCase()}. Want both? "Sorry, pick one." We found ${context.planCount} plans that refuse to play this game. You'll find real ${getFilterBenefits(context.filters[0]).core} AND actual ${getFilterBenefits(context.filters[1]).core} here.`,
    keyPoints: [
      `${primaryFilter} provides ${getFilterBenefits(context.filters[0]).primary.toLowerCase()}`,
      `${secondaryFilter} adds ${getFilterBenefits(context.filters[1]).primary.toLowerCase()}`,
      `${context.planCount} plans available from top-rated Texas electricity providers`,
      `All plans include transparent pricing with no hidden fees`,
      `${context.tdspName} ensures reliable electricity delivery in ${cityName}`
    ],
    comparison: {
      title: `Why ${filterCombination} Actually Makes Sense in ${cityName}`,
      description: `Here's what we discovered: ${getCombinationBenefits(context.filters).advantage} Perfect for ${cityName} families who ${getCombinationBenefits(context.filters).idealCustomer}. Everyone else is overpaying.`,
      callout: `Heads up: ${context.topProvider} claims ${filterCombination.toLowerCase()} at ${context.lowestRate}¢/kWh, but check the usage bands. The rate jumps if you're off by 1 kWh.`
    },
    faq: generateCombinationFAQ(filterCombination, cityName, context),
    conclusion: `Finally, ${filterCombination.toLowerCase()} plans that don't force fake choices. We did the legwork to find ${context.planCount} real options for ${cityName} families. You get both ${primaryFilter.toLowerCase()} AND ${secondaryFilter.toLowerCase()} without compromise. Pick one, move on.`,
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
      headline: `Finally. ${providerName} Plans in ${cityName} That Actually Work`,
      subheadline: `${context.planCount} ${providerName} plans in ${cityName} that passed our quality filter. ${providerInfo.reputation} with honest rates from ${context.lowestRate}¢/kWh—no fine print games.`,
      cta: `Show Me ${providerName} Plans That Work`,
      benefits: [
        providerInfo.primaryBenefit,
        providerInfo.secondaryBenefit,
        `${context.planCount} vetted ${providerName} options in ${cityName}`,
        `Real rates from ${context.lowestRate}¢/kWh (not teaser rates)`,
        `${context.tdspName} delivers it all—same reliable service`
      ]
    },
    introduction: `Here's the deal with ${providerName} in ${cityName}: ${providerInfo.description}. As ${providerInfo.marketPosition}, they've earned a spot in our quality lineup. You'll find ${context.planCount} ${providerName} plans that actually work, with rates from ${context.lowestRate}¢/kWh. No gotchas.`,
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
      primary: 'Your rate stays locked for exactly 12 months',
      secondary: 'Perfect balance of stability and flexibility', 
      description: 'real rate protection that actually works',
      keyPoint1: 'Rate protection that means something—no surprises for 12 months',
      idealFor: 'want predictable bills without the 3-year commitment trap',
      additionalBenefit: 'No rate games, no seasonal surprises',
      comparison: 'Most 12-month plans are honest—unlike those "teaser rate" scams.',
      bestFor: 'want stable bills but hate long commitments',
      localAdvantage: 'Texas weather swings and seasonal usage patterns',
      core: 'honest rate stability',
    },
    'fixed-rate': {
      primary: 'Your rate never changes (for real this time)',
      secondary: 'Protection from Texas market craziness',
      description: 'actual fixed rates that stay fixed',
      keyPoint1: 'Rate locked in stone—not "fixed until we change it"',
      idealFor: 'are tired of bill surprises and rate games',
      additionalBenefit: 'Sleep well knowing your rate won\'t jump',
      comparison: 'Real fixed rates vs. "fixed" rates that aren\'t really fixed.',
      bestFor: 'want zero rate surprises',
      localAdvantage: 'Texas market volatility and price manipulation',
      core: 'actual price certainty',
    },
    'green-energy': {
      primary: 'Real Texas wind power (not just marketing)',
      secondary: 'Costs the same as regular electricity',
      description: 'actual clean energy from Texas wind farms',
      keyPoint1: 'Support real Texas renewable energy—wind and solar that actually works',
      idealFor: 'want to help the environment without paying extra',
      additionalBenefit: 'Feel good about your electricity choice',
      comparison: 'Real green energy vs. "green" marketing that means nothing.',
      bestFor: 'care about Texas wind farms and solar',
      localAdvantage: 'Texas leads the nation in wind power generation',
      core: 'real environmental impact',
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
      question: `I'm moving to ${cityName}. Should I transfer my current electricity plan?`,
      answer: `No way. Here's why transferring your old plan usually backfires: Your old rate was based on your OLD home's size. "Fixed" rates aren't fixed—they change with usage. A plan for a 2-bedroom apartment costs way more in a 4-bedroom house. Moving to ${cityName}? Start fresh and save money.`
    },
    {
      question: `Why do you only show ${context.planCount} plans instead of hundreds like other sites?`,
      answer: `Because we filtered out the garbage. Other sites show every plan to look "complete"—including F-rated companies and bait-and-switch rates. We work with ${DEFAULT_COUNTS.providers} quality providers in ${cityName}. You'll find plans that actually work, not 500 ways to get scammed.`
    },
    {
      question: `Do you really work with "all" electricity providers in ${cityName}?`,
      answer: `Honest answer: No. Nobody does. We work with quality providers that actually serve ${cityName}—about 12-15 companies. Other sites claim "all providers" but that's impossible. ${context.tdspName} delivers your power no matter who you pick. We focus on companies that won't trick you.`
    },
    {
      question: `How do I pick the right electricity plan for my ${cityName} home?`,
      answer: `Here's what works: Think about your budget first. You want predictable bills? Pick fixed rates. Want to gamble on market prices? Try variable. "Green" energy costs the same as regular but supports Texas wind farms. We explain what each actually means for your ${cityName} situation.`
    },
    {
      question: `Are these ${cityName} rates what I'll actually pay?`,
      answer: `Yes. We show real rates with all fees included—no "starting at" tricks or teaser rates that explode after 3 months. The rate you see is what you'll pay per kWh in ${cityName}. Your savings start the moment you switch to a better plan.`
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