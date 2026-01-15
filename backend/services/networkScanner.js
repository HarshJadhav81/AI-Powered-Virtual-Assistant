/**
 * Network Scanner Service
 * Automatically discovers devices on the local network
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

class NetworkScanner {
    /**
     * Get local IP address and subnet
     */
    getLocalNetwork() {
        const interfaces = os.networkInterfaces();

        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                // Skip internal and non-IPv4 addresses
                if (iface.family === 'IPv4' && !iface.internal) {
                    return {
                        ip: iface.address,
                        netmask: iface.netmask,
                        subnet: this.getSubnet(iface.address, iface.netmask)
                    };
                }
            }
        }

        return null;
    }

    /**
     * Calculate subnet from IP and netmask
     */
    getSubnet(ip, netmask) {
        const ipParts = ip.split('.').map(Number);
        const maskParts = netmask.split('.').map(Number);

        const subnetParts = ipParts.map((part, i) => part & maskParts[i]);
        return subnetParts.join('.');
    }

    /**
     * Scan for Android TV devices on network
     * Looks for devices with ADB port (5555) open
     */
    async scanForAndroidTVs() {
        try {
            console.log('[NETWORK-SCAN] Scanning for Android TVs...');

            const network = this.getLocalNetwork();
            if (!network) {
                console.error('[NETWORK-SCAN] Could not determine local network');
                return [];
            }

            console.log(`[NETWORK-SCAN] Local network: ${network.subnet}/24`);

            // Try different scanning methods based on OS
            const platform = os.platform();
            let devices = [];

            if (platform === 'darwin' || platform === 'linux') {
                // Use nmap if available
                devices = await this.scanWithNmap(network.subnet);

                if (devices.length === 0) {
                    // Fallback to ping sweep
                    devices = await this.scanWithPingSweep(network.subnet);
                }
            } else if (platform === 'win32') {
                // Windows: use arp scan
                devices = await this.scanWithArp(network.subnet);
            }

            console.log(`[NETWORK-SCAN] Found ${devices.length} Android TV devices`);
            return devices;
        } catch (error) {
            console.error('[NETWORK-SCAN] Error:', error);
            return [];
        }
    }

    /**
     * Scan using nmap (if installed)
     */
    async scanWithNmap(subnet) {
        try {
            // Check if nmap is installed
            await execAsync('which nmap');

            console.log('[NETWORK-SCAN] Using nmap for scanning...');

            // Scan for devices with port 5555 open (ADB)
            const { stdout } = await execAsync(
                `nmap -p 5555 --open ${subnet}/24 -oG - | grep "5555/open"`,
                { timeout: 30000 }
            );

            const devices = [];
            const lines = stdout.split('\n');

            for (const line of lines) {
                const match = line.match(/Host: ([\d.]+)/);
                if (match) {
                    const ip = match[1];
                    devices.push({
                        id: ip,
                        name: `Android TV (${ip})`,
                        type: 'android-tv',
                        ip: ip,
                        connected: false,
                        paired: false,
                        discovered: true
                    });
                }
            }

            return devices;
        } catch (error) {
            console.log('[NETWORK-SCAN] nmap not available, trying alternative method');
            return [];
        }
    }

    /**
     * Scan using ping sweep and port check
     */
    async scanWithPingSweep(subnet) {
        try {
            console.log('[NETWORK-SCAN] Using ping sweep...');

            const devices = [];
            const baseIp = subnet;
            const promises = [];

            // Scan common IP range (usually 192.168.x.1-254)
            for (let i = 1; i < 255; i++) {
                const ip = `${baseIp.substring(0, baseIp.lastIndexOf('.'))}.${i}`;
                promises.push(this.checkAdbPort(ip));
            }

            const results = await Promise.allSettled(promises);

            for (const result of results) {
                if (result.status === 'fulfilled' && result.value) {
                    devices.push(result.value);
                }
            }

            return devices;
        } catch (error) {
            console.error('[NETWORK-SCAN] Ping sweep error:', error);
            return [];
        }
    }

    /**
     * Check if ADB port is open on an IP
     */
    async checkAdbPort(ip) {
        const net = await import('net');

        return new Promise((resolve) => {
            const socket = new net.Socket();
            const timeout = 500; // 500ms timeout

            socket.setTimeout(timeout);

            socket.on('connect', () => {
                socket.destroy();
                resolve({
                    id: ip,
                    name: `Android TV (${ip})`,
                    type: 'android-tv',
                    ip: ip,
                    connected: false,
                    paired: false,
                    discovered: true
                });
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve(null);
            });

            socket.on('error', () => {
                socket.destroy();
                resolve(null);
            });

            socket.connect(5555, ip);
        });
    }

    /**
     * Scan using ARP table (Windows)
     */
    async scanWithArp(subnet) {
        try {
            console.log('[NETWORK-SCAN] Using ARP scan...');

            const { stdout } = await execAsync('arp -a');
            const devices = [];
            const lines = stdout.split('\n');

            const promises = [];

            for (const line of lines) {
                const match = line.match(/([\d.]+)/);
                if (match) {
                    const ip = match[1];
                    if (ip.startsWith(subnet.substring(0, subnet.lastIndexOf('.')))) {
                        promises.push(this.checkAdbPort(ip));
                    }
                }
            }

            const results = await Promise.allSettled(promises);

            for (const result of results) {
                if (result.status === 'fulfilled' && result.value) {
                    devices.push(result.value);
                }
            }

            return devices;
        } catch (error) {
            console.error('[NETWORK-SCAN] ARP scan error:', error);
            return [];
        }
    }

    /**
     * Scan for Chromecast devices using mDNS
     */
    async scanForChromecasts() {
        // This would use mDNS/Bonjour to discover Chromecasts
        // For now, Chromecast discovery is handled by the browser's Cast SDK
        console.log('[NETWORK-SCAN] Chromecast discovery handled by browser');
        return [];
    }

    /**
     * Scan for smart home devices using UPnP
     */
    async scanForSmartHome() {
        try {
            console.log('[NETWORK-SCAN] Scanning for smart home devices...');

            // UPnP/SSDP discovery would go here
            // This is a placeholder for future implementation

            return [];
        } catch (error) {
            console.error('[NETWORK-SCAN] Smart home scan error:', error);
            return [];
        }
    }
}

export default new NetworkScanner();
