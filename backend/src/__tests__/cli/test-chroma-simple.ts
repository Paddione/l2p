#!/usr/bin/env tsx

import { ChromaClient } from 'chromadb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testChromaSimple() {
  console.log('🔍 Testing ChromaDB Connection (Simple)\n');
  
  try {
    console.log('Creating ChromaDB client...');
    const client = new ChromaClient({
      path: 'http://localhost:8000'
    });
    
    console.log('Testing heartbeat...');
    const heartbeat = await client.heartbeat();
    console.log('✅ Heartbeat successful:', heartbeat);
    
    console.log('Testing list collections...');
    const collections = await client.listCollections();
    console.log('✅ Collections:', collections);
    
    console.log('✅ ChromaDB connection successful!');
    
  } catch (error) {
    console.error('❌ ChromaDB connection failed:', error);
  }
}

testChromaSimple().catch(console.error); 