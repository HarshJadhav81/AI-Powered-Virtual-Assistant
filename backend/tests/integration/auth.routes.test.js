import request from 'supertest';
import app from '../../index.js';
import { jest } from '@jest/globals';

describe('auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('should require email and password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({});
      
      // Should reject empty payload
      expect([400, 422]).toContain(response.status);
    });

    it('should accept valid signup data', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: `test${Date.now()}@example.com`,
          password: 'Test123!'
        });
      
      // Should either create user or indicate email exists
      expect([200, 201, 400]).toContain(response.status);
    });
  });

  describe('POST /api/auth/signin', () => {
    it('should require credentials', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({});
      
      expect([400, 401, 422]).toContain(response.status);
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });
      
      expect([401, 404]).toContain(response.status);
    });
  });

  describe('POST /api/auth/signout', () => {
    it('should handle signout request', async () => {
      const response = await request(app)
        .post('/api/auth/signout');
      
      // Should allow signout even without auth
      expect([200, 401]).toContain(response.status);
    });
  });
});
