#!/usr/bin/env node

/**
 * Fix Trailing Slashes Script
 * Removes trailing slashes from ALL internal URLs sitewide
 * 
 * This script finds and fixes:
 * - /electricity-plans/.../
 * - /texas/.../
 * - /providers/.../
 * - /shop/.../
 * - href="/.../"
 * - redirectUrl: "/.../"
 * - Location: "/.../"
 * - All other internal link patterns ending with /
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// File extensions to process
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.astro', '.vue', '.json'];

// Directories to scan
const SCAN_DIRECTORIES = ['src', 'public'];

// Pattern for internal URLs with trailing slashes (excluding external URLs with protocols)
const TRAILING_SLASH_PATTERNS = [
  // JavaScript/TypeScript string patterns
  {
    pattern: /(['"`])\/([^'"`]*?)\/(['"`])/g,
    description: 'String URLs with trailing slashes',
    fix: (match, quote1, url, quote2) => {
      // Skip external URLs (those with protocols)
      if (url.includes('://') || url.includes('mailto:') || url.includes('tel:')) {
        return match;
      }
      // Skip root path and very short URLs
      if (url === '' || url.length <= 1) {
        return match;
      }
      // Skip URLs that are clearly file extensions
      if (url.includes('.') && url.split('.').pop().length <= 4) {
        return match;
      }
      // Remove trailing slash
      return `${quote1}/${url}${quote2}`;
    }
  },
  
  // Template literal patterns
  {
    pattern: /(`[^`]*?)\/(`)/g,
    description: 'Template literal URLs with trailing slashes',
    fix: (match, start, end) => {
      // Only fix if it looks like an internal URL path
      if (start.includes('/electricity-plans/') || start.includes('/texas/') || 
          start.includes('/providers/') || start.includes('/shop/')) {
        return `${start}${end}`;
      }
      return match;
    }
  },

  // Specific patterns for common URL constructions
  {
    pattern: /\/electricity-plans\/\$\{[^}]+\}\/(['"`])/g,
    description: 'Electricity plans template URLs',
    fix: (match, quote) => match.replace(`/${quote}`, quote)
  },
  
  {
    pattern: /\/texas\/\$\{[^}]+\}\/(['"`])/g,
    description: 'Texas city template URLs',
    fix: (match, quote) => match.replace(`/${quote}`, quote)
  },
  
  {
    pattern: /\/providers\/\$\{[^}]+\}\/(['"`])/g,
    description: 'Provider template URLs',
    fix: (match, quote) => match.replace(`/${quote}`, quote)
  },

  // Redirect and location headers
  {
    pattern: /(Location['"`]?\s*:\s*['"`]\/[^'"`]*?)\/(['"`])/g,
    description: 'HTTP Location headers',
    fix: (match, start, quote) => `${start}${quote}`
  },

  // Object property patterns
  {
    pattern: /(redirectUrl\s*:\s*['"`]\/[^'"`]*?)\/(['"`])/g,
    description: 'Redirect URL properties',
    fix: (match, start, quote) => `${start}${quote}`
  },

  {
    pattern: /(href\s*[=:]\s*['"`]\/[^'"`]*?)\/(['"`])/g,
    description: 'Href attributes and properties',
    fix: (match, start, quote) => `${start}${quote}`
  },

  {
    pattern: /(url\s*[=:]\s*['"`]\/[^'"`]*?)\/(['"`])/g,
    description: 'URL properties',
    fix: (match, start, quote) => `${start}${quote}`
  }
];

// Files and directories to skip
const SKIP_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.astro',
  'coverage',
  '.vscode',
  '.idea',
  '*.min.js',
  '*.min.css',
  '*.map'
];

/**
 * Check if a file should be skipped
 */
function shouldSkipFile(filePath) {
  const fileName = path.basename(filePath);
  const relativePath = path.relative(projectRoot, filePath);
  
  return SKIP_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(fileName) || regex.test(relativePath);
    }
    return relativePath.includes(pattern) || fileName.includes(pattern);
  });
}

/**
 * Get all files to process
 */
function getAllFiles(dirPath, fileList = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    
    if (shouldSkipFile(filePath)) {
      return;
    }

    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      const ext = path.extname(file);
      if (FILE_EXTENSIONS.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = originalContent;
    let changesCount = 0;
    const changes = [];

    // Apply each pattern fix
    TRAILING_SLASH_PATTERNS.forEach(({ pattern, description, fix }) => {
      const beforeContent = modifiedContent;
      modifiedContent = modifiedContent.replace(pattern, (...args) => {
        const originalMatch = args[0];
        const fixedMatch = fix(...args);
        
        if (originalMatch !== fixedMatch) {
          changesCount++;
          changes.push({
            description,
            original: originalMatch,
            fixed: fixedMatch
          });
        }
        
        return fixedMatch;
      });
    });

    // Write back if changes were made
    if (changesCount > 0) {
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
      return { filePath, changesCount, changes };
    }

    return null;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 TRAILING SLASH REMOVAL TOOL');
  console.log('=' .repeat(50));
  console.log(`Scanning directories: ${SCAN_DIRECTORIES.join(', ')}`);
  console.log(`File extensions: ${FILE_EXTENSIONS.join(', ')}`);
  console.log('');

  // Get all files to process
  let allFiles = [];
  SCAN_DIRECTORIES.forEach(dir => {
    const dirPath = path.join(projectRoot, dir);
    if (fs.existsSync(dirPath)) {
      allFiles = allFiles.concat(getAllFiles(dirPath));
    }
  });

  console.log(`Found ${allFiles.length} files to process...\n`);

  // Process each file
  const results = [];
  let totalChanges = 0;
  let filesModified = 0;

  allFiles.forEach(filePath => {
    const result = processFile(filePath);
    if (result) {
      results.push(result);
      totalChanges += result.changesCount;
      filesModified++;
      
      const relativePath = path.relative(projectRoot, result.filePath);
      console.log(`✅ ${relativePath}: ${result.changesCount} changes`);
      
      // Show first few changes for verification
      result.changes.slice(0, 3).forEach(change => {
        console.log(`   📝 ${change.description}`);
        console.log(`      - "${change.original}"`);
        console.log(`      + "${change.fixed}"`);
      });
      
      if (result.changes.length > 3) {
        console.log(`   ... and ${result.changes.length - 3} more changes`);
      }
      console.log('');
    }
  });

  // Summary
  console.log('=' .repeat(50));
  console.log('📊 SUMMARY');
  console.log('=' .repeat(50));
  console.log(`Files processed: ${allFiles.length}`);
  console.log(`Files modified: ${filesModified}`);
  console.log(`Total changes: ${totalChanges}`);
  
  if (totalChanges > 0) {
    console.log('\n✅ SUCCESS: All trailing slashes have been removed from internal URLs!');
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Test the application to ensure navigation works correctly');
    console.log('2. Run your linter to check for any syntax issues');
    console.log('3. Commit these changes to git');
  } else {
    console.log('\n✨ No trailing slashes found! Your URLs are already clean.');
  }

  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});