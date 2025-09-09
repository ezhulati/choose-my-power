/**
 * City Page SEO Integration Component
 * Task T033: Integrate SEO service with city pages
 * Phase 3.5 Polish & Validation: Dynamic SEO metadata integration
 */

import React, { useEffect } from 'react';
import { useCitySEO } from '../../hooks/useCitySEO';
import type { CityPageSEO } from '../../lib/seo/zip-navigation-seo';

interface CityPageSEOIntegrationProps {
  zipCode: string;
  cityName: string;
  citySlug: string;
  countyName?: string;
  marketZone: 'North' | 'Central' | 'Coast' | 'South' | 'West';
  tdspTerritory?: string;
  planCount?: number;
  avgRate?: number;
  isDeregulated?: boolean;
  onSEOMetadata?: (metadata: CityPageSEO) => void;
  showDebugInfo?: boolean;
}

export const CityPageSEOIntegration: React.FC<CityPageSEOIntegrationProps> = ({
  zipCode,
  cityName,
  citySlug,
  countyName,
  marketZone,
  tdspTerritory,
  planCount,
  avgRate,
  isDeregulated,
  onSEOMetadata,
  showDebugInfo = false
}) => {
  const { metadata, loading, error, refresh } = useCitySEO({
    zipCode,
    cityName,
    citySlug,
    countyName,
    marketZone,
    tdspTerritory,
    planCount,
    avgRate,
    isDeregulated
  });

  // Apply SEO metadata to document head when loaded
  useEffect(() => {
    if (metadata && !loading && !error) {
      // Update document title
      document.title = metadata.title;

      // Update meta description
      updateMetaTag('description', metadata.description);

      // Update keywords
      updateMetaTag('keywords', metadata.keywords.join(', '));

      // Update canonical URL
      updateLinkTag('canonical', metadata.canonicalUrl);

      // Update Open Graph tags
      updateMetaTag('og:title', metadata.openGraph.title, 'property');
      updateMetaTag('og:description', metadata.openGraph.description, 'property');
      updateMetaTag('og:image', metadata.openGraph.image, 'property');
      updateMetaTag('og:url', metadata.openGraph.url, 'property');
      updateMetaTag('og:type', metadata.openGraph.type, 'property');

      // Update Twitter Card tags
      updateMetaTag('twitter:card', metadata.twitter.card);
      updateMetaTag('twitter:title', metadata.twitter.title);
      updateMetaTag('twitter:description', metadata.twitter.description);
      updateMetaTag('twitter:image', metadata.twitter.image);

      // Update JSON-LD structured data
      updateJSONLD('city-page-seo', metadata.jsonLd);

      // Notify parent component
      if (onSEOMetadata) {
        onSEOMetadata(metadata);
      }
    }
  }, [metadata, loading, error, onSEOMetadata]);

  // Helper function to update meta tags
  const updateMetaTag = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
    let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
    
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, name);
      document.head.appendChild(element);
    }
    
    element.setAttribute('content', content);
  };

  // Helper function to update link tags
  const updateLinkTag = (rel: string, href: string) => {
    let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
    
    if (!element) {
      element = document.createElement('link');
      element.setAttribute('rel', rel);
      document.head.appendChild(element);
    }
    
    element.setAttribute('href', href);
  };

  // Helper function to update JSON-LD structured data
  const updateJSONLD = (id: string, data: object) => {
    let element = document.getElementById(id) as HTMLScriptElement;
    
    if (!element) {
      element = document.createElement('script');
      element.setAttribute('type', 'application/ld+json');
      element.setAttribute('id', id);
      document.head.appendChild(element);
    }
    
    element.textContent = JSON.stringify(data, null, 2);
  };

  // Render debug information if requested
  if (showDebugInfo) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">
          🔍 SEO Integration Debug Information
        </h3>
        
        {loading && (
          <div className="flex items-center mb-4">
            <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-blue-700">Loading SEO metadata...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h4 className="text-red-800 font-medium">❌ SEO Loading Error</h4>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={refresh}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {metadata && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">📝 Page Title</h4>
              <p className="text-sm text-blue-700 bg-white p-2 rounded border">
                {metadata.title}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-blue-800 mb-2">📄 Meta Description</h4>
              <p className="text-sm text-blue-700 bg-white p-2 rounded border">
                {metadata.description}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-blue-800 mb-2">🔗 Canonical URL</h4>
              <p className="text-sm text-blue-700 bg-white p-2 rounded border">
                {metadata.canonicalUrl}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-blue-800 mb-2">🏷️ Keywords ({metadata.keywords.length})</h4>
              <div className="flex flex-wrap gap-1">
                {metadata.keywords.slice(0, 10).map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    {keyword}
                  </span>
                ))}
                {metadata.keywords.length > 10 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    +{metadata.keywords.length - 10} more
                  </span>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-blue-800 mb-2">🍞 Breadcrumbs</h4>
              <div className="text-sm text-blue-700 bg-white p-2 rounded border">
                {metadata.breadcrumbs.map((crumb, index) => (
                  <span key={index}>
                    {index > 0 && ' › '}
                    <a href={crumb.url} className="hover:underline">
                      {crumb.name}
                    </a>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-blue-800 mb-2">📱 Social Media Preview</h4>
              <div className="bg-white border rounded-lg p-3">
                <div className="flex items-start space-x-3">
                  <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                    <span className="text-xs text-gray-500">IMG</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 text-sm truncate">
                      {metadata.openGraph.title}
                    </h5>
                    <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                      {metadata.openGraph.description}
                    </p>
                    <p className="text-gray-400 text-xs mt-1 truncate">
                      {new URL(metadata.openGraph.url).hostname}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-blue-800 mb-2">⚙️ SEO Parameters</h4>
              <div className="text-xs text-blue-700 bg-white p-2 rounded border font-mono">
                <div>ZIP: {zipCode}</div>
                <div>City: {cityName} ({citySlug})</div>
                <div>Market Zone: {marketZone}</div>
                <div>Plans: {planCount || 'N/A'}</div>
                <div>Avg Rate: {avgRate ? `${avgRate}¢/kWh` : 'N/A'}</div>
                <div>Deregulated: {isDeregulated ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Component is invisible when not in debug mode - SEO metadata is applied automatically
  return null;
};

export default CityPageSEOIntegration;