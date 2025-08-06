#!/usr/bin/env tsx

import { ChromaClient } from 'chromadb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkChromaCollections() {
  console.log('🔍 Checking ChromaDB Collections\n');
  
  try {
    console.log('Creating ChromaDB client...');
    const client = new ChromaClient({
      path: 'http://localhost:8000'
    });
    
    console.log('Listing all collections...');
    const collections = await client.listCollections();
    console.log('✅ Collections found:', collections.length);
    
    for (const collection of collections) {
      console.log(`\n📁 Collection: ${collection.name || 'unnamed'}`);
      console.log(`   - ID: ${collection.id || 'unknown'}`);
      console.log(`   - Metadata:`, collection.metadata);
      
      if (!collection.name) {
        console.log(`   - ⚠️  Collection has no name, skipping details`);
        continue;
      }
      
      try {
        // Get collection details
        const collectionDetails = await client.getCollection({
          name: collection.name
        });
        
        // Get some documents from the collection
        const results = await collectionDetails.get({
          limit: 5
        });
        
        console.log(`   - Documents: ${results.documents?.length || 0}`);
        console.log(`   - Embeddings: ${results.embeddings?.length || 0}`);
        
        if (results.documents && results.documents.length > 0) {
          console.log(`   - Sample document: ${results.documents[0].substring(0, 100)}...`);
        }
        
        if (results.metadatas && results.metadatas.length > 0) {
          console.log(`   - Sample metadata:`, results.metadatas[0]);
        }
        
      } catch (error) {
        console.log(`   - Error getting collection details:`, error);
      }
    }
    
    if (collections.length === 0) {
      console.log('\n⚠️  No collections found in ChromaDB');
      console.log('   The database might be empty or using a different structure');
    }
    
  } catch (error) {
    console.error('❌ Error checking ChromaDB collections:', error);
  }
}

checkChromaCollections().catch(console.error); 