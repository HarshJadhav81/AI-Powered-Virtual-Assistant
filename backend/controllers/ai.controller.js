/**
 * AI Controller - Central Intelligence Module
 * Handles all AI processing, intent recognition, and action routing
 * [COPILOT-UPGRADE]: Created comprehensive AI controller with structured intent parsing
 */

import geminiResponse from "../gemini.js";
import User from "../models/user.model.js";
import weatherService from "../services/weatherService.js";
import newsService from "../services/newsService.js";
import reminderService from "../services/reminderService.js";
import notesService from "../services/notesService.js";
import conversationService from "../services/conversationService.js";
import wikipediaService from "../services/wikipediaService.js";
import searchService from "../services/searchService.js";
import calendarService from "../services/calendarService.js";
import gmailService from "../services/gmailService.js";
import itineraryService from "../services/itineraryService.js";
import deviceManager from "../services/deviceManager.js";
import perplexitySearchService from "../services/perplexitySearch.js";
import spotifyService from "../services/spotifyService.js";
import youtubeService from "../services/youtubeService.js";
import translateService from "../services/translateService.js";

class AIController {
  constructor() {
    this.actionHandlers = {
      'general': this.handleGeneral,
      'google-search': this.handleGoogleSearch,
      'youtube-search': this.handleYouTubeSearch,
      'youtube-play': this.handleYouTubePlay,
      'get-time': this.handleGetTime,
      'get-date': this.handleGetDate,
      'get-day': this.handleGetDay,
      'get-month': this.handleGetMonth,
      'calculator-open': this.handleCalculator,
      'instagram-open': this.handleInstagram,
      'facebook-open': this.handleFacebook,
      'weather-show': this.handleWeather,
      'whatsapp-send': this.handleWhatsAppMessage,
      'telegram-send': this.handleTelegramMessage,
      'call-contact': this.handlePhoneCall,
      'set-alarm': this.handleSetAlarm,
      'set-reminder': this.handleSetReminder,
      'play-music': this.handlePlayMusic,
      'device-control': this.handleDeviceControl,
      'smart-routine': this.handleSmartRoutine,
      'take-note': this.handleTakeNote,
      'read-news': this.handleReadNews,
      'translate': this.handleTranslate,
      'email-send': this.handleSendEmail,
      'screenshot': this.handleScreenshot,
      'volume-control': this.handleVolumeControl,
      'brightness-control': this.handleBrightnessControl,
      'payment-phonepe': this.handlePhonePePayment,
      'payment-googlepay': this.handleGooglePayPayment,
      'payment-paytm': this.handlePaytmPayment,
      'payment-upi': this.handleUPIPayment,
      'wikipedia-query': this.handleWikipediaQuery,
      'web-search': this.handleWebSearch,
      'quick-answer': this.handleQuickAnswer,
      // Phase 3 handlers
      'calendar-view': this.handleCalendarView,
      'calendar-create': this.handleCalendarCreate,
      'calendar-today': this.handleCalendarToday,
      'gmail-check': this.handleGmailCheck,
      'gmail-read': this.handleGmailRead,
      'gmail-send': this.handleGmailSend,
      'bluetooth-scan': this.handleBluetoothScan,
      'bluetooth-connect': this.handleBluetoothConnect,
      'app-launch': this.handleAppLaunch,
      'app-close': this.handleAppClose,
      'list-apps': this.handleListApps,
      'screen-record': this.handleScreenRecord,
      'screen-share': this.handleScreenShare,
      // Phase 4 handlers - New Features
      'instagram-dm': this.handleInstagramDM,
      'instagram-story': this.handleInstagramStory,
      'instagram-profile': this.handleInstagramProfile,
      'cast-media': this.handleCastMedia,
      'cast-youtube': this.handleCastYouTube,
      'camera-photo': this.handleCameraPhoto,
      'camera-video': this.handleCameraVideo,
      'pick-contact': this.handlePickContact,
      // Multi-step task handlers
      'itinerary-create': this.handleItineraryCreate,
      'trip-plan': this.handleItineraryCreate,
      // Voice control handlers
      'change-voice': this.handleChangeVoice,
      'list-voices': this.handleListVoices,
      'preview-voice': this.handlePreviewVoice,
      'reset-voice': this.handleResetVoice
    };
  }

  /**
   * Main entry point for AI processing
   * [OPTIMIZED]: Accepts fastIntent to bypass Gemini for high-confidence local commands
   */
  async processCommand(command, userId, assistantName, userName, fastIntent = null) {
    try {
      console.info('[COPILOT-ANALYSIS]', 'Processing command:', command);

      // Save to user history
      await this.saveToHistory(userId, command);

      // Add user message to conversation
      await conversationService.addMessage(userId, 'user', command);

      let parsedData;

      // 1. FAST PATH: Use local intent if confidence is high (>0.8)
      if (fastIntent && fastIntent.confidence > 0.8) {
        console.info('[AI-CONTROLLER] ⚡ Fast Path Triggered:', fastIntent.type);
        parsedData = {
          type: fastIntent.type,
          userInput: command,
          metadata: fastIntent.metadata || {},
          confidence: fastIntent.confidence,
          response: fastIntent.response // Preserve pre-calculated response
        };
      }
      // 2. SLOW PATH: Use Gemini AI or Fallback
      else {
        // Get conversation context
        const conversationContext = await conversationService.getContext(userId);

        let geminiResult = null;
        let isOfflineFallback = false;

        try {
          // Get AI response from Gemini with conversation context
          geminiResult = await geminiResponse(command, assistantName, userName, conversationContext);
        } catch (geminiError) {
          console.error('[AI-CONTROLLER] Gemini API Error:', geminiError.message);
          // Check if it's a network/quota error or just generic failure
          // We will attempt offline fallback now
          isOfflineFallback = true;
        }

        // Check if geminiResult is undefined or null (or if we caught an error)
        if (!geminiResult || isOfflineFallback) {
          console.warn('[AI-CONTROLLER]: Gemini unavailable, attempting offline fallback...');

          // ATTEMPT OFFLINE FALLBACK via FastIntentService
          const fastIntentService = (await import('../services/fastIntentService.js')).default;
          // We use a lower confidence threshold for offline fallback because it's better than nothing
          const offlineIntent = fastIntentService.detectIntent(command);

          if (offlineIntent) {
            console.info('[AI-CONTROLLER] Offline fallback successful:', offlineIntent.type);
            parsedData = {
              type: offlineIntent.type,
              userInput: command,
              metadata: offlineIntent.metadata || {},
              confidence: offlineIntent.confidence,
              response: offlineIntent.response
            };
          } else {
            // No offline match found
            console.error('[AI-CONTROLLER-ERROR]: Gemini unavailable and no offline match.');
            return {
              type: 'error',
              userInput: command,
              response: 'I am having trouble connecting to the internet and I couldn\'t find a local command for that. Try asking me to open an app or check the time.',
              error: 'No response from AI service and no offline match'
            };
          }
        } else {
          // Parse Gemini JSON response (Normal Online Flow)
          try {
            // Extract JSON from markdown code blocks if present
            const jsonMatch = geminiResult.match(/```json\s*([\s\S]*?)\s*```/) ||
              geminiResult.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : geminiResult;
            parsedData = JSON.parse(jsonString);

            console.info('[AI-CONTROLLER]', `Parsed intent: ${parsedData.type}`);
          } catch (parseError) {
            console.error('[AI-CONTROLLER] JSON parsing error:', parseError.message);
            console.error('[AI-CONTROLLER] Raw response:', geminiResult.substring(0, 200));
            parsedData = {
              type: 'general',
              userInput: command,
              response: 'I apologize, I had trouble understanding that. Could you please rephrase?'
            };
          }
        }
      }

      // Execute action based on type
      const result = await this.executeAction(parsedData, userId);

      // Add assistant response to conversation
      await conversationService.addMessage(userId, 'assistant', result.response || result.voiceResponse);

      // Extract and update context entities
      const contextData = await conversationService.getContext(userId, 5);
      if (contextData && contextData.messages && contextData.messages.length > 0) {
        const entities = conversationService.extractEntities(contextData.messages);
        await conversationService.updateContext(userId, entities);
      }

      return result;
    } catch (error) {
      console.error('[AI-CONTROLLER-ERROR]:', error.message);
      console.error('[AI-CONTROLLER-ERROR] Stack:', error.stack);
      return {
        type: 'error',
        userInput: command,
        response: 'I encountered an error. Please try again.',
        error: error.message
      };
    }
  }

  /**
   * Execute the appropriate action based on intent type
   */
  async executeAction(data, userId) {
    const { type } = data;
    const handler = this.actionHandlers[type] || this.handleGeneral;

    console.info('[COPILOT-UPGRADE]', `Executing action: ${type}`);

    return await handler.call(this, data, userId);
  }

  /**
   * Detect intent from user command (used by streaming service)
   */
  async detectIntent(command, userId, signal) {
    try {
      console.info('[AI-CONTROLLER] Detecting intent for:', command);

      // Save to user history
      await this.saveToHistory(userId, command);

      // Add user message to conversation
      await conversationService.addMessage(userId, 'user', command);

      // Get conversation context
      const conversationContext = await conversationService.getContext(userId);

      // Get AI response from Gemini with conversation context
      const geminiResult = await geminiResponse(command, 'Assistant', 'User', conversationContext, 'voice', signal);

      // Check if geminiResult is undefined or null
      if (!geminiResult) {
        console.error('[AI-CONTROLLER-ERROR]: Gemini returned no response');
        return {
          type: 'general',
          userInput: command,
          response: 'I am having trouble connecting right now. Please try again.',
          error: 'No response from AI service'
        };
      }

      // Parse JSON response
      let parsedData;
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = geminiResult.match(/```json\s*([\s\S]*?)\s*```/) ||
          geminiResult.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : geminiResult;
        parsedData = JSON.parse(jsonString);

        console.info('[AI-CONTROLLER]', `Detected intent: ${parsedData.type}`);
      } catch (parseError) {
        console.error('[AI-CONTROLLER] JSON parsing error:', parseError.message);
        console.error('[AI-CONTROLLER] Raw response:', geminiResult.substring(0, 200));
        parsedData = {
          type: 'general',
          userInput: command,
          response: geminiResult || 'I apologize, I had trouble understanding that. Could you please rephrase?'
        };
      }

      return parsedData;
    } catch (error) {
      console.error('[AI-CONTROLLER-ERROR]:', error.message);
      return {
        type: 'general',
        userInput: command,
        response: 'I encountered an error. Please try again.',
        error: error.message
      };
    }
  }

  /**
   * Generate a direct response using Gemini (for fallback)
   */
  async generateResponse(command, userId) {
    try {
      console.info('[AI-CONTROLLER] Generating direct response for:', command);

      // Get conversation context
      const conversationContext = await conversationService.getContext(userId);

      // Get AI response from Gemini (voice mode for backward compatibility)
      const geminiResult = await geminiResponse(command, 'Assistant', 'User', conversationContext, 'voice');

      if (!geminiResult) {
        throw new Error('No response from AI service');
      }

      // If response contains JSON, extract the response text
      try {
        const jsonMatch = geminiResult.match(/```json\s*([\s\S]*?)\s*```/) ||
          geminiResult.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const jsonString = jsonMatch[1] || jsonMatch[0];
          const parsedData = JSON.parse(jsonString);
          return parsedData.response || parsedData.voiceResponse || geminiResult;
        }
      } catch (e) {
        // Not JSON, return as is
      }

      return geminiResult;
    } catch (error) {
      console.error('[AI-CONTROLLER-ERROR]:', error.message);
      throw error;
    }
  }

  /**
   * Generate chat response (optimized for conversational mode)
   * Uses chat mode - returns plain text without JSON overhead
   */
  async generateChatResponse(command, userId) {
    try {
      console.info('[AI-CONTROLLER] Generating chat response for:', command);

      // Check cache first
      const cached = await this.getCachedResponse(command, userId);
      if (cached) {
        console.log('[AI-CONTROLLER] Cache hit!');
        return cached;
      }

      // Get conversation context
      const conversationContext = await conversationService.getContext(userId);

      // Get AI response from Gemini in CHAT mode (no JSON)
      const response = await geminiResponse(command, 'Rohini', 'User', conversationContext, 'chat');

      if (!response) {
        throw new Error('No response from AI service');
      }

      // Cache the response
      await this.cacheResponse(command, userId, response);

      return response;
    } catch (error) {
      console.error('[AI-CONTROLLER-ERROR]:', error.message);
      throw error;
    }
  }

  /**
   * Try fast intent detection first (pattern matching)
   * Falls back to Gemini if no match
   */
  async detectIntentFast(command, userId) {
    try {
      const fastIntentService = (await import('../services/fastIntentService.js')).default;

      // Try fast pattern matching first
      const fastResult = fastIntentService.detectIntent(command);

      if (fastResult && fastResult.confidence === 'high') {
        console.log('[AI-CONTROLLER] Fast intent detected:', fastResult.type);
        return fastResult;
      }

      // Fallback to Gemini for complex queries
      console.log('[AI-CONTROLLER] No fast match, using Gemini');
      return await this.detectIntent(command, userId);
    } catch (error) {
      console.error('[AI-CONTROLLER] Fast intent error:', error.message);
      return await this.detectIntent(command, userId);
    }
  }

  /**
   * Get cached response if available
   */
  async getCachedResponse(command, userId) {
    try {
      const responseCacheService = (await import('../services/responseCacheService.js')).default;
      return responseCacheService.get(command, userId);
    } catch (error) {
      console.error('[AI-CONTROLLER] Cache get error:', error.message);
      return null;
    }
  }

  /**
   * Cache a response
   */
  async cacheResponse(command, userId, response) {
    try {
      const responseCacheService = (await import('../services/responseCacheService.js')).default;
      responseCacheService.set(command, response, userId);
    } catch (error) {
      console.error('[AI-CONTROLLER] Cache set error:', error.message);
    }
  }

  /**
   * Save command to user history
   */
  async saveToHistory(userId, command) {
    try {
      await User.findByIdAndUpdate(
        userId,
        { $push: { history: { $each: [command], $slice: -50 } } }, // Keep last 50
        { new: true }
      );
    } catch (error) {
      console.error('History save error:', error);
    }
  }

  // ==================== ACTION HANDLERS ====================

  handleGeneral(data) {
    return {
      ...data,
      action: 'speak',
      metadata: { category: 'information' }
    };
  }

  handleGoogleSearch(data) {
    const query = encodeURIComponent(data.userInput);
    return {
      ...data,
      response: 'Opening Google search for you',
      action: 'open-url',
      url: `https://www.google.com/search?q=${query}`,
      metadata: { searchEngine: 'google' }
    };
  }

  async handleYouTubeSearch(data) {
    try {
      const query = data.userInput.replace(/youtube|search|find|video/gi, '').trim();
      const result = await youtubeService.search(query);

      return {
        ...data,
        response: result.voiceResponse,
        action: 'open-url',
        url: result.url,
        metadata: { platform: 'youtube', type: 'search', videoId: result.videoId }
      };
    } catch (error) {
      console.error('[YOUTUBE-SEARCH-ERROR]:', error);
      return {
        ...data,
        response: 'I couldn\'t search YouTube right now.',
        action: 'speak'
      };
    }
  }

  async handleYouTubePlay(data) {
    try {
      const query = data.userInput.replace(/play|on youtube|video|song/gi, '').trim();
      const result = await youtubeService.play(query);

      return {
        ...data,
        response: result.voiceResponse,
        action: 'open-url',
        url: result.url,
        metadata: { platform: 'youtube', type: 'play', videoId: result.videoId }
      };
    } catch (error) {
      console.error('[YOUTUBE-PLAY-ERROR]:', error);
      return {
        ...data,
        response: 'I couldn\'t play that on YouTube right now.',
        action: 'speak'
      };
    }
  }

  handleGetTime(data) {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return {
      ...data,
      response: `The current time is ${time}`,
      action: 'speak',
      metadata: { time, timestamp: now.toISOString() }
    };
  }

  handleGetDate(data) {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return {
      ...data,
      response: `Today is ${date}`,
      action: 'speak',
      metadata: { date, timestamp: now.toISOString() }
    };
  }

  handleGetDay(data) {
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });
    return {
      ...data,
      response: `Today is ${day}`,
      action: 'speak',
      metadata: { day }
    };
  }

  handleGetMonth(data) {
    const now = new Date();
    const month = now.toLocaleDateString('en-US', { month: 'long' });
    return {
      ...data,
      response: `The current month is ${month}`,
      action: 'speak',
      metadata: { month }
    };
  }

  handleCalculator(data) {
    return {
      ...data,
      action: 'app-launch',
      response: 'Opening calculator.',
      metadata: { appName: 'calculator' }
    };
  }

  handleInstagram(data) {
    return {
      ...data,
      response: 'Opening Instagram for you',
      action: 'open-url',
      url: 'https://www.instagram.com/',
      metadata: { platform: 'instagram' }
    };
  }

  handleFacebook(data) {
    return {
      ...data,
      response: 'Opening Facebook for you',
      action: 'open-url',
      url: 'https://www.facebook.com/',
      metadata: { platform: 'facebook' }
    };
  }

  async handleWeather(data) {
    try {
      // Extract city from user input or use default
      const city = data.metadata?.city || 'Mumbai';

      if (weatherService.isConfigured()) {
        const weather = await weatherService.getCurrentWeather(city);
        return {
          ...data,
          response: weather.voiceResponse,
          action: 'show-weather',
          metadata: weather
        };
      } else {
        // Fallback to Google search if API not configured
        return {
          ...data,
          action: 'open-url',
          url: `https://www.google.com/search?q=weather+${city}`,
          metadata: { city }
        };
      }
    } catch (error) {
      console.error('[WEATHER-HANDLER-ERROR]:', error);
      return {
        ...data,
        response: 'Unable to fetch weather information. Please try again.',
        action: 'speak'
      };
    }
  }

  handleWhatsAppMessage(data) {
    // Extract contact and message from userInput
    return {
      ...data,
      action: 'whatsapp-message',
      metadata: {
        platform: 'whatsapp',
        requiresPermission: true,
        message: 'WhatsApp messaging requires device permissions'
      }
    };
  }

  handleTelegramMessage(data) {
    return {
      ...data,
      action: 'telegram-message',
      metadata: {
        platform: 'telegram',
        requiresPermission: true
      }
    };
  }

  handlePhoneCall(data) {
    return {
      ...data,
      action: 'make-call',
      metadata: {
        requiresPermission: true,
        requiresConfirmation: true,
        message: 'Making calls requires phone permission'
      }
    };
  }

  handleSetAlarm(data) {
    return {
      ...data,
      action: 'set-alarm',
      metadata: {
        requiresPermission: true,
        message: 'Setting alarms requires permission'
      }
    };
  }

  async handleSetReminder(data, userId) {
    try {
      const { metadata } = data;

      if (metadata && metadata.time && metadata.title) {
        const result = await reminderService.createReminder(userId, {
          title: metadata.title,
          description: metadata.description || '',
          time: metadata.time,
          repeat: metadata.repeat || 'once',
          type: 'reminder'
        });

        return {
          ...data,
          response: result.voiceResponse,
          action: 'reminder-created',
          metadata: result.reminder
        };
      }

      return {
        ...data,
        response: 'Please provide reminder details like time and description.',
        action: 'speak',
        metadata: { requiresPermission: true }
      };
    } catch (error) {
      console.error('[REMINDER-HANDLER-ERROR]:', error);
      return {
        ...data,
        response: 'Failed to create reminder. Please try again.',
        action: 'speak'
      };
    }
  }

  async handlePlayMusic(data) {
    try {
      const query = data.userInput.replace(/play|music|song/gi, '').trim();
      const result = await spotifyService.play(query);

      if (result.success) {
        return {
          ...data,
          response: result.voiceResponse,
          action: 'play-music',
          metadata: {
            service: 'spotify',
            track: result.track,
            artist: result.artist,
            uri: result.uri
          }
        };
      } else {
        // Fallback: Open Spotify Web Player
        console.info('[MUSIC-HANDLER] Falling back to web player');
        return {
          ...data,
          response: 'Opening Spotify for you.',
          action: 'open-url',
          url: `https://open.spotify.com/search/${encodeURIComponent(query)}`,
          metadata: {
            service: 'spotify',
            fallback: true,
            error: result.message
          }
        };
      }
    } catch (error) {
      console.error('[MUSIC-HANDLER-ERROR]:', error);
      return {
        ...data,
        response: 'Opening Spotify for you.',
        action: 'open-url',
        url: 'https://open.spotify.com',
        metadata: { fallback: true }
      };
    }
  }

  async handleDeviceControl(data) {
    try {
      const result = await deviceService.controlDevice(data.userInput);
      return {
        ...data,
        response: result.message,
        action: 'control-device',
        metadata: result
      };
    } catch (error) {
      console.error('[DEVICE-HANDLER-ERROR]:', error);
      return {
        ...data,
        response: 'I had trouble controlling that device.',
        action: 'speak'
      };
    }
  }

  handleSmartRoutine(data) {
    return {
      ...data,
      action: 'execute-routine',
      metadata: {
        type: 'multi-task',
        requiresSequentialExecution: true
      }
    };
  }

  async handleTakeNote(data, userId) {
    try {
      const { metadata } = data;

      if (metadata && metadata.content) {
        const result = await notesService.createNote(userId, {
          title: metadata.title || 'Voice Note',
          content: metadata.content,
          type: metadata.type || 'note',
          tags: metadata.tags || []
        });

        return {
          ...data,
          response: result.voiceResponse,
          action: 'note-created',
          metadata: result.note
        };
      }

      return {
        ...data,
        response: 'Please tell me what to note down.',
        action: 'speak'
      };
    } catch (error) {
      console.error('[NOTE-HANDLER-ERROR]:', error);
      return {
        ...data,
        response: 'Failed to create note. Please try again.',
        action: 'speak'
      };
    }
  }

  async handleReadNews(data) {
    try {
      const category = data.metadata?.category || null;

      if (newsService.isConfigured()) {
        const news = category
          ? await newsService.getNewsByCategory(category)
          : await newsService.getTopHeadlines();

        return {
          ...data,
          response: news.voiceResponse,
          action: 'show-news',
          metadata: { articles: news.articles, category }
        };
      } else {
        // Fallback to Google News
        return {
          ...data,
          action: 'open-url',
          url: 'https://news.google.com',
          metadata: { fallback: true }
        };
      }
    } catch (error) {
      console.error('[NEWS-HANDLER-ERROR]:', error);
      return {
        ...data,
        response: 'Unable to fetch news. Please try again.',
        action: 'speak'
      };
    }
  }

  async handleTranslate(data) {
    try {
      const { text, targetLang } = data.metadata || {};
      const result = await translateService.translate(text || data.userInput, targetLang || 'es');

      return {
        ...data,
        response: result.translatedText,
        action: 'translate',
        metadata: {
          original: result.originalText,
          translated: result.translatedText,
          lang: result.targetLang
        }
      };
    } catch (error) {
      console.error('[TRANSLATE-HANDLER-ERROR]:', error);
      return {
        ...data,
        response: 'I couldn\'t translate that right now.',
        action: 'speak'
      };
    }
  }

  handleSendEmail(data) {
    return {
      ...data,
      action: 'send-email',
      metadata: {
        requiresPermission: true,
        requiresConfirmation: true
      }
    };
  }

  handleScreenshot(data) {
    return {
      ...data,
      action: 'take-screenshot',
      metadata: {
        requiresPermission: true
      }
    };
  }

  handleVolumeControl(data) {
    return {
      ...data,
      action: 'control-volume',
      metadata: {
        requiresPermission: true
      }
    };
  }

  handleBrightnessControl(data) {
    return {
      ...data,
      action: 'control-brightness',
      metadata: {
        requiresPermission: true
      }
    };
  }

  // Payment Handlers
  handlePhonePePayment(data) {
    return {
      ...data,
      action: 'phonepe-payment',
      metadata: {
        paymentGateway: 'PhonePe',
        requiresConfirmation: true,
        upiEnabled: true
      }
    };
  }

  handleGooglePayPayment(data) {
    return {
      ...data,
      action: 'googlepay-payment',
      metadata: {
        paymentGateway: 'Google Pay',
        requiresConfirmation: true,
        upiEnabled: true
      }
    };
  }

  handlePaytmPayment(data) {
    return {
      ...data,
      action: 'paytm-payment',
      metadata: {
        paymentGateway: 'Paytm',
        requiresConfirmation: true,
        upiEnabled: true
      }
    };
  }

  handleUPIPayment(data) {
    return {
      ...data,
      action: 'upi-payment',
      metadata: {
        paymentGateway: 'UPI',
        requiresConfirmation: true,
        upiEnabled: true
      }
    };
  }

  async handleWikipediaQuery(data) {
    try {
      // Use AI-extracted query if available, otherwise fallback to regex
      let query = data.metadata?.searchQuery || data.userInput;

      // Clean the query strictly
      query = query
        .replace(/^(hey|hello|ok|okay)?\s*(jarvis|orvion|assistant|google|siri)\s*/i, '') // Remove wake words
        .replace(/who is|what is|tell me about|information about|search for|do you know/i, '') // Remove intents
        .trim();

      console.log('[AI-CONTROLLER] Wikipedia Search Query:', query);
      const result = await wikipediaService.quickFact(query);

      if (!result.found) {
        return {
          ...data,
          response: result.voiceResponse || 'I couldn\'t find that on Wikipedia.',
          action: 'speak'
        };
      }

      return {
        ...data,
        response: result.voiceResponse,
        action: 'speak',
        metadata: {
          source: 'wikipedia',
          title: result.title,
          summary: result.summary,
          url: result.url,
          thumbnail: result.thumbnail
        }
      };
    } catch (error) {
      console.error('[WIKIPEDIA-HANDLER-ERROR]:', error);
      return {
        ...data,
        response: 'I encountered an error searching Wikipedia.',
        action: 'speak'
      };
    }
  }

  async handleWebSearch(data) {
    try {
      const results = await searchService.search(data.userInput);
      return {
        ...data,
        response: results.summary,
        action: 'show-results',
        metadata: { results: results.links }
      };
    } catch (error) {
      return this.handleGoogleSearch(data);
    }
  }

  async handleQuickAnswer(data) {
    try {
      const answer = await perplexitySearchService.getAnswer(data.userInput);
      return {
        ...data,
        response: answer,
        action: 'speak',
        metadata: { source: 'perplexity' }
      };
    } catch (error) {
      return {
        ...data,
        response: 'I don\'t have a quick answer for that.',
        action: 'speak'
      };
    }
  }

  // Phase 3 & 4 Handlers (Stubs for now)
  handleCalendarView(data) { return { ...data, action: 'calendar-view' }; }
  handleCalendarCreate(data) { return { ...data, action: 'calendar-create' }; }
  handleCalendarToday(data) { return { ...data, action: 'calendar-today' }; }
  handleGmailCheck(data) { return { ...data, action: 'gmail-check' }; }
  handleGmailRead(data) { return { ...data, action: 'gmail-read' }; }
  handleGmailSend(data) { return { ...data, action: 'gmail-send' }; }
  handleBluetoothScan(data) { return { ...data, action: 'bluetooth-scan' }; }
  handleBluetoothConnect(data) { return { ...data, action: 'bluetooth-connect' }; }

  handleAppLaunch(data) {
    // Extract app name from userInput if not in metadata
    if (!data.metadata?.appName && data.userInput) {
      const input = data.userInput.toLowerCase();
      // Extract app name from patterns like "open X", "launch X", "start X"
      const patterns = [
        /(?:open|launch|start|run)\s+(.+?)(?:\s+app)?(?:\s|$)/i,
        /open\s+(.+?)$/i
      ];

      for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match && match[1]) {
          const appName = match[1].trim();
          if (appName.length > 0) {
            data.metadata = { ...data.metadata, appName };
            break;
          }
        }
      }
    }
    return { ...data, action: 'app-launch' };
  }

  handleAppClose(data) {
    // Extract app name from userInput if not in metadata
    if (!data.metadata?.appName && data.userInput) {
      const input = data.userInput.toLowerCase();
      // Extract app name from patterns like "close X", "quit X", "stop X"
      const patterns = [
        /(?:close|quit|stop|kill|exit)\s+(.+?)(?:\s+app)?(?:\s|$)/i,
        /close\s+(.+?)$/i
      ];

      for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match && match[1]) {
          const appName = match[1].trim();
          if (appName.length > 0) {
            data.metadata = { ...data.metadata, appName };
            break;
          }
        }
      }
    }
    return { ...data, action: 'app-close' };
  }

  handleListApps(data) {
    // List apps doesn't need app name extraction
    return { ...data, action: 'list-apps' };
  }

  handleScreenRecord(data) { return { ...data, action: 'screen-record' }; }
  handleScreenShare(data) { return { ...data, action: 'screen-share' }; }
  handleInstagramDM(data) { return { ...data, action: 'instagram-dm' }; }
  handleInstagramStory(data) { return { ...data, action: 'instagram-story' }; }
  handleInstagramProfile(data) { return { ...data, action: 'instagram-profile' }; }
  handleCastMedia(data) { return { ...data, action: 'cast-media' }; }
  handleCastYouTube(data) { return { ...data, action: 'cast-youtube' }; }
  handleCameraPhoto(data) { return { ...data, action: 'camera-photo' }; }
  handleCameraVideo(data) { return { ...data, action: 'camera-video' }; }
  handlePickContact(data) { return { ...data, action: 'pick-contact' }; }
  handleItineraryCreate(data) { return { ...data, action: 'itinerary-create' }; }

  /**
   * Voice Control Handlers
   * Handle ElevenLabs voice change, preview, and management
   */

  /**
   * Handle voice change command
   * Extracts gender/style from command and triggers voice change
   */
  handleChangeVoice(data, userId) {
    const command = data.userInput.toLowerCase();

    // Extract voice parameters from command
    let gender = null;
    let style = null;
    let accent = null;

    // Detect gender
    if (command.includes('male') && !command.includes('female')) {
      gender = 'male';
    } else if (command.includes('female')) {
      gender = 'female';
    }

    // Detect style
    if (command.includes('professional') || command.includes('formal')) {
      style = 'professional';
    } else if (command.includes('friendly') || command.includes('casual')) {
      style = 'friendly';
    } else {
      style = 'default';
    }

    // Detect accent
    if (command.includes('british') || command.includes('uk')) {
      accent = 'british';
    } else if (command.includes('american') || command.includes('us')) {
      accent = 'american';
    }

    console.info('[VOICE-CONTROL] Change voice request:', { gender, style, accent, userId });

    return {
      ...data,
      response: `Changing voice to ${gender || 'default'} ${style || ''}`.trim(),
      action: 'change-voice',
      metadata: {
        gender: gender || 'male',
        style: style || 'default',
        accent,
        userId,
        requiresSocketEmit: true // Signal to emit Socket.IO event
      }
    };
  }

  /**
   * Handle list available voices
   */
  handleListVoices(data, userId) {
    console.info('[VOICE-CONTROL] List voices request from user:', userId);

    return {
      ...data,
      response: 'Here are the available voices: Male voices - Josh, Arnold, and Bill. Female voices - Bella, Elli, and Dorothy.',
      action: 'list-voices',
      metadata: {
        userId,
        requiresSocketEmit: true,
        voices: {
          male: ['Josh', 'Arnold', 'Bill'],
          female: ['Bella', 'Elli', 'Dorothy']
        }
      }
    };
  }

  /**
   * Handle voice preview command
   */
  handlePreviewVoice(data, userId) {
    const command = data.userInput.toLowerCase();

    // Extract voice to preview
    let gender = 'male';
    let style = 'default';

    if (command.includes('female')) {
      gender = 'female';
    }

    if (command.includes('professional')) {
      style = 'professional';
    } else if (command.includes('friendly')) {
      style = 'friendly';
    }

    console.info('[VOICE-CONTROL] Preview voice request:', { gender, style, userId });

    return {
      ...data,
      response: `Let me preview that voice for you`,
      action: 'preview-voice',
      metadata: {
        gender,
        style,
        userId,
        requiresSocketEmit: true
      }
    };
  }

  /**
   * Handle reset voice to default
   */
  handleResetVoice(data, userId) {
    console.info('[VOICE-CONTROL] Reset voice request from user:', userId);

    return {
      ...data,
      response: 'Resetting voice to default',
      action: 'reset-voice',
      metadata: {
        userId,
        requiresSocketEmit: true
      }
    };
  }
}

const aiController = new AIController();
export default aiController;
