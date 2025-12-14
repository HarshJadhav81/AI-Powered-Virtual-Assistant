/**
 * ADB Controller - Android TV Control via ADB
 * Handles connection and command execution for Android TV
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class ADBController {
    constructor() {
        this.connectedDevices = new Map();
        this.defaultTVIP = process.env.ANDROID_TV_IP || '192.168.1.128';
        this.defaultTVPort = process.env.ANDROID_TV_PORT || '5555';
        this.defaultDeviceId = `${this.defaultTVIP}:${this.defaultTVPort}`;
    }

    /**
     * Check if ADB is installed and available
     */
    async checkADB() {
        try {
            const { stdout } = await execAsync('adb version');
            return {
                available: stdout.includes('Android Debug Bridge'),
                version: stdout.split('\n')[0]
            };
        } catch (error) {
            console.error('[ADB] ADB not found:', error.message);
            return { available: false, error: 'ADB not installed' };
        }
    }

    /**
     * Connect to Android TV
     */
    async connectToTV(ip = this.defaultTVIP, port = this.defaultTVPort) {
        try {
            console.info(`[ADB] Connecting to Android TV at ${ip}:${port}...`);

            const { stdout, stderr } = await execAsync(`adb connect ${ip}:${port}`);

            if (stdout.includes('connected') || stdout.includes('already connected')) {
                const deviceId = `${ip}:${port}`;
                this.connectedDevices.set(deviceId, {
                    id: deviceId,
                    ip,
                    port,
                    status: 'connected',
                    connectedAt: new Date().toISOString()
                });

                console.info(`[ADB] Successfully connected to ${deviceId}`);
                return { success: true, deviceId, message: stdout.trim() };
            }

            throw new Error(stderr || stdout);
        } catch (error) {
            console.error('[ADB] Connection failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Disconnect from Android TV
     */
    async disconnectFromTV(deviceId = this.defaultDeviceId) {
        try {
            const { stdout } = await execAsync(`adb disconnect ${deviceId}`);
            this.connectedDevices.delete(deviceId);

            console.info(`[ADB] Disconnected from ${deviceId}`);
            return { success: true, message: stdout.trim() };
        } catch (error) {
            console.error('[ADB] Disconnection failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get list of connected devices
     */
    async getConnectedDevices() {
        try {
            const { stdout } = await execAsync('adb devices');
            const lines = stdout.split('\n').slice(1); // Skip header

            const devices = lines
                .filter(line => line.trim() && !line.includes('List of devices'))
                .map(line => {
                    const [id, status] = line.trim().split('\t');
                    return { id, status, type: 'android-tv' };
                });

            return devices;
        } catch (error) {
            console.error('[ADB] Failed to get devices:', error.message);
            return [];
        }
    }

    /**
     * Execute TV control command
     */
    async controlTV(action, deviceId = this.defaultDeviceId, params = {}) {
        try {
            console.info(`[ADB] Executing ${action} on ${deviceId}`);

            const commands = {
                // Power controls
                'power-on': `adb -s ${deviceId} shell input keyevent KEYCODE_POWER`,
                'power-off': `adb -s ${deviceId} shell input keyevent KEYCODE_SLEEP`,
                'power-toggle': `adb -s ${deviceId} shell input keyevent KEYCODE_POWER`,

                // Volume controls
                'volume-up': `adb -s ${deviceId} shell input keyevent KEYCODE_VOLUME_UP`,
                'volume-down': `adb -s ${deviceId} shell input keyevent KEYCODE_VOLUME_DOWN`,
                'volume-mute': `adb -s ${deviceId} shell input keyevent KEYCODE_VOLUME_MUTE`,

                // Navigation
                'home': `adb -s ${deviceId} shell input keyevent KEYCODE_HOME`,
                'back': `adb -s ${deviceId} shell input keyevent KEYCODE_BACK`,
                'menu': `adb -s ${deviceId} shell input keyevent KEYCODE_MENU`,
                'up': `adb -s ${deviceId} shell input keyevent KEYCODE_DPAD_UP`,
                'down': `adb -s ${deviceId} shell input keyevent KEYCODE_DPAD_DOWN`,
                'left': `adb -s ${deviceId} shell input keyevent KEYCODE_DPAD_LEFT`,
                'right': `adb -s ${deviceId} shell input keyevent KEYCODE_DPAD_RIGHT`,
                'select': `adb -s ${deviceId} shell input keyevent KEYCODE_DPAD_CENTER`,

                // Media controls
                'play-pause': `adb -s ${deviceId} shell input keyevent KEYCODE_MEDIA_PLAY_PAUSE`,
                'play': `adb -s ${deviceId} shell input keyevent KEYCODE_MEDIA_PLAY`,
                'pause': `adb -s ${deviceId} shell input keyevent KEYCODE_MEDIA_PAUSE`,
                'stop': `adb -s ${deviceId} shell input keyevent KEYCODE_MEDIA_STOP`,
                'next': `adb -s ${deviceId} shell input keyevent KEYCODE_MEDIA_NEXT`,
                'previous': `adb -s ${deviceId} shell input keyevent KEYCODE_MEDIA_PREVIOUS`,

                // App launches
                'launch-netflix': `adb -s ${deviceId} shell am start -n com.netflix.ninja/.MainActivity`,
                'launch-youtube': `adb -s ${deviceId} shell am start -n com.google.android.youtube.tv/.activity.ShellActivity`,
                'launch-prime': `adb -s ${deviceId} shell am start -n com.amazon.avod/.client.activity.HomeActivity`,
                'launch-disney': `adb -s ${deviceId} shell am start -n com.disney.disneyplus/.ui.splash.SplashActivity`,
                'launch-spotify': `adb -s ${deviceId} shell am start -n com.spotify.tv.android/.SpotifyTVActivity`,
                'launch-browser': `adb -s ${deviceId} shell am start -n com.android.chrome/.Main`,
            };

            const command = commands[action];
            if (!command) {
                throw new Error(`Unknown action: ${action}`);
            }

            const { stdout, stderr } = await execAsync(command);

            console.info(`[ADB] Command executed successfully: ${action}`);
            return {
                success: true,
                action,
                deviceId,
                message: `TV ${action.replace(/-/g, ' ')} executed successfully`
            };
        } catch (error) {
            console.error(`[ADB] Command failed:`, error.message);
            return {
                success: false,
                action,
                deviceId,
                error: error.message
            };
        }
    }

    /**
     * Get TV device information
     */
    async getTVInfo(deviceId = this.defaultDeviceId) {
        try {
            const [model, android, battery, resolution] = await Promise.all([
                execAsync(`adb -s ${deviceId} shell getprop ro.product.model`),
                execAsync(`adb -s ${deviceId} shell getprop ro.build.version.release`),
                execAsync(`adb -s ${deviceId} shell dumpsys battery | grep level`),
                execAsync(`adb -s ${deviceId} shell wm size`)
            ]);

            return {
                deviceId,
                model: model.stdout.trim(),
                androidVersion: android.stdout.trim(),
                battery: battery.stdout.match(/\d+/)?.[0] || 'N/A',
                resolution: resolution.stdout.split(':')[1]?.trim() || 'Unknown',
                status: 'connected'
            };
        } catch (error) {
            console.error('[ADB] Failed to get TV info:', error.message);
            return {
                deviceId,
                error: error.message,
                status: 'error'
            };
        }
    }

    /**
     * Check if TV is powered on
     */
    async isTVOn(deviceId = this.defaultDeviceId) {
        try {
            const { stdout } = await execAsync(`adb -s ${deviceId} shell dumpsys power | grep "Display Power"`);
            return stdout.includes('state=ON');
        } catch (error) {
            console.error('[ADB] Failed to check TV power state:', error.message);
            return false;
        }
    }

    /**
     * Get current app/activity
     */
    async getCurrentApp(deviceId = this.defaultDeviceId) {
        try {
            const { stdout } = await execAsync(`adb -s ${deviceId} shell dumpsys window windows | grep -E 'mCurrentFocus'`);
            const match = stdout.match(/\{.*\s(.*)\/(.*)\}/);

            if (match) {
                return {
                    package: match[1],
                    activity: match[2],
                    fullName: `${match[1]}/${match[2]}`
                };
            }

            return { package: 'unknown', activity: 'unknown' };
        } catch (error) {
            console.error('[ADB] Failed to get current app:', error.message);
            return { error: error.message };
        }
    }
}

// Export singleton instance
const adbController = new ADBController();
export default adbController;
