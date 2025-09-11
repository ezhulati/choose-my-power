// ZIP Code Validation Types for ChooseMyPower
// Feature: Add Comprehensive ZIP Code Lookup Forms to City Pages

export interface ZIPCodeLookup {
  id: string;
  zipCode: string;
  citySlug: string;
  timestamp: Date;
  isValid: boolean;
  tdspId: string | null;
  redirectUrl: string | null;
  errorCode: string | null;
  userAgent: string;
  sessionId: string;
}

export interface ZIPValidationResult {
  zipCode: string;
  isValid: boolean;
  tdsp: string | null;
  citySlug: string | null;
  redirectUrl: string | null;
  availablePlans: number;
  errorMessage: string | null;
  suggestions: string[];
}

export interface FormInteraction {
  id: string;
  zipCode: string;
  cityPage: string;
  action: FormAction;
  timestamp: Date;
  duration: number;
  deviceType: DeviceType;
  success: boolean;
  sessionId?: string;
}

export type FormAction = 'focus' | 'input' | 'submit' | 'error' | 'redirect';
export type DeviceType = 'mobile' | 'desktop' | 'tablet';

export interface ZIPValidationRequest {
  zipCode: string;
  citySlug: string;
  sessionId?: string;
}

export interface CityZipCodesResponse {
  citySlug: string;
  cityName: string;
  zipCodes: Array<{
    zipCode: string;
    tdsp: string;
    planCount: number;
  }>;
  totalZipCodes: number;
}

export interface FormInteractionRequest {
  zipCode: string;
  cityPage: string;
  action: FormAction;
  timestamp?: string;
  duration: number;
  deviceType: DeviceType;
  sessionId?: string;
  success: boolean;
}

export interface APIErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Form validation schemas
export interface ZIPFormData {
  zipCode: string;
}

export interface ZIPFormErrors {
  zipCode?: string;
  general?: string;
}

// Component props
export interface ZIPCodeLookupFormProps {
  citySlug: string;
  cityName: string;
  validZipCodes?: string[];
  onSubmit?: (data: ZIPFormData) => Promise<void>;
  onInteraction?: (interaction: Omit<FormInteraction, 'id' | 'timestamp'>) => void;
  className?: string;
}

// Service interfaces
export interface ZIPValidationService {
  validateZipCode(request: ZIPValidationRequest): Promise<ZIPValidationResult>;
  getCityZipCodes(citySlug: string): Promise<CityZipCodesResponse>;
}

export interface AnalyticsService {
  trackFormInteraction(interaction: FormInteractionRequest): Promise<void>;
  getInteractionMetrics(citySlug: string, dateRange?: [Date, Date]): Promise<Record<string, unknown>>;
}

// Cache interfaces
export interface ZIPCache {
  getValidationResult(zipCode: string): Promise<ZIPValidationResult | null>;
  setValidationResult(zipCode: string, result: ZIPValidationResult, ttl?: number): Promise<void>;
  getCityZipCodes(citySlug: string): Promise<string[] | null>;
  setCityZipCodes(citySlug: string, zipCodes: string[], ttl?: number): Promise<void>;
}

// Database entity interfaces
export interface ZIPCodeLookupEntity {
  id: string;
  zip_code: string;
  city_slug: string;
  created_at: Date;
  is_valid: boolean;
  tdsp_id: string | null;
  redirect_url: string | null;
  error_code: string | null;
  user_agent: string;
  session_id: string;
}

export interface FormInteractionEntity {
  id: string;
  zip_code: string;
  city_page: string;
  action: FormAction;
  created_at: Date;
  duration: number;
  device_type: DeviceType;
  success: boolean;
  session_id: string | null;
}

// Constants
export const ZIP_CODE_REGEX = /^\d{5}$/;
export const TEXAS_ZIPS_RANGE = { min: 73000, max: 79999 };

export const ERROR_CODES = {
  INVALID_FORMAT: 'INVALID_ZIP_FORMAT',
  NOT_IN_TEXAS: 'ZIP_NOT_IN_TEXAS',
  NO_TDSP_MAPPING: 'NO_TDSP_MAPPING',
  NO_PLANS_AVAILABLE: 'NO_PLANS_AVAILABLE',
  ERCOT_API_ERROR: 'ERCOT_API_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  VALIDATION_FAILED: 'VALIDATION_FAILED'
} as const;

export const SUCCESS_MESSAGES = {
  ZIP_VALID: 'ZIP code validated successfully',
  REDIRECT_SAME_CITY: 'Plans found for your ZIP code',
  REDIRECT_DIFFERENT_CITY: 'Redirecting to correct city for your ZIP code'
} as const;