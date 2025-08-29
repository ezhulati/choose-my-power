/**
 * PlanResultsGrid Component
 * Displays filtered plan results in grid or list view
 * Supports plan selection, comparison, and detailed view
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { Plan } from '../../types/facets';

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
      <div className="plan-results-loading">
        <div className="loading-grid">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="plan-card-skeleton">
              <div className="skeleton-header"></div>
              <div className="skeleton-body">
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
                <div className="skeleton-line"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="no-results">
        <div className="no-results-content">
          <div className="no-results-icon">No Results</div>
          <h3 className="no-results-title">No Plans Found</h3>
          <p className="no-results-message">
            Try adjusting your filters to see more electricity plans for {citySlug.replace('-tx', '').replace('-', ' ')}.
          </p>
          <button 
            className="clear-filters-btn"
            onClick={() => window.location.href = `/electricity-plans/${citySlug}/`}
          >
            Clear All Filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`plan-results-grid ${viewMode} ${className}`}>
      <div className={`results-container ${viewMode}-view`}>
        {enhancedPlans.map((plan) => {
          const isSelected = selectedPlans.includes(plan.id);
          const isExpanded = expandedPlan === plan.id;
          const hasImageError = imageErrors.has(plan.provider);

          return (
            <article
              key={plan.id}
              className={`plan-card ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}
              data-plan-id={plan.id}
            >
              {/* Selection Checkbox */}
              <div className="plan-selection">
                <input
                  type="checkbox"
                  id={`plan-${plan.id}`}
                  checked={isSelected}
                  onChange={() => handlePlanSelect(plan.id)}
                  className="plan-checkbox"
                  aria-label={`Select ${plan.name} plan for comparison`}
                />
              </div>

              {/* Plan Header */}
              <header className="plan-header">
                <div className="provider-info">
                  {!hasImageError && plan.provider_logo ? (
                    <img
                      src={plan.provider_logo}
                      alt={`${plan.provider} logo`}
                      className="provider-logo"
                      onError={() => handleImageError(plan.provider)}
                    />
                  ) : (
                    <div className="provider-logo-fallback">
                      {plan.provider.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="provider-details">
                    <h3 className="provider-name">{plan.provider}</h3>
                    <p className="plan-name">{plan.name}</p>
                  </div>
                </div>

                {/* Badges */}
                <div className="plan-badges">
                  {plan.greenEnergyBadge === 'full' && (
                    <span className="badge green-badge" title="100% Green Energy">
                      100% Green
                    </span>
                  )}
                  {plan.greenEnergyBadge === 'partial' && (
                    <span className="badge partial-green-badge" title={`${plan.percent_green}% Green Energy`}>
                      {plan.percent_green}% Green
                    </span>
                  )}
                  {plan.is_pre_pay && (
                    <span className="badge prepaid-badge" title="Prepaid Plan">
                      Prepaid
                    </span>
                  )}
                  {!plan.deposit_required && (
                    <span className="badge no-deposit-badge" title="No Deposit Required">
                      No Deposit
                    </span>
                  )}
                </div>
              </header>

              {/* Plan Pricing */}
              <div className="plan-pricing">
                <div className="main-rate">
                  <span className="rate-value">{parseFloat(plan.rate).toFixed(2)}</span>
                  <span className="rate-unit">¢/kWh</span>
                </div>
                <div className="rate-details">
                  <span className="rate-type">{plan.rate_type} rate</span>
                  <span className="contract-length">{plan.term_months} months</span>
                </div>
              </div>

              {/* Monthly Estimates */}
              <div className="monthly-estimates">
                <div className="estimate-item">
                  <span className="usage-amount">1,000 kWh</span>
                  <span className="monthly-cost">${plan.monthlyEstimate1000.toFixed(2)}/month</span>
                </div>
                <div className="estimate-item">
                  <span className="usage-amount">2,000 kWh</span>
                  <span className="monthly-cost">${plan.monthlyEstimate2000.toFixed(2)}/month</span>
                </div>
              </div>

              {/* Savings Indicator */}
              {plan.savings > 0 && (
                <div className="savings-indicator">
                  <span className="savings-badge">
                    Save up to ${plan.savings.toFixed(0)}/year
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="plan-actions">
                <button
                  className="details-btn"
                  onClick={() => handlePlanExpand(plan.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`plan-details-${plan.id}`}
                >
                  {isExpanded ? 'Hide Details' : 'View Details'}
                </button>
                <button
                  className="enroll-btn"
                  onClick={() => handleEnrollClick(plan)}
                  disabled={!plan.enrollment_url}
                >
                  Enroll Now
                </button>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div 
                  id={`plan-details-${plan.id}`}
                  className="plan-details"
                  aria-hidden={!isExpanded}
                >
                  <div className="details-grid">
                    <div className="detail-group">
                      <h4>Plan Features</h4>
                      <ul className="feature-list">
                        {plan.bill_credit > 0 && (
                          <li>${plan.bill_credit} monthly bill credit</li>
                        )}
                        {plan.free_nights_weekends && (
                          <li>Free nights and weekends</li>
                        )}
                        {plan.satisfaction_guarantee && (
                          <li>Satisfaction guarantee</li>
                        )}
                        {plan.requires_auto_pay && (
                          <li>Auto pay required</li>
                        )}
                      </ul>
                    </div>
                    
                    <div className="detail-group">
                      <h4>Contract Details</h4>
                      <ul className="contract-list">
                        <li>{plan.term_months} month term</li>
                        <li>{plan.rate_type} rate</li>
                        {plan.early_termination_fee > 0 && (
                          <li>${plan.early_termination_fee} early termination fee</li>
                        )}
                        {plan.deposit_required && (
                          <li>${plan.deposit_amount || 'Varies'} deposit required</li>
                        )}
                      </ul>
                    </div>

                    {(plan.efl_link || plan.tos_link) && (
                      <div className="detail-group">
                        <h4>Documents</h4>
                        <div className="document-links">
                          {plan.efl_link && (
                            <a 
                              href={plan.efl_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="doc-link"
                            >
                              Electricity Facts Label
                            </a>
                          )}
                          {plan.tos_link && (
                            <a 
                              href={plan.tos_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="doc-link"
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
            </article>
          );
        })}
      </div>

      {/* Load More Button (if needed for pagination) */}
      {plans.length >= 50 && (
        <div className="load-more-section">
          <button className="load-more-btn" disabled>
            Showing {plans.length} plans
          </button>
        </div>
      )}
    </div>
  );
};

export default PlanResultsGrid;

// Component-specific styles
const styles = `
.plan-results-grid {
  width: 100%;
}

.results-container.grid-view {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Responsive grid breakpoints */
@media (min-width: 640px) {
  .results-container.grid-view {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.25rem;
  }
}

@media (min-width: 768px) {
  .results-container.grid-view {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .results-container.grid-view {
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 2rem;
  }
}

.results-container.list-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.plan-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  position: relative;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@media (min-width: 640px) {
  .plan-card {
    border-radius: 0.75rem;
    padding: 1.25rem;
  }
}

@media (min-width: 768px) {
  .plan-card {
    padding: 1.5rem;
  }
}

.plan-card:hover {
  border-color: #002768;
  box-shadow: 0 4px 20px rgba(0, 39, 104, 0.1);
}

.plan-card.selected {
  border-color: #002768;
  background: #f0f7ff;
  box-shadow: 0 0 0 2px rgba(0, 39, 104, 0.1);
}

.plan-card.expanded {
  border-color: #002768;
}

.list-view .plan-card {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.plan-selection {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.list-view .plan-selection {
  position: static;
}

.plan-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #002768;
  cursor: pointer;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  padding-right: 1.5rem;
}

@media (min-width: 640px) {
  .plan-header {
    margin-bottom: 1rem;
    padding-right: 2rem;
  }
}

.list-view .plan-header {
  margin-bottom: 0;
  padding-right: 0;
}

.provider-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.provider-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}

.provider-logo-fallback {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: 1.125rem;
  color: #6b7280;
}

@media (min-width: 640px) {
  .provider-logo,
  .provider-logo-fallback {
    width: 48px;
    height: 48px;
  }
  
  .provider-logo-fallback {
    font-size: 1.25rem;
  }
}

.provider-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.plan-name {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
  margin-top: 0.25rem;
}

@media (min-width: 640px) {
  .provider-name {
    font-size: 1rem;
  }
  
  .plan-name {
    font-size: 0.875rem;
  }
}

.plan-badges {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-end;
}

.list-view .plan-badges {
  flex-direction: row;
  align-items: center;
}

.badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  white-space: nowrap;
}

.green-badge {
  background: #d1fae5;
  color: #065f46;
}

.partial-green-badge {
  background: #fef3c7;
  color: #92400e;
}

.prepaid-badge {
  background: #dbeafe;
  color: #1e40af;
}

.no-deposit-badge {
  background: #dcfce7;
  color: #166534;
}

.plan-pricing {
  text-align: center;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.375rem;
}

@media (min-width: 640px) {
  .plan-pricing {
    margin-bottom: 1rem;
    padding: 1rem;
    border-radius: 0.5rem;
  }
}

.list-view .plan-pricing {
  text-align: left;
  margin-bottom: 0;
  background: none;
  padding: 0;
}

.main-rate {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.list-view .main-rate {
  justify-content: flex-start;
}

.rate-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #002768;
}

@media (min-width: 640px) {
  .rate-value {
    font-size: 1.75rem;
  }
}

@media (min-width: 768px) {
  .rate-value {
    font-size: 2rem;
  }
}

.rate-unit {
  font-size: 1rem;
  color: #6b7280;
  font-weight: 500;
}

.rate-details {
  display: flex;
  justify-content: center;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.list-view .rate-details {
  justify-content: flex-start;
}

.monthly-estimates {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f0f9ff;
  border-radius: 0.5rem;
}

.list-view .monthly-estimates {
  background: none;
  padding: 0;
  margin-bottom: 0;
  flex-direction: column;
  gap: 0.25rem;
}

.estimate-item {
  text-align: center;
}

.list-view .estimate-item {
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.usage-amount {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.list-view .usage-amount {
  margin-bottom: 0;
}

.monthly-cost {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.savings-indicator {
  text-align: center;
  margin-bottom: 1rem;
}

.list-view .savings-indicator {
  text-align: left;
  margin-bottom: 0;
}

.savings-badge {
  display: inline-block;
  background: #fef3c7;
  color: #92400e;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid #fbbf24;
}

.plan-actions {
  display: flex;
  gap: 0.75rem;
}

.list-view .plan-actions {
  margin-left: auto;
}

.details-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.list-view .details-btn {
  flex: none;
  white-space: nowrap;
}

.details-btn:hover {
  background: #e5e7eb;
}

.enroll-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  background: #be0b31;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.list-view .enroll-btn {
  flex: none;
  white-space: nowrap;
}

.enroll-btn:hover:not(:disabled) {
  background: #a00922;
}

.enroll-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.plan-details {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.detail-group h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.75rem;
}

.feature-list,
.contract-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.feature-list li,
.contract-list li {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.document-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.doc-link {
  color: #002768;
  text-decoration: none;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.doc-link:hover {
  text-decoration: underline;
}

/* Loading state */
.plan-results-loading {
  width: 100%;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.5rem;
}

.plan-card-skeleton {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  animation: pulse 2s infinite;
}

.skeleton-header {
  height: 48px;
  background: #f3f4f6;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
}

.skeleton-line {
  height: 1rem;
  background: #f3f4f6;
  border-radius: 0.25rem;
  margin-bottom: 0.75rem;
}

.skeleton-line.short {
  width: 60%;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* No results state */
.no-results {
  text-align: center;
  padding: 3rem 1rem;
}

.no-results-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.no-results-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

.no-results-message {
  color: #6b7280;
  margin-bottom: 2rem;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.clear-filters-btn {
  background: #002768;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-filters-btn:hover {
  background: #1e40af;
}

/* Load more section */
.load-more-section {
  text-align: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.load-more-btn {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: default;
}

/* Mobile-First Responsive Design */
@media (max-width: 480px) {
  .plan-selection {
    top: 0.75rem;
    right: 0.75rem;
  }
  
  .plan-checkbox {
    width: 1rem;
    height: 1rem;
  }
  
  .badge {
    font-size: 0.6875rem;
    padding: 0.125rem 0.375rem;
  }
}

@media (max-width: 640px) {
  .plan-badges {
    flex-direction: row;
    align-items: flex-start;
    gap: 0.375rem;
    flex-wrap: wrap;
  }
  
  .monthly-estimates {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
  }
  
  .plan-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .details-btn,
  .enroll-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .list-view .plan-card {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }
  
  .plan-header {
    padding-right: 0;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .plan-details {
    margin-top: 1rem;
    padding-top: 1rem;
  }
}

/* Accessibility improvements */
.plan-checkbox:focus {
  outline: 2px solid #002768;
  outline-offset: 2px;
}

.details-btn:focus,
.enroll-btn:focus,
.clear-filters-btn:focus {
  outline: 2px solid #002768;
  outline-offset: 2px;
}

/* Print styles */
@media print {
  .plan-selection,
  .plan-actions,
  .savings-indicator {
    display: none;
  }
  
  .plan-card {
    border: 2px solid #000;
    break-inside: avoid;
    margin-bottom: 1rem;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('plan-results-grid-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'plan-results-grid-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}