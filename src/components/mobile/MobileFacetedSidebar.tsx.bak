/**
 * Mobile Faceted Sidebar Component  
 * Touch-optimized filtering with accordion patterns, one-handed navigation,
 * and mobile-first UX for Texas electricity plan filtering
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { FacetOption, FacetCategory, FilterState } from '../../types/facets';

interface MobileFacetedSidebarProps {
  categories: FacetCategory[];
  currentFilters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClose?: () => void;
  isOpen?: boolean;
  showClearAll?: boolean;
  compactMode?: boolean;
  enableOneHanded?: boolean;
  city?: string;
  planCount?: number;
  enableHaptics?: boolean;
}

interface AccordionState {
  expandedSections: Set<string>;
  animatingSection: string | null;
  touchStartY: number;
  scrollPosition: number;
  isDragging: boolean;
}

interface OneHandedMode {
  enabled: boolean;
  thumbZone: 'left' | 'right';
  adaptiveHeight: boolean;
}

const defaultCategories: FacetCategory[] = [
  {
    id: 'contract-length',
    name: 'Contract Length',
    options: [
      { id: '1-month', label: '1 Month', count: 45, url: '/electricity-plans/1-month' },
      { id: '3-month', label: '3 Months', count: 67, url: '/electricity-plans/3-month' },
      { id: '6-month', label: '6 Months', count: 89, url: '/electricity-plans/6-month' },
      { id: '12-month', label: '12 Months', count: 156, url: '/electricity-plans/12-month' },
      { id: '24-month', label: '24 Months', count: 234, url: '/electricity-plans/24-month' },
      { id: '36-month', label: '36 Months', count: 78, url: '/electricity-plans/36-month' }
    ],
    icon: '📅',
    priority: 1
  },
  {
    id: 'plan-type',
    name: 'Plan Type', 
    options: [
      { id: 'fixed-rate', label: 'Fixed Rate', count: 312, url: '/electricity-plans/fixed-rate' },
      { id: 'variable-rate', label: 'Variable Rate', count: 89, url: '/electricity-plans/variable-rate' },
      { id: 'indexed-rate', label: 'Indexed Rate', count: 45, url: '/electricity-plans/indexed-rate' },
      { id: 'time-of-use', label: 'Time of Use', count: 23, url: '/electricity-plans/time-of-use' }
    ],
    icon: '📈',
    priority: 2
  },
  {
    id: 'special-features',
    name: 'Special Features',
    options: [
      { id: 'green-energy', label: '100% Green Energy', count: 145, url: '/electricity-plans/green-energy' },
      { id: 'no-deposit', label: 'No Deposit Required', count: 267, url: '/electricity-plans/no-deposit' },
      { id: 'prepaid', label: 'Prepaid Plans', count: 56, url: '/electricity-plans/prepaid' },
      { id: 'free-nights', label: 'Free Nights/Weekends', count: 34, url: '/electricity-plans/free-nights' },
      { id: 'solar-buyback', label: 'Solar Buyback', count: 18, url: '/electricity-plans/solar-buyback' }
    ],
    icon: '⭐',
    priority: 3
  },
  {
    id: 'price-range',
    name: 'Price Range (per kWh)',
    options: [
      { id: 'under-10', label: 'Under 10¢', count: 23, url: '/electricity-plans/under-10-cents' },
      { id: '10-12', label: '10¢ - 12¢', count: 145, url: '/electricity-plans/10-12-cents' },
      { id: '12-15', label: '12¢ - 15¢', count: 234, url: '/electricity-plans/12-15-cents' },
      { id: '15-18', label: '15¢ - 18¢', count: 167, url: '/electricity-plans/15-18-cents' },
      { id: 'over-18', label: 'Over 18¢', count: 89, url: '/electricity-plans/over-18-cents' }
    ],
    icon: '💰',
    priority: 4
  }
];

export const MobileFacetedSidebar: React.FC<MobileFacetedSidebarProps> = ({
  categories = defaultCategories,
  currentFilters,
  onFiltersChange,
  onClose,
  isOpen = false,
  showClearAll = true,
  compactMode = false,
  enableOneHanded = true,
  city = '',
  planCount = 0,
  enableHaptics = true
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  
  const [accordionState, setAccordionState] = useState<AccordionState>({
    expandedSections: new Set(['contract-length', 'plan-type']), // Top 2 sections expanded by default
    animatingSection: null,
    touchStartY: 0,
    scrollPosition: 0,
    isDragging: false
  });

  const [oneHandedMode, setOneHandedMode] = useState<OneHandedMode>({
    enabled: enableOneHanded,
    thumbZone: 'right', // Default to right-handed
    adaptiveHeight: true
  });

  const [filterStats, setFilterStats] = useState({
    activeCount: 0,
    totalResults: planCount
  });

  /**
   * Initialize component and detect hand preference
   */
  useEffect(() => {
    if (enableOneHanded) {
      detectHandPreference();
    }
    
    // Calculate active filters
    const activeCount = Object.values(currentFilters).reduce((count, filters) => {
      return count + (Array.isArray(filters) ? filters.length : filters ? 1 : 0);
    }, 0);
    
    setFilterStats(prev => ({ ...prev, activeCount }));
  }, [currentFilters, enableOneHanded]);

  /**
   * Handle escape key to close sidebar
   */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  /**
   * Detect user's hand preference based on touch patterns
   */
  const detectHandPreference = (): void => {
    // Simple heuristic: check if user typically touches left or right side of screen
    // In production, this could use more sophisticated touch pattern analysis
    const screenWidth = window.innerWidth;
    const preferLeft = screenWidth > 375; // Larger screens typically used two-handed
    
    setOneHandedMode(prev => ({
      ...prev,
      thumbZone: preferLeft ? 'left' : 'right'
    }));
  };

  /**
   * Toggle accordion section with animation
   */
  const toggleSection = useCallback((sectionId: string) => {
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(30);
    }

    setAccordionState(prev => {
      const newExpanded = new Set(prev.expandedSections);
      
      if (newExpanded.has(sectionId)) {
        newExpanded.delete(sectionId);
      } else {
        newExpanded.add(sectionId);
      }

      return {
        ...prev,
        expandedSections: newExpanded,
        animatingSection: sectionId
      };
    });

    // Clear animation state after transition
    setTimeout(() => {
      setAccordionState(prev => ({ ...prev, animatingSection: null }));
    }, 300);
  }, [enableHaptics]);

  /**
   * Handle filter selection
   */
  const handleFilterSelect = (categoryId: string, optionId: string, isSelected: boolean) => {
    const newFilters = { ...currentFilters };
    
    if (!newFilters[categoryId]) {
      newFilters[categoryId] = [];
    }
    
    if (isSelected) {
      // Remove filter
      newFilters[categoryId] = newFilters[categoryId].filter((id: string) => id !== optionId);
    } else {
      // Add filter
      newFilters[categoryId] = [...newFilters[categoryId], optionId];
    }

    onFiltersChange(newFilters);

    // Success haptic feedback
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(isSelected ? [30] : [50, 30, 50]);
    }
  };

  /**
   * Clear all filters
   */
  const handleClearAll = () => {
    onFiltersChange({});
    
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(100);
    }
  };

  /**
   * Handle touch start for drag gestures
   */
  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    setAccordionState(prev => ({
      ...prev,
      touchStartY: touch.clientY,
      isDragging: false
    }));
  };

  /**
   * Handle touch move for drag-to-close
   */
  const handleTouchMove = (event: React.TouchEvent) => {
    if (!sidebarRef.current) return;

    const touch = event.touches[0];
    const deltaY = touch.clientY - accordionState.touchStartY;
    
    // Only handle downward swipes when at top of sidebar
    if (sidebarRef.current.scrollTop === 0 && deltaY > 10) {
      setAccordionState(prev => ({ ...prev, isDragging: true }));
      
      // Visual feedback for drag
      const dragIntensity = Math.min(deltaY / 100, 1);
      sidebarRef.current.style.transform = `translateY(${deltaY * 0.5}px) scale(${1 - dragIntensity * 0.05})`;
      sidebarRef.current.style.opacity = `${1 - dragIntensity * 0.3}`;
    }
  };

  /**
   * Handle touch end for drag completion
   */
  const handleTouchEnd = () => {
    if (!sidebarRef.current) return;

    // Reset transform
    sidebarRef.current.style.transform = '';
    sidebarRef.current.style.opacity = '';

    // Close sidebar if dragged down significantly
    if (accordionState.isDragging) {
      const threshold = window.innerHeight * 0.2; // 20% of screen height
      const deltaY = window.innerHeight - accordionState.touchStartY;
      
      if (deltaY > threshold) {
        onClose?.();
      }
    }

    setAccordionState(prev => ({ ...prev, isDragging: false }));
  };

  /**
   * Get filter option display with smart truncation
   */
  const getOptionDisplay = (option: FacetOption, isCompact: boolean) => {
    const maxLength = isCompact ? 15 : 25;
    const truncated = option.label.length > maxLength 
      ? `${option.label.substring(0, maxLength)}...` 
      : option.label;
    
    return { label: truncated, showCount: option.count > 0 };
  };

  if (!isOpen) return null;

  return (
    <div className={`mobile-sidebar-overlay ${oneHandedMode.enabled ? 'one-handed' : ''}`}>
      {/* Backdrop */}
      <div 
        ref={backdropRef}
        className="sidebar-backdrop"
        onClick={onClose}
        onTouchStart={(e) => e.stopPropagation()}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`mobile-faceted-sidebar ${compactMode ? 'compact' : ''} ${
          oneHandedMode.enabled ? `thumb-${oneHandedMode.thumbZone}` : ''
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="drag-handle" />

        {/* Header */}
        <div className="sidebar-header">
          <div className="header-content">
            <div className="header-text">
              <h2 className="sidebar-title">Filter Plans</h2>
              {city && (
                <p className="sidebar-subtitle">
                  {planCount > 0 ? `${planCount} plans` : 'Plans'} in {city}
                </p>
              )}
            </div>
            <button 
              className="close-btn"
              onClick={onClose}
              aria-label="Close filters"
            >
              ✕
            </button>
          </div>

          {/* Active Filters Summary */}
          {filterStats.activeCount > 0 && (
            <div className="active-filters-summary">
              <span className="active-count">{filterStats.activeCount} filter{filterStats.activeCount > 1 ? 's' : ''} active</span>
              {showClearAll && (
                <button className="clear-all-btn" onClick={handleClearAll}>
                  Start Over
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filter Categories */}
        <div className="sidebar-content">
          {categories
            .sort((a, b) => (a.priority || 999) - (b.priority || 999))
            .map((category) => {
              const isExpanded = accordionState.expandedSections.has(category.id);
              const isAnimating = accordionState.animatingSection === category.id;
              const activeFilters = currentFilters[category.id] || [];
              const hasActiveFilters = activeFilters.length > 0;

              return (
                <div
                  key={category.id}
                  className={`filter-category ${isExpanded ? 'expanded' : ''} ${
                    isAnimating ? 'animating' : ''
                  } ${hasActiveFilters ? 'has-active' : ''}`}
                >
                  {/* Category Header */}
                  <button
                    className="category-header"
                    onClick={() => toggleSection(category.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`category-${category.id}`}
                  >
                    <div className="category-info">
                      <span className="category-icon">{category.icon}</span>
                      <span className="category-name">{category.name}</span>
                      {hasActiveFilters && (
                        <span className="active-badge">{activeFilters.length}</span>
                      )}
                    </div>
                    <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {/* Category Content */}
                  <div
                    id={`category-${category.id}`}
                    className="category-content"
                    style={{
                      maxHeight: isExpanded ? `${category.options.length * 56}px` : '0px'
                    }}
                  >
                    <div className="options-list">
                      {category.options.map((option) => {
                        const isSelected = activeFilters.includes(option.id);
                        const display = getOptionDisplay(option, compactMode);

                        return (
                          <label
                            key={option.id}
                            className={`option-item ${isSelected ? 'selected' : ''}`}
                          >
                            <div className="option-control">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleFilterSelect(category.id, option.id, isSelected)}
                                className="option-checkbox"
                              />
                              <span className="custom-checkbox">
                                {isSelected && <span className="check-mark">✓</span>}
                              </span>
                            </div>
                            
                            <div className="option-info">
                              <span className="option-label">{display.label}</span>
                              {display.showCount && (
                                <span className="option-count">({option.count})</span>
                              )}
                            </div>

                            {/* Touch target overlay for better accessibility */}
                            <div className="touch-target" />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Bottom Actions */}
        <div className="sidebar-footer">
          <div className="footer-actions">
            {filterStats.activeCount > 0 ? (
              <button 
                className="apply-filters-btn"
                onClick={onClose}
              >
                Show {filterStats.totalResults} Result{filterStats.totalResults !== 1 ? 's' : ''}
              </button>
            ) : (
              <button 
                className="browse-all-btn"
                onClick={onClose}
              >
                Browse Quality Plans
              </button>
            )}
          </div>

          {/* One-handed mode toggle */}
          {enableOneHanded && (
            <button
              className="one-handed-toggle"
              onClick={() => setOneHandedMode(prev => ({ ...prev, enabled: !prev.enabled }))}
              aria-label="Toggle one-handed mode"
            >
              <span className="toggle-icon">👍</span>
              <span className="toggle-text">
                One-handed {oneHandedMode.enabled ? 'ON' : 'OFF'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileFacetedSidebar;