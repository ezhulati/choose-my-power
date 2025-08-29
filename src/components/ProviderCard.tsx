import React from 'react';
import { Star, Phone, Globe } from 'lucide-react';
import type { Provider } from '../types';

interface ProviderCardProps {
  provider: Provider;
  onCompare?: () => void;
  onViewDetails?: () => void;
  showPlans?: boolean;
}

export function ProviderCard({ provider, onCompare, onViewDetails, showPlans = false }: ProviderCardProps) {
  const lowestRate = provider.plans.length > 0 
    ? Math.min(...provider.plans.map(plan => plan.rate))
    : null;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img
              src={provider.logo}
              alt={`${provider.name} logo`}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600 ml-1">{provider.rating}</span>
                </div>
                <span className="text-sm text-gray-500">({provider.reviewCount} reviews)</span>
              </div>
            </div>
          </div>
          {lowestRate && (
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{lowestRate}¢</div>
              <div className="text-sm text-gray-500">per kWh</div>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{provider.description}</p>

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          {provider.features.slice(0, 3).map((feature, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-texas-navy/10 text-texas-navy"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Plans Preview */}
        {showPlans && provider.plans.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Popular Plans:</h4>
            <div className="space-y-2">
              {provider.plans.slice(0, 2).map((plan) => (
                <div key={plan.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                    <div className="text-xs text-gray-500">{plan.termLength} months • {plan.type}</div>
                  </div>
                  <div className="text-sm font-semibold text-green-600">{plan.rate}¢/kWh</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-1" />
            <a href={`tel:${provider.contactPhone}`} className="hover:text-blue-600 transition-colors">
              {provider.contactPhone}
            </a>
          </div>
          <div className="flex items-center">
            <Globe className="h-4 w-4 mr-1" />
            <a href={provider.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
              Website
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              View Details
            </button>
          )}
          {onCompare && (
            <button
              onClick={onCompare}
              className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Compare
            </button>
          )}
        </div>
      </div>
    </div>
  );
}