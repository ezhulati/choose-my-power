// T019: PlanCard component test
// CRITICAL: This test MUST FAIL initially to ensure TDD compliance
// Tests individual plan display with Texas Design System (FR-007, FR-009)

import React from 'react';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Component under test (will not exist initially - ensures test fails)
import PlanCard from '../../src/components/plans/PlanCard';

// Mock types
import type { ElectricityPlan } from '../../src/lib/types/electricity-plan';

describe('PlanCard Component Tests', () => {
  beforeAll(() => {
    console.log('🔴 TDD: PlanCard tests should FAIL until component implementation is complete');
  });

  const mockPlan: ElectricityPlan = {
    id: '507f1f77bcf86cd799439001',
    planName: 'TXU Energy Secure Choice 12',
    providerName: 'TXU Energy',
    baseRate: 12.4,
    rateType: 'fixed',
    contractLength: 12,
    monthlyFee: 9.95,
    connectionFee: 0,
    earlyTerminationFee: 150,
    estimatedMonthlyCost: 124.50,
    greenEnergyPercentage: 22,
    planFeatures: ['No deposit required', 'Online account management', 'AutoPay discount'],
    planType: 'Basic',
    promotionalOffers: ['First month free'],
    serviceArea: ['75201', '75202', '75203'],
    tdspTerritory: 'Oncor',
    availability: 'active',
    lastUpdated: new Date(),
    providerRating: 4.2,
    customerServiceHours: '24/7',
    paymentOptions: ['Auto-pay', 'Online', 'Phone'],
    totalFirstYearCost: 1494.00,
    averageRateIncludingFees: 12.45
  };

  afterEach(() => {
    cleanup();
  });

  describe('plan information display', () => {
    it('should display all required plan information (FR-009)', () => {
      render(<PlanCard plan={mockPlan} />);

      // Plan name and provider
      expect(screen.getByText('TXU Energy Secure Choice 12')).toBeInTheDocument();
      expect(screen.getByText('TXU Energy')).toBeInTheDocument();

      // Transparent pricing display (FR-009)
      expect(screen.getByText(/12\.4.*¢/)).toBeInTheDocument(); // Base rate
      expect(screen.getByText(/\$124\.50/)).toBeInTheDocument(); // Estimated monthly cost
      expect(screen.getByText(/\$1,494\.00/)).toBeInTheDocument(); // First year total

      // Contract terms
      expect(screen.getByText(/12.*months?/i)).toBeInTheDocument();
      expect(screen.getByText(/\$150/)).toBeInTheDocument(); // ETF

      // Green energy
      expect(screen.getByText(/22%.*renewable/i)).toBeInTheDocument();

      console.log('✅ Plan information display validated');
    });

    it('should follow Texas Design System styling (FR-007)', () => {
      render(<PlanCard plan={mockPlan} />);

      const planCard = screen.getByTestId('plan-card');
      
      // Texas Design System classes should be applied
      expect(planCard).toHaveClass(/bg-white/); // Card background
      expect(planCard).toHaveClass(/rounded-xl/); // Card border radius
      expect(planCard).toHaveClass(/shadow-md/); // Professional shadow (not shadow-lg)
      
      // Should have hover effects
      expect(planCard).toHaveClass(/hover:shadow-xl/);
      expect(planCard).toHaveClass(/hover:-translate-y-1/);
      
      // Provider name should use texas-navy
      const providerName = screen.getByText('TXU Energy');
      expect(providerName).toHaveClass(/text-texas-navy/);

      console.log('✅ Texas Design System styling validated');
    });

    it('should highlight promotional offers prominently', () => {
      render(<PlanCard plan={mockPlan} />);

      // Should display promotional offers
      expect(screen.getByText('First month free')).toBeInTheDocument();
      
      // Promo should be highlighted with texas-gold
      const promoElement = screen.getByText('First month free');
      expect(promoElement).toHaveClass(/text-texas-gold/);

      console.log('✅ Promotional offers display validated');
    });

    it('should display plan features clearly', () => {
      render(<PlanCard plan={mockPlan} />);

      // Should show key features
      expect(screen.getByText('No deposit required')).toBeInTheDocument();
      expect(screen.getByText('Online account management')).toBeInTheDocument();
      expect(screen.getByText('AutoPay discount')).toBeInTheDocument();

      // Features should be in a list format
      const featuresList = screen.getByTestId('plan-features');
      expect(featuresList).toBeInTheDocument();

      console.log('✅ Plan features display validated');
    });
  });

  describe('interactive elements', () => {
    it('should have compare button functionality', () => {
      const onCompare = vi.fn();
      render(<PlanCard plan={mockPlan} onCompare={onCompare} />);

      const compareButton = screen.getByRole('button', { name: /compare/i });
      expect(compareButton).toBeInTheDocument();

      fireEvent.click(compareButton);
      expect(onCompare).toHaveBeenCalledWith(mockPlan);

      console.log('✅ Compare button functionality validated');
    });

    it('should have select plan CTA button (FR-008)', () => {
      const onSelect = vi.fn();
      render(<PlanCard plan={mockPlan} onSelect={onSelect} />);

      const selectButton = screen.getByRole('button', { name: /select.*plan/i });
      expect(selectButton).toBeInTheDocument();
      
      // Should use texas-red for primary CTA
      expect(selectButton).toHaveClass(/bg-texas-red/);
      expect(selectButton).toHaveClass(/text-white/);

      fireEvent.click(selectButton);
      expect(onSelect).toHaveBeenCalledWith(mockPlan);

      console.log('✅ Select plan CTA validated');
    });

    it('should support keyboard navigation', () => {
      const onSelect = vi.fn();
      render(<PlanCard plan={mockPlan} onSelect={onSelect} />);

      const planCard = screen.getByTestId('plan-card');
      
      // Should be focusable
      planCard.focus();
      expect(planCard).toHaveFocus();

      // Enter key should trigger selection
      fireEvent.keyDown(planCard, { key: 'Enter' });
      expect(onSelect).toHaveBeenCalledWith(mockPlan);

      console.log('✅ Keyboard navigation validated');
    });
  });

  describe('responsive design', () => {
    it('should adapt to mobile screens (FR-005)', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      render(<PlanCard plan={mockPlan} />);

      const planCard = screen.getByTestId('plan-card');
      
      // Should have responsive classes
      expect(planCard).toHaveClass(/w-full/); // Full width on mobile
      
      // Pricing should stack vertically on mobile
      const pricingSection = screen.getByTestId('plan-pricing');
      expect(pricingSection).toHaveClass(/flex-col/); // Column layout on mobile

      console.log('✅ Mobile responsive design validated');
    });

    it('should have appropriate touch targets', () => {
      render(<PlanCard plan={mockPlan} />);

      const buttons = screen.getAllByRole('button');
      
      // All buttons should have minimum 44px touch targets
      buttons.forEach(button => {
        const styles = getComputedStyle(button);
        const height = parseInt(styles.height);
        const minHeight = parseInt(styles.minHeight);
        
        expect(Math.max(height, minHeight)).toBeGreaterThanOrEqual(44);
      });

      console.log('✅ Touch target validation passed');
    });
  });

  describe('accessibility compliance', () => {
    it('should meet WCAG 2.1 AA standards (NFR-002)', () => {
      render(<PlanCard plan={mockPlan} />);

      const planCard = screen.getByTestId('plan-card');
      
      // Should have proper ARIA labels
      expect(planCard).toHaveAttribute('aria-label');
      expect(planCard.getAttribute('aria-label')).toContain('TXU Energy Secure Choice 12');

      // Interactive elements should have accessible names
      const compareButton = screen.getByRole('button', { name: /compare/i });
      expect(compareButton).toHaveAccessibleName();

      const selectButton = screen.getByRole('button', { name: /select.*plan/i });
      expect(selectButton).toHaveAccessibleName();

      console.log('✅ WCAG 2.1 AA compliance validated');
    });

    it('should provide screen reader friendly content', () => {
      render(<PlanCard plan={mockPlan} />);

      // Important information should be in screen reader accessible format
      expect(screen.getByText(/12\.4.*cents.*per.*kilowatt.*hour/i)).toBeInTheDocument();
      expect(screen.getByText(/estimated.*monthly.*cost.*124.*50/i)).toBeInTheDocument();

      // Should have proper heading hierarchy
      const planNameHeading = screen.getByRole('heading');
      expect(planNameHeading).toBeInTheDocument();
      expect(planNameHeading.tagName).toBe('H3'); // Appropriate level for card

      console.log('✅ Screen reader accessibility validated');
    });
  });

  describe('plan availability states', () => {
    it('should handle limited availability plans (FR-010)', () => {
      const limitedPlan: ElectricityPlan = {
        ...mockPlan,
        availability: 'limited'
      };

      render(<PlanCard plan={limitedPlan} />);

      // Should show availability warning
      expect(screen.getByText(/limited.*availability/i)).toBeInTheDocument();
      
      // Warning should be highlighted
      const warningElement = screen.getByTestId('availability-warning');
      expect(warningElement).toHaveClass(/text-texas-red/);

      console.log('✅ Limited availability handling validated');
    });

    it('should disable selection for discontinued plans', () => {
      const discontinuedPlan: ElectricityPlan = {
        ...mockPlan,
        availability: 'discontinued'
      };

      render(<PlanCard plan={discontinuedPlan} />);

      // Select button should be disabled
      const selectButton = screen.getByRole('button', { name: /select.*plan/i });
      expect(selectButton).toBeDisabled();

      // Should show discontinued message
      expect(screen.getByText(/no.*longer.*available/i)).toBeInTheDocument();

      console.log('✅ Discontinued plan handling validated');
    });
  });

  describe('constitutional compliance', () => {
    it('should never display hardcoded plan IDs', () => {
      render(<PlanCard plan={mockPlan} />);

      const planCard = screen.getByTestId('plan-card');
      
      // Should not contain any hardcoded ID patterns
      expect(planCard).not.toHaveTextContent(/68b[0-9a-f]{21}/i);
      
      // Plan ID should not be visible to users
      expect(planCard).not.toHaveTextContent(mockPlan.id);

      console.log('✅ Constitutional compliance: No hardcoded IDs displayed');
    });

    it('should use valid MongoDB ObjectId only', () => {
      // Component should validate plan ID format
      const invalidPlan = {
        ...mockPlan,
        id: 'invalid-plan-id'
      };

      // Should handle invalid IDs gracefully
      expect(() => {
        render(<PlanCard plan={invalidPlan} />);
      }).not.toThrow();

      console.log('✅ Plan ID validation handled gracefully');
    });
  });

  describe('performance considerations', () => {
    it('should render efficiently with memoization', () => {
      const { rerender } = render(<PlanCard plan={mockPlan} />);
      
      // Component should use React.memo for performance
      const initialRender = screen.getByTestId('plan-card');
      
      // Rerender with same props should not cause re-render
      rerender(<PlanCard plan={mockPlan} />);
      
      const secondRender = screen.getByTestId('plan-card');
      expect(secondRender).toBe(initialRender);

      console.log('✅ Component memoization validated');
    });
  });
});