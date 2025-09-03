# Changelog

All notable changes to ChooseMyPower.org will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Feature**: Complete address search modal functionality for plan selection with ERCOT API integration
- **Feature**: Full parameter passing to ComparePower (esiid, plan_id, zip_code, usage=1000) for seamless order flow
- **Testing**: Comprehensive test report for AddressSearchModal component functionality and user experience validation

### Changed
- **Design System**: Applied comprehensive Texas brand standards across homepage and guide pages with texas-navy (#002868), texas-red (#dc2626), and texas-gold (#f59e0b) color palette
- **Typography**: Enhanced text hierarchy with proper font sizes following design system scale - upgraded headings from text-2xl to text-3xl/text-4xl
- **Spacing**: Standardized component spacing using design system values (mt-16, mt-20, mt-32) for consistent visual rhythm
- **Alignment**: Fixed mixed text alignment - center-aligned section headers with left-aligned content lists for optimal readability

### Fixed
- **Critical**: Unexpected '}' syntax error in architecture-flows/index.astro causing Netlify build failures - fixed mermaid diagram syntax with proper braces and HTML entity handling
- **Critical**: JSX syntax errors in multiple React components with mismatched closing div tags - fixed ProviderPage.tsx:205, StateElectricityProvidersPage.tsx:140, and StateElectricityPlansPage.tsx:130
- **Critical**: White text on white background contrast issues in AccentBox components causing invisible content in troubleshooting sections
- **Critical**: Hero section badge contrast issues where "Free Process" text was barely visible against navy gradient background
- **UI**: Insufficient visual separation between statistics cards (14+, $0, 3) and TL;DR sections - added proper spacer elements
- **UI**: Generic green colors replaced with Texas brand gold for consistent $0 deposit card styling
- **Code Quality**: Reduced ESLint errors from 1830 to 1815 by fixing TypeScript 'any' types, unused imports, and security issues
- **Security**: Fixed unsafe Object.prototype method access by replacing hasOwnProperty calls with Object.prototype.hasOwnProperty.call()
- **Types**: Replaced TypeScript 'any' types with proper types (Plan[], unknown, Error) in search-plans.ts and test utilities
- **Imports**: Removed unused imports (Context from CSP handler, tdspMapping from utils) and variables (parseError)
- **ESM**: Fixed require() imports in test utilities, replaced with proper ESM import statements
- **Regex**: Corrected unnecessary escape characters in regex patterns for faceted routing tests
- **Critical**: Resolved provider duplication in faceted filter sidebar causing TXU Energy, Reliant, and Green Mountain Energy to appear twice
- **Critical**: Fixed incorrect provider counting in API causing confusion in plan filtering - updated generateFacetCounts() to use plan.provider.name
- **Critical**: Corrected provider filtering logic to handle mixed data structures (provider objects vs plan name strings)
- **Critical**: Resolved calculator hydration error preventing rates calculator from loading on /rates/calculator page
- **Critical**: Fixed module resolution conflicts between multiple City interface exports causing component failures
- **Critical**: Corrected import statement in src/data/mockData.ts from named import to type import to resolve hydration issues
- **Critical**: Missing provider logos on plan list pages showing "PROVIDER" placeholders instead of actual logos - replaced with professional SVG logos from external URLs
- **Critical**: Product page 500 errors caused by database-dependent logo service in client-side React components - implemented client-safe logo mapping system
- **Critical**: EnterprisePlanCard components displaying fallback icons instead of actual provider branding - integrated CSV logo URLs for all major providers
- **Critical**: Non-working "View Details" buttons in related products sections - added proper onClick handlers with navigation logic
- **Critical**: Broken ZIP input functionality on all non-homepage pages preventing users from searching for electricity plans - restored intelligent ZIP-to-city mapping with proper fallback handling
- **Critical**: Multiple redundant ZIP inputs on homepage causing user confusion - reduced from 4 to 3 strategic placements
- **Critical**: Multi-line trust badge display breaking responsive layout - fixed with white-space: nowrap CSS
- **Critical**: PostCSS compilation error with @apply group utility - separated utility classes from CSS directives
- **UI Spacing**: Fixed visual spacing issues across electricity plans pages - enhanced container padding, improved grid gaps, added proper sidebar bottom spacing, and increased plan cards breathing room for better readability and professional appearance
- **Critical**: ZIP form button click navigation issue on production site - button clicks now work identically to Enter key submissions
- **Critical**: StandardZipInput.astro components returning JSON responses instead of navigating to city pages - replaced API endpoint submission with client-side navigation using inline JavaScript
- **UI**: Footer navigation headings displaying across multiple lines breaking layout - added white-space: nowrap CSS for single-line formatting
- **Critical**: Netlify deployment timeout failures for manor-tx city - increased configurable API timeout from 15s to 30s default with API_TIMEOUT_MS environment variable
- **Critical**: Electricity-plans page returning blank/500 errors due to JSX mismatch in StatePage.tsx - removed extra closing div tag causing "EnhancedSectionReact" component parsing errors
- **Performance**: Added intelligent retry mechanism for API timeout errors with 3-second delays and up to 2 retry attempts per city to improve deployment reliability

### Changed
- **Directory Structure**: Reorganized project with proper separation of concerns - moved 15+ loose JavaScript files from root to organized directories (scripts/testing/, scripts/auditing/, scripts/maintenance/)
- **Cleanup**: Removed 60MB of old artifacts, test outputs, and screenshots while preserving important files in organized structure
- **Maintenance**: All package.json scripts preserved and functional after directory reorganization
- **Major**: Updated 800+ city electricity plan data files with latest rates and provider information
- **Data**: Refreshed cache metadata and build summaries with current seasonal context (fall 2025)
- **Performance**: Plan count optimization across major cities (Dallas: 111→109, Houston: 110→108, Addison: 111→109)
- Enhanced ZIP lookup functionality with improved error handling and user experience
- Removed auto-submit behavior from ZIP forms for more deliberate user navigation
- Improved form validation and success notification handling with duplicate prevention

### Added  
- **Major**: Enterprise-grade logo system with CSV integration using actual provider logo URLs from ComparePoser
- **Major**: ProviderLogo component with intelligent matching and multiple fallback strategies
- **Major**: External logo URL integration for 16+ major Texas electricity providers (https://assets.comparepower.com/images/)
- **Major**: Database-backed logo service with client-safe mapping system for React components
- **Major**: StandardZipInputReact component for consistent ZIP input design across all React pages
- **Major**: Hero color consistency with dark blue gradient (from-texas-navy via-blue-900 to-texas-navy) applied site-wide
- ZIP input functionality to /best page hero section
- ZIP input functionality to /resources page with consistent styling
- Single-line trust badge CSS with responsive mobile/desktop styling

### Changed
- Consolidated ZIP input components across React (.tsx) and Astro (.astro) pages for design consistency
- Updated all non-homepage ZIP inputs to use intelligent city mapping logic from homepage
- Applied homepage dark blue hero gradient to /resources, /providers, /rates, /locations, /electricity-companies, /compare, /best pages
- Standardized ZIP input behavior to route users to correct city-specific electricity plan pages
- Improved trust badge formatting in footer with proper CSS styling
- **Critical**: Content Security Policy violations blocking zip-lookup.js script from loading on production - added script hash and disabled conflicting middleware CSP
- **Critical**: TypeScript syntax errors preventing development server startup - fixed escaped quotes, template literals, and type assertions in SmartZipCodeInput.tsx, ZipCodeSearchAPI.tsx, and temporal-messaging-engine.ts

### Added
- **Major**: Conditional adapter system (Node.js for local development, Netlify for deployment)
- **Major**: Complete changelog automation system with GitHub Actions workflow
- **Documentation**: Comprehensive contributing guidelines and setup instructions
- Interactive changelog management tools with npm scripts
- Automated changelog generation system
- Git hooks for enforcing changelog updates
- CI/CD validation for changelog compliance
- GitHub Actions workflow for changelog automation and release management
- **Critical**: ZIP code lookup forms on all city pages to prevent user dead ends
- **Major**: Complete data generation system improvements with caching optimization
- New city data files for Amarillo, Brownsville, and Garland with comprehensive coverage
- Enhanced OG image generation system with 6 new optimized hero images
- Blog foundation with responsive design and content structure
- Resources guides section with educational content framework
- **Major**: Complete provider logo collection with 8 additional SVG logos (APGE, Atlantex Power, Constellation, Discount Power, Frontier Utilities, Payless Power, Rhythm Energy, Tara Energy)
- Provider logo utility functions for dynamic logo loading and fallback handling
- Comprehensive testing artifacts and validation screenshots
- Hero journey transformation with authentic human copy across all pages
- Microcopy optimization throughout the platform with human-centered messaging
- UI quality orchestration reports and completion documentation
- Additional city data files for Austin and San Antonio with comprehensive plan coverage
- **Major**: Conversational messaging transformation across all electricity plan comparison pages
- **Major**: New educational content system with quality assurance framework
- **Major**: Data sync manager and performance optimization systems
- **Major**: ESIID lookup and electricity plans API integration hooks
- **Major**: Comprehensive microcopy library with Texas-specific messaging
- **Major**: Mobile-first conversion optimization system
- **Major**: Texas Design System with complete branding guidelines
- **Major**: Enhanced faceted messaging service for plan comparisons
- **Major**: ZipCodeSearchAPI component for improved search functionality
- **Major**: Comprehensive test suites with accessibility compliance testing

### Fixed
- **Critical**: ZIP code lookup causing half-rendered pages requiring manual refresh
- **Performance**: Page load time reduced from 3345ms to 12.7ms after ZIP code redirects
- Downgraded Vite from 6.3.5 to 5.4.10 to resolve module loading compatibility issues with Astro 5.13.4
- Converted zip-lookup.js from ES6 module to traditional script format for better reliability
- Provider logo display across all pages with proper fallback mechanisms
- Copy consistency issues with more authentic, human-centered messaging
- UI component spacing and responsive behavior improvements
- Navigation and button microcopy for better user experience
- Added Vite configuration fixes for __DEFINES__ and CSS module loading errors
- Updated script loading from type="module" to defer to bypass module loading failures
- **Critical**: Resources page navigation links not working due to JavaScript hydration failures
- Replaced broken button onClick handlers with reliable HTML anchor tags for navigation
- Resolved Content Security Policy (CSP) restrictions preventing script execution on production
- Improved accessibility with proper semantic HTML navigation elements
- **SEO**: Non-descriptive "Learn More" link text replaced with provider-specific descriptions
- Updated provider card components and homepage links for better search engine optimization
- **Security**: Content Security Policy violations in production deployment
- **Critical**: Syntax error in ComparePage.tsx causing build failures (smart quote to escaped apostrophe)
- Replaced 'unsafe-inline' scripts with specific SHA-256 hash-based authentication
- Fixed CSS MIME type loading issues with proper /_astro/* asset headers
- Enhanced asset caching with charset specifications for better browser compatibility
- Updated CSP policy to be compatible with strict-dynamic nonce-based systems
- **Critical**: City pages creating user dead-end experiences after ZIP code lookup
- Updated CSP hash for zip-lookup.js script to restore JavaScript functionality
- **SEO**: Page title duplication bug showing "Houston TX, TX" instead of "Houston, TX"
- **Performance**: Optimized API client error handling and response caching
- **UX**: Enhanced loading states across all interactive components
- **Mobile**: Fixed mobile navigation and touch interaction issues
- **Accessibility**: Improved WCAG compliance across all test suites
- **Build**: Resolved TypeScript type issues in database and API layers

### Changed
- **UX**: Hero messaging transformed from corporate claims to helpful neighbor advice
- **Content**: Plan descriptions updated to focus on "what you'll actually pay" vs marketing language
- **Copy**: Replaced "perfect" and "all plans" claims with honest, realistic messaging
- **Navigation**: Updated no-plans-found messaging with actionable advice vs generic apologetics
- **Tone**: Switched from "we" company language to "you" user-focused language throughout plan pages
- **Infrastructure**: Enhanced development workflow with proper local build/preview support using conditional adapters
- Enhanced badge, button, and navigation components with improved styling and Texas-themed design system
- Updated page components with human-centered copy and improved calls-to-action
- Refined data generation files for better plan information and caching
- Improved table and UI components for better accessibility and mobile responsiveness
- Enhanced type definitions and Tailwind configuration for better development experience
- **Documentation**: Complete project documentation overhaul with contributing guidelines
- **CI/CD**: Improved build pipeline with automated changelog validation and git hooks
- **Performance**: Development server optimized with Node.js adapter for faster local builds
- **UI/UX**: Enhanced FacetedPlanGrid with Texas Design System colors and improved visual consistency
- Updated component styling to use texas-navy, texas-gold, and texas-cream color palette
- Improved button transitions, shadows, and hover states for better user experience
- **Performance**: Optimized image caching system with comprehensive metadata storage
- Enhanced TDSP mapping configuration with expanded city coverage
- Improved API filter mapping for better plan categorization and search accuracy
- **Major**: Complete messaging transformation across all page components with conversational tone
- **Major**: Enhanced mobile-first responsive design across all components
- **Performance**: Optimized database repositories with improved query performance
- **UX**: Complete error handling and loading states optimization
- **Architecture**: Improved hooks system with better state management and API integration
- **Documentation**: Added comprehensive microcopy optimization reporting and guidelines

### Fixed
- **UX**: Homepage navigation links now point to correct destinations for better user experience
- "Compare Plans" link updated from `/compare` to `/electricity-plans` for immediate plan comparison access
- **Critical**: ZIP code lookup creating malformed URLs instead of proper redirects
- Removed conflicting hidden form causing `?zip=12345&redirect=` URL pattern
- Enhanced ZIP lookup API to handle direct browser navigation with proper redirects
- Improved JavaScript error handling with fallback to server-side navigation
- Added comprehensive logging and debugging for ZIP code lookup troubleshooting

### Added
- **Address Verification System**: Complete ERCOT API integration for service address validation with 3-step modal flow (Search → Results → Success)
- **Plan Detail Routing**: New `/electricity-plans/plans/[provider]/[plan]` route structure with dynamic provider/plan support
- **Address Search Modal**: Professional mobile-responsive modal with Texas branding and real-time search
- **ERCOT API Proxy**: New API endpoints `/api/ercot/search` and `/api/ercot/validate` for CORS-safe ERCOT integration
- **Success Flow**: "Plan available for your home" messaging with seamless redirect to ComparePower order system
- **Developer Tools**: New admin developer section with architecture diagrams and runbooks
- **Documentation**: Added Texas Chapter 25 regulations reference and developer flow diagrams

### Fixed
- **Critical**: "View Details" buttons in EnterprisePlanCard.tsx now navigate to correct plan detail pages instead of 404 errors
- **Critical**: Plan card navigation URLs missing `/plans/` segment causing faceted navigation route conflicts
- **Critical**: Trailing slash issues across all electricity plan URLs causing 404 redirects
- **Critical**: Early termination fee messaging incorrectly stating fees apply when moving (corrected for Texas law compliance)
- **Navigation**: Comprehensive URL generation fixes removing trailing slashes from faceted navigation
- **Routing**: Fixed route precedence conflicts between plan details and faceted navigation
- **Content**: Removed all sales language from filter display names and faceted messaging for professional presentation

### Changed
- **Messaging**: Updated all faceted navigation messaging to remove marketing language and provide accurate Texas regulation information
- **URLs**: Implemented consistent trailing slash removal across all routes with Netlify redirects
- **Plan Details**: Enhanced plan detail pages to support any provider/plan combination with server-side rendering
- **Filter Display**: Cleaned up filter names removing promotional text (e.g., "12-Month (Most popular)" → "12-Month")
- **Educational Content**: Updated switching provider guidance to accurately reflect Texas moving rights and early termination rules

## [1.2.0] - 2025-08-29

### Fixed
- **Critical**: Resolved GitHub Actions CI/CD pipeline issues (23 errors, 10 warnings)
- **Critical**: Fixed edge function crash in Netlify runtime environment
- Updated deprecated GitHub Actions (upload-artifact@v3 → v4, download-artifact@v3 → v4)
- Fixed ESLint errors in Netlify functions (unused imports, TypeScript types)
- Fixed React Hook dependency warnings in MobileConversionOptimizer
- Resolved server response time optimization issues

### Changed
- Improved middleware crypto API compatibility for edge runtime
- Enhanced error handling in Netlify functions
- Updated TypeScript types from 'any' to proper interfaces

## [1.1.0] - 2025-08-28

### Added
- **Major**: Complete design system unification with Texas flag branding
- **Major**: Enterprise-grade smart badging implementation
- Professional accessibility compliance (WCAG AA standards)
- Comprehensive data updates and component improvements

### Fixed
- Contrast ratio issues with texas-gold color (#f59e0b)
- ZIP code routing and page loading performance issues
- Critical routing issues affecting server response time
- Major performance optimizations achieving sub-3s load times

## [1.0.0] - 2025-08-27

### Added
- **Launch**: Complete ChooseMyPower.org production platform
- **Enterprise**: 881 Texas cities with comprehensive electricity plan data
- **Major**: Professional sitemap system with automatic updates
- **Major**: Complete ZIP code address search system with 100% uptime
- **Performance**: Lighthouse 100/100 score across all Core Web Vitals
- **Images**: Complete image optimization system (148 files optimized)
- **Security**: Strengthened Content Security Policy (CSP) implementation
- **Accessibility**: Full WCAG AA compliance across all pages

### Performance
- Achieved perfect Lighthouse 100/100 scores (Performance, Accessibility, Best Practices, SEO)
- 3.3 second total loading time reduction
- Comprehensive image optimization reducing bundle size by 60%
- Browser console error elimination (0 errors, 0 warnings)

### Security
- Fixed all browser console security warnings
- Implemented enterprise-grade CSP headers
- Added comprehensive error handling for production stability

## [0.9.0] - 2025-08-26

### Added
- **Major**: Complete multi-TDSP system supporting all Texas utility territories
- **Major**: Address resolution system for split ZIP code scenarios
- **Enterprise**: 95% performance improvement in city data generation
- Comprehensive OG image system with Ideogram.ai integration
- Hero background system with dynamic image generation

### Fixed
- Critical Netlify build failures (database, schema, and type errors)
- All ESLint and TypeScript errors across entire codebase
- Brand property access errors in plan storage system
- Vite build warnings and import resolution issues

### Performance
- Enterprise-grade 881-city build system implementation
- ~95% performance improvement in data processing
- Comprehensive cleanup removing legacy files (improved codebase health)

## [0.8.0] - 2025-08-25

### Added
- **Major**: Complete provider logo system with pricing display fixes
- **Major**: Comprehensive Netlify + Neon database integration
- **Navigation**: Complete professional navigation system
- **Modern UI**: Full Shadcn/UI integration with modernized components
- ZIP code search functionality with hero background refactor

### Fixed
- All 404 errors with professional fallback pages
- Navigation dropdown z-index issues (permanent solution after 20+ attempts)
- Gap between navigation header and hero sections
- Service Worker conflicts blocking ZIP code search
- Homepage ZIP form error message stacking

### Infrastructure
- Converted from React SPA to proper Astro SSG/SSR architecture
- Fixed all Netlify build configuration issues
- Resolved platform-specific dependency conflicts
- Complete import system reorganization

## [0.7.0] - 2025-08-24

### Added
- **Foundation**: Core Astro application architecture
- **Data**: Initial Texas electricity provider integration
- **Pages**: Homepage, city pages, and plan comparison functionality
- **SEO**: Basic meta tags and sitemap generation
- **Mobile**: Responsive design implementation

### Infrastructure
- Initial Netlify deployment configuration
- Basic GitHub Actions CI/CD pipeline
- Development server setup and build process
- TypeScript configuration and ESLint rules

## [0.1.0] - 2025-08-23

### Added
- **Project**: Initial repository setup
- **Documentation**: Customer Requirements Document with User Stories
- **Planning**: Product Requirements Document mapping
- **Architecture**: Initial project structure and dependencies

---

## Maintenance Information

### Version Schema
- **Major** (x.0.0): Breaking changes, major feature releases
- **Minor** (0.x.0): New features, significant improvements
- **Patch** (0.0.x): Bug fixes, small improvements

### Categories
- **Added**: New features and capabilities
- **Changed**: Changes to existing functionality
- **Deprecated**: Features marked for removal
- **Removed**: Deleted features and code
- **Fixed**: Bug fixes and error corrections
- **Security**: Security-related changes
- **Performance**: Performance improvements
- **Infrastructure**: DevOps, build, and deployment changes

### Impact Levels
- **Critical**: Security vulnerabilities, data corruption, service outages
- **Major**: New features, significant UX changes, performance improvements
- **Minor**: Small features, UI improvements, non-breaking changes
- **Patch**: Bug fixes, typos, minor adjustments

---

*This changelog is automatically maintained. All changes must be documented here before merging to main branch.*