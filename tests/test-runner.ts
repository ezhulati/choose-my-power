#!/usr/bin/env node
/**
 * Comprehensive Test Runner
 * Orchestrates unit, integration, e2e, performance, and SEO tests
 * Generates consolidated test reports with actionable insights
 */

import { spawn, exec } from 'child_process';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

interface TestResult {
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'seo';
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage?: number;
  errors: string[];
  warnings: string[];
}

interface TestReport {
  timestamp: string;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  overallDuration: number;
  overallCoverage: number;
  results: TestResult[];
  recommendations: string[];
  criticalIssues: string[];
}

class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async runAllTests(options: {
    includeUnit?: boolean;
    includeIntegration?: boolean;
    includeE2E?: boolean;
    includePerformance?: boolean;
    includeSEO?: boolean;
    generateReport?: boolean;
  } = {}) {
    const {
      includeUnit = true,
      includeIntegration = true,
      includeE2E = true,
      includePerformance = true,
      includeSEO = true,
      generateReport = true
    } = options;

    console.log('🚀 Starting Comprehensive Test Suite');
    console.log('=' .repeat(60));
    
    this.startTime = Date.now();

    try {
      if (includeUnit) {
        console.log('\n📋 Running Unit Tests...');
        await this.runUnitTests();
      }

      if (includeIntegration) {
        console.log('\n🔗 Running Integration Tests...');
        await this.runIntegrationTests();
      }

      if (includeE2E) {
        console.log('\n🎭 Running End-to-End Tests...');
        await this.runE2ETests();
      }

      if (includePerformance) {
        console.log('\n⚡ Running Performance Tests...');
        await this.runPerformanceTests();
      }

      if (includeSEO) {
        console.log('\n🔍 Running SEO Tests...');
        await this.runSEOTests();
      }

      if (generateReport) {
        console.log('\n📊 Generating Test Report...');
        await this.generateReport();
      }

      console.log('\n✅ Test Suite Complete!');
      this.printSummary();

    } catch (error) {
      console.error('❌ Test Suite Failed:', error);
      process.exit(1);
    }
  }

  private async runUnitTests(): Promise<void> {
    const result: TestResult = {
      type: 'unit',
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      coverage: 0,
      errors: [],
      warnings: []
    };

    const startTime = Date.now();

    try {
      const output = await this.execCommand('npm run test:coverage');
      result.duration = Date.now() - startTime;
      
      // Parse vitest output
      const lines = output.split('\n');
      
      for (const line of lines) {
        if (line.includes('✓') || line.includes('PASS')) {
          result.passed++;
        } else if (line.includes('✗') || line.includes('FAIL')) {
          result.failed++;
          result.errors.push(line.trim());
        } else if (line.includes('SKIP')) {
          result.skipped++;
        } else if (line.includes('Coverage:') || line.includes('%')) {
          const match = line.match(/(\d+\.?\d*)%/);
          if (match) {
            result.coverage = parseFloat(match[1]);
          }
        }
      }

      if (result.coverage && result.coverage < 80) {
        result.warnings.push(`Code coverage (${result.coverage}%) is below 80% threshold`);
      }

    } catch (error) {
      result.failed++;
      result.errors.push(`Unit test execution failed: ${error}`);
      result.duration = Date.now() - startTime;
    }

    this.results.push(result);
  }

  private async runIntegrationTests(): Promise<void> {
    const result: TestResult = {
      type: 'integration',
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      errors: [],
      warnings: []
    };

    const startTime = Date.now();

    try {
      const output = await this.execCommand('npm run test:run -- tests/integration');
      result.duration = Date.now() - startTime;
      
      // Parse output similar to unit tests
      this.parseTestOutput(output, result);

    } catch (error) {
      result.failed++;
      result.errors.push(`Integration test execution failed: ${error}`);
      result.duration = Date.now() - startTime;
    }

    this.results.push(result);
  }

  private async runE2ETests(): Promise<void> {
    const result: TestResult = {
      type: 'e2e',
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      errors: [],
      warnings: []
    };

    const startTime = Date.now();

    try {
      const output = await this.execCommand('npm run test:e2e -- --reporter=line');
      result.duration = Date.now() - startTime;
      
      // Parse Playwright output
      const lines = output.split('\n');
      
      for (const line of lines) {
        if (line.includes('✓') || line.includes('passed')) {
          result.passed++;
        } else if (line.includes('✗') || line.includes('failed')) {
          result.failed++;
          result.errors.push(line.trim());
        } else if (line.includes('skipped')) {
          result.skipped++;
        }
      }

      // Check for long test durations
      if (result.duration > 300000) { // 5 minutes
        result.warnings.push(`E2E tests took ${Math.round(result.duration / 1000)}s - consider optimizing`);
      }

    } catch (error) {
      result.failed++;
      result.errors.push(`E2E test execution failed: ${error}`);
      result.duration = Date.now() - startTime;
    }

    this.results.push(result);
  }

  private async runPerformanceTests(): Promise<void> {
    const result: TestResult = {
      type: 'performance',
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      errors: [],
      warnings: []
    };

    const startTime = Date.now();

    try {
      const output = await this.execCommand('npm run test:e2e -- tests/e2e/performance.spec.ts --reporter=line');
      result.duration = Date.now() - startTime;
      
      this.parseTestOutput(output, result);

      // Performance-specific warnings
      if (result.failed > 0) {
        result.warnings.push('Performance tests are failing - this may impact user experience');
      }

    } catch (error) {
      result.failed++;
      result.errors.push(`Performance test execution failed: ${error}`);
      result.duration = Date.now() - startTime;
    }

    this.results.push(result);
  }

  private async runSEOTests(): Promise<void> {
    const result: TestResult = {
      type: 'seo',
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      errors: [],
      warnings: []
    };

    const startTime = Date.now();

    try {
      const output = await this.execCommand('npm run test:e2e -- tests/e2e/seo.spec.ts --reporter=line');
      result.duration = Date.now() - startTime;
      
      this.parseTestOutput(output, result);

      // SEO-specific warnings
      if (result.failed > 0) {
        result.warnings.push('SEO tests are failing - this may impact search visibility');
      }

    } catch (error) {
      result.failed++;
      result.errors.push(`SEO test execution failed: ${error}`);
      result.duration = Date.now() - startTime;
    }

    this.results.push(result);
  }

  private parseTestOutput(output: string, result: TestResult): void {
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('✓') || line.includes('PASS') || line.includes('passed')) {
        result.passed++;
      } else if (line.includes('✗') || line.includes('FAIL') || line.includes('failed')) {
        result.failed++;
        result.errors.push(line.trim());
      } else if (line.includes('SKIP') || line.includes('skipped')) {
        result.skipped++;
      }
    }
  }

  private async generateReport(): Promise<void> {
    const totalDuration = Date.now() - this.startTime;
    
    const report: TestReport = {
      timestamp: new Date().toISOString(),
      totalTests: this.results.reduce((sum, r) => sum + r.passed + r.failed + r.skipped, 0),
      totalPassed: this.results.reduce((sum, r) => sum + r.passed, 0),
      totalFailed: this.results.reduce((sum, r) => sum + r.failed, 0),
      totalSkipped: this.results.reduce((sum, r) => sum + r.skipped, 0),
      overallDuration: totalDuration,
      overallCoverage: this.calculateOverallCoverage(),
      results: this.results,
      recommendations: this.generateRecommendations(),
      criticalIssues: this.identifyCriticalIssues()
    };

    // Ensure reports directory exists
    const reportsDir = path.join(process.cwd(), 'test-reports');
    if (!existsSync(reportsDir)) {
      await mkdir(reportsDir, { recursive: true });
    }

    // Write JSON report
    const jsonReport = path.join(reportsDir, `test-report-${Date.now()}.json`);
    await writeFile(jsonReport, JSON.stringify(report, null, 2));

    // Write HTML report
    const htmlReport = path.join(reportsDir, `test-report-${Date.now()}.html`);
    await writeFile(htmlReport, this.generateHTMLReport(report));

    console.log(`📋 Test reports generated:`);
    console.log(`   JSON: ${jsonReport}`);
    console.log(`   HTML: ${htmlReport}`);
  }

  private calculateOverallCoverage(): number {
    const unitResult = this.results.find(r => r.type === 'unit');
    return unitResult?.coverage || 0;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const unitResult = this.results.find(r => r.type === 'unit');
    const e2eResult = this.results.find(r => r.type === 'e2e');
    const performanceResult = this.results.find(r => r.type === 'performance');
    
    if (unitResult && unitResult.coverage && unitResult.coverage < 80) {
      recommendations.push(`Increase unit test coverage from ${unitResult.coverage}% to at least 80%`);
    }
    
    if (e2eResult && e2eResult.duration > 300000) {
      recommendations.push('Optimize E2E test performance - tests are taking too long');
    }
    
    if (performanceResult && performanceResult.failed > 0) {
      recommendations.push('Address performance test failures to ensure good user experience');
    }
    
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    if (totalFailed > 0) {
      recommendations.push(`Fix ${totalFailed} failing tests before deployment`);
    }

    if (recommendations.length === 0) {
      recommendations.push('All tests are passing! Consider adding more edge case tests.');
    }
    
    return recommendations;
  }

  private identifyCriticalIssues(): string[] {
    const criticalIssues: string[] = [];
    
    this.results.forEach(result => {
      if (result.failed > 0) {
        criticalIssues.push(`${result.type} tests have ${result.failed} failures`);
      }
      
      result.errors.forEach(error => {
        if (error.toLowerCase().includes('api') || error.toLowerCase().includes('network')) {
          criticalIssues.push(`API/Network issue detected: ${error}`);
        }
        if (error.toLowerCase().includes('performance') || error.toLowerCase().includes('timeout')) {
          criticalIssues.push(`Performance issue detected: ${error}`);
        }
      });
    });
    
    return criticalIssues;
  }

  private generateHTMLReport(report: TestReport): string {
    const passRate = Math.round((report.totalPassed / report.totalTests) * 100);
    const coverageColor = report.overallCoverage >= 80 ? 'green' : report.overallCoverage >= 60 ? 'orange' : 'red';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ChooseMyPower Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #002768; border-bottom: 3px solid #be0b31; padding-bottom: 10px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #002768; }
        .metric-label { color: #666; margin-top: 5px; }
        .pass { color: #28a745; }
        .fail { color: #dc3545; }
        .skip { color: #ffc107; }
        .results { margin: 30px 0; }
        .test-type { background: white; border: 1px solid #ddd; margin: 15px 0; border-radius: 8px; overflow: hidden; }
        .test-type h3 { background: #002768; color: white; margin: 0; padding: 15px; }
        .test-details { padding: 20px; }
        .recommendations, .critical { margin: 30px 0; padding: 20px; border-radius: 8px; }
        .recommendations { background: #e3f2fd; border-left: 4px solid #2196f3; }
        .critical { background: #ffebee; border-left: 4px solid #f44336; }
        .timestamp { color: #666; font-size: 0.9em; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
        .coverage-${coverageColor} { color: ${coverageColor}; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔌 ChooseMyPower Test Report</h1>
        <p class="timestamp">Generated: ${new Date(report.timestamp).toLocaleString()}</p>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value pass">${report.totalPassed}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value fail">${report.totalFailed}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value skip">${report.totalSkipped}</div>
                <div class="metric-label">Skipped</div>
            </div>
            <div class="metric">
                <div class="metric-value">${passRate}%</div>
                <div class="metric-label">Pass Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value coverage-${coverageColor}">${report.overallCoverage}%</div>
                <div class="metric-label">Coverage</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Math.round(report.overallDuration / 1000)}s</div>
                <div class="metric-label">Duration</div>
            </div>
        </div>

        <div class="results">
            <h2>Test Results by Type</h2>
            ${report.results.map(result => `
                <div class="test-type">
                    <h3>${result.type.toUpperCase()} Tests</h3>
                    <div class="test-details">
                        <p><strong>Passed:</strong> <span class="pass">${result.passed}</span> | 
                           <strong>Failed:</strong> <span class="fail">${result.failed}</span> | 
                           <strong>Skipped:</strong> <span class="skip">${result.skipped}</span></p>
                        <p><strong>Duration:</strong> ${Math.round(result.duration / 1000)}s</p>
                        ${result.coverage ? `<p><strong>Coverage:</strong> ${result.coverage}%</p>` : ''}
                        ${result.errors.length > 0 ? `
                            <h4>Errors:</h4>
                            <ul>
                                ${result.errors.map(error => `<li>${error}</li>`).join('')}
                            </ul>
                        ` : ''}
                        ${result.warnings.length > 0 ? `
                            <h4>Warnings:</h4>
                            <ul>
                                ${result.warnings.map(warning => `<li>${warning}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>

        ${report.criticalIssues.length > 0 ? `
            <div class="critical">
                <h2>🚨 Critical Issues</h2>
                <ul>
                    ${report.criticalIssues.map(issue => `<li>${issue}</li>`).join('')}
                </ul>
            </div>
        ` : ''}

        <div class="recommendations">
            <h2>💡 Recommendations</h2>
            <ul>
                ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>

        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; text-align: center;">
            <p>ChooseMyPower.org Test Suite - Ensuring Quality & Reliability</p>
        </footer>
    </div>
</body>
</html>`;
  }

  private printSummary(): void {
    const totalTests = this.results.reduce((sum, r) => sum + r.passed + r.failed + r.skipped, 0);
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const passRate = Math.round((totalPassed / totalTests) * 100);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUITE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed} (${passRate}%)`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Duration: ${Math.round((Date.now() - this.startTime) / 1000)}s`);
    console.log(`Coverage: ${this.calculateOverallCoverage()}%`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 All tests passed! Ready for deployment!');
    } else {
      console.log(`\n⚠️  ${totalFailed} tests failed - review issues before deployment`);
    }
    
    console.log('='.repeat(60));
  }

  private execCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
        if (error) {
          // Don't reject on test failures, just capture output
          resolve(stdout + stderr);
        } else {
          resolve(stdout);
        }
      });
    });
  }
}

// CLI interface
const args = process.argv.slice(2);
const runner = new TestRunner();

const options = {
  includeUnit: !args.includes('--no-unit'),
  includeIntegration: !args.includes('--no-integration'),
  includeE2E: !args.includes('--no-e2e'),
  includePerformance: !args.includes('--no-performance'),
  includeSEO: !args.includes('--no-seo'),
  generateReport: !args.includes('--no-report')
};

runner.runAllTests(options).catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});