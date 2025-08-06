#!/usr/bin/env node

import { db } from '../services/DatabaseService.js';
import { migrationService } from '../services/MigrationService.js';

const command = process.argv[2];
const args = process.argv.slice(3);

async function runCommand() {
  try {
    switch (command) {
      case 'migrate':
        console.log('Running database migrations...');
        await migrationService.runMigrations();
        break;
        
      case 'rollback':
        const version = args[0];
        console.log(`Rolling back migration${version ? ` ${version}` : ''}...`);
        await migrationService.rollbackMigration(version);
        break;
        
      case 'status':
        console.log('Getting migration status...');
        const status = await migrationService.getMigrationStatus();
        console.log('Applied migrations:', status.applied);
        console.log('Pending migrations:', status.pending);
        console.log(`Total migrations: ${status.total}`);
        break;
        
      case 'validate':
        console.log('Validating migrations...');
        const isValid = await migrationService.validateMigrations();
        console.log(`Validation result: ${isValid ? 'PASSED' : 'FAILED'}`);
        if (!isValid) process.exit(1);
        break;
        
      case 'health':
        console.log('Checking database health...');
        const health = await db.healthCheck();
        console.log(`Status: ${health.status}`);
        console.log(`Response time: ${health.details.responseTime}ms`);
        console.log('Pool status:', health.details.poolStatus);
        break;
        
      case 'test':
        console.log('Testing database connection...');
        await db.testConnection();
        console.log('Database connection test passed!');
        break;
        
      default:
        console.log('Available commands:');
        console.log('  migrate    - Run pending migrations');
        console.log('  rollback   - Rollback last migration (or specify version)');
        console.log('  status     - Show migration status');
        console.log('  validate   - Validate applied migrations');
        console.log('  health     - Check database health');
        console.log('  test       - Test database connection');
        break;
    }
  } catch (error) {
    console.error('Command failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

runCommand();