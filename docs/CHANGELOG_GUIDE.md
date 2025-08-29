# Changelog Guide for ChooseMyPower.org

This guide explains how to use the automated changelog system implemented for the ChooseMyPower project.

## Overview

Our changelog system follows the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standard and enforces proper documentation of all changes through:

- **Local Git Hooks**: Validate changes before commits
- **Interactive Tools**: Easy changelog entry creation
- **CI/CD Integration**: Automated validation in pull requests
- **Release Management**: Streamlined version releases

## Quick Start

### 1. Install Git Hooks (First Time Setup)

```bash
npm run hooks:install
```

This sets up local git hooks that will:
- Require changelog updates for most commits
- Validate commit message format
- Provide helpful commit templates

### 2. Making Changes

When you make changes that should be documented:

```bash
# Make your code changes
git add your-files.js

# Add changelog entry interactively
npm run changelog:add

# Commit your changes
git commit -m "feat: add new feature XYZ"
```

The git hooks will automatically validate that you've updated the changelog.

## Detailed Usage

### Adding Changelog Entries

#### Interactive Method (Recommended)

```bash
npm run changelog:add
```

This opens an interactive tool that guides you through:
1. Selecting the appropriate category (Added, Fixed, Changed, etc.)
2. Writing a clear description
3. Adding optional issue/PR references
4. Previewing before saving

#### Manual Method

Edit `CHANGELOG.md` directly and add entries under the `## [Unreleased]` section:

```markdown
## [Unreleased]

### Added
- New electricity plan comparison feature (#123)
- Mobile-optimized search interface

### Fixed
- Resolved ZIP code validation issue (#124)
- Fixed responsive layout on tablet devices
```

### Changelog Categories

Use these standard categories in order of preference:

| Category | When to Use | Examples |
|----------|-------------|----------|
| **Added** | New features, functionality | "Added mobile comparison view", "New API endpoint for plans" |
| **Changed** | Changes to existing functionality | "Updated search algorithm", "Improved error messages" |
| **Fixed** | Bug fixes | "Fixed calculation error", "Resolved mobile layout issue" |
| **Performance** | Performance improvements | "Optimized plan loading time", "Reduced bundle size" |
| **Security** | Security-related changes | "Updated dependency versions", "Added input validation" |
| **Deprecated** | Features marked for removal | "Deprecated old API endpoint" |
| **Removed** | Removed features | "Removed legacy comparison tool" |

### Commit Message Format

We encourage [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <description>

[optional body]

[optional footer(s)]
```

**Common types:**
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat: add electricity plan filtering by contract length
fix: resolve ZIP code validation for Houston area
docs: update API documentation for plan endpoints
perf: optimize plan comparison algorithm
```

### Special Commit Cases

#### Documentation-Only Changes
These commits can skip changelog requirements:
- README updates
- Comment additions
- Documentation file changes (`.md` files in `docs/`)

#### Merge Commits
Merge commits automatically skip changelog validation.

#### Emergency Bypassing
In rare emergencies, you can bypass hooks:
```bash
git commit --no-verify -m "emergency: critical hotfix"
```
**Note:** You must add a changelog entry in a follow-up commit.

## Available Commands

### Changelog Management

```bash
# Interactive changelog entry
npm run changelog:add

# Validate changelog format
npm run changelog:validate

# Format and clean up changelog
npm run changelog:format

# Create a new version release
npm run changelog:release
```

### Git Hooks

```bash
# Install git hooks for your local repo
npm run hooks:install

# Test that git hooks work correctly
npm run hooks:test
```

### Validation Commands

```bash
# Check changelog compliance (runs in CI)
npm run changelog:validate

# Test all git hooks
npm run hooks:test
```

## Release Process

### Creating a New Release

1. **Ensure unreleased changes exist:**
   ```bash
   npm run changelog:validate
   ```

2. **Create the release:**
   ```bash
   npm run changelog:release
   ```
   
   This will:
   - Move unreleased changes to a new version section
   - Add the current date
   - Prompt for version number and description

3. **Commit and tag:**
   ```bash
   git add CHANGELOG.md
   git commit -m "release: version X.Y.Z"
   git tag vX.Y.Z
   git push origin main --tags
   ```

4. **Create GitHub Release** (optional):
   Use the changelog content to create a GitHub release

### Version Numbering

We use [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes, major new features
- **MINOR** (X.Y.0): New features, backwards compatible
- **PATCH** (X.Y.Z): Bug fixes, backwards compatible

**Examples:**
- `1.2.3` → `1.2.4`: Bug fixes only
- `1.2.3` → `1.3.0`: New features added
- `1.2.3` → `2.0.0`: Breaking changes introduced

## Troubleshooting

### Common Issues

#### "CHANGELOG.md was not updated"
**Solution:**
1. Add a changelog entry: `npm run changelog:add`
2. Or manually edit `CHANGELOG.md`
3. Stage the changelog: `git add CHANGELOG.md`
4. Commit again

#### "Commit message too short/long"
**Solution:**
- Minimum 10 characters required
- Maximum 100 characters for first line
- Use conventional commit format: `type: description`

#### Git hooks not working
**Solution:**
1. Reinstall hooks: `npm run hooks:install`
2. Check permissions: `ls -la .git/hooks/`
3. Test hooks: `npm run hooks:test`

#### Changelog validation fails in CI
**Solution:**
1. Run locally: `npm run changelog:validate`
2. Fix any format issues: `npm run changelog:format`
3. Ensure unreleased section has proper content

### Getting Help

1. **Validate your changelog:**
   ```bash
   npm run changelog:validate
   ```

2. **Test git hooks:**
   ```bash
   npm run hooks:test
   ```

3. **Check the current changelog:**
   ```bash
   cat CHANGELOG.md | head -30
   ```

4. **Format/clean up changelog:**
   ```bash
   npm run changelog:format
   ```

## Integration with CI/CD

### Pull Request Validation

Every PR automatically validates that:
- `CHANGELOG.md` was updated (unless documentation-only)
- Changelog format is valid
- No merge conflict markers exist

### Deployment Pipeline

The changelog is used in our deployment process:
- Version information is extracted for build metadata
- Changelog content is used for release notes
- Compliance checks run before production deployment

## Best Practices

### Writing Good Changelog Entries

**Good:**
```markdown
- Added ZIP code autocomplete for faster address entry (#234)
- Fixed calculation error in monthly cost estimates for 12-month plans
- Improved mobile performance by optimizing image loading
```

**Avoid:**
```markdown
- Fixed bug (too vague)
- Updated stuff (not descriptive)
- Added feature (what feature?)
```

### Entry Guidelines

1. **Be specific**: Describe what changed, not what you did
2. **User-focused**: Write from the user's perspective
3. **Reference issues**: Include issue/PR numbers when relevant
4. **Past tense**: "Added", "Fixed", "Changed" (not "Add", "Fix", "Change")
5. **One change per entry**: Split multiple changes into separate entries

### Team Workflow

1. **Feature branches**: Always update changelog in your feature branch
2. **PR reviews**: Review changelog entries as part of code review
3. **Release planning**: Use changelog to plan version numbers
4. **Communication**: Changelog entries help communicate changes to stakeholders

## Advanced Usage

### Custom Categories

If you need a custom category not in the standard list, add it manually:

```markdown
### Infrastructure
- Migrated database to new server cluster
- Updated deployment scripts for better reliability
```

### Linking to Issues/PRs

Always reference related issues and PRs:

```markdown
- Fixed electricity plan comparison accuracy (#123, #124)
- Added new provider data source (closes #125)
- Improved error handling based on user feedback (#126)
```

### Multi-line Entries

For complex changes, use bullet sub-points:

```markdown
- Enhanced electricity plan comparison system:
  - Added contract length filtering
  - Improved rate calculation accuracy
  - Added green energy plan indicators
  - Fixed mobile display issues
```

## Changelog Automation

Our system provides several automation features:

### Pre-commit Hooks
- **Validation**: Checks for changelog updates
- **Format checking**: Ensures proper markdown structure  
- **Merge conflict detection**: Prevents committing conflicts

### GitHub Actions
- **PR validation**: Ensures changelog compliance
- **Auto-generation**: Can generate entries from conventional commits
- **Release automation**: Creates releases based on changelog

### Interactive Tools
- **Guided entry**: Step-by-step changelog creation
- **Category selection**: Choose from predefined categories
- **Preview mode**: Review entries before saving
- **Validation feedback**: Immediate format checking

This system ensures consistent, high-quality changelog maintenance across our development team while making the process as smooth as possible for developers.