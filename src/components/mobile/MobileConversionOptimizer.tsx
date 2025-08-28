/**
 * Mobile Conversion Optimization Component
 * Advanced trust signals, one-handed navigation, and conversion-focused UX
 * for maximum Texas electricity customer enrollment rates
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Plan } from '../../types/facets';

interface ConversionOptimizerProps {
  plans: Plan[];
  selectedPlan?: Plan | null;
  city: string;
  zipCode: string;
  onPlanSelect: (plan: Plan) => void;
  onEnrollmentStart: (plan: Plan) => void;
  showTrustSignals?: boolean;
  enableOneHanded?: boolean;
  enableUrgencyIndicators?: boolean;
  enableSocialProof?: boolean;
  theme?: 'light' | 'dark';
}

interface TrustSignal {
  id: string;
  type: 'rating' | 'certification' | 'guarantee' | 'review' | 'security' | 'savings';
  icon: string;
  title: string;
  description: string;
  value?: string | number;
  priority: number;
}

interface UrgencyIndicator {
  type: 'price_increase' | 'limited_availability' | 'seasonal_promotion' | 'new_customer_bonus';
  message: string;
  intensity: 'low' | 'medium' | 'high';
  expiresAt?: Date;
  backgroundColor: string;
  textColor: string;
}

interface SocialProof {
  type: 'customer_count' | 'recent_signups' | 'local_popularity' | 'expert_choice';
  message: string;
  count?: number;
  timeframe?: string;
  icon: string;
}

interface OneHandedLayoutConfig {
  enabled: boolean;
  thumbZone: 'left' | 'right';
  floatingActions: boolean;
  compactMode: boolean;
  quickActions: string[];
}

const defaultTrustSignals: TrustSignal[] = [
  {
    id: 'no-fees',
    type: 'guarantee',
    icon: '🚫',
    title: 'No Hidden Fees',
    description: '100% transparent pricing with no surprises',
    priority: 1
  },
  {
    id: 'free-switching',
    type: 'guarantee', 
    icon: '🔄',
    title: 'Free to Switch',
    description: 'No cancellation fees when you change providers',
    priority: 2
  },
  {
    id: 'texas-regulated',
    type: 'certification',
    icon: '🏛️',
    title: 'Texas PUC Regulated',
    description: 'All providers regulated by Public Utility Commission',
    priority: 3
  },
  {
    id: 'instant-comparison',
    type: 'guarantee',
    icon: '⚡',
    title: 'Instant Comparison',
    description: 'Real-time rates updated every hour',
    priority: 4
  },
  {
    id: 'customer-support',
    type: 'guarantee',
    icon: '📞',
    title: '24/7 Support',
    description: 'Free customer service for all customers',
    priority: 5
  }
];

export const MobileConversionOptimizer: React.FC<ConversionOptimizerProps> = ({
  plans,
  selectedPlan,
  city,
  zipCode,
  onPlanSelect,
  onEnrollmentStart,
  showTrustSignals = true,
  enableOneHanded = true,
  enableUrgencyIndicators = true,
  enableSocialProof = true,
  theme = 'light'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [oneHandedConfig, setOneHandedConfig] = useState<OneHandedLayoutConfig>({
    enabled: enableOneHanded,
    thumbZone: 'right',
    floatingActions: true,
    compactMode: false,
    quickActions: ['compare', 'enroll', 'save']
  });

  const [trustSignalsVisible, setTrustSignalsVisible] = useState(showTrustSignals);
  const [activeUrgencyIndicators, setActiveUrgencyIndicators] = useState<UrgencyIndicator[]>([]);
  const [socialProofData, setSocialProofData] = useState<SocialProof[]>([]);
  const [conversionTracking, setConversionTracking] = useState({
    viewTime: Date.now(),
    interactions: 0,
    scrollDepth: 0,
    planViews: new Set<string>()
  });

  /**
   * Initialize conversion optimization features
   */
  useEffect(() => {
    detectHandedness();
    generateUrgencyIndicators();
    loadSocialProofData();
    setupConversionTracking();
  }, []);

  /**
   * Detect user handedness and optimize layout
   */
  const detectHandedness = (): void => {
    // Simple heuristic based on screen size and touch patterns
    const screenWidth = window.innerWidth;
    const isLargeScreen = screenWidth > 414;
    
    // Default to right-handed for smaller screens, adaptive for larger
    const thumbZone = isLargeScreen ? 'right' : 'right';
    
    setOneHandedConfig(prev => ({
      ...prev,
      thumbZone,
      compactMode: screenWidth < 375,
      floatingActions: screenWidth < 768
    }));
  };

  /**
   * Generate contextual urgency indicators
   */
  const generateUrgencyIndicators = (): void => {
    const indicators: UrgencyIndicator[] = [];
    
    // Rate increase urgency (simulated)
    if (Math.random() > 0.7) {
      indicators.push({
        type: 'price_increase',
        message: 'Rates may increase next month - Lock in current prices today',
        intensity: 'medium',
        backgroundColor: '#fef3c7',
        textColor: '#d97706'
      });
    }
    
    // Limited availability (for popular plans)
    const popularPlan = plans.find(p => p.provider.rating > 4.5);
    if (popularPlan) {
      indicators.push({
        type: 'limited_availability',
        message: `${popularPlan.provider.name} plans are in high demand in ${city}`,
        intensity: 'low',
        backgroundColor: '#e0f2fe',
        textColor: '#0369a1'
      });
    }
    
    // Seasonal promotion
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 5 && currentMonth <= 8) { // Summer months
      indicators.push({
        type: 'seasonal_promotion',
        message: 'Summer rate protection - Avoid peak season price spikes',
        intensity: 'high',
        backgroundColor: '#fef2f2',
        textColor: '#dc2626'
      });
    }
    
    setActiveUrgencyIndicators(indicators);
  };

  /**
   * Load social proof data
   */
  const loadSocialProofData = (): void => {
    const proofData: SocialProof[] = [
      {
        type: 'customer_count',
        message: `Join ${(Math.random() * 50000 + 25000).toFixed(0)} Texans who switched this month`,
        count: Math.floor(Math.random() * 50000 + 25000),
        timeframe: 'this month',
        icon: '👥'
      },
      {
        type: 'recent_signups',
        message: `${Math.floor(Math.random() * 12 + 3)} people from ${city} signed up today`,
        count: Math.floor(Math.random() * 12 + 3),
        timeframe: 'today',
        icon: '🔥'
      },
      {
        type: 'local_popularity',
        message: `Most popular choice in ${city}`,
        icon: '⭐'
      }
    ];
    
    setSocialProofData(proofData);
  };

  /**
   * Setup conversion tracking
   */
  const setupConversionTracking = (): void => {
    // Track scroll depth
    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      setConversionTracking(prev => ({
        ...prev,
        scrollDepth: Math.max(prev.scrollDepth, scrollPercent)
      }));
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Track time on page
    const startTime = Date.now();
    const trackTimeSpent = () => {
      const timeSpent = Date.now() - startTime;
      
      // Send analytics event for engaged users (>30 seconds)
      if (timeSpent > 30000) {
        trackConversionEvent('engaged_user', { timeSpent });
      }
    };
    
    setTimeout(trackTimeSpent, 30000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  };

  /**
   * Track conversion events
   */
  const trackConversionEvent = (event: string, data: any = {}) => {
    // Integration with analytics service
    if (typeof gtag !== 'undefined') {
      gtag('event', event, {
        event_category: 'Mobile Conversion',
        event_label: `${city}_${zipCode}`,
        value: data.value || 1,
        custom_map: data
      });
    }
    
    console.log('Conversion Event:', event, data);
  };

  /**
   * Handle plan selection with optimization tracking
   */
  const handlePlanSelect = (plan: Plan): void => {
    // Track plan interaction
    setConversionTracking(prev => ({
      ...prev,
      interactions: prev.interactions + 1,
      planViews: new Set([...prev.planViews, plan.id])
    }));
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    
    trackConversionEvent('plan_selected', {
      planId: plan.id,
      provider: plan.provider.name,
      rate: plan.pricing.rate1000kWh,
      contractLength: plan.contract.length
    });
    
    onPlanSelect(plan);
  };

  /**
   * Handle enrollment start with conversion optimization
   */
  const handleEnrollmentStart = (plan: Plan): void => {
    trackConversionEvent('enrollment_started', {
      planId: plan.id,
      provider: plan.provider.name,
      conversionPath: 'mobile_optimized',
      timeToConversion: Date.now() - conversionTracking.viewTime,
      interactionCount: conversionTracking.interactions
    });
    
    // Strong haptic feedback for conversion action
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
    
    onEnrollmentStart(plan);
  };

  /**
   * Calculate savings messaging
   */
  const getSavingsMessage = (plan: Plan): string | null => {
    const avgRate = plans.reduce((sum, p) => sum + p.pricing.rate1000kWh, 0) / plans.length;
    const savings = (avgRate - plan.pricing.rate1000kWh) * 1000; // Monthly savings on 1000 kWh
    
    if (savings > 10) {
      return `Save $${Math.round(savings)}/month vs average`;
    } else if (savings > 5) {
      return `Save $${Math.round(savings)}/month`;
    }
    
    return null;
  };

  /**
   * Get plan ranking message
   */
  const getPlanRanking = (plan: Plan, index: number): string | null => {
    if (index < 3) {
      const rankings = ['Best Value', 'Great Deal', 'Popular Choice'];
      return rankings[index];
    }
    return null;
  };

  /**
   * Render trust signals
   */
  const renderTrustSignals = (): React.ReactNode => {
    if (!trustSignalsVisible) return null;
    
    return (
      <div className="trust-signals-container">
        <div className="trust-signals-header">
          <h3>Why Choose ChooseMyPower?</h3>
        </div>
        <div className="trust-signals-grid">
          {defaultTrustSignals
            .sort((a, b) => a.priority - b.priority)
            .slice(0, oneHandedConfig.compactMode ? 3 : 5)
            .map((signal) => (
              <div key={signal.id} className="trust-signal-item">
                <div className="signal-icon">{signal.icon}</div>
                <div className="signal-content">
                  <div className="signal-title">{signal.title}</div>
                  <div className="signal-description">{signal.description}</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  /**
   * Render urgency indicators
   */
  const renderUrgencyIndicators = (): React.ReactNode => {
    if (!enableUrgencyIndicators || activeUrgencyIndicators.length === 0) return null;
    
    return (
      <div className="urgency-indicators">
        {activeUrgencyIndicators.map((indicator, index) => (
          <div
            key={index}
            className={`urgency-indicator ${indicator.intensity}`}
            style={{
              backgroundColor: indicator.backgroundColor,
              color: indicator.textColor
            }}
          >
            <div className="urgency-content">
              <span className="urgency-icon">⏰</span>
              <span className="urgency-message">{indicator.message}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Render social proof
   */
  const renderSocialProof = (): React.ReactNode => {
    if (!enableSocialProof || socialProofData.length === 0) return null;
    
    return (
      <div className="social-proof-container">
        {socialProofData.slice(0, 2).map((proof, index) => (
          <div key={index} className="social-proof-item">
            <span className="proof-icon">{proof.icon}</span>
            <span className="proof-message">{proof.message}</span>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Render optimized plan card
   */
  const renderOptimizedPlanCard = (plan: Plan, index: number): React.ReactNode => {
    const savingsMessage = getSavingsMessage(plan);
    const rankingMessage = getPlanRanking(plan, index);
    const isSelected = selectedPlan?.id === plan.id;
    
    return (
      <div
        key={plan.id}
        className={`optimized-plan-card ${isSelected ? 'selected' : ''} ${
          index < 3 ? 'top-plan' : ''
        }`}
        onClick={() => handlePlanSelect(plan)}
      >
        {/* Plan Badge */}
        {rankingMessage && (
          <div className="plan-badge">{rankingMessage}</div>
        )}
        
        {/* Savings Badge */}
        {savingsMessage && (
          <div className="savings-badge">{savingsMessage}</div>
        )}
        
        {/* Plan Header */}
        <div className="plan-header-optimized">
          <div className="provider-info-optimized">
            {plan.provider.logo && (
              <img
                src={plan.provider.logo}
                alt={`${plan.provider.name} logo`}
                className="provider-logo-opt"
                loading="lazy"
              />
            )}
            <div className="provider-details-opt">
              <h3 className="plan-name-opt">{plan.name}</h3>
              <p className="provider-name-opt">{plan.provider.name}</p>
              {plan.provider.rating > 0 && (
                <div className="rating-opt">
                  <div className="stars-opt">
                    {'★'.repeat(Math.floor(plan.provider.rating))}
                    {'☆'.repeat(5 - Math.floor(plan.provider.rating))}
                  </div>
                  <span className="rating-value-opt">{plan.provider.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="rate-display-opt">
            <div className="main-rate-opt">
              <span className="rate-value-opt">
                {(plan.pricing.rate1000kWh * 100).toFixed(1)}¢
              </span>
              <span className="rate-unit-opt">per kWh</span>
            </div>
            <div className="monthly-estimate-opt">
              ${(plan.pricing.rate1000kWh * 1000).toFixed(0)}/mo
            </div>
          </div>
        </div>
        
        {/* Quick Features */}
        <div className="quick-features">
          <div className="feature-item">
            <span className="feature-icon">📅</span>
            <span className="feature-text">{plan.contract.length}mo</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📈</span>
            <span className="feature-text">{plan.contract.type}</span>
          </div>
          {plan.features.greenEnergy > 0 && (
            <div className="feature-item green">
              <span className="feature-icon">🌱</span>
              <span className="feature-text">{plan.features.greenEnergy}%</span>
            </div>
          )}
        </div>
        
        {/* Mobile-Optimized Actions */}
        <div className="mobile-actions-opt">
          <button
            className="compare-btn-opt"
            onClick={(e) => {
              e.stopPropagation();
              trackConversionEvent('compare_clicked', { planId: plan.id });
            }}
          >
            <span className="btn-icon">📊</span>
            <span>Compare</span>
          </button>
          
          <button
            className="enroll-btn-opt"
            onClick={(e) => {
              e.stopPropagation();
              handleEnrollmentStart(plan);
            }}
          >
            <span className="btn-icon">⚡</span>
            <span>Enroll Now</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`mobile-conversion-optimizer ${theme} ${
        oneHandedConfig.enabled ? `one-handed-${oneHandedConfig.thumbZone}` : ''
      } ${oneHandedConfig.compactMode ? 'compact' : ''}`}
    >
      {/* Urgency Indicators */}
      {renderUrgencyIndicators()}
      
      {/* Social Proof */}
      {renderSocialProof()}
      
      {/* Trust Signals */}
      {renderTrustSignals()}
      
      {/* Optimized Plan List */}
      <div className="optimized-plans-container">
        <div className="plans-header-opt">
          <h2>Best Electricity Plans for {city}</h2>
          <p className="plans-subtitle">
            Showing {plans.length} plans • Updated hourly
          </p>
        </div>
        
        <div className="plans-list-opt">
          {plans.slice(0, oneHandedConfig.compactMode ? 6 : 10).map((plan, index) =>
            renderOptimizedPlanCard(plan, index)
          )}
        </div>
      </div>
      
      {/* Floating Actions (One-Handed Mode) */}
      {oneHandedConfig.floatingActions && selectedPlan && (
        <div className={`floating-actions-opt ${oneHandedConfig.thumbZone}`}>
          <button
            className="floating-enroll-btn"
            onClick={() => handleEnrollmentStart(selectedPlan)}
          >
            <span className="floating-btn-icon">⚡</span>
            <span className="floating-btn-text">Enroll in {selectedPlan.provider.name}</span>
          </button>
        </div>
      )}
      
      {/* Conversion Analytics Overlay (Development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="conversion-debug">
          <div>Interactions: {conversionTracking.interactions}</div>
          <div>Scroll Depth: {conversionTracking.scrollDepth}%</div>
          <div>Plans Viewed: {conversionTracking.planViews.size}</div>
          <div>Time: {Math.round((Date.now() - conversionTracking.viewTime) / 1000)}s</div>
        </div>
      )}
    </div>
  );
};

export default MobileConversionOptimizer;