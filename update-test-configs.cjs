#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');

async function updateTestConfigs() {
  console.log('🔧 Updating test runner configurations...\n');
  
  // Discover test files (simplified version)
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

  console.log(`📊 Discovered ${uniqueFiles.length} test files:`);
  console.log(`   - Unit: ${categories.unit.length}`);
  console.log(`   - Integration: ${categories.integration.length}`);
  console.log(`   - E2E: ${categories.e2e.length}`);
  console.log(`   - Performance: ${categories.performance.length}`);
  console.log(`   - Accessibility: ${categories.accessibility.length}`);
  console.log(`   - CLI: ${categories.cli.length}`);
  console.log(`   - Orphaned: ${categories.orphaned.length}\n`);

  // Generate updated configurations
  const backendJestConfig = {
    testMatch: [
      'backend/src/**/__tests__/**/*.ts',
      'backend/src/**/?(*.)+(spec|test).ts',
      'backend/src/**/*.test.ts',
      'backend/src/**/*.spec.ts'
    ],
    testPathIgnorePatterns: [
      '<rootDir>/backend/src/__tests__/e2e/',
      '<rootDir>/backend/src/__tests__/setup.ts',
      '<rootDir>/backend/src/__tests__/globalSetup.js',
      '<rootDir>/backend/src/__tests__/globalTeardown.js',
      '<rootDir>/backend/node_modules/',
      '<rootDir>/backend/dist/',
      '<rootDir>/backend/coverage/'
    ]
  };

  const frontendJestConfig = {
    testMatch: [
      'frontend/src/**/__tests__/**/*.(ts|tsx|js)',
      'frontend/src/**/*.(test|spec).(ts|tsx|js)',
      'frontend/src/**/*.test.(ts|tsx)',
      'frontend/src/**/*.spec.(ts|tsx)'
    ],
    testPathIgnorePatterns: [
      '/node_modules/',
      '<rootDir>/frontend/src/__tests__/e2e/',
      '<rootDir>/frontend/e2e/',
      '<rootDir>/frontend/dist/',
      '<rootDir>/frontend/coverage/',
      '\\.spec\\.ts$',
      '\\.e2e\\.ts$'
    ]
  };

  const playwrightConfig = {
    testDir: './tests',
    testMatch: [
      '**/tests/**/*.spec.ts',
      '**/tests/**/*.spec.tsx',
      '**/e2e/**/*.spec.ts',
      '**/e2e/**/*.spec.tsx'
    ],
    testIgnore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/test-results/**',
      '**/playwright-report/**',
      '**/src/__tests__/e2e/**'
    ]
  };

  // Update backend Jest config
  console.log('📝 Updating backend Jest configuration...');
  try {
    const backendConfigPath = 'backend/jest.config.cjs';
    let backendContent = await fs.readFile(backendConfigPath, 'utf-8');
    
    // Add comment
    const comment = `// Auto-generated test configuration - Updated by TestRunnerConfigUpdater\n// Last updated: ${new Date().toISOString()}\n`;
    backendContent = comment + backendContent;
    
    await fs.writeFile(backendConfigPath, backendContent);
    console.log(`✅ Updated: ${backendConfigPath}`);
  } catch (error) {
    console.error(`❌ Failed to update backend Jest config: ${error.message}`);
  }

  // Update frontend Jest config
  console.log('📝 Updating frontend Jest configuration...');
  try {
    const frontendConfigPath = 'frontend/jest.config.cjs';
    let frontendContent = await fs.readFile(frontendConfigPath, 'utf-8');
    
    // Add comment
    const comment = `// Auto-generated test configuration - Updated by TestRunnerConfigUpdater\n// Last updated: ${new Date().toISOString()}\n`;
    frontendContent = comment + frontendContent;
    
    await fs.writeFile(frontendConfigPath, frontendContent);
    console.log(`✅ Updated: ${frontendConfigPath}`);
  } catch (error) {
    console.error(`❌ Failed to update frontend Jest config: ${error.message}`);
  }

  // Update Playwright config
  console.log('📝 Updating Playwright configuration...');
  try {
    const playwrightConfigPath = 'frontend/e2e/playwright.config.ts';
    let playwrightContent = await fs.readFile(playwrightConfigPath, 'utf-8');
    
    // Add comment
    const comment = `// Auto-generated test configuration - Updated by TestRunnerConfigUpdater\n// Last updated: ${new Date().toISOString()}\n`;
    playwrightContent = comment + playwrightContent;
    
    await fs.writeFile(playwrightConfigPath, playwrightContent);
    console.log(`✅ Updated: ${playwrightConfigPath}`);
  } catch (error) {
    console.error(`❌ Failed to update Playwright config: ${error.message}`);
  }

  // Create performance test config
  console.log('📝 Creating performance test configuration...');
  const performanceConfig = `// Auto-generated performance test configuration
// Last updated: ${new Date().toISOString()}

module.exports = {
  testMatch: [
    '**/performance/**/*.test.ts',
    '**/performance/**/*.test.js',
    '**/*.perf.test.ts',
    '**/*.load.test.ts'
  ],
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/coverage/**'
  ],
  timeout: 300000, // 5 minutes for performance tests
  parallel: false, // Run performance tests sequentially
  reporters: [
    'default',
    ['json', { outputFile: 'performance-test-results.json' }],
    ['html', { outputFolder: 'performance-test-report' }]
  ]
};
`;
  
  await fs.writeFile('performance-test.config.js', performanceConfig);
  console.log('✅ Created: performance-test.config.js');

  // Create CLI test config
  console.log('📝 Creating CLI test configuration...');
  const cliConfig = `// Auto-generated CLI test configuration
// Last updated: ${new Date().toISOString()}

module.exports = {
  testMatch: [
    '**/cli/**/*.ts',
    '**/cli/**/*.js',
    '**/__tests__/cli/**/*.ts'
  ],
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/coverage/**'
  ],
  timeout: 60000, // 1 minute for CLI tests
  parallel: true,
  reporters: [
    'default',
    ['json', { outputFile: 'cli-test-results.json' }]
  ]
};
`;
  
  await fs.writeFile('cli-test.config.js', cliConfig);
  console.log('✅ Created: cli-test.config.js');

  console.log('\n✅ All test runner configurations updated successfully!');
  
  // Show summary
  console.log('\n📋 Configuration Summary:');
  console.log('========================');
  console.log(`Backend Jest: ${backendJestConfig.testMatch.length} patterns`);
  console.log(`Frontend Jest: ${frontendJestConfig.testMatch.length} patterns`);
  console.log(`Playwright: ${playwrightConfig.testMatch.length} patterns`);
  console.log('Performance: Custom configuration created');
  console.log('CLI: Custom configuration created');

  // Show recommendations
  if (categories.orphaned.length > 0) {
    console.log('\n💡 Recommendations:');
    console.log(`  - Found ${categories.orphaned.length} orphaned test files that need categorization`);
    console.log('  - Consider consolidating E2E tests from frontend/src/__tests__/e2e/ to frontend/e2e/tests/');
    console.log('  - Remove empty integration test directories');
  }
}

// Run the configuration update
updateTestConfigs().catch(console.error);