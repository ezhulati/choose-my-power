/**
 * Advanced Internal Linking Strategy for Mass SEO
 * Hub-and-Spoke Architecture for 10,000+ Electricity Plan Pages
 * Optimizes link equity distribution and user experience across 881 cities
 * 
 * FEATURES:
 * - Intelligent hub-and-spoke link architecture
 * - PageRank-inspired link equity distribution
 * - Contextual anchor text generation with semantic variation
 * - Topical clustering for related content discovery
 * - Breadcrumb navigation optimization
 * - Cross-filter linking recommendations
 * - Geographic linking patterns (city-to-city relationships)
 * - Seasonal and temporal linking strategies
 * 
 * LINKING STRATEGY:
 * - Hub Pages: State → City → Filter Category pages (highest authority)
 * - Spoke Pages: Specific filter combinations (distribute equity)
 * - Bridge Links: Related cities, similar filters, seasonal content
 * - Support Links: Educational content, FAQs, guides (build authority)
 * - Commercial Links: Plan comparison, provider pages (conversion focus)
 * 
 * LINK TYPES:
 * - Navigational: Primary user journey paths
 * - Contextual: In-content relevant links
 * - Relational: Similar content and alternatives
 * - Hierarchical: Parent-child content relationships
 * - Cross-referential: Geographic and topical connections
 */

import { tdspMapping, formatCityName, formatFilterName } from '../src/config/tdsp-mapping';
import { determineCanonicalUrl, isSelfCanonical } from '../src/lib/seo/canonical-scale';

export interface LinkingNode {
  url: string;
  title: string;
  type: 'hub' | 'spoke' | 'bridge' | 'support';
  authority: number; // 0-100 scale
  tier: 1 | 2 | 3; // City importance tier
  filters: string[];
  city?: string;
  category: 'state' | 'city' | 'filter' | 'combination' | 'educational' | 'commercial';
  linkEquity: number;
  inboundLinks: LinkRelationship[];
  outboundLinks: LinkRelationship[];
}

export interface LinkRelationship {
  fromUrl: string;
  toUrl: string;
  anchorText: string;
  linkType: 'navigational' | 'contextual' | 'relational' | 'hierarchical' | 'cross-referential';
  strength: number; // 0-1 link weight
  context: string; // Where the link appears
  intent: 'navigation' | 'discovery' | 'comparison' | 'education' | 'conversion';
  semanticRelevance: number; // 0-1 semantic similarity
}

export interface LinkCluster {
  theme: string;
  centerNode: LinkingNode;
  relatedNodes: LinkingNode[];
  totalAuthority: number;
  linkDensity: number;
  averageRelevance: number;
}

export interface AnchorTextVariation {
  text: string;
  type: 'exact' | 'partial' | 'branded' | 'generic' | 'semantic';
  usage: number; // How many times used (for diversity)
  relevance: number;
  location: 'title' | 'description' | 'content' | 'sidebar' | 'footer';
}

export interface GeographicLinkingPattern {
  sourceCity: string;
  targetCities: string[];
  relationship: 'metropolitan' | 'neighboring' | 'similar-size' | 'same-region' | 'competing';
  linkStrength: number;
  sharedCharacteristics: string[];
}

export interface SeasonalLinkingStrategy {
  season: 'winter' | 'summer' | 'spring' | 'fall';
  boostedFilters: string[];
  promotedContent: string[];
  linkingPriority: LinkingPriority[];
}

export interface LinkingPriority {
  sourcePattern: string;
  targetPattern: string;
  priority: number; // 1-10 scale
  reason: string;
}

/**
 * Advanced Internal Linking Architecture System
 */
export class InternalLinkingStrategy {
  private linkingGraph: Map<string, LinkingNode>;
  private clusterMap: Map<string, LinkCluster>;
  private anchorTextVariations: Map<string, AnchorTextVariation[]>;
  private geographicPatterns: GeographicLinkingPattern[];
  private seasonalStrategies: Map<string, SeasonalLinkingStrategy>;

  constructor() {
    this.linkingGraph = new Map();
    this.clusterMap = new Map();
    this.anchorTextVariations = new Map();
    this.geographicPatterns = [];
    this.seasonalStrategies = new Map();
    this.initializeLinkingArchitecture();
  }

  /**
   * Generate comprehensive internal linking plan for all pages
   */
  async generateComprehensiveLinkingPlan(): Promise<InternalLinkingPlan> {
    console.log('🔗 Generating comprehensive internal linking strategy...');

    // Build the complete site graph
    const siteGraph = await this.buildSiteGraph();
    
    // Calculate link equity distribution
    const equityDistribution = this.calculateLinkEquityDistribution(siteGraph);
    
    // Generate hub-and-spoke relationships
    const hubSpokeRelationships = this.generateHubSpokeArchitecture(siteGraph);
    
    // Create contextual link recommendations
    const contextualLinks = await this.generateContextualLinks(siteGraph);
    
    // Build geographic linking patterns
    const geographicLinks = this.buildGeographicLinkingPatterns();
    
    // Generate seasonal linking strategies
    const seasonalLinks = this.generateSeasonalLinkingStrategies();
    
    // Create anchor text variation strategies
    const anchorTextStrategies = this.generateAnchorTextStrategies();
    
    // Calculate performance metrics
    const performanceMetrics = this.calculateLinkingPerformance(siteGraph, hubSpokeRelationships);

    console.log(`✅ Generated linking plan for ${siteGraph.size} pages with ${hubSpokeRelationships.length} hub-spoke relationships`);

    return {
      siteGraph,
      equityDistribution,
      hubSpokeRelationships,
      contextualLinks,
      geographicLinks,
      seasonalLinks,
      anchorTextStrategies,
      performanceMetrics,
      implementationGuide: this.generateImplementationGuide(),
      monitoringStrategy: this.generateMonitoringStrategy()
    };
  }

  /**
   * Build complete site link graph with all pages and relationships
   */
  private async buildSiteGraph(): Promise<Map<string, LinkingNode>> {
    const graph = new Map<string, LinkingNode>();
    const cities = Object.keys(tdspMapping);

    // Create state-level hub
    const stateHub = this.createStateHub();
    graph.set(stateHub.url, stateHub);

    // Process each city
    for (const citySlug of cities) {
      const cityData = tdspMapping[citySlug];
      const cityName = formatCityName(citySlug);
      const cleanCitySlug = citySlug.replace('-tx', '');

      // Create city hub page
      const cityHub = this.createCityHub(citySlug, cityName, cityData.tier);
      graph.set(cityHub.url, cityHub);

      // Link city to state
      this.addLinkRelationship(stateHub, cityHub, 'hierarchical', 0.8);

      // Generate filter pages for this city
      const filterPages = this.generateCityFilterPages(citySlug, cityName, cityData.tier);
      filterPages.forEach(page => {
        graph.set(page.url, page);
        this.addLinkRelationship(cityHub, page, 'hierarchical', 0.6);
      });

      // Generate combination pages (for tier 1 and 2 cities)
      if (cityData.tier <= 2) {
        const combinationPages = this.generateCombinationPages(citySlug, cityName, cityData.tier);
        combinationPages.forEach(page => {
          graph.set(page.url, page);
          
          // Link to relevant filter pages
          const relatedFilters = filterPages.filter(fp => 
            page.filters.some(f => fp.filters.includes(f))
          );
          relatedFilters.forEach(related => {
            this.addLinkRelationship(related, page, 'hierarchical', 0.4);
          });
        });
      }

      // Generate educational and support content
      const supportPages = this.generateSupportContent(citySlug, cityName);
      supportPages.forEach(page => {
        graph.set(page.url, page);
        this.addLinkRelationship(cityHub, page, 'contextual', 0.3);
      });
    }

    // Add cross-city relationships
    this.addGeographicLinks(graph);
    
    // Add topical clusters
    this.addTopicalClusters(graph);

    this.linkingGraph = graph;
    return graph;
  }

  /**
   * Create state-level hub page node
   */
  private createStateHub(): LinkingNode {
    return {
      url: '/texas/',
      title: 'Texas Electricity Plans | Compare All Cities',
      type: 'hub',
      authority: 100,
      tier: 1,
      filters: [],
      category: 'state',
      linkEquity: 100,
      inboundLinks: [],
      outboundLinks: []
    };
  }

  /**
   * Create city hub page node
   */
  private createCityHub(citySlug: string, cityName: string, tier: number): LinkingNode {
    const cleanSlug = citySlug.replace('-tx', '');
    
    return {
      url: `/texas/${cleanSlug}/`,
      title: `Electricity Plans in ${cityName}, Texas`,
      type: 'hub',
      authority: this.calculateCityAuthority(tier),
      tier: tier as 1 | 2 | 3,
      filters: [],
      city: citySlug,
      category: 'city',
      linkEquity: this.calculateInitialLinkEquity(tier),
      inboundLinks: [],
      outboundLinks: []
    };
  }

  /**
   * Generate filter pages for a city
   */
  private generateCityFilterPages(citySlug: string, cityName: string, tier: number): LinkingNode[] {
    const cleanSlug = citySlug.replace('-tx', '');
    const pages: LinkingNode[] = [];
    
    // Base filters available for all cities
    const baseFilters = ['12-month', 'fixed-rate', 'green-energy'];
    
    // Additional filters for higher tier cities
    const tier2Filters = ['24-month', 'prepaid', 'no-deposit'];
    const tier1Filters = ['variable-rate', 'time-of-use', 'business-plans'];

    const availableFilters = [...baseFilters];
    if (tier <= 2) availableFilters.push(...tier2Filters);
    if (tier === 1) availableFilters.push(...tier1Filters);

    availableFilters.forEach(filter => {
      const filterName = formatFilterName(filter);
      pages.push({
        url: `/texas/${cleanSlug}/${filter}/`,
        title: `${filterName} Electricity Plans in ${cityName}`,
        type: 'spoke',
        authority: this.calculateFilterAuthority(tier, filter),
        tier: tier as 1 | 2 | 3,
        filters: [filter],
        city: citySlug,
        category: 'filter',
        linkEquity: this.calculateInitialLinkEquity(tier) * 0.6,
        inboundLinks: [],
        outboundLinks: []
      });
    });

    return pages;
  }

  /**
   * Generate combination pages for higher-tier cities
   */
  private generateCombinationPages(citySlug: string, cityName: string, tier: number): LinkingNode[] {
    const cleanSlug = citySlug.replace('-tx', '');
    const pages: LinkingNode[] = [];

    // High-value filter combinations
    const combinations = [
      ['12-month', 'fixed-rate'],
      ['24-month', 'fixed-rate'],
      ['green-energy', '12-month'],
      ['green-energy', 'fixed-rate'],
      ['prepaid', 'no-deposit']
    ];

    // Tier 1 gets more combinations
    if (tier === 1) {
      combinations.push(
        ['variable-rate', 'green-energy'],
        ['business-plans', 'fixed-rate'],
        ['time-of-use', '12-month']
      );
    }

    combinations.forEach(combo => {
      const filterNames = combo.map(formatFilterName).join(' + ');
      const urlPath = combo.join('/');
      
      pages.push({
        url: `/texas/${cleanSlug}/${urlPath}/`,
        title: `${filterNames} Electricity Plans in ${cityName}`,
        type: 'spoke',
        authority: this.calculateCombinationAuthority(tier, combo.length),
        tier: tier as 1 | 2 | 3,
        filters: combo,
        city: citySlug,
        category: 'combination',
        linkEquity: this.calculateInitialLinkEquity(tier) * 0.4,
        inboundLinks: [],
        outboundLinks: []
      });
    });

    return pages;
  }

  /**
   * Generate support and educational content
   */
  private generateSupportContent(citySlug: string, cityName: string): LinkingNode[] {
    const cleanSlug = citySlug.replace('-tx', '');
    const pages: LinkingNode[] = [];

    const supportTypes = [
      {
        slug: 'electricity-providers',
        title: `Electricity Providers in ${cityName}`,
        type: 'commercial' as const
      },
      {
        slug: 'switch-electricity',
        title: `How to Switch Electricity in ${cityName}`,
        type: 'educational' as const
      }
    ];

    supportTypes.forEach(({ slug, title, type }) => {
      pages.push({
        url: `/texas/${cleanSlug}/${slug}/`,
        title,
        type: 'support',
        authority: 40,
        tier: 3,
        filters: [],
        city: citySlug,
        category: type,
        linkEquity: 20,
        inboundLinks: [],
        outboundLinks: []
      });
    });

    return pages;
  }

  /**
   * Add geographic linking relationships between cities
   */
  private addGeographicLinks(graph: Map<string, LinkingNode>): void {
    const cities = Array.from(graph.values()).filter(node => node.category === 'city');
    
    // Group cities by regions and metropolitan areas
    const regions = this.groupCitiesByRegion(cities);
    
    // Add regional hub links
    Object.values(regions).forEach(regionCities => {
      if (regionCities.length > 1) {
        // Link the highest authority city to others in region
        const hubCity = regionCities.reduce((prev, current) => 
          prev.authority > current.authority ? prev : current
        );
        
        regionCities.forEach(city => {
          if (city !== hubCity) {
            this.addLinkRelationship(hubCity, city, 'cross-referential', 0.2);
          }
        });
      }
    });

    // Add metropolitan area links
    const metroAreas = this.getMetropolitanAreas(cities);
    metroAreas.forEach(metro => {
      if (metro.cities.length > 1) {
        metro.cities.forEach(city1 => {
          metro.cities.forEach(city2 => {
            if (city1 !== city2) {
              this.addLinkRelationship(city1, city2, 'cross-referential', 0.3);
            }
          });
        });
      }
    });
  }

  /**
   * Add topical clusters for related content
   */
  private addTopicalClusters(graph: Map<string, LinkingNode>): void {
    const filterTypes = ['12-month', '24-month', 'fixed-rate', 'variable-rate', 'green-energy', 'prepaid'];
    
    filterTypes.forEach(filter => {
      const filterPages = Array.from(graph.values()).filter(node => 
        node.filters.includes(filter) && node.category === 'filter'
      );
      
      // Create cluster relationships
      if (filterPages.length > 1) {
        const cluster = this.createTopicalCluster(filter, filterPages);
        this.clusterMap.set(filter, cluster);
        
        // Add cluster internal links
        this.addClusterLinks(filterPages, 0.25);
      }
    });
  }

  /**
   * Calculate link equity distribution using PageRank-inspired algorithm
   */
  private calculateLinkEquityDistribution(graph: Map<string, LinkingNode>): Map<string, number> {
    const equityMap = new Map<string, number>();
    const dampingFactor = 0.85;
    const iterations = 10;

    // Initialize with equal distribution
    const initialEquity = 1.0 / graph.size;
    graph.forEach((_, url) => equityMap.set(url, initialEquity));

    // Iterate to converge on final distribution
    for (let i = 0; i < iterations; i++) {
      const newEquity = new Map<string, number>();
      
      graph.forEach((node, url) => {
        let equity = (1 - dampingFactor) / graph.size;
        
        // Add equity from inbound links
        node.inboundLinks.forEach(link => {
          const sourceNode = graph.get(link.fromUrl);
          if (sourceNode) {
            const sourceEquity = equityMap.get(link.fromUrl) || 0;
            const outboundCount = sourceNode.outboundLinks.length;
            if (outboundCount > 0) {
              equity += dampingFactor * (sourceEquity / outboundCount) * link.strength;
            }
          }
        });
        
        newEquity.set(url, equity);
      });
      
      // Update equity map
      newEquity.forEach((equity, url) => equityMap.set(url, equity));
    }

    return equityMap;
  }

  /**
   * Generate hub-and-spoke architecture relationships
   */
  private generateHubSpokeArchitecture(graph: Map<string, LinkingNode>): HubSpokeRelationship[] {
    const relationships: HubSpokeRelationship[] = [];
    
    // State hub to city hubs
    const stateHub = Array.from(graph.values()).find(node => node.category === 'state');
    const cityHubs = Array.from(graph.values()).filter(node => node.category === 'city');
    
    if (stateHub) {
      cityHubs.forEach(cityHub => {
        relationships.push({
          hubUrl: stateHub.url,
          spokeUrl: cityHub.url,
          relationship: 'state-to-city',
          strength: this.calculateHubSpokeStrength(stateHub, cityHub),
          anchorText: this.generateAnchorText(cityHub.title, 'hierarchical'),
          context: 'state-overview-section'
        });
      });
    }

    // City hubs to filter pages
    cityHubs.forEach(cityHub => {
      const cityFilters = Array.from(graph.values()).filter(node => 
        node.city === cityHub.city && node.category === 'filter'
      );
      
      cityFilters.forEach(filterPage => {
        relationships.push({
          hubUrl: cityHub.url,
          spokeUrl: filterPage.url,
          relationship: 'city-to-filter',
          strength: this.calculateHubSpokeStrength(cityHub, filterPage),
          anchorText: this.generateAnchorText(filterPage.title, 'hierarchical'),
          context: 'popular-filters-section'
        });
      });
    });

    return relationships;
  }

  /**
   * Generate contextual link recommendations based on content relevance
   */
  private async generateContextualLinks(graph: Map<string, LinkingNode>): Promise<ContextualLinkRecommendation[]> {
    const recommendations: ContextualLinkRecommendation[] = [];
    
    // For each page, find the most relevant contextual links
    for (const [url, node] of graph) {
      const contextualLinks = await this.findContextualLinks(node, graph);
      
      if (contextualLinks.length > 0) {
        recommendations.push({
          sourceUrl: url,
          sourceTitle: node.title,
          recommendedLinks: contextualLinks,
          implementationGuidance: this.generateContextualImplementationGuidance(node, contextualLinks)
        });
      }
    }

    return recommendations;
  }

  /**
   * Find contextually relevant links for a specific page
   */
  private async findContextualLinks(node: LinkingNode, graph: Map<string, LinkingNode>): Promise<ContextualLink[]> {
    const contextualLinks: ContextualLink[] = [];
    
    // Find related pages by category and filters
    const candidates = Array.from(graph.values()).filter(candidate => 
      candidate.url !== node.url && this.calculateSemanticRelevance(node, candidate) > 0.3
    );

    // Sort by relevance and select top candidates
    const sortedCandidates = candidates
      .sort((a, b) => this.calculateSemanticRelevance(node, b) - this.calculateSemanticRelevance(node, a))
      .slice(0, 8);

    sortedCandidates.forEach((candidate, index) => {
      const relevance = this.calculateSemanticRelevance(node, candidate);
      
      contextualLinks.push({
        targetUrl: candidate.url,
        targetTitle: candidate.title,
        anchorText: this.generateContextualAnchorText(node, candidate),
        placement: this.determineOptimalPlacement(node, candidate, index),
        relevance,
        linkType: this.determineLinkType(node, candidate),
        priority: this.calculateLinkPriority(relevance, candidate.authority, index)
      });
    });

    return contextualLinks;
  }

  /**
   * Generate anchor text strategies with variations
   */
  private generateAnchorTextStrategies(): Map<string, AnchorTextStrategy> {
    const strategies = new Map<string, AnchorTextStrategy>();
    
    const linkTypes = ['navigational', 'contextual', 'relational', 'hierarchical', 'cross-referential'];
    
    linkTypes.forEach(linkType => {
      const strategy: AnchorTextStrategy = {
        linkType: linkType as any,
        variations: this.generateAnchorTextVariations(linkType),
        distributionRatio: this.getAnchorTextDistribution(linkType),
        qualityGuidelines: this.getAnchorTextGuidelines(linkType),
        avoidancePatterns: this.getAnchorTextAvoidancePatterns()
      };
      
      strategies.set(linkType, strategy);
    });

    return strategies;
  }

  /**
   * Helper methods for calculations and utilities
   */

  private calculateCityAuthority(tier: number): number {
    if (tier === 1) return 90;
    if (tier === 2) return 70;
    return 50;
  }

  private calculateInitialLinkEquity(tier: number): number {
    if (tier === 1) return 100;
    if (tier === 2) return 75;
    return 50;
  }

  private calculateFilterAuthority(tier: number, filter: string): number {
    const baseAuthority = this.calculateCityAuthority(tier) * 0.7;
    
    // Popular filters get authority boost
    const popularFilters = ['12-month', 'fixed-rate', 'green-energy'];
    if (popularFilters.includes(filter)) {
      return baseAuthority * 1.2;
    }
    
    return baseAuthority;
  }

  private calculateCombinationAuthority(tier: number, filterCount: number): number {
    const baseAuthority = this.calculateCityAuthority(tier) * 0.5;
    return baseAuthority * (1 - (filterCount - 1) * 0.1); // Slight reduction per additional filter
  }

  private addLinkRelationship(fromNode: LinkingNode, toNode: LinkingNode, type: LinkRelationship['linkType'], strength: number): void {
    const relationship: LinkRelationship = {
      fromUrl: fromNode.url,
      toUrl: toNode.url,
      anchorText: this.generateAnchorText(toNode.title, type),
      linkType: type,
      strength,
      context: this.determineLinkContext(type),
      intent: this.determineLinkIntent(type),
      semanticRelevance: this.calculateSemanticRelevance(fromNode, toNode)
    };

    fromNode.outboundLinks.push(relationship);
    toNode.inboundLinks.push(relationship);
  }

  private generateAnchorText(targetTitle: string, linkType: LinkRelationship['linkType']): string {
    // Basic anchor text generation - would be more sophisticated in production
    if (linkType === 'hierarchical') {
      return targetTitle.replace(' | Compare All Cities', '').replace(' Plans', ' Plans');
    }
    
    return targetTitle.split(' | ')[0]; // Use first part of title
  }

  private calculateSemanticRelevance(node1: LinkingNode, node2: LinkingNode): number {
    let relevance = 0;

    // Same city bonus
    if (node1.city === node2.city) relevance += 0.4;
    
    // Same tier bonus
    if (node1.tier === node2.tier) relevance += 0.1;
    
    // Filter overlap
    const commonFilters = node1.filters.filter(f => node2.filters.includes(f));
    relevance += commonFilters.length * 0.2;
    
    // Category similarity
    if (node1.category === node2.category) relevance += 0.2;
    else if (this.getCategoryRelation(node1.category, node2.category) > 0) {
      relevance += 0.1;
    }

    return Math.min(1, relevance);
  }

  private getCategoryRelation(cat1: string, cat2: string): number {
    const relations: Record<string, Record<string, number>> = {
      'city': { 'filter': 0.8, 'combination': 0.6, 'educational': 0.3 },
      'filter': { 'combination': 0.7, 'city': 0.8 },
      'combination': { 'filter': 0.7, 'city': 0.6 },
      'educational': { 'city': 0.3, 'filter': 0.2 }
    };

    return relations[cat1]?.[cat2] || 0;
  }

  private groupCitiesByRegion(cities: LinkingNode[]): Record<string, LinkingNode[]> {
    // Simplified regional grouping - would use actual geographic data in production
    const regions: Record<string, LinkingNode[]> = {
      'north-texas': [],
      'central-texas': [],
      'south-texas': [],
      'east-texas': [],
      'west-texas': []
    };

    cities.forEach(city => {
      // Simple classification based on city name - would use actual coordinates
      if (city.city?.includes('dallas') || city.city?.includes('fort-worth') || city.city?.includes('plano')) {
        regions['north-texas'].push(city);
      } else if (city.city?.includes('austin') || city.city?.includes('waco')) {
        regions['central-texas'].push(city);
      } else if (city.city?.includes('houston') || city.city?.includes('san-antonio')) {
        regions['south-texas'].push(city);
      } else if (city.city?.includes('beaumont') || city.city?.includes('tyler')) {
        regions['east-texas'].push(city);
      } else {
        regions['west-texas'].push(city);
      }
    });

    return regions;
  }

  private getMetropolitanAreas(cities: LinkingNode[]): MetropolitanArea[] {
    return [
      {
        name: 'Dallas-Fort Worth Metroplex',
        cities: cities.filter(c => 
          ['dallas-tx', 'fort-worth-tx', 'arlington-tx', 'plano-tx', 'irving-tx', 'garland-tx'].includes(c.city || '')
        )
      },
      {
        name: 'Greater Houston Area',
        cities: cities.filter(c => 
          ['houston-tx', 'pasadena-tx', 'pearland-tx', 'sugar-land-tx'].includes(c.city || '')
        )
      },
      {
        name: 'Austin Metropolitan Area',
        cities: cities.filter(c => 
          ['austin-tx', 'cedar-park-tx', 'pflugerville-tx', 'round-rock-tx'].includes(c.city || '')
        )
      }
    ];
  }

  private createTopicalCluster(theme: string, pages: LinkingNode[]): LinkCluster {
    const totalAuthority = pages.reduce((sum, page) => sum + page.authority, 0);
    const centerNode = pages.reduce((prev, current) => 
      prev.authority > current.authority ? prev : current
    );

    return {
      theme,
      centerNode,
      relatedNodes: pages.filter(p => p !== centerNode),
      totalAuthority,
      linkDensity: this.calculateLinkDensity(pages),
      averageRelevance: this.calculateAverageRelevance(pages)
    };
  }

  private addClusterLinks(pages: LinkingNode[], strength: number): void {
    pages.forEach(page1 => {
      pages.forEach(page2 => {
        if (page1 !== page2) {
          this.addLinkRelationship(page1, page2, 'relational', strength);
        }
      });
    });
  }

  private calculateHubSpokeStrength(hub: LinkingNode, spoke: LinkingNode): number {
    let strength = 0.5; // Base strength

    // Authority differential
    const authorityRatio = spoke.authority / hub.authority;
    strength += authorityRatio * 0.3;

    // Tier considerations
    if (hub.tier <= spoke.tier) strength += 0.1;

    // Filter relevance
    if (hub.filters.length === 0 && spoke.filters.length > 0) strength += 0.1;

    return Math.min(1, strength);
  }

  private determineOptimalPlacement(source: LinkingNode, target: LinkingNode, index: number): ContextualLink['placement'] {
    if (index < 2) return 'content';
    if (index < 4) return 'sidebar';
    return 'footer';
  }

  private calculateLinkPriority(relevance: number, authority: number, position: number): number {
    return (relevance * 0.5 + authority / 100 * 0.3 + (10 - position) / 10 * 0.2) * 10;
  }

  private generateAnchorTextVariations(linkType: string): AnchorTextVariation[] {
    // Sample variations - would be more comprehensive in production
    const baseVariations: AnchorTextVariation[] = [
      { text: 'exact match', type: 'exact', usage: 0, relevance: 1.0, location: 'content' },
      { text: 'partial match', type: 'partial', usage: 0, relevance: 0.8, location: 'content' },
      { text: 'branded match', type: 'branded', usage: 0, relevance: 0.6, location: 'sidebar' },
      { text: 'generic match', type: 'generic', usage: 0, relevance: 0.4, location: 'footer' },
      { text: 'semantic match', type: 'semantic', usage: 0, relevance: 0.7, location: 'content' }
    ];

    return baseVariations;
  }

  private getAnchorTextDistribution(linkType: string): Record<string, number> {
    // Ideal distribution percentages
    return {
      exact: 15,
      partial: 35,
      branded: 20,
      generic: 20,
      semantic: 10
    };
  }

  private getAnchorTextGuidelines(linkType: string): string[] {
    return [
      'Keep anchor text natural and descriptive',
      'Vary anchor text to avoid over-optimization',
      'Use semantic variations of target keywords',
      'Include location-specific terms when relevant',
      'Avoid exact match for all links to same page'
    ];
  }

  private getAnchorTextAvoidancePatterns(): string[] {
    return [
      'Click here',
      'Read more',
      'Learn more',
      'This page',
      'Website',
      'Link'
    ];
  }

  // Additional utility methods
  private calculateLinkDensity(pages: LinkingNode[]): number {
    const totalPossibleLinks = pages.length * (pages.length - 1);
    const actualLinks = pages.reduce((sum, page) => sum + page.outboundLinks.length, 0);
    return actualLinks / totalPossibleLinks;
  }

  private calculateAverageRelevance(pages: LinkingNode[]): number {
    let totalRelevance = 0;
    let linkCount = 0;

    pages.forEach(page => {
      page.outboundLinks.forEach(link => {
        totalRelevance += link.semanticRelevance;
        linkCount++;
      });
    });

    return linkCount > 0 ? totalRelevance / linkCount : 0;
  }

  private calculateLinkingPerformance(
    graph: Map<string, LinkingNode>, 
    relationships: HubSpokeRelationship[]
  ): LinkingPerformanceMetrics {
    const totalPages = graph.size;
    const totalLinks = Array.from(graph.values()).reduce((sum, node) => sum + node.outboundLinks.length, 0);
    const averageLinksPerPage = totalLinks / totalPages;

    const hubPages = Array.from(graph.values()).filter(node => node.type === 'hub').length;
    const spokePages = Array.from(graph.values()).filter(node => node.type === 'spoke').length;

    return {
      totalPages,
      totalLinks,
      averageLinksPerPage,
      hubPages,
      spokePages,
      hubSpokeRatio: hubPages / spokePages,
      averageLinkDepth: this.calculateAverageLinkDepth(graph),
      clustersFormed: this.clusterMap.size,
      geographicConnections: this.geographicPatterns.length,
      recommendedOptimizations: this.generateOptimizationRecommendations(graph)
    };
  }

  private calculateAverageLinkDepth(graph: Map<string, LinkingNode>): number {
    // Simplified calculation - would implement BFS in production
    return 3.2; // Average depth from state page
  }

  private generateOptimizationRecommendations(graph: Map<string, LinkingNode>): string[] {
    const recommendations: string[] = [];
    
    const avgAuthority = Array.from(graph.values()).reduce((sum, node) => sum + node.authority, 0) / graph.size;
    
    if (avgAuthority < 60) {
      recommendations.push('Increase internal linking to boost page authority');
    }

    const orphanPages = Array.from(graph.values()).filter(node => node.inboundLinks.length === 0);
    if (orphanPages.length > 0) {
      recommendations.push(`Fix ${orphanPages.length} orphan pages with no inbound links`);
    }

    recommendations.push('Implement contextual linking in content areas');
    recommendations.push('Add seasonal linking strategies for filters');
    recommendations.push('Create topic cluster hubs for related content');

    return recommendations;
  }

  private generateImplementationGuide(): ImplementationGuide {
    return {
      phases: [
        {
          phase: 1,
          name: 'Hub-Spoke Foundation',
          description: 'Implement core hierarchical linking structure',
          tasks: [
            'Add state to city links',
            'Add city to filter links',
            'Implement breadcrumb navigation',
            'Add popular filters section to city pages'
          ],
          timeline: '2 weeks',
          priority: 'critical'
        },
        {
          phase: 2,
          name: 'Contextual Enhancement',
          description: 'Add contextual and related content links',
          tasks: [
            'Implement related filters sidebar',
            'Add contextual in-content links',
            'Create "You might also like" sections',
            'Add cross-city comparison links'
          ],
          timeline: '3 weeks',
          priority: 'high'
        },
        {
          phase: 3,
          name: 'Advanced Optimization',
          description: 'Implement advanced linking strategies',
          tasks: [
            'Add seasonal linking logic',
            'Implement geographic clustering',
            'Create topic authority hubs',
            'Add conversion-focused linking'
          ],
          timeline: '4 weeks',
          priority: 'medium'
        }
      ],
      technicalRequirements: [
        'Dynamic link generation in Astro components',
        'Semantic relevance calculation system',
        'Link equity tracking infrastructure',
        'Performance monitoring for link crawling'
      ],
      successMetrics: [
        'Average page authority increase',
        'Improved crawl efficiency',
        'Enhanced user session depth',
        'Better conversion funnel flow'
      ]
    };
  }

  private generateMonitoringStrategy(): MonitoringStrategy {
    return {
      metrics: [
        {
          name: 'Internal Link Health',
          description: 'Monitor broken internal links and orphan pages',
          frequency: 'daily',
          alertThreshold: '> 5 broken links'
        },
        {
          name: 'Link Equity Distribution',
          description: 'Track how authority flows through the site',
          frequency: 'weekly',
          alertThreshold: '< 70% pages receiving link equity'
        },
        {
          name: 'Contextual Link Performance',
          description: 'Monitor click-through rates on internal links',
          frequency: 'monthly',
          alertThreshold: '< 3% average CTR'
        }
      ],
      tools: [
        'Google Search Console for crawl insights',
        'Custom analytics for internal link tracking',
        'Automated link health monitoring',
        'PageRank simulation tools'
      ],
      reportingSchedule: {
        daily: 'Link health status',
        weekly: 'Authority distribution report',
        monthly: 'Comprehensive linking performance review'
      }
    };
  }

  private initializeLinkingArchitecture(): void {
    // Initialize architecture components
    this.buildGeographicLinkingPatterns();
    this.initializeSeasonalStrategies();
  }

  private buildGeographicLinkingPatterns(): GeographicLinkingPattern[] {
    // Simplified geographic patterns - would use real data in production
    return [
      {
        sourceCity: 'dallas-tx',
        targetCities: ['fort-worth-tx', 'arlington-tx', 'plano-tx', 'irving-tx'],
        relationship: 'metropolitan',
        linkStrength: 0.8,
        sharedCharacteristics: ['DFW Metroplex', 'Oncor service area', 'similar rates']
      },
      {
        sourceCity: 'houston-tx',
        targetCities: ['pasadena-tx', 'pearland-tx', 'sugar-land-tx'],
        relationship: 'metropolitan',
        linkStrength: 0.7,
        sharedCharacteristics: ['Greater Houston', 'CenterPoint service area']
      }
    ];
  }

  private initializeSeasonalStrategies(): void {
    const seasons: SeasonalLinkingStrategy[] = [
      {
        season: 'summer',
        boostedFilters: ['fixed-rate', 'green-energy', 'variable-rate'],
        promotedContent: ['cooling-cost-guides', 'energy-efficiency-tips'],
        linkingPriority: [
          {
            sourcePattern: '/texas/*/fixed-rate/',
            targetPattern: '/texas/*/green-energy/',
            priority: 8,
            reason: 'Summer green energy promotion'
          }
        ]
      },
      {
        season: 'winter',
        boostedFilters: ['fixed-rate', '12-month', '24-month'],
        promotedContent: ['heating-cost-guides', 'winter-savings-tips'],
        linkingPriority: [
          {
            sourcePattern: '/texas/*/',
            targetPattern: '/texas/*/fixed-rate/',
            priority: 9,
            reason: 'Winter rate stability emphasis'
          }
        ]
      }
    ];

    seasons.forEach(season => {
      this.seasonalStrategies.set(season.season, season);
    });
  }

  private determineLinkContext(type: LinkRelationship['linkType']): string {
    const contexts: Record<string, string> = {
      'navigational': 'main-navigation',
      'contextual': 'content-body',
      'relational': 'related-links-section',
      'hierarchical': 'breadcrumb-navigation',
      'cross-referential': 'cross-reference-section'
    };

    return contexts[type] || 'general-content';
  }

  private determineLinkIntent(type: LinkRelationship['linkType']): LinkRelationship['intent'] {
    const intents: Record<string, LinkRelationship['intent']> = {
      'navigational': 'navigation',
      'contextual': 'discovery',
      'relational': 'comparison',
      'hierarchical': 'navigation',
      'cross-referential': 'education'
    };

    return intents[type] || 'discovery';
  }

  private determineLinkType(source: LinkingNode, target: LinkingNode): ContextualLink['linkType'] {
    if (source.category === 'city' && target.category === 'filter') return 'hierarchical';
    if (source.city === target.city) return 'relational';
    if (source.category === target.category) return 'relational';
    return 'contextual';
  }

  private generateContextualAnchorText(source: LinkingNode, target: LinkingNode): string {
    // Generate contextually appropriate anchor text
    if (target.category === 'filter' && target.filters.length === 1) {
      const filterName = formatFilterName(target.filters[0]);
      return `${filterName} plans`;
    }
    
    if (target.category === 'city') {
      const cityName = formatCityName(target.city || '');
      return `electricity plans in ${cityName}`;
    }

    return target.title.split(' | ')[0];
  }

  private generateContextualImplementationGuidance(
    source: LinkingNode, 
    links: ContextualLink[]
  ): ImplementationGuidance {
    return {
      recommendedPlacements: links.map(link => ({
        url: link.targetUrl,
        placement: link.placement,
        context: `Add ${link.anchorText} link in ${link.placement} area`
      })),
      priorityOrder: links
        .sort((a, b) => b.priority - a.priority)
        .map((link, index) => `${index + 1}. ${link.anchorText} (${link.targetUrl})`),
      implementationNotes: [
        'Ensure links are naturally integrated into content',
        'Maintain semantic relevance with surrounding text',
        'Monitor click-through rates and adjust placement as needed'
      ]
    };
  }
}

/**
 * Supporting interfaces for the internal linking system
 */

export interface InternalLinkingPlan {
  siteGraph: Map<string, LinkingNode>;
  equityDistribution: Map<string, number>;
  hubSpokeRelationships: HubSpokeRelationship[];
  contextualLinks: ContextualLinkRecommendation[];
  geographicLinks: GeographicLinkingPattern[];
  seasonalLinks: Map<string, SeasonalLinkingStrategy>;
  anchorTextStrategies: Map<string, AnchorTextStrategy>;
  performanceMetrics: LinkingPerformanceMetrics;
  implementationGuide: ImplementationGuide;
  monitoringStrategy: MonitoringStrategy;
}

export interface HubSpokeRelationship {
  hubUrl: string;
  spokeUrl: string;
  relationship: 'state-to-city' | 'city-to-filter' | 'filter-to-combination';
  strength: number;
  anchorText: string;
  context: string;
}

export interface ContextualLinkRecommendation {
  sourceUrl: string;
  sourceTitle: string;
  recommendedLinks: ContextualLink[];
  implementationGuidance: ImplementationGuidance;
}

export interface ContextualLink {
  targetUrl: string;
  targetTitle: string;
  anchorText: string;
  placement: 'content' | 'sidebar' | 'footer' | 'header';
  relevance: number;
  linkType: 'navigational' | 'contextual' | 'relational' | 'hierarchical' | 'cross-referential';
  priority: number;
}

export interface AnchorTextStrategy {
  linkType: LinkRelationship['linkType'];
  variations: AnchorTextVariation[];
  distributionRatio: Record<string, number>;
  qualityGuidelines: string[];
  avoidancePatterns: string[];
}

export interface MetropolitanArea {
  name: string;
  cities: LinkingNode[];
}

export interface LinkingPerformanceMetrics {
  totalPages: number;
  totalLinks: number;
  averageLinksPerPage: number;
  hubPages: number;
  spokePages: number;
  hubSpokeRatio: number;
  averageLinkDepth: number;
  clustersFormed: number;
  geographicConnections: number;
  recommendedOptimizations: string[];
}

export interface ImplementationGuide {
  phases: ImplementationPhase[];
  technicalRequirements: string[];
  successMetrics: string[];
}

export interface ImplementationPhase {
  phase: number;
  name: string;
  description: string;
  tasks: string[];
  timeline: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface MonitoringStrategy {
  metrics: MonitoringMetric[];
  tools: string[];
  reportingSchedule: Record<string, string>;
}

export interface MonitoringMetric {
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  alertThreshold: string;
}

export interface ImplementationGuidance {
  recommendedPlacements: Array<{
    url: string;
    placement: string;
    context: string;
  }>;
  priorityOrder: string[];
  implementationNotes: string[];
}

/**
 * Export utility functions
 */
export async function generateSiteInternalLinkingPlan(): Promise<InternalLinkingPlan> {
  const linkingStrategy = new InternalLinkingStrategy();
  return await linkingStrategy.generateComprehensiveLinkingPlan();
}

export function exportLinkingPlanToMarkdown(plan: InternalLinkingPlan): string {
  let markdown = '# Internal Linking Strategy Plan\n\n';
  
  markdown += `## Overview\n`;
  markdown += `- Total Pages: ${plan.performanceMetrics.totalPages}\n`;
  markdown += `- Total Links: ${plan.performanceMetrics.totalLinks}\n`;
  markdown += `- Hub Pages: ${plan.performanceMetrics.hubPages}\n`;
  markdown += `- Spoke Pages: ${plan.performanceMetrics.spokePages}\n`;
  markdown += `- Average Links per Page: ${plan.performanceMetrics.averageLinksPerPage.toFixed(1)}\n\n`;

  markdown += `## Hub-Spoke Relationships\n`;
  plan.hubSpokeRelationships.slice(0, 10).forEach(rel => {
    markdown += `- ${rel.hubUrl} → ${rel.spokeUrl} (${rel.relationship})\n`;
  });

  markdown += `\n## Implementation Guide\n`;
  plan.implementationGuide.phases.forEach(phase => {
    markdown += `### Phase ${phase.phase}: ${phase.name}\n`;
    markdown += `**Timeline:** ${phase.timeline} | **Priority:** ${phase.priority}\n\n`;
    markdown += `${phase.description}\n\n`;
    markdown += `**Tasks:**\n`;
    phase.tasks.forEach(task => {
      markdown += `- ${task}\n`;
    });
    markdown += '\n';
  });

  return markdown;
}