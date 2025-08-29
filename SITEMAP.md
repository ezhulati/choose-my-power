# ChooseMyPower.org Complete Sitemap

**Generated:** 2025-08-29  
**Total Pages:** 5,000+ (880 cities × multiple filter combinations)  
**Architecture:** Astro SSR with dynamic routing and faceted navigation  

## 🏠 Core Site Structure

### Homepage & Main Navigation
```
/                               # Homepage - electricity comparison landing
/compare                        # Plan comparison tools
/best                          # Best electricity provider rankings  
/locations                     # Location finder and city directory
/resources                     # Educational content hub
/shop                          # Shopping category pages
/rates                         # Rate information and tools
/electricity-companies         # Provider directory
/electricity-plans             # Plans directory hub
/providers                     # Provider comparison hub
/texas                         # Texas state electricity overview
```

### Legal & Utility Pages
```
/privacy-policy                # Privacy policy
/terms-of-service             # Terms of service
/robots.txt                    # SEO robots directives
/sitemap.xml                   # XML sitemap for search engines
```

## 🌟 API & Admin Pages

### API Endpoints
```
/api/zip-lookup               # ZIP code to city/TDSP lookup API
```

### Admin Dashboards
```
/admin/core-web-vitals-dashboard    # Performance monitoring dashboard
/admin/performance-dashboard        # Site performance metrics
```

## 🏙️ Location-Based Pages (880+ Texas Cities)

### State Level
```
/texas                        # Texas electricity market overview
/texas/electricity-plans      # Texas plans directory
/texas/electricity-providers  # Texas provider directory
```

### Major Cities (Tier 1 - High Priority)
```
/texas/dallas-tx              # Dallas electricity overview
/texas/houston-tx             # Houston electricity overview  
/texas/fort-worth-tx          # Fort Worth electricity overview
/texas/plano-tx              # Plano electricity overview
/texas/arlington-tx          # Arlington electricity overview
/texas/lubbock-tx            # Lubbock electricity overview
```

### Municipal Utility Cities (Non-Deregulated)
```
/texas/austin-tx/municipal-utility      # Austin Energy information
/texas/san-antonio-tx/municipal-utility # CPS Energy information
```

### All Texas Cities (880 total)
Each city follows the pattern: `/texas/[city-slug]`

**Sample Cities:** (First 50 alphabetically)
```
/texas/abbott-tx              # Abbott, TX
/texas/abilene-tx            # Abilene, TX  
/texas/abram-tx              # Abram, TX
/texas/ackerly-tx            # Ackerly, TX
/texas/addison-tx            # Addison, TX
/texas/alamo-tx              # Alamo, TX
/texas/albany-tx             # Albany, TX
/texas/aledo-tx              # Aledo, TX
/texas/alice-tx              # Alice, TX
/texas/allen-tx              # Allen, TX
/texas/alleyton-tx           # Alleyton, TX
/texas/alma-tx               # Alma, TX
/texas/alpine-tx             # Alpine, TX
/texas/alto-tx               # Alto, TX
/texas/alton-tx              # Alton, TX
/texas/alvarado-tx           # Alvarado, TX
/texas/alvin-tx              # Alvin, TX
/texas/alvord-tx             # Alvord, TX
/texas/andrews-tx            # Andrews, TX
/texas/angleton-tx           # Angleton, TX
/texas/angus-tx              # Angus, TX
/texas/anna-tx               # Anna, TX
/texas/annetta-north-tx      # Annetta North, TX
/texas/annetta-south-tx      # Annetta South, TX
/texas/annetta-tx            # Annetta, TX
/texas/annona-tx             # Annona, TX
/texas/anson-tx              # Anson, TX
/texas/appleby-tx            # Appleby, TX
/texas/aransas-pass-tx       # Aransas Pass, TX
/texas/archer-city-tx        # Archer City, TX
/texas/argyle-tx             # Argyle, TX
/texas/arlington-tx          # Arlington, TX (Tier 1)
/texas/arp-tx                # Arp, TX
/texas/asherton-tx           # Asherton, TX
/texas/aspermont-tx          # Aspermont, TX
/texas/athens-tx             # Athens, TX
/texas/aubrey-tx             # Aubrey, TX
/texas/aurora-tx             # Aurora, TX
/texas/austwell-tx           # Austwell, TX
/texas/avoca-tx              # Avoca, TX
/texas/azle-tx               # Azle, TX
/texas/bacliff-tx            # Bacliff, TX
# ... and 830 more cities
```

**Note:** Complete list includes all 880 cities from TDSP mapping configuration.

## ⚡ Faceted Navigation Pages (2,500+ combinations)

### Base Electricity Plans Pages
```
/electricity-plans                    # Main electricity plans hub
/electricity-plans/[city]/            # City-specific plans (880 cities)
```

### Single Filter Pages (Per City)
```
# Contract Terms
/electricity-plans/[city]/6-month     # 6-month contract plans
/electricity-plans/[city]/12-month    # 12-month contract plans  
/electricity-plans/[city]/24-month    # 24-month contract plans
/electricity-plans/[city]/36-month    # 36-month contract plans

# Rate Types  
/electricity-plans/[city]/fixed-rate     # Fixed rate plans
/electricity-plans/[city]/variable-rate  # Variable rate plans
/electricity-plans/[city]/indexed-rate   # Indexed rate plans

# Green Energy
/electricity-plans/[city]/green-energy    # 100% renewable energy
/electricity-plans/[city]/partial-green  # 50% renewable energy

# Plan Features
/electricity-plans/[city]/prepaid         # Prepaid electricity plans
/electricity-plans/[city]/no-deposit      # No deposit required
/electricity-plans/[city]/time-of-use     # Time-of-use pricing
/electricity-plans/[city]/autopay-discount # Autopay discount plans
```

### Multi-Filter Combination Pages (Per City)
```
# Popular Combinations (High Search Volume)
/electricity-plans/[city]/12-month/fixed-rate        
/electricity-plans/[city]/12-month/green-energy      
/electricity-plans/[city]/24-month/fixed-rate        
/electricity-plans/[city]/fixed-rate/green-energy    
/electricity-plans/[city]/prepaid/no-deposit         
/electricity-plans/[city]/green-energy/no-deposit    

# Three-Filter Combinations (Premium Pages)  
/electricity-plans/[city]/12-month/fixed-rate/green-energy
/electricity-plans/[city]/24-month/fixed-rate/no-deposit
/electricity-plans/[city]/prepaid/no-deposit/autopay-discount
```

### Major City Examples (Dallas)
```
/electricity-plans/dallas-tx/
/electricity-plans/dallas-tx/12-month/
/electricity-plans/dallas-tx/fixed-rate/
/electricity-plans/dallas-tx/green-energy/
/electricity-plans/dallas-tx/12-month/fixed-rate/
/electricity-plans/dallas-tx/12-month/green-energy/
/electricity-plans/dallas-tx/fixed-rate/green-energy/
/electricity-plans/dallas-tx/12-month/fixed-rate/green-energy/
# ... and 15+ more filter combinations per city
```

## 🏢 Provider Pages

### Provider Directory
```
/providers                    # All electricity providers hub
/providers/[provider-slug]    # Individual provider pages (50+ providers)
```

### Sample Provider Pages
```
/providers/reliant-energy          # Reliant Energy profile
/providers/txu-energy             # TXU Energy profile  
/providers/green-mountain-energy  # Green Mountain Energy profile
/providers/gexa-energy            # Gexa Energy profile
/providers/direct-energy          # Direct Energy profile
/providers/champion-energy        # Champion Energy profile
# ... and 44+ more providers
```

### Provider Comparison Pages
```
/compare/providers               # Provider comparison tool
/compare/providers/top-5         # Top 5 provider comparison
/compare/plans                   # Plan comparison tool  
/compare/rates                   # Rate comparison tool
```

## 🛍️ Shopping Category Pages

### Shop Hub
```
/shop                           # Shopping categories hub
/shop/cheapest-electricity      # Cheapest rate finder
/shop/best-electricity-providers # Best provider rankings
/shop/green-energy              # Green energy specialist page
/shop/no-deposit-electricity    # No deposit plan finder
```

## 📊 Tools & Calculators

### Rate Tools
```
/rates                          # Rate information hub
/rates/calculator               # Electricity cost calculator
```

## 📚 Resource Hub

### Educational Content
```
/resources                      # Resource center hub
/resources/guides              # Electricity guides
/resources/guides/how-to-switch-providers  # Switching guide
/resources/faqs                # Frequently asked questions
/resources/support/contact     # Contact information
```

## 📈 SEO & Technical Pages

### XML Sitemaps (Auto-generated)
```
/sitemap.xml                   # Master sitemap index
/sitemap-cities.xml            # City pages sitemap
/sitemap-faceted.xml           # Faceted navigation sitemap
/sitemap-faceted-enhanced.xml  # Enhanced faceted sitemap
/sitemap-filters.xml           # Filter combination sitemap
```

## 🎯 Target Keywords & Search Intent

### High-Volume Keywords (Per City)
- "[city] electricity plans" (880 pages)
- "[city] electricity providers" (880 pages)  
- "[city] electricity rates" (880 pages)
- "cheap electricity [city]" (880 pages)
- "best electricity [city]" (880 pages)

### Filter-Specific Keywords
- "[city] 12 month electricity plans" (880 pages)
- "[city] fixed rate electricity" (880 pages)
- "[city] green energy plans" (880 pages)  
- "[city] prepaid electricity" (880 pages)
- "[city] no deposit electricity" (880 pages)

### Long-Tail Combinations  
- "[city] 12 month fixed rate electricity" (880 pages)
- "[city] green energy no deposit plans" (880 pages)
- "[city] cheapest 24 month electricity" (880 pages)

## 🔧 Technical Implementation

### Dynamic Routing
- **Astro SSR**: Server-side rendering for all dynamic pages
- **TDSP Integration**: Real-time utility territory mapping
- **API Integration**: Live electricity plan data from ComparePoower API
- **Caching Strategy**: Intelligent caching for 880+ city pages

### SEO Optimization
- **Unique Content**: Each page has unique, city-specific content
- **Schema Markup**: LocalBusiness and Product schema for all pages
- **Internal Linking**: Strategic linking between related city/filter pages
- **Mobile Optimization**: Responsive design for all page types

## 📊 Scale Summary

| Page Type | Count | Examples |
|-----------|--------|----------|
| Core Navigation | 12 | /, /compare, /best, etc. |
| City Pages | 880 | /texas/dallas-tx, /texas/houston-tx |  
| Single Filter | 2,640 | /electricity-plans/dallas-tx/12-month |
| Multi Filter | 2,200 | /electricity-plans/dallas-tx/12-month/fixed-rate |
| Provider Pages | 50+ | /providers/reliant-energy |
| Utility Pages | 10 | /privacy-policy, /sitemap.xml |
| **Total Pages** | **5,800+** | **Comprehensive Texas electricity coverage** |

---

**Last Updated:** August 29, 2025  
**Architecture:** Astro 5.x with React integration  
**Deployment:** Netlify with serverless functions  
**Performance:** Lighthouse 100/100 optimized  

This sitemap represents one of the most comprehensive electricity comparison websites in Texas, covering all deregulated markets with intelligent faceted navigation for maximum search visibility and user experience.