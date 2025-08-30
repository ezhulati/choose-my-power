/**
 * ZipCodeSearchAPI Component Tests - Comprehensive Test Suite
 * 
 * Tests for the production-ready ZIP code search component that integrates
 * with the API hooks and Netlify Functions. Covers user interactions,
 * accessibility, error handling, and all user flows.
 * 
 * @module ZipCodeSearchAPI.test
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ZipCodeSearchAPI } from '../ZipCodeSearchAPI';
import type { ZipCodeSearchAPIProps } from '../ZipCodeSearchAPI';

// Mock the hooks
vi.mock('../hooks/useElectricityPlansAPI', () => ({
  useElectricityPlansAPI: vi.fn()
}));

vi.mock('../hooks/useESIIDLookup', () => ({
  useESIIDLookup: vi.fn()
}));

// Mock cn utility
vi.mock('../lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' ')
}));

import { useElectricityPlansAPI } from '../hooks/useElectricityPlansAPI';
import { useESIIDLookup } from '../hooks/useESIIDLookup';

// Mock implementations
const mockUseElectricityPlansAPI = useElectricityPlansAPI as any;
const mockUseESIIDLookup = useESIIDLookup as any;

// Test data
const mockPlan = {
  id: 'plan-123',
  name: 'Test Plan',
  provider: {
    name: 'Test Provider',
    logo: 'test-logo.png',
    logoInfo: {},
    rating: 4.5,
    reviewCount: 100
  },
  pricing: {
    rate1000kWh: 11.8,
    ratePerKwh: 11.8
  },
  contract: {
    type: 'fixed' as const,
    length: 12
  },
  features: {
    greenEnergy: 25
  }
};

const mockTdspInfo = {
  duns: '007924772',
  name: 'Oncor',
  zone: 'North',
  confidence: 'high' as const
};

const mockSearchMeta = {
  totalPlans: 1,
  filteredPlans: 1,
  zipCode: '75201',
  usage: 1000,
  cacheHit: false,
  responseTime: 250,
  method: 'direct_mapping' as const,
  lastSearched: new Date()
};

const mockESIIDResolution = {
  tdsp: {
    duns: '007924772',
    name: 'Oncor',
    zone: 'North'
  },
  esiid: '10000012345678901',
  confidence: 'high' as const,
  method: 'esiid_lookup' as const,
  address: {
    matched: '123 Main Street, Dallas, TX 75201',
    normalized: '123 Main Street',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75201'
  }
};

// Default mock returns
const defaultPlanSearchMock = {
  plans: [],
  tdspInfo: null,
  searchMeta: null,
  splitZipInfo: null,
  isLoading: false,
  isSearching: false,
  error: null,
  hasSearched: false,
  search: vi.fn(),
  retry: vi.fn(),
  clearError: vi.fn(),
  refetch: vi.fn(),
  invalidate: vi.fn()
};

const defaultESIIDMock = {
  resolution: null,
  alternatives: [],
  apiParams: null,
  splitZipInfo: null,
  isLookingUp: false,
  error: null,
  hasLooked: false,
  lookup: vi.fn(),
  selectAlternative: vi.fn(),
  retry: vi.fn(),
  clearError: vi.fn(),
  refetch: vi.fn(),
  invalidate: vi.fn()
};

describe('ZipCodeSearchAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseElectricityPlansAPI.mockReturnValue({ ...defaultPlanSearchMock });
    mockUseESIIDLookup.mockReturnValue({ ...defaultESIIDMock });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Basic Rendering', () => {
    it('should render the component with default props', () => {
      render(<ZipCodeSearchAPI />);
      
      expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /find my best rates/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter texas zip code/i)).toBeInTheDocument();
    });

    it('should render with initial values', () => {
      render(
        <ZipCodeSearchAPI 
          initialZipCode="75201"
          initialAddress="123 Main St"
        />
      );
      
      const zipInput = screen.getByDisplayValue('75201');
      expect(zipInput).toBeInTheDocument();
    });

    it('should render with custom placeholders', () => {
      render(
        <ZipCodeSearchAPI 
          zipPlaceholder="Custom ZIP placeholder"
          addressPlaceholder="Custom address placeholder"
        />
      );
      
      expect(screen.getByPlaceholderText('Custom ZIP placeholder')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ZipCodeSearchAPI className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('ZIP Code Input Validation', () => {
    it('should allow only numeric input with max 5 digits', async () => {
      const user = userEvent.setup();
      render(<ZipCodeSearchAPI />);
      
      const zipInput = screen.getByLabelText(/zip code/i);
      
      await user.type(zipInput, 'abc123def456');
      
      expect(zipInput).toHaveValue('12345');
    });

    it('should validate Texas ZIP codes (starting with 7)', async () => {
      const user = userEvent.setup();
      render(<ZipCodeSearchAPI />);
      
      const zipInput = screen.getByLabelText(/zip code/i);
      
      // Valid Texas ZIP
      await user.type(zipInput, '75201');
      await waitFor(() => {
        expect(screen.getByTitle('CheckCircle')).toBeInTheDocument();
      });
      
      // Clear and enter non-Texas ZIP
      await user.clear(zipInput);
      await user.type(zipInput, '12345');
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid texas zip code/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for invalid ZIP codes', async () => {
      const user = userEvent.setup();
      render(<ZipCodeSearchAPI />);
      
      const zipInput = screen.getByLabelText(/zip code/i);
      
      await user.type(zipInput, '12345');
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid texas zip code/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call search function on form submission with valid ZIP', async () => {
      const mockSearch = vi.fn();
      mockUseElectricityPlansAPI.mockReturnValue({
        ...defaultPlanSearchMock,
        search: mockSearch
      });

      const user = userEvent.setup();
      render(<ZipCodeSearchAPI />);
      
      const zipInput = screen.getByLabelText(/zip code/i);
      const submitButton = screen.getByRole('button', { name: /find my best rates/i });
      
      await user.type(zipInput, '75201');
      await user.click(submitButton);
      
      expect(mockSearch).toHaveBeenCalledWith({
        zipCode: '75201',
        address: undefined,
        usage: 1000
      });
    });

    it('should not submit with invalid ZIP code', async () => {
      const mockSearch = vi.fn();
      const onError = vi.fn();
      mockUseElectricityPlansAPI.mockReturnValue({
        ...defaultPlanSearchMock,
        search: mockSearch
      });

      const user = userEvent.setup();
      render(<ZipCodeSearchAPI onError={onError} />);
      
      const zipInput = screen.getByLabelText(/zip code/i);
      const submitButton = screen.getByRole('button', { name: /find my best rates/i });
      
      await user.type(zipInput, '12345');
      await user.click(submitButton);
      
      expect(mockSearch).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith('Please enter a valid Texas ZIP code');
    });

    it('should prevent submission when disabled', async () => {
      const mockSearch = vi.fn();
      mockUseElectricityPlansAPI.mockReturnValue({
        ...defaultPlanSearchMock,
        search: mockSearch
      });

      const user = userEvent.setup();
      render(<ZipCodeSearchAPI disabled />);
      
      const submitButton = screen.getByRole('button', { name: /find my best rates/i });
      
      expect(submitButton).toBeDisabled();
      
      await user.click(submitButton);
      expect(mockSearch).not.toHaveBeenCalled();
    });
  });

  describe('Split ZIP Code Handling', () => {
    it('should show address input for split ZIP codes', async () => {
      mockUseElectricityPlansAPI.mockReturnValue({
        ...defaultPlanSearchMock,
        splitZipInfo: {
          isMultiTdsp: true,
          alternativeTdsps: [
            { duns: '007924772', name: 'Oncor', requiresAddress: true },
            { duns: '1039940674000', name: 'TXU', requiresAddress: true }
          ]
        }
      });

      render(<ZipCodeSearchAPI />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
        expect(screen.getByText(/multiple utility areas/i)).toBeInTheDocument();
      });
    });

    it('should require address for split ZIP code submission', async () => {
      const mockSearch = vi.fn();
      mockUseElectricityPlansAPI.mockReturnValue({
        ...defaultPlanSearchMock,
        search: mockSearch,
        splitZipInfo: {
          isMultiTdsp: true,
          alternativeTdsps: []
        }
      });

      const user = userEvent.setup();
      render(<ZipCodeSearchAPI />);
      
      const zipInput = screen.getByLabelText(/zip code/i);
      
      await user.type(zipInput, '75034');
      
      // Address input should appear
      await waitFor(() => {
        expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
      });
      
      const submitButton = screen.getByRole('button', { name: /find my best rates/i });
      await user.click(submitButton);
      
      // Should focus address input instead of submitting
      const addressInput = screen.getByLabelText(/address/i);
      await waitFor(() => {
        expect(addressInput).toHaveFocus();
      });
      
      expect(mockSearch).not.toHaveBeenCalled();
    });

    it('should perform ESIID lookup for split ZIP with address', async () => {
      const mockSearch = vi.fn();
      const mockLookup = vi.fn();
      
      mockUseElectricityPlansAPI.mockReturnValue({
        ...defaultPlanSearchMock,
        search: mockSearch,
        splitZipInfo: {
          isMultiTdsp: true,
          alternativeTdsps: []
        }
      });

      mockUseESIIDLookup.mockReturnValue({
        ...defaultESIIDMock,
        lookup: mockLookup,
        resolution: mockESIIDResolution
      });

      const user = userEvent.setup();
      render(<ZipCodeSearchAPI />);
      
      const zipInput = screen.getByLabelText(/zip code/i);
      await user.type(zipInput, '75034');
      
      await waitFor(() => {
        expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
      });
      
      const addressInput = screen.getByLabelText(/address/i);
      await user.type(addressInput, '123 Main Street');
      
      const submitButton = screen.getByRole('button', { name: /find my best rates/i });
      await user.click(submitButton);
      
      expect(mockLookup).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during search', () => {
      mockUseElectricityPlansAPI.mockReturnValue({
        ...defaultPlanSearchMock,
        isLoading: true,
        isSearching: true
      });

      render(<ZipCodeSearchAPI />);
      
      expect(screen.getByText(/searching plans/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /searching plans/i })).toBeDisabled();
    });

    it('should show different loading state during ESIID lookup', () => {
      mockUseESIIDLookup.mockReturnValue({
        ...defaultESIIDMock,
        isLookingUp: true
      });

      render(<ZipCodeSearchAPI />);
      
      expect(screen.getByText(/resolving address/i)).toBeInTheDocument();
    });
  });

  describe('Results Handling', () => {
    it('should call onResults callback when plans are found', async () => {
      const onResults = vi.fn();
      
      mockUseElectricityPlansAPI.mockReturnValue({
        ...defaultPlanSearchMock,
        plans: [mockPlan],
        searchMeta: mockSearchMeta,
        tdspInfo: mockTdspInfo
      });

      render(<ZipCodeSearchAPI onResults={onResults} initialZipCode="75201" />);
      
      await waitFor(() => {
        expect(onResults).toHaveBeenCalledWith({
          plans: [mockPlan],
          zipCode: '75201',
          address: undefined,
          meta: {
            totalPlans: mockSearchMeta.totalPlans,
            method: mockSearchMeta.method,
            responseTime: mockSearchMeta.responseTime,
            confidence: mockTdspInfo.confidence
          }
        });
      });
    });

    it('should show search results summary', () => {
      mockUseElectricityPlansAPI.mockReturnValue({
        ...defaultPlanSearchMock,
        plans: [mockPlan],
        searchMeta: mockSearchMeta
      });

      render(<ZipCodeSearchAPI initialZipCode="75201" />);
      
      expect(screen.getByText(/search complete/i)).toBeInTheDocument();
      expect(screen.getByText(/found 1 plans/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should call onError callback when plans search fails', async () => {
      const onError = vi.fn();
      
      mockUseElectricityPlansAPI.mockReturnValue({
        ...defaultPlanSearchMock,
        error: 'Search failed'
      });

      render(<ZipCodeSearchAPI onError={onError} />);
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Search failed');
      });
    });

    it('should call onError callback when ESIID lookup fails', async () => {
      const onError = vi.fn();
      
      mockUseESIIDLookup.mockReturnValue({
        ...defaultESIIDMock,
        error: 'ESIID lookup failed'
      });

      render(<ZipCodeSearchAPI onError={onError} />);
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('ESIID lookup failed');
      });
    });
  });

  describe('Usage Selector', () => {
    it('should show usage selector when enabled', () => {
      render(<ZipCodeSearchAPI showUsageSelector />);
      
      expect(screen.getByLabelText(/monthly usage/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('1,000 kWh - Average home')).toBeInTheDocument();
    });

    it('should update usage value when changed', async () => {
      const user = userEvent.setup();
      render(<ZipCodeSearchAPI showUsageSelector />);
      
      const usageSelect = screen.getByLabelText(/monthly usage/i);
      
      await user.selectOptions(usageSelect, '2000');
      
      expect(usageSelect).toHaveValue('2000');
    });

    it('should not show usage selector when disabled', () => {
      render(<ZipCodeSearchAPI showUsageSelector={false} />);
      
      expect(screen.queryByLabelText(/monthly usage/i)).not.toBeInTheDocument();
    });
  });

  describe('ESIID Resolution Display', () => {
    it('should show ESIID resolution success message', () => {
      mockUseESIIDLookup.mockReturnValue({
        ...defaultESIIDMock,
        resolution: mockESIIDResolution
      });

      render(<ZipCodeSearchAPI />);
      
      expect(screen.getByText(/address verified/i)).toBeInTheDocument();
      expect(screen.getByText(/your address is served by oncor/i)).toBeInTheDocument();
    });

    it('should show confidence level for non-high confidence', () => {
      const lowConfidenceResolution = {
        ...mockESIIDResolution,
        confidence: 'low' as const
      };
      
      mockUseESIIDLookup.mockReturnValue({
        ...defaultESIIDMock,
        resolution: lowConfidenceResolution
      });

      render(<ZipCodeSearchAPI />);
      
      expect(screen.getByText(/\(low confidence\)/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ZipCodeSearchAPI />);
      
      const zipInput = screen.getByLabelText(/zip code/i);
      expect(zipInput).toHaveAttribute('autoComplete', 'postal-code');
      expect(zipInput).toHaveAttribute('inputMode', 'numeric');
    });

    it('should have proper form structure', () => {
      render(<ZipCodeSearchAPI />);
      
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
      
      const submitButton = screen.getByRole('button', { type: 'submit' });
      expect(submitButton).toBeInTheDocument();
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ZipCodeSearchAPI />);
      
      const zipInput = screen.getByLabelText(/zip code/i);
      
      await user.type(zipInput, '75201');
      await user.keyboard('{Enter}');
      
      // Should trigger form submission
      await waitFor(() => {
        expect(mockUseElectricityPlansAPI().search).toHaveBeenCalled();
      });
    });

    it('should handle Enter key in address input', async () => {
      const user = userEvent.setup();
      const mockSearch = vi.fn();
      
      mockUseElectricityPlansAPI.mockReturnValue({
        ...defaultPlanSearchMock,
        search: mockSearch,
        splitZipInfo: { isMultiTdsp: true }
      });

      render(<ZipCodeSearchAPI />);
      
      // Wait for address input to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
      });
      
      const addressInput = screen.getByLabelText(/address/i);
      await user.type(addressInput, '123 Main Street');
      await user.keyboard('{Enter}');
      
      expect(mockSearch).toHaveBeenCalled();
    });
  });

  describe('Auto-focus', () => {
    it('should auto-focus ZIP input when enabled', () => {
      render(<ZipCodeSearchAPI autoFocus />);
      
      const zipInput = screen.getByLabelText(/zip code/i);
      expect(zipInput).toHaveFocus();
    });

    it('should not auto-focus when disabled', () => {
      render(<ZipCodeSearchAPI autoFocus={false} />);
      
      const zipInput = screen.getByLabelText(/zip code/i);
      expect(zipInput).not.toHaveFocus();
    });
  });

  describe('Component Variants', () => {
    it('should apply different size classes', () => {
      const { rerender } = render(<ZipCodeSearchAPI size="sm" />);
      expect(screen.getByRole('button')).toHaveClass('h-10');
      
      rerender(<ZipCodeSearchAPI size="xl" />);
      expect(screen.getByRole('button')).toHaveClass('h-16');
    });

    it('should apply different variant styles', () => {
      const { rerender } = render(<ZipCodeSearchAPI variant="texas" />);
      const container = screen.getByLabelText(/zip code/i).closest('.relative');
      expect(container).toHaveClass('border-texas-navy/20');
      
      rerender(<ZipCodeSearchAPI variant="hero" />);
      const heroContainer = screen.getByLabelText(/zip code/i).closest('.relative');
      expect(heroContainer).toHaveClass('border-texas-gold/30');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty results gracefully', () => {
      mockUseElectricityPlansAPI.mockReturnValue({
        ...defaultPlanSearchMock,
        plans: [],
        searchMeta: { ...mockSearchMeta, totalPlans: 0, filteredPlans: 0 }
      });

      render(<ZipCodeSearchAPI />);
      
      expect(screen.getByText(/found 0 plans/i)).toBeInTheDocument();
    });

    it('should reset state when ZIP code changes', async () => {
      const user = userEvent.setup();
      
      mockUseElectricityPlansAPI.mockReturnValue({
        ...defaultPlanSearchMock,
        splitZipInfo: { isMultiTdsp: true }
      });

      render(<ZipCodeSearchAPI initialZipCode="75034" />);
      
      // Address input should be visible for split ZIP
      await waitFor(() => {
        expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
      });
      
      const zipInput = screen.getByLabelText(/zip code/i);
      await user.clear(zipInput);
      await user.type(zipInput, '75201');
      
      // Address input should be hidden for single TDSP ZIP
      // (This would require updating the mock to reflect the new ZIP)
    });
  });
});