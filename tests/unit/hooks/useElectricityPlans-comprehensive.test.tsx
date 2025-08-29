/**
 * Comprehensive Unit Tests for useElectricityPlans Hook
 * 
 * Tests the complete hook functionality including:
 * - ZIP code validation and search
 * - Address handling for multi-TDSP ZIPs
 * - Plan filtering and sorting
 * - Search history and favorites management
 * - Error handling and recovery
 * - Analytics tracking
 * - Performance optimizations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useElectricityPlans } from '../../../src/hooks/useElectricityPlans';
import type { ZipSearchResponse, ElectricityPlan, ApiErrorResponse } from '../../../src/types/electricity-plans';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('useElectricityPlans Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useElectricityPlans());

      expect(result.current.zipCode).toBe('');
      expect(result.current.address).toBe('');
      expect(result.current.isZipValid).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.plans).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.sessionId).toBeDefined();
    });

    it('should load persisted data from localStorage', () => {
      const savedHistory = [
        {
          id: 'hist1',
          zipCode: '75205',
          timestamp: Date.now() - 3600000,
          planCount: 5,
          searchTime: 250
        }
      ];

      const savedFavorites = [
        {
          id: 'fav1',
          label: 'Home - 75205',
          zipCode: '75205',
          savedAt: Date.now() - 86400000
        }
      ];

      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(savedHistory))
        .mockReturnValueOnce(JSON.stringify(savedFavorites));

      const { result } = renderHook(() => useElectricityPlans());

      expect(result.current.searchHistory).toEqual(savedHistory);
      expect(result.current.favorites).toEqual(savedFavorites);
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const { result } = renderHook(() => useElectricityPlans());

      expect(result.current.searchHistory).toEqual([]);
      expect(result.current.favorites).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load persisted search data:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('ZIP Code Validation', () => {
    it('should validate Texas ZIP codes correctly', () => {
      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        result.current.setZipCode('75205'); // Dallas - valid
      });

      expect(result.current.zipCode).toBe('75205');
      expect(result.current.isZipValid).toBe(true);
      expect(result.current.validationErrors.zipCode).toBe('');
    });

    it('should reject non-Texas ZIP codes', () => {
      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        result.current.setZipCode('90210'); // California - invalid
      });

      expect(result.current.zipCode).toBe('90210');
      expect(result.current.isZipValid).toBe(false);
      expect(result.current.validationErrors.zipCode).toBe('ZIP code not in Texas deregulated market');
    });

    it('should clean and format ZIP codes', () => {
      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        result.current.setZipCode('752-05'); // With dash
      });

      expect(result.current.zipCode).toBe('75205');
    });

    it('should limit ZIP code length', () => {
      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        result.current.setZipCode('7520512345'); // Too long
      });

      expect(result.current.zipCode).toBe('75205');
    });
  });

  describe('Address Validation', () => {
    it('should validate proper street addresses', () => {
      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        result.current.setAddress('123 Main Street');
      });

      expect(result.current.address).toBe('123 Main Street');
      expect(result.current.isAddressValid).toBe(true);
      expect(result.current.validationErrors.address).toBe('');
    });

    it('should reject addresses without street numbers', () => {
      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        result.current.setAddress('Main Street'); // No number
      });

      expect(result.current.isAddressValid).toBe(false);
    });

    it('should reject addresses that are too short', () => {
      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        result.current.setAddress('123'); // Too short
      });

      expect(result.current.isAddressValid).toBe(false);
      expect(result.current.validationErrors.address).toBe('Address must be at least 5 characters');
    });
  });

  describe('Plan Search', () => {
    const mockSuccessResponse: ZipSearchResponse = {
      success: true,
      plans: [
        {
          id: 'plan1',
          name: 'TXU Simply Fixed 12',
          provider: {
            name: 'TXU Energy',
            logo: 'https://example.com/logo.jpg',
            rating: 4.2,
            reviewCount: 1500
          },
          pricing: {
            rate500kWh: 12.5,
            rate1000kWh: 11.8,
            rate2000kWh: 11.2,
            ratePerKwh: 11.8
          },
          contract: {
            length: 12,
            type: 'fixed' as const,
            earlyTerminationFee: 150,
            autoRenewal: true,
            satisfactionGuarantee: false
          },
          features: {
            greenEnergy: 0,
            billCredit: 0,
            deposit: { required: false, amount: 0 }
          },
          availability: {
            enrollmentType: 'both' as const,
            serviceAreas: ['Dallas']
          }
        }
      ],
      totalPlans: 1,
      tdsp: {
        duns: '1039940674000',
        name: 'Oncor Electric Delivery',
        zone: 'North' as const,
        tier: 1,
        priority: 1.0,
        coverage: 'primary' as const
      },
      metadata: {
        zipCode: '75205',
        city: 'Dallas',
        searchTime: 250,
        cacheHit: false,
        dataSource: 'api' as const
      }
    };

    it('should search plans successfully for valid ZIP', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ip: '192.168.1.1' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSuccessResponse
        });

      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        result.current.setZipCode('75205');
      });

      await waitFor(() => {
        expect(result.current.plans).toHaveLength(1);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.searchResponse).toEqual(mockSuccessResponse);
      expect(result.current.searchCount).toBe(1);
      expect(result.current.searchHistory).toHaveLength(1);
    });

    it('should handle search errors gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ip: '192.168.1.1' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500
        });

      const { result } = renderHook(() => useElectricityPlans());

      await act(async () => {
        await result.current.searchPlans({ zipCode: '75205' });
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.type).toBe('API_REQUEST_ERROR');
      expect(result.current.error?.isRetryable).toBe(true);
    });

    it('should handle network errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ip: '192.168.1.1' })
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useElectricityPlans());

      await act(async () => {
        await result.current.searchPlans({ zipCode: '75205' });
      });

      expect(result.current.error?.type).toBe('API_REQUEST_ERROR');
      expect(result.current.error?.message).toBe('Network error');
    });

    it('should auto-search when autoSearch is enabled', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ip: '192.168.1.1' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSuccessResponse
        });

      const { result } = renderHook(() => 
        useElectricityPlans({ autoSearch: true })
      );

      act(() => {
        result.current.setZipCode('75205');
      });

      await waitFor(() => {
        expect(result.current.plans).toHaveLength(1);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/electricity-plans/search',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('75205')
        })
      );
    });
  });

  describe('Filtering and Sorting', () => {
    const mockPlans: ElectricityPlan[] = [
      {
        id: 'plan1',
        name: 'Fixed Rate Plan',
        provider: { name: 'TXU Energy', rating: 4.2, reviewCount: 1500 },
        pricing: { rate500kWh: 12.5, rate1000kWh: 11.8, rate2000kWh: 11.2, ratePerKwh: 11.8 },
        contract: { length: 12, type: 'fixed', earlyTerminationFee: 150, autoRenewal: true, satisfactionGuarantee: false },
        features: { greenEnergy: 0, billCredit: 0, deposit: { required: false, amount: 0 } },
        availability: { enrollmentType: 'both', serviceAreas: ['Dallas'] }
      },
      {
        id: 'plan2',
        name: 'Green Energy Plan',
        provider: { name: 'Green Mountain', rating: 4.5, reviewCount: 800 },
        pricing: { rate500kWh: 14.2, rate1000kWh: 13.5, rate2000kWh: 12.8, ratePerKwh: 13.5 },
        contract: { length: 24, type: 'fixed', earlyTerminationFee: 200, autoRenewal: false, satisfactionGuarantee: true },
        features: { greenEnergy: 100, billCredit: 5, deposit: { required: false, amount: 0 } },
        availability: { enrollmentType: 'online', serviceAreas: ['Dallas'] }
      }
    ];

    it('should filter plans by green energy', () => {
      const { result } = renderHook(() => useElectricityPlans());

      // Set up mock plans
      act(() => {
        result.current.plans = mockPlans as any;
        result.current.updateFilters({ greenEnergy: true });
      });

      const filtered = result.current.filteredPlans;
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('plan2');
    });

    it('should filter plans by rate type', () => {
      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        result.current.plans = mockPlans as any;
        result.current.updateFilters({ rateType: 'fixed' });
      });

      const filtered = result.current.filteredPlans;
      expect(filtered).toHaveLength(2); // Both are fixed rate
    });

    it('should filter plans by contract length', () => {
      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        result.current.plans = mockPlans as any;
        result.current.updateFilters({ contractLength: [12] });
      });

      const filtered = result.current.filteredPlans;
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('plan1');
    });

    it('should filter plans by price range', () => {
      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        result.current.plans = mockPlans as any;
        result.current.updateFilters({ 
          priceRange: { min: 10, max: 12 }
        });
      });

      const filtered = result.current.filteredPlans;
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('plan1'); // 11.8 cents is in range
    });

    it('should sort plans by rate ascending', () => {
      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        result.current.plans = mockPlans as any;
        result.current.updateSorting('rate', 'asc');
      });

      const sorted = result.current.filteredPlans;
      expect(sorted[0].id).toBe('plan1'); // Lower rate first
      expect(sorted[1].id).toBe('plan2');
    });

    it('should sort plans by green energy descending', () => {
      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        result.current.plans = mockPlans as any;
        result.current.updateSorting('green_energy', 'desc');
      });

      const sorted = result.current.filteredPlans;
      expect(sorted[0].id).toBe('plan2'); // 100% green first
      expect(sorted[1].id).toBe('plan1'); // 0% green second
    });
  });

  describe('Favorites Management', () => {
    it('should add location to favorites', () => {
      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        result.current.addToFavorites('75205', '123 Main St', 'Home');
      });

      expect(result.current.favorites).toHaveLength(1);
      expect(result.current.favorites[0].label).toBe('Home');
      expect(result.current.favorites[0].zipCode).toBe('75205');
      expect(result.current.favorites[0].address).toBe('123 Main St');
    });

    it('should remove favorites by ID', () => {
      const { result } = renderHook(() => useElectricityPlans());

      let favoriteId: string;

      act(() => {
        result.current.addToFavorites('75205', undefined, 'Work');
        favoriteId = result.current.favorites[0].id;
      });

      expect(result.current.favorites).toHaveLength(1);

      act(() => {
        result.current.removeFromFavorites(favoriteId);
      });

      expect(result.current.favorites).toHaveLength(0);
    });

    it('should limit favorites to maximum of 10', () => {
      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        // Add 12 favorites
        for (let i = 0; i < 12; i++) {
          result.current.addToFavorites(`7520${i}`, undefined, `Location ${i}`);
        }
      });

      expect(result.current.favorites).toHaveLength(10);
      expect(result.current.favorites[0].label).toBe('Location 11'); // Most recent first
    });
  });

  describe('Plan Comparison', () => {
    it('should add plans to comparison', () => {
      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        result.current.addToComparison('plan1');
        result.current.addToComparison('plan2');
      });

      expect(result.current.comparisonPlans).toEqual(['plan1', 'plan2']);
    });

    it('should prevent duplicate plans in comparison', () => {
      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        result.current.addToComparison('plan1');
        result.current.addToComparison('plan1'); // Duplicate
      });

      expect(result.current.comparisonPlans).toEqual(['plan1']);
    });

    it('should limit comparison to 3 plans', () => {
      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        result.current.addToComparison('plan1');
        result.current.addToComparison('plan2');
        result.current.addToComparison('plan3');
        result.current.addToComparison('plan4'); // Should be ignored
      });

      expect(result.current.comparisonPlans).toEqual(['plan1', 'plan2', 'plan3']);
    });

    it('should remove plans from comparison', () => {
      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        result.current.addToComparison('plan1');
        result.current.addToComparison('plan2');
        result.current.removeFromComparison('plan1');
      });

      expect(result.current.comparisonPlans).toEqual(['plan2']);
    });
  });

  describe('Search History', () => {
    it('should add search to history', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ip: '192.168.1.1' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            plans: [],
            totalPlans: 0,
            metadata: {
              zipCode: '75205',
              city: 'Dallas',
              searchTime: 200,
              cacheHit: false,
              dataSource: 'api'
            }
          })
        });

      const { result } = renderHook(() => useElectricityPlans());

      await act(async () => {
        await result.current.searchPlans({ zipCode: '75205' });
      });

      expect(result.current.searchHistory).toHaveLength(1);
      expect(result.current.searchHistory[0].zipCode).toBe('75205');
      expect(result.current.searchHistory[0].city).toBe('Dallas');
    });

    it('should limit history to maximum entries', async () => {
      const { result } = renderHook(() => 
        useElectricityPlans({ maxHistoryEntries: 3 })
      );

      // Mock multiple successful searches
      for (let i = 0; i < 5; i++) {
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ ip: '192.168.1.1' })
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              success: true,
              plans: [],
              totalPlans: 0,
              metadata: {
                zipCode: `7520${i}`,
                searchTime: 200,
                cacheHit: false,
                dataSource: 'api'
              }
            })
          });

        await act(async () => {
          await result.current.searchPlans({ zipCode: `7520${i}` });
        });
      }

      expect(result.current.searchHistory).toHaveLength(3);
      expect(result.current.searchHistory[0].zipCode).toBe('75204'); // Most recent first
    });
  });

  describe('Analytics Tracking', () => {
    it('should track search events when analytics enabled', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ip: '192.168.1.1' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            plans: [{ id: 'plan1' }],
            totalPlans: 1,
            metadata: {
              zipCode: '75205',
              searchTime: 200,
              cacheHit: false,
              dataSource: 'api'
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        });

      const { result } = renderHook(() => 
        useElectricityPlans({ enableAnalytics: true })
      );

      await act(async () => {
        await result.current.searchPlans({ zipCode: '75205' });
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/analytics/track',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('search_complete')
        })
      );
    });

    it('should not track events when analytics disabled', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ip: '192.168.1.1' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            plans: [],
            totalPlans: 0,
            metadata: {
              zipCode: '75205',
              searchTime: 200,
              cacheHit: false,
              dataSource: 'api'
            }
          })
        });

      const { result } = renderHook(() => 
        useElectricityPlans({ enableAnalytics: false })
      );

      await act(async () => {
        await result.current.searchPlans({ zipCode: '75205' });
      });

      // Should not have called analytics endpoint
      expect(mockFetch).toHaveBeenCalledTimes(2); // Only IP and search calls
    });

    it('should handle analytics errors gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ip: '192.168.1.1' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            plans: [],
            totalPlans: 0,
            metadata: {
              zipCode: '75205',
              searchTime: 200,
              cacheHit: false,
              dataSource: 'api'
            }
          })
        })
        .mockRejectedValueOnce(new Error('Analytics error'));

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => 
        useElectricityPlans({ enableAnalytics: true })
      );

      await act(async () => {
        await result.current.searchPlans({ zipCode: '75205' });
      });

      expect(consoleSpy).toHaveBeenCalledWith('Analytics tracking failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('State Management', () => {
    it('should provide computed values', () => {
      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        result.current.setZipCode('75205');
      });

      expect(result.current.canSearch).toBe(true);
      expect(result.current.hasSearched).toBe(false);
      expect(result.current.hasResults).toBe(false);
      expect(result.current.hasError).toBe(false);
    });

    it('should clear results', () => {
      const { result } = renderHook(() => useElectricityPlans());

      // Set some initial state
      act(() => {
        result.current.plans = [{ id: 'plan1' }] as any;
        result.current.totalPlans = 1;
        result.current.selectedPlan = 'plan1';
      });

      act(() => {
        result.current.clearResults();
      });

      expect(result.current.plans).toEqual([]);
      expect(result.current.totalPlans).toBe(0);
      expect(result.current.selectedPlan).toBeNull();
    });

    it('should reset all state', () => {
      const { result } = renderHook(() => useElectricityPlans());

      // Set some state
      act(() => {
        result.current.setZipCode('75205');
        result.current.setAddress('123 Main St');
        result.current.plans = [{ id: 'plan1' }] as any;
        result.current.updateFilters({ greenEnergy: true });
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.zipCode).toBe('');
      expect(result.current.address).toBe('');
      expect(result.current.plans).toEqual([]);
      expect(result.current.filters).toEqual({});
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should persist search history to localStorage', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ip: '192.168.1.1' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            plans: [],
            totalPlans: 0,
            metadata: {
              zipCode: '75205',
              searchTime: 200,
              cacheHit: false,
              dataSource: 'api'
            }
          })
        });

      const { result } = renderHook(() => useElectricityPlans());

      await act(async () => {
        await result.current.searchPlans({ zipCode: '75205' });
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'cmp_search_history',
        expect.stringContaining('75205')
      );
    });

    it('should persist favorites to localStorage', () => {
      const { result } = renderHook(() => useElectricityPlans());

      act(() => {
        result.current.addToFavorites('75205', undefined, 'Home');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'cmp_favorite_addresses',
        expect.stringContaining('Home')
      );
    });
  });

  describe('Callback Options', () => {
    it('should call onSearchComplete callback', async () => {
      const onSearchComplete = vi.fn();
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ip: '192.168.1.1' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            plans: [],
            totalPlans: 0,
            metadata: {
              zipCode: '75205',
              searchTime: 200,
              cacheHit: false,
              dataSource: 'api'
            }
          })
        });

      const { result } = renderHook(() => 
        useElectricityPlans({ onSearchComplete })
      );

      await act(async () => {
        await result.current.searchPlans({ zipCode: '75205' });
      });

      expect(onSearchComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          metadata: expect.objectContaining({ zipCode: '75205' })
        })
      );
    });

    it('should call onError callback', async () => {
      const onError = vi.fn();
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ip: '192.168.1.1' })
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => 
        useElectricityPlans({ onError })
      );

      await act(async () => {
        await result.current.searchPlans({ zipCode: '75205' });
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'API_REQUEST_ERROR',
          message: 'Network error'
        })
      );
    });
  });
});