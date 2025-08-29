/**
 * Comprehensive Unit Tests for useElectricityPlans Hook
 * 
 * Tests all functionality of the enterprise ZIP code search hook including:
 * - State management and validation
 * - API interactions and error handling
 * - Search history and favorites management
 * - Analytics tracking and caching
 * - Filter and sorting operations
 * - Edge cases and error scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useElectricityPlans } from '@/hooks/useElectricityPlans';

// Mock external dependencies
vi.mock('@/types/electricity-plans', () => ({
  isDeregulatedZip: vi.fn((zip: string) => zip.startsWith('7')),
  validateZipCode: vi.fn((zip: string) => /^\d{5}$/.test(zip)),
  validateTexasZipCode: vi.fn((zip: string) => zip.startsWith('7')),
  getTdspFromZip: vi.fn(() => ({ success: true, tdsp: { duns: '12345', name: 'Test TDSP' } })),
}));

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
beforeEach(() => {
  console.warn = vi.fn();
  console.error = vi.fn();
  vi.clearAllMocks();
});

afterEach(() => {
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

describe('useElectricityPlans Hook', () => {
  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      expect(result.current.zipCode).toBe('');
      expect(result.current.address).toBe('');
      expect(result.current.isZipValid).toBe(false);
      expect(result.current.isAddressValid).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSearching).toBe(false);
      expect(result.current.isValidating).toBe(false);
      expect(result.current.plans).toEqual([]);
      expect(result.current.totalPlans).toBe(0);
      expect(result.current.error).toBeNull();
      expect(result.current.searchHistory).toEqual([]);
      expect(result.current.favorites).toEqual([]);
      expect(result.current.searchCount).toBe(0);
      expect(result.current.lastSearchTime).toBeNull();
      expect(result.current.filters).toEqual({});
      expect(result.current.sortBy).toBe('rate');
      expect(result.current.sortOrder).toBe('asc');
      expect(result.current.showFilters).toBe(false);
      expect(result.current.showAddressInput).toBe(false);
      expect(result.current.selectedPlan).toBeNull();
      expect(result.current.comparisonPlans).toEqual([]);
    });

    it('should generate unique session ID', () => {
      const { result: result1 } = renderHook(() => useElectricityPlans());
      const { result: result2 } = renderHook(() => useElectricityPlans());
      
      expect(result1.current.sessionId).toBeTruthy();
      expect(result2.current.sessionId).toBeTruthy();
      expect(result1.current.sessionId).not.toBe(result2.current.sessionId);
    });

    it('should use provided session ID', () => {
      const customSessionId = 'custom-session-123';
      const { result } = renderHook(() => useElectricityPlans({ sessionId: customSessionId }));
      
      expect(result.current.sessionId).toBe(customSessionId);
    });

    it('should load persisted search history and favorites', () => {
      const mockHistory = [{ id: '1', zipCode: '75201', timestamp: Date.now(), planCount: 10, searchTime: 500 }];
      const mockFavorites = [{ id: '1', label: '75201 - Dallas', zipCode: '75201', savedAt: Date.now() }];
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'cmp_search_history') return JSON.stringify(mockHistory);
        if (key === 'cmp_favorite_addresses') return JSON.stringify(mockFavorites);
        return null;
      });
      
      const { result } = renderHook(() => useElectricityPlans());
      
      expect(result.current.searchHistory).toEqual(mockHistory);
      expect(result.current.favorites).toEqual(mockFavorites);
    });
  });

  describe('ZIP Code Validation and Setting', () => {
    it('should validate and set valid Texas ZIP code', async () => {
      const { result } = renderHook(() => useElectricityPlans({ autoSearch: false }));
      
      await act(async () => {
        result.current.setZipCode('75201');
      });
      
      expect(result.current.zipCode).toBe('75201');
      expect(result.current.isZipValid).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should reject invalid ZIP code', async () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      await act(async () => {
        result.current.setZipCode('12345'); // Non-Texas ZIP
      });
      
      expect(result.current.zipCode).toBe('12345');
      expect(result.current.isZipValid).toBe(false);
      expect(result.current.validationErrors.zipCode).toBeTruthy();
    });

    it('should clean and truncate ZIP code input', async () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      await act(async () => {
        result.current.setZipCode('75201abc67890'); // Contains letters and extra digits
      });
      
      expect(result.current.zipCode).toBe('75201'); // Only first 5 digits
    });

    it('should auto-search when ZIP is valid and autoSearch is enabled', async () => {
      const mockFetch = fetch as Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          plans: [{ id: '1', name: 'Test Plan' }],
          totalPlans: 1,
          metadata: { city: 'Dallas' },
          tdsp: { name: 'Test TDSP', duns: '12345' }
        })
      });

      const { result } = renderHook(() => useElectricityPlans({ autoSearch: true }));
      
      await act(async () => {
        result.current.setZipCode('75201');
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/electricity-plans/search', expect.any(Object));
      });
    });
  });

  describe('Address Validation and Setting', () => {
    it('should validate and set valid address', async () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      await act(async () => {
        result.current.setAddress('123 Main Street, Dallas, TX');
      });
      
      expect(result.current.address).toBe('123 Main Street, Dallas, TX');
      expect(result.current.isAddressValid).toBe(true);
      expect(result.current.validationErrors.address).toBe('');
    });

    it('should reject invalid address', async () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      await act(async () => {
        result.current.setAddress('abc'); // Too short
      });
      
      expect(result.current.isAddressValid).toBe(false);
      expect(result.current.validationErrors.address).toBeTruthy();
    });
  });

  describe('Plan Search Functionality', () => {
    it('should successfully search for plans', async () => {
      const mockResponse = {
        success: true,
        plans: [
          { id: '1', name: 'Test Plan 1', provider: { name: 'TXU' } },
          { id: '2', name: 'Test Plan 2', provider: { name: 'Reliant' } }
        ],
        totalPlans: 2,
        metadata: { city: 'Dallas' },
        tdsp: { name: 'Oncor', duns: '12345' }
      };

      const mockFetch = fetch as Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const { result } = renderHook(() => useElectricityPlans());
      
      await act(async () => {
        result.current.setZipCode('75201');
      });

      let searchResult;
      await act(async () => {
        searchResult = await result.current.searchPlans();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.plans).toEqual(mockResponse.plans);
      expect(result.current.totalPlans).toBe(2);
      expect(result.current.searchResponse).toEqual(mockResponse);
      expect(result.current.searchCount).toBe(1);
      expect(result.current.lastSearchTime).toBeTruthy();
      expect(result.current.error).toBeNull();
      expect(searchResult).toEqual(mockResponse);
    });

    it('should handle API errors gracefully', async () => {
      const mockFetch = fetch as Mock;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const onError = vi.fn();
      const { result } = renderHook(() => useElectricityPlans({ onError }));
      
      await act(async () => {
        result.current.setZipCode('75201');
      });

      await act(async () => {
        await result.current.searchPlans();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.type).toBe('API_REQUEST_ERROR');
      expect(onError).toHaveBeenCalled();
    });

    it('should handle API response with no plans', async () => {
      const mockResponse = {
        success: false,
        errors: [{
          type: 'NO_PLANS_AVAILABLE',
          message: 'No plans found',
          userMessage: 'No electricity plans available for this area',
          context: { zipCode: '75201' },
          isRetryable: true,
          timestamp: new Date().toISOString()
        }]
      };

      const mockFetch = fetch as Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const { result } = renderHook(() => useElectricityPlans());
      
      await act(async () => {
        result.current.setZipCode('75201');
      });

      await act(async () => {
        await result.current.searchPlans();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.type).toBe('NO_PLANS_AVAILABLE');
    });

    it('should validate ZIP code before searching', async () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      await act(async () => {
        result.current.setZipCode('12345'); // Invalid Texas ZIP
      });

      let searchResult;
      await act(async () => {
        searchResult = await result.current.searchPlans();
      });

      expect(searchResult).toBeNull();
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.type).toBe('INVALID_PARAMETERS');
    });
  });

  describe('Search History Management', () => {
    it('should add successful search to history', async () => {
      const mockResponse = {
        success: true,
        plans: [{ id: '1', name: 'Test Plan' }],
        totalPlans: 1,
        metadata: { city: 'Dallas' },
        tdsp: { name: 'Oncor', duns: '12345' }
      };

      const mockFetch = fetch as Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const { result } = renderHook(() => useElectricityPlans());
      
      await act(async () => {
        result.current.setZipCode('75201');
      });

      await act(async () => {
        await result.current.searchPlans();
      });

      expect(result.current.searchHistory).toHaveLength(1);
      expect(result.current.searchHistory[0]).toMatchObject({
        zipCode: '75201',
        city: 'Dallas',
        planCount: 1,
        tdspName: 'Oncor'
      });
    });

    it('should limit search history to maxHistoryEntries', async () => {
      const mockResponse = {
        success: true,
        plans: [{ id: '1', name: 'Test Plan' }],
        totalPlans: 1,
        metadata: { city: 'Dallas' },
        tdsp: { name: 'Oncor', duns: '12345' }
      };

      const mockFetch = fetch as Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const { result } = renderHook(() => useElectricityPlans({ maxHistoryEntries: 2 }));
      
      // Perform 3 searches
      for (let i = 1; i <= 3; i++) {
        await act(async () => {
          result.current.setZipCode(`7520${i}`);
        });

        await act(async () => {
          await result.current.searchPlans();
        });
      }

      expect(result.current.searchHistory).toHaveLength(2);
      expect(result.current.searchHistory[0].zipCode).toBe('75203'); // Most recent
      expect(result.current.searchHistory[1].zipCode).toBe('75202'); // Second most recent
    });

    it('should persist search history to localStorage', async () => {
      const mockResponse = {
        success: true,
        plans: [{ id: '1', name: 'Test Plan' }],
        totalPlans: 1,
        metadata: { city: 'Dallas' },
        tdsp: { name: 'Oncor', duns: '12345' }
      };

      const mockFetch = fetch as Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const { result } = renderHook(() => useElectricityPlans());
      
      await act(async () => {
        result.current.setZipCode('75201');
      });

      await act(async () => {
        await result.current.searchPlans();
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'cmp_search_history',
          expect.stringContaining('75201')
        );
      });
    });
  });

  describe('Favorites Management', () => {
    it('should add ZIP code to favorites', async () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      await act(async () => {
        result.current.addToFavorites('75201', undefined, 'Dallas Location');
      });

      expect(result.current.favorites).toHaveLength(1);
      expect(result.current.favorites[0]).toMatchObject({
        label: 'Dallas Location',
        zipCode: '75201',
        savedAt: expect.any(Number)
      });
    });

    it('should add address and ZIP code to favorites', async () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      await act(async () => {
        result.current.addToFavorites('75201', '123 Main St', 'Home Address');
      });

      expect(result.current.favorites[0]).toMatchObject({
        label: 'Home Address',
        zipCode: '75201',
        address: '123 Main St'
      });
    });

    it('should remove favorite by ID', async () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      await act(async () => {
        result.current.addToFavorites('75201');
      });

      const favoriteId = result.current.favorites[0].id;

      await act(async () => {
        result.current.removeFromFavorites(favoriteId);
      });

      expect(result.current.favorites).toHaveLength(0);
    });

    it('should limit favorites to 10 entries', async () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      // Add 12 favorites
      for (let i = 1; i <= 12; i++) {
        await act(async () => {
          result.current.addToFavorites(`7520${i.toString().padStart(2, '0')}`);
        });
      }

      expect(result.current.favorites).toHaveLength(10);
    });
  });

  describe('Plan Comparison Management', () => {
    it('should add plan to comparison', async () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      await act(async () => {
        result.current.addToComparison('plan-123');
      });

      expect(result.current.comparisonPlans).toContain('plan-123');
    });

    it('should not add duplicate plan to comparison', async () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      await act(async () => {
        result.current.addToComparison('plan-123');
        result.current.addToComparison('plan-123');
      });

      expect(result.current.comparisonPlans).toEqual(['plan-123']);
    });

    it('should limit comparison to 3 plans', async () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      await act(async () => {
        result.current.addToComparison('plan-1');
        result.current.addToComparison('plan-2');
        result.current.addToComparison('plan-3');
        result.current.addToComparison('plan-4'); // Should not be added
      });

      expect(result.current.comparisonPlans).toHaveLength(3);
      expect(result.current.comparisonPlans).not.toContain('plan-4');
    });

    it('should remove plan from comparison', async () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      await act(async () => {
        result.current.addToComparison('plan-123');
        result.current.addToComparison('plan-456');
      });

      await act(async () => {
        result.current.removeFromComparison('plan-123');
      });

      expect(result.current.comparisonPlans).toEqual(['plan-456']);
    });
  });

  describe('Filter and Sorting', () => {
    const mockPlans = [
      {
        id: '1',
        name: 'Fixed Rate Plan',
        contract: { type: 'fixed', length: 12 },
        pricing: { rate1000kWh: 10.5 },
        features: { greenEnergy: 0, deposit: { required: false } },
        provider: { name: 'TXU Energy' }
      },
      {
        id: '2',
        name: 'Variable Rate Plan',
        contract: { type: 'variable', length: 24 },
        pricing: { rate1000kWh: 9.8 },
        features: { greenEnergy: 100, deposit: { required: true } },
        provider: { name: 'Reliant Energy' }
      },
      {
        id: '3',
        name: 'Green Energy Plan',
        contract: { type: 'fixed', length: 12 },
        pricing: { rate1000kWh: 11.2 },
        features: { greenEnergy: 50, deposit: { required: false } },
        provider: { name: 'Green Mountain' }
      }
    ];

    beforeEach(() => {
      const { result } = renderHook(() => useElectricityPlans());
      act(() => {
        result.current.plans = mockPlans;
      });
    });

    it('should filter plans by rate type', () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      act(() => {
        result.current.plans = mockPlans;
        result.current.updateFilters({ rateType: 'fixed' });
      });

      const filtered = result.current.filteredPlans;
      expect(filtered).toHaveLength(2);
      expect(filtered.every(plan => plan.contract.type === 'fixed')).toBe(true);
    });

    it('should filter plans by contract length', () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      act(() => {
        result.current.plans = mockPlans;
        result.current.updateFilters({ contractLength: [12] });
      });

      const filtered = result.current.filteredPlans;
      expect(filtered).toHaveLength(2);
      expect(filtered.every(plan => plan.contract.length === 12)).toBe(true);
    });

    it('should filter plans by green energy', () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      act(() => {
        result.current.plans = mockPlans;
        result.current.updateFilters({ greenEnergy: true });
      });

      const filtered = result.current.filteredPlans;
      expect(filtered).toHaveLength(2);
      expect(filtered.every(plan => plan.features.greenEnergy > 0)).toBe(true);
    });

    it('should filter plans by no deposit requirement', () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      act(() => {
        result.current.plans = mockPlans;
        result.current.updateFilters({ noDeposit: true });
      });

      const filtered = result.current.filteredPlans;
      expect(filtered).toHaveLength(2);
      expect(filtered.every(plan => !plan.features.deposit.required)).toBe(true);
    });

    it('should sort plans by rate ascending', () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      act(() => {
        result.current.plans = mockPlans;
        result.current.updateSorting('rate', 'asc');
      });

      const sorted = result.current.filteredPlans;
      expect(sorted[0].pricing.rate1000kWh).toBe(9.8);
      expect(sorted[1].pricing.rate1000kWh).toBe(10.5);
      expect(sorted[2].pricing.rate1000kWh).toBe(11.2);
    });

    it('should sort plans by rate descending', () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      act(() => {
        result.current.plans = mockPlans;
        result.current.updateSorting('rate', 'desc');
      });

      const sorted = result.current.filteredPlans;
      expect(sorted[0].pricing.rate1000kWh).toBe(11.2);
      expect(sorted[1].pricing.rate1000kWh).toBe(10.5);
      expect(sorted[2].pricing.rate1000kWh).toBe(9.8);
    });
  });

  describe('UI State Management', () => {
    it('should toggle filters visibility', async () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      expect(result.current.showFilters).toBe(false);
      
      await act(async () => {
        result.current.toggleFilters();
      });
      
      expect(result.current.showFilters).toBe(true);
      
      await act(async () => {
        result.current.toggleFilters();
      });
      
      expect(result.current.showFilters).toBe(false);
    });

    it('should toggle address input visibility', async () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      expect(result.current.showAddressInput).toBe(false);
      
      await act(async () => {
        result.current.toggleAddressInput();
      });
      
      expect(result.current.showAddressInput).toBe(true);
    });

    it('should set selected plan', async () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      await act(async () => {
        result.current.setSelectedPlan('plan-123');
      });
      
      expect(result.current.selectedPlan).toBe('plan-123');
      
      await act(async () => {
        result.current.setSelectedPlan(null);
      });
      
      expect(result.current.selectedPlan).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should clear errors', async () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      // Set an error state
      await act(async () => {
        result.current.setZipCode('12345'); // Invalid ZIP
      });
      
      expect(result.current.error).toBeNull(); // No API error yet
      expect(result.current.validationErrors.zipCode).toBeTruthy();
      
      await act(async () => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
      expect(result.current.validationErrors).toEqual({});
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all state', async () => {
      const mockResponse = {
        success: true,
        plans: [{ id: '1', name: 'Test Plan' }],
        totalPlans: 1,
        metadata: { city: 'Dallas' },
        tdsp: { name: 'Oncor', duns: '12345' }
      };

      const mockFetch = fetch as Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const { result } = renderHook(() => useElectricityPlans());
      
      // Set some state
      await act(async () => {
        result.current.setZipCode('75201');
        result.current.setAddress('123 Main St');
        result.current.addToFavorites('75201');
        result.current.addToComparison('plan-1');
        result.current.toggleFilters();
        result.current.setSelectedPlan('plan-1');
      });

      await act(async () => {
        await result.current.searchPlans();
      });

      // Verify state is set
      expect(result.current.zipCode).toBe('75201');
      expect(result.current.plans).toHaveLength(1);
      expect(result.current.favorites).toHaveLength(1);
      expect(result.current.comparisonPlans).toHaveLength(1);
      expect(result.current.showFilters).toBe(true);
      expect(result.current.selectedPlan).toBe('plan-1');
      
      // Reset
      await act(async () => {
        result.current.reset();
      });
      
      // Verify state is reset (but history and favorites should persist)
      expect(result.current.zipCode).toBe('');
      expect(result.current.address).toBe('');
      expect(result.current.isZipValid).toBe(false);
      expect(result.current.isAddressValid).toBe(false);
      expect(result.current.plans).toEqual([]);
      expect(result.current.totalPlans).toBe(0);
      expect(result.current.searchResponse).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.validationErrors).toEqual({});
      expect(result.current.filters).toEqual({});
      expect(result.current.selectedPlan).toBeNull();
      expect(result.current.comparisonPlans).toEqual([]);
      expect(result.current.showFilters).toBe(false);
      expect(result.current.showAddressInput).toBe(false);
      
      // History and favorites should persist
      expect(result.current.searchHistory).toHaveLength(1);
      expect(result.current.favorites).toHaveLength(1);
    });

    it('should clear results only', async () => {
      const mockResponse = {
        success: true,
        plans: [{ id: '1', name: 'Test Plan' }],
        totalPlans: 1,
        metadata: { city: 'Dallas' },
        tdsp: { name: 'Oncor', duns: '12345' }
      };

      const mockFetch = fetch as Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const { result } = renderHook(() => useElectricityPlans());
      
      await act(async () => {
        result.current.setZipCode('75201');
      });

      await act(async () => {
        await result.current.searchPlans();
      });

      expect(result.current.plans).toHaveLength(1);
      expect(result.current.zipCode).toBe('75201');
      
      await act(async () => {
        result.current.clearResults();
      });
      
      expect(result.current.plans).toEqual([]);
      expect(result.current.totalPlans).toBe(0);
      expect(result.current.searchResponse).toBeNull();
      expect(result.current.zipCode).toBe('75201'); // Input should remain
    });
  });

  describe('Analytics Tracking', () => {
    it('should track search events when analytics enabled', async () => {
      const mockFetch = fetch as Mock;
      
      // Mock analytics endpoint
      mockFetch.mockImplementation((url) => {
        if (url === '/api/analytics/track') {
          return Promise.resolve({ ok: true, json: async () => ({}) });
        }
        // Mock search endpoint
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            plans: [],
            totalPlans: 0,
            metadata: { city: 'Dallas' },
            tdsp: { name: 'Oncor', duns: '12345' }
          })
        });
      });

      const { result } = renderHook(() => useElectricityPlans({ enableAnalytics: true }));
      
      await act(async () => {
        result.current.trackEvent('test_event', { testProp: 'value' });
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/track', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('test_event')
      }));
    });

    it('should not track events when analytics disabled', async () => {
      const mockFetch = fetch as Mock;
      const { result } = renderHook(() => useElectricityPlans({ enableAnalytics: false }));
      
      await act(async () => {
        result.current.trackEvent('test_event', { testProp: 'value' });
      });

      expect(mockFetch).not.toHaveBeenCalledWith('/api/analytics/track', expect.any(Object));
    });
  });

  describe('Computed Properties', () => {
    it('should correctly compute hasSearched', async () => {
      const mockResponse = {
        success: true,
        plans: [],
        totalPlans: 0,
        metadata: { city: 'Dallas' },
        tdsp: { name: 'Oncor', duns: '12345' }
      };

      const mockFetch = fetch as Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const { result } = renderHook(() => useElectricityPlans());
      
      expect(result.current.hasSearched).toBe(false);
      
      await act(async () => {
        result.current.setZipCode('75201');
      });

      await act(async () => {
        await result.current.searchPlans();
      });
      
      expect(result.current.hasSearched).toBe(true);
    });

    it('should correctly compute hasResults', async () => {
      const mockResponse = {
        success: true,
        plans: [{ id: '1', name: 'Test Plan' }],
        totalPlans: 1,
        metadata: { city: 'Dallas' },
        tdsp: { name: 'Oncor', duns: '12345' }
      };

      const mockFetch = fetch as Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const { result } = renderHook(() => useElectricityPlans());
      
      expect(result.current.hasResults).toBe(false);
      
      await act(async () => {
        result.current.setZipCode('75201');
      });

      await act(async () => {
        await result.current.searchPlans();
      });
      
      expect(result.current.hasResults).toBe(true);
    });

    it('should correctly compute canSearch', async () => {
      const { result } = renderHook(() => useElectricityPlans());
      
      expect(result.current.canSearch).toBe(false);
      
      await act(async () => {
        result.current.setZipCode('75201');
      });
      
      expect(result.current.canSearch).toBe(true);
      
      // During loading, canSearch should be false
      const mockFetch = fetch as Mock;
      mockFetch.mockImplementationOnce(() => new Promise(resolve => {
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({
            success: true,
            plans: [],
            totalPlans: 0,
            metadata: { city: 'Dallas' },
            tdsp: { name: 'Oncor', duns: '12345' }
          })
        }), 100);
      }));

      act(() => {
        result.current.searchPlans();
      });
      
      expect(result.current.canSearch).toBe(false);
    });
  });
});
