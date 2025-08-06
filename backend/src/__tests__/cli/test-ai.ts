#!/usr/bin/env tsx

import { GeminiService, QuestionGenerationRequest } from '../../services/GeminiService.js';
import { ChromaService } from '../../services/ChromaService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testGeminiConnection() {
  console.log('🔍 Testing Gemini API connection...');
  
  try {
    const geminiService = new GeminiService();
    const result = await geminiService.testConnection();
    
    if (result.success) {
      console.log('✅ Gemini API connection successful');
    } else {
      console.log('❌ Gemini API connection failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error testing Gemini API:', error instanceof Error ? error.message : 'Unknown error');
  }
}

async function testChromaConnection() {
  console.log('🔍 Testing ChromaDB connection...');
  
  try {
    const chromaService = new ChromaService();
    const result = await chromaService.testConnection();
    
    if (result.success) {
      console.log('✅ ChromaDB connection successful');
    } else {
      console.log('❌ ChromaDB connection failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error testing ChromaDB:', error instanceof Error ? error.message : 'Unknown error');
  }
}

async function testQuestionGeneration() {
  console.log('🔍 Testing question generation...');
  
  try {
    const geminiService = new GeminiService();
    
    const request = {
      topic: 'JavaScript Basics',
      category: 'Programming',
      difficulty: 'easy' as const,
      questionCount: 3,
      language: 'en' as const
    };
    
    console.log('📝 Generating questions for:', request.topic);
    const result = await geminiService.generateQuestions(request);
    
    if (result.success) {
      console.log('✅ Question generation successful');
      console.log(`📊 Generated ${result.questions.length} questions`);
      console.log('📋 Questions:');
      result.questions.forEach((q, i) => {
        console.log(`  ${i + 1}. ${q.questionText.en}`);
        console.log(`     Correct: ${q.answers.find(a => a.correct)?.text.en}`);
      });
    } else {
      console.log('❌ Question generation failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error testing question generation:', error instanceof Error ? error.message : 'Unknown error');
  }
}

async function testChromaOperations() {
  console.log('🔍 Testing ChromaDB operations...');
  
  try {
    const chromaService = new ChromaService();
    
    // Initialize collection
    console.log('📁 Initializing collection...');
    const initResult = await chromaService.initializeCollection();
    if (initResult.success) {
      console.log('✅ Collection initialized');
    } else {
      console.log('❌ Collection initialization failed:', initResult.error);
      return;
    }
    
    // Add sample document
    console.log('📄 Adding sample document...');
    const sampleContent = `
# JavaScript Fundamentals

JavaScript is a programming language that is one of the core technologies of the World Wide Web, alongside HTML and CSS.

## Variables
Variables are containers for storing data values. In JavaScript, you can declare variables using var, let, or const.

## Functions
Functions are reusable blocks of code that can be called to perform specific tasks.
    `;
    
    const metadata = {
      source: 'javascript_basics.pdf',
      title: 'JavaScript Fundamentals',
      course: 'Web Development 101',
      subject: 'Programming'
    };
    
    const document = chromaService.createDocument(sampleContent, metadata);
    const addResult = await chromaService.addDocuments([document], metadata);
    
    if (addResult.success) {
      console.log(`✅ Added ${addResult.embeddingsCreated} embeddings`);
    } else {
      console.log('❌ Failed to add documents:', addResult.error);
      return;
    }
    
    // Test search
    console.log('🔍 Testing search...');
    const searchResults = await chromaService.search('JavaScript variables', 3);
    console.log(`✅ Found ${searchResults.length} relevant documents`);
    
    // Get stats
    console.log('📊 Getting collection stats...');
    const stats = await chromaService.getCollectionStats();
    console.log('📈 Collection stats:', stats);
    
  } catch (error) {
    console.log('❌ Error testing ChromaDB operations:', error instanceof Error ? error.message : 'Unknown error');
  }
}

async function main() {
  const command = process.argv[2];
  
  console.log('🤖 Learn2Play AI Integration Test\n');
  
  switch (command) {
    case 'gemini':
      await testGeminiConnection();
      break;
    case 'chroma':
      await testChromaConnection();
      break;
    case 'generate':
      await testQuestionGeneration();
      break;
    case 'chroma-ops':
      await testChromaOperations();
      break;
    case 'all':
      await testGeminiConnection();
      console.log('');
      await testChromaConnection();
      console.log('');
      await testChromaOperations();
      console.log('');
      await testQuestionGeneration();
      break;
    default:
      console.log('Usage: npm run test:ai <command>');
      console.log('');
      console.log('Commands:');
      console.log('  gemini     - Test Gemini API connection');
      console.log('  chroma     - Test ChromaDB connection');
      console.log('  generate   - Test question generation');
      console.log('  chroma-ops - Test ChromaDB operations');
      console.log('  all        - Run all tests');
      console.log('');
      console.log('Environment variables required:');
      console.log('  GEMINI_API_KEY - Google Gemini API key');
      console.log('  CHROMA_URL     - ChromaDB server URL (default: http://localhost:8000)');
  }
}

main().catch(console.error); 