import { test, expect, Page } from '@playwright/test';

interface SEOMetrics {
  title: string | null;
  description: string | null;
  keywords: string | null;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogType: string | null;
  ogUrl: string | null;
  twitterCard: string | null;
  structuredDataCount: number;
  h1Count: number;
  h1Text: string;
  metaRobots: string | null;
  hreflangCount: number;
}

async function analyzeSEO(page: Page): Promise<SEOMetrics> {
  return await page.evaluate(() => {
    // Get meta tags
    const getMetaContent = (name: string) => {
      const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      return meta ? meta.getAttribute('content') : null;
    };

    // Get structured data
    const structuredDataElements = document.querySelectorAll('script[type="application/ld+json"]');
    
    // Get H1 tags
    const h1Elements = document.querySelectorAll('h1');
    const h1Text = h1Elements.length > 0 ? h1Elements[0].textContent || '' : '';
    
    // Get canonical URL
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    const canonicalUrl = canonicalLink ? canonicalLink.getAttribute('href') : null;
    
    // Get hreflang count
    const hreflangCount = document.querySelectorAll('link[hreflang]').length;

    return {
      title: document.title,
      description: getMetaContent('description'),
      keywords: getMetaContent('keywords'),
      canonicalUrl,
      ogTitle: getMetaContent('og:title'),
      ogDescription: getMetaContent('og:description'),
      ogType: getMetaContent('og:type'),
      ogUrl: getMetaContent('og:url'),
      twitterCard: getMetaContent('twitter:card'),
      structuredDataCount: structuredDataElements.length,
      h1Count: h1Elements.length,
      h1Text: h1Text.trim(),
      metaRobots: getMetaContent('robots'),
      hreflangCount
    };
  });
}

async function validateStructuredData(page: Page) {
  return await page.evaluate(() => {
    const structuredDataElements = document.querySelectorAll('script[type="application/ld+json"]');
    const structuredData = [];
    
    for (const element of structuredDataElements) {
      try {
        const data = JSON.parse(element.textContent || '');
        structuredData.push(data);
      } catch (e) {
        structuredData.push({ error: 'Invalid JSON' });
      }
    }
    
    return structuredData;
  });
}

test.describe('SEO Tests', () => {
  test.describe('Base City Pages SEO', () => {
    test('Dallas electricity plans page has optimal SEO', async ({ page }) => {
      await page.goto('/texas/dallas/electricity-plans');
      await page.waitForSelector('h1', { timeout: 10000 });
      
      const seo = await analyzeSEO(page);
      console.log('Dallas SEO Metrics:', seo);

      // Title optimization
      expect(seo.title).toBeTruthy();
      expect(seo.title).toMatch(/Dallas.*Electricity.*Plans/i);
      expect(seo.title).toMatch(/Texas/i);
      expect(seo.title!.length).toBeGreaterThan(30);
      expect(seo.title!.length).toBeLessThan(60); // Google's recommended title length

      // Meta description optimization
      expect(seo.description).toBeTruthy();
      expect(seo.description).toMatch(/Dallas/i);
      expect(seo.description).toMatch(/electricity/i);
      expect(seo.description).toMatch(/plans/i);
      expect(seo.description!.length).toBeGreaterThan(120);
      expect(seo.description!.length).toBeLessThan(160); // Google's recommended description length

      // H1 optimization
      expect(seo.h1Count).toBe(1); // Exactly one H1
      expect(seo.h1Text).toMatch(/Dallas/i);
      expect(seo.h1Text).toMatch(/electricity/i);

      // Canonical URL
      expect(seo.canonicalUrl).toBeTruthy();
      expect(seo.canonicalUrl).toContain('/texas/dallas/electricity-plans');
      expect(seo.canonicalUrl).not.toContain('?'); // No query parameters
      expect(seo.canonicalUrl).not.toContain('#'); // No fragments

      // Open Graph tags
      expect(seo.ogTitle).toBeTruthy();
      expect(seo.ogDescription).toBeTruthy();
      expect(seo.ogType).toBe('website');
      expect(seo.ogUrl).toBeTruthy();

      // Twitter Card
      expect(seo.twitterCard).toBeTruthy();
      expect(seo.twitterCard).toMatch(/summary|summary_large_image/);

      // Structured data
      expect(seo.structuredDataCount).toBeGreaterThan(0);

      // Meta robots (should allow indexing)
      if (seo.metaRobots) {
        expect(seo.metaRobots).not.toContain('noindex');
      }
    });

    test('Houston electricity plans page has consistent SEO', async ({ page }) => {
      await page.goto('/texas/houston/electricity-plans');
      await page.waitForSelector('h1', { timeout: 10000 });
      
      const seo = await analyzeSEO(page);
      console.log('Houston SEO Metrics:', seo);

      // Similar checks as Dallas
      expect(seo.title).toMatch(/Houston.*Electricity.*Plans/i);
      expect(seo.description).toMatch(/Houston/i);
      expect(seo.h1Text).toMatch(/Houston/i);
      expect(seo.canonicalUrl).toContain('/texas/houston/electricity-plans');
      expect(seo.structuredDataCount).toBeGreaterThan(0);
    });

    test('Fort Worth electricity plans page maintains SEO standards', async ({ page }) => {
      await page.goto('/texas/fort-worth/electricity-plans');
      await page.waitForSelector('h1', { timeout: 10000 });
      
      const seo = await analyzeSEO(page);
      console.log('Fort Worth SEO Metrics:', seo);

      expect(seo.title).toMatch(/Fort.*Worth.*Electricity.*Plans/i);
      expect(seo.description).toMatch(/Fort.*Worth/i);
      expect(seo.h1Text).toMatch(/Fort.*Worth/i);
      expect(seo.canonicalUrl).toContain('/texas/fort-worth/electricity-plans');
    });
  });

  test.describe('Filtered Pages SEO', () => {
    test('12-month filtered page has optimized SEO', async ({ page }) => {
      await page.goto('/texas/dallas/electricity-plans/12-month');
      await page.waitForSelector('h1', { timeout: 10000 });
      
      const seo = await analyzeSEO(page);
      console.log('12-Month Filter SEO:', seo);

      // Title should include filter information
      expect(seo.title).toMatch(/12.*Month/i);
      expect(seo.title).toMatch(/Dallas/i);
      expect(seo.title).toMatch(/Electricity/i);

      // Description should mention the filter
      expect(seo.description).toMatch(/12.*month/i);
      expect(seo.description).toMatch(/Dallas/i);

      // H1 should reflect the filtered content
      expect(seo.h1Text).toMatch(/12/);
      expect(seo.h1Text).toMatch(/Dallas/i);

      // Canonical should point to filtered URL
      expect(seo.canonicalUrl).toContain('/texas/dallas/electricity-plans/12-month');
    });

    test('Green energy filtered page has environmental SEO', async ({ page }) => {
      await page.goto('/texas/houston/electricity-plans/green-energy');
      await page.waitForSelector('h1', { timeout: 10000 });
      
      const seo = await analyzeSEO(page);
      console.log('Green Energy Filter SEO:', seo);

      expect(seo.title).toMatch(/Green.*Energy|Renewable/i);
      expect(seo.title).toMatch(/Houston/i);
      expect(seo.description).toMatch(/green|renewable|clean/i);
      expect(seo.h1Text).toMatch(/Green|Renewable/i);
    });

    test('Multi-filter page has comprehensive SEO', async ({ page }) => {
      await page.goto('/texas/austin/electricity-plans/12-month+green-energy');
      await page.waitForSelector('h1', { timeout: 10000 });
      
      const seo = await analyzeSEO(page);
      console.log('Multi-Filter SEO:', seo);

      // Should include both filter terms
      expect(seo.title).toMatch(/12.*Month/i);
      expect(seo.title).toMatch(/Green|Renewable/i);
      expect(seo.title).toMatch(/Austin/i);
      
      expect(seo.description).toMatch(/12.*month/i);
      expect(seo.description).toMatch(/green|renewable/i);
      
      // Canonical URL should be properly formatted
      expect(seo.canonicalUrl).toContain('12-month+green-energy');
    });
  });

  test.describe('Structured Data Validation', () => {
    test('Pages include valid LocalBusiness schema', async ({ page }) => {
      await page.goto('/texas/dallas/electricity-plans');
      await page.waitForSelector('h1', { timeout: 10000 });
      
      const structuredData = await validateStructuredData(page);
      console.log('Structured Data:', structuredData);
      
      expect(structuredData.length).toBeGreaterThan(0);
      
      // Look for LocalBusiness or Organization schema
      const businessSchema = structuredData.find(data => 
        data['@type'] === 'LocalBusiness' || 
        data['@type'] === 'Organization' ||
        (Array.isArray(data['@type']) && data['@type'].includes('LocalBusiness'))
      );
      
      if (businessSchema) {
        expect(businessSchema['@context']).toBe('https://schema.org');
        expect(businessSchema.name).toBeTruthy();
        expect(businessSchema.description).toBeTruthy();
      }
    });

    test('Product/Service schema is present for plan listings', async ({ page }) => {
      await page.goto('/texas/houston/electricity-plans');
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      const structuredData = await validateStructuredData(page);
      
      // Look for Product, Service, or ItemList schema
      const productSchema = structuredData.find(data => 
        data['@type'] === 'Product' || 
        data['@type'] === 'Service' ||
        data['@type'] === 'ItemList' ||
        (Array.isArray(data['@type']) && (
          data['@type'].includes('Product') || 
          data['@type'].includes('Service') ||
          data['@type'].includes('ItemList')
        ))
      );
      
      if (productSchema) {
        expect(productSchema['@context']).toBe('https://schema.org');
        
        if (productSchema['@type'] === 'ItemList') {
          expect(productSchema.itemListElement).toBeTruthy();
        }
      }
    });

    test('Breadcrumb schema is implemented', async ({ page }) => {
      await page.goto('/texas/fort-worth/electricity-plans/12-month');
      await page.waitForSelector('h1', { timeout: 10000 });
      
      const structuredData = await validateStructuredData(page);
      
      // Look for BreadcrumbList schema
      const breadcrumbSchema = structuredData.find(data => 
        data['@type'] === 'BreadcrumbList'
      );
      
      if (breadcrumbSchema) {
        expect(breadcrumbSchema['@context']).toBe('https://schema.org');
        expect(breadcrumbSchema.itemListElement).toBeTruthy();
        expect(Array.isArray(breadcrumbSchema.itemListElement)).toBe(true);
        expect(breadcrumbSchema.itemListElement.length).toBeGreaterThan(1);
      }
    });
  });

  test.describe('Technical SEO', () => {
    test('Pages have proper heading hierarchy', async ({ page }) => {
      await page.goto('/texas/dallas/electricity-plans');
      await page.waitForSelector('h1', { timeout: 10000 });
      
      const headingStructure = await page.evaluate(() => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return Array.from(headings).map(h => ({
          tag: h.tagName.toLowerCase(),
          text: h.textContent?.trim() || '',
          isEmpty: !h.textContent?.trim()
        }));
      });
      
      console.log('Heading Structure:', headingStructure);
      
      // Should have exactly one H1
      const h1Count = headingStructure.filter(h => h.tag === 'h1').length;
      expect(h1Count).toBe(1);
      
      // H1 should not be empty
      const h1 = headingStructure.find(h => h.tag === 'h1');
      expect(h1?.isEmpty).toBe(false);
      
      // Should have H2s for section organization
      const h2Count = headingStructure.filter(h => h.tag === 'h2').length;
      expect(h2Count).toBeGreaterThan(0);
    });

    test('Images have proper alt attributes', async ({ page }) => {
      await page.goto('/texas/houston/electricity-plans');
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      const images = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        return Array.from(imgs).map(img => ({
          src: img.src,
          alt: img.alt,
          hasAlt: img.hasAttribute('alt'),
          isDecorative: img.alt === '',
          isLoading: img.loading
        }));
      });
      
      console.log('Image Analysis:', images);
      
      // All images should have alt attributes
      images.forEach(img => {
        expect(img.hasAlt).toBe(true);
      });
      
      // Content images should have descriptive alt text
      const contentImages = images.filter(img => !img.isDecorative);
      contentImages.forEach(img => {
        if (img.alt) {
          expect(img.alt.length).toBeGreaterThan(5);
        }
      });
    });

    test('Internal linking structure is optimized', async ({ page }) => {
      await page.goto('/texas/dallas/electricity-plans');
      await page.waitForSelector('h1', { timeout: 10000 });
      
      const internalLinks = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]');
        return Array.from(links).map(link => ({
          href: link.getAttribute('href'),
          text: link.textContent?.trim() || '',
          hasText: !!link.textContent?.trim(),
          isEmpty: !link.textContent?.trim()
        }));
      });
      
      console.log('Internal Links:', internalLinks.length);
      
      // Should have internal navigation links
      expect(internalLinks.length).toBeGreaterThan(5);
      
      // Links should have descriptive text
      const textLinks = internalLinks.filter(link => link.hasText);
      expect(textLinks.length).toBeGreaterThan(3);
      
      // No empty links (except image links)
      const emptyTextLinks = internalLinks.filter(link => link.isEmpty);
      expect(emptyTextLinks.length).toBeLessThan(internalLinks.length * 0.2); // Less than 20%
    });

    test('Page loading performance impacts SEO', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/texas/fort-worth/electricity-plans');
      await page.waitForSelector('h1', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      console.log('Page Load Time:', loadTime, 'ms');
      
      // Fast loading improves SEO
      expect(loadTime).toBeLessThan(5000); // 5 seconds max for SEO
      
      // Check for Core Web Vitals indicators
      const performanceInfo = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          firstByte: navigation.responseStart - navigation.navigationStart,
          domComplete: navigation.domComplete - navigation.navigationStart
        };
      });
      
      console.log('Performance Metrics:', performanceInfo);
      
      // SEO-friendly loading times
      expect(performanceInfo.firstByte).toBeLessThan(1000); // 1 second TTFB
      expect(performanceInfo.domContentLoaded).toBeLessThan(3000); // 3 seconds DCL
    });
  });

  test.describe('Mobile SEO', () => {
    test('Mobile pages have proper viewport and responsive design', async ({ page, isMobile }) => {
      if (!isMobile) {
        await page.setViewportSize({ width: 375, height: 667 });
      }
      
      await page.goto('/texas/dallas/electricity-plans');
      await page.waitForSelector('h1', { timeout: 10000 });
      
      // Check viewport meta tag
      const viewportMeta = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        return meta ? meta.getAttribute('content') : null;
      });
      
      expect(viewportMeta).toBeTruthy();
      expect(viewportMeta).toContain('width=device-width');
      expect(viewportMeta).toContain('initial-scale=1');
      
      // Verify mobile-friendly elements
      const mobileElements = await page.evaluate(() => {
        const planCard = document.querySelector('.plan-card');
        if (!planCard) return null;
        
        const rect = planCard.getBoundingClientRect();
        return {
          width: rect.width,
          isVisible: rect.width > 0 && rect.height > 0,
          fitsScreen: rect.width <= window.innerWidth
        };
      });
      
      if (mobileElements) {
        expect(mobileElements.isVisible).toBe(true);
        expect(mobileElements.fitsScreen).toBe(true);
      }
    });
  });

  test.describe('Local SEO', () => {
    test('Texas location data is properly structured', async ({ page }) => {
      await page.goto('/texas/houston/electricity-plans');
      await page.waitForSelector('h1', { timeout: 10000 });
      
      const locationData = await page.evaluate(() => {
        const title = document.title;
        const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const h1 = document.querySelector('h1')?.textContent || '';
        
        return {
          title,
          description,
          h1,
          hasTexas: [title, description, h1].some(text => text.toLowerCase().includes('texas')),
          hasCity: [title, description, h1].some(text => text.toLowerCase().includes('houston'))
        };
      });
      
      console.log('Location SEO Data:', locationData);
      
      expect(locationData.hasTexas).toBe(true);
      expect(locationData.hasCity).toBe(true);
    });

    test('Service area information is included', async ({ page }) => {
      await page.goto('/texas/fort-worth/electricity-plans');
      await page.waitForSelector('h1', { timeout: 10000 });
      
      const serviceAreaInfo = await page.evaluate(() => {
        const bodyText = document.body.textContent?.toLowerCase() || '';
        return {
          mentionsTDSP: bodyText.includes('oncor') || bodyText.includes('centerpoint') || bodyText.includes('tnmp'),
          mentionsServiceArea: bodyText.includes('service area') || bodyText.includes('delivery'),
          mentionsTexasMarket: bodyText.includes('deregulated') || bodyText.includes('choice')
        };
      });
      
      console.log('Service Area SEO:', serviceAreaInfo);
      
      // Should mention relevant utility/service information
      expect(
        serviceAreaInfo.mentionsTDSP || 
        serviceAreaInfo.mentionsServiceArea || 
        serviceAreaInfo.mentionsTexasMarket
      ).toBe(true);
    });
  });

  test.describe('Content SEO Quality', () => {
    test('Pages have sufficient content depth', async ({ page }) => {
      await page.goto('/texas/dallas/electricity-plans');
      await page.waitForSelector('.plan-card', { timeout: 30000 });
      
      const contentAnalysis = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        const words = bodyText.trim().split(/\s+/).filter(word => word.length > 2);
        
        return {
          wordCount: words.length,
          hasMinimumContent: words.length >= 300, // Minimum for SEO
          paragraphCount: document.querySelectorAll('p').length,
          listCount: document.querySelectorAll('ul, ol').length
        };
      });
      
      console.log('Content Analysis:', contentAnalysis);
      
      expect(contentAnalysis.hasMinimumContent).toBe(true);
      expect(contentAnalysis.paragraphCount).toBeGreaterThan(3);
    });

    test('Content includes relevant electricity industry keywords', async ({ page }) => {
      await page.goto('/texas/houston/electricity-plans');
      await page.waitForSelector('h1', { timeout: 10000 });
      
      const keywordAnalysis = await page.evaluate(() => {
        const text = document.body.textContent?.toLowerCase() || '';
        
        const electricityKeywords = [
          'electricity', 'energy', 'power', 'electric', 'utility',
          'kwh', 'kilowatt', 'rate', 'plan', 'provider', 'supplier'
        ];
        
        const texasKeywords = [
          'texas', 'deregulated', 'choice', 'competitive', 'tdsp'
        ];
        
        const foundElectricityKeywords = electricityKeywords.filter(keyword => text.includes(keyword));
        const foundTexasKeywords = texasKeywords.filter(keyword => text.includes(keyword));
        
        return {
          electricityKeywordCount: foundElectricityKeywords.length,
          texasKeywordCount: foundTexasKeywords.length,
          foundElectricityKeywords,
          foundTexasKeywords
        };
      });
      
      console.log('Keyword Analysis:', keywordAnalysis);
      
      expect(keywordAnalysis.electricityKeywordCount).toBeGreaterThan(5);
      expect(keywordAnalysis.texasKeywordCount).toBeGreaterThan(2);
    });
  });
});