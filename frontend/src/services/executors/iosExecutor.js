/**
 * iOS Executor
 * Handles execution of URL schemes on iOS devices.
 */
class IosExecutor {
    /**
     * Execute an action plan
     * @param {object} plan - The execution plan from IntentRouter
     */
    async execute(plan) {
        const { actionConfig, payload } = plan;
        let finalUrl = actionConfig;

        // Replace placeholders
        if (payload) {
            for (const [key, value] of Object.entries(payload)) {
                finalUrl = finalUrl.replace(`{{${key}}}`, encodeURIComponent(value));
            }
        }

        // Cleanup
        finalUrl = finalUrl.replace(/\{\{.*?\}\}/g, '');

        console.log(`[IOS-EXECUTOR] Launching: ${finalUrl}`);

        try {
            // iOS Safari prohibits some automatic redirects, but user-initiated event (tap) 
            // usually allows window.location change. 
            window.location.href = finalUrl;

            return {
                success: true,
                message: `Opening ${plan.appName}`,
                executedUrl: finalUrl
            };
        } catch (error) {
            console.error('[IOS-EXECUTOR] Error:', error);
            return {
                success: false,
                message: `Failed to open ${plan.appName}`,
                error: error.message
            };
        }
    }
}

const iosExecutor = new IosExecutor();
export default iosExecutor;
