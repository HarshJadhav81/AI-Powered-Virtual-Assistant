/**
 * Device Control Routes
 * [COPILOT-UPGRADE]: API endpoints for device management
 */

import express from 'express';
import deviceManager from '../services/deviceManager.js';
import networkScanner from '../services/networkScanner.js';
import osBluetoothController from '../services/osBluetoothController.js';
import chromecastScanner from '../services/chromecastScanner.js';

const router = express.Router();

/**
 * @route   POST /api/device/scan/:type
 * @desc    Scan for devices of a specific type
 * @access  Private
 */
router.post('/scan/:type', async (req, res) => {
  try {
    const { type } = req.params;
    console.log(`[DEVICE-API] Scanning for ${type} devices`);

    let devices = [];

    switch (type) {
      case 'bluetooth':
        // OS-LEVEL Bluetooth scanning (actually works!)
        console.log('[DEVICE-API] Scanning system Bluetooth devices...');
        const btResult = await osBluetoothController.scanDevices();
        devices = btResult.devices || [];
        console.log(`[DEVICE-API] Found ${devices.length} Bluetooth devices via OS`);
        break;


      case 'android-tv':
        // AUTOMATIC network scanning for Android TVs - no IP configuration needed!
        console.log('[DEVICE-API] Starting automatic Android TV discovery...');
        devices = await networkScanner.scanForAndroidTVs();

        // Optional: Also check if there's a manually configured TV in .env (fallback)
        const tvIp = process.env.ANDROID_TV_IP;
        if (tvIp && !devices.find(d => d.ip === tvIp)) {
          try {
            const deviceInfo = await deviceManager.getDeviceInfo('android-tv', tvIp);
            devices.push({
              id: tvIp,
              name: deviceInfo.model || 'Android TV (Configured)',
              type: 'android-tv',
              ip: tvIp,
              connected: false,
              paired: false,
              configured: true
            });
          } catch (error) {
            console.log('[DEVICE-API] Configured TV not responding');
          }
        }

        console.log(`[DEVICE-API] Found ${devices.length} Android TVs on network`);
        break;

      case 'chromecast':
        // REAL Chromecast scanning using mDNS
        console.log('[DEVICE-API] Starting Chromecast mDNS discovery...');
        devices = await chromecastScanner.scanForDevices(10000); // 10 second scan
        console.log(`[DEVICE-API] Found ${devices.length} Chromecast devices via mDNS`);
        break;

      case 'mobile':
        // Mobile devices would need a separate discovery mechanism
        // For now, return empty array
        devices = [];
        break;

      case 'smart-home':
        // Smart home devices would use UPnP or similar
        // For now, return empty array
        devices = [];
        break;

      default:
        return res.status(400).json({
          success: false,
          message: `Unknown device type: ${type}`
        });
    }

    res.json({
      success: true,
      devices,
      count: devices.length
    });
  } catch (error) {
    console.error('[DEVICE-API] Scan error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   POST /api/device/pair
 * @desc    Pair with a device
 * @access  Private
 */
router.post('/pair', async (req, res) => {
  try {
    const { deviceId, deviceType, pairingCode } = req.body;
    console.log(`[DEVICE-API] Pairing with ${deviceType} device: ${deviceId}`);

    let result = { success: false };

    switch (deviceType) {
      case 'bluetooth':
        // OS-LEVEL Bluetooth pairing (actually works!)
        console.log('[DEVICE-API] Connecting Bluetooth device via OS...');
        const deviceName = req.body.deviceName || 'Device';
        const btConnectResult = await osBluetoothController.connectDevice(deviceId, deviceName);

        if (btConnectResult.success) {
          result = {
            success: true,
            message: `Connected to ${deviceName} at OS level`,
            deviceName: deviceName,
            osLevel: true
          };
        } else {
          result = {
            success: false,
            message: btConnectResult.message || 'Failed to connect'
          };
        }
        break;

      case 'android-tv':
        // Connect to Android TV via ADB
        try {
          const connectionResult = await deviceManager.connectToAndroidTV(deviceId);
          if (connectionResult.success) {
            result = {
              success: true,
              message: 'Connected to Android TV',
              deviceName: connectionResult.device?.model || 'Android TV'
            };
          } else {
            result = {
              success: false,
              message: connectionResult.message || 'Failed to connect'
            };
          }
        } catch (error) {
          result = {
            success: false,
            message: error.message
          };
        }
        break;

      case 'mobile':
      case 'smart-home':
        result = {
          success: false,
          message: `Pairing for ${deviceType} not yet implemented`
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: `Unknown device type: ${deviceType}`
        });
    }

    res.json(result);
  } catch (error) {
    console.error('[DEVICE-API] Pair error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   POST /api/device/scan
 * @desc    Scan for devices on the network
 * @access  Private
 */
router.post('/scan', async (req, res) => {
  try {
    console.info('[COPILOT-UPGRADE]', 'Scanning for devices...');

    const devices = await deviceManager.discoverDevices();

    res.status(200).json({
      success: true,
      devices,
      count: devices.length,
      message: `Found ${devices.length} devices`
    });
  } catch (error) {
    console.error('[DEVICE-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/device/connect
 * @desc    Connect to a specific device
 * @access  Private
 */
router.post('/connect', async (req, res) => {
  try {
    const { deviceType, deviceIp } = req.body;

    if (!deviceType || !deviceIp) {
      return res.status(400).json({
        success: false,
        error: 'Device type and IP address are required'
      });
    }

    console.info('[COPILOT-UPGRADE]', `Connecting to ${deviceType} at ${deviceIp}`);

    let result;
    switch (deviceType) {
      case 'android-tv':
        result = await deviceManager.connectToAndroidTV(deviceIp);
        break;
      case 'chromecast':
        result = await deviceManager.connectToChromecast(deviceIp);
        break;
      case 'projector':
        result = await deviceManager.connectToProjector(deviceIp);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported device type'
        });
    }

    res.status(200).json({
      success: true,
      device: result,
      message: `Connected to ${deviceType}`
    });
  } catch (error) {
    console.error('[DEVICE-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/device/control
 * @desc    Control a connected device
 * @access  Private
 */
router.post('/control', async (req, res) => {
  try {
    const { deviceId, action, params } = req.body;

    if (!deviceId || !action) {
      return res.status(400).json({
        success: false,
        error: 'Device ID and action are required'
      });
    }

    console.info('[COPILOT-UPGRADE]', `Controlling device ${deviceId}: ${action}`);

    let result;
    switch (action) {
      case 'launch-app':
        result = await deviceManager.openAppOnDevice(deviceId, params.appName);
        break;
      case 'power-on':
        result = await deviceManager.powerOnDevice(deviceId);
        break;
      case 'power-off':
        result = await deviceManager.powerOffDevice(deviceId);
        break;
      case 'volume-up':
        result = await deviceManager.controlVolume(deviceId, 'up');
        break;
      case 'volume-down':
        result = await deviceManager.controlVolume(deviceId, 'down');
        break;
      case 'volume-set':
        result = await deviceManager.controlVolume(deviceId, 'set', params.level);
        break;
      case 'mute':
        result = await deviceManager.controlVolume(deviceId, 'mute');
        break;
      case 'cast':
        result = await deviceManager.castMedia(deviceId, params.mediaUrl);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported action'
        });
    }

    res.status(200).json({
      success: true,
      result,
      message: `Action ${action} executed successfully`
    });
  } catch (error) {
    console.error('[DEVICE-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/device/list
 * @desc    Get list of connected devices
 * @access  Private
 */
router.get('/list', async (req, res) => {
  try {
    const devices = deviceManager.getConnectedDevices();

    res.status(200).json({
      success: true,
      devices,
      count: devices.length
    });
  } catch (error) {
    console.error('[DEVICE-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/device/disconnect
 * @desc    Disconnect from a device
 * @access  Private
 */
router.post('/disconnect', async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Device ID is required'
      });
    }

    console.info('[COPILOT-UPGRADE]', `Disconnecting device ${deviceId}`);

    const result = await deviceManager.disconnectDevice(deviceId);

    res.status(200).json({
      success: true,
      message: 'Device disconnected successfully'
    });
  } catch (error) {
    console.error('[DEVICE-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
