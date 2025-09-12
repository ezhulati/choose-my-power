// T010: API response types
// Response types for plans API endpoints and analytics integration

import type { ElectricityPlan } from './electricity-plan';
import type { PlanFilter } from './plan-filter';
import type { CostAnalysis, FeatureComparison } from './comparison-state';

// Plans List API Response (/api/plans/list)
export interface PlansListResponse {
  plans: ElectricityPlan[];
  totalCount: number;
  filterCounts: FilterCounts;
  appliedFilters: PlanFilter;
  responseTime: number;
}

export interface FilterCounts {
  [filterKey: string]: number;
  // Examples:
  // "12-month": 23,
  // "24-month": 18,
  // "fixed-rate": 35,
  // "reliant-energy": 12
}

// Plans Compare API Response (/api/plans/compare)
export interface PlansCompareResponse {
  comparisonData: ElectricityPlan[];
  costAnalysis: CostAnalysis;
  featureMatrix: FeatureComparison[];
  recommendation?: PlanRecommendation;
  responseTime: number;
}

export interface PlanRecommendation {
  recommendedPlanId: string;
  reasons: string[];
  confidenceScore: number; // 0-1
  savingsHighlight?: {
    annualSavings: number;
    percentageSavings: number;
  };
}

// Plans Suggestions API Response (/api/plans/suggestions)
export interface PlansSuggestionsResponse {
  suggestions: FilterSuggestion[];
  alternativeFilters: Partial<PlanFilter>;
  nearbyOptions: ElectricityPlan[]; // Up to 5 closest matching plans
}

export interface FilterSuggestion {
  filterCategory: keyof PlanFilter;
  suggestion: string;
  expectedResults: number;
  priority: 'high' | 'medium' | 'low';
  action?: 'increase' | 'decrease' | 'remove' | 'add';
}

// Analytics API Request/Response (/api/analytics/filter-interaction)
export interface AnalyticsRequest {
  sessionId: string;
  filterType: string;
  filterValue: string;
  resultCount: number;
  responseTime: number;
  timestamp: string; // ISO date string
  userAgent?: string;
  additionalData?: Record<string, unknown>;
}

export interface AnalyticsResponse {
  recorded: boolean;
  sessionId: string;
  eventId?: string;
}

// Generic API Error Response
export interface APIError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
  timestamp: string;
  suggestions?: string[];
}

// API Request Parameters Types

// Plans List Request Parameters
export interface PlansListParams {
  city: string;
  zipCode?: string;
  contractLengths?: number[];
  rateTypes?: ('fixed' | 'variable' | 'indexed')[];
  minRate?: number;
  maxRate?: number;
  providers?: string[];
  minGreenEnergy?: number;
  sortBy?: 'price' | 'rating' | 'contract' | 'provider' | 'green';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  // Additional filter parameters as needed
}

// Plans Compare Request Parameters  
export interface PlansCompareParams {
  planIds: string[]; // 2-4 plan IDs
  focusAreas?: ('price' | 'features' | 'contract' | 'green' | 'provider')[];
  usageKwh?: number; // Default 1000
}

// Plans Suggestions Request Parameters
export interface PlansSuggestionsParams {
  currentFilters: string; // JSON-encoded PlanFilter
  city: string;
}

// Service Response Wrapper
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: {
    timestamp: string;
    requestId: string;
    cacheHit?: boolean;
    executionTime: number;
  };
}

// Constitutional compliance validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PlanIdValidation extends ValidationResult {
  planId: string;
  isMongoObjectId: boolean;
  existsInDatabase: boolean;
}

// Performance monitoring types
export interface PerformanceMetrics {
  requestTime: number;
  databaseQueryTime?: number;
  cacheHitRate?: number;
  filteringTime?: number;
  serializationTime?: number;
}

export interface PerformanceThresholds {
  maxRequestTime: number; // 300ms for filters
  maxPageLoadTime: number; // 2000ms for pages
  minPageSpeedScore: number; // 90+ for both mobile/desktop
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitExceeded extends APIError {
  rateLimitInfo: RateLimitInfo;
}

// Cache-related types
export interface CacheInfo {
  key: string;
  hit: boolean;
  ttl?: number; // Time to live in seconds
  generatedAt?: string;
}

export interface CachedResponse<T> {
  data: T;
  cacheInfo: CacheInfo;
}

// Health check types for monitoring
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceStatus;
    cache: ServiceStatus;
    externalAPIs: ServiceStatus;
  };
  performance: {
    averageResponseTime: number;
    errorRate: number; // Percentage
    uptime: number; // Percentage
  };
}

export interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastChecked: string;
  error?: string;
}

// Utility type helpers
export type APIEndpoint = 
  | '/api/plans/list'
  | '/api/plans/compare'
  | '/api/plans/suggestions'
  | '/api/analytics/filter-interaction';

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface APIRequest<TParams = Record<string, unknown>> {
  endpoint: APIEndpoint;
  method: HTTPMethod;
  params?: TParams;
  headers?: Record<string, string>;
}

// Type guards for runtime validation
export const isPlansListResponse = (obj: unknown): obj is PlansListResponse => {
  return obj && 
         Array.isArray(obj.plans) && 
         typeof obj.totalCount === 'number' && 
         typeof obj.filterCounts === 'object' &&
         typeof obj.appliedFilters === 'object' &&
         typeof obj.responseTime === 'number';
};

export const isAPIError = (obj: unknown): obj is APIError => {
  return obj && 
         typeof obj.error === 'string' && 
         typeof obj.code === 'string' && 
         typeof obj.timestamp === 'string';
};

export const isValidPlanIds = (planIds: unknown): planIds is string[] => {
  return Array.isArray(planIds) && 
         planIds.length >= 2 && 
         planIds.length <= 4 && 
         planIds.every((id: unknown) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id));
};