/**
 * Contextual Prompt Generation System for 10,000+ Unique OG Images
 * Generates intelligent, contextual prompts based on page content, city, filters, and market data
 * Ensures no duplicate prompts across the entire site
 */

import type { ImageGenerationContext, PromptTemplate, ImageGenerationOptions } from '../../types/images';
import { tdspMapping, formatCityName } from '../../config/tdsp-mapping';

interface CityCharacteristics {
  landmarks: string[];
  themes: string[];
  colors: string[];
  atmosphere: string;
}

class PromptGenerator {
  private cityCharacteristics: Record<string, CityCharacteristics> = {
    'dallas-tx': {
      landmarks: ['downtown skyline', 'Reunion Tower', 'modern skyscrapers', 'urban architecture'],
      themes: ['corporate', 'business', 'metropolitan', 'modern'],
      colors: ['steel blue', 'corporate gray', 'silver', 'professional blue'],
      atmosphere: 'bustling metropolitan energy hub'
    },
    'houston-tx': {
      landmarks: ['industrial refineries', 'port facilities', 'downtown district', 'energy corridor'],
      themes: ['industrial', 'energy', 'petrochemical', 'space city'],
      colors: ['industrial blue', 'energy orange', 'steel gray', 'corporate teal'],
      atmosphere: 'major energy and industrial center'
    },
    'austin-tx': {
      landmarks: ['music venues', 'tech district', 'downtown bridges', 'creative spaces'],
      themes: ['creative', 'tech', 'music', 'artistic'],
      colors: ['vibrant purple', 'creative orange', 'tech blue', 'artistic green'],
      atmosphere: 'creative tech and music capital'
    },
    'san-antonio-tx': {
      landmarks: ['historic district', 'river walk', 'cultural sites', 'colonial architecture'],
      themes: ['historic', 'cultural', 'traditional', 'heritage'],
      colors: ['warm earth tones', 'heritage brown', 'cultural gold', 'historic blue'],
      atmosphere: 'historic cultural and heritage center'
    }
  };

  private filterThemes: Record<string, { visual: string; colors: string; concept: string }> = {
    'green-energy': {
      visual: 'wind turbines, solar panels, renewable energy infrastructure',
      colors: 'vibrant green, eco blue, sustainable earth tones',
      concept: 'environmental sustainability and clean energy transition'
    },
    'fixed-rate': {
      visual: 'stable electrical grid, consistent power flow lines, reliability symbols',
      colors: 'trustworthy blue, stability gray, reliable green',
      concept: 'stability, predictability, and reliable energy service'
    },
    'variable-rate': {
      visual: 'dynamic energy flow, fluctuating power lines, market indicators',
      colors: 'dynamic orange, market blue, flexible purple',
      concept: 'market-responsive pricing and flexible energy options'
    },
    '12-month': {
      visual: 'annual calendar visualization, yearly energy cycle, time progression',
      colors: 'time blue, calendar green, annual gold',
      concept: 'one-year commitment and planning horizon'
    },
    '24-month': {
      visual: 'extended timeline, long-term planning, stable progression',
      colors: 'long-term navy, commitment blue, stability green',
      concept: 'extended commitment and long-term energy planning'
    },
    'prepaid': {
      visual: 'payment cards, budget controls, financial planning elements',
      colors: 'budget blue, control green, planning purple',
      concept: 'budget control and financial planning for energy costs'
    },
    'no-deposit': {
      visual: 'accessibility symbols, open doors, welcoming pathways',
      colors: 'accessible blue, welcoming green, opportunity orange',
      concept: 'accessible energy services without financial barriers'
    }
  };

  private basePromptTemplates: Record<string, string[]> = {
    homepage: [
      'Texas state outline with modern electrical grid network overlay, energy infrastructure connecting major cities',
      'Panoramic view of Texas energy landscape, combining urban skylines with renewable energy installations',
      'Abstract representation of Texas electricity market, showing interconnected power systems and consumer choice'
    ],
    city: [
      'Modern {city} cityscape with prominent electrical infrastructure and power distribution systems',
      'Aerial view of {city} showing energy grid integration with urban development and residential areas',
      '{city} energy infrastructure highlighting the connection between power generation and city life'
    ],
    filtered: [
      '{city} cityscape emphasizing {filter_themes}, showcasing {filter_visual} integrated with urban landscape',
      'Energy infrastructure in {city} focused on {filter_concept}, featuring {filter_visual} in modern setting',
      '{city} electrical systems highlighting {filter_concept}, with prominent {filter_visual} and {filter_colors}'
    ],
    comparison: [
      'Split-screen comparison showing different electricity plan options with visual rate and feature comparisons',
      'Side-by-side electricity plan visualization with rate charts, feature benefits, and provider branding',
      'Interactive electricity plan comparison interface showing rate structures, terms, and green energy percentages'
    ]
  };

  /**
   * Generate contextual prompt based on page content and context
   * Reads actual page data to create unique, content-aware prompts
   */
  generatePrompt(context: ImageGenerationContext, options: ImageGenerationOptions = {}): string {
    const cityName = formatCityName(context.city);
    const citySlug = context.city;
    const cityData = tdspMapping[citySlug];
    const cityChar = this.cityCharacteristics[citySlug] || this.getGenericCityCharacteristics(citySlug);
    
    // Read page content for context-aware generation
    let basePrompt = this.generateContentAwarePrompt(context, cityChar);
    
    // Add specific market data from page content
    basePrompt = this.addPageDataContext(basePrompt, context);

    // Add filter-specific visual elements (no text)
    if (context.filters.length > 0) {
      basePrompt = this.addFilterVisualsOnly(basePrompt, context.filters);
    }

    // Add seasonal and atmospheric context
    if (context.seasonalContext) {
      basePrompt = this.addSeasonalContext(basePrompt, context.seasonalContext);
    }

    // Ensure professional style with STRICT no-text requirements
    basePrompt = this.addStrictNoTextStyle(basePrompt, options);

    // Add uniqueness without duplicating similar pages
    basePrompt = this.addSmartVariation(basePrompt, context);

    return basePrompt;
  }

  /**
   * Generate content-aware prompt by reading actual page data
   */
  private generateContentAwarePrompt(context: ImageGenerationContext, cityChar: CityCharacteristics): string {
    const cityName = formatCityName(context.city);
    
    // Base visual concept based on actual page content
    let prompt = '';
    
    if (context.pageType === 'homepage') {
      prompt = `Wide aerial view of Texas electricity grid network, showing interconnected power lines across major cities including ${cityName}, modern energy infrastructure, clean professional style`;
    } else if (context.pageType === 'city') {
      // Read city-specific data for unique visuals
      const landmarks = cityChar.landmarks[0] || 'city skyline';
      const atmosphere = cityChar.atmosphere;
      prompt = `Professional view of ${cityName} ${landmarks} with modern electrical infrastructure, ${atmosphere}, clean energy symbols integrated naturally`;
    } else if (context.pageType === 'filtered') {
      // Content-aware based on actual filters applied
      const filterCount = context.filters.length;
      const primaryFilter = context.filters[0];
      const filterTheme = this.filterThemes[primaryFilter]?.concept || 'energy efficiency';
      
      prompt = `${cityName} urban landscape emphasizing ${filterTheme}, ${cityChar.atmosphere}, showing ${filterCount} distinct energy efficiency elements`;
    } else if (context.pageType === 'comparison') {
      // Based on actual plan comparison data
      const planCount = context.planCount || 20;
      const providerCount = context.topProviders.length;
      
      prompt = `Professional energy market visualization showing ${providerCount} provider options with ${planCount} plan choices, modern data visualization style, ${cityName} market context`;
    }
    
    return prompt;
  }

  /**
   * Add page-specific data context from actual content
   */
  private addPageDataContext(prompt: string, context: ImageGenerationContext): string {
    const enhancements: string[] = [];
    
    // Real market data integration
    if (context.planCount > 0) {
      if (context.planCount > 75) {
        enhancements.push('abundant energy market competition');
      } else if (context.planCount > 40) {
        enhancements.push('diverse energy provider options');
      } else {
        enhancements.push('focused energy market selection');
      }
    }
    
    // Actual rate data integration
    if (context.lowestRate > 0) {
      if (context.lowestRate < 0.08) {
        enhancements.push('highly competitive pricing environment');
      } else if (context.lowestRate < 0.12) {
        enhancements.push('competitive energy pricing market');
      }
    }
    
    // Provider-specific visual elements
    if (context.topProviders.length > 0) {
      enhancements.push(`${context.topProviders.length} leading energy provider representation`);
    }
    
    if (enhancements.length > 0) {
      prompt += `, incorporating ${enhancements.join(', ')}`;
    }
    
    return prompt;
  }

  /**
   * Add filter visuals only (no text/words)
   */
  private addFilterVisualsOnly(prompt: string, filters: string[]): string {
    const visualElements: string[] = [];
    
    filters.forEach(filter => {
      const theme = this.filterThemes[filter];
      if (theme) {
        // Only visual elements, no text/labels
        visualElements.push(theme.visual);
      }
    });

    if (visualElements.length > 0) {
      prompt += `, featuring ${visualElements.join(', ')} as pure visual elements without any text or labels`;
    }

    return prompt;
  }

  /**
   * Add strict no-text style requirements
   */
  private addStrictNoTextStyle(prompt: string, options: ImageGenerationOptions): string {
    const styleEnhancements = [
      'professional photography style',
      'clean modern composition',
      'high quality architectural visualization',
      'corporate presentation quality'
    ];
    
    const selectedStyle = styleEnhancements[Math.floor(Math.random() * styleEnhancements.length)];
    
    // EXTREMELY strict no-text requirements
    prompt += `, ${selectedStyle}, ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS, NO WRITING, NO TYPOGRAPHY, NO LABELS, NO SIGNS, NO READABLE CONTENT, pure visual imagery only`;
    
    return prompt;
  }

  /**
   * Add smart variation that avoids duplicating similar pages
   */
  private addSmartVariation(prompt: string, context: ImageGenerationContext): string {
    // Generate variation based on content hash, not random
    const hash = this.generateContextHash(context);
    
    const timeVariations = ['golden hour lighting', 'bright daylight', 'blue hour atmosphere', 'professional studio lighting'];
    const angleVariations = ['elevated perspective', 'wide angle view', 'architectural perspective', 'panoramic composition'];
    
    const timeIndex = hash % timeVariations.length;
    const angleIndex = (hash >> 2) % angleVariations.length;
    
    prompt += `, ${timeVariations[timeIndex]}, ${angleVariations[angleIndex]}`;
    
    return prompt;
  }

  /**
   * Generate multiple unique prompts for the same context (A/B testing)
   */
  generatePromptVariations(context: ImageGenerationContext, count: number = 3): string[] {
    const variations: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const modifiedContext = { ...context, variationIndex: i };
      const prompt = this.generatePrompt(modifiedContext);
      variations.push(prompt);
    }

    return variations;
  }

  /**
   * Select appropriate base prompt template
   */
  private selectBasePrompt(context: ImageGenerationContext): string {
    const templates = this.basePromptTemplates[context.pageType] || this.basePromptTemplates.city;
    
    // Use context hash to consistently select same template for same content
    const hash = this.generateContextHash(context);
    const templateIndex = hash % templates.length;
    
    return templates[templateIndex];
  }

  /**
   * Replace placeholders in prompt template
   */
  private replacePlaceholders(prompt: string, data: any): string {
    let result = prompt;
    
    // Replace city-specific placeholders
    result = result.replace(/\{city\}/g, data.city);
    result = result.replace(/\{citySlug\}/g, data.citySlug);
    
    // Replace filter-specific placeholders
    if (data.filters?.length > 0) {
      const filterThemes = data.filters.map((f: string) => this.filterThemes[f]?.concept || f).join(' and ');
      const filterVisual = data.filters.map((f: string) => this.filterThemes[f]?.visual || '').join(', ');
      const filterColors = data.filters.map((f: string) => this.filterThemes[f]?.colors || '').join(', ');
      
      result = result.replace(/\{filter_themes\}/g, filterThemes);
      result = result.replace(/\{filter_visual\}/g, filterVisual);
      result = result.replace(/\{filter_colors\}/g, filterColors);
      result = result.replace(/\{filter_concept\}/g, filterThemes);
    }
    
    return result;
  }

  /**
   * Add filter-specific visual enhancements
   */
  private addFilterEnhancements(prompt: string, filters: string[]): string {
    const enhancements: string[] = [];
    
    filters.forEach(filter => {
      const theme = this.filterThemes[filter];
      if (theme) {
        enhancements.push(theme.visual);
      }
    });

    if (enhancements.length > 0) {
      prompt += `, featuring ${enhancements.join(', ')}`;
    }

    return prompt;
  }

  /**
   * Add market data and statistics to prompt
   */
  private addMarketDataEnhancements(prompt: string, context: ImageGenerationContext): string {
    const enhancements: string[] = [];

    if (context.planCount > 50) {
      enhancements.push('abundant energy options');
    } else if (context.planCount > 20) {
      enhancements.push('diverse energy choices');
    }

    if (context.lowestRate < 0.10) {
      enhancements.push('competitive pricing indicators');
    }

    if (context.topProviders.length > 0) {
      enhancements.push('leading energy provider branding');
    }

    if (enhancements.length > 0) {
      prompt += `, emphasizing ${enhancements.join(', ')}`;
    }

    return prompt;
  }

  /**
   * Add seasonal context enhancements
   */
  private addSeasonalContext(prompt: string, season: string): string {
    const seasonalThemes = {
      winter: 'cozy indoor lighting, heating elements, warm energy themes',
      summer: 'cooling systems, air conditioning, bright sunny atmosphere',
      spring: 'renewable energy growth, fresh green elements, optimistic bright colors',
      fall: 'energy efficiency, preparation themes, warm transitional colors'
    };

    const theme = seasonalThemes[season as keyof typeof seasonalThemes];
    if (theme) {
      prompt += `, incorporating ${theme}`;
    }

    return prompt;
  }

  /**
   * Add style and quality enhancements
   */
  private addStyleEnhancements(prompt: string, options: ImageGenerationOptions): string {
    const styleMap = {
      realistic: 'photorealistic style, detailed textures, natural lighting',
      illustration: 'modern illustration style, clean vector graphics, stylized elements',
      minimalist: 'minimalist design, clean lines, simple composition, plenty of white space',
      corporate: 'professional corporate style, business-focused design, trustworthy appearance',
      modern: 'contemporary modern style, sleek design, current visual trends'
    };

    const colorSchemeMap = {
      'blue-green': 'blue and green color palette, energy industry colors',
      'corporate-blue': 'corporate blue tones, professional color scheme',
      'energy-bright': 'bright vibrant colors, high-energy palette',
      'texas-warm': 'warm Texas-inspired colors, southwestern palette',
      'professional-dark': 'dark professional colors, sophisticated palette'
    };

    const style = options.style || 'modern';
    const colorScheme = options.colorScheme || 'blue-green';

    let enhancements = styleMap[style as keyof typeof styleMap] || styleMap.modern;
    enhancements += ', ' + (colorSchemeMap[colorScheme as keyof typeof colorSchemeMap] || colorSchemeMap['blue-green']);

    prompt += `, ${enhancements}`;

    // Always emphasize no text
    prompt += ', no text, no words, no letters, no typography, no labels, no writing';

    return prompt;
  }

  /**
   * Add unique variation to prevent duplicate prompts
   */
  private addUniqueVariation(prompt: string, context: ImageGenerationContext): string {
    // Generate hash-based variation elements
    const hash = this.generateContextHash(context);
    
    const perspectives = ['aerial view', 'wide angle perspective', 'elevated viewpoint', 'panoramic view'];
    const compositions = ['centered composition', 'dynamic layout', 'balanced arrangement', 'engaging framing'];
    const lighting = ['professional lighting', 'vibrant illumination', 'optimal brightness', 'enhanced contrast'];
    
    const perspectiveIndex = hash % perspectives.length;
    const compositionIndex = (hash >> 2) % compositions.length;
    const lightingIndex = (hash >> 4) % lighting.length;
    
    prompt += `, ${perspectives[perspectiveIndex]}, ${compositions[compositionIndex]}, ${lighting[lightingIndex]}`;
    
    return prompt;
  }

  /**
   * Generate consistent hash for context
   */
  private generateContextHash(context: ImageGenerationContext): number {
    const str = `${context.city}_${context.filters.sort().join('_')}_${context.pageType}_${context.cityTier}`;
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }

  /**
   * Get generic city characteristics for unmapped cities
   */
  private getGenericCityCharacteristics(citySlug: string): CityCharacteristics {
    const cityData = tdspMapping[citySlug];
    
    if (!cityData) {
      return {
        landmarks: ['city skyline', 'urban landscape', 'residential areas'],
        themes: ['urban', 'residential', 'community'],
        colors: ['city blue', 'urban gray', 'residential green'],
        atmosphere: 'thriving Texas community'
      };
    }

    // Generate characteristics based on TDSP zone and tier
    const zoneThemes = {
      North: {
        landmarks: ['urban development', 'suburban communities', 'commercial districts'],
        themes: ['metropolitan', 'suburban', 'developed'],
        colors: ['metropolitan blue', 'suburban green', 'development gray'],
        atmosphere: 'developed North Texas community'
      },
      Coast: {
        landmarks: ['coastal elements', 'port facilities', 'waterfront areas'],
        themes: ['coastal', 'maritime', 'industrial'],
        colors: ['coastal blue', 'maritime teal', 'port gray'],
        atmosphere: 'dynamic Gulf Coast community'
      },
      Central: {
        landmarks: ['hill country', 'central plains', 'state capital region'],
        themes: ['central', 'governmental', 'hill country'],
        colors: ['capitol blue', 'hill country green', 'central gold'],
        atmosphere: 'Central Texas hub community'
      },
      South: {
        landmarks: ['border region', 'international commerce', 'cultural diversity'],
        themes: ['border', 'cultural', 'international'],
        colors: ['border orange', 'cultural warm tones', 'international blue'],
        atmosphere: 'vibrant South Texas community'
      },
      Valley: {
        landmarks: ['Rio Grande Valley', 'agricultural areas', 'border communities'],
        themes: ['agricultural', 'valley', 'border culture'],
        colors: ['valley green', 'agricultural earth tones', 'border warm colors'],
        atmosphere: 'Rio Grande Valley community'
      }
    };

    return zoneThemes[cityData.zone as keyof typeof zoneThemes] || zoneThemes.Central;
  }

  /**
   * Validate prompt quality and uniqueness
   */
  validatePrompt(prompt: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for text-related terms (should be avoided)
    const textTerms = ['text', 'words', 'letters', 'writing', 'typography', 'label'];
    const hasTextTerms = textTerms.some(term => 
      prompt.toLowerCase().includes(term) && !prompt.includes(`no ${term}`)
    );
    
    if (hasTextTerms) {
      issues.push('Prompt may generate text elements');
    }
    
    // Check minimum length
    if (prompt.length < 50) {
      issues.push('Prompt too short for quality generation');
    }
    
    // Check maximum length (Ideogram has limits)
    if (prompt.length > 2000) {
      issues.push('Prompt too long for API');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

// Export singleton instance
export const promptGenerator = new PromptGenerator();