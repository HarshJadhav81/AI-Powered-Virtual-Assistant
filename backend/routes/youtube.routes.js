/**
 * YouTube API Routes
 * Dedicated routes for YouTube video search and playback
 * [COPILOT-UPGRADE]: Complete API integration for YouTube functionality
 */

import express from 'express';
import isAuth from '../middlewares/isAuth.js';
import youtubeService from '../services/youtubeService.js';
import { cacheMiddleware } from '../utils/cache.enhanced.js';
import logger from '../utils/logger.enhanced.js';
import { asyncHandler } from '../middlewares/errorHandler.enhanced.js';

const router = express.Router();

/**
 * @route   GET /api/youtube/search
 * @desc    Search for YouTube videos
 * @access  Private
 * @query   q - Search query
 * @query   maxResults - Maximum number of results (default: 10)
 * @query   type - Search type: video, channel, playlist (default: video)
 */
router.get('/search', isAuth,
  cacheMiddleware((req) => {
    const query = req.query.q || '';
    const type = req.query.type || 'video';
    const maxResults = req.query.maxResults || 10;
    return `youtube:search:${type}:${query}:${maxResults}`;
  }, 600), // 10 minutes cache
  asyncHandler(async (req, res) => {
    const { q, maxResults = 10, type = 'video' } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    logger.apiRequest('youtube', '/search', { q, maxResults, type });
    const startTime = Date.now();

    let result;
    if (type === 'channel') {
      result = await youtubeService.searchChannels(q, parseInt(maxResults));
    } else {
      result = await youtubeService.searchVideos(q, parseInt(maxResults));
    }

    logger.apiResponse('youtube', '/search', 200, Date.now() - startTime, { count: result.videos?.length || 0 });

    res.status(200).json(result);
  })
);

/**
 * @route   GET /api/youtube/video/:videoId
 * @desc    Get detailed information about a specific video
 * @access  Private
 */
router.get('/video/:videoId', isAuth, async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: 'Video ID is required'
      });
    }

    const result = await youtubeService.getVideoDetails(videoId);

    res.status(200).json(result);
  } catch (error) {
    console.error('[YOUTUBE-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/youtube/channel/:channelId
 * @desc    Get information about a specific channel
 * @access  Private
 */
router.get('/channel/:channelId', isAuth, async (req, res) => {
  try {
    const { channelId } = req.params;

    if (!channelId) {
      return res.status(400).json({
        success: false,
        error: 'Channel ID is required'
      });
    }

    const result = await youtubeService.getChannelInfo(channelId);

    res.status(200).json(result);
  } catch (error) {
    console.error('[YOUTUBE-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/youtube/trending
 * @desc    Get trending videos
 * @access  Private
 * @query   maxResults - Maximum number of results (default: 10)
 * @query   regionCode - Region code (default: US)
 * @query   category - Category ID (optional)
 */
router.get('/trending', isAuth, async (req, res) => {
  try {
    const { maxResults = 10, regionCode = 'US', category } = req.query;

    const result = await youtubeService.getTrendingVideos(
      parseInt(maxResults),
      regionCode,
      category
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('[YOUTUBE-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/youtube/play
 * @desc    Play a YouTube video (returns video URL and metadata)
 * @access  Private
 * @query   q - Search query or video ID
 */
router.get('/play', isAuth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query or video ID is required'
      });
    }

    // Check if q is a video ID (11 characters) or search query
    let result;
    if (q.length === 11 && /^[a-zA-Z0-9_-]+$/.test(q)) {
      // Direct video ID
      result = await youtubeService.getVideoDetails(q);
    } else {
      // Search query
      const searchResult = await youtubeService.searchVideos(q, 1);
      if (searchResult.success && searchResult.videos.length > 0) {
        const videoId = searchResult.videos[0].videoId;
        result = await youtubeService.getVideoDetails(videoId);
      } else {
        return res.status(404).json({
          success: false,
          error: 'No video found for the query'
        });
      }
    }

    res.status(200).json({
      ...result,
      action: 'play',
      voiceResponse: `Playing ${result.video?.title || 'video'} on YouTube`
    });
  } catch (error) {
    console.error('[YOUTUBE-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/youtube/services
 * @desc    Check YouTube API service status
 * @access  Private
 */
router.get('/services', isAuth, async (req, res) => {
  try {
    const isConfigured = youtubeService.isConfigured();

    res.status(200).json({
      success: true,
      service: 'YouTube Data API v3',
      configured: isConfigured,
      status: isConfigured ? 'available' : 'not configured',
      message: isConfigured
        ? 'YouTube API is configured and ready'
        : 'YouTube API key not configured. Set YOUTUBE_API_KEY in .env file',
      fallback: isConfigured ? null : {
        available: true,
        type: 'web',
        description: 'Opens videos in web browser when API not configured'
      }
    });
  } catch (error) {
    console.error('[YOUTUBE-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
