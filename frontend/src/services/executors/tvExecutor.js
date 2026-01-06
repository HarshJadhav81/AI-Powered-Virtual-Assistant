/**
 * TV Executor
 * Handles execution on Android TV / Chromecast devices.
 */
class TvExecutor {
    /**
     * Execute an action plan
     * @param {object} plan - The execution plan from IntentRouter
     */
    async execute(plan) {
        console.log(`[TV-EXECUTOR] Launching: ${plan.appName} on TV`);

        // TV implementation depends heavily on the specific environment (Receiver app vs Sender app)
        // For now, we assume this code runs on a client that can cast or is running directly on TV web view.

        // Fallback to simple window navigation which works on some TV browsers
        // Or integration with Cast SDK would happen here.

        try {
            if (plan.actionConfig.startsWith('http')) {
                window.location.href = plan.actionConfig;
                return {
                    success: true,
                    message: `Opening ${plan.appName} on TV`,
                    executedUrl: plan.actionConfig
                };
            }

            return {
                success: false,
                message: `Native TV app launching for ${plan.appName} is not yet implemented.`,
                error: 'not_implemented'
            };

        } catch (error) {
            console.error('[TV-EXECUTOR] Error:', error);
            return {
                success: false,
                message: `Failed to open ${plan.appName}`,
                error: error.message
            };
        }
    }
}

const tvExecutor = new TvExecutor();
export default tvExecutor;
