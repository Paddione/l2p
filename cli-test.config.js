// Auto-generated CLI test configuration
// Last updated: 2025-08-06T03:31:40.725Z

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
