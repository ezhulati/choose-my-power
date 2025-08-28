#!/usr/bin/env node

/**
 * Comprehensive OG Image System Test Suite
 * Tests all components of the OG image generation system
 */

// Import paths adjusted for Node.js module resolution
let ogImageGenerator, imageStrategy, imageCache, promptGenerator, ideogramClient, batchGenerator;

try {
  ({ ogImageGenerator } = await import('../src/lib/images/og-image-generator.ts'));
  ({ imageStrategy } = await import('../src/lib/images/image-strategy.ts'));
  ({ imageCache } = await import('../src/lib/images/image-cache.ts'));
  ({ promptGenerator } = await import('../src/lib/images/prompt-generator.ts'));
  ({ ideogramClient } = await import('../src/lib/images/ideogram-client.ts'));
  ({ batchGenerator } = await import('../src/lib/images/batch-generator.ts'));
} catch (error) {
  console.error('Error importing modules:', error.message);
  console.log('Note: This test requires TypeScript compilation or ts-node');
  process.exit(1);
}

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class OGSystemTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0
    };
  }

  /**
   * Run comprehensive test suite
   */
  async runAllTests() {
    console.log(`${COLORS.bright}🧪 OG Image System Test Suite${COLORS.reset}\n`);
    console.log('Testing all components of the OG image generation system...\n');

    try {
      // Environment and configuration tests
      await this.testEnvironment();
      
      // Component tests
      await this.testPromptGeneration();
      await this.testImageStrategy();
      await this.testCacheSystem();
      await this.testIdeogramClient();
      await this.testOGImageGenerator();
      await this.testBatchSystem();
      
      // Integration tests
      await this.testMetaIntegration();
      await this.testErrorHandling();
      
      // Performance tests
      await this.testPerformance();
      
      this.printSummary();
      
    } catch (error) {
      this.logError('Fatal test error', error.message);
      process.exit(1);
    }
  }

  /**
   * Test environment configuration
   */
  async testEnvironment() {
    this.logSection('Environment Configuration');
    
    // Check API key
    const apiKey = process.env.IDEOGRAM_API_KEY;
    if (!apiKey) {
      this.logWarning('IDEOGRAM_API_KEY not set - some tests will be skipped');
    } else {
      this.logPass('IDEOGRAM_API_KEY configured');
    }
    
    // Check directories
    try {
      const fs = await import('fs/promises');
      await fs.access('./src/lib/images');
      this.logPass('Image system directory structure exists');
    } catch (error) {
      this.logFail('Image system directory structure missing', error.message);
    }
  }

  /**
   * Test prompt generation system
   */
  async testPromptGeneration() {
    this.logSection('Prompt Generation System');
    
    try {
      // Test basic prompt generation
      const context = {
        city: 'dallas-tx',
        filters: ['green-energy'],
        planCount: 50,
        lowestRate: 0.09,
        topProviders: ['TXU Energy', 'Reliant'],
        pageType: 'city',
        cityTier: 1,
        tdspZone: 'North',
        seasonalContext: 'summer'
      };
      
      const prompt = promptGenerator.generatePrompt(context);
      
      if (prompt && prompt.length > 50) {
        this.logPass('Basic prompt generation works');
      } else {
        this.logFail('Prompt too short or empty', `Length: ${prompt?.length || 0}`);
      }
      
      // Test prompt validation
      const validation = promptGenerator.validatePrompt(prompt);
      if (validation.isValid) {
        this.logPass('Prompt validation passes');
      } else {
        this.logWarning('Prompt validation issues', validation.issues.join(', '));
      }
      
      // Test prompt variations
      const variations = promptGenerator.generatePromptVariations(context, 3);
      if (variations.length === 3 && variations.every(v => v !== prompt)) {
        this.logPass('Prompt variations generate unique results');
      } else {
        this.logFail('Prompt variations not working correctly');
      }
      
      // Test different page types
      const pageTypes = ['homepage', 'city', 'filtered', 'comparison'];
      for (const pageType of pageTypes) {
        const testContext = { ...context, pageType };
        const pagePrompt = promptGenerator.generatePrompt(testContext);
        if (pagePrompt && pagePrompt.length > 50) {
          this.logPass(`${pageType} page type generates valid prompt`);
        } else {
          this.logFail(`${pageType} page type prompt generation failed`);
        }
      }
      
    } catch (error) {
      this.logFail('Prompt generation system error', error.message);
    }
  }

  /**
   * Test image strategy optimization
   */
  async testImageStrategy() {
    this.logSection('Image Strategy System');
    
    try {
      // Create test contexts
      const testContexts = this.generateTestContexts(100);
      
      // Test template selection
      const template = imageStrategy.selectImageTemplate(testContexts[0]);
      if (template && template.id) {
        this.logPass('Template selection works');
      } else {
        this.logFail('Template selection failed');
      }
      
      // Test cost savings calculation
      const savings = imageStrategy.getCostSavings(testContexts);
      if (savings.savingsPercent > 50) {
        this.logPass(`Cost optimization: ${savings.savingsPercent}% savings`);
      } else {
        this.logWarning(`Low cost optimization: ${savings.savingsPercent}% savings`);
      }
      
      // Test required templates
      const requiredTemplates = imageStrategy.getRequiredTemplates(testContexts);
      const uniqueImages = requiredTemplates.length;
      const originalPages = testContexts.length;
      
      if (uniqueImages < originalPages) {
        this.logPass(`Template optimization: ${originalPages} pages → ${uniqueImages} images`);
      } else {
        this.logFail('Template optimization not working');
      }
      
      // Test image mapping
      const mapping = imageStrategy.generateImageMapping(testContexts);
      if (mapping.size === testContexts.length) {
        this.logPass('Image mapping covers all contexts');
      } else {
        this.logFail('Image mapping incomplete');
      }
      
    } catch (error) {
      this.logFail('Image strategy system error', error.message);
    }
  }

  /**
   * Test cache system
   */
  async testCacheSystem() {
    this.logSection('Cache System');
    
    try {
      // Test cache stats
      const stats = await imageCache.getCacheStats();
      if (typeof stats.totalImages === 'number') {
        this.logPass(`Cache system accessible (${stats.totalImages} images cached)`);
      } else {
        this.logFail('Cache stats not accessible');
      }
      
      // Test context has image check
      const testContext = {
        city: 'test-city',
        filters: [],
        planCount: 0,
        lowestRate: 0,
        topProviders: [],
        pageType: 'city',
        cityTier: 1,
        tdspZone: 'North'
      };
      
      const hasImage = await imageCache.hasImage(testContext);
      if (typeof hasImage === 'boolean') {
        this.logPass('Cache image check works');
      } else {
        this.logFail('Cache image check failed');
      }
      
      // Test cache cleanup (dry run)
      const cleanedCount = await imageCache.cleanupExpired();
      if (typeof cleanedCount === 'number') {
        this.logPass(`Cache cleanup works (${cleanedCount} expired images)`);
      } else {
        this.logFail('Cache cleanup failed');
      }
      
    } catch (error) {
      this.logFail('Cache system error', error.message);
    }
  }

  /**
   * Test Ideogram API client
   */
  async testIdeogramClient() {
    this.logSection('Ideogram API Client');
    
    try {
      // Test health check
      const health = await ideogramClient.healthCheck();
      if (health) {
        this.logPass('API client health check passed');
      } else {
        this.logWarning('API client health check failed - API may be unavailable');
      }
      
      // Test client configuration
      if (ideogramClient.isConfigured && ideogramClient.isConfigured()) {
        this.logPass('API client properly configured');
      } else {
        this.logWarning('API client not configured - set IDEOGRAM_API_KEY');
      }
      
      // Test rate limiting info
      const rateLimitInfo = await ideogramClient.getRateLimitInfo();
      if (rateLimitInfo && rateLimitInfo.remaining !== undefined) {
        this.logPass(`Rate limit info accessible (${rateLimitInfo.remaining} remaining)`);
      } else {
        this.logInfo('Rate limit info not available (expected without API key)');
      }
      
    } catch (error) {
      this.logWarning('Ideogram API client error (expected without API key)', error.message);
    }
  }

  /**
   * Test OG Image Generator
   */
  async testOGImageGenerator() {
    this.logSection('OG Image Generator');
    
    try {
      const testContext = {
        city: 'dallas-tx',
        filters: ['green-energy'],
        planCount: 50,
        lowestRate: 0.09,
        topProviders: ['TXU Energy'],
        pageType: 'city',
        cityTier: 1,
        tdspZone: 'North'
      };
      
      // Test OG image URL generation (should fallback without API key)
      const imageUrl = await ogImageGenerator.getOGImageUrl(testContext);
      if (imageUrl && imageUrl.startsWith('/images/og/')) {
        this.logPass('OG image URL generation works (fallback)');
      } else {
        this.logFail('OG image URL generation failed');
      }
      
      // Test meta integration method
      const metaImageUrl = await ogImageGenerator.getOGImageForMeta(
        'dallas-tx', 
        ['green-energy'], 
        50, 
        0.09, 
        ['TXU Energy'], 
        'city'
      );
      
      if (metaImageUrl && metaImageUrl.startsWith('/images/og/')) {
        this.logPass('Meta integration method works');
      } else {
        this.logFail('Meta integration method failed');
      }
      
      // Test health check
      const health = await ogImageGenerator.healthCheck();
      if (health && typeof health.overallHealth === 'boolean') {
        this.logPass('OG generator health check works');
        if (health.overallHealth) {
          this.logPass('System health is good');
        } else {
          this.logWarning('System health issues detected');
        }
      } else {
        this.logFail('Health check failed');
      }
      
    } catch (error) {
      this.logFail('OG Image Generator error', error.message);
    }
  }

  /**
   * Test batch generation system
   */
  async testBatchSystem() {
    this.logSection('Batch Generation System');
    
    try {
      // Test batch stats
      const stats = await batchGenerator.getBatchStats();
      if (typeof stats.activeJobs === 'number') {
        this.logPass('Batch statistics accessible');
      } else {
        this.logFail('Batch statistics not accessible');
      }
      
      // Test job cleanup
      const cleanedJobs = batchGenerator.cleanupOldJobs(30); // 30 days
      if (typeof cleanedJobs === 'number') {
        this.logPass(`Batch job cleanup works (${cleanedJobs} jobs cleaned)`);
      } else {
        this.logFail('Batch job cleanup failed');
      }
      
      // Test job status retrieval
      const allJobs = batchGenerator.getAllJobs();
      if (Array.isArray(allJobs)) {
        this.logPass(`Batch job listing works (${allJobs.length} jobs)`);
      } else {
        this.logFail('Batch job listing failed');
      }
      
    } catch (error) {
      this.logFail('Batch system error', error.message);
    }
  }

  /**
   * Test meta generator integration
   */
  async testMetaIntegration() {
    this.logSection('Meta Generator Integration');
    
    try {
      // Import and test meta generator
      const { generateFacetedMeta } = await import('../src/lib/seo/meta-generator-scale.js');
      
      if (typeof generateFacetedMeta === 'function') {
        this.logPass('Meta generator function accessible');
        
        // Test meta generation with OG images
        const testMeta = await generateFacetedMeta(
          'dallas-tx',
          ['green-energy'],
          50,
          0.09,
          ['TXU Energy']
        );
        
        if (testMeta && testMeta.ogImage) {
          this.logPass('Meta generator includes OG images');
        } else {
          this.logFail('Meta generator missing OG image');
        }
        
      } else {
        this.logFail('Meta generator function not accessible');
      }
      
    } catch (error) {
      this.logFail('Meta integration error', error.message);
    }
  }

  /**
   * Test error handling and fallbacks
   */
  async testErrorHandling() {
    this.logSection('Error Handling & Fallbacks');
    
    try {
      // Test with invalid context
      const invalidContext = {
        city: 'nonexistent-city',
        filters: ['invalid-filter'],
        planCount: -1,
        lowestRate: -1,
        topProviders: [],
        pageType: 'invalid',
        cityTier: 99,
        tdspZone: 'InvalidZone'
      };
      
      const fallbackUrl = await ogImageGenerator.getOGImageUrl(invalidContext);
      if (fallbackUrl && fallbackUrl.includes('fallback')) {
        this.logPass('Fallback system works for invalid context');
      } else {
        this.logWarning('Fallback system behavior unexpected');
      }
      
      // Test prompt validation with problematic input
      const badPrompt = 'text words letters typography';
      const validation = promptGenerator.validatePrompt(badPrompt);
      if (!validation.isValid && validation.issues.length > 0) {
        this.logPass('Prompt validation catches text-related issues');
      } else {
        this.logWarning('Prompt validation may be too permissive');
      }
      
    } catch (error) {
      this.logFail('Error handling test failed', error.message);
    }
  }

  /**
   * Test system performance
   */
  async testPerformance() {
    this.logSection('Performance Tests');
    
    try {
      // Test prompt generation speed
      const startTime = Date.now();
      const testContext = {
        city: 'houston-tx',
        filters: ['fixed-rate', '12-month'],
        planCount: 75,
        lowestRate: 0.08,
        topProviders: ['TXU Energy', 'Reliant'],
        pageType: 'filtered',
        cityTier: 1,
        tdspZone: 'Coast'
      };
      
      // Generate 50 prompts
      for (let i = 0; i < 50; i++) {
        promptGenerator.generatePrompt({ ...testContext, variationIndex: i });
      }
      
      const promptTime = Date.now() - startTime;
      if (promptTime < 1000) { // Under 1 second for 50 prompts
        this.logPass(`Prompt generation performance: ${promptTime}ms for 50 prompts`);
      } else {
        this.logWarning(`Prompt generation may be slow: ${promptTime}ms for 50 prompts`);
      }
      
      // Test strategy optimization performance
      const strategyStartTime = Date.now();
      const testContexts = this.generateTestContexts(1000);
      const savings = imageStrategy.getCostSavings(testContexts);
      const strategyTime = Date.now() - strategyStartTime;
      
      if (strategyTime < 2000) { // Under 2 seconds for 1000 contexts
        this.logPass(`Strategy optimization performance: ${strategyTime}ms for 1000 contexts`);
      } else {
        this.logWarning(`Strategy optimization may be slow: ${strategyTime}ms for 1000 contexts`);
      }
      
    } catch (error) {
      this.logFail('Performance test error', error.message);
    }
  }

  /**
   * Generate test contexts for testing
   */
  generateTestContexts(count) {
    const contexts = [];
    const cities = ['dallas-tx', 'houston-tx', 'austin-tx', 'san-antonio-tx', 'fort-worth-tx'];
    const filterSets = [[], ['green-energy'], ['fixed-rate'], ['12-month'], ['green-energy', 'fixed-rate']];
    const pageTypes = ['city', 'filtered', 'comparison'];
    
    for (let i = 0; i < count; i++) {
      const city = cities[i % cities.length];
      const filters = filterSets[i % filterSets.length];
      const pageType = filters.length > 0 ? 'filtered' : pageTypes[i % pageTypes.length];
      
      contexts.push({
        city,
        filters,
        planCount: Math.floor(Math.random() * 100) + 20,
        lowestRate: Math.random() * 0.1 + 0.08,
        topProviders: ['TXU Energy', 'Reliant'],
        pageType,
        cityTier: Math.floor(Math.random() * 3) + 1,
        tdspZone: ['North', 'Coast', 'Central', 'South'][Math.floor(Math.random() * 4)],
        seasonalContext: ['winter', 'summer', 'spring', 'fall'][Math.floor(Math.random() * 4)]
      });
    }
    
    return contexts;
  }

  /**
   * Logging methods
   */
  logSection(title) {
    console.log(`\n${COLORS.bright}${COLORS.cyan}📋 ${title}${COLORS.reset}`);
    console.log('─'.repeat(60));
  }

  logPass(message, details = '') {
    console.log(`${COLORS.green}✅ ${message}${COLORS.reset}${details ? ` ${COLORS.blue}(${details})${COLORS.reset}` : ''}`);
    this.testResults.passed++;
  }

  logFail(message, details = '') {
    console.log(`${COLORS.red}❌ ${message}${COLORS.reset}${details ? ` ${COLORS.red}(${details})${COLORS.reset}` : ''}`);
    this.testResults.failed++;
  }

  logWarning(message, details = '') {
    console.log(`${COLORS.yellow}⚠️  ${message}${COLORS.reset}${details ? ` ${COLORS.yellow}(${details})${COLORS.reset}` : ''}`);
    this.testResults.warnings++;
  }

  logInfo(message, details = '') {
    console.log(`${COLORS.blue}ℹ️  ${message}${COLORS.reset}${details ? ` ${COLORS.blue}(${details})${COLORS.reset}` : ''}`);
  }

  logError(message, details = '') {
    console.log(`${COLORS.red}${COLORS.bright}💥 ${message}${COLORS.reset}${details ? ` ${COLORS.red}(${details})${COLORS.reset}` : ''}`);
    this.testResults.failed++;
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log(`\n${COLORS.bright}${COLORS.cyan}📊 Test Summary${COLORS.reset}`);
    console.log('═'.repeat(60));
    console.log(`${COLORS.green}✅ Passed: ${this.testResults.passed}${COLORS.reset}`);
    console.log(`${COLORS.red}❌ Failed: ${this.testResults.failed}${COLORS.reset}`);
    console.log(`${COLORS.yellow}⚠️  Warnings: ${this.testResults.warnings}${COLORS.reset}`);
    
    const total = this.testResults.passed + this.testResults.failed;
    const passRate = total > 0 ? Math.round((this.testResults.passed / total) * 100) : 0;
    
    console.log(`\n${COLORS.bright}Pass Rate: ${passRate}%${COLORS.reset}`);
    
    if (this.testResults.failed === 0) {
      console.log(`\n${COLORS.green}${COLORS.bright}🎉 All tests passed! System is ready for production.${COLORS.reset}`);
    } else if (this.testResults.failed <= 2) {
      console.log(`\n${COLORS.yellow}${COLORS.bright}⚠️  Minor issues detected. Review failures before production.${COLORS.reset}`);
    } else {
      console.log(`\n${COLORS.red}${COLORS.bright}🚨 Significant issues detected. Fix failures before proceeding.${COLORS.reset}`);
    }
    
    console.log(`\n${COLORS.blue}💡 Next steps:${COLORS.reset}`);
    console.log(`  1. Set IDEOGRAM_API_KEY in .env for full functionality`);
    console.log(`  2. Run "npm run og:generate-priority" to create initial images`);
    console.log(`  3. Monitor with "npm run og:monitor" during generation`);
    console.log(`  4. Use "npm run og:cache-stats" to track performance`);
  }
}

// Run the test suite
async function main() {
  const tester = new OGSystemTester();
  await tester.runAllTests();
}

main().catch(console.error);