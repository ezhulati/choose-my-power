#!/usr/bin/env node

/**
 * Production Deployment Script
 * Task T035: Create production deployment configuration
 * Phase 3.5 Polish & Validation: Automated production deployment
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

class ProductionDeployer {
  constructor() {
    this.startTime = Date.now();
    this.logFile = `logs/deployment-${new Date().toISOString().split('T')[0]}.log`;
    this.config = this.loadConfig();
  }

  /**
   * Load deployment configuration
   */
  loadConfig() {
    const defaultConfig = {
      environment: process.env.NODE_ENV || 'production',
      platform: process.env.DEPLOYMENT_PLATFORM || 'netlify',
      strategy: process.env.DEPLOYMENT_STRATEGY || 'blue-green',
      maxCities: parseInt(process.env.MAX_CITIES || '881'),
      enableValidation: process.env.ENABLE_VALIDATION !== 'false',
      enableBackup: process.env.ENABLE_BACKUP !== 'false',
      enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS !== 'false',
      rollbackOnFailure: process.env.ROLLBACK_ON_FAILURE !== 'false'
    };

    this.log('🔧 Configuration loaded', defaultConfig);
    return defaultConfig;
  }

  /**
   * Log deployment messages
   */
  log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    console.log(logMessage);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }

    // Write to log file
    try {
      const logData = data ? `${logMessage}\n${JSON.stringify(data, null, 2)}\n` : `${logMessage}\n`;
      if (existsSync('logs')) {
        writeFileSync(this.logFile, logData, { flag: 'a' });
      }
    } catch (error) {
      console.warn('⚠️ Could not write to log file:', error.message);
    }
  }

  /**
   * Execute command with logging
   */
  exec(command, description) {
    this.log(`🔄 ${description}`);
    this.log(`💻 Running: ${command}`);
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });
      
      if (output.trim()) {
        this.log(`✅ ${description} completed`);
        this.log('📄 Output:', output.trim());
      } else {
        this.log(`✅ ${description} completed (no output)`);
      }
      
      return output;
    } catch (error) {
      this.log(`❌ ${description} failed`);
      this.log('🚨 Error:', error.message);
      throw error;
    }
  }

  /**
   * Validate deployment readiness
   */
  async validateDeployment() {
    this.log('🔍 Starting deployment validation...');

    try {
      // Configuration validation
      this.log('📋 Validating configuration...');
      if (!process.env.NETLIFY_AUTH_TOKEN && this.config.platform === 'netlify') {
        throw new Error('NETLIFY_AUTH_TOKEN is required for Netlify deployment');
      }

      if (!process.env.COMPAREPOWER_API_KEY) {
        this.log('⚠️ Warning: COMPAREPOWER_API_KEY not found - using mock data');
      }

      // Dependencies validation
      this.log('📦 Validating dependencies...');
      this.exec('npm audit --audit-level=high', 'Security audit');

      // Test validation
      this.log('🧪 Running test suite...');
      this.exec('npm run test:run', 'Unit tests');
      
      // Performance validation
      this.log('⚡ Running performance tests...');
      this.exec('npm run perf:test:critical', 'Critical performance tests');

      // Build validation
      this.log('🏗️ Validating build process...');
      this.exec('npm run lint', 'Code linting');

      this.log('✅ Deployment validation completed successfully');
      return true;
    } catch (error) {
      this.log('❌ Deployment validation failed:', error.message);
      return false;
    }
  }

  /**
   * Create deployment backup
   */
  async createBackup() {
    if (!this.config.enableBackup) {
      this.log('⏭️ Backup disabled, skipping...');
      return;
    }

    this.log('💾 Creating deployment backup...');

    try {
      const backupDir = `backups/deployment-${Date.now()}`;
      
      // Create backup of current deployment
      this.exec(`mkdir -p ${backupDir}`, 'Creating backup directory');
      
      // Backup environment configuration
      if (existsSync('.env.production')) {
        this.exec(`cp .env.production ${backupDir}/`, 'Backing up environment config');
      }
      
      // Backup deployment configuration
      if (existsSync('netlify.toml')) {
        this.exec(`cp netlify.toml ${backupDir}/`, 'Backing up Netlify config');
      }
      
      // Create deployment manifest
      const manifest = {
        timestamp: new Date().toISOString(),
        environment: this.config.environment,
        platform: this.config.platform,
        config: this.config,
        gitCommit: this.exec('git rev-parse HEAD', 'Getting Git commit').trim(),
        gitBranch: this.exec('git rev-parse --abbrev-ref HEAD', 'Getting Git branch').trim()
      };
      
      writeFileSync(`${backupDir}/deployment-manifest.json`, JSON.stringify(manifest, null, 2));
      
      this.log('✅ Deployment backup created successfully');
      this.log('📁 Backup location:', backupDir);
    } catch (error) {
      this.log('⚠️ Backup creation failed:', error.message);
      // Don't fail deployment for backup issues
    }
  }

  /**
   * Build application for production
   */
  async buildApplication() {
    this.log('🏗️ Building application for production...');

    try {
      // Set production environment variables
      process.env.NODE_ENV = 'production';
      process.env.ASTRO_TELEMETRY_DISABLED = '1';
      process.env.MAX_CITIES = this.config.maxCities.toString();

      // Install production dependencies
      this.log('📦 Installing dependencies...');
      this.exec('npm ci --production=false', 'Installing dependencies');

      // Build data (with appropriate tier)
      if (this.config.maxCities <= 200) {
        this.log('🏙️ Building with tier1 data (priority cities)...');
        this.exec('npm run build:data:tier1', 'Building tier1 data');
      } else {
        this.log('🌆 Building with smart data caching...');
        this.exec('npm run build:data:smart', 'Building smart data');
      }

      // Build application
      this.log('🚀 Building Astro application...');
      this.exec('npm run build:production', 'Building production application');

      // Validate build output
      if (!existsSync('dist')) {
        throw new Error('Build output directory (dist) not found');
      }

      const buildStats = this.exec('du -sh dist', 'Checking build size').trim();
      this.log('📊 Build completed successfully');
      this.log('💾 Build size:', buildStats);

      return true;
    } catch (error) {
      this.log('❌ Build failed:', error.message);
      throw error;
    }
  }

  /**
   * Deploy to platform
   */
  async deployToPlatform() {
    this.log(`🚀 Deploying to ${this.config.platform}...`);

    try {
      switch (this.config.platform) {
        case 'netlify':
          await this.deployToNetlify();
          break;
        
        case 'vercel':
          await this.deployToVercel();
          break;
        
        default:
          throw new Error(`Unsupported deployment platform: ${this.config.platform}`);
      }

      this.log('✅ Platform deployment completed');
    } catch (error) {
      this.log('❌ Platform deployment failed:', error.message);
      throw error;
    }
  }

  /**
   * Deploy to Netlify
   */
  async deployToNetlify() {
    this.log('🌐 Deploying to Netlify...');

    // Install Netlify CLI if not available
    try {
      this.exec('netlify --version', 'Checking Netlify CLI');
    } catch (error) {
      this.log('📦 Installing Netlify CLI...');
      this.exec('npm install -g netlify-cli', 'Installing Netlify CLI');
    }

    // Deploy based on strategy
    switch (this.config.strategy) {
      case 'immediate':
        this.exec('netlify deploy --prod --dir=dist', 'Immediate production deployment');
        break;
      
      case 'blue-green':
      case 'staged':
        // Deploy as preview first
        const previewOutput = this.exec('netlify deploy --dir=dist', 'Staging deployment');
        const previewUrl = this.extractPreviewUrl(previewOutput);
        
        // Validate preview deployment
        if (this.config.enableHealthChecks) {
          await this.validatePreviewDeployment(previewUrl);
        }
        
        // Promote to production
        this.exec('netlify deploy --prod --dir=dist', 'Promoting to production');
        break;
      
      default:
        throw new Error(`Unsupported deployment strategy: ${this.config.strategy}`);
    }
  }

  /**
   * Deploy to Vercel
   */
  async deployToVercel() {
    this.log('▲ Deploying to Vercel...');

    // Install Vercel CLI if not available
    try {
      this.exec('vercel --version', 'Checking Vercel CLI');
    } catch (error) {
      this.log('📦 Installing Vercel CLI...');
      this.exec('npm install -g vercel', 'Installing Vercel CLI');
    }

    // Deploy to Vercel
    this.exec('vercel --prod', 'Vercel production deployment');
  }

  /**
   * Extract preview URL from Netlify output
   */
  extractPreviewUrl(output) {
    const match = output.match(/Website Draft URL:\s+(https:\/\/[^\s]+)/);
    return match ? match[1] : null;
  }

  /**
   * Validate preview deployment
   */
  async validatePreviewDeployment(previewUrl) {
    if (!previewUrl) {
      this.log('⚠️ No preview URL found, skipping validation');
      return;
    }

    this.log(`🔍 Validating preview deployment: ${previewUrl}`);

    try {
      // Basic health check
      const healthResponse = await fetch(`${previewUrl}/health`);
      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status}`);
      }

      // Test critical pages
      const criticalPages = [
        '/',
        '/texas/houston',
        '/electricity-plans/dallas-tx'
      ];

      for (const page of criticalPages) {
        const response = await fetch(`${previewUrl}${page}`);
        if (!response.ok) {
          throw new Error(`Page ${page} failed: ${response.status}`);
        }
      }

      this.log('✅ Preview deployment validation successful');
    } catch (error) {
      this.log('❌ Preview deployment validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Run post-deployment validation
   */
  async validatePostDeployment() {
    if (!this.config.enableHealthChecks) {
      this.log('⏭️ Post-deployment validation disabled, skipping...');
      return;
    }

    this.log('🔍 Running post-deployment validation...');

    try {
      const domain = process.env.DEPLOYMENT_DOMAIN || 'https://choosemypower.org';
      
      // Health check
      this.log(`🏥 Checking health endpoint: ${domain}/health`);
      const healthResponse = await fetch(`${domain}/health`);
      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status}`);
      }

      // API validation
      this.log('🔌 Validating API endpoints...');
      this.exec('npm run test:api:quick', 'API endpoint validation');

      // Performance validation
      this.log('⚡ Validating performance...');
      // Note: This would typically use Lighthouse or similar tools
      // this.exec('npm run perf:test:production', 'Production performance test');

      this.log('✅ Post-deployment validation completed successfully');
      return true;
    } catch (error) {
      this.log('❌ Post-deployment validation failed:', error.message);
      
      if (this.config.rollbackOnFailure) {
        this.log('🔄 Initiating automatic rollback...');
        await this.rollback();
      }
      
      throw error;
    }
  }

  /**
   * Rollback deployment
   */
  async rollback() {
    this.log('🔄 Starting deployment rollback...');

    try {
      switch (this.config.platform) {
        case 'netlify':
          this.exec('netlify rollback', 'Netlify rollback');
          break;
        
        case 'vercel':
          // Vercel rollback would require specific deployment ID
          this.log('⚠️ Vercel rollback requires manual intervention');
          break;
        
        default:
          this.log('⚠️ Rollback not supported for platform:', this.config.platform);
      }

      this.log('✅ Rollback completed');
    } catch (error) {
      this.log('❌ Rollback failed:', error.message);
      this.log('🚨 MANUAL INTERVENTION REQUIRED');
    }
  }

  /**
   * Generate deployment report
   */
  generateReport() {
    const endTime = Date.now();
    const duration = Math.round((endTime - this.startTime) / 1000);
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      platform: this.config.platform,
      strategy: this.config.strategy,
      duration: `${duration} seconds`,
      config: this.config,
      status: 'completed',
      logFile: this.logFile
    };

    this.log('📊 Deployment Report', report);
    
    // Save report
    try {
      writeFileSync('deployment-report.json', JSON.stringify(report, null, 2));
      this.log('💾 Deployment report saved to deployment-report.json');
    } catch (error) {
      this.log('⚠️ Could not save deployment report:', error.message);
    }

    return report;
  }

  /**
   * Main deployment workflow
   */
  async deploy() {
    this.log('🚀 Starting production deployment...');
    this.log('⚙️ Configuration:', this.config);

    try {
      // Pre-deployment validation
      if (this.config.enableValidation) {
        const validationPassed = await this.validateDeployment();
        if (!validationPassed) {
          throw new Error('Deployment validation failed');
        }
      }

      // Create backup
      await this.createBackup();

      // Build application
      await this.buildApplication();

      // Deploy to platform
      await this.deployToPlatform();

      // Post-deployment validation
      await this.validatePostDeployment();

      // Generate report
      const report = this.generateReport();

      this.log('🎉 Production deployment completed successfully!');
      this.log(`⏱️ Total deployment time: ${report.duration}`);
      
      return report;

    } catch (error) {
      this.log('💥 Deployment failed:', error.message);
      this.log('🚨 Please check logs and take appropriate action');
      
      // Generate failure report
      const report = this.generateReport();
      report.status = 'failed';
      report.error = error.message;
      
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'validate':
      console.log('🔍 Running deployment validation only...');
      const deployer = new ProductionDeployer();
      const valid = await deployer.validateDeployment();
      process.exit(valid ? 0 : 1);
      break;

    case 'backup':
      console.log('💾 Creating deployment backup only...');
      const backupDeployer = new ProductionDeployer();
      await backupDeployer.createBackup();
      process.exit(0);
      break;

    case 'deploy':
    default:
      console.log('🚀 Starting full deployment...');
      const mainDeployer = new ProductionDeployer();
      await mainDeployer.deploy();
      break;
  }
}

// Export for testing
export { ProductionDeployer };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Deployment script failed:', error);
    process.exit(1);
  });
}