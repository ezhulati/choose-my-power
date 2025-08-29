# ChooseMyPower.org Netlify Functions

## Production-Ready Serverless API Implementation

This directory contains enterprise-grade Netlify Functions that provide the core API endpoints for the ChooseMyPower.org electricity plan comparison platform. These functions are built to handle high-traffic loads while maintaining excellent performance and reliability.

## 📋 Table of Contents

- [Overview](#overview)
- [API Endpoints](#api-endpoints)
- [Architecture](#architecture)
- [Features](#features)
- [Installation & Setup](#installation--setup)
- [Testing](#testing)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [API Reference](#api-reference)

## 🎯 Overview

The serverless functions integrate with the comprehensive ComparePower infrastructure including:

- **Multi-layered Caching**: Memory → Redis → Database → API
- **Circuit Breaker Pattern**: For resilience and fault tolerance
- **Split ZIP Code Handling**: With ESIID resolution for precise TDSP determination
- **Comprehensive Error Handling**: With user-friendly error messages
- **Rate Limiting & Idempotency**: Enterprise-grade request management
- **Production Monitoring**: Performance tracking and operational insights

## 🚀 API Endpoints

### `/search-plans`
**POST** - Search for electricity plans by ZIP code

**Primary Use Cases:**
- Basic ZIP code plan search
- Multi-TDSP ZIP code handling with address resolution
- Advanced filtering (term, rate type, green energy, etc.)
- Usage-based pricing calculations

### `/lookup-esiid`
**POST** - Resolve address to precise TDSP using ESIID data

**Primary Use Cases:**
- Split ZIP code resolution requiring street-level precision
- Address validation for multi-TDSP territories  
- Precise TDSP determination with confidence scoring
- Alternative TDSP discovery

## 🏗️ Architecture

### File Structure

```
netlify/functions/
├── search-plans.ts          # Main ZIP code search endpoint
├── lookup-esiid.ts          # Address-to-TDSP resolution endpoint
├── shared/
│   ├── utils.ts            # TDSP mapping and validation utilities
│   ├── monitoring.ts       # Production monitoring system
│   └── rate-limiting.ts    # Rate limiting and idempotency
├── test-functions.mjs      # Comprehensive test suite
└── README.md              # This documentation
```

### Integration Points

The functions seamlessly integrate with existing infrastructure:

- **`src/lib/api/comparepower-client.ts`** - Production API client with caching
- **`src/lib/api/ercot-esiid-client.ts`** - ESIID resolution system
- **`src/config/multi-tdsp-mapping.ts`** - Split ZIP configuration
- **Database & Redis Layers** - Automatic caching and persistence

## ✨ Features

### 🔄 Smart Caching
- **Memory Cache**: Ultra-fast in-process lookups (< 1ms)
- **Redis Cache**: Distributed caching for scalability (< 10ms)
- **Database Cache**: Persistent fallback caching (< 50ms)
- **API Fallback**: ComparePower API as source of truth

### 🛡️ Enterprise Security
- **Rate Limiting**: Configurable per-endpoint limits
- **Idempotency**: Prevents duplicate request processing
- **Input Validation**: Comprehensive request sanitization
- **CORS Support**: Proper cross-origin resource sharing

### 📊 Production Monitoring
- **Performance Tracking**: Response times, throughput metrics
- **Error Monitoring**: Comprehensive error tracking and alerting
- **Health Checks**: System health validation endpoints
- **Operational Insights**: Real-time performance dashboard

### 🎯 Split ZIP Handling
- **Multi-TDSP Detection**: Automatic identification of boundary ZIP codes
- **Address Resolution**: ESIID-based precise TDSP determination
- **Confidence Scoring**: High/Medium/Low confidence levels
- **Fallback Strategies**: Graceful degradation for failed lookups

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+ (matches Netlify Functions runtime)
- Access to ComparePower API (for production data)
- Redis instance (optional, for distributed caching)
- PostgreSQL database (for persistent caching)

### Environment Variables

```bash
# Required
COMPAREPOWER_API_URL=https://pricing.api.comparepower.com
COMPAREPOWER_API_KEY=your_api_key_here

# Optional - Enhanced Performance
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@host:5432/db

# Optional - ESIID Resolution
ERCOT_API_URL=https://ercot.api.comparepower.com
ERCOT_API_KEY=your_esiid_api_key_here

# Development
NODE_ENV=production
```

### Local Development

```bash
# Install dependencies
npm install

# Start Netlify Dev
netlify dev

# Functions will be available at:
# http://localhost:8888/.netlify/functions/search-plans
# http://localhost:8888/.netlify/functions/lookup-esiid
```

## 🧪 Testing

### Comprehensive Test Suite

Run the complete test suite to validate functionality:

```bash
# Run all tests
./netlify/functions/test-functions.mjs

# Verbose output
./netlify/functions/test-functions.mjs --verbose

# Skip integration tests (for CI/CD)
./netlify/functions/test-functions.mjs --skip-integration
```

### Test Categories

1. **Health Checks** - Basic function availability
2. **API Contract Validation** - Response structure compliance
3. **Error Handling** - Proper error responses and codes
4. **Performance Tests** - Response time validation
5. **Rate Limiting** - Rate limit header validation
6. **Multi-TDSP Tests** - Split ZIP code handling
7. **Filter Tests** - Complex parameter processing
8. **Idempotency Tests** - Duplicate request prevention
9. **CORS Tests** - Cross-origin support validation
10. **Data Quality** - Response data structure validation

### Manual Testing

```bash
# Test search-plans function
curl -X POST http://localhost:8888/.netlify/functions/search-plans \
  -H "Content-Type: application/json" \
  -d '{"zipCode": "75201", "usage": 1000}'

# Test lookup-esiid function
curl -X POST http://localhost:8888/.netlify/functions/lookup-esiid \
  -H "Content-Type: application/json" \
  -d '{"address": "1234 Main St", "zipCode": "75201"}'
```

## 🚢 Deployment

### Netlify Deployment

The functions automatically deploy with your Netlify site:

```bash
# Deploy to production
netlify deploy --prod

# Deploy to preview
netlify deploy
```

### Environment Configuration

Set production environment variables in Netlify dashboard:

1. Go to Site Settings → Environment Variables
2. Add required API keys and configuration
3. Deploy with updated environment

### Health Monitoring

Monitor function health using the built-in health endpoints:

```bash
# Check overall system health
curl https://your-site.netlify.app/.netlify/functions/search-plans \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"zipCode": "75201"}'

# Monitor response headers
curl -I https://your-site.netlify.app/.netlify/functions/search-plans
```

## 📊 Monitoring

### Performance Metrics

The functions automatically track:

- **Response Times**: Average, P95, P99 latencies
- **Request Volumes**: Total requests, success/failure rates
- **Cache Performance**: Hit rates, miss rates
- **Error Rates**: Error frequency and types

### Health Monitoring

Built-in health checking provides:

- **System Status**: healthy/degraded/unhealthy
- **Component Health**: API, cache, database status
- **Performance Summary**: Real-time metrics dashboard
- **Error Tracking**: Recent errors and patterns

### Alerting Thresholds

Recommended alert thresholds:

- Error rate > 5%
- Average response time > 2 seconds  
- Cache hit rate < 70%
- P99 response time > 5 seconds

## 📖 API Reference

### Search Plans Endpoint

**Endpoint:** `POST /.netlify/functions/search-plans`

**Request Body:**
```json
{
  "zipCode": "75201",
  "address": "123 Main St (optional)",
  "usage": 1000,
  "filters": {
    "term": 12,
    "green": 100,
    "rateType": "fixed",
    "prepaid": false,
    "timeOfUse": false,
    "provider": "TXU Energy"
  },
  "idempotencyKey": "unique-request-id"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "plans": [...],
    "tdspInfo": {
      "duns": "1039940674000",
      "name": "Oncor Electric Delivery",
      "zone": "North",
      "confidence": "high"
    },
    "searchMeta": {
      "totalPlans": 25,
      "filteredPlans": 15,
      "zipCode": "75201",
      "usage": 1000,
      "cacheHit": true,
      "responseTime": 45,
      "method": "direct_mapping"
    },
    "splitZipInfo": {
      "isMultiTdsp": false
    }
  },
  "meta": {
    "requestId": "req_123456789",
    "timestamp": "2025-08-29T12:00:00.000Z",
    "responseTime": 45,
    "version": "1.0.0"
  }
}
```

### ESIID Lookup Endpoint

**Endpoint:** `POST /.netlify/functions/lookup-esiid`

**Request Body:**
```json
{
  "address": "1234 Main Street",
  "zipCode": "75201",
  "usage": 1000,
  "returnAlternatives": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "resolution": {
      "tdsp": {
        "duns": "1039940674000",
        "name": "Oncor Electric Delivery", 
        "zone": "North"
      },
      "esiid": "10123456789012345",
      "confidence": "high",
      "method": "esiid_lookup",
      "address": {
        "matched": "1234 Main Street, Dallas, TX 75201",
        "normalized": "1234 Main Street",
        "city": "Dallas",
        "state": "TX",
        "zipCode": "75201"
      }
    },
    "alternatives": [...],
    "apiParams": {
      "tdsp_duns": "1039940674000",
      "display_usage": 1000
    },
    "splitZipInfo": {
      "isKnownSplitZip": false
    }
  },
  "meta": {
    "requestId": "lookup_123456789",
    "timestamp": "2025-08-29T12:00:00.000Z", 
    "responseTime": 125,
    "version": "1.0.0"
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed: zipCode is required",
    "userMessage": "Please check your search parameters and try again.",
    "retryable": false,
    "context": {
      "validationErrors": ["zipCode is required"]
    }
  },
  "meta": {
    "requestId": "req_123456789",
    "timestamp": "2025-08-29T12:00:00.000Z",
    "responseTime": 12,
    "version": "1.0.0"
  }
}
```

### Rate Limiting Headers

All responses include rate limiting headers:

```http
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1693315200
Retry-After: 60
```

## 🔧 Troubleshooting

### Common Issues

**Function Not Responding:**
- Check Netlify function logs
- Verify environment variables are set
- Test locally with `netlify dev`

**Slow Response Times:**
- Check cache hit rates in monitoring
- Verify Redis connectivity
- Review ComparePower API status

**Rate Limiting Issues:**
- Monitor rate limit headers in responses
- Adjust rate limits in configuration
- Implement exponential backoff in client

**Data Quality Issues:**
- Run comprehensive test suite
- Check ComparePower API data
- Verify TDSP mapping accuracy

### Debug Commands

```bash
# Check function logs
netlify functions:log

# Test with verbose output
./netlify/functions/test-functions.mjs --verbose

# Monitor function performance
curl -I https://your-site.netlify.app/.netlify/functions/search-plans
```

## 📈 Performance Targets

- **Response Time**: < 1.5s average, < 3s max
- **Cache Hit Rate**: > 80%
- **Error Rate**: < 1%
- **Availability**: > 99.9%
- **Rate Limit**: 100 requests/minute for search-plans, 50/minute for ESIID lookup

## 🤝 Support

For questions or issues:

1. Check the [comprehensive test suite](./test-functions.mjs)
2. Review the [API integration documentation](../../docs/api-integration-system.md)
3. Monitor function performance using built-in monitoring
4. Check Netlify function logs for detailed error information

---

**Built with ❤️ for Texas electricity customers**

*Last Updated: August 29, 2025*