import React, { useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import aiImg from "../assets/ai.gif"
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";
import userImg from "../assets/user.gif"
import socketService from '../services/socketService'
import VoiceAssistant from '../services/voiceAssistant'
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
import toast from 'react-hot-toast'
import useVoicePopup from '../hooks/useVoicePopup'
import { usePopup } from '../context/PopupContext'

function Home() {
  const {userData,serverUrl,setUserData,getGeminiResponse}=useContext(userDataContext)
  const { 
    showWeather, showMusic, showNews, showYouTube, showTranslation, 
    showSearch, showWikipedia, showDevice, showCalendar, showGmail,
    showReminder, showNote, showVoiceCommand, showSuccess, showError,
    showWarning, showLoading
  } = usePopup()
  const navigate=useNavigate()
  const [listening,setListening]=useState(false)
  const [userText,setUserText]=useState("")
  const [aiText,setAiText]=useState("")
  const [isConnected, setIsConnected] = useState(false)
  const isSpeakingRef=useRef(false)
  const voiceAssistantRef=useRef(null)
  const [ham,setHam]=useState(false)
  const synth=window.speechSynthesis
  const socketRef = useRef(null)
  const hasGreeted = useRef(false) // Track if greeting has been spoken
  const [speechEnabled, setSpeechEnabled] = useState(false) // Track if speech has been enabled by user interaction
  const speechInitialized = useRef(false) // Track if speech initialization was attempted

  // Guard against missing userData
  if (!userData) {
    navigate("/signin");
    return null;
  }

  // Initialize popup system for voice feedback (will be set up in useEffect)
  useVoicePopup(socketRef.current);

  const handleLogOut=async ()=>{
    try {
      // Cleanup connections
      if (voiceAssistantRef.current) {
        voiceAssistantRef.current.destroy();
      }
      socketService.disconnect();
      
      const result=await axios.get(`${serverUrl}/api/auth/logout`,{withCredentials:true})
      setUserData(null)
      navigate("/signin")
    } catch (error) {
      setUserData(null)
      console.log(error)
    }
  }

  const speak=(text)=>{
    // Guard against empty or undefined text
    if (!text || typeof text !== 'string') {
      console.warn('Speak called with invalid text:', text);
      isSpeakingRef.current = false;
      // Restart voice assistant immediately
      if (voiceAssistantRef.current && !voiceAssistantRef.current.isListening) {
        voiceAssistantRef.current.start();
      }
      return;
    }

    // Sanitize text - remove very long texts that might cause errors
    let speakText = text;
    if (text.length > 500) {
      speakText = text.substring(0, 497) + '...';
      console.warn('[SPEECH] Text truncated to 500 characters');
    }

    // Cancel any ongoing speech
    try {
      synth.cancel();
    } catch (e) {
      console.warn('[SPEECH] Error canceling previous speech:', e);
    }

    // Check if speech synthesis is available
    if (!synth) {
      console.error('[SPEECH] Speech synthesis not available');
      isSpeakingRef.current = false;
      return;
    }

    try {
      // Use voice personality system for emotion and variants
      const utterance = voicePersonality.createUtterance(speakText, {
        lang: 'en-US',
        onEnd: () => {
          console.log('[SPEECH] Finished speaking');
          setAiText("");
          isSpeakingRef.current = false;
          // Restart voice assistant immediately after speech
          setTimeout(() => {
            if (voiceAssistantRef.current && !voiceAssistantRef.current.isListening) {
              console.log('[SPEECH] Restarting voice assistant');
              voiceAssistantRef.current.start();
            }
          }, 500);
        },
        onError: (error) => {
          // Log detailed error information
          console.error('[SPEECH] Speech synthesis error:', {
            type: error.type,
            error: error.error,
            message: error.message,
            charIndex: error.charIndex
          });
          
          setAiText("");
          isSpeakingRef.current = false;
          
          // Handle specific error types
          if (error.error === 'not-allowed') {
            console.warn('[SPEECH] Speech not allowed - likely browser requires user interaction first');
            // Show text response instead since speech is blocked
            setAiText(speakText);
            toast.info('Speech blocked by browser - showing text response instead');
          } else if (error.error === 'interrupted' || error.error === 'canceled') {
            console.log('[SPEECH] Speech was interrupted or canceled');
          } else if (error.error === 'synthesis-failed') {
            console.error('[SPEECH] Synthesis failed - trying to recover');
            // Try to reinitialize speech synthesis
            try {
              synth.cancel();
            } catch (e) {
              console.warn('[SPEECH] Error during recovery:', e);
            }
          } else if (error.error === 'audio-busy') {
            console.warn('[SPEECH] Audio device is busy - waiting before retry');
          }
          
          // Restart voice assistant after error
          setTimeout(() => {
            if (voiceAssistantRef.current && !voiceAssistantRef.current.isListening) {
              console.log('[SPEECH] Restarting voice assistant after error');
              voiceAssistantRef.current.start();
            }
          }, 500);
        }
      });

      isSpeakingRef.current = true;
      synth.speak(utterance);

      // Safety timeout - force restart if speech takes too long (30 seconds max)
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
      // Restart voice assistant
      if (voiceAssistantRef.current && !voiceAssistantRef.current.isListening) {
        voiceAssistantRef.current.start();
      }
    }
  }

  const handleCommand = async (data) => {
    // Guard against undefined data
    if (!data) {
      console.error('handleCommand called with undefined data');
      toast.error('Failed to process command - no response from server');
      return;
    }

    const { type, userInput, response, url, metadata, result, action } = data;
    
    // Guard against missing response
    if (!response) {
      console.warn('No response text in data:', data);
      return;
    }

    // Show voice command popup
    if (userInput) {
      showVoiceCommand(userInput);
    }
    
    // Speak the response
    speak(response);
    
    // Handle Wikipedia results
    if (type === 'wikipedia-query' && result) {
      // Show Wikipedia popup
      if (result.found) {
        showWikipedia({
          title: result.title,
          summary: result.summary,
          url: result.url,
          thumbnail: result.thumbnail
        });
      }
      
      if (result.found && result.url) {
        // Optionally open Wikipedia article
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
    }
    
    if (type === 'calculator-open') {
      speak('Opening calculator');
      setTimeout(() => window.open(`https://www.google.com/search?q=calculator`, '_blank'), 500);
    }
    
    if (type === "instagram-open") {
      speak('Opening Instagram');
      setTimeout(() => window.open(`https://www.instagram.com/`, '_blank'), 500);
    }
    
    if (type ==="facebook-open") {
      speak('Opening Facebook');
      setTimeout(() => window.open(`https://www.facebook.com/`, '_blank'), 500);
    }
    
    if (type ==="weather-show") {
      speak('Showing weather information');
      setTimeout(() => window.open(`https://www.google.com/search?q=weather`, '_blank'), 500);
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
    }

    // Handle any custom URL from metadata
    if (url && !['google-search', 'youtube-search', 'youtube-play'].includes(type)) {
      speak('Opening link');
      setTimeout(() => window.open(url, '_blank'), 500);
    }

    // ==================== PHASE 3 HANDLERS ====================

    // Calendar handlers
    if (action === 'calendar-view' || action === 'calendar-today' || action === 'calendar-created') {
      if (result && result.events) {
        showCalendar({
          action: action.replace('calendar-', ''),
          eventCount: result.events.length,
          events: result.events.slice(0, 3) // Show first 3 events
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
        toast.info('Opening Bluetooth device selector...');
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
          toast.info('Please scan for devices first');
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
      return;
    }

    // WhatsApp message
    if (type === 'whatsapp-send') {
      try {
        speak('Opening WhatsApp');
        // Extract phone number and message from userInput
        // Format: "send message to +1234567890: Hello there"
        const phoneMatch = userInput.match(/\+?[\d\s-()]+/);
        const phone = phoneMatch ? phoneMatch[0] : '';
        const message = metadata?.message || '';
        
        if (phone) {
          const result = messagingService.sendWhatsAppMessage(phone, message);
          toast.success(result.message);
        } else {
          messagingService.openMessagingApp('whatsapp');
          toast.info('Opening WhatsApp');
        }
      } catch (error) {
        console.error('[WHATSAPP-ERROR]:', error);
        speak('Failed to open WhatsApp');
        toast.error('Failed to open WhatsApp');
      }
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
        toast.info('Select screen to capture...');
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
        
        toast.info('Select screen to share...');
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
          toast.info('Opening Instagram');
        }
      } catch (error) {
        console.error('[INSTAGRAM-DM-ERROR]:', error);
        speak('Failed to open Instagram');
        toast.error('Failed to open Instagram DM');
      }
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
          toast.info('Opening Instagram');
        }
      } catch (error) {
        console.error('[INSTAGRAM-PROFILE-ERROR]:', error);
        speak('Failed to open Instagram');
        toast.error('Failed to open Instagram profile');
      }
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
        toast.info('Starting camera...');
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
          toast.info('Starting camera...');
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
          
          // Log contacts for user
          console.log('Selected contacts:', contacts);
        } else {
          speak('No contacts selected');
          toast.info('No contacts selected');
        }
      } catch (error) {
        console.error('[PICK-CONTACT-ERROR]:', error);
        speak('Failed to pick contacts');
        toast.error('Failed to pick contacts');
      }
      return;
    }
  }

useEffect(() => {
  // Connect to Socket.io
  console.info('[COPILOT-UPGRADE]', 'Initializing Socket.io connection');
  socketService.connect();
  
  // Store socket reference for useVoicePopup hook
  socketRef.current = socketService.getSocket();
  
  // Check connection status
  setIsConnected(socketService.isConnected());
  
  // Monitor connection status
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
  const assistant = new VoiceAssistant(userData.assistantName);
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
    console.info('[COPILOT-UPGRADE]', 'Wake word detected!');
    toast.success(`Wake word detected: ${userData.assistantName}`);
  });

  assistant.on('result', async (transcript) => {
    try {
      setUserText(transcript);
      setAiText("");
      setListening(false);
      
      // Stop voice assistant while processing
      assistant.stop();
      isSpeakingRef.current = true;

      console.info('[COPILOT-UPGRADE]', 'Processing command:', transcript);

      // Send command via Socket.io for real-time response
      let data;
      if (socketService.isConnected()) {
        try {
          data = await socketService.sendCommand(
            transcript,
            userData._id,
            userData.assistantName,
            userData.name
          );
          console.info('[COPILOT-UPGRADE]', 'Socket.io response received:', data);
        } catch (socketError) {
          console.warn('[SOCKET-ERROR]:', socketError);
          // Fallback to direct API call
          data = await getGeminiResponse(transcript);
        }
      } else {
        // Use direct API call if socket not connected
        data = await getGeminiResponse(transcript);
      }

      // Check if data is valid before proceeding
      if (!data) {
        throw new Error('No response received from server');
      }

      // Handle the command
      await handleCommand(data);
      
      // Set AI text if response exists
      if (data.response) {
        setAiText(data.response);
      }
      
      // Clear user text after a delay
      setTimeout(() => {
        setUserText("");
      }, 3000);
      
    } catch (error) {
      console.error('[COMMAND-ERROR]:', error);
      setAiText("Sorry, I encountered an error. Please try again.");
      speak("Sorry, I encountered an error. Please try again.");
      toast.error('Failed to process command');
      
      // Restart voice assistant even on error
      setTimeout(() => {
        isSpeakingRef.current = false;
        assistant.start();
      }, 2000);
    }
  });

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

  // Greeting - use speak() function to maintain consistent voice
  // Only greet once on initial mount
  if (!hasGreeted.current) {
    hasGreeted.current = true;
    // Enable speech on first user interaction and then greet
    const enableSpeechAndGreet = () => {
      if (!speechInitialized.current) {
        speechInitialized.current = true;
        // Test speech synthesis with silent utterance
        const testUtterance = new SpeechSynthesisUtterance('');
        testUtterance.volume = 0;
        synth.speak(testUtterance);
        
        setTimeout(() => {
          setSpeechEnabled(true);
          speak(`Hello ${userData.name}, I'm ${userData.assistantName}. How can I help you today?`);
        }, 500);
        
        // Remove event listeners after first interaction
        document.removeEventListener('click', enableSpeechAndGreet);
        document.removeEventListener('keydown', enableSpeechAndGreet);
      }
    };
    
    // Wait for user interaction to enable speech
    setTimeout(() => {
      if (!speechInitialized.current) {
        console.log('[SPEECH] Waiting for user interaction to enable speech');
        document.addEventListener('click', enableSpeechAndGreet, { once: true });
        document.addEventListener('keydown', enableSpeechAndGreet, { once: true });
        
        // Show a subtle notification
        toast.info('Click anywhere to enable voice assistant', { duration: 5000 });
      }
    }, 1000);
  }

  // Cleanup
  return () => {
    console.info('[COPILOT-UPGRADE]', 'Cleaning up voice assistant and socket connection');
    if (voiceAssistantRef.current) {
      voiceAssistantRef.current.destroy(); // Use destroy instead of stop
    }
    socketService.disconnect();
    setListening(false);
    isSpeakingRef.current = false;
  };
}, [userData, serverUrl, setUserData, getGeminiResponse, navigate, showVoiceCommand, showWikipedia, showSearch, showYouTube, showDevice, showCalendar, showGmail, showSuccess, showError, showWarning, showLoading]);




  return (
    <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex justify-center items-center flex-col gap-[15px] overflow-hidden relative'>
      {/* Connection Status Indicator */}
      <div className='absolute top-[20px] left-[20px] flex items-center gap-[10px] bg-[#00000080] backdrop-blur-md px-[15px] py-[8px] rounded-full z-50'>
        <div className={`w-[10px] h-[10px] rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        <span className='text-white text-[14px] font-medium'>
          {isConnected ? 'Connected' : 'Offline'}
        </span>
      </div>

      {/* Listening Indicator */}
      {listening && (
        <div className='absolute top-[20px] left-[50%] transform -translate-x-1/2 bg-[#009dff80] backdrop-blur-md px-[20px] py-[10px] rounded-full z-50 animate-pulse'>
          <span className='text-white text-[16px] font-semibold flex items-center gap-[10px]'>
            <div className='w-[12px] h-[12px] bg-red-500 rounded-full animate-ping'></div>
            Listening...
          </span>
        </div>
      )}

      <CgMenuRight className='lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px] z-50' onClick={()=>setHam(true)}/>
      <div className={`absolute lg:hidden top-0 w-full h-full bg-[#00000053] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start ${ham?"translate-x-0":"translate-x-full"} transition-transform`}>
 <RxCross1 className=' text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={()=>setHam(false)}/>
 <button className='min-w-[150px] h-[60px]  text-black font-semibold   bg-white rounded-full cursor-pointer text-[19px] ' onClick={handleLogOut}>Log Out</button>
      <button className='min-w-[150px] h-[60px]  text-black font-semibold  bg-white  rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] ' onClick={()=>navigate("/customize")}>Customize your Assistant</button>
      <button className='min-w-[150px] h-[60px]  text-black font-semibold  bg-white  rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] ' onClick={()=>navigate("/settings")}>⚙️ Settings</button>

<div className='w-full h-[2px] bg-gray-400'></div>
<h1 className='text-white font-semibold text-[19px]'>History</h1>

<div className='w-full h-[400px] gap-[20px] overflow-y-auto flex flex-col truncate'>
  {userData.history?.map((his, index)=>(
    <div key={index} className='text-gray-200 text-[18px] w-full h-[30px]  '>{his}</div>
  ))}

</div>

      </div>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold absolute hidden lg:block top-[20px] right-[20px]  bg-white rounded-full cursor-pointer text-[19px] ' onClick={handleLogOut}>Log Out</button>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold  bg-white absolute top-[100px] right-[20px] rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] hidden lg:block ' onClick={()=>navigate("/customize")}>Customize your Assistant</button>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold  bg-white absolute top-[180px] right-[20px] rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] hidden lg:block ' onClick={()=>navigate("/settings")}>⚙️ Settings</button>
      <div className='w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg'>
<img src={userData?.assistantImage} alt="" className='h-full object-cover'/>
      </div>
      <h1 className='text-white text-[18px] font-semibold'>I'm {userData?.assistantName}</h1>
      {!aiText && <img src={userImg} alt="" className='w-[200px]'/>}
      {aiText && <img src={aiImg} alt="" className='w-[200px]'/>}
    
    <h1 className='text-white text-[18px] font-semibold text-wrap'>{userText?userText:aiText?aiText:null}</h1>
      
    </div>
  )
}

export default Home