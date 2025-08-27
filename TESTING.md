# ChooseMyPower.org Testing Suite

A comprehensive testing strategy ensuring quality, performance, and reliability for the Texas electricity comparison platform.

## 🎯 Testing Strategy Overview

Our multi-layered testing approach covers:

- **Unit Tests**: Individual functions and components
- **Integration Tests**: API interactions and data flows
- **End-to-End Tests**: Complete user workflows
- **Performance Tests**: Core Web Vitals and page speeds
- **SEO Tests**: Meta generation and search optimization
- **Security Tests**: Vulnerability scanning and audits

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Chrome/Chromium for E2E tests

### Installation
```bash
npm install
```

### Running Tests

#### All Tests
```bash
# Run complete test suite
npm run test:all

# Run with custom test runner and report generation
npx tsx tests/test-runner.ts
```

#### Individual Test Types
```bash
# Unit tests with coverage
npm run test:coverage

# Integration tests
npm run test:run -- tests/integration

# End-to-end tests
npm run test:e2e

# Performance tests only
npm run test:e2e -- tests/e2e/performance.spec.ts

# SEO tests only
npm run test:e2e -- tests/e2e/seo.spec.ts
```

#### Development Mode
```bash
# Watch mode for unit tests
npm test

# Interactive UI for tests
npm run test:ui

# Playwright UI mode for debugging E2E
npm run test:e2e:ui
```

## 📁 Test Structure

```
tests/
├── unit/                          # Unit tests
│   ├── api/
│   │   └── comparepower-client.test.ts
│   ├── components/
│   │   └── ComparisonBar.test.tsx
│   └── lib/
│       └── url-parser.test.ts
├── integration/                   # Integration tests
│   └── faceted-navigation.test.ts
├── e2e/                          # End-to-end tests
│   ├── user-journeys.spec.ts
│   ├── performance.spec.ts
│   └── seo.spec.ts
├── setup.ts                     # Test setup and mocks
└── test-runner.ts               # Comprehensive test orchestrator
```

## 🧪 Unit Tests

### Coverage Requirements
- **Minimum**: 80% line coverage
- **Target**: 90% line coverage
- **Critical paths**: 100% coverage

### What We Test
- ✅ API client data transformation
- ✅ URL parsing and filter logic
- ✅ React component behavior
- ✅ Error handling and edge cases
- ✅ Utility functions

### Example Unit Test
```typescript
// tests/unit/api/comparepower-client.test.ts
import { ComparePowerClientClass } from '../../../src/lib/api/comparepower-client';

describe('ComparePowerClient', () => {
  it('should transform API response correctly', async () => {
    const client = new ComparePowerClientClass();
    const result = await client.fetchPlans({ tdsp_duns: '1039940674000' });
    
    expect(result[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      pricing: expect.objectContaining({
        rate1000kWh: expect.any(Number)
      })
    });
  });
});
```

## 🔗 Integration Tests

### Focus Areas
- ✅ API integration with ComparePower
- ✅ Filter-to-API parameter mapping
- ✅ Data consistency across filter changes
- ✅ Cache behavior and fallbacks

### Example Integration Test
```typescript
// tests/integration/faceted-navigation.test.ts
describe('Faceted Navigation Integration', () => {
  it('should handle complete filter-to-API workflow', async () => {
    const url = '/texas/dallas/electricity-plans/12-month';
    const { city, filters } = parseUrlFilters(url);
    const params = { tdsp_duns: '1039940674000', term: 12 };
    
    const results = await client.fetchPlans(params);
    expect(results.every(plan => plan.contract.length === 12)).toBe(true);
  });
});
```

## 🎭 End-to-End Tests

### User Journey Coverage
- ✅ Plan discovery and browsing
- ✅ Filter navigation and application
- ✅ Plan comparison functionality
- ✅ Enrollment click-through
- ✅ Mobile responsiveness
- ✅ Error handling

### Critical Paths Tested
1. **Plan Discovery**: User finds electricity plans for their city
2. **Filtering**: User applies contract length and green energy filters
3. **Comparison**: User compares multiple plans side-by-side
4. **Enrollment**: User clicks through to provider enrollment

### Example E2E Test
```typescript
// tests/e2e/user-journeys.spec.ts
test('User can browse Dallas electricity plans', async ({ page }) => {
  await page.goto('/texas/dallas/electricity-plans');
  await page.waitForSelector('.plan-card');
  
  const planCards = page.locator('.plan-card');
  await expect(planCards).toHaveCount.greaterThan(0);
  
  const firstPlan = planCards.first();
  await expect(firstPlan.locator('.rate-value')).toContainText('¢');
});
```

## ⚡ Performance Tests

### Core Web Vitals Monitoring
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8s
- **TTFB (Time to First Byte)**: < 800ms

### Performance Test Categories
- ✅ Page load performance
- ✅ Resource loading efficiency
- ✅ Interactive response times
- ✅ Memory usage monitoring
- ✅ Mobile performance

### Lighthouse Integration
```bash
# Run Lighthouse audit
npx lhci autorun

# Custom Lighthouse run
npx lighthouse http://localhost:4324/texas/dallas/electricity-plans --output=html
```

## 🔍 SEO Tests

### SEO Validation Coverage
- ✅ Title tag optimization (30-60 chars)
- ✅ Meta descriptions (120-160 chars)
- ✅ H1 tag presence and uniqueness
- ✅ Canonical URL correctness
- ✅ Open Graph metadata
- ✅ Structured data (Schema.org)
- ✅ Image alt attributes
- ✅ Internal linking structure

### SEO Test Example
```typescript
// tests/e2e/seo.spec.ts
test('Dallas page has optimal SEO', async ({ page }) => {
  await page.goto('/texas/dallas/electricity-plans');
  
  const title = await page.title();
  expect(title).toMatch(/Dallas.*Electricity.*Plans.*Texas/i);
  expect(title.length).toBeLessThan(60);
  
  const description = await page
    .locator('meta[name="description"]')
    .getAttribute('content');
  expect(description?.length).toBeLessThan(160);
});
```

## 📊 Test Reports

### Automated Reports
Our test runner generates comprehensive reports including:

- **Test Results**: Pass/fail counts by category
- **Coverage Metrics**: Line, branch, and function coverage
- **Performance Metrics**: Core Web Vitals and load times
- **SEO Analysis**: Meta tag compliance and structured data
- **Critical Issues**: High-priority failures requiring attention
- **Recommendations**: Actionable improvements

### Report Formats
- JSON reports for CI/CD integration
- HTML reports for human review
- Console summaries for quick feedback

### Accessing Reports
```bash
# Generate comprehensive report
npx tsx tests/test-runner.ts

# Reports saved to:
test-reports/
├── test-report-[timestamp].json
└── test-report-[timestamp].html
```

## 🔄 Continuous Integration

### GitHub Actions Workflow
Our CI pipeline runs:

1. **Unit Tests**: Fast feedback on code changes
2. **Integration Tests**: API and data flow validation
3. **E2E Tests**: Critical user journey verification
4. **Performance Tests**: Core Web Vitals monitoring
5. **SEO Tests**: Search optimization compliance
6. **Security Scan**: Vulnerability detection
7. **Lighthouse Audit**: Performance benchmarking

### Branch Protection
- All tests must pass before merging to `main`
- Performance regression detection
- SEO compliance verification
- Security vulnerability blocking

### Quality Gates
- **Unit Test Coverage**: Minimum 80%
- **E2E Test Pass Rate**: 100%
- **Performance Budget**: Core Web Vitals thresholds
- **SEO Requirements**: All critical meta tags present
- **Security**: No high/critical vulnerabilities

## 🛠️ Development Workflow

### Before Committing
```bash
# Run tests affected by your changes
npm test

# Check test coverage
npm run test:coverage

# Lint and fix issues
npm run lint
```

### Before Creating PR
```bash
# Run full test suite
npm run test:all

# Check for performance regressions
npm run test:e2e -- tests/e2e/performance.spec.ts

# Validate SEO compliance
npm run test:e2e -- tests/e2e/seo.spec.ts
```

### Debugging Tests

#### Unit Test Debugging
```bash
# Run specific test file
npm test -- comparepower-client.test.ts

# Debug mode with inspector
npm test -- --inspect-brk comparepower-client.test.ts
```

#### E2E Test Debugging
```bash
# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Debug specific test
npm run test:e2e -- --debug user-journeys.spec.ts

# Interactive UI mode
npm run test:e2e:ui
```

## 🎯 Best Practices

### Writing Tests

#### Unit Tests
- Test one thing at a time
- Use descriptive test names
- Mock external dependencies
- Test edge cases and error conditions
- Maintain high coverage on critical paths

#### Integration Tests
- Test real API interactions
- Verify data flow end-to-end
- Test error handling and retries
- Validate cache behavior

#### E2E Tests
- Test critical user journeys
- Use page object patterns for reusability
- Test responsive design
- Verify accessibility standards
- Keep tests independent and atomic

### Test Maintenance
- Update tests with feature changes
- Remove obsolete tests
- Refactor for maintainability
- Monitor test execution times
- Address flaky tests immediately

### Performance Considerations
- Mock heavy dependencies in unit tests
- Use test databases for integration tests
- Parallelize test execution where possible
- Monitor test suite performance
- Clean up test artifacts

## 🚨 Troubleshooting

### Common Issues

#### Tests Timing Out
```bash
# Increase timeout for slow tests
npm test -- --timeout 30000
```

#### API Tests Failing
- Check API endpoint availability
- Verify API key configuration
- Review rate limiting
- Check network connectivity

#### E2E Tests Flaky
- Add explicit waits for dynamic content
- Use data-testid attributes for reliable selectors
- Check for race conditions
- Verify test environment stability

#### Performance Tests Inconsistent
- Run tests in consistent environment
- Account for network variability
- Use multiple test runs for averaging
- Monitor system resources

### Getting Help
- Check test logs for detailed error messages
- Review GitHub Actions workflow results
- Use `--verbose` flag for detailed output
- Consult team for domain-specific issues

## 📈 Metrics and Monitoring

### Key Performance Indicators
- **Test Coverage**: >80% (target >90%)
- **Test Execution Time**: <10 minutes full suite
- **Flaky Test Rate**: <2%
- **Bug Escape Rate**: <5%
- **Performance Regression**: 0 tolerance

### Monitoring and Alerts
- Daily automated test runs
- Performance regression detection
- SEO compliance monitoring
- Security vulnerability scanning
- Test suite health metrics

---

## 🎉 Success Criteria

The test suite achieves its goals when:

✅ **Quality Assurance**: 90%+ test coverage with comprehensive edge case testing  
✅ **Performance Excellence**: All pages meet Core Web Vitals thresholds  
✅ **SEO Optimization**: 100% compliance with search engine requirements  
✅ **User Experience**: Critical user journeys work flawlessly across devices  
✅ **Reliability**: Platform maintains 99.9%+ uptime with graceful error handling  
✅ **Security**: Zero high/critical vulnerabilities in dependencies and code  

**Result**: A bulletproof electricity comparison platform ready for Texas users! 🔌⚡

---

*This testing documentation is maintained by the ChooseMyPower development team. Last updated: August 2025*