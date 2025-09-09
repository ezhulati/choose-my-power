/**
 * ZIP Lookup Integration Test Component
 * Phase 3.4 Enhancement: T028 demonstration
 * Shows enhanced ZIP routing with caching and performance metrics
 */

import React from 'react';
import ZIPCodeLookupForm from '../ui/ZIPCodeLookupForm';
import type { ZIPRoutingResult } from '../../types/zip-navigation';

export const ZIPLookupTestPage: React.FC = () => {
  const handleSuccess = (response: ZIPRoutingResult) => {
    console.log('ZIP lookup success:', response);
    alert(`Success! Redirecting to: ${response.data?.redirectUrl}\nResponse Time: ${response.responseTime}ms\nCached: ${response.cached}`);
  };

  const handleError = (error: string) => {
    console.error('ZIP lookup error:', error);
    alert(`Error: ${error}`);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Standard ZIP Lookup Form */}
      <div>
        <h2 className="text-2xl font-semibold text-texas-navy mb-4">
          Standard ZIP Lookup
        </h2>
        <p className="text-gray-600 mb-6">
          Enhanced form with ZIP routing service integration and performance tracking.
        </p>
        
        <ZIPCodeLookupForm
          cityName="Texas"
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>

      {/* Development Mode with Performance Metrics */}
      <div>
        <h2 className="text-2xl font-semibold text-texas-navy mb-4">
          Development Mode
        </h2>
        <p className="text-gray-600 mb-6">
          Same form with performance metrics display for development and optimization.
        </p>
        
        <ZIPCodeLookupForm
          cityName="Texas"
          showPerformanceMetrics={true}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
    </div>
  );
};

export default ZIPLookupTestPage;