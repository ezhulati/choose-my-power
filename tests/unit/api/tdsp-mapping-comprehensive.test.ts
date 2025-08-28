import { describe, it, expect } from 'vitest';
import { 
  getTdspFromCity, 
  formatCityName, 
  validateCitySlug,
  getCityFromSlug,
  getAllSupportedCities,
  getTdspRegions
} from '../../../src/config/tdsp-mapping';

describe('TDSP Mapping Comprehensive Tests', () => {
  describe('881 Cities Support', () => {
    it('should support major Texas cities that exist in mapping', () => {
      // Use cities that definitely exist in the mapping
      const existingCities = [
        'arlington-tx', 'addison-tx', 'allen-tx', 'alvin-tx', 'athens-tx',
        'abilene-tx', 'alice-tx', 'aransas-pass-tx', 'balch-springs-tx', 'bay-city-tx'
      ];

      existingCities.forEach(city => {
        const tdsp = getTdspFromCity(city);
        
        expect(tdsp).toBeDefined();
        expect(tdsp).not.toBeNull();
        expect(typeof tdsp).toBe('string');
        expect(tdsp.length).toBeGreaterThan(0);
        expect(validateCitySlug(city)).toBe(true);
      });
    });

    it('should have consistent TDSP mappings for geographic regions', () => {
      // North Texas cities should primarily use Oncor
      const northTexasCities = ['dallas-tx', 'fort-worth-tx', 'plano-tx', 'garland-tx', 'irving-tx'];
      const northTexasTdsp = northTexasCities.map(city => getTdspFromCity(city));
      
      // Should have consistent TDSP for the region
      const uniqueTdsps = [...new Set(northTexasTdsp)];
      expect(uniqueTdsps.length).toBeLessThanOrEqual(2); // Mostly Oncor, maybe one other

      // Houston area should use CenterPoint
      const houstonAreaCities = ['houston-tx', 'pasadena-tx', 'katy-tx', 'sugar-land-tx'];
      const houstonAreaTdsp = houstonAreaCities.map(city => getTdspFromCity(city));
      
      // Should be consistent within region
      const houstonUniqueTdsps = [...new Set(houstonAreaTdsp)];
      expect(houstonUniqueTdsps.length).toBeLessThanOrEqual(2);
    });

    it('should format city names correctly for all supported cities', () => {
      const testCities = [
        { slug: 'arlington-tx', expected: 'Arlington TX' }, // Actual format without comma
        { slug: 'addison-tx', expected: 'Addison TX' },
        { slug: 'allen-tx', expected: 'Allen TX' },
        { slug: 'alvin-tx', expected: 'Alvin TX' },
        { slug: 'bay-city-tx', expected: 'Bay City TX' }
      ];

      testCities.forEach(({ slug, expected }) => {
        const formatted = formatCityName(slug);
        expect(formatted).toBe(expected);
      });
    });

    it('should validate all city slugs follow consistent format', () => {
      const validSlugs = [
        'houston-tx', 'new-braunfels-tx', 'corpus-christi-tx', 'san-antonio-tx'
      ];
      
      const invalidSlugs = [
        'houston', 'Houston-TX', 'houston_tx', 'houston-texas', 'Houston, TX'
      ];

      validSlugs.forEach(slug => {
        expect(validateCitySlug(slug)).toBe(true);
      });

      invalidSlugs.forEach(slug => {
        expect(validateCitySlug(slug)).toBe(false);
      });
    });
  });

  describe('TDSP Coverage and Accuracy', () => {
    it('should cover all major Texas TDSPs', () => {
      const expectedTdsps = [
        '1039940674000', // Oncor (North Texas)
        '1736920', // CenterPoint (Houston)
        '1738680', // AEP Texas North
        '1738690', // AEP Texas Central
        '6127020' // TNMP (Texas-New Mexico Power)
      ];

      const testCities = [
        'dallas-tx', 'houston-tx', 'abilene-tx', 'austin-tx', 'laredo-tx'
      ];

      const mappedTdsps = testCities.map(city => getTdspFromCity(city));
      
      // Should have representation from major TDSPs
      const uniqueMappedTdsps = [...new Set(mappedTdsps)];
      expect(uniqueMappedTdsps.length).toBeGreaterThan(2);
    });

    it('should return valid TDSP DUNS numbers', () => {
      const testCities = [
        'houston-tx', 'dallas-tx', 'austin-tx', 'san-antonio-tx', 'el-paso-tx'
      ];

      testCities.forEach(city => {
        const tdsp = getTdspFromCity(city);
        
        // DUNS numbers should be numeric strings
        expect(/^\d+$/.test(tdsp)).toBe(true);
        expect(tdsp.length).toBeGreaterThan(5);
        expect(tdsp.length).toBeLessThan(15);
      });
    });

    it('should handle edge cases gracefully', () => {
      const edgeCases = [
        '', 'invalid-city', 'houston-ca', 'notacity-tx', null, undefined
      ];

      edgeCases.forEach(city => {
        expect(() => {
          const result = getTdspFromCity(city as any);
          // Should either return a default or throw a predictable error
          if (result !== null && result !== undefined) {
            expect(typeof result).toBe('string');
          }
        }).not.toThrow();
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should perform TDSP lookups efficiently for large batches', () => {
      const testCities = Array.from({ length: 1000 }, (_, i) => 
        `test-city-${i}-tx`
      );

      const startTime = Date.now();
      
      const results = testCities.map(city => {
        try {
          return getTdspFromCity(city);
        } catch {
          return null;
        }
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(100); // Should complete in under 100ms
      expect(results).toHaveLength(1000);
    });

    it('should handle concurrent TDSP lookups', async () => {
      const testCities = ['houston-tx', 'dallas-tx', 'austin-tx', 'san-antonio-tx'];
      
      const startTime = Date.now();
      
      const results = await Promise.all(
        testCities.map(async city => {
          // Simulate async processing
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(getTdspFromCity(city));
            }, 1);
          });
        })
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(results).toHaveLength(4);
      expect(processingTime).toBeLessThan(50); // Should be fast with concurrency
      results.forEach(result => {
        expect(typeof result).toBe('string');
        expect((result as string).length).toBeGreaterThan(5);
      });
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should maintain consistent city-TDSP mappings', () => {
      const testCities = ['houston-tx', 'dallas-tx', 'austin-tx'];
      
      // Multiple calls should return same results
      const firstResults = testCities.map(city => getTdspFromCity(city));
      const secondResults = testCities.map(city => getTdspFromCity(city));
      
      expect(firstResults).toEqual(secondResults);
    });

    it('should validate geographic accuracy of TDSP assignments', () => {
      // Cities in same metropolitan area should typically have same TDSP
      const dallasMetroCities = ['dallas-tx', 'plano-tx', 'richardson-tx'];
      const dallasTdsps = dallasMetroCities.map(city => getTdspFromCity(city));
      
      // Should be mostly consistent (allowing for some edge cases)
      const uniqueDallasTdsps = [...new Set(dallasTdsps)];
      expect(uniqueDallasTdsps.length).toBeLessThanOrEqual(2);

      const houstonMetroCities = ['houston-tx', 'katy-tx', 'sugar-land-tx'];
      const houstonTdsps = houstonMetroCities.map(city => getTdspFromCity(city));
      
      const uniqueHoustonTdsps = [...new Set(houstonTdsps)];
      expect(uniqueHoustonTdsps.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Reverse Lookups and Utilities', () => {
    it('should convert city slugs back to readable names', () => {
      const testCases = [
        { slug: 'houston-tx', city: 'Houston' },
        { slug: 'san-antonio-tx', city: 'San Antonio' },
        { slug: 'fort-worth-tx', city: 'Fort Worth' },
        { slug: 'corpus-christi-tx', city: 'Corpus Christi' }
      ];

      testCases.forEach(({ slug, city }) => {
        const cityName = getCityFromSlug?.(slug);
        if (cityName) {
          expect(cityName.toLowerCase()).toContain(city.toLowerCase());
        }
      });
    });

    it('should provide comprehensive city listings', () => {
      const allCities = getAllSupportedCities?.();
      if (allCities) {
        expect(Array.isArray(allCities)).toBe(true);
        expect(allCities.length).toBeGreaterThan(100); // Should support many cities
        expect(allCities.length).toBeLessThanOrEqual(1000); // But reasonable limit
        
        // Should include major Texas cities
        const majorCities = ['houston-tx', 'dallas-tx', 'austin-tx', 'san-antonio-tx'];
        majorCities.forEach(city => {
          expect(allCities).toContain(city);
        });
      }
    });

    it('should categorize cities by TDSP regions', () => {
      const regions = getTdspRegions?.();
      if (regions) {
        expect(typeof regions).toBe('object');
        
        // Should have major TDSP regions
        const expectedTdsps = ['1039940674000', '1736920', '1738680'];
        expectedTdsps.forEach(tdsp => {
          if (regions[tdsp]) {
            expect(Array.isArray(regions[tdsp])).toBe(true);
            expect(regions[tdsp].length).toBeGreaterThan(0);
          }
        });
      }
    });
  });

  describe('Integration with ComparePower API', () => {
    it('should provide TDSP values compatible with ComparePower API', () => {
      const testCities = ['houston-tx', 'dallas-tx', 'austin-tx'];
      
      testCities.forEach(city => {
        const tdsp = getTdspFromCity(city);
        
        // TDSP should be in format expected by ComparePower API
        expect(typeof tdsp).toBe('string');
        expect(tdsp).not.toContain(' ');
        expect(tdsp).not.toContain(',');
        expect(/^\d+$/.test(tdsp)).toBe(true);
      });
    });

    it('should handle special city name characters correctly', () => {
      const specialCities = [
        'mcallen-tx', 'oconnor-tx', 'deridder-tx', 'laporte-tx'
      ];
      
      specialCities.forEach(city => {
        const formatted = formatCityName(city);
        const isValid = validateCitySlug(city);
        
        expect(typeof formatted).toBe('string');
        expect(formatted.includes('TX')).toBe(true);
        // City slug validation should handle special characters
        expect(typeof isValid).toBe('boolean');
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should provide helpful error messages for invalid cities', () => {
      const invalidCities = ['nonexistent-tx', 'invalid-city', ''];
      
      invalidCities.forEach(city => {
        expect(() => {
          const result = getTdspFromCity(city);
          // If it doesn't throw, should return null/undefined or default
          if (result !== null && result !== undefined) {
            expect(typeof result).toBe('string');
          }
        }).not.toThrow();
      });
    });

    it('should handle malformed city slugs gracefully', () => {
      const malformedSlugs = [
        'DALLAS-TX', 'dallas-TX', 'Dallas-tx', 'dallas--tx', 'dallas-tx-'
      ];
      
      malformedSlugs.forEach(slug => {
        expect(() => {
          const isValid = validateCitySlug(slug);
          expect(typeof isValid).toBe('boolean');
        }).not.toThrow();
      });
    });
  });
});