/**
 * Global Jest Setup for Backend Tests
 * Uses unified test configuration system
 */

module.exports = async function globalSetup() {
  try {
    console.log('Starting global test setup...');
    
    // Set up basic environment variables
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test_user:test_pass@localhost:5433/test_db';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_testing_only_not_secure';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_for_testing_only_not_secure';
    
    try {
      // Try to load test utilities if available
      const { TestUtilities } = await import('../../../shared/test-config/dist/TestUtilities.js');
      
      // Get test context from environment
      const { environment, testType } = TestUtilities.getCurrentContext();
      
      // Initialize test environment
      const context = await TestUtilities.initializeTestEnvironment(environment, testType);
      
      // Wait for services if needed (for integration tests)
      if (testType === 'integration' || testType === 'e2e') {
        console.log('Waiting for services to be ready...');
        try {
          await TestUtilities.waitForServices(environment, 60000);
          console.log('All services are ready');
        } catch (error) {
          console.warn('Some services may not be ready:', error.message);
          // Continue with tests even if services aren't ready for unit tests
        }
      }
      
      // Store context globally
      global.__TEST_CONTEXT__ = context;
      
      console.log(`Global setup complete for ${environment}/${testType}`);
    } catch (error) {
      console.warn('Could not load test utilities, using basic setup:', error.message);
      console.log('Global setup complete with basic configuration');
    }
  } catch (error) {
    console.error('Global setup failed:', error);
    // Don't throw to allow tests to run with fallback configuration
  }
}