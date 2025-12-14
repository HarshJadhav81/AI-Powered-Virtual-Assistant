import appsService from '../services/appsService.js';

/**
 * Controller for handling system application commands
 * Uses AppsService for centralized app management
 */
class AppsController {

    /**
     * List installed applications
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    listApps = async (req, res) => {
        try {
            console.info('[APPS-CONTROLLER] Listing installed applications');
            
            const result = await appsService.listInstalledApps();
            
            if (result.success) {
                return res.json(result);
            } else {
                return res.status(500).json(result);
            }
        } catch (error) {
            console.error('[APPS-CONTROLLER-ERROR]', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to list applications', 
                error: error.message 
            });
        }
    }

    /**
     * Launch an application
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    launchApp = async (req, res) => {
        try {
            const { appName } = req.body;

            if (!appName) {
                return res.status(400).json({ success: false, message: 'App name is required' });
            }

            console.info(`[APPS-CONTROLLER] Launching: ${appName}`);
            
            const result = await appsService.openApp(appName);
            
            if (result.success) {
                return res.json(result);
            } else {
                return res.status(500).json(result);
            }

        } catch (error) {
            console.error('[APPS-CONTROLLER-ERROR]', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }

    /**
     * Close an application
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    closeApp = async (req, res) => {
        try {
            const { appName } = req.body;

            if (!appName) {
                return res.status(400).json({ success: false, message: 'App name is required' });
            }

            console.info(`[APPS-CONTROLLER] Closing: ${appName}`);
            
            const result = await appsService.closeApp(appName);
            
            if (result.success) {
                return res.json(result);
            } else {
                return res.status(500).json(result);
            }

        } catch (error) {
            console.error('[APPS-CONTROLLER-ERROR]', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }
}

export default new AppsController();
