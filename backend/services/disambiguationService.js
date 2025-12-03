/**
 * Disambiguation Service
 * Handles low-confidence scenarios with clarification questions
 * Manages multi-turn disambiguation dialogs
 */

class DisambiguationService {
    constructor() {
        this.activeDisambiguations = new Map(); // sessionId -> disambiguation state
    }

    /**
     * Check if response needs clarification
     */
    needsClarification(confidence) {
        return confidence < 0.55;
    }

    /**
     * Generate clarification question
     */
    generateClarificationQuestion(intentData) {
        const { type, alternativeIntents, userInput, confidence } = intentData;

        // Very low confidence - ask for repetition
        if (confidence < 0.3) {
            return {
                question: "I didn't quite catch that. Could you please repeat?",
                type: 'repeat',
                originalInput: userInput
            };
        }

        // Low confidence with alternatives - offer choices
        if (alternativeIntents && alternativeIntents.length > 0) {
            const primaryIntent = this.getIntentLabel(type);
            const altIntent = this.getIntentLabel(alternativeIntents[0]);

            return {
                question: `Did you mean to ${primaryIntent} or ${altIntent}?`,
                type: 'choice',
                options: [type, alternativeIntents[0]],
                originalInput: userInput
            };
        }

        // Medium-low confidence - ask for confirmation
        const action = this.getIntentLabel(type);
        return {
            question: `Did you want to ${action}?`,
            type: 'confirm',
            intent: type,
            originalInput: userInput
        };
    }

    /**
     * Get human-readable label for intent
     */
    getIntentLabel(intent) {
        const labels = {
            'play-music': 'play music',
            'youtube-play': 'play a YouTube video',
            'google-search': 'search on Google',
            'web-search': 'search the web',
            'wikipedia-query': 'get information from Wikipedia',
            'weather-show': 'check the weather',
            'read-news': 'read the news',
            'set-alarm': 'set an alarm',
            'set-reminder': 'set a reminder',
            'whatsapp-send': 'send a WhatsApp message',
            'call-contact': 'make a call',
            'email-send': 'send an email',
            'payment-phonepe': 'pay using PhonePe',
            'payment-googlepay': 'pay using Google Pay'
        };

        return labels[intent] || intent.replace(/-/g, ' ');
    }

    /**
     * Start disambiguation dialog
     */
    startDisambiguation(sessionId, clarification) {
        this.activeDisambiguations.set(sessionId, {
            ...clarification,
            startTime: Date.now(),
            attempts: 1
        });

        return clarification;
    }

    /**
     * Resolve disambiguation from user response
     */
    resolveDisambiguation(sessionId, userResponse) {
        const state = this.activeDisambiguations.get(sessionId);
        if (!state) {
            return null;
        }

        const normalizedResponse = userResponse.toLowerCase().trim();

        // Handle by type
        switch (state.type) {
            case 'repeat':
                // Clear and reprocess
                this.activeDisambiguations.delete(sessionId);
                return { action: 'reprocess', input: userResponse };

            case 'confirm':
                if (this.isAffirmative(normalizedResponse)) {
                    this.activeDisambiguations.delete(sessionId);
                    return { action: 'execute', intent: state.intent, originalInput: state.originalInput };
                } else if (this.isNegative(normalizedResponse)) {
                    this.activeDisambiguations.delete(sessionId);
                    return { action: 'cancel' };
                }
                break;

            case 'choice':
                // Check if response matches one of the options
                for (const option of state.options) {
                    const label = this.getIntentLabel(option);
                    if (normalizedResponse.includes(label) || normalizedResponse.includes(option)) {
                        this.activeDisambiguations.delete(sessionId);
                        return { action: 'execute', intent: option, originalInput: state.originalInput };
                    }
                }
                break;
        }

        // Increment attempts
        state.attempts++;

        if (state.attempts >= 3) {
            this.activeDisambiguations.delete(sessionId);
            return { action: 'giveup', message: 'I\'m having trouble understanding. Please try again later.' };
        }

        return { action: 'retry', question: 'I didn\'t understand. ' + state.question };
    }

    /**
     * Check if response is affirmative
     */
    isAffirmative(response) {
        const affirmatives = ['yes', 'yeah', 'yep', 'sure', 'okay', 'ok', 'correct', 'right', 'affirmative', 'confirm'];
        return affirmatives.some(word => response.includes(word));
    }

    /**
     * Check if response is negative
     */
    isNegative(response) {
        const negatives = ['no', 'nope', 'nah', 'wrong', 'incorrect', 'cancel', 'stop'];
        return negatives.some(word => response.includes(word));
    }

    /**
     * Check if session has active disambiguation
     */
    hasActiveDisambiguation(sessionId) {
        return this.activeDisambiguations.has(sessionId);
    }

    /**
     * Clear disambiguation
     */
    clearDisambiguation(sessionId) {
        this.activeDisambiguations.delete(sessionId);
    }

    /**
     * Cleanup old disambiguations
     */
    cleanup() {
        const now = Date.now();
        const timeout = 60000; // 1 minute

        for (const [sessionId, state] of this.activeDisambiguations.entries()) {
            if (now - state.startTime > timeout) {
                this.activeDisambiguations.delete(sessionId);
            }
        }
    }
}

// Export singleton
const disambiguationService = new DisambiguationService();

// Auto-cleanup every 30 seconds
setInterval(() => disambiguationService.cleanup(), 30000);

export default disambiguationService;
