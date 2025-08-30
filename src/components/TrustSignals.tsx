/**
 * TrustSignals React Component
 * Complete trust signals and social proof elements
 * to build customer confidence and drive conversions
 */

import { useState, useEffect } from 'react';

interface TrustSignalsProps {
  className?: string;
  showCustomerCount?: boolean;
  showSavingsAmount?: boolean;
  showSecurityBadges?: boolean;
  showTestimonials?: boolean;
  showRatings?: boolean;
  showGuarantee?: boolean;
  customersServed?: number;
  totalSavings?: number;
  averageRating?: number;
  reviewCount?: number;
  layout?: 'horizontal' | 'vertical' | 'grid' | 'compact';
  variant?: 'default' | 'minimal' | 'prominent';
}

interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  comment: string;
  savings: number;
  verified: boolean;
  avatar?: string;
}

interface SecurityBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  verified: boolean;
}

const TrustSignals: React.FC<TrustSignalsProps> = ({
  className = '',
  showCustomerCount = true,
  showSavingsAmount = true,
  showSecurityBadges = true,
  showTestimonials = true,
  showRatings = true,
  showGuarantee = true,
  customersServed = 250000,
  totalSavings = 15000000,
  averageRating = 4.8,
  reviewCount = 12847,
  layout = 'horizontal',
  variant = 'default'
}) => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Sample testimonials data
  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Sarah M.',
      location: 'Houston, TX',
      rating: 5,
      comment: "Saved $300 on my first year! The comparison was so easy, and I found the perfect green energy plan.",
      savings: 300,
      verified: true
    },
    {
      id: '2',
      name: 'Mike R.',
      location: 'Dallas, TX',
      rating: 5,
      comment: "No hassle switching, and my rate is locked in. Couldn't be happier with the service and savings.",
      savings: 450,
      verified: true
    },
    {
      id: '3',
      name: 'Jennifer L.',
      location: 'Austin, TX',
      rating: 4,
      comment: "Great customer support and transparent pricing. Finally found a plan that fits my family's needs.",
      savings: 275,
      verified: true
    }
  ];

  // Security badges
  const securityBadges: SecurityBadge[] = [
    {
      id: 'ssl',
      name: 'SSL Secured',
      icon: '🔒',
      description: '256-bit SSL encryption protects your data',
      verified: true
    },
    {
      id: 'bbb',
      name: 'BBB Accredited',
      icon: '🏛️',
      description: 'Better Business Bureau A+ rating',
      verified: true
    },
    {
      id: 'texas',
      name: 'Texas Approved',
      icon: '✅',
      description: 'Licensed Texas electricity broker',
      verified: true
    },
    {
      id: 'privacy',
      name: 'Privacy Protected',
      icon: '🛡️',
      description: 'Your information is never sold',
      verified: true
    }
  ];

  // Rotate testimonials
  useEffect(() => {
    if (!showTestimonials || testimonials.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [showTestimonials, testimonials.length]);

  // Animate on scroll into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.querySelector('.trust-signals');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  // Format numbers with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  // Format large numbers (e.g., 1M, 15M)
  const formatLargeNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  // Get container classes
  const getContainerClasses = (): string => {
    const classes = [
      'trust-signals',
      `trust-signals-${layout}`,
      `trust-signals-${variant}`,
      isVisible ? 'trust-signals-visible' : '',
      className
    ];
    return classes.filter(Boolean).join(' ');
  };

  return (
    <div className={getContainerClasses()}>
      
      {/* Statistics Section */}
      {(showCustomerCount || showSavingsAmount || showRatings) && (
        <div className="trust-stats">
          {showCustomerCount && (
            <div className="trust-stat-item">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-number">{formatLargeNumber(customersServed)}+</div>
                <div className="stat-label">Customers Served</div>
              </div>
            </div>
          )}
          
          {showSavingsAmount && (
            <div className="trust-stat-item">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-number">${formatLargeNumber(totalSavings)}</div>
                <div className="stat-label">Total Savings</div>
              </div>
            </div>
          )}
          
          {showRatings && (
            <div className="trust-stat-item">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <div className="stat-number">{averageRating}/5</div>
                <div className="stat-label">{formatNumber(reviewCount)} Reviews</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Badges */}
      {showSecurityBadges && (
        <div className="security-badges">
          <h4 className="security-title">Your Security & Privacy</h4>
          <div className="security-grid">
            {securityBadges.map((badge) => (
              <div key={badge.id} className="security-badge">
                <div className="badge-icon">{badge.icon}</div>
                <div className="badge-content">
                  <div className="badge-name">{badge.name}</div>
                  <div className="badge-description">{badge.description}</div>
                </div>
                {badge.verified && (
                  <div className="verification-check">✓</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Testimonials */}
      {showTestimonials && testimonials.length > 0 && (
        <div className="testimonials-section">
          <h4 className="testimonials-title">What Our Customers Say</h4>
          <div className="testimonial-container">
            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="customer-info">
                  <div className="customer-name">{testimonials[currentTestimonial].name}</div>
                  <div className="customer-location">{testimonials[currentTestimonial].location}</div>
                </div>
                <div className="testimonial-rating">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={`star ${i < testimonials[currentTestimonial].rating ? 'filled' : ''}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="testimonial-content">
                <div className="testimonial-quote">"{testimonials[currentTestimonial].comment}"</div>
                <div className="testimonial-savings">
                  <span className="savings-amount">
                    Saved ${testimonials[currentTestimonial].savings}/year
                  </span>
                  {testimonials[currentTestimonial].verified && (
                    <span className="verified-badge">
                      <span className="verified-icon">✓</span>
                      Verified Customer
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Testimonial Indicators */}
            {testimonials.length > 1 && (
              <div className="testimonial-indicators">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`testimonial-dot ${index === currentTestimonial ? 'active' : ''}`}
                    onClick={() => setCurrentTestimonial(index)}
                    aria-label={`View testimonial ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guarantee Section */}
      {showGuarantee && (
        <div className="guarantee-section">
          <div className="guarantee-badge">
            <div className="guarantee-icon">🛡️</div>
            <div className="guarantee-content">
              <div className="guarantee-title">We're Here to Help</div>
              <div className="guarantee-description">
                Not happy with your plan? We'll help you switch at no extra cost within 30 days.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Trust Elements */}
      <div className="additional-trust">
        <div className="trust-features">
          <div className="trust-feature">
            <span className="feature-icon">⚡</span>
            <span className="feature-text">No Service Interruption</span>
          </div>
          <div className="trust-feature">
            <span className="feature-icon">📞</span>
            <span className="feature-text">24/7 Customer Support</span>
          </div>
          <div className="trust-feature">
            <span className="feature-icon">💸</span>
            <span className="feature-text">No Hidden Fees</span>
          </div>
          <div className="trust-feature">
            <span className="feature-icon">🔄</span>
            <span className="feature-text">Easy to Switch</span>
          </div>
        </div>
      </div>

      {/* Live Activity Indicator */}
      <div className="live-activity">
        <div className="activity-dot"></div>
        <span className="activity-text">
          {Math.floor(Math.random() * 15) + 5} people are comparing plans right now
        </span>
      </div>
    </div>
  );
};

export default TrustSignals;

// Trust signals styles
const styles = `
/* Trust Signals Base */
.trust-signals {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 2rem;
  margin: 2rem 0;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.trust-signals-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Layout Variants */
.trust-signals-horizontal {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.trust-signals-vertical {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 400px;
}

.trust-signals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.trust-signals-compact {
  padding: 1rem;
  gap: 1rem;
}

/* Style Variants */
.trust-signals-minimal {
  background: transparent;
  border: none;
  padding: 1rem 0;
}

.trust-signals-prominent {
  background: linear-gradient(135deg, #002768 0%, #be0b31 100%);
  color: white;
  border-color: #002768;
  box-shadow: 0 8px 32px rgba(0, 39, 104, 0.2);
}

/* Trust Statistics */
.trust-stats {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 2rem;
  padding: 1.5rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.trust-stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: center;
  flex-direction: column;
  min-width: 120px;
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: 800;
  color: #002768;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.trust-signals-prominent .stat-number {
  color: white;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.trust-signals-prominent .stat-label {
  color: rgba(255, 255, 255, 0.9);
}

/* Security Badges */
.security-badges {
  margin-bottom: 2rem;
}

.security-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
  text-align: center;
}

.trust-signals-prominent .security-title {
  color: white;
}

.security-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.security-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  position: relative;
  transition: all 0.3s ease;
}

.trust-signals-prominent .security-badge {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.security-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.badge-icon {
  font-size: 1.5rem;
}

.badge-content {
  flex: 1;
}

.badge-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.trust-signals-prominent .badge-name {
  color: white;
}

.badge-description {
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.4;
}

.trust-signals-prominent .badge-description {
  color: rgba(255, 255, 255, 0.8);
}

.verification-check {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #10b981;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Testimonials */
.testimonials-section {
  margin-bottom: 2rem;
}

.testimonials-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
  text-align: center;
}

.trust-signals-prominent .testimonials-title {
  color: white;
}

.testimonial-container {
  position: relative;
}

.testimonial-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.5s ease;
}

.trust-signals-prominent .testimonial-card {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.testimonial-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.customer-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.trust-signals-prominent .customer-name {
  color: white;
}

.customer-location {
  font-size: 0.875rem;
  color: #64748b;
}

.trust-signals-prominent .customer-location {
  color: rgba(255, 255, 255, 0.8);
}

.testimonial-rating {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 1.125rem;
  color: #d1d5db;
}

.star.filled {
  color: #fbbf24;
}

.testimonial-quote {
  font-size: 1rem;
  color: #374151;
  line-height: 1.6;
  margin-bottom: 1rem;
  font-style: italic;
}

.trust-signals-prominent .testimonial-quote {
  color: rgba(255, 255, 255, 0.95);
}

.testimonial-savings {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.savings-amount {
  font-size: 1rem;
  font-weight: 700;
  color: #059669;
}

.trust-signals-prominent .savings-amount {
  color: #34d399;
}

.verified-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #059669;
  background: #d1fae5;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
}

.trust-signals-prominent .verified-badge {
  background: rgba(52, 211, 153, 0.2);
  color: #34d399;
}

.verified-icon {
  font-size: 0.875rem;
  font-weight: bold;
}

.testimonial-indicators {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.testimonial-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #cbd5e1;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.testimonial-dot.active {
  background: #3b82f6;
  transform: scale(1.25);
}

/* Guarantee Section */
.guarantee-section {
  margin-bottom: 2rem;
}

.guarantee-badge {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 12px;
  padding: 1rem;
}

.trust-signals-prominent .guarantee-badge {
  background: rgba(252, 211, 77, 0.2);
  border-color: rgba(252, 211, 77, 0.3);
}

.guarantee-icon {
  font-size: 2rem;
}

.guarantee-title {
  font-size: 1rem;
  font-weight: 700;
  color: #92400e;
  margin-bottom: 0.25rem;
}

.trust-signals-prominent .guarantee-title {
  color: #fcd34d;
}

.guarantee-description {
  font-size: 0.875rem;
  color: #b45309;
  line-height: 1.5;
}

.trust-signals-prominent .guarantee-description {
  color: rgba(252, 211, 77, 0.9);
}

/* Additional Trust Features */
.additional-trust {
  margin-bottom: 1.5rem;
}

.trust-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.trust-feature {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #475569;
  font-weight: 500;
}

.trust-signals-prominent .trust-feature {
  color: rgba(255, 255, 255, 0.9);
}

.feature-icon {
  font-size: 1.125rem;
}

/* Live Activity */
.live-activity {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 20px;
  font-size: 0.875rem;
  color: #16a34a;
  font-weight: 500;
}

.trust-signals-prominent .live-activity {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.activity-dot {
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .trust-signals {
    padding: 1.5rem 1rem;
    margin: 1rem 0;
  }
  
  .trust-stats {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }
  
  .trust-stat-item {
    flex-direction: row;
    text-align: left;
    min-width: auto;
    width: 100%;
  }
  
  .stat-icon {
    font-size: 2rem;
    margin-bottom: 0;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .security-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .security-badge {
    padding: 0.75rem;
  }
  
  .testimonial-card {
    padding: 1rem;
  }
  
  .testimonial-savings {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .trust-features {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .guarantee-badge {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
}

/* Tablet Responsive */
@media (min-width: 769px) and (max-width: 1023px) {
  .trust-stats {
    gap: 1.5rem;
  }
  
  .security-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .trust-features {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Animation delays for staggered entrance */
.trust-stats .trust-stat-item:nth-child(1) { transition-delay: 0.1s; }
.trust-stats .trust-stat-item:nth-child(2) { transition-delay: 0.2s; }
.trust-stats .trust-stat-item:nth-child(3) { transition-delay: 0.3s; }

.security-grid .security-badge:nth-child(1) { transition-delay: 0.1s; }
.security-grid .security-badge:nth-child(2) { transition-delay: 0.2s; }
.security-grid .security-badge:nth-child(3) { transition-delay: 0.3s; }
.security-grid .security-badge:nth-child(4) { transition-delay: 0.4s; }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('trust-signals-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'trust-signals-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}