/**
 * useVoiceDeviceControl Hook
 * Fully automated device pairing with voice commands
 * Handles: scanning → listing → voice selection → automatic pairing
 */

import { useCallback, useEffect } from 'react';
import useDevicePairingStore from '../store/devicePairingStore';
import axios from 'axios';
import voiceAssistant from '../services/voiceAssistant';

const useVoiceDeviceControl = () => {
    const {
        isModalOpen,
        setFoundDevices,
        updatePairingProgress,
        setConnectionSuccess,
        setConnectionError,
        selectedDeviceType,
        selectedDevice,
        setScanError,
        currentScreen
    } = useDevicePairingStore();

    /**
     * Speak using voice assistant
     */
    const speak = (message) => {
        try {
            voiceAssistant.speak(message);
        } catch (error) {
            console.log('[VOICE] TTS error:', error);
        }
    };

    /**
     * Scan for devices - fully automated with voice announcements
     */
    const scanForDevices = useCallback(async (deviceType) => {
        try {
            console.log(`[VOICE-DEVICE] 🔍 Starting automated scan for ${deviceType}`);

            if (deviceType === 'bluetooth') {
                // Use BACKEND OS-level Bluetooth (not Web Bluetooth!)
                console.log('[BLUETOOTH] 📡 Using backend OS-level Bluetooth API...');
                speak('Searching for Bluetooth devices');

                try {
                    const response = await axios.post(`/api/device/scan/bluetooth`);
                    console.log('[BLUETOOTH] 📊 Backend scan result:', response.data);

                    if (response.data.success && response.data.devices) {
                        const devices = response.data.devices.map(d => ({
                            id: d.id,
                            name: d.name,
                            type: 'bluetooth',
                            connected: d.connected || false,
                            paired: d.paired || false
                        }));

                        console.log(`[BLUETOOTH] ✅ Found ${devices.length} devices via OS Bluetooth`);

                        // Keep earbud visible for 3 seconds, then show device list
                        if (devices.length > 0) {
                            // Announce found devices
                            const deviceNames = devices.map(d => d.name).join(', ');
                            speak(`I found ${devices.length} Bluetooth ${devices.length === 1 ? 'device' : 'devices'}: ${deviceNames}. Which device would you like to connect?`);

                            setTimeout(() => {
                                setFoundDevices(devices); // Set devices right before showing list
                                const { setCurrentScreen } = useDevicePairingStore.getState();
                                setCurrentScreen('device-list');
                            }, 3000); // 3-second delay for earbud animation
                        } else {
                            // No devices found
                            speak('No Bluetooth devices found');
                            setTimeout(() => {
                                setFoundDevices([]);
                                const { setCurrentScreen } = useDevicePairingStore.getState();
                                setCurrentScreen('no-devices');
                            }, 3000);
                        }

                        return devices;
                    } else {
                        console.log('[BLUETOOTH] ⚠️ No devices found');
                        setScanError('No Bluetooth devices found');
                        setFoundDevices([]);
                        speak('No Bluetooth devices found');
                        // No devices found, show no-devices screen after delay
                        setTimeout(() => {
                            const { setCurrentScreen } = useDevicePairingStore.getState();
                            setCurrentScreen('no-devices');
                        }, 3000);
                        return [];
                    }
                } catch (error) {
                    console.error('[BLUETOOTH] ❌ Backend scan error:', error);
                    setScanError(error.message || 'Failed to scan Bluetooth devices');
                    setFoundDevices([]);
                    speak('Failed to scan for Bluetooth devices');
                    // On error, show no-devices screen after delay
                    setTimeout(() => {
                        const { setCurrentScreen } = useDevicePairingStore.getState();
                        setCurrentScreen('no-devices');
                    }, 3000);
                    return [];
                }
            }



            else if (deviceType === 'chromecast') {
                // Chromecast - backend mDNS scanning (EXACTLY like Bluetooth)
                console.log('[CHROMECAST] 📡 Starting mDNS scan...');
                speak('Searching for Chromecast devices');

                try {
                    // Call backend to scan for real Chromecast devices (this takes ~10 seconds)
                    const response = await axios.post(`/api/device/scan/chromecast`);
                    console.log('[CHROMECAST] 📊 Backend scan result:', response.data);

                    if (response.data.success && response.data.devices) {
                        const devices = response.data.devices.map(d => ({
                            id: d.id,
                            name: d.name,
                            type: 'chromecast',
                            ip: d.ip,
                            model: d.model || 'Chromecast',
                            manufacturer: d.manufacturer || 'Google',
                            connected: false,
                            paired: false
                        }));

                        console.log(`[CHROMECAST] ✅ Found ${devices.length} devices via mDNS`);

                        // Set devices immediately
                        setFoundDevices(devices);

                        // Show device list after small delay (scan already took time)
                        if (devices.length > 0) {
                            // Announce found devices
                            const deviceNames = devices.map(d => d.name).join(', ');
                            speak(`I found ${devices.length} Chromecast ${devices.length === 1 ? 'device' : 'devices'}: ${deviceNames}. Which device would you like to connect?`);

                            setTimeout(() => {
                                const { setCurrentScreen } = useDevicePairingStore.getState();
                                setCurrentScreen('device-list');
                                console.log('[CHROMECAST] Showing device list');
                            }, 1000); // 1 second for smooth transition
                        } else {
                            speak('No Chromecast devices found');
                            setTimeout(() => {
                                const { setCurrentScreen } = useDevicePairingStore.getState();
                                setCurrentScreen('no-devices');
                                console.log('[CHROMECAST] Showing no-devices screen');
                            }, 1000);
                        }

                        return devices;
                    } else {
                        console.log('[CHROMECAST] ⚠️ No devices found');
                        speak('No Chromecast devices found');
                        setScanError('No Chromecast devices found');
                        setFoundDevices([]);
                        // No devices found, show no-devices screen after delay
                        setTimeout(() => {
                            const { setCurrentScreen } = useDevicePairingStore.getState();
                            setCurrentScreen('no-devices');
                            console.log('[CHROMECAST] Showing no-devices screen');
                        }, 1000);
                        return [];
                    }
                } catch (error) {
                    console.error('[CHROMECAST] ❌ Backend scan error:', error);
                    setScanError(error.message || 'Failed to scan for Chromecast devices');
                    setFoundDevices([]);
                    // On error, show no-devices screen after delay
                    setTimeout(() => {
                        const { setCurrentScreen } = useDevicePairingStore.getState();
                        setCurrentScreen('no-devices');
                        console.log('[CHROMECAST] Showing no-devices screen (error)');
                    }, 1000);
                    return [];
                }
            }

            else {
                // Backend devices (Android TV, etc.) - automatic network scan
                console.log(`[BACKEND] 🌐 Calling /api/device/scan/${deviceType}`);

                // Announce scanning
                const deviceLabel = deviceType === 'android-tv' ? 'Android TV' : deviceType;
                speak(`Searching for ${deviceLabel} devices`);

                const response = await axios.post(`/api/device/scan/${deviceType}`);
                console.log('[BACKEND] 📊 Scan response:', response.data);

                if (response.data.success) {
                    const devices = response.data.devices || [];
                    console.log(`[BACKEND] ✅ Found ${devices.length} ${deviceType} devices`);

                    if (devices.length > 0) {
                        // Announce friend devices
                        const deviceNames = devices.map(d => d.name).join(', ');
                        speak(`I found ${devices.length} ${deviceLabel} ${devices.length === 1 ? 'device' : 'devices'}: ${deviceNames}. Which device would you like to connect?`);
                    } else {
                        speak(`No ${deviceLabel} devices found`);
                    }

                    setFoundDevices(devices);
                    return devices;
                } else {
                    console.log('[BACKEND] ❌ Scan failed:', response.data.message);
                    speak(`Failed to scan for ${deviceLabel} devices`);
                    setScanError(response.data.message || 'Scan failed');
                    setFoundDevices([]); // Ensure found devices is cleared on failure
                    return [];
                }
            }
        } catch (error) {
            console.error('[VOICE-DEVICE] ❌ Scan error:', error);
            setScanError(error.message);
            setFoundDevices([]);
            return [];
        }
    }, [setFoundDevices, setScanError, setConnectionSuccess]);

    /**
     * Pair with device - fully automated with voice announcements
     */
    const pairWithDevice = useCallback(async (device, deviceType) => {
        try {
            console.log(`[VOICE-DEVICE] 🔗 Automatically pairing with ${device.name}`);
            speak(`Connecting to ${device.name}`);

            // For Bluetooth, if already connected during scan, just show success
            if (deviceType === 'bluetooth' && device.connected) {
                console.log('[BLUETOOTH] ✅ Device already connected, showing success');
                updatePairingProgress(100, 3, 'connected');
                speak(`Already connected to ${device.name}`);
                setConnectionSuccess(`Already connected to ${device.name}!`);
                return true;
            }

            // Step 1: Initiating connection
            updatePairingProgress(25, 0, 'connecting');
            await new Promise(resolve => setTimeout(resolve, 500));

            if (deviceType === 'bluetooth') {

                try {
                    updatePairingProgress(50, 1, 'connecting');
                    console.log('[BLUETOOTH] 🔗 Connecting via backend OS API...');

                    // Call backend API for OS-level connection
                    const response = await axios.post('/api/device/pair', {
                        deviceId: device.id,
                        deviceType: 'bluetooth',
                        deviceName: device.name
                    });
                    console.log('[BLUETOOTH] 📊 Backend connect result:', response.data);

                    if (response.data.success) {
                        updatePairingProgress(75, 2, 'waiting_approval');
                        await new Promise(resolve => setTimeout(resolve, 800));

                        updatePairingProgress(100, 3, 'connected');
                        speak(`Successfully connected to ${device.name}`);
                        setConnectionSuccess(`Successfully connected to ${device.name} at OS level! Audio will work.`);
                        return true;
                    } else {
                        speak(`Failed to connect to ${device.name}`);
                        setConnectionError('Connection failed', response.data.message || 'Device rejected connection');
                        return false;
                    }
                } catch (error) {
                    console.error('[BLUETOOTH] ❌ Pairing error:', error);
                    speak(`Error connecting to ${device.name}`);
                    setConnectionError('Connection failed', error.message);
                    return false;
                }
            }

            else if (deviceType === 'chromecast') {
                const chromecastService = (await import('../services/chromecastService')).default;

                try {
                    updatePairingProgress(50, 1, 'connecting');
                    console.log('[CHROMECAST] 🔗 Requesting Cast session...');

                    const sessionResult = await chromecastService.requestSession();
                    console.log('[CHROMECAST] 📊 Session result:', sessionResult);

                    if (sessionResult.success) {
                        updatePairingProgress(75, 2, 'waiting_approval');
                        await new Promise(resolve => setTimeout(resolve, 800));

                        updatePairingProgress(100, 3, 'connected');
                        speak(`Successfully connected to ${sessionResult.deviceName || device.name}`);
                        setConnectionSuccess(`Successfully connected to ${sessionResult.deviceName || 'Chromecast'}!`);
                        return true;
                    } else {
                        speak(`Failed to connect to ${device.name}`);
                        setConnectionError('Connection failed', sessionResult.message || 'Cast session failed');
                        return false;
                    }
                } catch (error) {
                    console.error('[CHROMECAST] ❌ Pairing error:', error);
                    speak(`Error connecting to ${device.name}`);
                    setConnectionError('Connection failed', error.message);
                    return false;
                }
            }

            else {
                // Backend devices
                updatePairingProgress(50, 1, 'connecting');
                await new Promise(resolve => setTimeout(resolve, 800));

                updatePairingProgress(75, 2, 'waiting_approval');

                console.log('[BACKEND] 🔗 Calling /api/device/pair');
                const response = await axios.post('/api/device/pair', {
                    deviceId: device.id,
                    deviceType: deviceType,
                    pairingCode: device.pairingCode
                });
                console.log('[BACKEND] 📊 Pair response:', response.data);

                if (response.data.success) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    updatePairingProgress(100, 3, 'connected');
                    speak(`Successfully connected to ${device.name}`);
                    setConnectionSuccess(`Connected to ${device.name}!`);
                    return true;
                } else {
                    speak(`Failed to connect to ${device.name}`);
                    setConnectionError('Connection failed', response.data.message || 'Connection failed');
                    return false;
                }
            }
        } catch (error) {
            console.error('[VOICE-DEVICE] ❌ Pairing error:', error);
            speak(`Error connecting to ${device.name}`);
            setConnectionError('Connection failed', error.message);
            return false;
        }
    }, [updatePairingProgress, setConnectionSuccess, setConnectionError]);

    return {
        scanForDevices,
        pairWithDevice,
        isModalOpen
    };
};

export default useVoiceDeviceControl;
