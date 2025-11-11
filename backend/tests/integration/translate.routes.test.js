/**
 * Integration Tests for Translate Routes
 */

import request from 'supertest';
import express from 'express';
import translateRoutes from '../../routes/translate.routes.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/translate', translateRoutes);

describe('Translate Routes', () => {
  describe('POST /api/translate', () => {
    test('should return 400 for empty text', async () => {
      const response = await request(app)
        .post('/api/translate')
        .send({ text: '', targetLang: 'es' })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 for missing target language', async () => {
      const response = await request(app)
        .post('/api/translate')
        .send({ text: 'Hello' })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should return translation or fallback', async () => {
      const response = await request(app)
        .post('/api/translate')
        .send({ 
          text: 'Hello, how are you?', 
          targetLang: 'es',
          sourceLang: 'en'
        })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });

    test('should handle auto-detect source language', async () => {
      const response = await request(app)
        .post('/api/translate')
        .send({ 
          text: 'Hello', 
          targetLang: 'es'
        })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('POST /api/translate/detect', () => {
    test('should return 400 for empty text', async () => {
      const response = await request(app)
        .post('/api/translate/detect')
        .send({ text: '' })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should detect language', async () => {
      const response = await request(app)
        .post('/api/translate/detect')
        .send({ text: 'Hello, how are you?' })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('GET /api/translate/languages', () => {
    test('should return list of supported languages', async () => {
      const response = await request(app)
        .get('/api/translate/languages')
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('languages');
      expect(Array.isArray(response.body.languages)).toBe(true);
      expect(response.body.languages.length).toBeGreaterThan(0);
    });

    test('should return languages with code and name', async () => {
      const response = await request(app)
        .get('/api/translate/languages')
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body.languages[0]).toHaveProperty('code');
      expect(response.body.languages[0]).toHaveProperty('name');
    });
  });
});
