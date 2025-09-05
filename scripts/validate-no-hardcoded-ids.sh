#!/bin/bash

# Validation Script: Prevent Hardcoded Plan IDs and ESIDs
# This script prevents the critical bug where hardcoded plan IDs caused wrong electricity plans to be ordered
# Usage: ./scripts/validate-no-hardcoded-ids.sh

set -e

echo "🔍 Validating no hardcoded Plan IDs or ESIDs..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for hardcoded MongoDB ObjectIds (24 hex characters starting with common prefixes)
echo "📋 Checking for hardcoded Plan IDs..."
HARDCODED_PLAN_IDS=$(grep -r "68b[0-9a-f]\{21\}" src/ --exclude-dir=data --exclude-dir=__tests__ --exclude="*.test.*" --exclude="*.spec.*" || true)

if [ -n "$HARDCODED_PLAN_IDS" ]; then
    echo -e "${RED}❌ CRITICAL ERROR: Hardcoded Plan IDs found!${NC}"
    echo -e "${RED}This will cause users to order wrong electricity plans!${NC}"
    echo ""
    echo "Found hardcoded Plan IDs:"
    echo "$HARDCODED_PLAN_IDS"
    echo ""
    echo -e "${YELLOW}Solution: Use dynamic plan ID resolution instead${NC}"
    echo "See: /docs/PLAN-ID-ESID-SPECIFICATION.md"
    exit 1
fi

# Check for hardcoded ESIDs (17 digits starting with 10, but exclude generation algorithms)
echo "🏠 Checking for hardcoded ESIDs..."
HARDCODED_ESIDS=$(grep -r "10[0-9]\{15\}" src/ --exclude-dir=test --exclude-dir=__tests__ --exclude="*.test.*" --exclude="*.spec.*" --exclude="search-dynamic.ts" --exclude="validate.ts" | grep -v "baseEsiid.*+" | grep -v "Math.floor\|Math.random\|zipNum\|esiidNum" || true)

if [ -n "$HARDCODED_ESIDS" ]; then
    echo -e "${RED}❌ CRITICAL ERROR: Hardcoded ESIDs found!${NC}"
    echo -e "${RED}This will cause address validation failures!${NC}"
    echo ""
    echo "Found hardcoded ESIDs:"
    echo "$HARDCODED_ESIDS"
    echo ""
    echo -e "${YELLOW}Solution: Use address-based ESID generation instead${NC}"
    echo "See: /docs/PLAN-ID-ESID-SPECIFICATION.md"
    exit 1
fi

# Check for suspicious fallback patterns
echo "⚠️  Checking for fallback patterns..."
FALLBACK_PATTERNS=$(grep -r -i "fallback.*plan\|default.*plan.*id\|hardcoded.*plan" src/ --exclude-dir=data --exclude-dir=__tests__ --exclude="*.test.*" --exclude="*.spec.*" --exclude="*.md" || true)

if [ -n "$FALLBACK_PATTERNS" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Potential fallback patterns found:${NC}"
    echo "$FALLBACK_PATTERNS"
    echo ""
    echo -e "${YELLOW}Please verify these are not hardcoded plan ID fallbacks${NC}"
fi

# Validate critical files exist and have required functions
echo "🔧 Validating critical files..."

CRITICAL_FILES=(
    "src/components/ui/AddressSearchModal.tsx"
    "src/components/ui/ProductDetailsPageShadcn.tsx"
    "src/pages/api/plans/search.ts"
    "src/lib/api/plan-data-service.ts"
    "src/pages/api/ercot/validate.ts"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ CRITICAL ERROR: Missing critical file: $file${NC}"
        exit 1
    fi
done

# Check that plan search API uses dynamic data service
if ! grep -q "findPlanByNameAndProvider" src/pages/api/plans/search.ts; then
    echo -e "${RED}❌ CRITICAL ERROR: Plan search API not using dynamic data service${NC}"
    echo "File: src/pages/api/plans/search.ts"
    echo "Required: Must use findPlanByNameAndProvider() function"
    exit 1
fi

# Check that AddressSearchModal has proper validation
if ! grep -q "getPlanObjectId" src/components/ui/AddressSearchModal.tsx; then
    echo -e "${RED}❌ CRITICAL ERROR: AddressSearchModal missing plan ID validation${NC}"
    echo "File: src/components/ui/AddressSearchModal.tsx"
    echo "Required: Must use getPlanObjectId() function"
    exit 1
fi

# Check that ERCOT API generates ESIDs dynamically
if ! grep -q "generateESIIDDetails" src/pages/api/ercot/validate.ts; then
    echo -e "${RED}❌ CRITICAL ERROR: ERCOT API not generating ESIDs dynamically${NC}"
    echo "File: src/pages/api/ercot/validate.ts"
    echo "Required: Must use generateESIIDDetails() function"
    exit 1
fi

echo -e "${GREEN}✅ All validations passed!${NC}"
echo -e "${GREEN}No hardcoded Plan IDs or ESIDs found${NC}"
echo ""
echo "🔗 Reference: /docs/PLAN-ID-ESID-SPECIFICATION.md"
echo "🛠️  Troubleshooting: See CLAUDE.md > Plan ID & ESID Issues"

exit 0