#!/usr/bin/env node

/**
 * Changelog Validation Script for ChooseMyPower.org
 * Validates changelog format and compliance
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '../..');
const changelogPath = join(projectRoot, 'CHANGELOG.md');

// Colors for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateChangelog() {
    console.log('🔍 Validating CHANGELOG.md...\n');
    
    let errors = 0;
    let warnings = 0;

    // Check if file exists
    if (!existsSync(changelogPath)) {
        log('red', '❌ CHANGELOG.md not found!');
        errors++;
        return { errors, warnings };
    }

    log('green', '✅ CHANGELOG.md exists');

    const content = readFileSync(changelogPath, 'utf8');
    const lines = content.split('\n');

    // Check required sections
    const requiredSections = [
        '# Changelog',
        '## [Unreleased]'
    ];

    for (const section of requiredSections) {
        if (!content.includes(section)) {
            log('red', `❌ Missing required section: ${section}`);
            errors++;
        } else {
            log('green', `✅ Found: ${section}`);
        }
    }

    // Check for proper version format
    const versionRegex = /^## \[[0-9]+\.[0-9]+\.[0-9]+\] - [0-9]{4}-[0-9]{2}-[0-9]{2}$/;
    const versionLines = lines.filter(line => line.match(/^## \[[0-9]/));
    
    if (versionLines.length === 0) {
        log('yellow', '⚠️ No version entries found');
        warnings++;
    } else {
        log('green', `✅ Found ${versionLines.length} version entries`);
        
        // Validate version format
        versionLines.forEach((line, index) => {
            if (line.includes('[Unreleased]')) return;
            
            if (!versionRegex.test(line)) {
                log('red', `❌ Invalid version format: ${line}`);
                errors++;
            } else {
                log('green', `✅ Valid version format: ${line}`);
            }
        });
    }

    // Check for empty unreleased section
    const unreleasedStart = lines.findIndex(line => line === '## [Unreleased]');
    if (unreleasedStart !== -1) {
        const nextVersionStart = lines.findIndex((line, index) => 
            index > unreleasedStart && line.match(/^## \[[0-9]/)
        );
        
        const unreleasedEnd = nextVersionStart === -1 ? lines.length : nextVersionStart;
        const unreleasedContent = lines.slice(unreleasedStart + 1, unreleasedEnd);
        
        const hasContent = unreleasedContent.some(line => 
            line.match(/^###/) || line.match(/^- /)
        );
        
        if (!hasContent) {
            log('yellow', '⚠️ Unreleased section appears to be empty');
            warnings++;
        } else {
            log('green', '✅ Unreleased section has content');
        }
    }

    // Check for proper category sections
    const validCategories = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security', 'Performance'];
    const foundCategories = lines.filter(line => line.match(/^### /))
                                .map(line => line.replace('### ', ''));
    
    const invalidCategories = foundCategories.filter(cat => !validCategories.includes(cat));
    if (invalidCategories.length > 0) {
        log('yellow', `⚠️ Non-standard categories found: ${invalidCategories.join(', ')}`);
        warnings++;
    }

    // Check for merge conflict markers
    const conflictMarkers = ['<<<<<<< ', '======= ', '>>>>>>> '];
    const hasConflicts = conflictMarkers.some(marker => content.includes(marker));
    
    if (hasConflicts) {
        log('red', '❌ Merge conflict markers found in CHANGELOG.md');
        errors++;
    }

    // Summary
    console.log('\n📊 Validation Summary:');
    if (errors === 0 && warnings === 0) {
        log('green', '🎉 Perfect! Changelog is fully compliant');
    } else if (errors === 0) {
        log('yellow', `⚠️ ${warnings} warning(s) found, but no errors`);
    } else {
        log('red', `❌ ${errors} error(s) and ${warnings} warning(s) found`);
    }

    return { errors, warnings };
}

// Run validation
if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        const { errors, warnings } = validateChangelog();
        process.exit(errors > 0 ? 1 : 0);
    } catch (error) {
        log('red', `❌ Validation failed: ${error.message}`);
        process.exit(1);
    }
}

export { validateChangelog };