/**
 * Local Intent Service
 * Provides offline intent detection for the frontend
 */
class LocalIntentService {
    constructor() {
        // [SMART-REGEX] Matches: (Optional: please/can you) (Action) (Optional: the/my/this) (App Name) (Optional: app/application)
        const politePrefix = `(?:please|can you|could you|would you|kindly|just)?`;
        const actionOpen = `(?:open|launch|start|run|go to|show|activate|play)`;
        const actionClose = `(?:close|quit|exit|kill|stop|terminate|end)`;
        const articles = `(?:the|my|a|an|this|that)?`;
        const suffix = `(?:app|application|program|software)?`;

        this.patterns = {
            'app-launch': {
                // Regex Breakdown:
                // 1. Start of string
                // 2. Optional polite prefix + space
                // 3. Action word (open/launch)
                // 4. Required space
                // 5. Optional article (the/my) + space
                // 6. CAPTURE GROUP 1: The App Name (greedy)
                // 7. Optional suffix (app)
                // 8. End of string
                regex: new RegExp(`^${politePrefix}\\s*${actionOpen}\\s+${articles}\\s*(.+?)\\s*${suffix}$`, 'i'),
                handler: 'handleAppLaunch'
            },
            'app-close': {
                regex: new RegExp(`^${politePrefix}\\s*${actionClose}\\s+${articles}\\s*(.+?)\\s*${suffix}$`, 'i'),
                handler: 'handleAppClose'
            }
        };

        // [AI-LIKE-MAPPING] Massive alias map to mimic AI understanding
        this.appMap = {
            // General Tools
            'calc': 'calculator',
            'calculator': 'calculator',
            'cal': 'calendar',
            'calendar': 'calendar',
            'settings': 'system settings',
            'preferences': 'system settings',
            'control panel': 'system settings',
            'task manager': 'activity monitor',
            'activity monitor': 'activity monitor',
            'finder': 'finder',
            'files': 'finder',
            'explorer': 'finder', // Windows user habit on Mac
            'file explorer': 'finder',
            'terminal': 'terminal',
            'console': 'terminal',
            'command prompt': 'terminal',
            'cmd': 'terminal',
            'notes': 'notes',
            'notepad': 'textedit',
            'textedit': 'textedit',
            'reminders': 'reminders',
            'todo': 'reminders',
            'contacts': 'contacts',
            'address book': 'contacts',
            'photos': 'photos',
            'gallery': 'photos',
            'images': 'photos',
            'camera': 'photobooth',
            'webcam': 'photobooth',

            // Browsers / Internet
            'chrome': 'google chrome',
            'google chrome': 'google chrome',
            'safari': 'safari',
            'firefox': 'firefox',
            'mozilla': 'firefox',
            'edge': 'microsoft edge',
            'browser': 'google chrome', // Default assumption
            'internet': 'google chrome',
            'web': 'google chrome',

            // Communication
            'mail': 'mail',
            'email': 'mail',
            'gmail': 'google chrome', // Often just a website, but user might mean app
            'outlook': 'microsoft outlook',
            'messages': 'messages',
            'imessage': 'messages',
            'sms': 'messages',
            'text': 'messages',
            'whatsapp': 'whatsapp',
            'telegram': 'telegram',
            'zoom': 'zoom',
            'slack': 'slack',
            'discord': 'discord',
            'teams': 'microsoft teams',
            'skype': 'skype',
            'facetime': 'facetime',

            // Media / Entertainment
            'music': 'music',
            'apple music': 'music',
            'spotify': 'spotify',
            'youtube': 'youtube', // Web app handled by AppLaunchService
            'vlc': 'vlc',
            'player': 'quicktime player',
            'quicktime': 'quicktime player',
            'movie': 'tv',
            'tv': 'tv',
            'netflix': 'safari', // Usually web

            // Development
            'code': 'visual studio code',
            'vscode': 'visual studio code',
            'visual studio code': 'visual studio code',
            'sublime': 'sublime text',
            'xcode': 'xcode',
            'intellij': 'intellij idea',
            'pycharm': 'pycharm',
            'git': 'terminal',
            'github': 'github desktop',
            'docker': 'docker desktop',
            'postman': 'postman',

            // Productivity
            'word': 'microsoft word',
            'ms word': 'microsoft word',
            'excel': 'microsoft excel',
            'sheets': 'microsoft excel',
            'powerpoint': 'microsoft powerpoint',
            'slides': 'microsoft powerpoint',
            'pages': 'pages',
            'numbers': 'numbers',
            'keynote': 'keynote'
        };

        // [CONTEXT-AWARE] Pending app search context
        this.pendingAppSearch = null;
        this.pendingSearchTimeout = null;
    }

    /**
     * Set a pending app that failed to launch
     * Allows the user to say "Yes", "Install it", or "Search on Chrome"
     */
    setPendingAppSearch(appName) {
        if (this.pendingSearchTimeout) clearTimeout(this.pendingSearchTimeout);

        console.log('[LOCAL-INTENT] Setting pending search context for:', appName);
        this.pendingAppSearch = appName;

        // Clear context after 15 seconds
        this.pendingSearchTimeout = setTimeout(() => {
            console.log('[LOCAL-INTENT] Clearing pending search context');
            this.pendingAppSearch = null;
        }, 15000);
    }

    checkIntent(transcript) {
        if (!transcript) return null;

        // Pre-normalize: remove extra spaces, lowercase
        const normalized = transcript.trim().toLowerCase()
            .replace(/[.,!?;:]/g, ''); // Remove punctuation

        // [CONTEXT-AWARE] Check based on pending context
        if (this.pendingAppSearch) {
            // Check for "Yes" / "Install" (Store Intent)
            if (/^(yes|sure|okay|yep|yeah|install|get it|download)$/i.test(normalized) ||
                normalized.includes('store') || normalized.includes('install')) {

                const appName = this.pendingAppSearch;
                this.pendingAppSearch = null; // Consume context

                return {
                    type: 'app-launch',
                    action: 'app-launch',
                    userInput: transcript,
                    metadata: { appName, mode: 'store-search' },
                    response: `Opening store for ${appName}`,
                    source: 'local-context'
                };
            }

            // Check for "Chrome" / "Search" (Web Search Intent)
            if (/^(no|search|google|chrome|web|online|browser)$/i.test(normalized) ||
                normalized.includes('search') || normalized.includes('chrome')) {

                const appName = this.pendingAppSearch;
                this.pendingAppSearch = null; // Consume context

                return {
                    type: 'web-search',
                    action: 'web-search',
                    userInput: transcript,
                    result: { url: `https://www.google.com/search?q=${appName}` },
                    response: `Searching for ${appName} on Chrome`,
                    source: 'local-context'
                };
            }
        }

        for (const [type, config] of Object.entries(this.patterns)) {
            const match = normalized.match(config.regex);
            if (match) {
                // match[1] should be the app name based on our new regex structure
                if (type === 'app-launch') {
                    return this.handleAppLaunch(match, transcript);
                }
                if (type === 'app-close') {
                    return this.handleAppClose(match, transcript);
                }
            }
        }
        return null;
    }

    cleanAppName(rawName) {
        let name = rawName.trim();

        // Remove common "noise" that might have slipped through or wasn't caught by non-greedy regex
        name = name.replace(/^(the|my|a|an|this|that)\s+/i, '');

        // Check alias map
        if (this.appMap[name]) {
            return this.appMap[name];
        }

        return name;
    }

    handleAppLaunch(match, originalInput) {
        const rawAppName = match[1];
        const appName = this.cleanAppName(rawAppName);

        return {
            type: 'app-launch',
            action: 'app-launch', // Compatible with Home.jsx
            userInput: originalInput,
            metadata: { appName },
            response: `Opening ${appName}`,
            source: 'local-smart'
        };
    }

    handleAppClose(match, originalInput) {
        const rawAppName = match[1];
        const appName = this.cleanAppName(rawAppName);

        return {
            type: 'app-close',
            action: 'app-close', // Compatible with Home.jsx
            userInput: originalInput,
            metadata: { appName },
            response: `Closing ${appName}`,
            source: 'local-smart'
        };
    }
}

const localIntentService = new LocalIntentService();
export default localIntentService;
