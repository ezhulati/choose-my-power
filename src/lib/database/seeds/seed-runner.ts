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
    console.warn('🚀 Starting ZIP Coverage System Seed Process...');
    console.warn('=' .repeat(60));
    
    const startTime = Date.now();
    
    // Step 1: Seed Data Sources (needed for foreign keys in validation logs)
    console.warn('\n📡 Phase 1: Data Sources');
    console.warn('-'.repeat(30));
    const dataSources = await seedDataSources();
    await updateDataSourceStats();
    
    // Step 2: Seed TDSP Information (needed for foreign keys in city territories and ZIP mappings)
    console.warn('\n🏭 Phase 2: TDSP Information');
    console.warn('-'.repeat(30));
    const tdsps = await seedTdspInfo();
    await updateTdspServiceAreas();
    
    // Step 3: Get coverage statistics
    console.warn('\n📊 Phase 3: Coverage Statistics');
    console.warn('-'.repeat(30));
    const stats = await getTdspCoverageStats();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Summary report
    console.warn('\n' + '='.repeat(60));
    console.warn('✅ ZIP COVERAGE SYSTEM SEED COMPLETE');
    console.warn('='.repeat(60));
    console.warn(`📊 Summary:`);
    console.warn(`   • Data Sources: ${dataSources.length} seeded`);
    console.warn(`   • TDSPs: ${tdsps.length} seeded`);
    console.warn(`   • Cities Covered: ${stats.totalCitiesCovered}`);
    console.warn(`   • Zones Covered: ${Object.keys(stats.byZone).length}`);
    console.warn(`   • Largest TDSP: ${stats.largestTdsp.name} (${(stats.largestTdsp.serviceArea as string[]).length} cities)`);
    console.warn(`   • Duration: ${duration}ms`);
    
    console.warn(`\n🎯 Next Steps:`);
    console.warn(`   1. Run city territory seeds when city data is available`);
    console.warn(`   2. Run ZIP code mapping seeds with external API data`);
    console.warn(`   3. Begin validation log collection from real usage`);
    console.warn(`   4. Monitor data source health and performance`);
    
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
    console.warn('🛠️  Running Development Seeds...');
    
    // Run main seeds
    const result = await runAllSeeds();
    
    // Add development-specific data
    console.warn('\n🧪 Adding Development Test Data...');
    console.warn('-'.repeat(30));
    
    // TODO: Add sample city territories and ZIP mappings for development
    console.warn('   • Sample city territories: Pending implementation');
    console.warn('   • Sample ZIP mappings: Pending implementation');
    console.warn('   • Test validation logs: Pending implementation');
    
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
    console.warn('🏭 Running Production Seeds...');
    
    // Run main seeds with production validation
    const result = await runAllSeeds();
    
    // Production-specific validations
    console.warn('\n🔒 Production Validations...');
    console.warn('-'.repeat(30));
    
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
    
    console.warn('✅ All production validations passed');
    
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
    console.warn('🧹 Cleaning all seeded data...');
    
    // Import db and tables
    const { db } = await import('../init');
    const { validationLogs } = await import('../schema/validation-log');
    const { zipCodeMappings } = await import('../schema/zip-code-mapping');
    const { cityTerritories } = await import('../schema/city-territory');
    const { tdspInfo } = await import('../schema/tdsp-info');
    const { dataSources } = await import('../schema/data-source');
    
    // Delete in reverse dependency order
    await db.delete(validationLogs);
    console.warn('   • Validation logs cleared');
    
    await db.delete(zipCodeMappings);
    console.warn('   • ZIP code mappings cleared');
    
    await db.delete(cityTerritories);
    console.warn('   • City territories cleared');
    
    await db.delete(tdspInfo);
    console.warn('   • TDSP information cleared');
    
    await db.delete(dataSources);
    console.warn('   • Data sources cleared');
    
    console.warn('✅ All seeded data cleaned');
    
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
    console.warn('🔍 Verifying seed data integrity...');
    
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
    
    console.warn('📊 Integrity Report:');
    console.warn(`   • Data Sources: ${integrity.dataSources.total} total, ${integrity.dataSources.active} active`);
    console.warn(`   • TDSPs: ${integrity.tdsps.total} total, ${integrity.tdsps.active} active`);
    console.warn(`   • Overall Health: ${integrity.overall ? '✅ HEALTHY' : '❌ ISSUES FOUND'}`);
    
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
      console.warn('Usage: node seed-runner.js [all|dev|prod|clean|verify]');
      console.warn('  all    - Run all seeds');
      console.warn('  dev    - Run development seeds');
      console.warn('  prod   - Run production seeds');
      console.warn('  clean  - Clean all seeded data');
      console.warn('  verify - Verify seed integrity');
      break;
  }
}