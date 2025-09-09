/**
 * Deployment Validator Component
 * Task T035: Create production deployment configuration
 * Phase 3.5 Polish & Validation: Deployment validation UI
 */

import React, { useState, useEffect } from 'react';

interface ValidationCheck {
  name: string;
  category: 'configuration' | 'security' | 'performance' | 'monitoring' | 'database' | 'build';
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  details?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  fixable: boolean;
  fix?: string;
}

interface ValidationResult {
  ready: boolean;
  score: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  criticalIssues: number;
  highIssues: number;
  checks: ValidationCheck[];
  recommendations: string[];
  deploymentPlan: {
    strategy: 'immediate' | 'staged' | 'blue-green' | 'canary';
    estimatedDuration: string;
    rollbackPlan: string;
    prerequisites: string[];
  };
}

export const DeploymentValidator: React.FC = () => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock validation data for demonstration
  const mockValidationResult: ValidationResult = {
    ready: true,
    score: 92,
    totalChecks: 15,
    passedChecks: 13,
    failedChecks: 0,
    warningChecks: 2,
    criticalIssues: 0,
    highIssues: 0,
    checks: [
      {
        name: 'Environment Configuration',
        category: 'configuration',
        status: 'pass',
        message: 'Environment: production',
        details: 'Production environment correctly configured',
        severity: 'low',
        fixable: true
      },
      {
        name: 'Domain Configuration',
        category: 'configuration',
        status: 'pass',
        message: 'Domain: choosemypower.org',
        details: 'Domain correctly configured',
        severity: 'critical',
        fixable: true
      },
      {
        name: 'Content Security Policy',
        category: 'security',
        status: 'pass',
        message: 'CSP enabled',
        details: 'Content Security Policy protects against XSS attacks',
        severity: 'high',
        fixable: true
      },
      {
        name: 'HTTP Strict Transport Security',
        category: 'security',
        status: 'warning',
        message: 'HSTS disabled',
        details: 'HSTS enforces secure connections',
        severity: 'medium',
        fixable: true,
        fix: 'Enable HSTS in security configuration'
      },
      {
        name: 'Caching Strategy',
        category: 'performance',
        status: 'pass',
        message: 'Caching enabled (aggressive)',
        details: 'Caching improves performance and reduces server load',
        severity: 'medium',
        fixable: true
      },
      {
        name: 'Health Checks',
        category: 'monitoring',
        status: 'pass',
        message: 'Health checks enabled',
        details: 'Health checks are essential for production monitoring',
        severity: 'critical',
        fixable: true
      },
      {
        name: 'Database Provider',
        category: 'database',
        status: 'pass',
        message: 'Provider: neon',
        details: 'Real database provider configured',
        severity: 'low',
        fixable: true
      },
      {
        name: 'Build Command',
        category: 'build',
        status: 'pass',
        message: 'Command: npm run build:production',
        details: 'Build command must be configured for deployment',
        severity: 'critical',
        fixable: true
      },
      {
        name: 'Bundle Analysis',
        category: 'performance',
        status: 'warning',
        message: 'Bundle analysis disabled',
        details: 'Bundle analysis helps identify optimization opportunities',
        severity: 'low',
        fixable: true,
        fix: 'Enable bundle analysis for production insights'
      }
    ],
    recommendations: [
      '⚠️ HIGH PRIORITY: Address these security and stability concerns',
      '  • Enable HSTS in security configuration',
      '🚀 PERFORMANCE: Implement these optimizations',
      '  • Enable bundle analysis for production insights',
      '📋 GENERAL: Complete deployment checklist',
      '  • Test deployment in staging environment first',
      '  • Monitor deployment metrics and logs',
      '  • Have rollback plan ready'
    ],
    deploymentPlan: {
      strategy: 'blue-green',
      estimatedDuration: '20-30 minutes',
      rollbackPlan: 'Automated rollback via deployment platform. Manual rollback time: 5-10 minutes',
      prerequisites: [
        'Complete pre-deployment testing',
        'Backup current deployment',
        'Prepare rollback procedure'
      ]
    }
  };

  // Run validation
  const runValidation = async () => {
    setIsValidating(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would call the validation service
      setValidationResult(mockValidationResult);
    } catch (error) {
      console.error('[DeploymentValidator] Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  // Filter checks by category
  const filteredChecks = validationResult?.checks.filter(check => 
    selectedCategory === 'all' || check.category === selectedCategory
  ) || [];

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return '✅';
      case 'fail':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '⚪';
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get strategy color
  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'immediate':
        return 'text-red-600 bg-red-100';
      case 'blue-green':
        return 'text-blue-600 bg-blue-100';
      case 'canary':
        return 'text-green-600 bg-green-100';
      case 'staged':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Validation Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Deployment Validation</h3>
          <p className="text-sm text-gray-600">
            Run comprehensive checks to validate production deployment readiness
          </p>
        </div>
        
        <button
          onClick={runValidation}
          disabled={isValidating}
          className="px-6 py-3 bg-texas-red text-white rounded-lg hover:bg-texas-red-600 disabled:opacity-50 transition-colors focus:ring-4 focus:ring-texas-red-200 focus:outline-none"
        >
          {isValidating ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Validating...
            </span>
          ) : (
            'Run Validation'
          )}
        </button>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-gradient-to-r from-texas-navy to-blue-800 text-white rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{validationResult.score}%</div>
                <div className="text-sm opacity-90">Overall Score</div>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                  validationResult.ready ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {validationResult.ready ? 'READY' : 'NOT READY'}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{validationResult.passedChecks}</div>
                <div className="text-sm opacity-90">Passed Checks</div>
                <div className="text-xs opacity-75">of {validationResult.totalChecks}</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{validationResult.criticalIssues}</div>
                <div className="text-sm opacity-90">Critical Issues</div>
                <div className="text-xs opacity-75">{validationResult.highIssues} high priority</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{validationResult.deploymentPlan.estimatedDuration}</div>
                <div className="text-sm opacity-90">Est. Duration</div>
                <div className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2 ${getStrategyColor(validationResult.deploymentPlan.strategy)}`}>
                  {validationResult.deploymentPlan.strategy.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {['all', 'configuration', 'security', 'performance', 'monitoring', 'database', 'build'].map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-texas-navy text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Validation Checks */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">
              Validation Checks ({filteredChecks.length})
            </h4>
            <div className="space-y-2">
              {filteredChecks.map((check, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    check.status === 'pass' ? 'border-green-500 bg-green-50' :
                    check.status === 'fail' ? 'border-red-500 bg-red-50' :
                    check.status === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getStatusIcon(check.status)}</span>
                        <h5 className="font-medium text-gray-900">{check.name}</h5>
                        <span className={`ml-3 px-2 py-1 rounded text-xs font-medium ${getSeverityColor(check.severity)}`}>
                          {check.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{check.message}</p>
                      {check.details && (
                        <p className="text-xs text-gray-600 mt-2">{check.details}</p>
                      )}
                      {check.fix && (
                        <div className="mt-3 p-2 bg-white rounded border-l-2 border-blue-500">
                          <p className="text-xs text-blue-700">
                            <strong>Fix:</strong> {check.fix}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-medium text-blue-900 mb-4">📋 Recommendations</h4>
            <div className="space-y-2">
              {validationResult.recommendations.map((rec, index) => (
                <p key={index} className="text-sm text-blue-800 leading-relaxed">
                  {rec}
                </p>
              ))}
            </div>
          </div>

          {/* Deployment Plan */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4">🚀 Deployment Plan</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Strategy & Duration</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Strategy:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStrategyColor(validationResult.deploymentPlan.strategy)}`}>
                      {validationResult.deploymentPlan.strategy.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="text-sm font-medium">{validationResult.deploymentPlan.estimatedDuration}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Prerequisites</h5>
                <ul className="space-y-1">
                  {validationResult.deploymentPlan.prerequisites.map((prereq, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      {prereq}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h5 className="font-medium text-gray-700 mb-2">Rollback Plan</h5>
              <p className="text-sm text-gray-600">{validationResult.deploymentPlan.rollbackPlan}</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!validationResult && !isValidating && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Ready to Validate Deployment
          </h4>
          <p className="text-gray-600">
            Click "Run Validation" to check production deployment readiness
          </p>
        </div>
      )}
    </div>
  );
};

export default DeploymentValidator;