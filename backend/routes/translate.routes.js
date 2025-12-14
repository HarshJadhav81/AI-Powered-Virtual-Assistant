/**
 * Translation API Routes
 * Dedicated routes for text translation
 * [COPILOT-UPGRADE]: Complete API integration for translation functionality
 */

import express from 'express';
import isAuth from '../middlewares/isAuth.js';
import translateService from '../services/translateService.js';
import { cacheMiddleware } from '../utils/cache.enhanced.js';
import logger from '../utils/logger.enhanced.js';
import { asyncHandler } from '../middlewares/errorHandler.enhanced.js';

const router = express.Router();

/**
 * @route   POST /api/translate
 * @desc    Translate text between languages
 * @access  Private
 */
router.post('/', isAuth,
  cacheMiddleware((req) => {
    const text = (req.body.text || '').substring(0, 50);
    const from = req.body.from || 'auto';
    const to = req.body.to || 'en';
    return `translate:${from}:${to}:${text}`;
  }, 86400), // 24 hours cache
  asyncHandler(async (req, res) => {
    const { text, from, to } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text to translate is required'
      });
    }

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Target language is required'
      });
    }

    logger.apiRequest('translate', '/', { textLength: text.length, from, to });
    const startTime = Date.now();

    const result = await translateService.translate(text, to, from);

    logger.apiResponse('translate', '/', 200, Date.now() - startTime, result);

    res.status(200).json(result);
  })
);

/**
 * @route   GET /api/translate/languages
 * @desc    Get list of supported languages
 * @access  Private
 */
router.get('/languages', isAuth,
  cacheMiddleware(() => 'translate:languages', 86400), // 24 hours cache
  asyncHandler(async (req, res) => {
    const { target } = req.query;
    
    logger.apiRequest('translate', '/languages', { target });
    const startTime = Date.now();
    
    const result = await translateService.getSupportedLanguages(target || 'en');
    
    logger.apiResponse('translate', '/languages', 200, Date.now() - startTime, { count: result.languages?.length });
    
    res.status(200).json(result);
  })
);

/**
 * @route   POST /api/translate/detect
 * @desc    Detect language of text
 * @access  Private
 */
router.post('/detect', isAuth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const result = await translateService.detectLanguage(text);

    res.status(200).json(result);
  } catch (error) {
    console.error('[TRANSLATE-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
