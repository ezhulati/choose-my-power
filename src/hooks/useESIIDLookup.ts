/**
 * useESIIDLookup Hook - Production Integration
 * 
 * React hook for address-to-ESIID resolution specifically designed for split ZIP codes.
 * Integrates with the existing production-ready /lookup-esiid Netlify Function.
 * 
 * Features:
 * - Direct integration with existing /lookup-esiid Netlify Function
 * - Address normalization and validation
 * - Confidence scoring for resolution results
 * - Smart caching for repeated lookups
 * - Error handling with fallback strategies
 * - TypeScript-first with strict mode compatibility
 * 
 * @module useESIIDLookup
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ApiParams } from '../types/facets';

// Hook-specific types that match the /lookup-esiid API contract
export interface UseESIIDLookupOptions {
  address: string;
  zipCode: string;
  usage?: number; // Optional: for API parameter building
  enabled?: boolean; // Prevent automatic execution (default: true)
  staleTime?: number; // Cache duration in ms (default: 15 minutes)
  returnAlternatives?: boolean; // Include alternative TDSPs in response
}

export interface ESIIDResolution {
  tdsp: {
    duns: string;
    name: string;
    zone: string;
  };
  esiid: string;
  confidence: 'high' | 'medium' | 'low';
  method: 'esiid_lookup' | 'single_result' | 'multiple_results';
  address: {
    matched: string;
    normalized: string;
    city: string;
    state: string;
    zipCode: string;
    county?: string;
  };
}

export interface TDSPAlternative {
  tdsp: {
    duns: string;
    name: string;
  };
  esiid: string;
  address: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface SplitZipInfo {
  isKnownSplitZip: boolean;
  boundaryType?: 'street-level' | 'block-level' | 'zip4-level';
  notes?: string;
}

export interface UseESIIDLookupReturn {
  // Data
  resolution: ESIIDResolution | null;
  alternatives: TDSPAlternative[];
  apiParams: ApiParams | null; // Ready-to-use parameters for plan search
  splitZipInfo: SplitZipInfo | null;
  
  // State
  isLookingUp: boolean;
  error: string | null;
  hasLooked: boolean; // Indicates if any lookup has been performed
  
  // Actions
  lookup: (overrides?: Partial<UseESIIDLookupOptions>) => Promise<void>;
  selectAlternative: (tdsp: string) => void;
  retry: () => void;
  clearError: () => void;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

// Internal cache interface
interface CacheEntry {
  data: {
    resolution: ESIIDResolution;
    alternatives: TDSPAlternative[];
    apiParams: ApiParams;
    splitZipInfo: SplitZipInfo;
  };
  timestamp: number;
  key: string;
}

// In-memory cache for hook-level caching
const esiidCache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 25; // Smaller cache for ESIID lookups

/**
 * ESIID lookup hook for address resolution in split ZIP codes
 */
export function useESIIDLookup(options: UseESIIDLookupOptions): UseESIIDLookupReturn {
  const {
    address,
    zipCode,
    usage = 1000,
    enabled = true,
    staleTime = 15 * 60 * 1000, // 15 minutes (shorter than plans cache)
    returnAlternatives = true
  } = options;

  // State management
  const [resolution, setResolution] = useState<ESIIDResolution | null>(null);
  const [alternatives, setAlternatives] = useState<TDSPAlternative[]>([]);
  const [apiParams, setApiParams] = useState<ApiParams | null>(null);
  const [splitZipInfo, setSplitZipInfo] = useState<SplitZipInfo | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLooked, setHasLooked] = useState(false);

  // Refs for cleanup and deduplication
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastLookupParamsRef = useRef<string>('');
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate cache key for current lookup parameters
  const getCacheKey = useCallback((lookupOptions: UseESIIDLookupOptions): string => {
    const key = {
      address: lookupOptions.address.trim().toLowerCase(),
      zipCode: lookupOptions.zipCode,
      usage: lookupOptions.usage || 1000,
      returnAlternatives: lookupOptions.returnAlternatives
    };
    return JSON.stringify(key);
  }, []);

  // Check cache for existing results
  const getCachedResult = useCallback((cacheKey: string): CacheEntry | null => {
    const cached = esiidCache.get(cacheKey);
    if (!cached) return null;

    const isStale = Date.now() - cached.timestamp > staleTime;
    if (isStale) {
      esiidCache.delete(cacheKey);
      return null;
    }

    return cached;
  }, [staleTime]);

  // Cache management with size limits
  const setCachedResult = useCallback((cacheKey: string, data: CacheEntry['data']) => {
    // Prevent memory leaks by limiting cache size
    if (esiidCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = esiidCache.keys().next().value;
      if (oldestKey) {
        esiidCache.delete(oldestKey);
      }
    }

    esiidCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      key: cacheKey
    });
  }, []);

  // Main lookup function that calls existing Netlify Function
  const performLookup = useCallback(async (lookupOptions: UseESIIDLookupOptions): Promise<void> => {
    const cacheKey = getCacheKey(lookupOptions);
    
    // Prevent duplicate requests
    if (lastLookupParamsRef.current === cacheKey && isLookingUp) {
      return;
    }

    // Validate inputs
    if (!lookupOptions.address || !lookupOptions.zipCode) {
      setError('Address and ZIP code are required for ESIID lookup');
      return;
    }

    if (lookupOptions.address.trim().length < 5) {
      setError('Address must be at least 5 characters');
      return;
    }

    if (!/^\d{5}$/.test(lookupOptions.zipCode)) {
      setError('ZIP code must be a 5-digit number');
      return;
    }

    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear previous error and set loading state
    setError(null);
    setIsLookingUp(true);
    lastLookupParamsRef.current = cacheKey;

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Check cache first
      const cached = getCachedResult(cacheKey);
      if (cached) {
        setResolution(cached.data.resolution);
        setAlternatives(cached.data.alternatives);
        setApiParams(cached.data.apiParams);
        setSplitZipInfo(cached.data.splitZipInfo);
        setHasLooked(true);
        return;
      }

      // Call existing Netlify Function
      const requestBody = {
        address: lookupOptions.address.trim(),
        zipCode: lookupOptions.zipCode,
        usage: lookupOptions.usage || 1000,
        returnAlternatives: lookupOptions.returnAlternatives,
        source: 'react_hook',
        requestId: `esiid_hook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const response = await fetch('/.netlify/functions/lookup-esiid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Handle API errors
      if (!result.success) {
        throw new Error(result.error?.userMessage || result.error?.message || 'ESIID lookup failed');
      }

      const { data } = result;

      // Update state with results
      setResolution(data.resolution);
      setAlternatives(data.alternatives || []);
      setApiParams(data.apiParams);
      setSplitZipInfo(data.splitZipInfo);
      setHasLooked(true);

      // Cache successful results
      setCachedResult(cacheKey, {
        resolution: data.resolution,
        alternatives: data.alternatives || [],
        apiParams: data.apiParams,
        splitZipInfo: data.splitZipInfo
      });

    } catch (err) {
      // Handle different error types
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled - don't update error state
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred during ESIID lookup';
      setError(errorMessage);
      
      // Clear existing data on error for ESIID lookups (unlike plan searches)
      setResolution(null);
      setAlternatives([]);
      setApiParams(null);
      setSplitZipInfo(null);

    } finally {
      setIsLookingUp(false);
      abortControllerRef.current = null;
    }
  }, [getCacheKey, getCachedResult, setCachedResult, isLookingUp]);

  // Public lookup function with parameter overrides
  const lookup = useCallback(async (overrides?: Partial<UseESIIDLookupOptions>) => {
    const lookupOptions: UseESIIDLookupOptions = {
      ...options,
      ...overrides
    };

    await performLookup(lookupOptions);
  }, [options, performLookup]);

  // Select an alternative TDSP (useful for user choice in UI)
  const selectAlternative = useCallback((tdspDuns: string) => {
    const selectedAlt = alternatives.find(alt => alt.tdsp.duns === tdspDuns);
    if (selectedAlt && resolution) {
      // Update resolution with selected alternative
      setResolution({
        ...resolution,
        tdsp: {
          ...selectedAlt.tdsp,
          zone: resolution.tdsp.zone // Keep zone from original resolution
        },
        esiid: selectedAlt.esiid,
        confidence: selectedAlt.confidence,
        method: 'multiple_results'
      });

      // Update API params
      setApiParams(prev => prev ? {
        ...prev,
        tdsp_duns: selectedAlt.tdsp.duns
      } : null);
    }
  }, [alternatives, resolution]);

  // Retry last lookup with exponential backoff
  const retry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    // Retry after a short delay
    retryTimeoutRef.current = setTimeout(() => {
      performLookup(options);
    }, 1000);
  }, [options, performLookup]);

  // Clear current error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Force refetch (bypass cache)
  const refetch = useCallback(async () => {
    const cacheKey = getCacheKey(options);
    esiidCache.delete(cacheKey); // Clear cache entry
    await performLookup(options);
  }, [getCacheKey, options, performLookup]);

  // Invalidate cache
  const invalidate = useCallback(() => {
    const cacheKey = getCacheKey(options);
    esiidCache.delete(cacheKey);
  }, [getCacheKey, options]);

  // Auto-lookup on mount if enabled
  useEffect(() => {
    if (!enabled) return;
    if (!address || !zipCode) return;

    // Only auto-lookup if we haven't looked yet and address is valid
    if (!hasLooked && address.trim().length >= 5) {
      performLookup(options);
    }
  }, [enabled, address, zipCode, hasLooked, options, performLookup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Data
    resolution,
    alternatives,
    apiParams,
    splitZipInfo,
    
    // State
    isLookingUp,
    error,
    hasLooked,
    
    // Actions
    lookup,
    selectAlternative,
    retry,
    clearError,
    refetch,
    invalidate
  };
}

export default useESIIDLookup;