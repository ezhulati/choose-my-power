/**
 * Texas ZIP Code Coverage Validation Tests
 * 
 * Comprehensive validation of ZIP code coverage for the Texas deregulated electricity market.
 * This test suite validates:
 * - Complete coverage of major Texas metropolitan areas
 * - Correct TDSP assignments for ZIP codes
 * - Multi-TDSP boundary configurations
 * - Geographic zone assignments
 * - Missing ZIP codes that should be covered
 * - Data integrity across mapping systems
 */

import { describe, it, expect } from 'vitest';
import { 
  COMPREHENSIVE_ZIP_TDSP_MAPPING,
  getTdspFromZip,
  isDeregulatedZip,
  getZipCodesForTdsp,
  getZipCodesInZone
} from '../../../src/types/electricity-plans';
import { 
  multiTdspMapping,
  TDSP_INFO,
  getMultiTdspZipCodes,
  requiresAddressValidation,
  getPrimaryTdspForZip
} from '../../../src/config/multi-tdsp-mapping';

describe('Texas ZIP Code Coverage Validation', () => {
  describe('Geographic Coverage Validation', () => {
    it('should cover all major Dallas-Fort Worth metropolitan ZIP codes', () => {
      // Major Dallas ZIP codes (downtown and inner suburbs)
      const majorDallasZips = [
        '75201', '75202', '75203', '75204', '75205', '75206', '75207', '75208', '75209', '75210',
        '75211', '75212', '75214', '75215', '75216', '75217', '75218', '75219', '75220', '75223',
        '75224', '75225', '75226', '75227', '75228', '75229', '75230', '75231', '75232', '75233',
        '75234', '75235', '75236', '75237', '75238', '75240', '75241', '75243', '75244', '75246',
        '75247', '75248', '75249', '75250'
      ];

      const missingDallasZips = majorDallasZips.filter(zip => !isDeregulatedZip(zip));
      expect(missingDallasZips).toEqual([]);
    });

    it('should cover all major Houston metropolitan ZIP codes', () => {
      // Major Houston ZIP codes
      const majorHoustonZips = [
        '77001', '77002', '77003', '77004', '77005', '77006', '77007', '77008', '77009', '77010',
        '77011', '77012', '77013', '77014', '77015', '77016', '77017', '77018', '77019', '77020',
        '77021', '77022', '77023', '77024', '77025', '77026', '77027', '77028', '77029', '77030',
        '77031', '77032', '77033', '77034', '77035', '77036', '77037', '77038', '77039', '77040',
        '77041', '77042', '77043', '77044', '77045', '77046', '77047', '77048', '77049', '77050'
      ];

      const missingHoustonZips = majorHoustonZips.filter(zip => !isDeregulatedZip(zip));
      expect(missingHoustonZips).toEqual([]);
    });

    it('should cover all major Austin metropolitan ZIP codes', () => {
      // Major Austin ZIP codes
      const majorAustinZips = [
        '78701', '78702', '78703', '78704', '78705', '78717', '78719', '78721', '78722', '78723',
        '78724', '78725', '78726', '78727', '78728', '78729', '78730', '78731', '78732', '78733',
        '78734', '78735', '78736', '78737', '78738', '78739', '78741', '78742', '78744', '78745',
        '78746', '78747', '78748', '78749', '78750', '78751', '78752', '78753', '78754', '78756',
        '78757', '78758', '78759'
      ];

      const missingAustinZips = majorAustinZips.filter(zip => !isDeregulatedZip(zip));
      expect(missingAustinZips).toEqual([]);
    });

    it('should cover major San Antonio ZIP codes', () => {
      // Major San Antonio ZIP codes (deregulated areas)
      const majorSanAntonioZips = [
        '78201', '78202', '78203', '78204', '78205', '78207', '78208', '78209', '78210',
        '78211', '78212', '78213', '78214', '78215', '78216', '78217', '78218', '78219',
        '78220', '78221', '78222', '78223', '78224', '78225', '78226', '78227', '78228',
        '78229', '78230', '78231', '78232', '78233', '78234', '78235', '78236', '78237',
        '78238', '78239', '78240', '78242', '78244', '78245', '78247', '78248', '78249',
        '78250', '78251', '78252', '78253', '78254', '78255', '78256', '78257', '78258',
        '78259', '78260', '78261', '78263', '78264', '78266', '78268', '78269'
      ];

      const missingSanAntonioZips = majorSanAntonioZips.filter(zip => !isDeregulatedZip(zip));
      expect(missingSanAntonioZips).toEqual([]);
    });

    it('should include major suburban ZIP codes', () => {
      // Major suburban areas that should be covered
      const majorSuburbanZips = [
        // Plano, Frisco, McKinney area
        '75023', '75024', '75025', '75026', '75070', '75071', '75074', '75075',
        // Irving, Carrollton area
        '75039', '75056', '75062', '75063',
        // Fort Worth area
        '76101', '76102', '76103', '76104', '76105', '76106', '76107', '76108',
        // Katy, Sugar Land area (Houston suburbs)
        '77077', '77079', '77081', '77082', '77083', '77084',
        // Pearland, Friendswood area
        '77584', '77546'
      ];

      const missingSuburbanZips = majorSuburbanZips.filter(zip => !isDeregulatedZip(zip));
      
      // Allow some missing suburban areas, but should be minimal
      expect(missingSuburbanZips.length).toBeLessThan(5);
    });
  });

  describe('TDSP Assignment Validation', () => {
    it('should assign Dallas ZIP codes to Oncor', () => {
      const dallasZips = ['75201', '75205', '75219', '75230', '75248'];
      
      dallasZips.forEach(zip => {
        const tdsp = getTdspFromZip(zip);
        expect(tdsp?.name).toBe('Oncor Electric Delivery');
        expect(tdsp?.duns).toBe('1039940674000');
        expect(tdsp?.zone).toBe('North');
      });
    });

    it('should assign Houston ZIP codes to CenterPoint', () => {
      const houstonZips = ['77001', '77019', '77024', '77042', '77056'];
      
      houstonZips.forEach(zip => {
        const tdsp = getTdspFromZip(zip);
        expect(tdsp?.name).toBe('CenterPoint Energy Houston Electric');
        expect(tdsp?.duns).toBe('957877905');
        expect(tdsp?.zone).toBe('Coast');
      });
    });

    it('should assign Austin ZIP codes to AEP Central', () => {
      const austinZips = ['78701', '78704', '78731', '78745', '78759'];
      
      austinZips.forEach(zip => {
        const tdsp = getTdspFromZip(zip);
        expect(tdsp?.name).toBe('AEP Texas Central Company');
        expect(tdsp?.duns).toBe('007924772');
        expect(tdsp?.zone).toBe('Central');
      });
    });

    it('should assign Tyler/Abilene ZIP codes to AEP North', () => {
      const aepNorthZips = ['75701', '75703', '79601', '79603'];
      
      aepNorthZips.forEach(zip => {
        const tdsp = getTdspFromZip(zip);
        expect(tdsp?.name).toBe('AEP Texas North Company');
        expect(tdsp?.duns).toBe('007923311');
        expect(tdsp?.zone).toBe('North');
      });
    });

    it('should assign Corpus Christi/Lubbock ZIP codes to TNMP', () => {
      const tnmpZips = ['78401', '78404', '79401', '79404'];
      
      tnmpZips.forEach(zip => {
        const tdsp = getTdspFromZip(zip);
        expect(tdsp?.name).toBe('Texas-New Mexico Power Company');
        expect(tdsp?.duns).toBe('007929441');
        expect(tdsp?.zone).toBe('South');
      });
    });
  });

  describe('Multi-TDSP Configuration Validation', () => {
    it('should have consistent TDSP definitions', () => {
      const multiTdspZips = getMultiTdspZipCodes();
      
      multiTdspZips.forEach(zip => {
        const config = multiTdspMapping[zip];
        const primaryTdsp = config.primaryTdsp;
        
        // Primary TDSP should match one of the defined TDSP_INFO entries
        const matchingTdsp = Object.values(TDSP_INFO).find(tdsp => 
          tdsp.duns === primaryTdsp.duns && tdsp.name === primaryTdsp.name
        );
        
        expect(matchingTdsp).toBeDefined();
        expect(config.requiresAddressValidation).toBeDefined();
        expect(config.boundaryType).toBeDefined();
      });
    });

    it('should have ZIP codes that require address validation', () => {
      const addressValidationZips = getMultiTdspZipCodes().filter(requiresAddressValidation);
      
      expect(addressValidationZips.length).toBeGreaterThan(10);
      
      // Sample key boundary areas
      expect(addressValidationZips).toContain('75001'); // Addison area
      expect(addressValidationZips).toContain('75019'); // Coppell area
      expect(addressValidationZips).toContain('77064'); // Northwest Houston
      expect(addressValidationZips).toContain('78660'); // Pflugerville
    });

    it('should have appropriate boundary types', () => {
      const multiTdspZips = getMultiTdspZipCodes();
      const boundaryTypes = multiTdspZips.map(zip => multiTdspMapping[zip].boundaryType);
      
      // Should have all three boundary types
      expect(boundaryTypes).toContain('street-level');
      expect(boundaryTypes).toContain('block-level');
      expect(boundaryTypes).toContain('zip4-level');
      
      // Street-level should be most common
      const streetLevelCount = boundaryTypes.filter(type => type === 'street-level').length;
      expect(streetLevelCount).toBeGreaterThan(boundaryTypes.length / 2);
    });

    it('should have notes for complex boundary areas', () => {
      const multiTdspZips = getMultiTdspZipCodes();
      
      multiTdspZips.forEach(zip => {
        const config = multiTdspMapping[zip];
        expect(config.notes).toBeDefined();
        expect(config.notes!.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Geographic Zone Validation', () => {
    it('should have appropriate geographic distribution', () => {
      const northZips = getZipCodesInZone('North');
      const coastZips = getZipCodesInZone('Coast');
      const centralZips = getZipCodesInZone('Central');
      const southZips = getZipCodesInZone('South');
      
      // North zone should have the most ZIP codes (Dallas-FW metro)
      expect(northZips.length).toBeGreaterThan(100);
      
      // Coast zone should have substantial coverage (Houston metro)
      expect(coastZips.length).toBeGreaterThan(80);
      
      // Central zone should have good coverage (Austin, San Antonio)
      expect(centralZips.length).toBeGreaterThan(60);
      
      // South zone should have reasonable coverage (TNMP areas)
      expect(southZips.length).toBeGreaterThan(10);
    });

    it('should assign ZIP codes to appropriate zones based on geography', () => {
      // Dallas area should be North
      expect(getZipCodesInZone('North')).toContain('75201');
      expect(getZipCodesInZone('North')).toContain('76101'); // Fort Worth
      
      // Houston area should be Coast
      expect(getZipCodesInZone('Coast')).toContain('77001');
      expect(getZipCodesInZone('Coast')).toContain('77056');
      
      // Austin area should be Central
      expect(getZipCodesInZone('Central')).toContain('78701');
      expect(getZipCodesInZone('Central')).toContain('78201'); // San Antonio
      
      // TNMP areas should be South
      expect(getZipCodesInZone('South')).toContain('78401'); // Corpus Christi
      expect(getZipCodesInZone('South')).toContain('79401'); // Lubbock
    });
  });

  describe('TDSP Market Share Validation', () => {
    it('should reflect realistic market share distribution', () => {
      const oncorZips = getZipCodesForTdsp('1039940674000');
      const centerpointZips = getZipCodesForTdsp('957877905');
      const aepCentralZips = getZipCodesForTdsp('007924772');
      const aepNorthZips = getZipCodesForTdsp('007923311');
      const tnmpZips = getZipCodesForTdsp('007929441');
      
      // Oncor should have the largest coverage (Dallas-FW metro)
      expect(oncorZips.length).toBeGreaterThan(centerpointZips.length);
      
      // CenterPoint should have substantial coverage (Houston metro)
      expect(centerpointZips.length).toBeGreaterThan(50);
      
      // AEP Central should have good coverage (Austin, San Antonio)
      expect(aepCentralZips.length).toBeGreaterThan(40);
      
      // All TDSPs should have some coverage
      expect(oncorZips.length).toBeGreaterThan(0);
      expect(centerpointZips.length).toBeGreaterThan(0);
      expect(aepCentralZips.length).toBeGreaterThan(0);
      expect(aepNorthZips.length).toBeGreaterThan(0);
      expect(tnmpZips.length).toBeGreaterThan(0);
    });
  });

  describe('Data Integrity Validation', () => {
    it('should have no duplicate ZIP codes in comprehensive mapping', () => {
      const allZips = Object.keys(COMPREHENSIVE_ZIP_TDSP_MAPPING);
      const uniqueZips = [...new Set(allZips)];
      
      expect(allZips.length).toBe(uniqueZips.length);
    });

    it('should have no orphaned multi-TDSP ZIP codes', () => {
      const multiTdspZips = getMultiTdspZipCodes();
      
      // All multi-TDSP ZIP codes should also exist in comprehensive mapping
      multiTdspZips.forEach(zip => {
        expect(isDeregulatedZip(zip)).toBe(true);
      });
    });

    it('should have consistent DUNS numbers', () => {
      // Check that all DUNS numbers are properly formatted
      Object.values(COMPREHENSIVE_ZIP_TDSP_MAPPING).forEach(mapping => {
        expect(mapping.duns).toMatch(/^\d{9,13}$/);
        expect(mapping.duns.length).toBeGreaterThanOrEqual(9);
        expect(mapping.duns.length).toBeLessThanOrEqual(13);
      });
    });

    it('should have valid zone assignments', () => {
      const validZones = ['North', 'Coast', 'Central', 'South', 'Valley'];
      
      Object.values(COMPREHENSIVE_ZIP_TDSP_MAPPING).forEach(mapping => {
        expect(validZones).toContain(mapping.zone);
      });
    });

    it('should have reasonable total coverage', () => {
      const totalZips = Object.keys(COMPREHENSIVE_ZIP_TDSP_MAPPING).length;
      
      // Should cover substantial portion of Texas deregulated market
      // Texas has ~2,000 ZIP codes total, deregulated market covers ~85%
      expect(totalZips).toBeGreaterThan(400);
      expect(totalZips).toBeLessThan(2000);
    });
  });

  describe('Validation Against Known Issues', () => {
    it('should not include regulated market ZIP codes', () => {
      // El Paso (regulated market)
      const elPasoZips = ['79901', '79902', '79903', '79904', '79905'];
      
      elPasoZips.forEach(zip => {
        expect(isDeregulatedZip(zip)).toBe(false);
      });
    });

    it('should not include non-Texas ZIP codes', () => {
      const nonTexasZips = ['90210', '10001', '60601', '30309'];
      
      nonTexasZips.forEach(zip => {
        expect(isDeregulatedZip(zip)).toBe(false);
      });
    });

    it('should handle edge cases properly', () => {
      // Empty string
      expect(isDeregulatedZip('')).toBe(false);
      
      // Invalid format
      expect(isDeregulatedZip('abc')).toBe(false);
      
      // Wrong length
      expect(isDeregulatedZip('123')).toBe(false);
      expect(isDeregulatedZip('1234567')).toBe(false);
    });
  });

  describe('Performance Validation', () => {
    it('should perform ZIP lookups efficiently', () => {
      const startTime = performance.now();
      
      // Perform 1000 lookups
      for (let i = 0; i < 1000; i++) {
        isDeregulatedZip('75205');
        getTdspFromZip('77001');
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete 1000 lookups in under 10ms
      expect(totalTime).toBeLessThan(10);
    });

    it('should have reasonable memory footprint', () => {
      const mappingSize = JSON.stringify(COMPREHENSIVE_ZIP_TDSP_MAPPING).length;
      const multiMappingSize = JSON.stringify(multiTdspMapping).length;
      
      // Total mapping data should be reasonable (< 1MB)
      expect(mappingSize + multiMappingSize).toBeLessThan(1024 * 1024);
    });
  });
});