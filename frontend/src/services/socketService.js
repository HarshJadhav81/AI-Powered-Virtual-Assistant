/**
 * Socket Service for Real-time Communication
 * [COPILOT-UPGRADE]: Real-time bidirectional communication with backend
 */

import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.serverUrl = import.meta.env.MODE === "development"
      ? "http://localhost:8000"
      : "https://orvion.onrender.com";
  }

  /**
   * Connect to Socket.io server
   */
  connect() {
    if (this.socket?.connected) {
      console.info('[COPILOT-UPGRADE]', 'Socket already connected');
      return;
    }

    console.info('[COPILOT-UPGRADE]', `Connecting to ${this.serverUrl}`);

    this.socket = io(this.serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.info('[COPILOT-UPGRADE]', 'Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.info('[COPILOT-UPGRADE]', 'Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SOCKET-ERROR]:', error);
    });

    return this.socket;
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
      console.info('[COPILOT-UPGRADE]', 'Socket disconnected manually');
    }
  }

  /**
   * Send user command to backend
   */
  sendCommand(command, userId, assistantName, userName) {
    if (!this.socket || !this.connected) {
      console.error('[SOCKET-ERROR]: Not connected to server');
      return Promise.reject(new Error('Socket not connected'));
    }

    console.info('[COPILOT-UPGRADE]', 'Sending command:', command);

    return new Promise((resolve, reject) => {
      // Set timeout for response
      const timeout = setTimeout(() => {
        reject(new Error('Command timeout'));
      }, 30000); // 30 seconds

      // Send command
      this.socket.emit('userCommand', {
        command,
        userId,
        assistantName,
        userName
      });

      // Listen for response
      this.socket.once('aiResponse', (response) => {
        clearTimeout(timeout);
        console.info('[COPILOT-UPGRADE]', 'AI response received:', response);
        resolve(response);
      });

      // Listen for errors
      this.socket.once('error', (error) => {
        clearTimeout(timeout);
        console.error('[SOCKET-ERROR]:', error);
        reject(error);
      });
    });
  }

  /**
   * Send device control command
   */
  sendDeviceControl(deviceCommand) {
    if (!this.socket || !this.connected) {
      console.error('[SOCKET-ERROR]: Not connected to server');
      return Promise.reject(new Error('Socket not connected'));
    }

    console.info('[COPILOT-UPGRADE]', 'Sending device command:', deviceCommand);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Device command timeout'));
      }, 15000);

      this.socket.emit('deviceControl', deviceCommand);

      this.socket.once('deviceResponse', (response) => {
        clearTimeout(timeout);
        console.info('[COPILOT-UPGRADE]', 'Device response:', response);
        resolve(response);
      });

      this.socket.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Listen for custom events
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Check connection status
   */
  isConnected() {
    return this.connected && this.socket?.connected;
  }

  /**
   * Get the socket instance
   */
  getSocket() {
    return this.socket;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
