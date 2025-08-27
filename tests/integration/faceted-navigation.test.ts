import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComparePowerClientClass } from '../../src/lib/api/comparepower-client';
import { addFilterToUrl, removeFilterFromUrl, parseUrlFilters } from '../../src/lib/faceted/url-parser';
import type { Plan, ApiParams } from '../../src/types/facets';

// Mock data for testing
const mockPlans: Plan[] = [
  {
    id: 'plan-fixed-12-regular',
    name: 'TXU Energy Select 12',
    provider: {
      name: 'TXU Energy',
      logo: '',
      rating: 4.2,
      reviewCount: 1250,
    },
    pricing: {
      rate500kWh: 0.131,
      rate1000kWh: 0.120,
      rate2000kWh: 0.115,
      ratePerKwh: 0.120,
    },
    contract: {
      length: 12,
      type: 'fixed',
      earlyTerminationFee: 150,
      autoRenewal: false,
      satisfactionGuarantee: false,
    },
    features: {
      greenEnergy: 0,
      billCredit: 0,
      deposit: {
        required: false,
        amount: 0,
      },
    },
    availability: {
      enrollmentType: 'both',
      serviceAreas: ['Oncor Electric Delivery'],
    },
  },
  {
    id: 'plan-fixed-12-green',
    name: 'Green Mountain Pollution Free',
    provider: {
      name: 'Green Mountain Energy',
      logo: '',
      rating: 4.5,
      reviewCount: 890,
    },
    pricing: {
      rate500kWh: 0.1445,
      rate1000kWh: 0.1355,
      rate2000kWh: 0.1325,
      ratePerKwh: 0.1355,
    },
    contract: {
      length: 12,
      type: 'fixed',
      earlyTerminationFee: 0,
      autoRenewal: false,
      satisfactionGuarantee: true,
    },
    features: {
      greenEnergy: 100,
      billCredit: 0,
      deposit: {
        required: false,
        amount: 0,
      },
    },
    availability: {
      enrollmentType: 'both',
      serviceAreas: ['Oncor Electric Delivery'],
    },
  },
  {
    id: 'plan-variable-24',
    name: 'Reliant Variable Choice 24',
    provider: {
      name: 'Reliant Energy',
      logo: '',
      rating: 3.8,
      reviewCount: 2100,
    },
    pricing: {
      rate500kWh: 0.125,
      rate1000kWh: 0.118,
      rate2000kWh: 0.112,
      ratePerKwh: 0.118,
    },
    contract: {
      length: 24,
      type: 'variable',
      earlyTerminationFee: 200,
      autoRenewal: true,
      satisfactionGuarantee: false,
    },
    features: {
      greenEnergy: 0,
      billCredit: 50,
      deposit: {
        required: false,
        amount: 0,
      },
    },
    availability: {
      enrollmentType: 'both',
      serviceAreas: ['Oncor Electric Delivery'],
    },
  },
  {
    id: 'plan-prepaid-green',
    name: 'Payless Power Prepaid Green',
    provider: {
      name: 'Payless Power',
      logo: '',
      rating: 3.2,
      reviewCount: 540,
    },
    pricing: {
      rate500kWh: 0.142,
      rate1000kWh: 0.135,
      rate2000kWh: 0.128,
      ratePerKwh: 0.135,
    },
    contract: {
      length: 1,
      type: 'fixed',
      earlyTerminationFee: 0,
      autoRenewal: false,
      satisfactionGuarantee: false,
    },
    features: {
      greenEnergy: 100,
      billCredit: 0,
      deposit: {
        required: true,
        amount: 50,
      },
    },
    availability: {
      enrollmentType: 'both',
      serviceAreas: ['Oncor Electric Delivery'],
    },
  },
];

describe('Faceted Navigation Integration', () => {
  let client: ComparePowerClientClass;
  let fetchMock: any;

  beforeEach(() => {
    client = new ComparePowerClientClass({
      baseUrl: 'https://test-api.comparepower.com',
      timeout: 5000,
      retryAttempts: 1
    });
    
    fetchMock = vi.fn(global.fetch);
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.clearAllMocks();
    client.clearCache();
  });

  describe('Filter-to-API Parameter Mapping', () => {
    it('should map contract length filters to API parameters', async () => {
      const testCases = [
        { filter: '12-month', expectedTerm: 12 },
        { filter: '24-month', expectedTerm: 24 },
        { filter: '36-month', expectedTerm: 36 }
      ];

      for (const testCase of testCases) {
        const mockResponse = mockPlans.filter(plan => plan.contract.length === testCase.expectedTerm);
        
        fetchMock.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse.map(plan => ({
            _id: plan.id,
            product: {
              _id: plan.id + '-product',
              brand: { _id: 'brand-1', name: plan.provider.name, puct_number: '10000', legal_name: plan.provider.name, contact_info: { sales: { phone_number: '1-800-TEST' }, support: { address: 'Test', email: 'test@test.com', phone_number: '1-800-TEST' }}},
              name: plan.name,
              term: plan.contract.length,
              family: 'test',
              percent_green: plan.features.greenEnergy,
              headline: 'Test plan',
              early_termination_fee: plan.contract.earlyTerminationFee,
              description: 'Test description',
              is_pre_pay: plan.features.deposit.required,
              is_time_of_use: false
            },
            tdsp: { _id: 'tdsp-1', name: 'Test TDSP', short_name: 'TEST', abbreviation: 'TST', duns_number: '1039940674000' },
            expected_prices: [
              { usage: 500, price: plan.pricing.rate500kWh * 500, actual: plan.pricing.rate500kWh * 500, valid: true },
              { usage: 1000, price: plan.pricing.rate1000kWh * 1000, actual: plan.pricing.rate1000kWh * 1000, valid: true },
              { usage: 2000, price: plan.pricing.rate2000kWh * 2000, actual: plan.pricing.rate2000kWh * 2000, valid: true }
            ],
            display_pricing_500: { usage: 500, avg: plan.pricing.rate500kWh, total: plan.pricing.rate500kWh * 500 },
            display_pricing_1000: { usage: 1000, avg: plan.pricing.rate1000kWh, total: plan.pricing.rate1000kWh * 1000 },
            display_pricing_2000: { usage: 2000, avg: plan.pricing.rate2000kWh, total: plan.pricing.rate2000kWh * 2000 },
            document_links: []
          }))
        });

        const params: ApiParams = {
          tdsp_duns: '1039940674000',
          term: testCase.expectedTerm
        };

        const results = await client.fetchPlans(params);
        expect(results.every(plan => plan.contract.length === testCase.expectedTerm)).toBe(true);
      }
    });

    it('should map green energy filters to API parameters', async () => {
      const greenPlans = mockPlans.filter(plan => plan.features.greenEnergy === 100);
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => greenPlans.map(plan => ({
          _id: plan.id,
          product: {
            _id: plan.id + '-product',
            brand: { _id: 'brand-1', name: plan.provider.name, puct_number: '10000', legal_name: plan.provider.name, contact_info: { sales: { phone_number: '1-800-TEST' }, support: { address: 'Test', email: 'test@test.com', phone_number: '1-800-TEST' }}},
            name: plan.name,
            term: plan.contract.length,
            family: 'test',
            percent_green: 100,
            headline: 'Green energy plan',
            early_termination_fee: plan.contract.earlyTerminationFee,
            description: 'Test description',
            is_pre_pay: plan.features.deposit.required,
            is_time_of_use: false
          },
          tdsp: { _id: 'tdsp-1', name: 'Test TDSP', short_name: 'TEST', abbreviation: 'TST', duns_number: '1039940674000' },
          expected_prices: [],
          display_pricing_500: { usage: 500, avg: plan.pricing.rate500kWh, total: plan.pricing.rate500kWh * 500 },
          display_pricing_1000: { usage: 1000, avg: plan.pricing.rate1000kWh, total: plan.pricing.rate1000kWh * 1000 },
          display_pricing_2000: { usage: 2000, avg: plan.pricing.rate2000kWh, total: plan.pricing.rate2000kWh * 2000 },
          document_links: []
        }))
      });

      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        percent_green: 100
      };

      const results = await client.fetchPlans(params);
      expect(results.every(plan => plan.features.greenEnergy === 100)).toBe(true);
    });

    it('should map prepaid filter to API parameters', async () => {
      const prepaidPlans = mockPlans.filter(plan => plan.features.deposit.required);
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => prepaidPlans.map(plan => ({
          _id: plan.id,
          product: {
            _id: plan.id + '-product',
            brand: { _id: 'brand-1', name: plan.provider.name, puct_number: '10000', legal_name: plan.provider.name, contact_info: { sales: { phone_number: '1-800-TEST' }, support: { address: 'Test', email: 'test@test.com', phone_number: '1-800-TEST' }}},
            name: plan.name,
            term: plan.contract.length,
            family: 'test',
            percent_green: plan.features.greenEnergy,
            headline: 'Prepaid plan',
            early_termination_fee: plan.contract.earlyTerminationFee,
            description: 'Test description',
            is_pre_pay: true,
            is_time_of_use: false
          },
          tdsp: { _id: 'tdsp-1', name: 'Test TDSP', short_name: 'TEST', abbreviation: 'TST', duns_number: '1039940674000' },
          expected_prices: [],
          display_pricing_500: { usage: 500, avg: plan.pricing.rate500kWh, total: plan.pricing.rate500kWh * 500 },
          display_pricing_1000: { usage: 1000, avg: plan.pricing.rate1000kWh, total: plan.pricing.rate1000kWh * 1000 },
          display_pricing_2000: { usage: 2000, avg: plan.pricing.rate2000kWh, total: plan.pricing.rate2000kWh * 2000 },
          document_links: []
        }))
      });

      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        is_pre_pay: true
      };

      const results = await client.fetchPlans(params);
      expect(results.every(plan => plan.features.deposit.required === true)).toBe(true);
    });
  });

  describe('URL to Filter Conversion', () => {
    it('should handle complete filter-to-API workflow for single filter', async () => {
      const url = '/texas/dallas/electricity-plans/12-month';
      const { city, filters } = parseUrlFilters(url);
      
      expect(city).toBe('dallas');
      expect(filters).toEqual(['12-month']);

      // Mock API response for 12-month plans
      const filteredPlans = mockPlans.filter(plan => plan.contract.length === 12);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => filteredPlans.map(plan => ({
          _id: plan.id,
          product: {
            _id: plan.id + '-product',
            brand: { _id: 'brand-1', name: plan.provider.name, puct_number: '10000', legal_name: plan.provider.name, contact_info: { sales: { phone_number: '1-800-TEST' }, support: { address: 'Test', email: 'test@test.com', phone_number: '1-800-TEST' }}},
            name: plan.name,
            term: 12,
            family: 'test',
            percent_green: plan.features.greenEnergy,
            headline: 'Test plan',
            early_termination_fee: plan.contract.earlyTerminationFee,
            description: 'Test description',
            is_pre_pay: plan.features.deposit.required,
            is_time_of_use: false
          },
          tdsp: { _id: 'tdsp-1', name: 'Test TDSP', short_name: 'TEST', abbreviation: 'TST', duns_number: '1039940674000' },
          expected_prices: [],
          display_pricing_500: { usage: 500, avg: plan.pricing.rate500kWh, total: plan.pricing.rate500kWh * 500 },
          display_pricing_1000: { usage: 1000, avg: plan.pricing.rate1000kWh, total: plan.pricing.rate1000kWh * 1000 },
          display_pricing_2000: { usage: 2000, avg: plan.pricing.rate2000kWh, total: plan.pricing.rate2000kWh * 2000 },
          document_links: []
        }))
      });

      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        term: 12
      };

      const results = await client.fetchPlans(params);
      expect(results).toHaveLength(2); // Should match filteredPlans length
      expect(results.every(plan => plan.contract.length === 12)).toBe(true);
    });

    it('should handle complete filter-to-API workflow for multiple filters', async () => {
      const url = '/texas/houston/electricity-plans/12-month+green-energy';
      const { city, filters } = parseUrlFilters(url);
      
      expect(city).toBe('houston');
      expect(filters).toEqual(['12-month', 'green-energy']);

      // Mock API response for 12-month green plans
      const filteredPlans = mockPlans.filter(plan => 
        plan.contract.length === 12 && plan.features.greenEnergy === 100
      );
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => filteredPlans.map(plan => ({
          _id: plan.id,
          product: {
            _id: plan.id + '-product',
            brand: { _id: 'brand-1', name: plan.provider.name, puct_number: '10000', legal_name: plan.provider.name, contact_info: { sales: { phone_number: '1-800-TEST' }, support: { address: 'Test', email: 'test@test.com', phone_number: '1-800-TEST' }}},
            name: plan.name,
            term: 12,
            family: 'test',
            percent_green: 100,
            headline: '12-month green plan',
            early_termination_fee: plan.contract.earlyTerminationFee,
            description: 'Test description',
            is_pre_pay: plan.features.deposit.required,
            is_time_of_use: false
          },
          tdsp: { _id: 'tdsp-1', name: 'Test TDSP', short_name: 'TEST', abbreviation: 'TST', duns_number: '1039940674000' },
          expected_prices: [],
          display_pricing_500: { usage: 500, avg: plan.pricing.rate500kWh, total: plan.pricing.rate500kWh * 500 },
          display_pricing_1000: { usage: 1000, avg: plan.pricing.rate1000kWh, total: plan.pricing.rate1000kWh * 1000 },
          display_pricing_2000: { usage: 2000, avg: plan.pricing.rate2000kWh, total: plan.pricing.rate2000kWh * 2000 },
          document_links: []
        }))
      });

      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        term: 12,
        percent_green: 100
      };

      const results = await client.fetchPlans(params);
      expect(results).toHaveLength(1); // Only one plan matches both criteria
      expect(results[0].contract.length).toBe(12);
      expect(results[0].features.greenEnergy).toBe(100);
    });
  });

  describe('Filter Navigation Flow', () => {
    it('should support adding filters progressively', () => {
      let currentUrl = '/texas/austin/electricity-plans';
      
      // Add first filter
      currentUrl = addFilterToUrl(currentUrl, '12-month');
      expect(currentUrl).toBe('/texas/austin/electricity-plans/12-month');
      
      // Add second filter
      currentUrl = addFilterToUrl(currentUrl, 'green-energy');
      expect(currentUrl).toBe('/texas/austin/electricity-plans/12-month+green-energy');
      
      // Add third filter
      currentUrl = addFilterToUrl(currentUrl, 'fixed-rate');
      expect(currentUrl).toBe('/texas/austin/electricity-plans/12-month+fixed-rate+green-energy');
    });

    it('should support removing filters while maintaining others', () => {
      let currentUrl = '/texas/fort-worth/electricity-plans/12-month+fixed-rate+green-energy';
      
      // Remove middle filter
      currentUrl = removeFilterFromUrl(currentUrl, 'fixed-rate');
      expect(currentUrl).toBe('/texas/fort-worth/electricity-plans/12-month+green-energy');
      
      // Remove another filter
      currentUrl = removeFilterFromUrl(currentUrl, 'green-energy');
      expect(currentUrl).toBe('/texas/fort-worth/electricity-plans/12-month');
      
      // Remove last filter
      currentUrl = removeFilterFromUrl(currentUrl, '12-month');
      expect(currentUrl).toBe('/texas/fort-worth/electricity-plans');
    });

    it('should maintain consistent URL format across operations', () => {
      const startUrl = '/texas/dallas/electricity-plans';
      
      // Add filters in different orders to test sorting
      let url1 = addFilterToUrl(startUrl, 'green-energy');
      url1 = addFilterToUrl(url1, '12-month');
      url1 = addFilterToUrl(url1, 'fixed-rate');
      
      let url2 = addFilterToUrl(startUrl, 'fixed-rate');
      url2 = addFilterToUrl(url2, 'green-energy');
      url2 = addFilterToUrl(url2, '12-month');
      
      // Both should result in the same URL due to sorting
      expect(url1).toBe(url2);
      expect(url1).toBe('/texas/dallas/electricity-plans/12-month+fixed-rate+green-energy');
    });
  });

  describe('Data Consistency Across Filter Changes', () => {
    it('should maintain data integrity when filters are combined', async () => {
      // Mock different API responses for different filter combinations
      const baseParams: ApiParams = { tdsp_duns: '1039940674000' };
      
      // No filters - should return all plans
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPlans.map(plan => ({
          _id: plan.id,
          product: {
            _id: plan.id + '-product',
            brand: { _id: 'brand-1', name: plan.provider.name, puct_number: '10000', legal_name: plan.provider.name, contact_info: { sales: { phone_number: '1-800-TEST' }, support: { address: 'Test', email: 'test@test.com', phone_number: '1-800-TEST' }}},
            name: plan.name,
            term: plan.contract.length,
            family: 'test',
            percent_green: plan.features.greenEnergy,
            headline: 'Test plan',
            early_termination_fee: plan.contract.earlyTerminationFee,
            description: 'Test description',
            is_pre_pay: plan.features.deposit.required,
            is_time_of_use: false
          },
          tdsp: { _id: 'tdsp-1', name: 'Test TDSP', short_name: 'TEST', abbreviation: 'TST', duns_number: '1039940674000' },
          expected_prices: [],
          display_pricing_500: { usage: 500, avg: plan.pricing.rate500kWh, total: plan.pricing.rate500kWh * 500 },
          display_pricing_1000: { usage: 1000, avg: plan.pricing.rate1000kWh, total: plan.pricing.rate1000kWh * 1000 },
          display_pricing_2000: { usage: 2000, avg: plan.pricing.rate2000kWh, total: plan.pricing.rate2000kWh * 2000 },
          document_links: []
        }))
      });

      const allPlans = await client.fetchPlans(baseParams);
      expect(allPlans).toHaveLength(4);

      // With 12-month filter - should return subset
      const filtered12Month = mockPlans.filter(plan => plan.contract.length === 12);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => filtered12Month.map(plan => ({
          _id: plan.id,
          product: {
            _id: plan.id + '-product',
            brand: { _id: 'brand-1', name: plan.provider.name, puct_number: '10000', legal_name: plan.provider.name, contact_info: { sales: { phone_number: '1-800-TEST' }, support: { address: 'Test', email: 'test@test.com', phone_number: '1-800-TEST' }}},
            name: plan.name,
            term: 12,
            family: 'test',
            percent_green: plan.features.greenEnergy,
            headline: 'Test plan',
            early_termination_fee: plan.contract.earlyTerminationFee,
            description: 'Test description',
            is_pre_pay: plan.features.deposit.required,
            is_time_of_use: false
          },
          tdsp: { _id: 'tdsp-1', name: 'Test TDSP', short_name: 'TEST', abbreviation: 'TST', duns_number: '1039940674000' },
          expected_prices: [],
          display_pricing_500: { usage: 500, avg: plan.pricing.rate500kWh, total: plan.pricing.rate500kWh * 500 },
          display_pricing_1000: { usage: 1000, avg: plan.pricing.rate1000kWh, total: plan.pricing.rate1000kWh * 1000 },
          display_pricing_2000: { usage: 2000, avg: plan.pricing.rate2000kWh, total: plan.pricing.rate2000kWh * 2000 },
          document_links: []
        }))
      });

      const twelvemonthPlans = await client.fetchPlans({
        ...baseParams,
        term: 12
      });

      expect(twelvemonthPlans.length).toBeLessThanOrEqual(allPlans.length);
      expect(twelvemonthPlans.every(plan => plan.contract.length === 12)).toBe(true);
    });

    it('should handle empty results gracefully', async () => {
      // Mock empty response for very restrictive filters
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => []
      });

      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        term: 12,
        percent_green: 100,
        is_pre_pay: true,
        requires_auto_pay: true
      };

      const results = await client.fetchPlans(params);
      expect(results).toEqual([]);
    });
  });

  describe('Error Handling in Filter Workflows', () => {
    it('should handle API errors during filtered requests gracefully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        term: 12
      };

      await expect(client.fetchPlans(params)).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should fall back to cache when API fails during filter changes', async () => {
      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        term: 12
      };

      // First successful request
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPlans.slice(0, 2).map(plan => ({
          _id: plan.id,
          product: {
            _id: plan.id + '-product',
            brand: { _id: 'brand-1', name: plan.provider.name, puct_number: '10000', legal_name: plan.provider.name, contact_info: { sales: { phone_number: '1-800-TEST' }, support: { address: 'Test', email: 'test@test.com', phone_number: '1-800-TEST' }}},
            name: plan.name,
            term: 12,
            family: 'test',
            percent_green: plan.features.greenEnergy,
            headline: 'Test plan',
            early_termination_fee: plan.contract.earlyTerminationFee,
            description: 'Test description',
            is_pre_pay: plan.features.deposit.required,
            is_time_of_use: false
          },
          tdsp: { _id: 'tdsp-1', name: 'Test TDSP', short_name: 'TEST', abbreviation: 'TST', duns_number: '1039940674000' },
          expected_prices: [],
          display_pricing_500: { usage: 500, avg: plan.pricing.rate500kWh, total: plan.pricing.rate500kWh * 500 },
          display_pricing_1000: { usage: 1000, avg: plan.pricing.rate1000kWh, total: plan.pricing.rate1000kWh * 1000 },
          display_pricing_2000: { usage: 2000, avg: plan.pricing.rate2000kWh, total: plan.pricing.rate2000kWh * 2000 },
          document_links: []
        }))
      });

      const firstResult = await client.fetchPlans(params);
      expect(firstResult).toHaveLength(2);

      // Second request fails, should return cached result
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const secondResult = await client.fetchPlans(params);
      expect(secondResult).toEqual(firstResult);
    });
  });
});