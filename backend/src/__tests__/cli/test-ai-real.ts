#!/usr/bin/env tsx

import { GeminiService } from '../services/GeminiService.js';
import { ChromaService } from '../services/ChromaService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testRealAIIntegration() {
  console.log('🤖 Testing Real AI Integration with ChromaDB\n');
  
  try {
    // Test ChromaService with real database
    console.log('🔍 Testing ChromaService with real database...');
    const chromaService = new ChromaService();
    
    // Test connection
    const connectionTest = await chromaService.testConnection();
    console.log('✅ ChromaDB Connection:', connectionTest.success ? 'Connected' : 'Failed');
    if (!connectionTest.success) {
      console.log('❌ Error:', connectionTest.error);
      return;
    }
    
    // Test collection initialization
    const initResult = await chromaService.initializeCollection();
    console.log('✅ Collection Initialization:', initResult.success ? 'Success' : 'Failed');
    
    // Get collection stats
    const stats = await chromaService.getCollectionStats();
    console.log('📊 ChromaDB Stats:');
    console.log(`   - Total Documents: ${stats.totalDocuments}`);
    console.log(`   - Total Embeddings: ${stats.totalEmbeddings}`);
    console.log(`   - Sources: ${stats.sources.length}`);
    console.log(`   - Subjects: ${stats.subjects.length}`);
    
    if (stats.sources.length > 0) {
      console.log('   - Available Sources:', stats.sources.slice(0, 5).join(', '));
    }
    if (stats.subjects.length > 0) {
      console.log('   - Available Subjects:', stats.subjects.slice(0, 5).join(', '));
    }
    
    // Test search functionality
    console.log('\n🔍 Testing search functionality...');
    const searchResults = await chromaService.search('programming', 3);
    console.log(`✅ Search Results: ${searchResults.length} documents found`);
    
    if (searchResults.length > 0) {
      console.log('   - First result preview:', searchResults[0].content.substring(0, 100) + '...');
      console.log('   - Metadata:', searchResults[0].metadata);
    }
    
    // Test GeminiService (if API key is available)
    if (process.env.GEMINI_API_KEY) {
      console.log('\n🔍 Testing GeminiService...');
      try {
        const geminiService = new GeminiService();
        
        // Test question generation
        const generationRequest = {
          topic: 'JavaScript Basics',
          category: 'Programming',
          difficulty: 'easy' as const,
          questionCount: 2,
          language: 'en' as const
        };
        
        console.log('📝 Generating questions for:', generationRequest.topic);
        const result = await geminiService.generateQuestions(generationRequest);
        
        if (result.success && result.data) {
          console.log('✅ Question Generation Successful!');
          console.log(`   - Generated ${result.data.questions.length} questions`);
          console.log(`   - Question Set: ${result.data.questionSet.name}`);
          console.log(`   - Context Used: ${result.data.metadata.contextUsed.length} sources`);
          
          if (result.data.questions.length > 0) {
            const firstQuestion = result.data.questions[0];
            console.log('   - Sample Question:', firstQuestion.question_text);
          }
        } else {
          console.log('❌ Question Generation Failed:', result.error);
        }
      } catch (error) {
        console.log('❌ GeminiService Error:', error);
      }
    } else {
      console.log('\n⚠️  GEMINI_API_KEY not found - skipping Gemini tests');
      console.log('   To test Gemini, add GEMINI_API_KEY to your .env file');
    }
    
    console.log('\n🎉 Real AI Integration Test Complete!');
    console.log('\n📋 Summary:');
    console.log(`   - ChromaDB: ${connectionTest.success ? '✅ Connected' : '❌ Failed'}`);
    console.log(`   - Documents: ${stats.totalDocuments}`);
    console.log(`   - Search: ${searchResults.length > 0 ? '✅ Working' : '❌ No results'}`);
    console.log(`   - Gemini: ${process.env.GEMINI_API_KEY ? '✅ Available' : '⚠️  No API Key'}`);
    
  } catch (error) {
    console.error('❌ Error testing real AI integration:', error);
  }
}

testRealAIIntegration().catch(console.error); 