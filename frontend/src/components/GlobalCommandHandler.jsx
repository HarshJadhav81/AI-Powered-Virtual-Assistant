import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import socketService from '../services/socketService';
import appLaunchService from '../services/appLaunchService';

/**
 * Global Command Handler
 * Listens for system-wide commands (like app opening) from the AI
 * regardless of the current page.
 */
const GlobalCommandHandler = () => {
    useEffect(() => {
        const socket = socketService.getSocket();

        if (!socket) return;

        // Handler for stream events (actions embedded in chat stream)
        const handleStreamEvent = async (data) => {
            if (data?.type === 'action') {
                const { action, metadata } = data;

                // App Launch
                if (action === 'app-launch') {
                    try {
                        const appName = metadata?.appName || data.appName;
                        const result = await appLaunchService.launchApp(appName);
                        if (result.success) {
                            toast.success(result.message);
                        } else {
                            toast.error(result.message);
                        }
                    } catch (error) {
                        console.error('[GLOBAL-CMD] App launch failed:', error);
                        toast.error('Failed to launch app');
                    }
                }

                // App Close
                if (action === 'app-close') {
                    try {
                        const appName = metadata?.appName || data.appName;
                        const result = await appLaunchService.closeDesktopApp(appName);
                        if (result.success) {
                            toast.success(result.message);
                        } else {
                            toast.error(result.message);
                        }
                    } catch (error) {
                        console.error('[GLOBAL-CMD] App close failed:', error);
                        toast.error('Failed to close app');
                    }
                }
            }
        };

        // Handler for direct AI responses (Legacy/Voice mode)
        const handleAiResponse = async (response) => {
            if (response?.action === 'app-launch') {
                const appName = response.deviceName || response.device || response.metadata?.appName;
                // Note: Voice responses might differ slightly in structure, adapting based on Home.jsx findings
                // Home.jsx logic: const appName = metadata?.appName || data.appName || userInput;
                if (appName) {
                    // handle logic... 
                    // Wait, Home.jsx handles this locally for Voice Mode. 
                    // If we add it here, we might double-trigger if Home is active.
                    // However, user requested "handle this service from anywhere".
                    // If Home is active, it might be better to let Home handle it as it does speech feedback.
                    // But for other pages (Settings, etc), we need this.
                    // I will add a check or rely on the fact that Home might not be using the global handler concurrently?
                    // Actually, Home is a page. App is parent. GlobalHandler is in App.
                    // So both will run.
                    // I should probably remove the handler from Home.jsx if I put it here?
                    // Or I can leave Home.jsx as is (since it handles Speech Output "Opening...") and only handle 'stream-event' here which is used by Chat?
                    // The user said "intigrate this app opening functionality in chat page as well as home page voice intigration".
                    // And then "handle this service from anywhere".
                    // The 'stream-event' is typically for Chat/Text mode.
                    // 'aiResponse' is for Voice mode.

                    // Strategy: 
                    // - Handle 'stream-event' (Chat actions) globally.
                    // - Handle 'aiResponse' (Voice actions) globally? 
                    // If I handle 'aiResponse' globally, Home.jsx will speak AND Global will toast/launch.
                    // Creating a conflict. 
                    // I will stick to handling 'stream-event' globally for now as that powers the "Chat" experience across pages (if chat runs in background/sidebar).
                    // But 'aiResponse' is mostly for the active Voice Assistant page.
                    // If the user wants voice control from *anywhere*, they need the VoicePopup to handle it (which they have).
                    // `useVoicePopup` handles `aiResponse`.
                    // I should check `useVoicePopup.js` again. It handles `showDevice` but doesn't seem to execute the code?
                    // Actually, `Home.jsx` executes the code. 
                    // If I want voice control from Settings page, `useVoicePopup` needs to execute it.

                    // Let's look at `useVoicePopup.js` again.
                }
            }
        };

        socket.on('stream-event', handleStreamEvent);

        return () => {
            socket.off('stream-event', handleStreamEvent);
        };
    }, []);

    return null; // Logic only component
};

export default GlobalCommandHandler;
