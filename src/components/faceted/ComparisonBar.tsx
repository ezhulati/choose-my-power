/**
 * ComparisonBar React Component
 * Sticky comparison bar that appears when plans are selected for comparison
 * Shows mini cards of selected plans with side-by-side comparison functionality
 */

import { useState, useEffect } from 'react';
import type { Plan } from '../../types/facets';

interface ComparisonBarProps {
  city: string;
}

const ComparisonBar: React.FC<ComparisonBarProps> = ({ city }) => {
  const [comparedPlans, setComparedPlans] = useState<Plan[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for comparison events from plan cards
    const handleCompareToggle = (event: CustomEvent<{ plan: Plan; action: 'add' | 'remove' }>) => {
      const { plan, action } = event.detail;
      
      setComparedPlans(current => {
        if (action === 'add' && current.length < 3 && !current.find(p => p.id === plan.id)) {
          const newPlans = [...current, plan];
          setIsVisible(newPlans.length > 0);
          return newPlans;
        } else if (action === 'remove') {
          const newPlans = current.filter(p => p.id !== plan.id);
          setIsVisible(newPlans.length > 0);
          return newPlans;
        }
        return current;
      });
    };

    // Add event listener
    window.addEventListener('compare-toggle', handleCompareToggle as EventListener);
    
    return () => {
      window.removeEventListener('compare-toggle', handleCompareToggle as EventListener);
    };
  }, []);

  const removePlan = (planId: string) => {
    setComparedPlans(current => {
      const newPlans = current.filter(p => p.id !== planId);
      setIsVisible(newPlans.length > 0);
      return newPlans;
    });

    // Dispatch event to update plan card buttons
    window.dispatchEvent(new CustomEvent('comparison-updated', {
      detail: { planId, inComparison: false }
    }));
  };

  const clearAll = () => {
    const planIds = comparedPlans.map(p => p.id);
    setComparedPlans([]);
    setIsVisible(false);

    // Dispatch events to update all plan card buttons
    planIds.forEach(planId => {
      window.dispatchEvent(new CustomEvent('comparison-updated', {
        detail: { planId, inComparison: false }
      }));
    });
  };

  const viewComparison = () => {
    // Store comparison data in localStorage for the comparison page
    localStorage.setItem('comparisonPlans', JSON.stringify({
      plans: comparedPlans,
      city: city,
      timestamp: Date.now()
    }));

    // Navigate to comparison page
    window.location.href = `/texas/${city}/compare-plans`;
  };

  if (!isVisible || comparedPlans.length === 0) {
    return null;
  }

  return (
    <div className="comparison-bar">
      <div className="comparison-bar-content">
        <div className="comparison-header">
          <div className="flex items-center space-x-2">
            <span className="comparison-icon">📊</span>
            <h3 className="comparison-title">
              Compare {comparedPlans.length} Plan{comparedPlans.length !== 1 ? 's' : ''}
            </h3>
          </div>
          <button 
            onClick={clearAll}
            className="clear-all-btn"
            aria-label="Clear all comparisons"
          >
            Clear All
          </button>
        </div>

        <div className="comparison-plans">
          {comparedPlans.map(plan => (
            <div key={plan.id} className="comparison-plan-card">
              <button
                onClick={() => removePlan(plan.id)}
                className="remove-plan-btn"
                aria-label={`Remove ${plan.name} from comparison`}
              >
                ×
              </button>
              
              <div className="plan-mini-info">
                <div className="provider-name">{plan.provider.name}</div>
                <div className="plan-name">{plan.name}</div>
                <div className="plan-rate">
                  {(plan.pricing.rate1000kWh * 100).toFixed(1)}¢/kWh
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="comparison-actions">
          <button 
            onClick={viewComparison}
            className="view-comparison-btn"
            disabled={comparedPlans.length < 2}
          >
            Compare Plans
            <span className="button-icon">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonBar;

// CSS styles
const styles = `
.comparison-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 3px solid #002768;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transform: translateY(0);
  transition: transform 0.3s ease-in-out;
}

.comparison-bar-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.comparison-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-width: 200px;
}

.comparison-icon {
  font-size: 1.25rem;
}

.comparison-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #002768;
  margin: 0;
}

.clear-all-btn {
  color: #6b7280;
  font-size: 0.875rem;
  text-decoration: underline;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.clear-all-btn:hover {
  color: #be0b31;
}

.comparison-plans {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.comparison-plan-card {
  position: relative;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.75rem;
  min-width: 140px;
  max-width: 180px;
}

.remove-plan-btn {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  background: #be0b31;
  color: white;
  border: none;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-plan-btn:hover {
  background: #a00922;
}

.plan-mini-info {
  text-align: center;
}

.provider-name {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.plan-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

.plan-rate {
  font-size: 1rem;
  font-weight: 700;
  color: #002768;
}

.comparison-actions {
  display: flex;
  align-items: center;
}

.view-comparison-btn {
  background: linear-gradient(135deg, #002768 0%, #be0b31 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.view-comparison-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 39, 104, 0.3);
}

.view-comparison-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-icon {
  transition: transform 0.2s;
}

.view-comparison-btn:hover:not(:disabled) .button-icon {
  transform: translateX(2px);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .comparison-bar-content {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .comparison-header {
    min-width: auto;
  }

  .comparison-plans {
    justify-content: center;
  }

  .comparison-plan-card {
    min-width: 120px;
    max-width: 140px;
  }

  .comparison-actions {
    justify-content: center;
  }

  .view-comparison-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Hide on very small screens */
@media (max-width: 480px) {
  .comparison-plan-card {
    min-width: 100px;
    max-width: 120px;
  }
  
  .provider-name,
  .plan-name {
    font-size: 0.75rem;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}