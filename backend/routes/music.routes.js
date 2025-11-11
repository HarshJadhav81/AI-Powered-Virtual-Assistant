/**
 * Music API Routes
 * Dedicated routes for music playback control
 * [COPILOT-UPGRADE]: Complete API integration for music functionality
 */

import express from 'express';
import isAuth from '../middlewares/isAuth.js';
import spotifyService from '../services/spotifyService.js';
import { cacheMiddleware } from '../utils/cache.enhanced.js';
import logger from '../utils/logger.enhanced.js';
import { asyncHandler } from '../middlewares/errorHandler.enhanced.js';

const router = express.Router();

/**
 * @route   POST /api/music/play
 * @desc    Play music by name, artist, or URL
 * @access  Private
 */
router.post('/play', isAuth, async (req, res) => {
  try {
    const { query, service, url } = req.body;
    const accessToken = req.headers['x-spotify-token'] || req.body.accessToken;

    if (!query && !url) {
      return res.status(400).json({
        success: false,
        error: 'Song query or URL is required'
      });
    }

    // Use Spotify service if configured
    if (service === 'spotify' || !service) {
      // First search for the track
      const searchResult = await spotifyService.searchTrack(query, accessToken);
      
      if (!searchResult.success) {
        // Return fallback if Spotify not configured
        return res.status(200).json(searchResult);
      }

      // If tracks found, play the first one
      if (searchResult.tracks && searchResult.tracks.length > 0) {
        const playResult = await spotifyService.playTrack(searchResult.tracks[0].uri, accessToken);
        
        return res.status(200).json({
          ...playResult,
          action: 'play-music',
          service: 'spotify',
          track: searchResult.tracks[0]
        });
      }

      return res.status(404).json({
        success: false,
        message: 'No tracks found',
        query
      });
    }

    // Fallback for other services
    const musicService = service || 'youtube-music';
    res.status(200).json({
      success: true,
      action: 'play-music',
      query,
      url,
      service: musicService,
      message: `Playing ${query || 'music'} on ${musicService}`,
      voiceResponse: `Playing ${query || 'your music'}`,
      fallback: true,
      fallbackUrl: `https://music.youtube.com/search?q=${encodeURIComponent(query)}`
    });
  } catch (error) {
    console.error('[MUSIC-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/music/pause
 * @desc    Pause current playback
 * @access  Private
 */
router.post('/pause', isAuth, async (req, res) => {
  try {
    const accessToken = req.headers['x-spotify-token'] || req.body.accessToken;
    const result = await spotifyService.pause(accessToken);
    
    res.status(200).json({
      ...result,
      action: 'pause-music'
    });
  } catch (error) {
    console.error('[MUSIC-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/music/resume
 * @desc    Resume playback
 * @access  Private
 */
router.post('/resume', isAuth, async (req, res) => {
  try {
    const accessToken = req.headers['x-spotify-token'] || req.body.accessToken;
    const result = await spotifyService.resume(accessToken);
    
    res.status(200).json({
      ...result,
      action: 'resume-music'
    });
  } catch (error) {
    console.error('[MUSIC-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/music/next
 * @desc    Skip to next track
 * @access  Private
 */
router.post('/next', isAuth, async (req, res) => {
  try {
    const accessToken = req.headers['x-spotify-token'] || req.body.accessToken;
    const result = await spotifyService.next(accessToken);
    
    res.status(200).json({
      ...result,
      action: 'next-track'
    });
  } catch (error) {
    console.error('[MUSIC-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/music/previous
 * @desc    Go to previous track
 * @access  Private
 */
router.post('/previous', isAuth, async (req, res) => {
  try {
    const accessToken = req.headers['x-spotify-token'] || req.body.accessToken;
    const result = await spotifyService.previous(accessToken);
    
    res.status(200).json({
      ...result,
      action: 'previous-track'
    });
  } catch (error) {
    console.error('[MUSIC-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/music/volume
 * @desc    Set music volume
 * @access  Private
 */
router.post('/volume', isAuth, async (req, res) => {
  try {
    const { level } = req.body;
    const accessToken = req.headers['x-spotify-token'] || req.body.accessToken;

    if (level === undefined || level < 0 || level > 100) {
      return res.status(400).json({
        success: false,
        error: 'Volume level must be between 0 and 100'
      });
    }

    const result = await spotifyService.setVolume(level, accessToken);
    
    res.status(200).json({
      ...result,
      action: 'set-volume',
      level
    });
  } catch (error) {
    console.error('[MUSIC-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/music/services
 * @desc    Get available music services
 * @access  Private
 */
router.get('/services', isAuth, async (req, res) => {
  try {
    const spotifyConfigured = spotifyService.isConfigured();
    
    const services = [
      { id: 'spotify', name: 'Spotify', available: true, configured: spotifyConfigured },
      { id: 'youtube-music', name: 'YouTube Music', available: true, configured: false },
      { id: 'apple-music', name: 'Apple Music', available: false, configured: false },
      { id: 'amazon-music', name: 'Amazon Music', available: false, configured: false },
      { id: 'soundcloud', name: 'SoundCloud', available: false, configured: false }
    ];

    res.status(200).json({
      success: true,
      services,
      recommended: spotifyConfigured ? 'spotify' : 'youtube-music'
    });
  } catch (error) {
    console.error('[MUSIC-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/music/spotify/auth
 * @desc    Get Spotify OAuth URL
 * @access  Private
 */
router.get('/spotify/auth', isAuth, async (req, res) => {
  try {
    const result = spotifyService.getAuthUrl();
    res.status(200).json(result);
  } catch (error) {
    console.error('[SPOTIFY-AUTH-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/music/spotify/callback
 * @desc    Spotify OAuth callback
 * @access  Public
 */
router.get('/spotify/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code missing'
      });
    }

    const result = await spotifyService.exchangeCodeForToken(code);
    
    if (result.success) {
      // Redirect to frontend with tokens
      res.redirect(`${process.env.FRONTEND_URL}/settings?spotify_auth=success&token=${result.accessToken}`);
    } else {
      res.redirect(`${process.env.FRONTEND_URL}/settings?spotify_auth=failed`);
    }
  } catch (error) {
    console.error('[SPOTIFY-CALLBACK-ERROR]:', error);
    res.redirect(`${process.env.FRONTEND_URL}/settings?spotify_auth=error`);
  }
});

/**
 * @route   GET /api/music/current
 * @desc    Get currently playing track
 * @access  Private
 */
router.get('/current', isAuth, async (req, res) => {
  try {
    const accessToken = req.headers['x-spotify-token'];
    const result = await spotifyService.getCurrentlyPlaying(accessToken);
    res.status(200).json(result);
  } catch (error) {
    console.error('[MUSIC-CURRENT-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/music/search
 * @desc    Search for music tracks
 * @access  Private
 */
router.get('/search', isAuth,
  cacheMiddleware((req) => {
    const query = req.query.q || '';
    return `spotify:search:${query}`;
  }, 300), // 5 minutes cache
  asyncHandler(async (req, res) => {
    const { q } = req.query;
    const accessToken = req.headers['x-spotify-token'];
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query required'
      });
    }

    logger.apiRequest('spotify', '/search', { q });
    const startTime = Date.now();

    const result = await spotifyService.searchTrack(q, accessToken);
    
    logger.apiResponse('spotify', '/search', 200, Date.now() - startTime, { count: result.tracks?.length || 0 });
    
    res.status(200).json(result);
  })
);

export default router;
