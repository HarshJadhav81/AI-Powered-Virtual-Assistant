/**
 * Device Control Routes
 * [COPILOT-UPGRADE]: API endpoints for device management
 */

import express from 'express';
import deviceManager from '../services/deviceManager.js';

const router = express.Router();

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
