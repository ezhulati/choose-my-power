/**
 * Customer Persona Validation Tests
 * 
 * Tests based on the 4 primary user personas from customer requirements:
 * 1. The Moving Texan (40% of users)
 * 2. The Bill Questioner (30% of users) 
 * 3. The Contract Expirer (20% of users)
 * 4. The Emergency Connector (10% of users)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock components and services
const mockZipSearch = vi.fn();
const mockProviderResults = vi.fn();
const mockBillAnalyzer = vi.fn();
const mockSavingsCalculator = vi.fn();

describe('Customer Persona Validation Tests', () => {
  
  describe('Persona 1: The Moving Texan (40% of users)', () => {
    const persona = {
      name: 'The Moving Texan',
      demographic: 'Age 25-45, household income $40-80K',
      scenario: 'Moving to new apartment/home',
      goal: 'Get power connected by move-in date',
      painPoints: ['Time pressure', 'No account number yet', 'Overwhelmed by choices'],
      successMetric: 'Account activated before move-in'
    };

    describe('Success Metric: Account activated before move-in', () => {
      
      it('should allow ZIP code search without existing account', async () => {
        const user = userEvent.setup();
        
        // Test ZIP code search functionality
        const zipInput = screen.getByPlaceholderText(/enter your zip code/i);
        await user.type(zipInput, '75001'); // Dallas area ZIP
        
        const searchButton = screen.getByRole('button', { name: /search/i });
        await user.click(searchButton);
        
        await waitFor(() => {
          expect(mockZipSearch).toHaveBeenCalledWith('75001');
        });
        
        // Verify results show providers for the ZIP
        expect(screen.getByText(/electricity providers in/i)).toBeInTheDocument();
        expect(screen.getByText(/75001/)).toBeInTheDocument();
      });

      it('should complete enrollment in under 10 minutes', async () => {
        const startTime = Date.now();
        const user = userEvent.setup();
        
        // Simulate full enrollment flow
        // 1. ZIP code search (target: <30 seconds)
        await user.type(screen.getByPlaceholderText(/zip code/i), '75001');
        await user.click(screen.getByRole('button', { name: /search/i }));
        
        // 2. Plan selection (target: <2 minutes)
        await waitFor(() => {
          expect(screen.getByText(/select a plan/i)).toBeInTheDocument();
        });
        
        const firstPlan = screen.getByTestId('plan-card-0');
        await user.click(firstPlan);
        
        // 3. Service start date selection (target: <1 minute)
        const moveInDate = new Date();
        moveInDate.setDate(moveInDate.getDate() + 7); // 1 week from now
        
        const dateInput = screen.getByLabelText(/move-in date/i);
        await user.type(dateInput, moveInDate.toISOString().split('T')[0]);
        
        // 4. Personal information (target: <3 minutes)
        await user.type(screen.getByLabelText(/first name/i), 'John');
        await user.type(screen.getByLabelText(/last name/i), 'Doe');
        await user.type(screen.getByLabelText(/phone/i), '555-123-4567');
        await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com');
        
        // 5. Address confirmation (target: <2 minutes)
        await user.type(screen.getByLabelText(/address/i), '123 Main St');
        await user.type(screen.getByLabelText(/city/i), 'Dallas');
        
        // 6. Enrollment submission (target: <1 minute)
        const submitButton = screen.getByRole('button', { name: /complete enrollment/i });
        await user.click(submitButton);
        
        // Verify enrollment completion
        await waitFor(() => {
          expect(screen.getByText(/enrollment complete/i)).toBeInTheDocument();
        });
        
        const enrollmentTime = (Date.now() - startTime) / 1000;
        expect(enrollmentTime).toBeLessThan(600); // 10 minutes = 600 seconds
      });

      it('should prioritize mobile experience for time-pressed users', () => {
        // Test mobile viewport (375px width - iPhone SE)
        Object.defineProperty(window, 'innerWidth', { value: 375 });
        Object.defineProperty(window, 'innerHeight', { value: 667 });
        
        // Verify mobile-first design elements
        const zipSearch = screen.getByTestId('mobile-zip-search');
        expect(zipSearch).toHaveClass('mobile-optimized');
        
        // Verify touch-friendly buttons (44px minimum)
        const searchButton = screen.getByRole('button', { name: /search/i });
        const buttonStyle = window.getComputedStyle(searchButton);
        expect(parseInt(buttonStyle.height)).toBeGreaterThanOrEqual(44);
        expect(parseInt(buttonStyle.width)).toBeGreaterThanOrEqual(44);
      });

      it('should show clear progress indicators to reduce anxiety', () => {
        // Verify enrollment progress is visible
        expect(screen.getByTestId('enrollment-progress')).toBeInTheDocument();
        
        // Check step indicators
        expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();
        
        // Verify estimated time remaining
        expect(screen.getByText(/approximately.*minutes remaining/i)).toBeInTheDocument();
      });
    });
  });

  describe('Persona 2: The Bill Questioner (30% of users)', () => {
    const persona = {
      name: 'The Bill Questioner',
      demographic: 'Age 35-65, household income $50-100K',
      scenario: 'Received high electricity bill',
      goal: 'Verify they\'re not being overcharged',
      painPoints: ['Don\'t understand bill', 'Feel scammed', 'Want validation'],
      successMetric: 'Confidence in current plan or switch to better rate'
    };

    describe('Success Metric: Confidence in current plan or switch to better rate', () => {
      
      it('should analyze uploaded bills accurately', async () => {
        const user = userEvent.setup();
        
        // Mock bill file upload
        const billFile = new File(['mock bill content'], 'electric-bill.pdf', { 
          type: 'application/pdf' 
        });
        
        const fileInput = screen.getByLabelText(/upload your bill/i);
        await user.upload(fileInput, billFile);
        
        // Wait for bill analysis
        await waitFor(() => {
          expect(mockBillAnalyzer).toHaveBeenCalledWith(billFile);
        });
        
        // Verify bill breakdown is displayed
        expect(screen.getByText(/your current rate/i)).toBeInTheDocument();
        expect(screen.getByText(/energy charges/i)).toBeInTheDocument();
        expect(screen.getByText(/delivery charges/i)).toBeInTheDocument();
        expect(screen.getByText(/taxes and fees/i)).toBeInTheDocument();
      });

      it('should show accurate savings calculations', async () => {
        // Mock current bill data
        const currentBill = {
          rate: 0.12, // 12 cents per kWh
          usage: 1000, // kWh
          totalCost: 142.50,
          breakdown: {
            energy: 120.00,
            delivery: 15.00,
            taxes: 7.50
          }
        };
        
        mockBillAnalyzer.mockResolvedValue(currentBill);
        
        // Trigger savings calculation
        const calculateButton = screen.getByRole('button', { name: /calculate savings/i });
        await userEvent.click(calculateButton);
        
        await waitFor(() => {
          expect(mockSavingsCalculator).toHaveBeenCalledWith(currentBill);
        });
        
        // Verify savings information is displayed
        expect(screen.getByText(/you could save/i)).toBeInTheDocument();
        expect(screen.getByText(/\$.*per month/i)).toBeInTheDocument();
        expect(screen.getByText(/\$.*per year/i)).toBeInTheDocument();
      });

      it('should provide bill education and explanations', () => {
        // Verify educational content is available
        expect(screen.getByText(/understanding your bill/i)).toBeInTheDocument();
        expect(screen.getByText(/what is a tdsp charge/i)).toBeInTheDocument();
        expect(screen.getByText(/why bills vary by month/i)).toBeInTheDocument();
        
        // Verify glossary access
        const glossaryLink = screen.getByRole('link', { name: /electricity terms/i });
        expect(glossaryLink).toHaveAttribute('href', expect.stringContaining('glossary'));
      });

      it('should validate current plan against market rates', async () => {
        const currentPlan = {
          provider: 'TXU Energy',
          rate: 0.12,
          contractEnd: '2024-12-31'
        };
        
        // Simulate plan validation
        const validateButton = screen.getByRole('button', { name: /check my plan/i });
        await userEvent.click(validateButton);
        
        await waitFor(() => {
          // Should show market comparison
          expect(screen.getByText(/market comparison/i)).toBeInTheDocument();
          expect(screen.getByText(/your current rate:/i)).toBeInTheDocument();
          expect(screen.getByText(/average market rate:/i)).toBeInTheDocument();
        });
        
        // Verify recommendations
        expect(screen.getByText(/(keep current plan|consider switching)/i)).toBeInTheDocument();
      });
    });
  });

  describe('Persona 3: The Contract Expirer (20% of users)', () => {
    const persona = {
      name: 'The Contract Expirer',
      demographic: 'Age 30-60, household income $60-120K',
      scenario: 'Received renewal notice',
      goal: 'Decide whether to renew or switch',
      painPoints: ['Analysis paralysis', 'Fear of making wrong choice'],
      successMetric: 'Make confident renewal/switch decision'
    };

    describe('Success Metric: Make confident renewal/switch decision', () => {
      
      it('should compare renewal rates with market alternatives', async () => {
        const renewalOffer = {
          provider: 'Reliant Energy',
          renewalRate: 0.14, // 14 cents per kWh
          currentRate: 0.11,
          contractEnd: new Date('2024-12-31')
        };
        
        // Enter renewal information
        await userEvent.type(screen.getByLabelText(/current provider/i), renewalOffer.provider);
        await userEvent.type(screen.getByLabelText(/renewal rate/i), renewalOffer.renewalRate.toString());
        
        const compareButton = screen.getByRole('button', { name: /compare renewal/i });
        await userEvent.click(compareButton);
        
        // Verify comparison results
        await waitFor(() => {
          expect(screen.getByText(/renewal vs market/i)).toBeInTheDocument();
          expect(screen.getByText(/current rate.*11.*cents/i)).toBeInTheDocument();
          expect(screen.getByText(/renewal rate.*14.*cents/i)).toBeInTheDocument();
        });
        
        // Should show better alternatives
        expect(screen.getByText(/better options available/i)).toBeInTheDocument();
      });

      it('should calculate early termination fees if applicable', () => {
        // Test ETF calculation
        const etfCalculator = screen.getByTestId('etf-calculator');
        expect(etfCalculator).toBeInTheDocument();
        
        // Input contract details
        const contractEndInput = screen.getByLabelText(/contract end date/i);
        const etfAmountInput = screen.getByLabelText(/early termination fee/i);
        
        expect(contractEndInput).toBeInTheDocument();
        expect(etfAmountInput).toBeInTheDocument();
      });

      it('should provide clear renew vs switch recommendations', async () => {
        const user = userEvent.setup();
        
        // Complete decision wizard
        await user.click(screen.getByLabelText(/i received a renewal notice/i));
        await user.type(screen.getByLabelText(/monthly usage/i), '1000');
        await user.type(screen.getByLabelText(/current rate/i), '0.11');
        await user.type(screen.getByLabelText(/renewal rate/i), '0.14');
        
        const getRecommendationButton = screen.getByRole('button', { name: /get recommendation/i });
        await user.click(getRecommendationButton);
        
        await waitFor(() => {
          // Should provide clear recommendation
          expect(screen.getByTestId('recommendation-result')).toBeInTheDocument();
          expect(screen.getByText(/(recommend switching|recommend renewing)/i)).toBeInTheDocument();
          
          // Should show reasoning
          expect(screen.getByText(/here's why/i)).toBeInTheDocument();
          expect(screen.getByText(/potential savings/i)).toBeInTheDocument();
        });
      });

      it('should display contract terms comparison clearly', () => {
        // Verify side-by-side comparison
        expect(screen.getByTestId('contract-comparison')).toBeInTheDocument();
        
        // Check comparison categories
        expect(screen.getByText(/contract length/i)).toBeInTheDocument();
        expect(screen.getByText(/rate type/i)).toBeInTheDocument();
        expect(screen.getByText(/early termination fee/i)).toBeInTheDocument();
        expect(screen.getByText(/green energy/i)).toBeInTheDocument();
        expect(screen.getByText(/deposit required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Persona 4: The Emergency Connector (10% of users)', () => {
    const persona = {
      name: 'The Emergency Connector',
      demographic: 'Age 20-50, variable income',
      scenario: 'Power disconnected or about to be',
      goal: 'Get power restored immediately',
      painPoints: ['Credit issues', 'Deposit requirements', 'Urgency'],
      successMetric: 'Same-day power restoration'
    };

    describe('Success Metric: Same-day power restoration', () => {
      
      it('should highlight same-day service providers prominently', () => {
        // Filter for emergency/same-day service
        const emergencyFilter = screen.getByLabelText(/same-day service/i);
        expect(emergencyFilter).toBeInTheDocument();
        
        // Verify emergency providers are highlighted
        const emergencyProviders = screen.getAllByTestId('emergency-provider');
        expect(emergencyProviders.length).toBeGreaterThan(0);
        
        // Check for prominent "Same Day Service" badges
        emergencyProviders.forEach(provider => {
          expect(provider).toHaveTextContent(/same.*day/i);
        });
      });

      it('should prominently feature no-deposit prepaid plans', () => {
        // Verify prepaid filter is available and prominent
        const prepaidFilter = screen.getByLabelText(/no deposit required/i);
        expect(prepaidFilter).toBeInTheDocument();
        expect(prepaidFilter.closest('.filter-group')).toHaveClass('emergency-highlighted');
        
        // Check prepaid plans are featured
        const prepaidPlans = screen.getAllByTestId('prepaid-plan');
        expect(prepaidPlans.length).toBeGreaterThan(0);
        
        prepaidPlans.forEach(plan => {
          expect(plan).toHaveTextContent(/no deposit/i);
          expect(plan).toHaveTextContent(/prepaid/i);
        });
      });

      it('should show credit check alternatives clearly', () => {
        // Verify no-credit-check options are available
        const noCreditOptions = screen.getAllByText(/no credit check/i);
        expect(noCreditOptions.length).toBeGreaterThan(0);
        
        // Check for prepaid and co-signer alternatives
        expect(screen.getByText(/prepaid options/i)).toBeInTheDocument();
        expect(screen.getByText(/co-signer programs/i)).toBeInTheDocument();
      });

      it('should provide immediate contact information for emergencies', () => {
        // Emergency contact section should be prominent
        const emergencyContacts = screen.getByTestId('emergency-contacts');
        expect(emergencyContacts).toBeInTheDocument();
        
        // Direct phone numbers should be clickable
        const phoneLinks = screen.getAllByRole('link', { name: /call now/i });
        expect(phoneLinks.length).toBeGreaterThan(0);
        
        phoneLinks.forEach(link => {
          expect(link).toHaveAttribute('href', expect.stringMatching(/tel:\+1/));
        });
      });

      it('should calculate and display deposit amounts transparently', async () => {
        const user = userEvent.setup();
        
        // Enter basic information for deposit calculation
        await user.type(screen.getByLabelText(/estimated monthly usage/i), '800');
        await user.selectOptions(screen.getByLabelText(/credit score range/i), 'poor');
        
        const calculateDeposit = screen.getByRole('button', { name: /calculate deposit/i });
        await user.click(calculateDeposit);
        
        // Should show deposit amounts by provider
        await waitFor(() => {
          const depositCalculations = screen.getByTestId('deposit-calculations');
          expect(depositCalculations).toBeInTheDocument();
          
          // Should show specific dollar amounts
          expect(screen.getByText(/\$\d+/)).toBeInTheDocument();
          
          // Should highlight no-deposit options
          expect(screen.getByText(/\$0 deposit/i)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Cross-Persona Value Proposition Testing', () => {
    
    it('should deliver 10-minute decision vs 3-hour research promise', async () => {
      const startTime = Date.now();
      const user = userEvent.setup();
      
      // Simulate efficient decision flow
      // 1. ZIP search (30 seconds)
      await user.type(screen.getByPlaceholderText(/zip code/i), '77002');
      await user.click(screen.getByRole('button', { name: /search/i }));
      
      // 2. Quick recommendation (2 minutes)
      await user.click(screen.getByText(/get recommendation/i));
      
      // 3. Plan selection (3 minutes)
      await user.click(screen.getByTestId('recommended-plan'));
      
      // 4. Decision confirmation (4 minutes)
      await user.click(screen.getByRole('button', { name: /choose this plan/i }));
      
      const decisionTime = (Date.now() - startTime) / 1000;
      expect(decisionTime).toBeLessThan(600); // 10 minutes
      
      // Verify comprehensive information was provided
      expect(screen.getByText(/you've made an informed choice/i)).toBeInTheDocument();
    });

    it('should demonstrate government-level trust with superior UX', () => {
      // Trust indicators should be visible
      expect(screen.getByText(/how we make money/i)).toBeInTheDocument();
      expect(screen.getByTestId('ssl-badge')).toBeInTheDocument();
      expect(screen.getByTestId('bbb-rating')).toBeInTheDocument();
      
      // Superior UX elements
      expect(screen.getByTestId('progress-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('help-chat')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-optimized')).toHaveClass('responsive');
    });

    it('should provide educational-first approach building confidence', () => {
      // Educational content should be prominent
      expect(screen.getByRole('link', { name: /electricity 101/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /understanding your bill/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /glossary/i })).toBeInTheDocument();
      
      // Tooltips and explanations should be available
      const helpIcons = screen.getAllByTestId('help-tooltip');
      expect(helpIcons.length).toBeGreaterThan(5);
    });

    it('should show unbiased comparisons with transparent affiliate model', () => {
      // Affiliate disclosure should be clear
      expect(screen.getByText(/affiliate disclosure/i)).toBeInTheDocument();
      expect(screen.getByText(/we may earn a commission/i)).toBeInTheDocument();
      
      // All-inclusive pricing should be displayed
      const planCards = screen.getAllByTestId('plan-card');
      planCards.forEach(card => {
        expect(card).toHaveTextContent(/all-in price/i);
        expect(card).toHaveTextContent(/includes all fees/i);
      });
      
      // No preference should be shown for higher commission plans
      const featuredPlans = screen.queryAllByText(/featured/i);
      expect(featuredPlans).toHaveLength(0); // No artificial featuring
    });
  });
});

/**
 * Test Data and Mocks
 */
export const mockPersonaData = {
  movingTexan: {
    zipCode: '75001',
    moveInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    urgency: 'high',
    hasAccountNumber: false
  },
  billQuestioner: {
    currentBill: {
      amount: 142.50,
      usage: 1000,
      provider: 'TXU Energy',
      rate: 0.12
    },
    concerns: ['high bill', 'rate increase', 'hidden fees']
  },
  contractExpirer: {
    currentContract: {
      provider: 'Reliant Energy',
      rate: 0.11,
      renewalRate: 0.14,
      endDate: '2024-12-31',
      etf: 150
    }
  },
  emergencyConnector: {
    situation: 'disconnected',
    creditScore: 'poor',
    urgency: 'critical',
    depositConcern: true
  }
};

export const mockProviders = [
  {
    id: 'txu',
    name: 'TXU Energy',
    sameDayService: true,
    prepaidAvailable: true,
    noCreditCheck: false,
    depositRequired: true,
    rates: [0.11, 0.12, 0.13]
  },
  {
    id: 'reliant', 
    name: 'Reliant Energy',
    sameDayService: false,
    prepaidAvailable: true,
    noCreditCheck: true,
    depositRequired: false,
    rates: [0.10, 0.11, 0.14]
  }
];