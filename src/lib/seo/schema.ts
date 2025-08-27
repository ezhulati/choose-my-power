/**
 * Comprehensive Schema Markup Generation for SEO
 * Generates JSON-LD structured data for electricity plans, local business, products, and FAQs
 * Optimized for Google's Rich Results and enhanced search visibility
 */

import type { Plan } from '../../types/facets';
import { formatCityName, tdspMapping } from '../../config/tdsp-mapping';

export interface SchemaGeneratorOptions {
  city: string;
  cityName: string;
  filters: string[];
  plans: Plan[];
  planCount: number;
  lowestRate: number;
  location: string;
  currentUrl: string;
  breadcrumbPath: Array<{name: string, url: string}>;
}

/**
 * Generate comprehensive schema markup for electricity plan pages
 */
export function generatePageSchemas(options: SchemaGeneratorOptions): object[] {
  const schemas = [];

  // 1. WebPage Schema - Core page information
  schemas.push(generateWebPageSchema(options));
  
  // 2. BreadcrumbList Schema - Navigation structure
  schemas.push(generateBreadcrumbSchema(options));
  
  // 3. Service Schema - Electricity comparison service
  schemas.push(generateServiceSchema(options));
  
  // 4. Product Collection Schema - Electricity plans as products
  if (options.plans.length > 0) {
    schemas.push(generateProductCollectionSchema(options));
  }
  
  // 5. LocalBusiness Schema - For city-specific pages
  if (options.filters.length === 0) {
    schemas.push(generateLocalBusinessSchema(options));
  }
  
  // 6. FAQ Schema - Common electricity questions
  schemas.push(generateFAQSchema(options));
  
  // 7. Organization Schema - ChooseMyPower company info
  schemas.push(generateOrganizationSchema());

  return schemas;
}

/**
 * Generate individual plan schemas for detailed pages
 */
export function generatePlanSchemas(plan: Plan, city: string): object[] {
  const schemas = [];
  const cityName = formatCityName(city);

  // Product Schema for individual plan
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `https://choosemypower.org/plans/${plan.provider.name.toLowerCase().replace(/\s+/g, '-')}-${plan.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: `${plan.name} - ${plan.provider.name}`,
    description: `${plan.contract.type} electricity plan in ${cityName} with ${plan.contract.length}-month contract. Rate: ${(plan.pricing.rate1000kWh * 100).toFixed(1)}¢/kWh for 1000 kWh usage.`,
    brand: {
      '@type': 'Brand',
      name: plan.provider.name
    },
    manufacturer: {
      '@type': 'Organization',
      name: plan.provider.name
    },
    offers: {
      '@type': 'Offer',
      price: (plan.pricing.rate1000kWh * 100).toFixed(1),
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: (plan.pricing.rate1000kWh * 100).toFixed(1),
        priceCurrency: 'USD',
        unitText: '¢/kWh',
        referenceQuantity: {
          '@type': 'QuantitativeValue',
          value: 1000,
          unitText: 'kWh'
        }
      },
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString(),
      areaServed: {
        '@type': 'City',
        name: cityName,
        addressRegion: 'TX',
        addressCountry: 'US'
      },
      seller: {
        '@type': 'Organization',
        name: plan.provider.name
      }
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Contract Length',
        value: `${plan.contract.length} months`
      },
      {
        '@type': 'PropertyValue',
        name: 'Rate Type',
        value: plan.contract.type
      },
      {
        '@type': 'PropertyValue',
        name: 'Green Energy',
        value: `${plan.features.greenEnergy}%`
      },
      {
        '@type': 'PropertyValue',
        name: 'Early Termination Fee',
        value: `$${plan.contract.earlyTerminationFee}`
      }
    ],
    category: 'Electricity Plan',
    serviceType: 'Electricity Supply'
  });

  return schemas;
}

function generateWebPageSchema(options: SchemaGeneratorOptions): object {
  const { city, cityName, filters, planCount, lowestRate, currentUrl } = options;
  
  const filterText = filters.length > 0 ? filters.map(f => f.replace('-', ' ')).join(' + ') + ' ' : '';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': currentUrl,
    name: `${filterText}Electricity Plans in ${cityName}, Texas`,
    description: `Compare ${planCount} ${filterText.toLowerCase()}electricity plans in ${cityName}. Find rates as low as ${lowestRate.toFixed(3)}¢/kWh from trusted Texas providers.`,
    url: currentUrl,
    inLanguage: 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      '@id': 'https://choosemypower.org',
      name: 'ChooseMyPower.org',
      description: 'Compare Texas Electricity Plans and Rates',
      url: 'https://choosemypower.org'
    },
    about: {
      '@type': 'Thing',
      name: `Electricity Plans in ${cityName}`,
      description: `Competitive electricity rate comparison for ${cityName}, Texas residents`
    },
    keywords: [
      `${cityName.toLowerCase()} electricity plans`,
      `${cityName.toLowerCase()} electricity rates`,
      `${cityName.toLowerCase()} power companies`,
      'texas electricity comparison',
      'deregulated electricity',
      ...(filters.map(f => `${f.replace('-', ' ')} electricity plans`))
    ].join(', '),
    dateModified: new Date().toISOString(),
    datePublished: new Date().toISOString()
  };
}

function generateBreadcrumbSchema(options: SchemaGeneratorOptions): object {
  const { breadcrumbPath } = options;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbPath.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url
    }))
  };
}

function generateServiceSchema(options: SchemaGeneratorOptions): object {
  const { city, cityName, planCount, lowestRate, filters } = options;
  const tdspInfo = tdspMapping[city] || { name: 'Local TDSP', zone: 'Texas' };
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Electricity Plan Comparison Service',
    description: `Compare electricity rates and plans in ${cityName}, Texas. Find the best electricity providers with transparent pricing.`,
    provider: {
      '@type': 'Organization',
      name: 'ChooseMyPower.org',
      url: 'https://choosemypower.org'
    },
    areaServed: {
      '@type': 'City',
      name: cityName,
      addressRegion: 'TX',
      addressCountry: 'US'
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${filters.length > 0 ? filters.map(f => f.replace('-', ' ')).join(' ') + ' ' : ''}Electricity Plans in ${cityName}`,
      description: `${planCount} available electricity plans with rates starting at ${lowestRate.toFixed(3)}¢/kWh`,
      numberOfItems: planCount,
      itemListElement: filters.length > 0 ? filters.map(filter => ({
        '@type': 'DefinedTerm',
        name: filter.replace('-', ' '),
        description: getFilterDescription(filter)
      })) : undefined
    },
    serviceType: 'Electricity Rate Comparison',
    category: 'Utility Services',
    audience: {
      '@type': 'Audience',
      geographicArea: {
        '@type': 'City',
        name: cityName,
        addressRegion: 'TX'
      }
    }
  };
}

function generateProductCollectionSchema(options: SchemaGeneratorOptions): object {
  const { cityName, plans, planCount, lowestRate, filters } = options;
  
  // Create product listings for top plans
  const topPlans = plans.slice(0, 10).map((plan, index) => ({
    '@type': 'Product',
    position: index + 1,
    name: `${plan.name} - ${plan.provider.name}`,
    description: `${plan.contract.type} electricity plan with ${plan.contract.length}-month contract`,
    offers: {
      '@type': 'Offer',
      price: (plan.pricing.rate1000kWh * 100).toFixed(1),
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        unitText: '¢/kWh'
      },
      availability: 'https://schema.org/InStock'
    },
    brand: {
      '@type': 'Brand',
      name: plan.provider.name
    }
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${filters.length > 0 ? filters.map(f => f.replace('-', ' ')).join(' ') + ' ' : ''}Electricity Plans in ${cityName}`,
    description: `Compare ${planCount} electricity plans with rates starting at ${lowestRate.toFixed(3)}¢/kWh`,
    numberOfItems: planCount,
    itemListElement: topPlans
  };
}

function generateLocalBusinessSchema(options: SchemaGeneratorOptions): object {
  const { city, cityName } = options;
  const tdspInfo = tdspMapping[city] || { name: 'Local TDSP', zone: 'Texas' };
  
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `https://choosemypower.org/texas/${city.replace('-tx', '')}/electricity-plans`,
    name: `ChooseMyPower.org - ${cityName} Electricity Plans`,
    description: `Compare electricity plans and rates in ${cityName}, Texas. Find the best energy deals from trusted providers in the ${tdspInfo.name} service area.`,
    url: `https://choosemypower.org/texas/${city.replace('-tx', '')}/electricity-plans`,
    logo: 'https://choosemypower.org/logo.png',
    image: 'https://choosemypower.org/images/texas-electricity-comparison.jpg',
    telephone: '+1-800-POWER-TX',
    email: 'info@choosemypower.org',
    address: {
      '@type': 'PostalAddress',
      addressLocality: cityName,
      addressRegion: 'TX',
      addressCountry: 'US'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: getCityCoordinates(city).lat,
      longitude: getCityCoordinates(city).lng
    },
    areaServed: [
      {
        '@type': 'City',
        name: cityName,
        addressRegion: 'TX'
      },
      {
        '@type': 'State',
        name: 'Texas',
        addressCountry: 'US'
      }
    ],
    serviceType: ['Electricity Plan Comparison', 'Energy Rate Analysis', 'Utility Service Advisor'],
    priceRange: '$0 (Free Service)',
    openingHours: 'Mo-Su 00:00-23:59',
    sameAs: [
      'https://twitter.com/choosemypower',
      'https://facebook.com/choosemypower',
      'https://linkedin.com/company/choosemypower'
    ]
  };
}

function generateFAQSchema(options: SchemaGeneratorOptions): object {
  const { cityName, filters, planCount, lowestRate } = options;
  
  const baseFAQs = [
    {
      '@type': 'Question',
      name: `How do I choose the best electricity plan in ${cityName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Compare plans based on your monthly usage, preferred contract length, and rate type. Look at the total cost including all fees, not just the advertised rate. Consider whether you want fixed or variable pricing, and check for green energy options if environmental impact is important to you. We show ${planCount} current plans with rates starting at ${lowestRate.toFixed(3)}¢/kWh.`
      }
    },
    {
      '@type': 'Question',
      name: `What's included in electricity rates shown for ${cityName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Our displayed rates include the energy charge, transmission and distribution (TDU) fees, and applicable taxes. This gives you the true cost per kWh with no hidden surprises on your bill. All rates are calculated for typical residential usage levels.`
      }
    },
    {
      '@type': 'Question',
      name: `How quickly can I switch electricity providers in ${cityName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Most electricity provider switches in Texas take 1-2 billing cycles to complete, typically 4-6 weeks. However, if you're moving to a new address, service can often be connected within 1-3 business days. There are no fees from the utility company for switching.`
      }
    },
    {
      '@type': 'Question',
      name: `Are there any fees for switching electricity providers in ${cityName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `There are no fees from the utility company or government for switching electricity providers in Texas. However, you may have an early termination fee if you cancel your current plan before the contract ends. Check your current contract terms for details.`
      }
    }
  ];

  // Add filter-specific FAQs
  const filterFAQs = generateFilterSpecificFAQs(cityName, filters);
  
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [...baseFAQs, ...filterFAQs]
  };
}

function generateFilterSpecificFAQs(cityName: string, filters: string[]): object[] {
  const faqMap: Record<string, object> = {
    '12-month': {
      '@type': 'Question',
      name: `Why choose a 12-month electricity plan in ${cityName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `12-month plans offer a good balance of price stability and flexibility. You get rate protection for a full year without the long-term commitment and higher cancellation fees of 24 or 36-month contracts. Perfect for annual budgeting and reassessing your needs yearly.`
      }
    },
    'fixed-rate': {
      '@type': 'Question',
      name: `What are the benefits of fixed-rate electricity in ${cityName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Fixed-rate plans guarantee your electricity rate for the entire contract term, protecting you from market volatility and seasonal price spikes. This makes budgeting easier and provides peace of mind with predictable monthly bills.`
      }
    },
    'green-energy': {
      '@type': 'Question',
      name: `How does 100% green energy work in ${cityName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Green energy plans match your electricity usage with renewable energy credits (RECs) from Texas wind and solar farms. While the electrons flowing to your home come from the general grid mix, your usage financially supports renewable energy development and reduces carbon emissions.`
      }
    },
    'prepaid': {
      '@type': 'Question',
      name: `Do prepaid electricity plans require a deposit in ${cityName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `No, prepaid electricity plans don't require a security deposit, which can save you $100-$300 upfront. You also don't need a credit check or social security number verification for most prepaid plans. You simply pay for electricity before you use it.`
      }
    }
  };

  return filters
    .filter(filter => faqMap[filter])
    .map(filter => faqMap[filter]);
}

function generateOrganizationSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://choosemypower.org/#organization',
    name: 'ChooseMyPower.org',
    url: 'https://choosemypower.org',
    logo: 'https://choosemypower.org/logo.png',
    description: 'Texas electricity plan comparison service helping residents find the best electricity rates and providers in the deregulated Texas energy market.',
    foundingDate: '2024',
    areaServed: {
      '@type': 'State',
      name: 'Texas',
      addressCountry: 'US'
    },
    serviceType: ['Electricity Plan Comparison', 'Energy Rate Analysis', 'Consumer Education'],
    knowsAbout: [
      'Texas Electricity Deregulation',
      'Electricity Rate Comparison',
      'Energy Provider Analysis',
      'Consumer Energy Rights',
      'Renewable Energy Options'
    ],
    sameAs: [
      'https://twitter.com/choosemypower',
      'https://facebook.com/choosemypower',
      'https://linkedin.com/company/choosemypower'
    ]
  };
}

function getFilterDescription(filter: string): string {
  const descriptions: Record<string, string> = {
    '12-month': 'Annual electricity contracts with rate stability and flexibility',
    '24-month': 'Two-year electricity contracts with competitive long-term rates',
    'fixed-rate': 'Electricity plans with guaranteed rates that never change during contract',
    'variable-rate': 'Electricity plans with rates that may fluctuate with market conditions',
    'green-energy': '100% renewable energy plans supporting Texas wind and solar power',
    'prepaid': 'Pay-as-you-go electricity plans with no deposit or credit check required',
    'autopay-discount': 'Electricity plans with automatic payment discounts',
    'no-deposit': 'Electricity plans that waive security deposits'
  };
  
  return descriptions[filter] || `Electricity plans with ${filter.replace('-', ' ')} features`;
}

function getCityCoordinates(city: string): {lat: number, lng: number} {
  // Approximate coordinates for major Texas cities
  const coordinates: Record<string, {lat: number, lng: number}> = {
    'houston-tx': { lat: 29.7604, lng: -95.3698 },
    'dallas-tx': { lat: 32.7767, lng: -96.7970 },
    'austin-tx': { lat: 30.2672, lng: -97.7431 },
    'san-antonio-tx': { lat: 29.4241, lng: -98.4936 },
    'fort-worth-tx': { lat: 32.7555, lng: -97.3308 },
    'plano-tx': { lat: 33.0198, lng: -96.6989 },
    'arlington-tx': { lat: 32.7357, lng: -97.1081 }
  };
  
  return coordinates[city] || { lat: 31.9686, lng: -99.9018 }; // Center of Texas as fallback
}

// Export utility functions for testing and debugging
export {
  generatePlanSchemas,
  generateFilterSpecificFAQs,
  getFilterDescription
};