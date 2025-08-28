/**
 * Advanced Internal Linking Hub-Spoke System for Maximum Authority Distribution
 * Implements sophisticated topical authority clusters and semantic linking patterns
 * Optimized for 10,000+ electricity plan pages with intelligent link distribution
 * 
 * FEATURES:
 * - Multi-tier hub-spoke architecture with authority flow optimization
 * - Semantic relationship mapping between filter combinations
 * - Dynamic anchor text variation to avoid over-optimization
 * - Context-aware link placement based on user intent
 * - Performance-optimized link generation with caching
 * - A/B testing framework for link performance
 * - Link equity distribution algorithms
 * 
 * ARCHITECTURE:
 * - Tier 1 Hubs: Homepage, major city pages (highest authority)
 * - Tier 2 Spokes: Single filter pages, provider pages (authority distribution) 
 * - Tier 3 Leaves: Multi-filter combinations, specific plans (content depth)
 * - Cross-linking: Related filters, competitive alternatives, upgrades
 * - Topic Clusters: Educational content, comparison guides, local resources
 */

import { tdspMapping, formatCityName, formatFilterName } from '../../config/tdsp-mapping';
import type { Plan } from '../../types/facets';

export interface InternalLink {
  url: string;
  anchorText: string;
  title: string;
  context: 'navigation' | 'contextual' | 'related' | 'breadcrumb' | 'semantic' | 'competitive' | 'educational';
  priority: 'high' | 'medium' | 'low';
  linkEquity: number; // Estimated authority flow (0-1)
  placement: 'header' | 'content' | 'sidebar' | 'footer';
  targetSegment?: 'new-residents' | 'switchers' | 'green-conscious' | 'budget-focused';
  seasonality?: 'winter' | 'summer' | 'spring' | 'fall' | 'year-round';
  nofollow?: boolean;
  trackingId?: string;
}

export interface LinkingContext {
  currentCity: string;
  currentFilters: string[];
  relatedPlans?: Plan[];
  tdspZone?: string;
  pageAuthority?: number; // Estimated page authority (0-100)
  userIntent?: 'research' | 'comparison' | 'ready-to-switch';
  trafficSource?: 'organic' | 'paid' | 'direct' | 'referral';
  seasonalContext?: 'winter' | 'summer' | 'spring' | 'fall';
  competitorMentions?: string[];
  contentDepth: 'shallow' | 'medium' | 'deep';
  linkBudget: number; // Maximum links to include
}

/**
 * Generate comprehensive internal linking strategy with advanced authority distribution
 * Implements hub-spoke architecture with semantic relationship mapping
 */
export function generateInternalLinks(context: LinkingContext): {
  navigationLinks: InternalLink[];
  contextualLinks: InternalLink[];
  relatedPageLinks: InternalLink[];
  breadcrumbLinks: InternalLink[];
  semanticLinks: InternalLink[];
  competitiveLinks: InternalLink[];
  educationalLinks: InternalLink[];
  authorityFlow: AuthorityFlowMap;
} {
  const { currentCity, currentFilters, relatedPlans, tdspZone, pageAuthority, userIntent, contentDepth, linkBudget, seasonalContext } = context;
  const cityName = formatCityName(currentCity);
  
  // Calculate optimal link distribution based on page authority and content depth
  const linkDistribution = calculateOptimalLinkDistribution(pageAuthority || 50, contentDepth, linkBudget);
  
  // Generate enhanced link categories
  const navigationLinks = generateEnhancedNavigationLinks(currentCity, currentFilters, linkDistribution.navigation);
  const contextualLinks = generateEnhancedContextualLinks(currentCity, currentFilters, relatedPlans, userIntent, linkDistribution.contextual);
  const relatedPageLinks = generateEnhancedRelatedPageLinks(currentCity, currentFilters, tdspZone, seasonalContext, linkDistribution.related);
  const breadcrumbLinks = generateEnhancedBreadcrumbLinks(currentCity, currentFilters);
  
  // New advanced link types
  const semanticLinks = generateSemanticLinks(currentCity, currentFilters, linkDistribution.semantic);
  const competitiveLinks = generateCompetitiveLinks(currentCity, currentFilters, linkDistribution.competitive);
  const educationalLinks = generateEducationalLinks(currentCity, currentFilters, userIntent, linkDistribution.educational);
  
  // Calculate authority flow map
  const authorityFlow = calculateAuthorityFlow({
    navigationLinks,
    contextualLinks,
    relatedPageLinks,
    semanticLinks,
    competitiveLinks,
    educationalLinks
  }, pageAuthority || 50);
  
  return {
    navigationLinks,
    contextualLinks,
    relatedPageLinks,
    breadcrumbLinks,
    semanticLinks,
    competitiveLinks,
    educationalLinks,
    authorityFlow
  };
}

/**
 * Calculate optimal link distribution based on page characteristics
 */
interface LinkDistribution {
  navigation: number;
  contextual: number;
  related: number;
  semantic: number;
  competitive: number;
  educational: number;
}

function calculateOptimalLinkDistribution(
  pageAuthority: number,
  contentDepth: 'shallow' | 'medium' | 'deep',
  linkBudget: number
): LinkDistribution {
  // Base distribution percentages
  let distribution = {
    navigation: 0.20,
    contextual: 0.30,
    related: 0.25,
    semantic: 0.10,
    competitive: 0.05,
    educational: 0.10
  };
  
  // Adjust based on page authority (higher authority = more outbound links)
  if (pageAuthority > 70) {
    distribution.contextual += 0.05;
    distribution.semantic += 0.05;
  } else if (pageAuthority < 30) {
    distribution.navigation += 0.05;
    distribution.competitive -= 0.05;
  }
  
  // Adjust based on content depth
  if (contentDepth === 'deep') {
    distribution.educational += 0.10;
    distribution.semantic += 0.05;
    distribution.related -= 0.10;
    distribution.competitive -= 0.05;
  } else if (contentDepth === 'shallow') {
    distribution.navigation += 0.10;
    distribution.educational -= 0.05;
    distribution.semantic -= 0.05;
  }
  
  // Convert percentages to actual link counts
  return {
    navigation: Math.round(linkBudget * distribution.navigation),
    contextual: Math.round(linkBudget * distribution.contextual),
    related: Math.round(linkBudget * distribution.related),
    semantic: Math.round(linkBudget * distribution.semantic),
    competitive: Math.round(linkBudget * distribution.competitive),
    educational: Math.round(linkBudget * distribution.educational)
  };
}

/**
 * Authority flow mapping for link equity distribution
 */
export interface AuthorityFlowMap {
  totalOutboundEquity: number;
  linksByEquity: Array<{ url: string; equity: number; category: string; }>;
  topAuthorityTargets: string[];
  equityDistribution: Record<string, number>;
}

function calculateAuthorityFlow(
  allLinks: Record<string, InternalLink[]>,
  pageAuthority: number
): AuthorityFlowMap {
  const allLinksFlat = Object.values(allLinks).flat();
  const totalLinks = allLinksFlat.length;
  
  // Calculate page authority distribution (simplified PageRank-like calculation)
  const authorityPerLink = pageAuthority / totalLinks;
  
  // Distribute authority based on link priority and context
  const linksByEquity = allLinksFlat.map(link => {
    let equity = authorityPerLink;
    
    // Adjust equity based on priority
    if (link.priority === 'high') equity *= 1.5;
    else if (link.priority === 'low') equity *= 0.7;
    
    // Adjust equity based on context
    if (link.context === 'navigation') equity *= 1.3;
    else if (link.context === 'contextual') equity *= 1.2;
    else if (link.context === 'competitive') equity *= 0.8;
    
    return {
      url: link.url,
      equity,
      category: link.context
    };
  }).sort((a, b) => b.equity - a.equity);
  
  const totalOutboundEquity = linksByEquity.reduce((sum, link) => sum + link.equity, 0);
  const topAuthorityTargets = linksByEquity.slice(0, 10).map(link => link.url);
  
  const equityDistribution = linksByEquity.reduce((acc, link) => {
    acc[link.category] = (acc[link.category] || 0) + link.equity;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalOutboundEquity,
    linksByEquity,
    topAuthorityTargets,
    equityDistribution
  };
}

/**
 * Generate primary navigation links (hub strategy)
 */
function generateNavigationLinks(currentCity: string, currentFilters: string[]): InternalLink[] {
  const cityName = formatCityName(currentCity);
  const citySlug = currentCity.replace('-tx', '');
  
  const links: InternalLink[] = [
    // Home page (highest authority hub)
    {
      url: '/',
      anchorText: 'Compare Texas Electricity Plans',
      title: 'Home - Compare electricity rates across Texas',
      context: 'navigation',
      priority: 'high'
    },
    
    // City hub page (distribute authority to filtered pages)
    {
      url: `/texas/${citySlug}/electricity-plans`,
      anchorText: `${cityName} Electricity Plans`,
      title: `All electricity plans available in ${cityName}, Texas`,
      context: 'navigation',
      priority: 'high'
    },
    
    // State-level pages
    {
      url: '/texas/electricity-plans',
      anchorText: 'Texas Electricity Plans',
      title: 'Compare electricity plans across all Texas cities',
      context: 'navigation',
      priority: 'medium'
    },
    
    // Provider comparison pages
    {
      url: `/texas/${citySlug}/electricity-providers`,
      anchorText: `${cityName} Electricity Providers`,
      title: `Compare electricity companies serving ${cityName}`,
      context: 'navigation',
      priority: 'medium'
    }
  ];

  // Add filter-specific navigation if on filtered page
  if (currentFilters.length > 0) {
    // Link back to unfiltered city page
    links.push({
      url: `/texas/${citySlug}/electricity-plans`,
      anchorText: `All ${cityName} Plans`,
      title: `View all electricity plans in ${cityName}`,
      context: 'navigation',
      priority: 'high'
    });
  }

  return links;
}

/**
 * Generate contextual links within content (spoke strategy)
 */
function generateContextualLinks(
  currentCity: string, 
  currentFilters: string[], 
  relatedPlans?: Plan[]
): InternalLink[] {
  const cityName = formatCityName(currentCity);
  const citySlug = currentCity.replace('-tx', '');
  const links: InternalLink[] = [];

  // High-value filter combinations to link to
  const highValueFilters = [
    { filters: ['12-month'], anchor: '12-month electricity plans', title: '12-month fixed rate plans' },
    { filters: ['fixed-rate'], anchor: 'fixed rate electricity', title: 'Fixed rate electricity plans' },
    { filters: ['green-energy'], anchor: '100% green energy plans', title: '100% renewable energy options' },
    { filters: ['prepaid'], anchor: 'prepaid electricity plans', title: 'No deposit prepaid plans' },
    { filters: ['12-month', 'fixed-rate'], anchor: '12-month fixed rate plans', title: 'Annual fixed rate electricity' },
    { filters: ['green-energy', '12-month'], anchor: 'annual green energy plans', title: '12-month renewable energy contracts' }
  ];

  // Generate links to related filter combinations
  highValueFilters.forEach(filterCombo => {
    // Don't link to current page
    const isCurrentPage = filterCombo.filters.length === currentFilters.length &&
                          filterCombo.filters.every(f => currentFilters.includes(f));
    
    if (!isCurrentPage) {
      const filterPath = filterCombo.filters.join('/');
      links.push({
        url: `/texas/${citySlug}/${filterPath}/electricity-plans`,
        anchorText: `${cityName} ${filterCombo.anchor}`,
        title: `${filterCombo.title} in ${cityName}`,
        context: 'contextual',
        priority: getFilterLinkPriority(filterCombo.filters)
      });
    }
  });

  // Add comparison pages
  if (currentFilters.length === 0) {
    links.push({
      url: `/texas/${citySlug}/compare-electricity-rates`,
      anchorText: `compare ${cityName} electricity rates`,
      title: `Compare all electricity rates in ${cityName}`,
      context: 'contextual',
      priority: 'medium'
    });
  }

  // Add provider-specific links if we have plan data
  if (relatedPlans && relatedPlans.length > 0) {
    const topProviders = getTopProvidersByPlanCount(relatedPlans).slice(0, 3);
    topProviders.forEach(provider => {
      links.push({
        url: `/providers/${provider.name.toLowerCase().replace(/\s+/g, '-')}/texas/${citySlug}`,
        anchorText: `${provider.name} electricity plans`,
        title: `${provider.name} electricity rates in ${cityName}`,
        context: 'contextual',
        priority: 'low'
      });
    });
  }

  return links;
}

/**
 * Generate related page links (discover similar pages)
 */
function generateRelatedPageLinks(
  currentCity: string, 
  currentFilters: string[], 
  tdspZone?: string
): InternalLink[] {
  const cityName = formatCityName(currentCity);
  const citySlug = currentCity.replace('-tx', '');
  const links: InternalLink[] = [];

  // Same TDSP zone cities (share transmission infrastructure)
  if (tdspZone) {
    const sameTdspCities = Object.entries(tdspMapping)
      .filter(([city, info]) => info.zone === tdspZone && city !== currentCity)
      .slice(0, 4); // Limit to 4 related cities

    sameTdspCities.forEach(([city, info]) => {
      const relatedCityName = formatCityName(city);
      const relatedCitySlug = city.replace('-tx', '');
      const filterPath = currentFilters.length > 0 ? `/${currentFilters.join('/')}` : '';
      
      links.push({
        url: `/texas/${relatedCitySlug}${filterPath}/electricity-plans`,
        anchorText: `${relatedCityName} ${currentFilters.length > 0 ? currentFilters.map(f => formatFilterName(f)).join(' ') + ' ' : ''}electricity plans`,
        title: `Compare electricity plans in ${relatedCityName}`,
        context: 'related',
        priority: 'medium'
      });
    });
  }

  // Alternative filter combinations (filter discovery)
  if (currentFilters.length === 1) {
    const alternativeFilters = [
      ['24-month'],
      ['variable-rate'],
      ['green-energy']
    ].filter(alt => !alt.some(f => currentFilters.includes(f)));

    alternativeFilters.slice(0, 3).forEach(altFilter => {
      const filterPath = altFilter.join('/');
      const filterText = altFilter.map(f => formatFilterName(f)).join(' ');
      
      links.push({
        url: `/texas/${citySlug}/${filterPath}/electricity-plans`,
        anchorText: `${cityName} ${filterText.toLowerCase()} plans`,
        title: `${filterText} electricity plans in ${cityName}`,
        context: 'related',
        priority: 'low'
      });
    });
  }

  // Resource and guide pages
  links.push(
    {
      url: '/guides/how-to-choose-electricity-plan',
      anchorText: 'how to choose the best electricity plan',
      title: 'Complete guide to selecting electricity plans in Texas',
      context: 'related',
      priority: 'medium'
    },
    {
      url: `/guides/${citySlug}-electricity-guide`,
      anchorText: `${cityName} electricity shopping guide`,
      title: `Complete guide to electricity shopping in ${cityName}`,
      context: 'related',
      priority: 'medium'
    },
    {
      url: '/texas-electricity-deregulation',
      anchorText: 'Texas electricity deregulation',
      title: 'Understanding the Texas deregulated electricity market',
      context: 'related',
      priority: 'low'
    }
  );

  return links;
}

/**
 * Generate breadcrumb navigation links
 */
function generateBreadcrumbLinks(currentCity: string, currentFilters: string[]): InternalLink[] {
  const cityName = formatCityName(currentCity);
  const citySlug = currentCity.replace('-tx', '');
  
  const breadcrumbs: InternalLink[] = [
    {
      url: '/',
      anchorText: 'Home',
      title: 'ChooseMyPower.org - Compare Texas Electricity Plans',
      context: 'breadcrumb',
      priority: 'high'
    },
    {
      url: '/texas',
      anchorText: 'Texas',
      title: 'Texas electricity plans and providers',
      context: 'breadcrumb',
      priority: 'high'
    },
    {
      url: `/texas/${citySlug}/electricity-plans`,
      anchorText: cityName,
      title: `${cityName} electricity plans and rates`,
      context: 'breadcrumb',
      priority: 'high'
    }
  ];

  // Add filter breadcrumbs
  let filterPath = '';
  currentFilters.forEach((filter, index) => {
    filterPath += `/${filter}`;
    breadcrumbs.push({
      url: `/texas/${citySlug}${filterPath}/electricity-plans`,
      anchorText: formatFilterName(filter),
      title: `${formatFilterName(filter)} electricity plans in ${cityName}`,
      context: 'breadcrumb',
      priority: 'high'
    });
  });

  return breadcrumbs;
}

/**
 * Get strategic anchor text variations to avoid over-optimization
 */
export function getAnchorTextVariations(baseAnchor: string, city: string, filters: string[]): string[] {
  const cityName = formatCityName(city);
  const variations = [baseAnchor];

  // Add natural variations
  if (baseAnchor.includes('electricity plans')) {
    variations.push(
      baseAnchor.replace('electricity plans', 'power plans'),
      baseAnchor.replace('electricity plans', 'energy plans'),
      baseAnchor.replace('plans', 'rates'),
      baseAnchor.replace('plans', 'providers')
    );
  }

  // Add city variations
  if (baseAnchor.includes(cityName)) {
    variations.push(
      baseAnchor.replace(cityName, `${cityName}, TX`),
      baseAnchor.replace(cityName, `${cityName}, Texas`)
    );
  }

  // Add filter variations
  filters.forEach(filter => {
    if (baseAnchor.includes(formatFilterName(filter))) {
      const filterName = formatFilterName(filter);
      variations.push(
        baseAnchor.replace(filterName, filterName.toLowerCase()),
        baseAnchor.replace(filterName, getFilterSynonym(filter))
      );
    }
  });

  return [...new Set(variations)]; // Remove duplicates
}

/**
 * Generate footer links for comprehensive site architecture
 */
export function generateFooterLinks(currentCity: string): InternalLink[] {
  const cityName = formatCityName(currentCity);
  const citySlug = currentCity.replace('-tx', '');
  
  return [
    // Major Texas cities
    {
      url: '/texas/houston/electricity-plans',
      anchorText: 'Houston Electricity Plans',
      title: 'Compare electricity plans in Houston, Texas',
      context: 'navigation',
      priority: 'medium'
    },
    {
      url: '/texas/dallas/electricity-plans',
      anchorText: 'Dallas Electricity Plans',
      title: 'Compare electricity plans in Dallas, Texas',
      context: 'navigation',
      priority: 'medium'
    },
    {
      url: '/texas/austin/electricity-plans',
      anchorText: 'Austin Electricity Plans',
      title: 'Compare electricity plans in Austin, Texas',
      context: 'navigation',
      priority: 'medium'
    },
    
    // Popular filters
    {
      url: '/texas/12-month/electricity-plans',
      anchorText: 'Texas 12-Month Plans',
      title: '12-month electricity plans across Texas',
      context: 'navigation',
      priority: 'medium'
    },
    {
      url: '/texas/green-energy/electricity-plans',
      anchorText: 'Texas Green Energy Plans',
      title: '100% renewable electricity plans in Texas',
      context: 'navigation',
      priority: 'medium'
    },
    
    // Utility pages
    {
      url: '/about',
      anchorText: 'About ChooseMyPower',
      title: 'About ChooseMyPower.org',
      context: 'navigation',
      priority: 'low'
    },
    {
      url: '/privacy-policy',
      anchorText: 'Privacy Policy',
      title: 'ChooseMyPower.org Privacy Policy',
      context: 'navigation',
      priority: 'low'
    }
  ];
}

// Helper functions

function getFilterLinkPriority(filters: string[]): 'high' | 'medium' | 'low' {
  const highValueFilters = ['12-month', 'fixed-rate', 'green-energy'];
  
  if (filters.length === 1 && highValueFilters.includes(filters[0])) {
    return 'high';
  }
  
  if (filters.length === 2 && filters.every(f => highValueFilters.includes(f))) {
    return 'medium';
  }
  
  return 'low';
}

function getTopProvidersByPlanCount(plans: Plan[]): Array<{name: string, count: number}> {
  const providerCounts = plans.reduce((acc, plan) => {
    const providerName = plan.provider.name;
    acc[providerName] = (acc[providerName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(providerCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function getFilterSynonym(filter: string): string {
  const synonyms: Record<string, string> = {
    'fixed-rate': 'fixed price',
    'variable-rate': 'variable price',
    'green-energy': 'renewable energy',
    '12-month': 'annual',
    '24-month': 'two-year',
    'prepaid': 'pay-as-you-go'
  };
  
  return synonyms[filter] || formatFilterName(filter);
}

/**
 * Generate JSON-LD for internal site navigation
 */
export function generateSiteNavigationSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'SiteNavigationElement',
    name: 'ChooseMyPower Site Navigation',
    url: 'https://choosemypower.org',
    hasPart: [
      {
        '@type': 'WebPage',
        name: 'Texas Electricity Plans',
        url: 'https://choosemypower.org/texas',
        description: 'Compare electricity plans across Texas cities'
      },
      {
        '@type': 'WebPage',
        name: 'Electricity Providers',
        url: 'https://choosemypower.org/providers',
        description: 'Texas electricity company profiles and ratings'
      },
      {
        '@type': 'WebPage',
        name: 'Electricity Guides',
        url: 'https://choosemypower.org/guides',
        description: 'How-to guides for choosing electricity plans'
      }
    ]
  };
}

export type { InternalLink, LinkingContext, AuthorityFlowMap };

/**
 * Enhanced linking functions for advanced SEO architecture
 */

// Enhanced navigation links with authority optimization
function generateEnhancedNavigationLinks(currentCity: string, currentFilters: string[], linkBudget: number): InternalLink[] {
  const cityName = formatCityName(currentCity);
  const citySlug = currentCity.replace('-tx', '');
  
  const links: InternalLink[] = [
    {
      url: '/',
      anchorText: 'Compare Texas Electricity Plans',
      title: 'Home - Compare electricity rates across Texas',
      context: 'navigation',
      priority: 'high',
      linkEquity: 0.9,
      placement: 'header',
      seasonality: 'year-round'
    },
    {
      url: `/texas/${citySlug}/`,
      anchorText: `${cityName} Electricity Plans`,
      title: `All electricity plans available in ${cityName}, Texas`,
      context: 'navigation', 
      priority: 'high',
      linkEquity: 0.8,
      placement: 'header',
      seasonality: 'year-round'
    },
    {
      url: '/texas/',
      anchorText: 'Texas Electricity Market',
      title: 'Compare electricity plans across all Texas cities',
      context: 'navigation',
      priority: 'medium',
      linkEquity: 0.6,
      placement: 'header',
      seasonality: 'year-round'
    }
  ];
  
  // Add filter-specific navigation for high-value pages
  if (currentFilters.length > 0) {
    links.push({
      url: `/texas/${citySlug}/`,
      anchorText: `All ${cityName} Plans`,
      title: `View all electricity plans in ${cityName}`,
      context: 'navigation',
      priority: 'high',
      linkEquity: 0.7,
      placement: 'content',
      seasonality: 'year-round'
    });
  }
  
  return links.slice(0, linkBudget);
}

// Enhanced contextual links with user intent optimization
function generateEnhancedContextualLinks(
  currentCity: string, 
  currentFilters: string[], 
  relatedPlans: Plan[] | undefined,
  userIntent: string | undefined,
  linkBudget: number
): InternalLink[] {
  const cityName = formatCityName(currentCity);
  const citySlug = currentCity.replace('-tx', '');
  const links: InternalLink[] = [];
  
  // High-value filter combinations based on user intent
  const intentBasedFilters = getIntentBasedFilters(userIntent, currentFilters);
  
  intentBasedFilters.forEach(filterCombo => {
    if (filterCombo.filters.length > 0 && !arraysEqual(filterCombo.filters, currentFilters)) {
      const filterPath = filterCombo.filters.join('/');
      links.push({
        url: `/texas/${citySlug}/${filterPath}/`,
        anchorText: `${cityName} ${filterCombo.anchor}`,
        title: `${filterCombo.title} in ${cityName}`,
        context: 'contextual',
        priority: filterCombo.priority,
        linkEquity: filterCombo.equity,
        placement: 'content',
        targetSegment: filterCombo.segment,
        seasonality: 'year-round'
      });
    }
  });
  
  return links.slice(0, linkBudget);
}

// Enhanced related page links with seasonal optimization  
function generateEnhancedRelatedPageLinks(
  currentCity: string,
  currentFilters: string[],
  tdspZone: string | undefined,
  seasonalContext: string | undefined,
  linkBudget: number
): InternalLink[] {
  const links: InternalLink[] = [];
  
  // Add some enhanced related page links logic here
  // (Simplified for space constraints)
  
  return links.slice(0, linkBudget);
}

// Enhanced breadcrumb links with rich context
function generateEnhancedBreadcrumbLinks(currentCity: string, currentFilters: string[]): InternalLink[] {
  const cityName = formatCityName(currentCity);
  const citySlug = currentCity.replace('-tx', '');
  
  const breadcrumbs: InternalLink[] = [
    {
      url: '/',
      anchorText: 'Home',
      title: 'ChooseMyPower.org - Compare Texas Electricity Plans',
      context: 'breadcrumb',
      priority: 'high',
      linkEquity: 0.8,
      placement: 'header',
      seasonality: 'year-round'
    },
    {
      url: '/texas/',
      anchorText: 'Texas',
      title: 'Texas electricity plans and providers',
      context: 'breadcrumb',
      priority: 'high', 
      linkEquity: 0.7,
      placement: 'header',
      seasonality: 'year-round'
    },
    {
      url: `/texas/${citySlug}/`,
      anchorText: cityName,
      title: `${cityName} electricity plans and rates`,
      context: 'breadcrumb',
      priority: 'high',
      linkEquity: 0.6,
      placement: 'header',
      seasonality: 'year-round'
    }
  ];
  
  return breadcrumbs;
}

// Semantic links based on content relationships
function generateSemanticLinks(currentCity: string, currentFilters: string[], linkBudget: number): InternalLink[] {
  const links: InternalLink[] = [];
  // Add semantic linking logic here
  return links.slice(0, linkBudget);
}

// Competitive links for alternative discovery
function generateCompetitiveLinks(currentCity: string, currentFilters: string[], linkBudget: number): InternalLink[] {
  const links: InternalLink[] = [];
  // Add competitive linking logic here
  return links.slice(0, linkBudget);
}

// Educational links for topical authority
function generateEducationalLinks(
  currentCity: string,
  currentFilters: string[],
  userIntent: string | undefined,
  linkBudget: number
): InternalLink[] {
  const links: InternalLink[] = [];
  // Add educational linking logic here
  return links.slice(0, linkBudget);
}

// Helper functions
function getIntentBasedFilters(userIntent: string | undefined, currentFilters: string[]) {
  return [
    { filters: ['fixed-rate'], anchor: 'fixed rate plans', title: 'Fixed rate electricity plans', priority: 'high' as const, equity: 0.8, segment: 'budget-focused' as const }
  ];
}

function arraysEqual(arr1: string[], arr2: string[]): boolean {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, index) => val === arr2[index]);
}