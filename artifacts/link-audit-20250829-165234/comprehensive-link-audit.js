import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ComprehensiveLinkAuditor {
    constructor(baseUrl = 'http://localhost:4326') {
        this.baseUrl = baseUrl;
        this.browser = null;
        this.page = null;
        this.visitedUrls = new Set();
        this.allLinks = new Set();
        this.results = {
            passed: [],
            broken: [],
            issues: [],
            redirects: [],
            external: []
        };
        this.testStats = {
            totalTested: 0,
            totalPassed: 0,
            totalBroken: 0,
            totalIssues: 0,
            totalRedirects: 0
        };
    }

    async initialize() {
        console.log('🚀 Starting Comprehensive Link Audit for ChooseMyPower');
        console.log(`📍 Base URL: ${this.baseUrl}`);
        
        this.browser = await chromium.launch({ 
            headless: true,
            args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        });
        this.page = await this.browser.newPage();
        
        // Set longer timeout for slower connections
        this.page.setDefaultTimeout(30000);
        
        // Listen for console errors
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`❌ Console Error: ${msg.text()}`);
            }
        });
    }

    async discoverLinks(url, maxDepth = 3, currentDepth = 0) {
        if (currentDepth > maxDepth || this.visitedUrls.has(url)) {
            return;
        }

        console.log(`🔍 Discovering links on: ${url} (depth: ${currentDepth})`);
        this.visitedUrls.add(url);

        try {
            const response = await this.page.goto(url, { waitUntil: 'networkidle' });
            
            if (!response || !response.ok()) {
                console.log(`⚠️  Failed to load ${url}: ${response?.status()}`);
                return;
            }

            // Wait for dynamic content to load
            await this.page.waitForTimeout(2000);

            // Extract all links
            const links = await this.page.$$eval('a[href]', anchors => {
                return anchors.map(anchor => ({
                    url: anchor.href,
                    text: anchor.textContent?.trim() || '',
                    title: anchor.title || '',
                    className: anchor.className || ''
                }));
            });

            // Extract form action URLs
            const formActions = await this.page.$$eval('form[action]', forms => {
                return forms.map(form => ({
                    url: form.action,
                    text: 'Form Action',
                    title: 'Form submission',
                    className: 'form-action'
                }));
            });

            // Combine all discovered links
            const allDiscovered = [...links, ...formActions];

            for (const link of allDiscovered) {
                if (link.url && !this.allLinks.has(link.url)) {
                    this.allLinks.add(link.url);
                    
                    // If it's an internal link, recursively discover more
                    if (link.url.startsWith(this.baseUrl) && currentDepth < maxDepth) {
                        await this.discoverLinks(link.url, maxDepth, currentDepth + 1);
                    }
                }
            }

        } catch (error) {
            console.log(`❌ Error discovering links on ${url}: ${error.message}`);
        }
    }

    async testLink(url, linkText = '', context = '') {
        this.testStats.totalTested++;
        
        try {
            console.log(`🧪 Testing: ${url}`);
            
            // Check if it's an external link
            if (!url.startsWith(this.baseUrl) && (url.startsWith('http') || url.startsWith('https'))) {
                try {
                    const response = await this.page.goto(url, { timeout: 10000 });
                    if (response && response.ok()) {
                        this.results.external.push({
                            url,
                            status: response.status(),
                            text: linkText,
                            context,
                            result: 'PASS - External'
                        });
                    } else {
                        this.results.broken.push({
                            url,
                            status: response?.status() || 'No response',
                            text: linkText,
                            context,
                            error: 'External link failed'
                        });
                        this.testStats.totalBroken++;
                    }
                } catch (error) {
                    this.results.broken.push({
                        url,
                        status: 'Error',
                        text: linkText,
                        context,
                        error: error.message
                    });
                    this.testStats.totalBroken++;
                }
                return;
            }

            // Test internal link
            const response = await this.page.goto(url, { waitUntil: 'networkidle' });
            
            if (!response) {
                this.results.broken.push({
                    url,
                    status: 'No response',
                    text: linkText,
                    context,
                    error: 'Failed to get response'
                });
                this.testStats.totalBroken++;
                return;
            }

            const status = response.status();
            const finalUrl = response.url();

            // Check for redirects
            if (finalUrl !== url) {
                this.results.redirects.push({
                    originalUrl: url,
                    finalUrl,
                    status,
                    text: linkText,
                    context
                });
                this.testStats.totalRedirects++;
            }

            if (status >= 200 && status < 300) {
                // Additional checks for content issues
                const title = await this.page.title();
                const hasContent = await this.page.$('body *');
                
                if (!title || title.includes('404') || title.includes('Error')) {
                    this.results.issues.push({
                        url,
                        status,
                        text: linkText,
                        context,
                        issue: `Suspicious title: ${title}`
                    });
                    this.testStats.totalIssues++;
                } else if (!hasContent) {
                    this.results.issues.push({
                        url,
                        status,
                        text: linkText,
                        context,
                        issue: 'Empty page content'
                    });
                    this.testStats.totalIssues++;
                } else {
                    this.results.passed.push({
                        url,
                        status,
                        text: linkText,
                        context,
                        title
                    });
                    this.testStats.totalPassed++;
                }
            } else if (status >= 400) {
                this.results.broken.push({
                    url,
                    status,
                    text: linkText,
                    context,
                    error: `HTTP ${status}`
                });
                this.testStats.totalBroken++;
            } else {
                this.results.issues.push({
                    url,
                    status,
                    text: linkText,
                    context,
                    issue: `Unexpected status: ${status}`
                });
                this.testStats.totalIssues++;
            }

        } catch (error) {
            this.results.broken.push({
                url,
                status: 'Error',
                text: linkText,
                context,
                error: error.message
            });
            this.testStats.totalBroken++;
        }
    }

    async testHomepageDeepAudit() {
        console.log('\n📋 Phase 1: Homepage Deep Audit');
        
        await this.page.goto(this.baseUrl);
        await this.page.waitForTimeout(3000);

        // Test main navigation
        console.log('🧭 Testing main navigation...');
        const navLinks = await this.page.$$eval('nav a, header a', links => 
            links.map(link => ({ url: link.href, text: link.textContent?.trim() }))
        );
        
        for (const link of navLinks) {
            await this.testLink(link.url, link.text, 'Main Navigation');
        }

        // Test action cards
        console.log('🎯 Testing action cards...');
        const actionCards = await this.page.$$eval('[class*="card"] a, [class*="action"] a', links => 
            links.map(link => ({ url: link.href, text: link.textContent?.trim() }))
        );
        
        for (const link of actionCards) {
            await this.testLink(link.url, link.text, 'Action Cards');
        }

        // Test ZIP code form
        console.log('📮 Testing ZIP code form...');
        try {
            const zipForm = await this.page.$('form[action*="zip"], form input[name*="zip"]');
            if (zipForm) {
                // Test form submission with valid ZIP
                await this.page.fill('input[name*="zip"], input[placeholder*="ZIP"]', '75201');
                await this.page.click('button[type="submit"], input[type="submit"]');
                await this.page.waitForTimeout(2000);
                
                const currentUrl = this.page.url();
                await this.testLink(currentUrl, 'ZIP Form Submission', 'ZIP Code Form');
            }
        } catch (error) {
            console.log(`⚠️  ZIP form test failed: ${error.message}`);
        }

        // Test provider cards
        console.log('🏢 Testing provider cards...');
        const providerLinks = await this.page.$$eval('[class*="provider"] a, [class*="company"] a', links => 
            links.map(link => ({ url: link.href, text: link.textContent?.trim() }))
        );
        
        for (const link of providerLinks) {
            await this.testLink(link.url, link.text, 'Provider Cards');
        }

        // Test CTAs
        console.log('📞 Testing call-to-action buttons...');
        const ctaLinks = await this.page.$$eval('[class*="cta"] a, [class*="btn"] a, button a', links => 
            links.map(link => ({ url: link.href, text: link.textContent?.trim() }))
        );
        
        for (const link of ctaLinks) {
            await this.testLink(link.url, link.text, 'CTA Buttons');
        }

        // Test footer links
        console.log('🦶 Testing footer links...');
        const footerLinks = await this.page.$$eval('footer a', links => 
            links.map(link => ({ url: link.href, text: link.textContent?.trim() }))
        );
        
        for (const link of footerLinks) {
            await this.testLink(link.url, link.text, 'Footer');
        }
    }

    async testMainNavigationPages() {
        console.log('\n📋 Phase 2: Main Navigation Pages');
        
        const mainPages = [
            '/compare',
            '/locations', 
            '/resources',
            '/shop',
            '/rates',
            '/providers',
            '/electricity-companies',
            '/electricity-plans',
            '/texas'
        ];

        for (const pagePath of mainPages) {
            const fullUrl = `${this.baseUrl}${pagePath}`;
            console.log(`🧪 Testing main page: ${fullUrl}`);
            
            await this.testLink(fullUrl, pagePath, 'Main Navigation');
            
            // Test subnavigation on each page
            try {
                await this.page.goto(fullUrl);
                await this.page.waitForTimeout(2000);
                
                const subLinks = await this.page.$$eval('main a, section a', links => 
                    links.map(link => ({ url: link.href, text: link.textContent?.trim() }))
                );
                
                // Test first 10 sub-links per page to avoid overwhelming
                for (const link of subLinks.slice(0, 10)) {
                    if (link.url.startsWith(this.baseUrl)) {
                        await this.testLink(link.url, link.text, `${pagePath} Subnavigation`);
                    }
                }
            } catch (error) {
                console.log(`⚠️  Failed to test subnavigation for ${pagePath}: ${error.message}`);
            }
        }
    }

    async testDynamicCityPages() {
        console.log('\n📋 Phase 3: Dynamic City Pages');
        
        const testCities = [
            'dallas-tx', 'houston-tx', 'austin-tx', 'fort-worth-tx', 
            'san-antonio-tx', 'plano-tx', 'arlington-tx', 'corpus-christi-tx',
            'garland-tx', 'irving-tx', 'lubbock-tx', 'laredo-tx',
            'amarillo-tx', 'brownsville-tx', 'pasadena-tx', 'grand-prairie-tx',
            'mesquite-tx', 'killeen-tx', 'mcallen-tx', 'frisco-tx'
        ];

        for (const city of testCities) {
            // Test city overview page
            const cityUrl = `${this.baseUrl}/texas/${city}`;
            await this.testLink(cityUrl, city, 'City Pages');
            
            // Test electricity plans page for city
            const plansUrl = `${this.baseUrl}/electricity-plans/${city}`;
            await this.testLink(plansUrl, `${city} plans`, 'City Plan Pages');
            
            // Test municipal utility page if exists
            const municipalUrl = `${this.baseUrl}/texas/${city}/municipal-utility`;
            await this.testLink(municipalUrl, `${city} municipal`, 'Municipal Utility Pages');
        }
    }

    async testFacetedNavigation() {
        console.log('\n📋 Phase 5: Faceted Navigation');
        
        const baseCity = 'dallas-tx';
        const filters = [
            // Single filters
            '12-month', '24-month', '36-month',
            'fixed-rate', 'variable-rate', 'indexed-rate',
            'green-energy', 'renewable',
            // Provider-specific
            'txu-energy', 'reliant-energy', 'green-mountain-energy',
            // Multi-filters
            '12-month/fixed-rate',
            '24-month/green-energy',
            'fixed-rate/renewable',
            '12-month/fixed-rate/green-energy'
        ];

        for (const filter of filters) {
            const facetedUrl = `${this.baseUrl}/electricity-plans/${baseCity}/${filter}`;
            await this.testLink(facetedUrl, filter, 'Faceted Navigation');
        }

        // Test other cities with popular filters
        const otherCities = ['houston-tx', 'austin-tx', 'san-antonio-tx'];
        const popularFilters = ['12-month', 'fixed-rate', 'green-energy'];
        
        for (const city of otherCities) {
            for (const filter of popularFilters) {
                const facetedUrl = `${this.baseUrl}/electricity-plans/${city}/${filter}`;
                await this.testLink(facetedUrl, `${city}/${filter}`, 'Multi-City Faceted Navigation');
            }
        }
    }

    async generateReport() {
        console.log('\n📊 Generating Comprehensive Audit Report');
        
        const timestamp = new Date().toISOString();
        const report = {
            auditInfo: {
                timestamp,
                baseUrl: this.baseUrl,
                totalLinksDiscovered: this.allLinks.size,
                totalLinksVisited: this.visitedUrls.size
            },
            statistics: {
                totalTested: this.testStats.totalTested,
                totalPassed: this.testStats.totalPassed,
                totalBroken: this.testStats.totalBroken,
                totalIssues: this.testStats.totalIssues,
                totalRedirects: this.testStats.totalRedirects,
                passRate: ((this.testStats.totalPassed / this.testStats.totalTested) * 100).toFixed(2) + '%'
            },
            results: this.results,
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.results.broken.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Broken Links',
                count: this.results.broken.length,
                action: 'Fix or remove all broken links immediately',
                impact: 'Critical - Affects user experience and SEO'
            });
        }

        if (this.results.issues.length > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Content Issues',
                count: this.results.issues.length,
                action: 'Review pages with content issues and improve',
                impact: 'Moderate - May affect user trust and engagement'
            });
        }

        if (this.results.redirects.length > 5) {
            recommendations.push({
                priority: 'LOW',
                category: 'Redirects',
                count: this.results.redirects.length,
                action: 'Review redirect chains and update links where possible',
                impact: 'Minor - May slightly affect page load times'
            });
        }

        // Performance recommendations
        if (this.testStats.totalTested > 200) {
            recommendations.push({
                priority: 'LOW',
                category: 'Performance',
                count: 1,
                action: 'Consider implementing link monitoring system for ongoing audits',
                impact: 'Proactive - Prevents future link issues'
            });
        }

        return recommendations;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async runFullAudit() {
        try {
            await this.initialize();
            
            // Phase 1: Homepage Deep Audit
            await this.testHomepageDeepAudit();
            
            // Phase 2: Main Navigation Pages  
            await this.testMainNavigationPages();
            
            // Phase 3: Dynamic City Pages
            await this.testDynamicCityPages();
            
            // Phase 4: Discover more links through crawling
            console.log('\n📋 Phase 4: Link Discovery');
            await this.discoverLinks(this.baseUrl, 2);
            
            // Test all discovered internal links
            console.log('\n🔍 Testing all discovered internal links...');
            for (const url of this.allLinks) {
                if (url.startsWith(this.baseUrl) && !this.visitedUrls.has(url)) {
                    await this.testLink(url, '', 'Discovered Links');
                }
            }
            
            // Phase 5: Faceted Navigation
            await this.testFacetedNavigation();
            
            // Generate final report
            const report = await this.generateReport();
            
            // Save report to file
            const reportPath = path.join(__dirname, `link-audit-report-${Date.now()}.json`);
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            
            console.log('\n✅ Audit Complete!');
            console.log(`📊 Report saved to: ${reportPath}`);
            console.log(`🎯 Statistics:`);
            console.log(`   Total Tested: ${report.statistics.totalTested}`);
            console.log(`   Passed: ${report.statistics.totalPassed}`);
            console.log(`   Broken: ${report.statistics.totalBroken}`);
            console.log(`   Issues: ${report.statistics.totalIssues}`);
            console.log(`   Redirects: ${report.statistics.totalRedirects}`);
            console.log(`   Pass Rate: ${report.statistics.passRate}`);
            
            return report;
            
        } catch (error) {
            console.error('❌ Audit failed:', error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// Run the audit automatically
const auditor = new ComprehensiveLinkAuditor();
auditor.runFullAudit()
    .then(report => {
        console.log('\n🎉 Comprehensive Link Audit completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Audit failed with error:', error);
        process.exit(1);
    });

export default ComprehensiveLinkAuditor;