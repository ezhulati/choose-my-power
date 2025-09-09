/**
 * Production Configuration Manager Component
 * Task T035: Create production deployment configuration
 * Phase 3.5 Polish & Validation: Production config management UI
 */

import React, { useState } from 'react';

interface ProductionConfig {
  environment: 'staging' | 'production' | 'preview';
  deployment: {
    platform: 'netlify' | 'vercel' | 'cloudflare';
    region: string;
    domain: string;
    nodeVersion: string;
  };
  performance: {
    enableCaching: boolean;
    enableCompression: boolean;
    cacheStrategy: 'aggressive' | 'balanced' | 'conservative';
  };
  monitoring: {
    enableHealthChecks: boolean;
    enablePerformanceMonitoring: boolean;
    enableErrorReporting: boolean;
    enableAnalytics: boolean;
  };
  security: {
    enableCSP: boolean;
    enableHSTS: boolean;
    enableRateLimiting: boolean;
  };
  build: {
    maxCities: number;
    batchSize: number;
    batchDelay: number;
    tier: 'tier1' | 'tier2' | 'all';
  };
}

export const ProductionConfigManager: React.FC = () => {
  const [config, setConfig] = useState<ProductionConfig>({
    environment: 'production',
    deployment: {
      platform: 'netlify',
      region: 'us-east-1',
      domain: 'choosemypower.org',
      nodeVersion: '20.5.0'
    },
    performance: {
      enableCaching: true,
      enableCompression: true,
      cacheStrategy: 'aggressive'
    },
    monitoring: {
      enableHealthChecks: true,
      enablePerformanceMonitoring: true,
      enableErrorReporting: true,
      enableAnalytics: true
    },
    security: {
      enableCSP: true,
      enableHSTS: true,
      enableRateLimiting: true
    },
    build: {
      maxCities: 881,
      batchSize: 10,
      batchDelay: 2000,
      tier: 'all'
    }
  });

  const [activeTab, setActiveTab] = useState<string>('deployment');
  const [generatedConfig, setGeneratedConfig] = useState<string>('');
  const [configFormat, setConfigFormat] = useState<'netlify' | 'docker' | 'env'>('netlify');

  // Update configuration
  const updateConfig = (section: keyof ProductionConfig, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  // Load environment preset
  const loadEnvironmentPreset = (environment: 'staging' | 'production' | 'preview') => {
    const presets = {
      production: {
        ...config,
        environment: 'production' as const,
        deployment: {
          ...config.deployment,
          domain: 'choosemypower.org'
        },
        performance: {
          ...config.performance,
          cacheStrategy: 'aggressive' as const
        },
        monitoring: {
          enableHealthChecks: true,
          enablePerformanceMonitoring: true,
          enableErrorReporting: true,
          enableAnalytics: true
        },
        build: {
          ...config.build,
          maxCities: 881,
          tier: 'all' as const
        }
      },
      staging: {
        ...config,
        environment: 'staging' as const,
        deployment: {
          ...config.deployment,
          domain: 'staging.choosemypower.org'
        },
        performance: {
          ...config.performance,
          cacheStrategy: 'balanced' as const
        },
        monitoring: {
          enableHealthChecks: true,
          enablePerformanceMonitoring: true,
          enableErrorReporting: true,
          enableAnalytics: false
        },
        build: {
          ...config.build,
          maxCities: 200,
          tier: 'tier1' as const
        }
      },
      preview: {
        ...config,
        environment: 'preview' as const,
        deployment: {
          ...config.deployment,
          domain: 'preview.choosemypower.org'
        },
        performance: {
          ...config.performance,
          cacheStrategy: 'conservative' as const
        },
        monitoring: {
          enableHealthChecks: false,
          enablePerformanceMonitoring: false,
          enableErrorReporting: false,
          enableAnalytics: false
        },
        build: {
          ...config.build,
          maxCities: 50,
          tier: 'tier1' as const
        }
      }
    };

    setConfig(presets[environment]);
  };

  // Generate configuration
  const generateConfiguration = () => {
    switch (configFormat) {
      case 'netlify':
        setGeneratedConfig(generateNetlifyConfig());
        break;
      case 'docker':
        setGeneratedConfig(generateDockerConfig());
        break;
      case 'env':
        setGeneratedConfig(generateEnvConfig());
        break;
    }
  };

  // Generate Netlify configuration
  const generateNetlifyConfig = (): string => {
    return `# Production Netlify Configuration
# Generated for ${config.environment} environment

[build]
  publish = "dist"
  command = "npm run build:production"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "${config.deployment.nodeVersion}"
  NODE_ENV = "${config.environment}"
  MAX_CITIES = "${config.build.maxCities}"
  BATCH_SIZE = "${config.build.batchSize}"
  BATCH_DELAY_MS = "${config.build.batchDelay}"
  BUILD_TIER = "${config.build.tier}"
  ENABLE_CACHING = "${config.performance.enableCaching}"
  CACHE_STRATEGY = "${config.performance.cacheStrategy}"
  ENABLE_HEALTH_CHECKS = "${config.monitoring.enableHealthChecks}"
  ENABLE_ANALYTICS = "${config.monitoring.enableAnalytics}"

# Performance Optimization
[build.processing]
  skip_processing = false

[build.processing.css]
  bundle = ${config.performance.enableCompression}
  minify = ${config.performance.enableCompression}

[build.processing.js]
  bundle = ${config.performance.enableCompression}
  minify = ${config.performance.enableCompression}

# Security Headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    ${config.security.enableHSTS ? 'Strict-Transport-Security = "max-age=31536000; includeSubDomains"' : ''}
    ${config.security.enableCSP ? 'Content-Security-Policy = "default-src \'self\'; script-src \'self\' \'unsafe-inline\'"' : ''}

# HTTPS Redirects
[[redirects]]
  from = "https://www.${config.deployment.domain}/*"
  to = "https://${config.deployment.domain}/:splat"
  status = 301
  force = true`;
  };

  // Generate Docker configuration
  const generateDockerConfig = (): string => {
    return `# Production Docker Configuration
# Generated for ${config.environment} environment

FROM node:${config.deployment.nodeVersion}-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Set environment variables
ENV NODE_ENV=${config.environment}
ENV MAX_CITIES=${config.build.maxCities}
ENV BATCH_SIZE=${config.build.batchSize}
ENV BATCH_DELAY_MS=${config.build.batchDelay}
ENV BUILD_TIER=${config.build.tier}
ENV ENABLE_CACHING=${config.performance.enableCaching}
ENV CACHE_STRATEGY=${config.performance.cacheStrategy}
ENV ENABLE_HEALTH_CHECKS=${config.monitoring.enableHealthChecks}
ENV ENABLE_ANALYTICS=${config.monitoring.enableAnalytics}

# Build application
RUN npm run build:production

# Expose port
EXPOSE 4321

# Health check
${config.monitoring.enableHealthChecks ? 'HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\\n  CMD curl -f http://localhost:4321/health || exit 1' : ''}

# Start application
CMD ["npm", "run", "preview"]`;
  };

  // Generate environment variables
  const generateEnvConfig = (): string => {
    return `# Production Environment Configuration
# Generated for ${config.environment} environment

# Node.js Configuration
NODE_ENV=${config.environment}
NODE_VERSION=${config.deployment.nodeVersion}
ASTRO_TELEMETRY_DISABLED=1

# Deployment Configuration
DEPLOYMENT_PLATFORM=${config.deployment.platform}
DEPLOYMENT_REGION=${config.deployment.region}
DEPLOYMENT_DOMAIN=${config.deployment.domain}

# Build Configuration
MAX_CITIES=${config.build.maxCities}
BATCH_SIZE=${config.build.batchSize}
BATCH_DELAY_MS=${config.build.batchDelay}
BUILD_TIER=${config.build.tier}

# Performance Configuration
ENABLE_CACHING=${config.performance.enableCaching}
ENABLE_COMPRESSION=${config.performance.enableCompression}
CACHE_STRATEGY=${config.performance.cacheStrategy}

# Monitoring Configuration
ENABLE_HEALTH_CHECKS=${config.monitoring.enableHealthChecks}
ENABLE_PERFORMANCE_MONITORING=${config.monitoring.enablePerformanceMonitoring}
ENABLE_ERROR_REPORTING=${config.monitoring.enableErrorReporting}
ENABLE_ANALYTICS=${config.monitoring.enableAnalytics}

# Security Configuration
ENABLE_CSP=${config.security.enableCSP}
ENABLE_HSTS=${config.security.enableHSTS}
ENABLE_RATE_LIMITING=${config.security.enableRateLimiting}

# Database Configuration (configure with actual values)
DATABASE_URL=postgresql://username:password@host:port/database

# API Configuration (configure with actual values)
COMPAREPOWER_API_KEY=your-api-key
NETLIFY_AUTH_TOKEN=your-netlify-token`;
  };

  const tabs = [
    { id: 'deployment', label: '🚀 Deployment', icon: '🚀' },
    { id: 'performance', label: '⚡ Performance', icon: '⚡' },
    { id: 'monitoring', label: '📊 Monitoring', icon: '📊' },
    { id: 'security', label: '🔒 Security', icon: '🔒' },
    { id: 'build', label: '🏗️ Build', icon: '🏗️' }
  ];

  return (
    <div className="space-y-6">
      {/* Environment Presets */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Environment Presets</h4>
        <div className="flex gap-3">
          {(['production', 'staging', 'preview'] as const).map(env => (
            <button
              key={env}
              onClick={() => loadEnvironmentPreset(env)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                config.environment === env
                  ? 'bg-texas-navy text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {env.charAt(0).toUpperCase() + env.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Tabs */}
      <div>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-texas-red text-texas-red'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Deployment Tab */}
          {activeTab === 'deployment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={config.deployment.platform}
                    onChange={(e) => updateConfig('deployment', 'platform', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red"
                  >
                    <option value="netlify">Netlify</option>
                    <option value="vercel">Vercel</option>
                    <option value="cloudflare">Cloudflare Pages</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region
                  </label>
                  <select
                    value={config.deployment.region}
                    onChange={(e) => updateConfig('deployment', 'region', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red"
                  >
                    <option value="us-east-1">US East (N. Virginia)</option>
                    <option value="us-west-2">US West (Oregon)</option>
                    <option value="eu-west-1">EU West (Ireland)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain
                  </label>
                  <input
                    type="text"
                    value={config.deployment.domain}
                    onChange={(e) => updateConfig('deployment', 'domain', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Node.js Version
                  </label>
                  <select
                    value={config.deployment.nodeVersion}
                    onChange={(e) => updateConfig('deployment', 'nodeVersion', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red"
                  >
                    <option value="20.5.0">20.5.0 LTS</option>
                    <option value="18.18.0">18.18.0 LTS</option>
                    <option value="21.0.0">21.0.0 Current</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Cache Settings</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.performance.enableCaching}
                        onChange={(e) => updateConfig('performance', 'enableCaching', e.target.checked)}
                        className="mr-3 rounded text-texas-red focus:ring-texas-red"
                      />
                      <span className="text-sm">Enable Caching</span>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cache Strategy
                      </label>
                      <select
                        value={config.performance.cacheStrategy}
                        onChange={(e) => updateConfig('performance', 'cacheStrategy', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red"
                      >
                        <option value="aggressive">Aggressive (1 year static, 4 hours pages)</option>
                        <option value="balanced">Balanced (6 months static, 2 hours pages)</option>
                        <option value="conservative">Conservative (1 month static, 1 hour pages)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Optimization</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.performance.enableCompression}
                        onChange={(e) => updateConfig('performance', 'enableCompression', e.target.checked)}
                        className="mr-3 rounded text-texas-red focus:ring-texas-red"
                      />
                      <span className="text-sm">Enable Compression</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Monitoring Tab */}
          {activeTab === 'monitoring' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Health & Performance</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.monitoring.enableHealthChecks}
                        onChange={(e) => updateConfig('monitoring', 'enableHealthChecks', e.target.checked)}
                        className="mr-3 rounded text-texas-red focus:ring-texas-red"
                      />
                      <span className="text-sm">Enable Health Checks</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.monitoring.enablePerformanceMonitoring}
                        onChange={(e) => updateConfig('monitoring', 'enablePerformanceMonitoring', e.target.checked)}
                        className="mr-3 rounded text-texas-red focus:ring-texas-red"
                      />
                      <span className="text-sm">Enable Performance Monitoring</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Error Tracking & Analytics</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.monitoring.enableErrorReporting}
                        onChange={(e) => updateConfig('monitoring', 'enableErrorReporting', e.target.checked)}
                        className="mr-3 rounded text-texas-red focus:ring-texas-red"
                      />
                      <span className="text-sm">Enable Error Reporting</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.monitoring.enableAnalytics}
                        onChange={(e) => updateConfig('monitoring', 'enableAnalytics', e.target.checked)}
                        className="mr-3 rounded text-texas-red focus:ring-texas-red"
                      />
                      <span className="text-sm">Enable Analytics</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Security Headers</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.security.enableCSP}
                        onChange={(e) => updateConfig('security', 'enableCSP', e.target.checked)}
                        className="mr-3 rounded text-texas-red focus:ring-texas-red"
                      />
                      <span className="text-sm">Enable Content Security Policy</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.security.enableHSTS}
                        onChange={(e) => updateConfig('security', 'enableHSTS', e.target.checked)}
                        className="mr-3 rounded text-texas-red focus:ring-texas-red"
                      />
                      <span className="text-sm">Enable HSTS</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Rate Limiting</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.security.enableRateLimiting}
                        onChange={(e) => updateConfig('security', 'enableRateLimiting', e.target.checked)}
                        className="mr-3 rounded text-texas-red focus:ring-texas-red"
                      />
                      <span className="text-sm">Enable Rate Limiting</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Build Tab */}
          {activeTab === 'build' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Cities
                  </label>
                  <input
                    type="number"
                    value={config.build.maxCities}
                    onChange={(e) => updateConfig('build', 'maxCities', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red"
                    min="1"
                    max="881"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Build Tier
                  </label>
                  <select
                    value={config.build.tier}
                    onChange={(e) => updateConfig('build', 'tier', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red"
                  >
                    <option value="tier1">Tier 1 (Priority Cities)</option>
                    <option value="tier2">Tier 2 (Secondary Cities)</option>
                    <option value="all">All Cities</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Size
                  </label>
                  <input
                    type="number"
                    value={config.build.batchSize}
                    onChange={(e) => updateConfig('build', 'batchSize', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red"
                    min="1"
                    max="50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Delay (ms)
                  </label>
                  <input
                    type="number"
                    value={config.build.batchDelay}
                    onChange={(e) => updateConfig('build', 'batchDelay', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red"
                    min="500"
                    max="10000"
                    step="500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generate Configuration */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Generate Configuration</h4>
          <div className="flex items-center gap-3">
            <select
              value={configFormat}
              onChange={(e) => setConfigFormat(e.target.value as 'netlify' | 'docker' | 'env')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red"
            >
              <option value="netlify">Netlify (netlify.toml)</option>
              <option value="docker">Docker (Dockerfile)</option>
              <option value="env">Environment (.env)</option>
            </select>
            
            <button
              onClick={generateConfiguration}
              className="px-4 py-2 bg-texas-red text-white rounded-lg hover:bg-texas-red-600 transition-colors focus:ring-4 focus:ring-texas-red-200 focus:outline-none"
            >
              Generate
            </button>
          </div>
        </div>

        {generatedConfig && (
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <pre>{generatedConfig}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionConfigManager;