/**
 * Android Executor
 * Handles execution of intents on Android devices.
 */
class AndroidExecutor {
    /**
     * Execute an action plan
     * @param {object} plan - The execution plan from IntentRouter
     */
    async execute(plan) {
        const { actionConfig, payload } = plan;
        let finalUrl = actionConfig;

        // Replace placeholders with payload data
        if (payload) {
            for (const [key, value] of Object.entries(payload)) {
                finalUrl = finalUrl.replace(`{{${key}}}`, encodeURIComponent(value));
            }
        }

        // Android Specific: Clean up leftover placeholders if any (optional safety)
        finalUrl = finalUrl.replace(/\{\{.*?\}\}/g, '');

        console.log(`[ANDROID-EXECUTOR] Launching: ${finalUrl}`);

        try {
            // Direct intent launch
            window.location.href = finalUrl;

            // We can't easily feel success/failure in browser JS for custom schemes without a timeout hack
            // But for this architecture, we assume "fire and forget" for deep links
            return {
                success: true,
                message: `Opening ${plan.appName}`,
                executedUrl: finalUrl
            };

        } catch (error) {
            console.error('[ANDROID-EXECUTOR] Error:', error);
            return {
                success: false,
                reason: 'execution_failed',
                message: `Failed to open ${plan.appName}`,
                error: error.message
            };
        }
    }
}

const androidExecutor = new AndroidExecutor();
export default androidExecutor;
