#!/bin/bash

# Git Hooks Installation Script for ChooseMyPower.org
# Sets up changelog enforcement and commit validation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Installing Git Hooks for ChooseMyPower.org${NC}"
echo "This will set up automatic changelog validation and commit formatting."
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Not in a git repository!${NC}"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Check if hooks directory exists
if [ ! -d ".git/hooks" ]; then
    echo -e "${RED}❌ Git hooks directory not found!${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Installing git hooks...${NC}"

# Hook files to install
hooks=("pre-commit" "commit-msg" "prepare-commit-msg")
hooks_installed=0

for hook in "${hooks[@]}"; do
    hook_path=".git/hooks/$hook"
    
    if [ -f "$hook_path" ]; then
        # Check if it's already our hook
        if grep -q "ChooseMyPower.org" "$hook_path"; then
            echo -e "${GREEN}✅ $hook already installed${NC}"
        else
            # Backup existing hook
            cp "$hook_path" "$hook_path.backup"
            echo -e "${YELLOW}📦 Backed up existing $hook to $hook.backup${NC}"
            hooks_installed=$((hooks_installed + 1))
        fi
    else
        echo -e "${BLUE}📥 Installing $hook hook...${NC}"
        hooks_installed=$((hooks_installed + 1))
    fi
    
    # Make sure hook is executable
    chmod +x "$hook_path"
done

echo ""
echo -e "${GREEN}🎉 Git hooks installation completed!${NC}"
echo ""
echo -e "${BLUE}📝 What's enabled:${NC}"
echo "  • pre-commit: Validates CHANGELOG.md updates"
echo "  • commit-msg: Validates commit message format"
echo "  • prepare-commit-msg: Suggests commit format and changelog entries"
echo ""

if [ $hooks_installed -gt 0 ]; then
    echo -e "${YELLOW}⚠️ Important Notes:${NC}"
    echo "  1. All commits now require CHANGELOG.md updates"
    echo "  2. Use conventional commit format for best results:"
    echo "     feat: add new feature"
    echo "     fix: resolve bug issue"
    echo "     docs: update documentation"
    echo ""
    echo -e "${BLUE}💡 To bypass hooks (emergency only):${NC}"
    echo "     git commit --no-verify"
    echo ""
fi

# Test the hooks
echo -e "${BLUE}🧪 Testing hook installation...${NC}"

# Test pre-commit hook
if [ -x ".git/hooks/pre-commit" ]; then
    echo -e "${GREEN}✅ pre-commit hook is executable${NC}"
else
    echo -e "${RED}❌ pre-commit hook is not executable${NC}"
fi

# Test commit-msg hook
if [ -x ".git/hooks/commit-msg" ]; then
    echo -e "${GREEN}✅ commit-msg hook is executable${NC}"
else
    echo -e "${RED}❌ commit-msg hook is not executable${NC}"
fi

# Test prepare-commit-msg hook
if [ -x ".git/hooks/prepare-commit-msg" ]; then
    echo -e "${GREEN}✅ prepare-commit-msg hook is executable${NC}"
else
    echo -e "${RED}❌ prepare-commit-msg hook is not executable${NC}"
fi

echo ""
echo -e "${GREEN}🎯 Next Steps:${NC}"
echo "  1. Make a test commit to verify hooks work"
echo "  2. Update CHANGELOG.md for any changes"
echo "  3. Share this script with your team:"
echo "     npm run hooks:install"
echo ""

# Check for existing changelog
if [ ! -f "CHANGELOG.md" ]; then
    echo -e "${YELLOW}⚠️ CHANGELOG.md not found!${NC}"
    echo "The pre-commit hook will require a CHANGELOG.md file."
    echo "Would you like to create a basic one? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        cat > CHANGELOG.md << 'EOF'
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Git hooks for automated changelog validation

EOF
        echo -e "${GREEN}✅ Created basic CHANGELOG.md${NC}"
        echo "Please customize it with your project history."
    fi
fi

echo ""
echo -e "${BLUE}🔗 Useful Commands:${NC}"
echo "  npm run changelog:validate  - Validate changelog format"
echo "  npm run changelog:add       - Interactive changelog entry"
echo "  npm run hooks:install       - Run this script"
echo ""
echo -e "${GREEN}✅ Git hooks setup complete! Happy committing! 🚀${NC}"