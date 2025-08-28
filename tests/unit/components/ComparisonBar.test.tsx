import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ComparisonBar from '../../../src/components/faceted/ComparisonBar';
import type { Plan } from '../../../src/types/facets';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock location href
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

const mockPlan1: Plan = {
  id: 'plan-1',
  name: 'TXU Energy Select 12',
  provider: {
    name: 'TXU Energy',
    logo: '',
    rating: 4.2,
    reviewCount: 1250,
  },
  pricing: {
    rate500kWh: 0.131,
    rate1000kWh: 0.120,
    rate2000kWh: 0.115,
    ratePerKwh: 0.120,
  },
  contract: {
    length: 12,
    type: 'fixed',
    earlyTerminationFee: 150,
    autoRenewal: false,
    satisfactionGuarantee: false,
  },
  features: {
    greenEnergy: 0,
    billCredit: 0,
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

const mockPlan2: Plan = {
  id: 'plan-2',
  name: 'Green Mountain Pollution Free',
  provider: {
    name: 'Green Mountain Energy',
    logo: '',
    rating: 4.5,
    reviewCount: 890,
  },
  pricing: {
    rate500kWh: 0.1445,
    rate1000kWh: 0.1355,
    rate2000kWh: 0.1325,
    ratePerKwh: 0.1355,
  },
  contract: {
    length: 12,
    type: 'fixed',
    earlyTerminationFee: 0,
    autoRenewal: false,
    satisfactionGuarantee: true,
  },
  features: {
    greenEnergy: 100,
    billCredit: 0,
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

const mockPlan3: Plan = {
  id: 'plan-3',
  name: 'Reliant Secure 24',
  provider: {
    name: 'Reliant Energy',
    logo: '',
    rating: 3.8,
    reviewCount: 2100,
  },
  pricing: {
    rate500kWh: 0.125,
    rate1000kWh: 0.118,
    rate2000kWh: 0.112,
    ratePerKwh: 0.118,
  },
  contract: {
    length: 24,
    type: 'fixed',
    earlyTerminationFee: 200,
    autoRenewal: true,
    satisfactionGuarantee: false,
  },
  features: {
    greenEnergy: 0,
    billCredit: 50,
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

describe('ComparisonBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clear any existing event listeners
    const events = ['compare-toggle', 'comparison-updated'];
    events.forEach(event => {
      window.removeEventListener(event, () => {});
    });
  });

  it('should not render when no plans are being compared', () => {
    render(<ComparisonBar city="dallas" />);
    expect(screen.queryByText(/Compare \d+ Plan/)).not.toBeInTheDocument();
  });

  it('should render when plans are added for comparison', async () => {
    render(<ComparisonBar city="dallas" />);

    // Simulate adding a plan for comparison
    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: mockPlan1, action: 'add' }
    }));

    await waitFor(() => {
      expect(screen.getByText('Compare 1 Plan')).toBeInTheDocument();
    });

    expect(screen.getByText('TXU Energy')).toBeInTheDocument();
    expect(screen.getByText('TXU Energy Select 12')).toBeInTheDocument();
    expect(screen.getByText('12.0¢/kWh')).toBeInTheDocument();
  });

  it('should handle multiple plans correctly', async () => {
    render(<ComparisonBar city="houston" />);

    // Add first plan
    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: mockPlan1, action: 'add' }
    }));

    // Add second plan
    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: mockPlan2, action: 'add' }
    }));

    await waitFor(() => {
      expect(screen.getByText('Compare 2 Plans')).toBeInTheDocument();
    });

    expect(screen.getByText('TXU Energy Select 12')).toBeInTheDocument();
    expect(screen.getByText('Green Mountain Pollution Free')).toBeInTheDocument();
    expect(screen.getByText('12.0¢/kWh')).toBeInTheDocument();
    expect(screen.getByText('13.6¢/kWh')).toBeInTheDocument();
  });

  it('should limit comparisons to 3 plans maximum', async () => {
    render(<ComparisonBar city="austin" />);

    // Add three plans
    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: mockPlan1, action: 'add' }
    }));
    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: mockPlan2, action: 'add' }
    }));
    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: mockPlan3, action: 'add' }
    }));

    await waitFor(() => {
      expect(screen.getByText('Compare 3 Plans')).toBeInTheDocument();
    });

    // Try to add a fourth plan (should be ignored)
    const fourthPlan = { ...mockPlan1, id: 'plan-4', name: 'Fourth Plan' };
    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: fourthPlan, action: 'add' }
    }));

    // Should still show only 3 plans
    await waitFor(() => {
      expect(screen.getByText('Compare 3 Plans')).toBeInTheDocument();
    });
    expect(screen.queryByText('Fourth Plan')).not.toBeInTheDocument();
  });

  it('should not add duplicate plans', async () => {
    render(<ComparisonBar city="dallas" />);

    // Add plan twice
    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: mockPlan1, action: 'add' }
    }));
    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: mockPlan1, action: 'add' }
    }));

    await waitFor(() => {
      expect(screen.getByText('Compare 1 Plan')).toBeInTheDocument();
    });

    // Should only show one instance
    const planElements = screen.getAllByText('TXU Energy Select 12');
    expect(planElements).toHaveLength(1);
  });

  it('should remove individual plans correctly', async () => {
    render(<ComparisonBar city="dallas" />);

    // Add two plans
    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: mockPlan1, action: 'add' }
    }));
    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: mockPlan2, action: 'add' }
    }));

    await waitFor(() => {
      expect(screen.getByText('Compare 2 Plans')).toBeInTheDocument();
    });

    // Remove first plan using the remove button
    const removeButtons = screen.getAllByLabelText(/Remove .* from comparison/);
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Compare 1 Plan')).toBeInTheDocument();
    });

    expect(screen.queryByText('TXU Energy Select 12')).not.toBeInTheDocument();
    expect(screen.getByText('Green Mountain Pollution Free')).toBeInTheDocument();
  });

  it('should remove plans via external events', async () => {
    render(<ComparisonBar city="houston" />);

    // Add a plan
    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: mockPlan1, action: 'add' }
    }));

    await waitFor(() => {
      expect(screen.getByText('Compare 1 Plan')).toBeInTheDocument();
    });

    // Remove via external event
    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: mockPlan1, action: 'remove' }
    }));

    await waitFor(() => {
      expect(screen.queryByText(/Compare \d+ Plan/)).not.toBeInTheDocument();
    });
  });

  it('should clear all plans when Clear All is clicked', async () => {
    render(<ComparisonBar city="austin" />);

    // Add multiple plans
    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: mockPlan1, action: 'add' }
    }));
    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: mockPlan2, action: 'add' }
    }));

    await waitFor(() => {
      expect(screen.getByText('Compare 2 Plans')).toBeInTheDocument();
    });

    // Click Clear All
    fireEvent.click(screen.getByText('Clear All'));

    await waitFor(() => {
      expect(screen.queryByText(/Compare \d+ Plan/)).not.toBeInTheDocument();
    });
  });

  it('should dispatch comparison-updated events when plans are removed', async () => {
    const eventSpy = vi.spyOn(window, 'dispatchEvent');
    render(<ComparisonBar city="dallas" />);

    // Add a plan
    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: mockPlan1, action: 'add' }
    }));

    await waitFor(() => {
      expect(screen.getByText('Compare 1 Plan')).toBeInTheDocument();
    });

    // Remove the plan
    const removeButton = screen.getByLabelText(/Remove .* from comparison/);
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'comparison-updated',
          detail: { planId: 'plan-1', inComparison: false }
        })
      );
    });
  });

  it('should handle comparison navigation correctly', async () => {
    render(<ComparisonBar city="fort-worth" />);

    // Add two plans
    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: mockPlan1, action: 'add' }
    }));
    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: mockPlan2, action: 'add' }
    }));

    await waitFor(() => {
      expect(screen.getByText('Compare 2 Plans')).toBeInTheDocument();
    });

    // Click Compare Plans button
    const compareButton = screen.getByText('Compare Plans');
    expect(compareButton).not.toBeDisabled();
    
    fireEvent.click(compareButton);

    // Check localStorage was called correctly
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'comparisonPlans',
      expect.stringContaining('"city":"fort-worth"')
    );
    
    // Verify the stored data structure
    const storedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(storedData.plans).toHaveLength(2);
    expect(storedData.city).toBe('fort-worth');
    expect(storedData.timestamp).toBeDefined();

    // Check navigation
    expect(window.location.href).toBe('/texas/fort-worth/compare-plans');
  });

  it('should disable Compare Plans button with less than 2 plans', async () => {
    render(<ComparisonBar city="dallas" />);

    // Add one plan
    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: mockPlan1, action: 'add' }
    }));

    await waitFor(() => {
      expect(screen.getByText('Compare 1 Plan')).toBeInTheDocument();
    });

    const compareButton = screen.getByText('Compare Plans');
    expect(compareButton).toBeDisabled();
  });

  it('should handle accessibility attributes correctly', async () => {
    render(<ComparisonBar city="houston" />);

    // Add a plan
    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: mockPlan1, action: 'add' }
    }));

    await waitFor(() => {
      expect(screen.getByText('Compare 1 Plan')).toBeInTheDocument();
    });

    // Check aria-label on remove button
    const removeButton = screen.getByLabelText('Remove TXU Energy Select 12 from comparison');
    expect(removeButton).toBeInTheDocument();

    // Check aria-label on clear all button
    const clearAllButton = screen.getByLabelText('Clear all comparisons');
    expect(clearAllButton).toBeInTheDocument();
  });

  it('should format rates correctly for display', async () => {
    render(<ComparisonBar city="austin" />);

    // Add plan with specific rate
    const planWithSpecificRate = {
      ...mockPlan1,
      pricing: {
        ...mockPlan1.pricing,
        rate1000kWh: 0.12345
      }
    };

    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: planWithSpecificRate, action: 'add' }
    }));

    await waitFor(() => {
      expect(screen.getByText('12.3¢/kWh')).toBeInTheDocument(); // Should round to 1 decimal
    });
  });

  it('should handle edge cases gracefully', async () => {
    render(<ComparisonBar city="dallas" />);

    // Add plan without provider name
    const planWithoutProvider = {
      ...mockPlan1,
      provider: {
        ...mockPlan1.provider,
        name: ''
      }
    };

    fireEvent(window, new CustomEvent('compare-toggle', {
      detail: { plan: planWithoutProvider, action: 'add' }
    }));

    await waitFor(() => {
      expect(screen.getByText('Compare 1 Plan')).toBeInTheDocument();
    });

    // Should still render the plan card
    expect(screen.getByText('TXU Energy Select 12')).toBeInTheDocument();
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<ComparisonBar city="dallas" />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'compare-toggle',
      expect.any(Function)
    );
  });
});