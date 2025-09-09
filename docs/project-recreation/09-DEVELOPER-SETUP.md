# Developer Setup & Onboarding Guide

**Document**: Complete Development Environment Setup  
**Version**: 1.0  
**Date**: 2025-09-09  

## Prerequisites & System Requirements

### **Required Software**
- **Node.js**: >=20.5.0 (LTS recommended)
- **npm**: >=10.2.0 (included with Node.js)
- **Git**: Latest version for version control
- **Docker**: For local database development (optional)
- **PostgreSQL**: 15+ (if not using Docker)
- **Redis**: 7+ (optional for development)

### **Recommended Development Tools**
- **VS Code**: With recommended extensions (see below)
- **Postman/Insomnia**: For API testing
- **TablePlus/pgAdmin**: For database management
- **RedisInsight**: For Redis cache inspection

### **System Resources**
- **RAM**: Minimum 8GB, recommended 16GB
- **Storage**: 5GB free space for dependencies and data
- **CPU**: Modern multi-core processor for build performance

## Quick Start Setup

### **1. Clone and Setup Repository**
```bash
# Clone the repository
git clone https://github.com/your-org/choose-my-power.git
cd choose-my-power

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Verify installation
npm run lint
npm run test:run
```

### **2. Environment Configuration**
```bash
# .env.local - Development environment variables

# Application
NODE_ENV=development
LOCAL_BUILD=true

# Database (choose one option)
# Option 1: Local PostgreSQL
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/choosemypower_dev

# Option 2: Netlify's Neon (for testing production setup)
NETLIFY_DATABASE_URL=your_neon_connection_string

# Caching (optional)
REDIS_URL=redis://localhost:6379

# API Keys (required for data generation)
COMPAREPOWER_API_KEY=your_api_key_here
ERCOT_API_KEY=your_ercot_api_key_here

# Development settings
MAX_CITIES=10              # Limit cities for faster development
BATCH_SIZE=3               # Small batches for development
BATCH_DELAY_MS=1000        # Shorter delays for development
USE_CACHED_DATA=true       # Use cached data by default

# Testing
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:5432/choosemypower_test
```

### **3. Database Setup Options**

#### **Option A: Docker Setup (Recommended)**
```bash
# Create and start PostgreSQL container
docker run --name choosemypower-postgres \
  -e POSTGRES_DB=choosemypower_dev \
  -e POSTGRES_USER=dev_user \
  -e POSTGRES_PASSWORD=dev_password \
  -p 5432:5432 \
  -d postgres:15

# Create test database
docker exec choosemypower-postgres createdb -U dev_user choosemypower_test

# Optional: Redis for caching
docker run --name choosemypower-redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

#### **Option B: Manual PostgreSQL Installation**
```bash
# macOS (using Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Create databases
createdb choosemypower_dev
createdb choosemypower_test

# Create user
psql -d postgres -c "CREATE USER dev_user WITH PASSWORD 'dev_password';"
psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE choosemypower_dev TO dev_user;"
psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE choosemypower_test TO dev_user;"
```

### **4. Initialize Database**
```bash
# Run database migrations
npm run db:setup

# Seed with development data
npm run db:seed

# Generate initial plan data (limited for development)
MAX_CITIES=10 npm run build:data:smart
```

### **5. Start Development Server**
```bash
# Start the development server
npm run dev

# Server will be available at http://localhost:4324
```

## Development Workflow

### **Daily Development Commands**
```bash
# Start development server with live reloading
npm run dev

# Run tests during development
npm run test              # Unit tests in watch mode
npm run test:e2e:ui       # E2E tests with UI

# Code quality checks
npm run lint              # ESLint
npm run validate:ids      # Check for hardcoded IDs (critical)

# Database management
npm run db:reset          # Reset development database
npm run db:health         # Check database connectivity

# Build testing
npm run build:local       # Test local build
npm run preview           # Preview production build
```

### **Feature Development Workflow**
```bash
# 1. Create feature branch
git checkout -b feature/zip-code-validation

# 2. Make changes and test frequently
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run lint              # Code quality

# 3. Test builds
npm run build:local       # Local build test

# 4. Validate constitutional requirements
npm run validate:ids      # Must pass - prevents wrong plan orders

# 5. Commit changes
git add .
git commit -m "feat: Add ZIP code validation with TDSP mapping"

# 6. Push and create PR
git push origin feature/zip-code-validation
```

### **Testing Workflow**
```bash
# Unit testing
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:coverage     # With coverage report

# Integration testing
npm run test:integration  # API and database tests

# End-to-end testing
npm run test:e2e          # Full E2E suite
npm run test:e2e:ui       # With Playwright UI

# Performance testing
npm run perf:test:critical # Critical performance tests

# Security testing
npm run security:audit    # Security audit
```

## VS Code Setup

### **Recommended Extensions**
```json
// .vscode/extensions.json
{
  "recommendations": [
    "astro-build.astro-vscode",
    "bradlc.vscode-tailwindcss", 
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-playwright.playwright",
    "vitest.explorer",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json"
  ]
}
```

### **VS Code Settings**
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "astro": "html"
  },
  "files.associations": {
    "*.astro": "astro"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "'([^']*)'"],
    ["clsx\\(([^)]*)\\)", "'([^']*)'"]
  ],
  "vitest.enable": true,
  "playwright.reuseBrowser": true
}
```

### **Debug Configuration**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Astro Dev Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/astro",
      "args": ["dev"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Debug API Route",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "${workspaceFolder}"
    },
    {
      "name": "Debug Vitest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vitest",
      "args": ["run", "--reporter=verbose"],
      "env": {
        "NODE_ENV": "test"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

## Development Scripts & Tasks

### **Automated Setup Script**
```bash
#!/bin/bash
# scripts/setup-development.sh

set -e

echo "🚀 Setting up ChooseMyPower development environment..."

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="20.5.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $REQUIRED_VERSION or higher is required. Current: $NODE_VERSION"
    exit 1
fi

echo "✅ Node.js version check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Setup environment
if [ ! -f .env.local ]; then
    echo "⚙️ Creating environment file..."
    cp .env.example .env.local
    echo "📝 Please update .env.local with your API keys and database configuration"
fi

# Database setup
echo "🗄️ Setting up database..."
if command -v docker &> /dev/null; then
    # Docker setup
    echo "🐳 Using Docker for database..."
    
    # Stop existing containers
    docker stop choosemypower-postgres choosemypower-redis 2>/dev/null || true
    docker rm choosemypower-postgres choosemypower-redis 2>/dev/null || true
    
    # Start PostgreSQL
    docker run --name choosemypower-postgres \
        -e POSTGRES_DB=choosemypower_dev \
        -e POSTGRES_USER=dev_user \
        -e POSTGRES_PASSWORD=dev_password \
        -p 5432:5432 \
        -d postgres:15
    
    # Start Redis
    docker run --name choosemypower-redis \
        -p 6379:6379 \
        -d redis:7-alpine
    
    # Wait for databases to be ready
    echo "⏳ Waiting for databases to be ready..."
    sleep 10
    
    # Create test database
    docker exec choosemypower-postgres createdb -U dev_user choosemypower_test 2>/dev/null || true
    
else
    echo "⚠️ Docker not found. Please install PostgreSQL manually."
    echo "Expected connection: postgresql://dev_user:dev_password@localhost:5432/choosemypower_dev"
fi

# Initialize database
echo "🌱 Initializing database..."
npm run db:setup
npm run db:seed

# Generate development data
echo "📊 Generating development data..."
MAX_CITIES=10 BATCH_SIZE=3 npm run build:data:smart

# Run initial tests
echo "🧪 Running initial tests..."
npm run lint
npm run test:run
npm run validate:ids

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your API keys"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:4324 to see the application"
echo ""
echo "Useful commands:"
echo "  npm run dev              # Start development server"
echo "  npm run test             # Run tests in watch mode"
echo "  npm run build:local      # Test production build"
echo "  npm run validate:ids     # Validate constitutional requirements"
echo "  npm run db:health        # Check database connectivity"
```

### **Development Utilities**
```bash
# scripts/dev-utils.sh

# Reset development environment
reset_dev() {
    echo "🔄 Resetting development environment..."
    docker stop choosemypower-postgres choosemypower-redis 2>/dev/null || true
    docker rm choosemypower-postgres choosemypower-redis 2>/dev/null || true
    rm -rf node_modules/.cache
    npm run db:setup
    npm run db:seed
    MAX_CITIES=10 npm run build:data:smart
    echo "✅ Development environment reset complete"
}

# Quick health check
health_check() {
    echo "🏥 Running development health check..."
    
    # Check database
    if npm run db:health > /dev/null 2>&1; then
        echo "✅ Database connection healthy"
    else
        echo "❌ Database connection failed"
    fi
    
    # Check Redis
    if redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis connection healthy"
    else
        echo "⚠️ Redis not available (optional for development)"
    fi
    
    # Check API keys
    if [ -z "$COMPAREPOWER_API_KEY" ]; then
        echo "⚠️ COMPAREPOWER_API_KEY not set"
    else
        echo "✅ ComparePower API key configured"
    fi
    
    # Run critical validations
    if npm run validate:ids > /dev/null 2>&1; then
        echo "✅ No hardcoded plan IDs found"
    else
        echo "❌ Hardcoded plan IDs detected - CRITICAL"
    fi
}

# Generate fresh data
fresh_data() {
    echo "📊 Generating fresh development data..."
    USE_CACHED_DATA=false MAX_CITIES=25 npm run build:data:smart
    echo "✅ Fresh data generated"
}

# Performance test
perf_test() {
    echo "⚡ Running performance tests..."
    npm run build:local
    npm run perf:test:critical
}
```

## Troubleshooting Guide

### **Common Issues & Solutions**

#### **Database Connection Issues**
```bash
# Error: "database connection failed"

# Solution 1: Check database status
docker ps | grep postgres
# If not running:
docker start choosemypower-postgres

# Solution 2: Recreate database container
docker stop choosemypower-postgres
docker rm choosemypower-postgres
# Re-run setup script

# Solution 3: Check connection string
echo $DATABASE_URL
# Should match: postgresql://dev_user:dev_password@localhost:5432/choosemypower_dev
```

#### **Build Failures**
```bash
# Error: "build failed with API rate limiting"

# Solution 1: Reduce batch size and increase delays
MAX_CITIES=5 BATCH_SIZE=2 BATCH_DELAY_MS=3000 npm run build:data:smart

# Solution 2: Use cached data
USE_CACHED_DATA=true npm run build:data:smart

# Solution 3: Check API keys
echo $COMPAREPOWER_API_KEY
# Should not be empty
```

#### **Test Failures**
```bash
# Error: "constitutional requirement tests failing"

# Solution: Check for hardcoded IDs
npm run validate:ids

# If found, remove hardcoded patterns:
# - Plan IDs starting with "68b"
# - ESIDs like "10123456789012345"

# Run specific constitutional tests
npm run test tests/constitutional/
```

#### **Performance Issues**
```bash
# Error: "development server slow"

# Solution 1: Clear caches
rm -rf node_modules/.cache
rm -rf dist/
npm run dev

# Solution 2: Reduce data size
MAX_CITIES=5 npm run build:data:smart

# Solution 3: Check system resources
# Ensure 8GB+ RAM available
# Close other development tools
```

### **Development Tips**

#### **Working with Plan Data**
```typescript
// Always use dynamic plan ID resolution
const planId = await getPlanObjectId(planName, providerName, citySlug);

// Never hardcode plan IDs
const HARDCODED_ID = '68b4f12d8e9c4a5b2f3e6d8a9'; // ❌ NEVER DO THIS

// Always validate plan IDs before using
if (!planId || !planId.match(/^[0-9a-f]{24}$/)) {
  throw new Error('Invalid plan ID');
}
```

#### **ESID Generation Best Practices**
```typescript
// Generate ESID from address components
const esiid = await generateESIDFromAddress({
  street: '123 Main St',
  city: 'Dallas',
  state: 'TX',
  zipCode: '75201'
});

// Never use hardcoded ESIDs
const HARDCODED_ESIID = '10123456789012345'; // ❌ NEVER DO THIS

// Validate ESID format
if (!esiid.match(/^10\d{15}$/)) {
  throw new Error('Invalid ESID format');
}
```

#### **Testing During Development**
```bash
# Run tests related to your changes
npm run test -- --watch ComponentName

# Test specific user journey
npm run test:e2e -- --grep "ZIP to plan selection"

# Performance testing during development  
npm run perf:test:critical

# Always validate constitutional requirements
npm run validate:ids
```

### **Getting Help**

#### **Internal Resources**
- **Documentation**: Check `/docs` folder for detailed guides
- **API Documentation**: `/docs/API-SPECIFICATIONS.md`
- **Architecture**: `/docs/TECHNICAL-SPECIFICATIONS.md`

#### **External Resources**
- **Astro Documentation**: https://docs.astro.build/
- **React Documentation**: https://react.dev/
- **Drizzle ORM**: https://orm.drizzle.team/
- **Playwright Testing**: https://playwright.dev/

#### **Team Communication**
- **Slack**: #choosemypower-dev channel
- **Issues**: GitHub Issues for bug reports
- **Code Review**: Pull request discussions

This developer setup guide provides everything needed to get productive quickly while maintaining the high quality and constitutional requirements of the ChooseMyPower platform.