/**
 * Screen Service
 * Handles screenshot capture, screen recording, and screen sharing
 */

class ScreenService {
  constructor() {
    this.isRecording = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.stream = null;
  }

  /**
   * Check browser support for Screen Capture API
   */
  checkSupport() {
    const support = {
      screenshot: 'mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices,
      recording: 'MediaRecorder' in window,
      sharing: 'mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices
    };

    return {
      success: true,
      support: support,
      fullySupported: support.screenshot && support.recording && support.sharing
    };
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot() {
    try {
      const supportCheck = this.checkSupport();
      if (!supportCheck.support.screenshot) {
        return {
          success: false,
          message: 'Screen capture is not supported in this browser. Use Chrome, Edge, or Firefox.',
          support: supportCheck.support
        };
      }

      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' }
      });

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Wait for video to load
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });

      // Create canvas and capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());

      // Convert to blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png');
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `screenshot-${timestamp}.png`;

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();

      // Cleanup
      URL.revokeObjectURL(url);

      return {
        success: true,
        message: 'Screenshot captured successfully',
        filename: filename,
        blob: blob,
        size: blob.size
      };
    } catch (error) {
      console.error('[SCREEN-ERROR] Screenshot failed:', error);
      
      if (error.name === 'NotAllowedError') {
        return {
          success: false,
          message: 'Screen capture permission denied',
          error: 'User denied permission'
        };
      }

      return {
        success: false,
        message: 'Failed to capture screenshot',
        error: error.message
      };
    }
  }

  /**
   * Start screen recording
   */
  async startRecording(options = {}) {
    try {
      const supportCheck = this.checkSupport();
      if (!supportCheck.support.recording) {
        return {
          success: false,
          message: 'Screen recording is not supported in this browser',
          support: supportCheck.support
        };
      }

      if (this.isRecording) {
        return {
          success: false,
          message: 'Recording is already in progress'
        };
      }

      // Request screen capture with audio option
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          ...options.video
        },
        audio: options.includeAudio || false
      });

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: mimeType,
        videoBitsPerSecond: options.videoBitsPerSecond || 2500000
      });

      this.recordedChunks = [];

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      // Handle recording stop
      this.mediaRecorder.onstop = () => {
        this.handleRecordingStop();
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;

      return {
        success: true,
        message: 'Screen recording started',
        recording: true,
        mimeType: mimeType
      };
    } catch (error) {
      console.error('[SCREEN-ERROR] Recording start failed:', error);
      
      if (error.name === 'NotAllowedError') {
        return {
          success: false,
          message: 'Screen recording permission denied',
          error: 'User denied permission'
        };
      }

      return {
        success: false,
        message: 'Failed to start screen recording',
        error: error.message
      };
    }
  }

  /**
   * Stop screen recording
   */
  stopRecording() {
    try {
      if (!this.isRecording || !this.mediaRecorder) {
        return {
          success: false,
          message: 'No recording in progress'
        };
      }

      this.mediaRecorder.stop();
      this.isRecording = false;

      // Stop all tracks
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }

      return {
        success: true,
        message: 'Screen recording stopped',
        recording: false
      };
    } catch (error) {
      console.error('[SCREEN-ERROR] Recording stop failed:', error);
      return {
        success: false,
        message: 'Failed to stop recording',
        error: error.message
      };
    }
  }

  /**
   * Handle recording stop and save file
   */
  handleRecordingStop() {
    if (this.recordedChunks.length === 0) {
      console.warn('[SCREEN] No data recorded');
      return;
    }

    // Create blob from recorded chunks
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `recording-${timestamp}.webm`;

    // Trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    // Cleanup
    URL.revokeObjectURL(url);
    this.recordedChunks = [];
  }

  /**
   * Get recording status
   */
  getRecordingStatus() {
    return {
      success: true,
      isRecording: this.isRecording,
      duration: this.mediaRecorder?.state === 'recording' ? 'Recording...' : 'Not recording',
      state: this.mediaRecorder?.state || 'inactive'
    };
  }

  /**
   * Start screen sharing
   */
  async startScreenSharing(options = {}) {
    try {
      const supportCheck = this.checkSupport();
      if (!supportCheck.support.sharing) {
        return {
          success: false,
          message: 'Screen sharing is not supported in this browser',
          support: supportCheck.support
        };
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          ...options.video
        },
        audio: options.includeAudio || false
      });

      return {
        success: true,
        message: 'Screen sharing started',
        stream: stream,
        tracks: stream.getTracks().map(track => ({
          kind: track.kind,
          label: track.label,
          enabled: track.enabled
        }))
      };
    } catch (error) {
      console.error('[SCREEN-ERROR] Screen sharing failed:', error);
      
      if (error.name === 'NotAllowedError') {
        return {
          success: false,
          message: 'Screen sharing permission denied',
          error: 'User denied permission'
        };
      }

      return {
        success: false,
        message: 'Failed to start screen sharing',
        error: error.message
      };
    }
  }

  /**
   * Capture specific window/tab
   */
  async captureWindow(windowType = 'screen') {
    try {
      const constraints = {
        video: {
          mediaSource: windowType // 'screen', 'window', 'tab'
        }
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);

      return {
        success: true,
        message: `Capturing ${windowType}`,
        stream: stream,
        type: windowType
      };
    } catch (error) {
      console.error('[SCREEN-ERROR] Window capture failed:', error);
      return {
        success: false,
        message: `Failed to capture ${windowType}`,
        error: error.message
      };
    }
  }

  /**
   * Take screenshot of specific element (requires canvas)
   */
  async captureElement(element) {
    try {
      if (!element) {
        return {
          success: false,
          message: 'No element provided for capture'
        };
      }

      // Use html2canvas or similar library for element capture
      // For now, provide fallback message
      return {
        success: false,
        message: 'Element capture requires html2canvas library',
        note: 'Install html2canvas: npm install html2canvas'
      };
    } catch (error) {
      console.error('[SCREEN-ERROR] Element capture failed:', error);
      return {
        success: false,
        message: 'Failed to capture element',
        error: error.message
      };
    }
  }

  /**
   * Get available screen capture options
   */
  getCaptureOptions() {
    return {
      success: true,
      options: {
        screenshot: {
          description: 'Capture current screen as image',
          formats: ['png', 'jpg', 'webp'],
          requiresPermission: true
        },
        recording: {
          description: 'Record screen video',
          formats: ['webm', 'mp4'],
          audioSupport: true,
          requiresPermission: true
        },
        sharing: {
          description: 'Share screen with others',
          useCase: 'Video calls, presentations',
          requiresPermission: true
        }
      }
    };
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.mediaRecorder) {
      this.mediaRecorder = null;
    }
    
    this.recordedChunks = [];
    this.isRecording = false;

    return {
      success: true,
      message: 'Screen service cleaned up'
    };
  }
}

const screenService = new ScreenService();
export default screenService;
