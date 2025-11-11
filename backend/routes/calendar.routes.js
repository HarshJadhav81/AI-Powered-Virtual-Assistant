import express from "express";
import isAuth from "../middlewares/isAuth.js";
import calendarService from "../services/calendarService.js";

const calendarRouter = express.Router();

/**
 * GET /api/calendar/auth
 * Get Google Calendar OAuth authorization URL
 */
calendarRouter.get("/auth", isAuth, async (req, res, next) => {
  try {
    const result = calendarService.getAuthUrl();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/calendar/callback
 * OAuth callback endpoint - exchanges code for tokens
 * Query params: code, state
 */
calendarRouter.get("/callback", async (req, res, next) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Authorization code not provided"
      });
    }

    const result = await calendarService.exchangeCodeForToken(code);
    
    if (result.success) {
      // Store tokens in session or return to frontend
      // For now, redirect with success message
      res.redirect(`/calendar-connected?success=true&token=${result.accessToken}`);
    } else {
      res.redirect(`/calendar-connected?success=false&error=${encodeURIComponent(result.error)}`);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/calendar/events/today
 * Get today's calendar events
 */
calendarRouter.get("/events/today", isAuth, async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: "Access token required"
      });
    }

    const result = await calendarService.getTodayEvents(accessToken);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/calendar/events/upcoming
 * Get upcoming calendar events
 * Query params: days (default: 7)
 */
calendarRouter.get("/events/upcoming", isAuth, async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    const days = parseInt(req.query.days) || 7;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: "Access token required"
      });
    }

    const result = await calendarService.getUpcomingEvents(accessToken, days);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/calendar/events
 * Create a new calendar event
 * Body: { title, startTime, endTime, description, location }
 */
calendarRouter.post("/events", isAuth, async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: "Access token required"
      });
    }

    const eventDetails = req.body;
    const result = await calendarService.createEvent(accessToken, eventDetails);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/calendar/events/:eventId
 * Delete a calendar event
 */
calendarRouter.delete("/events/:eventId", isAuth, async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    const { eventId } = req.params;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: "Access token required"
      });
    }

    const result = await calendarService.deleteEvent(accessToken, eventId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/calendar/events/search
 * Search calendar events
 * Query params: q (query string)
 */
calendarRouter.get("/events/search", isAuth, async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    const query = req.query.q;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: "Access token required"
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Search query required"
      });
    }

    const result = await calendarService.searchEvents(accessToken, query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/calendar/fallback
 * Get fallback URL (Google Calendar web)
 */
calendarRouter.get("/fallback", async (req, res) => {
  const result = calendarService.getFallbackUrl();
  res.status(200).json(result);
});

export default calendarRouter;
