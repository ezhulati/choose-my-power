// FormInteraction entity model
// Feature: Add Comprehensive ZIP Code Lookup Forms to City Pages

import { z } from 'zod';
import type { FormInteraction, FormAction, DeviceType, FormInteractionEntity } from '../../types/zip-validation';

// Zod schema for FormInteraction validation
export const FormInteractionSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
  zipCode: z.string().max(10, 'ZIP code too long'), // Allow partial/invalid entries
  cityPage: z.string().min(1, 'City page is required'),
  action: z.enum(['focus', 'input', 'submit', 'error', 'redirect']),
  timestamp: z.date(),
  duration: z.number().int().min(0, 'Duration must be non-negative'),
  deviceType: z.enum(['mobile', 'desktop', 'tablet']),
  success: z.boolean(),
  sessionId: z.string().optional()
});

// Database entity schema (snake_case for PostgreSQL)
export const FormInteractionEntitySchema = z.object({
  id: z.string().uuid(),
  zip_code: z.string(),
  city_page: z.string(),
  action: z.enum(['focus', 'input', 'submit', 'error', 'redirect']),
  created_at: z.date(),
  duration: z.number().int().min(0),
  device_type: z.enum(['mobile', 'desktop', 'tablet']),
  success: z.boolean(),
  session_id: z.string().nullable()
});

export class FormInteractionModel {
  constructor(private data: FormInteraction) {}

  static create(data: Omit<FormInteraction, 'id' | 'timestamp'>): FormInteractionModel {
    const formInteraction: FormInteraction = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    // Validate the data
    const validated = FormInteractionSchema.parse(formInteraction);
    return new FormInteractionModel(validated);
  }

  static fromEntity(entity: FormInteractionEntity): FormInteractionModel {
    const data: FormInteraction = {
      id: entity.id,
      zipCode: entity.zip_code,
      cityPage: entity.city_page,
      action: entity.action,
      timestamp: entity.created_at,
      duration: entity.duration,
      deviceType: entity.device_type,
      success: entity.success,
      sessionId: entity.session_id || undefined
    };

    return new FormInteractionModel(data);
  }

  // Getters
  get id(): string {
    return this.data.id;
  }

  get zipCode(): string {
    return this.data.zipCode;
  }

  get cityPage(): string {
    return this.data.cityPage;
  }

  get action(): FormAction {
    return this.data.action;
  }

  get timestamp(): Date {
    return this.data.timestamp;
  }

  get duration(): number {
    return this.data.duration;
  }

  get deviceType(): DeviceType {
    return this.data.deviceType;
  }

  get success(): boolean {
    return this.data.success;
  }

  get sessionId(): string | undefined {
    return this.data.sessionId;
  }

  toJSON(): FormInteraction {
    return { ...this.data };
  }

  toEntity(): FormInteractionEntity {
    return {
      id: this.data.id,
      zip_code: this.data.zipCode,
      city_page: this.data.cityPage,
      action: this.data.action,
      created_at: this.data.timestamp,
      duration: this.data.duration,
      device_type: this.data.deviceType,
      success: this.data.success,
      session_id: this.data.sessionId || null
    };
  }

  // Business logic methods
  isMobileDevice(): boolean {
    return this.data.deviceType === 'mobile';
  }

  isSuccessfulSubmission(): boolean {
    return this.data.action === 'submit' && this.data.success;
  }

  isErrorAction(): boolean {
    return this.data.action === 'error' || !this.data.success;
  }

  getEngagementLevel(): 'low' | 'medium' | 'high' {
    if (this.data.action === 'focus') return 'low';
    if (this.data.action === 'input') return 'medium';
    if (this.data.action === 'submit' || this.data.action === 'redirect') return 'high';
    return 'low';
  }

  getDurationInSeconds(): number {
    return Math.round(this.data.duration / 1000);
  }

  isPartialZipCode(): boolean {
    return this.data.zipCode.length > 0 && this.data.zipCode.length < 5;
  }

  isCompleteZipCode(): boolean {
    return this.data.zipCode.length === 5 && /^\d{5}$/.test(this.data.zipCode);
  }

  // Static factory methods for common interactions
  static createFocusInteraction(data: {
    cityPage: string;
    deviceType: DeviceType;
    sessionId?: string;
  }): FormInteractionModel {
    return this.create({
      ...data,
      zipCode: '',
      action: 'focus',
      duration: 0,
      success: true
    });
  }

  static createInputInteraction(data: {
    zipCode: string;
    cityPage: string;
    duration: number;
    deviceType: DeviceType;
    sessionId?: string;
  }): FormInteractionModel {
    return this.create({
      ...data,
      action: 'input',
      success: true
    });
  }

  static createSubmitInteraction(data: {
    zipCode: string;
    cityPage: string;
    duration: number;
    deviceType: DeviceType;
    success: boolean;
    sessionId?: string;
  }): FormInteractionModel {
    return this.create({
      ...data,
      action: 'submit'
    });
  }

  static createErrorInteraction(data: {
    zipCode: string;
    cityPage: string;
    duration: number;
    deviceType: DeviceType;
    sessionId?: string;
  }): FormInteractionModel {
    return this.create({
      ...data,
      action: 'error',
      success: false
    });
  }

  static createRedirectInteraction(data: {
    zipCode: string;
    cityPage: string;
    duration: number;
    deviceType: DeviceType;
    sessionId?: string;
  }): FormInteractionModel {
    return this.create({
      ...data,
      action: 'redirect',
      success: true
    });
  }

  // Analytics methods
  getAnalyticsData() {
    return {
      interactionId: this.data.id,
      zipCode: this.data.zipCode,
      cityPage: this.data.cityPage,
      action: this.data.action,
      timestamp: this.data.timestamp.toISOString(),
      duration: this.data.duration,
      deviceType: this.data.deviceType,
      success: this.data.success,
      sessionId: this.data.sessionId,
      
      // Computed fields
      engagementLevel: this.getEngagementLevel(),
      durationSeconds: this.getDurationInSeconds(),
      isMobile: this.isMobileDevice(),
      isPartialZip: this.isPartialZipCode(),
      isCompleteZip: this.isCompleteZipCode(),
      isError: this.isErrorAction()
    };
  }

  // Validation methods
  static validateDeviceType(userAgent: string): DeviceType {
    const ua = userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
      return 'mobile';
    }
    
    if (/ipad|tablet/i.test(ua)) {
      return 'tablet';
    }
    
    return 'desktop';
  }

  static validateAction(action: string): FormAction | null {
    const validActions: FormAction[] = ['focus', 'input', 'submit', 'error', 'redirect'];
    return validActions.includes(action as FormAction) ? action as FormAction : null;
  }

  // Performance tracking
  isSlowInteraction(): boolean {
    // Different thresholds based on action type
    switch (this.data.action) {
      case 'focus':
        return this.data.duration > 100; // Should be instant
      case 'input':
        return this.data.duration > 5000; // 5 seconds for typing
      case 'submit':
        return this.data.duration > 3000; // 3 seconds for processing
      default:
        return this.data.duration > 1000;
    }
  }

  // Privacy methods
  getAnonymizedData(): Partial<FormInteraction> {
    return {
      id: this.data.id,
      zipCode: this.data.zipCode.slice(0, 3) + 'XX', // Partial anonymization
      cityPage: this.data.cityPage,
      action: this.data.action,
      timestamp: this.data.timestamp,
      duration: this.data.duration,
      deviceType: this.data.deviceType,
      success: this.data.success
      // sessionId excluded for privacy
    };
  }

  // Aggregation helpers for analytics
  static createAggregationKey(cityPage: string, action: FormAction, deviceType: DeviceType): string {
    return `${cityPage}:${action}:${deviceType}`;
  }

  getAggregationKey(): string {
    return FormInteractionModel.createAggregationKey(
      this.data.cityPage,
      this.data.action,
      this.data.deviceType
    );
  }

  // Time-based methods
  isRecent(minutes: number = 30): boolean {
    const now = new Date();
    const diffMs = now.getTime() - this.data.timestamp.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    return diffMinutes <= minutes;
  }

  getHourOfDay(): number {
    return this.data.timestamp.getHours();
  }

  getDayOfWeek(): number {
    return this.data.timestamp.getDay();
  }

  isWeekend(): boolean {
    const day = this.getDayOfWeek();
    return day === 0 || day === 6; // Sunday or Saturday
  }
}

// Export type guards
export const isFormInteraction = (obj: unknown): obj is FormInteraction => {
  return FormInteractionSchema.safeParse(obj).success;
};

export const isFormInteractionEntity = (obj: unknown): obj is FormInteractionEntity => {
  return FormInteractionEntitySchema.safeParse(obj).success;
};

// Export analytics aggregation types
export interface InteractionMetrics {
  totalInteractions: number;
  successfulSubmissions: number;
  errorRate: number;
  averageDuration: number;
  mobileUsage: number;
  topCityPages: Array<{ cityPage: string; count: number }>;
  hourlyDistribution: Array<{ hour: number; count: number }>;
}