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

class StreamingService {
  constructor() {
    // map streamId -> { socket, active: true/false, messageId }
    this.activeStreams = new Map();
  }

  // Helper to generate stable message IDs
  _generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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
    const streamId = `stream_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const messageId = this._generateMessageId();
    // register active stream
    this.activeStreams.set(streamId, { socket, active: true, messageId });

    const startTime = Date.now();

    try {
      // 1) Emit stream-start including messageId so frontend can create placeholder
      socket.emit('stream-start', {
        streamId,
        messageId,
        timestamp: new Date().toISOString(),
        status: 'acknowledged'
      });

      // CHAT MODE OPTIMIZATION: Skip intent detection for conversational chat
      if (mode === 'chat') {
        console.log('[STREAMING] Chat mode - using optimized path');

        // Try fast intent detection first (for time, date, greetings, etc.)
        const fastIntentService = (await import('./fastIntentService.js')).default;
        const fastResult = fastIntentService.detectIntent(command);

        if (fastResult && fastResult.confidence === 'high') {
          console.log('[STREAMING] Fast intent detected:', fastResult.type);

          // For simple intents, stream the response immediately
          await this.streamText(socket, streamId, messageId, fastResult.response, { delayMs: 0, batchSize: 5 });

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

        // For complex queries, use chat mode (no JSON parsing)
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

        this.activeStreams.delete(streamId);
        return;
      }

      // VOICE MODE: Original intent-based flow
      // 2) Inform frontend we are processing/thinking
      socket.emit('stream-event', { streamId, type: 'thinking', status: 'processing' });

      // 3) Detect intent using Gemini AI via injected controller
      const intentData = await aiController.detectIntent(command, userId);
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

      if ([
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

  getActiveStreamCount() {
    return this.activeStreams.size;
  }
}

const streamingService = new StreamingService();
export default streamingService;
