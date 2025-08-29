#!/usr/bin/env node

/**
 * Release Version Script for ChooseMyPower.org
 * Moves unreleased changes to a new version section
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

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

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise(resolve => {
        rl.question(prompt, resolve);
    });
}

function validateVersion(version) {
    const semverRegex = /^[0-9]+\.[0-9]+\.[0-9]+$/;
    return semverRegex.test(version);
}

function formatDate() {
    return new Date().toISOString().split('T')[0];
}

async function releaseVersion() {
    console.clear();
    log('blue', '🚀 Release Version Tool');
    log('cyan', '=====================\n');

    // Check if changelog exists
    if (!existsSync(changelogPath)) {
        log('red', '❌ CHANGELOG.md not found!');
        rl.close();
        return;
    }

    try {
        // Read current changelog
        const content = readFileSync(changelogPath, 'utf8');
        
        // Check if Unreleased section exists and has content
        if (!content.includes('## [Unreleased]')) {
            log('red', '❌ No [Unreleased] section found in CHANGELOG.md');
            rl.close();
            return;
        }

        // Extract unreleased content
        const lines = content.split('\n');
        const unreleasedIndex = lines.findIndex(line => line === '## [Unreleased]');
        const nextVersionIndex = lines.findIndex((line, i) => 
            i > unreleasedIndex && line.match(/^## \[[0-9]/)
        );
        
        const unreleasedEnd = nextVersionIndex === -1 ? lines.length : nextVersionIndex;
        const unreleasedContent = lines.slice(unreleasedIndex + 1, unreleasedEnd);
        
        // Check if unreleased section has actual content
        const hasContent = unreleasedContent.some(line => 
            line.match(/^###/) || line.match(/^- /)
        );
        
        if (!hasContent) {
            log('yellow', '⚠️ No changes in [Unreleased] section to release');
            const proceed = await question('Continue anyway? (y/N): ');
            if (!proceed.toLowerCase().startsWith('y')) {
                log('yellow', '❌ Release cancelled');
                rl.close();
                return;
            }
        }

        // Show unreleased content
        log('blue', '📋 Current unreleased changes:');
        log('cyan', unreleasedContent.join('\n'));
        log('cyan', '\n' + '='.repeat(50) + '\n');

        // Get version number
        let version;
        while (!version) {
            version = await question('🏷️ Enter version number (e.g., 1.2.3): ');
            if (!validateVersion(version)) {
                log('red', '❌ Invalid version format. Use semantic versioning (e.g., 1.2.3)');
                version = null;
            } else {
                // Check if version already exists
                if (content.includes(`## [${version}]`)) {
                    log('red', `❌ Version ${version} already exists in changelog`);
                    version = null;
                }
            }
        }

        // Optional: Get release description
        const description = await question('📝 Enter release description (optional): ');
        
        // Confirm release
        log('green', '\n✅ Release preview:');
        log('cyan', `Version: ${version}`);
        log('cyan', `Date: ${formatDate()}`);
        if (description.trim()) {
            log('cyan', `Description: ${description.trim()}`);
        }
        log('blue', '\nChanges to be released:');
        log('blue', unreleasedContent.join('\n'));

        const confirm = await question('\n❓ Create this release? (y/N): ');
        if (!confirm.toLowerCase().startsWith('y')) {
            log('yellow', '❌ Release cancelled');
            rl.close();
            return;
        }

        // Create new version section
        let versionHeader = `## [${version}] - ${formatDate()}`;
        if (description.trim()) {
            versionHeader += `\n${description.trim()}`;
        }

        // Update changelog
        const updatedLines = [...lines];
        
        // Clear unreleased content (keep the header)
        const contentStart = unreleasedIndex + 1;
        const contentEnd = unreleasedEnd;
        
        // Remove old unreleased content and add new version
        updatedLines.splice(
            contentStart, 
            contentEnd - contentStart,
            '',
            versionHeader,
            ...unreleasedContent.filter(line => line.trim() !== ''),
            ''
        );

        // Write updated changelog
        writeFileSync(changelogPath, updatedLines.join('\n'));
        
        log('green', '\n🎉 Successfully created release!');
        log('blue', `Version ${version} has been added to CHANGELOG.md`);
        
        // Show next steps
        log('yellow', '\n📋 Next steps:');
        log('cyan', '  1. Review the updated CHANGELOG.md');
        log('cyan', '  2. Commit the changelog changes');
        log('cyan', '  3. Create and push a git tag:');
        log('blue', `     git tag v${version}`);
        log('blue', `     git push origin v${version}`);
        log('cyan', '  4. Create a GitHub release if applicable');
        
        const showChangelog = await question('\n❓ Show updated changelog section? (y/N): ');
        if (showChangelog.toLowerCase().startsWith('y')) {
            const updatedContent = readFileSync(changelogPath, 'utf8');
            const updatedLines = updatedContent.split('\n');
            const newUnreleasedIndex = updatedLines.findIndex(line => line === '## [Unreleased]');
            const nextSection = updatedLines.findIndex((line, i) => 
                i > newUnreleasedIndex + 5 && line.match(/^## \[/)
            );
            
            const displayEnd = nextSection === -1 ? Math.min(newUnreleasedIndex + 30, updatedLines.length) : nextSection;
            const displaySection = updatedLines.slice(newUnreleasedIndex, displayEnd);
            
            log('blue', '\n📋 Updated changelog:');
            log('cyan', displaySection.join('\n'));
        }

    } catch (error) {
        log('red', `❌ Error: ${error.message}`);
    } finally {
        rl.close();
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    releaseVersion();
}

export { releaseVersion };