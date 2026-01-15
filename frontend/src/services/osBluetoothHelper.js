/**
 * OS Bluetooth Helper
 * Provides instructions for OS-level Bluetooth pairing
 * Since Web Bluetooth API cannot trigger system pairing
 */

class OSBluetoothHelper {
    constructor() {
        this.platform = this.detectPlatform();
    }

    /**
     * Detect user's operating system
     */
    detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('mac')) return 'mac';
        if (userAgent.includes('win')) return 'windows';
        if (userAgent.includes('linux')) return 'linux';
        return 'unknown';
    }

    /**
     * Get instructions for pairing device in system settings
     */
    getPairingInstructions(deviceName) {
        const instructions = {
            mac: {
                steps: [
                    'Click the Apple menu in the top-left corner',
                    'Select "System Settings"',
                    'Click "Bluetooth" in the sidebar',
                    `Look for "${deviceName}" in the devices list`,
                    `Click "Connect" next to ${deviceName}`,
                    'Wait for "Connected" status',
                    'Audio will now play through your device!'
                ],
                shortcut: 'You can also click the Bluetooth icon in the menu bar',
                voice: `To connect ${deviceName} for audio, open System Settings, go to Bluetooth, and click Connect next to ${deviceName}.`
            },
            windows: {
                steps: [
                    'Click the Start button',
                    'Select "Settings" (gear icon)',
                    'Click "Bluetooth & devices"',
                    'Click "Add device"',
                    'Select "Bluetooth"',
                    `Choose "${deviceName}" from the list`,
                    'Click "Connect"',
                    'Wait for pairing to complete',
                    'Audio will now work!'
                ],
                shortcut: 'You can also click the Bluetooth icon in the taskbar',
                voice: `To connect ${deviceName} for audio, open Windows Settings, go to Bluetooth and devices, click Add device, and select ${deviceName}.`
            },
            linux: {
                steps: [
                    'Click the system menu in the top-right',
                    'Click "Settings"',
                    'Select "Bluetooth"',
                    'Turn on Bluetooth if needed',
                    `Click "${deviceName}" in the list`,
                    'Click "Connect" or "Pair"',
                    'Audio should work automatically'
                ],
                voice: `To connect ${deviceName}, open Settings, go to Bluetooth, and pair with ${deviceName}.`
            }
        };

        return instructions[this.platform] || instructions.mac;
    }

    /**
     * Check if device might be already paired in OS
     * (We can't actually check this via browser, but we can guide)
     */
    async checkIfSystemPaired(deviceName) {
        // Unfortunately, Web API cannot check OS Bluetooth settings
        // This is a limitation of browser security
        return {
            canCheck: false,
            message: 'Cannot check OS Bluetooth pairing from browser due to security restrictions',
            suggestion: 'Please check your system Bluetooth settings manually'
        };
    }

    /**
     * Generate helpful message for user
     */
    getHelpMessage(deviceName, action = 'pair') {
        const instructions = this.getPairingInstructions(deviceName);

        if (action === 'pair') {
            return {
                title: `Connect ${deviceName} for Audio`,
                message: `I've found ${deviceName}, but to use it for audio, you'll need to pair it in your system settings.`,
                steps: instructions.steps,
                voice: instructions.voice
            };
        }

        return {
            title: 'OS Bluetooth Settings',
            message: 'Web Bluetooth API cannot access system Bluetooth settings. You\'ll need to pair manually.',
            voice: 'Please pair the device in your system Bluetooth settings for full functionality.'
        };
    }

    /**
     * Open system Bluetooth settings (if possible)
     */
    openBluetoothSettings() {
        // Try to open Bluetooth settings based on the platform
        const urls = {
            mac: 'x-apple.systempreferences:com.apple.preference.bluetooth',
            windows: 'ms-settings:bluetooth',
            linux: 'settings://bluetooth' // Varies by desktop environment
        };

        const url = urls[this.platform];

        if (url) {
            try {
                window.open(url, '_blank');
                return {
                    success: true,
                    message: 'Opening Bluetooth settings...'
                };
            } catch (error) {
                return {
                    success: false,
                    message: 'Could not open settings automatically. Please open manually.',
                    error: error.message
                };
            }
        }

        return {
            success: false,
            message: 'Please open Bluetooth settings manually from your system menu'
        };
    }

    /**
     * Generate step-by-step guide for voice assistant
     */
    getVoiceGuidance(deviceName) {
        const instructions = this.getPairingInstructions(deviceName);

        return {
            initial: `I found ${deviceName}. To connect it for audio, you'll need to pair it in your system Bluetooth settings.`,
            askIfNeedHelp: 'Would you like me to guide you through the steps?',
            steps: instructions.steps.map((step, index) =>
                `Step ${index + 1}: ${step}`
            ),
            completion: `Once paired, ${deviceName} will be ready for audio. You can then use voice commands to control playback.`
        };
    }
}

export default new OSBluetoothHelper();
