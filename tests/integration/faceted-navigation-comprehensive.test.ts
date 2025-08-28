import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { facetedRouter } from '../../src/lib/faceted/faceted-router';
import { multiFilterValidator } from '../../src/lib/faceted/multi-filter-validator';
import { urlParser } from '../../src/lib/faceted/url-parser';
import { staticGenerationStrategy } from '../../src/lib/faceted/static-generation-strategy';
import { tdspMapping } from '../../src/config/tdsp-mapping';
import type { FilterConfig, UrlSegment } from '../../src/types/facets';

describe('Faceted Navigation Comprehensive Integration', () => {
  describe('URL Routing and Parsing', () => {
    it('should parse single filter URLs correctly', () => {
      const testCases = [
        {
          url: '/texas/dallas/electricity-plans/12-month',
          expected: {
            state: 'texas',
            city: 'dallas',
            pageType: 'electricity-plans',
            filters: ['12-month']
          }
        },
        {
          url: '/texas/houston/electricity-plans/green-energy',
          expected: {
            state: 'texas',
            city: 'houston',
            pageType: 'electricity-plans',
            filters: ['green-energy']
          }
        },
        {
          url: '/texas/austin/electricity-plans/fixed-rate',
          expected: {
            state: 'texas',
            city: 'austin',
            pageType: 'electricity-plans',
            filters: ['fixed-rate']
          }
        }
      ];

      testCases.forEach(({ url, expected }) => {
        const parsed = urlParser.parseUrl(url);
        expect(parsed.state).toBe(expected.state);
        expect(parsed.city).toBe(expected.city);
        expect(parsed.pageType).toBe(expected.pageType);
        expect(parsed.filters).toEqual(expected.filters);
      });
    });

    it('should parse multi-filter URLs correctly', () => {
      const testCases = [
        {
          url: '/texas/dallas/electricity-plans/12-month+green-energy',
          expected: {
            filters: ['12-month', 'green-energy'],
            filterCount: 2
          }
        },
        {
          url: '/texas/houston/electricity-plans/24-month+fixed-rate+autopay-discount',
          expected: {
            filters: ['24-month', 'fixed-rate', 'autopay-discount'],
            filterCount: 3
          }
        },
        {
          url: '/texas/austin/electricity-plans/green-energy+no-deposit+prepaid',
          expected: {
            filters: ['green-energy', 'no-deposit', 'prepaid'],
            filterCount: 3
          }
        }
      ];

      testCases.forEach(({ url, expected }) => {
        const parsed = urlParser.parseUrl(url);
        expect(parsed.filters).toEqual(expected.filters);
        expect(parsed.filters.length).toBe(expected.filterCount);
      });
    });

    it('should handle complex URL patterns with validation', () => {
      const complexUrls = [
        '/texas/fort-worth/electricity-plans/12-month+green-energy+fixed-rate+no-deposit',
        '/texas/plano/electricity-plans/24-month+50-green+autopay-discount',
        '/texas/garland/electricity-plans/variable-rate+time-of-use+weekend-free'
      ];

      complexUrls.forEach(url => {
        const parsed = urlParser.parseUrl(url);
        expect(parsed.state).toBe('texas');
        expect(parsed.pageType).toBe('electricity-plans');
        expect(parsed.filters.length).toBeGreaterThan(1);
        expect(parsed.isValid).toBe(true);
      });
    });

    it('should validate filter compatibility', () => {
      const incompatibleCombinations = [
        ['fixed-rate', 'variable-rate'], // Conflicting rate types
        ['prepaid', 'postpaid'], // Conflicting billing types
        ['12-month', '24-month'], // Conflicting contract terms
      ];

      incompatibleCombinations.forEach(filters => {
        const result = multiFilterValidator.validateFilterCombination(filters);
        expect(result.isValid).toBe(false);
        expect(result.conflicts.length).toBeGreaterThan(0);
      });
    });

    it('should validate compatible filter combinations', () => {
      const compatibleCombinations = [
        ['12-month', 'green-energy', 'autopay-discount'],
        ['fixed-rate', 'no-deposit', '100-green'],
        ['24-month', 'time-of-use', 'weekend-free'],
        ['variable-rate', 'prepaid', 'autopay-discount']
      ];

      compatibleCombinations.forEach(filters => {
        const result = multiFilterValidator.validateFilterCombination(filters);
        expect(result.isValid).toBe(true);
        expect(result.conflicts.length).toBe(0);
        expect(result.validatedFilters.length).toBe(filters.length);
      });
    });
  });

  describe('Dynamic Route Generation', () => {
    it('should generate canonical URLs for filter combinations', () => {
      const testCases = [
        {
          city: 'dallas-tx',
          filters: ['12-month', 'green-energy'],
          expected: '/texas/dallas/electricity-plans/12-month+green-energy'
        },
        {
          city: 'houston-tx',
          filters: ['fixed-rate', 'autopay-discount', 'no-deposit'],
          expected: '/texas/houston/electricity-plans/autopay-discount+fixed-rate+no-deposit'
        }
      ];

      testCases.forEach(({ city, filters, expected }) => {
        const cityName = city.replace('-tx', '');
        const canonicalUrl = facetedRouter.generateCanonicalUrl(cityName, filters);
        
        // URL should be canonical (filters sorted alphabetically)
        expect(canonicalUrl).toBe(expected);
      });
    });

    it('should generate breadcrumb data correctly', () => {
      const url = '/texas/dallas/electricity-plans/12-month+green-energy';
      const breadcrumbs = facetedRouter.generateBreadcrumbs(url);

      expect(breadcrumbs).toHaveLength(5); // Home, Texas, Dallas, Electricity Plans, Filters
      expect(breadcrumbs[0]).toEqual({
        label: 'Home',
        url: '/',
        isActive: false
      });
      expect(breadcrumbs[4]).toEqual({
        label: '12-Month Green Energy Plans',
        url: '/texas/dallas/electricity-plans/12-month+green-energy',
        isActive: true
      });
    });

    it('should generate SEO metadata for filtered pages', () => {
      const testPages = [
        {
          city: 'dallas',
          filters: ['12-month'],
          expectedTitle: /12.*Month.*Dallas.*Electricity.*Plans/i,
          expectedDescription: /dallas.*12.*month.*electricity.*plans/i
        },
        {
          city: 'houston',
          filters: ['green-energy', 'fixed-rate'],
          expectedTitle: /Green.*Energy.*Fixed.*Rate.*Houston/i,
          expectedDescription: /houston.*green.*energy.*fixed.*rate/i
        }
      ];

      testPages.forEach(({ city, filters, expectedTitle, expectedDescription }) => {
        const metadata = facetedRouter.generateSeoMetadata(city, filters);
        
        expect(metadata.title).toMatch(expectedTitle);
        expect(metadata.description).toMatch(expectedDescription);
        expect(metadata.canonical).toContain(`/texas/${city}/electricity-plans`);
        expect(metadata.keywords).toContain(city);
        filters.forEach(filter => {
          expect(metadata.keywords).toContain(filter.replace('-', ' '));
        });
      });
    });
  });

  describe('Static Site Generation Integration', () => {
    it('should generate high-priority static paths', async () => {
      const staticPaths = await staticGenerationStrategy.generateStaticPaths();
      
      // Should include tier 1 cities without filters
      const tier1Cities = ['dallas', 'houston', 'austin', 'fort-worth'];
      tier1Cities.forEach(city => {
        const basePath = `/texas/${city}/electricity-plans`;
        expect(staticPaths.some(path => path.params.slug === `${city}/electricity-plans`)).toBe(true);
      });

      // Should include popular filter combinations for tier 1 cities
      const popularFilters = ['12-month', 'green-energy', 'fixed-rate'];
      tier1Cities.forEach(city => {
        popularFilters.forEach(filter => {
          const filterPath = `${city}/electricity-plans/${filter}`;
          expect(staticPaths.some(path => path.params.slug === filterPath)).toBe(true);
        });
      });

      console.log(`✓ Generated ${staticPaths.length} static paths`);
    });

    it('should prioritize paths correctly', async () => {
      const generationPlan = await staticGenerationStrategy.createGenerationPlan();
      
      expect(generationPlan.highPriority.length).toBeGreaterThan(0);
      expect(generationPlan.mediumPriority.length).toBeGreaterThan(0);

      // High priority should include tier 1 cities and popular filters
      const highPriorityPaths = generationPlan.highPriority.map(p => p.url);
      expect(highPriorityPaths.some(url => url.includes('dallas'))).toBe(true);
      expect(highPriorityPaths.some(url => url.includes('houston'))).toBe(true);
      expect(highPriorityPaths.some(url => url.includes('12-month'))).toBe(true);

      console.log(`✓ Generation plan: ${generationPlan.highPriority.length} high priority, ${generationPlan.mediumPriority.length} medium priority`);
    });

    it('should implement ISR (Incremental Static Regeneration) correctly', async () => {
      const isrConfig = staticGenerationStrategy.getISRConfig();
      
      expect(isrConfig.revalidate).toBeGreaterThan(0);
      expect(isrConfig.fallback).toBeDefined();
      
      // Should have different revalidation times for different priority levels
      expect(isrConfig.tier1Revalidate).toBeLessThan(isrConfig.tier2Revalidate);
      
      console.log(`✓ ISR config: Tier 1 revalidate ${isrConfig.tier1Revalidate}s, Tier 2 revalidate ${isrConfig.tier2Revalidate}s`);
    });
  });

  describe('Filter Validation and Suggestion', () => {
    it('should provide filter suggestions for typos', () => {
      const typos = [
        { input: '12-moth', expected: '12-month' },
        { input: 'gren-energy', expected: 'green-energy' },
        { input: 'fix-rate', expected: 'fixed-rate' },
        { input: 'auto-pay', expected: 'autopay-discount' }
      ];

      typos.forEach(({ input, expected }) => {
        const suggestions = multiFilterValidator.getSuggestions(input);
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions[0]).toBe(expected);
      });
    });

    it('should validate TDSP coverage for filters', () => {
      const citiesWithFilters = [
        { city: 'dallas-tx', filters: ['12-month', 'green-energy'] },
        { city: 'houston-tx', filters: ['24-month', 'fixed-rate'] },
        { city: 'austin-tx', filters: ['variable-rate', 'prepaid'] }
      ];

      citiesWithFilters.forEach(({ city, filters }) => {
        const tdsp = tdspMapping[city]?.duns;
        expect(tdsp).toBeDefined();
        
        const validation = multiFilterValidator.validateForTdsp(filters, tdsp!);
        expect(validation.isValid).toBe(true);
        expect(validation.supportedFilters.length).toBeGreaterThan(0);
      });
    });

    it('should handle edge cases in filter parsing', () => {
      const edgeCases = [
        { input: '', expected: { isValid: false } },
        { input: '+++', expected: { isValid: false } },
        { input: 'invalid-filter', expected: { isValid: false, suggestions: true } },
        { input: '12-month+12-month', expected: { isValid: true, deduplicated: true } }
      ];

      edgeCases.forEach(({ input, expected }) => {
        const result = multiFilterValidator.parseAndValidate(input);
        expect(result.isValid).toBe(expected.isValid);
        
        if (expected.suggestions) {
          expect(result.suggestions.length).toBeGreaterThan(0);
        }
        
        if (expected.deduplicated) {
          expect(result.validatedFilters.length).toBe(1);
        }
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of filter combinations efficiently', () => {
      const startTime = Date.now();
      
      const filters = [
        '12-month', '24-month', '36-month',
        'green-energy', '50-green', '100-green',
        'fixed-rate', 'variable-rate',
        'autopay-discount', 'no-deposit', 'prepaid'
      ];
      
      const combinations = multiFilterValidator.generateValidCombinations(filters, 3);
      const processingTime = Date.now() - startTime;
      
      expect(combinations.length).toBeGreaterThan(0);
      expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
      
      // All combinations should be valid
      combinations.forEach(combination => {
        const validation = multiFilterValidator.validateFilterCombination(combination);
        expect(validation.isValid).toBe(true);
      });
      
      console.log(`✓ Generated ${combinations.length} valid combinations in ${processingTime}ms`);
    });

    it('should cache validation results effectively', () => {
      const testFilters = ['12-month', 'green-energy'];
      
      // First validation - should be computed
      const start1 = Date.now();
      const result1 = multiFilterValidator.validateFilterCombination(testFilters);
      const time1 = Date.now() - start1;
      
      // Second validation - should be cached
      const start2 = Date.now();
      const result2 = multiFilterValidator.validateFilterCombination(testFilters);
      const time2 = Date.now() - start2;
      
      expect(result1).toEqual(result2);
      expect(time2).toBeLessThanOrEqual(time1); // Cache should be same or faster
      
      console.log(`✓ Filter validation: Initial ${time1}ms, Cached ${time2}ms`);
    });

    it('should handle concurrent route generation', async () => {
      const cities = ['dallas', 'houston', 'austin', 'fort-worth', 'plano'];
      const filters = [['12-month'], ['green-energy'], ['fixed-rate'], ['24-month', 'autopay-discount']];
      
      const startTime = Date.now();
      
      const promises = cities.flatMap(city =>
        filters.map(filterSet =>
          facetedRouter.generateRouteData(city, filterSet)
        )
      );
      
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      expect(results).toHaveLength(cities.length * filters.length);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // All results should be valid
      results.forEach(result => {
        expect(result.url).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.breadcrumbs).toBeDefined();
      });
      
      console.log(`✓ Generated ${results.length} routes concurrently in ${totalTime}ms`);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle invalid city gracefully', () => {
      const invalidUrls = [
        '/texas/nonexistent-city/electricity-plans',
        '/texas/invalid/electricity-plans/12-month',
        '/texas//electricity-plans'
      ];
      
      invalidUrls.forEach(url => {
        const parsed = urlParser.parseUrl(url);
        expect(parsed.isValid).toBe(false);
        expect(parsed.errors.length).toBeGreaterThan(0);
      });
    });

    it('should provide fallback routes for invalid filters', () => {
      const invalidUrl = '/texas/dallas/electricity-plans/invalid-filter+another-invalid';
      const parsed = urlParser.parseUrl(invalidUrl);
      
      expect(parsed.isValid).toBe(false);
      expect(parsed.fallbackUrl).toBe('/texas/dallas/electricity-plans');
      expect(parsed.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle malformed URL segments', () => {
      const malformedUrls = [
        '/texas/dallas/electricity-plans/+12-month',
        '/texas/dallas/electricity-plans/12-month++green-energy',
        '/texas/dallas/electricity-plans/12-month++'
      ];
      
      malformedUrls.forEach(url => {
        const parsed = urlParser.parseUrl(url);
        // Should either fix the URL or mark as invalid
        expect(parsed.isValid !== undefined).toBe(true);
        
        if (parsed.isValid) {
          // If fixed, should have clean filters
          expect(parsed.filters.every(f => f.length > 0)).toBe(true);
        } else {
          // If invalid, should provide fallback
          expect(parsed.fallbackUrl).toBeDefined();
        }
      });
    });
  });

  describe('SEO and Content Optimization', () => {
    it('should generate unique content for each filter combination', () => {
      const combinations = [
        { city: 'dallas', filters: ['12-month'] },
        { city: 'dallas', filters: ['green-energy'] },
        { city: 'dallas', filters: ['12-month', 'green-energy'] },
        { city: 'houston', filters: ['12-month'] }
      ];
      
      const contents = combinations.map(({ city, filters }) => 
        facetedRouter.generatePageContent(city, filters)
      );
      
      // All content should be unique
      const contentTexts = contents.map(c => c.mainHeading);
      const uniqueTexts = new Set(contentTexts);
      expect(uniqueTexts.size).toBe(contentTexts.length);
      
      // Each should contain relevant keywords
      contents.forEach((content, index) => {
        const { city, filters } = combinations[index];
        expect(content.mainHeading.toLowerCase()).toContain(city);
        filters.forEach(filter => {
          const filterWords = filter.split('-');
          filterWords.forEach(word => {
            if (word !== 'energy' && word !== 'rate') { // Skip common words
              expect(content.description.toLowerCase()).toContain(word);
            }
          });
        });
      });
    });

    it('should generate structured data correctly', () => {
      const city = 'austin';
      const filters = ['24-month', 'green-energy'];
      
      const structuredData = facetedRouter.generateStructuredData(city, filters);
      
      expect(structuredData['@context']).toBe('https://schema.org');
      expect(structuredData['@type']).toBe('WebPage');
      expect(structuredData.name).toContain(city);
      expect(structuredData.description).toContain('electricity');
      
      // Should have breadcrumb structured data
      expect(structuredData.breadcrumb).toBeDefined();
      expect(structuredData.breadcrumb['@type']).toBe('BreadcrumbList');
      expect(structuredData.breadcrumb.itemListElement.length).toBeGreaterThan(0);
    });

    it('should implement proper canonical URL logic', () => {
      const testCases = [
        {
          url: '/texas/dallas/electricity-plans/green-energy+12-month',
          expectedCanonical: '/texas/dallas/electricity-plans/12-month+green-energy'
        },
        {
          url: '/texas/houston/electricity-plans/autopay-discount+fixed-rate+no-deposit',
          expectedCanonical: '/texas/houston/electricity-plans/autopay-discount+fixed-rate+no-deposit'
        }
      ];
      
      testCases.forEach(({ url, expectedCanonical }) => {
        const canonical = facetedRouter.getCanonicalUrl(url);
        expect(canonical).toBe(expectedCanonical);
      });
    });
  });
});