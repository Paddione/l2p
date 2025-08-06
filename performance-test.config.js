// Auto-generated performance test configuration
// Last updated: 2025-08-06T03:31:40.725Z

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
