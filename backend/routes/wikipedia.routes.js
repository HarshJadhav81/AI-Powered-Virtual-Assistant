/**
 * Wikipedia API Routes
 * Dedicated routes for Wikipedia information retrieval
 * [COPILOT-UPGRADE]: Complete API integration for Wikipedia queries
 */

import express from 'express';
import isAuth from '../middlewares/isAuth.js';
import wikipediaService from '../services/wikipediaService.js';

const router = express.Router();

/**
 * @route   GET /api/wikipedia/search
 * @desc    Search Wikipedia articles
 * @access  Private
 */
router.get('/search', isAuth, async (req, res) => {
  try {
    const { q, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const result = await wikipediaService.search(q, limit ? parseInt(limit) : 5);

    res.status(200).json({
      success: true,
      results: result.results,
      count: result.count
    });
  } catch (error) {
    console.error('[WIKIPEDIA-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/wikipedia/summary
 * @desc    Get Wikipedia article summary
 * @access  Private
 */
router.get('/summary', isAuth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    const result = await wikipediaService.getSummary(q);

    res.status(200).json({
      success: true,
      summary: result.summary,
      voiceResponse: result.voiceResponse,
      url: result.url
    });
  } catch (error) {
    console.error('[WIKIPEDIA-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/wikipedia/article
 * @desc    Get full Wikipedia article content
 * @access  Private
 */
router.get('/article', isAuth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    const result = await wikipediaService.getArticle(q);

    res.status(200).json({
      success: true,
      article: result.article,
      url: result.url
    });
  } catch (error) {
    console.error('[WIKIPEDIA-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
