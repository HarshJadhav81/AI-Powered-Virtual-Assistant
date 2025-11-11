/**
 * Test Setup and Global Configuration
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only-do-not-use-in-production';
process.env.MONGODB_URL = 'mongodb://localhost:27017/test_virtual_assistant';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// Increase timeout for integration tests
jest.setTimeout(10000);

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global test utilities
global.testUtils = {
  mockUser: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User'
  },
  
  mockToken: 'test-jwt-token',
  
  mockAPIResponse: (data, success = true) => ({
    success,
    data,
    timestamp: new Date().toISOString()
  })
};
