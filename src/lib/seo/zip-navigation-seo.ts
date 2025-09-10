/**
 * SEO Optimization for ZIP Navigation and City Pages
 * Task T033: Comprehensive SEO optimization for city pages and ZIP lookup
 * Phase 3.5 Polish & Validation: Enhanced search visibility and ranking
 */

import type { ZIPCodeMapping, MarketZone } from '../types/zip-navigation';

export interface CityPageSEO {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  openGraph: {
    title: string;
    description: string;
    image: string;
    url: string;
    type: 'website';
  };
  twitter: {
    card: 'summary_large_image';
    title: string;
    description: string;
    image: string;
  };
  jsonLd: {
    '@context': 'https://schema.org';
    '@type': 'LocalBusiness' | 'WebPage';
    [key: string]: any;
  };
  breadcrumbs: Array<{
    name: string;
    url: string;
  }>;
}

export interface ZIPSEOData {
  zipCode: string;
  cityName: string;
  citySlug: string;
  countyName: string;
  marketZone: MarketZone;
  tdspTerritory: string;
  planCount: number;
  avgRate: number;
  isDeregulated: boolean;
  lastUpdated: Date;
}

export class ZIPNavigationSEOService {
  private readonly baseUrl = 'https://choosemypower.org';
  private readonly siteName = 'ChooseMyPower.org';
  private readonly defaultImage = '/images/og-city-plans.jpg';

  /**
   * Generate comprehensive SEO metadata for city electricity plans pages
   */
  generateCityPageSEO(zipData: ZIPSEOData): CityPageSEO {
    const { cityName, citySlug, countyName, marketZone, planCount, avgRate, zipCode } = zipData;
    const capitalizedCity = this.capitalizeWords(cityName);
    const pageUrl = `${this.baseUrl}/electricity-plans/${citySlug}`;

    // Generate dynamic, SEO-optimized title
    const title = this.generateCityTitle(capitalizedCity, planCount, avgRate);
    
    // Generate compelling meta description
    const description = this.generateCityDescription(capitalizedCity, countyName, planCount, avgRate, marketZone);
    
    // Generate relevant keywords
    const keywords = this.generateCityKeywords(capitalizedCity, countyName, marketZone, zipCode);

    // Generate Open Graph metadata
    const openGraph = {
      title: `${capitalizedCity} Electricity Plans - Compare ${planCount}+ Options`,
      description: `Find the best electricity rates in ${capitalizedCity}, TX. Compare ${planCount}+ plans from licensed providers. Average rate: ${avgRate.toFixed(1)}¢/kWh.`,
      image: `${this.baseUrl}${this.defaultImage}`,
      url: pageUrl,
      type: 'website' as const
    };

    // Generate Twitter Card metadata
    const twitter = {
      card: 'summary_large_image' as const,
      title: openGraph.title,
      description: openGraph.description,
      image: openGraph.image
    };

    // Generate JSON-LD structured data
    const jsonLd = this.generateCityJsonLd(zipData, pageUrl);

    // Generate breadcrumbs
    const breadcrumbs = this.generateCityBreadcrumbs(capitalizedCity, citySlug, marketZone);

    return {
      title,
      description,
      keywords,
      canonicalUrl: pageUrl,
      openGraph,
      twitter,
      jsonLd,
      breadcrumbs
    };
  }

  /**
   * Generate SEO-optimized page title for city electricity plans
   */
  private generateCityTitle(cityName: string, planCount: number, avgRate: number): string {
    const year = new Date().getFullYear();
    
    // Different title formats based on plan count for optimization
    if (planCount > 50) {
      return `${cityName} Electricity Plans ${year} - Compare ${planCount}+ Rates from ${avgRate.toFixed(1)}¢/kWh`;
    } else if (planCount > 20) {
      return `${cityName} TX Electricity Rates ${year} - ${planCount} Plans Available from ${avgRate.toFixed(1)}¢/kWh`;
    } else {
      return `${cityName} Texas Electricity Plans - Compare Rates & Switch Today`;
    }
  }

  /**
   * Generate compelling meta description with local SEO focus
   */
  private generateCityDescription(
    cityName: string, 
    countyName: string, 
    planCount: number, 
    avgRate: number, 
    marketZone: MarketZone
  ): string {
    const region = this.getRegionDescription(marketZone);
    const year = new Date().getFullYear();
    
    return `Compare ${planCount}+ electricity plans in ${cityName}, ${countyName}, Texas. Find the best rates starting from ${avgRate.toFixed(1)}¢/kWh in ${region}. Licensed providers, transparent pricing, easy switching. Updated ${year}.`;
  }

  /**
   * Generate relevant keywords for local SEO
   */
  private generateCityKeywords(
    cityName: string, 
    countyName: string, 
    marketZone: MarketZone,
    zipCode: string
  ): string[] {
    const baseKeywords = [
      `${cityName} electricity plans`,
      `${cityName} electricity rates`,
      `${cityName} TX electricity`,
      `${cityName} Texas power plans`,
      `electricity plans ${zipCode}`,
      `power companies ${cityName}`,
      `${countyName} electricity rates`,
      `cheap electricity ${cityName}`,
      `best electricity rates ${cityName}`,
      `electricity providers ${cityName} TX`
    ];

    // Add region-specific keywords
    const regionKeywords = this.getRegionKeywords(marketZone, cityName);
    
    // Add year-specific keywords
    const year = new Date().getFullYear();
    const yearKeywords = [
      `electricity plans ${year}`,
      `${cityName} electricity ${year}`,
      `Texas electricity rates ${year}`
    ];

    return [...baseKeywords, ...regionKeywords, ...yearKeywords];
  }

  /**
   * Generate structured data (JSON-LD) for city pages
   */
  private generateCityJsonLd(zipData: ZIPSEOData, pageUrl: string): object {
    const { cityName, countyName, planCount, avgRate, tdspTerritory, lastUpdated } = zipData;
    const capitalizedCity = this.capitalizeWords(cityName);

    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `${capitalizedCity} Electricity Plans`,
      description: `Compare electricity plans and rates in ${capitalizedCity}, Texas`,
      url: pageUrl,
      mainEntity: {
        '@type': 'LocalBusiness',
        '@id': `${pageUrl}#business`,
        name: `${capitalizedCity} Electricity Plans`,
        description: `Electricity plan comparison service for ${capitalizedCity}, Texas`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: capitalizedCity,
          addressRegion: 'TX',
          addressCountry: 'US'
        },
        geo: {
          '@type': 'GeoCoordinates',
          addressCountry: 'US',
          addressRegion: 'TX',
          addressLocality: capitalizedCity
        },
        serviceArea: {
          '@type': 'State',
          name: 'Texas',
          '@id': 'https://en.wikipedia.org/wiki/Texas'
        },
        provider: {
          '@type': 'Organization',
          name: 'ChooseMyPower.org',
          url: this.baseUrl,
          logo: `${this.baseUrl}/images/logo.png`
        }
      },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        lowPrice: (avgRate * 0.7).toFixed(3),
        highPrice: (avgRate * 1.5).toFixed(3),
        offerCount: planCount,
        availability: 'https://schema.org/InStock',
        validThrough: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        seller: {
          '@type': 'Organization',
          name: tdspTerritory,
          '@id': `${pageUrl}#seller`
        }
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: this.generateCityBreadcrumbs(capitalizedCity, zipData.citySlug, zipData.marketZone)
          .map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.name,
            item: crumb.url
          }))
      },
      dateModified: lastUpdated.toISOString(),
      datePublished: lastUpdated.toISOString(),
      publisher: {
        '@type': 'Organization',
        name: this.siteName,
        url: this.baseUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${this.baseUrl}/images/logo.png`,
          width: 200,
          height: 60
        }
      }
    };
  }

  /**
   * Generate breadcrumb navigation for SEO
   */
  private generateCityBreadcrumbs(cityName: string, citySlug: string, marketZone: MarketZone): Array<{name: string; url: string}> {
    const region = this.getRegionName(marketZone);
    
    return [
      {
        name: 'Home',
        url: this.baseUrl
      },
      {
        name: 'Texas Electricity Plans',
        url: `${this.baseUrl}/texas/`
      },
      {
        name: `${region} Texas`,
        url: `${this.baseUrl}/texas/${region.toLowerCase().replace(/\s+/g, '-')}`
      },
      {
        name: `${cityName} Electricity Plans`,
        url: `${this.baseUrl}/electricity-plans/${citySlug}`
      }
    ];
  }

  /**
   * Generate ZIP code specific meta tags for ZIP lookup pages
   */
  generateZIPLookupSEO(zipCode: string): Partial<CityPageSEO> {
    const year = new Date().getFullYear();
    
    return {
      title: `Find Electricity Plans for ZIP ${zipCode} - Texas Rates ${year}`,
      description: `Enter ZIP code ${zipCode} to compare electricity plans and rates in your area. Find the best Texas electricity deals with transparent pricing and easy switching.`,
      keywords: [
        `electricity plans ${zipCode}`,
        `ZIP code ${zipCode} electricity`,
        `power plans ${zipCode}`,
        `electricity rates ${zipCode}`,
        `Texas electricity ${zipCode}`
      ]
    };
  }

  /**
   * Generate sitemap entries for ZIP navigation pages
   */
  generateZIPSitemapEntries(zipMappings: ZIPCodeMapping[]): Array<{
    url: string;
    lastmod: string;
    changefreq: 'weekly' | 'monthly';
    priority: number;
  }> {
    return zipMappings.map(mapping => ({
      url: `${this.baseUrl}/electricity-plans/${mapping.citySlug}`,
      lastmod: mapping.lastValidated.toISOString().split('T')[0],
      changefreq: 'weekly' as const,
      priority: this.calculateSEOPriority(mapping.priority, mapping.isDeregulated)
    }));
  }

  /**
   * Generate robots.txt directives for ZIP navigation
   */
  generateRobotsDirectives(): string[] {
    return [
      'User-agent: *',
      'Allow: /electricity-plans/',
      'Allow: /api/zip/validate',
      'Disallow: /api/zip/route',
      'Disallow: /api/monitoring/',
      'Disallow: /test/',
      '',
      'Sitemap: https://choosemypower.org/sitemap.xml',
      'Sitemap: https://choosemypower.org/sitemap-cities.xml'
    ];
  }

  // Private helper methods

  private capitalizeWords(str: string): string {
    return str.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private getRegionDescription(marketZone: MarketZone): string {
    const regions = {
      'North': 'North Texas (Dallas-Fort Worth area)',
      'Central': 'Central Texas (Austin-Waco area)', 
      'Coast': 'Texas Gulf Coast (Houston area)',
      'South': 'South Texas (San Antonio area)',
      'West': 'West Texas (Lubbock-Abilene area)'
    };
    return regions[marketZone];
  }

  private getRegionName(marketZone: MarketZone): string {
    const regions = {
      'North': 'North',
      'Central': 'Central',
      'Coast': 'Gulf Coast',
      'South': 'South',
      'West': 'West'
    };
    return regions[marketZone];
  }

  private getRegionKeywords(marketZone: MarketZone, cityName: string): string[] {
    const regionKeywords = {
      'North': ['Dallas Fort Worth electricity', 'DFW power plans', 'North Texas electricity'],
      'Central': ['Austin electricity plans', 'Central Texas power', 'Waco electricity rates'],
      'Coast': ['Houston electricity', 'Gulf Coast power plans', 'Houston area electricity'],
      'South': ['San Antonio electricity', 'South Texas power', 'RGV electricity plans'],
      'West': ['West Texas electricity', 'Lubbock power plans', 'Abilene electricity rates']
    };
    
    return regionKeywords[marketZone] || [];
  }

  private calculateSEOPriority(cityPriority: number, isDeregulated: boolean): number {
    let priority = cityPriority; // Base priority from city importance
    
    if (isDeregulated) {
      priority += 0.2; // Boost for deregulated markets
    }
    
    // Ensure priority is between 0.1 and 1.0
    return Math.min(Math.max(priority, 0.1), 1.0);
  }
}

// Export singleton instance
export const zipNavigationSEOService = new ZIPNavigationSEOService();