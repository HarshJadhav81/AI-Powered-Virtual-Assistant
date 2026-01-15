/**
 * Chromecast Scanner Service - Using mdns-js for reliable discovery
 * Discovers real Chromecast/Google Cast devices on the network using mDNS
 */

import mdns from 'mdns-js';

class ChromecastScanner {
    constructor() {
        this.discoveredDevices = new Map();
        this.scanning = false;
        this.browser = null;
    }

    /**
     * Scan for Chromecast devices on the network using mDNS
     */
    async scanForDevices(scanDuration = 10000) {
        try {
            console.log('[CHROMECAST] Starting mDNS scan for Google Cast devices...');

            this.discoveredDevices.clear();
            this.scanning = true;

            return new Promise((resolve) => {
                const devices = [];

                // Create mDNS browser for Google Cast service
                this.browser = mdns.createBrowser(mdns.tcp('googlecast'));

                // Listen for device discoveries
                this.browser.on('ready', () => {
                    console.log('[CHROMECAST] mDNS browser ready, scanning network...');
                    this.browser.discover();
                });

                this.browser.on('update', (data) => {
                    try {
                        // Extract device information
                        const service = data;
                        const addresses = service.addresses || [];
                        const ip = addresses.find(addr => addr.includes('.')) || addresses[0];

                        if (!ip) {
                            console.log('[CHROMECAST] Device found but no IP address:', service);
                            return;
                        }

                        // Extract friendly name from TXT records
                        let friendlyName = 'Unknown Chromecast';
                        let model = 'Chromecast';
                        let manufacturer = 'Google';

                        if (service.txt && Array.isArray(service.txt)) {
                            service.txt.forEach(record => {
                                if (typeof record === 'string') {
                                    const [key, value] = record.split('=');
                                    if (key === 'fn') friendlyName = value;
                                    if (key === 'md') model = value;
                                    if (key === 'ca') manufacturer = 'Google';
                                }
                            });
                        }

                        const deviceId = ip;

                        console.log(`[CHROMECAST] Found device: ${friendlyName} at ${ip} (${model})`);

                        const deviceInfo = {
                            id: deviceId,
                            name: friendlyName,
                            type: 'chromecast',
                            ip: ip,
                            port: service.port || 8009,
                            model: model,
                            manufacturer: manufacturer,
                            connected: false,
                            paired: false,
                            discovered: true
                        };

                        // Avoid duplicates
                        if (!this.discoveredDevices.has(deviceId)) {
                            this.discoveredDevices.set(deviceId, deviceInfo);
                            devices.push(deviceInfo);
                            console.log(`[CHROMECAST] Added ${friendlyName} to list (Total: ${devices.length})`);
                        }
                    } catch (error) {
                        console.error('[CHROMECAST] Error processing device:', error);
                    }
                });

                this.browser.on('error', (error) => {
                    console.error('[CHROMECAST] mDNS error:', error.message);
                });

                // Set timeout to stop scanning
                setTimeout(() => {
                    if (this.browser) {
                        this.browser.stop();
                        this.browser = null;
                    }
                    this.scanning = false;
                    console.log(`[CHROMECAST] Scan complete. Found ${devices.length} devices`);
                    resolve(devices);
                }, scanDuration);
            });
        } catch (error) {
            this.scanning = false;
            console.error('[CHROMECAST] Scan error:', error);
            return [];
        }
    }

    /**
     * Get a specific device by ID
     */
    getDevice(deviceId) {
        return this.discoveredDevices.get(deviceId);
    }

    /**
     * Get all discovered devices
     */
    getAllDevices() {
        return Array.from(this.discoveredDevices.values());
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.browser) {
            this.browser.stop();
            this.browser = null;
        }
        this.discoveredDevices.clear();
        this.scanning = false;
    }
}

export default new ChromecastScanner();
