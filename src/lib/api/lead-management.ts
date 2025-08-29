/**
 * Lead Management System for ChooseMyPower
 * Comprehensive lead capture, scoring, and nurturing system
 * Features:
 * - Lead capture from multiple sources
 * - Intelligent lead scoring
 * - Email notifications and CRM integration
 * - Lead nurturing sequences
 * - Conversion tracking and analytics
 */

import type { Lead, PlanComparison } from '../database/schema';
import { planRepository } from '../database/plan-repository';

export interface LeadFormData {
  zipCode: string;
  citySlug?: string;
  monthlyUsage?: number;
  currentRate?: number;
  preferredContractLength?: number;
  greenEnergyPreference?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  utmSource?: string;
  utmCampaign?: string;
  utmMedium?: string;
  utmContent?: string;
  sessionId?: string;
  planComparisons?: string[]; // Plan IDs the user compared
}

export interface LeadQualificationData {
  hasContact: boolean;
  hasPreferences: boolean;
  engagementScore: number;
  intentScore: number;
  demographicScore: number;
}

export interface LeadScoringConfig {
  contactInfo: {
    email: number;
    phone: number;
    both: number;
  };
  preferences: {
    monthlyUsage: number;
    currentRate: number;
    contractLength: number;
    greenEnergy: number;
  };
  engagement: {
    planComparisons: number;
    timeOnSite: number;
    pagesViewed: number;
    returnVisitor: number;
  };
  intent: {
    highUsage: number;
    lowCurrentRate: number;
    specificPreferences: number;
  };
  utm: {
    paidSearch: number;
    organic: number;
    directTraffic: number;
    referral: number;
  };
}

export class LeadManagementService {
  private scoringConfig: LeadScoringConfig = {
    contactInfo: {
      email: 25,
      phone: 20,
      both: 35,
    },
    preferences: {
      monthlyUsage: 10,
      currentRate: 15,
      contractLength: 5,
      greenEnergy: 5,
    },
    engagement: {
      planComparisons: 20,
      timeOnSite: 10,
      pagesViewed: 5,
      returnVisitor: 10,
    },
    intent: {
      highUsage: 15,
      lowCurrentRate: 10,
      specificPreferences: 10,
    },
    utm: {
      paidSearch: 10,
      organic: 5,
      directTraffic: 3,
      referral: 7,
    },
  };

  /**
   * Capture lead from form submission
   */
  async captureLead(formData: LeadFormData): Promise<{
    leadId: string;
    score: number;
    status: Lead['status'];
    recommendations?: any[];
  }> {
    try {
      // Get engagement data if session ID provided
      let engagementData = null;
      if (formData.sessionId) {
        engagementData = await this.getEngagementData(formData.sessionId);
      }

      // Calculate lead score
      const score = this.calculateLeadScore(formData, engagementData);
      
      // Determine initial status based on score
      const status = this.determineLeadStatus(score, formData);

      // Create lead record
      const leadId = await this.createLeadRecord({
        zip_code: formData.zipCode,
        city_slug: formData.citySlug,
        monthly_usage: formData.monthlyUsage,
        current_rate: formData.currentRate,
        preferred_contract_length: formData.preferredContractLength,
        green_energy_preference: formData.greenEnergyPreference || false,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        utm_source: formData.utmSource,
        utm_campaign: formData.utmCampaign,
        utm_medium: formData.utmMedium,
        utm_content: formData.utmContent,
        status,
        score,
        notes: this.generateLeadNotes(formData, engagementData, score),
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Get plan recommendations
      const recommendations = await this.generateRecommendations(formData);

      // Store plan comparison if provided
      if (formData.sessionId && formData.planComparisons?.length) {
        await this.storePlanComparison(formData.sessionId, formData.planComparisons, formData.citySlug);
      }

      // Send notifications for high-quality leads
      if (score >= 70) {
        await this.sendLeadNotification(leadId, score, status);
      }

      // Start nurturing sequence
      if (formData.contactEmail) {
        await this.startNurturingSequence(leadId, formData.contactEmail, recommendations);
      }

      return {
        leadId,
        score,
        status,
        recommendations,
      };

    } catch (error) {
      console.error('Lead capture failed:', error);
      throw new Error('Failed to capture lead');
    }
  }

  /**
   * Calculate comprehensive lead score
   */
  private calculateLeadScore(
    formData: LeadFormData,
    engagementData?: any
  ): number {
    let score = 0;

    // Contact information scoring
    if (formData.contactEmail && formData.contactPhone) {
      score += this.scoringConfig.contactInfo.both;
    } else if (formData.contactEmail) {
      score += this.scoringConfig.contactInfo.email;
    } else if (formData.contactPhone) {
      score += this.scoringConfig.contactInfo.phone;
    }

    // Preferences scoring
    if (formData.monthlyUsage) {
      score += this.scoringConfig.preferences.monthlyUsage;
    }
    if (formData.currentRate) {
      score += this.scoringConfig.preferences.currentRate;
    }
    if (formData.preferredContractLength) {
      score += this.scoringConfig.preferences.contractLength;
    }
    if (formData.greenEnergyPreference) {
      score += this.scoringConfig.preferences.greenEnergy;
    }

    // Engagement scoring
    if (engagementData) {
      if (engagementData.planComparisons > 0) {
        score += Math.min(this.scoringConfig.engagement.planComparisons, 
          engagementData.planComparisons * 5);
      }
      if (engagementData.timeOnSite > 300) { // 5 minutes
        score += this.scoringConfig.engagement.timeOnSite;
      }
      if (engagementData.pagesViewed > 3) {
        score += this.scoringConfig.engagement.pagesViewed;
      }
      if (engagementData.isReturnVisitor) {
        score += this.scoringConfig.engagement.returnVisitor;
      }
    }

    // Intent scoring
    if (formData.monthlyUsage && formData.monthlyUsage > 1500) {
      score += this.scoringConfig.intent.highUsage;
    }
    if (formData.currentRate && formData.currentRate > 0.12) {
      score += this.scoringConfig.intent.lowCurrentRate;
    }
    if (formData.preferredContractLength && formData.greenEnergyPreference !== undefined) {
      score += this.scoringConfig.intent.specificPreferences;
    }

    // UTM scoring
    switch (formData.utmSource?.toLowerCase()) {
      case 'google':
      case 'bing':
        score += this.scoringConfig.utm.paidSearch;
        break;
      case 'organic':
        score += this.scoringConfig.utm.organic;
        break;
      case 'direct':
        score += this.scoringConfig.utm.directTraffic;
        break;
      case 'referral':
        score += this.scoringConfig.utm.referral;
        break;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Determine lead status based on score and data quality
   */
  private determineLeadStatus(score: number, formData: LeadFormData): Lead['status'] {
    if (score >= 80 && (formData.contactEmail || formData.contactPhone)) {
      return 'qualified';
    } else if (score >= 60) {
      return 'new';
    } else if (!formData.contactEmail && !formData.contactPhone) {
      return 'unqualified';
    }
    return 'new';
  }

  /**
   * Generate descriptive notes for the lead
   */
  private generateLeadNotes(
    formData: LeadFormData,
    engagementData?: any,
    score?: number
  ): string {
    const notes: string[] = [];

    notes.push(`Lead Score: ${score}/100`);

    if (formData.monthlyUsage) {
      notes.push(`Monthly Usage: ${formData.monthlyUsage} kWh`);
    }
    if (formData.currentRate) {
      notes.push(`Current Rate: ${(formData.currentRate * 100).toFixed(2)}¢/kWh`);
    }
    if (formData.preferredContractLength) {
      notes.push(`Preferred Term: ${formData.preferredContractLength} months`);
    }
    if (formData.greenEnergyPreference) {
      notes.push('Interested in green energy');
    }

    if (engagementData) {
      if (engagementData.planComparisons > 0) {
        notes.push(`Compared ${engagementData.planComparisons} plans`);
      }
      if (engagementData.timeOnSite > 300) {
        notes.push(`High engagement: ${Math.round(engagementData.timeOnSite / 60)} minutes on site`);
      }
      if (engagementData.isReturnVisitor) {
        notes.push('Return visitor');
      }
    }

    if (formData.utmSource) {
      notes.push(`Source: ${formData.utmSource}`);
      if (formData.utmCampaign) {
        notes.push(`Campaign: ${formData.utmCampaign}`);
      }
    }

    return notes.join('; ');
  }

  /**
   * Create lead record in database
   */
  private async createLeadRecord(leadData: Omit<Lead, 'id'>): Promise<string> {
    // This would use your database connection
    // For now, using a placeholder implementation
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store in database (implement with your DB client)
    await planRepository.storeLead(leadData);
    
    return leadId;
  }

  /**
   * Get engagement data for a session
   */
  private async getEngagementData(sessionId: string): Promise<{
    planComparisons: number;
    timeOnSite: number;
    pagesViewed: number;
    isReturnVisitor: boolean;
  }> {
    // Implement database queries to get engagement data
    return {
      planComparisons: 0,
      timeOnSite: 0,
      pagesViewed: 1,
      isReturnVisitor: false,
    };
  }

  /**
   * Generate personalized plan recommendations
   */
  private async generateRecommendations(formData: LeadFormData): Promise<any[]> {
    try {
      const params = {
        tdsp_duns: await this.getTdspFromZip(formData.zipCode),
        term: formData.preferredContractLength,
        percent_green: formData.greenEnergyPreference ? 100 : 0,
        display_usage: formData.monthlyUsage || 1000,
      };

      // Get plans from the existing API client
      const plans = await planRepository.getPlansFromCache(params);
      
      if (!plans || plans.length === 0) {
        return [];
      }

      // Sort by value for the user's usage
      const sortedPlans = plans
        .filter(plan => {
          // Filter by user preferences
          if (formData.preferredContractLength && plan.contract.length !== formData.preferredContractLength) {
            return false;
          }
          if (formData.greenEnergyPreference && plan.features.greenEnergy < 50) {
            return false;
          }
          return true;
        })
        .sort((a, b) => {
          // Sort by total cost for user's usage
          const usageKey = formData.monthlyUsage || 1000;
          const aTotal = this.calculateTotalForUsage(a, usageKey);
          const bTotal = this.calculateTotalForUsage(b, usageKey);
          return aTotal - bTotal;
        })
        .slice(0, 3); // Top 3 recommendations

      return sortedPlans.map(plan => ({
        planId: plan.id,
        providerName: plan.provider.name,
        planName: plan.name,
        rate: plan.pricing.ratePerKwh,
        monthlyCost: this.calculateTotalForUsage(plan, formData.monthlyUsage || 1000),
        contractLength: plan.contract.length,
        greenEnergy: plan.features.greenEnergy,
        features: this.extractKeyFeatures(plan),
      }));

    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      return [];
    }
  }

  /**
   * Calculate total cost for specific usage
   */
  private calculateTotalForUsage(plan: any, usage: number): number {
    // Use the closest usage tier or interpolate
    if (usage <= 500) {
      return plan.pricing.total500kWh || (plan.pricing.ratePerKwh * usage) / 100;
    } else if (usage <= 1000) {
      return plan.pricing.total1000kWh || (plan.pricing.ratePerKwh * usage) / 100;
    } else if (usage <= 2000) {
      return plan.pricing.total2000kWh || (plan.pricing.ratePerKwh * usage) / 100;
    } else {
      // Extrapolate for higher usage
      return (plan.pricing.ratePerKwh * usage) / 100;
    }
  }

  /**
   * Extract key features for recommendations
   */
  private extractKeyFeatures(plan: any): string[] {
    const features: string[] = [];
    
    if (plan.features.greenEnergy > 0) {
      features.push(`${plan.features.greenEnergy}% Green Energy`);
    }
    if (plan.contract.type === 'fixed') {
      features.push('Fixed Rate');
    }
    if (!plan.features.deposit.required) {
      features.push('No Deposit');
    }
    if (plan.features.billCredit > 0) {
      features.push(`$${plan.features.billCredit} Bill Credit`);
    }
    if (plan.features.freeTime) {
      features.push('Free Electricity Hours');
    }
    if (plan.contract.earlyTerminationFee === 0) {
      features.push('No Early Termination Fee');
    }

    return features;
  }

  /**
   * Get TDSP DUNS from ZIP code
   */
  private async getTdspFromZip(zipCode: string): Promise<string> {
    // Implement ZIP to TDSP mapping logic
    // For now, return a default TDSP
    return '007929441'; // Default TDSP
  }

  /**
   * Store plan comparison session
   */
  private async storePlanComparison(
    sessionId: string,
    planIds: string[],
    citySlug?: string
  ): Promise<void> {
    const comparisonData: Omit<PlanComparison, 'id'> = {
      session_id: sessionId,
      plan_ids: planIds,
      city_slug: citySlug,
      filters_applied: {},
      created_at: new Date(),
    };

    // Store in database
    await planRepository.storePlanComparison(comparisonData);
  }

  /**
   * Send notification for high-quality leads
   */
  private async sendLeadNotification(
    leadId: string,
    score: number,
    status: Lead['status']
  ): Promise<void> {
    try {
      // Email notification to sales team
      const emailData = {
        to: process.env.SALES_TEAM_EMAIL || 'sales@choosemypower.org',
        subject: `New ${status} Lead (Score: ${score}/100)`,
        body: `
          New lead captured with high score:
          
          Lead ID: ${leadId}
          Score: ${score}/100
          Status: ${status}
          
          View lead details in CRM dashboard.
        `,
      };

      // Send email (implement with your email service)
      await this.sendEmail(emailData);

      // Webhook notification to CRM systems
      if (process.env.CRM_WEBHOOK_URL) {
        await this.sendCrmWebhook({
          leadId,
          score,
          status,
          timestamp: new Date().toISOString(),
        });
      }

    } catch (error) {
      console.error('Failed to send lead notification:', error);
      // Don't throw - notification failure shouldn't break lead capture
    }
  }

  /**
   * Start email nurturing sequence
   */
  private async startNurturingSequence(
    leadId: string,
    email: string,
    recommendations: any[]
  ): Promise<void> {
    try {
      // Welcome email with recommendations
      await this.sendEmail({
        to: email,
        subject: 'Your Texas Electricity Plan Recommendations',
        template: 'lead-welcome',
        data: {
          leadId,
          recommendations,
          unsubscribeUrl: `${process.env.SITE_URL}/unsubscribe?lead=${leadId}`,
        },
      });

      // Schedule follow-up emails (implement with your email service)
      await this.scheduleNurturingEmails(leadId, email);

    } catch (error) {
      console.error('Failed to start nurturing sequence:', error);
    }
  }

  /**
   * Schedule follow-up emails
   */
  private async scheduleNurturingEmails(leadId: string, email: string): Promise<void> {
    // Implement email scheduling logic
    // Day 1: Welcome + recommendations (sent immediately)
    // Day 3: Educational content about electricity deregulation
    // Day 7: Market update and new plan alerts
    // Day 14: Seasonal energy saving tips
    // Day 30: Final follow-up with updated recommendations
  }

  /**
   * Send email (integrate with your email service)
   */
  private async sendEmail(emailData: {
    to: string;
    subject: string;
    body?: string;
    template?: string;
    data?: any;
  }): Promise<void> {
    // Implement email sending logic
    console.log('Email would be sent:', emailData);
  }

  /**
   * Send webhook to CRM systems
   */
  private async sendCrmWebhook(data: any): Promise<void> {
    try {
      await fetch(process.env.CRM_WEBHOOK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('CRM webhook failed:', error);
    }
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(
    leadId: string,
    status: Lead['status'],
    notes?: string
  ): Promise<void> {
    await planRepository.updateLead(leadId, {
      status,
      notes: notes ? `${new Date().toISOString()}: ${notes}` : undefined,
      updated_at: new Date(),
    });
  }

  /**
   * Get lead analytics
   */
  async getLeadAnalytics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalLeads: number;
    qualifiedLeads: number;
    conversionRate: number;
    averageScore: number;
    leadsBySource: Record<string, number>;
    leadsByStatus: Record<string, number>;
  }> {
    return planRepository.getLeadAnalytics(timeframe);
  }

  /**
   * Get leads for CRM export
   */
  async getLeadsForExport(
    filters?: {
      status?: Lead['status'];
      minScore?: number;
      dateFrom?: Date;
      dateTo?: Date;
      utmSource?: string;
    }
  ): Promise<Lead[]> {
    return planRepository.getLeadsWithFilters(filters);
  }
}

// Export singleton instance
export const leadManagementService = new LeadManagementService();

// Export types for external use
export type { LeadFormData, LeadQualificationData, LeadScoringConfig };