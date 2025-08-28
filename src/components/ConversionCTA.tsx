/**
 * ConversionCTA React Component
 * Advanced call-to-action component with A/B testing,
 * urgency indicators, social proof, and conversion optimization
 */

import { useState, useEffect, useRef } from 'react';
import type { Plan } from '../types/facets';

interface ConversionCTAProps {
  plan: Plan;
  city: string;
  position: number;
  variant?: 'default' | 'urgent' | 'social' | 'guarantee' | 'savings';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showUrgency?: boolean;
  showSavings?: boolean;
  showSocialProof?: boolean;
  showGuarantee?: boolean;
  customText?: string;
  onCTAClick?: (plan: Plan, variant: string) => void;
  enableABTesting?: boolean;
  testVariants?: string[];
  className?: string;
}

interface UrgencyMessage {
  type: 'time' | 'scarcity' | 'popularity' | 'seasonal';
  message: string;
  icon: string;
  priority: number;
}

interface SavingsCalculation {
  monthlyAmount: number;
  yearlyAmount: number;
  comparedToAverage: number;
  percentage: number;
}

const ConversionCTA: React.FC<ConversionCTAProps> = ({
  plan,
  city,
  position,
  variant = 'default',
  size = 'lg',
  showUrgency = true,
  showSavings = true,
  showSocialProof = true,
  showGuarantee = true,
  customText,
  onCTAClick,
  enableABTesting = true,
  testVariants = ['default', 'urgent', 'social'],
  className = ''
}) => {
  const ctaRef = useRef<HTMLButtonElement>(null);
  const [currentVariant, setCurrentVariant] = useState(variant);
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [urgencyMessage, setUrgencyMessage] = useState<UrgencyMessage | null>(null);
  const [savingsData, setSavingsData] = useState<SavingsCalculation | null>(null);
  const [socialProofCount, setSocialProofCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  // A/B Testing setup
  useEffect(() => {
    if (enableABTesting && testVariants.length > 0) {
      // Use plan ID and position for consistent variant assignment
      const hash = `${plan.id}_${position}`.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const variantIndex = Math.abs(hash) % testVariants.length;
      setCurrentVariant(testVariants[variantIndex]);
    }
  }, [enableABTesting, testVariants, plan.id, position]);

  // Calculate savings
  useEffect(() => {
    const texasAverageRate = 0.1299; // Texas average rate per kWh
    const planRate = plan.pricing.rate1000kWh;
    const monthlyUsage = 1000; // Average monthly usage
    
    const monthlyBill = planRate * monthlyUsage;
    const averageMonthlyBill = texasAverageRate * monthlyUsage;
    const monthlyDifference = averageMonthlyBill - monthlyBill;
    const yearlyDifference = monthlyDifference * 12;
    const savingsPercentage = (monthlyDifference / averageMonthlyBill) * 100;
    
    setSavingsData({
      monthlyAmount: monthlyDifference,
      yearlyAmount: yearlyDifference,
      comparedToAverage: averageMonthlyBill,
      percentage: savingsPercentage
    });
  }, [plan.pricing.rate1000kWh]);

  // Set urgency message
  useEffect(() => {
    const urgencyMessages: UrgencyMessage[] = [
      {
        type: 'time',
        message: 'Limited time offer - rates may increase tomorrow!',
        icon: '⏰',
        priority: 3
      },
      {
        type: 'scarcity',
        message: 'Only 3 spots left at this rate in your area',
        icon: '🔥',
        priority: 4
      },
      {
        type: 'popularity',
        message: 'Most popular plan in ' + city + ' this month',
        icon: '🌟',
        priority: 2
      },
      {
        type: 'seasonal',
        message: 'Lock in winter rates before they increase',
        icon: '❄️',
        priority: 1
      }
    ];

    // Choose message based on plan position and features
    let selectedMessage = urgencyMessages[0]; // Default

    if (position <= 3) {
      selectedMessage = urgencyMessages.find(m => m.type === 'popularity') || urgencyMessages[0];
    } else if (plan.pricing.rate1000kWh < 0.10) {
      selectedMessage = urgencyMessages.find(m => m.type === 'scarcity') || urgencyMessages[0];
    } else if (plan.contract.length <= 12) {
      selectedMessage = urgencyMessages.find(m => m.type === 'time') || urgencyMessages[0];
    }

    setUrgencyMessage(selectedMessage);
  }, [city, position, plan.pricing.rate1000kWh, plan.contract.length]);

  // Generate social proof count
  useEffect(() => {
    const baseCount = 127 + (position * 15);
    const randomVariation = Math.floor(Math.random() * 20) - 10;
    setSocialProofCount(baseCount + randomVariation);
  }, [position]);

  // Animate entrance on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Staggered animation phases
          setTimeout(() => setAnimationPhase(1), 200);
          setTimeout(() => setAnimationPhase(2), 400);
          setTimeout(() => setAnimationPhase(3), 600);
        }
      },
      { threshold: 0.3 }
    );

    const currentRef = ctaRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // Handle CTA click
  const handleCTAClick = () => {
    setClickCount(prev => prev + 1);

    // Track conversion event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'cta_click', {
        plan_id: plan.id,
        plan_name: plan.name,
        provider: plan.provider.name,
        variant: currentVariant,
        position: position,
        click_count: clickCount + 1,
        city: city,
        rate: plan.pricing.rate1000kWh,
        savings_yearly: savingsData?.yearlyAmount || 0
      });
    }

    // Call custom handler
    if (onCTAClick) {
      onCTAClick(plan, currentVariant);
    }

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }

    // Navigate to enrollment
    const enrollUrl = `/enroll/${plan.id}?city=${city}&position=${position}&variant=${currentVariant}&source=cta`;
    window.location.href = enrollUrl;
  };

  // Get variant-specific content
  const getVariantContent = () => {
    const baseContent = {
      buttonText: customText || 'Enroll Now',
      subtitle: 'Start saving on your electricity bill',
      icon: '⚡'
    };

    switch (currentVariant) {
      case 'urgent':
        return {
          buttonText: 'Secure This Rate Now',
          subtitle: 'Before it\'s gone forever',
          icon: '🔥'
        };
      case 'social':
        return {
          buttonText: 'Join ' + socialProofCount + ' Happy Customers',
          subtitle: 'Switch with confidence',
          icon: '👥'
        };
      case 'guarantee':
        return {
          buttonText: 'Try Risk-Free for 30 Days',
          subtitle: '100% satisfaction guaranteed',
          icon: '🛡️'
        };
      case 'savings':
        return {
          buttonText: savingsData && savingsData.yearlyAmount > 0 
            ? `Save $${Math.round(savingsData.yearlyAmount)}/Year`
            : 'Start Saving Today',
          subtitle: 'Lock in these low rates',
          icon: '💰'
        };
      default:
        return baseContent;
    }
  };

  const content = getVariantContent();
  const containerClasses = [
    'conversion-cta',
    `cta-variant-${currentVariant}`,
    `cta-size-${size}`,
    isVisible ? 'cta-visible' : '',
    isHovered ? 'cta-hovered' : '',
    `animation-phase-${animationPhase}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      
      {/* Urgency Banner */}
      {showUrgency && urgencyMessage && (
        <div className="urgency-banner">
          <span className="urgency-icon">{urgencyMessage.icon}</span>
          <span className="urgency-text">{urgencyMessage.message}</span>
          <div className="urgency-pulse"></div>
        </div>
      )}

      {/* Main CTA Section */}
      <div className="cta-main">
        
        {/* Savings Highlight */}
        {showSavings && savingsData && savingsData.yearlyAmount > 0 && (
          <div className="savings-highlight">
            <div className="savings-amount">
              Save ${Math.round(savingsData.yearlyAmount)}<span className="savings-period">/year</span>
            </div>
            <div className="savings-comparison">
              vs. average Texas rate ({(savingsData.percentage).toFixed(0)}% less)
            </div>
          </div>
        )}

        {/* Primary CTA Button */}
        <button
          ref={ctaRef}
          className="cta-button primary-cta"
          onClick={handleCTAClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label={`Enroll in ${plan.name} by ${plan.provider.name}`}
        >
          <div className="cta-button-content">
            <span className="cta-icon">{content.icon}</span>
            <div className="cta-text-content">
              <span className="cta-button-text">{content.buttonText}</span>
              <span className="cta-subtitle">{content.subtitle}</span>
            </div>
          </div>
          
          {/* Button Effects */}
          <div className="cta-ripple"></div>
          <div className="cta-glow"></div>
        </button>

        {/* Supporting Elements */}
        <div className="cta-support">
          
          {/* Social Proof */}
          {showSocialProof && (
            <div className="social-proof">
              <div className="social-avatars">
                <div className="avatar"></div>
                <div className="avatar"></div>
                <div className="avatar"></div>
                <span className="avatar-count">+{socialProofCount}</span>
              </div>
              <div className="social-text">
                {socialProofCount} customers chose this plan in {city}
              </div>
            </div>
          )}

          {/* Guarantee Badge */}
          {showGuarantee && (
            <div className="guarantee-badge">
              <span className="guarantee-icon">✅</span>
              <span className="guarantee-text">30-day satisfaction guarantee</span>
            </div>
          )}

          {/* Trust Indicators */}
          <div className="trust-indicators">
            <div className="trust-item">
              <span className="trust-icon">🔒</span>
              <span className="trust-text">Secure enrollment</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">⚡</span>
              <span className="trust-text">No service interruption</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">📞</span>
              <span className="trust-text">24/7 support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="enrollment-progress">
        <div className="progress-step active">
          <span className="step-number">1</span>
          <span className="step-label">Choose Plan</span>
        </div>
        <div className="progress-arrow">→</div>
        <div className="progress-step">
          <span className="step-number">2</span>
          <span className="step-label">Enroll</span>
        </div>
        <div className="progress-arrow">→</div>
        <div className="progress-step">
          <span className="step-number">3</span>
          <span className="step-label">Start Saving</span>
        </div>
      </div>

      {/* Fine Print */}
      <div className="cta-fine-print">
        <p>Enrollment takes 2 minutes. No cancellation fees. Switch anytime.</p>
      </div>
    </div>
  );
};

export default ConversionCTA;

// Conversion CTA styles
const styles = `
/* Conversion CTA Base */
.conversion-cta {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  border-radius: 20px;
  padding: 2rem;
  margin: 1.5rem 0;
  text-align: center;
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: translateY(30px) scale(0.95);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.conversion-cta.cta-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.conversion-cta::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transition: left 0.5s;
}

.conversion-cta:hover::before {
  left: 100%;
}

/* Size Variants */
.cta-size-sm { padding: 1rem; }
.cta-size-md { padding: 1.5rem; }
.cta-size-lg { padding: 2rem; }
.cta-size-xl { padding: 2.5rem; }

/* Variant Styles */
.cta-variant-urgent {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-color: #fca5a5;
}

.cta-variant-social {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #93c5fd;
}

.cta-variant-guarantee {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-color: #86efac;
}

.cta-variant-savings {
  background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
  border-color: #fcd34d;
}

/* Urgency Banner */
.urgency-banner {
  position: relative;
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
  padding: 0.75rem 1rem;
  margin: -2rem -2rem 1.5rem -2rem;
  border-radius: 18px 18px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  overflow: hidden;
  animation: urgencyPulse 2s infinite;
}

@keyframes urgencyPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.urgency-icon {
  font-size: 1.125rem;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.urgency-pulse {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: urgencySlide 3s infinite;
}

@keyframes urgencySlide {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* Main CTA */
.cta-main {
  position: relative;
  z-index: 2;
}

/* Savings Highlight */
.savings-highlight {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  transform: translateY(20px);
  opacity: 0;
  transition: all 0.5s ease 0.2s;
}

.animation-phase-1 .savings-highlight {
  transform: translateY(0);
  opacity: 1;
}

.savings-amount {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.savings-period {
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.9;
}

.savings-comparison {
  font-size: 0.875rem;
  opacity: 0.9;
  font-weight: 500;
}

/* Primary CTA Button */
.cta-button {
  position: relative;
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
  border: none;
  border-radius: 16px;
  padding: 1.25rem 2rem;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  max-width: 400px;
  margin: 0 auto 1.5rem;
  display: block;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(220, 38, 38, 0.3);
  transform: translateY(20px) scale(0.95);
  opacity: 0;
}

.animation-phase-2 .cta-button {
  transform: translateY(0) scale(1);
  opacity: 1;
}

.cta-button:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 40px rgba(220, 38, 38, 0.4);
}

.cta-button:active {
  transform: translateY(-1px) scale(0.98);
}

/* Size variants for button */
.cta-size-sm .cta-button { padding: 1rem 1.5rem; font-size: 1rem; }
.cta-size-md .cta-button { padding: 1.125rem 1.75rem; font-size: 1.0625rem; }
.cta-size-lg .cta-button { padding: 1.25rem 2rem; font-size: 1.125rem; }
.cta-size-xl .cta-button { padding: 1.5rem 2.5rem; font-size: 1.25rem; }

.cta-button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  position: relative;
  z-index: 2;
}

.cta-icon {
  font-size: 1.5rem;
  animation: iconPulse 2s infinite;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.cta-text-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.cta-button-text {
  font-size: inherit;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 0.25rem;
}

.cta-subtitle {
  font-size: 0.875rem;
  opacity: 0.9;
  font-weight: 500;
}

/* Button Effects */
.cta-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
}

.cta-button:active .cta-ripple {
  width: 300px;
  height: 300px;
}

.cta-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}

.cta-button:hover .cta-glow {
  opacity: 1;
}

/* Support Elements */
.cta-support {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease 0.4s;
}

.animation-phase-3 .cta-support {
  opacity: 1;
  transform: translateY(0);
}

/* Social Proof */
.social-proof {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.social-avatars {
  display: flex;
  align-items: center;
  gap: -0.5rem;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border: 2px solid white;
  margin-left: -8px;
  position: relative;
}

.avatar:first-child {
  margin-left: 0;
}

.avatar:nth-child(1) { background: linear-gradient(135deg, #ef4444, #dc2626); }
.avatar:nth-child(2) { background: linear-gradient(135deg, #10b981, #059669); }
.avatar:nth-child(3) { background: linear-gradient(135deg, #f59e0b, #d97706); }

.avatar-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  margin-left: 0.5rem;
}

.social-text {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

/* Guarantee Badge */
.guarantee-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.guarantee-icon {
  font-size: 1rem;
}

/* Trust Indicators */
.trust-indicators {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.trust-icon {
  font-size: 0.875rem;
}

/* Progress Indicator */
.enrollment-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 1.5rem 0 1rem;
  padding: 1rem;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.1);
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  opacity: 0.5;
  transition: opacity 0.3s;
}

.progress-step.active {
  opacity: 1;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.progress-step.active .step-number {
  background: #3b82f6;
  color: white;
}

.step-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
}

.progress-arrow {
  color: #cbd5e1;
  font-weight: bold;
  margin: 0 0.25rem;
}

/* Fine Print */
.cta-fine-print {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.cta-fine-print p {
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .conversion-cta {
    padding: 1.5rem 1rem;
    margin: 1rem 0;
    border-radius: 16px;
  }
  
  .urgency-banner {
    margin: -1.5rem -1rem 1rem -1rem;
    padding: 0.5rem 1rem;
    font-size: 0.8125rem;
  }
  
  .savings-amount {
    font-size: 1.75rem;
  }
  
  .cta-button {
    padding: 1rem 1.5rem;
    font-size: 1rem;
    max-width: none;
  }
  
  .cta-button-content {
    gap: 0.5rem;
  }
  
  .cta-text-content {
    align-items: center;
    text-align: center;
  }
  
  .social-proof {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .trust-indicators {
    gap: 1rem;
  }
  
  .enrollment-progress {
    gap: 0.25rem;
  }
  
  .progress-arrow {
    display: none;
  }
  
  .enrollment-progress {
    flex-direction: column;
    gap: 0.75rem;
  }
}

/* Tablet Responsive */
@media (min-width: 769px) and (max-width: 1023px) {
  .cta-button {
    max-width: 350px;
  }
  
  .trust-indicators {
    gap: 1.25rem;
  }
}

/* Animation Performance */
@media (prefers-reduced-motion: reduce) {
  .conversion-cta,
  .cta-button,
  .savings-highlight,
  .cta-support,
  .urgency-banner {
    transition: none;
    animation: none;
  }
  
  .cta-icon {
    animation: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .conversion-cta {
    border-width: 3px;
  }
  
  .cta-button {
    border: 2px solid #000;
    font-weight: 800;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .conversion-cta {
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    border-color: #374151;
    color: #f9fafb;
  }
  
  .social-text,
  .trust-item,
  .step-label {
    color: #9ca3af;
  }
  
  .cta-fine-print p {
    color: #9ca3af;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('conversion-cta-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'conversion-cta-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}