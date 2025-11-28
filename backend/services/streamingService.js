/**
 * Streaming Service - Backend Token Streaming
 * Enables real-time response streaming to frontend
 * 100% FREE - Uses Socket.io for streaming
 * 
 * OPTIMIZED: Fast intent detection, response caching, parallel processing
 */

import perplexitySearchService from './perplexitySearch.js';
import fastIntentService from './fastIntentService.js';
import responseCacheService from './responseCacheService.js';

class StreamingService {
    constructor() {
        this.activeStreams = new Map();
    }

    /**
     * Stream AI response token-by-token
     * OPTIMIZED: Fast intent detection, caching, parallel processing
     */
    async streamResponse(socket, command, userId, aiController) {
        const streamId = `stream_${Date.now()}_${userId}`;
        this.activeStreams.set(streamId, { socket, active: true });

        try {
            const startTime = Date.now();

            // INSTANT ACKNOWLEDGMENT - Send immediately before any processing
            socket.emit('stream-start', {
                streamId,
                timestamp: new Date().toISOString(),
                status: 'acknowledged'
            });

            // OPTIMIZATION 1: Check cache first
            const cachedResponse = responseCacheService.get(command, userId);
            if (cachedResponse) {
                console.info('[STREAMING] Cache hit! Returning cached response');

                // Stream cached response immediately
                await this.streamText(socket, cachedResponse.response, 0, 5);

                // Send cached metadata
                if (cachedResponse.sources) {
                    socket.emit('stream-event', {
                        type: 'sources',
                        sources: cachedResponse.sources
                    });
                }

                const totalLatency = Date.now() - startTime;
                socket.emit('stream-end', {
                    streamId,
                    totalLatency,
                    timestamp: new Date().toISOString(),
                    cached: true
                });

                console.info('[STREAMING] Cached response completed in', totalLatency, 'ms');
                return;
            }

            // OPTIMIZATION 2: Try fast intent detection first
            const fastIntent = fastIntentService.detectIntent(command);

            if (fastIntent && fastIntent.confidence === 'high') {
                console.info('[STREAMING] Fast intent detected:', fastIntent.type, 'in <10ms');

                // Stream instant response immediately
                await this.streamText(socket, fastIntent.response, 0, 5);

                // Send intent to frontend
                socket.emit('stream-event', {
                    type: 'intent-detected',
                    intent: fastIntent.type,
                    latency: Date.now() - startTime,
                    source: 'fast-intent'
                });

                // Cache the response if appropriate
                if (responseCacheService.shouldCache(command, fastIntent.type)) {
                    responseCacheService.set(command, {
                        response: fastIntent.response,
                        type: fastIntent.type
                    }, userId);
                }

                const totalLatency = Date.now() - startTime;
                socket.emit('stream-end', {
                    streamId,
                    totalLatency,
                    timestamp: new Date().toISOString(),
                    fastIntent: true
                });

                console.info('[STREAMING] Fast intent completed in', totalLatency, 'ms');
                return;
            }

            // OPTIMIZATION 3: Parallel processing for complex queries
            // Show thinking indicator for AI processing
            socket.emit('stream-event', {
                type: 'thinking',
                status: 'processing'
            });

            // Detect intent using AI (fallback for complex queries)
            const intentData = await aiController.detectIntent(command, userId);

            const intentLatency = Date.now() - startTime;
            console.info('[STREAMING] AI intent detected in', intentLatency, 'ms:', intentData.type);

            // Send intent to frontend
            socket.emit('stream-event', {
                type: 'intent-detected',
                intent: intentData.type,
                latency: intentLatency,
                source: 'gemini-ai'
            });

            // Generate voice metadata (non-blocking)
            const voiceMetadata = this.generateVoiceMetadata(intentData, command);
            socket.emit('stream-event', {
                type: 'voice-metadata',
                metadata: voiceMetadata
            });

            // Execute action and stream results
            const responseData = await this.executeAndStream(socket, streamId, intentData, userId);

            // Cache the response if appropriate
            if (responseCacheService.shouldCache(command, intentData.type)) {
                responseCacheService.set(command, {
                    response: intentData.response,
                    type: intentData.type,
                    sources: responseData?.sources
                }, userId);
            }

            // End stream
            const totalLatency = Date.now() - startTime;
            socket.emit('stream-end', {
                streamId,
                totalLatency,
                timestamp: new Date().toISOString()
            });

            console.info('[STREAMING] AI response completed in', totalLatency, 'ms');

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
        if (!stream || !stream.active) return null;

        let responseData = {};

        // Send action metadata to frontend for execution
        if (intentData.action || intentData.url) {
            socket.emit('stream-event', {
                type: 'action',
                action: intentData.action,
                url: intentData.url,
                metadata: intentData.metadata
            });
        }

        switch (intentData.type) {
            case 'web-search':
            case 'wikipedia-query':
            case 'quick-answer':
                responseData = await this.streamSearchResults(socket, intentData.userInput);
                break;

            case 'general':
                await this.streamGeneralResponse(socket, intentData.response);
                responseData = { response: intentData.response };
                break;

            case 'google-search':
            case 'youtube-search':
            case 'youtube-play':
            case 'instagram-open':
            case 'facebook-open':
            case 'calculator-open':
                // For URL-based actions, stream response and send action
                await this.streamGeneralResponse(socket, intentData.response);
                responseData = { response: intentData.response };
                break;

            default:
                // For other intents, send complete response
                socket.emit('stream-token', {
                    content: intentData.response,
                    index: 0,
                    final: true
                });
                responseData = { response: intentData.response };
        }

        return responseData;
    }

    /**
     * Stream search results (Perplexity-style)
     * OPTIMIZED: Batched streaming
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
                return { response: searchResult.summary };
            }

            // Stream answer with batching for faster delivery
            const answer = searchResult.answer || searchResult.summary;
            await this.streamText(socket, answer, 0, 5);

            // Send sources
            const sources = searchResult.sources.map((item, index) => ({
                index: index + 1,
                title: item.title,
                url: item.url,
                source: item.source
            }));

            socket.emit('stream-event', {
                type: 'sources',
                sources
            });

            return { response: answer, sources };

        } catch (error) {
            console.error('[STREAMING] Search error:', error);
            const errorMsg = 'I encountered an error while searching.';
            socket.emit('stream-token', {
                content: errorMsg,
                index: 0,
                final: true
            });
            return { response: errorMsg };
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
     * OPTIMIZED: Batched streaming for better performance
     */
    async streamText(socket, text, delayMs = 0, batchSize = 5) {
        if (!text) return;

        const words = text.split(' ');

        // Batch words for more efficient streaming
        for (let i = 0; i < words.length; i += batchSize) {
            const batch = words.slice(i, i + batchSize);
            const batchText = batch.join(' ');
            const isFinal = i + batchSize >= words.length;

            socket.emit('stream-token', {
                content: batchText + (isFinal ? '' : ' '),
                index: i,
                final: isFinal
            });

            // Optional delay for natural streaming effect (default: instant)
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
