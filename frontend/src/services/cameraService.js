/**
 * Camera Service - Photo/Video Capture
 * Handles camera access, photo capture, and video recording
 * Uses MediaDevices API
 */

class CameraService {
  constructor() {
    this.stream = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.photoCanvas = null;
  }

  /**
   * Check if camera is supported
   */
  checkSupport() {
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    
    return {
      supported: hasMediaDevices,
      message: hasMediaDevices 
        ? 'Camera access is supported' 
        : 'Camera access not supported in this browser',
      features: hasMediaDevices ? ['photo', 'video', 'frontCamera', 'backCamera'] : []
    };
  }

  /**
   * Request camera permission and start stream
   * @param {object} constraints - Camera constraints
   */
  async startCamera(constraints = {}) {
    try {
      const defaultConstraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: constraints.facingMode || 'user' // 'user' = front, 'environment' = back
        },
        audio: constraints.audio !== false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(defaultConstraints);

      console.info('[CAMERA]', 'Camera started successfully');
      
      return {
        success: true,
        message: 'Camera started',
        stream: this.stream,
        constraints: defaultConstraints
      };
    } catch (error) {
      console.error('[CAMERA-ERROR]:', error);
      
      let errorMessage = 'Failed to start camera';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera device found';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use';
      }

      return {
        success: false,
        message: errorMessage,
        error: error.message
      };
    }
  }

  /**
   * Take a photo
   * @param {object} options - Photo options
   */
  async takePhoto(options = {}) {
    try {
      if (!this.stream) {
        const result = await this.startCamera({ facingMode: options.facingMode });
        if (!result.success) {
          return result;
        }
      }

      // Create canvas if not exists
      if (!this.photoCanvas) {
        this.photoCanvas = document.createElement('canvas');
      }

      const video = document.createElement('video');
      video.srcObject = this.stream;
      await video.play();

      // Set canvas dimensions to match video
      this.photoCanvas.width = video.videoWidth;
      this.photoCanvas.height = video.videoHeight;

      // Draw video frame to canvas
      const context = this.photoCanvas.getContext('2d');
      context.drawImage(video, 0, 0);

      // Convert to blob
      const blob = await new Promise(resolve => {
        this.photoCanvas.toBlob(resolve, options.format || 'image/jpeg', options.quality || 0.95);
      });

      // Create download URL
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `photo-${timestamp}.${options.format === 'image/png' ? 'png' : 'jpg'}`;

      // Auto-download if requested
      if (options.autoDownload !== false) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
      }

      // Stop camera if not continuous shooting
      if (options.continuous !== true) {
        this.stopCamera();
      }

      console.info('[CAMERA]', 'Photo captured:', filename);

      return {
        success: true,
        message: 'Photo captured successfully',
        blob,
        url,
        filename,
        dimensions: {
          width: this.photoCanvas.width,
          height: this.photoCanvas.height
        }
      };
    } catch (error) {
      console.error('[CAMERA-PHOTO-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to capture photo',
        error: error.message
      };
    }
  }

  /**
   * Start video recording
   * @param {object} options - Recording options
   */
  async startVideoRecording(options = {}) {
    try {
      if (!this.stream) {
        const result = await this.startCamera({ 
          facingMode: options.facingMode,
          audio: options.audio !== false 
        });
        if (!result.success) {
          return result;
        }
      }

      const mimeType = options.mimeType || 'video/webm;codecs=vp9';
      
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        return {
          success: false,
          message: `MIME type ${mimeType} not supported`
        };
      }

      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        videoBitsPerSecond: options.videoBitrate || 2500000 // 2.5 Mbps
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.handleRecordingStop(options);
      };

      this.mediaRecorder.start(options.timeslice || 1000); // Record in chunks
      this.isRecording = true;

      console.info('[CAMERA]', 'Video recording started');

      return {
        success: true,
        message: 'Video recording started',
        mimeType
      };
    } catch (error) {
      console.error('[CAMERA-RECORD-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to start recording',
        error: error.message
      };
    }
  }

  /**
   * Stop video recording
   */
  stopVideoRecording() {
    try {
      if (!this.mediaRecorder || !this.isRecording) {
        return {
          success: false,
          message: 'No active recording'
        };
      }

      this.mediaRecorder.stop();
      this.isRecording = false;

      return {
        success: true,
        message: 'Recording stopped'
      };
    } catch (error) {
      console.error('[CAMERA-STOP-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to stop recording',
        error: error.message
      };
    }
  }

  /**
   * Handle recording stop
   */
  handleRecordingStop(options = {}) {
    const blob = new Blob(this.recordedChunks, { type: options.mimeType || 'video/webm' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `video-${timestamp}.webm`;

    // Auto-download
    if (options.autoDownload !== false) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
    }

    console.info('[CAMERA]', 'Video saved:', filename);

    // Stop camera
    this.stopCamera();

    this.recordedChunks = [];
    this.mediaRecorder = null;
  }

  /**
   * Get recording status
   */
  getRecordingStatus() {
    return {
      isRecording: this.isRecording,
      hasStream: !!this.stream,
      duration: this.isRecording && this.mediaRecorder 
        ? (Date.now() - this.mediaRecorder.startTime) / 1000 
        : 0
    };
  }

  /**
   * Switch camera (front/back)
   */
  async switchCamera() {
    try {
      if (!this.stream) {
        return {
          success: false,
          message: 'No active camera stream'
        };
      }

      const currentFacingMode = this.stream.getVideoTracks()[0].getSettings().facingMode;
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

      this.stopCamera();
      return await this.startCamera({ facingMode: newFacingMode });
    } catch (error) {
      console.error('[CAMERA-SWITCH-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to switch camera',
        error: error.message
      };
    }
  }

  /**
   * Get available cameras
   */
  async getCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');

      return {
        success: true,
        cameras: cameras.map(camera => ({
          id: camera.deviceId,
          label: camera.label || `Camera ${cameras.indexOf(camera) + 1}`,
          facingMode: camera.label.toLowerCase().includes('front') || camera.label.toLowerCase().includes('user') 
            ? 'user' 
            : 'environment'
        })),
        count: cameras.length
      };
    } catch (error) {
      console.error('[CAMERA-ENUM-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to enumerate cameras',
        error: error.message
      };
    }
  }

  /**
   * Stop camera stream
   */
  stopCamera() {
    try {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }

      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop();
        this.isRecording = false;
      }

      console.info('[CAMERA]', 'Camera stopped');

      return {
        success: true,
        message: 'Camera stopped'
      };
    } catch (error) {
      console.error('[CAMERA-STOP-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to stop camera',
        error: error.message
      };
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopCamera();
    if (this.photoCanvas) {
      this.photoCanvas = null;
    }
    this.recordedChunks = [];
  }
}

// Export singleton instance
const cameraService = new CameraService();
export default cameraService;
