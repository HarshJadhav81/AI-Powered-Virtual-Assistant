/**
 * Integration Tests for Music Routes (Spotify)
 */

import request from 'supertest';
import express from 'express';
import musicRoutes from '../../routes/music.routes.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/music', musicRoutes);

describe('Music Routes', () => {
  describe('GET /api/music/auth', () => {
    test('should return auth URL or fallback', async () => {
      const response = await request(app)
        .get('/api/music/auth')
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('url');
      expect(typeof response.body.url).toBe('string');
    });
  });

  describe('POST /api/music/search', () => {
    test('should return 400 for empty query', async () => {
      const response = await request(app)
        .post('/api/music/search')
        .send({ query: '' })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should return search results or fallback', async () => {
      const response = await request(app)
        .post('/api/music/search')
        .send({ query: 'test song', limit: 5 })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('POST /api/music/play', () => {
    test('should return 400 for missing uri', async () => {
      const response = await request(app)
        .post('/api/music/play')
        .send({})
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle play request', async () => {
      const response = await request(app)
        .post('/api/music/play')
        .send({ uri: 'spotify:track:test123' })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('POST /api/music/pause', () => {
    test('should handle pause request', async () => {
      const response = await request(app)
        .post('/api/music/pause')
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('POST /api/music/next', () => {
    test('should handle next track request', async () => {
      const response = await request(app)
        .post('/api/music/next')
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('POST /api/music/previous', () => {
    test('should handle previous track request', async () => {
      const response = await request(app)
        .post('/api/music/previous')
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('POST /api/music/volume', () => {
    test('should return 400 for missing volume', async () => {
      const response = await request(app)
        .post('/api/music/volume')
        .send({})
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 for invalid volume', async () => {
      const response = await request(app)
        .post('/api/music/volume')
        .send({ volume: 150 })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('0-100');
    });

    test('should handle valid volume request', async () => {
      const response = await request(app)
        .post('/api/music/volume')
        .send({ volume: 50 })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('GET /api/music/current', () => {
    test('should return current playback info', async () => {
      const response = await request(app)
        .get('/api/music/current')
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('GET /api/music/devices', () => {
    test('should return available devices', async () => {
      const response = await request(app)
        .get('/api/music/devices')
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('POST /api/music/device', () => {
    test('should return 400 for missing deviceId', async () => {
      const response = await request(app)
        .post('/api/music/device')
        .send({})
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle device change request', async () => {
      const response = await request(app)
        .post('/api/music/device')
        .send({ deviceId: 'test-device-123' })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });
  });
});
