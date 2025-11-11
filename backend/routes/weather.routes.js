/**
 * Weather API Routes
 * Dedicated routes for weather information
 * [COPILOT-UPGRADE]: Complete API integration for weather
 */

import express from 'express';
import isAuth from '../middlewares/isAuth.js';
import weatherService from '../services/weatherService.js';
import { cacheMiddleware } from '../utils/cache.enhanced.js';
import logger from '../utils/logger.enhanced.js';
import { asyncHandler } from '../middlewares/errorHandler.enhanced.js';

const router = express.Router();

/**
 * @route   GET /api/weather/current
 * @desc    Get current weather for a location
 * @access  Private
 */
router.get('/current', isAuth, 
  cacheMiddleware((req) => {
    const location = req.query.city || `${req.query.lat},${req.query.lon}`;
    return `weather:current:${location}`;
  }, 900), // 15 minutes cache
  asyncHandler(async (req, res) => {
    const { city, lat, lon } = req.query;

    if (!city && (!lat || !lon)) {
      return res.status(400).json({
        success: false,
        error: 'City name or coordinates (lat, lon) are required'
      });
    }

    logger.apiRequest('weather', '/current', { city, lat, lon });
    const startTime = Date.now();

    const result = await weatherService.getCurrentWeather({
      city,
      lat: lat ? parseFloat(lat) : undefined,
      lon: lon ? parseFloat(lon) : undefined
    });

    logger.apiResponse('weather', '/current', 200, Date.now() - startTime, result);

    res.status(200).json({
      success: true,
      weather: result.weather,
      voiceResponse: result.voiceResponse
    });
  })
);

/**
 * @route   GET /api/weather/forecast
 * @desc    Get weather forecast for a location
 * @access  Private
 */
router.get('/forecast', isAuth,
  cacheMiddleware((req) => {
    const location = req.query.city || `${req.query.lat},${req.query.lon}`;
    const days = req.query.days || 5;
    return `weather:forecast:${location}:${days}`;
  }, 900), // 15 minutes cache
  asyncHandler(async (req, res) => {
    const { city, lat, lon, days } = req.query;

    if (!city && (!lat || !lon)) {
      return res.status(400).json({
        success: false,
        error: 'City name or coordinates (lat, lon) are required'
      });
    }

    logger.apiRequest('weather', '/forecast', { city, lat, lon, days });
    const startTime = Date.now();

    const result = await weatherService.getForecast({
      city,
      lat: lat ? parseFloat(lat) : undefined,
      lon: lon ? parseFloat(lon) : undefined,
      days: days ? parseInt(days) : 5
    });

    logger.apiResponse('weather', '/forecast', 200, Date.now() - startTime, result);

    res.status(200).json({
      success: true,
      forecast: result.forecast,
      voiceResponse: result.voiceResponse
    });
  })
);

/**
 * @route   GET /api/weather/alerts
 * @desc    Get weather alerts for a location
 * @access  Private
 */
router.get('/alerts', isAuth,
  cacheMiddleware((req) => {
    const location = req.query.city || `${req.query.lat},${req.query.lon}`;
    return `weather:alerts:${location}`;
  }, 300), // 5 minutes cache for alerts
  asyncHandler(async (req, res) => {
    const { city, lat, lon } = req.query;

    if (!city && (!lat || !lon)) {
      return res.status(400).json({
        success: false,
        error: 'City name or coordinates (lat, lon) are required'
      });
    }

    logger.apiRequest('weather', '/alerts', { city, lat, lon });
    const startTime = Date.now();

    const result = await weatherService.getWeatherAlerts({
      city,
      lat: lat ? parseFloat(lat) : undefined,
      lon: lon ? parseFloat(lon) : undefined
    });

    logger.apiResponse('weather', '/alerts', 200, Date.now() - startTime, result);

    res.status(200).json({
      success: true,
      alerts: result.alerts,
      count: result.count
    });
  })
);

export default router;
