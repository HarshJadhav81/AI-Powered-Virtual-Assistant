/**
 * News API Routes
 * Dedicated routes for news fetching
 * [COPILOT-UPGRADE]: Complete API integration for news
 */

import express from 'express';
import isAuth from '../middlewares/isAuth.js';
import newsService from '../services/newsService.js';
import { cacheMiddleware } from '../utils/cache.enhanced.js';
import logger from '../utils/logger.enhanced.js';
import { asyncHandler } from '../middlewares/errorHandler.enhanced.js';

const router = express.Router();

/**
 * @route   GET /api/news/headlines
 * @desc    Get latest news headlines
 * @access  Private
 */
router.get('/headlines', isAuth,
  cacheMiddleware((req) => {
    const category = req.query.category || 'general';
    const country = req.query.country || 'us';
    return `news:headlines:${category}:${country}`;
  }, 600), // 10 minutes cache
  asyncHandler(async (req, res) => {
    const { category, country, limit } = req.query;

    logger.apiRequest('news', '/headlines', { category, country, limit });
    const startTime = Date.now();

    const result = await newsService.getHeadlines({
      category: category || 'general',
      country: country || 'us',
      limit: limit ? parseInt(limit) : 10
    });

    logger.apiResponse('news', '/headlines', 200, Date.now() - startTime, { count: result.count });

    res.status(200).json({
      success: true,
      news: result.articles,
      count: result.count,
      voiceResponse: result.voiceResponse
    });
  })
);

/**
 * @route   GET /api/news/search
 * @desc    Search news by query
 * @access  Private
 */
router.get('/search', isAuth,
  cacheMiddleware((req) => {
    const query = req.query.q || '';
    const category = req.query.category || 'all';
    return `news:search:${query}:${category}`;
  }, 600), // 10 minutes cache
  asyncHandler(async (req, res) => {
    const { q, category, from, to, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    logger.apiRequest('news', '/search', { q, category, from, to, limit });
    const startTime = Date.now();

    const result = await newsService.searchNews({
      query: q,
      category,
      from,
      to,
      limit: limit ? parseInt(limit) : 10
    });

    logger.apiResponse('news', '/search', 200, Date.now() - startTime, { count: result.count });

    res.status(200).json({
      success: true,
      news: result.articles,
      count: result.count,
      voiceResponse: result.voiceResponse
    });
  })
);

/**
 * @route   GET /api/news/categories
 * @desc    Get available news categories
 * @access  Private
 */
router.get('/categories', isAuth, async (req, res) => {
  try {
    const categories = [
      'general',
      'business',
      'entertainment',
      'health',
      'science',
      'sports',
      'technology'
    ];

    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('[NEWS-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
