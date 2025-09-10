/**
 * SEO Meta Generation System
 * Generates dynamic meta tags, titles, descriptions, and content for faceted pages
 * Handles all SEO optimization for scalable landing page creation
 */

import type { FacetedMeta, FacetedMetaOptions } from '../../types/facets';
import { formatCityName, formatFilterName, tdspMapping } from '../../config/tdsp-mapping';

interface MetaTemplate {
  title: string;
  description: string;
  h1: string;
  categoryContent: string;
  footerContent?: string;
}

interface MetaTemplates {
  [key: string]: MetaTemplate;
}

export function generateFacetedMeta(options: FacetedMetaOptions): FacetedMeta {
  const { city, filters, planCount, lowestRate, location } = options;
  const cityName = formatCityName(city);
  const filterKey = filters.join(',') || 'base';
  
  // Get template for current filter combination
  const template = getMetaTemplate(filterKey, cityName, planCount, lowestRate, location);
  
  return {
    title: template.title,
    description: template.description,
    h1: template.h1,
    categoryContent: template.categoryContent,
    footerContent: template.footerContent || generateFooterContent(city, filters),
    schema: generateSchemaMarkup(options),
  };
}

function getMetaTemplate(
  filterKey: string,
  cityName: string, 
  planCount: number,
  lowestRate: number,
  location: string
): MetaTemplate {
  const templates: MetaTemplates = {
    // Base city page
    base: {
      title: `${planCount} Electricity Plans in ${cityName} | Compare Rates & Save`,
      description: `Compare ${planCount} electricity plans in ${cityName}. Find competitive rates from licensed electricity companies with transparent pricing. Switch providers in minutes and save money.`,
      h1: `${planCount} Electricity Plans in ${cityName}`,
      categoryContent: `
        <div class="category-intro">
          <p>Finding the right electricity plan in ${cityName} shouldn't be complicated. We've simplified the process by gathering ${planCount} current plans from licensed electricity companies in the ${location} service area, so you can compare rates, contract terms, and features in one place.</p>
          
          <p>Current rates in ${cityName} start from competitive levels for average monthly usage. All prices shown include energy charges, transmission fees, and applicable taxes - no hidden surprises on your bill.</p>
          
          <p>Whether you're moving to a new home, your contract is expiring, or you're simply looking for a better deal, use our comparison tool to find the plan that fits your budget and energy needs.</p>
        </div>
      `,
    },

    // 12-month plans
    '12-month': {
      title: `${planCount} Best 12-Month Electricity Plans in ${cityName} | Fixed Rates`,
      description: `Lock in stable rates with ${planCount} 12-month electricity plans in ${cityName}. Starting from competitive rates with price protection and no long-term commitment.`,
      h1: `${planCount} 12-Month Electricity Plans in ${cityName}`,
      categoryContent: `
        <div class="category-intro">
          <p>Looking for stable electricity rates without the long-term commitment? Our 12-month electricity plans in ${cityName} offer the ideal balance of price protection and flexibility.</p>
          
          <p>With ${planCount} annual plans currently available from licensed electricity companies, you'll find competitive rates starting from attractive levels. These contracts protect you from seasonal price spikes while avoiding the hefty early termination fees common with 24 or 36-month agreements.</p>
          
          <p><strong>Why Choose a 12-Month Plan?</strong></p>
          <ul>
            <li>Price stability for a full year</li>
            <li>Lower early termination fees than longer contracts</li>
            <li>Protection from market volatility</li>
            <li>Flexibility to switch if your needs change</li>
          </ul>
          
          <p>All prices shown include complete pricing transparency with no hidden fees or surprises.</p>
        </div>
      `,
    },

    // Fixed rate plans
    'fixed-rate': {
      title: `Fixed Rate Electricity Plans in ${cityName} | Lock Your Rate & Save`,
      description: `Protect against rate increases with fixed-rate electricity in ${cityName}. ${planCount} plans starting from competitive rates with stable pricing.`,
      h1: `Fixed Rate Electricity Plans in ${cityName}`,
      categoryContent: `
        <div class="category-intro">
          <p>Take control of your electricity costs with fixed-rate plans in ${cityName}. Unlike variable-rate plans that can increase without notice, fixed-rate electricity gives you predictable monthly bills and protection from market volatility.</p>
          
          <p>Compare ${planCount} fixed-rate options from reputable providers, with rates starting from competitive levels. Your rate stays the same for the entire contract term, making budgeting simple and stress-free.</p>
          
          <p><strong>Benefits of Fixed-Rate Plans:</strong></p>
          <ul>
            <li>Rate fixed for entire contract term</li>
            <li>Protection from seasonal price increases</li>
            <li>Predictable monthly electricity bills</li>
            <li>Budget-friendly for families and businesses</li>
          </ul>
          
          <p>All plans include transparent pricing with energy charges, ${location} delivery fees, and taxes clearly displayed.</p>
        </div>
      `,
    },

    // Green energy plans
    'green-energy': {
      title: `100% Green Energy Plans in ${cityName} | Renewable Electricity`,
      description: `Go 100% renewable with green energy plans in ${cityName}. ${planCount} eco-friendly options from licensed electricity companies. Support Texas wind and solar power.`,
      h1: `100% Renewable Energy Plans in ${cityName}`,
      categoryContent: `
        <div class="category-intro">
          <p>Make a positive environmental impact while saving money on electricity in ${cityName}. Our 100% renewable energy plans ensure your electricity usage is matched with renewable energy credits from Texas wind and solar farms.</p>
          
          <p>Choose from ${planCount} green energy options starting from competitive rates - often comparable to traditional fossil fuel plans. Supporting renewable energy has never been more affordable or accessible.</p>
          
          <p><strong>Why Choose 100% Green Energy?</strong></p>
          <ul>
            <li>Support Texas wind and solar development</li>
            <li>Reduce your carbon footprint</li>
            <li>Often competitively priced with traditional plans</li>
            <li>Feel good about your energy choices</li>
          </ul>
          
          <p>Each plan displayed includes complete pricing transparency and provider ratings from real customers. Join thousands of ${cityName} residents powering their homes with clean, renewable electricity.</p>
        </div>
      `,
    },

    // Prepaid plans
    'prepaid': {
      title: `Prepaid Electricity Plans in ${cityName} | No Deposit Required`,
      description: `Get electricity today with no deposit in ${cityName}. ${planCount} prepaid plans available starting from competitive rates. No credit check required.`,
      h1: `No Deposit Prepaid Electricity in ${cityName}`,
      categoryContent: `
        <div class="category-intro">
          <p>Get your electricity connected today without a security deposit. Our prepaid electricity plans in ${cityName} offer same-day service with no credit check required - ideal for new residents, renters, or anyone looking to control their energy costs.</p>
          
          <p>Compare ${planCount} prepaid options with rates starting from competitive levels. Pay as you go and never worry about surprise bills or reconnection fees.</p>
          
          <p><strong>Benefits of Prepaid Electricity:</strong></p>
          <ul>
            <li>No security deposit required (save $100-$300)</li>
            <li>No credit check or SSN verification</li>
            <li>Same-day service activation available</li>
            <li>Complete control over your energy spending</li>
            <li>No surprise bills or hidden fees</li>
          </ul>
          
          <p>All prepaid plans include mobile apps for easy account management and real-time usage monitoring.</p>
        </div>
      `,
    },

    // High-value combinations
    '12-month,fixed-rate': {
      title: `12-Month Fixed Rate Electricity Plans in ${cityName} | Best Value`,
      description: `Lock in stable 12-month fixed rates in ${cityName}. ${planCount} plans starting from competitive rates with price protection and flexibility.`,
      h1: `12-Month Fixed Rate Plans in ${cityName}`,
      categoryContent: `
        <div class="category-intro">
          <p>Get the best of both worlds with 12-month fixed-rate electricity plans in ${cityName}. Enjoy one full year of stable, predictable rates without the long-term commitment of 24 or 36-month contracts.</p>
          
          <p>Our ${planCount} available plans start from competitive rates and offer the ideal balance of price protection and contract flexibility. Your rate is fixed for 12 months, protecting you from seasonal price spikes.</p>
          
          <p><strong>Why 12-Month Fixed Rate is the Sweet Spot:</strong></p>
          <ul>
            <li>One full year of rate protection</li>
            <li>Lower cancellation fees than longer contracts</li>
            <li>Ideal for annual budgeting</li>
            <li>Flexibility to reassess after one year</li>
          </ul>
        </div>
      `,
    },

    'prepaid,no-deposit': {
      title: `No Deposit Prepaid Electricity in ${cityName} | Same Day Service`,
      description: `Skip the deposit and get power today in ${cityName}. ${planCount} no deposit prepaid plans from licensed electricity companies. No credit check, instant approval.`,
      h1: `No Deposit Prepaid Electricity Plans in ${cityName}`,
      categoryContent: `
        <div class="category-intro">
          <p>Get electricity service in ${cityName} without paying a security deposit. Our no-deposit prepaid plans offer immediate activation with no credit check, ideal for anyone who needs power connected quickly.</p>
          
          <p>Save $100-$300 in upfront costs with ${planCount} no-deposit options starting from competitive rates. Simply prepay for your electricity usage and enjoy complete control over your energy spending.</p>
        </div>
      `,
    },

    'green-energy,12-month': {
      title: `12-Month Green Energy Plans in ${cityName} | Renewable Fixed Rates`,
      description: `Lock in 100% renewable energy for 12 months in ${cityName}. ${planCount} eco-friendly fixed plans from licensed electricity companies. Support Texas clean energy.`,
      h1: `12-Month 100% Green Energy Plans in ${cityName}`,
      categoryContent: `
        <div class="category-intro">
          <p>Combine environmental responsibility with rate stability. Our 12-month green energy plans in ${cityName} give you 100% renewable electricity with fixed pricing for a full year.</p>
          
          <p>Choose from ${planCount} eco-friendly plans starting from competitive rates. Support Texas wind and solar development while enjoying predictable monthly bills.</p>
        </div>
      `,
    },
  };

  return templates[filterKey] || templates['base'];
}

function generateFooterContent(city: string, filters: string[]): string {
  const cityName = formatCityName(city);
  const tdspInfo = tdspMapping[city];
  
  return `
    <div class="seo-footer-content">
      <div class="location-info">
        <h3>About Electricity Service in ${cityName}</h3>
        <p>${cityName} residents receive electricity through ${tdspInfo?.name}, part of Texas's deregulated energy market. This means you have the power to choose your electricity provider and plan, potentially saving hundreds of dollars per year compared to default utility rates.</p>
        
        <p>The Texas electricity market serves over 8 million customers across deregulated areas, with average residential usage of 1,000-1,200 kWh per month. By comparing plans regularly, ${cityName} residents can take advantage of competitive rates and new plan features.</p>
      </div>
      
      <div class="market-context">
        <h3>Understanding Your ${cityName} Electricity Options</h3>
        <p>When choosing an electricity plan in ${cityName}, consider these key factors:</p>
        <ul>
          <li><strong>Rate Type:</strong> Fixed rates provide stability, while variable rates may start lower but can increase</li>
          <li><strong>Contract Length:</strong> Shorter contracts offer more flexibility, longer contracts often have lower rates</li>
          <li><strong>Usage Levels:</strong> Make sure to compare rates at your typical monthly usage level</li>
          <li><strong>Fees:</strong> Look for monthly service charges, connection fees, and early termination fees</li>
          <li><strong>Green Options:</strong> Many providers offer renewable energy plans at competitive rates</li>
        </ul>
      </div>
      
      ${filters.length > 0 ? `
      <div class="filter-context">
        <h3>Why ${filters.map(f => formatFilterName(f)).join(' + ')} Plans?</h3>
        <p>The combination of ${filters.map(f => formatFilterName(f)).join(' and ').toLowerCase()} offers specific advantages for ${cityName} residents. These filtered results help you focus on plans that match your preferences and needs.</p>
      </div>
      ` : ''}
    </div>
  `;
}

function generateSchemaMarkup(options: FacetedMetaOptions): object[] {
  const { city, filters, planCount, lowestRate, location } = options;
  const cityName = formatCityName(city);
  
  const schemas = [];

  // BreadcrumbList Schema
  const breadcrumbs = [
    { name: 'Home', url: 'https://choosemypower.org' },
    { name: 'Electricity Plans', url: 'https://choosemypower.org/electricity-plans/' },
    { name: cityName, url: `https://choosemypower.org/electricity-plans/${city}` },
  ];

  // Add filter breadcrumbs
  let currentPath = city;
  filters.forEach((filter, index) => {
    currentPath += `/${filter}`;
    breadcrumbs.push({
      name: formatFilterName(filter),
      url: `https://choosemypower.org/electricity-plans/${currentPath}`
    });
  });

  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  });

  // WebPage Schema
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Electricity Plans in ${cityName}`,
    description: `Compare ${planCount} electricity plans in ${cityName}. Find competitive rates from licensed electricity companies.`,
    url: `https://choosemypower.org/electricity-plans/${city}/${filters.join('/')}`,
    mainEntity: {
      '@type': 'Service',
      name: 'Electricity Plan Comparison',
      provider: {
        '@type': 'Organization',
        name: 'ChooseMyPower.org',
        url: 'https://choosemypower.org',
      },
      areaServed: {
        '@type': 'City',
        name: cityName,
        addressRegion: 'TX',
        addressCountry: 'US',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `${filters.length > 0 ? filters.map(f => formatFilterName(f)).join(' ') + ' ' : ''}Electricity Plans`,
        numberOfItems: planCount,
      },
    },
  });

  // LocalBusiness Schema (for city pages)
  if (filters.length === 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': `https://choosemypower.org/electricity-plans/${city}`,
      name: `ChooseMyPower.org - ${cityName} Electricity Plans`,
      description: `Compare electricity plans and rates in ${cityName}, Texas. Find the best energy deals from licensed electricity companies.`,
      url: `https://choosemypower.org/electricity-plans/${city}`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: cityName,
        addressRegion: 'TX',
        addressCountry: 'US',
      },
      areaServed: {
        '@type': 'City',
        name: cityName,
        addressRegion: 'TX',
      },
      serviceType: 'Electricity Plan Comparison',
    });
  }

  // FAQ Schema for common questions
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: generateFAQSchema(cityName, filters),
  });

  return schemas;
}

function generateFAQSchema(cityName: string, filters: string[]) {
  const baseFAQs = [
    {
      '@type': 'Question',
      name: `How do I choose the best electricity plan in ${cityName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Compare plans based on your monthly usage, preferred contract length, and rate type. Look at the total cost including all fees, not just the advertised rate. Consider whether you want fixed or variable pricing, and check for green energy options if environmental impact is important to you.`,
      },
    },
    {
      '@type': 'Question',
      name: `What's included in electricity rates in ${cityName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Our displayed rates include the energy charge, transmission and distribution (TDU) fees, and applicable taxes. This gives you the true cost per kWh with no hidden surprises on your bill.`,
      },
    },
    {
      '@type': 'Question',
      name: `How quickly can I switch electricity providers in ${cityName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Most electricity provider switches in Texas take 1-2 billing cycles to complete, typically 4-6 weeks. However, if you're moving to a new address, service can often be connected within 1-3 business days.`,
      },
    },
  ];

  // Add filter-specific FAQs
  const filterFAQs: Record<string, any> = {
    '12-month': {
      '@type': 'Question',
      name: `Why choose a 12-month electricity plan in ${cityName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `12-month plans offer a good balance of price stability and flexibility. You get rate protection for a full year without the long-term commitment and higher cancellation fees of 24 or 36-month contracts.`,
      },
    },
    'fixed-rate': {
      '@type': 'Question',
      name: `What are the benefits of fixed-rate electricity in ${cityName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Fixed-rate plans lock your electricity rate for the contract term, protecting you from market volatility and seasonal price spikes. This makes budgeting easier.`,
      },
    },
    'green-energy': {
      '@type': 'Question',
      name: `How does 100% green energy work in ${cityName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Green energy plans match your electricity usage with renewable energy credits (RECs) from Texas wind and solar farms. While the electrons flowing to your home come from the general grid mix, your usage financially supports renewable energy development.`,
      },
    },
    'prepaid': {
      '@type': 'Question',
      name: `Do prepaid electricity plans require a deposit in ${cityName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `No, prepaid electricity plans don't require a security deposit, which can save you $100-$300 upfront. You also don't need a credit check or social security number verification for most prepaid plans.`,
      },
    },
  };

  // Add relevant filter FAQs
  const relevantFilterFAQs = filters
    .filter(filter => filterFAQs[filter])
    .map(filter => filterFAQs[filter]);

  return [...baseFAQs, ...relevantFilterFAQs];
}

// Export utility functions for use in other parts of the application
export {
  generateSchemaMarkup,
  generateFooterContent,
};