import express from "express";
import isAuth from "../middlewares/isAuth.js";
import gmailService from "../services/gmailService.js";

const gmailRouter = express.Router();

/**
 * GET /api/gmail/auth
 * Get Gmail OAuth authorization URL
 */
gmailRouter.get("/auth", isAuth, async (req, res, next) => {
  try {
    const result = gmailService.getAuthUrl();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/gmail/callback
 * OAuth callback endpoint - exchanges code for tokens
 * Query params: code, state
 */
gmailRouter.get("/callback", async (req, res, next) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Authorization code not provided"
      });
    }

    const result = await gmailService.exchangeCodeForToken(code);
    
    if (result.success) {
      // Store tokens in session or return to frontend
      // For now, redirect with success message
      res.redirect(`/gmail-connected?success=true&token=${result.accessToken}`);
    } else {
      res.redirect(`/gmail-connected?success=false&error=${encodeURIComponent(result.error)}`);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/gmail/unread
 * Get unread email count
 */
gmailRouter.get("/unread", isAuth, async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: "Access token required"
      });
    }

    const result = await gmailService.getUnreadCount(accessToken);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/gmail/recent
 * Get recent emails
 * Query params: maxResults (default: 5)
 */
gmailRouter.get("/recent", isAuth, async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    const maxResults = parseInt(req.query.maxResults) || 5;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: "Access token required"
      });
    }

    const result = await gmailService.getRecentEmails(accessToken, maxResults);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/gmail/search
 * Search emails
 * Query params: q (query string)
 */
gmailRouter.get("/search", isAuth, async (req, res, next) => {
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

    const result = await gmailService.searchEmails(accessToken, query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/gmail/send
 * Send an email
 * Body: { to, subject, body, cc?, bcc? }
 */
gmailRouter.post("/send", isAuth, async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: "Access token required"
      });
    }

    const emailData = req.body;
    
    if (!emailData.to || !emailData.subject) {
      return res.status(400).json({
        success: false,
        error: "Recipient and subject are required"
      });
    }

    const result = await gmailService.sendEmail(accessToken, emailData);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/gmail/messages/:messageId/read
 * Mark email as read
 */
gmailRouter.patch("/messages/:messageId/read", isAuth, async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    const { messageId } = req.params;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: "Access token required"
      });
    }

    const result = await gmailService.markAsRead(accessToken, messageId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/gmail/messages/:messageId
 * Delete email (move to trash)
 */
gmailRouter.delete("/messages/:messageId", isAuth, async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    const { messageId } = req.params;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: "Access token required"
      });
    }

    const result = await gmailService.deleteEmail(accessToken, messageId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/gmail/fallback
 * Get fallback URL (Gmail web)
 */
gmailRouter.get("/fallback", async (req, res) => {
  const result = gmailService.getFallbackUrl();
  res.status(200).json(result);
});

export default gmailRouter;
