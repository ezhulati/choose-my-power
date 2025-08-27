/**
 * Internal Linking Strategy for Faceted Navigation SEO
 * Creates hub-and-spoke link architecture to distribute page authority
 * and help users discover related electricity plans and providers
 */

import { tdspMapping, formatCityName, formatFilterName } from '../../config/tdsp-mapping';
import type { Plan } from '../../types/facets';

export interface InternalLink {
  url: string;
  anchorText: string;
  title: string;
  context: 'navigation' | 'contextual' | 'related' | 'breadcrumb';
  priority: 'high' | 'medium' | 'low';
}

export interface LinkingContext {
  currentCity: string;
  currentFilters: string[];
  relatedPlans?: Plan[];
  tdspZone?: string;
}

/**
 * Generate comprehensive internal linking strategy for electricity plan pages
 */
export function generateInternalLinks(context: LinkingContext): {
  navigationLinks: InternalLink[];
  contextualLinks: InternalLink[];
  relatedPageLinks: InternalLink[];
  breadcrumbLinks: InternalLink[];
} {
  const { currentCity, currentFilters, relatedPlans, tdspZone } = context;
  const cityName = formatCityName(currentCity);
  
  return {
    navigationLinks: generateNavigationLinks(currentCity, currentFilters),
    contextualLinks: generateContextualLinks(currentCity, currentFilters, relatedPlans),
    relatedPageLinks: generateRelatedPageLinks(currentCity, currentFilters, tdspZone),
    breadcrumbLinks: generateBreadcrumbLinks(currentCity, currentFilters)
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

export type { InternalLink, LinkingContext };