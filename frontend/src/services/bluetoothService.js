/**
 * Bluetooth Service
 * Handles Bluetooth device discovery and connection using Web Bluetooth API
 */

class BluetoothService {
  constructor() {
    this.connectedDevices = new Map();
    this.isSupported = 'bluetooth' in navigator;
  }

  /**
   * Check if Web Bluetooth is supported
   */
  checkSupport() {
    if (!this.isSupported) {
      return {
        success: false,
        message: 'Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.',
        supported: false
      };
    }

    return {
      success: true,
      message: 'Web Bluetooth is supported',
      supported: true
    };
  }

  /**
   * Scan for nearby Bluetooth devices
   */
  async scanDevices(filters = {}) {
    try {
      if (!this.isSupported) {
        return this.checkSupport();
      }

      // Request device with optional filters
      const options = {
        acceptAllDevices: !filters.services,
        optionalServices: filters.services || []
      };

      if (filters.services) {
        options.filters = [{ services: filters.services }];
        delete options.acceptAllDevices;
      }

      if (filters.name) {
        options.filters = [{ name: filters.name }];
        delete options.acceptAllDevices;
      }

      if (filters.namePrefix) {
        options.filters = [{ namePrefix: filters.namePrefix }];
        delete options.acceptAllDevices;
      }

      const device = await navigator.bluetooth.requestDevice(options);

      return {
        success: true,
        message: `Found device: ${device.name || 'Unknown Device'}`,
        device: {
          id: device.id,
          name: device.name || 'Unknown Device',
          connected: device.gatt?.connected || false
        }
      };
    } catch (error) {
      console.error('[BLUETOOTH-ERROR] Scan failed:', error);
      
      if (error.name === 'NotFoundError') {
        return {
          success: false,
          message: 'No Bluetooth device selected',
          error: 'User cancelled device selection'
        };
      }

      return {
        success: false,
        message: 'Failed to scan for Bluetooth devices',
        error: error.message
      };
    }
  }

  /**
   * Connect to a Bluetooth device
   */
  async connectDevice(device) {
    try {
      if (!device || !device.gatt) {
        return {
          success: false,
          message: 'Invalid device provided'
        };
      }

      console.log('[BLUETOOTH] Connecting to device:', device.name);
      const server = await device.gatt.connect();

      this.connectedDevices.set(device.id, {
        device,
        server,
        name: device.name,
        connected: true
      });

      // Listen for disconnection
      device.addEventListener('gattserverdisconnected', () => {
        this.handleDisconnection(device.id);
      });

      return {
        success: true,
        message: `Connected to ${device.name || 'device'}`,
        deviceId: device.id,
        deviceName: device.name
      };
    } catch (error) {
      console.error('[BLUETOOTH-ERROR] Connection failed:', error);
      return {
        success: false,
        message: `Failed to connect to device`,
        error: error.message
      };
    }
  }

  /**
   * Disconnect from a Bluetooth device
   */
  async disconnectDevice(deviceId) {
    try {
      const deviceInfo = this.connectedDevices.get(deviceId);
      
      if (!deviceInfo) {
        return {
          success: false,
          message: 'Device not found'
        };
      }

      if (deviceInfo.device.gatt.connected) {
        deviceInfo.device.gatt.disconnect();
      }

      this.connectedDevices.delete(deviceId);

      return {
        success: true,
        message: `Disconnected from ${deviceInfo.name || 'device'}`
      };
    } catch (error) {
      console.error('[BLUETOOTH-ERROR] Disconnection failed:', error);
      return {
        success: false,
        message: 'Failed to disconnect from device',
        error: error.message
      };
    }
  }

  /**
   * Handle device disconnection
   */
  handleDisconnection(deviceId) {
    const deviceInfo = this.connectedDevices.get(deviceId);
    if (deviceInfo) {
      console.log('[BLUETOOTH] Device disconnected:', deviceInfo.name);
      this.connectedDevices.delete(deviceId);
    }
  }

  /**
   * Get list of connected devices
   */
  getConnectedDevices() {
    const devices = Array.from(this.connectedDevices.values()).map(info => ({
      id: info.device.id,
      name: info.name,
      connected: info.connected
    }));

    return {
      success: true,
      message: `${devices.length} device${devices.length !== 1 ? 's' : ''} connected`,
      devices: devices,
      count: devices.length
    };
  }

  /**
   * Read characteristic from a device
   */
  async readCharacteristic(deviceId, serviceUuid, characteristicUuid) {
    try {
      const deviceInfo = this.connectedDevices.get(deviceId);
      
      if (!deviceInfo || !deviceInfo.server) {
        return {
          success: false,
          message: 'Device not connected'
        };
      }

      const service = await deviceInfo.server.getPrimaryService(serviceUuid);
      const characteristic = await service.getCharacteristic(characteristicUuid);
      const value = await characteristic.readValue();

      return {
        success: true,
        message: 'Characteristic read successfully',
        value: value
      };
    } catch (error) {
      console.error('[BLUETOOTH-ERROR] Read failed:', error);
      return {
        success: false,
        message: 'Failed to read characteristic',
        error: error.message
      };
    }
  }

  /**
   * Write characteristic to a device
   */
  async writeCharacteristic(deviceId, serviceUuid, characteristicUuid, value) {
    try {
      const deviceInfo = this.connectedDevices.get(deviceId);
      
      if (!deviceInfo || !deviceInfo.server) {
        return {
          success: false,
          message: 'Device not connected'
        };
      }

      const service = await deviceInfo.server.getPrimaryService(serviceUuid);
      const characteristic = await service.getCharacteristic(characteristicUuid);
      await characteristic.writeValue(value);

      return {
        success: true,
        message: 'Characteristic written successfully'
      };
    } catch (error) {
      console.error('[BLUETOOTH-ERROR] Write failed:', error);
      return {
        success: false,
        message: 'Failed to write characteristic',
        error: error.message
      };
    }
  }

  /**
   * Scan for specific device types
   */
  async scanForDeviceType(type) {
    const deviceFilters = {
      'heart-rate': { services: ['heart_rate'] },
      'battery': { services: ['battery_service'] },
      'fitness': { services: ['heart_rate', 'cycling_power'] },
      'audio': { services: ['audio_source'] },
      'keyboard': { namePrefix: 'Keyboard' },
      'mouse': { namePrefix: 'Mouse' },
      'headphones': { namePrefix: 'Headphones' }
    };

    const filter = deviceFilters[type] || {};
    return this.scanDevices(filter);
  }

  /**
   * Disconnect all devices
   */
  async disconnectAll() {
    try {
      const deviceIds = Array.from(this.connectedDevices.keys());
      
      for (const deviceId of deviceIds) {
        await this.disconnectDevice(deviceId);
      }

      return {
        success: true,
        message: 'All devices disconnected',
        count: deviceIds.length
      };
    } catch (error) {
      console.error('[BLUETOOTH-ERROR] Failed to disconnect all:', error);
      return {
        success: false,
        message: 'Failed to disconnect all devices',
        error: error.message
      };
    }
  }

  /**
   * Get available device types for scanning
   */
  getDeviceTypes() {
    return {
      success: true,
      types: [
        { id: 'heart-rate', name: 'Heart Rate Monitor', description: 'Fitness trackers, smartwatches' },
        { id: 'battery', name: 'Battery Service', description: 'Devices with battery info' },
        { id: 'fitness', name: 'Fitness Devices', description: 'Heart rate, cycling power' },
        { id: 'audio', name: 'Audio Devices', description: 'Speakers, headphones' },
        { id: 'keyboard', name: 'Keyboards', description: 'Bluetooth keyboards' },
        { id: 'mouse', name: 'Mice', description: 'Bluetooth mice' },
        { id: 'headphones', name: 'Headphones', description: 'Bluetooth headphones' }
      ]
    };
  }
}

const bluetoothService = new BluetoothService();
export default bluetoothService;
