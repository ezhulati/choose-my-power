# OG Image Generation System

## Overview

The OG (Open Graph) Image Generation System uses the Ideogram.ai API to create contextual, dynamic images for every page on ChooseMyPower.org. The system is designed for scale, cost optimization, and performance.

## Key Features

- **🎨 Dynamic Generation**: Creates contextual images based on page content (city, filters, plan data)
- **💰 Cost Optimization**: Reduces 10,000+ unique images to ~300 strategic templates (97% savings)
- **⚡ High Performance**: Multi-tier caching with memory, file system, and fallback layers
- **🔄 Intelligent Reuse**: Shares images across similar pages while maintaining uniqueness
- **📊 Batch Processing**: Queue-based system with progress monitoring and error handling

## Quick Start

### 1. Environment Setup

Add your Ideogram API key to `.env`:

```bash
IDEOGRAM_API_KEY="your_ideogram_api_key_here"
```

### 2. Generate High-Priority Images

Start with the most important pages:

```bash
npm run og:generate-priority
```

This generates images for:
- Homepage
- Major cities (Dallas, Houston, Austin, San Antonio, Fort Worth)
- Common filter combinations

### 3. Monitor Progress

```bash
npm run og:monitor
```

Or monitor a specific job:

```bash
npm run og:status [job-id]
```

### 4. Generate Full Strategic Batch

Generate all ~300 optimized images:

```bash
npm run og:generate-all
```

## System Architecture

### Core Components

1. **OG Image Generator** (`og-image-generator.ts`)
   - Main integration layer
   - Connects all components
   - Provides simple interface for meta generator

2. **Image Strategy** (`image-strategy.ts`)
   - Cost optimization logic
   - Maps 10,000+ pages to ~300 templates
   - Calculates savings and usage statistics

3. **Prompt Generator** (`prompt-generator.ts`)
   - Creates contextual prompts for each page type
   - Ensures uniqueness through hash-based variations
   - City-specific and filter-specific themes

4. **Image Cache** (`image-cache.ts`)
   - Multi-tier caching system
   - Local file storage with CDN optimization
   - Automatic cleanup and expiry management

5. **Ideogram Client** (`ideogram-client.ts`)
   - Production-ready API client
   - Rate limiting and error handling
   - Circuit breaker and fallback patterns

6. **Batch Generator** (`batch-generator.ts`)
   - Queue-based batch processing
   - Progress tracking and error handling
   - Strategic template generation

### Integration

The system integrates seamlessly with the existing meta generator:

```typescript
// Before (static images)
const ogImage = `/images/og/city-${city}${filterParam}.jpg`;

// After (dynamic generation)
const ogImage = await ogImageGenerator.getOGImageForMeta(
  city, filters, planCount, lowestRate, topProviders, 'city'
);
```

## CLI Commands

### Generation Commands

```bash
# Generate strategic batch of ~300 optimized images
npm run og:generate-all

# Generate high-priority images first
npm run og:generate-priority

# Generate images for specific city
npm run og:city dallas-tx
npm run og:city houston-tx green-energy fixed-rate
```

### Monitoring Commands

```bash
# Show all batch jobs overview
npm run og:status

# Show specific job details
npm run og:status [job-id]

# Real-time monitoring dashboard
npm run og:monitor
npm run og:monitor [job-id]
```

### Management Commands

```bash
# Preview cost optimization strategy
npm run og:preview

# Show cache statistics and health
npm run og:cache-stats

# Clean up old jobs and expired cache
npm run og:cleanup

# Show help
npm run og:help
```

## Cost Optimization Strategy

### Template Mapping

The system reduces costs by intelligently sharing images:

| Page Type | Unique Images | Coverage | Strategy |
|-----------|---------------|----------|----------|
| Homepage & Global | 5 | 1 page each | Exact match |
| Major Cities | 15-20 | ~500 pages | City-specific |
| Tier/Zone Templates | 12 | ~1,000 pages | Geographic grouping |
| Filter-Specific | 50-80 | ~5,000 pages | Filter combinations |
| Seasonal | 10-20 | All pages | Seasonal overlays |
| **Total** | **~300** | **10,000+ pages** | **97% savings** |

### Example Savings

- **Without optimization**: 10,000 pages × $0.10 = $1,000
- **With optimization**: 300 images × $0.10 = $30
- **Savings**: $970 (97% reduction)

## Image Generation Context

Each image is generated based on rich context:

```typescript
interface ImageGenerationContext {
  city: string;           // dallas-tx, houston-tx, etc.
  filters: string[];      // green-energy, fixed-rate, etc.
  planCount: number;      // Number of available plans
  lowestRate: number;     // Lowest rate available
  topProviders: string[]; // Top 3 providers for this context
  pageType: 'homepage' | 'city' | 'filtered' | 'comparison' | 'provider' | 'state';
  cityTier: number;       // 1=major, 2=mid, 3=small
  tdspZone: 'North' | 'Coast' | 'Central' | 'South' | 'Valley';
  seasonalContext?: 'winter' | 'summer' | 'spring' | 'fall';
}
```

## Prompt System

### City-Specific Characteristics

Major cities get unique visual themes:

- **Dallas**: Corporate skyline, business district, metropolitan energy
- **Houston**: Industrial refineries, port facilities, energy corridor
- **Austin**: Tech district, music venues, creative spaces
- **San Antonio**: Historic district, river walk, cultural sites

### Filter Visual Themes

Each filter adds specific visual elements:

- **Green Energy**: Wind turbines, solar panels, renewable infrastructure
- **Fixed Rate**: Stable grid lines, reliability symbols, trustworthy colors
- **12-Month**: Calendar visualization, yearly energy cycle
- **Prepaid**: Payment controls, budget planning elements

### Prompt Structure

```
Base Template + City Characteristics + Filter Themes + Market Data + Seasonal Context + Style Enhancements + Unique Variations
```

Example generated prompt:
```
Modern Dallas cityscape with prominent electrical infrastructure and power distribution systems, featuring wind turbines, solar panels, renewable energy infrastructure integrated with urban landscape, emphasizing abundant energy options, competitive pricing indicators, incorporating bright sunny atmosphere, contemporary modern style, sleek design, current visual trends, blue and green color palette, energy industry colors, no text, no words, no letters, no typography, no labels, no writing, aerial view, dynamic layout, professional lighting
```

## Caching Strategy

### Multi-Tier Cache

1. **Memory Cache** (100 images max, LRU eviction)
   - Instant retrieval for recently used images
   - Perfect for development and testing

2. **File System Cache** (unlimited, 30-day expiry)
   - Local storage in `/public/images/og/generated/`
   - Organized by page type (city, filtered, homepage, etc.)

3. **Fallback Images**
   - Static fallback images for each page type
   - Ensures 100% reliability even if generation fails

### Cache Performance

- **Hit Rate**: Typically 85-95% for active pages
- **Miss Penalty**: 2-5 seconds for new generation
- **Storage**: ~50MB for 300 images (optimized JPEG)

## Error Handling

### Graceful Degradation

1. **Primary**: Generate dynamic image via Ideogram API
2. **Cache**: Serve cached image if available
3. **Template**: Use template image from strategy
4. **Fallback**: Serve static fallback image
5. **Ultimate**: Generic OG image

### Circuit Breaker

Protects against API failures:
- Opens after 5 consecutive failures
- Half-open after 30-second recovery period
- Automatically routes to fallbacks during outages

## Development Workflow

### 1. Local Development

```bash
# Start development server
npm run dev

# The system will use cached images or fallbacks
# API calls are made only when necessary
```

### 2. Testing Individual Images

```bash
# Generate specific city images
npm run og:city dallas-tx green-energy

# Monitor generation in real-time
npm run og:monitor
```

### 3. Batch Generation

```bash
# Start with high-priority images
npm run og:generate-priority

# Monitor progress
npm run og:monitor

# Generate full batch when ready
npm run og:generate-all
```

### 4. Production Deployment

The system automatically integrates with the existing meta generator. No additional deployment steps required beyond setting the API key.

## Performance Monitoring

### Key Metrics

- **Generation Rate**: ~5-10 images/minute (API limited)
- **Cache Hit Rate**: Target 90%+
- **Error Rate**: Target <5%
- **Storage Growth**: ~150KB per image

### Health Checks

```bash
# System health overview
npm run og:cache-stats

# Detailed batch statistics
npm run og:status
```

## Troubleshooting

### Common Issues

1. **API Key Not Set**
   ```bash
   Error: IDEOGRAM_API_KEY not found in environment
   Solution: Add API key to .env file
   ```

2. **Rate Limit Exceeded**
   ```bash
   Warning: Rate limit exceeded, backing off...
   Solution: System automatically retries with backoff
   ```

3. **Image Generation Failed**
   ```bash
   Warning: Using fallback OG image
   Solution: Check API connectivity and prompt validity
   ```

### Debug Mode

Enable detailed logging:

```bash
DEBUG=og-images npm run og:generate-priority
```

## Future Enhancements

### Planned Features

- [ ] CDN integration for global distribution
- [ ] A/B testing for prompt optimization
- [ ] Real-time image updates based on market data
- [ ] Advanced analytics and performance tracking
- [ ] Multi-provider fallback (DALL-E, Midjourney)

### Performance Optimizations

- [ ] WebP format support for smaller files
- [ ] Progressive image loading
- [ ] Pre-warming cache based on traffic patterns
- [ ] Intelligent cache eviction based on usage

## API Reference

### Main Interface

```typescript
// Get OG image URL for any page context
const imageUrl = await ogImageGenerator.getOGImageUrl(context, options);

// Integration with existing meta generator
const imageUrl = await ogImageGenerator.getOGImageForMeta(
  city, filters, planCount, lowestRate, topProviders, pageType
);
```

### Batch Generation

```typescript
// Generate strategic batch
const jobId = await batchGenerator.generateStrategicBatch();

// Monitor progress
const job = batchGenerator.getJobStatus(jobId);
```

### Cache Management

```typescript
// Check if image exists
const exists = await imageCache.hasImage(context);

// Get cache statistics
const stats = await imageCache.getCacheStats();
```

---

For more information, run `npm run og:help` or contact the development team.