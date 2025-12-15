/**
 * Fast Intent Detection Service
 * Provides instant intent detection using local pattern matching
 * Falls back to Gemini AI only for complex queries
 * 
 * [ENHANCED] Incremental NLU: Predicts intent from partial transcripts
 * [ENHANCED] Numeric confidence scoring (0.0-1.0)
 * [ENHANCED] Prefix matching for early action triggers
 * 
 * Performance: <50ms for 80% of common queries
 */

class FastIntentService {
    constructor() {
        // Pattern-based intent detection
        // [ENHANCED] Added prefix patterns for partial matching
        this.patterns = {
            // Greetings
            'greeting': {
                patterns: [
                    /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|namaste|namaskar)/i,
                ],
                responses: [
                    'Hello! How can I help you today?',
                    'Hi there! What can I do for you?',
                    'Hey! How may I assist you?',
                ]
            },

            // Gratitude
            'thanks': {
                patterns: [
                    /^(thanks|thank you|thx|appreciate|grateful)/i,
                ],
                responses: [
                    'You\'re welcome!',
                    'Happy to help!',
                    'Anytime!',
                ]
            },

            // Time queries
            'get-time': {
                patterns: [
                    /what.*time|current time|time now|tell.*time|what's the time/i,
                ],
                handler: 'handleGetTime'
            },

            // Date queries
            'get-date': {
                patterns: [
                    /what.*date|today's date|current date|what day is it|today is/i,
                ],
                handler: 'handleGetDate'
            },

            // Day queries
            'get-day': {
                patterns: [
                    /what day|which day|day of week|day today/i,
                ],
                handler: 'handleGetDay'
            },

            // Month queries
            'get-month': {
                patterns: [
                    /what month|current month|which month/i,
                ],
                handler: 'handleGetMonth'
            },

            // Weather queries
            'weather-show': {
                patterns: [
                    /weather|temperature|forecast|how.*hot|how.*cold|raining|sunny/i,
                ],
                responses: ['Let me check the weather for you.']
            },

            // Google search
            'google-search': {
                patterns: [
                    /google|search for|look up|find.*on google/i,
                ],
                responses: ['Searching on Google for you.']
            },

            // YouTube
            'youtube-search': {
                patterns: [
                    /youtube|search.*video|find.*video/i,
                ],
                responses: ['Searching YouTube for you.']
            },

            'youtube-play': {
                patterns: [
                    /play.*on youtube|play.*video|play.*song|play.*music on youtube/i,
                ],
                responses: ['Playing on YouTube now.']
            },

            // Social media
            'instagram-open': {
                patterns: [
                    /open instagram|launch instagram|instagram app/i,
                ],
                responses: ['Opening Instagram for you.']
            },

            'facebook-open': {
                patterns: [
                    /open facebook|launch facebook|facebook app/i,
                ],
                responses: ['Opening Facebook for you.']
            },

            // Calculator
            'calculator-open': {
                patterns: [
                    /calculator|calculate|open calc/i,
                ],
                responses: ['Opening calculator.']
            },

            // News
            'read-news': {
                patterns: [
                    /news|headlines|latest news|read.*news|what's happening/i,
                ],
                responses: ['Fetching the latest news for you.']
            },

            // Wikipedia
            'wikipedia-query': {
                patterns: [
                    /who is|who was|what is|what are|tell me about|explain|define/i,
                ],
                responses: ['Let me find that information for you.']
            },

            // Web search (for current information)
            'web-search': {
                patterns: [
                    /search|find information|look for|current.*news|latest/i,
                ],
                responses: ['Searching the web for you.']
            },

            // Music
            'play-music': {
                patterns: [
                    /play music|play song|music|song/i,
                ],
                responses: ['Playing music for you.']
            },

            // Notes
            'take-note': {
                patterns: [
                    /take.*note|make.*note|write.*note|note down|remember this/i,
                ],
                responses: ['Taking a note for you.']
            },

            // Reminders
            'set-reminder': {
                patterns: [
                    /remind me|set.*reminder|reminder for/i,
                ],
                responses: ['Setting a reminder for you.']
            },

            // Alarms
            'set-alarm': {
                patterns: [
                    /set.*alarm|alarm for|wake me/i,
                ],
                responses: ['Setting an alarm for you.']
            },

            // Volume control
            'volume-control': {
                patterns: [
                    /volume|increase volume|decrease volume|mute|unmute|louder|quieter/i,
                ],
                responses: ['Adjusting volume.']
            },

            // Brightness control
            'brightness-control': {
                patterns: [
                    /brightness|increase brightness|decrease brightness|brighter|dimmer/i,
                ],
                responses: ['Adjusting brightness.']
            },

            // Screenshot
            'screenshot': {
                patterns: [
                    /screenshot|capture screen|take.*screenshot/i,
                ],
                responses: ['Taking a screenshot.']
            },

            // Translation
            'translate': {
                patterns: [
                    /translate|translation|how do you say/i,
                ],
                responses: ['Translating for you.']
            },

            // Email
            'email-send': {
                patterns: [
                    /send.*email|email.*to|compose email/i,
                ],
                responses: ['Composing email.']
            },

            // WhatsApp
            'whatsapp-send': {
                patterns: [
                    /whatsapp|send.*whatsapp|message.*whatsapp/i,
                ],
                responses: ['Opening WhatsApp.']
            },

            // Phone call
            'call-contact': {
                patterns: [
                    /call|phone|dial|ring/i,
                ],
                responses: ['Making a call.']
            },

            // Close App
            'app-close': {
                patterns: [
                    /(?:^|\s)(close|quit|exit|kill|stop)(\s+(application|app|process))?\s+(.+)$/i,
                ],
                handler: 'handleAppClose'
            },

            // Voice Control - Change Voice
            'change-voice': {
                patterns: [
                    /change.*voice|switch.*voice|use.*voice|different voice|voice.*to (male|female)|make.*voice (male|female|softer|deeper|british|american)/i,
                ],
                responses: ['Changing voice for you.']
            },

            // Voice Control - List Voices
            'list-voices': {
                patterns: [
                    /list.*voices|show.*voices|available voices|what voices|voice options/i,
                ],
                responses: ['Here are the available voices.']
            },

            // Voice Control - Preview Voice
            'preview-voice': {
                patterns: [
                    /preview.*voice|test.*voice|try.*voice|sample.*voice|hear.*voice/i,
                ],
                responses: ['Playing voice preview.']
            },

            // Voice Control - Reset Voice
            'reset-voice': {
                patterns: [
                    /reset.*voice|default voice|original voice|normal voice/i,
                ],
                responses: ['Resetting voice to default.']
            },

            // System App Launch (Universal)
            'app-launch': {
                patterns: [
                    // Matches: open/launch/start/go to [app name]
                    // Covers common system apps across Mac, Windows, Android, iOS
                    // [UPDATED]: Added optional (application|app) support
                    // [UPDATED]: Relaxed start anchor to allow wake words (e.g., "Jarvis open calendar")
                    /(?:^|\s)(open|launch|start|go to|show)(\s+(application|app))?\s+(settings|calendar|calculator|clock|notes|reminders|weather|maps|photos|gallery|camera|music|spotify|youtube|mail|email|messages|sms|contacts|phone|facetime|zoom|whatsapp|telegram|browser|chrome|safari|edge|firefox|files|explorer|finder|app store|play store|terminal|command prompt|task manager|control panel)$/i,
                ],
                handler: 'handleAppLaunch'
            },

            // Device Control (Smart Home)
            'device-control': {
                patterns: [
                    /turn (on|off) (the )?(.+)/i,
                    /switch (on|off) (the )?(.+)/i,
                    /(enable|disable) (the )?(.+)/i,
                    /set (the )?(.+) to (\d+)%/i
                ],
                responses: ['I would need to be connected to your smart home hub for that, but I can try.', 'Sending command to device.']
            },

            // --- LOCAL CONVERSATION (API SAVER) ---

            // Status Check
            'status-check': {
                patterns: [
                    /how are you|how.*doing|what's up|how do you do|are you okay/i,
                ],
                responses: [
                    "I'm doing great, thanks for asking! Ready to help you.",
                    "All systems operational and ready to assist.",
                    "I'm functioning perfectly! How can I help you today?"
                ]
            },

            // Identity
            'identity': {
                patterns: [
                    /who are you|what is your name|who made you|who created you/i,
                ],
                responses: [
                    "I am Orvion, your advanced virtual assistant created by Harshal.",
                    "My name is Orvion. I was built by Harshal to assist you.",
                    "I'm Orvion, an AI assistant designed to help with your daily tasks."
                ]
            },

            // Capabilities / Help
            'capabilities': {
                patterns: [
                    /what can you do|help me|what are your features|how do you work/i,
                ],
                responses: [
                    "I can help you open apps, play music, check the weather, answer questions, and much more. Just ask!",
                    "I can control your device, find information, manage your schedule, and answer your queries. Try saying 'Open Calculator' or 'What's the weather?'.",
                    "I'm here to help with tasks like opening applications, searching the web, or just chatting. What do you need?"
                ]
            },

            // Compliments
            'compliment': {
                patterns: [
                    /good job|well done|you are smart|you.*intelligent|you.*awesome|nice work/i,
                ],
                responses: [
                    "Thank you! I appreciate that.",
                    "Thanks! I try my best.",
                    "That's very kind of you to say!"
                ]
            },

            // Error Inquiry (Self-diagnosis)
            'error-inquiry': {
                patterns: [
                    /why.*error|what happened|why.*trouble connecting|why.*not working|fix.*problem/i,
                ],
                responses: [
                    "If I mentioned trouble connecting, I might have reached my usage limit for the moment. Please give me a minute to recharge.",
                    "I might be experiencing some network or quota limits. I can still help you with local tasks like opening apps!",
                    "It seems I hit a temporary limit. Try asking me to open an app like Calculator or Settings - I can do that without the internet!"
                ]
            },
        };

        // Simple math patterns
        this.mathPattern = /^[\d\s+\-*/().]+$/;

        // [NEW] Prefix patterns for incremental NLU
        this.prefixPatterns = {
            'play': { intents: ['play-music', 'youtube-play'], confidence: 0.6 },
            'play music': { intents: ['play-music'], confidence: 0.8 },
            'play song': { intents: ['play-music'], confidence: 0.8 },
            'play video': { intents: ['youtube-play'], confidence: 0.8 },
            'search': { intents: ['google-search', 'web-search'], confidence: 0.6 },
            'search for': { intents: ['google-search'], confidence: 0.75 },
            'google': { intents: ['google-search'], confidence: 0.7 },
            'what': { intents: ['wikipedia-query', 'quick-answer'], confidence: 0.5 },
            'what is': { intents: ['wikipedia-query'], confidence: 0.7 },
            'who is': { intents: ['wikipedia-query'], confidence: 0.8 },
            'tell me': { intents: ['wikipedia-query', 'general'], confidence: 0.6 },
            'tell me about': { intents: ['wikipedia-query'], confidence: 0.8 },
            'weather': { intents: ['weather-show'], confidence: 0.85 },
            'news': { intents: ['read-news'], confidence: 0.85 },
            'open': { intents: ['app-launch'], confidence: 0.8 }, // Increased confidence for generic open
            'launch': { intents: ['app-launch'], confidence: 0.8 },
            'set alarm': { intents: ['set-alarm'], confidence: 0.8 },
            'remind': { intents: ['set-reminder'], confidence: 0.7 },
            'send': { intents: ['whatsapp-send', 'email-send'], confidence: 0.5 },
            'call': { intents: ['call-contact'], confidence: 0.75 },
            // New conversational prefixes
            'who': { intents: ['identity', 'wikipedia-query'], confidence: 0.6 },
            'how': { intents: ['status-check', 'wikipedia-query'], confidence: 0.5 },
            'why': { intents: ['error-inquiry', 'wikipedia-query'], confidence: 0.6 },
            'help': { intents: ['capabilities'], confidence: 0.9 },
            // Device Control Prefixes
            'turn': { intents: ['device-control'], confidence: 0.7 },
            'switch': { intents: ['device-control'], confidence: 0.7 },
            'enable': { intents: ['device-control'], confidence: 0.7 },
            'disable': { intents: ['device-control'], confidence: 0.7 },
        };
    }

    /**
     * Detect intent using fast local patterns
     * Returns null if no match found (fallback to Gemini)
     */
    detectIntent(command) {
        const normalizedCommand = command.toLowerCase().trim();

        // Check for simple math
        if (this.mathPattern.test(normalizedCommand)) {
            try {
                const result = eval(normalizedCommand);
                return {
                    type: 'general',
                    userInput: command,
                    response: `The answer is ${result}`,
                    confidence: 0.95,
                    source: 'fast-intent'
                };
            } catch (e) {
                // Invalid math, continue to pattern matching
            }
        }

        // Pattern matching
        for (const [intentType, config] of Object.entries(this.patterns)) {
            for (const pattern of config.patterns) {
                if (pattern.test(normalizedCommand)) {
                    // If handler exists, call it
                    if (config.handler && this[config.handler]) {
                        return this[config.handler](command);
                    }

                    // Otherwise return with random response
                    const response = Array.isArray(config.responses)
                        ? config.responses[Math.floor(Math.random() * config.responses.length)]
                        : config.responses;

                    return {
                        type: intentType,
                        userInput: command,
                        response: response,
                        confidence: 0.9, // High confidence for exact pattern match
                        source: 'fast-intent'
                    };
                }
            }
        }

        // No match found - return null to trigger Gemini fallback
        return null;
    }

    /**
     * [NEW] Detect intent from partial transcript (Incremental NLU)
     * Returns predicted intent with confidence before sentence completes
     */
    detectPartialIntent(partialTranscript) {
        const normalized = partialTranscript.toLowerCase().trim();

        // Match against prefix patterns
        let bestMatch = null;
        let longestMatchLength = 0;

        Object.entries(this.prefixPatterns).forEach(([prefix, data]) => {
            if (normalized.startsWith(prefix) && prefix.length > longestMatchLength) {
                longestMatchLength = prefix.length;
                bestMatch = {
                    intents: data.intents,
                    confidence: data.confidence,
                    matchedPrefix: prefix
                };
            }
        });

        if (bestMatch) {
            return {
                type: bestMatch.intents[0], // Primary intent
                alternativeIntents: bestMatch.intents.slice(1),
                userInput: partialTranscript,
                confidence: bestMatch.confidence,
                isPartial: true,
                matchedPrefix: bestMatch.matchedPrefix,
                source: 'incremental-nlu'
            };
        }

        return null;
    }

    /**
     * Get instant response for common queries
     */
    getInstantResponse(command) {
        const intent = this.detectIntent(command);
        if (intent && intent.confidence >= 0.8) {
            return intent;
        }
        return null;
    }

    // Handler methods for dynamic responses
    handleGetTime(command) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        return {
            type: 'get-time',
            userInput: command,
            response: `The current time is ${timeString}`,
            metadata: { time: timeString },
            confidence: 0.95,
            source: 'fast-intent'
        };
    }

    handleGetDate(command) {
        const now = new Date();
        const dateString = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return {
            type: 'get-date',
            userInput: command,
            response: `Today is ${dateString}`,
            metadata: { date: dateString },
            confidence: 0.95,
            source: 'fast-intent'
        };
    }

    handleGetDay(command) {
        const now = new Date();
        const dayString = now.toLocaleDateString('en-US', { weekday: 'long' });

        return {
            type: 'get-day',
            userInput: command,
            response: `Today is ${dayString}`,
            metadata: { day: dayString },
            confidence: 0.95,
            source: 'fast-intent'
        };
    }


    handleGetMonth(command) {
        const now = new Date();
        const monthString = now.toLocaleDateString('en-US', { month: 'long' });

        return {
            type: 'get-month',
            userInput: command,
            response: `The current month is ${monthString}`,
            metadata: { month: monthString },
            confidence: 0.95,
            source: 'fast-intent'
        };
    }

    handleAppLaunch(command) {
        // Extract app name from command
        // [UPDATED]: Updated regex to handle "application" or "app" optional keywords
        const match = command.match(/(?:^|\s)(open|launch|start|go to|show)(\s+(application|app))?\s+(.+)$/i);
        let appName = match ? match[4].trim().toLowerCase() : 'app';

        // Normalization map for common variations
        const appMap = {
            'calc': 'calculator',
            'mail': 'email',
            'sms': 'messages',
            'explorer': 'files',
            'finder': 'files',
            'gallery': 'photos',
            'play store': 'app store',
            'command prompt': 'terminal'
        };

        if (appMap[appName]) {
            appName = appMap[appName];
        }

        return {
            type: 'app-launch',
            userInput: command,
            response: `Opening ${appName}.`,
            confidence: 0.95,
            source: 'fast-intent',
            metadata: {
                app: appName,
                appName: appName
            }
        };
    }

    handleAppClose(command) {
        // Extract app name from command
        // Matches: close/quit/exit [optional: app] [app name]
        const match = command.match(/(?:^|\s)(close|quit|exit|kill|stop)(\s+(application|app|process))?\s+(.+)$/i);
        let appName = match ? match[4].trim().toLowerCase() : 'app';

        // Reuse the app map for normalization
        const appMap = {
            'calc': 'calculator',
            'mail': 'email',
            'sms': 'messages',
            'explorer': 'files',
            'finder': 'files',
            'gallery': 'photos',
            'play store': 'app store',
            'command prompt': 'terminal'
        };

        if (appMap[appName]) {
            appName = appMap[appName];
        }

        return {
            type: 'app-close',
            userInput: command,
            metadata: {
                appName: appName,
                app: appName
            },
            response: `Closing ${appName}.`,
            confidence: 0.95,
            source: 'fast-intent'
        };
    }

    /**
     * Check if query is simple enough for instant response
     */
    isSimpleQuery(command) {
        const intent = this.detectIntent(command);
        return intent !== null && intent.confidence >= 0.8;
    }
}

// Export singleton instance
const fastIntentService = new FastIntentService();
export default fastIntentService;
