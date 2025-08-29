# Contributing to ChooseMyPower.org

Thank you for your interest in contributing to ChooseMyPower! This guide will help you get started with contributing to our Texas electricity comparison platform.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Changelog Requirements](#changelog-requirements)
- [Code Standards](#code-standards)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Deployment](#deployment)

## Getting Started

ChooseMyPower is built with:
- **Astro 5** with React integration
- **TypeScript** for type safety
- **Tailwind CSS** with custom design system
- **Drizzle ORM** with PostgreSQL
- **Redis** for caching
- **Netlify** for deployment

### Prerequisites

- Node.js 20.5.0 or higher
- npm 10.2.0 or higher
- Git

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone [repository-url]
   cd choose-my-power
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Install git hooks (required):**
   ```bash
   npm run hooks:install
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

The application will be available at http://localhost:4324

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feat/electricity-plan-filters` - New features
- `fix/zip-code-validation` - Bug fixes
- `docs/api-documentation` - Documentation updates
- `perf/plan-comparison-speed` - Performance improvements

### Development Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes**
   - Follow our [Design System](docs/CHANGELOG_GUIDE.md#design-system) guidelines
   - Write tests for new functionality
   - Update documentation as needed

3. **Test your changes:**
   ```bash
   npm run test
   npm run test:e2e
   npm run lint
   ```

4. **Add changelog entry:**
   ```bash
   npm run changelog:add
   ```

5. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add electricity plan filtering by contract length"
   ```

6. **Push and create pull request:**
   ```bash
   git push origin feat/your-feature-name
   ```

## Changelog Requirements

**All contributions must include changelog updates.** Our automated changelog system ensures proper documentation of all changes.

### Quick Start

```bash
# Add changelog entry interactively (recommended)
npm run changelog:add

# Or edit CHANGELOG.md manually under [Unreleased] section
```

### Changelog Categories

| Category | Use For | Examples |
|----------|---------|----------|
| **Added** | New features | "Added mobile comparison view" |
| **Changed** | Changes to existing functionality | "Updated search algorithm" |
| **Fixed** | Bug fixes | "Fixed ZIP code validation" |
| **Performance** | Performance improvements | "Optimized plan loading" |
| **Security** | Security updates | "Updated dependencies" |
| **Deprecated** | Features marked for removal | "Deprecated old API" |
| **Removed** | Removed features | "Removed legacy tool" |

### Exemptions

These changes can skip changelog requirements:
- Documentation-only changes (README, docs/)
- Code comments and formatting
- Test-only changes

### Validation

Our git hooks and CI/CD pipeline validate:
- Changelog format compliance
- Required entries for code changes
- Proper markdown structure
- No merge conflicts

**For detailed changelog guidance, see [docs/CHANGELOG_GUIDE.md](docs/CHANGELOG_GUIDE.md)**

## Code Standards

### TypeScript

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use explicit return types for functions
- Avoid `any` - use proper types

### React Components

- Use functional components with hooks
- Implement proper prop types with TypeScript
- Follow component naming conventions (PascalCase)
- Use React.memo() for performance optimization when appropriate

### Astro Components

- Use `.astro` extension for Astro components
- Prefer server-side rendering when possible
- Use client directives (`client:load`, `client:idle`) sparingly
- Follow Astro's best practices for hydration

### Styling

- Use Tailwind CSS classes
- Follow our design system (colors: texas-navy, texas-red, texas-gold)
- Create component variants using class-variance-authority
- Ensure mobile-first responsive design
- Maintain accessibility standards (WCAG AA)

### File Organization

```
src/
├── components/          # Reusable components
│   ├── ui/             # Basic UI components
│   ├── forms/          # Form components
│   └── mobile/         # Mobile-specific components
├── layouts/            # Page layouts
├── pages/              # Route pages
├── lib/                # Utilities and helpers
│   ├── api/           # API clients
│   ├── utils/         # Pure functions
│   └── types/         # Type definitions
└── styles/            # Global styles
```

## Pull Request Process

### Before Submitting

1. **Run all checks:**
   ```bash
   npm run test
   npm run test:e2e  
   npm run lint
   npm run changelog:validate
   ```

2. **Test data generation:**
   ```bash
   npm run build:data:smart
   ```

3. **Build verification:**
   ```bash
   npm run build
   ```

### PR Requirements

- [ ] Clear title and description
- [ ] Changelog updated (unless exempt)
- [ ] Tests passing (unit and e2e)
- [ ] No linting errors
- [ ] Mobile responsiveness verified
- [ ] Accessibility standards maintained
- [ ] Performance impact assessed

### PR Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Performance improvement
- [ ] Documentation update
- [ ] Breaking change

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed
- [ ] Mobile testing completed

## Changelog
- [ ] Changelog entry added
- [ ] Entry follows guidelines
- [ ] Appropriate category selected

## Additional Notes
Any additional context or considerations.
```

### Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by at least one maintainer
3. **Testing verification** on staging environment
4. **Performance assessment** for critical changes
5. **Final approval** and merge

## Testing

### Unit Tests

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:ui
```

### End-to-End Tests

```bash
# Run e2e tests
npm run test:e2e

# Run with UI for debugging
npm run test:e2e:ui

# Run specific test suite
npx playwright test tests/user-journeys.spec.ts
```

### Performance Tests

```bash
# Run performance test suite
npm run perf:test

# Quick performance check
npm run perf:test:quick
```

## Deployment

### Staging

Pull requests are automatically deployed to staging environments for testing.

### Production

Production deployments happen through:

```bash
# Full production deployment (881 Texas cities)
npm run deploy:production

# Validate deployment readiness
npm run production:validate

# Check production health
npm run health:check
```

### Environment-Specific Testing

```bash
# Test with limited cities for development
MAX_CITIES=10 npm run build:data:smart

# Test with tier 1 cities (production subset)
npm run build:data:tier1
```

## Common Tasks

### Data Generation

Our platform generates data for 881+ Texas cities:

```bash
# Smart generation with caching
npm run build:data:smart

# Force fresh data (no cache)
npm run build:data:fresh

# Full Texas cities build
npm run build:data:881
```

### Database Operations

```bash
# Test database connection
npm run db:test

# Set up database schema
npm run db:setup
```

### Cache Management

```bash
# View cache statistics
npm run cache:stats

# Clear cache
npm run cache:clear

# Warm cache for all cities
npm run cache:warm
```

## Getting Help

### Documentation

- [Design System Guide](docs/CHANGELOG_GUIDE.md#design-system)
- [Changelog Guide](docs/CHANGELOG_GUIDE.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

### Commands

```bash
# Validate your changes
npm run lint
npm run changelog:validate
npm run test:run

# Test git hooks
npm run hooks:test

# Performance analysis
npm run perf:test
```

### Common Issues

1. **Build failures**: Check data generation with `npm run build:data:smart`
2. **Test failures**: Run `npm run test:coverage` to see coverage gaps
3. **Hook failures**: Run `npm run hooks:test` to diagnose
4. **Performance issues**: Use `npm run perf:test` to identify bottlenecks

### Getting Support

- **Code Reviews**: Tag maintainers in your PR
- **Technical Questions**: Open a GitHub Discussion
- **Bug Reports**: Create a detailed GitHub Issue
- **Feature Requests**: Propose in GitHub Discussions first

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code and ideas, not the person
- Help create a welcoming environment for all contributors

## License

By contributing to ChooseMyPower, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to ChooseMyPower! Your efforts help Texans find better electricity plans and save money on their energy bills.