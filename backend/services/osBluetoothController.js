/**
 * OS Bluetooth Controller (Backend) - FIXED VERSION
 * Successfully parses blueutil JSON output and controls Bluetooth
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

class OSBluetoothController {
    constructor() {
        this.platform = os.platform();
        this.connectedDevices = new Map();
    }

    /**
     * Scan for Bluetooth devices
     */
    async scanDevices() {
        try {
            console.log(`[OS-BLUETOOTH] Scanning on ${this.platform}...`);

            if (this.platform === 'darwin') {
                return await this.scanMac();
            } else if (this.platform === 'win32') {
                return await this.scanWindows();
            } else if (this.platform === 'linux') {
                return await this.scanLinux();
            }

            return { success: false, message: 'Unsupported platform', devices: [] };
        } catch (error) {
            console.error('[OS-BLUETOOTH] Scan error:', error);
            return { success: false, message: error.message, devices: [] };
        }
    }

    /**
     * macOS: Scan using blueutil JSON output
     */
    async scanMac() {
        try {
            console.log('[OS-BLUETOOTH] Starting inquiry scan for nearby devices...');

            // First, get paired devices
            const { stdout: pairedOutput } = await execAsync('blueutil --paired --format json');
            const pairedDevices = JSON.parse(pairedOutput || '[]');

            // Then, scan for nearby discoverable devices (10 second scan)
            console.log('[OS-BLUETOOTH] Scanning for discoverable devices (10s)...');
            const { stdout: nearbyOutput } = await execAsync('blueutil --inquiry 10 --format json', {
                timeout: 15000 // 15 second timeout
            });

            console.log('[OS-BLUETOOTH] Inquiry output:', nearbyOutput);
            const nearbyDevices = JSON.parse(nearbyOutput || '[]');

            // Combine both lists, avoiding duplicates
            const allDevicesMap = new Map();

            // Add paired devices first
            pairedDevices.forEach(d => {
                allDevicesMap.set(d.address, {
                    id: d.address,
                    name: d.name || 'Unknown Device',
                    type: 'bluetooth',
                    connected: d.connected === true,
                    paired: true,
                    favourite: d.favourite || false
                });
            });

            // Add nearby devices (not yet paired)
            nearbyDevices.forEach(d => {
                if (!allDevicesMap.has(d.address)) {
                    allDevicesMap.set(d.address, {
                        id: d.address,
                        name: d.name || 'Unknown Device',
                        type: 'bluetooth',
                        connected: false,
                        paired: false,
                        favourite: false,
                        rssi: d.rssi // Signal strength
                    });
                }
            });

            const devices = Array.from(allDevicesMap.values());
            console.log(`[OS-BLUETOOTH] Found ${devices.length} total devices (${pairedDevices.length} paired, ${nearbyDevices.length} nearby)`);

            return { success: true, devices };
        } catch (error) {
            console.error('[OS-BLUETOOTH] Mac scan error:', error);
            // Fallback to just paired devices if inquiry fails
            try {
                const { stdout } = await execAsync('blueutil --paired --format json');
                const devices = JSON.parse(stdout || '[]').map(d => ({
                    id: d.address,
                    name: d.name || 'Unknown Device',
                    type: 'bluetooth',
                    connected: d.connected === true,
                    paired: true
                }));
                console.log(`[OS-BLUETOOTH] Fallback: ${devices.length} paired devices`);
                return { success: true, devices };
            } catch (fallbackError) {
                return { success: false, message: error.message, devices: [] };
            }
        }
    }

    /**
     * Windows: Scan using PowerShell
     */
    async scanWindows() {
        try {
            const script = `
                Get-PnpDevice -Class Bluetooth | 
                Where-Object {$_.Status -eq "OK"} | 
                Select-Object FriendlyName, InstanceId, Status | 
                ConvertTo-Json
            `;

            const { stdout } = await execAsync(`powershell -Command "${script}"`);
            const devices = JSON.parse(stdout);

            return {
                success: true,
                devices: Array.isArray(devices) ? devices.map(d => ({
                    id: d.InstanceId,
                    name: d.FriendlyName,
                    type: 'bluetooth',
                    connected: d.Status === 'OK',
                    paired: true
                })) : []
            };
        } catch (error) {
            console.error('[OS-BLUETOOTH] Windows scan error:', error);
            return { success: false, message: error.message, devices: [] };
        }
    }

    /**
     * Linux: Scan using bluetoothctl
     */
    async scanLinux() {
        try {
            const { stdout } = await execAsync('bluetoothctl devices');
            const devices = stdout.split('\n')
                .filter(line => line.startsWith('Device'))
                .map(line => {
                    const match = line.match(/Device\s+([A-F0-9:]+)\s+(.+)/);
                    if (match) {
                        return {
                            id: match[1],
                            name: match[2],
                            type: 'bluetooth',
                            connected: false,
                            paired: true
                        };
                    }
                    return null;
                })
                .filter(Boolean);

            return { success: true, devices };
        } catch (error) {
            console.error('[OS-BLUETOOTH] Linux scan error:', error);
            return { success: false, message: error.message, devices: [] };
        }
    }

    /**
     * Connect to a Bluetooth device
     */
    async connectDevice(deviceId, deviceName) {
        try {
            console.log(`[OS-BLUETOOTH] Connecting to ${deviceName} (${deviceId})...`);

            if (this.platform === 'darwin') {
                return await this.connectMac(deviceId, deviceName);
            } else if (this.platform === 'win32') {
                return await this.connectWindows(deviceId, deviceName);
            } else if (this.platform === 'linux') {
                return await this.connectLinux(deviceId, deviceName);
            }

            return { success: false, message: 'Unsupported platform' };
        } catch (error) {
            console.error('[OS-BLUETOOTH] Connect error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * macOS: Connect using blueutil
     */
    async connectMac(deviceId, deviceName) {
        try {
            console.log(`[OS-BLUETOOTH] Running: blueutil --connect ${deviceId}`);

            try {
                await execAsync(`blueutil --connect ${deviceId}`);
            } catch (connectError) {
                // Check if already connected
                try {
                    const { stdout } = await execAsync(`blueutil --is-connected ${deviceId}`);
                    if (stdout.trim() === '1') {
                        this.connectedDevices.set(deviceId, deviceName);
                        return {
                            success: true,
                            connected: true,
                            message: `Already connected`
                        };
                    }
                } catch (e) { }

                // Return friendly error
                return {
                    success: false,
                    connected: false,
                    message: `Unable to connect`,
                    suggestion: 'Make sure device is in pairing mode'
                };
            }

            // Wait for connection
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verify
            const { stdout } = await execAsync(`blueutil --is-connected ${deviceId}`);
            const isConnected = stdout.trim() === '1';

            if (isConnected) {
                this.connectedDevices.set(deviceId, deviceName);
                return {
                    success: true,
                    connected: true,
                    message: `Connected successfully`
                };
            } else {
                return {
                    success: false,
                    connected: false,
                    message: `Connection timeout`,
                    suggestion: 'Device didn\'t respond'
                };
            }
        } catch (error) {
            return {
                success: false,
                connected: false,
                message: 'Connection failed',
                suggestion: 'Please try again'
            };
        }
    }

    /**
     * Linux: Connect using bluetoothctl
     */
    async connectLinux(deviceId, deviceName) {
        try {
            await execAsync(`bluetoothctl connect ${deviceId}`);
            this.connectedDevices.set(deviceId, deviceName);
            return {
                success: true,
                connected: true,
                message: `Connected to ${deviceName}`
            };
        } catch (error) {
            console.error('[OS-BLUETOOTH] Linux connect error:', error);
            return { success: false, connected: false, message: error.message };
        }
    }

    /**
     * Disconnect from device
     */
    async disconnectDevice(deviceId) {
        try {
            if (this.platform === 'darwin') {
                await execAsync(`blueutil --disconnect ${deviceId}`);
            } else if (this.platform === 'linux') {
                await execAsync(`bluetoothctl disconnect ${deviceId}`);
            }

            this.connectedDevices.delete(deviceId);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

export default new OSBluetoothController();
