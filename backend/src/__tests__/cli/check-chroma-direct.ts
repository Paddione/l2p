#!/usr/bin/env tsx

import { ChromaClient } from 'chromadb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkChromaDirect() {
  console.log('🔍 Checking ChromaDB Direct Access\n');
  
  try {
    console.log('Creating ChromaDB client...');
    const client = new ChromaClient({
      path: 'http://localhost:8000'
    });
    
    // Try to get or create a collection with a specific name
    const collectionName = 'university_courses';
    console.log(`\n📁 Trying to access collection: ${collectionName}`);
    
    try {
      const collection = await client.getOrCreateCollection({
        name: collectionName
      });
      
      console.log('✅ Collection created/accessed successfully');
      
      // Try to get all documents
      const results = await collection.get({
        limit: 100
      });
      
      console.log(`📊 Collection Stats:`);
      console.log(`   - Documents: ${results.documents?.length || 0}`);
      console.log(`   - Embeddings: ${results.embeddings?.length || 0}`);
      console.log(`   - IDs: ${results.ids?.length || 0}`);
      console.log(`   - Metadatas: ${results.metadatas?.length || 0}`);
      
      if (results.documents && results.documents.length > 0) {
        console.log(`\n📄 Sample Documents:`);
        results.documents.slice(0, 3).forEach((doc, index) => {
          console.log(`   ${index + 1}. ${doc.substring(0, 150)}...`);
        });
      }
      
      if (results.metadatas && results.metadatas.length > 0) {
        console.log(`\n🏷️  Sample Metadatas:`);
        results.metadatas.slice(0, 3).forEach((meta, index) => {
          console.log(`   ${index + 1}.`, meta);
        });
      }
      
    } catch (error) {
      console.log('❌ Error accessing collection:', error);
    }
    
    // Try to list all collections again
    console.log(`\n📋 All Collections:`);
    const collections = await client.listCollections();
    console.log(`   - Total: ${collections.length}`);
    collections.forEach((col, index) => {
      console.log(`   ${index + 1}. Name: "${col.name || 'unnamed'}", ID: "${col.id || 'unknown'}"`);
    });
    
  } catch (error) {
    console.error('❌ Error checking ChromaDB:', error);
  }
}

checkChromaDirect().catch(console.error); 