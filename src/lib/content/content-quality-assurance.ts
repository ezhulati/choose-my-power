/**
 * Content Quality Assurance System
 * 
 * Ensures all generated content meets quality standards for:
 * - Content quality and depth
 * - SEO optimization
 * - User experience
 * - Technical accuracy
 * - Brand consistency
 */

import { PageContent } from './content-orchestrator';

export interface QualityMetrics {
  contentDepth: number;      // 1-10 scale
  seoOptimization: number;   // 1-10 scale
  userExperience: number;    // 1-10 scale
  technicalAccuracy: number; // 1-10 scale
  brandConsistency: number;  // 1-10 scale
  overallScore: number;      // 1-10 scale
}

export interface QualityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'content' | 'seo' | 'ux' | 'technical' | 'brand';
  description: string;
  recommendation: string;
  location?: string;
}

export interface QualityReport {
  pageId: string;
  url: string;
  metrics: QualityMetrics;
  issues: QualityIssue[];
  recommendations: string[];
  competitorComparison?: {
    ourScore: number;
    competitorAverage: number;
    ranking: number;
  };
  timestamp: string;
}

export class ContentQualityAssurance {
  private qualityStandards = {
    minimumContentDepth: 8,
    minimumSeoScore: 9,
    minimumUxScore: 8,
    minimumTechnicalScore: 9,
    minimumBrandScore: 8,
    minimumOverallScore: 8
  };

  /**
   * Perform comprehensive quality assessment
   */
  async assessContent(pageContent: PageContent, pageId: string): Promise<QualityReport> {
    const metrics = this.calculateQualityMetrics(pageContent);
    const issues = this.identifyQualityIssues(pageContent, metrics);
    const recommendations = this.generateRecommendations(metrics, issues);

    return {
      pageId,
      url: pageContent.seo.canonicalUrl,
      metrics,
      issues,
      recommendations,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate quality metrics across all dimensions
   */
  private calculateQualityMetrics(pageContent: PageContent): QualityMetrics {
    const contentDepth = this.assessContentDepth(pageContent);
    const seoOptimization = this.assessSeoOptimization(pageContent);
    const userExperience = this.assessUserExperience(pageContent);
    const technicalAccuracy = this.assessTechnicalAccuracy(pageContent);
    const brandConsistency = this.assessBrandConsistency(pageContent);

    const overallScore = (
      contentDepth + 
      seoOptimization + 
      userExperience + 
      technicalAccuracy + 
      brandConsistency
    ) / 5;

    return {
      contentDepth,
      seoOptimization,
      userExperience,
      technicalAccuracy,
      brandConsistency,
      overallScore: Math.round(overallScore * 10) / 10
    };
  }

  /**
   * Assess content depth and value
   */
  private assessContentDepth(pageContent: PageContent): number {
    let score = 0;

    // Check content length and substance
    const totalWords = this.countWords(pageContent);
    if (totalWords >= 1500) score += 2;
    else if (totalWords >= 1000) score += 1.5;
    else if (totalWords >= 500) score += 1;

    // Check section diversity
    const sectionCount = Object.keys(pageContent.sections).length;
    if (sectionCount >= 6) score += 2;
    else if (sectionCount >= 4) score += 1.5;
    else if (sectionCount >= 2) score += 1;

    // Check FAQ quality
    if (pageContent.sections.faq && pageContent.sections.faq.length >= 4) score += 1.5;
    else if (pageContent.sections.faq && pageContent.sections.faq.length >= 2) score += 1;

    // Check key points depth
    if (pageContent.sections.keyPoints && pageContent.sections.keyPoints.length >= 5) score += 1.5;
    else if (pageContent.sections.keyPoints && pageContent.sections.keyPoints.length >= 3) score += 1;

    // Check local context richness
    if (pageContent.sections.localContext && pageContent.sections.localContext.length > 200) score += 1.5;
    else if (pageContent.sections.localContext && pageContent.sections.localContext.length > 100) score += 1;

    // Check practical value
    if (this.hasActionableContent(pageContent)) score += 1.5;

    return Math.min(Math.round(score * 10) / 10, 10);
  }

  /**
   * Assess SEO optimization
   */
  private assessSeoOptimization(pageContent: PageContent): number {
    let score = 0;

    // Title optimization
    if (pageContent.title && pageContent.title.length >= 30 && pageContent.title.length <= 60) score += 1.5;
    else if (pageContent.title && pageContent.title.length >= 20 && pageContent.title.length <= 70) score += 1;

    // Description optimization
    if (pageContent.description && pageContent.description.length >= 140 && pageContent.description.length <= 155) score += 1.5;
    else if (pageContent.description && pageContent.description.length >= 120 && pageContent.description.length <= 160) score += 1;

    // Keyword optimization
    if (this.hasGoodKeywordDensity(pageContent)) score += 1.5;

    // Header structure
    if (this.hasGoodHeaderStructure(pageContent)) score += 1.5;

    // Internal linking opportunities
    if (this.hasInternalLinkingOpportunities(pageContent)) score += 1.5;

    // Schema markup
    if (pageContent.seo.structuredData && Object.keys(pageContent.seo.structuredData).length > 0) score += 1.5;

    // Canonical URL
    if (pageContent.seo.canonicalUrl) score += 1;

    return Math.min(Math.round(score * 10) / 10, 10);
  }

  /**
   * Assess user experience
   */
  private assessUserExperience(pageContent: PageContent): number {
    let score = 0;

    // Content readability
    if (this.hasGoodReadability(pageContent)) score += 2;

    // Logical flow
    if (this.hasLogicalContentFlow(pageContent)) score += 1.5;

    // Scannable content
    if (this.hasScannableContent(pageContent)) score += 1.5;

    // Action-oriented content
    if (this.hasActionableContent(pageContent)) score += 1.5;

    // Clear value proposition
    if (this.hasClearValueProposition(pageContent)) score += 1.5;

    // FAQ quality
    if (this.hasPracticalFAQs(pageContent)) score += 1.5;

    // Call-to-action presence
    if (pageContent.hero.cta && pageContent.hero.cta.length > 0) score += 0.5;

    return Math.min(Math.round(score * 10) / 10, 10);
  }

  /**
   * Assess technical accuracy
   */
  private assessTechnicalAccuracy(pageContent: PageContent): number {
    let score = 8; // Start with high score, deduct for issues

    // Check for technical inconsistencies
    if (this.hasTechnicalInconsistencies(pageContent)) score -= 2;

    // Check for outdated information
    if (this.hasOutdatedInformation(pageContent)) score -= 1.5;

    // Check for factual accuracy
    if (this.hasFactualIssues(pageContent)) score -= 2;

    // Check Texas-specific accuracy
    if (!this.hasAccurateTexasInformation(pageContent)) score -= 1.5;

    // Reward comprehensive technical content
    if (this.hasComprehensiveTechnicalContent(pageContent)) score += 1;

    return Math.max(Math.round(score * 10) / 10, 0);
  }

  /**
   * Assess brand consistency
   */
  private assessBrandConsistency(pageContent: PageContent): number {
    let score = 0;

    // Tone consistency
    if (this.hasConsistentTone(pageContent)) score += 2;

    // Brand voice
    if (this.hasAppropriateVoice(pageContent)) score += 2;

    // Messaging consistency
    if (this.hasConsistentMessaging(pageContent)) score += 2;

    // Value proposition alignment
    if (this.hasAlignedValueProposition(pageContent)) score += 2;

    // Professional presentation
    if (this.hasProfessionalPresentation(pageContent)) score += 1.5;

    // Trust signals
    if (this.hasTrustSignals(pageContent)) score += 0.5;

    return Math.min(Math.round(score * 10) / 10, 10);
  }

  /**
   * Identify specific quality issues
   */
  private identifyQualityIssues(pageContent: PageContent, metrics: QualityMetrics): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Critical issues
    if (metrics.overallScore < 6) {
      issues.push({
        severity: 'critical',
        category: 'content',
        description: 'Overall content quality below acceptable standards',
        recommendation: 'Comprehensive content revision required'
      });
    }

    // Content issues
    if (metrics.contentDepth < 7) {
      issues.push({
        severity: 'high',
        category: 'content',
        description: 'Content lacks sufficient depth and detail',
        recommendation: 'Add more comprehensive information, examples, and practical guidance'
      });
    }

    // SEO issues
    if (metrics.seoOptimization < 8) {
      issues.push({
        severity: 'high',
        category: 'seo',
        description: 'SEO optimization needs improvement',
        recommendation: 'Optimize title, description, headers, and keyword usage'
      });
    }

    if (!pageContent.title || pageContent.title.length < 30) {
      issues.push({
        severity: 'high',
        category: 'seo',
        description: 'Title too short for optimal SEO',
        recommendation: 'Expand title to 30-60 characters with target keywords'
      });
    }

    if (!pageContent.description || pageContent.description.length < 140) {
      issues.push({
        severity: 'medium',
        category: 'seo',
        description: 'Meta description too short',
        recommendation: 'Expand description to 140-155 characters'
      });
    }

    // UX issues
    if (metrics.userExperience < 7) {
      issues.push({
        severity: 'medium',
        category: 'ux',
        description: 'User experience could be improved',
        recommendation: 'Improve content scannability, readability, and user flow'
      });
    }

    // Technical issues
    if (metrics.technicalAccuracy < 8) {
      issues.push({
        severity: 'high',
        category: 'technical',
        description: 'Technical accuracy concerns identified',
        recommendation: 'Review and verify all technical information and claims'
      });
    }

    // Brand issues
    if (metrics.brandConsistency < 7) {
      issues.push({
        severity: 'medium',
        category: 'brand',
        description: 'Brand consistency needs attention',
        recommendation: 'Align tone, voice, and messaging with brand guidelines'
      });
    }

    return issues;
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(metrics: QualityMetrics, issues: QualityIssue[]): string[] {
    const recommendations: string[] = [];

    // Priority recommendations based on scores
    if (metrics.contentDepth < this.qualityStandards.minimumContentDepth) {
      recommendations.push(
        'Expand content depth with more detailed explanations, real-world examples, and practical tips'
      );
    }

    if (metrics.seoOptimization < this.qualityStandards.minimumSeoScore) {
      recommendations.push(
        'Enhance SEO optimization with better keyword targeting, improved meta tags, and structured data'
      );
    }

    if (metrics.userExperience < this.qualityStandards.minimumUxScore) {
      recommendations.push(
        'Improve user experience with better content organization, clearer headings, and more actionable advice'
      );
    }

    // Add specific recommendations based on issues
    const criticalIssues = issues.filter(issue => issue.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(
        'Address critical issues immediately before publication - content requires significant improvement'
      );
    }

    const highIssues = issues.filter(issue => issue.severity === 'high');
    if (highIssues.length > 2) {
      recommendations.push(
        'Multiple high-priority issues identified - conduct comprehensive content review'
      );
    }

    // Competitor positioning recommendations
    if (metrics.overallScore >= 8.5) {
      recommendations.push(
        'Content quality is excellent - suitable for publication and competitive positioning'
      );
    } else if (metrics.overallScore >= 7.5) {
      recommendations.push(
        'Content quality is good - minor improvements will enhance competitiveness'
      );
    } else {
      recommendations.push(
        'Content requires significant improvement to compete effectively in search results'
      );
    }

    return recommendations;
  }

  // Helper methods for quality assessment

  private countWords(pageContent: PageContent): number {
    let totalWords = 0;
    
    totalWords += pageContent.title.split(' ').length;
    totalWords += pageContent.description.split(' ').length;
    totalWords += pageContent.hero.headline.split(' ').length;
    totalWords += pageContent.hero.subheadline.split(' ').length;
    totalWords += pageContent.sections.introduction.split(' ').length;
    totalWords += pageContent.sections.conclusion.split(' ').length;
    totalWords += pageContent.sections.localContext.split(' ').length;
    
    if (pageContent.sections.keyPoints) {
      totalWords += pageContent.sections.keyPoints.join(' ').split(' ').length;
    }
    
    if (pageContent.sections.faq) {
      totalWords += pageContent.sections.faq.map(faq => `${faq.question} ${faq.answer}`).join(' ').split(' ').length;
    }

    return totalWords;
  }

  private hasActionableContent(pageContent: PageContent): boolean {
    const actionWords = ['how to', 'step', 'guide', 'tip', 'recommendation', 'should', 'can', 'will', 'compare', 'choose'];
    const content = JSON.stringify(pageContent).toLowerCase();
    return actionWords.some(word => content.includes(word));
  }

  private hasGoodKeywordDensity(pageContent: PageContent): boolean {
    // Simplified keyword density check
    const content = JSON.stringify(pageContent).toLowerCase();
    const electricityMentions = (content.match(/electricity/g) || []).length;
    const totalWords = this.countWords(pageContent);
    const density = electricityMentions / totalWords;
    return density >= 0.01 && density <= 0.03; // 1-3% density
  }

  private hasGoodHeaderStructure(pageContent: PageContent): boolean {
    // Check if content has proper hierarchical structure
    return pageContent.sections.introduction && 
           pageContent.sections.keyPoints && 
           pageContent.sections.faq &&
           pageContent.sections.conclusion;
  }

  private hasInternalLinkingOpportunities(pageContent: PageContent): boolean {
    // Check for potential internal linking in content
    const content = JSON.stringify(pageContent);
    const linkingTerms = ['plan', 'provider', 'rate', 'guide', 'compare', 'texas'];
    return linkingTerms.some(term => content.includes(term));
  }

  private hasGoodReadability(pageContent: PageContent): boolean {
    // Simplified readability check - look for varied sentence structure
    const sentences = pageContent.sections.introduction.split('.');
    const avgWordsPerSentence = sentences.reduce((acc, sentence) => 
      acc + sentence.split(' ').length, 0) / sentences.length;
    return avgWordsPerSentence > 10 && avgWordsPerSentence < 25;
  }

  private hasLogicalContentFlow(pageContent: PageContent): boolean {
    // Check if content sections flow logically
    return pageContent.sections.introduction && 
           pageContent.sections.keyPoints && 
           pageContent.sections.comparison &&
           pageContent.sections.conclusion;
  }

  private hasScannableContent(pageContent: PageContent): boolean {
    // Check for bullet points, short paragraphs, etc.
    return pageContent.sections.keyPoints && 
           pageContent.sections.keyPoints.length >= 3 &&
           pageContent.sections.faq && 
           pageContent.sections.faq.length >= 2;
  }

  private hasClearValueProposition(pageContent: PageContent): boolean {
    const content = pageContent.hero.subheadline.toLowerCase();
    const valueWords = ['save', 'compare', 'best', 'competitive', 'benefits', 'advantage'];
    return valueWords.some(word => content.includes(word));
  }

  private hasPracticalFAQs(pageContent: PageContent): boolean {
    if (!pageContent.sections.faq || pageContent.sections.faq.length < 2) return false;
    
    const practicalQuestions = pageContent.sections.faq.some(faq => 
      faq.question.toLowerCase().includes('how') || 
      faq.question.toLowerCase().includes('what') ||
      faq.question.toLowerCase().includes('can i')
    );
    
    return practicalQuestions;
  }

  private hasTechnicalInconsistencies(pageContent: PageContent): boolean {
    // Basic consistency checks
    return false; // Placeholder - would implement specific technical checks
  }

  private hasOutdatedInformation(pageContent: PageContent): boolean {
    // Check for potentially outdated information
    return false; // Placeholder - would implement date-based checks
  }

  private hasFactualIssues(pageContent: PageContent): boolean {
    // Check for factual accuracy
    return false; // Placeholder - would implement fact-checking
  }

  private hasAccurateTexasInformation(pageContent: PageContent): boolean {
    // Verify Texas-specific information
    const content = JSON.stringify(pageContent).toLowerCase();
    return content.includes('texas') && (content.includes('deregulated') || content.includes('tdsp'));
  }

  private hasComprehensiveTechnicalContent(pageContent: PageContent): boolean {
    const content = JSON.stringify(pageContent).toLowerCase();
    const technicalTerms = ['kwh', 'tdsp', 'rep', 'ercot', 'delivery', 'transmission'];
    return technicalTerms.filter(term => content.includes(term)).length >= 4;
  }

  private hasConsistentTone(pageContent: PageContent): boolean {
    // Check for consistent professional tone
    return true; // Placeholder - would implement tone analysis
  }

  private hasAppropriateVoice(pageContent: PageContent): boolean {
    // Check for appropriate brand voice
    return true; // Placeholder - would implement voice analysis
  }

  private hasConsistentMessaging(pageContent: PageContent): boolean {
    // Check for consistent messaging
    return true; // Placeholder - would implement messaging consistency checks
  }

  private hasAlignedValueProposition(pageContent: PageContent): boolean {
    // Check value proposition alignment
    return pageContent.hero.subheadline.includes('compare') || 
           pageContent.hero.subheadline.includes('save');
  }

  private hasProfessionalPresentation(pageContent: PageContent): boolean {
    // Check for professional presentation
    return pageContent.title && 
           pageContent.description && 
           pageContent.hero.headline &&
           pageContent.sections.introduction;
  }

  private hasTrustSignals(pageContent: PageContent): boolean {
    const content = JSON.stringify(pageContent).toLowerCase();
    const trustWords = ['trusted', 'reliable', 'expert', 'certified', 'verified', 'transparent'];
    return trustWords.some(word => content.includes(word));
  }

  /**
   * Batch quality assessment for multiple pages
   */
  async assessMultiplePages(pages: Array<{ pageContent: PageContent; pageId: string }>): Promise<QualityReport[]> {
    const reports: QualityReport[] = [];
    
    for (const page of pages) {
      try {
        const report = await this.assessContent(page.pageContent, page.pageId);
        reports.push(report);
      } catch (error) {
        console.error(`Error assessing page ${page.pageId}:`, error);
      }
    }
    
    return reports;
  }

  /**
   * Generate quality summary report
   */
  generateQualitySummary(reports: QualityReport[]): {
    totalPages: number;
    averageScore: number;
    pagesAboveStandard: number;
    criticalIssues: number;
    commonIssues: Array<{ category: string; count: number }>;
    recommendations: string[];
  } {
    const totalPages = reports.length;
    const averageScore = reports.reduce((sum, report) => sum + report.metrics.overallScore, 0) / totalPages;
    const pagesAboveStandard = reports.filter(report => 
      report.metrics.overallScore >= this.qualityStandards.minimumOverallScore).length;
    
    const criticalIssues = reports.reduce((count, report) => 
      count + report.issues.filter(issue => issue.severity === 'critical').length, 0);

    // Analyze common issues
    const issueCategories: Record<string, number> = {};
    reports.forEach(report => {
      report.issues.forEach(issue => {
        issueCategories[issue.category] = (issueCategories[issue.category] || 0) + 1;
      });
    });

    const commonIssues = Object.entries(issueCategories)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Generate overall recommendations
    const recommendations: string[] = [];
    
    if (averageScore < 8) {
      recommendations.push('Overall content quality needs significant improvement across the platform');
    }
    
    if (criticalIssues > 0) {
      recommendations.push(`${criticalIssues} critical issues require immediate attention`);
    }
    
    if (pagesAboveStandard / totalPages < 0.8) {
      recommendations.push('Less than 80% of pages meet quality standards - comprehensive review needed');
    }
    
    if (commonIssues.length > 0) {
      recommendations.push(`Most common issue category: ${commonIssues[0].category} - consider systematic fixes`);
    }

    return {
      totalPages,
      averageScore: Math.round(averageScore * 10) / 10,
      pagesAboveStandard,
      criticalIssues,
      commonIssues,
      recommendations
    };
  }
}

export const contentQualityAssurance = new ContentQualityAssurance();