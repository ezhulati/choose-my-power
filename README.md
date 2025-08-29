# ChooseMyPower.org

A comprehensive electricity provider comparison platform for Texas, helping residents find the best electricity plans and providers in their area.

## 🚀 Quick Start

### Prerequisites
- Node.js 20.5.0+
- npm 10.2.0+

### Development Setup

```bash
# Clone and install
git clone [repository-url]
cd choose-my-power
npm install

# Install git hooks (required for contributions)
npm run hooks:install

# Start development server
npm run dev
```

Visit http://localhost:4324

## 📋 Contributing

**All contributions require changelog updates.** See our [Contributing Guide](CONTRIBUTING.md) for full details.

### Quick Contribution Workflow

```bash
# 1. Create feature branch
git checkout -b feat/your-feature

# 2. Make changes and add tests

# 3. Add changelog entry
npm run changelog:add

# 4. Commit with proper format
git commit -m "feat: add new feature description"

# 5. Push and create PR
git push origin feat/your-feature
```

## 🔧 Development Commands

### Core Development
```bash
npm run dev              # Start development server
npm run build            # Production build with data generation
npm run test             # Run unit tests
npm run test:e2e         # Run end-to-end tests
npm run lint             # Code linting
```

### Changelog Management
```bash
npm run changelog:add       # Interactive changelog entry
npm run changelog:validate # Validate changelog format
npm run changelog:release  # Create version release
npm run hooks:install      # Install git hooks
```

### Data Generation
```bash
npm run build:data:smart    # Smart data generation (cached)
npm run build:data:fresh    # Force fresh data generation
npm run build:data:881      # Full Texas cities build
```

## 📚 Documentation

- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [Changelog Guide](docs/CHANGELOG_GUIDE.md) - Detailed changelog usage
- [Quick Reference](docs/CHANGELOG_QUICK_REFERENCE.md) - Essential commands
- [Design System](docs/CHANGELOG_GUIDE.md#design-system) - UI/UX guidelines

## 🏗️ Architecture

- **Framework**: Astro 5 with React integration
- **Styling**: Tailwind CSS with custom Texas-themed design system
- **Database**: Drizzle ORM with PostgreSQL (Neon)
- **Caching**: Redis for performance optimization
- **Testing**: Vitest + Playwright
- **Deployment**: Netlify with serverless functions
- **Data**: 881+ Texas cities with electricity plan comparison

## 🔄 Changelog System

This project uses automated changelog management:

- ✅ **Git Hooks**: Enforce changelog updates
- ✅ **Interactive Tools**: Easy entry creation (`npm run changelog:add`)
- ✅ **CI/CD Integration**: Automated validation
- ✅ **Keep a Changelog**: Industry standard format
- ✅ **Semantic Versioning**: Proper version management

## 📊 Performance

- **Core Web Vitals**: Optimized for Google's standards
- **Texas-Focused**: CDN optimization for Texas users  
- **Smart Caching**: Redis-backed performance optimization
- **Mobile-First**: Responsive design for all devices

## 🛡️ Quality Assurance

- **TypeScript**: Full type safety
- **ESLint**: Code quality enforcement
- **Git Hooks**: Pre-commit validation
- **CI/CD Pipeline**: Automated testing and deployment
- **Accessibility**: WCAG AA compliance

## 📈 Data Coverage

- **881 Texas Cities**: Complete coverage of deregulated markets
- **Multiple TDSPs**: All transmission/distribution service providers
- **Real-time Rates**: Up-to-date electricity plan pricing
- **Plan Features**: Contract terms, green energy, promotional rates

## 🤝 Team Guidelines

### Before Your First Contribution
1. Read the [Contributing Guide](CONTRIBUTING.md)
2. Install git hooks: `npm run hooks:install`
3. Review [Changelog Guide](docs/CHANGELOG_GUIDE.md)
4. Test your setup: `npm run hooks:test`

### Development Workflow
1. All code changes require changelog updates
2. Use conventional commit messages
3. Follow the Texas-themed design system
4. Test on mobile and desktop
5. Maintain accessibility standards

## 🚢 Deployment

### Staging
Pull requests are automatically deployed to staging environments.

### Production
```bash
npm run production:deploy    # Full deployment
npm run production:validate  # Validate readiness  
npm run health:check        # System health check
```

---

**Built with ❤️ for Texas energy consumers**
