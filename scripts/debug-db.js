// backend/debug-db.js - Run this to check database state
require('dotenv').config();
const { initializePool, query } = require('./database/connection');

async function debugDatabase() {
    try {
        console.log('🔍 Debugging database state...');
        
        // Initialize connection
        await initializePool();
        console.log('✅ Database connection established');
        
        // Check if tables exist
        const tableCheck = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'lobbies', 'lobby_players', 'question_sets')
            ORDER BY table_name
        `);
        
        console.log('📊 Existing tables:', tableCheck.rows.map(r => r.table_name));
        
        // Check lobbies table structure
        try {
            const lobbyColumns = await query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'lobbies' 
                ORDER BY ordinal_position
            `);
            console.log('🏠 Lobbies table columns:', lobbyColumns.rows);
        } catch (error) {
            console.error('❌ Error checking lobbies table:', error.message);
        }
        
        // Check lobby_players table structure
        try {
            const playersColumns = await query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'lobby_players' 
                ORDER BY ordinal_position
            `);
            console.log('👥 Lobby_players table columns:', playersColumns.rows);
        } catch (error) {
            console.error('❌ Error checking lobby_players table:', error.message);
        }
        
        // Check question_sets table structure
        try {
            const questionSetsColumns = await query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'question_sets' 
                ORDER BY ordinal_position
            `);
            console.log('📝 Question_sets table columns:', questionSetsColumns.rows);
        } catch (error) {
            console.error('❌ Error checking question_sets table:', error.message);
        }
        
        // Test question set lookup
        try {
            const questionSet = await query('SELECT id, name FROM question_sets WHERE id = $1', [1]);
            console.log('🔍 Question set 1:', questionSet.rows[0] || 'Not found');
        } catch (error) {
            console.error('❌ Error checking question set:', error.message);
        }
        
        // Check for existing lobbies
        try {
            const existingLobbies = await query('SELECT code, host, created_at FROM lobbies ORDER BY created_at DESC LIMIT 5');
            console.log('🏠 Recent lobbies:', existingLobbies.rows);
        } catch (error) {
            console.error('❌ Error checking existing lobbies:', error.message);
        }
        
        // Test a simple insert/delete to check permissions
        try {
            console.log('🧪 Testing database write permissions...');
            await query('BEGIN');
            
            const testCode = 'TEST';
            await query('INSERT INTO lobbies (code, host) VALUES ($1, $2)', [testCode, 'test-user']);
            console.log('✅ Test insert successful');
            
            await query('DELETE FROM lobbies WHERE code = $1', [testCode]);
            console.log('✅ Test delete successful');
            
            await query('COMMIT');
            console.log('✅ Test transaction committed');
            
        } catch (error) {
            await query('ROLLBACK');
            console.error('❌ Database write test failed:', error.message);
        }
        
        console.log('🎉 Database debug complete');
        process.exit(0);
        
    } catch (error) {
        console.error('💥 Database debug failed:', error);
        process.exit(1);
    }
}

debugDatabase();