# Phase 1: Data Model Design
**Feature**: Advanced Texas Electricity Plans Listing & Comparison Page  
**Date**: January 9, 2025  
**Status**: Complete

## Core Entities

### 1. ElectricityPlan (Extended from existing service layer)

**Purpose**: Central entity representing available electricity plans with comprehensive plan details and pricing information.

**Data Structure**:
```typescript
interface ElectricityPlan {
  // Core Plan Identity (Constitutional: Dynamic IDs only)
  id: string                    // MongoDB ObjectId from generated data
  planName: string             // Human-readable plan name
  providerName: string         // Electricity provider company name
  
  // Pricing Information (Transparent display requirement FR-009)
  baseRate: number             // Rate per kWh in cents
  rateType: 'fixed' | 'variable' | 'indexed'
  contractLength: number       // Contract length in months
  monthlyFee: number          // Monthly service charge
  connectionFee: number       // One-time connection fee
  earlyTerminationFee: number // ETF amount
  estimatedMonthlyCost: number // Calculated for average usage
  
  // Plan Features (Filtering requirements FR-002)
  greenEnergyPercentage: number // Renewable energy percentage
  planFeatures: string[]       // Plan-specific features array
  planType: string            // e.g., "Basic", "Premium", "Green"
  promotionalOffers: string[] // Limited-time offers
  
  // Service Information
  serviceArea: string[]       // ZIP codes served
  tdspTerritory: string      // Transmission service provider
  availability: 'active' | 'limited' | 'discontinued'
  lastUpdated: Date          // Data freshness tracking
  
  // Provider Details (Supporting comparison FR-003)
  providerRating: number     // Customer satisfaction rating
  customerServiceHours: string
  paymentOptions: string[]
  
  // Calculated Fields (Performance optimization)
  totalFirstYearCost: number // Including all fees and estimates
  averageRateIncludingFees: number // Effective rate calculation
}
```

**Validation Rules** (from functional requirements):
- `id` must be valid MongoDB ObjectId (constitutional compliance)
- `baseRate` must be positive number with max 2 decimal places
- `contractLength` must be 1, 6, 12, 24, or 36 months
- `greenEnergyPercentage` must be 0-100
- `serviceArea` must contain valid Texas ZIP codes
- `availability` determines display in listings (FR-010)

**Relationships**:
- Many-to-one with Provider entity
- Many-to-many with ServiceTerritory via ZIP codes
- One-to-many with ComparisonSelections

### 2. PlanFilter (URL-persistent filter state)

**Purpose**: User-selectable criteria for narrowing plan options with URL persistence for SEO and sharing.

**Data Structure**:
```typescript
interface PlanFilter {
  // Location Context (Service area determination)
  city: string                // Current city context
  zipCode?: string           // Optional ZIP for precise filtering
  tdspTerritory?: string     // Utility territory filter
  
  // Plan Characteristics (Real-time filtering FR-002)
  contractLengths: number[]  // [1, 6, 12, 24, 36] months
  rateTypes: RateType[]     // fixed, variable, indexed
  
  // Pricing Filters
  minRate?: number          // Minimum rate per kWh
  maxRate?: number          // Maximum rate per kWh
  maxMonthlyFee?: number    // Monthly fee ceiling
  includePromotions: boolean // Include promotional offers
  
  // Feature Filters
  minGreenEnergy?: number    // Minimum renewable percentage
  requiredFeatures: string[] // Must-have plan features
  excludeEarlyTerminationFee: boolean
  
  // Provider Filters
  selectedProviders: string[] // Provider name array
  minProviderRating?: number  // Minimum customer rating
  
  // Sort Options (FR-006)
  sortBy: 'price' | 'rating' | 'contract' | 'provider' | 'green'
  sortOrder: 'asc' | 'desc'
  
  // UI State
  activeFiltersCount: number  // Count display (FR-004)
  lastApplied: Date          // Filter application timestamp
}
```

**State Management**:
- URL serialization: `/plans?contract=12&rate=fixed&provider=reliant`
- Session persistence during browsing
- Real-time updates with debounced API calls
- Filter count indicators for user feedback

**Validation Rules**:
- Contract lengths must be supported values only
- Price ranges must be positive numbers
- Provider names must match existing providers
- At least one filter category must have selection

### 3. ComparisonState (Session-based comparison management)

**Purpose**: Manages side-by-side plan comparison selections with session state persistence.

**Data Structure**:
```typescript
interface ComparisonState {
  // Selected Plans (Maximum 4 per FR-003)
  selectedPlans: string[]    // Array of plan IDs (max 4)
  comparisonData: ElectricityPlan[] // Full plan details for comparison
  
  // Comparison Configuration
  focusAreas: ComparisonFocus[] // User-selected comparison priorities
  showDifferencesOnly: boolean  // Highlight differences vs. show all
  
  // Session Management
  sessionId: string          // Browser session identifier
  createdAt: Date           // Comparison start time
  lastModified: Date        // Last selection change
  
  // Comparison Calculations
  costComparison: CostAnalysis // Side-by-side cost breakdown
  featureMatrix: FeatureComparison[] // Feature availability matrix
  recommendedChoice?: string  // AI-powered recommendation
}

interface ComparisonFocus {
  category: 'price' | 'features' | 'contract' | 'green' | 'provider'
  weight: number  // User priority weighting 1-5
}

interface CostAnalysis {
  monthlyEstimates: number[]  // Monthly cost for each plan
  firstYearTotal: number[]    // Total first year including fees
  averageRate: number[]       // Effective rate per kWh
  savingsVsFirst: number[]    // Savings compared to most expensive
}

interface FeatureComparison {
  featureName: string
  planAvailability: boolean[] // True/false for each selected plan
  importance: 'high' | 'medium' | 'low' // Feature importance ranking
}
```

**Business Rules**:
- Maximum 4 plans in comparison (specification requirement)
- Session storage cleared after 24 hours of inactivity
- Comparison data refreshed if plan information updates
- Cost calculations include all fees and promotional adjustments

### 4. UserPreferences (Session preferences and analytics)

**Purpose**: Tracks user behavior and preferences for optimization and analytics integration.

**Data Structure**:
```typescript
interface UserPreferences {
  // Session Context
  sessionId: string
  userId?: string            // Optional if logged in
  ipAddress: string         // For geographic insights
  
  // Behavioral Tracking (Analytics integration)
  filterInteractions: FilterInteraction[]
  comparisonBehavior: ComparisonBehavior[]
  searchPatterns: SearchPattern[]
  
  // Preference Learning
  preferredSortOrder: SortPreference
  frequentFilters: string[]  // Commonly used filter combinations
  priceRangeHistory: number[] // Previous price range selections
  
  // Performance Metrics
  sessionDuration: number    // Time spent on plans page
  filterResponseTimes: number[] // Track <300ms requirement
  planDetailViews: string[]  // Plans viewed in detail
  
  // Conversion Tracking
  planSelected?: string      // Final plan selection
  abandonmentPoint?: string  // Where user left if no selection
  conversionTime?: number    // Time from arrival to selection
}

interface FilterInteraction {
  filterType: string
  filterValue: string
  timestamp: Date
  resultCount: number        // Plans matching after filter
  responseTime: number       // Milliseconds for filter operation
}

interface ComparisonBehavior {
  plansCompared: string[]
  comparisonDuration: number
  focusAreas: string[]
  finalChoice?: string
}

interface SearchPattern {
  initialFilters: PlanFilter
  filterProgression: FilterInteraction[]
  searchSuccess: boolean     // Found acceptable plan
  abandonmentReason?: string
}
```

**Analytics Integration**:
- Real-time behavioral tracking via existing analytics service
- Performance monitoring for constitutional compliance
- User journey optimization data collection
- A/B testing support for filter interface improvements

## Data Relationships

### Primary Relationships:
1. **ElectricityPlan** ↔ **PlanFilter**: Many-to-many filtering relationship
2. **ElectricityPlan** ↔ **ComparisonState**: Selected plans for comparison
3. **UserPreferences** ↔ **PlanFilter**: Behavioral learning and optimization
4. **UserPreferences** ↔ **ComparisonState**: Comparison behavior tracking

### Service Layer Integration:
- **ElectricityPlan** sourced from `getPlansForCity()` service
- **Provider data** from `getProviders()` service
- **Geographic data** from `getCities()` and existing TDSP mapping
- **Real-time updates** through existing service layer with Redis caching

## State Management Architecture

### Client-Side State:
- **React State**: Component-level UI state (loading, errors, selections)
- **URL State**: Filter parameters for SEO and sharing
- **Session Storage**: Comparison selections and user preferences
- **Local Storage**: Long-term user preferences and cached filter options

### Server-Side State:
- **Database**: Persistent plan data from PostgreSQL
- **Redis Cache**: Filtered results and frequently accessed data
- **Session Store**: User behavior tracking and analytics
- **API State**: Real-time plan availability and pricing updates

## Performance Optimization

### Data Loading Strategy:
- **Initial Load**: 50+ plans with essential data only
- **Lazy Loading**: Detailed plan information on demand
- **Prefetching**: Likely filter combinations based on user patterns
- **Caching**: Redis cache with 24-hour TTL for plan data

### Filtering Performance:
- **Server-Side**: Initial filtering with database queries
- **Client-Side**: Immediate UI updates with cached data
- **Debouncing**: 250ms delay for rapid filter changes
- **Index Optimization**: Database indexes on frequently filtered fields

### Comparison Performance:
- **Session Cache**: Selected plans cached in browser session
- **Calculation Cache**: Cost analysis cached until plan data changes
- **Progressive Loading**: Load comparison data as plans are selected
- **Mobile Optimization**: Simplified comparison view for small screens

## Validation & Error Handling

### Data Validation:
- **Plan ID Validation**: MongoDB ObjectId format verification
- **Price Validation**: Positive numbers with appropriate ranges
- **Date Validation**: Valid date formats and reasonable ranges
- **Geographic Validation**: Valid Texas ZIP codes and cities

### Error Scenarios:
- **No Plans Found**: Smart filter suggestions and filter reset options
- **Service Unavailable**: Graceful fallback to cached data
- **Invalid Filters**: Clear error messages with correction guidance
- **Comparison Limit**: User-friendly messaging when 4-plan limit reached

### Constitutional Compliance:
- **No Hardcoded IDs**: All plan and provider IDs dynamically resolved
- **Real Data Only**: No mock data fallbacks, service layer only
- **Performance Gates**: <300ms filter operations, <2s page loads
- **Accessibility**: WCAG 2.1 AA compliance for all data displays

## Ready for API Contract Generation
Data model complete with comprehensive entity definitions, relationships, and performance optimization strategies. All entities align with functional requirements and constitutional principles.