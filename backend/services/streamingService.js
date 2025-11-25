/**
 * Streaming Service - Backend Token Streaming
 * Enables real-time response streaming to frontend
 * 100% FREE - Uses Socket.io for streaming
 */

import perplexitySearchService from './perplexitySearch.js';

class StreamingService {
    constructor() {
        this.activeStreams = new Map();
    }

    /**
     * Stream AI response token-by-token
     */
    async streamResponse(socket, command, userId, aiController) {
        const streamId = `stream_${Date.now()}_${userId}`;
        this.activeStreams.set(streamId, { socket, active: true });

        try {
            const startTime = Date.now();

            // Step 1: Detect intent immediately (<150ms)
            socket.emit('stream-event', {
                type: 'intent-detection',
                status: 'processing'
            });

            // Get intent from AI controller (non-streaming first)
            const intentData = await aiController.detectIntent(command, userId);

            const intentLatency = Date.now() - startTime;
            console.info('[STREAMING] Intent detected in', intentLatency, 'ms:', intentData.type);

            // Send intent to frontend
            socket.emit('stream-event', {
                type: 'intent-detected',
                intent: intentData.type,
                latency: intentLatency
            });

            // Step 2: Generate voice metadata
            const voiceMetadata = this.generateVoiceMetadata(intentData, command);

            socket.emit('stream-event', {
                type: 'voice-metadata',
                metadata: voiceMetadata
            });

            // Step 3: Start streaming response
            socket.emit('stream-start', {
                streamId,
                intent: intentData.type,
                timestamp: new Date().toISOString()
            });

            // Step 4: Execute action and stream results
            await this.executeAndStream(socket, streamId, intentData, userId);

            // Step 5: End stream
            const totalLatency = Date.now() - startTime;
            socket.emit('stream-end', {
                streamId,
                totalLatency,
                timestamp: new Date().toISOString()
            });

            console.info('[STREAMING] Completed in', totalLatency, 'ms');

        } catch (error) {
            console.error('[STREAMING] Error:', error);
            socket.emit('stream-error', {
                streamId,
                error: error.message
            });
        } finally {
            this.activeStreams.delete(streamId);
        }
    }

    /**
     * Execute action and stream results
     */
    async executeAndStream(socket, streamId, intentData, userId) {
        const stream = this.activeStreams.get(streamId);
        if (!stream || !stream.active) return;

        switch (intentData.type) {
            case 'web-search':
            case 'wikipedia-query':
            case 'quick-answer':
                await this.streamSearchResults(socket, intentData.userInput);
                break;

            case 'general':
                await this.streamGeneralResponse(socket, intentData.response);
                break;

            default:
                // For other intents, send complete response
                socket.emit('stream-token', {
                    content: intentData.response,
                    index: 0,
                    final: true
                });
        }
    }

    /**
     * Stream search results (Perplexity-style)
     */
    async streamSearchResults(socket, query) {
        try {
            // Start search
            socket.emit('stream-event', {
                type: 'search-started',
                query
            });

            // Perform search
            const searchResult = await perplexitySearchService.search(query);

            if (!searchResult.success) {
                socket.emit('stream-token', {
                    content: searchResult.summary,
                    index: 0,
                    final: true
                });
                return;
            }

            // Stream answer token-by-token
            const answer = searchResult.answer || searchResult.summary;
            await this.streamText(socket, answer);

            // Send sources
            socket.emit('stream-event', {
                type: 'sources',
                sources: searchResult.sources.map((item, index) => ({
                    index: index + 1,
                    title: item.title,
                    url: item.url,
                    source: item.source
                }))
            });

        } catch (error) {
            console.error('[STREAMING] Search error:', error);
            socket.emit('stream-token', {
                content: 'I encountered an error while searching.',
                index: 0,
                final: true
            });
        }
    }

    /**
     * Stream general response
     */
    async streamGeneralResponse(socket, text) {
        await this.streamText(socket, text);
    }

    /**
     * Stream text token-by-token
     */
    async streamText(socket, text, delayMs = 30) {
        const words = text.split(' ');

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const isFinal = i === words.length - 1;

            socket.emit('stream-token', {
                content: word + (isFinal ? '' : ' '),
                index: i,
                final: isFinal
            });

            // Small delay for natural streaming effect
            if (!isFinal && delayMs > 0) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }

    /**
     * Generate voice metadata based on intent and language
     */
    generateVoiceMetadata(intentData, command) {
        // Detect language
        const language = this.detectLanguage(command);

        // Select voice based on language
        const voiceMap = {
            'en': {
                name: 'us_male',
                lang: 'en-US',
                gender: 'male',
                emotion: 'soft_warm',
                tone: 'friendly',
                speed: 0.95,
                pitch: 'natural'
            },
            'hi': {
                name: 'indian_male_hindi',
                lang: 'hi-IN',
                gender: 'male',
                emotion: 'warm',
                tone: 'friendly',
                speed: 0.90,
                pitch: 'natural'
            },
            'mr': {
                name: 'indian_male_marathi',
                lang: 'mr-IN',
                gender: 'male',
                emotion: 'warm',
                tone: 'conversational',
                speed: 0.92,
                pitch: 'natural'
            }
        };

        const voiceConfig = voiceMap[language] || voiceMap['en'];

        // Adjust emotion based on intent type
        if (intentData.type === 'error') {
            voiceConfig.emotion = 'apologetic';
            voiceConfig.tone = 'soft';
        } else if (intentData.type.includes('search') || intentData.type.includes('wikipedia')) {
            voiceConfig.emotion = 'informative';
            voiceConfig.tone = 'professional';
        }

        return {
            language,
            ...voiceConfig
        };
    }

    /**
     * Detect language from text
     */
    detectLanguage(text) {
        // Simple language detection based on character sets
        const hindiRegex = /[\u0900-\u097F]/;
        const marathiRegex = /[\u0900-\u097F]/; // Marathi uses Devanagari script

        if (hindiRegex.test(text)) {
            // Check for Marathi-specific patterns (simplified)
            if (text.includes('आहे') || text.includes('काय')) {
                return 'mr';
            }
            return 'hi';
        }

        return 'en';
    }

    /**
     * Cancel active stream
     */
    cancelStream(streamId) {
        const stream = this.activeStreams.get(streamId);
        if (stream) {
            stream.active = false;
            stream.socket.emit('stream-cancelled', { streamId });
            this.activeStreams.delete(streamId);
            console.info('[STREAMING] Stream cancelled:', streamId);
        }
    }

    /**
     * Get active stream count
     */
    getActiveStreamCount() {
        return this.activeStreams.size;
    }
}

// Export singleton instance
const streamingService = new StreamingService();
export default streamingService;
