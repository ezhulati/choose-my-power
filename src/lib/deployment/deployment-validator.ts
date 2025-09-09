/**
 * Production Deployment Validation Service
 * Task T035: Create production deployment configuration
 * Phase 3.5 Polish & Validation: Deployment readiness validation
 */

import { productionConfigService, type ProductionConfig } from './production-config';

export interface DeploymentCheck {
  name: string;
  category: 'configuration' | 'security' | 'performance' | 'monitoring' | 'database' | 'build';
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  details?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  automated: boolean;
  fixable: boolean;
  fix?: string;
}

export interface DeploymentValidationResult {
  ready: boolean;
  score: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  criticalIssues: number;
  highIssues: number;
  checks: DeploymentCheck[];
  recommendations: string[];
  deploymentPlan: {
    strategy: 'immediate' | 'staged' | 'blue-green' | 'canary';
    estimatedDuration: string;
    rollbackPlan: string;
    prerequisites: string[];
  };
}

export class DeploymentValidator {
  private config: ProductionConfig;

  constructor(config?: ProductionConfig) {
    this.config = config || productionConfigService.getConfig();
  }

  /**
   * Run comprehensive deployment validation
   */
  async validateDeployment(): Promise<DeploymentValidationResult> {
    const checks: DeploymentCheck[] = [];

    // Configuration checks
    checks.push(...await this.validateConfiguration());
    
    // Security checks
    checks.push(...await this.validateSecurity());
    
    // Performance checks
    checks.push(...await this.validatePerformance());
    
    // Monitoring checks
    checks.push(...await this.validateMonitoring());
    
    // Database checks
    checks.push(...await this.validateDatabase());
    
    // Build checks
    checks.push(...await this.validateBuild());

    return this.generateValidationResult(checks);
  }

  /**
   * Validate configuration settings
   */
  private async validateConfiguration(): Promise<DeploymentCheck[]> {
    const checks: DeploymentCheck[] = [];

    // Environment validation
    checks.push({
      name: 'Environment Configuration',
      category: 'configuration',
      status: this.config.environment === 'production' ? 'pass' : 'warning',
      message: `Environment: ${this.config.environment}`,
      details: this.config.environment === 'production' ? 
        'Production environment correctly configured' : 
        'Non-production environment - ensure this is intentional',
      severity: this.config.environment === 'production' ? 'low' : 'medium',
      automated: true,
      fixable: true,
      fix: 'Set NODE_ENV=production for production deployments'
    });

    // Domain validation
    const domainValid = this.config.deployment.domain && 
                       this.config.deployment.domain.includes('choosemypower.org');
    checks.push({
      name: 'Domain Configuration',
      category: 'configuration',
      status: domainValid ? 'pass' : 'fail',
      message: `Domain: ${this.config.deployment.domain}`,
      details: domainValid ? 
        'Domain correctly configured' : 
        'Invalid or missing domain configuration',
      severity: 'critical',
      automated: true,
      fixable: true,
      fix: 'Configure deployment.domain in production config'
    });

    // Node version validation
    const nodeVersionValid = this.config.deployment.nodeVersion && 
                           parseFloat(this.config.deployment.nodeVersion) >= 20.5;
    checks.push({
      name: 'Node.js Version',
      category: 'configuration',
      status: nodeVersionValid ? 'pass' : 'warning',
      message: `Node.js ${this.config.deployment.nodeVersion}`,
      details: nodeVersionValid ? 
        'Node.js version meets requirements' : 
        'Node.js version may be outdated',
      severity: 'medium',
      automated: true,
      fixable: true,
      fix: 'Update Node.js to version 20.5.0 or higher'
    });

    // Environment variables validation
    const requiredEnvVars = ['NODE_ENV', 'COMPAREPOWER_API_KEY'];
    const missingVars = requiredEnvVars.filter(v => !process.env[v]);
    checks.push({
      name: 'Environment Variables',
      category: 'configuration',
      status: missingVars.length === 0 ? 'pass' : 'fail',
      message: missingVars.length === 0 ? 
        'All required environment variables present' : 
        `Missing: ${missingVars.join(', ')}`,
      details: `Required variables: ${requiredEnvVars.join(', ')}`,
      severity: 'critical',
      automated: true,
      fixable: true,
      fix: 'Configure missing environment variables in deployment platform'
    });

    return checks;
  }

  /**
   * Validate security configuration
   */
  private async validateSecurity(): Promise<DeploymentCheck[]> {
    const checks: DeploymentCheck[] = [];

    // CSP validation
    checks.push({
      name: 'Content Security Policy',
      category: 'security',
      status: this.config.security.enableCSP ? 'pass' : 'fail',
      message: this.config.security.enableCSP ? 'CSP enabled' : 'CSP disabled',
      details: 'Content Security Policy protects against XSS attacks',
      severity: 'high',
      automated: true,
      fixable: true,
      fix: 'Enable CSP in security configuration'
    });

    // HSTS validation
    checks.push({
      name: 'HTTP Strict Transport Security',
      category: 'security',
      status: this.config.security.enableHSTS ? 'pass' : 'warning',
      message: this.config.security.enableHSTS ? 'HSTS enabled' : 'HSTS disabled',
      details: 'HSTS enforces secure connections',
      severity: 'medium',
      automated: true,
      fixable: true,
      fix: 'Enable HSTS in security configuration'
    });

    // Rate limiting validation
    checks.push({
      name: 'Rate Limiting',
      category: 'security',
      status: this.config.security.enableRateLimiting ? 'pass' : 'warning',
      message: this.config.security.enableRateLimiting ? 'Rate limiting enabled' : 'Rate limiting disabled',
      details: 'Rate limiting prevents abuse and DoS attacks',
      severity: 'medium',
      automated: true,
      fixable: true,
      fix: 'Enable rate limiting in security configuration'
    });

    // Trusted domains validation
    checks.push({
      name: 'Trusted Domains',
      category: 'security',
      status: this.config.security.trustedDomains.length > 0 ? 'pass' : 'fail',
      message: `${this.config.security.trustedDomains.length} trusted domains configured`,
      details: `Domains: ${this.config.security.trustedDomains.join(', ')}`,
      severity: 'high',
      automated: true,
      fixable: true,
      fix: 'Configure trusted domains in security settings'
    });

    return checks;
  }

  /**
   * Validate performance configuration
   */
  private async validatePerformance(): Promise<DeploymentCheck[]> {
    const checks: DeploymentCheck[] = [];

    // Caching validation
    checks.push({
      name: 'Caching Strategy',
      category: 'performance',
      status: this.config.performance.enableCaching ? 'pass' : 'warning',
      message: this.config.performance.enableCaching ? 
        `Caching enabled (${this.config.performance.cacheStrategy})` : 
        'Caching disabled',
      details: 'Caching improves performance and reduces server load',
      severity: 'medium',
      automated: true,
      fixable: true,
      fix: 'Enable caching in performance configuration'
    });

    // Compression validation
    checks.push({
      name: 'Compression',
      category: 'performance',
      status: this.config.performance.enableCompression ? 'pass' : 'warning',
      message: this.config.performance.enableCompression ? 'Compression enabled' : 'Compression disabled',
      details: 'Compression reduces bandwidth usage and improves loading times',
      severity: 'medium',
      automated: true,
      fixable: true,
      fix: 'Enable compression in performance configuration'
    });

    // Image optimization validation
    checks.push({
      name: 'Image Optimization',
      category: 'performance',
      status: this.config.performance.enableImageOptimization ? 'pass' : 'warning',
      message: this.config.performance.enableImageOptimization ? 'Image optimization enabled' : 'Image optimization disabled',
      details: 'Image optimization improves Core Web Vitals scores',
      severity: 'medium',
      automated: true,
      fixable: true,
      fix: 'Enable image optimization in performance configuration'
    });

    // Bundle analysis validation
    checks.push({
      name: 'Bundle Analysis',
      category: 'performance',
      status: this.config.performance.bundleAnalysis ? 'info' : 'info',
      message: this.config.performance.bundleAnalysis ? 'Bundle analysis enabled' : 'Bundle analysis disabled',
      details: 'Bundle analysis helps identify optimization opportunities',
      severity: 'low',
      automated: true,
      fixable: true,
      fix: 'Enable bundle analysis for production insights'
    });

    return checks;
  }

  /**
   * Validate monitoring configuration
   */
  private async validateMonitoring(): Promise<DeploymentCheck[]> {
    const checks: DeploymentCheck[] = [];

    // Health checks validation
    checks.push({
      name: 'Health Checks',
      category: 'monitoring',
      status: this.config.monitoring.enableHealthChecks ? 'pass' : 'fail',
      message: this.config.monitoring.enableHealthChecks ? 'Health checks enabled' : 'Health checks disabled',
      details: 'Health checks are essential for production monitoring',
      severity: 'critical',
      automated: true,
      fixable: true,
      fix: 'Enable health checks in monitoring configuration'
    });

    // Performance monitoring validation
    checks.push({
      name: 'Performance Monitoring',
      category: 'monitoring',
      status: this.config.monitoring.enablePerformanceMonitoring ? 'pass' : 'warning',
      message: this.config.monitoring.enablePerformanceMonitoring ? 'Performance monitoring enabled' : 'Performance monitoring disabled',
      details: 'Performance monitoring helps identify bottlenecks',
      severity: 'medium',
      automated: true,
      fixable: true,
      fix: 'Enable performance monitoring in configuration'
    });

    // Error reporting validation
    checks.push({
      name: 'Error Reporting',
      category: 'monitoring',
      status: this.config.monitoring.enableErrorReporting ? 'pass' : 'warning',
      message: this.config.monitoring.enableErrorReporting ? 'Error reporting enabled' : 'Error reporting disabled',
      details: 'Error reporting helps identify and fix issues quickly',
      severity: 'medium',
      automated: true,
      fixable: true,
      fix: 'Enable error reporting in monitoring configuration'
    });

    // Alerting validation
    checks.push({
      name: 'Alerting Configuration',
      category: 'monitoring',
      status: this.config.monitoring.alertingChannels.length > 0 ? 'pass' : 'warning',
      message: `${this.config.monitoring.alertingChannels.length} alerting channels configured`,
      details: `Channels: ${this.config.monitoring.alertingChannels.join(', ')}`,
      severity: 'medium',
      automated: true,
      fixable: true,
      fix: 'Configure alerting channels (Slack, email, etc.)'
    });

    return checks;
  }

  /**
   * Validate database configuration
   */
  private async validateDatabase(): Promise<DeploymentCheck[]> {
    const checks: DeploymentCheck[] = [];

    // Database provider validation
    checks.push({
      name: 'Database Provider',
      category: 'database',
      status: this.config.database.provider !== 'mock' ? 'pass' : 'warning',
      message: `Provider: ${this.config.database.provider}`,
      details: this.config.database.provider !== 'mock' ? 
        'Real database provider configured' : 
        'Mock database provider - not recommended for production',
      severity: this.config.database.provider === 'mock' ? 'high' : 'low',
      automated: true,
      fixable: true,
      fix: 'Configure a real database provider (Neon, PlanetScale, PostgreSQL)'
    });

    // Connection pooling validation
    checks.push({
      name: 'Connection Pooling',
      category: 'database',
      status: this.config.database.connectionPooling ? 'pass' : 'warning',
      message: this.config.database.connectionPooling ? 'Connection pooling enabled' : 'Connection pooling disabled',
      details: 'Connection pooling improves database performance',
      severity: 'medium',
      automated: true,
      fixable: true,
      fix: 'Enable connection pooling in database configuration'
    });

    // SSL validation
    checks.push({
      name: 'Database SSL',
      category: 'database',
      status: this.config.database.ssl ? 'pass' : 'warning',
      message: this.config.database.ssl ? 'SSL enabled' : 'SSL disabled',
      details: 'SSL encrypts database connections',
      severity: 'high',
      automated: true,
      fixable: true,
      fix: 'Enable SSL in database configuration'
    });

    // Backup validation
    checks.push({
      name: 'Backup Schedule',
      category: 'database',
      status: this.config.database.backupSchedule ? 'pass' : 'warning',
      message: this.config.database.backupSchedule ? 
        `Backups scheduled: ${this.config.database.backupSchedule}` : 
        'No backup schedule configured',
      details: 'Regular backups are essential for data protection',
      severity: 'high',
      automated: true,
      fixable: true,
      fix: 'Configure automated backup schedule'
    });

    return checks;
  }

  /**
   * Validate build configuration
   */
  private async validateBuild(): Promise<DeploymentCheck[]> {
    const checks: DeploymentCheck[] = [];

    // Build command validation
    checks.push({
      name: 'Build Command',
      category: 'build',
      status: this.config.deployment.buildCommand ? 'pass' : 'fail',
      message: `Command: ${this.config.deployment.buildCommand}`,
      details: 'Build command must be configured for deployment',
      severity: 'critical',
      automated: true,
      fixable: true,
      fix: 'Configure build command in deployment settings'
    });

    // Cities configuration validation
    const citiesValid = this.config.build.maxCities > 0 && this.config.build.maxCities <= 881;
    checks.push({
      name: 'Cities Configuration',
      category: 'build',
      status: citiesValid ? 'pass' : 'warning',
      message: `Max cities: ${this.config.build.maxCities}`,
      details: `Build tier: ${this.config.build.tier}`,
      severity: 'medium',
      automated: true,
      fixable: true,
      fix: 'Configure appropriate max cities for deployment tier'
    });

    // Batch configuration validation
    const batchValid = this.config.build.batchSize > 0 && this.config.build.batchDelay >= 1000;
    checks.push({
      name: 'Batch Configuration',
      category: 'build',
      status: batchValid ? 'pass' : 'warning',
      message: `Batch size: ${this.config.build.batchSize}, Delay: ${this.config.build.batchDelay}ms`,
      details: 'Batch configuration affects build performance and API rate limits',
      severity: 'medium',
      automated: true,
      fixable: true,
      fix: 'Adjust batch size and delay for optimal performance'
    });

    // Cache configuration validation
    checks.push({
      name: 'Build Cache',
      category: 'build',
      status: this.config.build.useCachedData ? 'pass' : 'info',
      message: this.config.build.useCachedData ? 'Cache enabled' : 'Cache disabled',
      details: 'Cached data improves build performance',
      severity: 'low',
      automated: true,
      fixable: true,
      fix: 'Enable cached data for faster builds'
    });

    return checks;
  }

  /**
   * Generate validation result summary
   */
  private generateValidationResult(checks: DeploymentCheck[]): DeploymentValidationResult {
    const totalChecks = checks.length;
    const passedChecks = checks.filter(c => c.status === 'pass').length;
    const failedChecks = checks.filter(c => c.status === 'fail').length;
    const warningChecks = checks.filter(c => c.status === 'warning').length;
    const criticalIssues = checks.filter(c => c.severity === 'critical' && c.status !== 'pass').length;
    const highIssues = checks.filter(c => c.severity === 'high' && c.status !== 'pass').length;

    const score = Math.round((passedChecks / totalChecks) * 100);
    const ready = failedChecks === 0 && criticalIssues === 0;

    const recommendations = this.generateRecommendations(checks);
    const deploymentPlan = this.generateDeploymentPlan(checks, ready, score);

    return {
      ready,
      score,
      totalChecks,
      passedChecks,
      failedChecks,
      warningChecks,
      criticalIssues,
      highIssues,
      checks,
      recommendations,
      deploymentPlan
    };
  }

  /**
   * Generate deployment recommendations
   */
  private generateRecommendations(checks: DeploymentCheck[]): string[] {
    const recommendations: string[] = [];

    // Critical issues first
    const criticalIssues = checks.filter(c => c.severity === 'critical' && c.status !== 'pass');
    if (criticalIssues.length > 0) {
      recommendations.push('🚨 CRITICAL: Fix all critical issues before deployment');
      criticalIssues.forEach(issue => {
        if (issue.fix) recommendations.push(`  • ${issue.fix}`);
      });
    }

    // High-priority improvements
    const highIssues = checks.filter(c => c.severity === 'high' && c.status !== 'pass');
    if (highIssues.length > 0) {
      recommendations.push('⚠️ HIGH PRIORITY: Address these security and stability concerns');
      highIssues.forEach(issue => {
        if (issue.fix) recommendations.push(`  • ${issue.fix}`);
      });
    }

    // Performance improvements
    const performanceIssues = checks.filter(c => c.category === 'performance' && c.status !== 'pass');
    if (performanceIssues.length > 0) {
      recommendations.push('🚀 PERFORMANCE: Implement these optimizations');
      performanceIssues.forEach(issue => {
        if (issue.fix) recommendations.push(`  • ${issue.fix}`);
      });
    }

    // General recommendations
    recommendations.push('📋 GENERAL: Complete deployment checklist');
    recommendations.push('  • Test deployment in staging environment first');
    recommendations.push('  • Monitor deployment metrics and logs');
    recommendations.push('  • Have rollback plan ready');
    recommendations.push('  • Notify stakeholders of deployment schedule');

    return recommendations;
  }

  /**
   * Generate deployment plan
   */
  private generateDeploymentPlan(checks: DeploymentCheck[], ready: boolean, score: number): {
    strategy: 'immediate' | 'staged' | 'blue-green' | 'canary';
    estimatedDuration: string;
    rollbackPlan: string;
    prerequisites: string[];
  } {
    const criticalIssues = checks.filter(c => c.severity === 'critical' && c.status !== 'pass').length;
    const highIssues = checks.filter(c => c.severity === 'high' && c.status !== 'pass').length;

    let strategy: 'immediate' | 'staged' | 'blue-green' | 'canary' = 'immediate';
    let duration = '10-15 minutes';

    if (!ready || criticalIssues > 0) {
      strategy = 'staged';
      duration = '30-45 minutes';
    } else if (highIssues > 0 || score < 90) {
      strategy = 'blue-green';
      duration = '20-30 minutes';
    } else if (this.config.environment === 'production') {
      strategy = 'canary';
      duration = '45-60 minutes';
    }

    const prerequisites: string[] = [];
    if (criticalIssues > 0) {
      prerequisites.push('Fix all critical configuration issues');
    }
    if (highIssues > 0) {
      prerequisites.push('Address high-priority security concerns');
    }
    prerequisites.push('Complete pre-deployment testing');
    prerequisites.push('Backup current deployment');
    prerequisites.push('Prepare rollback procedure');

    return {
      strategy,
      estimatedDuration: duration,
      rollbackPlan: 'Automated rollback via deployment platform. Manual rollback time: 5-10 minutes',
      prerequisites
    };
  }

  /**
   * Get deployment status for monitoring
   */
  async getDeploymentStatus(): Promise<{
    environment: string;
    version: string;
    status: 'healthy' | 'degraded' | 'down';
    lastDeployment: string;
    uptime: number;
    responseTime: number;
  }> {
    try {
      // This would typically make actual health check requests
      return {
        environment: this.config.environment,
        version: process.env.npm_package_version || '1.0.0',
        status: 'healthy',
        lastDeployment: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime: 150 // ms
      };
    } catch (error) {
      return {
        environment: this.config.environment,
        version: 'unknown',
        status: 'down',
        lastDeployment: 'unknown',
        uptime: 0,
        responseTime: 0
      };
    }
  }
}

// Export singleton instance
export const deploymentValidator = new DeploymentValidator();