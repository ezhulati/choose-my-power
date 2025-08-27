import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComparePowerClientClass } from '../../../src/lib/api/comparepower-client';
import type { ApiParams } from '../../../src/types/facets';

// Mock API response data
const mockApiResponse = [
  {
    _id: 'plan-123',
    product: {
      _id: 'product-123',
      brand: {
        _id: 'brand-123',
        name: 'TXU Energy',
        puct_number: '10098',
        legal_name: 'TXU Energy Retail Company',
        contact_info: {
          sales: { phone_number: '1-855-TXU-ENGY' },
          support: {
            address: '1601 Bryan Street, Dallas, TX 75201',
            email: 'support@txu.com',
            phone_number: '1-800-TXU-ENERGY'
          }
        }
      },
      name: 'TXU Energy Select 12',
      term: 12,
      family: 'select',
      percent_green: 0,
      headline: 'Fixed rate electricity plan for 12 months',
      early_termination_fee: 150,
      description: 'A reliable fixed-rate plan',
      is_pre_pay: false,
      is_time_of_use: false
    },
    tdsp: {
      _id: 'tdsp-123',
      name: 'Oncor Electric Delivery',
      short_name: 'Oncor',
      abbreviation: 'OCD',
      duns_number: '1039940674000'
    },
    expected_prices: [
      { usage: 500, price: 65.50, actual: 65.50, valid: true },
      { usage: 1000, price: 120.00, actual: 120.00, valid: true },
      { usage: 2000, price: 230.00, actual: 230.00, valid: true }
    ],
    display_pricing_500: { usage: 500, avg: 0.131, total: 65.50 },
    display_pricing_1000: { usage: 1000, avg: 0.120, total: 120.00 },
    display_pricing_2000: { usage: 2000, avg: 0.115, total: 230.00 },
    document_links: [
      { type: 'efl', language: 'en', link: 'https://example.com/efl.pdf' }
    ]
  },
  {
    _id: 'plan-456',
    product: {
      _id: 'product-456',
      brand: {
        _id: 'brand-456',
        name: 'Green Mountain Energy',
        puct_number: '10171',
        legal_name: 'Green Mountain Energy Company',
        contact_info: {
          sales: { phone_number: '1-888-GREEN-MT' },
          support: {
            address: '12505 Highway 620 N, Austin, TX 78750',
            email: 'support@greenmountainenergy.com',
            phone_number: '1-888-556-6977'
          }
        }
      },
      name: 'Pollution Free e-Plus 12',
      term: 12,
      family: 'eplus',
      percent_green: 100,
      headline: '100% renewable energy plan with free weekends',
      early_termination_fee: 0,
      description: 'Clean energy with weekend benefits',
      is_pre_pay: false,
      is_time_of_use: true
    },
    tdsp: {
      _id: 'tdsp-123',
      name: 'Oncor Electric Delivery',
      short_name: 'Oncor',
      abbreviation: 'OCD',
      duns_number: '1039940674000'
    },
    expected_prices: [
      { usage: 500, price: 72.25, actual: 72.25, valid: true },
      { usage: 1000, price: 135.50, actual: 135.50, valid: true },
      { usage: 2000, price: 265.00, actual: 265.00, valid: true }
    ],
    display_pricing_500: { usage: 500, avg: 0.1445, total: 72.25 },
    display_pricing_1000: { usage: 1000, avg: 0.1355, total: 135.50 },
    display_pricing_2000: { usage: 2000, avg: 0.1325, total: 265.00 },
    document_links: [
      { type: 'efl', language: 'en', link: 'https://example.com/efl2.pdf' }
    ]
  }
];

describe('ComparePowerClient', () => {
  let client: ComparePowerClientClass;
  let fetchMock: any;

  beforeEach(() => {
    client = new ComparePowerClientClass({
      baseUrl: 'https://test-api.comparepower.com',
      timeout: 5000,
      retryAttempts: 2
    });
    
    fetchMock = vi.fn(global.fetch);
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.clearAllMocks();
    client.clearCache();
  });

  describe('fetchPlans', () => {
    it('should fetch and transform plans successfully', async () => {
      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        display_usage: 1000
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockApiResponse
      });

      const result = await client.fetchPlans(params);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('https://test-api.comparepower.com/api/plans/current'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'ChooseMyPower.org/1.0'
          })
        })
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'plan-123',
        name: 'TXU Energy Select 12',
        provider: {
          name: 'TXU Energy',
          logo: '',
          rating: 0,
          reviewCount: 0
        },
        pricing: {
          rate500kWh: 0.131,
          rate1000kWh: 0.120,
          rate2000kWh: 0.115,
          ratePerKwh: 0.120
        },
        contract: {
          length: 12,
          type: 'fixed',
          earlyTerminationFee: 150,
          autoRenewal: false,
          satisfactionGuarantee: false
        },
        features: {
          greenEnergy: 0,
          billCredit: 0,
          deposit: {
            required: false,
            amount: 0
          }
        },
        availability: {
          enrollmentType: 'both',
          serviceAreas: ['Oncor Electric Delivery']
        }
      });
    });

    it('should handle green energy and time-of-use plans correctly', async () => {
      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        percent_green: 100
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockApiResponse[1]] // Green energy plan
      });

      const result = await client.fetchPlans(params);

      expect(result[0]).toMatchObject({
        id: 'plan-456',
        name: 'Pollution Free e-Plus 12',
        features: {
          greenEnergy: 100,
          freeTime: {
            hours: 'Off-peak hours',
            days: ['All']
          }
        },
        contract: {
          type: 'fixed',
          earlyTerminationFee: 0
        }
      });
    });

    it('should build correct query parameters', async () => {
      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        display_usage: 2000,
        term: 24,
        percent_green: 50,
        is_pre_pay: true,
        is_time_of_use: false,
        requires_auto_pay: true,
        brand_id: 'brand-123'
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => []
      });

      await client.fetchPlans(params);

      const calledUrl = fetchMock.mock.calls[0][0];
      const url = new URL(calledUrl);
      
      expect(url.searchParams.get('group')).toBe('default');
      expect(url.searchParams.get('tdsp_duns')).toBe('1039940674000');
      expect(url.searchParams.get('display_usage')).toBe('2000');
      expect(url.searchParams.get('term')).toBe('24');
      expect(url.searchParams.get('percent_green')).toBe('50');
      expect(url.searchParams.get('is_pre_pay')).toBe('true');
      expect(url.searchParams.get('is_time_of_use')).toBe('false');
      expect(url.searchParams.get('requires_auto_pay')).toBe('true');
      expect(url.searchParams.get('brand_id')).toBe('brand-123');
    });

    it('should use cache for repeated requests', async () => {
      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        display_usage: 1000
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockApiResponse
      });

      // First call
      const result1 = await client.fetchPlans(params);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await client.fetchPlans(params);
      expect(fetchMock).toHaveBeenCalledTimes(1); // No additional call
      expect(result1).toEqual(result2);
    });

    it('should handle API errors gracefully', async () => {
      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        display_usage: 1000
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(client.fetchPlans(params)).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should retry failed requests', async () => {
      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        display_usage: 1000
      };

      // First two calls fail, third succeeds
      fetchMock
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockApiResponse
        });

      const result = await client.fetchPlans(params);
      
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(2);
    });

    it('should handle invalid API response format', async () => {
      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        display_usage: 1000
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invalid: 'format' }) // Not an array
      });

      await expect(client.fetchPlans(params)).rejects.toThrow('Invalid API response format - expected array');
    });

    it('should handle timeout errors', async () => {
      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        display_usage: 1000
      };

      fetchMock.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new DOMException('AbortError', 'AbortError')), 100)
        )
      );

      await expect(client.fetchPlans(params)).rejects.toThrow();
    });
  });

  describe('Rate Type Determination', () => {
    it('should correctly identify fixed rate plans', async () => {
      const fixedPlan = {
        ...mockApiResponse[0],
        product: {
          ...mockApiResponse[0].product,
          name: 'TXU Fixed Rate 12',
          headline: 'Reliable fixed rate plan'
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [fixedPlan]
      });

      const result = await client.fetchPlans({ tdsp_duns: '1039940674000' });
      expect(result[0].contract.type).toBe('fixed');
    });

    it('should correctly identify variable rate plans', async () => {
      const variablePlan = {
        ...mockApiResponse[0],
        product: {
          ...mockApiResponse[0].product,
          name: 'TXU Variable Rate Plan',
          headline: 'Flexible variable rate pricing'
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [variablePlan]
      });

      const result = await client.fetchPlans({ tdsp_duns: '1039940674000' });
      expect(result[0].contract.type).toBe('variable');
    });

    it('should correctly identify indexed rate plans', async () => {
      const indexedPlan = {
        ...mockApiResponse[0],
        product: {
          ...mockApiResponse[0].product,
          name: 'Market Indexed Plan',
          headline: 'Rate follows market index'
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [indexedPlan]
      });

      const result = await client.fetchPlans({ tdsp_duns: '1039940674000' });
      expect(result[0].contract.type).toBe('indexed');
    });
  });

  describe('Time-of-Use Parsing', () => {
    it('should parse specific time ranges', async () => {
      const touPlan = {
        ...mockApiResponse[1],
        product: {
          ...mockApiResponse[1].product,
          headline: 'FREE electricity from 9:00 pm to 6:00 am',
          is_time_of_use: true
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [touPlan]
      });

      const result = await client.fetchPlans({ tdsp_duns: '1039940674000' });
      expect(result[0].features.freeTime).toEqual({
        hours: '9:00 pm-6:00 am',
        days: ['All']
      });
    });

    it('should parse weekend time-of-use plans', async () => {
      const weekendPlan = {
        ...mockApiResponse[1],
        product: {
          ...mockApiResponse[1].product,
          headline: 'FREE electricity on weekends from 6:00 pm to 9:00 am',
          is_time_of_use: true
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [weekendPlan]
      });

      const result = await client.fetchPlans({ tdsp_duns: '1039940674000' });
      expect(result[0].features.freeTime).toEqual({
        hours: '6:00 pm-9:00 am',
        days: ['Saturday', 'Sunday']
      });
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', async () => {
      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        display_usage: 1000
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockApiResponse
      });

      await client.fetchPlans(params);

      const stats = client.getCacheStats();
      expect(stats.totalEntries).toBe(1);
      expect(stats.freshEntries).toBe(1);
      expect(stats.staleEntries).toBe(0);
      expect(stats.hitRate).toBe(1);
    });

    it('should clear cache manually', async () => {
      const params: ApiParams = {
        tdsp_duns: '1039940674000',
        display_usage: 1000
      };

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApiResponse
      });

      // Fill cache
      await client.fetchPlans(params);
      expect(client.getCacheStats().totalEntries).toBe(1);

      // Clear cache
      client.clearCache();
      expect(client.getCacheStats().totalEntries).toBe(0);

      // Next call should hit API again
      await client.fetchPlans(params);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Health Check', () => {
    it('should return true for successful health check', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const isHealthy = await client.healthCheck();
      expect(isHealthy).toBe(true);
      
      expect(fetchMock).toHaveBeenCalledWith(
        'https://test-api.comparepower.com/health',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'User-Agent': 'ChooseMyPower.org/1.0'
          })
        })
      );
    });

    it('should return false for failed health check', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503
      });

      const isHealthy = await client.healthCheck();
      expect(isHealthy).toBe(false);
    });

    it('should return false for network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const isHealthy = await client.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });
});