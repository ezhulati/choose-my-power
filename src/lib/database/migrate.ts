/**
 * Database Migration Runner
 * Handles execution of SQL migrations for ZIP coverage system
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { db } from './init';
import { sql } from 'drizzle-orm';

interface Migration {
  id: string;
  name: string;
  filename: string;
  executed: boolean;
  executedAt?: Date;
}

/**
 * Execute a specific migration file
 */
export async function executeMigration(migrationPath: string): Promise<void> {
  try {
    console.log(`🔄 Executing migration: ${migrationPath}`);
    
    const migrationSql = readFileSync(migrationPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`   Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0) continue;
      
      try {
        await db.execute(sql.raw(statement));
        console.log(`   ✅ Statement ${i + 1}/${statements.length} executed successfully`);
      } catch (error: any) {
        // Check if error is about already existing objects
        if (error.message?.includes('already exists') || 
            error.message?.includes('relation') && error.message?.includes('already exists')) {
          console.log(`   ⚠️  Statement ${i + 1} skipped (object already exists)`);
          continue;
        }
        throw new Error(`Statement ${i + 1} failed: ${error.message}\nStatement: ${statement.substring(0, 100)}...`);
      }
    }
    
    console.log(`✅ Migration completed successfully`);
    
  } catch (error) {
    console.error(`❌ Migration failed:`, error);
    throw error;
  }
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  try {
    console.log('🚀 Starting database migrations...');
    console.log('='.repeat(50));
    
    const startTime = Date.now();
    
    // Create migrations tracking table if it doesn't exist
    await createMigrationsTable();
    
    // Get list of migrations to run
    const migrationsDir = resolve(__dirname, 'migrations');
    const migrationFiles = [
      '0001_zip_coverage_tables.sql'
    ];
    
    console.log(`Found ${migrationFiles.length} migration file(s) to process`);
    
    for (const filename of migrationFiles) {
      const migrationPath = resolve(migrationsDir, filename);
      const migrationId = filename.replace('.sql', '');
      
      // Check if migration was already executed
      const isExecuted = await checkMigrationExecuted(migrationId);
      
      if (isExecuted) {
        console.log(`⏭️  Skipping ${filename} (already executed)`);
        continue;
      }
      
      // Execute migration
      console.log(`\n📄 Processing ${filename}`);
      console.log('-'.repeat(30));
      
      await executeMigration(migrationPath);
      await recordMigrationExecuted(migrationId, filename);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL MIGRATIONS COMPLETED');
    console.log('='.repeat(50));
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Database is now ready for ZIP coverage system`);
    
  } catch (error) {
    console.error('\n❌ MIGRATION PROCESS FAILED');
    console.error('='.repeat(50));
    console.error('Error:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure database is running and accessible');
    console.error('2. Check database connection configuration');
    console.error('3. Verify user has necessary permissions');
    console.error('4. Check for conflicting existing tables');
    throw error;
  }
}

/**
 * Create migrations tracking table
 */
async function createMigrationsTable(): Promise<void> {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS "_migrations" (
      "id" varchar(255) PRIMARY KEY NOT NULL,
      "name" varchar(255) NOT NULL,
      "executed_at" timestamp DEFAULT now() NOT NULL
    );
  `;
  
  try {
    await db.execute(sql.raw(createTableSql));
    console.log('📋 Migrations tracking table ready');
  } catch (error) {
    console.error('❌ Failed to create migrations table:', error);
    throw error;
  }
}

/**
 * Check if a migration was already executed
 */
async function checkMigrationExecuted(migrationId: string): Promise<boolean> {
  try {
    const result = await db.execute(
      sql.raw(`SELECT id FROM "_migrations" WHERE id = '${migrationId}'`)
    );
    return result.length > 0;
  } catch (error) {
    // If table doesn't exist, migration hasn't been executed
    return false;
  }
}

/**
 * Record that a migration was executed
 */
async function recordMigrationExecuted(migrationId: string, filename: string): Promise<void> {
  try {
    await db.execute(
      sql.raw(`
        INSERT INTO "_migrations" (id, name, executed_at) 
        VALUES ('${migrationId}', '${filename}', now())
      `)
    );
    console.log(`📝 Recorded migration execution: ${migrationId}`);
  } catch (error) {
    console.error(`❌ Failed to record migration: ${migrationId}`, error);
    throw error;
  }
}

/**
 * Get migration history
 */
export async function getMigrationHistory(): Promise<Migration[]> {
  try {
    const result = await db.execute(
      sql.raw(`SELECT * FROM "_migrations" ORDER BY executed_at DESC`)
    );
    
    return result.map(row => ({
      id: row.id as string,
      name: row.name as string,
      filename: row.name as string,
      executed: true,
      executedAt: row.executed_at as Date
    }));
  } catch (error) {
    console.log('No migration history found (migrations table may not exist)');
    return [];
  }
}

/**
 * Rollback last migration (dangerous - use with caution)
 */
export async function rollbackLastMigration(): Promise<void> {
  try {
    console.log('⚠️  WARNING: Rolling back last migration');
    console.log('This operation is potentially destructive!');
    
    const history = await getMigrationHistory();
    if (history.length === 0) {
      console.log('No migrations to rollback');
      return;
    }
    
    const lastMigration = history[0];
    console.log(`Rolling back: ${lastMigration.name}`);
    
    // For ZIP coverage tables, drop them in reverse order
    if (lastMigration.id === '0001_zip_coverage_tables') {
      const dropTablesSQL = `
        DROP TABLE IF EXISTS "validation_logs" CASCADE;
        DROP TABLE IF EXISTS "zip_code_mappings" CASCADE;
        DROP TABLE IF EXISTS "city_territories" CASCADE;
        DROP TABLE IF EXISTS "tdsp_info" CASCADE;
        DROP TABLE IF EXISTS "data_sources" CASCADE;
        DROP FUNCTION IF EXISTS update_updated_at_column();
      `;
      
      await db.execute(sql.raw(dropTablesSQL));
      console.log('✅ Tables dropped successfully');
    }
    
    // Remove migration record
    await db.execute(
      sql.raw(`DELETE FROM "_migrations" WHERE id = '${lastMigration.id}'`)
    );
    
    console.log(`✅ Rollback completed: ${lastMigration.name}`);
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

/**
 * Check database connection and basic health
 */
export async function checkDatabaseHealth(): Promise<void> {
  try {
    console.log('🏥 Checking database health...');
    
    // Test basic connection
    await db.execute(sql.raw('SELECT 1 as test'));
    console.log('✅ Database connection: OK');
    
    // Check if UUID extension is available
    await db.execute(sql.raw('SELECT uuid_generate_v4()'));
    console.log('✅ UUID extension: OK');
    
    // Check migrations table
    const history = await getMigrationHistory();
    console.log(`✅ Migrations table: OK (${history.length} migrations executed)`);
    
    // Check each ZIP coverage table
    const tables = [
      'data_sources',
      'tdsp_info', 
      'city_territories',
      'zip_code_mappings',
      'validation_logs'
    ];
    
    for (const table of tables) {
      try {
        await db.execute(sql.raw(`SELECT COUNT(*) FROM "${table}"`));
        console.log(`✅ Table "${table}": OK`);
      } catch (error) {
        console.log(`❌ Table "${table}": NOT FOUND`);
      }
    }
    
    console.log('🏥 Database health check completed');
    
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    throw error;
  }
}

// CLI interface for migration operations
if (require.main === module) {
  const operation = process.argv[2];
  
  switch (operation) {
    case 'up':
      runMigrations().catch(console.error);
      break;
    case 'history':
      getMigrationHistory().then(history => {
        console.log('📋 Migration History:');
        history.forEach(migration => {
          console.log(`   ${migration.id} - ${migration.name} (${migration.executedAt})`);
        });
      }).catch(console.error);
      break;
    case 'rollback':
      rollbackLastMigration().catch(console.error);
      break;
    case 'health':
      checkDatabaseHealth().catch(console.error);
      break;
    default:
      console.log('Usage: node migrate.js [up|history|rollback|health]');
      console.log('  up       - Run all pending migrations');
      console.log('  history  - Show migration history');
      console.log('  rollback - Rollback last migration (dangerous!)');
      console.log('  health   - Check database health');
      break;
  }
}