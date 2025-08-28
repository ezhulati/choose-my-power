# Enterprise Routing System Deployment Guide

## Pre-Deployment Checklist

### Infrastructure Requirements
- [ ] Redis Cluster (minimum 3 nodes for production)
- [ ] CDN Service (Cloudflare, Fastly, or AWS CloudFront)
- [ ] Load Balancer with health checks
- [ ] Monitoring system (DataDog, New Relic, or Grafana)
- [ ] Database with connection pooling
- [ ] SSL certificates for all domains

### Environment Variables
```bash
# Production Environment
NODE_ENV=production

# Redis Configuration
REDIS_HOST=your-redis-cluster.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
REDIS_DB=0
REDIS_CLUSTER=true

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
DATABASE_MAX_CONNECTIONS=20
DATABASE_TIMEOUT=10000

# CDN Configuration
CDN_PROVIDER=cloudflare
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ZONE_ID=your-zone-id

# Performance Configuration
MAX_CONCURRENT_REQUESTS=1000
RATE_LIMIT_PER_SECOND=100
MEMORY_LIMIT_MB=2048

# Monitoring
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_ANALYTICS=true
LOG_LEVEL=info
```

## Deployment Steps

### 1. Infrastructure Setup

#### Redis Cluster Setup
```bash
# AWS ElastiCache Redis Cluster
aws elasticache create-replication-group \
  --replication-group-id cmp-redis-cluster \
  --description "ChooseMyPower Redis Cluster" \
  --num-cache-clusters 3 \
  --cache-node-type cache.r6g.large \
  --engine redis \
  --engine-version 7.0 \
  --port 6379 \
  --parameter-group-name default.redis7 \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-group-name cmp-cache-subnet-group
```

#### Database Setup
```sql
-- Create optimized database indexes
CREATE INDEX CONCURRENTLY idx_routes_city_tier ON routes(city_slug, tier);
CREATE INDEX CONCURRENTLY idx_routes_priority ON routes(priority, created_at);
CREATE INDEX CONCURRENTLY idx_cache_entries_key ON cache_entries(cache_key);
CREATE INDEX CONCURRENTLY idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);

-- Set up connection pooling
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '512MB';
ALTER SYSTEM SET effective_cache_size = '2GB';
```

### 2. Application Deployment

#### Docker Configuration
```dockerfile
# Production Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 4321
CMD ["npm", "start"]
```

#### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: choosemypower-app
  labels:
    app: choosemypower
spec:
  replicas: 3
  selector:
    matchLabels:
      app: choosemypower
  template:
    metadata:
      labels:
        app: choosemypower
    spec:
      containers:
      - name: app
        image: choosemypower:latest
        ports:
        - containerPort: 4321
        env:
        - name: NODE_ENV
          value: "production"
        - name: REDIS_HOST
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: redis-host
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 4321
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 4321
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 3. CDN Configuration

#### Cloudflare Setup
```javascript
// Cloudflare Worker for edge optimization
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Apply cache rules based on path
    const cacheRules = {
      '/electricity-plans/': { ttl: 1800, browserTTL: 300 },
      '/images/': { ttl: 86400, browserTTL: 3600 },
      '/api/': { ttl: 300, browserTTL: 0 }
    };
    
    const rule = getCacheRule(url.pathname, cacheRules);
    if (rule) {
      return handleWithCache(request, rule);
    }
    
    return fetch(request);
  }
};
```

#### Cache Configuration
```javascript
// CDN cache rules configuration
const cacheConfiguration = {
  rules: [
    {
      pattern: "/electricity-plans/*",
      ttl: 1800, // 30 minutes
      browserTTL: 300, // 5 minutes
      varyHeaders: ["Accept-Encoding", "User-Agent"]
    },
    {
      pattern: "/images/*",
      ttl: 86400, // 24 hours
      browserTTL: 3600, // 1 hour
      compressionLevel: 9
    },
    {
      pattern: "/api/*",
      ttl: 300, // 5 minutes
      browserTTL: 0, // No browser cache
      varyHeaders: ["Authorization"]
    }
  ]
};
```

### 4. Monitoring Setup

#### Health Check Endpoints
```typescript
// Health check implementation
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: checkDatabase(),
      redis: checkRedis(),
      memory: checkMemoryUsage(),
      responseTime: measureResponseTime()
    }
  };
  
  const isHealthy = Object.values(health.checks).every(check => check.status === 'ok');
  res.status(isHealthy ? 200 : 503).json(health);
});

app.get('/ready', (req, res) => {
  const ready = {
    status: 'ready',
    routing: enterpriseRoutingSystem.isReady(),
    cache: enterpriseCacheSystem.isConnected(),
    isr: intelligentISRSystem.isActive()
  };
  
  const isReady = Object.values(ready).every(status => status === true);
  res.status(isReady ? 200 : 503).json(ready);
});
```

#### Monitoring Dashboard
```yaml
# Grafana Dashboard Configuration
dashboard:
  title: "ChooseMyPower Enterprise Routing"
  panels:
    - title: "Response Times"
      type: "graph"
      metrics:
        - "avg(response_time_p95)"
        - "avg(response_time_p99)"
    - title: "Cache Hit Rate"
      type: "singlestat"
      metric: "cache_hit_rate"
    - title: "ISR Queue Length"
      type: "graph"
      metric: "isr_queue_length"
    - title: "Memory Usage"
      type: "graph"
      metric: "memory_usage_mb"
```

### 5. Load Testing

#### Performance Testing Script
```javascript
// Load testing with Artillery
module.exports = {
  config: {
    target: 'https://choosemypower.org',
    phases: [
      { duration: 60, arrivalRate: 10 },  // Warm up
      { duration: 300, arrivalRate: 100 }, // Sustained load
      { duration: 60, arrivalRate: 200 }   // Peak load
    ]
  },
  scenarios: [
    {
      name: 'Browse routes',
      weight: 70,
      flow: [
        { get: { url: '/electricity-plans/dallas-tx/' }},
        { get: { url: '/electricity-plans/houston-tx/12-month/' }},
        { get: { url: '/electricity-plans/austin-tx/fixed-rate/' }}
      ]
    },
    {
      name: 'Search filters',
      weight: 30,
      flow: [
        { get: { url: '/electricity-plans/dallas-tx/12-month/fixed-rate/' }},
        { get: { url: '/electricity-plans/houston-tx/green-energy/' }}
      ]
    }
  ]
};
```

### 6. Deployment Verification

#### Post-Deployment Checklist
- [ ] All health checks passing
- [ ] Cache hit rate >85%
- [ ] Response times <2s P95
- [ ] ISR queue processing normally
- [ ] Memory usage <80%
- [ ] Error rate <1%
- [ ] CDN cache warming complete
- [ ] Database connections stable
- [ ] Monitoring alerts configured

#### Performance Validation
```bash
# Response time validation
curl -w "@curl-format.txt" -o /dev/null -s https://choosemypower.org/electricity-plans/dallas-tx/

# Cache validation
curl -I https://choosemypower.org/electricity-plans/houston-tx/ | grep -i cache

# Load balancer validation
for i in {1..10}; do curl -I https://choosemypower.org/health; done
```

## Rollback Procedures

### Emergency Rollback
```bash
# Kubernetes rollback
kubectl rollout undo deployment/choosemypower-app

# CDN cache purge
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

# Redis cache flush (if needed)
redis-cli -h ${REDIS_HOST} -p ${REDIS_PORT} FLUSHDB
```

### Gradual Rollback
```bash
# Scale down new version
kubectl scale deployment choosemypower-app --replicas=1

# Scale up previous version
kubectl scale deployment choosemypower-app-prev --replicas=2

# Monitor metrics and complete rollback if needed
```

## Monitoring and Alerting

### Key Metrics Alerts
```yaml
# Alert rules for Prometheus
groups:
  - name: choosemypower.rules
    rules:
      - alert: HighResponseTime
        expr: response_time_p95 > 2000
        for: 2m
        annotations:
          summary: "Response time too high"
          
      - alert: LowCacheHitRate
        expr: cache_hit_rate < 0.85
        for: 5m
        annotations:
          summary: "Cache hit rate below threshold"
          
      - alert: HighMemoryUsage
        expr: memory_usage_percent > 80
        for: 3m
        annotations:
          summary: "Memory usage high"
          
      - alert: ISRQueueBackup
        expr: isr_queue_length > 500
        for: 10m
        annotations:
          summary: "ISR queue backing up"
```

### Log Analysis
```bash
# Monitor application logs
kubectl logs -f deployment/choosemypower-app | grep -E "(ERROR|WARN|Performance)"

# Monitor Redis logs
redis-cli -h ${REDIS_HOST} -p ${REDIS_PORT} monitor

# Monitor CDN logs
curl -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/logs/received" \
  -H "Authorization: Bearer ${API_TOKEN}"
```

## Scaling Considerations

### Horizontal Scaling
- Add more application instances when CPU >70%
- Increase Redis cluster nodes when memory >80%
- Add CDN regions based on geographic traffic

### Vertical Scaling
- Increase instance memory when cache efficiency drops
- Increase CPU allocation when response times increase
- Increase database connections when pool exhaustion occurs

### Cost Optimization
- Use spot instances for non-critical workloads
- Implement intelligent caching to reduce compute costs
- Monitor and optimize CDN usage patterns

## Troubleshooting Guide

### Common Issues

#### High Response Times
1. Check cache hit rates - increase TTL if low
2. Monitor database connection pool usage
3. Review ISR queue processing times
4. Analyze CDN performance metrics

#### Memory Leaks
1. Monitor heap usage trends
2. Review object retention in cache systems  
3. Check for unclosed database connections
4. Analyze garbage collection patterns

#### Cache Misses
1. Review invalidation patterns and timing
2. Check ISR regeneration queue processing
3. Verify CDN cache rule configuration
4. Monitor route access patterns

For additional support, contact the development team or refer to the monitoring dashboards.