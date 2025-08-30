/**
 * useElectricityPlansAPI Hook Tests - Comprehensive Test Suite
 * 
 * Tests for the production-ready React hook that integrates with Netlify Functions.
 * Covers all scenarios: single TDSP ZIPs, split ZIPs, error handling, caching, etc.
 * 
 * @module useElectricityPlansAPI.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useElectricityPlansAPI } from '../useElectricityPlansAPI';
import type { UseElectricityPlansAPIOptions } from '../useElectricityPlansAPI';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock abort controller
const mockAbort = vi.fn();
global.AbortController = vi.fn(() => ({
  abort: mockAbort,
  signal: { aborted: false }
})) as any;

// Test data fixtures
const mockPlan = {
  id: 'plan-123',
  name: 'Test Plan',
  provider: {
    name: 'Test Provider',
    logo: 'test-logo.png',
    logoInfo: {},
    rating: 4.5,
    reviewCount: 100
  },
  pricing: {
    rate500kWh: 12.5,
    rate1000kWh: 11.8,
    rate2000kWh: 11.2,
    ratePerKwh: 11.8,
    total500kWh: 62.50,
    total1000kWh: 118.00,
    total2000kWh: 224.00
  },
  contract: {
    length: 12,
    type: 'fixed' as const,
    earlyTerminationFee: 150,
    autoRenewal: false,
    satisfactionGuarantee: true
  },
  features: {
    greenEnergy: 25,
    billCredit: 0,
    deposit: {
      required: false,
      amount: 0
    }
  },
  availability: {
    enrollmentType: 'both' as const,
    serviceAreas: ['Oncor']
  }
};

const mockSuccessResponse = {
  success: true,
  data: {
    plans: [mockPlan],
    tdspInfo: {
      duns: '007924772',
      name: 'Oncor',
      zone: 'North',
      confidence: 'high' as const
    },
    searchMeta: {
      totalPlans: 1,
      filteredPlans: 1,
      zipCode: '75201',
      usage: 1000,
      cacheHit: false,
      responseTime: 250,
      method: 'direct_mapping' as const
    },
    splitZipInfo: {
      isMultiTdsp: false
    }
  }
};

const mockSplitZipResponse = {
  success: true,
  data: {
    plans: [mockPlan],
    tdspInfo: {
      duns: '007924772',
      name: 'Oncor',
      zone: 'North',
      confidence: 'medium' as const
    },
    searchMeta: {
      totalPlans: 1,
      filteredPlans: 1,
      zipCode: '75034',
      usage: 1000,
      cacheHit: false,
      responseTime: 450,
      method: 'split_zip_resolved' as const
    },
    splitZipInfo: {
      isMultiTdsp: true,
      alternativeTdsps: [
        {
          duns: '007924772',
          name: 'Oncor',
          requiresAddress: true
        },
        {
          duns: '1039940674000',
          name: 'TXU',
          requiresAddress: true
        }
      ]
    }
  }
};

const mockErrorResponse = {
  success: false,
  error: {
    code: 'INVALID_PARAMETERS',
    message: 'ZIP code not found',
    userMessage: 'This ZIP code is not in a deregulated Texas market.',
    retryable: false
  }
};

describe('useElectricityPlansAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    mockAbort.mockClear();
  });

  afterEach(() => {
    // Clear any pending timers
    vi.clearAllTimers();
  });

  describe('Basic Hook Functionality', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => 
        useElectricityPlansAPI({ zipCode: '75201', enabled: false })
      );

      expect(result.current.plans).toEqual([]);
      expect(result.current.tdspInfo).toBeNull();
      expect(result.current.searchMeta).toBeNull();
      expect(result.current.splitZipInfo).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSearching).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasSearched).toBe(false);
    });

    it('should provide all expected methods', () => {
      const { result } = renderHook(() => 
        useElectricityPlansAPI({ zipCode: '75201', enabled: false })
      );

      expect(typeof result.current.search).toBe('function');
      expect(typeof result.current.retry).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.refetch).toBe('function');
      expect(typeof result.current.invalidate).toBe('function');
    });
  });

  describe('Successful Plan Search', () => {
    it('should successfully search for plans with valid ZIP code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse)
      });

      const { result } = renderHook(() => 
        useElectricityPlansAPI({ zipCode: '75201', enabled: false })
      );

      // Trigger search
      await act(async () => {
        await result.current.search();
      });

      // Check loading states
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isSearching).toBe(false);
      });

      // Check results
      expect(result.current.plans).toHaveLength(1);
      expect(result.current.plans[0]).toEqual(mockPlan);
      expect(result.current.tdspInfo).toEqual(mockSuccessResponse.data.tdspInfo);
      expect(result.current.searchMeta).toMatchObject(mockSuccessResponse.data.searchMeta);
      expect(result.current.hasSearched).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle split ZIP codes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSplitZipResponse)
      });

      const { result } = renderHook(() => 
        useElectricityPlansAPI({ 
          zipCode: '75034', 
          address: '123 Main St',
          enabled: false 
        })
      );

      await act(async () => {
        await result.current.search();
      });

      await waitFor(() => {
        expect(result.current.splitZipInfo?.isMultiTdsp).toBe(true);
        expect(result.current.splitZipInfo?.alternativeTdsps).toHaveLength(2);
      });
    });

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse)
      });

      const { result } = renderHook(() => 
        useElectricityPlansAPI({ 
          zipCode: '75201',
          address: '123 Main St',
          usage: 1500,
          filters: { term: 12, green: 50 },
          enabled: false 
        })
      );

      await act(async () => {
        await result.current.search();
      });

      expect(mockFetch).toHaveBeenCalledWith('/.netlify/functions/search-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          zipCode: '75201',
          address: '123 Main St',
          usage: 1500,
          filters: { term: 12, green: 50 },
          source: 'react_hook_api',
          requestId: expect.stringMatching(/^hook_api_\d+_/)
        }),
        signal: expect.any(Object)
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockErrorResponse)
      });

      const { result } = renderHook(() => 
        useElectricityPlansAPI({ zipCode: '12345', enabled: false })
      );

      await act(async () => {
        await result.current.search();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('This ZIP code is not in a deregulated Texas market.');
        expect(result.current.plans).toEqual([]);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => 
        useElectricityPlansAPI({ zipCode: '75201', enabled: false })
      );

      await act(async () => {
        await result.current.search();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const { result } = renderHook(() => 
        useElectricityPlansAPI({ zipCode: '75201', enabled: false })
      );

      await act(async () => {
        await result.current.search();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('HTTP 500: Internal Server Error');
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should clear errors when clearError is called', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      const { result } = renderHook(() => 
        useElectricityPlansAPI({ zipCode: '75201', enabled: false })
      );

      await act(async () => {
        await result.current.search();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Test error');
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Caching Functionality', () => {
    it('should use cached results for identical searches', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse)
      });

      const { result } = renderHook(() => 
        useElectricityPlansAPI({ zipCode: '75201', enabled: false })
      );

      // First search
      await act(async () => {
        await result.current.search();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second identical search should use cache
      await act(async () => {
        await result.current.search();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1); // Still only called once
      expect(result.current.searchMeta?.cacheHit).toBe(true);
    });

    it('should bypass cache when refetch is called', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse)
      });

      const { result } = renderHook(() => 
        useElectricityPlansAPI({ zipCode: '75201', enabled: false })
      );

      // First search
      await act(async () => {
        await result.current.search();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Refetch should bypass cache
      await act(async () => {
        await result.current.refetch();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should invalidate cache', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse)
      });

      const { result } = renderHook(() => 
        useElectricityPlansAPI({ zipCode: '75201', enabled: false })
      );

      // First search
      await act(async () => {
        await result.current.search();
      });

      // Invalidate cache
      act(() => {
        result.current.invalidate();
      });

      // Next search should hit API again
      await act(async () => {
        await result.current.search();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Auto-search Functionality', () => {
    it('should auto-search when enabled and zipCode provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse)
      });

      renderHook(() => 
        useElectricityPlansAPI({ zipCode: '75201', enabled: true })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should not auto-search when enabled is false', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse)
      });

      renderHook(() => 
        useElectricityPlansAPI({ zipCode: '75201', enabled: false })
      );

      // Wait a bit to ensure no request is made
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should not auto-search when zipCode is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse)
      });

      renderHook(() => 
        useElectricityPlansAPI({ zipCode: '', enabled: true })
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Parameter Overrides', () => {
    it('should allow parameter overrides in search function', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse)
      });

      const { result } = renderHook(() => 
        useElectricityPlansAPI({ zipCode: '75201', enabled: false })
      );

      await act(async () => {
        await result.current.search({
          zipCode: '75202',
          usage: 2000,
          filters: { term: 24 }
        });
      });

      const call = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(call[1].body);

      expect(requestBody.zipCode).toBe('75202');
      expect(requestBody.usage).toBe(2000);
      expect(requestBody.filters).toEqual({ term: 24 });
    });
  });

  describe('Request Cancellation', () => {
    it('should cancel previous requests when new search is initiated', async () => {
      const { result } = renderHook(() => 
        useElectricityPlansAPI({ zipCode: '75201', enabled: false })
      );

      // Start first search (don't await)
      act(() => {
        result.current.search();
      });

      // Start second search immediately
      act(() => {
        result.current.search({ zipCode: '75202' });
      });

      expect(mockAbort).toHaveBeenCalledTimes(1);
    });
  });

  describe('Retry Functionality', () => {
    it('should retry failed requests', async () => {
      vi.useFakeTimers();
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse)
      });

      const { result } = renderHook(() => 
        useElectricityPlansAPI({ zipCode: '75201', enabled: false })
      );

      // Initial failed search
      await act(async () => {
        await result.current.search();
      });

      expect(result.current.error).toBe('Network error');

      // Retry
      act(() => {
        result.current.retry();
      });

      // Fast-forward timer
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.plans).toHaveLength(1);
      });

      vi.useRealTimers();
    });
  });

  describe('Loading States', () => {
    it('should set loading states correctly during search', async () => {
      let resolveSearch: (value: any) => void;
      const searchPromise = new Promise(resolve => {
        resolveSearch = resolve;
      });

      mockFetch.mockReturnValueOnce(searchPromise);

      const { result } = renderHook(() => 
        useElectricityPlansAPI({ zipCode: '75201', enabled: false })
      );

      // Start search
      act(() => {
        result.current.search();
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isSearching).toBe(true);

      // Resolve search
      resolveSearch!({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse)
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isSearching).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty API response', async () => {
      const emptyResponse = {
        success: true,
        data: {
          plans: [],
          tdspInfo: mockSuccessResponse.data.tdspInfo,
          searchMeta: {
            ...mockSuccessResponse.data.searchMeta,
            totalPlans: 0,
            filteredPlans: 0
          },
          splitZipInfo: { isMultiTdsp: false }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(emptyResponse)
      });

      const { result } = renderHook(() => 
        useElectricityPlansAPI({ zipCode: '75201', enabled: false })
      );

      await act(async () => {
        await result.current.search();
      });

      expect(result.current.plans).toEqual([]);
      expect(result.current.searchMeta?.totalPlans).toBe(0);
      expect(result.current.hasSearched).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      const { result } = renderHook(() => 
        useElectricityPlansAPI({ zipCode: '75201', enabled: false })
      );

      await act(async () => {
        await result.current.search();
      });

      expect(result.current.error).toBe('Invalid JSON');
      expect(result.current.isLoading).toBe(false);
    });
  });
});