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
      'screen-record': this.handleScreenRecord,
      'screen-share': this.handleScreenShare,
      'web-search': this.handleWebSearch,
      'quick-answer': this.handleQuickAnswer,
      // Phase 4 handlers - New Features
      'instagram-dm': this.handleInstagramDM,
      'instagram-story': this.handleInstagramStory,
      'instagram-profile': this.handleInstagramProfile,
      'cast-media': this.handleCastMedia,
      'cast-youtube': this.handleCastYouTube,
      'camera-photo': this.handleCameraPhoto,
      'camera-video': this.handleCameraVideo,
      'pick-contact': this.handlePickContact
    };
  }

  /**
   * Main entry point for AI processing
   */
  async processCommand(command, userId, assistantName, userName) {
    try {
      console.info('[COPILOT-ANALYSIS]', 'Processing command:', command);

      // Save to user history
      await this.saveToHistory(userId, command);

      // Add user message to conversation
      await conversationService.addMessage(userId, 'user', command);

      // Get conversation context
      const conversationContext = await conversationService.getContext(userId);

      // Get AI response from Gemini with conversation context
      const geminiResult = await geminiResponse(command, assistantName, userName, conversationContext);
      
      // Parse JSON response
      let parsedData;
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = geminiResult.match(/```json\s*([\s\S]*?)\s*```/) || 
                         geminiResult.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : geminiResult;
        parsedData = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        parsedData = {
          type: 'general',
          userInput: command,
          response: 'I apologize, I had trouble understanding that. Could you please rephrase?'
        };
      }

      // Execute action based on type
      const result = await this.executeAction(parsedData, userId);

      // Add assistant response to conversation
      await conversationService.addMessage(userId, 'assistant', result.response || result.voiceResponse);

      // Extract and update context entities
      const messages = await conversationService.getContext(userId, 5);
      if (messages) {
        const entities = conversationService.extractEntities(messages.split('\n'));
        await conversationService.updateContext(userId, entities);
      }

      return result;
    } catch (error) {
      console.error('[AI-CONTROLLER-ERROR]:', error);
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
      action: 'open-url',
      url: `https://www.google.com/search?q=${query}`,
      metadata: { searchEngine: 'google' }
    };
  }

  handleYouTubeSearch(data) {
    const query = encodeURIComponent(data.userInput);
    return {
      ...data,
      action: 'open-url',
      url: `https://www.youtube.com/results?search_query=${query}`,
      metadata: { platform: 'youtube', type: 'search' }
    };
  }

  handleYouTubePlay(data) {
    const query = encodeURIComponent(data.userInput);
    return {
      ...data,
      action: 'open-url',
      url: `https://www.youtube.com/results?search_query=${query}`,
      metadata: { platform: 'youtube', type: 'play' }
    };
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
      action: 'open-url',
      url: 'https://www.google.com/search?q=calculator',
      metadata: { app: 'calculator' }
    };
  }

  handleInstagram(data) {
    return {
      ...data,
      action: 'open-url',
      url: 'https://www.instagram.com/',
      metadata: { platform: 'instagram' }
    };
  }

  handleFacebook(data) {
    return {
      ...data,
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

  handlePlayMusic(data) {
    return {
      ...data,
      action: 'play-music',
      metadata: {
        service: 'default-music-player'
      }
    };
  }

  handleDeviceControl(data) {
    return {
      ...data,
      action: 'control-device',
      metadata: {
        requiresDeviceConnection: true,
        supportedDevices: ['android-tv', 'chromecast', 'projector', 'smart-lights']
      }
    };
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

  handleTranslate(data) {
    return {
      ...data,
      action: 'translate',
      metadata: {
        service: 'google-translate'
      }
    };
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

  /**
   * Wikipedia Query Handler
   */
  async handleWikipediaQuery(data) {
    try {
      const query = data.query || data.topic || data.userInput;
      
      if (!query) {
        return {
          ...data,
          response: 'What would you like to know about?',
          voiceResponse: 'What would you like to know about?'
        };
      }

      console.info('[WIKIPEDIA]', `Searching for: ${query}`);
      
      // Get quick fact from Wikipedia
      const result = await wikipediaService.quickFact(query);

      return {
        ...data,
        action: 'wikipedia-result',
        result,
        response: result.voiceResponse,
        voiceResponse: result.voiceResponse,
        metadata: {
          found: result.found,
          title: result.title,
          url: result.url,
          thumbnail: result.thumbnail
        }
      };
    } catch (error) {
      console.error('[WIKIPEDIA-ERROR]:', error);
      return {
        ...data,
        response: `I couldn't find information about that. ${error.message}`,
        voiceResponse: `I couldn't find information about that.`
      };
    }
  }

  /**
   * Web Search Handler
   */
  async handleWebSearch(data) {
    try {
      const query = data.query || data.searchQuery || data.userInput;
      
      if (!query) {
        return {
          ...data,
          response: 'What would you like to search for?',
          voiceResponse: 'What would you like to search for?'
        };
      }

      console.info('[SEARCH]', `Searching for: ${query}`);
      
      const result = await searchService.search(query, { limit: 5 });

      return {
        ...data,
        action: 'search-result',
        result,
        response: result.voiceResponse,
        voiceResponse: result.voiceResponse,
        metadata: {
          fallback: result.fallback,
          url: result.url,
          totalResults: result.totalResults
        }
      };
    } catch (error) {
      console.error('[SEARCH-ERROR]:', error);
      return {
        ...data,
        response: `I couldn't search for that. ${error.message}`,
        voiceResponse: `I couldn't complete the search.`
      };
    }
  }

  /**
   * Quick Answer Handler (Featured snippet simulation)
   */
  async handleQuickAnswer(data) {
    try {
      const query = data.query || data.question || data.userInput;
      
      if (!query) {
        return {
          ...data,
          response: 'What\'s your question?',
          voiceResponse: 'What\'s your question?'
        };
      }

      console.info('[QUICK-ANSWER]', `Finding answer for: ${query}`);
      
      const result = await searchService.getQuickAnswer(query);

      return {
        ...data,
        action: 'quick-answer',
        result,
        response: result.voiceResponse,
        voiceResponse: result.voiceResponse,
        metadata: {
          found: result.found,
          source: result.source,
          url: result.url
        }
      };
    } catch (error) {
      console.error('[QUICK-ANSWER-ERROR]:', error);
      return {
        ...data,
        response: `I couldn't find an answer. ${error.message}`,
        voiceResponse: `I couldn't find an answer.`
      };
    }
  }

  // ==================== PHASE 3 HANDLERS ====================

  /**
   * Calendar View Handler
   */
  async handleCalendarView(data) {
    try {
      const accessToken = data.calendarToken || data.accessToken;
      
      if (!accessToken) {
        const authUrl = calendarService.getAuthUrl();
        return {
          ...data,
          action: 'calendar-auth-required',
          authUrl: authUrl.authUrl,
          response: 'Please connect your Google Calendar first',
          voiceResponse: 'You need to connect your Google Calendar to use this feature'
        };
      }

      console.info('[CALENDAR]', 'Fetching upcoming events');
      const result = await calendarService.getUpcomingEvents(accessToken, 7);

      return {
        ...data,
        action: 'calendar-view',
        result,
        response: result.message,
        voiceResponse: result.message
      };
    } catch (error) {
      console.error('[CALENDAR-ERROR]:', error);
      const fallback = calendarService.getFallbackUrl();
      return {
        ...data,
        action: 'open-url',
        url: fallback.url,
        response: 'Opening Google Calendar in browser',
        voiceResponse: fallback.message
      };
    }
  }

  /**
   * Calendar Create Event Handler
   */
  async handleCalendarCreate(data) {
    try {
      const accessToken = data.calendarToken || data.accessToken;
      
      if (!accessToken) {
        const authUrl = calendarService.getAuthUrl();
        return {
          ...data,
          action: 'calendar-auth-required',
          authUrl: authUrl.authUrl,
          response: 'Please connect your Google Calendar first',
          voiceResponse: 'You need to connect your Google Calendar'
        };
      }

      // Extract event details from user input
      const eventDetails = {
        title: data.eventTitle || data.title || 'New Event',
        startTime: data.startTime || new Date().toISOString(),
        endTime: data.endTime,
        description: data.description || '',
        location: data.location || ''
      };

      console.info('[CALENDAR]', 'Creating event:', eventDetails.title);
      const result = await calendarService.createEvent(accessToken, eventDetails);

      return {
        ...data,
        action: 'calendar-created',
        result,
        response: result.message,
        voiceResponse: result.message
      };
    } catch (error) {
      console.error('[CALENDAR-CREATE-ERROR]:', error);
      return {
        ...data,
        response: 'Failed to create calendar event',
        voiceResponse: 'I couldn\'t create the calendar event'
      };
    }
  }

  /**
   * Calendar Today Handler
   */
  async handleCalendarToday(data) {
    try {
      const accessToken = data.calendarToken || data.accessToken;
      
      if (!accessToken) {
        const authUrl = calendarService.getAuthUrl();
        return {
          ...data,
          action: 'calendar-auth-required',
          authUrl: authUrl.authUrl,
          response: 'Please connect your Google Calendar first',
          voiceResponse: 'You need to connect your Google Calendar'
        };
      }

      console.info('[CALENDAR]', 'Fetching today\'s events');
      const result = await calendarService.getTodayEvents(accessToken);

      return {
        ...data,
        action: 'calendar-today',
        result,
        response: result.message,
        voiceResponse: result.message
      };
    } catch (error) {
      console.error('[CALENDAR-TODAY-ERROR]:', error);
      const fallback = calendarService.getFallbackUrl();
      return {
        ...data,
        action: 'open-url',
        url: fallback.url,
        response: 'Opening Google Calendar',
        voiceResponse: fallback.message
      };
    }
  }

  /**
   * Gmail Check Handler
   */
  async handleGmailCheck(data) {
    try {
      const accessToken = data.gmailToken || data.accessToken;
      
      if (!accessToken) {
        const authUrl = gmailService.getAuthUrl();
        return {
          ...data,
          action: 'gmail-auth-required',
          authUrl: authUrl.authUrl,
          response: 'Please connect your Gmail account first',
          voiceResponse: 'You need to connect your Gmail account'
        };
      }

      console.info('[GMAIL]', 'Checking unread emails');
      const result = await gmailService.getUnreadCount(accessToken);

      return {
        ...data,
        action: 'gmail-check',
        result,
        response: result.message,
        voiceResponse: result.message
      };
    } catch (error) {
      console.error('[GMAIL-CHECK-ERROR]:', error);
      const fallback = gmailService.getFallbackUrl();
      return {
        ...data,
        action: 'open-url',
        url: fallback.url,
        response: 'Opening Gmail in browser',
        voiceResponse: fallback.message
      };
    }
  }

  /**
   * Gmail Read Handler
   */
  async handleGmailRead(data) {
    try {
      const accessToken = data.gmailToken || data.accessToken;
      
      if (!accessToken) {
        const authUrl = gmailService.getAuthUrl();
        return {
          ...data,
          action: 'gmail-auth-required',
          authUrl: authUrl.authUrl,
          response: 'Please connect your Gmail account first',
          voiceResponse: 'You need to connect your Gmail account'
        };
      }

      console.info('[GMAIL]', 'Reading recent emails');
      const result = await gmailService.getRecentEmails(accessToken, 5);

      return {
        ...data,
        action: 'gmail-read',
        result,
        response: result.message,
        voiceResponse: result.message
      };
    } catch (error) {
      console.error('[GMAIL-READ-ERROR]:', error);
      const fallback = gmailService.getFallbackUrl();
      return {
        ...data,
        action: 'open-url',
        url: fallback.url,
        response: 'Opening Gmail',
        voiceResponse: fallback.message
      };
    }
  }

  /**
   * Gmail Send Handler
   */
  async handleGmailSend(data) {
    try {
      const accessToken = data.gmailToken || data.accessToken;
      
      if (!accessToken) {
        const authUrl = gmailService.getAuthUrl();
        return {
          ...data,
          action: 'gmail-auth-required',
          authUrl: authUrl.authUrl,
          response: 'Please connect your Gmail account first',
          voiceResponse: 'You need to connect your Gmail account'
        };
      }

      const emailData = {
        to: data.to || data.recipient,
        subject: data.subject || 'No Subject',
        body: data.body || data.message || '',
        cc: data.cc,
        bcc: data.bcc
      };

      if (!emailData.to) {
        return {
          ...data,
          response: 'Please specify the recipient email address',
          voiceResponse: 'Who would you like to send the email to?'
        };
      }

      console.info('[GMAIL]', 'Sending email to:', emailData.to);
      const result = await gmailService.sendEmail(accessToken, emailData);

      return {
        ...data,
        action: 'gmail-sent',
        result,
        response: result.message,
        voiceResponse: result.message
      };
    } catch (error) {
      console.error('[GMAIL-SEND-ERROR]:', error);
      return {
        ...data,
        response: 'Failed to send email',
        voiceResponse: 'I couldn\'t send the email'
      };
    }
  }

  /**
   * Bluetooth Scan Handler (Frontend)
   */
  async handleBluetoothScan(data) {
    return {
      ...data,
      action: 'bluetooth-scan',
      response: 'Scanning for Bluetooth devices',
      voiceResponse: 'Scanning for nearby Bluetooth devices',
      note: 'This action is handled by the frontend Bluetooth service'
    };
  }

  /**
   * Bluetooth Connect Handler (Frontend)
   */
  async handleBluetoothConnect(data) {
    return {
      ...data,
      action: 'bluetooth-connect',
      deviceName: data.deviceName || data.device,
      response: 'Connecting to Bluetooth device',
      voiceResponse: `Connecting to ${data.deviceName || 'device'}`,
      note: 'This action is handled by the frontend Bluetooth service'
    };
  }

  /**
   * App Launch Handler (Frontend)
   */
  async handleAppLaunch(data) {
    const appName = data.appName || data.app || data.userInput;
    return {
      ...data,
      action: 'app-launch',
      appName: appName,
      response: `Opening ${appName}`,
      voiceResponse: `Launching ${appName}`,
      note: 'This action is handled by the frontend App Launch service'
    };
  }

  /**
   * Screen Record Handler (Frontend)
   */
  async handleScreenRecord(data) {
    return {
      ...data,
      action: 'screen-record',
      response: 'Starting screen recording',
      voiceResponse: 'Starting screen recording',
      note: 'This action is handled by the frontend Screen service'
    };
  }

  /**
   * Screen Share Handler (Frontend)
   */
  async handleScreenShare(data) {
    return {
      ...data,
      action: 'screen-share',
      response: 'Starting screen share',
      voiceResponse: 'Starting screen share',
      note: 'This action is handled by the frontend Screen service'
    };
  }

  /**
   * Instagram DM Handler (Frontend)
   */
  async handleInstagramDM(data) {
    const username = data.username || data.recipient || data.userInput;
    return {
      ...data,
      action: 'instagram-dm',
      username: username,
      response: `Opening Instagram DM with ${username}`,
      voiceResponse: `Opening Instagram direct message to ${username}`,
      note: 'This action is handled by the frontend Instagram service'
    };
  }

  /**
   * Instagram Story Handler (Frontend)
   */
  async handleInstagramStory(data) {
    return {
      ...data,
      action: 'instagram-story',
      response: 'Opening Instagram story camera',
      voiceResponse: 'Opening Instagram stories',
      note: 'This action is handled by the frontend Instagram service'
    };
  }

  /**
   * Instagram Profile Handler (Frontend)
   */
  async handleInstagramProfile(data) {
    const username = data.username || data.profile || data.userInput;
    return {
      ...data,
      action: 'instagram-profile',
      username: username,
      response: `Opening Instagram profile ${username}`,
      voiceResponse: `Showing Instagram profile of ${username}`,
      note: 'This action is handled by the frontend Instagram service'
    };
  }

  /**
   * Cast Media Handler (Frontend)
   */
  async handleCastMedia(data) {
    const mediaUrl = data.mediaUrl || data.url || data.userInput;
    return {
      ...data,
      action: 'cast-media',
      mediaUrl: mediaUrl,
      response: `Casting media to TV`,
      voiceResponse: `Casting to your television`,
      note: 'This action is handled by the frontend Chromecast service'
    };
  }

  /**
   * Cast YouTube Handler (Frontend)
   */
  async handleCastYouTube(data) {
    const videoId = data.videoId || data.query || data.userInput;
    return {
      ...data,
      action: 'cast-youtube',
      videoId: videoId,
      response: `Casting YouTube video to TV`,
      voiceResponse: `Casting YouTube to your television`,
      note: 'This action is handled by the frontend Chromecast service'
    };
  }

  /**
   * Camera Photo Handler (Frontend)
   */
  async handleCameraPhoto(data) {
    return {
      ...data,
      action: 'camera-photo',
      response: 'Taking a photo',
      voiceResponse: 'Taking a picture',
      note: 'This action is handled by the frontend Camera service'
    };
  }

  /**
   * Camera Video Handler (Frontend)
   */
  async handleCameraVideo(data) {
    return {
      ...data,
      action: 'camera-video',
      response: 'Starting video recording',
      voiceResponse: 'Starting camera recording',
      note: 'This action is handled by the frontend Camera service'
    };
  }

  /**
   * Pick Contact Handler (Frontend)
   */
  async handlePickContact(data) {
    return {
      ...data,
      action: 'pick-contact',
      response: 'Opening contact picker',
      voiceResponse: 'Selecting a contact',
      note: 'This action is handled by the frontend Contacts service'
    };
  }
}

// Export singleton instance
const aiController = new AIController();
export default aiController;
