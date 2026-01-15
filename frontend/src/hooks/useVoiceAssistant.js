import { useState, useRef, useEffect, useCallback } from 'react';
import VoiceAssistant from '../services/voiceAssistant';
import socketService from '../services/socketService';
import localIntentService from '../services/localIntentService';
import toast from 'react-hot-toast';
import useDevicePairingStore from '../store/devicePairingStore';
import { detectDeviceTypeFromVoice } from '../config/deviceTypeConfig';

export const useVoiceAssistant = ({ userData, getGeminiResponse, processCommand, navigate }) => {
    const [listening, setListening] = useState(false);
    const [isAssistantActive, setIsAssistantActive] = useState(false);
    const [userText, setUserText] = useState("");
    const [aiText, setAiText] = useState("");

    const voiceAssistantRef = useRef(null);
    const isSpeakingRef = useRef(false);
    const userDataRef = useRef(userData);

    // Device Pairing Store
    const { openModal, handleVoiceCommand: handleDeviceVoiceCommand, isModalOpen } = useDevicePairingStore();

    // Update ref when userData changes
    useEffect(() => {
        userDataRef.current = userData;
    }, [userData]);

    const speak = useCallback((text) => {
        if (!text || typeof text !== 'string') {
            console.warn('Speak called with invalid text:', text);
            return;
        }
        if (voiceAssistantRef.current) {
            voiceAssistantRef.current.speak(text);
        } else {
            console.warn('[SPEECH] Voice assistant not initialized');
        }
    }, []);

    const ensureListeningAfterAction = useCallback((delayMs = 1500) => {
        setTimeout(() => {
            if (voiceAssistantRef.current && !voiceAssistantRef.current.isListening && !isSpeakingRef.current) {
                console.log('[VOICE-ASSISTANT] Restarting after action');
                voiceAssistantRef.current.start();
            }
        }, delayMs);
    }, []);

    useEffect(() => {
        if (!userData) return;

        console.info('[COPILOT-UPGRADE]', 'Initializing Voice Assistant');
        const assistant = new VoiceAssistant(userData.assistantName);
        voiceAssistantRef.current = assistant;

        // Callbacks
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

        assistant.on('result', async (transcript) => {
            try {
                setUserText(transcript);
                setAiText("");
                setListening(false);

                assistant.stop();
                isSpeakingRef.current = true;

                console.info('[COPILOT-UPGRADE]', 'Processing command:', transcript);

                // [DEVICE-PAIRING] Enhanced device pairing command detection
                const commandLower = transcript.toLowerCase();
                const pairingPatterns = [
                    /(?:scan|search|find|show|connect|pair|list).*(bluetooth|android tv|chromecast|mobile|phone|smart home|devices?)/i,
                    /(bluetooth|android tv|chromecast|mobile|phone|smart home).*(connect|pair|scan|find|show|list)/i,
                    /(?:i want to|i need to|can you|please).*(connect|pair|find).*(bluetooth|device|tv|phone)/i,
                    /connect (?:to|with) (?:my )?(bluetooth|device|tv|phone|headphone|speaker|chromecast)/i,
                    /pair (?:my )?(bluetooth|device|tv|phone|headphone|speaker)/i
                ];

                const isPairingCommand = pairingPatterns.some(pattern => pattern.test(commandLower));

                if (isPairingCommand || isModalOpen) {
                    // Handle device pairing command
                    if (isPairingCommand && !isModalOpen) {
                        const deviceType = detectDeviceTypeFromVoice(transcript);
                        console.log('[DEVICE-PAIRING] 🎤 Detected device type:', deviceType);

                        if (deviceType) {
                            openModal(deviceType);
                            speak(`Opening ${deviceType.replace('-', ' ')} scanner. Please click the scan button.`);
                        } else {
                            openModal(null);
                            speak('Opening device scanner. Which type of device would you like to connect?');
                        }

                        // Restart listening for next command
                        setTimeout(() => {
                            isSpeakingRef.current = false;
                            assistant.start();
                        }, 2000);
                        return;
                    } else if (isModalOpen) {
                        // Modal is open, handle voice commands for device selection
                        console.log('[DEVICE-PAIRING] 🎤 Handling voice command in modal:', transcript);
                        handleDeviceVoiceCommand(transcript);

                        // Restart listening for next command
                        setTimeout(() => {
                            isSpeakingRef.current = false;
                            assistant.start();
                        }, 1000);
                        return;
                    }
                }

                // [OFFLINE-SUPPORT] Check for local intent first
                const localIntent = localIntentService.checkIntent(transcript);

                let data;

                if (localIntent) {
                    console.info('[LOCAL-INTENT]', 'Executing offline:', localIntent);
                    data = localIntent;
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

                // DELEGATE COMMAND EXECUTION
                // Inject dependencies needed for command execution
                const dependencies = {
                    speak,
                    toast,
                    navigate,
                    ensureListeningAfterAction
                };

                await processCommand(data, dependencies);

                if (data.response) {
                    setAiText(data.response);
                }

                setTimeout(() => {
                    setUserText("");
                }, 3000);

            } catch (error) {
                console.error('[COMMAND-ERROR]:', error);

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
                setTimeout(() => {
                    if (voiceAssistantRef.current && !voiceAssistantRef.current.isListening) {
                        console.log('[VOICE-ASSISTANT] Ensuring listening state in finally block (Robust Restart)');
                        voiceAssistantRef.current.shouldRestart = true;
                        voiceAssistantRef.current.start();
                    }
                }, 3000);
            }
        });

        // Auto-start
        setTimeout(() => {
            console.info('[COPILOT-UPGRADE]', 'Auto-starting listener on mount');
            assistant.start();
        }, 1000);

        return () => {
            console.info('[COPILOT-UPGRADE]', 'Cleaning up voice assistant');
            if (voiceAssistantRef.current) {
                voiceAssistantRef.current.destroy();
            }
        };

    }, [userData, getGeminiResponse, processCommand, navigate, speak, ensureListeningAfterAction]);

    const startListening = useCallback(() => {
        if (voiceAssistantRef.current && !voiceAssistantRef.current.isListening) {
            console.log('[HOME] Forcing start from VAD trigger');
            voiceAssistantRef.current.shouldRestart = true;
            voiceAssistantRef.current.start();
        }
    }, []);

    return {
        listening,
        isAssistantActive,
        userText,
        aiText,
        speak,
        ensureListeningAfterAction,
        isSpeakingRef,
        startListening
    };
};
