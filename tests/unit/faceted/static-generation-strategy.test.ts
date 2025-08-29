import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StaticGenerationStrategy } from '../../../src/lib/faceted/static-generation-strategy';
import * as tdspMapping from '../../../src/config/tdsp-mapping';
import * as multiFilterValidator from '../../../src/lib/faceted/multi-filter-validator';

// Mock the dependencies
vi.mock('../../../src/config/tdsp-mapping', () => ({
  tdspMapping: {
    'dallas-tx': { duns: '1039940674000', tier: 1, priority: 1.0 },
    'houston-tx': { duns: '957877905', tier: 1, priority: 1.0 },
    'austin-tx': { duns: '007924772', tier: 2, priority: 0.8 },
    'small-city-tx': { duns: '123456789', tier: 3, priority: 0.5 }
  }
}));

vi.mock('../../../src/lib/faceted/multi-filter-validator', () => ({
  multiFilterValidator: {
    generateFilterCombinations: vi.fn()
  }
}));

describe('StaticGenerationStrategy', () => {
  let strategy: StaticGenerationStrategy;

  beforeEach(() => {
    vi.clearAllMocks();
    
    strategy = new StaticGenerationStrategy({
      maxPagesPerBuild: 100,
      tier1MaxCombinations: 20,
      tier2MaxCombinations: 10,
      tier3MaxCombinations: 5,
      buildTimeoutMs: 60000
    });

    // Mock filter combinations
    vi.mocked(multiFilterValidator.multiFilterValidator.generateFilterCombinations)
      .mockImplementation((citySlug: string) => {
        const tier = citySlug.includes('small') ? 3 : citySlug.includes('austin') ? 2 : 1;
        const comboCount = tier === 1 ? 15 : tier === 2 ? 8 : 3;
        
        return Array.from({ length: comboCount }, (_, i) => ({
          isValid: true,
          url: `/electricity-plans/${citySlug}/filter-${i}/`,
          filters: [`filter-${i}`],
          warnings: [],
          errors: [],
          seoValue: i < 5 ? 'high' : i < 10 ? 'medium' : 'low',
          shouldGenerate: i < (tier === 1 ? 15 : tier === 2 ? 8 : 3)
        } as any));
      });
  });

  describe('generateStaticPaths', () => {
    it('should generate static paths within limits', async () => {
      const paths = await strategy.generateStaticPaths();
      
      expect(Array.isArray(paths)).toBe(true);
      expect(paths.length).toBeGreaterThan(0);
      expect(paths.length).toBeLessThanOrEqual(100); // Max pages per build
      
      // Should have proper structure
      const firstPath = paths[0];
      expect(firstPath).toHaveProperty('params');
      expect(firstPath.params).toHaveProperty('path');
    });

    it('should include city pages for all cities', async () => {
      const paths = await strategy.generateStaticPaths();
      
      // Should have city pages (without filters)
      const cityPages = paths.filter(path => 
        path.params.path && typeof path.params.path === 'string' && 
        (!path.params.path.includes('/') || path.params.path.split('/').length === 1)
      );
      
      expect(cityPages.length).toBeGreaterThan(0);
      
      // Check specific city pages exist
      const dallasCityPage = paths.find(path => path.params.path === 'dallas-tx');
      expect(dallasCityPage).toBeDefined();
    });

    it('should include filter combinations based on city tier', async () => {
      const paths = await strategy.generateStaticPaths();
      
      // Dallas (tier 1) should have more filter combinations than small-city (tier 3)
      const dallasPages = paths.filter(path => 
        path.params.path && typeof path.params.path === 'string' && 
        path.params.path.startsWith('dallas-tx')
      );
      const smallCityPages = paths.filter(path => 
        path.params.path && typeof path.params.path === 'string' && 
        path.params.path.startsWith('small-city-tx')
      );
      
      expect(dallasPages.length).toBeGreaterThan(smallCityPages.length);
    });

    it('should handle generation errors gracefully', async () => {
      // Mock an error in filter combination generation
      vi.mocked(multiFilterValidator.multiFilterValidator.generateFilterCombinations)
        .mockImplementation(() => {
          throw new Error('Generation failed');
        });

      const paths = await strategy.generateStaticPaths();
      
      // Should still return some paths (fallback)
      expect(Array.isArray(paths)).toBe(true);
      expect(paths.length).toBeGreaterThan(0);
    });

    it('should respect build timeout', async () => {
      // Create strategy with very short timeout
      const fastStrategy = new StaticGenerationStrategy({
        maxPagesPerBuild: 1000,
        buildTimeoutMs: 1, // 1ms - will timeout immediately
        tier1MaxCombinations: 100,
        tier2MaxCombinations: 100,
        tier3MaxCombinations: 100
      });

      const startTime = Date.now();
      const paths = await fastStrategy.generateStaticPaths();
      const duration = Date.now() - startTime;
      
      // Should complete quickly due to timeout
      expect(duration).toBeLessThan(5000); // Give some leeway for test execution
      expect(Array.isArray(paths)).toBe(true);
    }, 10000);
  });

  describe('optimization configurations', () => {
    it('should optimize for production', () => {
      const prodConfig = strategy.optimizeForProduction();
      
      expect(prodConfig.maxPagesPerBuild).toBe(2000);
      expect(prodConfig.tier1MaxCombinations).toBe(100);
      expect(prodConfig.enableISR).toBe(true);
      expect(prodConfig.revalidateSeconds).toBe(3600);
    });

    it('should optimize for development', () => {
      const devConfig = strategy.optimizeForDevelopment();
      
      expect(devConfig.maxPagesPerBuild).toBe(50);
      expect(devConfig.tier1MaxCombinations).toBe(10);
      expect(devConfig.enableISR).toBe(false);
      expect(devConfig.buildTimeoutMs).toBe(30000);
    });
  });

  describe('ISR configuration', () => {
    it('should return ISR config when enabled', () => {
      const strategyWithISR = new StaticGenerationStrategy({
        enableISR: true,
        revalidateSeconds: 1800,
        fallbackMode: 'blocking' as const
      });
      
      const isrConfig = strategyWithISR.getISRConfig();
      
      expect(isrConfig.revalidate).toBe(1800);
      expect(isrConfig.fallback).toBe('blocking');
    });

    it('should return empty config when ISR disabled', () => {
      const strategyWithoutISR = new StaticGenerationStrategy({
        enableISR: false
      });
      
      const isrConfig = strategyWithoutISR.getISRConfig();
      
      expect(isrConfig).toEqual({});
    });
  });

  describe('pre-build URLs', () => {
    it('should generate pre-build URLs', async () => {
      const urls = await strategy.getPreBuildUrls();
      
      expect(Array.isArray(urls)).toBe(true);
      expect(urls.length).toBeGreaterThan(0);
      
      // All URLs should be properly formatted
      urls.forEach(url => {
        expect(url).toMatch(/^\/electricity-plans\/[^\/]+\//);
      });
    });

    it('should include both city and filter URLs', async () => {
      const urls = await strategy.getPreBuildUrls();
      
      // Should have city URLs (just city slug)
      const cityUrls = urls.filter(url => {
        const segments = url.split('/').filter(Boolean);
        return segments.length === 3; // electricity-plans, city, empty
      });
      
      // Should have filter URLs (city + filters)
      const filterUrls = urls.filter(url => {
        const segments = url.split('/').filter(Boolean);
        return segments.length > 3;
      });
      
      expect(cityUrls.length).toBeGreaterThan(0);
      expect(filterUrls.length).toBeGreaterThan(0);
    });
  });

  describe('city tier handling', () => {
    it('should generate appropriate combinations for tier 1 cities', async () => {
      const paths = await strategy.generateStaticPaths();
      
      const dallasPaths = paths.filter(path => 
        path.params.path && typeof path.params.path === 'string' && 
        path.params.path.startsWith('dallas-tx')
      );
      
      // Tier 1 city should have more paths (city page + combinations)
      expect(dallasPaths.length).toBeGreaterThan(10);
    });

    it('should generate fewer combinations for tier 3 cities', async () => {
      const paths = await strategy.generateStaticPaths();
      
      const smallCityPaths = paths.filter(path => 
        path.params.path && typeof path.params.path === 'string' && 
        path.params.path.startsWith('small-city-tx')
      );
      
      // Tier 3 city should have fewer paths
      expect(smallCityPaths.length).toBeLessThan(10);
    });

    it('should prioritize high-value combinations', async () => {
      const paths = await strategy.generateStaticPaths();
      
      // All paths should be generated with appropriate priority props
      paths.forEach(path => {
        if (path.props) {
          expect(path.props.priority).toMatch(/^(high|medium|low)$/);
        }
      });
    });
  });

  describe('build performance', () => {
    it('should process cities in batches', async () => {
      const largeCityStrategy = new StaticGenerationStrategy({
        maxPagesPerBuild: 500,
        tier1MaxCombinations: 50,
        tier2MaxCombinations: 25,
        tier3MaxCombinations: 10
      });
      
      const startTime = Date.now();
      const paths = await largeCityStrategy.generateStaticPaths();
      const duration = Date.now() - startTime;
      
      expect(paths.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    }, 35000);

    it('should respect page limits', async () => {
      const limitedStrategy = new StaticGenerationStrategy({
        maxPagesPerBuild: 20,
        tier1MaxCombinations: 100, // More than limit allows
        tier2MaxCombinations: 100,
        tier3MaxCombinations: 100
      });
      
      const paths = await limitedStrategy.generateStaticPaths();
      
      expect(paths.length).toBeLessThanOrEqual(20);
    });
  });
});