#!/usr/bin/env node

/**
 * OG Image System Validation Script
 * Basic validation of file structure and configuration
 */

import fs from 'fs/promises';
import path from 'path';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class OGSystemValidator {
  constructor() {
    this.results = { passed: 0, failed: 0, warnings: 0 };
  }

  async validate() {
    console.log(`${COLORS.bright}🔍 OG Image System Validation${COLORS.reset}\n`);
    
    await this.validateEnvironment();
    await this.validateFileStructure();
    await this.validateTypes();
    await this.validateScripts();
    await this.validateDirectories();
    
    this.printSummary();
  }

  async validateEnvironment() {
    this.logSection('Environment Configuration');
    
    // Check for .env file
    try {
      await fs.access('.env');
      this.logPass('.env file exists');
      
      const envContent = await fs.readFile('.env', 'utf-8');
      if (envContent.includes('IDEOGRAM_API_KEY')) {
        const lines = envContent.split('\n');
        const apiKeyLine = lines.find(line => line.startsWith('IDEOGRAM_API_KEY'));
        if (apiKeyLine && apiKeyLine.includes('=') && apiKeyLine.split('=')[1].trim()) {
          this.logPass('IDEOGRAM_API_KEY is configured');
        } else {
          this.logWarning('IDEOGRAM_API_KEY is empty - add your API key');
        }
      } else {
        this.logFail('IDEOGRAM_API_KEY not found in .env file');
      }
    } catch (error) {
      this.logFail('.env file not found');
    }

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion >= 18) {
      this.logPass(`Node.js version compatible: ${nodeVersion}`);
    } else {
      this.logFail(`Node.js version too old: ${nodeVersion} (need 18+)`);
    }
  }

  async validateFileStructure() {
    this.logSection('File Structure');
    
    const requiredFiles = [
      'src/types/images.ts',
      'src/lib/images/og-image-generator.ts',
      'src/lib/images/image-strategy.ts',
      'src/lib/images/image-cache.ts',
      'src/lib/images/prompt-generator.ts',
      'src/lib/images/ideogram-client.ts',
      'src/lib/images/batch-generator.ts',
      'src/lib/seo/meta-generator-scale.ts',
      'scripts/generate-og-images.js',
      'scripts/monitor-og-batch.js'
    ];

    for (const file of requiredFiles) {
      try {
        await fs.access(file);
        this.logPass(`${file} exists`);
      } catch (error) {
        this.logFail(`${file} missing`);
      }
    }

    // Check documentation
    try {
      await fs.access('docs/OG_IMAGE_SYSTEM.md');
      this.logPass('Documentation exists');
    } catch (error) {
      this.logWarning('Documentation missing');
    }
  }

  async validateTypes() {
    this.logSection('TypeScript Types');
    
    try {
      const typesContent = await fs.readFile('src/types/images.ts', 'utf-8');
      
      const requiredTypes = [
        'ImageGenerationContext',
        'GeneratedImage',
        'CachedImage',
        'ImageCacheStats',
        'PromptTemplate',
        'ImageGenerationOptions'
      ];

      for (const type of requiredTypes) {
        if (typesContent.includes(`interface ${type}`) || typesContent.includes(`type ${type}`)) {
          this.logPass(`${type} interface defined`);
        } else {
          this.logFail(`${type} interface missing`);
        }
      }
    } catch (error) {
      this.logFail('Could not validate TypeScript types');
    }
  }

  async validateScripts() {
    this.logSection('Package Scripts');
    
    try {
      const packageContent = await fs.readFile('package.json', 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      const requiredScripts = [
        'og:generate-all',
        'og:generate-priority',
        'og:city',
        'og:status',
        'og:monitor',
        'og:cache-stats',
        'og:help'
      ];

      for (const script of requiredScripts) {
        if (packageJson.scripts && packageJson.scripts[script]) {
          this.logPass(`${script} script configured`);
        } else {
          this.logFail(`${script} script missing`);
        }
      }
    } catch (error) {
      this.logFail('Could not validate package scripts');
    }
  }

  async validateDirectories() {
    this.logSection('Directory Structure');
    
    const requiredDirs = [
      'src/lib/images',
      'src/types',
      'scripts',
      'docs'
    ];

    for (const dir of requiredDirs) {
      try {
        const stat = await fs.stat(dir);
        if (stat.isDirectory()) {
          this.logPass(`${dir}/ directory exists`);
        } else {
          this.logFail(`${dir} is not a directory`);
        }
      } catch (error) {
        this.logFail(`${dir}/ directory missing`);
      }
    }

    // Check if cache and public directories will be created
    const publicDir = 'public/images/og';
    try {
      await fs.access(publicDir);
      this.logPass(`${publicDir}/ exists (cache ready)`);
    } catch (error) {
      this.logInfo(`${publicDir}/ will be created automatically`);
    }
  }

  logSection(title) {
    console.log(`\n${COLORS.bright}${COLORS.cyan}📋 ${title}${COLORS.reset}`);
    console.log('─'.repeat(50));
  }

  logPass(message) {
    console.log(`${COLORS.green}✅ ${message}${COLORS.reset}`);
    this.results.passed++;
  }

  logFail(message) {
    console.log(`${COLORS.red}❌ ${message}${COLORS.reset}`);
    this.results.failed++;
  }

  logWarning(message) {
    console.log(`${COLORS.yellow}⚠️  ${message}${COLORS.reset}`);
    this.results.warnings++;
  }

  logInfo(message) {
    console.log(`${COLORS.blue}ℹ️  ${message}${COLORS.reset}`);
  }

  printSummary() {
    console.log(`\n${COLORS.bright}${COLORS.cyan}📊 Validation Summary${COLORS.reset}`);
    console.log('═'.repeat(50));
    console.log(`${COLORS.green}✅ Passed: ${this.results.passed}${COLORS.reset}`);
    console.log(`${COLORS.red}❌ Failed: ${this.results.failed}${COLORS.reset}`);
    console.log(`${COLORS.yellow}⚠️  Warnings: ${this.results.warnings}${COLORS.reset}`);
    
    if (this.results.failed === 0) {
      console.log(`\n${COLORS.green}${COLORS.bright}🎉 System validation passed! Ready to use.${COLORS.reset}`);
      
      console.log(`\n${COLORS.blue}💡 Next steps:${COLORS.reset}`);
      console.log(`  1. Add your Ideogram API key to .env:`);
      console.log(`     IDEOGRAM_API_KEY="your_key_here"`);
      console.log(`  2. Generate high-priority images:`);
      console.log(`     npm run og:generate-priority`);
      console.log(`  3. Monitor generation progress:`);
      console.log(`     npm run og:monitor`);
      console.log(`  4. View help for more commands:`);
      console.log(`     npm run og:help`);
      
    } else {
      console.log(`\n${COLORS.red}${COLORS.bright}🚨 System validation failed!${COLORS.reset}`);
      console.log(`Fix ${this.results.failed} issues before proceeding.`);
    }
  }
}

async function main() {
  const validator = new OGSystemValidator();
  await validator.validate();
}

main().catch(console.error);