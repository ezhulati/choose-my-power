/**
 * PlanResultsGrid Component
 * Displays filtered plan results in grid or list view
 * Supports plan selection, comparison, and detailed view
 * FULLY CONVERTED TO SHADCN/UI WITH TEXAS BRANDING
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { Plan } from '../../types/facets';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { cn } from '../../lib/utils';

interface PlanResultsGridProps {
  plans: Plan[];
  viewMode: 'grid' | 'list';
  selectedPlans: string[];
  onPlanSelect: (planId: string, selected: boolean) => void;
  citySlug: string;
  sessionId?: string;
  loading?: boolean;
  className?: string;
}

interface SortedPlan extends Plan {
  monthlyEstimate1000: number;
  monthlyEstimate2000: number;
  savings: number;
  greenEnergyBadge: 'none' | 'partial' | 'full';
}

const PlanResultsGrid: React.FC<PlanResultsGridProps> = ({
  plans,
  viewMode,
  selectedPlans,
  onPlanSelect,
  citySlug,
  sessionId,
  loading = false,
  className = ''
}) => {
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Enhanced plan data with calculations
  const enhancedPlans: SortedPlan[] = useMemo(() => {
    return plans.map(plan => {
      const rate = parseFloat(plan.rate) || 0;
      const monthlyEstimate1000 = parseFloat(plan.total_1000kwh || '0');
      const monthlyEstimate2000 = parseFloat(plan.total_2000kwh || '0');
      
      // Calculate potential savings compared to average
      const averageRate = plans.reduce((sum, p) => sum + (parseFloat(p.rate) || 0), 0) / plans.length;
      const savings = Math.max(0, (averageRate - rate) * 12); // Annual savings
      
      // Determine green energy badge
      let greenEnergyBadge: 'none' | 'partial' | 'full' = 'none';
      const greenPercent = plan.percent_green || 0;
      if (greenPercent >= 100) greenEnergyBadge = 'full';
      else if (greenPercent > 0) greenEnergyBadge = 'partial';

      return {
        ...plan,
        monthlyEstimate1000,
        monthlyEstimate2000,
        savings,
        greenEnergyBadge
      };
    });
  }, [plans]);

  // Handle plan selection
  const handlePlanSelect = useCallback((planId: string) => {
    const isSelected = selectedPlans.includes(planId);
    onPlanSelect(planId, !isSelected);

    // Track selection analytics
    if (sessionId && typeof gtag !== 'undefined') {
      gtag('event', 'plan_selection', {
        action: isSelected ? 'deselect' : 'select',
        plan_id: planId,
        session_id: sessionId,
        city: citySlug
      });
    }
  }, [selectedPlans, onPlanSelect, sessionId, citySlug]);

  // Handle plan details expansion
  const handlePlanExpand = useCallback((planId: string) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);

    // Track expansion analytics
    if (sessionId && typeof gtag !== 'undefined') {
      gtag('event', 'plan_details_view', {
        plan_id: planId,
        session_id: sessionId,
        city: citySlug
      });
    }
  }, [expandedPlan, sessionId, citySlug]);

  // Handle image load errors
  const handleImageError = useCallback((providerName: string) => {
    setImageErrors(prev => new Set(prev).add(providerName));
  }, []);

  // Handle enrollment click
  const handleEnrollClick = useCallback((plan: SortedPlan) => {
    // Track conversion event
    if (sessionId && typeof gtag !== 'undefined') {
      gtag('event', 'plan_enrollment_click', {
        plan_id: plan.id,
        provider: plan.provider,
        rate: plan.rate,
        session_id: sessionId,
        city: citySlug
      });
    }

    // Open enrollment in new tab/window
    if (plan.enrollment_url) {
      window.open(plan.enrollment_url, '_blank', 'noopener,noreferrer');
    }
  }, [sessionId, citySlug]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-16">
        <Alert className="max-w-md mx-auto">
          <AlertDescription className="space-y-4">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-texas-navy">No Plans Found</h3>
            <p className="text-gray-600">
              Try adjusting your filters to see more electricity plans for {citySlug.replace('-tx', '').replace('-', ' ')}.
            </p>
            <Button
              variant="texas-primary"
              onClick={() => window.location.href = `/electricity-plans/${citySlug}/`}
              className="mt-4"
            >
              Clear All Filters
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className={cn(
        "grid gap-4 md:gap-6",
        viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
      )}>
        {enhancedPlans.map((plan) => {
          const isSelected = selectedPlans.includes(plan.id);
          const isExpanded = expandedPlan === plan.id;
          const hasImageError = imageErrors.has(plan.provider);

          return (
            <Card
              key={plan.id}
              variant={isSelected ? "popular" : "plan-card"}
              className={cn(
                "relative transition-all duration-200",
                isSelected && "ring-2 ring-texas-navy/20 border-texas-navy",
                isExpanded && "border-texas-navy shadow-lg"
              )}
              data-plan-id={plan.id}
            >
              {/* Selection Checkbox */}
              <div className="absolute top-4 right-4">
                <input
                  type="checkbox"
                  id={`plan-${plan.id}`}
                  checked={isSelected}
                  onChange={() => handlePlanSelect(plan.id)}
                  className="w-5 h-5 accent-texas-navy cursor-pointer focus:ring-2 focus:ring-texas-navy focus:ring-offset-2"
                  aria-label={`Select ${plan.name} plan for comparison`}
                />
              </div>

              <CardHeader className="pb-4">
                <div className="flex items-start justify-between pr-8">
                  <div className="flex items-center gap-3">
                    {!hasImageError && plan.provider_logo ? (
                      <img
                        src={plan.provider_logo}
                        alt={`${plan.provider} logo`}
                        className="w-12 h-12 object-contain rounded-md border border-gray-200"
                        onError={() => handleImageError(plan.provider)}
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center bg-gray-100 border border-gray-200 rounded-md font-semibold text-lg text-gray-600">
                        {plan.provider.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-1">
                      <h3 className="font-semibold text-gray-900">{plan.provider}</h3>
                      <p className="text-sm text-gray-600">{plan.name}</p>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {plan.greenEnergyBadge === 'full' && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      100% Green
                    </Badge>
                  )}
                  {plan.greenEnergyBadge === 'partial' && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {plan.percent_green}% Green
                    </Badge>
                  )}
                  {plan.is_pre_pay && (
                    <Badge variant="outline" className="bg-texas-navy/10 text-texas-navy border-texas-navy/20">
                      Prepaid
                    </Badge>
                  )}
                  {!plan.deposit_required && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      No Deposit
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Plan Pricing */}
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-3xl font-bold text-texas-navy">{parseFloat(plan.rate).toFixed(2)}</span>
                    <span className="text-gray-600 font-medium">¢/kWh</span>
                  </div>
                  <div className="flex justify-center gap-4 text-sm text-gray-600">
                    <span>{plan.rate_type} rate</span>
                    <span>{plan.term_months} months</span>
                  </div>
                </div>

                {/* Monthly Estimates */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-texas-cream rounded-lg">
                  <div className="text-center">
                    <div className="text-[10px] text-gray-600 mb-1">1,000 kWh</div>
                    <div className="font-semibold text-gray-900">${plan.monthlyEstimate1000.toFixed(2)}/month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-gray-600 mb-1">2,000 kWh</div>
                    <div className="font-semibold text-gray-900">${plan.monthlyEstimate2000.toFixed(2)}/month</div>
                  </div>
                </div>

                {/* Savings Indicator */}
                {plan.savings > 0 && (
                  <div className="text-center">
                    <Badge className="bg-texas-gold text-texas-navy border-texas-gold">
                      Save up to ${plan.savings.toFixed(0)}/year
                    </Badge>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => handlePlanExpand(plan.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`plan-details-${plan.id}`}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                >
                  {isExpanded ? 'Hide Details' : 'View Details'}
                </Button>
                <Button
                  variant="texas-secondary"
                  size="default"
                  onClick={() => handleEnrollClick(plan)}
                  disabled={!plan.enrollment_url}
                  className="flex-1"
                >
                  Enroll Now
                </Button>
              </CardFooter>

              {/* Expanded Details */}
              {isExpanded && (
                <div 
                  id={`plan-details-${plan.id}`}
                  className="border-t border-gray-200 p-6 mt-4 space-y-6"
                  aria-hidden={!isExpanded}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Plan Features</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        {plan.bill_credit > 0 && (
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            ${plan.bill_credit} monthly bill credit
                          </li>
                        )}
                        {plan.free_nights_weekends && (
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Free nights and weekends
                          </li>
                        )}
                        {plan.satisfaction_guarantee && (
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Satisfaction guarantee
                          </li>
                        )}
                        {plan.requires_auto_pay && (
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-texas-navy rounded-full"></span>
                            Auto pay required
                          </li>
                        )}
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Contract Details</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          {plan.term_months} month term
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          {plan.rate_type} rate
                        </li>
                        {plan.early_termination_fee > 0 && (
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            ${plan.early_termination_fee} early termination fee
                          </li>
                        )}
                        {plan.deposit_required && (
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                            ${plan.deposit_amount || 'Varies'} deposit required
                          </li>
                        )}
                      </ul>
                    </div>

                    {(plan.efl_link || plan.tos_link) && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Documents</h4>
                        <div className="space-y-2">
                          {plan.efl_link && (
                            <a 
                              href={plan.efl_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block text-sm text-texas-navy hover:text-texas-red hover:underline transition-colors"
                            >
                              Electricity Facts Label
                            </a>
                          )}
                          {plan.tos_link && (
                            <a 
                              href={plan.tos_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block text-sm text-texas-navy hover:text-texas-red hover:underline transition-colors"
                            >
                              Terms of Service
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Load More Button (if needed for pagination) */}
      {plans.length >= 50 && (
        <div className="text-center mt-8 pt-8 border-t border-gray-200">
          <Button variant="outline" disabled>
            Showing {plans.length} plans
          </Button>
        </div>
      )}
    </div>
  );
};

export default PlanResultsGrid;
