/**
 * Chromecast Service - Google Cast Integration
 * Handles casting media to Chromecast devices and Android TVs
 * Uses Chrome's Cast Web API
 */

class ChromecastService {
  constructor() {
    this.cast = null;
    this.session = null;
    this.currentMedia = null;
    this.isInitialized = false;
    this.availableDevices = [];
  }

  /**
   * Initialize Google Cast API
   */
  async initialize() {
    try {
      // Check if Cast API is available
      if (!window.chrome || !window.chrome.cast) {
        console.warn('[CAST]', 'Google Cast API not available. Loading from CDN...');
        await this.loadCastSDK();
      }

      const cast = window.chrome.cast;
      this.cast = cast;

      // Initialize Cast API
      const sessionRequest = new cast.SessionRequest(cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
      const apiConfig = new cast.ApiConfig(
        sessionRequest,
        this.sessionListener.bind(this),
        this.receiverListener.bind(this)
      );

      cast.initialize(apiConfig, () => {
        this.isInitialized = true;
        console.info('[CAST]', 'Google Cast API initialized successfully');
      }, (error) => {
        console.error('[CAST-INIT-ERROR]:', error);
      });

      return {
        success: true,
        message: 'Chromecast initialized',
        isAvailable: true
      };
    } catch (error) {
      console.error('[CAST-INIT-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to initialize Chromecast',
        error: error.message,
        note: 'Make sure you are using Chrome browser'
      };
    }
  }

  /**
   * Load Google Cast SDK from CDN
   */
  loadCastSDK() {
    return new Promise((resolve, reject) => {
      if (window.chrome && window.chrome.cast) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
      script.onload = () => {
        // Wait for Cast API to be available
        const checkInterval = setInterval(() => {
          if (window.chrome && window.chrome.cast) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Cast SDK load timeout'));
        }, 5000);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Check if Chromecast is supported
   */
  isSupported() {
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    
    return {
      supported: isChrome,
      browser: isChrome ? 'Chrome' : 'Unsupported',
      message: isChrome 
        ? 'Chromecast is supported in this browser' 
        : 'Chromecast requires Chrome browser',
      features: isChrome ? ['cast', 'discover', 'control'] : []
    };
  }

  /**
   * Session listener callback
   */
  sessionListener(session) {
    this.session = session;
    console.info('[CAST]', 'Session established:', session.sessionId);
    
    if (session.media.length > 0) {
      this.currentMedia = session.media[0];
      this.attachMediaListener();
    }
  }

  /**
   * Receiver listener callback
   */
  receiverListener(availability) {
    if (availability === this.cast.ReceiverAvailability.AVAILABLE) {
      console.info('[CAST]', 'Chromecast devices available');
      this.availableDevices = ['chromecast'];
    } else {
      console.info('[CAST]', 'No Chromecast devices available');
      this.availableDevices = [];
    }
  }

  /**
   * Request cast session (shows device picker)
   */
  async requestSession() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      return new Promise((resolve, reject) => {
        this.cast.requestSession(
          (session) => {
            this.session = session;
            console.info('[CAST]', 'Connected to:', session.receiver.friendlyName);
            resolve({
              success: true,
              message: `Connected to ${session.receiver.friendlyName}`,
              deviceName: session.receiver.friendlyName,
              sessionId: session.sessionId
            });
          },
          (error) => {
            console.error('[CAST-SESSION-ERROR]:', error);
            reject({
              success: false,
              message: 'Failed to connect to Chromecast',
              error: error.description
            });
          }
        );
      });
    } catch (error) {
      console.error('[CAST-REQUEST-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to request cast session',
        error: error.message
      };
    }
  }

  /**
   * Cast media to Chromecast
   * @param {string} mediaUrl - URL of media to cast
   * @param {object} options - Media options
   */
  async castMedia(mediaUrl, options = {}) {
    try {
      if (!this.session) {
        const sessionResult = await this.requestSession();
        if (!sessionResult.success) {
          return sessionResult;
        }
      }

      const mediaInfo = new this.cast.media.MediaInfo(mediaUrl, options.contentType || 'video/mp4');
      mediaInfo.metadata = new this.cast.media.GenericMediaMetadata();
      mediaInfo.metadata.title = options.title || 'Casting from Virtual Assistant';
      mediaInfo.metadata.subtitle = options.subtitle || '';
      
      if (options.thumbnail) {
        mediaInfo.metadata.images = [new this.cast.Image(options.thumbnail)];
      }

      const request = new this.cast.media.LoadRequest(mediaInfo);
      request.autoplay = options.autoplay !== false;
      request.currentTime = options.startTime || 0;

      return new Promise((resolve, reject) => {
        this.session.loadMedia(
          request,
          (media) => {
            this.currentMedia = media;
            this.attachMediaListener();
            console.info('[CAST]', 'Media loaded successfully');
            resolve({
              success: true,
              message: 'Media casting started',
              mediaUrl,
              title: options.title
            });
          },
          (error) => {
            console.error('[CAST-MEDIA-ERROR]:', error);
            reject({
              success: false,
              message: 'Failed to load media',
              error: error.description
            });
          }
        );
      });
    } catch (error) {
      console.error('[CAST-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to cast media',
        error: error.message
      };
    }
  }

  /**
   * Cast YouTube video
   * @param {string} videoId - YouTube video ID
   */
  async castYouTube(videoId) {
    const mediaUrl = `https://www.youtube.com/watch?v=${videoId}`;
    return this.castMedia(mediaUrl, {
      contentType: 'video/youtube',
      title: 'YouTube Video'
    });
  }

  /**
   * Play/Resume media
   */
  async play() {
    try {
      if (!this.currentMedia) {
        return { success: false, message: 'No media loaded' };
      }

      this.currentMedia.play(null, 
        () => ({ success: true, message: 'Playing' }),
        (error) => ({ success: false, message: 'Play failed', error: error.description })
      );
    } catch (error) {
      return { success: false, message: 'Play failed', error: error.message };
    }
  }

  /**
   * Pause media
   */
  async pause() {
    try {
      if (!this.currentMedia) {
        return { success: false, message: 'No media loaded' };
      }

      this.currentMedia.pause(null,
        () => ({ success: true, message: 'Paused' }),
        (error) => ({ success: false, message: 'Pause failed', error: error.description })
      );
    } catch (error) {
      return { success: false, message: 'Pause failed', error: error.message };
    }
  }

  /**
   * Stop casting
   */
  async stop() {
    try {
      if (!this.session) {
        return { success: false, message: 'No active session' };
      }

      this.session.stop(
        () => {
          this.session = null;
          this.currentMedia = null;
          return { success: true, message: 'Casting stopped' };
        },
        (error) => ({ success: false, message: 'Stop failed', error: error.description })
      );
    } catch (error) {
      return { success: false, message: 'Stop failed', error: error.message };
    }
  }

  /**
   * Set volume
   * @param {number} level - Volume level (0.0 to 1.0)
   */
  async setVolume(level) {
    try {
      if (!this.session) {
        return { success: false, message: 'No active session' };
      }

      const volume = new this.cast.Volume(level);
      const request = new this.cast.VolumeRequest(volume);

      this.session.setReceiverVolumeLevel(level,
        () => ({ success: true, message: `Volume set to ${Math.round(level * 100)}%` }),
        (error) => ({ success: false, message: 'Volume change failed', error: error.description })
      );
    } catch (error) {
      return { success: false, message: 'Volume change failed', error: error.message };
    }
  }

  /**
   * Seek to position
   * @param {number} seconds - Position in seconds
   */
  async seek(seconds) {
    try {
      if (!this.currentMedia) {
        return { success: false, message: 'No media loaded' };
      }

      const request = new this.cast.media.SeekRequest();
      request.currentTime = seconds;

      this.currentMedia.seek(request,
        () => ({ success: true, message: `Seeked to ${seconds}s` }),
        (error) => ({ success: false, message: 'Seek failed', error: error.description })
      );
    } catch (error) {
      return { success: false, message: 'Seek failed', error: error.message };
    }
  }

  /**
   * Attach media listener
   */
  attachMediaListener() {
    if (!this.currentMedia) return;

    this.currentMedia.addUpdateListener((isAlive) => {
      if (!isAlive) {
        console.info('[CAST]', 'Media session ended');
        this.currentMedia = null;
      }
    });
  }

  /**
   * Get current session info
   */
  getSessionInfo() {
    if (!this.session) {
      return { active: false, message: 'No active session' };
    }

    return {
      active: true,
      deviceName: this.session.receiver.friendlyName,
      sessionId: this.session.sessionId,
      appId: this.session.appId,
      hasMedia: !!this.currentMedia,
      mediaStatus: this.currentMedia ? {
        playerState: this.currentMedia.playerState,
        currentTime: this.currentMedia.getEstimatedTime(),
        duration: this.currentMedia.media.duration
      } : null
    };
  }

  /**
   * Get available devices
   */
  getAvailableDevices() {
    return {
      available: this.availableDevices.length > 0,
      count: this.availableDevices.length,
      devices: this.availableDevices
    };
  }

  /**
   * Disconnect from Chromecast
   */
  async disconnect() {
    try {
      if (this.session) {
        await this.stop();
      }
      return {
        success: true,
        message: 'Disconnected from Chromecast'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Disconnect failed',
        error: error.message
      };
    }
  }
}

// Export singleton instance
const chromecastService = new ChromecastService();
export default chromecastService;
