#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

async function discoverTestFiles() {
  console.log('🔍 Discovering test files in the repository...\n');
  
  const patterns = [
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.test.js',
    '**/*.test.jsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    '**/*.spec.js',
    '**/*.spec.jsx',
    '**/__tests__/**/*.ts',
    '**/__tests__/**/*.tsx',
    '**/__tests__/**/*.js',
    '**/__tests__/**/*.jsx'
  ];

  const excludePatterns = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/test-results/**',
    '**/test-artifacts/**',
    '**/playwright-report/**',
    '**/.git/**'
  ];

  const allFiles = [];
  
  for (const pattern of patterns) {
    try {
      const files = await new Promise((resolve, reject) => {
        glob(pattern, { ignore: excludePatterns }, (err, matches) => {
          if (err) reject(err);
          else resolve(matches);
        });
      });
      allFiles.push(...files);
    } catch (error) {
      console.warn(`Error scanning pattern ${pattern}:`, error);
    }
  }

  // Remove duplicates
  const uniqueFiles = [...new Set(allFiles)];
  
  // Categorize files
  const categories = {
    unit: [],
    integration: [],
    e2e: [],
    performance: [],
    accessibility: [],
    cli: [],
    orphaned: []
  };

  uniqueFiles.forEach(file => {
    const normalizedPath = file.toLowerCase();
    
    if (normalizedPath.includes('/cli/') || normalizedPath.includes('\\cli\\')) {
      categories.cli.push(file);
    } else if (normalizedPath.includes('/e2e/') || normalizedPath.includes('\\e2e\\')) {
      categories.e2e.push(file);
    } else if (normalizedPath.includes('/performance/') || normalizedPath.includes('\\performance\\')) {
      categories.performance.push(file);
    } else if (normalizedPath.includes('/accessibility/') || normalizedPath.includes('\\accessibility\\') || normalizedPath.includes('a11y')) {
      categories.accessibility.push(file);
    } else if (normalizedPath.includes('/integration/') || normalizedPath.includes('\\integration\\')) {
      categories.integration.push(file);
    } else if (normalizedPath.includes('/unit/') || normalizedPath.includes('\\unit\\') || 
               normalizedPath.includes('__tests__') || normalizedPath.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/)) {
      categories.unit.push(file);
    } else {
      categories.orphaned.push(file);
    }
  });

  // Display results
  console.log('📊 Test File Discovery Results:');
  console.log('===============================');
  
  Object.entries(categories).forEach(([type, files]) => {
    if (files.length > 0) {
      console.log(`\n${type.toUpperCase()} (${files.length} files):`);
      files.forEach(file => console.log(`  - ${file}`));
    }
  });

  const totalFiles = uniqueFiles.length;
  console.log(`\n✅ Total test files discovered: ${totalFiles}`);
  
  // Find duplicates
  const filesByName = new Map();
  uniqueFiles.forEach(file => {
    const fileName = path.basename(file);
    if (!filesByName.has(fileName)) {
      filesByName.set(fileName, []);
    }
    filesByName.get(fileName).push(file);
  });
  
  const duplicates = Array.from(filesByName.values()).filter(group => group.length > 1);
  if (duplicates.length > 0) {
    console.log(`\n🔄 Duplicate Files Found (${duplicates.length} groups):`);
    duplicates.forEach((group, index) => {
      console.log(`  Group ${index + 1}:`);
      group.forEach(file => console.log(`    - ${file}`));
    });
  }

  // Generate recommendations
  console.log('\n💡 Recommendations:');
  if (categories.orphaned.length > 0) {
    console.log(`  - Found ${categories.orphaned.length} orphaned test files that need categorization`);
  }
  if (duplicates.length > 0) {
    console.log(`  - Found ${duplicates.length} sets of duplicate test files that should be consolidated`);
  }

  console.log('  - Remove empty integration test directories');

  return {
    categories,
    totalFiles,
    duplicates,
    recommendations: [
      categories.orphaned.length > 0 ? `Found ${categories.orphaned.length} orphaned test files that need categorization` : null,
      duplicates.length > 0 ? `Found ${duplicates.length} sets of duplicate test files that should be consolidated` : null,

      'Remove empty integration test directories'
    ].filter(Boolean)
  };
}

// Run the discovery
discoverTestFiles().catch(console.error);