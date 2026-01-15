/**
 * Device Pairing Store
 * Manages state for voice-activated device pairing popup system
 */

import { create } from 'zustand';

const useDevicePairingStore = create((set, get) => ({
    // Modal State
    isModalOpen: false,
    currentScreen: 'device-type-selector', // device-type-selector | scanning | device-list | pairing | success | error | no-devices | os-pairing-guide
    selectedDeviceType: null, // 'bluetooth' | 'android-tv' | 'chromecast' | 'mobile' | 'smart-home'

    // Scanning State
    isScanning: false,
    foundDevices: [],
    scanProgress: 0,
    scanError: null,

    // Pairing State
    selectedDevice: null,
    isPairing: false,
    pairingProgress: 0,
    pairingStep: 0, // 0-3 for progress steps
    pairingError: null,
    connectionStatus: null, // 'connecting' | 'waiting_approval' | 'connected' | 'failed'

    // Voice State
    lastVoiceCommand: null,
    isListeningForVoice: true,
    voiceInstructions: '',

    // Success/Error State
    successMessage: '',
    errorMessage: '',
    errorReason: '',

    // Actions

    /**
     * Open modal with optional device type
     */
    openModal: (deviceType = null) => {
        set({
            isModalOpen: true,
            currentScreen: deviceType ? 'scanning' : 'device-type-selector',
            selectedDeviceType: deviceType,
            isListeningForVoice: true
        });

        // Auto-start scanning if device type provided
        if (deviceType) {
            get().startScanning(deviceType);
        }
    },

    /**
     * Close modal and reset state
     */
    closeModal: () => {
        // Stop any ongoing scanning
        if (get().isScanning) {
            get().stopScanning();
        }

        set({
            isModalOpen: false,
            currentScreen: 'device-type-selector',
            selectedDeviceType: null,
            isScanning: false,
            foundDevices: [],
            scanError: null,
            selectedDevice: null,
            isPairing: false,
            pairingProgress: 0,
            pairingStep: 0,
            pairingError: null,
            connectionStatus: null,
            successMessage: '',
            errorMessage: '',
            errorReason: '',
            lastVoiceCommand: null
        });
    },

    /**
     * Set current screen
     */
    setCurrentScreen: (screen) => {
        set({ currentScreen: screen });
    },

    /**
     * Select device type and start scanning
     */
    selectDeviceType: (deviceType) => {
        set({
            selectedDeviceType: deviceType,
            currentScreen: 'scanning'
        });
        get().startScanning(deviceType);
    },

    /**
     * Start scanning for devices
     */
    startScanning: (deviceType) => {
        set({
            isScanning: true,
            foundDevices: [],
            scanProgress: 0,
            scanError: null,
            currentScreen: 'scanning',
            selectedDeviceType: deviceType || get().selectedDeviceType
        });
    },

    /**
     * Update scan progress
     */
    updateScanProgress: (progress) => {
        set({ scanProgress: progress });
    },

    /**
     * Add found device to list
     */
    addFoundDevice: (device) => {
        const devices = get().foundDevices;
        const exists = devices.find(d => d.id === device.id);

        if (!exists) {
            set({ foundDevices: [...devices, device] });
        }
    },

    /**
     * Set found devices and transition to list screen
     */
    setFoundDevices: (devices) => {
        set({
            foundDevices: devices,
            isScanning: false,
            currentScreen: devices.length > 0 ? 'device-list' : 'no-devices'
        });
    },

    /**
     * Stop scanning
     */
    stopScanning: () => {
        set({ isScanning: false });
    },

    /**
     * Handle scan error
     */
    setScanError: (error) => {
        set({
            scanError: error,
            isScanning: false,
            currentScreen: 'no-devices'
        });
    },

    /**
     * Select device and start pairing
     */
    selectDevice: (device) => {
        set({
            selectedDevice: device,
            currentScreen: 'pairing',
            isPairing: true,
            pairingProgress: 0,
            pairingStep: 0,
            connectionStatus: 'connecting'
        });
    },

    /**
     * Update pairing progress
     */
    updatePairingProgress: (progress, step = null, status = null) => {
        const updates = { pairingProgress: progress };

        if (step !== null) {
            updates.pairingStep = step;
        }

        if (status !== null) {
            updates.connectionStatus = status;
        }

        set(updates);
    },

    /**
     * Handle successful connection
     */
    setConnectionSuccess: (message = 'Successfully connected!') => {
        set({
            isPairing: false,
            pairingProgress: 100,
            pairingStep: 3,
            connectionStatus: 'connected',
            currentScreen: 'success',
            successMessage: message
        });

        // Auto-close after 2 seconds
        setTimeout(() => {
            if (get().currentScreen === 'success') {
                get().closeModal();
            }
        }, 2000);
    },

    /**
     * Handle connection error
     */
    setConnectionError: (message, reason = '') => {
        set({
            isPairing: false,
            connectionStatus: 'failed',
            currentScreen: 'error',
            errorMessage: message,
            errorReason: reason,
            pairingError: message
        });
    },

    /**
     * Retry pairing with current device
     */
    retryPairing: () => {
        const device = get().selectedDevice;
        if (device) {
            get().selectDevice(device);
        }
    },

    /**
     * Go back to device list
     */
    backToDeviceList: () => {
        set({
            currentScreen: 'device-list',
            selectedDevice: null,
            isPairing: false,
            pairingProgress: 0,
            pairingStep: 0,
            pairingError: null,
            errorMessage: '',
            errorReason: ''
        });
    },

    /**
     * Rescan for devices
     */
    rescan: () => {
        const deviceType = get().selectedDeviceType;
        set({
            foundDevices: [],
            scanError: null,
            selectedDevice: null
        });
        get().startScanning(deviceType);
    },

    /**
     * Handle voice command
     */
    handleVoiceCommand: (command) => {
        set({ lastVoiceCommand: command });

        const currentScreen = get().currentScreen;
        const commandLower = command.toLowerCase().trim();

        // Global commands
        if (commandLower.match(/cancel|close|stop|nevermind|go back/)) {
            get().closeModal();
            return;
        }

        // Screen-specific commands
        switch (currentScreen) {
            case 'device-type-selector':
                get().handleDeviceTypeSelection(command);
                break;

            case 'device-list':
                get().handleDeviceSelection(command);
                break;

            case 'error':
            case 'no-devices':
                if (commandLower.match(/try again|retry|repeat/)) {
                    get().rescan();
                } else if (commandLower.match(/back|list|show devices/)) {
                    get().backToDeviceList();
                }
                break;

            default:
                break;
        }
    },

    /**
     * Handle device type selection from voice
     */
    handleDeviceTypeSelection: (command) => {
        const commandLower = command.toLowerCase();

        const typeMap = {
            'bluetooth': /bluetooth|headphone|speaker|earphone|airpod/i,
            'android-tv': /android tv|smart tv|television|tv/i,
            'chromecast': /chromecast|cast device/i,
            'mobile': /mobile|phone|smartphone/i,
            'smart-home': /smart home|lights|bulb|thermostat/i
        };

        // Check number selection (1-6)
        const numberMatch = commandLower.match(/(?:number\s*)?(\d+)/);
        if (numberMatch) {
            const num = parseInt(numberMatch[1]);
            const types = ['bluetooth', 'android-tv', 'mobile', 'chromecast', 'gaming', 'smart-home'];
            if (num >= 1 && num <= types.length) {
                get().selectDeviceType(types[num - 1]);
                return;
            }
        }

        // Check device type patterns
        for (const [type, pattern] of Object.entries(typeMap)) {
            if (pattern.test(commandLower)) {
                get().selectDeviceType(type);
                return;
            }
        }
    },

    /**
     * Handle device selection from voice
     */
    handleDeviceSelection: (command) => {
        const commandLower = command.toLowerCase();
        const devices = get().foundDevices;

        // Check for "scan again" command
        if (commandLower.match(/scan again|refresh|rescan/)) {
            get().rescan();
            return;
        }

        // Check number selection
        const numberMatch = commandLower.match(/(?:device|number)?\s*(\d+)/);
        if (numberMatch) {
            const index = parseInt(numberMatch[1]) - 1;
            if (devices[index]) {
                get().selectDevice(devices[index]);
                return;
            }
        }

        // Check for first/second/third
        const positionMap = {
            'first': 0, 'one': 0, '1st': 0,
            'second': 1, 'two': 1, '2nd': 1,
            'third': 2, 'three': 2, '3rd': 2,
            'fourth': 3, 'four': 3, '4th': 3,
            'fifth': 4, 'five': 4, '5th': 4
        };

        for (const [word, index] of Object.entries(positionMap)) {
            if (commandLower.includes(word) && devices[index]) {
                get().selectDevice(devices[index]);
                return;
            }
        }

        // Try to match device name
        const matchedDevice = devices.find(device =>
            device.name && commandLower.includes(device.name.toLowerCase())
        );

        if (matchedDevice) {
            get().selectDevice(matchedDevice);
        }
    },

    /**
     * Set voice instructions
     */
    setVoiceInstructions: (instructions) => {
        set({ voiceInstructions: instructions });
    },

    /**
     * Toggle voice listening
     */
    setVoiceListening: (listening) => {
        set({ isListeningForVoice: listening });
    }
}));

export default useDevicePairingStore;
