/**
 * Device Type Configurations
 * Defines settings, patterns, and metadata for each device type
 */

export const deviceTypes = {
    bluetooth: {
        id: 'bluetooth',
        name: 'Bluetooth Devices',
        icon: '🔵',
        color: '#0066FF',
        gradient: 'linear-gradient(135deg, #0066FF 0%, #00C6FF 100%)',

        scanMethod: 'web-bluetooth',
        scanTimeout: 15000,
        pairingMethod: 'browser-approval',
        requiredApproval: true,
        displayPairingCode: true,

        scanAnimation: 'radar-pulse',

        voicePatterns: [
            /bluetooth/i,
            /headphone/i,
            /speaker/i,
            /earphone/i,
            /airpod/i
        ],

        pairingSteps: [
            'Searching for Bluetooth devices',
            'Requesting device approval',
            'Establishing connection',
            'Verifying connection'
        ],

        errorMessages: {
            not_found: 'No Bluetooth devices found. Make sure the device is in pairing mode',
            rejected: 'Pairing rejected by device. Please try again',
            timeout: 'Connection timed out. Device may be out of range',
            unavailable: 'Bluetooth is not available in this browser. Please use Chrome, Edge, or Opera'
        },

        voiceInstructions: {
            deviceList: 'Say the device number or name to connect',
            scanning: 'Scanning for Bluetooth devices...',
            pairing: 'Please approve the pairing request on your device'
        }
    },

    'android-tv': {
        id: 'android-tv',
        name: 'Android TV',
        icon: '📺',
        color: '#3DDC84',
        gradient: 'linear-gradient(135deg, #3DDC84 0%, #07C160 100%)',

        scanMethod: 'adb',
        scanTimeout: 10000,
        pairingMethod: 'adb-approval',
        requiredApproval: true,
        displayPairingCode: true,

        scanAnimation: 'network-waves',

        voicePatterns: [
            /android tv/i,
            /smart tv/i,
            /television/i,
            /\btv\b/i
        ],

        pairingSteps: [
            'Discovering Android TV on network',
            'Sending connection request',
            'Waiting for approval on TV',
            'Establishing ADB connection'
        ],

        errorMessages: {
            not_found: 'No Android TV found. Make sure it\'s on the same network and developer mode is enabled',
            rejected: 'Connection rejected on TV. Please approve the connection',
            timeout: 'TV didn\'t respond. Check if ADB debugging is enabled',
            unavailable: 'ADB is not configured. Please contact support'
        },

        voiceInstructions: {
            deviceList: 'Say the TV name or number to connect',
            scanning: 'Scanning for Android TVs on your network...',
            pairing: 'Please approve the connection request on your TV screen'
        }
    },

    chromecast: {
        id: 'chromecast',
        name: 'Chromecast',
        icon: '📡',
        color: '#4285F4',
        gradient: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',

        scanMethod: 'cast-sdk',
        scanTimeout: 8000,
        pairingMethod: 'cast-session',
        requiredApproval: true,
        displayPairingCode: false,

        scanAnimation: 'broadcast-waves',

        voicePatterns: [
            /chromecast/i,
            /cast device/i,
            /google cast/i
        ],

        pairingSteps: [
            'Discovering Cast devices',
            'Requesting Cast session',
            'Device is connecting',
            'Session established'
        ],

        errorMessages: {
            not_found: 'No Chromecast devices found. Make sure it\'s on the same network',
            rejected: 'Cast session rejected or cancelled',
            timeout: 'Connection timed out. Please try again',
            unavailable: 'Chromecast requires Chrome browser'
        },

        voiceInstructions: {
            deviceList: 'Say the device number or name to connect',
            scanning: 'Scanning for Chromecast devices...',
            pairing: 'Select the device in the browser popup'
        },

        features: {
            mediaCasting: true,
            volumeControl: true,
            appLaunching: true
        }
    },

    mobile: {
        id: 'mobile',
        name: 'Mobile Phones',
        icon: '📱',
        color: '#FF6B35',
        gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',

        scanMethod: 'bluetooth',
        scanTimeout: 12000,
        pairingMethod: 'bluetooth-pairing',
        requiredApproval: true,
        displayPairingCode: true,

        scanAnimation: 'radar-pulse',

        voicePatterns: [
            /mobile/i,
            /phone/i,
            /smartphone/i,
            /cell phone/i
        ],

        pairingSteps: [
            'Searching for mobile devices',
            'Requesting connection',
            'Pairing with device',
            'Connection established'
        ],

        errorMessages: {
            not_found: 'No mobile phones found. Make sure Bluetooth is on and device is visible',
            rejected: 'Pairing rejected on phone',
            timeout: 'Connection timed out',
            unavailable: 'Mobile phone pairing not available'
        },

        voiceInstructions: {
            deviceList: 'Say the phone number or name to connect',
            scanning: 'Scanning for nearby phones...',
            pairing: 'Accept the pairing request on your phone'
        }
    },

    'smart-home': {
        id: 'smart-home',
        name: 'Smart Home Devices',
        icon: '💡',
        color: '#9C27B0',
        gradient: 'linear-gradient(135deg, #9C27B0 0%, #E91E63 100%)',

        scanMethod: 'upnp',
        scanTimeout: 15000,
        pairingMethod: 'network',
        requiredApproval: false,
        displayPairingCode: false,

        scanAnimation: 'network-waves',

        voicePatterns: [
            /smart home/i,
            /smart light/i,
            /smart bulb/i,
            /thermostat/i,
            /smart device/i
        ],

        pairingSteps: [
            'Discovering smart home devices',
            'Connecting to device',
            'Verifying connection',
            'Device ready'
        ],

        errorMessages: {
            not_found: 'No smart home devices found on network',
            rejected: 'Device connection failed',
            timeout: 'Connection timed out',
            unavailable: 'Smart home control not available'
        },

        voiceInstructions: {
            deviceList: 'Say the device number or name to connect',
            scanning: 'Scanning for smart home devices...',
            pairing: 'Connecting to device...'
        }
    }
};

/**
 * Get device type config by ID
 */
export const getDeviceConfig = (deviceTypeId) => {
    return deviceTypes[deviceTypeId] || null;
};

/**
 * Get device type from voice command
 */
export const detectDeviceTypeFromVoice = (voiceCommand) => {
    const commandLower = voiceCommand.toLowerCase();

    for (const [typeId, config] of Object.entries(deviceTypes)) {
        for (const pattern of config.voicePatterns) {
            if (pattern.test(commandLower)) {
                return typeId;
            }
        }
    }

    return null;
};

/**
 * Get all device types as array
 */
export const getAllDeviceTypes = () => {
    return Object.values(deviceTypes);
};

/**
 * Device type colors for theming
 */
export const deviceColors = {
    bluetooth: '#0066FF',
    'android-tv': '#3DDC84',
    chromecast: '#4285F4',
    mobile: '#FF6B35',
    'smart-home': '#9C27B0'
};

/**
 * Scanning animation types
 */
export const animationTypes = {
    'radar-pulse': 'radar-pulse',
    'network-waves': 'network-waves',
    'broadcast-waves': 'broadcast-waves'
};

export default deviceTypes;
