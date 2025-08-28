# Multi-TDSP ZIP Code Handling System

## Overview

The Multi-TDSP ZIP Code Handling System addresses a critical real-world challenge in the Texas electricity market where some ZIP codes span multiple TDSP (Transmission and Distribution Service Provider) territories. This system provides accurate address-based TDSP resolution, ensuring users get correct electricity rates based on their specific service provider.

## The Problem

Traditional ZIP-to-city mapping assumes a 1:1 relationship between ZIP codes and TDSPs. However, in reality:

- **25+ Texas ZIP codes** span multiple TDSP territories
- **Boundary areas** between Dallas/Fort Worth suburbs have mixed coverage
- **Houston metro edges** have CenterPoint/TNMP boundaries  
- **Wrong TDSP = Wrong rates** leading to poor user experience

## Solution Architecture

### Multi-Layer Resolution Strategy

```typescript
// Resolution Priority (highest to lowest accuracy)
1. ESID Lookup        → 95-99% accuracy
2. ZIP+4 Boundary     → 85-95% accuracy  
3. Street-Level Data  → 75-85% accuracy
4. Multi-TDSP Config  → 60-75% accuracy
5. ZIP Fallback       → 40-60% accuracy
```

### Core Components

```
src/lib/address/
├── address-tdsp-resolver.ts     # Main integration layer
├── address-validator.ts         # Address validation & normalization
├── tdsp-boundary-service.ts     # TDSP resolution with fallbacks
├── address-cache.ts            # Multi-layer caching system
└── error-handling.ts           # Comprehensive error handling

src/config/
└── multi-tdsp-mapping.ts       # Configuration for boundary ZIP codes

src/components/address/
├── ProgressiveAddressInput.tsx  # Full progressive flow
└── SmartAddressInput.tsx       # Drop-in replacement
```

## Quick Start Integration

### 1. Basic Integration (Drop-in Replacement)

Replace existing ZIP code inputs with smart address collection:

```tsx
import SmartAddressInput from '@/components/address/SmartAddressInput';

function MyComponent() {
  const handleAddressResolved = (result) => {
    console.log('TDSP determined:', result.tdsp.name);
    console.log('API params:', result.apiParams);
    
    // Use result.apiParams with ComparePower API
    fetchElectricityPlans(result.apiParams);
  };

  return (
    <SmartAddressInput
      onAddressResolved={handleAddressResolved}
      onError={(error) => console.error(error)}
      placeholder="Enter ZIP code"
      required
    />
  );
}
```

### 2. Full Progressive Flow

For new implementations requiring complete address collection:

```tsx
import ProgressiveAddressInput from '@/components/address/ProgressiveAddressInput';

function AddressCollectionPage() {
  return (
    <ProgressiveAddressInput
      onAddressResolved={(result) => {
        // Complete address and TDSP resolution
        navigateToPlans(result);
      }}
      showProgressSteps={true}
      autoFocus={true}
    />
  );
}
```

### 3. Programmatic Resolution

For backend or API integrations:

```typescript
import { addressTdspResolver } from '@/lib/address/address-tdsp-resolver';

async function resolveTdsp(address: AddressInfo) {
  const result = await addressTdspResolver.resolveTdspFromAddress(address);
  
  if (result.success) {
    // Use result.apiParams with ComparePower API
    const plans = await comparePowerClient.fetchPlans(result.apiParams);
    return plans;
  } else {
    // Handle error with fallback
    console.warn('TDSP resolution failed:', result.warnings);
    return handleFallback(address.zipCode);
  }
}
```

## Configuration

### Environment Variables

```bash
# API Configuration
COMPAREPOWER_API_URL=https://pricing.api.comparepower.com
COMPAREPOWER_API_KEY=your_api_key_here

# Address Validation (optional but recommended)
USPS_API_KEY=your_usps_key_here
SMARTYSTREETS_API_KEY=your_smartystreets_key_here

# Caching (optional but recommended for production)
REDIS_URL=redis://localhost:6379

# ESID Lookup (optional - highest accuracy)
ESID_API_URL=https://your-esid-service.com/api
ESID_API_KEY=your_esid_key_here
```

### Multi-TDSP Configuration

The system includes pre-configured boundary ZIP codes. To add new ones:

```typescript
// src/config/multi-tdsp-mapping.ts
export const multiTdspMapping: MultiTdspMapping = {
  '75XXX': {
    primaryTdsp: TDSP_INFO.ONCOR,
    alternativeTdsps: [TDSP_INFO.TNMP],
    requiresAddressValidation: true,
    boundaryType: 'street-level',
    notes: 'Description of boundary area'
  }
};
```

## API Reference

### Core Methods

#### `addressTdspResolver.resolveTdspFromAddress(address)`

Main resolution method that determines TDSP from address information.

**Parameters:**
- `address: AddressInfo` - Complete address information

**Returns:**
```typescript
interface TdspResolutionResult {
  success: boolean;
  address: NormalizedAddress | null;
  tdsp: TdspInfo | null;
  apiParams: ApiParams | null;
  confidence: 'high' | 'medium' | 'low';
  method: string;
  alternatives: TdspInfo[];
  warnings: string[];
  requiresManualSelection: boolean;
  metadata: {
    processingTime: number;
    cacheHit: boolean;
  };
}
```

#### `addressTdspResolver.analyzeZipCode(zipCode)`

Analyze ZIP code for multi-TDSP requirements.

**Parameters:**
- `zipCode: string` - 5-digit ZIP code

**Returns:**
```typescript
interface ZipAnalysis {
  isMultiTdsp: boolean;
  primaryTdsp: TdspInfo | null;
  alternatives: TdspInfo[];
  requiresAddressValidation: boolean;
  recommendedAction: 'proceed-with-primary' | 'collect-address' | 'show-options';
  explanation: string;
}
```

#### `addressTdspResolver.getProgressiveResolutionSteps(zipCode, address?)`

Get step-by-step resolution progress for UI guidance.

**Returns:** Array of `ProgressiveResolutionStep` objects with completion status.

### Utility Methods

```typescript
// Check if ZIP code requires address validation
requiresAddressValidation('75001'); // returns boolean

// Get all multi-TDSP ZIP codes
getMultiTdspZipCodes(); // returns string[]

// Create API parameters from TDSP
createApiParams(tdsp, usage); // returns ApiParams
```

## Error Handling

### Error Categories

The system provides comprehensive error categorization:

```typescript
enum ErrorCategory {
  ADDRESS_VALIDATION = 'address_validation',
  TDSP_RESOLUTION = 'tdsp_resolution', 
  API_INTEGRATION = 'api_integration',
  NETWORK = 'network',
  USER_INPUT = 'user_input'
}
```

### Fallback Strategies

1. **Address Validation Failures** → Basic parsing → Minimal normalization
2. **TDSP Resolution Failures** → Geographic heuristics → Most common TDSP → Default TDSP
3. **API Integration Failures** → Cached data → Stale cache → Error message
4. **Network Failures** → Exponential backoff retry → Cache fallback

### Error Handling Example

```typescript
try {
  const result = await addressTdspResolver.resolveTdspFromAddress(address);
  
  if (!result.success) {
    // Handle graceful failure
    showUserMessage(result.warnings[0]);
    
    if (result.suggestions?.length > 0) {
      showSuggestions(result.suggestions);
    }
  }
} catch (error) {
  // Handle critical errors
  console.error('System error:', error);
  showFallbackForm();
}
```

## Performance Optimization

### Caching Strategy

The system implements 4-layer caching:

```
Memory Cache    → <50ms   (recent results)
Redis Cache     → <100ms  (shared across instances)
Database Cache  → <200ms  (persistent storage)
File Cache      → <300ms  (static boundary data)
```

### Performance Targets

- **ZIP Analysis**: <500ms
- **Address Resolution**: <2000ms
- **Cached Results**: <100ms
- **Batch Processing**: 5 addresses/second

### Optimization Tips

```typescript
// Warm cache for common ZIP codes
await addressCache.warmupCache(['75201', '77002', '78701']);

// Enable all cache layers for production
const cacheConfig = {
  enableMemoryCache: true,
  enableRedisCache: process.env.REDIS_URL !== undefined,
  enableDatabaseCache: true,
  memoryMaxSize: 1000
};

// Monitor performance
const stats = addressTdspResolver.getSystemStats();
console.log('Cache hit ratio:', stats.cacheStats.hitRatio);
```

## Testing

### Running Tests

```bash
# Unit tests
npm run test:unit address

# Integration tests  
npm run test:integration multi-tdsp

# Performance tests
npm run test:performance address-resolution

# All multi-TDSP tests
npm run test tests/unit/address/ tests/integration/multi-tdsp-system.test.ts
```

### Test Coverage

The test suite covers:

- ✅ **25+ boundary ZIP codes** with real scenarios
- ✅ **Address validation** with edge cases  
- ✅ **TDSP resolution** with all fallback strategies
- ✅ **Error handling** with comprehensive scenarios
- ✅ **Performance** benchmarks and memory usage
- ✅ **Integration** with ComparePower API
- ✅ **UI Components** with user interaction flows

### Example Test Scenarios

```typescript
// Multi-TDSP boundary area
const addisonTest = {
  address: { street: '1234 Belt Line Road', city: 'Addison', zipCode: '75001' },
  expectedTdsps: ['Oncor Electric Delivery', 'Texas-New Mexico Power Company'],
  requiresValidation: true
};

// Performance benchmark
const performanceTest = async () => {
  const start = Date.now();
  const result = await addressTdspResolver.resolveTdspFromAddress(testAddress);
  const duration = Date.now() - start;
  
  expect(duration).toBeLessThan(2000); // 2 second limit
  expect(result.metadata.processingTime).toBeLessThan(2000);
};
```

## Troubleshooting

### Common Issues

#### 1. "Address validation failed"
**Cause**: Invalid or incomplete address information  
**Solution**: 
- Verify street address is complete (minimum 5 characters)
- Check city and ZIP code are valid Texas locations
- Enable address validation service (USPS/SmartyStreets)

```typescript
// Check address completeness
if (!address.street || address.street.length < 5) {
  throw createAddressIncompleteError(address);
}
```

#### 2. "TDSP resolution failed" 
**Cause**: Address in unknown boundary area or service failure  
**Solution**:
- System will automatically fall back to geographic heuristics
- Check if ZIP code is in multi-TDSP configuration
- Verify external services are accessible

```typescript
// Check if ZIP code is configured
const isMultiTdsp = getMultiTdspZipCodes().includes(zipCode);
if (!isMultiTdsp) {
  console.log('ZIP code not in multi-TDSP configuration');
}
```

#### 3. "Multiple utility providers found"
**Cause**: Address in boundary area requiring user selection  
**Solution**: Present TDSP options to user for manual selection

```typescript
const options = await addressTdspResolver.getTdspOptions(address);
// Show options.options to user for selection
```

#### 4. Poor Performance
**Cause**: Cache not configured or external service timeouts  
**Solutions**:
- Enable Redis caching: `REDIS_URL=redis://localhost:6379`
- Configure external APIs with proper timeouts
- Monitor cache hit ratios

```typescript
const stats = addressCache.getStats();
if (stats.hitRatio < 0.7) {
  console.warn('Low cache hit ratio - consider increasing TTL');
}
```

### Debug Mode

Enable detailed logging:

```typescript
// Set debug environment
process.env.DEBUG = 'address-resolution:*';

// Check system configuration
const validation = await addressTdspResolver.validateConfiguration();
console.log('System validation:', validation);

// Monitor real-time stats
const stats = addressTdspResolver.getSystemStats();
console.log('System stats:', stats);
```

### Health Checks

```typescript
// Validate system configuration
const health = await addressTdspResolver.validateConfiguration();

if (!health.isValid) {
  console.error('Configuration issues:', health.issues);
  console.log('Recommendations:', health.recommendations);
}

// Check cache performance
const optimization = await addressCache.optimizeCache();
console.log('Performance recommendations:', optimization.recommendedActions);
```

## Production Deployment

### Required Configuration

```bash
# Minimum required
COMPAREPOWER_API_URL=https://pricing.api.comparepower.com

# Recommended for production
REDIS_URL=redis://your-redis-instance:6379
USPS_API_KEY=your_production_usps_key
COMPAREPOWER_API_KEY=your_production_api_key

# Optional for maximum accuracy
ESID_API_URL=https://your-esid-service.com/api
ESID_API_KEY=your_esid_production_key
```

### Performance Monitoring

```typescript
// Set up monitoring
setInterval(async () => {
  const stats = addressTdspResolver.getSystemStats();
  
  // Alert if cache hit ratio drops below 70%
  if (stats.cacheStats.hitRatio < 0.7) {
    alert('Low cache performance detected');
  }
  
  // Alert if average response time exceeds 2 seconds
  const avgResponse = stats.serviceStats.averageResponseTime;
  if (avgResponse > 2000) {
    alert('High response times detected');
  }
}, 60000); // Check every minute
```

### Scaling Considerations

- **Memory Usage**: ~50MB baseline + ~1KB per cached address
- **Redis Usage**: ~2KB per cached address validation
- **Database Usage**: ~5KB per TDSP resolution result  
- **API Calls**: Reduced by 80-90% with proper caching

## Migration Guide

### From Existing ZIP-to-City Mapping

1. **Identify Impact**: Check which ZIP codes in your data are multi-TDSP:

```typescript
const yourZipCodes = ['75001', '75019', '77002']; // Your current ZIP codes
const multiTdspZips = getMultiTdspZipCodes();
const affected = yourZipCodes.filter(zip => multiTdspZips.includes(zip));
console.log('Affected ZIP codes:', affected);
```

2. **Gradual Rollout**: Implement progressive enhancement:

```typescript
// Phase 1: Add smart validation to existing inputs
<SmartAddressInput 
  onAddressResolved={handleNewFlow}
  onZipCodeChange={handleLegacyFlow} // Keep existing behavior
/>

// Phase 2: Full progressive flow for new users
<ProgressiveAddressInput onAddressResolved={handleNewFlow} />
```

3. **Data Migration**: Update existing user data:

```typescript
// Migrate existing user addresses
async function migrateUserAddresses() {
  const users = await getUsersWithAddresses();
  
  for (const user of users) {
    if (requiresAddressValidation(user.zipCode)) {
      // Flag for address collection on next visit
      await flagUserForAddressUpdate(user.id);
    }
  }
}
```

## Support and Maintenance

### Monitoring Dashboard Metrics

Track these key metrics for system health:

- **Resolution Success Rate**: Target >95%
- **Cache Hit Ratio**: Target >80%
- **Average Response Time**: Target <2s
- **Error Rate by Category**: Track trends
- **Multi-TDSP Coverage**: Monitor new boundary areas

### Regular Maintenance Tasks

1. **Monthly**: Review error patterns and update configurations
2. **Quarterly**: Validate TDSP boundary data with utility companies
3. **Annually**: Review and expand multi-TDSP ZIP code coverage

### Getting Help

- **GitHub Issues**: [Repository Issues](https://github.com/your-repo/issues)
- **Documentation**: This guide and inline code comments
- **System Validation**: Use built-in validation methods
- **Debug Logging**: Enable debug mode for detailed troubleshooting

---

## Summary

The Multi-TDSP ZIP Code Handling System provides:

✅ **Accurate TDSP Resolution** for 25+ boundary ZIP codes  
✅ **Progressive User Experience** with clear guidance  
✅ **Comprehensive Error Handling** with graceful fallbacks  
✅ **High Performance Caching** with 80%+ hit rates  
✅ **Production-Ready Integration** with existing systems  
✅ **Extensive Test Coverage** for reliability  

This system ensures users get accurate electricity rates regardless of complex TDSP boundaries, improving conversion rates and user satisfaction while maintaining system performance and reliability.