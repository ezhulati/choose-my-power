// Constitutional requirement: All types must support real data, never mock data
// This file defines the real data structures used throughout the application

export interface RealProvider {
  id: string; // MongoDB ObjectId format
  name: string;
  displayName: string;
  logoUrl?: string | null;
  website?: string;
  phoneNumber?: string;
  customerServiceHours?: string;
  businessLicenseNumber?: string;
  isActive: boolean;
  servesResidential: boolean;
  servesCommercial: boolean;
  averageCustomerRating?: number;
  totalReviews?: number;
  description?: string;
  specializations?: string[];
  certifications?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RealCity {
  id: string; // MongoDB ObjectId format
  name: string;
  slug: string; // URL-friendly name
  state: string; // Always 'TX' for Texas
  county: string;
  population: number;
  zipCodes: string[];
  tdsp: RealTDSP;
  coordinates: {
    lat: number;
    lng: number;
  };
  timezone: string;
  isDeregulated: boolean;
  marketEntry: Date; // When deregulation began
  economicProfile: {
    medianHouseholdIncome: number;
    majorIndustries: string[];
    unemploymentRate: number;
  };
  energyProfile: {
    averageMonthlyKwh: number;
    peakDemandMonth: string;
    renewablePercentage: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface RealTDSP {
  id: string;
  name: string; // e.g., "Oncor Electric Delivery"
  dunsNumber: string; // e.g., "103994067400" - Constitutional requirement: Must be real DUNS
  serviceTerritory: string[];
  website?: string;
  phoneNumber?: string;
  emergencyNumber: string;
  serviceTypes: string[];
  connectionFees: {
    residential: number;
    commercial: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface RealPlan {
  id: string; // MongoDB ObjectId - Constitutional requirement: Must be dynamic
  name: string;
  provider: RealProvider;
  tdsp: RealTDSP;
  
  // Rate Structure - Core pricing information
  rateType: 'fixed' | 'variable' | 'indexed';
  rate500Kwh: number; // Cents per kWh at 500 kWh usage
  rate1000Kwh: number; // Cents per kWh at 1000 kWh usage
  rate2000Kwh: number; // Cents per kWh at 2000 kWh usage
  
  // Contract Terms
  termMonths: number; // 1, 3, 6, 12, 24, 36 months
  monthlyFee: number; // Base monthly service fee
  cancellationFee: number;
  connectionFee: number;
  depositRequired: boolean;
  
  // Plan Features
  percentGreen: number; // 0-100% renewable energy content
  isPrepay: boolean;
  isTimeOfUse: boolean; // Different rates by time of day
  requiresAutoPay: boolean;
  requiresPaperlessBilling: boolean;
  
  // Customer Information
  customerRating?: number; // 1-5 stars
  reviewCount?: number;
  customerComplaints?: number; // Per 1000 customers
  
  // Marketing
  headline?: string; // Marketing headline
  specialOffers?: string[];
  promotionalRate?: {
    rate: number;
    duration: number; // months
    conditions: string[];
  };
  
  // Compliance & Regulatory
  esiid: string; // Electric Service Identifier ID - Constitutional requirement: Must be dynamic
  puct: string; // Public Utility Commission of Texas number
  isAvailable: boolean;
  effectiveDate: Date;
  expirationDate?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanFilters {
  rateType?: 'fixed' | 'variable' | 'indexed';
  termMonths?: number[];
  maxMonthlyFee?: number;
  minGreenPercentage?: number;
  maxCancellationFee?: number;
  requiresDeposit?: boolean;
  isPrepay?: boolean;
  isTimeOfUse?: boolean;
  priceRange?: {
    min: number;
    max: number;
  };
  sortBy?: 'rate' | 'greenPercent' | 'customerRating' | 'termLength';
  sortOrder?: 'asc' | 'desc';
}

export interface PlanComparison {
  planIds: string[];
  usageKwh: number; // Monthly usage for comparison
  comparisonMetrics: {
    totalMonthlyCost: number;
    effectiveRate: number;
    greenPercentage: number;
    customerRating?: number;
    contractLength: number;
  }[];
}

// Address Validation Types - Constitutional requirement: Real USPS/ERCOT validation
export interface AddressValidation {
  isValid: boolean;
  standardizedAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    zipPlus4?: string;
  };
  suggestions?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  }[];
  errors?: string[];
  validationType: 'usps' | 'ercot' | 'hybrid';
}

// ESID Lookup Types - Constitutional requirement: Real ERCOT integration
export interface ESIDLookup {
  esiid: string; // 17-digit ERCOT service identifier
  isValid: boolean;
  serviceAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  tdsp: RealTDSP;
  meterType: 'analog' | 'digital' | 'smart';
  serviceStatus: 'active' | 'inactive' | 'pending';
  lastReadDate?: Date;
  averageUsage?: {
    kwh: number;
    period: string;
  };
}

// ZIP Code Validation Types
export interface ZipCodeValidation {
  zipCode: string;
  isValid: boolean;
  isDeregulated: boolean;
  city?: RealCity;
  availablePlansCount?: number;
  tdspInfo?: RealTDSP;
  errors?: string[];
}

// Analytics & Tracking Types
export interface UserInteraction {
  event: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  properties: {
    page?: string;
    planId?: string;
    providerId?: string;
    zipCode?: string;
    city?: string;
    searchTerm?: string;
    filterUsed?: PlanFilters;
    [key: string]: any;
  };
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    cached?: boolean;
    timestamp: Date;
  };
}

// Search and Filtering
export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  filters: any;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Form Validation Types
export interface FormValidationError {
  field: string;
  message: string;
  code: string;
}

export interface FormState<T> {
  data: T;
  errors: FormValidationError[];
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

// Cache and Performance Types
export interface CacheMetadata {
  key: string;
  ttl: number; // Time to live in seconds
  createdAt: Date;
  lastAccessed: Date;
  hitCount: number;
  size: number; // Bytes
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  renderTime: number;
  bundleSize: number;
  cacheHitRate: number;
  memoryUsage: number;
}

// Export all types for easy importing
export type {
  // Core entities
  RealProvider,
  RealCity, 
  RealTDSP,
  RealPlan,
  
  // Filtering and search
  PlanFilters,
  PlanComparison,
  SearchResult,
  
  // Validation
  AddressValidation,
  ESIDLookup,
  ZipCodeValidation,
  
  // API and responses
  APIResponse,
  UserInteraction,
  
  // Forms
  FormValidationError,
  FormState,
  
  // System
  CacheMetadata,
  PerformanceMetrics,
};