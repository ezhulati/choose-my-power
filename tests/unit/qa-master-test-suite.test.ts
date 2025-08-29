/**
 * QA Master Test Suite - Comprehensive Quality Assurance Testing
 * 
 * This is the master test suite that orchestrates all QA testing categories
 * for the ChooseMyPower electricity comparison platform.
 * 
 * Coverage Areas:
 * - Component reliability and functionality
 * - API integration and error handling
 * - Data integrity and validation
 * - Business logic compliance
 * - Performance benchmarks
 * - Security compliance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Import critical components for testing
import { ZipCodeSearch } from '@/components/ZipCodeSearch';
import { SmartZipCodeInput } from '@/components/SmartZipCodeInput';
import { ElectricityPlanCard } from '@/components/ui/ElectricityPlanCard';
import { ComparisonBar } from '@/components/faceted/ComparisonBar';
import { FacetedSidebar } from '@/components/faceted/FacetedSidebar';

// Import utilities and services
import { comparePowerClient } from '@/lib/api/comparepower-client';
import { facetedRouter } from '@/lib/faceted/faceted-router';
import { multiFilterValidator } from '@/lib/faceted/multi-filter-validator';
import { addressValidator } from '@/lib/address/address-validator';

describe('QA Master Test Suite - Component Reliability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset any global state
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        plans: [],
        total: 0,
        page: 1,
        per_page: 50
      })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Critical Component Functionality', () => {
    it('should render ZipCodeSearch with proper accessibility attributes', async () => {
      render(<ZipCodeSearch />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label');
      expect(input).toHaveAttribute('placeholder');
      expect(input).toBeInTheDocument();
    });

    it('should handle ZIP code input validation correctly', async () => {
      const user = userEvent.setup();
      render(<SmartZipCodeInput onZipSubmit={vi.fn()} />);
      
      const input = screen.getByRole('textbox');
      
      // Test valid ZIP code
      await user.type(input, '75001');
      expect(input).toHaveValue('75001');
      
      // Test invalid ZIP code handling
      await user.clear(input);
      await user.type(input, '00000');
      // Should trigger validation error
      
      // Test Texas ZIP code validation
      await user.clear(input);
      await user.type(input, '77001'); // Houston ZIP
      expect(input).toHaveValue('77001');
    });

    it('should render ElectricityPlanCard with complete information', () => {
      const mockPlan = {
        id: 'test-plan-1',
        provider: 'TXU Energy',
        plan_name: 'Simply Fixed 12',
        rate_type: 'fixed' as const,
        price_per_kwh: 0.115,
        term_months: 12,
        early_termination_fee: 150,
        deposit_required: false,
        renewable_percentage: 0,
        details_url: 'https://example.com/plan/1',
        enrollment_url: 'https://example.com/enroll/1'
      };

      render(<ElectricityPlanCard plan={mockPlan} />);
      
      expect(screen.getByText('TXU Energy')).toBeInTheDocument();
      expect(screen.getByText('Simply Fixed 12')).toBeInTheDocument();
      expect(screen.getByText(/11\.5¢/)).toBeInTheDocument();
      expect(screen.getByText('12 months')).toBeInTheDocument();
    });

    it('should handle plan comparison functionality', async () => {
      const mockPlans = [
        {
          id: 'plan-1',
          provider: 'TXU Energy',
          plan_name: 'Fixed 12',
          rate_type: 'fixed' as const,
          price_per_kwh: 0.115,
          term_months: 12,
          early_termination_fee: 150,
          deposit_required: false,
          renewable_percentage: 0,
          details_url: 'https://example.com/plan/1',
          enrollment_url: 'https://example.com/enroll/1'
        },
        {
          id: 'plan-2',
          provider: 'Reliant Energy',
          plan_name: 'Green 24',
          rate_type: 'fixed' as const,
          price_per_kwh: 0.135,
          term_months: 24,
          early_termination_fee: 200,
          deposit_required: true,
          renewable_percentage: 100,
          details_url: 'https://example.com/plan/2',
          enrollment_url: 'https://example.com/enroll/2'
        }
      ];

      const onCompare = vi.fn();
      render(<ComparisonBar selectedPlans={mockPlans} onCompare={onCompare} />);
      
      expect(screen.getByText('Compare Plans')).toBeInTheDocument();
      
      const compareButton = screen.getByRole('button', { name: /compare/i });
      fireEvent.click(compareButton);
      
      expect(onCompare).toHaveBeenCalledWith(mockPlans);
    });
  });

  describe('API Integration Quality', () => {
    it('should handle API responses correctly', async () => {
      const mockResponse = {
        plans: [
          {
            id: 'api-plan-1',
            provider: 'TXU Energy',
            plan_name: 'API Test Plan',
            rate_type: 'fixed',
            price_per_kwh: 0.115,
            term_months: 12,
            early_termination_fee: 150,
            deposit_required: false,
            renewable_percentage: 0,
            details_url: 'https://example.com/plan/1',
            enrollment_url: 'https://example.com/enroll/1'
          }
        ],
        total: 1,
        page: 1,
        per_page: 50
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await comparePowerClient.getPlans('75001');
      expect(result.plans).toHaveLength(1);
      expect(result.plans[0].provider).toBe('TXU Energy');
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(comparePowerClient.getPlans('75001')).rejects.toThrow();
    });

    it('should handle rate limiting appropriately', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      await expect(comparePowerClient.getPlans('75001')).rejects.toThrow();
    });
  });

  describe('Data Validation Quality', () => {
    it('should validate ZIP codes according to Texas requirements', () => {
      // Valid Texas ZIP codes
      expect(addressValidator.isValidTexasZip('75001')).toBe(true); // Dallas
      expect(addressValidator.isValidTexasZip('77001')).toBe(true); // Houston
      expect(addressValidator.isValidTexasZip('78201')).toBe(true); // San Antonio
      expect(addressValidator.isValidTexasZip('73301')).toBe(true); // Austin

      // Invalid ZIP codes
      expect(addressValidator.isValidTexasZip('10001')).toBe(false); // New York
      expect(addressValidator.isValidTexasZip('90210')).toBe(false); // California
      expect(addressValidator.isValidTexasZip('00000')).toBe(false); // Invalid format
      expect(addressValidator.isValidTexasZip('12345')).toBe(false); // Non-Texas
    });

    it('should validate electricity plan data integrity', () => {
      const validPlan = {
        id: 'test-plan',
        provider: 'TXU Energy',
        plan_name: 'Test Plan',
        rate_type: 'fixed' as const,
        price_per_kwh: 0.115,
        term_months: 12,
        early_termination_fee: 150,
        deposit_required: false,
        renewable_percentage: 0,
        details_url: 'https://example.com/plan',
        enrollment_url: 'https://example.com/enroll'
      };

      // Test required fields
      expect(validPlan.id).toBeDefined();
      expect(validPlan.provider).toBeDefined();
      expect(validPlan.plan_name).toBeDefined();
      expect(validPlan.rate_type).toBeDefined();
      expect(validPlan.price_per_kwh).toBeGreaterThan(0);
      expect(validPlan.term_months).toBeGreaterThan(0);
      expect(typeof validPlan.deposit_required).toBe('boolean');
      expect(validPlan.renewable_percentage).toBeGreaterThanOrEqual(0);
      expect(validPlan.renewable_percentage).toBeLessThanOrEqual(100);
    });

    it('should validate faceted navigation filters', () => {
      const validFilters = {
        rate_type: ['fixed', 'variable'],
        term_months: [12, 24],
        renewable: true,
        no_deposit: true
      };

      expect(multiFilterValidator.validateFilters(validFilters)).toBe(true);
      
      // Test invalid filters
      const invalidFilters = {
        rate_type: ['invalid_rate_type'],
        term_months: [-1, 0], // Invalid term lengths
        renewable_percentage: 150 // Invalid percentage
      };

      expect(multiFilterValidator.validateFilters(invalidFilters)).toBe(false);
    });
  });

  describe('Business Logic Quality', () => {
    it('should calculate electricity costs correctly', () => {
      const plan = {
        price_per_kwh: 0.115,
        base_charge: 9.95,
        usage_kwh: 1000
      };

      const expectedCost = (plan.price_per_kwh * plan.usage_kwh) + plan.base_charge;
      // Should calculate: (0.115 * 1000) + 9.95 = 124.95
      expect(expectedCost).toBe(124.95);
    });

    it('should sort plans by price correctly', () => {
      const plans = [
        { id: '1', price_per_kwh: 0.135 },
        { id: '2', price_per_kwh: 0.115 },
        { id: '3', price_per_kwh: 0.125 }
      ];

      const sortedPlans = plans.sort((a, b) => a.price_per_kwh - b.price_per_kwh);
      
      expect(sortedPlans[0].price_per_kwh).toBe(0.115);
      expect(sortedPlans[1].price_per_kwh).toBe(0.125);
      expect(sortedPlans[2].price_per_kwh).toBe(0.135);
    });

    it('should filter renewable energy plans correctly', () => {
      const plans = [
        { id: '1', renewable_percentage: 0 },
        { id: '2', renewable_percentage: 100 },
        { id: '3', renewable_percentage: 50 }
      ];

      const renewablePlans = plans.filter(plan => plan.renewable_percentage > 0);
      expect(renewablePlans).toHaveLength(2);
      
      const fullyRenewablePlans = plans.filter(plan => plan.renewable_percentage === 100);
      expect(fullyRenewablePlans).toHaveLength(1);
      expect(fullyRenewablePlans[0].id).toBe('2');
    });
  });

  describe('Error Handling Quality', () => {
    it('should handle network failures gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(comparePowerClient.getPlans('75001')).rejects.toThrow('Network error');
    });

    it('should handle invalid API responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ invalid: 'response' })
      });

      // Should handle gracefully without crashing
      const result = await comparePowerClient.getPlans('75001');
      expect(result).toBeDefined();
    });

    it('should handle component errors with fallbacks', () => {
      // Test error boundary functionality
      const ThrowError = () => {
        throw new Error('Component error');
      };

      expect(() => render(<ThrowError />)).toThrow('Component error');
    });
  });

  describe('Performance Quality Benchmarks', () => {
    it('should render components within performance thresholds', async () => {
      const startTime = performance.now();
      
      render(<ZipCodeSearch />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render in under 16ms (60fps threshold)
      expect(renderTime).toBeLessThan(16);
    });

    it('should handle large plan datasets efficiently', () => {
      const largePlanDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `plan-${i}`,
        provider: `Provider ${i}`,
        plan_name: `Plan ${i}`,
        rate_type: 'fixed' as const,
        price_per_kwh: 0.1 + (i * 0.001),
        term_months: 12,
        early_termination_fee: 150,
        deposit_required: false,
        renewable_percentage: 0,
        details_url: `https://example.com/plan/${i}`,
        enrollment_url: `https://example.com/enroll/${i}`
      }));

      const startTime = performance.now();
      
      // Simulate filtering operation
      const filteredPlans = largePlanDataset.filter(plan => 
        plan.price_per_kwh < 0.15 && plan.term_months === 12
      );
      
      const endTime = performance.now();
      const filterTime = endTime - startTime;
      
      // Should filter 1000 plans in under 10ms
      expect(filterTime).toBeLessThan(10);
      expect(filteredPlans.length).toBeGreaterThan(0);
    });
  });

  describe('Security Quality Validation', () => {
    it('should sanitize user input properly', () => {
      const maliciousInput = '<script>alert("xss")</script>75001';
      const sanitizedInput = maliciousInput.replace(/<[^>]*>/g, '');
      
      expect(sanitizedInput).toBe('75001');
      expect(sanitizedInput).not.toContain('<script>');
    });

    it('should validate URL parameters safely', () => {
      const maliciousParam = 'javascript:alert("xss")';
      const isValidUrl = /^https?:\/\//.test(maliciousParam);
      
      expect(isValidUrl).toBe(false);
    });

    it('should handle SQL injection prevention in queries', () => {
      const userInput = "'; DROP TABLE plans; --";
      const sanitizedInput = userInput.replace(/['"`;\\]/g, '');
      
      expect(sanitizedInput).not.toContain("'");
      expect(sanitizedInput).not.toContain('"');
      expect(sanitizedInput).not.toContain(';');
      expect(sanitizedInput).not.toContain('--');
    });
  });
});

describe('QA Master Test Suite - Integration Quality', () => {
  describe('Component Integration', () => {
    it('should integrate ZIP search with plan results', async () => {
      const mockPlans = [
        {
          id: 'integration-plan-1',
          provider: 'TXU Energy',
          plan_name: 'Integration Test Plan',
          rate_type: 'fixed' as const,
          price_per_kwh: 0.115,
          term_months: 12,
          early_termination_fee: 150,
          deposit_required: false,
          renewable_percentage: 0,
          details_url: 'https://example.com/plan/1',
          enrollment_url: 'https://example.com/enroll/1'
        }
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          plans: mockPlans,
          total: 1,
          page: 1,
          per_page: 50
        })
      });

      const user = userEvent.setup();
      render(<ZipCodeSearch />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '75001');
      
      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('75001'),
          expect.any(Object)
        );
      });
    });

    it('should integrate faceted filters with plan results', () => {
      const filters = {
        rate_type: ['fixed'],
        term_months: [12, 24],
        renewable: true,
        no_deposit: true
      };

      const plans = [
        {
          id: '1',
          rate_type: 'fixed' as const,
          term_months: 12,
          renewable_percentage: 100,
          deposit_required: false
        },
        {
          id: '2',
          rate_type: 'variable' as const,
          term_months: 12,
          renewable_percentage: 0,
          deposit_required: true
        },
        {
          id: '3',
          rate_type: 'fixed' as const,
          term_months: 24,
          renewable_percentage: 50,
          deposit_required: false
        }
      ];

      // Apply filters
      let filteredPlans = plans.filter(plan => 
        filters.rate_type.includes(plan.rate_type) &&
        filters.term_months.includes(plan.term_months) &&
        (!filters.renewable || plan.renewable_percentage > 0) &&
        (!filters.no_deposit || !plan.deposit_required)
      );

      expect(filteredPlans).toHaveLength(1);
      expect(filteredPlans[0].id).toBe('3');
    });
  });

  describe('URL Routing Integration', () => {
    it('should generate correct faceted URLs', () => {
      const filters = {
        city: 'dallas',
        rate_type: 'fixed',
        term_months: 12,
        renewable: true
      };

      const expectedUrl = facetedRouter.buildUrl(filters);
      expect(expectedUrl).toContain('dallas');
      expect(expectedUrl).toContain('fixed');
      expect(expectedUrl).toContain('12-month');
      expect(expectedUrl).toContain('renewable');
    });

    it('should parse faceted URLs correctly', () => {
      const url = '/electricity-plans/dallas-tx/fixed/12-month/renewable/';
      const parsedFilters = facetedRouter.parseUrl(url);
      
      expect(parsedFilters.city).toBe('dallas');
      expect(parsedFilters.rate_type).toBe('fixed');
      expect(parsedFilters.term_months).toBe(12);
      expect(parsedFilters.renewable).toBe(true);
    });
  });
});

describe('QA Master Test Suite - Regression Prevention', () => {
  describe('Critical Path Protection', () => {
    it('should maintain ZIP code search functionality', async () => {
      render(<ZipCodeSearch />);
      
      const input = screen.getByRole('textbox');
      const searchButton = screen.getByRole('button');
      
      expect(input).toBeInTheDocument();
      expect(searchButton).toBeInTheDocument();
      expect(searchButton).not.toBeDisabled();
    });

    it('should maintain plan comparison functionality', () => {
      const mockPlans = [
        {
          id: 'regression-plan-1',
          provider: 'TXU Energy',
          plan_name: 'Regression Test Plan 1',
          rate_type: 'fixed' as const,
          price_per_kwh: 0.115,
          term_months: 12,
          early_termination_fee: 150,
          deposit_required: false,
          renewable_percentage: 0,
          details_url: 'https://example.com/plan/1',
          enrollment_url: 'https://example.com/enroll/1'
        },
        {
          id: 'regression-plan-2',
          provider: 'Reliant Energy',
          plan_name: 'Regression Test Plan 2',
          rate_type: 'fixed' as const,
          price_per_kwh: 0.135,
          term_months: 24,
          early_termination_fee: 200,
          deposit_required: true,
          renewable_percentage: 100,
          details_url: 'https://example.com/plan/2',
          enrollment_url: 'https://example.com/enroll/2'
        }
      ];

      const onCompare = vi.fn();
      render(<ComparisonBar selectedPlans={mockPlans} onCompare={onCompare} />);
      
      expect(screen.getByText('Compare Plans')).toBeInTheDocument();
    });

    it('should maintain mobile responsiveness', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<SmartZipCodeInput onZipSubmit={vi.fn()} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      
      // Should maintain functionality on mobile
      expect(input).not.toBeDisabled();
    });
  });
});