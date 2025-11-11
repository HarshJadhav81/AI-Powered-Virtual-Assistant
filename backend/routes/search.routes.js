/**
 * Search API Routes
 * Dedicated routes for web search and quick answers
 * [COPILOT-UPGRADE]: Complete API integration for search functionality
 */

import express from 'express';
import isAuth from '../middlewares/isAuth.js';
import searchService from '../services/searchService.js';

const router = express.Router();

/**
 * @route   GET /api/search/web
 * @desc    Perform web search
 * @access  Private
 */
router.get('/web', isAuth, async (req, res) => {
  try {
    const { q, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const result = await searchService.webSearch(q, limit ? parseInt(limit) : 10);

    res.status(200).json({
      success: true,
      results: result.results,
      count: result.count,
      voiceResponse: result.voiceResponse
    });
  } catch (error) {
    console.error('[SEARCH-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/search/quick-answer
 * @desc    Get quick answer for a query
 * @access  Private
 */
router.get('/quick-answer', isAuth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    const result = await searchService.getQuickAnswer(q);

    res.status(200).json({
      success: true,
      answer: result.answer,
      voiceResponse: result.voiceResponse,
      source: result.source
    });
  } catch (error) {
    console.error('[SEARCH-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/search/images
 * @desc    Search for images
 * @access  Private
 */
router.get('/images', isAuth, async (req, res) => {
  try {
    const { q, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const result = await searchService.imageSearch(q, limit ? parseInt(limit) : 10);

    res.status(200).json({
      success: true,
      images: result.images,
      count: result.count
    });
  } catch (error) {
    console.error('[SEARCH-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/search/news
 * @desc    Search for news articles
 * @access  Private
 */
router.get('/news', isAuth, async (req, res) => {
  try {
    const { q, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const result = await searchService.newsSearch(q, limit ? parseInt(limit) : 10);

    res.status(200).json({
      success: true,
      news: result.news,
      count: result.count
    });
  } catch (error) {
    console.error('[SEARCH-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
