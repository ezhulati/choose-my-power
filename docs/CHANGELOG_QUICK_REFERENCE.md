# Changelog Quick Reference

## Essential Commands

```bash
# Install git hooks (first time setup)
npm run hooks:install

# Add changelog entry (interactive)
npm run changelog:add

# Validate changelog format
npm run changelog:validate

# Create a new version release
npm run changelog:release
```

## Changelog Categories (in order)

1. **Added** - New features
2. **Changed** - Changes to existing functionality  
3. **Deprecated** - Features marked for removal
4. **Removed** - Removed features
5. **Fixed** - Bug fixes
6. **Security** - Security-related changes
7. **Performance** - Performance improvements

## Commit Message Format

```
type: description (max 100 chars)

Optional detailed explanation

Optional footer (issue references, etc.)
```

**Common types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `security`

## Skip Changelog Cases

- Documentation-only changes (README, docs/, comments)
- Merge commits
- Emergency: `git commit --no-verify` (must follow up with changelog)

## Troubleshooting

| Error | Solution |
|-------|----------|
| "CHANGELOG.md was not updated" | Run `npm run changelog:add` |
| "Commit message too short" | Use min 10 characters |
| "Invalid changelog format" | Run `npm run changelog:format` |
| Git hooks not working | Run `npm run hooks:install` |

## Entry Examples

```markdown
### Added
- ZIP code autocomplete for faster address entry (#234)
- Mobile-optimized plan comparison interface

### Fixed  
- Calculation error in monthly cost estimates for 12-month plans
- Responsive layout issues on tablet devices

### Changed
- Updated search algorithm to prioritize user preferences
- Improved error messages for better user guidance
```

## Release Process

1. `npm run changelog:release`
2. `git add CHANGELOG.md`
3. `git commit -m "release: version X.Y.Z"`
4. `git tag vX.Y.Z && git push origin main --tags`

## Version Numbers (SemVer)

- **X.Y.Z** → **X.Y.(Z+1)**: Bug fixes
- **X.Y.Z** → **X.(Y+1).0**: New features
- **X.Y.Z** → **(X+1).0.0**: Breaking changes