/**
 * Integration Tests for YouTube Routes
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import axios from 'axios'; // Import mocked axios
import youtubeRoutes from '../../routes/youtube.routes.js';

// Mock axios
jest.mock('axios');

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/youtube', youtubeRoutes);

// Generate valid token
const token = jwt.sign({ userId: 'test-user-id' }, process.env.JWT_SECRET);

describe('YouTube Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/youtube/search', () => {
    test('should return 400 for empty query', async () => {
      const response = await request(app)
        .get('/api/youtube/search')
        .set('Cookie', [`token=${token}`])
        .query({ q: '' })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should return search results', async () => {
      // Mock axios response for search
      axios.get.mockResolvedValueOnce({
        data: {
          items: [
            {
              id: { videoId: 'test-video-id' },
              snippet: {
                title: 'Test Video',
                description: 'Test Description',
                thumbnails: {
                  medium: { url: 'http://example.com/thumb.jpg' },
                  high: { url: 'http://example.com/thumb_high.jpg' }
                },
                channelTitle: 'Test Channel',
                publishedAt: '2023-01-01T00:00:00Z'
              }
            }
          ]
        }
      });

      const response = await request(app)
        .get('/api/youtube/search')
        .set('Cookie', [`token=${token}`])
        .query({ q: 'test video', maxResults: 5 })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.videos).toHaveLength(1);
    });

    test('should use default maxResults when not provided', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          items: []
        }
      });

      const response = await request(app)
        .get('/api/youtube/search')
        .set('Cookie', [`token=${token}`])
        .query({ q: 'test video' })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/youtube/video/:videoId', () => {
    test('should return video details', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          items: [
            {
              id: 'dQw4w9WgXcQ',
              snippet: {
                title: 'Test Video',
                description: 'Test Description',
                thumbnails: {
                  medium: { url: 'http://example.com/thumb.jpg' },
                  high: { url: 'http://example.com/thumb_high.jpg' }
                },
                channelTitle: 'Test Channel',
                channelId: 'UCtest',
                publishedAt: '2023-01-01T00:00:00Z'
              },
              statistics: {
                viewCount: '1000',
                likeCount: '100',
                commentCount: '10'
              },
              contentDetails: { duration: 'PT1M' }
            }
          ]
        }
      });

      const response = await request(app)
        .get('/api/youtube/video/dQw4w9WgXcQ')
        .set('Cookie', [`token=${token}`])
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.video).toBeDefined();
    });

    test('should handle invalid video ID format', async () => {
      const response = await request(app)
        .get('/api/youtube/video/')
        .set('Cookie', [`token=${token}`])
        .expect(404); // Route not found
    });
  });

  describe('GET /api/youtube/channel/search', () => {
    test('should return 400 for empty query', async () => {
      const response = await request(app)
        .get('/api/youtube/search')
        .set('Cookie', [`token=${token}`])
        .query({ q: '', type: 'channel' })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should return channel search results', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          items: [
            {
              id: { channelId: 'test-channel-id' },
              snippet: {
                title: 'Test Channel',
                description: 'Test Description',
                thumbnails: {
                  medium: { url: 'http://example.com/thumb.jpg' },
                  high: { url: 'http://example.com/thumb_high.jpg' }
                }
              }
            }
          ]
        }
      });

      const response = await request(app)
        .get('/api/youtube/search')
        .set('Cookie', [`token=${token}`])
        .query({ q: 'test channel', maxResults: 5, type: 'channel' })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.channels).toHaveLength(1);
    });
  });

  describe('GET /api/youtube/channel/:channelId', () => {
    test('should return channel info', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          items: [
            {
              id: 'UCtest123',
              snippet: {
                title: 'Test Channel',
                description: 'Test Description',
                thumbnails: {
                  medium: { url: 'http://example.com/thumb.jpg' },
                  high: { url: 'http://example.com/thumb_high.jpg' }
                },
                customUrl: '@testchannel',
                publishedAt: '2020-01-01T00:00:00Z'
              },
              statistics: {
                subscriberCount: '1000',
                videoCount: '10',
                viewCount: '5000'
              }
            }
          ]
        }
      });

      const response = await request(app)
        .get('/api/youtube/channel/UCtest123')
        .set('Cookie', [`token=${token}`])
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.channel).toBeDefined();
    });
  });

  describe('GET /api/youtube/trending', () => {
    test('should return trending videos', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          items: [
            {
              id: 'test-video-id',
              snippet: {
                title: 'Trending Video',
                description: 'Test Description',
                thumbnails: {
                  medium: { url: 'http://example.com/thumb.jpg' },
                  high: { url: 'http://example.com/thumb_high.jpg' }
                },
                channelTitle: 'Test Channel',
                publishedAt: '2023-01-01T00:00:00Z'
              },
              statistics: {
                viewCount: '10000',
                likeCount: '500'
              },
              contentDetails: { duration: 'PT5M' }
            }
          ]
        }
      });

      const response = await request(app)
        .get('/api/youtube/trending')
        .set('Cookie', [`token=${token}`])
        .query({ maxResults: 10 })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.videos).toHaveLength(1);
    });

    test('should use default maxResults when not provided', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          items: []
        }
      });

      const response = await request(app)
        .get('/api/youtube/trending')
        .set('Cookie', [`token=${token}`])
        .query({})
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    test('should handle regionCode parameter', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          items: []
        }
      });

      const response = await request(app)
        .get('/api/youtube/trending')
        .set('Cookie', [`token=${token}`])
        .query({ regionCode: 'US', maxResults: 5 })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });
});
