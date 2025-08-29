#!/usr/bin/env node

/**
 * Interactive Changelog Entry Tool for ChooseMyPower.org
 * Helps developers add properly formatted changelog entries
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

const categories = [
    { key: '1', name: 'Added', description: 'New features' },
    { key: '2', name: 'Fixed', description: 'Bug fixes' },
    { key: '3', name: 'Changed', description: 'Changes to existing functionality' },
    { key: '4', name: 'Performance', description: 'Performance improvements' },
    { key: '5', name: 'Security', description: 'Security-related changes' },
    { key: '6', name: 'Removed', description: 'Removed features' },
    { key: '7', name: 'Deprecated', description: 'Features marked for removal' }
];

async function addChangelogEntry() {
    console.clear();
    log('blue', '📝 Interactive Changelog Entry Tool');
    log('cyan', '===================================\n');

    // Check if changelog exists
    if (!existsSync(changelogPath)) {
        log('red', '❌ CHANGELOG.md not found!');
        log('yellow', 'Please create a CHANGELOG.md file first.');
        rl.close();
        return;
    }

    try {
        // Read current changelog
        const content = readFileSync(changelogPath, 'utf8');
        
        // Check if Unreleased section exists
        if (!content.includes('## [Unreleased]')) {
            log('red', '❌ No [Unreleased] section found in CHANGELOG.md');
            log('yellow', 'Please ensure your changelog has an [Unreleased] section.');
            rl.close();
            return;
        }

        // Select category
        log('cyan', '🏷️ Select a category for your change:');
        categories.forEach(cat => {
            log('blue', `  ${cat.key}. ${cat.name} - ${cat.description}`);
        });
        
        let categoryChoice;
        while (!categoryChoice) {
            const choice = await question('\nEnter category number (1-7): ');
            const selected = categories.find(cat => cat.key === choice);
            if (selected) {
                categoryChoice = selected;
                log('green', `✅ Selected: ${selected.name}\n`);
            } else {
                log('red', '❌ Invalid choice. Please enter 1-7.');
            }
        }

        // Get description
        let description;
        while (!description) {
            description = await question('📝 Enter change description: ');
            if (description.trim().length < 10) {
                log('red', '❌ Description too short (minimum 10 characters)');
                description = null;
            }
        }

        // Optional: Get additional context
        const context = await question('🔗 Enter issue/PR reference (optional, e.g., #123): ');
        
        // Format the entry
        let entry = `- ${description.trim()}`;
        if (context.trim()) {
            entry += ` (${context.trim()})`;
        }

        log('green', '\n✅ Entry preview:');
        log('cyan', `### ${categoryChoice.name}`);
        log('blue', entry);

        const confirm = await question('\n❓ Add this entry to CHANGELOG.md? (y/N): ');
        if (!confirm.toLowerCase().startsWith('y')) {
            log('yellow', '❌ Cancelled by user');
            rl.close();
            return;
        }

        // Update changelog
        const lines = content.split('\n');
        const unreleasedIndex = lines.findIndex(line => line === '## [Unreleased]');
        
        if (unreleasedIndex === -1) {
            throw new Error('Could not find [Unreleased] section');
        }

        // Look for existing category section
        let categoryIndex = -1;
        for (let i = unreleasedIndex + 1; i < lines.length; i++) {
            if (lines[i].startsWith('## [') && !lines[i].includes('Unreleased')) {
                break; // Hit next version
            }
            if (lines[i] === `### ${categoryChoice.name}`) {
                categoryIndex = i;
                break;
            }
        }

        if (categoryIndex === -1) {
            // Add new category section
            let insertIndex = unreleasedIndex + 1;
            
            // Skip empty lines
            while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
                insertIndex++;
            }
            
            // Add category header and entry
            lines.splice(insertIndex, 0, '', `### ${categoryChoice.name}`, entry);
        } else {
            // Add to existing category
            let insertIndex = categoryIndex + 1;
            
            // Find where to insert (after existing entries in this category)
            while (insertIndex < lines.length && 
                   !lines[insertIndex].startsWith('### ') && 
                   !lines[insertIndex].startsWith('## [')) {
                if (lines[insertIndex].startsWith('- ')) {
                    insertIndex++;
                } else if (lines[insertIndex].trim() === '') {
                    insertIndex++;
                } else {
                    break;
                }
            }
            
            lines.splice(insertIndex, 0, entry);
        }

        // Write updated changelog
        writeFileSync(changelogPath, lines.join('\n'));
        
        log('green', '\n🎉 Successfully added entry to CHANGELOG.md!');
        
        // Show the updated section
        const updatedContent = readFileSync(changelogPath, 'utf8');
        const updatedLines = updatedContent.split('\n');
        const updatedUnreleasedIndex = updatedLines.findIndex(line => line === '## [Unreleased]');
        const nextVersionIndex = updatedLines.findIndex((line, i) => 
            i > updatedUnreleasedIndex && line.startsWith('## [') && !line.includes('Unreleased')
        );
        
        const unreleasedSection = updatedLines.slice(
            updatedUnreleasedIndex, 
            nextVersionIndex === -1 ? Math.min(updatedUnreleasedIndex + 20, updatedLines.length) : nextVersionIndex
        );
        
        log('blue', '\n📋 Updated [Unreleased] section:');
        log('cyan', unreleasedSection.join('\n'));

        const addAnother = await question('\n❓ Add another entry? (y/N): ');
        if (addAnother.toLowerCase().startsWith('y')) {
            await addChangelogEntry();
            return;
        }

    } catch (error) {
        log('red', `❌ Error: ${error.message}`);
    } finally {
        rl.close();
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    addChangelogEntry();
}

export { addChangelogEntry };