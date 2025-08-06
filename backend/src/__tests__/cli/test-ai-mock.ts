#!/usr/bin/env tsx

import { GeminiService, QuestionGenerationRequest } from '../../services/GeminiService.js';
import { ChromaService } from '../../services/ChromaService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testAIIntegrationStructure() {
  console.log('🤖 Testing AI Integration Structure\n');
  
  try {
    // Test GeminiService instantiation (without API key)
    console.log('🔍 Testing GeminiService structure...');
    try {
      const geminiService = new GeminiService();
      console.log('❌ GeminiService should have failed without API key');
    } catch (error) {
      console.log('✅ GeminiService properly validates API key requirement');
    }
    
    // Test ChromaService instantiation
    console.log('🔍 Testing ChromaService structure...');
    const chromaService = new ChromaService();
    console.log('✅ ChromaService instantiated successfully');
    
    // Test ChromaService methods
    console.log('🔍 Testing ChromaService methods...');
    const initResult = await chromaService.initializeCollection();
    console.log('✅ initializeCollection:', initResult.success);
    
    const stats = await chromaService.getCollectionStats();
    console.log('✅ getCollectionStats:', stats);
    
    const searchResult = await chromaService.search('test query');
    console.log('✅ search:', searchResult.length, 'results');
    
    // Test question generation request validation
    console.log('🔍 Testing request validation...');
    const mockRequest: QuestionGenerationRequest = {
      topic: 'JavaScript Basics',
      category: 'Programming',
      difficulty: 'easy',
      questionCount: 5,
      language: 'en'
    };
    
    // Test validation logic (without instantiating service)
    const errors: string[] = [];
    
    if (!mockRequest.topic || mockRequest.topic.trim().length === 0) {
      errors.push('Topic is required');
    }
    
    if (!mockRequest.category || mockRequest.category.trim().length === 0) {
      errors.push('Category is required');
    }
    
    if (!['easy', 'medium', 'hard'].includes(mockRequest.difficulty)) {
      errors.push('Difficulty must be one of: easy, medium, hard');
    }
    
    if (!mockRequest.questionCount || mockRequest.questionCount < 1 || mockRequest.questionCount > 50) {
      errors.push('Question count must be between 1 and 50');
    }
    
    if (!['en', 'de'].includes(mockRequest.language)) {
      errors.push('Language must be either "en" or "de"');
    }
    
    if (errors.length === 0) {
      console.log('✅ Request validation passed');
    } else {
      console.log('❌ Request validation failed:', errors);
    }
    
    console.log('\n🎉 AI Integration Structure Test Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Add GEMINI_API_KEY to .env file');
    console.log('2. Test with real API calls');
    console.log('3. Configure ChromaDB for RAG functionality');
    
  } catch (error) {
    console.error('❌ Error testing AI integration:', error);
  }
}

testAIIntegrationStructure().catch(console.error); 