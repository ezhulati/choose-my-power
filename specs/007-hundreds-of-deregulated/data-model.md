# Data Model: Texas ZIP Code Coverage

**Phase**: 1 - Design & Contracts  
**Date**: September 9, 2025  
**Status**: Complete

## Core Entities

### 1. ZIPCodeMapping
**Purpose**: Primary entity linking ZIP codes to cities and service territories

**Fields**:
```typescript
interface ZIPCodeMapping {
  id: string;                    // Primary key: UUID
  zipCode: string;               // 5-digit ZIP code (indexed)
  citySlug: string;              // City identifier (e.g., "dallas", "houston")
  cityDisplayName: string;       // Human-readable city name (e.g., "Dallas, TX")
  tdspDuns: string;              // TDSP identifier (e.g., "1039940674000")
  tdspName: string;              // TDSP display name (e.g., "Oncor Electric Delivery")
  serviceType: ServiceType;      // deregulated | municipal | cooperative | regulated
  isActive: boolean;             // Whether ZIP code mapping is currently valid
  lastValidated: Date;           // Last validation against external sources
  dataSource: DataSource;       // Which external source provided this mapping
  confidence: number;            // Confidence score (0-100) based on source validation
  createdAt: Date;
  updatedAt: Date;
}
```

**Validation Rules**:
- `zipCode`: Must match `/^\d{5}$/` (exactly 5 digits)
- `zipCode`: Must be in Texas range (73000-79999)
- `citySlug`: Must be valid slug format (`/^[a-z0-9\-]+$/`)
- `tdspDuns`: Must be valid DUNS number format
- `serviceType`: Must be one of enum values
- `confidence`: Must be between 0-100

**Indexes**:
- Primary: `zipCode` (unique)
- Secondary: `citySlug` (non-unique)
- Secondary: `tdspDuns` (non-unique)
- Composite: `(serviceType, isActive)` for filtering

### 2. CityTerritory
**Purpose**: City-level information and territory definitions

**Fields**:
```typescript
interface CityTerritory {
  id: string;                    // Primary key: UUID
  citySlug: string;              // Unique city identifier (indexed)
  cityDisplayName: string;       // Full display name with state
  primaryTdsp: string;           // Primary TDSP DUNS for this city
  serviceType: ServiceType;      // Deregulation status
  zipCodes: string[];            // Array of ZIP codes in this territory
  planCount: number;             // Number of available electricity plans
  isActive: boolean;             // Whether city is currently served
  lastUpdated: Date;             // Last data refresh
  coordinates: {                 // City center coordinates
    latitude: number;
    longitude: number;
  };
  metadata: {
    population?: number;
    averageRate?: number;        // Average electricity rate ¢/kWh
    competitivePlans?: number;   // Number of competitive plans
  };
}
```

**Relationships**:
- One-to-many with ZIPCodeMapping (`citySlug`)
- Many-to-one with TDSPInfo (`primaryTdsp`)

### 3. TDSPInfo
**Purpose**: Transmission and Distribution Service Provider details

**Fields**:
```typescript
interface TDSPInfo {
  duns: string;                  // Primary key: DUNS number
  name: string;                  // Official TDSP name
  zone: string;                  // Geographic zone (North, South, Central, Coast)
  serviceArea: string[];         // List of cities served
  apiEndpoint?: string;          // TDSP API for territory validation
  isActive: boolean;             // Currently operating status
  lastUpdated: Date;
  contactInfo: {
    website?: string;
    phone?: string;
    serviceTerritory?: string;   // URL for territory maps
  };
}
```

**Static Data** (5 major TDSPs):
- Oncor Electric Delivery (`1039940674000`)
- CenterPoint Energy Houston Electric (`957877905`)
- AEP Texas North Company (`007923311`)
- AEP Texas Central Company (`007924772`)
- Texas-New Mexico Power Company (`007929441`)

### 4. DataSource
**Purpose**: External data source tracking and validation

**Fields**:
```typescript
interface DataSource {
  id: string;                    // Primary key: UUID
  name: string;                  // Data source name (e.g., "ERCOT_MIS")
  type: SourceType;              // api | file | manual
  endpoint?: string;             // API endpoint URL
  lastSync: Date;                // Last successful data sync
  nextSync: Date;                // Scheduled next sync
  isActive: boolean;             // Whether source is currently used
  priority: number;              // Source priority for conflict resolution (1-10)
  rateLimits: {
    requestsPerHour: number;
    requestsPerDay: number;
  };
  syncStatus: SyncStatus;        // success | error | in_progress | scheduled
  errorDetails?: string;         // Last error message if sync failed
}
```

### 5. ValidationLog
**Purpose**: Audit trail for ZIP code validation and updates

**Fields**:
```typescript
interface ValidationLog {
  id: string;                    // Primary key: UUID
  zipCode: string;               // ZIP code being validated
  validationType: ValidationType; // lookup | sync | manual | conflict_resolution
  dataSource: string;            // Source that provided the data
  result: ValidationResult;      // success | error | conflict | no_change
  oldValue?: Partial<ZIPCodeMapping>; // Previous values (for updates)
  newValue?: Partial<ZIPCodeMapping>; // New values
  conflictSources?: string[];    // Sources that disagreed (for conflicts)
  resolvedBy?: string;           // How conflict was resolved
  timestamp: Date;
  processingTime: number;        // Milliseconds taken for validation
  userAgent?: string;            // If triggered by user request
}
```

## Enums

### ServiceType
```typescript
enum ServiceType {
  DEREGULATED = "deregulated",     // Customer choice available
  MUNICIPAL = "municipal",         // Municipal utility (no choice)
  COOPERATIVE = "cooperative",     // Electric cooperative (limited choice)
  REGULATED = "regulated"          // Traditional regulated utility
}
```

### SourceType
```typescript
enum SourceType {
  API = "api",                     // Real-time API integration
  FILE = "file",                   // Bulk file download
  MANUAL = "manual"                // Manually entered data
}
```

### SyncStatus
```typescript
enum SyncStatus {
  SUCCESS = "success",
  ERROR = "error",
  IN_PROGRESS = "in_progress",
  SCHEDULED = "scheduled"
}
```

### ValidationType
```typescript
enum ValidationType {
  LOOKUP = "lookup",               // User ZIP code lookup
  SYNC = "sync",                   // Scheduled data sync
  MANUAL = "manual",               // Manual data entry
  CONFLICT_RESOLUTION = "conflict_resolution" // Resolving data conflicts
}
```

### ValidationResult
```typescript
enum ValidationResult {
  SUCCESS = "success",
  ERROR = "error", 
  CONFLICT = "conflict",           // Multiple sources disagree
  NO_CHANGE = "no_change"          // Data unchanged after validation
}
```

## State Transitions

### ZIP Code Mapping Lifecycle
1. **Discovery**: ZIP code identified from external source
2. **Validation**: Cross-checked against multiple sources
3. **Active**: Validated and available for user lookups
4. **Conflict**: Sources disagree, requires resolution
5. **Deprecated**: ZIP code boundary changed or discontinued
6. **Archived**: Historical record, no longer active

### Data Sync Process
1. **Scheduled**: Sync job scheduled for execution
2. **In Progress**: Data collection and processing active
3. **Validation**: Cross-referencing with existing data
4. **Conflict Detection**: Identifying discrepancies
5. **Resolution**: Automated or manual conflict resolution
6. **Success**: Data updated and available
7. **Error**: Sync failed, retry scheduled

## Performance Considerations

### Database Optimization
- **Primary Lookups**: Index on `zipCode` for O(1) user lookups
- **City Filtering**: Index on `(citySlug, isActive)` for city-based queries
- **Territory Queries**: Index on `(tdspDuns, serviceType)` for TDSP-based filtering
- **Date-based Cleanup**: Index on `lastValidated` for maintenance queries

### Caching Strategy
- **Hot ZIP Codes**: Top 1000 most accessed ZIP codes cached in Redis
- **City Territories**: All active cities cached with 24-hour TTL
- **TDSP Info**: Static TDSP data cached permanently with manual refresh
- **Validation Results**: Recent validation results cached for 1 hour

### Data Volume Estimation
- **ZIPCodeMapping**: ~25,000 records (all Texas ZIP codes)
- **CityTerritory**: ~900 records (Texas cities)
- **TDSPInfo**: ~10 records (major TDSPs)
- **DataSource**: ~10 records (external sources)
- **ValidationLog**: ~1M records/month (with rotation)

## Data Migration Strategy

### Phase 1: Base Data Import
1. Import existing 533 ZIP code mappings from current system
2. Validate against external sources
3. Fill gaps for major metropolitan areas (Dallas, Houston, Austin)

### Phase 2: Comprehensive Coverage
1. Bulk import from ERCOT territory data (~20,000 ZIP codes)
2. Cross-validate with TDSP APIs
3. Resolve conflicts through automated rules

### Phase 3: Ongoing Maintenance
1. Monthly sync from external sources
2. Real-time validation for user lookups
3. Quarterly accuracy audits

## Constitutional Compliance

### Real Data Architecture ✅
- No hardcoded ZIP codes or mappings
- Dynamic resolution from authoritative sources
- Database-first with JSON fallbacks
- Service layer abstraction for all data access

### Performance Standards ✅
- Database indexes support <200ms lookups
- Caching strategy enables high concurrency
- Background sync minimizes user-facing delays

### Texas Market Integrity ✅
- Accurate TDSP territory mappings
- Proper deregulated vs. regulated classification
- Real-time plan availability determination

## Next Phase: API Contract Design
This data model provides the foundation for Phase 1 API contract generation. Each entity will have corresponding API endpoints for CRUD operations, with specific focus on ZIP code lookup and territory validation endpoints.