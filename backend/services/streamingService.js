/**
 * streaming.js
 * Fixed StreamingService for reliable token streaming with socket.io
 *
 * Event contract (frontend <-> backend)
 * - stream-start  : { streamId, messageId, timestamp, status }
 * - stream-token  : { streamId, messageId, content, index, final }
 * - stream-event  : { streamId, type, ...meta } (optional metadata / actions)
 * - stream-end    : { streamId, messageId, totalLatency, timestamp }
 * - stream-error  : { streamId, messageId, error }
 * - stream-cancelled: { streamId, messageId }
 */

import perplexitySearchService from './perplexitySearch.js';
import fastIntentService from './fastIntentService.js';
import responseCacheService from './responseCacheService.js';
import wikipediaService from './wikipediaService.js';
import weatherService from './weatherService.js';
import newsService from './newsService.js';
// ElevenLabs service removed - using Web Speech API exclusively on client

class StreamingService {
  constructor() {
    // map streamId -> { socket, active: true/false, messageId, abortController? }
    this.activeStreams = new Map();
    // map userId -> Set<AbortController>
    this.userAbortControllers = new Map();
  }

  // Helper to generate stable message IDs
  _generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  // Monitor client for cancellation requests
  attachSocketListeners(socket, userId) {
    socket.on('cancel-all', () => {
      console.log(`[STREAMING] Client requested cancel-all for user ${userId}`);
      this.cancelAllStreams(userId);
    });
  }

  cancelAllStreams(userId) {
    // 1. Abort all backend operations for this user
    if (this.userAbortControllers.has(userId)) {
      const controllers = this.userAbortControllers.get(userId);
      for (const ac of controllers) {
        ac.abort(); // Signal abortion to fetch/axios
      }
      controllers.clear();
    }

    // 2. Mark all active streams for this user as inactive
    for (const [streamId, entry] of this.activeStreams.entries()) {
      // (Optimistic: in a real multi-user app, we'd check userId on the stream entry too)
      if (entry.active) {
        entry.active = false;
        entry.socket.emit('stream-cancelled', { streamId, messageId: entry.messageId });
      }
      this.activeStreams.delete(streamId);
    }
    console.info(`[STREAMING] Cancelled all streams for user ${userId}`);
  }

  /**
   * Main entrypoint to stream a response.
   * - socket: socket.io socket instance (for a single client)
   * - command: user query string
   * - userId: id of user
   * - aiController: abstraction that provides detectIntent and generateResponse
   * - mode: 'chat' or 'voice' (default: 'voice')
   */
  async streamResponse(socket, command, userId, aiController, mode = 'voice') {
    // [INSTANT-INTERRUPT] Abort previous for this user
    this.cancelAllStreams(userId);

    const streamId = `stream_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const messageId = this._generateMessageId();

    // Create new abort controller for this request
    const abortController = new AbortController();
    if (!this.userAbortControllers.has(userId)) {
      this.userAbortControllers.set(userId, new Set());
    }
    this.userAbortControllers.get(userId).add(abortController);

    // register active stream
    this.activeStreams.set(streamId, {
      socket,
      active: true,
      messageId,
      abortController
    });

    const startTime = Date.now();
    const signal = abortController.signal; // Pass this down

    try {
      // 1) Emit stream-start including messageId so frontend can create placeholder
      socket.emit('stream-start', {
        streamId,
        messageId,
        timestamp: new Date().toISOString(),
        status: 'acknowledged'
      });

      // CHAT MODE OPTIMIZATION: Detect intents and execute services when needed
      if (mode === 'chat') {
        console.log('[STREAMING] Chat mode - using optimized path');

        // Try fast intent detection first
        const fastIntentService = (await import('./fastIntentService.js')).default;
        const fastResult = fastIntentService.detectIntent(command);

        if (fastResult && fastResult.confidence === 'high') {
          console.log('[STREAMING] Fast intent detected:', fastResult.type);

          // For simple intents (time, date, greetings), stream the response immediately
          if (['get-time', 'get-date', 'get-day', 'get-month', 'greeting'].includes(fastResult.type)) {
            await this.streamText(socket, streamId, messageId, fastResult.response, { delayMs: 0, batchSize: 5 });

            const totalLatency = Date.now() - startTime;
            socket.emit('stream-end', {
              streamId,
              messageId,
              totalLatency,
              timestamp: new Date().toISOString()
            });

            // Auto-generate voice for response (using default multilingual voice)
            await this.streamVoice(socket, fastResult.response, {
              sessionId: streamId
            });

            this.activeStreams.delete(streamId);
            return;
          }
        }

        // Check if this is a Wikipedia, weather, or news query
        const lowerCommand = command.toLowerCase();
        const isWikipediaQuery =
          lowerCommand.startsWith('who is') ||
          lowerCommand.startsWith('who was') ||
          lowerCommand.startsWith('what is') ||
          lowerCommand.startsWith('what are') ||
          lowerCommand.startsWith('tell me about') ||
          lowerCommand.startsWith('explain') ||
          lowerCommand.startsWith('describe') ||
          lowerCommand.includes('information about');

        const isWeatherQuery =
          lowerCommand.includes('weather') ||
          lowerCommand.includes('temperature') ||
          lowerCommand.includes('forecast');

        const isNewsQuery =
          lowerCommand.includes('news') ||
          lowerCommand.includes('headlines');

        // If it's a service query, detect intent and execute
        if (isWikipediaQuery || isWeatherQuery || isNewsQuery) {
          console.log('[STREAMING] Service query detected in chat mode');

          // Detect full intent using AI
          const intentData = await aiController.detectIntent(command, userId);

          if (intentData && ['wikipedia-query', 'weather-show', 'read-news'].includes(intentData.type)) {
            console.log('[STREAMING] Executing service:', intentData.type);

            // Execute the service and stream results
            const result = await this.executeAndStream(socket, streamId, intentData, userId, aiController, command, messageId);

            const totalLatency = Date.now() - startTime;
            socket.emit('stream-end', {
              streamId,
              messageId,
              totalLatency,
              timestamp: new Date().toISOString()
            });

            this.activeStreams.delete(streamId);
            return;
          }
        }

        // For other complex queries, use chat mode (no JSON parsing)
        socket.emit('stream-event', { streamId, type: 'thinking', status: 'processing' });

        const chatResponse = await aiController.generateChatResponse(command, userId);
        await this.streamText(socket, streamId, messageId, chatResponse, { delayMs: 0, batchSize: 5 });

        const totalLatency = Date.now() - startTime;
        socket.emit('stream-end', {
          streamId,
          messageId,
          totalLatency,
          timestamp: new Date().toISOString()
        });

        // Auto-generate voice for chat response (using default multilingual voice)
        await this.streamVoice(socket, chatResponse, {
          sessionId: streamId
        });

        this.activeStreams.delete(streamId);
        return;
      }

      // VOICE MODE: Original intent-based flow
      // 2) Inform frontend we are processing/thinking
      socket.emit('stream-event', { streamId, type: 'thinking', status: 'processing' });

      // 3) Detect intent using Gemini AI via injected controller
      const intentData = await aiController.detectIntent(command, userId, signal);
      const intentLatency = Date.now() - startTime;
      socket.emit('stream-event', {
        streamId,
        type: 'intent-detected',
        intent: intentData.type,
        latency: intentLatency,
        source: 'gemini-ai'
      });

      // If action/url present, forward to frontend
      if (intentData.action || intentData.url) {
        socket.emit('stream-event', {
          streamId,
          type: 'action',
          action: intentData.action,
          url: intentData.url,
          metadata: intentData.metadata
        });
      }

      // Choose how to handle intent (reuse executeAndStream for non-general intents)
      let finalResponse = intentData.response || '';

      // Special handling for app-launch and app-close actions
      if (intentData.action && ['app-launch', 'app-close'].includes(intentData.action)) {
        console.info('[STREAMING] App action detected:', intentData.action, 'App:', intentData.metadata?.appName);

        if (!finalResponse) {
          // Generate appropriate response if missing
          const appName = intentData.metadata?.appName || 'application';
          if (intentData.action === 'app-launch') {
            finalResponse = `Opening ${appName}...`;
          } else if (intentData.action === 'app-close') {
            finalResponse = `Closing ${appName}...`;
          }
        }

        // Stream the response
        await this.streamText(socket, streamId, messageId, finalResponse, { delayMs: 0, batchSize: 5 });
      } else if ([
        'web-search',
        'quick-answer',
        'wikipedia-query',
        'weather-show',
        'read-news'
      ].includes(intentData.type)) {
        // delegate to executeAndStream which will stream tokens and return response
        const res = await this.executeAndStream(socket, streamId, intentData, userId, aiController, command, messageId);
        finalResponse = res?.response ?? finalResponse;
      } else {
        // Stream the raw Gemini response
        await this.streamText(socket, streamId, messageId, finalResponse, { delayMs: 0, batchSize: 5 });
      }

      // End stream
      const totalLatency = Date.now() - startTime;
      socket.emit('stream-end', {
        streamId,
        messageId,
        totalLatency,
        timestamp: new Date().toISOString()
      });

      // Auto-generate voice for response (voice mode)
      if (finalResponse && finalResponse.trim()) {
        await this.streamVoice(socket, finalResponse, {
          sessionId: streamId
        });
      }

    } catch (err) {
      console.error('[STREAMING] Error in streamResponse:', err);
      socket.emit('stream-error', {
        streamId,
        messageId,
        error: err?.message || String(err)
      });
    } finally {
      this.activeStreams.delete(streamId);
    }
  }

  /**
   * Execute an intent and stream results (search, wiki, weather, news, general)
   * This function returns an object: { response, sources?, articles?, data? }
   */
  async executeAndStream(socket, streamId, intentData, userId, aiController, originalCommand, messageId) {
    const active = this.activeStreams.get(streamId);
    if (!active || !active.active) return null;

    // Check if aborted
    const signal = active.abortController?.signal;
    if (signal?.aborted) {
      console.log('[STREAMING] Execution aborted before start');
      return null;
    }

    const queryText = intentData.userInput || originalCommand;

    try {
      switch (intentData.type) {
        case 'web-search':
        case 'quick-answer': {
          socket.emit('stream-event', { streamId, type: 'search-started', query: queryText });
          const searchResult = await perplexitySearchService.search(queryText);
          if (!searchResult.success || !searchResult.answer) {
            // fallback to ai
            const aiResponse = await aiController.generateResponse(queryText, userId);
            await this.streamText(socket, streamId, messageId, aiResponse, { delayMs: 0, batchSize: 5 });
            return { response: aiResponse };
          }
          const answer = searchResult.answer || searchResult.summary || '';
          await this.streamText(socket, streamId, messageId, answer, { delayMs: 0, batchSize: 5 });
          const sources = (searchResult.sources || []).map((s, i) => ({ index: i + 1, title: s.title, url: s.url, source: s.source }));
          if (sources.length) socket.emit('stream-event', { streamId, type: 'sources', sources });
          return { response: answer, sources };
        }

        case 'wikipedia-query': {
          socket.emit('stream-event', { streamId, type: 'wikipedia-started', query: queryText });
          const wikiResult = await wikipediaService.quickFact(queryText);
          if (!wikiResult || !wikiResult.found) {
            const aiResponse = await aiController.generateResponse(queryText, userId);
            await this.streamText(socket, streamId, messageId, aiResponse, { delayMs: 0, batchSize: 5 });
            return { response: aiResponse };
          }
          const answer = wikiResult.voiceResponse || wikiResult.summary || '';
          await this.streamText(socket, streamId, messageId, answer, { delayMs: 0, batchSize: 5 });

          // Emit Wikipedia summary data for rich UI display
          socket.emit('stream-event', {
            streamId,
            messageId,
            type: 'wikipedia-summary',
            summary: {
              title: wikiResult.title,
              summary: wikiResult.summary || wikiResult.fullText,
              url: wikiResult.url,
              thumbnail: wikiResult.thumbnail,
              extract: wikiResult.fullText
            }
          });

          const sources = wikiResult.url ? [{ index: 1, title: wikiResult.title, url: wikiResult.url, source: 'Wikipedia' }] : [];
          if (sources.length) socket.emit('stream-event', { streamId, type: 'sources', sources });
          return { response: answer, sources };
        }

        case 'weather-show': {
          const city = intentData.metadata?.city || 'Mumbai';
          socket.emit('stream-event', { streamId, type: 'weather-started', city });
          if (!weatherService.isConfigured()) {
            const aiResponse = await aiController.generateResponse(`What is the weather in ${city}?`, userId);
            await this.streamText(socket, streamId, messageId, aiResponse, { delayMs: 0, batchSize: 5 });
            return { response: aiResponse };
          }
          const weatherData = await weatherService.getCurrentWeather(city);
          const answer = weatherData.voiceResponse || 'Unable to fetch weather';
          await this.streamText(socket, streamId, messageId, answer, { delayMs: 0, batchSize: 5 });
          socket.emit('stream-event', { streamId, type: 'weather-data', data: weatherData });
          return { response: answer, data: weatherData };
        }

        case 'read-news': {
          socket.emit('stream-event', { streamId, type: 'news-started', category: intentData.metadata?.category || 'headlines' });
          if (!newsService.isConfigured()) {
            const aiResponse = await aiController.generateResponse('What are the latest news headlines?', userId);
            await this.streamText(socket, streamId, messageId, aiResponse, { delayMs: 0, batchSize: 5 });
            return { response: aiResponse };
          }
          const newsData = intentData.metadata?.category
            ? await newsService.getNewsByCategory(intentData.metadata.category)
            : await newsService.getTopHeadlines();
          const answer = newsData.voiceResponse || 'Unable to fetch news';
          await this.streamText(socket, streamId, messageId, answer, { delayMs: 0, batchSize: 5 });
          socket.emit('stream-event', { streamId, type: 'news-articles', articles: newsData.articles });
          return { response: answer, articles: newsData.articles };
        }

        default: {
          // fallback: stream intentData.response
          const resp = intentData.response || '';
          await this.streamText(socket, streamId, messageId, resp, { delayMs: 0, batchSize: 5 });
          return { response: resp };
        }
      }
    } catch (err) {
      console.error('[STREAMING] executeAndStream error:', err);
      const fallback = await (aiController ? aiController.generateResponse(queryText, userId) : 'I encountered an error.');
      await this.streamText(socket, streamId, messageId, fallback, { delayMs: 0, batchSize: 5 });
      return { response: fallback };
    }
  }

  // Voice preference helper removed - using single multilingual voice
  async getUserVoicePreference(userId) {
    return null; // Always return null to use default voice
  }

  /**
   * Stream text token-by-token (token here = small batched words)
   * The function checks the activeStreams map for cancellation and
   * always includes streamId and messageId in emitted tokens.
   *
   * Options:
   *  - delayMs: pause between emitted batches (ms)
   *  - batchSize: number of words per token
   */
  async streamText(socket, streamId, messageId, text, options = {}) {
    const { delayMs = 0, batchSize = 5 } = options;
    if (!text && text !== '') return;

    // If text empty, still send a final empty token so frontend isn't stuck
    const words = text ? String(text).split(/\s+/) : [];

    // If zero words, immediately emit a final empty token
    if (words.length === 0) {
      // ensure stream still active
      const active = this.activeStreams.get(streamId);
      if (!active || !active.active) {
        // stream cancelled — notify and return
        socket.emit('stream-cancelled', { streamId, messageId });
        return;
      }
      socket.emit('stream-token', { streamId, messageId, content: '', index: 0, final: true });
      return;
    }

    for (let i = 0; i < words.length; i += batchSize) {
      const batch = words.slice(i, i + batchSize);
      const batchText = batch.join(' ');
      const isLastBatch = i + batchSize >= words.length;

      // Check if stream still active
      const active = this.activeStreams.get(streamId);
      if (!active || !active.active) {
        // notify cancelled and break
        socket.emit('stream-cancelled', { streamId, messageId });
        break;
      }

      socket.emit('stream-token', {
        streamId,
        messageId,
        content: batchText + (isLastBatch ? '' : ' '),
        index: i,
        final: isLastBatch
      });

      if (!isLastBatch && delayMs > 0) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }

  // cancel active stream
  cancelStream(streamId) {
    const entry = this.activeStreams.get(streamId);
    if (entry) {
      entry.active = false;
      entry.socket.emit('stream-cancelled', { streamId, messageId: entry.messageId });
      this.activeStreams.delete(streamId);
      console.info('[STREAMING] Stream cancelled:', streamId);
    }
  }

  /**
   * Stream voice audio using Web Speech API (browser-native, unlimited)
   * Sends text to frontend to be synthesized using Web Speech API
   * 
   * @param {Object} socket - Socket.IO socket instance
   * @param {String} text - Text to convert to speech
   * @param {Object} options - Voice options (sessionId)
   */
  async streamVoice(socket, text, options = {}) {
    const { sessionId } = options;

    try {
      // Use Web Speech API exclusively (unlimited, no API costs)
      console.log('[STREAMING-VOICE] Using Web Speech API for TTS (unlimited, browser-native)');
      socket.emit('audio-fallback', { text, provider: 'web-speech' });

    } catch (error) {
      console.error('[STREAMING-VOICE] Error:', error.message);
      socket.emit('audio-error', {
        error: error.message,
        fallback: true
      });
      socket.emit('audio-fallback', { text, provider: 'web-speech' });
    }
  }

  getActiveStreamCount() {
    return this.activeStreams.size;
  }
}

const streamingService = new StreamingService();
export default streamingService;
