#!/usr/bin/env node

// backend/scripts/db-manager.js
require('dotenv').config();
const { initializePool } = require('../database/connection');
const { initializeDatabase } = require('../database/init');
const { resetDatabase, isDatabaseEmpty, getDatabaseStatus } = require('../database/reset');

async function main() {
    const command = process.argv[2];
    
    if (!command) {
        showHelp();
        process.exit(1);
    }
    
    try {
        // Initialize database connection
        console.log('🔗 Connecting to database...');
        await initializePool();
        console.log('✅ Database connection established');
        
        switch (command) {
            case 'init':
                await handleInit();
                break;
            case 'reset':
                await handleReset();
                break;
            case 'status':
                await handleStatus();
                break;
            case 'help':
                showHelp();
                break;
            default:
                console.error(`❌ Unknown command: ${command}`);
                showHelp();
                process.exit(1);
        }
        
        console.log('🎉 Operation completed successfully');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Operation failed:', error.message);
        if (process.env.NODE_ENV === 'development') {
            console.error('Stack trace:', error.stack);
        }
        process.exit(1);
    }
}

/**
 * Handle database initialization
 */
async function handleInit() {
    console.log('🚀 Initializing database...');
    
    const status = await getDatabaseStatus();
    
    if (!status.isEmpty) {
        console.log('ℹ️ Database contains existing data:');
        console.log(`   Tables: ${status.tables.length}`);
        console.log(`   Functions: ${status.functions.length}`);
        console.log(`   Indexes: ${status.indexes.length}`);
        
        const force = process.argv.includes('--force');
        if (!force) {
            console.log('ℹ️ Initialization will update existing schema safely without data loss');
            console.log('ℹ️ Use --force flag to reset completely (⚠️  WARNING: This will delete all data!)');
        }
    }
    
    const force = process.argv.includes('--force');
    if (force && !status.isEmpty) {
        console.log('🚨 FORCE MODE: Resetting database completely...');
        await resetDatabase();
    } else {
        await initializeDatabase();
    }
}

/**
 * Handle database reset
 */
async function handleReset() {
    const force = process.argv.includes('--force');
    
    if (!force) {
        console.log('🚨 WARNING: This will completely reset the database and delete ALL data!');
        console.log('ℹ️ Use --force flag to confirm this destructive operation');
        console.log('ℹ️ Example: npm run db:reset -- --force');
        process.exit(1);
    }
    
    console.log('🗑️ Resetting database completely...');
    await resetDatabase();
}

/**
 * Handle database status check
 */
async function handleStatus() {
    console.log('📊 Checking database status...');
    
    const status = await getDatabaseStatus();
    
    console.log('\n=== DATABASE STATUS ===');
    
    if (status.isEmpty) {
        console.log('📊 Database is EMPTY - no tables found');
        console.log('ℹ️ Run "npm run db:init" to initialize the database');
    } else {
        console.log(`📊 Database contains data:`);
        
        console.log('\n📋 Tables:');
        if (status.tables.length === 0) {
            console.log('   No tables found');
        } else {
            status.tables.forEach(table => {
                console.log(`   ✓ ${table}`);
            });
        }
        
        console.log('\n🔧 Functions:');
        if (status.functions.length === 0) {
            console.log('   No custom functions found');
        } else {
            status.functions.forEach(func => {
                console.log(`   ✓ ${func}()`);
            });
        }
        
        console.log('\n🔍 Indexes:');
        if (status.indexes.length === 0) {
            console.log('   No indexes found');
        } else {
            status.indexes.forEach(index => {
                console.log(`   ✓ ${index}`);
            });
        }
        
        // Check for required tables
        const requiredTables = ['users', 'hall_of_fame', 'lobbies', 'lobby_players', 'question_sets'];
        const missingTables = requiredTables.filter(table => !status.tables.includes(table));
        
        if (missingTables.length === 0) {
            console.log('\n✅ All required tables are present');
        } else {
            console.log('\n⚠️ Missing required tables:');
            missingTables.forEach(table => {
                console.log(`   ❌ ${table}`);
            });
            console.log('ℹ️ Run "npm run db:init" to create missing tables');
        }
    }
    
    console.log('\n=== AVAILABLE COMMANDS ===');
    console.log('• npm run db:init      - Initialize/update database schema');
    console.log('• npm run db:init -- --force  - Reset and initialize database');
    console.log('• npm run db:reset -- --force - Reset database completely');
    console.log('• npm run db:status    - Check database status');
}

/**
 * Show help information
 */
function showHelp() {
    console.log('\n🛠️  Quiz Meister Database Manager');
    console.log('\nUsage: node db-manager.js <command> [options]');
    
    console.log('\nCommands:');
    console.log('  init     Initialize or update database schema');
    console.log('  reset    Reset database completely (requires --force)');
    console.log('  status   Check current database status');
    console.log('  help     Show this help message');
    
    console.log('\nOptions:');
    console.log('  --force  Force destructive operations (required for reset)');
    
    console.log('\nExamples:');
    console.log('  node db-manager.js init                 # Safe initialization');
    console.log('  node db-manager.js init --force         # Reset and initialize');
    console.log('  node db-manager.js reset --force        # Complete reset');
    console.log('  node db-manager.js status               # Check status');
    
    console.log('\nEnvironment Variables:');
    console.log('  DATABASE_URL or individual DB_* variables must be set');
    console.log('  See .env.example for required configuration');
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    handleInit,
    handleReset,
    handleStatus
}; 