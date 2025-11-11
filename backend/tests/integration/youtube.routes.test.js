/**
 * Integration Tests for YouTube Routes
 */

import request from 'supertest';
import express from 'express';
import youtubeRoutes from '../../routes/youtube.routes.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/youtube', youtubeRoutes);

describe('YouTube Routes', () => {
  describe('POST /api/youtube/search', () => {
    test('should return 400 for empty query', async () => {
      const response = await request(app)
        .post('/api/youtube/search')
        .send({ query: '' })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should return search results or fallback', async () => {
      const response = await request(app)
        .post('/api/youtube/search')
        .send({ query: 'test video', maxResults: 5 })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });

    test('should use default maxResults when not provided', async () => {
      const response = await request(app)
        .post('/api/youtube/search')
        .send({ query: 'test video' })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('POST /api/youtube/video/:videoId', () => {
    test('should return video details or fallback', async () => {
      const response = await request(app)
        .post('/api/youtube/video/dQw4w9WgXcQ')
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });

    test('should handle invalid video ID format', async () => {
      const response = await request(app)
        .post('/api/youtube/video/')
        .expect(404); // Route not found
    });
  });

  describe('POST /api/youtube/channel/search', () => {
    test('should return 400 for empty query', async () => {
      const response = await request(app)
        .post('/api/youtube/channel/search')
        .send({ query: '' })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should return channel search results', async () => {
      const response = await request(app)
        .post('/api/youtube/channel/search')
        .send({ query: 'test channel', maxResults: 5 })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('POST /api/youtube/channel/:channelId', () => {
    test('should return channel info or fallback', async () => {
      const response = await request(app)
        .post('/api/youtube/channel/UCtest123')
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('POST /api/youtube/trending', () => {
    test('should return trending videos', async () => {
      const response = await request(app)
        .post('/api/youtube/trending')
        .send({ maxResults: 10 })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });

    test('should use default maxResults when not provided', async () => {
      const response = await request(app)
        .post('/api/youtube/trending')
        .send({})
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });

    test('should handle regionCode parameter', async () => {
      const response = await request(app)
        .post('/api/youtube/trending')
        .send({ regionCode: 'US', maxResults: 5 })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });
  });
});
