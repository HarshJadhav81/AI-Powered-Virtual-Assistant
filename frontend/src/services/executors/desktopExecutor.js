import axios from 'axios';

/**
 * Desktop Executor
 * Handles execution on Windows/macOS and Web Fallbacks.
 */
class DesktopExecutor {

    async execute(plan) {
        const { method, actionConfig, payload, platform } = plan;

        if (method === 'web_fallback' || method === 'web_url') {
            return this.executeWebFallback(actionConfig, payload, plan.appName);
        }

        // Native Desktop Logic (Requires Backend)
        return this.executeNative(plan);
    }

    async executeWebFallback(urlTemplate, payload, appName) {
        let finalUrl = urlTemplate;
        if (payload) {
            for (const [key, value] of Object.entries(payload)) {
                finalUrl = finalUrl.replace(`{{${key}}}`, encodeURIComponent(value));
            }
        }
        finalUrl = finalUrl.replace(/\{\{.*?\}\}/g, '');

        console.log(`[DESKTOP-EXECUTOR] Opening Web Fallback: ${finalUrl}`);

        try {
            // Use derived target name to reuse tabs per app
            // e.g. "YouTube" -> "app_youtube", "Instagram" -> "app_instagram"
            const targetName = appName ? `app_${appName.toLowerCase().replace(/\s+/g, '_')}` : '_blank';

            window.open(finalUrl, targetName);
            return {
                success: true,
                message: `Opened ${appName}`,
                executedUrl: finalUrl
            };
        } catch (error) {
            return {
                success: false,
                message: `Pop-up blocked for ${appName}`,
                error: error.message
            };
        }
    }

    async executeNative(plan) {
        // Need to distinguish between "launch app" command and "open settings" command
        // Settings usually use schemes like ms-settings:
        // Regular apps might need backend execution if they don't support schemes

        const { actionConfig, payload, appName, platform } = plan;

        // Perform substitution
        let finalActionConfig = actionConfig;
        if (payload) {
            for (const [key, value] of Object.entries(payload)) {
                finalActionConfig = finalActionConfig.replace(`{{${key}}}`, encodeURIComponent(value));
            }
        }
        finalActionConfig = finalActionConfig.replace(/\{\{.*?\}\}/g, '');

        const isScheme = finalActionConfig.includes(':'); // simple check for protocol

        if (isScheme) {
            // Try protocol handler trick (hidden link)
            return this.executeScheme(finalActionConfig, appName);
        }

        // Else use Backend API to launch process
        try {
            const response = await axios.post('http://localhost:8000/api/apps/launch', {
                appName: appName
            }, { timeout: 5000 });

            if (response.data.success) {
                return {
                    success: true,
                    message: `Launched ${appName}`,
                    platform: platform
                };
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.warn('[DESKTOP-EXECUTOR] Native launch failed, trying web fallback if available');
            return {
                success: false,
                reason: 'execution_failed',
                message: `Could not launch ${appName} on desktop.`,
                error: error.message
            };
        }
    }

    executeScheme(scheme, appName) {
        try {
            const link = document.createElement('a');
            link.href = scheme;
            link.target = '_blank';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return {
                success: true,
                message: `Opening ${appName}`,
                executedUrl: scheme
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to open ${appName}`,
                error: error.message
            };
        }
    }
}

const desktopExecutor = new DesktopExecutor();
export default desktopExecutor;
