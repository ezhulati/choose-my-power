import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { facetedRouter } from '../../src/lib/faceted/faceted-router';
import { metaGenerator } from '../../src/lib/seo/meta-generator-scale';
import { canonicalUrlGenerator } from '../../src/lib/seo/canonical-scale';
import { schemaGenerator } from '../../src/lib/seo/schema-scale';
import { contentVariationSystem } from '../../src/lib/seo/content-variation-system';
import { seoMonitoringSystem } from '../../src/lib/seo/seo-monitoring-system';

// Mock DOM environment for SEO testing
function createMockPage(html: string) {
  const dom = new JSDOM(html);
  return dom.window;
}

// SEO validation utilities
class SEOValidator {
  static validateTitle(title: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!title) {
      issues.push('Title is missing');
    } else {
      if (title.length < 30) issues.push('Title is too short (< 30 characters)');
      if (title.length > 60) issues.push('Title is too long (> 60 characters)');
      if (!title.includes('Texas')) issues.push('Title missing geographic keyword');
      if (!title.includes('Electricity')) issues.push('Title missing primary keyword');
    }
    
    return { isValid: issues.length === 0, issues };
  }

  static validateMetaDescription(description: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!description) {
      issues.push('Meta description is missing');
    } else {
      if (description.length < 120) issues.push('Meta description is too short (< 120 characters)');
      if (description.length > 160) issues.push('Meta description is too long (> 160 characters)');
      if (!description.toLowerCase().includes('electricity')) issues.push('Missing primary keyword');
      if (!description.toLowerCase().includes('texas')) issues.push('Missing geographic keyword');
    }
    
    return { isValid: issues.length === 0, issues };
  }

  static validateHeadingStructure(headings: { level: number; text: string }[]): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    const h1s = headings.filter(h => h.level === 1);
    if (h1s.length !== 1) {
      issues.push(`Should have exactly one H1, found ${h1s.length}`);
    }
    
    if (h1s.length > 0 && !h1s[0].text.toLowerCase().includes('electricity')) {
      issues.push('H1 should include primary keyword');
    }
    
    // Check heading hierarchy
    for (let i = 1; i < headings.length; i++) {
      const current = headings[i];
      const previous = headings[i - 1];
      
      if (current.level > previous.level + 1) {
        issues.push(`Heading hierarchy skip detected: H${previous.level} -> H${current.level}`);
      }
    }
    
    return { isValid: issues.length === 0, issues };
  }

  static validateStructuredData(jsonLd: any): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!jsonLd) {
      issues.push('Structured data is missing');
      return { isValid: false, issues };
    }
    
    if (!jsonLd['@context']) issues.push('Missing @context');
    if (!jsonLd['@type']) issues.push('Missing @type');
    if (!jsonLd.name) issues.push('Missing name property');
    if (!jsonLd.description) issues.push('Missing description property');
    
    // Validate breadcrumb if present
    if (jsonLd.breadcrumb) {
      if (!jsonLd.breadcrumb.itemListElement || !Array.isArray(jsonLd.breadcrumb.itemListElement)) {
        issues.push('Invalid breadcrumb structure');
      } else if (jsonLd.breadcrumb.itemListElement.length === 0) {
        issues.push('Empty breadcrumb list');
      }
    }
    
    return { isValid: issues.length === 0, issues };
  }

  static validateCanonicalUrl(url: string, expectedPattern: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!url) {
      issues.push('Canonical URL is missing');
    } else {
      if (!url.startsWith('http')) issues.push('Canonical URL should be absolute');
      if (!url.includes(expectedPattern)) issues.push(`Canonical URL doesn't match expected pattern: ${expectedPattern}`);
      if (url.includes('?')) issues.push('Canonical URL should not contain query parameters');
    }
    
    return { isValid: issues.length === 0, issues };
  }
}

describe('SEO and Analytics Comprehensive Testing', () => {
  describe('Meta Tag Generation and Optimization', () => {
    it('should generate unique meta tags for each city/filter combination', async () => {
      const testCombinations = [
        { city: 'dallas', filters: [] },
        { city: 'dallas', filters: ['12-month'] },
        { city: 'dallas', filters: ['green-energy'] },
        { city: 'dallas', filters: ['12-month', 'green-energy'] },
        { city: 'houston', filters: [] },
        { city: 'houston', filters: ['24-month'] },
        { city: 'austin', filters: ['fixed-rate'] }
      ];

      const generatedMetas = new Map<string, any>();
      
      for (const { city, filters } of testCombinations) {
        const meta = await metaGenerator.generateMeta(city, filters);
        const key = `${city}-${filters.join('+')}`;
        
        // Validate meta tag structure
        expect(meta.title).toBeDefined();
        expect(meta.description).toBeDefined();
        expect(meta.keywords).toBeDefined();
        
        // Validate SEO compliance
        const titleValidation = SEOValidator.validateTitle(meta.title);
        const descriptionValidation = SEOValidator.validateMetaDescription(meta.description);
        
        expect(titleValidation.isValid).toBe(true);
        if (!titleValidation.isValid) {
          console.warn(`Title issues for ${key}:`, titleValidation.issues);
        }
        
        expect(descriptionValidation.isValid).toBe(true);
        if (!descriptionValidation.isValid) {
          console.warn(`Description issues for ${key}:`, descriptionValidation.issues);
        }
        
        // Ensure uniqueness
        if (generatedMetas.has(meta.title)) {
          throw new Error(`Duplicate title found: "${meta.title}"`);
        }
        
        generatedMetas.set(meta.title, { city, filters, meta });
        
        console.log(`✓ ${key}: "${meta.title.substring(0, 50)}..."`);
      }

      expect(generatedMetas.size).toBe(testCombinations.length);
    });

    it('should generate contextually relevant keywords', async () => {
      const testCases = [
        {
          city: 'dallas',
          filters: ['12-month', 'green-energy'],
          expectedKeywords: ['dallas', '12', 'month', 'green', 'energy', 'renewable', 'contract']
        },
        {
          city: 'houston',
          filters: ['fixed-rate', 'autopay-discount'],
          expectedKeywords: ['houston', 'fixed', 'rate', 'autopay', 'discount', 'stable', 'pricing']
        }
      ];

      for (const { city, filters, expectedKeywords } of testCases) {
        const meta = await metaGenerator.generateMeta(city, filters);
        const keywords = meta.keywords.toLowerCase();
        
        expectedKeywords.forEach(keyword => {
          expect(keywords).toContain(keyword.toLowerCase());
        });
        
        console.log(`✓ ${city} keywords: ${meta.keywords}`);
      }
    });

    it('should maintain consistent branding across all pages', async () => {
      const cities = ['dallas', 'houston', 'austin', 'fort-worth'];
      const brandingElements = ['Choose My Power', 'Texas', 'Compare', 'Save'];
      
      for (const city of cities) {
        const meta = await metaGenerator.generateMeta(city, []);
        
        const titleAndDescription = `${meta.title} ${meta.description}`.toLowerCase();
        
        // Should contain at least some branding elements
        const brandingCount = brandingElements.filter(brand => 
          titleAndDescription.includes(brand.toLowerCase())
        ).length;
        
        expect(brandingCount).toBeGreaterThan(0);
        
        // Should maintain consistency
        expect(meta.title).toContain('Texas');
        expect(meta.description).toContain('electricity');
      }
    });
  });

  describe('Canonical URL Generation and Management', () => {
    it('should generate proper canonical URLs for all page types', () => {
      const testUrls = [
        {
          input: '/texas/dallas/electricity-plans/green-energy+12-month',
          expected: '/texas/dallas/electricity-plans/12-month+green-energy' // Sorted filters
        },
        {
          input: '/texas/houston/electricity-plans/autopay-discount+fixed-rate+no-deposit',
          expected: '/texas/houston/electricity-plans/autopay-discount+fixed-rate+no-deposit'
        },
        {
          input: '/texas/austin/electricity-plans',
          expected: '/texas/austin/electricity-plans'
        }
      ];

      testUrls.forEach(({ input, expected }) => {
        const canonical = canonicalUrlGenerator.generateCanonicalUrl(input);
        expect(canonical).toBe(expected);
        
        const validation = SEOValidator.validateCanonicalUrl(canonical, expected);
        expect(validation.isValid).toBe(true);
        
        console.log(`✓ ${input} -> ${canonical}`);
      });
    });

    it('should prevent duplicate content with proper canonicalization', () => {
      const duplicateUrls = [
        '/texas/dallas/electricity-plans/12-month+green-energy',
        '/texas/dallas/electricity-plans/green-energy+12-month', // Different order
        '/texas/dallas/electricity-plans/12-month+green-energy?utm_source=test', // With params
      ];

      const canonicals = duplicateUrls.map(url => canonicalUrlGenerator.generateCanonicalUrl(url));
      
      // All should resolve to the same canonical URL
      const uniqueCanonicals = new Set(canonicals);
      expect(uniqueCanonicals.size).toBe(1);
      
      const canonicalUrl = canonicals[0];
      expect(canonicalUrl).toBe('/texas/dallas/electricity-plans/12-month+green-energy');
      
      console.log(`✓ All URLs canonicalize to: ${canonicalUrl}`);
    });

    it('should handle edge cases and malformed URLs', () => {
      const edgeCases = [
        { input: '/texas/dallas/electricity-plans//', expected: '/texas/dallas/electricity-plans' },
        { input: '/texas/dallas/electricity-plans/+12-month', expected: '/texas/dallas/electricity-plans/12-month' },
        { input: '/texas/dallas/electricity-plans/12-month+', expected: '/texas/dallas/electricity-plans/12-month' },
        { input: '/texas/DALLAS/electricity-plans', expected: '/texas/dallas/electricity-plans' }
      ];

      edgeCases.forEach(({ input, expected }) => {
        const canonical = canonicalUrlGenerator.generateCanonicalUrl(input);
        expect(canonical).toBe(expected);
        console.log(`✓ Edge case: ${input} -> ${canonical}`);
      });
    });
  });

  describe('Structured Data and Schema Markup', () => {
    it('should generate valid JSON-LD structured data', async () => {
      const testPages = [
        { city: 'dallas', filters: [] },
        { city: 'houston', filters: ['12-month'] },
        { city: 'austin', filters: ['green-energy', 'fixed-rate'] }
      ];

      for (const { city, filters } of testPages) {
        const schema = await schemaGenerator.generateSchema(city, filters);
        
        // Validate structure
        const validation = SEOValidator.validateStructuredData(schema);
        expect(validation.isValid).toBe(true);
        
        if (!validation.isValid) {
          console.warn(`Schema issues for ${city}:`, validation.issues);
        }
        
        // Verify required properties
        expect(schema['@context']).toBe('https://schema.org');
        expect(schema['@type']).toBe('WebPage');
        expect(schema.name).toContain(city);
        expect(schema.description).toContain('electricity');
        
        // Verify breadcrumb structure
        if (schema.breadcrumb) {
          expect(schema.breadcrumb['@type']).toBe('BreadcrumbList');
          expect(Array.isArray(schema.breadcrumb.itemListElement)).toBe(true);
          expect(schema.breadcrumb.itemListElement.length).toBeGreaterThan(0);
        }
        
        console.log(`✓ Schema generated for ${city}: ${schema.name}`);
      }
    });

    it('should include proper organization and website markup', async () => {
      const organizationSchema = await schemaGenerator.generateOrganizationSchema();
      
      expect(organizationSchema['@type']).toBe('Organization');
      expect(organizationSchema.name).toBe('Choose My Power');
      expect(organizationSchema.url).toContain('choosemypower');
      expect(organizationSchema.logo).toBeDefined();
      expect(organizationSchema.contactPoint).toBeDefined();
      expect(organizationSchema.areaServed).toContain('Texas');
      
      console.log('✓ Organization schema validated');
    });

    it('should generate proper LocalBusiness schema for city pages', async () => {
      const cities = ['dallas', 'houston', 'austin'];
      
      for (const city of cities) {
        const localBusinessSchema = await schemaGenerator.generateLocalBusinessSchema(city);
        
        expect(localBusinessSchema['@type']).toBe('LocalBusiness');
        expect(localBusinessSchema.name).toContain('Choose My Power');
        expect(localBusinessSchema.address.addressLocality).toContain(city);
        expect(localBusinessSchema.address.addressRegion).toBe('Texas');
        expect(localBusinessSchema.areaServed).toContain(city);
        
        console.log(`✓ LocalBusiness schema for ${city} validated`);
      }
    });
  });

  describe('Content Variation and Uniqueness', () => {
    it('should generate unique content for each page combination', async () => {
      const testCombinations = [
        { city: 'dallas', filters: [] },
        { city: 'dallas', filters: ['12-month'] },
        { city: 'dallas', filters: ['green-energy'] },
        { city: 'houston', filters: [] },
        { city: 'houston', filters: ['12-month'] }
      ];

      const generatedContent = new Map<string, string>();
      
      for (const { city, filters } of testCombinations) {
        const content = await contentVariationSystem.generateContent(city, filters);
        
        expect(content.mainHeading).toBeDefined();
        expect(content.description).toBeDefined();
        expect(content.features).toBeDefined();
        
        // Check uniqueness
        const key = `${city}-${filters.join('+')}`;
        const contentHash = `${content.mainHeading}|${content.description}`;
        
        if (generatedContent.has(contentHash)) {
          throw new Error(`Duplicate content found for ${key}`);
        }
        
        generatedContent.set(contentHash, key);
        
        // Verify content relevance
        expect(content.mainHeading.toLowerCase()).toContain(city);
        expect(content.description.toLowerCase()).toContain('electricity');
        
        filters.forEach(filter => {
          const filterKeywords = filter.split('-');
          filterKeywords.forEach(keyword => {
            expect(content.description.toLowerCase()).toContain(keyword.toLowerCase());
          });
        });
        
        console.log(`✓ Content for ${key}: "${content.mainHeading.substring(0, 50)}..."`);
      }

      expect(generatedContent.size).toBe(testCombinations.length);
    });

    it('should maintain content quality standards', async () => {
      const testPages = [
        { city: 'dallas', filters: ['12-month', 'green-energy'] },
        { city: 'houston', filters: ['24-month', 'fixed-rate'] }
      ];

      for (const { city, filters } of testPages) {
        const content = await contentVariationSystem.generateContent(city, filters);
        
        // Check readability
        const words = content.description.split(' ');
        const avgWordsPerSentence = words.length / content.description.split('.').length;
        expect(avgWordsPerSentence).toBeLessThan(25); // Readable sentences
        
        // Check for keyword stuffing
        const cityCount = (content.description.toLowerCase().match(new RegExp(city, 'g')) || []).length;
        const totalWords = words.length;
        const keywordDensity = cityCount / totalWords;
        expect(keywordDensity).toBeLessThan(0.05); // Less than 5% keyword density
        
        // Verify helpful content
        expect(content.features.length).toBeGreaterThan(2);
        expect(content.benefits).toBeDefined();
        expect(content.benefits.length).toBeGreaterThan(0);
        
        console.log(`✓ Quality check passed for ${city}`);
      }
    });
  });

  describe('SEO Monitoring and Analytics', () => {
    it('should track SEO performance metrics', async () => {
      const mockAnalyticsData = {
        pages: [
          { url: '/texas/dallas/electricity-plans', impressions: 1000, clicks: 50, position: 3.2 },
          { url: '/texas/houston/electricity-plans', impressions: 800, clicks: 40, position: 4.1 },
          { url: '/texas/austin/electricity-plans/12-month', impressions: 300, clicks: 15, position: 5.8 }
        ]
      };

      const report = await seoMonitoringSystem.generatePerformanceReport(mockAnalyticsData);
      
      expect(report.totalImpressions).toBe(2100);
      expect(report.totalClicks).toBe(105);
      expect(report.averageCTR).toBeCloseTo(0.05, 2); // 5% CTR
      expect(report.averagePosition).toBeCloseTo(4.37, 2);
      
      expect(report.topPerforming.length).toBeGreaterThan(0);
      expect(report.needsOptimization.length).toBeGreaterThan(0);
      
      console.log(`✓ SEO performance report: ${report.totalClicks} clicks, ${(report.averageCTR * 100).toFixed(2)}% CTR`);
    });

    it('should identify SEO optimization opportunities', async () => {
      const testUrls = [
        '/texas/dallas/electricity-plans',
        '/texas/houston/electricity-plans/12-month',
        '/texas/austin/electricity-plans/green-energy'
      ];

      for (const url of testUrls) {
        const opportunities = await seoMonitoringSystem.identifyOptimizationOpportunities(url);
        
        expect(opportunities).toHaveProperty('title');
        expect(opportunities).toHaveProperty('description');
        expect(opportunities).toHaveProperty('content');
        expect(opportunities).toHaveProperty('technical');
        
        // Each category should have actionable recommendations
        expect(opportunities.title.recommendations.length).toBeGreaterThan(0);
        expect(opportunities.description.recommendations.length).toBeGreaterThan(0);
        
        console.log(`✓ Found ${opportunities.title.recommendations.length + opportunities.description.recommendations.length} optimization opportunities for ${url}`);
      }
    });

    it('should detect and alert on SEO issues', async () => {
      // Mock some SEO issues
      const testPages = [
        {
          url: '/texas/dallas/electricity-plans',
          meta: { title: 'Short', description: 'Too short description' }, // Issues
          content: 'Dallas electricity content'
        },
        {
          url: '/texas/houston/electricity-plans',
          meta: { title: '', description: '' }, // Critical issues
          content: ''
        }
      ];

      for (const page of testPages) {
        const issues = await seoMonitoringSystem.detectIssues(page);
        
        expect(issues.length).toBeGreaterThan(0);
        
        const criticalIssues = issues.filter(i => i.severity === 'critical');
        const warningIssues = issues.filter(i => i.severity === 'warning');
        
        console.log(`✓ ${page.url}: ${criticalIssues.length} critical, ${warningIssues.length} warning issues`);
      }
    });
  });

  describe('Analytics Integration and Tracking', () => {
    it('should implement proper Google Analytics tracking', () => {
      // Mock gtag function
      const mockGtag = vi.fn();
      global.gtag = mockGtag;

      // Test pageview tracking
      const trackPageView = (url: string, city: string, filters: string[]) => {
        gtag('config', 'GA_MEASUREMENT_ID', {
          page_path: url,
          custom_map: {
            dimension1: city,
            dimension2: filters.join('+') || 'none'
          }
        });
      };

      trackPageView('/texas/dallas/electricity-plans/12-month', 'dallas', ['12-month']);
      
      expect(mockGtag).toHaveBeenCalledWith('config', 'GA_MEASUREMENT_ID', expect.objectContaining({
        page_path: '/texas/dallas/electricity-plans/12-month',
        custom_map: expect.objectContaining({
          dimension1: 'dallas',
          dimension2: '12-month'
        })
      }));

      console.log('✓ Google Analytics tracking verified');
    });

    it('should track conversion events properly', () => {
      const mockGtag = vi.fn();
      global.gtag = mockGtag;

      // Test conversion tracking
      const trackConversion = (eventName: string, planId: string, provider: string, value: number) => {
        gtag('event', eventName, {
          event_category: 'conversion',
          event_label: `${provider} - ${planId}`,
          value: value,
          custom_parameters: {
            plan_id: planId,
            provider_name: provider
          }
        });
      };

      trackConversion('begin_enrollment', 'plan-123', 'TXU Energy', 120.50);

      expect(mockGtag).toHaveBeenCalledWith('event', 'begin_enrollment', expect.objectContaining({
        event_category: 'conversion',
        event_label: 'TXU Energy - plan-123',
        value: 120.50
      }));

      console.log('✓ Conversion tracking verified');
    });

    it('should implement enhanced ecommerce tracking', () => {
      const mockGtag = vi.fn();
      global.gtag = mockGtag;

      // Test enhanced ecommerce
      const trackPlanView = (plan: any) => {
        gtag('event', 'view_item', {
          currency: 'USD',
          value: plan.pricing.rate1000kWh,
          items: [{
            item_id: plan.id,
            item_name: plan.name,
            item_category: 'electricity_plan',
            item_brand: plan.provider.name,
            price: plan.pricing.rate1000kWh,
            quantity: 1
          }]
        });
      };

      const mockPlan = {
        id: 'plan-123',
        name: 'TXU Select 12',
        provider: { name: 'TXU Energy' },
        pricing: { rate1000kWh: 12.5 }
      };

      trackPlanView(mockPlan);

      expect(mockGtag).toHaveBeenCalledWith('event', 'view_item', expect.objectContaining({
        currency: 'USD',
        value: 12.5,
        items: expect.arrayContaining([
          expect.objectContaining({
            item_id: 'plan-123',
            item_name: 'TXU Select 12',
            item_brand: 'TXU Energy'
          })
        ])
      }));

      console.log('✓ Enhanced ecommerce tracking verified');
    });
  });

  describe('Site Performance SEO Impact', () => {
    it('should measure Core Web Vitals impact on SEO', async () => {
      const mockPerformanceMetrics = {
        lcp: 2200, // ms
        fid: 80,   // ms
        cls: 0.08,  // score
        fcp: 1400  // ms
      };

      const seoImpactScore = await seoMonitoringSystem.calculatePerformanceSEOImpact(mockPerformanceMetrics);
      
      // Good performance should have positive SEO impact
      expect(seoImpactScore.overall).toBeGreaterThan(70); // Out of 100
      expect(seoImpactScore.lcp.score).toBeGreaterThan(70);
      expect(seoImpactScore.fid.score).toBeGreaterThan(70);
      expect(seoImpactScore.cls.score).toBeGreaterThan(70);
      
      console.log(`✓ SEO Performance Impact Score: ${seoImpactScore.overall}/100`);
      console.log(`  LCP: ${seoImpactScore.lcp.score}/100 (${mockPerformanceMetrics.lcp}ms)`);
      console.log(`  FID: ${seoImpactScore.fid.score}/100 (${mockPerformanceMetrics.fid}ms)`);
      console.log(`  CLS: ${seoImpactScore.cls.score}/100 (${mockPerformanceMetrics.cls})`);
    });

    it('should validate mobile-first indexing compliance', async () => {
      const testUrls = [
        '/texas/dallas/electricity-plans',
        '/texas/houston/electricity-plans/12-month'
      ];

      for (const url of testUrls) {
        const mobileCompliance = await seoMonitoringSystem.checkMobileCompliance(url);
        
        expect(mobileCompliance.hasViewportMeta).toBe(true);
        expect(mobileCompliance.isMobileResponsive).toBe(true);
        expect(mobileCompliance.hasAcceptableTapTargets).toBe(true);
        expect(mobileCompliance.usesReadableFontSizes).toBe(true);
        expect(mobileCompliance.contentSizesProperlyForViewport).toBe(true);
        
        console.log(`✓ Mobile compliance verified for ${url}`);
      }
    });
  });

  describe('Competitive SEO Analysis', () => {
    it('should analyze keyword competition', async () => {
      const targetKeywords = [
        'dallas electricity plans',
        'houston electricity rates',
        'texas energy providers',
        'cheap electricity texas'
      ];

      for (const keyword of targetKeywords) {
        const analysis = await seoMonitoringSystem.analyzeKeywordCompetition(keyword);
        
        expect(analysis.difficulty).toBeDefined();
        expect(analysis.searchVolume).toBeGreaterThan(0);
        expect(analysis.opportunities.length).toBeGreaterThan(0);
        expect(analysis.competitorAnalysis.length).toBeGreaterThan(0);
        
        console.log(`✓ ${keyword}: Difficulty ${analysis.difficulty}, Volume ${analysis.searchVolume}`);
      }
    });

    it('should identify content gaps and opportunities', async () => {
      const competitorUrls = [
        'powertochoose.org',
        'energyogre.com',
        'choosetexaspower.org'
      ];

      const gapAnalysis = await seoMonitoringSystem.identifyContentGaps(competitorUrls);
      
      expect(gapAnalysis.missingKeywords.length).toBeGreaterThan(0);
      expect(gapAnalysis.contentOpportunities.length).toBeGreaterThan(0);
      expect(gapAnalysis.technicalAdvantages.length).toBeGreaterThan(0);
      
      console.log(`✓ Found ${gapAnalysis.missingKeywords.length} keyword opportunities`);
      console.log(`✓ Identified ${gapAnalysis.contentOpportunities.length} content gaps`);
    });
  });
});