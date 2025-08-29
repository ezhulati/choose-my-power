#!/bin/bash

# Git Hooks Testing Script for ChooseMyPower.org
# Tests all git hooks to ensure they work correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Git Hooks for ChooseMyPower.org${NC}"
echo "This will test all git hooks without affecting your working directory."
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Not in a git repository!${NC}"
    echo "Please run this script from the project root directory."
    exit 1
fi

tests_passed=0
tests_failed=0
tests_total=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3" # "pass" or "fail"
    
    tests_total=$((tests_total + 1))
    echo -e "${BLUE}🔍 Testing: $test_name${NC}"
    
    if eval "$test_command" >/dev/null 2>&1; then
        if [ "$expected_result" = "pass" ]; then
            echo -e "${GREEN}✅ PASS: $test_name${NC}"
            tests_passed=$((tests_passed + 1))
        else
            echo -e "${RED}❌ FAIL: $test_name (expected to fail but passed)${NC}"
            tests_failed=$((tests_failed + 1))
        fi
    else
        if [ "$expected_result" = "fail" ]; then
            echo -e "${GREEN}✅ PASS: $test_name (correctly rejected)${NC}"
            tests_passed=$((tests_passed + 1))
        else
            echo -e "${RED}❌ FAIL: $test_name${NC}"
            tests_failed=$((tests_failed + 1))
        fi
    fi
}

# Test 1: Check if hooks exist and are executable
echo -e "${YELLOW}📋 Phase 1: Hook Installation Tests${NC}"
echo ""

hooks=("pre-commit" "commit-msg" "prepare-commit-msg")

for hook in "${hooks[@]}"; do
    hook_path=".git/hooks/$hook"
    
    if [ -f "$hook_path" ]; then
        echo -e "${GREEN}✅ $hook exists${NC}"
        
        if [ -x "$hook_path" ]; then
            echo -e "${GREEN}✅ $hook is executable${NC}"
        else
            echo -e "${RED}❌ $hook is not executable${NC}"
            tests_failed=$((tests_failed + 1))
        fi
        
        if grep -q "ChooseMyPower.org" "$hook_path"; then
            echo -e "${GREEN}✅ $hook contains project signature${NC}"
        else
            echo -e "${YELLOW}⚠️ $hook may not be the project version${NC}"
        fi
    else
        echo -e "${RED}❌ $hook not found${NC}"
        tests_failed=$((tests_failed + 1))
    fi
    
    tests_total=$((tests_total + 3))
done

echo ""
echo -e "${YELLOW}📋 Phase 2: Pre-commit Hook Tests${NC}"
echo ""

# Create a temporary branch for testing
original_branch=$(git branch --show-current)
test_branch="test-hooks-$(date +%s)"

# Stash any current changes
git stash -u > /dev/null 2>&1 || true

# Create test branch
git checkout -b "$test_branch" > /dev/null 2>&1

# Test pre-commit hook with no changelog changes
echo "test change" > test-file.txt
git add test-file.txt

run_test "Pre-commit rejects commits without changelog updates" \
         ".git/hooks/pre-commit" \
         "fail"

# Test pre-commit hook with changelog changes
echo "- Test changelog entry" >> CHANGELOG.md
git add CHANGELOG.md

run_test "Pre-commit accepts commits with changelog updates" \
         ".git/hooks/pre-commit" \
         "pass"

# Test documentation-only commits (should pass without changelog)
git reset HEAD --hard > /dev/null 2>&1
echo "# Documentation update" > docs-test.md
git add docs-test.md

run_test "Pre-commit allows documentation-only commits" \
         ".git/hooks/pre-commit" \
         "pass"

# Clean up test files
git reset HEAD --hard > /dev/null 2>&1
rm -f test-file.txt docs-test.md

echo ""
echo -e "${YELLOW}📋 Phase 3: Commit Message Hook Tests${NC}"
echo ""

# Test commit-msg hook
test_commit_message() {
    local message="$1"
    local expected="$2"
    local description="$3"
    
    echo "$message" > .git/test-commit-msg
    
    run_test "$description" \
             ".git/hooks/commit-msg .git/test-commit-msg" \
             "$expected"
    
    rm -f .git/test-commit-msg
}

test_commit_message "feat: add new feature" "pass" "Valid conventional commit message"
test_commit_message "fix: resolve critical bug" "pass" "Valid fix commit message"
test_commit_message "docs: update readme" "pass" "Valid docs commit message"
test_commit_message "x" "fail" "Too short commit message"
test_commit_message "" "fail" "Empty commit message"
test_commit_message "This is a very long commit message that exceeds the recommended maximum length for git commit messages and should probably be rejected by the hook" "fail" "Too long commit message"

echo ""
echo -e "${YELLOW}📋 Phase 4: Prepare Commit Message Hook Tests${NC}"
echo ""

# Test prepare-commit-msg hook
touch .git/test-prepare-msg
run_test "Prepare-commit-msg hook executes without error" \
         ".git/hooks/prepare-commit-msg .git/test-prepare-msg commit" \
         "pass"

rm -f .git/test-prepare-msg

echo ""
echo -e "${YELLOW}📋 Phase 5: Integration Tests${NC}"
echo ""

# Test full commit workflow (should work)
echo "- Test integration entry" >> CHANGELOG.md
git add CHANGELOG.md

# Create a proper commit message file
echo "feat: test integration commit

This is a test commit to verify the complete git hooks workflow
works correctly with changelog updates." > .git/test-full-commit-msg

run_test "Full commit workflow with changelog and valid message" \
         "(.git/hooks/pre-commit && .git/hooks/commit-msg .git/test-full-commit-msg)" \
         "pass"

rm -f .git/test-full-commit-msg

echo ""
echo -e "${YELLOW}📋 Phase 6: Cleanup${NC}"

# Return to original branch and clean up
git checkout "$original_branch" > /dev/null 2>&1
git branch -D "$test_branch" > /dev/null 2>&1

# Restore any stashed changes
git stash pop > /dev/null 2>&1 || true

echo ""
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo "=============================="
echo -e "Total Tests: ${tests_total}"
echo -e "${GREEN}Passed: ${tests_passed}${NC}"
echo -e "${RED}Failed: ${tests_failed}${NC}"

if [ $tests_failed -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! Git hooks are working correctly.${NC}"
    echo ""
    echo -e "${BLUE}🔗 Next Steps:${NC}"
    echo "  1. All developers should run: npm run hooks:install"
    echo "  2. Test with a real commit to verify functionality"
    echo "  3. Share these testing procedures with your team"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Please check your git hooks setup.${NC}"
    echo ""
    echo -e "${YELLOW}💡 Troubleshooting:${NC}"
    echo "  1. Run: npm run hooks:install"
    echo "  2. Check hook permissions: chmod +x .git/hooks/*"
    echo "  3. Verify hooks contain ChooseMyPower.org signatures"
    echo "  4. Test individual hooks manually"
    exit 1
fi