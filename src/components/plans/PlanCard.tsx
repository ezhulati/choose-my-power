// T025: PlanCard component implementation
// Individual electricity plan display with Texas Design System (FR-007, FR-009)

import React, { memo, useState } from 'react';
import type { ElectricityPlan } from '../../lib/types/electricity-plan';
import { CostAnalysisUtils } from '../../lib/plan-comparison/cost-analysis';

interface PlanCardProps {
  plan: ElectricityPlan;
  onCompare?: (plan: ElectricityPlan) => void;
  onSelect?: (plan: ElectricityPlan) => void;
  isSelected?: boolean;
  isCompareMode?: boolean;
  showComparison?: boolean;
  estimatedMonthlyCost?: number;
  className?: string;
}

const PlanCard: React.FC<PlanCardProps> = memo(({
  plan,
  onCompare,
  onSelect,
  isSelected = false,
  isCompareMode = false,
  showComparison = true,
  estimatedMonthlyCost,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate display values
  const displayMonthlyCost = estimatedMonthlyCost || plan.estimatedMonthlyCost;
  const hasPromotions = plan.promotionalOffers.length > 0;
  const hasGreenEnergy = plan.greenEnergyPercentage > 0;
  const isLimitedAvailability = plan.availability === 'limited';
  const isDiscontinued = plan.availability === 'discontinued';
  const isFixedRate = plan.rateType === 'fixed';

  // Event handlers
  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCompare?.(plan);
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(plan);
  };

  const handleCardClick = () => {
    if (!isDiscontinued) {
      onSelect?.(plan);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isDiscontinued) {
        onSelect?.(plan);
      }
    }
  };

  // CSS classes with Texas Design System
  const cardClasses = `
    bg-white rounded-xl shadow-md border border-gray-200 p-6 w-full
    hover:shadow-xl hover:-translate-y-1 transition-all duration-300
    ${isSelected ? 'ring-2 ring-texas-red border-texas-red' : ''}
    ${isDiscontinued ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `.trim();

  const rateTypeColors = {
    fixed: 'bg-green-100 text-green-800',
    variable: 'bg-yellow-100 text-yellow-800', 
    indexed: 'bg-blue-100 text-texas-navy-800'
  };

  const availabilityWarning = isLimitedAvailability || isDiscontinued;

  return (
    <div
      className={cardClasses}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${plan.planName} by ${plan.providerName} - ${plan.baseRate} cents per kWh`}
      data-testid="plan-card"
    >
      {/* Availability Warning */}
      {availabilityWarning && (
        <div 
          className="mb-4 p-2 rounded-md bg-texas-red/10 border border-texas-red/30"
          data-testid="availability-warning"
        >
          <p className="text-sm text-texas-red font-medium">
            {isDiscontinued 
              ? 'This plan is no longer available for new customers'
              : 'Limited availability - Act fast!'
            }
          </p>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-texas-navy mb-1" role="heading">
              {plan.planName}
            </h3>
            <p className="text-lg font-semibold text-texas-navy">
              {plan.providerName}
            </p>
          </div>
          
          {/* Rate Type Badge */}
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${rateTypeColors[plan.rateType]}`}>
            {plan.rateType} rate
          </div>
        </div>

        {/* Provider Rating */}
        <div className="flex items-center mt-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-4 h-4 ${
                  star <= plan.providerRating 
                    ? 'text-texas-gold fill-current' 
                    : 'text-gray-300'
                }`}
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {plan.providerRating.toFixed(1)} ({plan.providerName} rating)
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="mb-6" data-testid="plan-pricing">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Base Rate */}
          <div className="text-center sm:text-left">
            <div className="text-3xl font-bold text-texas-navy">
              {plan.baseRate.toFixed(2)}
              <span className="text-lg font-normal">¢/kWh</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              <span className="sr-only">
                {plan.baseRate.toFixed(2)} cents per kilowatt hour
              </span>
              Base electricity rate
            </p>
          </div>

          {/* Estimated Monthly Cost */}
          <div className="text-center sm:text-right">
            <div className="text-2xl font-bold text-gray-900">
              {CostAnalysisUtils.formatCurrency(displayMonthlyCost)}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              <span className="sr-only">
                Estimated monthly cost {CostAnalysisUtils.formatCurrency(displayMonthlyCost)}
              </span>
              Est. monthly cost*
            </p>
          </div>
        </div>

        {/* First Year Total */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              First year total:
            </span>
            <span className="text-lg font-bold text-texas-navy">
              {CostAnalysisUtils.formatCurrency(plan.totalFirstYearCost)}
            </span>
          </div>
        </div>
      </div>

      {/* Contract Terms */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Contract:</span>
            <span className="ml-1 font-medium text-gray-900">
              {plan.contractLength} {plan.contractLength === 1 ? 'month' : 'months'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Monthly fee:</span>
            <span className="ml-1 font-medium text-gray-900">
              {plan.monthlyFee === 0 ? 'No fee' : CostAnalysisUtils.formatCurrency(plan.monthlyFee)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Connection:</span>
            <span className="ml-1 font-medium text-gray-900">
              {plan.connectionFee === 0 ? 'No fee' : CostAnalysisUtils.formatCurrency(plan.connectionFee)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Early termination:</span>
            <span className="ml-1 font-medium text-gray-900">
              {plan.earlyTerminationFee === 0 ? 'No fee' : CostAnalysisUtils.formatCurrency(plan.earlyTerminationFee)}
            </span>
          </div>
        </div>
      </div>

      {/* Green Energy */}
      {hasGreenEnergy && (
        <div className="mb-4 p-3 bg-green-50 rounded-md border border-green-200">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM12 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM12 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-green-800">
              {plan.greenEnergyPercentage}% renewable energy
            </span>
          </div>
        </div>
      )}

      {/* Promotional Offers */}
      {hasPromotions && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-texas-gold mb-2">
            🎉 Special Offers
          </h4>
          <div className="space-y-1">
            {plan.promotionalOffers.map((offer, index) => (
              <div key={index} className="text-sm text-texas-gold font-medium">
                • {offer}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan Features */}
      <div className="mb-6" data-testid="plan-features">
        <button
          className="flex items-center justify-between w-full text-left"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          aria-expanded={isExpanded}
          aria-controls="plan-features-list"
        >
          <h4 className="text-sm font-semibold text-gray-900">
            Plan Features ({plan.planFeatures.length})
          </h4>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <div 
          id="plan-features-list"
          className={`mt-2 space-y-1 transition-all duration-200 ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-20 opacity-75 overflow-hidden'
          }`}
        >
          {plan.planFeatures.map((feature, index) => (
            <div key={index} className="flex items-start text-sm text-gray-700">
              <svg className="w-4 h-4 text-texas-red mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>{feature}</span>
            </div>
          ))}
        </div>
        
        {!isExpanded && plan.planFeatures.length > 3 && (
          <p className="text-xs text-gray-500 mt-1">
            Click to see all {plan.planFeatures.length} features
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Select Plan Button */}
        <button
          className={`w-full py-3 px-6 rounded-lg font-semibold text-center transition-all duration-200 ${
            isDiscontinued
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-texas-red text-white hover:bg-texas-red-600 focus:ring-4 focus:ring-texas-red-200 focus:outline-none'
          }`}
          onClick={handleSelectClick}
          disabled={isDiscontinued}
          aria-label={`Select ${plan.planName} plan`}
        >
          {isDiscontinued ? 'No Longer Available' : 'Select This Plan'}
        </button>

        {/* Compare Button */}
        {showComparison && !isDiscontinued && (
          <button
            className="w-full py-2 px-4 border-2 border-texas-navy text-texas-navy rounded-lg font-medium 
                     hover:bg-texas-navy hover:text-white transition-all duration-200
                     focus:ring-4 focus:ring-blue-200 focus:outline-none"
            onClick={handleCompareClick}
            aria-label={`Compare ${plan.planName} plan`}
          >
            {isCompareMode ? '✓ Added to Compare' : '+ Add to Compare'}
          </button>
        )}
      </div>

      {/* Plan ID Debug (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-mono">
            Plan ID: {plan.id}
          </p>
          <p className="text-xs text-gray-400">
            TDSP: {plan.tdspTerritory} | Type: {plan.planType}
          </p>
        </div>
      )}

      {/* Screen Reader Content */}
      <div className="sr-only">
        <p>
          Plan details: {plan.planName} by {plan.providerName}. 
          Base rate: {plan.baseRate.toFixed(2)} cents per kilowatt hour.
          Estimated monthly cost: {CostAnalysisUtils.formatCurrency(displayMonthlyCost)}.
          Contract length: {plan.contractLength} {plan.contractLength === 1 ? 'month' : 'months'}.
          {plan.greenEnergyPercentage > 0 && `Includes ${plan.greenEnergyPercentage}% renewable energy.`}
          {hasPromotions && `Special offers: ${plan.promotionalOffers.join(', ')}.`}
          Provider rating: {plan.providerRating.toFixed(1)} out of 5 stars.
        </p>
      </div>
    </div>
  );
});

PlanCard.displayName = 'PlanCard';

export default PlanCard;