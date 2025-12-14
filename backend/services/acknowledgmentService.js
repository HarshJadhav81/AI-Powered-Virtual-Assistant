/**
 * Instant Acknowledgment Service
 * Provides sub-300ms acknowledgments to user commands
 * Improves perceived latency and user confidence
 */

class AcknowledgmentService {
    constructor() {
        // Acknowledgment templates by intent type
        this.acknowledgments = {
            // General/default
            'default': ['Got it', 'Okay', 'Sure', 'On it'],

            // Search/query
            'google-search': ['Searching', 'Looking that up', 'On it'],
            'web-search': ['Searching', 'Finding that for you'],
            'wikipedia-query': ['Let me check', 'Looking that up'],
            'quick-answer': ['One moment', 'Let me find that'],

            // Media
            'play-music': ['Playing now', 'Sure, playing'],
            'youtube-play': ['Playing', 'On it'],
            'youtube-search': ['Searching YouTube'],

            // Info
            'weather-show': ['Checking weather', 'One moment'],
            'read-news': ['Getting news', 'On it'],
            'get-time': ['Sure'],
            'get-date': ['Sure'],

            // Actions
            'set-alarm': ['Setting alarm', 'On it'],
            'set-reminder': ['Setting reminder', 'Got it'],
            'take-note': ['Taking note', 'On it'],
            'whatsapp-send': ['Opening WhatsApp'],
            'call-contact': ['Calling', 'On it'],

            // Apps
            'app-launch': ['Opening', 'Launching'],
            'instagram-open': ['Opening Instagram'],
            'facebook-open': ['Opening Facebook'],
            'calculator-open': ['Opening calculator'],

            // Control
            'volume-control': ['Adjusting volume'],
            'brightness-control': ['Adjusting brightness'],
            'screenshot': ['Taking screenshot'],

            // Communication
            'email-send': ['Composing email'],
            'translate': ['Translating'],

            // Payments
            'payment-phonepe': ['Opening PhonePe'],
            'payment-googlepay': ['Opening Google Pay'],
            'payment-paytm': ['Opening Paytm'],
            'payment-upi': ['Opening payment app'],

            // Calendar/Gmail
            'calendar-view': ['Loading calendar'],
            'calendar-create': ['Creating event'],
            'gmail-check': ['Checking email'],
            'gmail-send': ['Composing email'],

            // Greetings
            'greeting': ['Hello', 'Hi there', 'Hey'],
            'thanks': ["You're welcome", 'Happy to help']
        };
    }

    /**
     * Get instant acknowledgment for an intent
     */
    getAcknowledgment(intentType, confidence = 1.0) {
        // Only provide acknowledgment for high confidence intents
        if (confidence < 0.65) {
            return null; // Too uncertain, skip acknowledgment
        }

        // Get templates for this intent type
        const templates = this.acknowledgments[intentType] || this.acknowledgments['default'];

        // Select random template
        const template = templates[Math.floor(Math.random() * templates.length)];

        return {
            text: template,
            intentType,
            confidence,
            timestamp: Date.now()
        };
    }

    /**
     * Get acknowledgment from partial transcript
     */
    getPartialAcknowledgment(partialIntent) {
        if (!partialIntent || !partialIntent.type) return null;

        // Only acknowledge if confidence > 0.7
        if (partialIntent.confidence < 0.7) return null;

        return this.getAcknowledgment(partialIntent.type, partialIntent.confidence);
    }

    /**
     * Get acknowledgment text only
     */
    getAcknowledgmentText(intentType) {
        const ack = this.getAcknowledgment(intentType, 1.0);
        return ack ? ack.text : 'Got it';
    }

    /**
     * Check if should send acknowledgment (based on confidence)
     */
    shouldAcknowledge(confidence) {
        return confidence >= 0.65;
    }
}

// Export singleton instance
const acknowledgmentService = new AcknowledgmentService();
export default acknowledgmentService;
