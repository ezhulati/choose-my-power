/**
 * useESIIDLookup Hook Tests - Comprehensive Test Suite
 * 
 * Tests for the ESIID lookup hook that integrates with /lookup-esiid Netlify Function.
 * Covers address resolution, confidence scoring, alternatives handling, etc.
 * 
 * @module useESIIDLookup.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useESIIDLookup } from '../useESIIDLookup';
import type { UseESIIDLookupOptions } from '../useESIIDLookup';

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
const mockESIIDResponse = {
  success: true,
  data: {
    resolution: {
      tdsp: {
        duns: '007924772',
        name: 'Oncor',
        zone: 'North'
      },
      esiid: '10000012345678901',
      confidence: 'high' as const,
      method: 'esiid_lookup' as const,
      address: {
        matched: '123 Main Street, Dallas, TX 75201',
        normalized: '123 Main Street',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75201',
        county: 'Dallas'
      }
    },
    alternatives: [
      {
        tdsp: {
          duns: '1039940674000',
          name: 'TXU'
        },
        esiid: '10000087654321098',
        address: '123 Main Street, Dallas, TX 75201',
        confidence: 'medium' as const
      }
    ],
    apiParams: {
      tdsp_duns: '007924772',
      display_usage: 1000
    },
    splitZipInfo: {
      isKnownSplitZip: true,
      boundaryType: 'street-level' as const,
      notes: 'Street-level boundary between Oncor and TXU territories'
    }
  }
};

const mockErrorResponse = {
  success: false,
  error: {
    code: 'ESIID_LOOKUP_ERROR',
    message: 'Address not found',
    userMessage: 'We could not find this address in our database. Please check the address and try again.',
    retryable: true
  }
};

const mockFallbackResponse = {
  success: true,
  data: {
    resolution: {
      tdsp: {
        duns: '007924772',
        name: 'Oncor',
        zone: 'North'
      },
      esiid: 'unknown',
      confidence: 'low' as const,
      method: 'multiple_results' as const,
      address: {
        matched: '123 Main Street',
        normalized: '123 Main Street',
        city: 'Unknown',
        state: 'TX',
        zipCode: '75034'
      }
    },
    alternatives: [],
    apiParams: {
      tdsp_duns: '007924772',
      display_usage: 1000
    },
    splitZipInfo: {
      isKnownSplitZip: true,
      boundaryType: 'zip4-level' as const
    }
  }
};

describe('useESIIDLookup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    mockAbort.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Basic Hook Functionality', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main St', 
          zipCode: '75034',
          enabled: false 
        })
      );

      expect(result.current.resolution).toBeNull();
      expect(result.current.alternatives).toEqual([]);
      expect(result.current.apiParams).toBeNull();
      expect(result.current.splitZipInfo).toBeNull();
      expect(result.current.isLookingUp).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasLooked).toBe(false);
    });

    it('should provide all expected methods', () => {
      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main St', 
          zipCode: '75034',
          enabled: false 
        })
      );

      expect(typeof result.current.lookup).toBe('function');
      expect(typeof result.current.selectAlternative).toBe('function');
      expect(typeof result.current.retry).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.refetch).toBe('function');
      expect(typeof result.current.invalidate).toBe('function');
    });
  });

  describe('Successful ESIID Lookup', () => {
    it('should successfully lookup ESIID for valid address', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockESIIDResponse)
      });

      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main Street', 
          zipCode: '75201',
          enabled: false 
        })
      );

      await act(async () => {
        await result.current.lookup();
      });

      await waitFor(() => {
        expect(result.current.isLookingUp).toBe(false);
      });

      expect(result.current.resolution).toEqual(mockESIIDResponse.data.resolution);
      expect(result.current.alternatives).toEqual(mockESIIDResponse.data.alternatives);
      expect(result.current.apiParams).toEqual(mockESIIDResponse.data.apiParams);
      expect(result.current.splitZipInfo).toEqual(mockESIIDResponse.data.splitZipInfo);
      expect(result.current.hasLooked).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockESIIDResponse)
      });

      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main Street', 
          zipCode: '75201',
          usage: 1500,
          returnAlternatives: true,
          enabled: false 
        })
      );

      await act(async () => {
        await result.current.lookup();
      });

      expect(mockFetch).toHaveBeenCalledWith('/.netlify/functions/lookup-esiid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          address: '123 Main Street',
          zipCode: '75201',
          usage: 1500,
          returnAlternatives: true,
          source: 'react_hook',
          requestId: expect.stringMatching(/^esiid_hook_\d+_/)
        }),
        signal: expect.any(Object)
      });
    });

    it('should handle fallback response for split ZIPs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFallbackResponse)
      });

      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main Street', 
          zipCode: '75034',
          enabled: false 
        })
      );

      await act(async () => {
        await result.current.lookup();
      });

      await waitFor(() => {
        expect(result.current.resolution?.confidence).toBe('low');
        expect(result.current.resolution?.method).toBe('multiple_results');
        expect(result.current.resolution?.esiid).toBe('unknown');
      });
    });
  });

  describe('Input Validation', () => {
    it('should validate address length', async () => {
      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: 'abc', 
          zipCode: '75201',
          enabled: false 
        })
      );

      await act(async () => {
        await result.current.lookup();
      });

      expect(result.current.error).toBe('Address must be at least 5 characters');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should validate ZIP code format', async () => {
      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main Street', 
          zipCode: '1234',
          enabled: false 
        })
      );

      await act(async () => {
        await result.current.lookup();
      });

      expect(result.current.error).toBe('ZIP code must be a 5-digit number');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '', 
          zipCode: '',
          enabled: false 
        })
      );

      await act(async () => {
        await result.current.lookup();
      });

      expect(result.current.error).toBe('Address and ZIP code are required for ESIID lookup');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockErrorResponse)
      });

      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '999 Nonexistent St', 
          zipCode: '75201',
          enabled: false 
        })
      );

      await act(async () => {
        await result.current.lookup();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('We could not find this address in our database. Please check the address and try again.');
        expect(result.current.resolution).toBeNull();
        expect(result.current.isLookingUp).toBe(false);
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main Street', 
          zipCode: '75201',
          enabled: false 
        })
      );

      await act(async () => {
        await result.current.lookup();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
        expect(result.current.isLookingUp).toBe(false);
      });
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main Street', 
          zipCode: '75201',
          enabled: false 
        })
      );

      await act(async () => {
        await result.current.lookup();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('HTTP 429: Too Many Requests');
        expect(result.current.isLookingUp).toBe(false);
      });
    });

    it('should clear errors when clearError is called', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main Street', 
          zipCode: '75201',
          enabled: false 
        })
      );

      await act(async () => {
        await result.current.lookup();
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

  describe('Alternative Selection', () => {
    it('should select alternative TDSP', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockESIIDResponse)
      });

      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main Street', 
          zipCode: '75201',
          enabled: false 
        })
      );

      await act(async () => {
        await result.current.lookup();
      });

      // Select alternative
      act(() => {
        result.current.selectAlternative('1039940674000');
      });

      expect(result.current.resolution?.tdsp.duns).toBe('1039940674000');
      expect(result.current.resolution?.tdsp.name).toBe('TXU');
      expect(result.current.resolution?.esiid).toBe('10000087654321098');
      expect(result.current.resolution?.confidence).toBe('medium');
      expect(result.current.resolution?.method).toBe('multiple_results');
      expect(result.current.apiParams?.tdsp_duns).toBe('1039940674000');
    });

    it('should handle selecting non-existent alternative', () => {
      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main Street', 
          zipCode: '75201',
          enabled: false 
        })
      );

      // Try to select alternative without any data
      act(() => {
        result.current.selectAlternative('nonexistent');
      });

      expect(result.current.resolution).toBeNull();
    });
  });

  describe('Caching Functionality', () => {
    it('should use cached results for identical lookups', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockESIIDResponse)
      });

      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main Street', 
          zipCode: '75201',
          enabled: false 
        })
      );

      // First lookup
      await act(async () => {
        await result.current.lookup();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second identical lookup should use cache
      await act(async () => {
        await result.current.lookup();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('should bypass cache when refetch is called', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockESIIDResponse)
      });

      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main Street', 
          zipCode: '75201',
          enabled: false 
        })
      );

      // First lookup
      await act(async () => {
        await result.current.lookup();
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
        json: () => Promise.resolve(mockESIIDResponse)
      });

      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main Street', 
          zipCode: '75201',
          enabled: false 
        })
      );

      // First lookup
      await act(async () => {
        await result.current.lookup();
      });

      // Invalidate cache
      act(() => {
        result.current.invalidate();
      });

      // Next lookup should hit API again
      await act(async () => {
        await result.current.lookup();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Auto-lookup Functionality', () => {
    it('should auto-lookup when enabled and valid inputs provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockESIIDResponse)
      });

      renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main Street', 
          zipCode: '75201',
          enabled: true 
        })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should not auto-lookup when enabled is false', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockESIIDResponse)
      });

      renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main Street', 
          zipCode: '75201',
          enabled: false 
        })
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should not auto-lookup when address is too short', async () => {
      renderHook(() => 
        useESIIDLookup({ 
          address: 'abc', 
          zipCode: '75201',
          enabled: true 
        })
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Parameter Overrides', () => {
    it('should allow parameter overrides in lookup function', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockESIIDResponse)
      });

      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main Street', 
          zipCode: '75201',
          enabled: false 
        })
      );

      await act(async () => {
        await result.current.lookup({
          address: '456 Oak Street',
          usage: 2000,
          returnAlternatives: false
        });
      });

      const call = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(call[1].body);

      expect(requestBody.address).toBe('456 Oak Street');
      expect(requestBody.usage).toBe(2000);
      expect(requestBody.returnAlternatives).toBe(false);
    });
  });

  describe('Request Cancellation', () => {
    it('should cancel previous requests when new lookup is initiated', async () => {
      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main Street', 
          zipCode: '75201',
          enabled: false 
        })
      );

      // Start first lookup (don't await)
      act(() => {
        result.current.lookup();
      });

      // Start second lookup immediately
      act(() => {
        result.current.lookup({ address: '456 Oak Street' });
      });

      expect(mockAbort).toHaveBeenCalledTimes(1);
    });
  });

  describe('Retry Functionality', () => {
    it('should retry failed lookups', async () => {
      vi.useFakeTimers();
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockESIIDResponse)
      });

      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main Street', 
          zipCode: '75201',
          enabled: false 
        })
      );

      // Initial failed lookup
      await act(async () => {
        await result.current.lookup();
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
        expect(result.current.resolution).toEqual(mockESIIDResponse.data.resolution);
      });

      vi.useRealTimers();
    });
  });

  describe('Loading States', () => {
    it('should set loading states correctly during lookup', async () => {
      let resolveLookup: (value: any) => void;
      const lookupPromise = new Promise(resolve => {
        resolveLookup = resolve;
      });

      mockFetch.mockReturnValueOnce(lookupPromise);

      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main Street', 
          zipCode: '75201',
          enabled: false 
        })
      );

      // Start lookup
      act(() => {
        result.current.lookup();
      });

      // Should be looking up
      expect(result.current.isLookingUp).toBe(true);

      // Resolve lookup
      resolveLookup!({
        ok: true,
        json: () => Promise.resolve(mockESIIDResponse)
      });

      await waitFor(() => {
        expect(result.current.isLookingUp).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty alternatives array', async () => {
      const responseWithoutAlternatives = {
        ...mockESIIDResponse,
        data: {
          ...mockESIIDResponse.data,
          alternatives: []
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseWithoutAlternatives)
      });

      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main Street', 
          zipCode: '75201',
          enabled: false 
        })
      );

      await act(async () => {
        await result.current.lookup();
      });

      expect(result.current.alternatives).toEqual([]);
      expect(result.current.resolution).toEqual(responseWithoutAlternatives.data.resolution);
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      const { result } = renderHook(() => 
        useESIIDLookup({ 
          address: '123 Main Street', 
          zipCode: '75201',
          enabled: false 
        })
      );

      await act(async () => {
        await result.current.lookup();
      });

      expect(result.current.error).toBe('Invalid JSON');
      expect(result.current.isLookingUp).toBe(false);
    });
  });
});