# ChooseMyPower.org - Comprehensive Testing Framework Guide

## 🎯 Overview

This document provides a complete guide to the bulletproof testing framework built for ChooseMyPower.org. The framework ensures exceptional reliability, performance, and user experience at scale through comprehensive test coverage across all system components.

## 📁 Test Structure

```
tests/
├── unit/                           # Unit tests (95%+ coverage target)
│   ├── api/                        # API client and utilities
│   │   ├── comparepower-client.test.ts
│   │   ├── enhanced-client.test.ts
│   │   └── filter-mapper.test.ts
│   ├── components/                 # React/UI components
│   │   ├── ComparisonBar.test.tsx
│   │   └── ui-comprehensive.test.tsx
│   ├── faceted/                    # Faceted navigation system
│   │   ├── faceted-router.test.ts
│   │   ├── multi-filter-validator.test.ts
│   │   └── static-generation-strategy.test.ts
│   └── lib/                        # Core utilities
│       └── url-parser.test.ts
├── integration/                    # Integration tests (90%+ coverage)
│   ├── api-integration.test.ts     # API + Redis + Circuit breakers
│   ├── faceted-navigation-comprehensive.test.ts
│   └── seo-analytics-comprehensive.test.ts
├── e2e/                           # End-to-end tests
│   ├── comprehensive-user-journeys.spec.ts
│   ├── faceted-navigation.spec.ts
│   ├── performance.spec.ts
│   ├── seo.spec.ts
│   └── user-journeys.spec.ts
├── performance/                    # Performance & load tests
│   └── load-testing-framework.test.ts
├── coverage/                       # Coverage reporting
│   └── coverage-reporter.test.ts
└── setup.ts                      # Global test setup
```

## 🧪 Test Categories

### 1. Unit Tests
**Target Coverage: 95%+**

- **API Client Tests**: ComparePower API integration, Redis caching, circuit breakers
- **Component Tests**: React components with accessibility, mobile responsiveness
- **Faceted Navigation**: URL parsing, filter validation, route generation
- **Utilities**: Helper functions, data transformers, validators

**Run Commands:**
```bash
# All unit tests
npm run test

# Specific test files
npm run test tests/unit/api/
npm run test -- --watch
npm run test -- --coverage
```

### 2. Integration Tests
**Target Coverage: 90%+**

- **API Integration**: Full API workflows with caching and error handling
- **Faceted Navigation**: Complete URL routing and static generation
- **SEO & Analytics**: Meta tag generation, canonical URLs, structured data

**Run Commands:**
```bash
# All integration tests
npm run test:integration

# Skip slow integration tests in development
SKIP_INTEGRATION_TESTS=true npm run test:integration
```

### 3. End-to-End Tests
**Target Coverage: All critical user journeys**

- **User Journeys**: ZIP search → plan selection → enrollment
- **Cross-browser**: Chrome, Firefox, Safari, Edge
- **Mobile Testing**: iOS Safari, Chrome Mobile, Samsung Internet
- **Performance**: Core Web Vitals validation
- **Accessibility**: WCAG 2.1 AA compliance

**Run Commands:**
```bash
# All E2E tests
npm run test:e2e

# Specific browser
npm run test:e2e -- --project=chromium

# Mobile testing
npm run test:e2e -- --project="Mobile Chrome"

# Debug mode with UI
npm run test:e2e:ui
```

### 4. Performance Tests
**Target: <2s page loads, Core Web Vitals thresholds**

- **API Load Testing**: 1,000+ concurrent requests
- **Page Generation**: Static site generation performance
- **Core Web Vitals**: LCP, FID, CLS validation
- **Memory Usage**: Leak detection and optimization

**Run Commands:**
```bash
# Performance test suite
npm run test tests/performance/

# API performance specifically
npm run test:api:quick
```

### 5. Coverage Reporting
**Target: 95%+ overall coverage**

- **Quality Gates**: Automated pass/fail thresholds
- **HTML Reports**: Visual coverage reports
- **CI/CD Integration**: GitHub Actions integration
- **Trend Analysis**: Coverage over time tracking

**Run Commands:**
```bash
# Generate coverage report
npm run test:coverage

# All tests with coverage
npm run test:all
```

## 🚀 Running Tests

### Local Development

```bash
# Quick test run (unit tests only)
npm test

# Full test suite (unit + integration + E2E)
npm run test:all

# Watch mode for development
npm run test -- --watch

# Coverage report
npm run test:coverage

# Specific test patterns
npm test -- --grep "API Client"
npm test -- --testPathPattern="faceted"
```

### CI/CD Pipeline

The GitHub Actions workflow automatically runs:

1. **Code Quality**: Linting, type checking, security audit
2. **Unit Tests**: Fast feedback on code changes
3. **Integration Tests**: API and system integration validation
4. **E2E Tests**: Cross-browser user journey validation
5. **Performance**: Core Web Vitals and load testing
6. **Coverage**: Quality gate validation and reporting

### Environment Variables

```bash
# Required for integration tests
COMPAREPOWER_API_URL=https://pricing.api.comparepower.com
REDIS_URL=redis://localhost:6379

# Optional for enhanced testing
SKIP_INTEGRATION_TESTS=false
NODE_ENV=test
CI=true
```

## 📊 Quality Gates

### Overall Coverage Thresholds
- **Lines**: 85%+ (95%+ for critical files)
- **Functions**: 85%+ (95%+ for critical files)  
- **Branches**: 80%+ (90%+ for critical files)
- **Statements**: 85%+ (95%+ for critical files)

### Critical Files (95%+ coverage required)
- `src/lib/api/comparepower-client.ts`
- `src/lib/faceted/faceted-router.ts`
- `src/lib/faceted/multi-filter-validator.ts`
- `src/lib/api/filter-mapper.ts`
- `src/lib/api/tdsp-validator.ts`

### Performance Thresholds
- **Page Load**: <2s average
- **API Response**: <1.5s average  
- **LCP**: <2.5s
- **FID**: <100ms
- **CLS**: <0.1
- **Build Time**: <5 minutes

### E2E Success Criteria
- **Cross-browser compatibility**: 99%+ pass rate
- **Mobile responsiveness**: All touch targets ≥44px
- **Accessibility**: Zero WCAG 2.1 AA violations
- **User journey completion**: 95%+ success rate

## 🛠 Test Development Guidelines

### Writing Unit Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Component from '../src/components/Component';

describe('Component Name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should describe the expected behavior clearly', () => {
    // Arrange
    const props = { /* test data */ };
    
    // Act
    render(<Component {...props} />);
    
    // Assert
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### Writing Integration Tests

```typescript
describe('Feature Integration', () => {
  // Test complete workflows
  it('should handle end-to-end feature workflow', async () => {
    const result = await completeWorkflow(testData);
    
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject(expectedStructure);
  });
});
```

### Writing E2E Tests

```typescript
test('User can complete critical journey', async ({ page }) => {
  await page.goto('/');
  
  // Test user interactions
  await page.fill('[data-testid="zip-input"]', '75201');
  await page.click('[data-testid="search-button"]');
  
  // Verify outcomes
  await expect(page).toHaveURL(/dallas/);
  await expect(page.locator('.plan-card')).toHaveCount.greaterThan(0);
});
```

## 🔧 Troubleshooting

### Common Issues

**1. Tests timing out**
```bash
# Increase timeout for slow tests
test('slow test', async () => {
  // test code
}, 30000); // 30 second timeout
```

**2. API integration failures**
```bash
# Check environment variables
echo $COMPAREPOWER_API_URL
echo $REDIS_URL

# Skip integration tests during development
SKIP_INTEGRATION_TESTS=true npm test
```

**3. E2E test flakiness**
```bash
# Use explicit waits
await page.waitForSelector('.plan-card');
await page.waitForLoadState('networkidle');

# Add retries for flaky tests
test.retry(2, async ({ page }) => {
  // test code
});
```

**4. Coverage not meeting thresholds**
```bash
# Run coverage with details
npm run test:coverage -- --reporter=verbose

# Check specific file coverage
npm test -- --coverage --collectCoverageFrom="src/lib/api/**"
```

### Debugging Commands

```bash
# Run specific test with debug info
npm test -- --verbose tests/unit/api/comparepower-client.test.ts

# E2E tests with browser visible
npm run test:e2e -- --headed

# Performance profiling
NODE_OPTIONS="--inspect" npm test

# Memory usage analysis
node --expose-gc --inspect npm test
```

## 📈 Monitoring and Maintenance

### Daily Monitoring
- Check GitHub Actions status
- Review failed test notifications  
- Monitor coverage trends
- Review performance metrics

### Weekly Tasks
- Update test data and mocks
- Review and update flaky tests
- Analyze coverage gaps
- Update browser versions in E2E tests

### Monthly Tasks
- Review and update test strategy
- Performance benchmark updates
- Dependency updates (testing libraries)
- Test environment maintenance

### Quarterly Tasks
- Comprehensive test architecture review
- Load testing parameter updates
- Accessibility guidelines updates
- Security testing enhancements

## 🚨 Alerting and Notifications

### GitHub Actions Integration
- **PR Comments**: Automatic coverage reports
- **Status Checks**: Required before merging
- **Artifact Storage**: Test results and reports
- **Scheduled Runs**: Nightly comprehensive tests

### Slack Notifications (if configured)
```yaml
# Add to GitHub Actions workflow
- name: Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    channel: '#dev-alerts'
```

## 📚 Additional Resources

### Testing Libraries Documentation
- [Vitest](https://vitest.dev/) - Unit testing framework
- [Playwright](https://playwright.dev/) - E2E testing
- [Testing Library](https://testing-library.com/) - Component testing
- [Jest Axe](https://github.com/nickcolley/jest-axe) - Accessibility testing

### Best Practices
- **Test Naming**: Use descriptive test names that explain the scenario
- **Test Data**: Use realistic test data that matches production scenarios
- **Mocking**: Mock external dependencies but test integration points
- **Async Testing**: Always await async operations and use proper timeouts
- **Error Testing**: Test both success and failure scenarios

### Performance Guidelines
- **Test Speed**: Keep unit tests under 100ms each
- **Parallel Execution**: Use test parallelization for faster CI runs
- **Resource Cleanup**: Always clean up resources in afterEach/afterAll
- **Memory Management**: Monitor memory usage in performance tests

## ✅ Checklist for New Features

When adding new features, ensure:

- [ ] Unit tests cover all new functions/components
- [ ] Integration tests validate feature workflows
- [ ] E2E tests cover critical user paths
- [ ] Accessibility tests pass WCAG 2.1 AA
- [ ] Performance impact measured and acceptable
- [ ] Error scenarios tested and handled
- [ ] Mobile responsiveness validated
- [ ] SEO impact assessed
- [ ] Coverage thresholds maintained

## 🎉 Conclusion

This comprehensive testing framework ensures ChooseMyPower.org delivers exceptional reliability, performance, and user experience at production scale. The multi-layered approach covers every aspect of the application from individual functions to complete user journeys.

**Key Benefits:**
- **95%+ test coverage** across all components
- **Cross-browser compatibility** validation
- **Performance monitoring** with Core Web Vitals
- **Accessibility compliance** (WCAG 2.1 AA)
- **Automated quality gates** in CI/CD
- **Comprehensive reporting** and monitoring

For questions or support with the testing framework, please refer to this guide or reach out to the development team.