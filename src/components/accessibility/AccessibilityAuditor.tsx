/**
 * Accessibility Auditor Component
 * Task T034: Real-time accessibility compliance monitoring
 * Phase 3.5 Polish & Validation: WCAG 2.1 compliance dashboard
 */

import React, { useState, useEffect, useRef } from 'react';
import { wcagComplianceService, type AccessibilityViolation } from '../../lib/accessibility/wcag-compliance';

interface AccessibilityAuditorProps {
  targetSelector?: string;
  autoRun?: boolean;
  showReport?: boolean;
  onViolationsDetected?: (violations: AccessibilityViolation[]) => void;
}

export const AccessibilityAuditor: React.FC<AccessibilityAuditorProps> = ({
  targetSelector = '[data-accessibility-audit]',
  autoRun = true,
  showReport = true,
  onViolationsDetected
}) => {
  const [violations, setViolations] = useState<AccessibilityViolation[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [lastAuditTime, setLastAuditTime] = useState<Date | null>(null);
  const [auditReport, setAuditReport] = useState<any>(null);
  const [colorTests, setColorTests] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Run accessibility audit
  const runAudit = async () => {
    setIsAuditing(true);
    
    try {
      // Find target elements
      const targetElements = document.querySelectorAll(targetSelector);
      const allViolations: AccessibilityViolation[] = [];
      
      // Audit each target element
      targetElements.forEach(element => {
        const elementViolations = wcagComplianceService.auditZIPNavigation(element as HTMLElement);
        allViolations.push(...elementViolations);
      });
      
      // If no specific targets, audit the whole page
      if (targetElements.length === 0) {
        const pageViolations = wcagComplianceService.auditZIPNavigation(document.body);
        allViolations.push(...pageViolations);
      }
      
      setViolations(allViolations);
      setLastAuditTime(new Date());
      
      // Generate comprehensive report
      const report = wcagComplianceService.generateAccessibilityReport(allViolations);
      setAuditReport(report);
      
      // Test color combinations
      const colors = wcagComplianceService.getAccessibleColors();
      setColorTests(colors);
      
      // Notify parent component
      if (onViolationsDetected) {
        onViolationsDetected(allViolations);
      }
      
    } catch (error) {
      console.error('[AccessibilityAuditor] Audit failed:', error);
    } finally {
      setIsAuditing(false);
    }
  };

  // Auto-run audit on mount and interval
  useEffect(() => {
    if (autoRun) {
      runAudit();
      
      // Set up periodic re-auditing
      intervalRef.current = setInterval(runAudit, 30000); // Every 30 seconds
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRun, targetSelector]);

  // Manual audit trigger
  const handleManualAudit = () => {
    runAudit();
  };

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'info':
        return '🔵';
      default:
        return '⚪';
    }
  };

  // Get compliance level color
  const getComplianceLevelColor = (level: string) => {
    switch (level) {
      case 'AAA':
        return 'text-green-600 bg-green-100';
      case 'AA':
        return 'text-blue-600 bg-blue-100';
      case 'A':
        return 'text-yellow-600 bg-yellow-100';
      case 'fail':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!showReport) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            🔍 Accessibility Audit
          </h3>
          <p className="text-sm text-gray-600">
            WCAG 2.1 compliance monitoring
          </p>
        </div>
        
        <button
          onClick={handleManualAudit}
          disabled={isAuditing}
          className="px-4 py-2 bg-texas-navy text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors focus:ring-4 focus:ring-blue-200 focus:outline-none"
        >
          {isAuditing ? 'Auditing...' : 'Run Audit'}
        </button>
      </div>

      {/* Audit Status */}
      {lastAuditTime && (
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Last audit: {lastAuditTime.toLocaleTimeString()}
          </p>
          {auditReport && (
            <div className="mt-2 flex items-center space-x-4">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getComplianceLevelColor(auditReport.compliance.level)}`}>
                WCAG {auditReport.compliance.level}
              </span>
              <span className="text-sm text-gray-600">
                {auditReport.compliance.percentage}% compliant
              </span>
            </div>
          )}
        </div>
      )}

      {/* Violations Summary */}
      {auditReport && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Audit Summary</h4>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{auditReport.summary.total}</div>
              <div className="text-xs text-gray-600">Total Issues</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{auditReport.summary.errors}</div>
              <div className="text-xs text-red-600">Errors</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{auditReport.summary.warnings}</div>
              <div className="text-xs text-yellow-600">Warnings</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{auditReport.summary.infos}</div>
              <div className="text-xs text-blue-600">Info</div>
            </div>
          </div>
        </div>
      )}

      {/* Color Contrast Tests */}
      {colorTests && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Color Contrast Tests</h4>
          <div className="space-y-2">
            {Object.entries(colorTests).map(([key, colors]: [string, any]) => (
              <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded border"
                    style={{
                      backgroundColor: colors.background,
                      color: colors.foreground
                    }}
                  />
                  <span className="text-sm font-medium capitalize">{key}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{colors.ratio}:1</span>
                  <span className={`px-2 py-1 rounded text-xs ${colors.ratio >= 4.5 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {colors.ratio >= 4.5 ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Violations List */}
      {violations.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">
            Accessibility Issues ({violations.length})
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {violations.map((violation, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border-l-4 ${
                  violation.severity === 'error' ? 'border-red-500 bg-red-50' :
                  violation.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start">
                  <span className="text-lg mr-2">
                    {getSeverityIcon(violation.severity)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900">
                      {violation.element}
                    </h5>
                    <p className="text-sm text-gray-600 mt-1">
                      {violation.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      <strong>Fix:</strong> {violation.recommendation}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {violation.wcagRule}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {auditReport?.recommendations && auditReport.recommendations.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Top Recommendations</h4>
          <ul className="space-y-2">
            {auditReport.recommendations.map((rec: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-sm text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No Issues */}
      {violations.length === 0 && lastAuditTime && !isAuditing && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">✅</div>
          <h4 className="text-lg font-medium text-green-600 mb-2">
            No Accessibility Issues Found
          </h4>
          <p className="text-sm text-gray-600">
            All audited elements meet WCAG 2.1 AA standards
          </p>
        </div>
      )}

      {/* Loading State */}
      {isAuditing && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-texas-navy border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Running accessibility audit...</p>
        </div>
      )}
    </div>
  );
};

export default AccessibilityAuditor;