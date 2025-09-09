/**
 * Seed Runner
 * Orchestrates the seeding of all ZIP coverage system tables
 */

import { seedDataSources, updateDataSourceStats } from './0001_data_sources_seed';
import { seedTdspInfo, updateTdspServiceAreas, getTdspCoverageStats } from './0002_tdsp_seed';

/**
 * Main seed runner - executes all seed operations in correct order
 */
export async function runAllSeeds() {
  try {
    console.log('🚀 Starting ZIP Coverage System Seed Process...');
    console.log('=' .repeat(60));
    
    const startTime = Date.now();
    
    // Step 1: Seed Data Sources (needed for foreign keys in validation logs)
    console.log('\n📡 Phase 1: Data Sources');
    console.log('-'.repeat(30));
    const dataSources = await seedDataSources();
    await updateDataSourceStats();
    
    // Step 2: Seed TDSP Information (needed for foreign keys in city territories and ZIP mappings)
    console.log('\n🏭 Phase 2: TDSP Information');
    console.log('-'.repeat(30));
    const tdsps = await seedTdspInfo();
    await updateTdspServiceAreas();
    
    // Step 3: Get coverage statistics
    console.log('\n📊 Phase 3: Coverage Statistics');
    console.log('-'.repeat(30));
    const stats = await getTdspCoverageStats();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Summary report
    console.log('\n' + '='.repeat(60));
    console.log('✅ ZIP COVERAGE SYSTEM SEED COMPLETE');
    console.log('='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   • Data Sources: ${dataSources.length} seeded`);
    console.log(`   • TDSPs: ${tdsps.length} seeded`);
    console.log(`   • Cities Covered: ${stats.totalCitiesCovered}`);
    console.log(`   • Zones Covered: ${Object.keys(stats.byZone).length}`);
    console.log(`   • Largest TDSP: ${stats.largestTdsp.name} (${(stats.largestTdsp.serviceArea as string[]).length} cities)`);
    console.log(`   • Duration: ${duration}ms`);
    
    console.log(`\n🎯 Next Steps:`);
    console.log(`   1. Run city territory seeds when city data is available`);
    console.log(`   2. Run ZIP code mapping seeds with external API data`);
    console.log(`   3. Begin validation log collection from real usage`);
    console.log(`   4. Monitor data source health and performance`);
    
    return {
      dataSources,
      tdsps,
      stats,
      duration
    };
    
  } catch (error) {
    console.error('\n❌ SEED PROCESS FAILED');
    console.error('=' .repeat(60));
    console.error('Error:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure database is running and accessible');
    console.error('2. Check that migrations have been applied');
    console.error('3. Verify database connection configuration');
    console.error('4. Ensure no duplicate data exists from previous seeds');
    throw error;
  }
}

/**
 * Development seed runner - includes test data for development
 */
export async function runDevSeeds() {
  try {
    console.log('🛠️  Running Development Seeds...');
    
    // Run main seeds
    const result = await runAllSeeds();
    
    // Add development-specific data
    console.log('\n🧪 Adding Development Test Data...');
    console.log('-'.repeat(30));
    
    // TODO: Add sample city territories and ZIP mappings for development
    console.log('   • Sample city territories: Pending implementation');
    console.log('   • Sample ZIP mappings: Pending implementation');
    console.log('   • Test validation logs: Pending implementation');
    
    return result;
    
  } catch (error) {
    console.error('❌ Development seed failed:', error);
    throw error;
  }
}

/**
 * Production seed runner - production-ready data only
 */
export async function runProdSeeds() {
  try {
    console.log('🏭 Running Production Seeds...');
    
    // Run main seeds with production validation
    const result = await runAllSeeds();
    
    // Production-specific validations
    console.log('\n🔒 Production Validations...');
    console.log('-'.repeat(30));
    
    // Validate all major TDSPs are present
    if (result.tdsps.length < 5) {
      throw new Error(`Expected at least 5 major TDSPs, got ${result.tdsps.length}`);
    }
    
    // Validate coverage
    if (result.stats.totalCitiesCovered < 500) {
      throw new Error(`Expected at least 500 cities covered, got ${result.stats.totalCitiesCovered}`);
    }
    
    // Validate data sources
    if (result.dataSources.length < 8) {
      throw new Error(`Expected at least 8 data sources, got ${result.dataSources.length}`);
    }
    
    console.log('✅ All production validations passed');
    
    return result;
    
  } catch (error) {
    console.error('❌ Production seed failed:', error);
    throw error;
  }
}

/**
 * Clean slate - removes all seeded data (for testing/development)
 */
export async function cleanAllSeeds() {
  try {
    console.log('🧹 Cleaning all seeded data...');
    
    // Import db and tables
    const { db } = await import('../init');
    const { validationLogs } = await import('../schema/validation-log');
    const { zipCodeMappings } = await import('../schema/zip-code-mapping');
    const { cityTerritories } = await import('../schema/city-territory');
    const { tdspInfo } = await import('../schema/tdsp-info');
    const { dataSources } = await import('../schema/data-source');
    
    // Delete in reverse dependency order
    await db.delete(validationLogs);
    console.log('   • Validation logs cleared');
    
    await db.delete(zipCodeMappings);
    console.log('   • ZIP code mappings cleared');
    
    await db.delete(cityTerritories);
    console.log('   • City territories cleared');
    
    await db.delete(tdspInfo);
    console.log('   • TDSP information cleared');
    
    await db.delete(dataSources);
    console.log('   • Data sources cleared');
    
    console.log('✅ All seeded data cleaned');
    
  } catch (error) {
    console.error('❌ Error cleaning seeded data:', error);
    throw error;
  }
}

/**
 * Verify seed data integrity
 */
export async function verifySeedIntegrity() {
  try {
    console.log('🔍 Verifying seed data integrity...');
    
    const { db } = await import('../init');
    const { dataSources } = await import('../schema/data-source');
    const { tdspInfo } = await import('../schema/tdsp-info');
    const { eq, count } = await import('drizzle-orm');
    
    // Count records
    const [dataSourceCount] = await db.select({ count: count() }).from(dataSources);
    const [tdspCount] = await db.select({ count: count() }).from(tdspInfo);
    
    // Check active records
    const [activeDataSources] = await db
      .select({ count: count() })
      .from(dataSources)
      .where(eq(dataSources.isActive, true));
    
    const [activeTdsps] = await db
      .select({ count: count() })
      .from(tdspInfo)
      .where(eq(tdspInfo.isActive, true));
    
    const integrity = {
      dataSources: {
        total: dataSourceCount.count,
        active: activeDataSources.count,
        healthCheck: dataSourceCount.count > 0 && activeDataSources.count > 0
      },
      tdsps: {
        total: tdspCount.count,
        active: activeTdsps.count,
        healthCheck: tdspCount.count > 0 && activeTdsps.count > 0
      },
      overall: dataSourceCount.count > 0 && tdspCount.count > 0
    };
    
    console.log('📊 Integrity Report:');
    console.log(`   • Data Sources: ${integrity.dataSources.total} total, ${integrity.dataSources.active} active`);
    console.log(`   • TDSPs: ${integrity.tdsps.total} total, ${integrity.tdsps.active} active`);
    console.log(`   • Overall Health: ${integrity.overall ? '✅ HEALTHY' : '❌ ISSUES FOUND'}`);
    
    return integrity;
    
  } catch (error) {
    console.error('❌ Error verifying seed integrity:', error);
    throw error;
  }
}

// CLI interface for seed operations
if (require.main === module) {
  const operation = process.argv[2];
  
  switch (operation) {
    case 'all':
      runAllSeeds().catch(console.error);
      break;
    case 'dev':
      runDevSeeds().catch(console.error);
      break;
    case 'prod':
      runProdSeeds().catch(console.error);
      break;
    case 'clean':
      cleanAllSeeds().catch(console.error);
      break;
    case 'verify':
      verifySeedIntegrity().catch(console.error);
      break;
    default:
      console.log('Usage: node seed-runner.js [all|dev|prod|clean|verify]');
      console.log('  all    - Run all seeds');
      console.log('  dev    - Run development seeds');
      console.log('  prod   - Run production seeds');
      console.log('  clean  - Clean all seeded data');
      console.log('  verify - Verify seed integrity');
      break;
  }
}