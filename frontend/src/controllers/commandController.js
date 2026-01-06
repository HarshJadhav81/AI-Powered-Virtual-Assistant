import navigationService from '../services/navigationService';
import paymentService from '../services/paymentService';
import bluetoothService from '../services/bluetoothService';
import appLaunchService from '../services/appLaunchService';
import messagingService from '../services/messagingService';
import screenService from '../services/screenService';
import instagramService from '../services/instagramService';
import chromecastService from '../services/chromecastService';
import cameraService from '../services/cameraService';
import contactsService from '../services/contactsService';
import localIntentService from '../services/localIntentService';
import intentRouter from '../services/intentRouter';
import axios from 'axios';

export const processCommand = async (data, dependencies) => {
    const { speak, toast, ensureListeningAfterAction } = dependencies;

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

    speak(response); // Always speak

    // Handle Wikipedia results
    if (type === 'wikipedia-query' && result && result.found && result.url) {
        setTimeout(() => window.open(result.url, '_blank'), 1500);
        return;
    }

    // Handle web search results
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
        setTimeout(() => window.open(url, '_blank'), 500);
        ensureListeningAfterAction(2000);
    }

    if (type === "weather-show") {
        setTimeout(() => window.open(`https://www.google.com/search?q=weather`, '_blank'), 500);
        ensureListeningAfterAction(2000);
    }

    if (type === 'youtube-search' || type === 'youtube-play') {
        setTimeout(() => {
            const target = 'app_youtube';
            if (url) {
                window.open(url, target);
            } else {
                const query = encodeURIComponent(userInput);
                window.open(`https://www.youtube.com/results?search_query=${query}`, target);
            }
        }, 500);
        ensureListeningAfterAction(2000);
    }

    // Handle any custom URL from metadata
    if (url && !['google-search', 'youtube-search', 'youtube-play'].includes(type)) {
        setTimeout(() => {
            const appName = metadata?.appName || 'generic_app';
            const target = `app_${appName.toLowerCase().replace(/\s+/g, '_')}`;
            window.open(url, target);
        }, 500);
        ensureListeningAfterAction(2000);
    }

    // Calendar handlers
    if (action === 'calendar-view' || action === 'calendar-today' || action === 'calendar-created') {
        if (result && result.events) {
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
            console.info('[GMAIL]', result);
            toast.success(response);
        } else if (action === 'gmail-auth-required') {
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
        const appName = metadata?.appName || data.appName || userInput;

        // Use IntentRouter for standard routing
        try {
            const result = await intentRouter.routeIntent(appName, null, metadata);

            if (result.success) {
                toast.success(result.message);
                if (result.executedUrl) {
                    console.log(`[APP-LAUNCH] Launched: ${result.executedUrl}`);
                }
            } else {
                // Smart Fallback Handling
                if (result.reason === 'app_not_found' || result.reason === 'execution_failed') {
                    // Try store search smart fallback
                    localIntentService.setPendingAppSearch(appName);
                    const fallbackMsg = `I couldn't find ${appName}. Would you like me to search for it online?`;
                    speak(fallbackMsg);
                    toast('Say "Search" to find online.');
                    ensureListeningAfterAction(2000);
                    return;
                } else if (result.reason === 'platform_not_supported') {
                    speak(result.message);
                    toast.error(result.message);
                } else if (result.reason === 'section_not_available') {
                    speak(result.message);
                    toast.error(result.message);
                } else {
                    speak(result.message || 'Could not launch app');
                    toast.error(result.message);
                }
            }
        } catch (error) {
            console.error('[APP-LAUNCH-ERROR]:', error);
            speak(`I had trouble opening ${appName}.`);
        }
        ensureListeningAfterAction(2000);
        return;
    }

    // App close
    if (action === 'app-close') {
        try {
            const appName = metadata?.appName || data.appName || userInput;
            // Direct backend call for closing apps is reliable
            const response = await axios.post('http://localhost:8000/api/apps/close', { appName });

            if (response.data.success) {
                toast.success(`Closed ${appName}`);
            } else {
                toast.error(`Failed to close ${appName}: ${response.data.message}`);
            }
        } catch (error) {
            console.error('[APP-CLOSE-ERROR]:', error);
            speak('Failed to close app');
            toast.error('Failed to close app: ' + (error.response?.data?.message || error.message));
        }
        ensureListeningAfterAction(2000);
        return;
    }

    // List installed apps
    if (action === 'list-apps') {
        // ... (keep existing)
        try {
            const responseData = await axios.get('http://localhost:8000/api/apps/list', { timeout: 15000 });

            if (responseData.data.success && responseData.data.apps.length > 0) {
                const appNames = responseData.data.apps.map(app => app.name || app).slice(0, 10).join(', ');
                speak(`Found ${responseData.data.count} applications. Here are some: ${appNames}`);
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

    // ... (Camera Close, WhatsApp Send, etc.) ...

    // WhatsApp Send
    if (type === 'whatsapp-send') {
        try {
            const { contact, message } = metadata || {};
            const payload = { phone: contact || '', text: message || '' };

            const result = await intentRouter.routeIntent('WhatsApp', 'send', payload);
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('[WHATSAPP-ERROR]:', error);
            speak('Failed to open WhatsApp');
            toast.error('Failed to open WhatsApp');
        }
        ensureListeningAfterAction(2000);
        return;
    }

    // ... (Telegram) ...

    // Instagram DM
    if (action === 'instagram-dm') {
        const username = metadata?.username || data.username;
        const result = await intentRouter.routeIntent('Instagram', 'messages', { username });
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
        ensureListeningAfterAction(2000);
        return;
    }

    // Instagram Story
    if (action === 'instagram-story') {
        const result = await intentRouter.routeIntent('Instagram', 'camera');
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
        ensureListeningAfterAction(2000);
        return;
    }

    // Instagram Profile
    if (action === 'instagram-profile') {
        const username = metadata?.username || data.username;
        const result = await intentRouter.routeIntent('Instagram', 'profile', { username });
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
        ensureListeningAfterAction(2000);
        return;
    }

    // Cast Media
    if (action === 'cast-media' || action === 'cast-youtube') {
        try {
            await chromecastService.initialize();
            await chromecastService.requestSession();
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
            const support = cameraService.checkSupport();
            if (!support.supported) {
                toast.error('Camera not supported');
                return;
            }

            await cameraService.startCamera();
            const result = await cameraService.takePhoto();

            if (result.success) {
                speak('Photo captured successfully');
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
        const status = cameraService.getRecordingStatus();
        if (status.isRecording) {
            await cameraService.stopVideoRecording();
            toast.success('Video saved');
        } else {
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
};
