/**
 * Popup Context - Universal popup system for all features
 * Provides popup notifications for voice commands and actions
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const PopupContext = createContext();

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within PopupProvider');
  }
  return context;
};

export const PopupProvider = ({ children }) => {
  const [popups, setPopups] = useState([]);
  const [popupSettings, setPopupSettings] = useState({
    position: 'top-right', // top-right, top-left, bottom-right, bottom-left, center
    size: 'medium', // small, medium, large
    animation: 'slide', // slide, fade, bounce, scale
    duration: 5000, // milliseconds
    soundEnabled: true,
    maxPopups: 3
  });

  // Generate unique ID for each popup
  const generateId = () => `popup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Show popup
  const showPopup = useCallback((config) => {
    const popup = {
      id: generateId(),
      type: config.type || 'info', // success, error, warning, info, custom
      title: config.title || '',
      message: config.message || '',
      icon: config.icon || null,
      image: config.image || null,
      action: config.action || null,
      data: config.data || null,
      duration: config.duration || popupSettings.duration,
      closeable: config.closeable !== undefined ? config.closeable : true,
      timestamp: new Date().toISOString()
    };

    setPopups(prev => {
      const newPopups = [popup, ...prev];
      // Limit number of popups
      if (newPopups.length > popupSettings.maxPopups) {
        return newPopups.slice(0, popupSettings.maxPopups);
      }
      return newPopups;
    });

    // Auto-remove popup after duration
    if (popup.duration > 0) {
      setTimeout(() => {
        closePopup(popup.id);
      }, popup.duration);
    }

    // Play sound if enabled
    if (popupSettings.soundEnabled && config.type) {
      playNotificationSound(config.type);
    }

    return popup.id;
  }, [popupSettings]);

  // Close popup
  const closePopup = useCallback((id) => {
    setPopups(prev => prev.filter(popup => popup.id !== id));
  }, []);

  // Close all popups
  const closeAllPopups = useCallback(() => {
    setPopups([]);
  }, []);

  // Update popup settings
  const updateSettings = useCallback((newSettings) => {
    setPopupSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Play notification sound
  const playNotificationSound = (type) => {
    try {
      const audio = new Audio();
      switch (type) {
        case 'success':
          audio.src = '/sounds/success.mp3';
          break;
        case 'error':
          audio.src = '/sounds/error.mp3';
          break;
        case 'warning':
          audio.src = '/sounds/warning.mp3';
          break;
        default:
          audio.src = '/sounds/notification.mp3';
      }
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  // Feature-specific popup helpers
  const popupHelpers = {
    // Weather popup
    showWeather: (data) => showPopup({
      type: 'info',
      title: `Weather in ${data.location}`,
      message: `${data.temp}°C - ${data.description}`,
      icon: data.icon || '🌤️',
      data: data,
      action: 'weather'
    }),

    // Music popup
    showMusic: (data) => showPopup({
      type: 'success',
      title: data.action === 'play' ? '🎵 Now Playing' : '🎵 Music',
      message: data.track ? `${data.track.name} - ${data.track.artist}` : data.message,
      image: data.track?.image,
      data: data,
      action: 'music'
    }),

    // News popup
    showNews: (data) => showPopup({
      type: 'info',
      title: '📰 Latest News',
      message: data.headline || `${data.count} articles found`,
      data: data,
      action: 'news'
    }),

    // YouTube popup
    showYouTube: (data) => showPopup({
      type: 'success',
      title: '📺 YouTube',
      message: data.title || `${data.count} videos found`,
      image: data.thumbnail,
      data: data,
      action: 'youtube'
    }),

    // Translation popup
    showTranslation: (data) => showPopup({
      type: 'success',
      title: `🌐 Translated to ${data.targetLanguage}`,
      message: data.translatedText,
      data: data,
      action: 'translate'
    }),

    // Search popup
    showSearch: (data) => showPopup({
      type: 'info',
      title: '🔍 Search Results',
      message: data.query || 'Search completed',
      data: data,
      action: 'search'
    }),

    // Wikipedia popup
    showWikipedia: (data) => showPopup({
      type: 'info',
      title: `📚 ${data.title}`,
      message: data.summary?.substring(0, 150) + '...',
      data: data,
      action: 'wikipedia'
    }),

    // Device control popup
    showDevice: (data) => showPopup({
      type: 'success',
      title: `🔌 ${data.deviceName}`,
      message: `${data.action} - ${data.status}`,
      data: data,
      action: 'device'
    }),

    // Calendar popup
    showCalendar: (data) => showPopup({
      type: 'info',
      title: '📅 Calendar',
      message: data.message || 'Event created',
      data: data,
      action: 'calendar'
    }),

    // Gmail popup
    showGmail: (data) => showPopup({
      type: 'info',
      title: '📧 Gmail',
      message: data.message || `${data.count} emails`,
      data: data,
      action: 'gmail'
    }),

    // Reminder popup
    showReminder: (data) => showPopup({
      type: 'warning',
      title: '⏰ Reminder',
      message: data.message || data.text,
      data: data,
      action: 'reminder'
    }),

    // Note popup
    showNote: (data) => showPopup({
      type: 'success',
      title: '📝 Note',
      message: data.message || 'Note saved',
      data: data,
      action: 'note'
    }),

    // AI response popup
    showAI: (data) => showPopup({
      type: 'info',
      title: '🤖 AI Assistant',
      message: data.response || data.message,
      data: data,
      action: 'ai'
    }),

    // Error popup
    showError: (message, details) => showPopup({
      type: 'error',
      title: '❌ Error',
      message: message,
      data: details,
      duration: 7000
    }),

    // Success popup
    showSuccess: (message, details) => showPopup({
      type: 'success',
      title: '✅ Success',
      message: message,
      data: details
    }),

    // Warning popup
    showWarning: (message, details) => showPopup({
      type: 'warning',
      title: '⚠️ Warning',
      message: message,
      data: details
    }),

    // Voice command popup
    showVoiceCommand: (command) => showPopup({
      type: 'info',
      title: '🎤 Voice Command',
      message: command,
      duration: 3000
    }),

    // Loading popup
    showLoading: (message) => showPopup({
      type: 'info',
      title: '⏳ Processing',
      message: message || 'Please wait...',
      closeable: false,
      duration: 0 // No auto-close
    })
  };

  const value = {
    popups,
    popupSettings,
    showPopup,
    closePopup,
    closeAllPopups,
    updateSettings,
    ...popupHelpers
  };

  return (
    <PopupContext.Provider value={value}>
      {children}
    </PopupContext.Provider>
  );
};

export default PopupContext;
