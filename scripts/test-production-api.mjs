#!/usr/bin/env node
/**
 * Production API System Test Script
 * Validates the entire API integration system for production readiness
 */

import { comparePowerClient } from '../src/lib/api/comparepower-client.js';
import { tdspValidator, quickValidation, fullValidation } from '../src/lib/api/tdsp-validator.js';
import { filterMapper, parseFilterUrl } from '../src/lib/api/filter-mapper.js';
import { tdspMapping } from '../src/config/tdsp-mapping.js';

class ProductionTestSuite {
  constructor() {
    this.results = {
      apiClient: { passed: 0, failed: 0, warnings: 0 },
      tdspValidation: { passed: 0, failed: 0, warnings: 0 },
      filterMapping: { passed: 0, failed: 0, warnings: 0 },
      performance: { passed: 0, failed: 0, warnings: 0 },
      overall: { passed: 0, failed: 0, warnings: 0 }
    };
  }

  async runFullSuite() {
    console.log('🚀 Starting Production API System Test Suite');
    console.log('='.repeat(60));
    
    const startTime = Date.now();
    
    try {
      await this.testApiClient();
      await this.testTdspValidation();
      await this.testFilterMapping();
      await this.testPerformance();
      
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Test suite failed with error:', error);
      process.exit(1);
    } finally {
      await comparePowerClient.shutdown();
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`\n⏱️  Total test time: ${(totalTime / 1000).toFixed(2)}s`);
    
    // Exit with error code if there are failures
    if (this.results.overall.failed > 0) {
      process.exit(1);
    }
  }

  async testApiClient() {
    console.log('\n📡 Testing API Client...');
    console.log('-'.repeat(40));
    
    try {
      // Test basic connectivity
      const health = await comparePowerClient.healthCheck();
      if (health.healthy) {
        this.pass('apiClient', `API health check passed (${health.responseTime}ms)`);
      } else {
        this.fail('apiClient', `API health check failed: ${health.lastError || 'Unknown error'}`);
      }

      // Test major cities
      const majorCities = [
        { name: 'Dallas', duns: '1039940674000' },
        { name: 'Houston', duns: '957877905' },
        { name: 'Austin', duns: '007924772' }
      ];

      for (const city of majorCities) {
        try {
          const plans = await comparePowerClient.fetchPlans({
            tdsp_duns: city.duns,
            display_usage: 1000
          });

          if (plans.length > 0) {
            this.pass('apiClient', `${city.name}: Found ${plans.length} plans`);
            
            // Validate plan structure
            const plan = plans[0];
            if (plan.id && plan.name && plan.provider.name && plan.pricing.rate1000kWh > 0) {
              this.pass('apiClient', `${city.name}: Plan data structure valid`);
            } else {
              this.fail('apiClient', `${city.name}: Invalid plan data structure`);
            }
          } else {
            this.warn('apiClient', `${city.name}: No plans found`);
          }
        } catch (error) {
          this.fail('apiClient', `${city.name}: ${error.message}`);
        }
      }

      // Test caching
      const cacheTestStart = Date.now();
      const params = { tdsp_duns: '1039940674000', display_usage: 1000 };
      
      await comparePowerClient.fetchPlans(params); // First call
      const cacheStart = Date.now();
      await comparePowerClient.fetchPlans(params); // Second call (should hit cache)
      const cacheTime = Date.now() - cacheStart;
      
      if (cacheTime < 100) { // Cache should be very fast
        this.pass('apiClient', `Caching working (${cacheTime}ms)`);
      } else {
        this.warn('apiClient', `Cache may not be working optimally (${cacheTime}ms)`);
      }

      // Test cache statistics
      const stats = await comparePowerClient.getCacheStats();
      if (stats.memory.hits > 0) {
        this.pass('apiClient', 'Cache statistics available');
      } else {
        this.warn('apiClient', 'No cache hits recorded');
      }

      // Test error handling with invalid DUNS
      try {
        await comparePowerClient.fetchPlans({
          tdsp_duns: 'invalid-duns',
          display_usage: 1000
        });
        this.fail('apiClient', 'Should have failed with invalid DUNS');
      } catch (error) {
        this.pass('apiClient', 'Error handling works for invalid DUNS');
      }

    } catch (error) {
      this.fail('apiClient', `API Client test failed: ${error.message}`);
    }
  }

  async testTdspValidation() {
    console.log('\n🗺️  Testing TDSP Validation...');
    console.log('-'.repeat(40));
    
    try {
      // Quick connectivity test
      const connectivity = await tdspValidator.validateConnectivity();
      const successRate = connectivity.summary.valid / connectivity.summary.total;
      
      if (successRate >= 0.8) {
        this.pass('tdspValidation', `TDSP connectivity: ${(successRate * 100).toFixed(1)}% (${connectivity.summary.valid}/${connectivity.summary.total})`);
      } else {
        this.fail('tdspValidation', `Low TDSP connectivity: ${(successRate * 100).toFixed(1)}%`);
      }

      // List any failing TDSPs
      const failing = connectivity.uniqueTdsps.filter(t => !t.isValid);
      if (failing.length > 0) {
        this.warn('tdspValidation', `Failing TDSPs: ${failing.map(t => t.name).join(', ')}`);
      }

      // Test tier 1 cities specifically
      const tier1Results = await tdspValidator.validateByTier(1);
      const tier1Success = tier1Results.filter(r => r.isValid).length;
      const tier1Rate = tier1Success / tier1Results.length;
      
      if (tier1Rate >= 0.95) {
        this.pass('tdspValidation', `Tier 1 cities: ${(tier1Rate * 100).toFixed(1)}% (${tier1Success}/${tier1Results.length})`);
      } else {
        this.fail('tdspValidation', `Tier 1 cities below 95%: ${(tier1Rate * 100).toFixed(1)}%`);
      }

      // Test specific zones
      const zones = ['North', 'Coast', 'Central', 'South'];
      for (const zone of zones) {
        const zoneResults = await tdspValidator.validateByZone(zone);
        const zoneSuccess = zoneResults.filter(r => r.isValid).length;
        const zoneRate = zoneSuccess / zoneResults.length;
        
        if (zoneRate >= 0.8) {
          this.pass('tdspValidation', `${zone} zone: ${(zoneRate * 100).toFixed(1)}% (${zoneSuccess}/${zoneResults.length})`);
        } else {
          this.warn('tdspValidation', `${zone} zone below 80%: ${(zoneRate * 100).toFixed(1)}%`);
        }
      }

    } catch (error) {
      this.fail('tdspValidation', `TDSP validation failed: ${error.message}`);
    }
  }

  async testFilterMapping() {
    console.log('\n🔍 Testing Filter Mapping...');
    console.log('-'.repeat(40));
    
    try {
      // Test basic filter mappings
      const testCases = [
        {
          name: '12-month term',
          filters: ['12-month'],
          expected: { term: 12 }
        },
        {
          name: '100% green energy',
          filters: ['green-energy'],
          expected: { percent_green: 100 }
        },
        {
          name: 'Prepaid plans',
          filters: ['prepaid'],
          expected: { is_pre_pay: true }
        },
        {
          name: 'Complex combination',
          filters: ['24-month', '50-green', 'autopay-discount'],
          expected: { term: 24, percent_green: 50, requires_auto_pay: true }
        }
      ];

      for (const testCase of testCases) {
        const result = filterMapper.mapFiltersToApiParams(
          'dallas-tx',
          testCase.filters,
          '1039940674000'
        );

        if (result.isValid && result.errors.length === 0) {
          let allMatch = true;
          for (const [key, value] of Object.entries(testCase.expected)) {
            if (result.apiParams[key] !== value) {
              allMatch = false;
              break;
            }
          }
          
          if (allMatch) {
            this.pass('filterMapping', testCase.name);
          } else {
            this.fail('filterMapping', `${testCase.name}: Parameter mismatch`);
          }
        } else {
          this.fail('filterMapping', `${testCase.name}: ${result.errors.join(', ')}`);
        }
      }

      // Test error handling
      const invalidResult = filterMapper.mapFiltersToApiParams(
        'dallas-tx',
        ['invalid-filter'],
        '1039940674000'
      );
      
      if (!invalidResult.isValid && invalidResult.errors.length > 0) {
        this.pass('filterMapping', 'Invalid filter detection works');
      } else {
        this.fail('filterMapping', 'Should have detected invalid filter');
      }

      // Test filter conflicts
      const conflictResult = filterMapper.mapFiltersToApiParams(
        'houston-tx',
        ['12-month', '24-month'],
        '957877905'
      );
      
      if (conflictResult.warnings.length > 0) {
        this.pass('filterMapping', 'Filter conflict detection works');
      } else {
        this.warn('filterMapping', 'Filter conflicts may not be detected');
      }

      // Test URL generation (round-trip)
      const params = {
        tdsp_duns: '1039940674000',
        term: 12,
        percent_green: 100,
        is_pre_pay: true,
        display_usage: 2000
      };

      const urlSegments = filterMapper.generateUrlFromParams(params);
      const backToParams = filterMapper.mapFiltersToApiParams(
        'dallas-tx',
        urlSegments,
        '1039940674000'
      );

      if (backToParams.isValid && 
          backToParams.apiParams.term === params.term &&
          backToParams.apiParams.percent_green === params.percent_green) {
        this.pass('filterMapping', 'Round-trip URL mapping works');
      } else {
        this.fail('filterMapping', 'Round-trip URL mapping failed');
      }

      // Test real API integration with filters
      const filterTestParams = filterMapper.mapFiltersToApiParams(
        'austin-tx',
        ['12-month', '50-green'],
        '007924772'
      );

      if (filterTestParams.isValid) {
        const plans = await comparePowerClient.fetchPlans(filterTestParams.apiParams);
        this.pass('filterMapping', `Filter integration test: ${plans.length} plans found`);
        
        // Validate that filters were actually applied
        if (plans.length > 0) {
          const plan = plans[0];
          if (plan.contract.length === 12) {
            this.pass('filterMapping', 'Term filter correctly applied');
          } else {
            this.warn('filterMapping', 'Term filter may not be working');
          }
        }
      } else {
        this.fail('filterMapping', 'Filter integration test failed');
      }

    } catch (error) {
      this.fail('filterMapping', `Filter mapping test failed: ${error.message}`);
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    console.log('-'.repeat(40));
    
    try {
      // Test response times
      const performanceTests = [
        { name: 'Dallas plans', params: { tdsp_duns: '1039940674000', display_usage: 1000 } },
        { name: 'Houston plans', params: { tdsp_duns: '957877905', display_usage: 1000 } },
        { name: 'Austin plans', params: { tdsp_duns: '007924772', display_usage: 1000 } }
      ];

      const times = [];
      
      for (const test of performanceTests) {
        const startTime = Date.now();
        await comparePowerClient.fetchPlans(test.params);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        times.push(responseTime);
        
        if (responseTime < 2000) {
          this.pass('performance', `${test.name}: ${responseTime}ms`);
        } else if (responseTime < 5000) {
          this.warn('performance', `${test.name}: ${responseTime}ms (slow)`);
        } else {
          this.fail('performance', `${test.name}: ${responseTime}ms (too slow)`);
        }
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      
      if (avgTime < 1500) {
        this.pass('performance', `Average response time: ${avgTime.toFixed(0)}ms`);
      } else {
        this.warn('performance', `Average response time: ${avgTime.toFixed(0)}ms (target: <1500ms)`);
      }
      
      if (maxTime < 3000) {
        this.pass('performance', `Maximum response time: ${maxTime}ms`);
      } else {
        this.warn('performance', `Maximum response time: ${maxTime}ms (target: <3000ms)`);
      }

      // Test concurrent requests
      const concurrentStart = Date.now();
      const concurrentPromises = Array.from({ length: 5 }, () =>
        comparePowerClient.fetchPlans({ tdsp_duns: '1039940674000', display_usage: 1000 })
      );
      
      await Promise.all(concurrentPromises);
      const concurrentTime = Date.now() - concurrentStart;
      
      if (concurrentTime < 3000) {
        this.pass('performance', `5 concurrent requests: ${concurrentTime}ms`);
      } else {
        this.warn('performance', `5 concurrent requests: ${concurrentTime}ms (may need optimization)`);
      }

      // Test cache performance
      await comparePowerClient.clearCache();
      
      const coldStart = Date.now();
      await comparePowerClient.fetchPlans({ tdsp_duns: '1039940674000', display_usage: 1000 });
      const coldTime = Date.now() - coldStart;
      
      const warmStart = Date.now();
      await comparePowerClient.fetchPlans({ tdsp_duns: '1039940674000', display_usage: 1000 });
      const warmTime = Date.now() - warmStart;
      
      const speedup = coldTime / warmTime;
      
      if (speedup > 5) {
        this.pass('performance', `Cache speedup: ${speedup.toFixed(1)}x`);
      } else if (speedup > 2) {
        this.warn('performance', `Cache speedup: ${speedup.toFixed(1)}x (could be better)`);
      } else {
        this.fail('performance', `Poor cache performance: ${speedup.toFixed(1)}x`);
      }

    } catch (error) {
      this.fail('performance', `Performance test failed: ${error.message}`);
    }
  }

  pass(category, message) {
    console.log(`✅ ${message}`);
    this.results[category].passed++;
    this.results.overall.passed++;
  }

  fail(category, message) {
    console.log(`❌ ${message}`);
    this.results[category].failed++;
    this.results.overall.failed++;
  }

  warn(category, message) {
    console.log(`⚠️  ${message}`);
    this.results[category].warnings++;
    this.results.overall.warnings++;
  }

  printSummary() {
    console.log('\n📊 Test Results Summary');
    console.log('='.repeat(60));
    
    const categories = ['apiClient', 'tdspValidation', 'filterMapping', 'performance'];
    const categoryNames = ['API Client', 'TDSP Validation', 'Filter Mapping', 'Performance'];
    
    categories.forEach((category, index) => {
      const results = this.results[category];
      const total = results.passed + results.failed + results.warnings;
      const passRate = total > 0 ? (results.passed / total * 100).toFixed(1) : '0.0';
      
      console.log(`${categoryNames[index].padEnd(20)} | ✅ ${results.passed.toString().padStart(3)} | ❌ ${results.failed.toString().padStart(3)} | ⚠️  ${results.warnings.toString().padStart(3)} | ${passRate}%`);
    });
    
    console.log('-'.repeat(60));
    const overall = this.results.overall;
    const overallTotal = overall.passed + overall.failed + overall.warnings;
    const overallRate = overallTotal > 0 ? (overall.passed / overallTotal * 100).toFixed(1) : '0.0';
    
    console.log(`${'Overall'.padEnd(20)} | ✅ ${overall.passed.toString().padStart(3)} | ❌ ${overall.failed.toString().padStart(3)} | ⚠️  ${overall.warnings.toString().padStart(3)} | ${overallRate}%`);
    
    console.log('\n🎯 Production Readiness Assessment');
    console.log('-'.repeat(40));
    
    if (overall.failed === 0 && overall.warnings === 0) {
      console.log('🟢 EXCELLENT - System is production ready');
    } else if (overall.failed === 0 && overall.warnings <= 3) {
      console.log('🟡 GOOD - System is production ready with minor optimizations needed');
    } else if (overall.failed <= 2) {
      console.log('🟡 FAIR - System needs attention before production deployment');
    } else {
      console.log('🔴 POOR - System requires significant fixes before production');
    }

    // Specific recommendations
    console.log('\n💡 Recommendations:');
    if (this.results.apiClient.failed > 0) {
      console.log('- Fix API client connectivity and error handling issues');
    }
    if (this.results.tdspValidation.failed > 0) {
      console.log('- Verify TDSP configurations and API endpoints');
    }
    if (this.results.filterMapping.failed > 0) {
      console.log('- Review filter mapping logic and validation rules');
    }
    if (this.results.performance.warnings > 0 || this.results.performance.failed > 0) {
      console.log('- Optimize caching strategy and response times');
      console.log('- Consider implementing Redis caching for production');
    }
    if (overall.warnings === 0 && overall.failed === 0) {
      console.log('- System looks great! Consider monitoring in production');
    }
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const testSuite = new ProductionTestSuite();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node scripts/test-production-api.mjs [options]

Options:
  --help, -h     Show this help message
  --quick        Run quick validation only
  --full         Run full test suite (default)
  
Environment Variables:
  COMPAREPOWER_API_URL    API base URL
  COMPAREPOWER_API_KEY    API key (if required)
  REDIS_URL              Redis connection URL (optional)

Examples:
  node scripts/test-production-api.mjs
  node scripts/test-production-api.mjs --quick
`);
    return;
  }

  if (args.includes('--quick')) {
    console.log('🚀 Running Quick Production Validation');
    console.log('='.repeat(50));
    
    try {
      await quickValidation();
      
      // Quick API test
      const health = await comparePowerClient.healthCheck();
      console.log(`API Health: ${health.healthy ? '✅ Healthy' : '❌ Unhealthy'} (${health.responseTime}ms)`);
      
      if (health.healthy) {
        const plans = await comparePowerClient.fetchPlans({
          tdsp_duns: '1039940674000',
          display_usage: 1000
        });
        console.log(`✅ Sample API call: ${plans.length} plans found`);
      }
      
    } catch (error) {
      console.error('❌ Quick validation failed:', error.message);
      process.exit(1);
    } finally {
      await comparePowerClient.shutdown();
    }
  } else {
    await testSuite.runFullSuite();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { ProductionTestSuite };