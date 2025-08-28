#!/usr/bin/env node

/**
 * Intelligent Route Consistency Checker
 * Phase 3: Deep analysis of route validation results with actionable insights
 * 
 * This script analyzes the HTTP validation results to:
 * - Identify patterns in dead paths and errors
 * - Cross-reference with routing system inconsistencies
 * - Generate prioritized fix recommendations
 * - Validate expected vs actual route coverage
 * - Detect routing logic bugs and edge cases
 * 
 * Performance: Processes thousands of validation results in milliseconds
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Analysis results
const analysis = {
  route_coverage: {},
  consistency_issues: [],
  fix_recommendations: [],
  route_health: {},
  performance_insights: {},
  critical_findings: [],
  analysis_timestamp: new Date().toISOString()
};

console.log('🧠 Intelligent Route Consistency Analysis Starting...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

/**
 * Load route analysis results
 */
async function loadRouteAnalysis() {
  try {
    console.log('📊 Loading route analysis data...');
    
    const routeAnalysisPath = path.join(__dirname, 'route-analysis-detailed.json');
    const analysisContent = await fs.readFile(routeAnalysisPath, 'utf8');
    const routeData = JSON.parse(analysisContent);
    
    console.log(`✅ Loaded analysis for ${routeData.routing_systems.length} routing systems`);
    console.log(`   Expected Routes: ${routeData.total_expected_routes}`);
    console.log(`   Inconsistencies: ${routeData.routing_inconsistencies.length}`);
    
    return routeData;
  } catch (error) {
    console.error('❌ Failed to load route analysis:', error.message);
    return null;
  }
}

/**
 * Load HTTP validation results
 */
async function loadValidationResults() {
  try {
    console.log('📋 Loading HTTP validation results...');
    
    const validationPath = path.join(__dirname, 'route-validation-results.json');
    const validationContent = await fs.readFile(validationPath, 'utf8');
    const validationData = JSON.parse(validationContent);
    
    console.log(`✅ Loaded validation for ${validationData.tested_urls} URLs`);
    console.log(`   Success Rate: ${((validationData.summary.success_count / validationData.tested_urls) * 100).toFixed(1)}%`);
    
    return validationData;
  } catch (error) {
    console.error('❌ Failed to load validation results:', error.message);
    return null;
  }
}

/**
 * Analyze route coverage gaps
 */
function analyzeRouteCoverage(routeData, validationData) {
  console.log('🔍 Analyzing route coverage gaps...');
  
  const coverage = {
    total_expected: routeData.total_expected_routes,
    total_tested: validationData.tested_urls,
    coverage_percentage: ((validationData.tested_urls / routeData.total_expected_routes) * 100).toFixed(1),
    missing_routes: [],
    unexpected_routes: []
  };
  
  // Convert validation URLs to route paths for comparison
  const testedPaths = new Set();
  [...validationData.successful, ...validationData.dead_paths, ...validationData.errors, ...validationData.redirects]
    .forEach(result => {
      testedPaths.add(result.url);
    });
  
  const expectedPaths = new Set(routeData.expected_urls);
  
  // Find missing routes (expected but not tested)
  expectedPaths.forEach(expectedPath => {
    if (!testedPaths.has(expectedPath)) {
      coverage.missing_routes.push(expectedPath);
    }
  });
  
  // Find unexpected routes (tested but not expected)
  testedPaths.forEach(testedPath => {
    if (!expectedPaths.has(testedPath)) {
      coverage.unexpected_routes.push(testedPath);
    }
  });
  
  console.log(`   Coverage: ${coverage.coverage_percentage}% (${coverage.total_tested}/${coverage.total_expected})`);
  console.log(`   Missing: ${coverage.missing_routes.length} routes`);
  console.log(`   Unexpected: ${coverage.unexpected_routes.length} routes`);
  
  return coverage;
}

/**
 * Analyze dead path patterns with routing system context
 */
function analyzeDeadPathPatterns(routeData, validationData) {
  console.log('🚫 Analyzing dead path patterns...');
  
  const patterns = {
    by_routing_system: {},
    by_path_pattern: {},
    municipal_utilities: [],
    hardcoded_route_issues: [],
    dynamic_route_issues: []
  };
  
  // Analyze each dead path
  validationData.dead_paths.forEach(deadPath => {
    const pathParts = deadPath.url.split('/').filter(part => part.length > 0);
    
    // Find which routing system should handle this path
    const matchingSystem = routeData.routing_systems.find(system => {
      const pattern = system.pattern.replace(/^\//, '').replace(/:\w+/g, '[^/]+').replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(deadPath.url.replace(/^\//, ''));
    });
    
    if (matchingSystem) {
      if (!patterns.by_routing_system[matchingSystem.file]) {
        patterns.by_routing_system[matchingSystem.file] = [];
      }
      patterns.by_routing_system[matchingSystem.file].push(deadPath);
      
      // Check if this is a municipal utility issue
      if (deadPath.url.includes('austin') || deadPath.url.includes('san-antonio')) {
        patterns.municipal_utilities.push({
          path: deadPath.url,
          system: matchingSystem.file,
          note: 'Municipal utility - should return 404 (correct behavior)'
        });
      }
      
      // Check if this is a hardcoded route issue
      if (matchingSystem.hardcoded_paths && matchingSystem.hardcoded_paths.length > 0) {
        patterns.hardcoded_route_issues.push({
          path: deadPath.url,
          system: matchingSystem.file,
          issue: 'Path not in hardcoded list but expected to exist'
        });
      }
    }
    
    // Pattern analysis
    const topLevelPath = pathParts[0] || 'root';
    if (!patterns.by_path_pattern[topLevelPath]) {
      patterns.by_path_pattern[topLevelPath] = [];
    }
    patterns.by_path_pattern[topLevelPath].push(deadPath);
  });
  
  return patterns;
}

/**
 * Cross-reference known inconsistencies with validation results
 */
function crossReferenceInconsistencies(routeData, validationData) {
  console.log('🔗 Cross-referencing known inconsistencies...');
  
  const crossRef = {
    confirmed_issues: [],
    resolved_issues: [],
    new_issues: []
  };
  
  // Check each known inconsistency against validation results
  routeData.routing_inconsistencies.forEach(inconsistency => {
    switch (inconsistency.type) {
      case 'city_coverage_mismatch':
        // Look for dead paths that might be caused by this mismatch
        const cityRelatedDeadPaths = validationData.dead_paths.filter(path => 
          path.url.includes('/texas/') || path.url.includes('/electricity-providers')
        );
        
        if (cityRelatedDeadPaths.length > 0) {
          crossRef.confirmed_issues.push({
            inconsistency_type: inconsistency.type,
            validation_evidence: `${cityRelatedDeadPaths.length} dead paths in city-related routes`,
            paths: cityRelatedDeadPaths.slice(0, 5).map(p => p.url), // Sample paths
            priority: 'high',
            action_required: 'Standardize city routing across all systems'
          });
        }
        break;
        
      case 'municipal_utility_included':
        // Check if Austin/San Antonio are correctly returning 404
        const municipalPaths = validationData.dead_paths.filter(path => 
          path.url.includes('austin') || path.url.includes('san-antonio')
        );
        
        if (municipalPaths.length > 0) {
          crossRef.resolved_issues.push({
            inconsistency_type: inconsistency.type,
            validation_evidence: 'Municipal utilities correctly return 404',
            paths: municipalPaths.map(p => p.url),
            status: 'working_as_intended'
          });
        }
        break;
    }
  });
  
  return crossRef;
}

/**
 * Generate prioritized fix recommendations
 */
function generateFixRecommendations(routeData, validationData, coverage, patterns, crossRef) {
  console.log('💡 Generating fix recommendations...');
  
  const recommendations = [];
  
  // High Priority: Critical routing system issues
  if (coverage.coverage_percentage < 95) {
    recommendations.push({
      priority: 'critical',
      category: 'coverage',
      title: 'Route Coverage Gap Detected',
      description: `Only ${coverage.coverage_percentage}% of expected routes are working`,
      impact: 'High - Users may encounter broken links',
      effort: 'Medium',
      action_items: [
        'Review missing routes list',
        'Check routing system configuration',
        'Verify getStaticPaths implementation'
      ],
      affected_routes: coverage.missing_routes.length
    });
  }
  
  // High Priority: Routing system inconsistencies
  if (crossRef.confirmed_issues.length > 0) {
    crossRef.confirmed_issues.forEach(issue => {
      recommendations.push({
        priority: 'high',
        category: 'consistency',
        title: `Routing Inconsistency: ${issue.inconsistency_type}`,
        description: issue.validation_evidence,
        impact: 'High - Inconsistent user experience',
        effort: 'High',
        action_items: [
          'Standardize routing systems to use same data source',
          'Update hardcoded routes to match TDSP mapping',
          'Implement single source of truth for city data'
        ],
        sample_paths: issue.paths
      });
    });
  }
  
  // Medium Priority: Performance optimization
  if (validationData.performance.requests_per_second < 20) {
    recommendations.push({
      priority: 'medium',
      category: 'performance',
      title: 'Route Response Time Optimization',
      description: `Average response rate: ${validationData.performance.requests_per_second} req/sec`,
      impact: 'Medium - User experience affected by slow pages',
      effort: 'Medium',
      action_items: [
        'Implement caching for dynamic routes',
        'Optimize API calls in route handlers',
        'Consider static generation for high-traffic routes'
      ]
    });
  }
  
  // Low Priority: Dead path cleanup
  if (validationData.summary.not_found_count > 0) {
    const nonMunicipalDeadPaths = validationData.dead_paths.filter(path =>
      !path.url.includes('austin') && !path.url.includes('san-antonio')
    );
    
    if (nonMunicipalDeadPaths.length > 0) {
      recommendations.push({
        priority: 'low',
        category: 'cleanup',
        title: 'Clean Up Dead Paths',
        description: `${nonMunicipalDeadPaths.length} unexpected dead paths found`,
        impact: 'Low - Minor SEO and UX impact',
        effort: 'Low',
        action_items: [
          'Review dead paths list',
          'Remove or redirect obsolete routes',
          'Update internal links that point to dead paths'
        ],
        dead_paths: nonMunicipalDeadPaths.map(p => p.url)
      });
    }
  }
  
  // Sort by priority
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  
  return recommendations;
}

/**
 * Generate route health scorecard
 */
function generateHealthScorecard(routeData, validationData) {
  console.log('📊 Generating route health scorecard...');
  
  const scorecard = {
    overall_score: 0,
    scores: {
      availability: 0,      // Percentage of routes returning 200
      coverage: 0,          // Percentage of expected routes tested
      consistency: 0,       // Routing system consistency score
      performance: 0        // Response time and throughput score
    },
    grade: 'F',
    strengths: [],
    weaknesses: []
  };
  
  // Calculate availability score (0-100)
  scorecard.scores.availability = Math.round(
    (validationData.summary.success_count / validationData.tested_urls) * 100
  );
  
  // Calculate coverage score (0-100)
  scorecard.scores.coverage = Math.round(
    (validationData.tested_urls / routeData.total_expected_routes) * 100
  );
  
  // Calculate consistency score (based on inconsistencies found)
  const maxInconsistencies = 10; // Assume 10 is worst case
  const inconsistencyPenalty = Math.min(routeData.routing_inconsistencies.length, maxInconsistencies);
  scorecard.scores.consistency = Math.max(0, 100 - (inconsistencyPenalty * 10));
  
  // Calculate performance score (based on response rate)
  const targetResponseRate = 50; // req/sec
  scorecard.scores.performance = Math.min(100, 
    Math.round((validationData.performance.requests_per_second / targetResponseRate) * 100)
  );
  
  // Calculate overall score (weighted average)
  scorecard.overall_score = Math.round(
    (scorecard.scores.availability * 0.4) +
    (scorecard.scores.coverage * 0.3) +
    (scorecard.scores.consistency * 0.2) +
    (scorecard.scores.performance * 0.1)
  );
  
  // Determine grade
  if (scorecard.overall_score >= 95) scorecard.grade = 'A+';
  else if (scorecard.overall_score >= 90) scorecard.grade = 'A';
  else if (scorecard.overall_score >= 85) scorecard.grade = 'A-';
  else if (scorecard.overall_score >= 80) scorecard.grade = 'B+';
  else if (scorecard.overall_score >= 75) scorecard.grade = 'B';
  else if (scorecard.overall_score >= 70) scorecard.grade = 'B-';
  else if (scorecard.overall_score >= 65) scorecard.grade = 'C+';
  else if (scorecard.overall_score >= 60) scorecard.grade = 'C';
  else if (scorecard.overall_score >= 55) scorecard.grade = 'C-';
  else if (scorecard.overall_score >= 50) scorecard.grade = 'D';
  else scorecard.grade = 'F';
  
  // Identify strengths and weaknesses
  Object.entries(scorecard.scores).forEach(([category, score]) => {
    if (score >= 90) {
      scorecard.strengths.push(`Excellent ${category} (${score}%)`);
    } else if (score < 70) {
      scorecard.weaknesses.push(`Poor ${category} (${score}%)`);
    }
  });
  
  return scorecard;
}

/**
 * Save comprehensive analysis results
 */
async function saveAnalysis() {
  console.log('💾 Saving consistency analysis...');
  
  const analysisPath = path.join(__dirname, 'route-consistency-analysis.json');
  await fs.writeFile(analysisPath, JSON.stringify(analysis, null, 2));
  
  // Save actionable recommendations
  const recommendationsPath = path.join(__dirname, 'fix-recommendations.md');
  const markdown = generateRecommendationsMarkdown(analysis.fix_recommendations, analysis.route_health);
  await fs.writeFile(recommendationsPath, markdown);
  
  console.log('✅ Analysis saved to:');
  console.log(`   📝 Detailed: ${analysisPath}`);
  console.log(`   📋 Recommendations: ${recommendationsPath}`);
}

/**
 * Generate markdown report for fix recommendations
 */
function generateRecommendationsMarkdown(recommendations, healthScorecard) {
  let markdown = `# Route Consistency Analysis Report\n\n`;
  markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
  
  // Health Scorecard
  markdown += `## 📊 Route Health Scorecard\n\n`;
  markdown += `**Overall Grade: ${healthScorecard.grade} (${healthScorecard.overall_score}/100)**\n\n`;
  markdown += `| Category | Score | Status |\n`;
  markdown += `|----------|-------|--------|\n`;
  
  Object.entries(healthScorecard.scores).forEach(([category, score]) => {
    const status = score >= 90 ? '✅ Excellent' : score >= 70 ? '⚠️ Good' : '❌ Needs Work';
    const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1);
    markdown += `| ${capitalizedCategory} | ${score}% | ${status} |\n`;
  });
  
  markdown += `\n`;
  
  if (healthScorecard.strengths.length > 0) {
    markdown += `### 💪 Strengths\n`;
    healthScorecard.strengths.forEach(strength => {
      markdown += `- ${strength}\n`;
    });
    markdown += `\n`;
  }
  
  if (healthScorecard.weaknesses.length > 0) {
    markdown += `### ⚠️ Areas for Improvement\n`;
    healthScorecard.weaknesses.forEach(weakness => {
      markdown += `- ${weakness}\n`;
    });
    markdown += `\n`;
  }
  
  // Fix Recommendations
  markdown += `## 🔧 Fix Recommendations\n\n`;
  
  if (recommendations.length === 0) {
    markdown += `🎉 **No critical issues found!** Your routing system is in excellent shape.\n\n`;
  } else {
    recommendations.forEach((rec, index) => {
      const priorityEmoji = {
        critical: '🚨',
        high: '⚠️',
        medium: '🔶',
        low: '💡'
      };
      
      markdown += `### ${priorityEmoji[rec.priority]} ${index + 1}. ${rec.title} (${rec.priority.toUpperCase()})\n\n`;
      markdown += `**Description:** ${rec.description}\n\n`;
      markdown += `**Impact:** ${rec.impact}\n\n`;
      markdown += `**Effort:** ${rec.effort}\n\n`;
      
      markdown += `**Action Items:**\n`;
      rec.action_items.forEach(item => {
        markdown += `- [ ] ${item}\n`;
      });
      markdown += `\n`;
      
      if (rec.sample_paths && rec.sample_paths.length > 0) {
        markdown += `**Sample Affected Paths:**\n`;
        rec.sample_paths.slice(0, 5).forEach(path => {
          markdown += `- \`${path}\`\n`;
        });
        markdown += `\n`;
      }
      
      markdown += `---\n\n`;
    });
  }
  
  return markdown;
}

/**
 * Print analysis summary
 */
function printSummary() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧠 ROUTE CONSISTENCY ANALYSIS SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const { route_health, fix_recommendations, route_coverage } = analysis;
  
  console.log(`🏆 Overall Health Grade: ${route_health.grade} (${route_health.overall_score}/100)`);
  console.log(`📊 Route Coverage: ${route_coverage.coverage_percentage}%`);
  console.log(`🔧 Recommendations: ${fix_recommendations.length} items`);
  
  console.log('\n📈 DETAILED SCORES:');
  Object.entries(route_health.scores).forEach(([category, score]) => {
    const status = score >= 90 ? '✅' : score >= 70 ? '⚠️' : '❌';
    console.log(`   ${status} ${category.charAt(0).toUpperCase() + category.slice(1)}: ${score}%`);
  });
  
  if (fix_recommendations.length > 0) {
    console.log('\n🔧 TOP RECOMMENDATIONS:');
    fix_recommendations.slice(0, 3).forEach((rec, index) => {
      const emoji = { critical: '🚨', high: '⚠️', medium: '🔶', low: '💡' };
      console.log(`   ${emoji[rec.priority]} ${rec.title} (${rec.priority})`);
    });
  }
  
  if (route_health.strengths.length > 0) {
    console.log('\n💪 STRENGTHS:');
    route_health.strengths.forEach(strength => {
      console.log(`   ✅ ${strength}`);
    });
  }
  
  console.log('\n📋 Detailed report saved to fix-recommendations.md');
  console.log('🚀 Next: Run dead-path-reporter.js for final comprehensive report');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * Main execution
 */
async function main() {
  try {
    // Load data
    const routeData = await loadRouteAnalysis();
    const validationData = await loadValidationResults();
    
    if (!routeData || !validationData) {
      console.error('❌ Cannot proceed without both analysis files');
      process.exit(1);
    }
    
    // Perform analysis
    console.log('🔍 Performing intelligent consistency analysis...');
    
    analysis.route_coverage = analyzeRouteCoverage(routeData, validationData);
    analysis.dead_path_patterns = analyzeDeadPathPatterns(routeData, validationData);
    analysis.consistency_cross_ref = crossReferenceInconsistencies(routeData, validationData);
    analysis.fix_recommendations = generateFixRecommendations(
      routeData, validationData, 
      analysis.route_coverage, 
      analysis.dead_path_patterns, 
      analysis.consistency_cross_ref
    );
    analysis.route_health = generateHealthScorecard(routeData, validationData);
    
    // Save and report
    await saveAnalysis();
    printSummary();
    
    console.log('🎉 Route consistency analysis completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Route consistency analysis failed:', error);
    process.exit(1);
  }
}

// Run the analysis
main();