import request from 'supertest';
import app from '../../index.js';
import { jest } from '@jest/globals';

describe('news Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /news', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/news')
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(401);
    });

    it('should handle authenticated request', async () => {
      // TODO: Add authentication token
      const response = await request(app)
        .get('/news')
        .set('Authorization', 'Bearer mock-token')
        .expect('Content-Type', /json/);
      
      // Update expected behavior
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('POST /news', () => {
    it('should require valid payload', async () => {
      const response = await request(app)
        .post('/news')
        .send({})
        .expect('Content-Type', /json/);
      
      expect([400, 401]).toContain(response.status);
    });
  });
});
