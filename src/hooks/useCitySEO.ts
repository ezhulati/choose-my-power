/**
 * React Hook for City SEO Metadata Integration
 * Task T033: Integrate SEO service with city pages
 * Phase 3.5 Polish & Validation: Dynamic SEO metadata loading
 */

import { useState, useEffect } from 'react';
import type { CityPageSEO } from '../lib/seo/zip-navigation-seo';

interface CitySEOParams {
  zipCode: string;
  cityName: string;
  citySlug: string;
  countyName?: string;
  marketZone: 'North' | 'Central' | 'Coast' | 'South' | 'West';
  tdspTerritory?: string;
  planCount?: number;
  avgRate?: number;
  isDeregulated?: boolean;
}

interface CitySEOResult {
  metadata: CityPageSEO | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useCitySEO = (params: CitySEOParams | null): CitySEOResult => {
  const [metadata, setMetadata] = useState<CityPageSEO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSEOMetadata = async () => {
    if (!params) {
      setMetadata(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        zipCode: params.zipCode,
        cityName: params.cityName,
        citySlug: params.citySlug,
        marketZone: params.marketZone,
        ...(params.countyName && { countyName: params.countyName }),
        ...(params.tdspTerritory && { tdspTerritory: params.tdspTerritory }),
        ...(params.planCount !== undefined && { planCount: params.planCount.toString() }),
        ...(params.avgRate !== undefined && { avgRate: params.avgRate.toString() }),
        ...(params.isDeregulated !== undefined && { isDeregulated: params.isDeregulated.toString() })
      });

      const response = await fetch(`/api/seo/city-metadata?${queryParams}`);
      const data = await response.json();

      if (data.success && data.data?.metadata) {
        setMetadata(data.data.metadata);
      } else {
        throw new Error(data.error?.message || 'Failed to load SEO metadata');
      }
    } catch (err) {
      console.error('[useCitySEO] Error fetching SEO metadata:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setMetadata(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSEOMetadata();
  }, [
    params?.zipCode,
    params?.cityName,
    params?.citySlug,
    params?.marketZone,
    params?.countyName,
    params?.tdspTerritory,
    params?.planCount,
    params?.avgRate,
    params?.isDeregulated
  ]);

  return {
    metadata,
    loading,
    error,
    refresh: fetchSEOMetadata
  };
};

// Hook for ZIP lookup SEO metadata
interface ZIPLookupSEOResult {
  metadata: Partial<CityPageSEO> | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useZIPLookupSEO = (zipCode: string | null): ZIPLookupSEOResult => {
  const [metadata, setMetadata] = useState<Partial<CityPageSEO> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchZIPSEOMetadata = async () => {
    if (!zipCode || !/^\d{5}$/.test(zipCode)) {
      setMetadata(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/seo/zip-lookup?zipCode=${zipCode}`);
      const data = await response.json();

      if (data.success && data.data?.metadata) {
        setMetadata(data.data.metadata);
      } else {
        throw new Error(data.error?.message || 'Failed to load ZIP lookup SEO metadata');
      }
    } catch (err) {
      console.error('[useZIPLookupSEO] Error fetching ZIP SEO metadata:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setMetadata(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZIPSEOMetadata();
  }, [zipCode]);

  return {
    metadata,
    loading,
    error,
    refresh: fetchZIPSEOMetadata
  };
};

// Hook for bulk SEO metadata generation
interface BulkSEOParams {
  cities: CitySEOParams[];
}

interface BulkSEOResult {
  results: Array<{
    citySlug: string;
    success: boolean;
    metadata?: CityPageSEO;
    error?: string;
  }>;
  loading: boolean;
  error: string | null;
  processed: number;
  successful: number;
  failed: number;
}

export const useBulkCitySEO = (): [
  (params: BulkSEOParams) => Promise<void>,
  BulkSEOResult
] => {
  const [results, setResults] = useState<BulkSEOResult['results']>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ processed: 0, successful: 0, failed: 0 });

  const generateBulkSEO = async (params: BulkSEOParams) => {
    setLoading(true);
    setError(null);
    setResults([]);
    setStats({ processed: 0, successful: 0, failed: 0 });

    try {
      const response = await fetch('/api/seo/city-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cities: params.cities })
      });

      const data = await response.json();

      if (data.success && data.data?.results) {
        setResults(data.data.results);
        setStats({
          processed: data.data.processed || 0,
          successful: data.data.successful || 0,
          failed: data.data.failed || 0
        });
      } else {
        throw new Error(data.error?.message || 'Failed to generate bulk SEO metadata');
      }
    } catch (err) {
      console.error('[useBulkCitySEO] Error generating bulk SEO metadata:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return [
    generateBulkSEO,
    {
      results,
      loading,
      error,
      ...stats
    }
  ];
};