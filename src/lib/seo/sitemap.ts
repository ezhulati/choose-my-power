/**
 * XML Sitemap Generation for Faceted Navigation
 * Creates optimized sitemaps for search engine crawling and indexing
 * Handles priority, change frequency, and canonical URL management
 */

import { tdspMapping } from '../../config/tdsp-mapping';
import { determineCanonicalUrl, getCanonicalPriority, getChangeFrequency, shouldNoIndex } from './canonical';
import { isHighValuePage } from '../faceted/url-parser';

export interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  images?: Array<{
    loc: string;
    title?: string;
    caption?: string;
  }>;
}

export interface SitemapIndex {
  loc: string;
  lastmod: string;
}

/**
 * Generate comprehensive XML sitemaps for faceted electricity plan pages
 */
export class SitemapGenerator {
  private baseUrl = 'https://choosemypower.org';
  private lastmod = new Date().toISOString();

  /**
   * Generate main sitemap index
   */
  generateSitemapIndex(): string {
    const sitemaps: SitemapIndex[] = [
      {
        loc: `${this.baseUrl}/sitemap-main.xml`,
        lastmod: this.lastmod
      },
      {
        loc: `${this.baseUrl}/sitemap-cities.xml`,
        lastmod: this.lastmod
      },
      {
        loc: `${this.baseUrl}/sitemap-filters.xml`,
        lastmod: this.lastmod
      },
      {
        loc: `${this.baseUrl}/sitemap-providers.xml`,
        lastmod: this.lastmod
      },
      {
        loc: `${this.baseUrl}/sitemap-guides.xml`,
        lastmod: this.lastmod
      }
    ];

    return this.renderSitemapIndex(sitemaps);
  }

  /**
   * Generate main pages sitemap
   */
  generateMainSitemap(): string {
    const urls: SitemapUrl[] = [
      {
        loc: this.baseUrl,
        lastmod: this.lastmod,
        changefreq: 'daily',
        priority: 1.0
      },
      {
        loc: `${this.baseUrl}/texas`,
        lastmod: this.lastmod,
        changefreq: 'daily',
        priority: 0.9
      },
      {
        loc: `${this.baseUrl}/texas/electricity-plans`,
        lastmod: this.lastmod,
        changefreq: 'daily',
        priority: 0.9
      },
      {
        loc: `${this.baseUrl}/providers`,
        lastmod: this.lastmod,
        changefreq: 'weekly',
        priority: 0.8
      },
      {
        loc: `${this.baseUrl}/guides`,
        lastmod: this.lastmod,
        changefreq: 'monthly',
        priority: 0.7
      },
      {
        loc: `${this.baseUrl}/about`,
        lastmod: this.lastmod,
        changefreq: 'monthly',
        priority: 0.3
      },
      {
        loc: `${this.baseUrl}/privacy-policy`,
        lastmod: this.lastmod,
        changefreq: 'yearly',
        priority: 0.2
      },
      {
        loc: `${this.baseUrl}/terms-of-service`,
        lastmod: this.lastmod,
        changefreq: 'yearly',
        priority: 0.2
      }
    ];

    return this.renderSitemap(urls);
  }

  /**
   * Generate city-specific pages sitemap
   */
  generateCitiesSitemap(): string {
    const urls: SitemapUrl[] = [];
    
    // Get all Texas cities from TDSP mapping
    const texasCities = Object.keys(tdspMapping).filter(city => city.endsWith('-tx'));
    
    texasCities.forEach(citySlug => {
      const cityName = citySlug.replace('-tx', '');
      
      // Base city page (highest priority for cities)
      urls.push({
        loc: `${this.baseUrl}/texas/${cityName}/electricity-plans`,
        lastmod: this.lastmod,
        changefreq: 'daily',
        priority: 0.8,
        images: [
          {
            loc: `${this.baseUrl}/images/cities/${cityName}-electricity-plans.jpg`,
            title: `Electricity Plans in ${cityName}, Texas`,
            caption: `Compare electricity rates and providers in ${cityName}`
          }
        ]
      });

      // City provider page
      urls.push({
        loc: `${this.baseUrl}/texas/${cityName}/electricity-providers`,
        lastmod: this.lastmod,
        changefreq: 'weekly',
        priority: 0.6
      });

      // City rates comparison
      urls.push({
        loc: `${this.baseUrl}/texas/${cityName}/compare-electricity-rates`,
        lastmod: this.lastmod,
        changefreq: 'daily',
        priority: 0.7
      });
    });

    return this.renderSitemap(urls);
  }

  /**
   * Generate filtered pages sitemap (high-value combinations only)
   */
  generateFiltersSitemap(): string {
    const urls: SitemapUrl[] = [];
    const texasCities = Object.keys(tdspMapping).filter(city => city.endsWith('-tx'));
    
    // High-value filter combinations that should be indexed
    const highValueFilters = [
      // Single filters (high search volume)
      ['12-month'],
      ['24-month'],
      ['fixed-rate'],
      ['variable-rate'],
      ['green-energy'],
      ['prepaid'],
      
      // Two-filter combinations (specific intent)
      ['12-month', 'fixed-rate'],
      ['24-month', 'fixed-rate'],
      ['green-energy', '12-month'],
      ['green-energy', 'fixed-rate'],
      ['prepaid', 'no-deposit'],
      ['12-month', 'autopay-discount']
    ];

    texasCities.forEach(citySlug => {
      const cityName = citySlug.replace('-tx', '');
      
      highValueFilters.forEach(filterCombo => {
        const filterPath = filterCombo.join('/');
        const fullPath = `/texas/${cityName}/${filterPath}/electricity-plans`;
        
        // Check if this combination should be indexed
        if (!shouldNoIndex(fullPath, filterCombo)) {
          const canonicalUrl = determineCanonicalUrl(fullPath, filterCombo);
          
          // Only include if this page is its own canonical (avoid duplicate content)
          if (canonicalUrl.endsWith(fullPath)) {
            urls.push({
              loc: `${this.baseUrl}${fullPath}`,
              lastmod: this.lastmod,
              changefreq: getChangeFrequency(fullPath, filterCombo),
              priority: getCanonicalPriority(fullPath, filterCombo),
              images: [
                {
                  loc: `${this.baseUrl}/images/plans/${filterCombo.join('-')}-electricity-plans.jpg`,
                  title: `${filterCombo.map(f => f.replace('-', ' ')).join(' + ')} electricity plans`,
                  caption: `Compare ${filterCombo.map(f => f.replace('-', ' ')).join(' + ')} electricity plans in ${cityName}`
                }
              ]
            });
          }
        }
      });
    });

    // State-level filter pages
    highValueFilters.forEach(filterCombo => {
      const filterPath = filterCombo.join('/');
      urls.push({
        loc: `${this.baseUrl}/texas/${filterPath}/electricity-plans`,
        lastmod: this.lastmod,
        changefreq: 'daily',
        priority: 0.7
      });
    });

    return this.renderSitemap(urls);
  }

  /**
   * Generate provider-specific pages sitemap
   */
  generateProvidersSitemap(): string {
    const urls: SitemapUrl[] = [];
    
    // Major Texas electricity providers
    const majorProviders = [
      { name: 'TXU Energy', slug: 'txu-energy' },
      { name: 'Reliant Energy', slug: 'reliant-energy' },
      { name: 'Direct Energy', slug: 'direct-energy' },
      { name: 'Green Mountain Energy', slug: 'green-mountain-energy' },
      { name: 'Just Energy', slug: 'just-energy' },
      { name: 'Champion Energy', slug: 'champion-energy' },
      { name: 'Cirro Energy', slug: 'cirro-energy' },
      { name: 'Frontier Utilities', slug: 'frontier-utilities' }
    ];

    // Provider hub pages
    majorProviders.forEach(provider => {
      urls.push({
        loc: `${this.baseUrl}/providers/${provider.slug}`,
        lastmod: this.lastmod,
        changefreq: 'weekly',
        priority: 0.6
      });

      // Provider state page
      urls.push({
        loc: `${this.baseUrl}/providers/${provider.slug}/texas`,
        lastmod: this.lastmod,
        changefreq: 'weekly',
        priority: 0.5
      });
    });

    // Provider comparison pages
    urls.push({
      loc: `${this.baseUrl}/compare/txu-vs-reliant`,
      lastmod: this.lastmod,
      changefreq: 'monthly',
      priority: 0.5
    });

    urls.push({
      loc: `${this.baseUrl}/compare/green-mountain-vs-direct-energy`,
      lastmod: this.lastmod,
      changefreq: 'monthly',
      priority: 0.5
    });

    return this.renderSitemap(urls);
  }

  /**
   * Generate guides and resources sitemap
   */
  generateGuidesSitemap(): string {
    const urls: SitemapUrl[] = [];
    const texasCities = Object.keys(tdspMapping).filter(city => city.endsWith('-tx'));

    // Main guide pages
    const guides = [
      {
        path: '/guides/how-to-choose-electricity-plan',
        priority: 0.8,
        changefreq: 'monthly' as const
      },
      {
        path: '/guides/texas-electricity-deregulation-explained',
        priority: 0.7,
        changefreq: 'monthly' as const
      },
      {
        path: '/guides/fixed-vs-variable-electricity-rates',
        priority: 0.7,
        changefreq: 'monthly' as const
      },
      {
        path: '/guides/green-energy-plans-texas',
        priority: 0.7,
        changefreq: 'monthly' as const
      },
      {
        path: '/guides/prepaid-electricity-plans',
        priority: 0.6,
        changefreq: 'monthly' as const
      },
      {
        path: '/guides/avoid-high-electricity-bills',
        priority: 0.6,
        changefreq: 'monthly' as const
      }
    ];

    guides.forEach(guide => {
      urls.push({
        loc: `${this.baseUrl}${guide.path}`,
        lastmod: this.lastmod,
        changefreq: guide.changefreq,
        priority: guide.priority
      });
    });

    // City-specific guides (for major cities only)
    const majorCities = ['houston', 'dallas', 'austin', 'san-antonio', 'fort-worth'];
    majorCities.forEach(cityName => {
      urls.push({
        loc: `${this.baseUrl}/guides/${cityName}-electricity-guide`,
        lastmod: this.lastmod,
        changefreq: 'monthly',
        priority: 0.6
      });
    });

    return this.renderSitemap(urls);
  }

  /**
   * Generate news/blog sitemap for fresh content signals
   */
  generateNewsSitemap(): string {
    const urls: SitemapUrl[] = [];
    
    // Recent electricity market news and updates
    const newsArticles = [
      {
        path: '/news/texas-electricity-rates-january-2025',
        pubDate: '2025-01-15T10:00:00Z'
      },
      {
        path: '/news/new-green-energy-plans-available',
        pubDate: '2025-01-10T14:30:00Z'
      },
      {
        path: '/news/winter-electricity-usage-tips',
        pubDate: '2025-01-05T09:00:00Z'
      }
    ];

    newsArticles.forEach(article => {
      urls.push({
        loc: `${this.baseUrl}${article.path}`,
        lastmod: article.pubDate,
        changefreq: 'never',
        priority: 0.6
      });
    });

    return this.renderSitemap(urls);
  }

  /**
   * Render XML sitemap from URL array
   */
  private renderSitemap(urls: SitemapUrl[]): string {
    const urlElements = urls.map(url => {
      let urlElement = `  <url>\n`;
      urlElement += `    <loc>${url.loc}</loc>\n`;
      urlElement += `    <lastmod>${url.lastmod}</lastmod>\n`;
      urlElement += `    <changefreq>${url.changefreq}</changefreq>\n`;
      urlElement += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
      
      // Add image elements if present
      if (url.images && url.images.length > 0) {
        url.images.forEach(image => {
          urlElement += `    <image:image>\n`;
          urlElement += `      <image:loc>${image.loc}</image:loc>\n`;
          if (image.title) {
            urlElement += `      <image:title>${image.title}</image:title>\n`;
          }
          if (image.caption) {
            urlElement += `      <image:caption>${image.caption}</image:caption>\n`;
          }
          urlElement += `    </image:image>\n`;
        });
      }
      
      urlElement += `  </url>`;
      return urlElement;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlElements}
</urlset>`;
  }

  /**
   * Render XML sitemap index from sitemaps array
   */
  private renderSitemapIndex(sitemaps: SitemapIndex[]): string {
    const sitemapElements = sitemaps.map(sitemap => {
      return `  <sitemap>
    <loc>${sitemap.loc}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapElements}
</sitemapindex>`;
  }

  /**
   * Generate robots.txt with sitemap references
   */
  generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

# Sitemap references
Sitemap: ${this.baseUrl}/sitemap.xml
Sitemap: ${this.baseUrl}/sitemap-cities.xml
Sitemap: ${this.baseUrl}/sitemap-filters.xml
Sitemap: ${this.baseUrl}/sitemap-providers.xml
Sitemap: ${this.baseUrl}/sitemap-guides.xml

# Disallow low-value pages
Disallow: /admin/
Disallow: /api/
Disallow: /test/
Disallow: /*?sort=*
Disallow: /*?page=*
Disallow: /*&*

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Special instructions for major search engines
User-agent: Googlebot
Crawl-delay: 0

User-agent: Bingbot
Crawl-delay: 1`;
  }

  /**
   * Generate comprehensive sitemap statistics for monitoring
   */
  generateSitemapStats(): {
    totalUrls: number;
    cityPages: number;
    filterPages: number;
    canonicalUrls: number;
    noIndexUrls: number;
    highPriorityUrls: number;
  } {
    const texasCities = Object.keys(tdspMapping).filter(city => city.endsWith('-tx'));
    const highValueFilters = [
      ['12-month'], ['24-month'], ['fixed-rate'], ['variable-rate'], 
      ['green-energy'], ['prepaid'], ['12-month', 'fixed-rate'],
      ['24-month', 'fixed-rate'], ['green-energy', '12-month'],
      ['green-energy', 'fixed-rate'], ['prepaid', 'no-deposit']
    ];

    let canonicalUrls = 0;
    let noIndexUrls = 0;
    let totalFilterPages = 0;

    texasCities.forEach(citySlug => {
      const cityName = citySlug.replace('-tx', '');
      
      highValueFilters.forEach(filterCombo => {
        const fullPath = `/texas/${cityName}/${filterCombo.join('/')}/electricity-plans`;
        totalFilterPages++;
        
        if (shouldNoIndex(fullPath, filterCombo)) {
          noIndexUrls++;
        } else {
          const canonicalUrl = determineCanonicalUrl(fullPath, filterCombo);
          if (canonicalUrl.endsWith(fullPath)) {
            canonicalUrls++;
          }
        }
      });
    });

    return {
      totalUrls: 50 + texasCities.length * 3 + canonicalUrls, // Rough estimate
      cityPages: texasCities.length,
      filterPages: totalFilterPages,
      canonicalUrls,
      noIndexUrls,
      highPriorityUrls: texasCities.length + canonicalUrls
    };
  }
}

// Export convenience functions for Astro endpoints
export function generateMainSitemapXML(): string {
  const generator = new SitemapGenerator();
  return generator.generateMainSitemap();
}

export function generateCitiesSitemapXML(): string {
  const generator = new SitemapGenerator();
  return generator.generateCitiesSitemap();
}

export function generateFiltersSitemapXML(): string {
  const generator = new SitemapGenerator();
  return generator.generateFiltersSitemap();
}

export function generateSitemapIndexXML(): string {
  const generator = new SitemapGenerator();
  return generator.generateSitemapIndex();
}

export function generateRobotsTxt(): string {
  const generator = new SitemapGenerator();
  return generator.generateRobotsTxt();
}

