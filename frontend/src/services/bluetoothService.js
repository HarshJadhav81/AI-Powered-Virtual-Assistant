/**
 * Enhanced Bluetooth Service with Robust Connection Handling
 * Properly waits for connection and verifies status before reporting success
 */

class BluetoothService {
  constructor() {
    this.device = null;
    this.server = null;
    this.characteristics = new Map();
    this.connectedDevices = new Set();
    this.lastScannedDevices = [];
  }

  /**
   * Check if Web Bluetooth is supported
   */
  isSupported() {
    if (!navigator.bluetooth) {
      console.error('[BLUETOOTH] Web Bluetooth API is not supported in this browser');
      return false;
    }
    return true;
  }

  /**
   * Scan for Bluetooth devices
   * This MUST be called from a user gesture (button click)
   */
  async scanDevices() {
    if (!this.isSupported()) {
      return {
        success: false,
        message: 'Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.'
      };
    }

    try {
      console.log('[BLUETOOTH] 📱 Opening device picker...');

      // Request device - browser shows picker
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information', 'generic_access']
      });

      console.log('[BLUETOOTH] 🎯 Device selected:', this.device.name);
      console.log('[BLUETOOTH] 📋 Device details:', {
        id: this.device.id,
        name: this.device.name,
        gatt: this.device.gatt ? 'Available' : 'Not Available'
      });

      // IMPORTANT: Try to connect and WAIT for actual connection
      console.log('[BLUETOOTH] ⏳ Attempting connection...');
      const connectResult = await this.connectToDevice(this.device);

      console.log('[BLUETOOTH] 📊 Connection result:', {
        success: connectResult.success,
        connected: connectResult.connected,
        message: connectResult.message,
        error: connectResult.error
      });

      // Verify connection is ACTUALLY active
      const isConnected = this.device.gatt && this.device.gatt.connected === true;
      console.log('[BLUETOOTH] 🔍 Verification - GATT connected:', isConnected);

      // Return success with VERIFIED connection status
      return {
        success: true,
        device: {
          id: this.device.id,
          name: this.device.name || 'Unknown Device',
          connected: isConnected && connectResult.success, // Both must be true
          connectionError: connectResult.success ? null : connectResult.message
        },
        connectionAttempted: true,
        connectionSucceeded: isConnected && connectResult.success,
        message: (isConnected && connectResult.success)
          ? `✅ Successfully connected to ${this.device.name}`
          : `⚠️ Selected ${this.device.name} but connection failed: ${connectResult.message}`
      };
    } catch (error) {
      console.error('[BLUETOOTH] ❌ Scan error:', error);

      if (error.name === 'NotFoundError') {
        return {
          success: false,
          message: 'No device selected. Please try again.'
        };
      }

      return {
        success: false,
        message: error.message || 'Failed to scan for devices'
      };
    }
  }

  /**
   * Connect to a Bluetooth device with proper error handling
   */
  async connectToDevice(device) {
    let connectionAttempted = false;

    try {
      console.log('[BLUETOOTH] 🔌 Starting connection to:', device.name);

      if (!device) {
        device = this.device;
      }

      if (!device) {
        throw new Error('No device available to connect');
      }

      if (!device.gatt) {
        throw new Error('Device does not support GATT');
      }

      // Check if already connected
      if (device.gatt.connected) {
        console.log('[BLUETOOTH] ✅ Device already connected!');
        this.connectedDevices.add(device);
        return {
          success: true,
          connected: true,
          deviceName: device.name,
          message: 'Already connected'
        };
      }

      // Attempt connection with timeout
      console.log('[BLUETOOTH] ⏳ Connecting to GATT server...');
      connectionAttempted = true;

      // Set a connection timeout
      const connectPromise = device.gatt.connect();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      );

      this.server = await Promise.race([connectPromise, timeoutPromise]);

      console.log('[BLUETOOTH] 🔗 GATT server object:', this.server);
      console.log('[BLUETOOTH] 🔍 GATT connected status:', device.gatt.connected);

      // Verify connection
      if (!device.gatt.connected) {
        throw new Error('GATT connection established but status is false');
      }

      console.log('[BLUETOOTH] ✅ Successfully connected to GATT server!');

      this.connectedDevices.add(device);

      // Listen for disconnection
      device.addEventListener('gattserverdisconnected', () => {
        console.warn('[BLUETOOTH] ⚠️ Device disconnected:', device.name);
        this.connectedDevices.delete(device);
      });

      // Wait a bit to ensure connection is stable
      await new Promise(resolve => setTimeout(resolve, 500));

      // Final verification
      const finalStatus = device.gatt.connected;
      console.log('[BLUETOOTH] 🎯 Final connection verification:', finalStatus);

      if (!finalStatus) {
        throw new Error('Connection lost immediately after establishment');
      }

      return {
        success: true,
        connected: true,
        deviceName: device.name,
        message: 'Successfully connected and verified'
      };
    } catch (error) {
      console.error('[BLUETOOTH] ❌ Connection failed:', {
        error: error.message,
        name: error.name,
        attempted: connectionAttempted,
        deviceName: device?.name
      });

      // Handle specific error types with user-friendly messages
      let userMessage = 'Connection failed';

      if (error.message.includes('timeout')) {
        userMessage = 'Connection timeout. Device may be out of range or turned off.';
      } else if (error.message.includes('Unsupported') || error.name === 'NotSupportedError') {
        userMessage = 'Device not supported by Web Bluetooth. Try pairing in system settings first.';
      } else if (error.message.includes('GATT') || error.name === 'NetworkError') {
        userMessage = 'GATT connection failed. Ensure device is in pairing mode and not connected elsewhere.';
      } else if (error.message.includes('lost immediately')) {
        userMessage = 'Device disconnected immediately. Try turning off Bluetooth on other devices first.';
      } else if (error.name === 'SecurityError') {
        userMessage = 'Permission denied. Please allow Bluetooth access.';
      }

      return {
        success: false,
        connected: false,
        message: userMessage,
        error: error.message,
        errorType: error.name
      };
    }
  }

  /**
   * Disconnect from device
   */
  async disconnectDevice(deviceId) {
    try {
      if (this.device && this.server) {
        await this.server.disconnect();
        this.connectedDevices.delete(this.device);
        console.log('[BLUETOOTH] Disconnected from device');
        return { success: true };
      }
      return { success: false, message: 'No device connected' };
    } catch (error) {
      console.error('[BLUETOOTH] Disconnect error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get connected devices
   */
  getConnectedDevices() {
    return Array.from(this.connectedDevices).map(device => ({
      id: device.id,
      name: device.name || 'Unknown Device',
      connected: device.gatt?.connected || false
    }));
  }

  /**
   * Check if a device is connected
   */
  isDeviceConnected(deviceId) {
    const device = Array.from(this.connectedDevices).find(d => d.id === deviceId);
    return device && device.gatt && device.gatt.connected;
  }

  /**
   * Get diagnostic info
   */
  getDiagnostics() {
    return {
      supported: this.isSupported(),
      currentDevice: this.device ? {
        id: this.device.id,
        name: this.device.name,
        gattConnected: this.device.gatt?.connected || false
      } : null,
      connectedDevices: this.getConnectedDevices(),
      serverConnected: this.server ? true : false
    };
  }
}

export default new BluetoothService();
