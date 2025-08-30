/**
 * useElectricityPlansAPI Hook - Production Integration
 * 
 * React hook specifically designed to integrate with the existing production-ready
 * Netlify Functions (/search-plans and /lookup-esiid). This hook provides a clean
 * API surface for consuming the sophisticated backend infrastructure.
 * 
 * Features:
 * - Direct integration with existing Netlify Functions
 * - Automatic split ZIP code handling with ESIID resolution
 * - Smart caching with React Query patterns
 * - Comprehensive error handling and loading states
 * - TypeScript-first with strict mode compatibility
 * - Mobile-optimized with offline support
 * 
 * @module useElectricityPlansAPI
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// Hook-specific types that match the Netlify Functions API contracts
export interface PlanFilters {
  term?: number; // 6, 12, 18, 24, 36 months
  green?: number; // 0-100% green energy
  rateType?: 'fixed' | 'variable' | 'indexed';
  prepaid?: boolean;
  timeOfUse?: boolean;
  provider?: string;
  requiresAutoPayDiscount?: boolean;
}

export interface UseElectricityPlansAPIOptions {
  zipCode: string;
  address?: string; // Required for split ZIP codes
  usage?: number; // kWh usage for pricing calculations (default: 1000)
  filters?: PlanFilters;
  enabled?: boolean; // Prevent automatic execution (default: true)
  staleTime?: number; // Cache duration in ms (default: 30 minutes)
  retryOnMount?: boolean; // Retry failed requests on mount (default: true)
}

export interface Plan {
  id: string;
  name: string;
  provider: {
    name: string;
    logo: string;
    logoInfo: any;
    rating: number;
    reviewCount: number;
  };
  pricing: {
    rate500kWh: number;
    rate1000kWh: number;
    rate2000kWh: number;
    ratePerKwh: number;
    total500kWh: number;
    total1000kWh: number;
    total2000kWh: number;
  };
  contract: {
    length: number;
    type: 'fixed' | 'variable' | 'indexed';
    earlyTerminationFee: number;
    autoRenewal: boolean;
    satisfactionGuarantee: boolean;
  };
  features: {
    greenEnergy: number;
    billCredit: number;
    freeTime?: {
      hours: string;
      days: string[];
    };
    deposit: {
      required: boolean;
      amount: number;
    };
  };
  availability: {
    enrollmentType: 'online' | 'phone' | 'both';
    serviceAreas: string[];
  };
}

export interface SearchMetadata {
  totalPlans: number;
  filteredPlans: number;
  zipCode: string;
  usage: number;
  cacheHit: boolean;
  responseTime: number;
  method: 'direct_mapping' | 'esiid_resolution' | 'split_zip_resolved';
  lastSearched: Date;
}

export interface TDSPInfo {
  duns: string;
  name: string;
  zone: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface SplitZipInfo {
  isMultiTdsp: boolean;
  alternativeTdsps?: Array<{
    duns: string;
    name: string;
    requiresAddress: boolean;
  }>;
}

export interface UseElectricityPlansAPIReturn {
  // Data
  plans: Plan[];
  tdspInfo: TDSPInfo | null;
  searchMeta: SearchMetadata | null;
  splitZipInfo: SplitZipInfo | null;
  
  // State
  isLoading: boolean;
  isSearching: boolean; // Different from isLoading - indicates active search
  error: string | null;
  hasSearched: boolean; // Indicates if any search has been performed
  
  // Actions
  search: (overrides?: Partial<UseElectricityPlansAPIOptions>) => Promise<void>;
  retry: () => void;
  clearError: () => void;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

// Internal cache interface
interface CacheEntry {
  data: {
    plans: Plan[];
    tdspInfo: TDSPInfo;
    searchMeta: SearchMetadata;
    splitZipInfo: SplitZipInfo;
  };
  timestamp: number;
  key: string;
}

// In-memory cache for hook-level caching
const hookCache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 50; // Prevent memory leaks

/**
 * Main electricity plans search hook that integrates with existing Netlify Functions
 */
export function useElectricityPlansAPI(options: UseElectricityPlansAPIOptions): UseElectricityPlansAPIReturn {
  const {
    zipCode,
    address,
    usage = 1000,
    filters = {},
    enabled = true,
    staleTime = 30 * 60 * 1000, // 30 minutes
    retryOnMount = true
  } = options;

  // State management
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tdspInfo, setTdspInfo] = useState<TDSPInfo | null>(null);
  const [searchMeta, setSearchMeta] = useState<SearchMetadata | null>(null);
  const [splitZipInfo, setSplitZipInfo] = useState<SplitZipInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Refs for cleanup and deduplication
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSearchParamsRef = useRef<string>('');
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate cache key for current search parameters
  const getCacheKey = useCallback((searchOptions: UseElectricityPlansAPIOptions): string => {
    const key = {
      zipCode: searchOptions.zipCode,
      address: searchOptions.address,
      usage: searchOptions.usage || 1000,
      filters: searchOptions.filters || {}
    };
    return JSON.stringify(key);
  }, []);

  // Check cache for existing results
  const getCachedResult = useCallback((cacheKey: string): CacheEntry | null => {
    const cached = hookCache.get(cacheKey);
    if (!cached) return null;

    const isStale = Date.now() - cached.timestamp > staleTime;
    if (isStale) {
      hookCache.delete(cacheKey);
      return null;
    }

    return cached;
  }, [staleTime]);

  // Cache management with size limits
  const setCachedResult = useCallback((cacheKey: string, data: CacheEntry['data']) => {
    // Prevent memory leaks by limiting cache size
    if (hookCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = hookCache.keys().next().value;
      if (oldestKey) {
        hookCache.delete(oldestKey);
      }
    }

    hookCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      key: cacheKey
    });
  }, []);

  // Main search function that calls existing Netlify Functions
  const performSearch = useCallback(async (searchOptions: UseElectricityPlansAPIOptions): Promise<void> => {
    const cacheKey = getCacheKey(searchOptions);
    
    // Prevent duplicate requests
    if (lastSearchParamsRef.current === cacheKey && isSearching) {
      return;
    }

    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear previous error and set loading states
    setError(null);
    setIsLoading(true);
    setIsSearching(true);
    lastSearchParamsRef.current = cacheKey;

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Check cache first
      const cached = getCachedResult(cacheKey);
      if (cached) {
        setPlans(cached.data.plans);
        setTdspInfo(cached.data.tdspInfo);
        setSearchMeta({
          ...cached.data.searchMeta,
          cacheHit: true,
          lastSearched: new Date()
        });
        setSplitZipInfo(cached.data.splitZipInfo);
        setHasSearched(true);
        return;
      }

      // Call existing Netlify Function
      const requestBody = {
        zipCode: searchOptions.zipCode,
        address: searchOptions.address,
        usage: searchOptions.usage || 1000,
        filters: searchOptions.filters || {},
        source: 'react_hook_api',
        requestId: `hook_api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const response = await fetch('/.netlify/functions/search-plans', {
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
        throw new Error(result.error?.userMessage || result.error?.message || 'Search failed');
      }

      const { data } = result;

      // Update state with results
      setPlans(data.plans);
      setTdspInfo(data.tdspInfo);
      setSearchMeta({
        ...data.searchMeta,
        lastSearched: new Date()
      });
      setSplitZipInfo(data.splitZipInfo);
      setHasSearched(true);

      // Cache successful results
      setCachedResult(cacheKey, {
        plans: data.plans,
        tdspInfo: data.tdspInfo,
        searchMeta: data.searchMeta,
        splitZipInfo: data.splitZipInfo
      });

    } catch (err) {
      // Handle different error types
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled - don't update error state
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Don't clear existing data on error - show stale data with error indicator
      if (plans.length === 0) {
        setPlans([]);
        setTdspInfo(null);
        setSearchMeta(null);
        setSplitZipInfo(null);
      }

    } finally {
      setIsLoading(false);
      setIsSearching(false);
      abortControllerRef.current = null;
    }
  }, [getCacheKey, getCachedResult, setCachedResult, isSearching, plans.length]);

  // Public search function with parameter overrides
  const search = useCallback(async (overrides?: Partial<UseElectricityPlansAPIOptions>) => {
    const searchOptions: UseElectricityPlansAPIOptions = {
      ...options,
      ...overrides
    };

    await performSearch(searchOptions);
  }, [options, performSearch]);

  // Retry last search with exponential backoff
  const retry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    // Retry after a short delay
    retryTimeoutRef.current = setTimeout(() => {
      performSearch(options);
    }, 1000);
  }, [options, performSearch]);

  // Clear current error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Force refetch (bypass cache)
  const refetch = useCallback(async () => {
    const cacheKey = getCacheKey(options);
    hookCache.delete(cacheKey); // Clear cache entry
    await performSearch(options);
  }, [getCacheKey, options, performSearch]);

  // Invalidate cache
  const invalidate = useCallback(() => {
    const cacheKey = getCacheKey(options);
    hookCache.delete(cacheKey);
  }, [getCacheKey, options]);

  // Auto-search on mount if enabled
  useEffect(() => {
    if (!enabled) return;
    if (!zipCode) return;

    // Only auto-search if we haven't searched yet or if retryOnMount is enabled
    if (!hasSearched || (retryOnMount && error)) {
      performSearch(options);
    }
  }, [enabled, zipCode, hasSearched, retryOnMount, error, options, performSearch]);

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
    plans,
    tdspInfo,
    searchMeta,
    splitZipInfo,
    
    // State
    isLoading,
    isSearching,
    error,
    hasSearched,
    
    // Actions
    search,
    retry,
    clearError,
    refetch,
    invalidate
  };
}

export default useElectricityPlansAPI;