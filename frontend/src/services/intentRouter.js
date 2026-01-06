import platformDetectionService from './platformDetectionService';
import { getAppConfig, AppRegistry } from './appRegistry';
import androidExecutor from './executors/androidExecutor';
import iosExecutor from './executors/iosExecutor';
import desktopExecutor from './executors/desktopExecutor';
import tvExecutor from './executors/tvExecutor';

class IntentRouter {
    constructor() {
        this.platformInfo = platformDetectionService.getPlatformInfo();
        this.executors = {
            android: androidExecutor,
            ios: iosExecutor,
            windows: desktopExecutor,
            macos: desktopExecutor,
            linux: desktopExecutor,
            chromecast: tvExecutor,
            unknown: desktopExecutor
        };
    }

    /**
     * Routes a launch intent to the appropriate executor
     * @param {string} rawAppName - The raw app name intent (e.g. "YouTube History")
     * @param {string} explicitAction - Optional explicit action override
     * @param {object} payload - Additional data
     */
    async routeIntent(rawAppName, explicitAction = null, payload = {}) {
        console.log(`[INTENT-ROUTER] Routing '${explicitAction || 'detect'}' for '${rawAppName}' on ${this.platformInfo.os}`);

        // 1. RESOLVE APP & SECTION from input string (Fuzzy Logic)
        const { appConfig, section, resolvedActionName } = this.resolveAppAndSection(rawAppName, explicitAction);

        if (!appConfig) {
            console.warn(`[INTENT-ROUTER] App '${rawAppName}' not found in registry.`);
            return this.dispatchGenericLaunch(rawAppName);
        }

        // 2. CHECK PLATFORM AVAILABILITY & SELECT METHOD
        const currentPlatform = this.platformInfo.os;
        const isSupportedPlatform = appConfig.platforms.includes(currentPlatform) || appConfig.platforms.includes('web'); // Web always fallback if allowed

        if (!isSupportedPlatform) {
            return {
                success: false,
                reason: 'platform_not_supported',
                message: `${appConfig.appName} is not supported on your device (${currentPlatform}).`,
                appName: appConfig.appName
            };
        }

        // Determine specific execution capabilities for this section
        const sectionConfig = section;
        const isAvailableOnPlatform = sectionConfig ? sectionConfig.availability[currentPlatform] : true; // Default true if root

        // If section found but explicitly marked specific platform false
        if (sectionConfig && !isAvailableOnPlatform) {
            // Try Web Fallback if Native is disabled but Web is enabled
            if (sectionConfig.availability.web && currentPlatform !== 'tv' && this.platformInfo.type !== 'mobile') {
                // On desktop, we prefer web for "unavailable" native sections
                // Proceed to web logic
            } else {
                return {
                    success: false,
                    reason: 'section_not_available',
                    message: `The '${resolvedActionName}' section is not available on ${currentPlatform} for ${appConfig.appName}.`,
                    appName: appConfig.appName
                };
            }
        }

        // 3. CONSTRUCT EXECUTION PLAN
        let executionMethod = 'mobile_deep_link';
        let finalUrl = null;

        if (['android', 'ios'].includes(currentPlatform)) {
            // MOBILE LOGIC
            // Try Section Deep Link provided in systemAction
            if (sectionConfig && sectionConfig.systemAction && sectionConfig.systemAction[currentPlatform]) {
                finalUrl = sectionConfig.systemAction[currentPlatform];
                executionMethod = 'native_deep_link';
            }
            // Try App Root Deep Link
            else if (appConfig.openMethods.system[currentPlatform]) {
                finalUrl = appConfig.openMethods.system[currentPlatform];
                executionMethod = 'native_root_fallback';
                if (sectionConfig) {
                    // We are falling back to root, should we warn?
                    console.log("[INTENT-ROUTER] Section deep link missing, falling back to app root.");
                }
            }
            // Fallback to Web if Native fails? Mobile usually prefers App Store or Root.
            // If webFallback exists, we CAN use it if user accepts browsers
            else if (sectionConfig && sectionConfig.webFallback) {
                finalUrl = sectionConfig.webFallback;
                executionMethod = 'web_fallback';
            }
        } else {
            // DESKTOP / WEB / TV LOGIC
            // Prefer Web URLs
            if (sectionConfig && sectionConfig.webFallback) {
                finalUrl = sectionConfig.webFallback;
                executionMethod = 'web_url';
            } else if (appConfig.openMethods.web) {
                finalUrl = appConfig.openMethods.web;
                executionMethod = 'web_root_fallback';
            } else if (appConfig.openMethods.system[currentPlatform]) {
                // System command (e.g. windows ms-settings or app name)
                finalUrl = appConfig.openMethods.system[currentPlatform];
                executionMethod = 'native_system_command';
            }
        }

        if (!finalUrl) {
            return {
                success: false,
                reason: 'no_execution_method',
                message: `I don't know how to open ${appConfig.appName} on this device yet.`,
                appName: appConfig.appName
            };
        }

        const plan = {
            appName: appConfig.appName,
            platform: currentPlatform,
            method: executionMethod,
            actionConfig: finalUrl,
            payload: payload,
            sectionName: resolvedActionName
        };

        return this.dispatchToExecutor(plan);
    }

    resolveAppAndSection(rawInput, explicitAction) {
        const normalizedInput = rawInput.toLowerCase();

        // 1. Exact Key Match in Registry
        // Check if input starts with an app key (e.g. "youtube history" starts with "youtube")
        for (const appKey in AppRegistry) {
            if (normalizedInput.startsWith(appKey) || normalizedInput.startsWith(AppRegistry[appKey].appName.toLowerCase())) {
                const appConfig = AppRegistry[appKey];

                // Extract potential section name
                // Remove app name from string
                let potentialSection = normalizedInput
                    .replace(appKey, '')
                    .replace(appConfig.appName.toLowerCase(), '')
                    .trim();

                // If explicit action provided, use that
                if (explicitAction) potentialSection = explicitAction.toLowerCase();

                // Look for matching section
                let matchedSection = null;
                let bestTriggerMatch = '';

                if (potentialSection.length > 0) {
                    for (const section of appConfig.sections) {
                        // Check explicit name
                        if (section.name === potentialSection) {
                            matchedSection = section;
                            break;
                        }
                        // Check triggers
                        if (section.voiceTriggers) {
                            const trigger = section.voiceTriggers.find(t => potentialSection.includes(t));
                            if (trigger) {
                                matchedSection = section;
                                break;
                            }
                        }
                    }
                } else {
                    // Default to Home if no section specified
                    matchedSection = appConfig.sections.find(s => s.name === 'home');
                }

                return {
                    appConfig,
                    section: matchedSection,
                    resolvedActionName: matchedSection ? matchedSection.name : 'root'
                };
            }
        }

        return { appConfig: null, section: null, resolvedActionName: null };
    }

    async dispatchGenericLaunch(appName) {
        const executor = this.executors[this.platformInfo.os] || this.executors['unknown'];
        return await executor.execute({
            appName: appName,
            platform: this.platformInfo.os,
            method: 'native_generic',
            actionConfig: appName,
            payload: {}
        });
    }

    async dispatchToExecutor(plan) {
        const executor = this.executors[plan.platform] || this.executors['unknown'];
        if (executor) {
            return await executor.execute(plan);
        }
        return { success: false, message: 'Internal Executor Error' };
    }
}

const intentRouter = new IntentRouter();
export default intentRouter;
