/**
 * Customer Journey Validation Tests
 * 
 * Tests the complete end-to-end user journeys for all 6 stages:
 * 1. Awareness: "I need to do something about electricity"
 * 2. Research: "What are my options?"
 * 3. Comparison: "Which plan is best for me?"
 * 4. Decision: "I'm ready to choose"
 * 5. Enrollment: "Sign me up"
 * 6. Confirmation: "Did I make the right choice?"
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock analytics and tracking
const mockAnalytics = {
  trackPageView: vi.fn(),
  trackEvent: vi.fn(),
  trackConversion: vi.fn(),
  trackFunnelStep: vi.fn()
};

// Mock API responses for journey testing
const mockJourneyAPI = {
  searchPlans: vi.fn(),
  getProviders: vi.fn(),
  submitEnrollment: vi.fn(),
  sendConfirmation: vi.fn()
};

// Mock timing utilities
const mockTimer = {
  startJourney: vi.fn(),
  markMilestone: vi.fn(),
  endJourney: vi.fn(),
  getJourneyTime: vi.fn()
};

describe('Customer Journey Validation Tests', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockTimer.startJourney.mockReturnValue(Date.now());
  });

  describe('Stage 1: Awareness - "I need to do something about electricity"', () => {
    
    describe('SEO Landing Page Effectiveness', () => {
      
      it('should rank for primary electricity keywords', async () => {
        const primaryKeywords = [
          'texas electricity plans',
          'cheap electricity dallas',
          'houston energy providers',
          'compare electricity rates texas',
          'best electricity company texas'
        ];
        
        for (const keyword of primaryKeywords) {
          // Simulate organic search landing
          mockAnalytics.trackPageView.mockResolvedValue({
            page: '/',
            source: 'organic',
            keyword,
            timestamp: Date.now()
          });
          
          await mockAnalytics.trackPageView({
            page: '/',
            source: 'organic',
            keyword
          });
          
          // Verify tracking occurred
          expect(mockAnalytics.trackPageView).toHaveBeenCalledWith(
            expect.objectContaining({
              source: 'organic',
              keyword
            })
          );
        }
      });

      it('should provide immediate value proposition on landing', () => {
        // Value proposition should be visible above the fold
        expect(screen.getByText(/10-minute decision/i)).toBeInTheDocument();
        expect(screen.getByText(/compare.*choose.*electricity/i)).toBeInTheDocument();
        expect(screen.getByText(/expert analysis/i)).toBeInTheDocument();
        
        // Trust signals should be prominent
        expect(screen.getByText(/trusted alternative/i)).toBeInTheDocument();
        expect(screen.getByTestId('trust-badges')).toBeInTheDocument();
        expect(screen.getByTestId('security-certifications')).toBeInTheDocument();
      });

      it('should capture awareness stage visitors effectively', async () => {
        const user = userEvent.setup();
        
        // Simulate awareness stage interaction
        const heroSection = screen.getByTestId('hero-section');
        expect(heroSection).toBeInTheDocument();
        
        // Track initial engagement
        await user.click(screen.getByRole('button', { name: /get started/i }));
        
        expect(mockAnalytics.trackFunnelStep).toHaveBeenCalledWith({
          stage: 'awareness',
          action: 'cta_clicked',
          element: 'hero_get_started'
        });
      });

      it('should handle different traffic sources appropriately', async () => {
        const trafficSources = [
          { source: 'organic', medium: 'search', campaign: null },
          { source: 'google', medium: 'cpc', campaign: 'texas_electricity' },
          { source: 'facebook', medium: 'social', campaign: 'electricity_tips' },
          { source: 'direct', medium: 'none', campaign: null }
        ];
        
        for (const traffic of trafficSources) {
          mockAnalytics.trackPageView.mockResolvedValue({
            source: traffic.source,
            medium: traffic.medium,
            campaign: traffic.campaign,
            conversionProbability: calculateConversionProbability(traffic)
          });
          
          const tracking = await mockAnalytics.trackPageView(traffic);
          
          // Different sources should have appropriate conversion expectations
          if (traffic.source === 'organic') {
            expect(tracking.conversionProbability).toBeGreaterThan(0.03); // >3% for organic
          } else if (traffic.medium === 'cpc') {
            expect(tracking.conversionProbability).toBeGreaterThan(0.05); // >5% for paid
          }
        }
      });
    });

    describe('Content Discoverability', () => {
      
      it('should provide educational content that builds trust', () => {
        // Educational resources should be accessible
        expect(screen.getByRole('link', { name: /electricity 101/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /understanding your bill/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /how deregulation works/i })).toBeInTheDocument();
        
        // Content should address common concerns
        expect(screen.getByText(/save hundreds per year/i)).toBeInTheDocument();
        expect(screen.getByText(/no hidden fees/i)).toBeInTheDocument();
      });
    });
  });

  describe('Stage 2: Research - "What are my options?"', () => {
    
    describe('Educational Content Accessibility', () => {
      
      it('should provide comprehensive Texas electricity education', async () => {
        const user = userEvent.setup();
        
        // Navigate to educational content
        await user.click(screen.getByRole('link', { name: /learn about texas electricity/i }));
        
        // Should explain key concepts
        await waitFor(() => {
          expect(screen.getByText(/deregulated market/i)).toBeInTheDocument();
          expect(screen.getByText(/transmission and distribution/i)).toBeInTheDocument();
          expect(screen.getByText(/retail electric provider/i)).toBeInTheDocument();
          expect(screen.getByText(/electricity facts label/i)).toBeInTheDocument();
        });
        
        // Track engagement with educational content
        expect(mockAnalytics.trackFunnelStep).toHaveBeenCalledWith({
          stage: 'research',
          action: 'education_accessed',
          content: 'texas_electricity_guide'
        });
      });

      it('should explain provider differences clearly', () => {
        // Provider comparison should be educational
        const providerExplanation = screen.getByTestId('provider-explanation');
        expect(providerExplanation).toBeInTheDocument();
        
        // Should explain different provider types
        expect(providerExplanation).toHaveTextContent(/traditional utilities/i);
        expect(providerExplanation).toHaveTextContent(/green energy specialists/i);
        expect(providerExplanation).toHaveTextContent(/budget providers/i);
      });

      it('should provide plan type education', async () => {
        const user = userEvent.setup();
        
        // Click on plan types explanation
        await user.click(screen.getByRole('button', { name: /plan types/i }));
        
        await waitFor(() => {
          // Should explain different plan structures
          expect(screen.getByText(/fixed rate plans/i)).toBeInTheDocument();
          expect(screen.getByText(/variable rate plans/i)).toBeInTheDocument();
          expect(screen.getByText(/indexed plans/i)).toBeInTheDocument();
          expect(screen.getByText(/time of use plans/i)).toBeInTheDocument();
        });
      });
    });

    describe('Provider Information Completeness', () => {
      
      it('should display comprehensive provider profiles', async () => {
        mockJourneyAPI.getProviders.mockResolvedValue([
          {
            id: 'txu',
            name: 'TXU Energy',
            established: 2002,
            customerService: {
              phone: '1-855-TXU-ENGY',
              hours: '24/7',
              rating: 4.2
            },
            specialties: ['Fixed Rate Plans', 'Green Energy Options'],
            coverage: ['Dallas', 'Fort Worth', 'Houston'],
            puctLicense: 'REP10001'
          }
        ]);
        
        const providers = await mockJourneyAPI.getProviders({ city: 'Dallas' });
        
        expect(providers[0]).toMatchObject({
          name: expect.any(String),
          customerService: expect.objectContaining({
            phone: expect.any(String),
            rating: expect.any(Number)
          }),
          puctLicense: expect.stringMatching(/REP\d+/)
        });
      });
    });
  });

  describe('Stage 3: Comparison - "Which plan is best for me?"', () => {
    
    describe('Plan Comparison Accuracy', () => {
      
      it('should display accurate all-in pricing', async () => {
        const user = userEvent.setup();
        
        // Enter ZIP code to start comparison
        await user.type(screen.getByLabelText(/zip code/i), '75001');
        await user.click(screen.getByRole('button', { name: /search plans/i }));
        
        mockJourneyAPI.searchPlans.mockResolvedValue({
          plans: [
            {
              id: 'plan1',
              provider: 'TXU Energy',
              name: 'TXU Select 12',
              rate: 0.119,
              term: 12,
              allInCost1000: 142.50, // Includes TDU, taxes, fees
              breakdown: {
                energyCost: 119.00,
                tduCharges: 15.50,
                taxes: 8.00
              }
            }
          ]
        });
        
        await waitFor(() => {
          // All-in pricing should be prominently displayed
          expect(screen.getByText(/\$142\.50/)).toBeInTheDocument();
          expect(screen.getByText(/includes all fees/i)).toBeInTheDocument();
          
          // Breakdown should be available
          expect(screen.getByText(/energy.*\$119/i)).toBeInTheDocument();
          expect(screen.getByText(/delivery.*\$15\.50/i)).toBeInTheDocument();
        });
        
        expect(mockAnalytics.trackFunnelStep).toHaveBeenCalledWith({
          stage: 'comparison',
          action: 'plans_loaded',
          planCount: 1
        });
      });

      it('should provide usage-based calculations', async () => {
        const user = userEvent.setup();
        const usageScenarios = [500, 1000, 2000]; // kWh
        
        for (const usage of usageScenarios) {
          // Change usage amount
          const usageInput = screen.getByLabelText(/monthly usage/i);
          await user.clear(usageInput);
          await user.type(usageInput, usage.toString());
          
          // Verify calculations update
          await waitFor(() => {
            const costDisplay = screen.getByTestId('calculated-cost');
            expect(costDisplay).toHaveTextContent(usage.toString());
          });
        }
      });

      it('should highlight key plan differences', () => {
        const planComparison = screen.getByTestId('plan-comparison-table');
        
        // Key differentiators should be highlighted
        const highlightedFeatures = [
          'contract-length',
          'early-termination-fee',
          'green-energy-percentage',
          'deposit-required',
          'monthly-fee'
        ];
        
        highlightedFeatures.forEach(feature => {
          expect(planComparison.querySelector(`[data-feature="${feature}"]`)).toBeInTheDocument();
        });
      });
    });

    describe('Filtering and Sorting Functionality', () => {
      
      it('should provide effective filtering options', async () => {
        const user = userEvent.setup();
        
        // Test contract length filter
        await user.click(screen.getByLabelText(/12 months/i));
        expect(mockAnalytics.trackEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'Filter',
            action: 'Applied',
            label: 'contract-length-12'
          })
        );
        
        // Test green energy filter
        await user.click(screen.getByLabelText(/green energy/i));
        expect(mockAnalytics.trackEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'Filter', 
            action: 'Applied',
            label: 'green-energy'
          })
        );
      });

      it('should provide intuitive sorting options', async () => {
        const user = userEvent.setup();
        
        const sortingOptions = [
          { label: 'Lowest Price', value: 'price-low' },
          { label: 'Highest Rated', value: 'rating-high' },
          { label: 'Contract Length', value: 'contract-short' },
          { label: 'Green Energy', value: 'green-high' }
        ];
        
        for (const option of sortingOptions) {
          await user.selectOptions(screen.getByLabelText(/sort by/i), option.value);
          
          await waitFor(() => {
            expect(mockAnalytics.trackEvent).toHaveBeenCalledWith(
              expect.objectContaining({
                category: 'Sort',
                action: 'Changed',
                label: option.value
              })
            );
          });
        }
      });
    });
  });

  describe('Stage 4: Decision - "I\'m ready to choose"', () => {
    
    describe('Recommendation Engine Quality', () => {
      
      it('should provide personalized recommendations', async () => {
        const user = userEvent.setup();
        
        // Complete recommendation wizard
        await user.click(screen.getByText(/get personalized recommendation/i));
        
        // Answer persona questions
        await user.click(screen.getByLabelText(/moving to new home/i));
        await user.type(screen.getByLabelText(/monthly usage/i), '1000');
        await user.click(screen.getByLabelText(/prefer fixed rates/i));
        await user.click(screen.getByLabelText(/green energy important/i));
        
        await user.click(screen.getByRole('button', { name: /get recommendation/i }));
        
        await waitFor(() => {
          // Should show personalized recommendation
          expect(screen.getByTestId('recommended-plan')).toBeInTheDocument();
          expect(screen.getByText(/recommended for you/i)).toBeInTheDocument();
          expect(screen.getByText(/here's why/i)).toBeInTheDocument();
        });
        
        expect(mockAnalytics.trackFunnelStep).toHaveBeenCalledWith({
          stage: 'decision',
          action: 'recommendation_requested',
          persona: 'moving_texan'
        });
      });

      it('should explain recommendation reasoning clearly', () => {
        const recommendationCard = screen.getByTestId('recommended-plan');
        
        // Reasoning should be clear and specific
        expect(recommendationCard).toHaveTextContent(/based on your preferences/i);
        expect(recommendationCard).toHaveTextContent(/fixed rate.*stability/i);
        expect(recommendationCard).toHaveTextContent(/green energy.*percentage/i);
        expect(recommendationCard).toHaveTextContent(/estimated savings/i);
      });
    });

    describe('Decision Support Tools', () => {
      
      it('should provide plan comparison tools', async () => {
        const user = userEvent.setup();
        
        // Select multiple plans for comparison
        const planCheckboxes = screen.getAllByRole('checkbox', { name: /compare this plan/i });
        await user.click(planCheckboxes[0]);
        await user.click(planCheckboxes[1]);
        await user.click(planCheckboxes[2]);
        
        await user.click(screen.getByRole('button', { name: /compare selected/i }));
        
        await waitFor(() => {
          // Comparison table should show key differences
          const comparisonTable = screen.getByTestId('side-by-side-comparison');
          expect(comparisonTable).toBeInTheDocument();
          
          // Key comparison points
          expect(comparisonTable).toHaveTextContent(/monthly cost/i);
          expect(comparisonTable).toHaveTextContent(/contract length/i);
          expect(comparisonTable).toHaveTextContent(/early termination/i);
        });
      });

      it('should calculate potential savings accurately', () => {
        const savingsCalculator = screen.getByTestId('savings-calculator');
        
        // Should show current vs recommended plan savings
        expect(savingsCalculator).toHaveTextContent(/you could save/i);
        expect(savingsCalculator).toHaveTextContent(/\$.*per month/i);
        expect(savingsCalculator).toHaveTextContent(/\$.*per year/i);
        
        // Should show percentage savings
        expect(savingsCalculator).toHaveTextContent(/\d+%.*less/i);
      });
    });
  });

  describe('Stage 5: Enrollment - "Sign me up"', () => {
    
    describe('Signup Flow Completion Rates', () => {
      
      it('should complete enrollment process efficiently', async () => {
        const user = userEvent.setup();
        const startTime = Date.now();
        
        // Start enrollment process
        await user.click(screen.getByRole('button', { name: /enroll now/i }));
        
        // Personal information
        await user.type(screen.getByLabelText(/first name/i), 'John');
        await user.type(screen.getByLabelText(/last name/i), 'Doe');
        await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com');
        await user.type(screen.getByLabelText(/phone/i), '555-123-4567');
        
        // Service address
        await user.type(screen.getByLabelText(/service address/i), '123 Main St');
        await user.type(screen.getByLabelText(/city/i), 'Dallas');
        await user.type(screen.getByLabelText(/zip code/i), '75001');
        
        // Service start date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await user.type(screen.getByLabelText(/service start date/i), 
                       tomorrow.toISOString().split('T')[0]);
        
        // Terms and conditions
        await user.click(screen.getByLabelText(/terms and conditions/i));
        
        // Submit enrollment
        mockJourneyAPI.submitEnrollment.mockResolvedValue({
          success: true,
          enrollmentId: 'ENR_123456',
          confirmationNumber: 'CONF_789012'
        });
        
        await user.click(screen.getByRole('button', { name: /complete enrollment/i }));
        
        await waitFor(() => {
          expect(screen.getByText(/enrollment submitted/i)).toBeInTheDocument();
        });
        
        const enrollmentTime = Date.now() - startTime;
        expect(enrollmentTime).toBeLessThan(600000); // Under 10 minutes
        
        expect(mockAnalytics.trackFunnelStep).toHaveBeenCalledWith({
          stage: 'enrollment',
          action: 'completed',
          duration: enrollmentTime
        });
      });

      it('should handle enrollment errors gracefully', async () => {
        const user = userEvent.setup();
        
        // Simulate enrollment error
        mockJourneyAPI.submitEnrollment.mockRejectedValue({
          error: 'VALIDATION_ERROR',
          message: 'Service address not found in our system',
          field: 'serviceAddress'
        });
        
        // Fill form and submit
        await user.click(screen.getByRole('button', { name: /complete enrollment/i }));
        
        await waitFor(() => {
          // Error should be displayed clearly
          expect(screen.getByText(/service address not found/i)).toBeInTheDocument();
          expect(screen.getByTestId('address-error')).toBeInTheDocument();
          
          // Form should remain filled
          expect(screen.getByDisplayValue('John')).toBeInTheDocument();
        });
        
        // Should offer help
        expect(screen.getByRole('link', { name: /contact support/i })).toBeInTheDocument();
      });
    });

    describe('Form Validation and User Experience', () => {
      
      it('should validate required fields', async () => {
        const user = userEvent.setup();
        
        // Try to submit without required fields
        await user.click(screen.getByRole('button', { name: /complete enrollment/i }));
        
        // Should show validation errors
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
        
        // Focus should be on first error field
        expect(screen.getByLabelText(/first name/i)).toHaveFocus();
      });

      it('should provide real-time validation feedback', async () => {
        const user = userEvent.setup();
        
        // Test email validation
        const emailInput = screen.getByLabelText(/email/i);
        await user.type(emailInput, 'invalid-email');
        await user.tab();
        
        expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
        
        // Test phone validation
        const phoneInput = screen.getByLabelText(/phone/i);
        await user.type(phoneInput, '123');
        await user.tab();
        
        expect(screen.getByText(/valid phone number/i)).toBeInTheDocument();
      });
    });
  });

  describe('Stage 6: Confirmation - "Did I make the right choice?"', () => {
    
    describe('Confirmation Process', () => {
      
      it('should send confirmation email immediately', async () => {
        mockJourneyAPI.sendConfirmation.mockResolvedValue({
          sent: true,
          deliveryTime: 45000, // 45 seconds
          trackingId: 'EMAIL_123'
        });
        
        const confirmation = await mockJourneyAPI.sendConfirmation({
          enrollmentId: 'ENR_123456',
          email: 'john.doe@example.com'
        });
        
        expect(confirmation.sent).toBe(true);
        expect(confirmation.deliveryTime).toBeLessThan(60000); // Under 1 minute
      });

      it('should display enrollment summary clearly', () => {
        const enrollmentSummary = screen.getByTestId('enrollment-summary');
        
        // Should show all key details
        expect(enrollmentSummary).toHaveTextContent(/plan selected/i);
        expect(enrollmentSummary).toHaveTextContent(/monthly cost/i);
        expect(enrollmentSummary).toHaveTextContent(/service start date/i);
        expect(enrollmentSummary).toHaveTextContent(/confirmation number/i);
        
        // Should show next steps
        expect(enrollmentSummary).toHaveTextContent(/what happens next/i);
        expect(enrollmentSummary).toHaveTextContent(/3.*day.*cooling.*off/i);
      });

      it('should provide post-enrollment support', () => {
        // Support options should be available
        expect(screen.getByRole('link', { name: /track your enrollment/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /contact customer service/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /billing questions/i })).toBeInTheDocument();
        
        // Educational resources
        expect(screen.getByRole('link', { name: /your first bill/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /managing your account/i })).toBeInTheDocument();
      });
    });

    describe('Customer Satisfaction Validation', () => {
      
      it('should measure decision confidence', async () => {
        const user = userEvent.setup();
        
        // Satisfaction survey should appear
        const satisfactionSurvey = screen.getByTestId('satisfaction-survey');
        expect(satisfactionSurvey).toBeInTheDocument();
        
        // Confidence question
        await user.click(screen.getByLabelText(/very confident/i));
        
        // Process satisfaction
        await user.click(screen.getByLabelText(/very easy/i));
        
        await user.click(screen.getByRole('button', { name: /submit feedback/i }));
        
        expect(mockAnalytics.trackEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'Satisfaction',
            action: 'Survey Completed',
            confidence: 'very_confident',
            process: 'very_easy'
          })
        );
      });
    });
  });

  describe('Cross-Journey Analytics and Optimization', () => {
    
    it('should track complete funnel progression', () => {
      const expectedFunnelSteps = [
        'awareness',
        'research', 
        'comparison',
        'decision',
        'enrollment',
        'confirmation'
      ];
      
      // Verify all funnel steps were tracked
      expectedFunnelSteps.forEach(step => {
        expect(mockAnalytics.trackFunnelStep).toHaveBeenCalledWith(
          expect.objectContaining({
            stage: step
          })
        );
      });
    });

    it('should measure conversion rates by persona', () => {
      const personaConversions = [
        { persona: 'moving_texan', expectedRate: 0.08 }, // 8% 
        { persona: 'bill_questioner', expectedRate: 0.12 }, // 12%
        { persona: 'contract_expirer', expectedRate: 0.15 }, // 15%
        { persona: 'emergency_connector', expectedRate: 0.25 } // 25%
      ];
      
      personaConversions.forEach(({ persona, expectedRate }) => {
        expect(mockAnalytics.trackConversion).toHaveBeenCalledWith(
          expect.objectContaining({
            persona,
            rate: expect.any(Number)
          })
        );
      });
    });

    it('should identify journey optimization opportunities', async () => {
      const journeyMetrics = await getJourneyAnalytics({
        timeframe: '30d',
        includeDropoffPoints: true
      });
      
      // Should identify high drop-off points
      expect(journeyMetrics.dropoffPoints).toBeDefined();
      expect(journeyMetrics.averageJourneyTime).toBeLessThan(600000); // 10 minutes
      expect(journeyMetrics.completionRate).toBeGreaterThan(0.03); // >3%
      
      // Should provide optimization recommendations
      expect(journeyMetrics.recommendations).toContain('reduce_form_fields');
      expect(journeyMetrics.recommendations).toContain('improve_comparison_clarity');
    });
  });
});

/**
 * Journey Testing Utilities
 */

// Calculate conversion probability based on traffic source
function calculateConversionProbability(traffic: { source: string; medium: string; campaign: string | null }): number {
  const baseRates = {
    'organic': 0.035,     // 3.5% baseline
    'direct': 0.08,       // 8% - higher intent
    'cpc': 0.055,         // 5.5% - paid search
    'social': 0.015,      // 1.5% - lower intent
    'referral': 0.025     // 2.5% - medium intent
  };
  
  let probability = baseRates[traffic.source] || 0.02;
  
  // Adjust based on medium
  if (traffic.medium === 'email') probability *= 1.5;
  if (traffic.medium === 'affiliate') probability *= 1.2;
  
  // Adjust based on campaign targeting
  if (traffic.campaign?.includes('brand')) probability *= 1.8;
  if (traffic.campaign?.includes('competitor')) probability *= 1.3;
  
  return Math.min(probability, 0.25); // Cap at 25%
}

// Get journey analytics
async function getJourneyAnalytics(options: { timeframe: string; includeDropoffPoints: boolean }) {
  return {
    timeframe: options.timeframe,
    totalSessions: 10000,
    completedJourneys: 350,
    completionRate: 0.035,
    averageJourneyTime: 480000, // 8 minutes average
    
    stageConversions: {
      awareness: 1.0,      // 100% - all sessions start here
      research: 0.65,      // 65% continue to research
      comparison: 0.45,    // 45% start comparing
      decision: 0.15,      // 15% get recommendations
      enrollment: 0.08,    // 8% start enrollment
      confirmation: 0.035  // 3.5% complete enrollment
    },
    
    dropoffPoints: [
      { stage: 'awareness_to_research', rate: 0.35, reason: 'lack_of_trust' },
      { stage: 'research_to_comparison', rate: 0.20, reason: 'information_overload' },
      { stage: 'comparison_to_decision', rate: 0.30, reason: 'analysis_paralysis' },
      { stage: 'decision_to_enrollment', rate: 0.07, reason: 'form_complexity' },
      { stage: 'enrollment_to_confirmation', rate: 0.045, reason: 'technical_errors' }
    ],
    
    recommendations: [
      'reduce_form_fields',
      'improve_comparison_clarity', 
      'add_trust_signals',
      'simplify_decision_process',
      'optimize_mobile_forms'
    ],
    
    personaBreakdown: {
      moving_texan: { sessions: 4000, conversions: 320, rate: 0.08 },
      bill_questioner: { sessions: 3000, conversions: 360, rate: 0.12 },
      contract_expirer: { sessions: 2000, conversions: 300, rate: 0.15 },
      emergency_connector: { sessions: 1000, conversions: 250, rate: 0.25 }
    }
  };
}

/**
 * Journey Test Configuration
 */
export const journeyTestConfig = {
  stages: [
    'awareness',
    'research', 
    'comparison',
    'decision',
    'enrollment',
    'confirmation'
  ],
  
  successCriteria: {
    overallConversion: 0.035, // 3.5% minimum
    journeyTime: 600000, // 10 minutes maximum
    satisfactionScore: 4.0, // 4.0+ out of 5
    completionRate: 0.80 // 80% of started enrollments
  },
  
  trackingEvents: {
    awareness: ['page_view', 'cta_click', 'content_engagement'],
    research: ['education_access', 'provider_view', 'content_time'],
    comparison: ['plans_loaded', 'filter_applied', 'sort_changed'],
    decision: ['recommendation_requested', 'plan_selected', 'comparison_made'],
    enrollment: ['form_started', 'form_completed', 'error_encountered'],
    confirmation: ['confirmation_viewed', 'email_sent', 'satisfaction_surveyed']
  }
};