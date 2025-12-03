import React, { useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import { useChatContext } from '../context/ChatContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import aiImg from "../assets/ai.gif"
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";
import userImg from "../assets/user.gif"
import socketService from '../services/socketService'
import VoiceAssistant from '../services/voiceAssistant'
import vadService from '../services/vadService'
import paymentService from '../services/paymentService'
import navigationService from '../services/navigationService'
import voicePersonality from '../services/voicePersonality'
import bluetoothService from '../services/bluetoothService'
import appLaunchService from '../services/appLaunchService'
import messagingService from '../services/messagingService'
import screenService from '../services/screenService'
import instagramService from '../services/instagramService'
import chromecastService from '../services/chromecastService'
import cameraService from '../services/cameraService'
import contactsService from '../services/contactsService'
import ModeToggle from '../components/ModeToggle'
import toast from 'react-hot-toast'
import useVoicePopup from '../hooks/useVoicePopup'
import { usePopup } from '../context/PopupContext'

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext)
  const { switchMode } = useChatContext()
  const {
    showWeather, showMusic, showNews, showYouTube, showTranslation,
    showSearch, showWikipedia, showDevice, showCalendar, showGmail,
    showReminder, showNote, showVoiceCommand, showSuccess, showError,
    showWarning, showLoading
  } = usePopup()
  const navigate = useNavigate()
  const [listening, setListening] = useState(false)
  const [isAssistantActive, setIsAssistantActive] = useState(false)
  const [userText, setUserText] = useState("")
  const [aiText, setAiText] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [partialTranscript, setPartialTranscript] = useState("")
  const [streamingResponse, setStreamingResponse] = useState("")
  const [searchSources, setSearchSources] = useState([])
  const [audioLevel, setAudioLevel] = useState(0)
  const isSpeakingRef = useRef(false)
  const voiceAssistantRef = useRef(null)
  const [ham, setHam] = useState(false)
  const synth = window.speechSynthesis
  const socketRef = useRef(null)
  const hasGreeted = useRef(false)
  const [speechEnabled, setSpeechEnabled] = useState(false)
  const speechInitialized = useRef(false)
  const userDataRef = useRef(userData);

  // Update ref when userData changes
  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  // Set mode to voice on mount
  useEffect(() => {
    switchMode('voice');
  }, [switchMode]);

  // Guard against missing userData
  if (!userData) {
    navigate("/signin");
    return null;
  }

  // Initialize popup system for voice feedback
  useVoicePopup(socketRef.current);

  const handleLogOut = async () => {
    try {
      // Cleanup connections
      if (voiceAssistantRef.current) {
        voiceAssistantRef.current.destroy();
      }
      socketService.disconnect();

      const result = await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true })
      setUserData(null)
      navigate("/signin")
    } catch (error) {
      setUserData(null)
      console.log(error)
    }
  }

  const speak = (text) => {
    if (!text || typeof text !== 'string') {
      console.warn('Speak called with invalid text:', text);
      isSpeakingRef.current = false;
      if (voiceAssistantRef.current && !voiceAssistantRef.current.isListening) {
        voiceAssistantRef.current.start();
      }
      return;
    }

    let speakText = text;
    if (text.length > 500) {
      speakText = text.substring(0, 497) + '...';
      console.warn('[SPEECH] Text truncated to 500 characters');
    }

    try {
      synth.cancel();
    } catch (e) {
      console.warn('[SPEECH] Error canceling previous speech:', e);
    }

    if (!synth) {
      console.error('[SPEECH] Speech synthesis not available');
      isSpeakingRef.current = false;
      return;
    }

    try {
      const utterance = voicePersonality.createUtterance(speakText, {
        lang: 'en-US',
        onEnd: () => {
          console.log('[SPEECH] Finished speaking');
          setAiText("");
          isSpeakingRef.current = false;
          setTimeout(() => {
            if (voiceAssistantRef.current && !voiceAssistantRef.current.isListening) {
              console.log('[SPEECH] Restarting voice assistant');
              voiceAssistantRef.current.start();
            }
          }, 500);
        },
        onError: (error) => {
          console.error('[SPEECH] Speech synthesis error:', {
            type: error.type,
            error: error.error,
            message: error.message,
            charIndex: error.charIndex
          });

          setAiText("");
          isSpeakingRef.current = false;

          if (error.error === 'not-allowed') {
            setAiText(speakText);
            toast('Click anywhere on the page to enable voice responses');
          } else if (error.error === 'interrupted' || error.error === 'canceled') {
            setAiText(speakText);
          } else if (error.error === 'synthesis-failed') {
            setAiText(speakText);
            try {
              synth.cancel();
            } catch (e) {
              console.warn('[SPEECH] Error during recovery:', e);
            }
          } else if (error.error === 'audio-busy') {
            setAiText(speakText);
          }

          setTimeout(() => {
            if (voiceAssistantRef.current && !voiceAssistantRef.current.isListening && !isSpeakingRef.current) {
              console.log('[SPEECH] Restarting voice assistant after error');
              voiceAssistantRef.current.start();
            }
          }, 1000);
        }
      });

      isSpeakingRef.current = true;
      synth.speak(utterance);

      setTimeout(() => {
        if (isSpeakingRef.current) {
          console.warn('[SPEECH] Speech timeout - forcing restart');
          try {
            synth.cancel();
          } catch (e) {
            console.warn('[SPEECH] Error during timeout cancel:', e);
          }
          isSpeakingRef.current = false;
          setAiText("");
          if (voiceAssistantRef.current && !voiceAssistantRef.current.isListening) {
            voiceAssistantRef.current.start();
          }
        }
      }, 30000);
    } catch (error) {
      console.error('[SPEECH] Error creating utterance:', error);
      isSpeakingRef.current = false;
      setAiText("");
      if (voiceAssistantRef.current && !voiceAssistantRef.current.isListening) {
        voiceAssistantRef.current.start();
      }
    }
  }

  const ensureListeningAfterAction = (delayMs = 1500) => {
    setTimeout(() => {
      if (voiceAssistantRef.current && !voiceAssistantRef.current.isListening && !isSpeakingRef.current) {
        console.log('[VOICE-ASSISTANT] Restarting after action');
        voiceAssistantRef.current.start();
      }
    }, delayMs);
  };

  const handleCommand = async (data) => {
    if (!data) {
      console.error('handleCommand called with undefined data');
      toast.error('Failed to process command - no response from server');
      return;
    }

    const { type, userInput, response, url, metadata, result, action } = data;

    if (!response) {
      console.warn('No response text in data:', data);
      return;
    }

    if (userInput) {
      showVoiceCommand(userInput);
    }

    speak(response);

    // Handle Wikipedia results
    if (type === 'wikipedia-query' && result) {
      if (result.found) {
        showWikipedia({
          title: result.title,
          summary: result.summary,
          url: result.url,
          thumbnail: result.thumbnail
        });
      }

      if (result.found && result.url) {
        setTimeout(() => {
          if (confirm(`Would you like to read more about ${result.title}?`)) {
            window.open(result.url, '_blank');
          }
        }, 2000);
      }
      return;
    }

    // Handle web search results
    if (type === 'web-search' || type === 'quick-answer') {
      showSearch({
        query: userInput,
        answer: response,
        url: result?.url
      });

      if (result && result.url) {
        setTimeout(() => {
          window.open(result.url, '_blank');
        }, 1500);
      }
      return;
    }

    // Handle location/navigation actions
    if (action === 'navigate' || action === 'find-nearby') {
      try {
        if (action === 'navigate') {
          const destination = metadata?.destination || userInput;
          const mode = metadata?.mode || 'driving';
          await navigationService.navigate(destination, mode);
          showDevice({
            action: 'Navigate',
            device: 'Navigation',
            status: `Navigating to ${destination}`,
            mode: mode
          });
        } else if (action === 'find-nearby') {
          const placeType = metadata?.placeType || userInput;
          await navigationService.findNearby(placeType);
          showDevice({
            action: 'Find Nearby',
            device: 'Navigation',
            status: `Finding ${placeType} nearby`
          });
        }
        toast.success('Opening navigation');
      } catch (error) {
        console.error('Navigation error:', error);
        toast.error('Navigation failed');
      }
      return;
    }

    if (action === 'share-location') {
      try {
        const result = await navigationService.shareLocation();
        if (result.success) {
          showDevice({
            action: 'Share Location',
            device: 'Location',
            status: 'Location shared successfully'
          });
          toast.success(result.voiceResponse);
        }
      } catch (error) {
        console.error('Share location error:', error);
        toast.error('Failed to share location');
      }
      return;
    }

    if (action === 'where-am-i') {
      try {
        const result = await navigationService.whereAmI();
        if (result.success) {
          speak(result.voiceResponse);
        }
      } catch (error) {
        console.error('Location error:', error);
        toast.error('Failed to get location');
      }
      return;
    }

    // Handle payment commands
    if (type === 'payment-phonepe' || type === 'payment-googlepay' ||
      type === 'payment-paytm' || type === 'payment-upi') {
      try {
        const result = await paymentService.executePayment(userInput);
        if (result.success) {
          showDevice({
            action: 'Payment',
            device: type.replace('payment-', '').toUpperCase(),
            status: result.message,
            amount: metadata?.amount
          });
          toast.success(result.message);
        } else {
          showError(result.error || 'Payment failed');
          toast.error(result.error || 'Payment failed');
        }
      } catch (error) {
        console.error('Payment error:', error);
        toast.error('Failed to process payment');
      }
      return;
    }

    // Handle URL-based actions
    if (type === 'google-search' && url) {
      speak('Opening Google search');
      setTimeout(() => window.open(url, '_blank'), 500);
      ensureListeningAfterAction(2000);
    }

    if (type === "weather-show") {
      speak('Showing weather information');
      setTimeout(() => window.open(`https://www.google.com/search?q=weather`, '_blank'), 500);
      ensureListeningAfterAction(2000);
    }

    if (type === 'youtube-search' || type === 'youtube-play') {
      speak('Opening YouTube');
      showYouTube({
        query: userInput,
        title: metadata?.title || result?.title,
        channel: metadata?.channel,
        videoId: metadata?.videoId
      });

      setTimeout(() => {
        if (url) {
          window.open(url, '_blank');
        } else {
          const query = encodeURIComponent(userInput);
          window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
        }
      }, 500);
      ensureListeningAfterAction(2000);
    }

    // Handle any custom URL from metadata
    if (url && !['google-search', 'youtube-search', 'youtube-play'].includes(type)) {
      speak('Opening link');
      setTimeout(() => window.open(url, '_blank'), 500);
      ensureListeningAfterAction(2000);
    }

    // Calendar handlers
    if (action === 'calendar-view' || action === 'calendar-today' || action === 'calendar-created') {
      if (result && result.events) {
        showCalendar({
          action: action.replace('calendar-', ''),
          eventCount: result.events.length,
          events: result.events.slice(0, 3)
        });
        console.info('[CALENDAR]', `${result.events.length} events found`);
        toast.success(response);
      } else if (action === 'calendar-auth-required') {
        showWarning('Please connect Google Calendar in Settings');
        toast.error('Please connect Google Calendar in Settings');
      }
      return;
    }

    // Gmail handlers
    if (action === 'gmail-check' || action === 'gmail-read' || action === 'gmail-sent') {
      if (result) {
        showGmail({
          action: action.replace('gmail-', ''),
          count: result.count,
          from: result.from,
          subject: result.subject
        });
        console.info('[GMAIL]', result);
        toast.success(response);
      } else if (action === 'gmail-auth-required') {
        showWarning('Please connect Gmail in Settings');
        toast.error('Please connect Gmail in Settings');
      }
      return;
    }

    // Bluetooth scan
    if (action === 'bluetooth-scan') {
      try {
        speak('Scanning for Bluetooth devices');
        const support = bluetoothService.checkSupport();
        if (!support.supported) {
          showError(support.message);
          toast.error(support.message);
          return;
        }
        showLoading('Scanning for Bluetooth devices...');
        toast('Opening Bluetooth device selector...');
        const result = await bluetoothService.scanDevices();
        if (result.success) {
          speak(`Found device: ${result.device.name}`);
          showDevice({
            action: 'Bluetooth',
            device: result.device.name,
            status: 'Connected'
          });
          toast.success(result.message);
        } else {
          showError(result.message);
          toast.error(result.message);
        }
      } catch (error) {
        console.error('[BLUETOOTH-ERROR]:', error);
        speak('Bluetooth scan failed');
        toast.error('Bluetooth scan failed');
      }
      return;
    }

    // Bluetooth connect
    if (action === 'bluetooth-connect') {
      try {
        speak('Connecting to Bluetooth device');
        const connected = bluetoothService.getConnectedDevices();
        if (connected.devices.length === 0) {
          speak('Please scan for devices first');
          toast('Please scan for devices first');
          return;
        }
        speak('Connected to Bluetooth device');
        toast.success('Connected to Bluetooth device');
      } catch (error) {
        console.error('[BLUETOOTH-ERROR]:', error);
        speak('Connection failed');
        toast.error('Connection failed');
      }
      return;
    }

    // App launch
    if (action === 'app-launch') {
      try {
        const appName = metadata?.appName || data.appName || userInput;
        speak(`Opening ${appName}`);
        const result = appLaunchService.launchApp(appName);
        if (result.success) {
          showDevice({
            action: 'Launch App',
            device: appName,
            status: result.message
          });
          toast.success(result.message);
        } else {
          showError(result.message);
          toast.error(result.message);
        }
      } catch (error) {
        console.error('[APP-LAUNCH-ERROR]:', error);
        speak('Failed to launch app');
        toast.error('Failed to launch app');
      }
      ensureListeningAfterAction(2000);
      return;
    }

    // App Close
    if (action === 'app-close') {
      speak(data.response || `Cannot close ${metadata?.appName || 'app'}`);
      toast(data.response || `Cannot close ${metadata?.appName || 'app'}`);
      ensureListeningAfterAction(1000);
      return;
    }

    // Camera Close
    if (action === 'camera-close') {
      speak('Closing camera');
      cameraService.stopCamera();
      toast.success('Camera closed');
      ensureListeningAfterAction(1000);
      return;
    }

    // WhatsApp Send
    if (type === 'whatsapp-send') {
      try {
        speak('Opening WhatsApp');
        const phoneMatch = userInput.match(/\+?[\d\s-()]+/);
        const phone = phoneMatch ? phoneMatch[0] : '';
        const message = metadata?.message || '';

        if (phone) {
          const result = messagingService.sendWhatsAppMessage(phone, message);
          toast.success(result.message);
        } else {
          messagingService.openMessagingApp('whatsapp');
          toast('Opening WhatsApp');
        }
      } catch (error) {
        console.error('[WHATSAPP-ERROR]:', error);
        speak('Failed to open WhatsApp');
        toast.error('Failed to open WhatsApp');
      }
      ensureListeningAfterAction(2000);
      return;
    }

    // Telegram message
    if (type === 'telegram-send') {
      try {
        speak('Opening Telegram');
        messagingService.openMessagingApp('telegram');
        toast.success('Opening Telegram');
      } catch (error) {
        console.error('[TELEGRAM-ERROR]:', error);
        speak('Failed to open Telegram');
        toast.error('Failed to open Telegram');
      }
      ensureListeningAfterAction(2000);
      return;
    }

    // Screen recording
    if (action === 'screen-record') {
      try {
        const support = screenService.checkSupport();
        if (!support.support.recording) {
          speak('Screen recording not supported in this browser');
          showError('Screen recording not supported in this browser');
          toast.error('Screen recording not supported in this browser');
          return;
        }

        const status = screenService.getRecordingStatus();
        if (status.isRecording) {
          speak('Stopping screen recording');
          const result = screenService.stopRecording();
          showDevice({
            action: 'Screen Recording',
            device: 'Screen',
            status: 'Recording stopped and saved'
          });
          toast.success('Screen recording stopped');
        } else {
          speak('Starting screen recording');
          const result = await screenService.startRecording({ includeAudio: true });
          if (result.success) {
            showDevice({
              action: 'Screen Recording',
              device: 'Screen',
              status: 'Recording started'
            });
            toast.success('Screen recording started');
          } else {
            showError(result.message);
            toast.error(result.message);
          }
        }
      } catch (error) {
        console.error('[SCREEN-RECORD-ERROR]:', error);
        speak('Screen recording failed');
        toast.error('Screen recording failed');
      }
      ensureListeningAfterAction(2000);
      return;
    }

    // Screenshot
    if (type === 'screenshot') {
      try {
        speak('Taking screenshot');
        const support = screenService.checkSupport();
        if (!support.support.screenshot) {
          speak('Screenshot not supported in this browser');
          showError('Screenshot not supported in this browser');
          toast.error('Screenshot not supported in this browser');
          return;
        }

        showLoading('Taking screenshot...');
        toast('Select screen to capture...');
        const result = await screenService.takeScreenshot();
        if (result.success) {
          speak('Screenshot captured successfully');
          showSuccess('Screenshot captured successfully!');
          toast.success('Screenshot saved!');
        } else {
          showError(result.message);
          toast.error(result.message);
        }
      } catch (error) {
        console.error('[SCREENSHOT-ERROR]:', error);
        speak('Screenshot failed');
        toast.error('Screenshot failed');
      }
      ensureListeningAfterAction(2000);
      return;
    }

    // Screen share
    if (action === 'screen-share') {
      try {
        speak('Starting screen sharing');
        const support = screenService.checkSupport();
        if (!support.support.sharing) {
          speak('Screen sharing not supported');
          toast.error('Screen sharing not supported in this browser');
          return;
        }

        toast('Select screen to share...');
        const result = await screenService.startScreenSharing({ includeAudio: true });
        if (result.success) {
          speak('Screen sharing started');
          toast.success('Screen sharing started');
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error('[SCREEN-SHARE-ERROR]:', error);
        speak('Screen sharing failed');
        toast.error('Screen sharing failed');
      }
      ensureListeningAfterAction(2000);
      return;
    }

    // Instagram DM
    if (action === 'instagram-dm') {
      try {
        const username = metadata?.username || data.username;
        if (username) {
          speak(`Opening Instagram direct message with ${username}`);
          instagramService.openDirectMessage(username);
          toast.success(`Opening Instagram DM with ${username}`);
        } else {
          speak('Opening Instagram');
          instagramService.openInstagram();
          toast('Opening Instagram');
        }
      } catch (error) {
        console.error('[INSTAGRAM-DM-ERROR]:', error);
        speak('Failed to open Instagram');
        toast.error('Failed to open Instagram DM');
      }
      ensureListeningAfterAction(2000);
      return;
    }

    // Instagram Story
    if (action === 'instagram-story') {
      try {
        speak('Opening Instagram story camera');
        instagramService.openCamera();
        toast.success('Opening Instagram story camera');
      } catch (error) {
        console.error('[INSTAGRAM-STORY-ERROR]:', error);
        speak('Failed to open Instagram stories');
        toast.error('Failed to open Instagram stories');
      }
      ensureListeningAfterAction(2000);
      return;
    }

    // Instagram Profile
    if (action === 'instagram-profile') {
      try {
        const username = metadata?.username || data.username;
        if (username) {
          speak(`Opening Instagram profile of ${username}`);
          instagramService.openProfile(username);
          toast.success(`Opening Instagram profile ${username}`);
        } else {
          speak('Opening Instagram');
          instagramService.openInstagram();
          toast('Opening Instagram');
        }
      } catch (error) {
        console.error('[INSTAGRAM-PROFILE-ERROR]:', error);
        speak('Failed to open Instagram');
        toast.error('Failed to open Instagram profile');
      }
      ensureListeningAfterAction(2000);
      return;
    }

    // Cast Media
    if (action === 'cast-media') {
      try {
        speak('Casting media to TV');
        if (!chromecastService.isSupported()) {
          speak('Chromecast is only supported in Chrome browser');
          toast.error('Chromecast is only supported in Chrome browser');
          return;
        }

        await chromecastService.initialize();
        const mediaUrl = metadata?.mediaUrl || data.mediaUrl;

        if (mediaUrl) {
          const session = await chromecastService.requestSession();
          if (session) {
            await chromecastService.castMedia(mediaUrl);
            speak('Now casting to TV');
            toast.success('Casting media to TV');
          }
        } else {
          speak('Please provide a media URL to cast');
          toast.error('Please provide a media URL to cast');
        }
      } catch (error) {
        console.error('[CAST-MEDIA-ERROR]:', error);
        speak('Failed to cast media');
        toast.error('Failed to cast media');
      }
      ensureListeningAfterAction(2000);
      return;
    }

    // Cast YouTube
    if (action === 'cast-youtube') {
      try {
        speak('Casting YouTube to TV');
        if (!chromecastService.isSupported()) {
          speak('Chromecast is only supported in Chrome browser');
          toast.error('Chromecast is only supported in Chrome browser');
          return;
        }

        await chromecastService.initialize();
        const videoId = metadata?.videoId || data.videoId;

        if (videoId) {
          const session = await chromecastService.requestSession();
          if (session) {
            await chromecastService.castYouTube(videoId);
            speak('Now casting YouTube to TV');
            toast.success('Casting YouTube to TV');
          }
        } else {
          speak('Please provide a YouTube video to cast');
          toast.error('Please provide a YouTube video to cast');
        }
      } catch (error) {
        console.error('[CAST-YOUTUBE-ERROR]:', error);
        speak('Failed to cast YouTube');
        toast.error('Failed to cast YouTube');
      }
      ensureListeningAfterAction(2000);
      return;
    }

    // Camera Photo
    if (action === 'camera-photo') {
      try {
        speak('Starting camera to take photo');
        const support = cameraService.checkSupport();
        if (!support.supported) {
          speak('Camera not supported in this browser');
          showError('Camera not supported in this browser');
          toast.error('Camera not supported in this browser');
          return;
        }

        showLoading('Starting camera...');
        toast('Starting camera...');
        await cameraService.startCamera();
        const result = await cameraService.takePhoto();

        if (result.success) {
          speak('Photo captured successfully');
          showSuccess('Photo captured successfully!', { timestamp: new Date().toLocaleTimeString() });
          toast.success('Photo captured!');
        } else {
          showError(result.error);
          toast.error(result.error);
        }
      } catch (error) {
        console.error('[CAMERA-PHOTO-ERROR]:', error);
        speak('Failed to take photo');
        toast.error('Failed to take photo');
      } finally {
        cameraService.stopCamera();
      }
      ensureListeningAfterAction(2000);
      return;
    }

    // Camera Video
    if (action === 'camera-video') {
      try {
        const support = cameraService.checkSupport();
        if (!support.supported) {
          speak('Camera not supported in this browser');
          showError('Camera not supported in this browser');
          toast.error('Camera not supported in this browser');
          return;
        }

        const status = cameraService.getRecordingStatus();
        if (status.isRecording) {
          speak('Stopping video recording');
          await cameraService.stopVideoRecording();
          showDevice({
            action: 'Video Recording',
            device: 'Camera',
            status: 'Recording stopped and saved'
          });
          toast.success('Video recording stopped and saved');
        } else {
          speak('Starting camera to record video');
          showLoading('Starting camera...');
          toast('Starting camera...');
          await cameraService.startCamera();
          await cameraService.startVideoRecording();
          showDevice({
            action: 'Video Recording',
            device: 'Camera',
            status: 'Recording started'
          });
          toast.success('Video recording started');
        }
      } catch (error) {
        console.error('[CAMERA-VIDEO-ERROR]:', error);
        speak('Failed to record video');
        toast.error('Failed to record video');
      }
      ensureListeningAfterAction(2000);
      return;
    }

    // Pick Contact
    if (action === 'pick-contact') {
      try {
        speak('Opening contact picker');
        const support = contactsService.checkSupport();
        if (!support.supported) {
          speak('Contact picker not supported in this browser');
          toast.error('Contact picker not supported in this browser');
          return;
        }

        const contacts = await contactsService.pickContacts();
        if (contacts && contacts.length > 0) {
          speak(`Selected ${contacts.length} contact${contacts.length > 1 ? 's' : ''}`);
          toast.success(`Selected ${contacts.length} contact(s)`);
          console.log('Selected contacts:', contacts);
        } else {
          speak('No contacts selected');
          toast('No contacts selected');
        }
      } catch (error) {
        console.error('[PICK-CONTACT-ERROR]:', error);
        speak('Failed to pick contacts');
        toast.error('Failed to pick contacts');
      }
      ensureListeningAfterAction(2000);
      return;
    }
  }

  // Main useEffect
  useEffect(() => {
    // Connect to Socket.io
    console.info('[COPILOT-UPGRADE]', 'Initializing Socket.io connection');
    socketService.connect();

    socketRef.current = socketService.getSocket();
    setIsConnected(socketService.isConnected());

    socketService.on('connect', () => {
      setIsConnected(true);
      socketRef.current = socketService.getSocket();
      toast.success('Connected to server');
    });

    socketService.on('disconnect', () => {
      setIsConnected(false);
      toast.error('Disconnected from server');
    });

    // Initialize Voice Assistant
    console.info('[COPILOT-UPGRADE]', 'Initializing Voice Assistant');
    const assistant = new VoiceAssistant(userDataRef.current.assistantName);
    voiceAssistantRef.current = assistant;

    // Set up voice assistant callbacks
    assistant.on('start', () => {
      setListening(true);
      console.info('[COPILOT-UPGRADE]', 'Voice assistant started listening');
    });

    assistant.on('end', () => {
      setListening(false);
    });

    assistant.on('error', (error) => {
      console.warn('[VOICE-ERROR]:', error);
      if (error === 'not-allowed') {
        toast.error('Microphone permission denied. Please allow microphone access.');
      }
    });

    assistant.on('wakeWord', (transcript) => {
      console.info('[CONTINUOUS-MODE]', 'Wake word detected - activating assistant');
      setIsAssistantActive(true);
      toast.success(`${userDataRef.current.assistantName} activated! I'm listening...`, {
        icon: '🎤',
        duration: 2000
      });
    });

    assistant.on('deactivate', (transcript) => {
      console.info('[CONTINUOUS-MODE]', 'Stop command detected - deactivating assistant');
      setIsAssistantActive(false);
      toast(`${userDataRef.current.assistantName} deactivated. Say "${userDataRef.current.assistantName}" to reactivate.`, {
        icon: '💤',
        duration: 3000
      });
    });

    assistant.on('partial', (transcript) => {
      setPartialTranscript(transcript);
    });

    assistant.on('result', async (transcript) => {
      try {
        setUserText(transcript);
        setAiText("");
        setListening(false);

        assistant.stop();
        isSpeakingRef.current = true;

        console.info('[COPILOT-UPGRADE]', 'Processing command:', transcript);

        let data;
        if (socketService.isConnected()) {
          try {
            data = await socketService.sendCommand(
              transcript,
              userDataRef.current._id,
              userDataRef.current.assistantName,
              userDataRef.current.name
            );
            console.info('[COPILOT-UPGRADE]', 'Socket.io response received:', data);
          } catch (socketError) {
            console.warn('[SOCKET-ERROR]:', socketError);
            data = await getGeminiResponse(transcript);
          }
        } else {
          data = await getGeminiResponse(transcript);
        }

        if (!data) {
          throw new Error('No response received from server');
        }

        await handleCommand(data);

        if (data.response) {
          setAiText(data.response);
        }

        setTimeout(() => {
          setUserText("");
        }, 3000);

      } catch (error) {
        console.error('[COMMAND-ERROR]:', error);
        setAiText("Sorry, I encountered an error. Please try again.");
        speak("Sorry, I encountered an error. Please try again.");
        toast.error('Failed to process command');

        setTimeout(() => {
          isSpeakingRef.current = false;
          assistant.start();
        }, 2000);
      }
    });

    // Initialize VAD Service
    vadService.initialize().then(() => {
      console.info('[VAD] Service initialized');

      vadService.on('speechStart', () => {
        if (isSpeakingRef.current) {
          synth.cancel();
          isSpeakingRef.current = false;
          console.info('[VAD] TTS interrupted');
        }
      });

      vadService.on('volumeChange', (level) => {
        setAudioLevel(level);
      });

      vadService.startMonitoring();
    }).catch(err => console.warn('[VAD] Init failed:', err));

    // Set up streaming Socket.io event handlers
    if (socketRef.current) {
      socketRef.current.on('stream-token', (data) => {
        setStreamingResponse(prev => prev + data.content);
        if (data.final) {
          setAiText(streamingResponse + data.content);
          setStreamingResponse("");
        }
      });

      socketRef.current.on('stream-event', (event) => {
        if (event.type === 'sources') {
          setSearchSources(event.sources);
        }
      });

      socketRef.current.on('stream-end', (data) => {
        console.info('[STREAMING] Completed in', data.totalLatency, 'ms');
      });

      socketRef.current.on('stream-error', (error) => {
        console.error('[STREAMING] Error:', error);
        toast.error('Streaming error');
      });
    }

    // Start voice assistant after a short delay
    setTimeout(() => {
      if (assistant.isRecognitionSupported()) {
        assistant.start();
        console.info('[COPILOT-UPGRADE]', 'Voice assistant started');
      } else {
        toast.error('Speech recognition not supported in this browser');
        console.error('Speech recognition not supported');
      }
    }, 1000);

    // Greeting
    if (!hasGreeted.current) {
      hasGreeted.current = true;
      const enableSpeechAndGreet = () => {
        if (!speechInitialized.current) {
          speechInitialized.current = true;
          const testUtterance = new SpeechSynthesisUtterance('');
          testUtterance.volume = 0;
          synth.speak(testUtterance);

          setTimeout(() => {
            setSpeechEnabled(true);
            speak(`Hello ${userData.name}, I'm ${userData.assistantName}. How can I help you today?`);
          }, 500);

          document.removeEventListener('click', enableSpeechAndGreet);
          document.removeEventListener('keydown', enableSpeechAndGreet);
        }
      };

      setTimeout(() => {
        if (!speechInitialized.current) {
          console.log('[SPEECH] Waiting for user interaction to enable speech');
          document.addEventListener('click', enableSpeechAndGreet, { once: true });
          document.addEventListener('keydown', enableSpeechAndGreet, { once: true });
          toast('Click anywhere to enable voice assistant', { duration: 5000 });
        }
      }, 1000);
    }

    // Cleanup
    return () => {
      console.info('[COPILOT-UPGRADE]', 'Cleaning up voice assistant and socket connection');
      if (voiceAssistantRef.current) {
        voiceAssistantRef.current.destroy();
      }
      socketService.disconnect();
      setListening(false);
      isSpeakingRef.current = false;
    };
  }, [serverUrl, getGeminiResponse, synth, showVoiceCommand, showWikipedia, showSearch, showDevice, showError, showWarning, showLoading, showSuccess, showCalendar, showGmail, showYouTube]);

  return (
    <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex justify-center items-center flex-col gap-[15px] overflow-hidden relative'>
      {/* Connection Status Indicator */}
      <div className='absolute top-[20px] left-[20px] flex items-center gap-[10px] bg-[#00000080] backdrop-blur-md px-[15px] py-[8px] rounded-full z-50'>
        <div className={`w-[10px] h-[10px] rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        <span className='text-white text-[14px] font-medium'>
          {isConnected ? 'Connected' : 'Offline'}
        </span>
      </div>

      {/* Mode Toggle - Voice/Keyboard Switcher */}
      <div className='absolute top-[20px] left-[50%] transform -translate-x-1/2 z-50'>
        <ModeToggle currentMode="voice" />
      </div>

      {/* Active Mode Status Indicator */}
      <div className='absolute top-[65px] left-[20px] flex items-center gap-[10px] bg-[#00000080] backdrop-blur-md px-[15px] py-[8px] rounded-full z-50'>
        <div className={`w-[10px] h-[10px] rounded-full ${isAssistantActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
        <span className={`text-[14px] font-medium ${isAssistantActive ? 'text-green-300' : 'text-gray-300'}`}>
          {isAssistantActive ? `${userData.assistantName} Active` : `Say "${userData.assistantName}"`}
        </span>
      </div>

      <CgMenuRight className='lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px] z-50' onClick={() => setHam(true)} />
      <div className={`absolute lg:hidden top-0 w-full h-full bg-[#00000053] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start ${ham ? "translate-x-0" : "translate-x-full"} transition-transform`}>
        <RxCross1 className=' text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={() => setHam(false)} />
        <button className='min-w-[150px] h-[60px]  text-black font-semibold   bg-white rounded-full cursor-pointer text-[19px] ' onClick={handleLogOut}>Log Out</button>
        <button className='min-w-[150px] h-[60px]  text-black font-semibold  bg-white  rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] ' onClick={() => navigate("/customize")}>Customize your Assistant</button>
        <button className='min-w-[150px] h-[60px]  text-black font-semibold  bg-white  rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] ' onClick={() => navigate("/settings")}>⚙️ Settings</button>

        <div className='w-full h-[2px] bg-gray-400'></div>
        <h1 className='text-white font-semibold text-[19px]'>History</h1>

        <div className='w-full h-[400px] gap-[20px] overflow-y-auto flex flex-col truncate'>
          {userData.history?.map((his, index) => (
            <div key={index} className='text-gray-200 text-[18px] w-full h-[30px]  '>{his}</div>
          ))}
        </div>
      </div>

      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold absolute hidden lg:block top-[20px] right-[20px]  bg-white rounded-full cursor-pointer text-[19px] ' onClick={handleLogOut}>Log Out</button>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold  bg-white absolute top-[100px] right-[20px] rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] hidden lg:block ' onClick={() => navigate("/customize")}>Customize your Assistant</button>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold  bg-white absolute top-[180px] right-[20px] rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] hidden lg:block ' onClick={() => navigate("/settings")}>⚙️ Settings</button>

      <div className='w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg'>
        <img src={userData?.assistantImage} alt="" className='h-full object-cover' />
      </div>
      <h1 className='text-white text-[18px] font-semibold'>I'm {userData?.assistantName}</h1>
      {!aiText && <img src={userImg} alt="" className='w-[200px]' />}
      {aiText && <img src={aiImg} alt="" className='w-[200px]' />}

      <h1 className='text-white text-[18px] font-semibold text-wrap'>{userText ? userText : aiText ? aiText : null}</h1>

      {/* Partial Transcript Display */}
      {partialTranscript && !userText && (
        <div className='absolute bottom-[100px] left-[50%] transform -translate-x-1/2 bg-[#ffffff20] backdrop-blur-md px-[25px] py-[12px] rounded-2xl z-40 max-w-[80%]'>
          <span className='text-gray-300 text-[16px] flex items-center gap-[8px]'>
            {partialTranscript}
            <span className='inline-block w-[2px] h-[20px] bg-white animate-pulse'></span>
          </span>
        </div>
      )}

      {/* Audio Level Waveform */}
      {listening && audioLevel > 0 && (
        <div className='absolute bottom-[150px] left-[50%] transform -translate-x-1/2 flex items-center gap-[4px] z-40'>
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className='w-[4px] bg-blue-400 rounded-full transition-all duration-100'
              style={{
                height: `${Math.max(10, audioLevel * 100 * (0.5 + Math.random() * 0.5))}px`
              }}
            ></div>
          ))}
        </div>
      )}

      {/* Streaming Response Display */}
      {streamingResponse && (
        <div className='absolute bottom-[200px] left-[50%] transform -translate-x-1/2 bg-[#00000090] backdrop-blur-md px-[30px] py-[15px] rounded-2xl z-40 max-w-[70%]'>
          <p className='text-white text-[16px] leading-relaxed'>
            {streamingResponse}
            <span className='inline-block w-[2px] h-[18px] bg-white ml-[2px] animate-pulse'></span>
          </p>
        </div>
      )}

      {/* Perplexity-Style Search Results */}
      {searchSources && searchSources.length > 0 && (
        <div className='absolute bottom-[250px] left-[50%] transform -translate-x-1/2 bg-[#00000095] backdrop-blur-lg px-[25px] py-[20px] rounded-2xl z-40 max-w-[80%] w-[600px]'>
          <h3 className='text-white text-[14px] font-semibold mb-[12px] flex items-center gap-[8px]'>
            <svg className='w-[16px] h-[16px]' fill='currentColor' viewBox='0 0 20 20'>
              <path d='M9 2a1 1 0 000 2h2a1 1 0 100-2H9z'></path>
              <path fillRule='evenodd' d='M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z' clipRule='evenodd'></path>
            </svg>
            Sources
          </h3>
          <div className='flex flex-col gap-[10px]'>
            {searchSources.map((source, index) => (
              <a
                key={index}
                href={source.url}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-start gap-[10px] p-[12px] bg-[#ffffff15] hover:bg-[#ffffff25] rounded-lg transition-all group'
              >
                <span className='text-blue-400 font-bold text-[14px] min-w-[24px]'>{index + 1}.</span>
                <div className='flex-1'>
                  <p className='text-white text-[14px] font-medium group-hover:text-blue-300 transition-colors'>
                    [{source.source}] {source.title}
                  </p>
                  <p className='text-gray-400 text-[12px] mt-[4px] truncate'>{source.url}</p>
                </div>
                <svg className='w-[16px] h-[16px] text-gray-400 group-hover:text-white transition-colors' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Home