/**
 * Scalable Schema Markup Generation
 * Generates structured data for thousands of faceted pages
 * Optimized for performance and SEO compliance
 * 
 * SEO Strategist Agent - Phase 2 Implementation
 */

import { formatCityName, formatFilterName, tdspMapping } from '../../config/tdsp-mapping';
import type { Plan } from '../../types/facets';

interface SchemaGenerationOptions {
  city: string;
  filters: string[];
  plans: Plan[];
  meta: any;
  tdspInfo: any;
  url: string;
  planCount: number;
  lowestRate: number;
}

/**
 * Generate comprehensive schema markup for faceted pages
 * Returns array of schema objects for JSON-LD
 */
export function generateFacetedSchema(options: SchemaGenerationOptions): object[] {
  const { city, filters, plans, meta, tdspInfo, url, planCount, lowestRate } = options;
  const schemas: object[] = [];
  
  // 1. BreadcrumbList Schema - Always include
  schemas.push(generateBreadcrumbSchema(city, filters));
  
  // 2. WebPage Schema - Always include
  schemas.push(generateWebPageSchema(city, filters, meta, url, tdspInfo));
  
  // 3. ItemList Schema for plan listings - If plans available
  if (plans.length > 0) {
    schemas.push(generateItemListSchema(city, filters, plans, meta, planCount));
  }
  
  // 4. LocalBusiness Schema - For city pages only
  if (filters.length === 0) {
    schemas.push(generateLocalBusinessSchema(city, tdspInfo, planCount));
  }
  
  // 5. Service Schema - For filter pages
  if (filters.length > 0) {
    schemas.push(generateServiceSchema(city, filters, tdspInfo, planCount, lowestRate));
  }
  
  // 6. FAQ Schema - For common filter combinations
  if (shouldIncludeFAQSchema(city, filters)) {
    schemas.push(generateFAQSchema(city, filters, tdspInfo));
  }
  
  return schemas;
}

/**
 * Generate BreadcrumbList schema for all pages
 */
function generateBreadcrumbSchema(city: string, filters: string[]): object {
  const breadcrumbs = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://choosemypower.org"
    },
    {
      "@type": "ListItem", 
      "position": 2,
      "name": "Texas",
      "item": "https://choosemypower.org/texas"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": formatCityName(city),
      "item": `https://choosemypower.org/texas/${city}/`
    }
  ];
  
  // Add filter breadcrumbs
  filters.forEach((filter, index) => {
    const filterPath = filters.slice(0, index + 1).join('/');
    breadcrumbs.push({
      "@type": "ListItem",
      "position": 4 + index,
      "name": formatFilterName(filter),
      "item": `https://choosemypower.org/texas/${city}/${filterPath}/`
    });
  });
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs
  };
}

/**
 * Generate WebPage schema
 */
function generateWebPageSchema(city: string, filters: string[], meta: any, url: string, tdspInfo: any): object {
  const cityName = formatCityName(city);
  const filterText = filters.length > 0 ? ` - ${filters.map(formatFilterName).join(' ')}` : '';
  
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": meta.title || `Electricity Plans in ${cityName}${filterText}`,
    "description": meta.description,
    "url": url,
    "isPartOf": {
      "@type": "WebSite",
      "name": "ChooseMyPower.org",
      "url": "https://choosemypower.org"
    },
    "about": {
      "@type": "Service",
      "name": "Electricity Plan Comparison",
      "provider": {
        "@type": "Organization",
        "name": "ChooseMyPower.org"
      }
    },
    "mainEntity": {
      "@type": "Place",
      "name": cityName,
      "addressRegion": "TX",
      "containedInPlace": {
        "@type": "State",
        "name": "Texas"
      }
    }
  };
}

/**
 * Generate ItemList schema for plan listings
 */
function generateItemListSchema(city: string, filters: string[], plans: Plan[], meta: any, totalCount: number): object {
  const cityName = formatCityName(city);
  const limitedPlans = plans.slice(0, 20); // Limit for performance
  
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": meta.h1 || `Electricity Plans in ${cityName}`,
    "description": meta.description,
    "numberOfItems": totalCount,
    "itemListElement": limitedPlans.map((plan, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": plan.name,
        "description": `${plan.contract.length}-month ${plan.contract.type} rate electricity plan`,
        "brand": {
          "@type": "Brand",
          "name": plan.provider.name
        },
        "offers": {
          "@type": "Offer",
          "price": plan.pricing.rate1000kWh.toFixed(3),
          "priceCurrency": "USD",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": plan.pricing.ratePerKwh.toFixed(3),
            "priceCurrency": "USD",
            "unitText": "kWh",
            "unitCode": "KWH"
          },
          "availability": "https://schema.org/InStock",
          "seller": {
            "@type": "Organization",
            "name": plan.provider.name
          }
        },
        "additionalProperty": [
          {
            "@type": "PropertyValue",
            "name": "Contract Length",
            "value": `${plan.contract.length} months`
          },
          {
            "@type": "PropertyValue", 
            "name": "Rate Type",
            "value": plan.contract.type
          },
          {
            "@type": "PropertyValue",
            "name": "Green Energy",
            "value": `${plan.features.greenEnergy}%`
          }
        ]
      }
    }))
  };
}

/**
 * Generate LocalBusiness schema for city pages
 */
function generateLocalBusinessSchema(city: string, tdspInfo: any, planCount: number): object {
  const cityName = formatCityName(city);
  
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Electricity Plans in ${cityName}`,
    "description": `Compare electricity plans and rates in ${cityName}, Texas. ${planCount} plans available from top providers.`,
    "url": `https://choosemypower.org/texas/${city}/`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": cityName,
      "addressRegion": "TX",
      "addressCountry": "US"
    },
    "areaServed": {
      "@type": "City",
      "name": cityName,
      "containedInPlace": {
        "@type": "State",
        "name": "Texas"
      }
    },
    "serviceArea": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "addressLocality": cityName,
        "addressRegion": "TX"
      }
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Electricity Plans",
      "itemListElement": {
        "@type": "OfferCatalog", 
        "numberOfItems": planCount
      }
    },
    "providerMobility": "static",
    "telephone": "1-855-POWER-01"
  };
}

/**
 * Generate Service schema for filter pages
 */
function generateServiceSchema(city: string, filters: string[], tdspInfo: any, planCount: number, lowestRate: number): object {
  const cityName = formatCityName(city);
  const serviceType = getServiceTypeFromFilters(filters);
  
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `${serviceType} Electricity Plans in ${cityName}`,
    "description": `${serviceType} electricity plans available in ${cityName}, TX starting at ${lowestRate}¢/kWh`,
    "provider": {
      "@type": "Organization",
      "name": "ChooseMyPower.org"
    },
    "areaServed": {
      "@type": "City",
      "name": cityName,
      "addressRegion": "TX"
    },
    "serviceType": serviceType,
    "offers": {
      "@type": "AggregateOffer",
      "offerCount": planCount,
      "lowPrice": lowestRate.toFixed(3),
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "category": "Electricity Service",
    "termsOfService": "https://choosemypower.org/terms-of-service"
  };
}

/**
 * Get service type description from filters
 */
function getServiceTypeFromFilters(filters: string[]): string {
  const typeMap: Record<string, string> = {
    '12-month': '12-Month Contract',
    '24-month': '24-Month Contract', 
    'fixed-rate': 'Fixed Rate',
    'variable-rate': 'Variable Rate',
    'green-energy': '100% Green Energy',
    'prepaid': 'Prepaid No Deposit'
  };
  
  const types = filters.map(f => typeMap[f] || formatFilterName(f)).filter(Boolean);
  return types.length > 0 ? types.join(' ') : 'Electricity';
}

/**
 * Generate FAQ schema for common combinations
 */
function generateFAQSchema(city: string, filters: string[], tdspInfo: any): object {
  const cityName = formatCityName(city);
  const filterText = filters.length > 0 ? filters.map(formatFilterName).join(' ').toLowerCase() : '';
  
  const baseFAQs = [
    {
      "@type": "Question",
      "name": `How do I switch electricity providers in ${cityName}?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `Switching electricity providers in ${cityName} is simple. Choose a plan, enroll online or by phone, and your new provider handles the switch. Service continues uninterrupted through ${tdspInfo.name}.`
      }
    },
    {
      "@type": "Question", 
      "name": `Who delivers electricity in ${cityName}?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `${tdspInfo.name} delivers electricity to all customers in ${cityName}, regardless of which retail provider you choose. They maintain the power lines and respond to outages.`
      }
    }
  ];
  
  // Add filter-specific FAQs
  if (filters.includes('12-month')) {
    baseFAQs.push({
      "@type": "Question",
      "name": `What are the benefits of 12-month electricity plans in ${cityName}?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "12-month plans offer rate stability for a full year while maintaining flexibility. You get protection from seasonal price spikes without the long-term commitment of 24 or 36-month contracts."
      }
    });
  }
  
  if (filters.includes('green-energy')) {
    baseFAQs.push({
      "@type": "Question",
      "name": `Are green energy plans more expensive in ${cityName}?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Green energy plans in Texas are often competitively priced with traditional plans. The renewable energy comes from Texas wind and solar facilities, supporting local clean energy development."
      }
    });
  }
  
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": baseFAQs
  };
}

/**
 * Determine if FAQ schema should be included
 */
function shouldIncludeFAQSchema(city: string, filters: string[]): boolean {
  const cityTier = tdspMapping[city]?.tier || 3;
  
  // Include FAQ for city pages of Tier 1 and 2 cities
  if (filters.length === 0 && cityTier <= 2) {
    return true;
  }
  
  // Include FAQ for popular filter combinations in Tier 1 cities
  if (cityTier === 1 && filters.length === 1) {
    const popularFilters = ['12-month', 'fixed-rate', 'green-energy', 'prepaid'];
    return popularFilters.some(f => filters.includes(f));
  }
  
  return false;
}

/**
 * Validate schema markup for common issues
 */
export function validateSchemaMarkup(schemas: object[]): string[] {
  const issues: string[] = [];
  
  schemas.forEach((schema: any, index) => {
    // Check required fields
    if (!schema['@context']) {
      issues.push(`Schema ${index}: Missing @context`);
    }
    if (!schema['@type']) {
      issues.push(`Schema ${index}: Missing @type`);
    }
    
    // Type-specific validations
    if (schema['@type'] === 'BreadcrumbList') {
      if (!schema.itemListElement || !Array.isArray(schema.itemListElement)) {
        issues.push(`BreadcrumbList schema: Missing or invalid itemListElement`);
      }
    }
    
    if (schema['@type'] === 'ItemList') {
      if (!schema.numberOfItems || schema.numberOfItems < 1) {
        issues.push(`ItemList schema: Missing or invalid numberOfItems`);
      }
    }
  });
  
  return issues;
}

/**
 * Get schema markup statistics
 */
export interface SchemaStats {
  totalSchemas: number;
  breadcrumbSchemas: number;
  webPageSchemas: number;
  itemListSchemas: number;
  localBusinessSchemas: number;
  serviceSchemas: number;
  faqSchemas: number;
}

export function getSchemaStats(allSchemas: object[][]): SchemaStats {
  let totalSchemas = 0;
  let breadcrumbSchemas = 0;
  let webPageSchemas = 0; 
  let itemListSchemas = 0;
  let localBusinessSchemas = 0;
  let serviceSchemas = 0;
  let faqSchemas = 0;
  
  allSchemas.forEach(schemas => {
    schemas.forEach((schema: any) => {
      totalSchemas++;
      switch (schema['@type']) {
        case 'BreadcrumbList':
          breadcrumbSchemas++;
          break;
        case 'WebPage':
          webPageSchemas++;
          break;
        case 'ItemList':
          itemListSchemas++;
          break;
        case 'LocalBusiness':
          localBusinessSchemas++;
          break;
        case 'Service':
          serviceSchemas++;
          break;
        case 'FAQPage':
          faqSchemas++;
          break;
      }
    });
  });
  
  return {
    totalSchemas,
    breadcrumbSchemas,
    webPageSchemas,
    itemListSchemas,
    localBusinessSchemas,
    serviceSchemas,
    faqSchemas
  };
}