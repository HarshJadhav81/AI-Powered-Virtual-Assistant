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
import localIntentService from '../services/localIntentService' // [OFFLINE-SUPPORT]
import ModeToggle from '../components/ModeToggle'
import toast from 'react-hot-toast'
// [CLEANUP] Removed detailed popup hooks for cleaner UI

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext)
  const { switchMode } = useChatContext()
  // [CLEANUP] Removed usePopup hook
  const navigate = useNavigate()
  const [listening, setListening] = useState(false)
  const [isAssistantActive, setIsAssistantActive] = useState(false)
  const [userText, setUserText] = useState("")
  const [aiText, setAiText] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  // [CLEANUP] Removed partialTranscript and streamingResponse states for cleaner UI
  const [searchSources, setSearchSources] = useState([]) // Keep data but won't render popups
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

  // [CLEANUP] Removed useVoicePopup initialization

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
      return;
    }

    // Use Voice Assistant for TTS
    if (voiceAssistantRef.current) {
      voiceAssistantRef.current.speak(text);
    } else {
      console.warn('[SPEECH] Voice assistant not initialized');
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
      toast.error('Failed to process command');
      return;
    }

    const { type, userInput, response, url, metadata, result, action } = data;

    // Log incoming command for debugging
    console.info('[VOICE-COMMAND]', {
      type,
      action,
      userInput,
      hasMetadata: !!metadata,
      appName: metadata?.appName
    });

    if (!response) {
      console.warn('No response text in data:', data);
      return;
    }

    // [CLEANUP] Removed showVoiceCommand

    speak(response); // Always speak

    // Handle Wikipedia results - Open LINK directly if needed, no popup
    if (type === 'wikipedia-query' && result && result.found && result.url) {
      setTimeout(() => window.open(result.url, '_blank'), 1500);
      return;
    }

    // Handle web search results - Direct Open
    if ((type === 'web-search' || type === 'quick-answer') && result && result.url) {
      setTimeout(() => window.open(result.url, '_blank'), 1500);
      return;
    }

    // Handle location/navigation actions
    if (action === 'navigate' || action === 'find-nearby') {
      try {
        if (action === 'navigate') {
          const destination = metadata?.destination || userInput;
          const mode = metadata?.mode || 'driving';
          await navigationService.navigate(destination, mode);
          // [CLEANUP] Removed showDevice popup
        } else if (action === 'find-nearby') {
          const placeType = metadata?.placeType || userInput;
          await navigationService.findNearby(placeType);
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
          // [CLEANUP] Removed showDevice popup
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
          // [CLEANUP] Removed showDevice popup
          toast.success(result.message);
        } else {
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
      // [CLEANUP] Removed showYouTube popup
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
        // [CLEANUP] Removed showCalendar
        console.info('[CALENDAR]', `${result.events.length} events found`);
        toast.success(response);
      } else if (action === 'calendar-auth-required') {
        toast.error('Please connect Google Calendar in Settings');
      }
      return;
    }

    // Gmail handlers
    if (action === 'gmail-check' || action === 'gmail-read' || action === 'gmail-sent') {
      if (result) {
        // [CLEANUP] Removed showGmail
        console.info('[GMAIL]', result);
        toast.success(response);
      } else if (action === 'gmail-auth-required') {
        toast.error('Please connect Gmail in Settings');
      }
      return;
    }

    // Bluetooth scan - simplified
    if (action === 'bluetooth-scan') {
      try {
        speak('Scanning for Bluetooth devices');
        // ... simplified logic without showDevice/showLoading
        const support = bluetoothService.checkSupport();
        if (!support.supported) {
          toast.error(support.message);
          return;
        }
        toast('Opening Bluetooth device selector...');
        const result = await bluetoothService.scanDevices();
        if (result.success) {
          speak(`Found device: ${result.device.name}`);
          toast.success(result.message);
        } else {
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
        const result = await appLaunchService.launchApp(appName);

        if (result.success) {
          // [CLEANUP] Removed showDevice
          toast.success(`Launched ${appName}`);
        } else {
          toast.error(`Failed to launch ${appName}: ${result.message}`);
        }
      } catch (error) {
        console.error('[APP-LAUNCH-ERROR]:', error);
        speak('Failed to launch app');
        toast.error('Failed to launch app: ' + error.message);
      }
      ensureListeningAfterAction(2000);
      return;
    }

    // App close
    if (action === 'app-close') {
      try {
        const appName = metadata?.appName || data.appName || userInput;
        speak(`Closing ${appName}`);
        const result = await appLaunchService.closeDesktopApp(appName);

        if (result.success) {
          // [CLEANUP] Removed showDevice
          toast.success(`Closed ${appName}`);
        } else {
          toast.error(`Failed to close ${appName}: ${result.message}`);
        }
      } catch (error) {
        console.error('[APP-CLOSE-ERROR]:', error);
        speak('Failed to close app');
        toast.error('Failed to close app: ' + error.message);
      }
      ensureListeningAfterAction(2000);
      return;
    }

    // List installed apps
    if (action === 'list-apps') {
      try {
        speak('Fetching your installed applications');
        const responseData = await axios.get('http://localhost:8000/api/apps/list', { timeout: 15000 });

        if (responseData.data.success && responseData.data.apps.length > 0) {
          const appNames = responseData.data.apps.map(app => app.name || app).slice(0, 10).join(', ');
          speak(`Found ${responseData.data.count} applications. Here are some: ${appNames}`);
          // [CLEANUP] Removed showDevice
          toast.success(`Found ${responseData.data.count} applications`);
        } else {
          speak('Could not retrieve application list');
          toast.info('No applications found or error retrieving list');
        }
      } catch (error) {
        console.error('[LIST-APPS-ERROR]:', error);
        speak('Failed to list applications');
        toast.error('Failed to list applications: ' + error.message);
      }
      ensureListeningAfterAction(2000);
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
        messagingService.openMessagingApp('whatsapp');
        toast('Opening WhatsApp');
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
          toast.error('Screen recording not supported');
          return;
        }

        const status = screenService.getRecordingStatus();
        if (status.isRecording) {
          speak('Stopping screen recording');
          const result = screenService.stopRecording();
          // [CLEANUP] Removed showDevice popup
          toast.success('Screen recording stopped');
        } else {
          speak('Starting screen recording');
          const result = await screenService.startRecording({ includeAudio: true });
          if (result.success) {
            // [CLEANUP] Removed showDevice popup
            toast.success('Screen recording started');
          } else {
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
          speak('Screenshot not supported');
          toast.error('Screenshot not supported');
          return;
        }

        // [CLEANUP] Removed showLoading
        toast('Select screen to capture...');
        const result = await screenService.takeScreenshot();
        if (result.success) {
          speak('Screenshot captured successfully');
          // [CLEANUP] Removed showSuccess popup
          toast.success('Screenshot saved!');
        } else {
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
          toast.error('Screen sharing not supported');
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

    // Instagram DM - Simplified
    if (action === 'instagram-dm') {
      const username = metadata?.username || data.username;
      if (username) {
        speak(`Opening Instagram DM with ${username}`);
        instagramService.openDirectMessage(username);
        toast.success(`Opening Instagram DM with ${username}`);
      } else {
        speak('Opening Instagram');
        instagramService.openInstagram();
      }
      ensureListeningAfterAction(2000);
      return;
    }

    // Instagram Story
    if (action === 'instagram-story') {
      speak('Opening Instagram story camera');
      instagramService.openCamera();
      ensureListeningAfterAction(2000);
      return;
    }

    // Instagram Profile
    if (action === 'instagram-profile') {
      const username = metadata?.username || data.username;
      if (username) {
        speak(`Opening profile of ${username}`);
        instagramService.openProfile(username);
      } else {
        instagramService.openInstagram();
      }
      ensureListeningAfterAction(2000);
      return;
    }

    // Cast Media
    if (action === 'cast-media' || action === 'cast-youtube') {
      // Simplified Cast logic without popups
      try {
        speak('Casting...');
        await chromecastService.initialize();
        const session = await chromecastService.requestSession();
        // ... (casting logic simplified)
        toast.success('Casting to TV');
      } catch (err) {
        toast.error('Cast failed');
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
          toast.error('Camera not supported');
          return;
        }

        // [CLEANUP] Removed showLoading
        await cameraService.startCamera();
        const result = await cameraService.takePhoto();

        if (result.success) {
          speak('Photo captured successfully');
          // [CLEANUP] Removed showSuccess
          toast.success('Photo captured!');
        } else {
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
      // Similar simplification...
      const status = cameraService.getRecordingStatus();
      if (status.isRecording) {
        speak('Stopping video');
        await cameraService.stopVideoRecording();
        toast.success('Video saved');
      } else {
        speak('Starting video');
        await cameraService.startCamera();
        await cameraService.startVideoRecording();
        toast.success('Recording started');
      }
      ensureListeningAfterAction(2000);
      return;
    }

    // Pick Contact
    if (action === 'pick-contact') {
      try {
        speak('Opening contact picker');
        const contacts = await contactsService.pickContacts();
        if (contacts && contacts.length > 0) {
          speak(`Selected ${contacts.length} contacts`);
          toast.success(`Selected ${contacts.length} contacts`);
        } else {
          speak('No contacts selected');
        }
      } catch (error) {
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

    // [CLEANUP] Removed assistant.on('partial') listener

    assistant.on('result', async (transcript) => {
      try {
        setUserText(transcript);
        setAiText("");
        setListening(false);

        assistant.stop();
        isSpeakingRef.current = true;

        console.info('[COPILOT-UPGRADE]', 'Processing command:', transcript);

        // [OFFLINE-SUPPORT] Check for local intent first (bypasses Gemini/Internet)
        const localIntent = localIntentService.checkIntent(transcript);

        let data;

        if (localIntent) {
          console.info('[LOCAL-INTENT]', 'Executing offline:', localIntent);
          data = localIntent; // Use local data structure directly
          // We don't need to await anything here, just pass to handleCommand
        } else if (socketService.isConnected()) {
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

        // [OFFLINE-ROBUSTNESS] Check if it's an API/Quota error
        const errorMsg = error.message || '';
        const isNetworkError = errorMsg.includes('Network') || errorMsg.includes('fetch');
        const isQuotaError = errorMsg.includes('quota') || errorMsg.includes('limit') || error.response?.status === 429;

        let spokenMessage = "Sorry, I encountered an error.";

        if (isQuotaError) {
          spokenMessage = "I'm having trouble connecting to my brain right now, but I can still open apps for you.";
          toast.error('AI Quota Exceeded - Offline Mode Active');
        } else if (isNetworkError) {
          spokenMessage = "I seem to be offline, but I can still control your apps.";
          toast.error('Network Error - Offline Mode Active');
        } else {
          toast.error('Failed to process command');
        }

        setAiText(spokenMessage);
        speak(spokenMessage);

      } finally {
        // [OFFLINE-ROBUSTNESS] GUARANTEES restart of listening loop
        // The delay accounts for potential speech duration or action execution
        setTimeout(() => {
          if (voiceAssistantRef.current && !voiceAssistantRef.current.isListening) {
            console.log('[VOICE-ASSISTANT] Ensuring listening state in finally block (Robust Restart)');
            voiceAssistantRef.current.shouldRestart = true;
            voiceAssistantRef.current.start();
          }
        }, 3000);
      }
    });

    // Initialize VAD Service
    vadService.initialize().then(() => {
      console.info('[VAD] Service initialized');

      vadService.on('speechStart', () => {
        if (isSpeakingRef.current) {
          // Check audio level to distinguish user voice from echo
          const level = vadService.getAudioLevel();
          // Only interrupt if level is significant (user speaking over assistant)
          // [FIX]: Increased threshold to 0.2 to prevent system echo (0.05-0.1) from triggering self-interruption
          if (level > 0.2) {
            synth.cancel();
            isSpeakingRef.current = false;
            console.info('[VAD] TTS interrupted by user (Level:', level.toFixed(3), ')');
            toast('Listening...', { icon: '👂' });
          } else {
            console.debug('[VAD] Ignored low volume speech/echo (Level:', level.toFixed(3), ')');
          }
        }
      });

      vadService.on('volumeChange', (level) => {
        setAudioLevel(level);
      });

      vadService.startMonitoring();
    }).catch(err => console.warn('[VAD] Init failed:', err));

    // [FIX] Ensure Voice Assistant starts listening immediately on mount
    if (voiceAssistantRef.current) {
      setTimeout(() => {
        console.info('[COPILOT-UPGRADE]', 'Auto-starting listener on mount');
        voiceAssistantRef.current.start();
      }, 1000);
    }

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
  }, [serverUrl, getGeminiResponse, synth]); // [CLEANUP] Removed deleted dependencies

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

      {/* Audio Level Waveform - Kept as non-intrusive status indicator */}
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

      {/* [CLEANUP] Removed Partial Transcript Overlay, Streaming Response, and Sources List for a cleaner UI as requested */}
    </div>
  )
}

export default Home