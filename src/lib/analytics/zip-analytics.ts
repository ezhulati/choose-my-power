/**
 * ZIP Code Analytics Service
 * Tracks ZIP code lookup patterns, performance metrics, and user behavior
 */

export interface ZipLookupEvent {
  zipCode: string;
  city?: string;
  success: boolean;
  errorType?: string;
  method: 'homepage' | 'smart_input' | 'mobile_input' | 'search_component';
  processingTime?: number;
  userAgent?: string;
  timestamp: number;
  sessionId?: string;
}

export interface ZipAnalytics {
  totalLookups: number;
  successfulLookups: number;
  municipalUtilityLookups: number;
  notFoundLookups: number;
  averageProcessingTime: number;
  topZipCodes: Array<{ zipCode: string; count: number; city?: string }>;
  topCities: Array<{ city: string; count: number }>;
  errorBreakdown: Record<string, number>;
  methodBreakdown: Record<string, number>;
  dailyStats: Array<{ date: string; lookups: number; success: number }>;
}

class ZipAnalyticsService {
  private events: ZipLookupEvent[] = [];
  private readonly MAX_EVENTS = 10000; // Keep last 10k events in memory
  private readonly STORAGE_KEY = 'zip_analytics_events';
  private readonly BATCH_SIZE = 50;
  private pendingEvents: ZipLookupEvent[] = [];
  
  constructor() {
    this.loadEventsFromStorage();
    
    // Periodically save analytics data
    if (typeof window !== 'undefined') {
      setInterval(() => this.persistEvents(), 30000); // Save every 30 seconds
    }
  }

  /**
   * Track a ZIP code lookup event
   */
  trackLookup(event: Omit<ZipLookupEvent, 'timestamp' | 'sessionId'>): void {
    const fullEvent: ZipLookupEvent = {
      ...event,
      timestamp: Date.now(),
      sessionId: this.getSessionId()
    };

    this.events.push(fullEvent);
    this.pendingEvents.push(fullEvent);

    // Maintain memory limit
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Log significant events
    if (!fullEvent.success) {
      console.warn('ZIP lookup failed:', {
        zipCode: fullEvent.zipCode,
        errorType: fullEvent.errorType,
        method: fullEvent.method
      });
    }

    // Batch persist when enough events accumulate
    if (this.pendingEvents.length >= this.BATCH_SIZE) {
      this.persistEvents();
    }
  }

  /**
   * Track successful ZIP to city resolution
   */
  trackSuccess(zipCode: string, city: string, method: ZipLookupEvent['method'], processingTime?: number): void {
    this.trackLookup({
      zipCode,
      city,
      success: true,
      method,
      processingTime,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    });
  }

  /**
   * Track failed ZIP lookup
   */
  trackError(zipCode: string, errorType: string, method: ZipLookupEvent['method'], processingTime?: number): void {
    this.trackLookup({
      zipCode,
      success: false,
      errorType,
      method,
      processingTime,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    });
  }

  /**
   * Generate analytics report
   */
  generateReport(days: number = 30): ZipAnalytics {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentEvents = this.events.filter(event => event.timestamp >= cutoffTime);

    const totalLookups = recentEvents.length;
    const successfulEvents = recentEvents.filter(e => e.success);
    const municipalEvents = recentEvents.filter(e => e.errorType === 'non_deregulated');
    const notFoundEvents = recentEvents.filter(e => e.errorType === 'not_found');

    // Calculate average processing time
    const processingTimes = recentEvents
      .filter(e => e.processingTime)
      .map(e => e.processingTime!);
    const averageProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
      : 0;

    // Top ZIP codes
    const zipCodeCounts = new Map<string, { count: number; city?: string }>();
    recentEvents.forEach(event => {
      const current = zipCodeCounts.get(event.zipCode) || { count: 0 };
      zipCodeCounts.set(event.zipCode, {
        count: current.count + 1,
        city: event.city || current.city
      });
    });

    const topZipCodes = Array.from(zipCodeCounts.entries())
      .map(([zipCode, data]) => ({ zipCode, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Top cities
    const cityCounts = new Map<string, number>();
    successfulEvents.forEach(event => {
      if (event.city) {
        cityCounts.set(event.city, (cityCounts.get(event.city) || 0) + 1);
      }
    });

    const topCities = Array.from(cityCounts.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Error breakdown
    const errorBreakdown: Record<string, number> = {};
    recentEvents
      .filter(e => !e.success && e.errorType)
      .forEach(event => {
        errorBreakdown[event.errorType!] = (errorBreakdown[event.errorType!] || 0) + 1;
      });

    // Method breakdown
    const methodBreakdown: Record<string, number> = {};
    recentEvents.forEach(event => {
      methodBreakdown[event.method] = (methodBreakdown[event.method] || 0) + 1;
    });

    // Daily stats for the last 30 days
    const dailyStats: Array<{ date: string; lookups: number; success: number }> = [];
    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEvents = recentEvents.filter(event => {
        const eventDate = new Date(event.timestamp).toISOString().split('T')[0];
        return eventDate === dateStr;
      });

      dailyStats.push({
        date: dateStr,
        lookups: dayEvents.length,
        success: dayEvents.filter(e => e.success).length
      });
    }

    return {
      totalLookups,
      successfulLookups: successfulEvents.length,
      municipalUtilityLookups: municipalEvents.length,
      notFoundLookups: notFoundEvents.length,
      averageProcessingTime,
      topZipCodes,
      topCities,
      errorBreakdown,
      methodBreakdown,
      dailyStats: dailyStats.reverse()
    };
  }

  /**
   * Get popular ZIP codes for autocomplete suggestions
   */
  getPopularZipCodes(limit: number = 10): string[] {
    const zipCodeCounts = new Map<string, number>();
    
    // Use successful lookups from last 7 days
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentEvents = this.events
      .filter(event => event.timestamp >= cutoffTime && event.success)
      .forEach(event => {
        zipCodeCounts.set(event.zipCode, (zipCodeCounts.get(event.zipCode) || 0) + 1);
      });

    return Array.from(zipCodeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([zipCode]) => zipCode);
  }

  /**
   * Clear all analytics data
   */
  clearData(): void {
    this.events = [];
    this.pendingEvents = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Export analytics data for external analysis
   */
  exportData(): ZipLookupEvent[] {
    return [...this.events];
  }

  // Private methods

  private getSessionId(): string {
    if (typeof sessionStorage === 'undefined') return 'server';
    
    let sessionId = sessionStorage.getItem('zip_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('zip_session_id', sessionId);
    }
    return sessionId;
  }

  private loadEventsFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.events = parsed.slice(-this.MAX_EVENTS);
        }
      }
    } catch (error) {
      console.warn('Failed to load analytics from storage:', error);
    }
  }

  private persistEvents(): void {
    if (typeof localStorage === 'undefined' || this.pendingEvents.length === 0) return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events));
      this.pendingEvents = [];
    } catch (error) {
      console.warn('Failed to persist analytics:', error);
      // Clear oldest events if storage is full
      this.events = this.events.slice(-Math.floor(this.MAX_EVENTS * 0.8));
    }
  }
}

// Singleton instance
export const zipAnalytics = new ZipAnalyticsService();

// Convenience functions
export const trackZipSuccess = (zipCode: string, city: string, method: ZipLookupEvent['method'], processingTime?: number) =>
  zipAnalytics.trackSuccess(zipCode, city, method, processingTime);

export const trackZipError = (zipCode: string, errorType: string, method: ZipLookupEvent['method'], processingTime?: number) =>
  zipAnalytics.trackError(zipCode, errorType, method, processingTime);

export const getZipAnalytics = (days?: number) =>
  zipAnalytics.generateReport(days);

export const getPopularZips = (limit?: number) =>
  zipAnalytics.getPopularZipCodes(limit);