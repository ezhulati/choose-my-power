// T009: UserPreferences interface
// Session preferences and analytics for optimization

import type { PlanFilter, SortOption } from './plan-filter';

export interface UserPreferences {
  // Session Context
  sessionId: string;
  userId?: string;            // Optional if logged in
  ipAddress: string;         // For geographic insights
  
  // Behavioral Tracking (Analytics integration)
  filterInteractions: FilterInteraction[];
  comparisonBehavior: ComparisonBehavior[];
  searchPatterns: SearchPattern[];
  
  // Preference Learning
  preferredSortOrder: SortPreference;
  frequentFilters: string[];  // Commonly used filter combinations
  priceRangeHistory: number[]; // Previous price range selections
  
  // Performance Metrics
  sessionDuration: number;    // Time spent on plans page
  filterResponseTimes: number[]; // Track <300ms requirement
  planDetailViews: string[];  // Plans viewed in detail
  
  // Conversion Tracking
  planSelected?: string;      // Final plan selection
  abandonmentPoint?: string;  // Where user left if no selection
  conversionTime?: number;    // Time from arrival to selection
}

export interface FilterInteraction {
  filterType: string;
  filterValue: string;
  timestamp: Date;
  resultCount: number;        // Plans matching after filter
  responseTime: number;       // Milliseconds for filter operation
}

export interface ComparisonBehavior {
  plansCompared: string[];
  comparisonDuration: number;
  focusAreas: string[];
  finalChoice?: string;
}

export interface SearchPattern {
  initialFilters: PlanFilter;
  filterProgression: FilterInteraction[];
  searchSuccess: boolean;     // Found acceptable plan
  abandonmentReason?: string;
}

export interface SortPreference {
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  frequency: number;          // How often this sort is used
}

// Analytics event types
export type AnalyticsEventType = 
  | 'filter_applied'
  | 'filter_cleared'
  | 'sort_changed'
  | 'plan_compared'
  | 'plan_selected'
  | 'comparison_viewed'
  | 'session_started'
  | 'session_ended'
  | 'zero_results'
  | 'suggestion_clicked';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: Date;
  sessionId: string;
  data: Record<string, unknown>;
  responseTime?: number;
}

// Default user preferences
export const createDefaultUserPreferences = (sessionId: string, ipAddress: string): UserPreferences => ({
  sessionId,
  ipAddress,
  filterInteractions: [],
  comparisonBehavior: [],
  searchPatterns: [],
  preferredSortOrder: {
    sortBy: 'price',
    sortOrder: 'asc',
    frequency: 0
  },
  frequentFilters: [],
  priceRangeHistory: [],
  sessionDuration: 0,
  filterResponseTimes: [],
  planDetailViews: []
});

// Filter interaction tracking
export const trackFilterInteraction = (
  preferences: UserPreferences,
  filterType: string,
  filterValue: string,
  resultCount: number,
  responseTime: number
): UserPreferences => {
  const interaction: FilterInteraction = {
    filterType,
    filterValue,
    timestamp: new Date(),
    resultCount,
    responseTime
  };
  
  return {
    ...preferences,
    filterInteractions: [...preferences.filterInteractions, interaction],
    filterResponseTimes: [...preferences.filterResponseTimes, responseTime]
  };
};

// Comparison behavior tracking
export const trackComparisonBehavior = (
  preferences: UserPreferences,
  plansCompared: string[],
  duration: number,
  focusAreas: string[],
  finalChoice?: string
): UserPreferences => {
  const behavior: ComparisonBehavior = {
    plansCompared,
    comparisonDuration: duration,
    focusAreas,
    finalChoice
  };
  
  return {
    ...preferences,
    comparisonBehavior: [...preferences.comparisonBehavior, behavior]
  };
};

// Performance metrics analysis
export const getAverageFilterResponseTime = (preferences: UserPreferences): number => {
  if (preferences.filterResponseTimes.length === 0) return 0;
  
  const total = preferences.filterResponseTimes.reduce((sum, time) => sum + time, 0);
  return total / preferences.filterResponseTimes.length;
};

export const getSlowFilterResponses = (preferences: UserPreferences, threshold: number = 300): FilterInteraction[] => {
  return preferences.filterInteractions.filter(interaction => 
    interaction.responseTime > threshold
  );
};

// Frequent filter pattern analysis
export const getMostFrequentFilters = (preferences: UserPreferences): { [key: string]: number } => {
  const filterCounts: { [key: string]: number } = {};
  
  preferences.filterInteractions.forEach(interaction => {
    const key = `${interaction.filterType}:${interaction.filterValue}`;
    filterCounts[key] = (filterCounts[key] || 0) + 1;
  });
  
  return filterCounts;
};

export const updateFrequentFilters = (preferences: UserPreferences): UserPreferences => {
  const filterCounts = getMostFrequentFilters(preferences);
  const sortedFilters = Object.entries(filterCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10) // Top 10 most frequent
    .map(([filter]) => filter);
  
  return {
    ...preferences,
    frequentFilters: sortedFilters
  };
};

// Sort preference tracking
export const updateSortPreference = (
  preferences: UserPreferences,
  sortBy: SortOption,
  sortOrder: 'asc' | 'desc'
): UserPreferences => {
  return {
    ...preferences,
    preferredSortOrder: {
      sortBy,
      sortOrder,
      frequency: preferences.preferredSortOrder.frequency + 1
    }
  };
};

// Session storage helpers
export const USER_PREFERENCES_STORAGE_KEY = 'plans_user_preferences';

export const saveUserPreferencesToSession = (preferences: UserPreferences): void => {
  try {
    sessionStorage.setItem(USER_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Could not save user preferences to session storage:', error);
  }
};

export const loadUserPreferencesFromSession = (): UserPreferences | null => {
  try {
    const stored = sessionStorage.getItem(USER_PREFERENCES_STORAGE_KEY);
    if (!stored) return null;
    
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Could not load user preferences from session storage:', error);
    return null;
  }
};

// Analytics helpers for integration with existing analytics service
export const createAnalyticsEvent = (
  type: AnalyticsEventType,
  sessionId: string,
  data: Record<string, unknown>,
  responseTime?: number
): AnalyticsEvent => ({
  type,
  timestamp: new Date(),
  sessionId,
  data,
  responseTime
});

export const shouldTrackEvent = (type: AnalyticsEventType): boolean => {
  // Filter out high-frequency events that might overwhelm analytics
  const highFrequencyEvents: AnalyticsEventType[] = ['filter_applied'];
  
  // For high-frequency events, use sampling (1 in 10)
  if (highFrequencyEvents.includes(type)) {
    return Math.random() < 0.1;
  }
  
  return true;
};