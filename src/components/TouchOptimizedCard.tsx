/**
 * TouchOptimizedCard React Component
 * Mobile-first plan card with touch gestures, swipe actions,
 * and optimized mobile interactions for electricity plan display
 */

import { useState, useEffect, useRef } from 'react';
import type { Plan } from '../types/facets';

interface TouchOptimizedCardProps {
  plan: Plan;
  city: string;
  position: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  showQuickActions?: boolean;
  compactMode?: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
  swipeDirection: 'left' | 'right' | null;
  startTime: number;
}

const TouchOptimizedCard: React.FC<TouchOptimizedCardProps> = ({
  plan,
  city,
  position,
  onSwipeLeft,
  onSwipeRight,
  onTap,
  showQuickActions = true,
  compactMode = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,
    swipeDirection: null,
    startTime: 0
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [hapticFeedback, setHapticFeedback] = useState(false);

  // Touch gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startTime = Date.now();
    
    setTouchState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isDragging: false,
      swipeDirection: null,
      startTime
    });

    // Haptic feedback on touch start (if supported)
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!cardRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchState.startX;
    const deltaY = touch.clientY - touchState.startY;
    
    setTouchState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isDragging: Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10
    }));

    // Horizontal swipe gestures
    if (Math.abs(deltaX) > 20 && Math.abs(deltaY) < 50) {
      e.preventDefault(); // Prevent scrolling
      
      const swipeDirection = deltaX > 0 ? 'right' : 'left';
      const swipeIntensity = Math.min(Math.abs(deltaX) / 100, 1);
      
      // Visual feedback during swipe
      cardRef.current.style.transform = `translateX(${deltaX * 0.3}px) scale(${0.98 + swipeIntensity * 0.02})`;
      cardRef.current.style.opacity = `${1 - swipeIntensity * 0.2}`;
      
      setTouchState(prev => ({ ...prev, swipeDirection }));
      
      // Show quick actions on significant swipe
      if (Math.abs(deltaX) > 50 && showQuickActions) {
        setQuickActionsVisible(true);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!cardRef.current) return;
    
    const deltaX = touchState.currentX - touchState.startX;
    const deltaY = touchState.currentY - touchState.startY;
    const touchDuration = Date.now() - touchState.startTime;
    const isSwipe = Math.abs(deltaX) > 50 && touchDuration < 300;
    const isTap = !touchState.isDragging && touchDuration < 300;

    // Reset visual state
    cardRef.current.style.transform = '';
    cardRef.current.style.opacity = '';

    if (isSwipe) {
      // Handle swipe gestures
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
        triggerHapticFeedback('medium');
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
        triggerHapticFeedback('medium');
      }
    } else if (isTap && onTap) {
      // Handle tap gesture
      onTap();
      triggerHapticFeedback('light');
    }

    // Reset touch state
    setTouchState({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isDragging: false,
      swipeDirection: null,
      startTime: 0
    });
    
    setQuickActionsVisible(false);
  };

  const triggerHapticFeedback = (intensity: 'light' | 'medium' | 'heavy') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [20],
        medium: [50],
        heavy: [100]
      };
      navigator.vibrate(patterns[intensity]);
    }
    
    setHapticFeedback(true);
    setTimeout(() => setHapticFeedback(false), 150);
  };

  // Format pricing and calculations
  const monthlyBill1000 = plan.pricing.rate1000kWh * 1000;
  const rateDisplay = (plan.pricing.rate1000kWh * 100).toFixed(1);
  const isGreen = plan.features.greenEnergy > 0;
  const noDeposit = !plan.features.deposit.required;

  // Responsive breakpoint detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div 
      ref={cardRef}
      className={`touch-optimized-card ${compactMode ? 'compact' : 'full'} ${
        touchState.isDragging ? 'dragging' : ''
      } ${hapticFeedback ? 'haptic-feedback' : ''} ${isExpanded ? 'expanded' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-plan-id={plan.id}
      role="article"
      aria-label={`${plan.name} by ${plan.provider.name}`}
    >
      {/* Swipe Indicators */}
      {touchState.isDragging && (
        <div className="swipe-indicators">
          <div className={`swipe-indicator left ${touchState.swipeDirection === 'left' ? 'active' : ''}`}>
            <span className="swipe-icon">📊</span>
            <span className="swipe-text">Compare</span>
          </div>
          <div className={`swipe-indicator right ${touchState.swipeDirection === 'right' ? 'active' : ''}`}>
            <span className="swipe-icon">⚡</span>
            <span className="swipe-text">Enroll</span>
          </div>
        </div>
      )}

      {/* Card Header */}
      <div className="touch-card-header">
        <div className="provider-section">
          {plan.provider.logo && (
            <img 
              src={plan.provider.logo} 
              alt={`${plan.provider.name} logo`}
              className="provider-logo-touch"
              width="48"
              height="24"
              loading="lazy"
            />
          )}
          <div className="provider-details-touch">
            <h3 className="plan-name-touch">{plan.name}</h3>
            <p className="provider-name-touch">{plan.provider.name}</p>
            {plan.provider.rating > 0 && (
              <div className="rating-touch">
                <div className="stars-touch">
                  {Array.from({length: 5}, (_, i) => (
                    <span key={i} className={`star-touch ${i < Math.floor(plan.provider.rating) ? 'filled' : ''}`}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="rating-value-touch">{plan.provider.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="rate-section-touch">
          <div className="main-rate-touch">
            <span className="rate-value-touch">{rateDisplay}¢</span>
            <span className="rate-unit-touch">per kWh</span>
          </div>
          <div className="monthly-estimate-touch">
            ${monthlyBill1000.toFixed(0)}/month
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className={`card-content-touch ${isExpanded ? 'expanded' : 'collapsed'}`}>
        
        {/* Key Features Row */}
        <div className="features-row-touch">
          <div className="feature-chip-touch contract">
            <span className="feature-icon-touch">📅</span>
            <span className="feature-text-touch">{plan.contract.length}mo</span>
          </div>
          
          <div className="feature-chip-touch type">
            <span className="feature-icon-touch">📈</span>
            <span className="feature-text-touch">{plan.contract.type}</span>
          </div>
          
          {isGreen && (
            <div className="feature-chip-touch green">
              <span className="feature-icon-touch">🌱</span>
              <span className="feature-text-touch">{plan.features.greenEnergy}%</span>
            </div>
          )}
          
          {noDeposit && (
            <div className="feature-chip-touch no-deposit">
              <span className="feature-icon-touch">💰</span>
              <span className="feature-text-touch">No Deposit</span>
            </div>
          )}
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="expanded-details-touch">
            <div className="detail-grid-touch">
              <div className="detail-item-touch">
                <span className="detail-label-touch">Early Term Fee:</span>
                <span className="detail-value-touch">
                  {plan.contract.earlyTerminationFee > 0 
                    ? `$${plan.contract.earlyTerminationFee}` 
                    : 'None'
                  }
                </span>
              </div>
              
              {plan.features.billCredit > 0 && (
                <div className="detail-item-touch">
                  <span className="detail-label-touch">Bill Credit:</span>
                  <span className="detail-value-touch">${plan.features.billCredit}</span>
                </div>
              )}
              
              {plan.features.freeTime && (
                <div className="detail-item-touch">
                  <span className="detail-label-touch">Free Time:</span>
                  <span className="detail-value-touch">
                    {plan.features.freeTime.hours} on {plan.features.freeTime.days.join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Touch-Optimized Actions */}
      <div className="touch-actions">
        <div className="primary-actions-touch">
          <button
            className="expand-btn-touch"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} plan details`}
          >
            <span className="expand-icon-touch">
              {isExpanded ? '⯅' : '⯆'}
            </span>
            <span className="expand-text-touch">
              {isExpanded ? 'Less' : 'More'}
            </span>
          </button>

          <button
            className="compare-btn-touch"
            onClick={() => {
              // Dispatch comparison event
              window.dispatchEvent(new CustomEvent('compare-toggle', {
                detail: { plan, action: 'add' }
              }));
              triggerHapticFeedback('medium');
            }}
            aria-label="Add to comparison"
          >
            <span className="action-icon-touch">📊</span>
            <span className="action-text-touch">Compare</span>
          </button>

          <a
            href={`/enroll/${plan.id}?city=${city}&position=${position}`}
            className="enroll-btn-touch"
            onClick={() => triggerHapticFeedback('heavy')}
          >
            <span className="action-icon-touch">⚡</span>
            <span className="action-text-touch">Enroll Now</span>
          </a>
        </div>
      </div>

      {/* Quick Actions Overlay */}
      {quickActionsVisible && showQuickActions && (
        <div className="quick-actions-overlay">
          <div className="quick-action-hint">
            <span className="hint-text">
              {touchState.swipeDirection === 'left' ? 'Release to Compare' : 'Release to Enroll'}
            </span>
          </div>
        </div>
      )}

      {/* Position indicator for top plans */}
      {position <= 3 && (
        <div className="position-badge-touch">
          <span className="position-icon-touch">🏆</span>
          <span className="position-text-touch">#{position}</span>
        </div>
      )}
    </div>
  );
};

export default TouchOptimizedCard;

// Enhanced mobile-first styles
const styles = `
/* Touch Optimized Card Base Styles */
.touch-optimized-card {
  position: relative;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  touch-action: pan-y;
  user-select: none;
  margin-bottom: 16px;
}

.touch-optimized-card.dragging {
  z-index: 10;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.touch-optimized-card.haptic-feedback {
  transform: scale(0.99);
}

.touch-optimized-card.compact {
  padding: 12px;
}

.touch-optimized-card.full {
  padding: 16px;
}

/* Swipe Indicators */
.swipe-indicators {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 5;
  pointer-events: none;
}

.swipe-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  transform: scale(0);
  transition: transform 0.2s ease-out;
}

.swipe-indicator.active {
  transform: scale(1);
}

.swipe-indicator.left {
  margin-left: 20px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.swipe-indicator.right {
  margin-right: 20px;
  background: linear-gradient(135deg, #dc2626, #991b1b);
}

.swipe-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.swipe-text {
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

/* Card Header */
.touch-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}

.provider-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.provider-logo-touch {
  width: 48px;
  height: 24px;
  object-fit: contain;
  flex-shrink: 0;
}

.provider-details-touch {
  flex: 1;
  min-width: 0;
}

.plan-name-touch {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.provider-name-touch {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 6px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rating-touch {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stars-touch {
  display: flex;
  gap: 2px;
}

.star-touch {
  font-size: 12px;
  color: #d1d5db;
}

.star-touch.filled {
  color: #fbbf24;
}

.rating-value-touch {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
}

/* Rate Section */
.rate-section-touch {
  text-align: right;
  flex-shrink: 0;
}

.main-rate-touch {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-bottom: 4px;
}

.rate-value-touch {
  font-size: 24px;
  font-weight: 800;
  color: #1f2937;
  line-height: 1;
}

.rate-unit-touch {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
}

.monthly-estimate-touch {
  font-size: 13px;
  color: #059669;
  font-weight: 600;
}

/* Card Content */
.card-content-touch {
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}

.card-content-touch.collapsed {
  max-height: 60px;
}

.card-content-touch.expanded {
  max-height: 300px;
}

/* Features Row */
.features-row-touch {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.feature-chip-touch {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.feature-chip-touch.contract {
  background: #dbeafe;
  color: #1d4ed8;
  border-color: #93c5fd;
}

.feature-chip-touch.type {
  background: #f0f9ff;
  color: #0369a1;
  border-color: #7dd3fc;
}

.feature-chip-touch.green {
  background: #dcfce7;
  color: #16a34a;
  border-color: #86efac;
}

.feature-chip-touch.no-deposit {
  background: #fef3c7;
  color: #d97706;
  border-color: #fcd34d;
}

.feature-icon-touch {
  font-size: 14px;
}

.feature-text-touch {
  font-weight: 600;
}

/* Expanded Details */
.expanded-details-touch {
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
  margin-top: 12px;
}

.detail-grid-touch {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.detail-item-touch {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f9fafb;
}

.detail-item-touch:last-child {
  border-bottom: none;
}

.detail-label-touch {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.detail-value-touch {
  font-size: 13px;
  color: #111827;
  font-weight: 600;
}

/* Touch Actions */
.touch-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.primary-actions-touch {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 8px;
  align-items: center;
}

.expand-btn-touch {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  touch-action: manipulation;
}

.expand-btn-touch:active {
  transform: scale(0.96);
  background: #f3f4f6;
}

.expand-icon-touch {
  font-size: 14px;
  transition: transform 0.2s;
}

.compare-btn-touch {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: #dbeafe;
  border: 1px solid #93c5fd;
  border-radius: 12px;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  touch-action: manipulation;
}

.compare-btn-touch:active {
  transform: scale(0.96);
  background: #bfdbfe;
}

.enroll-btn-touch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #dc2626, #991b1b);
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s;
  touch-action: manipulation;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
}

.enroll-btn-touch:active {
  transform: scale(0.96);
  box-shadow: 0 1px 2px rgba(220, 38, 38, 0.3);
}

.action-icon-touch {
  font-size: 16px;
}

.action-text-touch {
  font-size: inherit;
}

/* Quick Actions Overlay */
.quick-actions-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  animation: fadeIn 0.2s ease-out;
}

.quick-action-hint {
  background: white;
  color: #111827;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Position Badge */
.position-badge-touch {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #92400e;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.position-icon-touch {
  font-size: 12px;
}

.position-text-touch {
  font-size: 11px;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Tablet optimizations */
@media (min-width: 768px) {
  .touch-optimized-card {
    max-width: 400px;
    margin-bottom: 20px;
  }
  
  .primary-actions-touch {
    grid-template-columns: auto auto 1fr;
    gap: 12px;
  }
  
  .enroll-btn-touch {
    padding: 14px 20px;
    font-size: 15px;
  }
}

/* Large screen adaptations */
@media (min-width: 1024px) {
  .touch-optimized-card {
    max-width: 380px;
  }
  
  .touch-optimized-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .touch-optimized-card,
  .swipe-indicator,
  .expand-icon-touch {
    transition: none;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .touch-optimized-card {
    background: #1f2937;
    color: #f9fafb;
  }
  
  .plan-name-touch {
    color: #f9fafb;
  }
  
  .feature-chip-touch {
    background: #374151;
    color: #d1d5db;
    border-color: #4b5563;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('touch-optimized-card-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'touch-optimized-card-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}