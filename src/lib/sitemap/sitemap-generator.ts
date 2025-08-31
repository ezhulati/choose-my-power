/**
 * Comprehensive Sitemap Generator for ChooseMyPower
 * Generates XML sitemaps for Google Search Console and site navigation
 * Handles 5,800+ pages across Texas electricity plans
 */

import { validateCitySlug, getAllCities, getTdspFromCity } from '../../config/tdsp-mapping';
import { filterMapper } from '../api/filter-mapper';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface SitemapSection {
  name: string;
  description: string;
  urls: SitemapUrl[];
  count: number;
}

/**
 * Priority and frequency configurations for different page types
 */
const PAGE_CONFIG = {
  // Core pages - highest priority
  homepage: { priority: 1.0, changefreq: 'daily' as const },
  statePages: { priority: 0.9, changefreq: 'weekly' as const },
  
  // City pages - high priority
  majorCityPages: { priority: 0.8, changefreq: 'daily' as const }, // Top 20 cities
  cityPages: { priority: 0.7, changefreq: 'weekly' as const }, // Other 860 cities
  cityPlanPages: { priority: 0.8, changefreq: 'daily' as const }, // City electricity plans
  
  // Faceted navigation - medium-high priority
  singleFilterPages: { priority: 0.6, changefreq: 'daily' as const },
  multiFilterPages: { priority: 0.5, changefreq: 'weekly' as const },
  deepFilterPages: { priority: 0.4, changefreq: 'monthly' as const },
  
  // Provider pages - medium priority
  providerPages: { priority: 0.6, changefreq: 'weekly' as const },
  providerProfilePages: { priority: 0.5, changefreq: 'monthly' as const },
  
  // Educational content - medium priority
  resourcePages: { priority: 0.6, changefreq: 'monthly' as const },
  guidePages: { priority: 0.5, changefreq: 'monthly' as const },
  blogPages: { priority: 0.4, changefreq: 'monthly' as const },
  
  // Utility pages - lower priority
  utilityPages: { priority: 0.3, changefreq: 'yearly' as const },
  legalPages: { priority: 0.2, changefreq: 'yearly' as const }
};

/**
 * Top tier Texas cities for higher priority
 */
const MAJOR_CITIES = [
  'dallas-tx', 'houston-tx', 'austin-tx', 'san-antonio-tx', 'fort-worth-tx',
  'el-paso-tx', 'arlington-tx', 'corpus-christi-tx', 'plano-tx', 'lubbock-tx',
  'garland-tx', 'irving-tx', 'amarillo-tx', 'grand-prairie-tx', 'brownsville-tx',
  'mckinney-tx', 'frisco-tx', 'pasadena-tx', 'killeen-tx', 'mesquite-tx'
];

/**
 * High-value filter combinations for SEO
 */
const PRIORITY_FILTER_COMBINATIONS = [
  // Single filters - most important
  ['12-month'], ['24-month'], ['36-month'],
  ['fixed-rate'], ['variable-rate'], ['indexed'],
  ['green-energy'], ['no-deposit'], ['prepaid'],
  ['free-nights'], ['free-weekends'], ['bill-credit'],
  
  // Two-filter combinations - high value
  ['12-month', 'fixed-rate'], ['12-month', 'green-energy'],
  ['24-month', 'fixed-rate'], ['24-month', 'green-energy'],
  ['fixed-rate', 'green-energy'], ['fixed-rate', 'no-deposit'],
  ['green-energy', 'no-deposit'], ['prepaid', 'no-deposit'],
  
  // Three-filter combinations - selective
  ['12-month', 'fixed-rate', 'green-energy'],
  ['12-month', 'fixed-rate', 'no-deposit'],
  ['24-month', 'fixed-rate', 'green-energy']
];

/**
 * Generate current timestamp in ISO format
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Create sitemap URL object
 */
function createUrl(
  loc: string, 
  priority: number, 
  changefreq: string, 
  lastmod?: string
): SitemapUrl {
  return {
    loc: `https://choosemypower.org${loc}`,
    lastmod: lastmod || getCurrentTimestamp(),
    changefreq: changefreq as SitemapUrl['changefreq'],
    priority
  };
}

/**
 * Generate core website pages
 */
export function generateCorePages(): SitemapSection {
  const urls: SitemapUrl[] = [
    // Homepage
    createUrl('/', PAGE_CONFIG.homepage.priority, PAGE_CONFIG.homepage.changefreq),
    
    // State pages
    createUrl('/texas/', PAGE_CONFIG.statePages.priority, PAGE_CONFIG.statePages.changefreq),
    
    // Core functionality pages
    createUrl('/compare/', PAGE_CONFIG.resourcePages.priority, PAGE_CONFIG.resourcePages.changefreq),
    createUrl('/shop/', PAGE_CONFIG.resourcePages.priority, PAGE_CONFIG.resourcePages.changefreq),
    createUrl('/locations/', PAGE_CONFIG.resourcePages.priority, PAGE_CONFIG.resourcePages.changefreq),
    
    // Important landing pages
    createUrl('/shop/cheapest-electricity/', PAGE_CONFIG.resourcePages.priority, PAGE_CONFIG.resourcePages.changefreq),
    createUrl('/shop/best-electricity-providers/', PAGE_CONFIG.resourcePages.priority, PAGE_CONFIG.resourcePages.changefreq),
    createUrl('/shop/green-energy/', PAGE_CONFIG.resourcePages.priority, PAGE_CONFIG.resourcePages.changefreq),
    createUrl('/shop/no-deposit-electricity/', PAGE_CONFIG.resourcePages.priority, PAGE_CONFIG.resourcePages.changefreq),
    
    // Tools and calculators
    createUrl('/rates/calculator/', PAGE_CONFIG.resourcePages.priority, PAGE_CONFIG.resourcePages.changefreq),
    createUrl('/best/', PAGE_CONFIG.resourcePages.priority, PAGE_CONFIG.resourcePages.changefreq)
  ];

  return {
    name: 'Core Pages',
    description: 'Homepage, state pages, and core functionality',
    urls,
    count: urls.length
  };
}

/**
 * Generate city pages (880+ Texas cities)
 */
export function generateCityPages(): SitemapSection {
  const urls: SitemapUrl[] = [];
  const cities = getAllCities();

  for (const citySlug of cities) {
    const isMajorCity = MAJOR_CITIES.includes(citySlug);
    const config = isMajorCity ? PAGE_CONFIG.majorCityPages : PAGE_CONFIG.cityPages;
    
    // City overview page: /texas/dallas/
    urls.push(createUrl(
      `/texas/${citySlug}/`,
      config.priority,
      config.changefreq
    ));
    
    // City electricity plans page: /electricity-plans/dallas/
    urls.push(createUrl(
      `/electricity-plans/${citySlug}/`,
      PAGE_CONFIG.cityPlanPages.priority,
      PAGE_CONFIG.cityPlanPages.changefreq
    ));
  }

  return {
    name: 'City Pages',
    description: '880+ Texas cities with overview and electricity plan pages',
    urls,
    count: urls.length
  };
}

/**
 * Generate faceted navigation pages
 */
export function generateFacetedNavigationPages(): SitemapSection {
  const urls: SitemapUrl[] = [];
  const cities = getAllCities();
  
  // Generate for priority cities and filter combinations
  const priorityCities = cities.filter(city => MAJOR_CITIES.includes(city));
  
  // Add some medium cities for broader coverage
  const mediumCities = cities.filter(city => !MAJOR_CITIES.includes(city)).slice(0, 100);
  const targetCities = [...priorityCities, ...mediumCities];

  for (const citySlug of targetCities) {
    const tdspDuns = getTdspFromCity(citySlug);
    if (!tdspDuns) continue;

    for (const filterCombo of PRIORITY_FILTER_COMBINATIONS) {
      // Validate filter combination
      const filterResult = filterMapper.mapFiltersToApiParams(citySlug, filterCombo, tdspDuns);
      if (!filterResult.isValid) continue;

      const filterPath = filterCombo.join('/');
      const url = `/electricity-plans/${citySlug}/${filterPath}/`;
      
      // Determine priority based on filter depth
      let config;
      if (filterCombo.length === 1) {
        config = PAGE_CONFIG.singleFilterPages;
      } else if (filterCombo.length === 2) {
        config = PAGE_CONFIG.multiFilterPages;
      } else {
        config = PAGE_CONFIG.deepFilterPages;
      }
      
      urls.push(createUrl(url, config.priority, config.changefreq));
    }
  }

  return {
    name: 'Faceted Navigation',
    description: 'Filtered electricity plan combinations for cities and filters',
    urls,
    count: urls.length
  };
}

/**
 * Generate provider pages
 */
export function generateProviderPages(): SitemapSection {
  const urls: SitemapUrl[] = [];
  
  // Major Texas electricity providers
  const providers = [
    '4change-energy', 'accent-energy', 'ambit-energy', 'amerigreen-energy',
    'apg&e', 'bounce-energy', 'breeze-energy', 'brilliant-energy',
    'champion-energy', 'chariot-energy', 'cirro-energy', 'constellation',
    'discount-power', 'direct-energy', 'dynowatt', 'energyplus',
    'express-energy', 'frontier-utilities', 'gexa-energy', 'green-mountain',
    'griddy', 'hometown-energy', 'hudson-energy', 'infinite-energy',
    'just-energy', 'liberty-power', 'lonestar-energy', 'mp2-energy',
    'nrg-energy', 'octopus-energy', 'pennywise-power', 'pulse-power',
    'reliant-energy', 'rhythm-energy', 'sharp-energy', 'spark-energy',
    'stream-energy', 'sunnova-energy', 'tara-energy', 'texaspower',
    'tru-energy', 'txu-energy', 'unitil', 'verde-energy',
    'veteran-energy', 'volt-electricity', 'wow-energy', 'xoom-energy',
    'young-energy', 'zyra-energy'
  ];

  for (const provider of providers) {
    // Provider overview page
    urls.push(createUrl(
      `/providers/${provider}/`,
      PAGE_CONFIG.providerPages.priority,
      PAGE_CONFIG.providerPages.changefreq
    ));
    
    // Provider profile page
    urls.push(createUrl(
      `/providers/${provider}/profile/`,
      PAGE_CONFIG.providerProfilePages.priority,
      PAGE_CONFIG.providerProfilePages.changefreq
    ));
    
    // Provider plans page
    urls.push(createUrl(
      `/providers/${provider}/plans/`,
      PAGE_CONFIG.providerPages.priority,
      PAGE_CONFIG.providerPages.changefreq
    ));
  }

  return {
    name: 'Provider Pages',
    description: '50+ electricity provider pages with profiles and plan listings',
    urls,
    count: urls.length
  };
}

/**
 * Generate educational and resource pages
 */
export function generateResourcePages(): SitemapSection {
  const urls: SitemapUrl[] = [];
  
  // Main resource sections
  const resourceSections = [
    { path: '/resources/', config: PAGE_CONFIG.resourcePages },
    { path: '/resources/guides/', config: PAGE_CONFIG.resourcePages },
    { path: '/resources/faqs/', config: PAGE_CONFIG.resourcePages },
    { path: '/resources/support/', config: PAGE_CONFIG.resourcePages },
    { path: '/blog/', config: PAGE_CONFIG.blogPages }
  ];

  for (const section of resourceSections) {
    urls.push(createUrl(section.path, section.config.priority, section.config.changefreq));
  }
  
  // Specific guide pages
  const guides = [
    'how-to-switch-electricity-providers',
    'understanding-your-electricity-bill',
    'fixed-vs-variable-electricity-rates',
    'green-energy-options-texas',
    'electricity-contract-terms-explained',
    'seasonal-electricity-planning',
    'business-electricity-plans',
    'moving-electricity-checklist',
    'electricity-scam-prevention',
    'energy-efficiency-tips'
  ];

  for (const guide of guides) {
    urls.push(createUrl(
      `/resources/guides/${guide}/`,
      PAGE_CONFIG.guidePages.priority,
      PAGE_CONFIG.guidePages.changefreq
    ));
  }
  
  // FAQ categories
  const faqCategories = [
    'switching-providers',
    'contract-terms',
    'billing-questions',
    'green-energy',
    'moving-electricity',
    'business-plans'
  ];

  for (const category of faqCategories) {
    urls.push(createUrl(
      `/resources/faqs/${category}/`,
      PAGE_CONFIG.resourcePages.priority,
      PAGE_CONFIG.resourcePages.changefreq
    ));
  }
  
  // Support pages
  const supportPages = [
    'contact',
    'help-center',
    'report-issue',
    'feedback'
  ];

  for (const page of supportPages) {
    urls.push(createUrl(
      `/resources/support/${page}/`,
      PAGE_CONFIG.utilityPages.priority,
      PAGE_CONFIG.utilityPages.changefreq
    ));
  }

  return {
    name: 'Resources & Education',
    description: 'Guides, FAQs, support pages, and educational content',
    urls,
    count: urls.length
  };
}

/**
 * Generate utility and legal pages
 */
export function generateUtilityPages(): SitemapSection {
  const urls: SitemapUrl[] = [];
  
  // Company pages
  const companyPages = [
    { path: '/about/', config: PAGE_CONFIG.utilityPages },
    { path: '/careers/', config: PAGE_CONFIG.utilityPages },
    { path: '/press/', config: PAGE_CONFIG.utilityPages },
    { path: '/contact/', config: PAGE_CONFIG.utilityPages }
  ];

  for (const page of companyPages) {
    urls.push(createUrl(page.path, page.config.priority, page.config.changefreq));
  }
  
  // Legal pages
  const legalPages = [
    'privacy-policy',
    'terms-of-service',
    'accessibility',
    'cookie-policy',
    'disclaimer'
  ];

  for (const page of legalPages) {
    urls.push(createUrl(
      `/${page}/`,
      PAGE_CONFIG.legalPages.priority,
      PAGE_CONFIG.legalPages.changefreq
    ));
  }

  return {
    name: 'Utility & Legal',
    description: 'Company information, legal pages, and utility pages',
    urls,
    count: urls.length
  };
}

/**
 * Generate complete sitemap with all sections
 */
export function generateCompleteSitemap(): {
  sections: SitemapSection[];
  totalUrls: number;
  lastGenerated: string;
} {
  const sections = [
    generateCorePages(),
    generateCityPages(),
    generateFacetedNavigationPages(),
    generateProviderPages(),
    generateResourcePages(),
    generateUtilityPages()
  ];

  const totalUrls = sections.reduce((sum, section) => sum + section.count, 0);
  
  return {
    sections,
    totalUrls,
    lastGenerated: getCurrentTimestamp()
  };
}

/**
 * Generate XML sitemap content
 */
export function generateXMLSitemap(sections: SitemapSection[]): string {
  const allUrls = sections.flatMap(section => section.urls);
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const url of allUrls) {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  }
  
  xml += '</urlset>';
  
  return xml;
}

/**
 * Generate sitemap index for large sites
 */
export function generateSitemapIndex(sections: SitemapSection[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  const timestamp = getCurrentTimestamp();
  
  for (const section of sections) {
    const filename = section.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    xml += '  <sitemap>\n';
    xml += `    <loc>https://choosemypower.org/sitemap-${filename}.xml</loc>\n`;
    xml += `    <lastmod>${timestamp}</lastmod>\n`;
    xml += '  </sitemap>\n';
  }
  
  xml += '</sitemapindex>';
  
  return xml;
}

/**
 * Export utility functions for external use
 */
export { PAGE_CONFIG, MAJOR_CITIES, PRIORITY_FILTER_COMBINATIONS };