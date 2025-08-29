#!/usr/bin/env node

/**
 * Changelog Formatter for ChooseMyPower.org
 * Formats and cleans up changelog structure and content
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
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
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

const validCategories = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security', 'Performance'];

function formatChangelog() {
    console.log('🎨 Formatting CHANGELOG.md...\n');
    
    let changes = 0;
    let warnings = 0;

    // Check if file exists
    if (!existsSync(changelogPath)) {
        log('red', '❌ CHANGELOG.md not found!');
        return { changes, warnings };
    }

    log('green', '✅ Reading CHANGELOG.md');

    const content = readFileSync(changelogPath, 'utf8');
    const lines = content.split('\n');
    const formattedLines = [];

    let currentSection = '';
    let inUnreleased = false;
    let inVersion = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Handle headers
        if (line.startsWith('# ')) {
            formattedLines.push(line);
            // Ensure blank line after main header
            if (i + 1 < lines.length && lines[i + 1].trim() !== '') {
                formattedLines.push('');
                changes++;
            }
        }
        // Handle version sections
        else if (line.match(/^## \[/)) {
            // Add blank line before version section if needed
            if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
                formattedLines.push('');
                changes++;
            }
            
            formattedLines.push(line);
            currentSection = line;
            inUnreleased = line.includes('[Unreleased]');
            inVersion = !inUnreleased;
        }
        // Handle category sections (### Added, ### Fixed, etc.)
        else if (line.startsWith('### ')) {
            const category = line.replace('### ', '');
            
            // Check for valid category
            if (!validCategories.includes(category)) {
                log('yellow', `⚠️ Non-standard category found: ${category}`);
                warnings++;
            }
            
            // Ensure blank line before category if needed
            if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
                formattedLines.push('');
                changes++;
            }
            
            formattedLines.push(line);
        }
        // Handle list items
        else if (line.startsWith('- ')) {
            // Clean up list item formatting
            let cleanedItem = line;
            
            // Ensure single space after dash
            if (!line.startsWith('- ')) {
                cleanedItem = line.replace(/^-\s*/, '- ');
                changes++;
            }
            
            // Trim trailing whitespace
            if (cleanedItem !== cleanedItem.trimEnd()) {
                cleanedItem = cleanedItem.trimEnd();
                changes++;
            }
            
            formattedLines.push(cleanedItem);
        }
        // Handle empty lines - normalize multiple empty lines
        else if (trimmed === '') {
            // Only add empty line if the last line wasn't already empty
            if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
                formattedLines.push('');
            } else if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] === '') {
                // Skip multiple empty lines
                changes++;
            }
        }
        // Handle other content (descriptions, etc.)
        else {
            formattedLines.push(line);
        }
    }

    // Remove trailing empty lines
    while (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] === '') {
        formattedLines.pop();
        changes++;
    }

    // Ensure file ends with single newline
    if (formattedLines.length > 0) {
        formattedLines.push('');
    }

    // Sort categories within sections
    const sortedLines = sortCategoriesInSections(formattedLines);
    if (JSON.stringify(sortedLines) !== JSON.stringify(formattedLines)) {
        changes++;
    }

    // Write formatted content
    if (changes > 0) {
        writeFileSync(changelogPath, sortedLines.join('\n'));
        log('green', `✅ Formatted changelog with ${changes} improvements`);
    } else {
        log('green', '✅ Changelog is already properly formatted');
    }

    if (warnings > 0) {
        log('yellow', `⚠️ ${warnings} warning(s) found`);
    }

    return { changes, warnings };
}

function sortCategoriesInSections(lines) {
    const sorted = [...lines];
    const categoryOrder = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security', 'Performance'];
    
    let i = 0;
    while (i < sorted.length) {
        // Find version section
        if (sorted[i].match(/^## \[/)) {
            const sectionStart = i;
            let sectionEnd = sorted.length;
            
            // Find end of this version section
            for (let j = i + 1; j < sorted.length; j++) {
                if (sorted[j].match(/^## \[/)) {
                    sectionEnd = j;
                    break;
                }
            }
            
            // Extract and sort categories within this section
            const sectionLines = sorted.slice(sectionStart, sectionEnd);
            const sortedSection = sortCategoriesInSection(sectionLines, categoryOrder);
            
            // Replace the section
            sorted.splice(sectionStart, sectionEnd - sectionStart, ...sortedSection);
            
            i = sectionStart + sortedSection.length;
        } else {
            i++;
        }
    }
    
    return sorted;
}

function sortCategoriesInSection(sectionLines, categoryOrder) {
    const result = [];
    const categories = new Map();
    let currentCategory = null;
    let headerLines = [];
    
    for (const line of sectionLines) {
        if (line.startsWith('### ')) {
            const category = line.replace('### ', '');
            currentCategory = category;
            categories.set(category, [line]);
        } else if (currentCategory && (line.startsWith('- ') || line.trim() === '')) {
            categories.get(currentCategory).push(line);
        } else {
            if (currentCategory === null) {
                headerLines.push(line);
            } else {
                // Reset current category for non-list content
                currentCategory = null;
                headerLines.push(line);
            }
        }
    }
    
    // Add header lines
    result.push(...headerLines);
    
    // Add categories in preferred order
    for (const preferredCategory of categoryOrder) {
        if (categories.has(preferredCategory)) {
            result.push(...categories.get(preferredCategory));
            categories.delete(preferredCategory);
        }
    }
    
    // Add any remaining categories not in the preferred order
    for (const [category, categoryLines] of categories) {
        result.push(...categoryLines);
    }
    
    return result;
}

// Run formatting
if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        const { changes, warnings } = formatChangelog();
        
        console.log('\n📊 Format Summary:');
        if (changes === 0 && warnings === 0) {
            log('green', '🎉 Perfect! Changelog is well formatted');
        } else if (warnings === 0) {
            log('green', `✅ Applied ${changes} formatting improvements`);
        } else {
            log('yellow', `⚠️ Applied ${changes} improvements with ${warnings} warnings`);
        }
        
        process.exit(warnings > 0 ? 1 : 0);
    } catch (error) {
        log('red', `❌ Formatting failed: ${error.message}`);
        process.exit(1);
    }
}

export { formatChangelog };