/**
 * Test Setup and Global Configuration
 */

import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only-do-not-use-in-production';
process.env.MONGODB_URL = 'mongodb://localhost:27017/test_virtual_assistant';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.OPENWEATHER_API_KEY = 'test-weather-key';
process.env.GOOGLE_TRANSLATE_API_KEY = 'test-translate-key';
process.env.SPOTIFY_CLIENT_ID = 'test-client-id';
process.env.SPOTIFY_CLIENT_SECRET = 'test-client-secret';
process.env.YOUTUBE_API_KEY = 'test-youtube-key';
process.env.GEMINI_API_KEY = 'test-gemini-key';

// Increase timeout for integration tests
jest.setTimeout(10000);

// Mock console methods to reduce test noise
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn()
// };

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
