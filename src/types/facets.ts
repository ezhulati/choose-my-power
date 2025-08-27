// Core type definitions for faceted navigation system
// This file defines the data structures for the entire faceted navigation implementation

export interface FacetedUrl {
  city: string;
  filters: string[];
  apiParams: ApiParams;
}

export interface ApiParams {
  tdsp_duns: string;
  term?: number;
  percent_green?: number;
  is_pre_pay?: boolean;
  is_time_of_use?: boolean;
  requires_auto_pay?: boolean;
  display_usage?: number;
  brand_id?: string;
}

export interface Plan {
  id: string;
  name: string;
  provider: {
    name: string;
    logo: string;
    logoInfo?: {
      name: string;
      logoUrl: string;
      logoFilename: string;
      puctNumber: string;
    } | null;
    rating: number;
    reviewCount: number;
  };
  pricing: {
    rate500kWh: number;
    rate1000kWh: number;
    rate2000kWh: number;
    ratePerKwh: number;
    total500kWh?: number;
    total1000kWh?: number;
    total2000kWh?: number;
  };
  contract: {
    length: number; // months
    type: 'fixed' | 'variable' | 'indexed';
    earlyTerminationFee: number;
    autoRenewal: boolean;
    satisfactionGuarantee: boolean;
  };
  features: {
    greenEnergy: number; // percentage
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

export interface TdspMapping {
  [citySlug: string]: {
    duns: string;
    name: string;
    zone: 'North' | 'Coast' | 'Central' | 'South' | 'Valley';
  };
}

export interface FilterMapping {
  term: Record<string, string>;
  rate_type: Record<string, string>;
  green_energy: Record<string, string>;
  plan_features: Record<string, string>;
}

export interface FacetedMeta {
  title: string;
  description: string;
  h1: string;
  categoryContent: string;
  footerContent: string;
  schema: object[];
}

export interface FacetedMetaOptions {
  city: string;
  filters: string[];
  planCount: number;
  lowestRate: number;
  location: string;
}

export interface CachedResponse {
  data: Plan[];
  timestamp: number;
}

export interface SchemaData {
  city: string;
  filters: string[];
  planCount: number;
  lowestRate: number;
  location: string;
  h1: string;
  description: string;
  plans: Plan[];
}

export interface FacetedPageData {
  city: string;
  filters: string[];
  planCount: number;
  lowestRate: number;
  tdspZone: string;
  canonicalSelf: boolean;
}

// Utility types for component props
export interface FacetedSidebarProps {
  currentFilters: string[];
  availableFilters: AvailableFilter[];
  planCounts: Record<string, number>;
}

export interface AvailableFilter {
  type: 'term' | 'rate_type' | 'green_energy' | 'plan_features';
  value: string;
  label: string;
  count: number;
  url: string;
}

export interface FacetedPlanGridProps {
  plans: Plan[];
  city: string;
  filters: string[];
}

export interface InternalLinkingProps {
  currentCity: string;
  currentFilters: string[];
  planCount: number;
}

export interface CategoryLink {
  url: string;
  text: string;
  count: number | null;
}

// Constants for validation
export const MAX_FILTER_DEPTH = 3;
export const SUPPORTED_FILTER_TYPES = ['term', 'rate_type', 'green_energy', 'plan_features'] as const;
export const CACHE_TTL = {
  API_RESPONSE: 3600000, // 1 hour
  PAGE_RENDER: 1800000,  // 30 minutes
  STATIC_CONTENT: 86400000, // 24 hours
} as const;

export type SupportedFilterType = typeof SUPPORTED_FILTER_TYPES[number];