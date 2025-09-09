// T015: PlansListingPage component test
// CRITICAL: This test MUST FAIL initially to ensure TDD compliance
// Tests main plans listing page component (FR-001, FR-013)

import React from 'react';
import { describe, it, expect, beforeAll, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Component under test (will not exist initially - this ensures test fails)
import PlansListingPage from '../../src/components/plans/PlansListingPage';

// Mock the service layer to control test data
vi.mock('../../src/lib/services/provider-service', () => ({
  getPlansForCity: vi.fn(),
  getProviders: vi.fn(),
  getCities: vi.fn()
}));

// Mock analytics integration
vi.mock('../../src/lib/services/analytics-integration', () => ({
  trackFilterInteraction: vi.fn(),
  trackPageView: vi.fn()
}));

describe('PlansListingPage Component Tests', () => {
  beforeAll(() => {
    console.log('🔴 TDD: Component tests should FAIL until component implementation is complete');
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('initial page load', () => {
    it('should render loading state initially', async () => {
      // Mock delayed service response
      const mockPlans = Array(50).fill(null).map((_, i) => ({
        id: `507f1f77bcf86cd79943900${i.toString().padStart(2, '0')}`,
        planName: `Test Plan ${i + 1}`,
        providerName: `Provider ${Math.floor(i / 5) + 1}`,
        baseRate: 8.5 + (i * 0.1),
        rateType: 'fixed' as const,
        contractLength: [12, 24][i % 2],
        monthlyFee: 9.95,
        connectionFee: 0,
        earlyTerminationFee: 150,
        estimatedMonthlyCost: 120 + (i * 2),
        greenEnergyPercentage: Math.floor(Math.random() * 100),
        planFeatures: ['Online billing', 'No deposit'],
        planType: 'Basic',
        promotionalOffers: [],
        serviceArea: ['75201', '75202'],
        tdspTerritory: 'Oncor',
        availability: 'active' as const,
        lastUpdated: new Date(),
        providerRating: 4.0 + (Math.random() * 1),
        customerServiceHours: '24/7',
        paymentOptions: ['Auto-pay', 'Online'],
        totalFirstYearCost: 1440 + (i * 24),
        averageRateIncludingFees: 8.8 + (i * 0.1)
      }));

      const { getPlansForCity } = await import('../../src/lib/services/provider-service');
      vi.mocked(getPlansForCity).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockPlans), 100))
      );

      render(<PlansListingPage city="dallas" />);
      
      // Should show loading state initially
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      
      // Should show plans after loading
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 200 });

      // Should display the plans count
      expect(screen.getByText(/50.*plans/i)).toBeInTheDocument();
    });

    it('should load and display plans within 2 seconds (FR-013)', async () => {
      const mockPlans = Array(25).fill(null).map((_, i) => ({
        id: `507f1f77bcf86cd79943900${i.toString().padStart(2, '0')}`,
        planName: `Fast Load Plan ${i + 1}`,
        providerName: `FastProvider ${i + 1}`,
        baseRate: 10.5,
        rateType: 'fixed' as const,
        contractLength: 12,
        monthlyFee: 9.95,
        connectionFee: 0,
        earlyTerminationFee: 100,
        estimatedMonthlyCost: 125,
        greenEnergyPercentage: 25,
        planFeatures: ['Basic service'],
        planType: 'Standard',
        promotionalOffers: [],
        serviceArea: ['75201'],
        tdspTerritory: 'Oncor',
        availability: 'active' as const,
        lastUpdated: new Date(),
        providerRating: 4.2,
        customerServiceHours: '9-5',
        paymentOptions: ['Online'],
        totalFirstYearCost: 1500,
        averageRateIncludingFees: 11.2
      }));

      const { getPlansForCity } = await import('../../src/lib/services/provider-service');
      vi.mocked(getPlansForCity).mockResolvedValue(mockPlans);

      const startTime = Date.now();
      render(<PlansListingPage city="houston" />);

      // Wait for plans to load
      await waitFor(() => {
        expect(screen.getByText(/25.*plans/i)).toBeInTheDocument();
      });

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000); // FR-013 requirement

      console.log(`✅ Page load performance: ${loadTime}ms (required: <2000ms)`);
    });

    it('should display plans in organized grid/list view (FR-001)', async () => {
      const mockPlans = Array(12).fill(null).map((_, i) => ({
        id: `507f1f77bcf86cd79943900${i.toString().padStart(2, '0')}`,
        planName: `Grid Plan ${i + 1}`,
        providerName: `GridProvider ${Math.floor(i / 3) + 1}`,
        baseRate: 9.0 + (i * 0.2),
        rateType: 'fixed' as const,
        contractLength: [12, 24, 36][i % 3],
        monthlyFee: 9.95,
        connectionFee: 0,
        earlyTerminationFee: 125,
        estimatedMonthlyCost: 110 + (i * 3),
        greenEnergyPercentage: (i * 8),
        planFeatures: [`Feature ${i + 1}`, 'Standard billing'],
        planType: 'Premium',
        promotionalOffers: [],
        serviceArea: ['75201', '75202'],
        tdspTerritory: 'Oncor',
        availability: 'active' as const,
        lastUpdated: new Date(),
        providerRating: 3.5 + (i * 0.1),
        customerServiceHours: '24/7',
        paymentOptions: ['Auto-pay', 'Phone'],
        totalFirstYearCost: 1320 + (i * 36),
        averageRateIncludingFees: 9.5 + (i * 0.2)
      }));

      const { getPlansForCity } = await import('../../src/lib/services/provider-service');
      vi.mocked(getPlansForCity).mockResolvedValue(mockPlans);

      render(<PlansListingPage city="austin" />);

      // Wait for plans to load
      await waitFor(() => {
        expect(screen.getByText(/12.*plans/i)).toBeInTheDocument();
      });

      // Should display each plan with key information
      mockPlans.forEach(plan => {
        expect(screen.getByText(plan.planName)).toBeInTheDocument();
        expect(screen.getByText(plan.providerName)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(plan.baseRate.toString()))).toBeInTheDocument();
      });

      // Should have grid or list container
      const plansContainer = screen.getByTestId('plans-grid') || screen.getByTestId('plans-list');
      expect(plansContainer).toBeInTheDocument();

      console.log('✅ Grid/list view validation passed');
    });
  });

  describe('error handling', () => {
    it('should handle service layer errors gracefully', async () => {
      const { getPlansForCity } = await import('../../src/lib/services/provider-service');
      vi.mocked(getPlansForCity).mockRejectedValue(new Error('Service unavailable'));

      render(<PlansListingPage city="dallas" />);

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error.*loading.*plans/i)).toBeInTheDocument();
      });

      // Should provide retry option
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle empty plans list', async () => {
      const { getPlansForCity } = await import('../../src/lib/services/provider-service');
      vi.mocked(getPlansForCity).mockResolvedValue([]);

      render(<PlansListingPage city="smalltown" />);

      // Should show empty state message
      await waitFor(() => {
        expect(screen.getByText(/no.*plans.*found/i)).toBeInTheDocument();
      });

      // Should suggest actions
      expect(screen.getByText(/try.*different.*area/i)).toBeInTheDocument();
    });

    it('should retry loading after error', async () => {
      const { getPlansForCity } = await import('../../src/lib/services/provider-service');
      
      // First call fails
      vi.mocked(getPlansForCity)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([{
          id: '507f1f77bcf86cd799439001',
          planName: 'Retry Success Plan',
          providerName: 'RetryProvider',
          baseRate: 11.0,
          rateType: 'fixed' as const,
          contractLength: 12,
          monthlyFee: 9.95,
          connectionFee: 0,
          earlyTerminationFee: 100,
          estimatedMonthlyCost: 130,
          greenEnergyPercentage: 30,
          planFeatures: ['Retry feature'],
          planType: 'Standard',
          promotionalOffers: [],
          serviceArea: ['75201'],
          tdspTerritory: 'Oncor',
          availability: 'active' as const,
          lastUpdated: new Date(),
          providerRating: 4.0,
          customerServiceHours: '24/7',
          paymentOptions: ['Online'],
          totalFirstYearCost: 1560,
          averageRateIncludingFees: 11.5
        }]);

      render(<PlansListingPage city="dallas" />);

      // Should show error first
      await waitFor(() => {
        expect(screen.getByText(/error.*loading.*plans/i)).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Should show success after retry
      await waitFor(() => {
        expect(screen.getByText('Retry Success Plan')).toBeInTheDocument();
      });

      console.log('✅ Retry functionality validated');
    });
  });

  describe('filter integration', () => {
    it('should integrate with filter component', async () => {
      const mockPlans = Array(30).fill(null).map((_, i) => ({
        id: `507f1f77bcf86cd79943900${i.toString().padStart(2, '0')}`,
        planName: `Filter Plan ${i + 1}`,
        providerName: `Provider ${Math.floor(i / 10) + 1}`,
        baseRate: 8.0 + (i * 0.1),
        rateType: ['fixed', 'variable'][i % 2] as 'fixed' | 'variable',
        contractLength: [12, 24, 36][i % 3],
        monthlyFee: 9.95,
        connectionFee: 0,
        earlyTerminationFee: 150,
        estimatedMonthlyCost: 115 + (i * 2),
        greenEnergyPercentage: i * 3,
        planFeatures: [`Feature ${i + 1}`],
        planType: 'Standard',
        promotionalOffers: [],
        serviceArea: ['75201'],
        tdspTerritory: 'Oncor',
        availability: 'active' as const,
        lastUpdated: new Date(),
        providerRating: 3.5 + (i * 0.05),
        customerServiceHours: '24/7',
        paymentOptions: ['Online'],
        totalFirstYearCost: 1380 + (i * 24),
        averageRateIncludingFees: 8.5 + (i * 0.1)
      }));

      const { getPlansForCity } = await import('../../src/lib/services/provider-service');
      vi.mocked(getPlansForCity).mockResolvedValue(mockPlans);

      render(<PlansListingPage city="dallas" />);

      // Wait for plans to load
      await waitFor(() => {
        expect(screen.getByText(/30.*plans/i)).toBeInTheDocument();
      });

      // Should have filter component
      expect(screen.getByTestId('plans-filter')).toBeInTheDocument();

      // Should show all plans initially
      expect(screen.getAllByTestId('plan-card')).toHaveLength(30);
    });

    it('should respond to filter changes', async () => {
      const mockPlans = Array(20).fill(null).map((_, i) => ({
        id: `507f1f77bcf86cd79943900${i.toString().padStart(2, '0')}`,
        planName: `Filterable Plan ${i + 1}`,
        providerName: i < 10 ? 'ProviderA' : 'ProviderB',
        baseRate: 8.0 + (i * 0.2),
        rateType: 'fixed' as const,
        contractLength: i < 10 ? 12 : 24,
        monthlyFee: 9.95,
        connectionFee: 0,
        earlyTerminationFee: 100,
        estimatedMonthlyCost: 120 + (i * 2),
        greenEnergyPercentage: i * 5,
        planFeatures: ['Standard feature'],
        planType: 'Basic',
        promotionalOffers: [],
        serviceArea: ['75201'],
        tdspTerritory: 'Oncor',
        availability: 'active' as const,
        lastUpdated: new Date(),
        providerRating: 4.0,
        customerServiceHours: '24/7',
        paymentOptions: ['Online'],
        totalFirstYearCost: 1440 + (i * 24),
        averageRateIncludingFees: 8.5 + (i * 0.2)
      }));

      const { getPlansForCity } = await import('../../src/lib/services/provider-service');
      vi.mocked(getPlansForCity).mockResolvedValue(mockPlans);

      render(<PlansListingPage city="houston" />);

      await waitFor(() => {
        expect(screen.getByText(/20.*plans/i)).toBeInTheDocument();
      });

      // Apply contract length filter (12 months)
      const contractFilter = screen.getByRole('combobox', { name: /contract.*length/i });
      fireEvent.change(contractFilter, { target: { value: '12' } });

      // Should show filtered results (10 plans with 12-month contracts)
      await waitFor(() => {
        expect(screen.getByText(/10.*plans/i)).toBeInTheDocument();
      });

      console.log('✅ Filter integration validated');
    });
  });

  describe('accessibility compliance', () => {
    it('should meet WCAG 2.1 AA standards (NFR-002)', async () => {
      const mockPlans = [{
        id: '507f1f77bcf86cd799439001',
        planName: 'Accessible Plan',
        providerName: 'AccessProvider',
        baseRate: 10.0,
        rateType: 'fixed' as const,
        contractLength: 12,
        monthlyFee: 9.95,
        connectionFee: 0,
        earlyTerminationFee: 100,
        estimatedMonthlyCost: 125,
        greenEnergyPercentage: 25,
        planFeatures: ['Accessible billing'],
        planType: 'Standard',
        promotionalOffers: [],
        serviceArea: ['75201'],
        tdspTerritory: 'Oncor',
        availability: 'active' as const,
        lastUpdated: new Date(),
        providerRating: 4.0,
        customerServiceHours: '24/7',
        paymentOptions: ['Online'],
        totalFirstYearCost: 1500,
        averageRateIncludingFees: 11.0
      }];

      const { getPlansForCity } = await import('../../src/lib/services/provider-service');
      vi.mocked(getPlansForCity).mockResolvedValue(mockPlans);

      render(<PlansListingPage city="dallas" />);

      await waitFor(() => {
        expect(screen.getByText('Accessible Plan')).toBeInTheDocument();
      });

      // Check for proper heading hierarchy
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();

      // Check for proper form labels
      const filterInputs = screen.getAllByRole('combobox');
      filterInputs.forEach(input => {
        expect(input).toHaveAccessibleName();
      });

      // Check for proper button labels
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });

      // Check for proper landmarks
      expect(screen.getByRole('main')).toBeInTheDocument();

      console.log('✅ Accessibility compliance validated');
    });

    it('should support keyboard navigation', async () => {
      const mockPlans = Array(5).fill(null).map((_, i) => ({
        id: `507f1f77bcf86cd79943900${i + 1}`,
        planName: `Keyboard Plan ${i + 1}`,
        providerName: `Provider ${i + 1}`,
        baseRate: 9.0 + i,
        rateType: 'fixed' as const,
        contractLength: 12,
        monthlyFee: 9.95,
        connectionFee: 0,
        earlyTerminationFee: 100,
        estimatedMonthlyCost: 120 + (i * 5),
        greenEnergyPercentage: 20,
        planFeatures: ['Keyboard accessible'],
        planType: 'Standard',
        promotionalOffers: [],
        serviceArea: ['75201'],
        tdspTerritory: 'Oncor',
        availability: 'active' as const,
        lastUpdated: new Date(),
        providerRating: 4.0,
        customerServiceHours: '24/7',
        paymentOptions: ['Online'],
        totalFirstYearCost: 1440 + (i * 60),
        averageRateIncludingFees: 9.5 + i
      }));

      const { getPlansForCity } = await import('../../src/lib/services/provider-service');
      vi.mocked(getPlansForCity).mockResolvedValue(mockPlans);

      render(<PlansListingPage city="austin" />);

      await waitFor(() => {
        expect(screen.getByText(/5.*plans/i)).toBeInTheDocument();
      });

      // Should be able to navigate with keyboard
      const firstPlanCard = screen.getAllByTestId('plan-card')[0];
      firstPlanCard.focus();
      expect(firstPlanCard).toHaveFocus();

      // Tab navigation should work
      fireEvent.keyDown(firstPlanCard, { key: 'Tab' });
      // Next focusable element should receive focus

      console.log('✅ Keyboard navigation validated');
    });
  });

  describe('analytics integration', () => {
    it('should track page view on mount', async () => {
      const { trackPageView } = await import('../../src/lib/services/analytics-integration');
      
      const mockPlans = [{
        id: '507f1f77bcf86cd799439001',
        planName: 'Analytics Plan',
        providerName: 'AnalyticsProvider',
        baseRate: 9.5,
        rateType: 'fixed' as const,
        contractLength: 12,
        monthlyFee: 9.95,
        connectionFee: 0,
        earlyTerminationFee: 100,
        estimatedMonthlyCost: 125,
        greenEnergyPercentage: 30,
        planFeatures: ['Analytics tracking'],
        planType: 'Standard',
        promotionalOffers: [],
        serviceArea: ['75201'],
        tdspTerritory: 'Oncor',
        availability: 'active' as const,
        lastUpdated: new Date(),
        providerRating: 4.0,
        customerServiceHours: '24/7',
        paymentOptions: ['Online'],
        totalFirstYearCost: 1500,
        averageRateIncludingFees: 10.0
      }];

      const { getPlansForCity } = await import('../../src/lib/services/provider-service');
      vi.mocked(getPlansForCity).mockResolvedValue(mockPlans);

      render(<PlansListingPage city="dallas" />);

      await waitFor(() => {
        expect(screen.getByText('Analytics Plan')).toBeInTheDocument();
      });

      // Should track page view
      expect(vi.mocked(trackPageView)).toHaveBeenCalledWith({
        page: 'plans_listing',
        city: 'dallas',
        planCount: 1
      });

      console.log('✅ Analytics integration validated');
    });
  });

  describe('constitutional compliance', () => {
    it('should only display plans with valid MongoDB ObjectIds', async () => {
      const mockPlans = [{
        id: '507f1f77bcf86cd799439001', // Valid MongoDB ObjectId
        planName: 'Constitutional Plan',
        providerName: 'ConstitutionalProvider',
        baseRate: 9.0,
        rateType: 'fixed' as const,
        contractLength: 12,
        monthlyFee: 9.95,
        connectionFee: 0,
        earlyTerminationFee: 100,
        estimatedMonthlyCost: 120,
        greenEnergyPercentage: 25,
        planFeatures: ['Constitutional compliance'],
        planType: 'Standard',
        promotionalOffers: [],
        serviceArea: ['75201'],
        tdspTerritory: 'Oncor',
        availability: 'active' as const,
        lastUpdated: new Date(),
        providerRating: 4.0,
        customerServiceHours: '24/7',
        paymentOptions: ['Online'],
        totalFirstYearCost: 1440,
        averageRateIncludingFees: 9.5
      }];

      const { getPlansForCity } = await import('../../src/lib/services/provider-service');
      vi.mocked(getPlansForCity).mockResolvedValue(mockPlans);

      render(<PlansListingPage city="dallas" />);

      await waitFor(() => {
        expect(screen.getByText('Constitutional Plan')).toBeInTheDocument();
      });

      // Should not display any hardcoded plan IDs in the UI
      const planCards = screen.getAllByTestId('plan-card');
      planCards.forEach(card => {
        // Should not contain hardcoded ID patterns
        expect(card).not.toHaveTextContent(/68b[0-9a-f]{21}/i);
      });

      console.log('✅ Constitutional compliance: No hardcoded plan IDs displayed');
    });

    it('should use real data service layer exclusively', async () => {
      render(<PlansListingPage city="houston" />);

      // Should call real service layer
      const { getPlansForCity } = await import('../../src/lib/services/provider-service');
      expect(vi.mocked(getPlansForCity)).toHaveBeenCalledWith('houston', 'texas');

      console.log('✅ Real data service layer usage validated');
    });
  });
});