/**
 * Fast Intent Detection Service
 * Provides instant intent detection using local pattern matching
 * Falls back to Gemini AI only for complex queries
 * 
 * Performance: <50ms for 80% of common queries
 */

class FastIntentService {
    constructor() {
        // Pattern-based intent detection
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
                    /close.*app|exit.*app|quit.*app|close (calculator|notepad|camera|spotify|discord|slack|zoom|teams|chrome|edge|firefox)/i,
                ],
                handler: 'handleAppClose'
            },
        };

        // Simple math patterns
        this.mathPattern = /^[\d\s+\-*/().]+$/;
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
                    confidence: 'high',
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
                        confidence: 'high',
                        source: 'fast-intent'
                    };
                }
            }
        }

        // No match found - return null to trigger Gemini fallback
        return null;
    }

    /**
     * Get instant response for common queries
     */
    getInstantResponse(command) {
        const intent = this.detectIntent(command);
        if (intent && intent.confidence === 'high') {
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
            confidence: 'high',
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
            confidence: 'high',
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
            confidence: 'high',
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
            confidence: 'high',
            source: 'fast-intent'
        };
    }

    handleAppClose(command) {
        // Extract app name if possible
        const match = command.match(/close\s+([a-z0-9\s]+)/i);
        const appName = match ? match[1].trim() : 'app';

        return {
            type: 'app-close',
            userInput: command,
            appName: appName,
            response: `Closing ${appName}`,
            confidence: 'high',
            source: 'fast-intent'
        };
    }

    /**
     * Check if query is simple enough for instant response
     */
    isSimpleQuery(command) {
        const intent = this.detectIntent(command);
        return intent !== null && intent.confidence === 'high';
    }
}

// Export singleton instance
const fastIntentService = new FastIntentService();
export default fastIntentService;
