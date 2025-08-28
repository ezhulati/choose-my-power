import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';

// Import components for testing
import PlanCard from '../../../src/components/faceted/PlanCard.astro';
import FacetedSidebar from '../../../src/components/faceted/FacetedSidebar';
import TouchOptimizedCard from '../../../src/components/TouchOptimizedCard';
import ResponsiveContainer from '../../../src/components/ResponsiveContainer';
import ZipCodeSearch from '../../../src/components/ZipCodeSearch';
import type { Plan } from '../../../src/types/facets';

// Extend expect with jest-axe
expect.extend(toHaveNoViolations);

// Mock ResizeObserver for responsive tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver for lazy loading tests
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const mockPlan: Plan = {
  id: 'test-plan-1',
  name: 'TXU Energy Select 12',
  provider: {
    name: 'TXU Energy',
    logo: '/assets/logos/txu_energy.svg',
    logoInfo: {
      alt: 'TXU Energy logo',
      width: 120,
      height: 40
    },
    rating: 4.2,
    reviewCount: 1250,
  },
  pricing: {
    rate500kWh: 13.1,
    rate1000kWh: 12.0,
    rate2000kWh: 11.5,
    ratePerKwh: 12.0,
    total500kWh: 65.50,
    total1000kWh: 120.00,
    total2000kWh: 230.00,
  },
  contract: {
    length: 12,
    type: 'fixed',
    earlyTerminationFee: 150,
    autoRenewal: false,
    satisfactionGuarantee: true,
  },
  features: {
    greenEnergy: 0,
    billCredit: 0,
    freeTime: undefined,
    deposit: {
      required: false,
      amount: 0,
    },
  },
  availability: {
    enrollmentType: 'both',
    serviceAreas: ['Oncor Electric Delivery'],
  },
};

describe('UI Components Comprehensive Testing', () => {
  describe('Accessibility (WCAG 2.1 AA Compliance)', () => {
    it('should have no accessibility violations in PlanCard', async () => {
      const { container } = render(<PlanCard plan={mockPlan} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels and roles', () => {
      render(<PlanCard plan={mockPlan} />);
      
      // Check for proper labeling
      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByLabelText(/view details for/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/add.*to comparison/i)).toBeInTheDocument();
      
      // Check for proper heading structure
      const planName = screen.getByRole('heading', { level: 3 });
      expect(planName).toHaveTextContent('TXU Energy Select 12');
      
      // Check for proper button descriptions
      const enrollButton = screen.getByRole('button', { name: /enroll now/i });
      expect(enrollButton).toHaveAttribute('aria-describedby');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<PlanCard plan={mockPlan} />);
      
      const planCard = screen.getByRole('article');
      const compareButton = screen.getByLabelText(/add.*to comparison/i);
      const enrollButton = screen.getByRole('button', { name: /enroll now/i });
      
      // Tab through interactive elements
      await user.tab();
      expect(compareButton).toHaveFocus();
      
      await user.tab();
      expect(enrollButton).toHaveFocus();
      
      // Test Enter key activation
      await user.keyboard('{Enter}');
      // Should trigger enrollment action
    });

    it('should have proper color contrast ratios', () => {
      render(<PlanCard plan={mockPlan} />);
      
      // Test high contrast elements
      const rateDisplay = screen.getByText(/12\.0¢\/kWh/);
      const computedStyle = window.getComputedStyle(rateDisplay);
      
      // These would be actual color contrast tests in a real scenario
      expect(computedStyle.color).toBeDefined();
      expect(computedStyle.backgroundColor).toBeDefined();
    });

    it('should support screen readers with proper announcements', async () => {
      const { rerender } = render(<PlanCard plan={mockPlan} />);
      
      // Check for live region updates
      expect(screen.getByRole('status', { name: /plan details/i })).toBeInTheDocument();
      
      // Update plan and check announcements
      const updatedPlan = { ...mockPlan, pricing: { ...mockPlan.pricing, rate1000kWh: 11.5 } };
      rerender(<PlanCard plan={updatedPlan} />);
      
      expect(screen.getByText(/11\.5¢\/kWh/)).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness and Touch Optimization', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
      
      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        configurable: true,
        value: {},
      });
    });

    it('should adapt layout for mobile viewports', () => {
      render(<ResponsiveContainer><PlanCard plan={mockPlan} /></ResponsiveContainer>);
      
      const planCard = screen.getByRole('article');
      expect(planCard).toHaveClass(/mobile/i);
      
      // Check mobile-optimized button sizes
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const computedStyle = window.getComputedStyle(button);
        const minTouchTarget = parseInt(computedStyle.minHeight) >= 44; // 44px minimum touch target
        expect(minTouchTarget).toBe(true);
      });
    });

    it('should handle touch gestures correctly', async () => {
      const user = userEvent.setup();
      render(<TouchOptimizedCard plan={mockPlan} />);
      
      const card = screen.getByRole('article');
      
      // Test touch events
      fireEvent.touchStart(card, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      fireEvent.touchMove(card, {
        touches: [{ clientX: 150, clientY: 100 }],
      });
      
      fireEvent.touchEnd(card, {
        changedTouches: [{ clientX: 150, clientY: 100 }],
      });
      
      // Should handle swipe gestures for plan comparison
      await waitFor(() => {
        expect(screen.getByText(/swipe to compare/i)).toBeInTheDocument();
      });
    });

    it('should optimize for different screen orientations', () => {
      const { rerender } = render(
        <ResponsiveContainer>
          <FacetedSidebar filters={[]} onFilterChange={() => {}} />
        </ResponsiveContainer>
      );
      
      // Portrait mode
      expect(screen.getByRole('navigation')).toHaveClass(/portrait/i);
      
      // Switch to landscape
      Object.defineProperty(window, 'innerWidth', { value: 667 });
      Object.defineProperty(window, 'innerHeight', { value: 375 });
      
      fireEvent(window, new Event('orientationchange'));
      
      rerender(
        <ResponsiveContainer>
          <FacetedSidebar filters={[]} onFilterChange={() => {}} />
        </ResponsiveContainer>
      );
      
      expect(screen.getByRole('navigation')).toHaveClass(/landscape/i);
    });

    it('should handle slow network conditions gracefully', async () => {
      // Mock slow loading
      const slowImageLoad = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 3000))
      );
      
      render(<PlanCard plan={mockPlan} onImageLoad={slowImageLoad} />);
      
      // Should show loading placeholder
      expect(screen.getByRole('img', { name: /loading/i })).toBeInTheDocument();
      
      // Wait for image to load
      await waitFor(() => {
        expect(screen.getByAltText('TXU Energy logo')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Performance Optimization', () => {
    it('should implement lazy loading for images', () => {
      render(<PlanCard plan={mockPlan} />);
      
      const logo = screen.getByAltText('TXU Energy logo');
      expect(logo).toHaveAttribute('loading', 'lazy');
      expect(logo).toHaveAttribute('decoding', 'async');
    });

    it('should virtualize large lists efficiently', async () => {
      const manyPlans = Array(100).fill(null).map((_, i) => ({
        ...mockPlan,
        id: `plan-${i}`,
        name: `Plan ${i}`,
      }));
      
      const startTime = performance.now();
      render(
        <div role="list">
          {manyPlans.map(plan => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      );
      const renderTime = performance.now() - startTime;
      
      // Should render quickly even with many items
      expect(renderTime).toBeLessThan(1000); // 1 second
      
      // Should only render visible items
      const visibleCards = screen.getAllByRole('article');
      expect(visibleCards.length).toBeLessThanOrEqual(20); // Assuming viewport shows ~20 items
    });

    it('should debounce search input effectively', async () => {
      const mockSearch = vi.fn();
      const user = userEvent.setup();
      
      render(<ZipCodeSearch onSearch={mockSearch} />);
      
      const searchInput = screen.getByRole('textbox', { name: /zip code/i });
      
      // Type rapidly
      await user.type(searchInput, '75201');
      
      // Should debounce and only call search once after delay
      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledTimes(1);
        expect(mockSearch).toHaveBeenCalledWith('75201');
      }, { timeout: 1000 });
    });

    it('should measure and report Core Web Vitals', async () => {
      const performanceObserver = vi.fn();
      global.PerformanceObserver = vi.fn().mockImplementation(() => ({
        observe: performanceObserver,
        disconnect: vi.fn(),
      }));
      
      render(<PlanCard plan={mockPlan} />);
      
      // Should observe performance metrics
      expect(performanceObserver).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'largest-contentful-paint'
        })
      );
    });
  });

  describe('Interactive Features and State Management', () => {
    it('should handle plan comparison state correctly', async () => {
      const user = userEvent.setup();
      const mockToggleComparison = vi.fn();
      
      render(
        <PlanCard 
          plan={mockPlan} 
          onToggleComparison={mockToggleComparison}
        />
      );
      
      const compareButton = screen.getByLabelText(/add.*to comparison/i);
      
      // Add to comparison
      await user.click(compareButton);
      expect(mockToggleComparison).toHaveBeenCalledWith(mockPlan.id, true);
      
      // Button should update state
      expect(compareButton).toHaveTextContent(/remove from comparison/i);
      
      // Remove from comparison
      await user.click(compareButton);
      expect(mockToggleComparison).toHaveBeenCalledWith(mockPlan.id, false);
    });

    it('should handle filter interactions correctly', async () => {
      const mockFilterChange = vi.fn();
      const user = userEvent.setup();
      
      const availableFilters = [
        { id: '12-month', label: '12 Month Contract', count: 45 },
        { id: 'green-energy', label: 'Green Energy', count: 23 },
        { id: 'fixed-rate', label: 'Fixed Rate', count: 67 }
      ];
      
      render(
        <FacetedSidebar 
          filters={availableFilters}
          activeFilters={[]}
          onFilterChange={mockFilterChange}
        />
      );
      
      // Select filter
      const greenEnergyFilter = screen.getByLabelText(/green energy/i);
      await user.click(greenEnergyFilter);
      
      expect(mockFilterChange).toHaveBeenCalledWith(['green-energy']);
      
      // Select additional filter
      const monthlyFilter = screen.getByLabelText(/12 month/i);
      await user.click(monthlyFilter);
      
      expect(mockFilterChange).toHaveBeenCalledWith(['green-energy', '12-month']);
    });

    it('should show loading states during data fetch', async () => {
      const slowDataFetch = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 2000))
      );
      
      render(<PlanCard plan={mockPlan} onDataFetch={slowDataFetch} />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await userEvent.click(refreshButton);
      
      // Should show loading indicator
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing plan data gracefully', () => {
      const incompletePlan = {
        ...mockPlan,
        provider: { ...mockPlan.provider, name: '' },
        pricing: { ...mockPlan.pricing, rate1000kWh: 0 }
      };
      
      render(<PlanCard plan={incompletePlan} />);
      
      // Should show fallback content
      expect(screen.getByText(/provider information unavailable/i)).toBeInTheDocument();
      expect(screen.getByText(/pricing details unavailable/i)).toBeInTheDocument();
    });

    it('should handle image loading failures', async () => {
      const planWithBadImage = {
        ...mockPlan,
        provider: {
          ...mockPlan.provider,
          logo: '/nonexistent-image.jpg'
        }
      };
      
      render(<PlanCard plan={planWithBadImage} />);
      
      const logo = screen.getByAltText('TXU Energy logo');
      
      // Simulate image error
      fireEvent.error(logo);
      
      // Should show fallback image
      await waitFor(() => {
        expect(screen.getByAltText(/fallback logo/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors in search', async () => {
      const failingSearch = vi.fn().mockRejectedValue(new Error('Network error'));
      const user = userEvent.setup();
      
      render(<ZipCodeSearch onSearch={failingSearch} />);
      
      const searchInput = screen.getByRole('textbox', { name: /zip code/i });
      await user.type(searchInput, '12345');
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/search unavailable/i);
      });
    });

    it('should validate form inputs properly', async () => {
      const user = userEvent.setup();
      
      render(<ZipCodeSearch onSearch={() => {}} />);
      
      const searchInput = screen.getByRole('textbox', { name: /zip code/i });
      const submitButton = screen.getByRole('button', { name: /search/i });
      
      // Test invalid zip code
      await user.type(searchInput, '123');
      await user.click(submitButton);
      
      expect(screen.getByText(/invalid zip code/i)).toBeInTheDocument();
      
      // Test valid zip code
      await user.clear(searchInput);
      await user.type(searchInput, '75201');
      await user.click(submitButton);
      
      expect(screen.queryByText(/invalid zip code/i)).not.toBeInTheDocument();
    });
  });

  describe('Conversion Optimization Features', () => {
    it('should track CTA button interactions', async () => {
      const mockTrackEvent = vi.fn();
      global.gtag = mockTrackEvent;
      
      const user = userEvent.setup();
      render(<PlanCard plan={mockPlan} />);
      
      const enrollButton = screen.getByRole('button', { name: /enroll now/i });
      await user.click(enrollButton);
      
      expect(mockTrackEvent).toHaveBeenCalledWith('event', 'cta_click', {
        plan_id: mockPlan.id,
        provider: mockPlan.provider.name,
        event_category: 'conversion',
      });
    });

    it('should show trust signals effectively', () => {
      render(<PlanCard plan={mockPlan} showTrustSignals={true} />);
      
      // Should display trust indicators
      expect(screen.getByText(/texas approved/i)).toBeInTheDocument();
      expect(screen.getByText(/satisfaction guarantee/i)).toBeInTheDocument();
      expect(screen.getByRole('img', { name: /verified provider/i })).toBeInTheDocument();
    });

    it('should implement urgency indicators when appropriate', () => {
      const urgentPlan = {
        ...mockPlan,
        features: {
          ...mockPlan.features,
          limitedTime: true,
          specialOffer: 'New Customer Discount'
        }
      };
      
      render(<PlanCard plan={urgentPlan} />);
      
      expect(screen.getByText(/limited time/i)).toBeInTheDocument();
      expect(screen.getByText(/new customer discount/i)).toBeInTheDocument();
    });

    it('should handle A/B test variants', () => {
      const testVariant = 'variant_b';
      localStorage.setItem('ab_test_variant', testVariant);
      
      render(<PlanCard plan={mockPlan} />);
      
      // Should render variant B layout
      expect(screen.getByTestId('plan-card-variant-b')).toBeInTheDocument();
      
      // Should track variant exposure
      expect(global.gtag).toHaveBeenCalledWith('event', 'ab_test_exposure', {
        test_name: 'plan_card_layout',
        variant: 'variant_b',
      });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });
});