import express from 'express';
import appsController from '../controllers/apps.controller.js';

const router = express.Router();

/**
 * @route GET /api/apps/list
 * @desc List installed applications
 * @access Public
 */
router.get('/list', appsController.listApps);

/**
 * @route POST /api/apps/launch
 * @desc Launch an application
 * @access Public (Protected by CORs)
 */
router.post('/launch', appsController.launchApp);

/**
 * @route POST /api/apps/close
 * @desc Close an application
 * @access Public (Protected by CORs)
 */
router.post('/close', appsController.closeApp);

export default router;
