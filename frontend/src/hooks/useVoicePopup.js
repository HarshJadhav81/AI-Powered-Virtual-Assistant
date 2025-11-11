/**
 * useVoicePopup Hook - Integrates popup system with voice commands
 */

import { useEffect } from 'react';
import { usePopup } from '../context/PopupContext';

export const useVoicePopup = (socket) => {
  const popup = usePopup();

  useEffect(() => {
    if (!socket) return;

    // Listen for AI responses and show appropriate popups
    socket.on('aiResponse', (response) => {
      console.log('AI Response received:', response);

      // Parse response and show appropriate popup
      if (response.success) {
        handleSuccessResponse(response);
      } else {
        popup.showError(response.message || 'Command failed', response);
      }
    });

    // Device response
    socket.on('deviceResponse', (response) => {
      console.log('Device response:', response);
      if (response.success) {
        popup.showDevice({
          deviceName: response.deviceName || 'Device',
          action: response.action || 'Action',
          status: response.status || 'Completed'
        });
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      popup.showError(error.message || 'An error occurred', error);
    });

    return () => {
      socket.off('aiResponse');
      socket.off('deviceResponse');
      socket.off('error');
    };
  }, [socket, popup]);

  // Handle different types of successful responses
  const handleSuccessResponse = (response) => {
    const { action, result, data } = response;

    switch (action) {
      case 'weather':
        if (result?.weather) {
          popup.showWeather({
            location: result.location || 'Unknown',
            temp: result.weather.temp,
            description: result.weather.description,
            icon: result.weather.icon
          });
        }
        break;

      case 'play-music':
      case 'music':
        if (result?.track) {
          popup.showMusic({
            action: 'play',
            track: {
              name: result.track.name,
              artist: result.track.artist || result.track.artists?.join(', '),
              image: result.track.image || result.track.album?.images?.[0]?.url
            },
            message: `Now playing: ${result.track.name}`
          });
        } else if (result?.message) {
          popup.showMusic({
            action: 'info',
            message: result.message
          });
        }
        break;

      case 'pause-music':
        popup.showMusic({
          action: 'pause',
          message: 'Music paused'
        });
        break;

      case 'next-track':
        popup.showMusic({
          action: 'next',
          message: 'Next track'
        });
        break;

      case 'previous-track':
        popup.showMusic({
          action: 'previous',
          message: 'Previous track'
        });
        break;

      case 'news':
        if (result?.articles) {
          popup.showNews({
            headline: result.articles[0]?.title,
            count: result.articles.length,
            category: result.category
          });
        }
        break;

      case 'youtube':
      case 'search-youtube':
        if (result?.videos && result.videos.length > 0) {
          popup.showYouTube({
            title: result.videos[0].title,
            thumbnail: result.videos[0].thumbnail,
            count: result.videos.length,
            url: result.videos[0].url
          });
        }
        break;

      case 'translate':
        if (result?.translatedText) {
          popup.showTranslation({
            translatedText: result.translatedText,
            targetLanguage: result.targetLanguage || 'Unknown',
            sourceLanguage: result.sourceLanguage
          });
        }
        break;

      case 'search':
      case 'google-search':
        popup.showSearch({
          query: result?.query || data?.query,
          results: result?.results
        });
        break;

      case 'wikipedia':
        if (result?.title) {
          popup.showWikipedia({
            title: result.title,
            summary: result.summary || result.extract,
            url: result.url
          });
        }
        break;

      case 'open-app':
      case 'launch-app':
        popup.showSuccess(`Opening ${result?.appName || 'application'}`, result);
        break;

      case 'device-control':
        popup.showDevice({
          deviceName: result?.deviceName || 'Device',
          action: result?.action || 'Control',
          status: result?.status || 'Success'
        });
        break;

      case 'calendar':
      case 'create-event':
        popup.showCalendar({
          message: result?.message || 'Event created successfully',
          event: result?.event
        });
        break;

      case 'gmail':
      case 'send-email':
        popup.showGmail({
          message: result?.message || 'Email sent successfully',
          count: result?.count
        });
        break;

      case 'reminder':
      case 'set-reminder':
        popup.showReminder({
          message: result?.message || result?.text,
          time: result?.time
        });
        break;

      case 'note':
      case 'create-note':
        popup.showNote({
          message: result?.message || 'Note saved successfully',
          title: result?.title
        });
        break;

      case 'scan-devices':
        popup.showSuccess(`Found ${result?.count || 0} devices`, result);
        break;

      case 'volume':
        popup.showSuccess(`Volume set to ${result?.volume || 0}%`, result);
        break;

      default:
        // Generic AI response
        if (result?.message || data?.message) {
          popup.showAI({
            response: result?.message || data?.message,
            action: action
          });
        } else {
          popup.showSuccess('Command executed successfully', response);
        }
    }
  };

  // Helper function to show voice command popup
  const showVoiceCommand = (command) => {
    popup.showVoiceCommand(command);
  };

  // Helper function to show loading popup
  const showLoading = (message) => {
    return popup.showLoading(message);
  };

  return {
    showVoiceCommand,
    showLoading,
    ...popup
  };
};

export default useVoicePopup;
