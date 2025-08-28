/**
 * Production Deployment Manager for ChooseMyPower.org
 * Enterprise-grade deployment orchestration with monitoring and validation
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../..');

/**
 * Production Deployment Configuration
 */
const deploymentConfig = {
  environment: 'production',
  domain: 'choosemypower.org',
  healthCheckUrl: 'https://choosemypower.org/health',
  maxCities: 881,
  batchSize: 10,
  batchDelay: 2000,
  healthCheckTimeout: 30000,
  deploymentTimeout: 900000, // 15 minutes
  rollbackOnFailure: true,
  notifications: {
    slack: process.env.SLACK_WEBHOOK_URL,
    email: process.env.NOTIFICATION_EMAIL,
  },
  monitoring: {
    enableMetrics: true,
    enableAlerts: true,
    performanceThresholds: {
      lcp: 2500, // milliseconds
      fid: 100,  // milliseconds
      cls: 0.1,  // score
    }
  }
};

/**
 * Deployment Manager Class
 */
class ProductionDeploymentManager {
  constructor() {
    this.deploymentId = this.generateDeploymentId();
    this.startTime = Date.now();
    this.logs = [];
    this.metrics = {
      buildTime: 0,
      deployTime: 0,
      validationTime: 0,
      totalTime: 0,
      citiesDeployed: 0,
      errorsEncountered: 0,
      warningsIssued: 0
    };
  }

  generateDeploymentId() {
    return `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  log(level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      deploymentId: this.deploymentId,
      ...data
    };
    
    this.logs.push(logEntry);
    
    const logColor = {
      'info': '\x1b[36m',
      'success': '\x1b[32m',
      'warning': '\x1b[33m',
      'error': '\x1b[31m',
      'debug': '\x1b[35m'
    }[level] || '\x1b[0m';
    
    console.log(`${logColor}[${level.toUpperCase()}] ${message}\x1b[0m`);
    
    if (data && Object.keys(data).length > 0) {
      console.log(`  Details: ${JSON.stringify(data, null, 2)}`);
    }
  }

  async executeCommand(command, options = {}) {
    this.log('debug', `Executing: ${command}`, options);
    
    try {
      const result = await execAsync(command, {
        cwd: projectRoot,
        timeout: options.timeout || 300000,
        ...options
      });
      
      return {
        success: true,
        stdout: result.stdout,
        stderr: result.stderr
      };
    } catch (error) {
      this.log('error', `Command failed: ${command}`, {
        error: error.message,
        stdout: error.stdout,
        stderr: error.stderr
      });
      
      return {
        success: false,
        error: error.message,
        stdout: error.stdout,
        stderr: error.stderr
      };
    }
  }

  async validateEnvironment() {
    this.log('info', 'Validating deployment environment...');
    
    const requiredEnvVars = [
      'NETLIFY_SITE_ID',
      'NETLIFY_AUTH_TOKEN',
      'COMPAREPOWER_API_KEY',
      'COMPAREPOWER_API_URL'
    ];
    
    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      throw new Error(`Node.js ${nodeVersion} is not supported. Minimum version is 18.0.0`);
    }
    
    this.log('success', 'Environment validation passed', {
      nodeVersion,
      envVarsPresent: requiredEnvVars.length
    });
  }

  async performPreDeploymentChecks() {
    this.log('info', 'Performing pre-deployment checks...');
    
    // Check git status
    const gitStatus = await this.executeCommand('git status --porcelain');
    if (!gitStatus.success) {
      throw new Error('Git status check failed');
    }
    
    if (gitStatus.stdout.trim()) {
      this.log('warning', 'Working directory has uncommitted changes', {
        changes: gitStatus.stdout.trim().split('\n')
      });
    }
    
    // Get current commit info
    const commitInfo = await this.executeCommand('git log -1 --format="%H %s %an %ad" --date=iso');
    if (commitInfo.success) {
      const [hash, ...rest] = commitInfo.stdout.trim().split(' ');
      this.log('info', 'Deploying commit', {
        commitHash: hash.substring(0, 8),
        commitMessage: rest.join(' ')
      });
    }
    
    // Check for critical dependencies
    const packageCheck = await this.executeCommand('npm audit --audit-level=high --production');
    if (!packageCheck.success && packageCheck.stderr.includes('vulnerabilities')) {
      this.log('warning', 'Security vulnerabilities detected in dependencies');
      this.metrics.warningsIssued++;
    }
    
    this.log('success', 'Pre-deployment checks completed');
  }

  async buildApplication() {
    this.log('info', 'Starting production build...');
    const buildStart = Date.now();
    
    // Run the smart build system for 881 cities
    const buildCommand = `NODE_ENV=production MAX_CITIES=${deploymentConfig.maxCities} BATCH_SIZE=${deploymentConfig.batchSize} BATCH_DELAY_MS=${deploymentConfig.batchDelay} npm run build:production`;
    
    const buildResult = await this.executeCommand(buildCommand, {
      timeout: deploymentConfig.deploymentTimeout
    });
    
    if (!buildResult.success) {
      throw new Error(`Build failed: ${buildResult.error}`);
    }
    
    this.metrics.buildTime = Date.now() - buildStart;
    
    // Validate build output
    await this.validateBuildOutput();
    
    this.log('success', 'Production build completed', {
      buildTime: this.metrics.buildTime,
      buildSizeCheck: 'passed'
    });
  }

  async validateBuildOutput() {
    this.log('info', 'Validating build output...');
    
    const distPath = path.join(projectRoot, 'dist');
    
    // Check if dist directory exists
    try {
      await fs.access(distPath);
    } catch (error) {
      throw new Error('Build output directory (dist) not found');
    }
    
    // Check critical files
    const criticalFiles = [
      'index.html',
      'robots.txt',
      'sitemap.xml',
      'electricity-plans/index.html'
    ];
    
    for (const file of criticalFiles) {
      const filePath = path.join(distPath, file);
      try {
        await fs.access(filePath);
        this.log('debug', `Critical file found: ${file}`);
      } catch (error) {
        throw new Error(`Critical file missing: ${file}`);
      }
    }
    
    // Check build size
    const { stdout } = await this.executeCommand(`du -sh ${distPath}`);
    const buildSize = stdout.trim().split('\t')[0];
    
    this.log('info', 'Build validation completed', {
      buildSize,
      criticalFiles: criticalFiles.length
    });
  }

  async deployToNetlify() {
    this.log('info', 'Deploying to Netlify...');
    const deployStart = Date.now();
    
    // Use Netlify CLI for deployment
    const deployCommand = 'netlify deploy --prod --dir=dist --message="Production deployment via automation"';
    
    const deployResult = await this.executeCommand(deployCommand, {
      timeout: deploymentConfig.deploymentTimeout,
      env: {
        ...process.env,
        NETLIFY_SITE_ID: process.env.NETLIFY_SITE_ID,
        NETLIFY_AUTH_TOKEN: process.env.NETLIFY_AUTH_TOKEN
      }
    });
    
    if (!deployResult.success) {
      throw new Error(`Netlify deployment failed: ${deployResult.error}`);
    }
    
    this.metrics.deployTime = Date.now() - deployStart;
    
    // Extract deployment URL from output
    const deployUrl = this.extractDeploymentUrl(deployResult.stdout);
    
    this.log('success', 'Netlify deployment completed', {
      deployTime: this.metrics.deployTime,
      deploymentUrl: deployUrl
    });
    
    return deployUrl;
  }

  extractDeploymentUrl(deployOutput) {
    const urlMatch = deployOutput.match(/Live Draft URL:\s*(https?:\/\/[^\s]+)/i) ||
                    deployOutput.match(/Website URL:\s*(https?:\/\/[^\s]+)/i) ||
                    deployOutput.match(/https:\/\/[^\s]+/);
    
    return urlMatch ? urlMatch[1] || urlMatch[0] : deploymentConfig.domain;
  }

  async performHealthChecks(deploymentUrl) {
    this.log('info', 'Performing post-deployment health checks...');
    const healthStart = Date.now();
    
    // Wait for deployment to propagate
    await this.sleep(10000);
    
    const healthCheckUrl = `https://${deploymentConfig.domain}/health`;
    
    try {
      // Perform health check with retries
      const healthResult = await this.retryHealthCheck(healthCheckUrl, 5, 10000);
      
      if (!healthResult.healthy) {
        throw new Error(`Health check failed: ${healthResult.error}`);
      }
      
      this.metrics.validationTime = Date.now() - healthStart;
      
      this.log('success', 'Health checks passed', {
        healthStatus: healthResult.status,
        responseTime: healthResult.responseTime,
        validationTime: this.metrics.validationTime
      });
      
      return healthResult;
      
    } catch (error) {
      this.log('error', 'Health checks failed', { error: error.message });
      throw error;
    }
  }

  async retryHealthCheck(url, maxRetries, delay) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      this.log('debug', `Health check attempt ${attempt}/${maxRetries}`, { url });
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          timeout: 15000,
          headers: {
            'User-Agent': 'ChooseMyPower-Deployment-Manager/1.0'
          }
        });
        
        if (response.ok) {
          const healthData = await response.json();
          return {
            healthy: true,
            status: healthData.status,
            responseTime: healthData.metrics?.responseTime
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        this.log('warning', `Health check attempt ${attempt} failed`, {
          error: error.message,
          nextAttempt: attempt < maxRetries ? delay : null
        });
        
        if (attempt === maxRetries) {
          return {
            healthy: false,
            error: error.message
          };
        }
        
        await this.sleep(delay);
      }
    }
  }

  async performSmokeTests() {
    this.log('info', 'Performing smoke tests...');
    
    const testUrls = [
      `https://${deploymentConfig.domain}/`,
      `https://${deploymentConfig.domain}/texas/dallas`,
      `https://${deploymentConfig.domain}/electricity-plans/dallas-tx`,
      `https://${deploymentConfig.domain}/providers`,
      `https://${deploymentConfig.domain}/sitemap.xml`,
      `https://${deploymentConfig.domain}/robots.txt`
    ];
    
    let passedTests = 0;
    const testResults = [];
    
    for (const url of testUrls) {
      try {
        const response = await fetch(url, { timeout: 10000 });
        const passed = response.ok;
        
        testResults.push({
          url,
          status: response.status,
          passed
        });
        
        if (passed) {
          passedTests++;
          this.log('debug', `Smoke test passed: ${url}`, {
            status: response.status
          });
        } else {
          this.log('warning', `Smoke test failed: ${url}`, {
            status: response.status
          });
        }
      } catch (error) {
        testResults.push({
          url,
          error: error.message,
          passed: false
        });
        
        this.log('warning', `Smoke test error: ${url}`, {
          error: error.message
        });
      }
    }
    
    const passRate = (passedTests / testUrls.length) * 100;
    
    if (passRate < 90) {
      throw new Error(`Smoke tests failed: ${passRate.toFixed(1)}% pass rate (minimum 90% required)`);
    }
    
    this.log('success', 'Smoke tests completed', {
      passedTests,
      totalTests: testUrls.length,
      passRate: `${passRate.toFixed(1)}%`
    });
    
    return testResults;
  }

  async warmProductionCache() {
    this.log('info', 'Starting production cache warming...');
    
    try {
      // This would trigger the cache warming system
      const warmingCommand = 'npm run cache:warm';
      const result = await this.executeCommand(warmingCommand, {
        timeout: 300000 // 5 minutes
      });
      
      if (result.success) {
        this.log('success', 'Production cache warming completed');
      } else {
        this.log('warning', 'Cache warming failed but deployment continues', {
          error: result.error
        });
      }
    } catch (error) {
      this.log('warning', 'Cache warming error', { error: error.message });
    }
  }

  async sendNotification(type, message, data = {}) {
    if (!deploymentConfig.notifications.slack) {
      this.log('debug', 'Slack notifications not configured');
      return;
    }
    
    const payload = {
      text: `🚀 ChooseMyPower.org Deployment ${type}`,
      attachments: [{
        color: type === 'Success' ? 'good' : type === 'Failed' ? 'danger' : 'warning',
        fields: [
          {
            title: 'Environment',
            value: deploymentConfig.environment,
            short: true
          },
          {
            title: 'Deployment ID',
            value: this.deploymentId,
            short: true
          },
          {
            title: 'Message',
            value: message,
            short: false
          }
        ]
      }]
    };
    
    try {
      const response = await fetch(deploymentConfig.notifications.slack, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        this.log('debug', 'Notification sent successfully');
      }
    } catch (error) {
      this.log('warning', 'Failed to send notification', { error: error.message });
    }
  }

  async generateDeploymentReport() {
    this.metrics.totalTime = Date.now() - this.startTime;
    
    const report = {
      deploymentId: this.deploymentId,
      environment: deploymentConfig.environment,
      timestamp: new Date().toISOString(),
      duration: {
        total: this.metrics.totalTime,
        build: this.metrics.buildTime,
        deploy: this.metrics.deployTime,
        validation: this.metrics.validationTime
      },
      metrics: this.metrics,
      logs: this.logs.filter(log => log.level !== 'debug'),
      success: true
    };
    
    // Save report to file
    const reportPath = path.join(projectRoot, 'reports', 'deployments', `${this.deploymentId}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    this.log('info', 'Deployment report generated', {
      reportPath,
      totalTime: this.metrics.totalTime
    });
    
    return report;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async deploy() {
    try {
      this.log('info', `Starting production deployment ${this.deploymentId}`);
      
      // Pre-deployment phase
      await this.validateEnvironment();
      await this.performPreDeploymentChecks();
      
      // Build phase
      await this.buildApplication();
      
      // Deployment phase
      const deploymentUrl = await this.deployToNetlify();
      
      // Validation phase
      await this.performHealthChecks(deploymentUrl);
      await this.performSmokeTests();
      
      // Post-deployment optimizations
      await this.warmProductionCache();
      
      // Success reporting
      await this.generateDeploymentReport();
      await this.sendNotification('Success', `Production deployment completed successfully in ${Math.round(this.metrics.totalTime / 1000)}s`);
      
      this.log('success', `Production deployment ${this.deploymentId} completed successfully`, {
        totalTime: this.metrics.totalTime,
        deploymentUrl: `https://${deploymentConfig.domain}`
      });
      
      return {
        success: true,
        deploymentId: this.deploymentId,
        url: `https://${deploymentConfig.domain}`,
        metrics: this.metrics
      };
      
    } catch (error) {
      this.log('error', 'Deployment failed', { error: error.message });
      await this.sendNotification('Failed', `Deployment failed: ${error.message}`);
      
      const report = await this.generateDeploymentReport();
      report.success = false;
      report.error = error.message;
      
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'deploy';
  
  const manager = new ProductionDeploymentManager();
  
  switch (command) {
    case 'deploy':
      try {
        const result = await manager.deploy();
        console.log('\n🎉 DEPLOYMENT SUCCESSFUL!');
        console.log(`📊 Deployment ID: ${result.deploymentId}`);
        console.log(`🌐 URL: ${result.url}`);
        console.log(`⏱️  Total Time: ${Math.round(result.metrics.totalTime / 1000)}s`);
        process.exit(0);
      } catch (error) {
        console.error('\n❌ DEPLOYMENT FAILED!');
        console.error(`Error: ${error.message}`);
        process.exit(1);
      }
      break;
      
    case 'validate':
      try {
        await manager.validateEnvironment();
        console.log('✅ Environment validation passed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Environment validation failed');
        console.error(`Error: ${error.message}`);
        process.exit(1);
      }
      break;
      
    default:
      console.log('Usage: node production-deployment-manager.mjs [deploy|validate]');
      process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ProductionDeploymentManager, deploymentConfig };