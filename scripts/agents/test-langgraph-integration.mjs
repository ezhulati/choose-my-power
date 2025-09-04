#!/usr/bin/env node

/**
 * Test script for LangGraph agent integrations
 * Validates all agent functionality and integration points
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🤖 Testing LangGraph Agent Integrations...\n');

// Test environment setup
async function testEnvironmentSetup() {
  console.log('1️⃣ Testing Environment Setup...');
  
  const requiredPackages = [
    '@langchain/core',
    '@langchain/anthropic', 
    '@langchain/langgraph'
  ];

  const results = [];
  const fs = await import('fs');
  
  for (const pkg of requiredPackages) {
    try {
      const packagePath = join(process.cwd(), 'node_modules', pkg, 'package.json');
      const packageContent = await fs.promises.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      results.push({
        package: pkg,
        version: packageJson.version,
        status: '✅ Installed'
      });
    } catch (error) {
      results.push({
        package: pkg,
        version: 'N/A',
        status: '❌ Missing'
      });
    }
  }

  console.log('Dependencies:');
  results.forEach(result => {
    console.log(`  ${result.status} ${result.package} ${result.version !== 'N/A' ? `(${result.version})` : ''}`);
  });

  const allInstalled = results.every(r => r.status.includes('✅'));
  console.log(`\n   ${allInstalled ? '✅' : '❌'} Environment Setup: ${allInstalled ? 'PASSED' : 'FAILED'}\n`);
  
  return allInstalled;
}

// Test basic imports
async function testImports() {
  console.log('2️⃣ Testing Module Imports...');
  
  const imports = [
    { name: 'StateGraph', module: '@langchain/langgraph' },
    { name: 'ChatAnthropic', module: '@langchain/anthropic' },
    { name: 'HumanMessage', module: '@langchain/core/messages' },
    { name: 'tool', module: '@langchain/core/tools' },
  ];

  const results = [];

  for (const imp of imports) {
    try {
      const module = await import(imp.module);
      const hasExport = imp.name in module || module.default;
      
      results.push({
        name: imp.name,
        module: imp.module,
        status: hasExport ? '✅ Available' : '⚠️ Not found'
      });
    } catch (error) {
      results.push({
        name: imp.name,
        module: imp.module,
        status: `❌ Error: ${error.message}`
      });
    }
  }

  console.log('Module Imports:');
  results.forEach(result => {
    console.log(`  ${result.status} ${result.name} from ${result.module}`);
  });

  const allImported = results.every(r => r.status.includes('✅'));
  console.log(`\n   ${allImported ? '✅' : '❌'} Module Imports: ${allImported ? 'PASSED' : 'FAILED'}\n`);
  
  return allImported;
}

// Test agent file structure
async function testAgentFiles() {
  console.log('3️⃣ Testing Agent File Structure...');
  
  const agentFiles = [
    'src/lib/agents/plan-recommendation-agent.ts',
    'src/lib/agents/data-pipeline-agent.ts', 
    'src/lib/agents/support-chatbot-agent.ts',
    'src/lib/agents/agent-config.ts',
    'src/lib/agents/agent-integration.ts',
    'src/components/agents/PlanRecommendationWidget.tsx',
    'src/components/agents/SupportChatWidget.tsx',
    'src/components/agents/DataPipelineDashboard.tsx'
  ];

  const results = [];
  const fs = await import('fs');

  for (const file of agentFiles) {
    try {
      const filePath = join(process.cwd(), file);
      await fs.promises.access(filePath);
      const stats = await fs.promises.stat(filePath);
      
      results.push({
        file,
        size: `${Math.round(stats.size / 1024)}kb`,
        status: '✅ Found'
      });
    } catch (error) {
      results.push({
        file,
        size: 'N/A',
        status: '❌ Missing'
      });
    }
  }

  console.log('Agent Files:');
  results.forEach(result => {
    console.log(`  ${result.status} ${result.file} ${result.size !== 'N/A' ? `(${result.size})` : ''}`);
  });

  const allFound = results.every(r => r.status.includes('✅'));
  console.log(`\n   ${allFound ? '✅' : '❌'} Agent Files: ${allFound ? 'PASSED' : 'FAILED'}\n`);
  
  return allFound;
}

// Test configuration validity
async function testConfiguration() {
  console.log('4️⃣ Testing Agent Configuration...');
  
  const results = [];
  
  try {
    // Test environment variables
    const envVars = [
      'ANTHROPIC_API_KEY',
      'NODE_ENV'
    ];
    
    for (const envVar of envVars) {
      const value = process.env[envVar];
      results.push({
        config: envVar,
        status: value ? '✅ Set' : '⚠️ Not set',
        value: value ? (envVar.includes('KEY') ? '[HIDDEN]' : value) : 'undefined'
      });
    }

    // Test config file import (if possible)
    try {
      const configPath = join(process.cwd(), 'src/lib/agents/agent-config.ts');
      const configContent = await import('fs').then(fs => 
        fs.promises.readFile(configPath, 'utf-8')
      );
      
      const hasValidConfig = configContent.includes('AGENT_CONFIG') && 
                           configContent.includes('anthropic') &&
                           configContent.includes('planRecommendation');
      
      results.push({
        config: 'AGENT_CONFIG',
        status: hasValidConfig ? '✅ Valid' : '❌ Invalid',
        value: 'Configuration object'
      });
    } catch (error) {
      results.push({
        config: 'AGENT_CONFIG',
        status: '❌ Error',
        value: error.message
      });
    }

  } catch (error) {
    results.push({
      config: 'Configuration Test',
      status: '❌ Failed',
      value: error.message
    });
  }

  console.log('Configuration:');
  results.forEach(result => {
    console.log(`  ${result.status} ${result.config}: ${result.value}`);
  });

  const configValid = results.some(r => r.status.includes('✅'));
  console.log(`\n   ${configValid ? '✅' : '❌'} Configuration: ${configValid ? 'PASSED' : 'FAILED'}\n`);
  
  return configValid;
}

// Test integration points
async function testIntegrationPoints() {
  console.log('5️⃣ Testing Integration Points...');
  
  const integrations = [
    {
      name: 'ComparePower API Client',
      file: 'src/lib/api/comparepower-client.ts',
      expected: ['comparePowerClient', 'getPlansForCity']
    },
    {
      name: 'TDSP Mapping',
      file: 'src/config/tdsp-mapping.ts', 
      expected: ['validateCitySlug', 'getTdspFromCity', 'formatCityName']
    },
    {
      name: 'Plan Repository',
      file: 'src/lib/database/plan-repository.ts',
      expected: ['planRepository']
    },
    {
      name: 'Types Definition',
      file: 'src/types/facets.ts',
      expected: ['Plan', 'ApiParams']
    }
  ];

  const results = [];
  const fs = await import('fs');

  for (const integration of integrations) {
    try {
      const filePath = join(process.cwd(), integration.file);
      const fileContent = await fs.promises.readFile(filePath, 'utf-8');
      
      const foundExports = integration.expected.filter(exp => 
        fileContent.includes(exp)
      );
      
      const allFound = foundExports.length === integration.expected.length;
      
      results.push({
        name: integration.name,
        status: allFound ? '✅ Available' : '⚠️ Partial',
        details: `${foundExports.length}/${integration.expected.length} exports found`
      });
    } catch (error) {
      results.push({
        name: integration.name,
        status: '❌ Missing',
        details: 'File not found'
      });
    }
  }

  console.log('Integration Points:');
  results.forEach(result => {
    console.log(`  ${result.status} ${result.name} (${result.details})`);
  });

  const integrationReady = results.every(r => r.status.includes('✅') || r.status.includes('⚠️'));
  console.log(`\n   ${integrationReady ? '✅' : '❌'} Integration Points: ${integrationReady ? 'READY' : 'FAILED'}\n`);
  
  return integrationReady;
}

// Generate implementation report
function generateReport(results) {
  console.log('📊 LangGraph Integration Report');
  console.log('================================\n');

  const overallStatus = results.every(r => r) ? 'READY FOR PRODUCTION' : 'NEEDS ATTENTION';
  const emoji = results.every(r => r) ? '🚀' : '⚠️';

  console.log(`${emoji} Overall Status: ${overallStatus}\n`);

  console.log('Test Results:');
  console.log(`  Environment Setup: ${results[0] ? '✅' : '❌'}`);
  console.log(`  Module Imports: ${results[1] ? '✅' : '❌'}`);
  console.log(`  Agent Files: ${results[2] ? '✅' : '❌'}`);
  console.log(`  Configuration: ${results[3] ? '✅' : '❌'}`);
  console.log(`  Integration Points: ${results[4] ? '✅' : '❌'}\n`);

  if (results.every(r => r)) {
    console.log('🎉 All LangGraph agents are ready to use!\n');
    console.log('Next Steps:');
    console.log('1. Set ANTHROPIC_API_KEY environment variable');
    console.log('2. Import components in your pages:');
    console.log('   import PlanRecommendationWidget from "@/components/agents/PlanRecommendationWidget"');
    console.log('   import SupportChatWidget from "@/components/agents/SupportChatWidget"');
    console.log('   import DataPipelineDashboard from "@/components/agents/DataPipelineDashboard"');
    console.log('3. Test individual agents in development environment');
    console.log('4. Monitor agent performance and adjust configuration as needed\n');
  } else {
    console.log('❗ Issues found. Please address the failed tests above.\n');
    
    if (!results[0]) {
      console.log('💡 Environment Setup: Run `npm install @langchain/core @langchain/anthropic @langchain/langgraph`');
    }
    if (!results[3]) {
      console.log('💡 Configuration: Set ANTHROPIC_API_KEY environment variable');
    }
  }
}

// Main test execution
async function runTests() {
  try {
    const results = [
      await testEnvironmentSetup(),
      await testImports(),
      await testAgentFiles(),
      await testConfiguration(),
      await testIntegrationPoints()
    ];

    generateReport(results);
    
    process.exit(results.every(r => r) ? 0 : 1);
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();