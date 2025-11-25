import request from 'supertest';
import app from '../../index.js';
import { jest } from '@jest/globals';

describe('gmail Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /gmail', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/gmail')
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(401);
    });

    it('should handle authenticated request', async () => {
      // TODO: Add authentication token
      const response = await request(app)
        .get('/gmail')
        .set('Authorization', 'Bearer mock-token')
        .expect('Content-Type', /json/);
      
      // Update expected behavior
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('POST /gmail', () => {
    it('should require valid payload', async () => {
      const response = await request(app)
        .post('/gmail')
        .send({})
        .expect('Content-Type', /json/);
      
      expect([400, 401]).toContain(response.status);
    });
  });
});
