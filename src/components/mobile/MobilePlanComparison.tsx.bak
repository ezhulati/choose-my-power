/**
 * Mobile Plan Comparison Component
 * Touch-friendly plan comparison with swipe gestures, mobile-first layout,
 * and conversion-optimized UX for Texas electricity customers
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Plan } from '../../types/facets';

interface MobilePlanComparisonProps {
  plans: Plan[];
  city: string;
  selectedPlans?: string[];
  onPlanSelect?: (plan: Plan) => void;
  onPlanDeselect?: (planId: string) => void;
  onPlanEnroll?: (plan: Plan, position: number) => void;
  maxComparisons?: number;
  showSort?: boolean;
  sortOptions?: SortOption[];
  defaultSort?: string;
  enableSwipeActions?: boolean;
  compactMode?: boolean;
  showTrustSignals?: boolean;
}

interface SortOption {
  id: string;
  label: string;
  field: keyof Plan | string;
  direction: 'asc' | 'desc';
}

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  deltaX: number;
  isDragging: boolean;
  draggedPlan: string | null;
  swipeDirection: 'left' | 'right' | null;
  swipeThreshold: number;
}

interface ComparisonState {
  selectedPlans: string[];
  sortBy: string;
  showComparison: boolean;
  viewMode: 'list' | 'cards' | 'comparison';
  filters: {
    priceRange: [number, number];
    contractLength: number[];
    planType: string[];
    greenEnergy: boolean;
  };
}

const defaultSortOptions: SortOption[] = [
  { id: 'rate_asc', label: 'Lowest Rate', field: 'pricing.rate1000kWh', direction: 'asc' },
  { id: 'rate_desc', label: 'Highest Rate', field: 'pricing.rate1000kWh', direction: 'desc' },
  { id: 'contract_asc', label: 'Shortest Contract', field: 'contract.length', direction: 'asc' },
  { id: 'green_desc', label: 'Most Green', field: 'features.greenEnergy', direction: 'desc' },
  { id: 'rating_desc', label: 'Best Rated', field: 'provider.rating', direction: 'desc' }
];

export const MobilePlanComparison: React.FC<MobilePlanComparisonProps> = ({
  plans,
  city,
  selectedPlans = [],
  onPlanSelect,
  onPlanDeselect,
  onPlanEnroll,
  maxComparisons = 3,
  showSort = true,
  sortOptions = defaultSortOptions,
  defaultSort = 'rate_asc',
  enableSwipeActions = true,
  compactMode = false,
  showTrustSignals = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    deltaX: 0,
    isDragging: false,
    draggedPlan: null,
    swipeDirection: null,
    swipeThreshold: 80
  });

  const [comparisonState, setComparisonState] = useState<ComparisonState>({
    selectedPlans,
    sortBy: defaultSort,
    showComparison: false,
    viewMode: 'cards',
    filters: {
      priceRange: [0, 1000],
      contractLength: [],
      planType: [],
      greenEnergy: false
    }
  });

  const [visiblePlans, setVisiblePlans] = useState(12); // Progressive loading
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Initialize component and setup performance optimizations
   */
  useEffect(() => {
    // Setup intersection observer for progressive loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id === 'load-more-trigger') {
            loadMorePlans();
          }
        });
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    // Observe load more trigger
    const trigger = document.getElementById('load-more-trigger');
    if (trigger) {
      observer.observe(trigger);
    }

    return () => observer.disconnect();
  }, [visiblePlans, plans.length]);

  /**
   * Update selected plans when props change
   */
  useEffect(() => {
    setComparisonState(prev => ({ ...prev, selectedPlans }));
  }, [selectedPlans]);

  /**
   * Progressive loading of plans for better mobile performance
   */
  const loadMorePlans = useCallback(() => {
    if (visiblePlans >= plans.length || isLoading) return;
    
    setIsLoading(true);
    
    // Simulate slight delay for smooth UX
    setTimeout(() => {
      setVisiblePlans(prev => Math.min(prev + 12, plans.length));
      setIsLoading(false);
    }, 100);
  }, [visiblePlans, plans.length, isLoading]);

  /**
   * Sort plans based on selected option
   */
  const sortPlans = useCallback((plans: Plan[], sortBy: string): Plan[] => {
    const option = sortOptions.find(opt => opt.id === sortBy);
    if (!option) return plans;

    return [...plans].sort((a, b) => {
      const getValue = (plan: Plan, field: string): any => {
        const keys = field.split('.');
        let value: any = plan;
        for (const key of keys) {
          value = value?.[key];
        }
        return value ?? 0;
      };

      const aValue = getValue(a, option.field as string);
      const bValue = getValue(b, option.field as string);

      if (option.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [sortOptions]);

  /**
   * Handle touch start for swipe gestures
   */
  const handleTouchStart = (e: React.TouchEvent, planId: string): void => {
    if (!enableSwipeActions) return;

    const touch = e.touches[0];
    setSwipeState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      deltaX: 0,
      isDragging: false,
      draggedPlan: planId,
      swipeDirection: null,
      swipeThreshold: 80
    });

    // Light haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  /**
   * Handle touch move for swipe gestures
   */
  const handleTouchMove = (e: React.TouchEvent): void => {
    if (!enableSwipeActions || !swipeState.draggedPlan) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    const deltaY = touch.clientY - swipeState.startY;

    // Only handle horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault();
      
      const direction = deltaX > 0 ? 'right' : 'left';
      const isDragging = Math.abs(deltaX) > 15;

      setSwipeState(prev => ({
        ...prev,
        currentX: touch.clientX,
        deltaX,
        isDragging,
        swipeDirection: direction
      }));

      // Visual feedback during swipe
      const planCard = document.querySelector(`[data-plan-id="${swipeState.draggedPlan}"]`);
      if (planCard instanceof HTMLElement && isDragging) {
        const intensity = Math.min(Math.abs(deltaX) / swipeState.swipeThreshold, 1);
        planCard.style.transform = `translateX(${deltaX * 0.3}px) scale(${0.98 + intensity * 0.02})`;
        planCard.style.opacity = `${1 - intensity * 0.1}`;
      }
    }
  };

  /**
   * Handle touch end for swipe actions
   */
  const handleTouchEnd = (): void => {
    if (!enableSwipeActions || !swipeState.draggedPlan) return;

    const planCard = document.querySelector(`[data-plan-id="${swipeState.draggedPlan}"]`);
    if (planCard instanceof HTMLElement) {
      // Reset visual state
      planCard.style.transform = '';
      planCard.style.opacity = '';
    }

    // Process swipe action
    if (Math.abs(swipeState.deltaX) >= swipeState.swipeThreshold) {
      const plan = plans.find(p => p.id === swipeState.draggedPlan);
      if (plan) {
        if (swipeState.swipeDirection === 'right') {
          handleEnrollPlan(plan);
        } else if (swipeState.swipeDirection === 'left') {
          handleComparePlan(plan);
        }
      }

      // Success haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 100]);
      }
    }

    setSwipeState({
      startX: 0,
      startY: 0,
      currentX: 0,
      deltaX: 0,
      isDragging: false,
      draggedPlan: null,
      swipeDirection: null,
      swipeThreshold: 80
    });
  };

  /**
   * Handle plan comparison selection
   */
  const handleComparePlan = (plan: Plan): void => {
    const isSelected = comparisonState.selectedPlans.includes(plan.id);
    
    if (isSelected) {
      const updated = comparisonState.selectedPlans.filter(id => id !== plan.id);
      setComparisonState(prev => ({ ...prev, selectedPlans: updated }));
      onPlanDeselect?.(plan.id);
    } else if (comparisonState.selectedPlans.length < maxComparisons) {
      const updated = [...comparisonState.selectedPlans, plan.id];
      setComparisonState(prev => ({ ...prev, selectedPlans: updated }));
      onPlanSelect?.(plan);
    }

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  /**
   * Handle plan enrollment
   */
  const handleEnrollPlan = (plan: Plan): void => {
    const position = plans.findIndex(p => p.id === plan.id) + 1;
    onPlanEnroll?.(plan, position);

    // Success haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  /**
   * Calculate savings compared to average
   */
  const calculateSavings = (plan: Plan): number => {
    const avgRate = plans.reduce((sum, p) => sum + (p.pricing.rate1000kWh * 1000), 0) / plans.length;
    const planRate = plan.pricing.rate1000kWh * 1000;
    return avgRate - planRate;
  };

  /**
   * Format rate display with emphasis on savings
   */
  const formatRateDisplay = (plan: Plan): { rate: string; savings: number; isGoodDeal: boolean } => {
    const rate = (plan.pricing.rate1000kWh * 100).toFixed(1);
    const savings = calculateSavings(plan);
    const isGoodDeal = savings > 10; // $10+ savings per month
    
    return { rate: `${rate}¢`, savings, isGoodDeal };
  };

  const sortedPlans = sortPlans(plans, comparisonState.sortBy);
  const displayPlans = sortedPlans.slice(0, visiblePlans);

  return (
    <div 
      ref={containerRef}
      className={`mobile-plan-comparison ${compactMode ? 'compact' : ''}`}
      onTouchStart={(e) => {
        const planCard = e.target as Element;
        const planId = planCard.closest('[data-plan-id]')?.getAttribute('data-plan-id');
        if (planId) handleTouchStart(e, planId);
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header with Sort and View Options */}
      <div className="comparison-header">
        <div className="header-info">
          <h2 className="plans-title">
            {plans.length} Plans Available in {city}
          </h2>
          {comparisonState.selectedPlans.length > 0 && (
            <div className="comparison-counter">
              {comparisonState.selectedPlans.length}/{maxComparisons} selected to compare
            </div>
          )}
        </div>

        {showSort && (
          <div className="sort-controls">
            <select
              value={comparisonState.sortBy}
              onChange={(e) => setComparisonState(prev => ({ ...prev, sortBy: e.target.value }))}
              className="sort-select"
            >
              {sortOptions.map(option => (
                <option key={option.id} value={option.id}>
                  Sort by {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Swipe Instructions */}
      {enableSwipeActions && (
        <div className="swipe-instructions">
          <div className="instruction-item">
            <span className="swipe-icon">👈</span>
            <span>Swipe left to compare</span>
          </div>
          <div className="instruction-item">
            <span className="swipe-icon">👉</span>
            <span>Swipe right to enroll</span>
          </div>
        </div>
      )}

      {/* Plan Cards */}
      <div className="plans-grid">
        {displayPlans.map((plan, index) => {
          const rateInfo = formatRateDisplay(plan);
          const isSelected = comparisonState.selectedPlans.includes(plan.id);
          const isTopPlan = index < 3;
          
          return (
            <div
              key={plan.id}
              data-plan-id={plan.id}
              className={`plan-card-mobile ${isSelected ? 'selected' : ''} ${
                swipeState.draggedPlan === plan.id && swipeState.isDragging ? 'dragging' : ''
              }`}
            >
              {/* Top Plan Badge */}
              {isTopPlan && (
                <div className="top-plan-badge">
                  <span className="badge-icon">🏆</span>
                  <span className="badge-text">#{index + 1}</span>
                </div>
              )}

              {/* Savings Badge */}
              {rateInfo.isGoodDeal && (
                <div className="savings-badge">
                  Save ${Math.round(rateInfo.savings)}/mo
                </div>
              )}

              {/* Plan Header */}
              <div className="plan-header-mobile">
                <div className="provider-section">
                  {plan.provider.logo && (
                    <img
                      src={plan.provider.logo}
                      alt={`${plan.provider.name} logo`}
                      className="provider-logo-mobile"
                      loading="lazy"
                      width="60"
                      height="30"
                    />
                  )}
                  <div className="provider-info">
                    <h3 className="plan-name-mobile">{plan.name}</h3>
                    <p className="provider-name-mobile">{plan.provider.name}</p>
                    {showTrustSignals && plan.provider.rating > 0 && (
                      <div className="rating-display">
                        <div className="stars-mobile">
                          {Array.from({length: 5}, (_, i) => (
                            <span 
                              key={i} 
                              className={`star ${i < Math.floor(plan.provider.rating) ? 'filled' : ''}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="rating-value">{plan.provider.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rate-display">
                  <div className="main-rate">
                    <span className="rate-value">{rateInfo.rate}</span>
                    <span className="rate-unit">per kWh</span>
                  </div>
                  <div className="monthly-estimate">
                    ${(plan.pricing.rate1000kWh * 1000).toFixed(0)}/month
                  </div>
                </div>
              </div>

              {/* Plan Features */}
              <div className="plan-features-mobile">
                <div className="feature-chips">
                  <div className="feature-chip contract">
                    <span className="chip-icon">📅</span>
                    <span className="chip-text">{plan.contract.length} month</span>
                  </div>
                  
                  <div className="feature-chip type">
                    <span className="chip-icon">📈</span>
                    <span className="chip-text">{plan.contract.type}</span>
                  </div>
                  
                  {plan.features.greenEnergy > 0 && (
                    <div className="feature-chip green">
                      <span className="chip-icon">🌱</span>
                      <span className="chip-text">{plan.features.greenEnergy}% Green</span>
                    </div>
                  )}
                  
                  {!plan.features.deposit.required && (
                    <div className="feature-chip no-deposit">
                      <span className="chip-icon">💰</span>
                      <span className="chip-text">No Deposit</span>
                    </div>
                  )}
                </div>

                {/* Trust Signals */}
                {showTrustSignals && (
                  <div className="trust-signals">
                    {plan.contract.earlyTerminationFee === 0 && (
                      <div className="trust-item">
                        <span className="trust-icon">✅</span>
                        <span className="trust-text">No Early Fee</span>
                      </div>
                    )}
                    {plan.features.billCredit > 0 && (
                      <div className="trust-item">
                        <span className="trust-icon">💸</span>
                        <span className="trust-text">${plan.features.billCredit} Bill Credit</span>
                      </div>
                    )}
                    {plan.provider.rating >= 4.0 && (
                      <div className="trust-item">
                        <span className="trust-icon">⭐</span>
                        <span className="trust-text">Highly Rated</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="plan-actions-mobile">
                <button
                  className={`compare-btn-mobile ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleComparePlan(plan)}
                  disabled={!isSelected && comparisonState.selectedPlans.length >= maxComparisons}
                >
                  <span className="btn-icon">📊</span>
                  <span className="btn-text">
                    {isSelected ? 'Remove' : 'Compare'}
                  </span>
                </button>

                <button
                  className="enroll-btn-mobile"
                  onClick={() => handleEnrollPlan(plan)}
                >
                  <span className="btn-icon">⚡</span>
                  <span className="btn-text">Enroll Now</span>
                </button>
              </div>

              {/* Swipe Indicators */}
              {enableSwipeActions && swipeState.draggedPlan === plan.id && swipeState.isDragging && (
                <div className="swipe-indicators-mobile">
                  <div className={`swipe-indicator left ${swipeState.swipeDirection === 'left' ? 'active' : ''}`}>
                    <span className="indicator-icon">📊</span>
                    <span className="indicator-text">Compare</span>
                  </div>
                  <div className={`swipe-indicator right ${swipeState.swipeDirection === 'right' ? 'active' : ''}`}>
                    <span className="indicator-icon">⚡</span>
                    <span className="indicator-text">Enroll</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Load More Trigger */}
      {visiblePlans < plans.length && (
        <div id="load-more-trigger" className="load-more-section">
          {isLoading ? (
            <div className="loading-more">
              <div className="loading-spinner" />
              <span>Loading more plans...</span>
            </div>
          ) : (
            <button 
              className="load-more-btn"
              onClick={loadMorePlans}
            >
              Load More Plans ({plans.length - visiblePlans} remaining)
            </button>
          )}
        </div>
      )}

      {/* Floating Comparison Bar */}
      {comparisonState.selectedPlans.length > 0 && (
        <div className="floating-comparison-bar">
          <div className="comparison-content">
            <span className="comparison-text">
              {comparisonState.selectedPlans.length} plan{comparisonState.selectedPlans.length > 1 ? 's' : ''} selected
            </span>
            <button 
              className="compare-all-btn"
              onClick={() => setComparisonState(prev => ({ ...prev, showComparison: true }))}
            >
              Compare All
            </button>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {plans.length === 0 && (
        <div className="no-results-mobile">
          <div className="no-results-icon">🔍</div>
          <h3>No plans found</h3>
          <p>Try adjusting your filters or search criteria</p>
        </div>
      )}
    </div>
  );
};

export default MobilePlanComparison;