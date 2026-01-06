import axios from 'axios';

/**
 * App Launch Service
 * Handles launching desktop and web applications
 */

class AppLaunchService {
  constructor() {
    this.platform = this.detectPlatform();
    this.installedApps = new Map();
  }

  /**
   * Detect the operating system platform
   */
  detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('win')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';

    return 'unknown';
  }

  /**
   * Launch a web application
   */
  launchWebApp(appName) {
    const webApps = {
      'gmail': 'https://mail.google.com',
      'google-drive': 'https://drive.google.com',
      'google-docs': 'https://docs.google.com',
      'google-sheets': 'https://sheets.google.com',
      'google-slides': 'https://slides.google.com',
      'google-calendar': 'https://calendar.google.com',
      'youtube': 'https://www.youtube.com',
      'instagram': 'https://www.instagram.com',
      'facebook': 'https://www.facebook.com',
      'twitter': 'https://twitter.com',
      'linkedin': 'https://www.linkedin.com',
      'github': 'https://github.com',
      'spotify': 'https://open.spotify.com',
      'netflix': 'https://www.netflix.com',
      'whatsapp': 'https://web.whatsapp.com',
      'telegram': 'https://web.telegram.org',
      'slack': 'https://slack.com',
      'discord': 'https://discord.com/app',
      'notion': 'https://www.notion.so',
      'trello': 'https://trello.com',
      'asana': 'https://app.asana.com',
      'zoom': 'https://zoom.us/join',
      'teams': 'https://teams.microsoft.com',
      'figma': 'https://www.figma.com',
      'canva': 'https://www.canva.com'
    };

    const normalizedName = appName.toLowerCase().replace(/\s+/g, '-');
    const url = webApps[normalizedName];

    if (!url) {
      return {
        success: false,
        message: `Web app "${appName}" not found`,
        availableApps: Object.keys(webApps)
      };
    }

    try {
      // Use named target for tab reuse
      const targetName = `app_${appName.toLowerCase().replace(/\s+/g, '_')}`;
      window.open(url, targetName);
      return {
        success: true,
        message: `Opening ${appName}`,
        url: url,
        platform: 'web'
      };
    } catch (error) {
      console.error('[APP-LAUNCH-ERROR] Failed to open web app:', error);
      return {
        success: false,
        message: `Failed to open ${appName}`,
        error: error.message
      };
    }
  }

  /**
   * Launch a desktop application using Backend API (System Control)
   */
  async launchDesktopApp(appName) {
    // ... (unchanged)
    try {
      // Use the backend API to launch the app on the system
      const response = await axios.post('http://localhost:8000/api/apps/launch', { appName }, { timeout: 10000 });

      if (response.data.success) {
        return {
          success: true,
          message: `Launching ${appName}`,
          platform: this.platform
        };
      } else {
        // Backend returned error response
        console.warn('[APP-LAUNCH] Backend returned error:', response.data);
        return {
          success: false,
          message: response.data.message || `Failed to launch ${appName}`,
          error: response.data.error
        };
      }
    } catch (error) {
      console.warn('[APP-LAUNCH] Backend launch failed:', error.message);

      // Provide more specific error messages
      let errorMsg = error.message;
      if (error.code === 'ECONNREFUSED') {
        errorMsg = 'Cannot connect to backend server';
      } else if (error.response?.status === 500) {
        errorMsg = error.response?.data?.message || 'Server error';
      } else if (error.code === 'ENOTFOUND') {
        errorMsg = 'Backend server not reachable';
      }

      return {
        success: false,
        message: errorMsg,
        error: error.message
      };
    }
  }

  /**
   * Close a desktop application using Backend API
   */
  async closeDesktopApp(appName) {
    try {
      const response = await axios.post('http://localhost:8000/api/apps/close', { appName }, { timeout: 10000 });

      if (response.data.success) {
        return {
          success: true,
          message: `Closing ${appName}`,
          platform: this.platform
        };
      } else {
        // Backend returned error response
        console.warn('[APP-CLOSE] Backend returned error:', response.data);
        return {
          success: false,
          message: response.data.message || `Failed to close ${appName}`,
          error: response.data.error
        };
      }
    } catch (error) {
      console.error('[APP-CLOSE] Failed to close app:', error.message);

      let errorMsg = error.message;
      if (error.code === 'ECONNREFUSED') {
        errorMsg = 'Cannot connect to backend server';
      } else if (error.response?.status === 500) {
        errorMsg = error.response?.data?.message || 'Server error';
      } else if (error.code === 'ENOTFOUND') {
        errorMsg = 'Backend server not reachable';
      }

      return {
        success: false,
        message: errorMsg,
        error: error.message
      };
    }
  }

  /**
   * Launch a mobile application using deep links
   */
  async launchMobileApp(appName) {
    const mobileSchemes = {
      'instagram': 'instagram://',
      'whatsapp': 'whatsapp://',
      'spotify': 'spotify://',
      'youtube': 'youtube://',
      'facebook': 'fb://',
      'twitter': 'twitter://',
      'linkedin': 'linkedin://',
      'gmail': 'googlegmail://',
      'google-maps': 'comgooglemaps://',
      'telegram': 'tg://'
    };

    const normalizedName = appName.toLowerCase().replace(/\s+/g, '-');
    const scheme = mobileSchemes[normalizedName];

    if (scheme) {
      // Use strict app target to avoid creating many tabs for redirects
      const targetName = `app_${appName.toLowerCase().replace(/\s+/g, '_')}`;
      window.open(scheme, targetName);
      // We return success to indicate attempt.
      return {
        success: true,
        message: `Opening ${appName} (Mobile)`,
        platform: this.platform
      };
    }

    // Fallback to web app
    return this.launchWebApp(appName);
  }

  /**
   * Launch any application (auto-detect web vs desktop)
   */
  async launchApp(appName) {
    console.log('[APP-LAUNCH] Attempting to launch:', appName);

    // Mobile handling
    if (this.platform === 'android' || this.platform === 'ios') {
      return this.launchMobileApp(appName);
    }

    // First try desktop app via backend
    const result = await this.launchDesktopApp(appName);
    if (result.success) {
      return result;
    }

    console.warn('[APP-LAUNCH] Desktop native launch failed, trying web fallback...');
    // If desktop launch failed, try launching as a web app
    const webResult = this.launchWebApp(appName);
    if (webResult.success) {
      return webResult;
    }

    // If both failed, return the desktop error (more descriptive regarding system check)
    return result;
  }

  /**
   * Open system settings
   */
  openSettings(section = null) {
    const settingsUrls = {
      'wifi': { windows: 'ms-settings:network-wifi', macos: 'x-apple.systempreferences:com.apple.preference.network' },
      'bluetooth': { windows: 'ms-settings:bluetooth', macos: 'x-apple.systempreferences:com.apple.preferences.Bluetooth' },
      'display': { windows: 'ms-settings:display', macos: 'x-apple.systempreferences:com.apple.preference.displays' },
      'sound': { windows: 'ms-settings:sound', macos: 'x-apple.systempreferences:com.apple.preference.sound' },
      'battery': { windows: 'ms-settings:batterysaver', macos: 'x-apple.systempreferences:com.apple.preference.battery' },
      'privacy': { windows: 'ms-settings:privacy', macos: 'x-apple.systempreferences:com.apple.preference.security' }
    };

    let url;

    if (section && settingsUrls[section]) {
      url = settingsUrls[section][this.platform] || 'ms-settings:';
    } else {
      url = this.platform === 'macos' ? 'x-apple.systempreferences:' : 'ms-settings:';
    }

    try {
      const link = document.createElement('a');
      link.href = url;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return {
        success: true,
        message: section ? `Opening ${section} settings` : 'Opening system settings',
        section: section
      };
    } catch (error) {
      console.error('[APP-LAUNCH-ERROR] Failed to open settings:', error);
      return {
        success: false,
        message: 'Failed to open system settings',
        error: error.message
      };
    }
  }

  /**
   * Get list of available apps
   */
  getAvailableApps() {
    return {
      success: true,
      platform: this.platform,
      apps: {
        web: [
          'Gmail', 'Google Drive', 'Google Docs', 'Google Sheets', 'Google Slides',
          'Google Calendar', 'YouTube', 'Instagram', 'Facebook', 'Twitter',
          'LinkedIn', 'GitHub', 'Spotify', 'Netflix', 'WhatsApp', 'Telegram',
          'Slack', 'Discord', 'Notion', 'Trello', 'Asana', 'Zoom', 'Teams',
          'Figma', 'Canva'
        ],
        desktop: [
          'VSCode', 'Chrome', 'Edge', 'Firefox', 'Calculator', 'Settings',
          'Spotify Desktop', 'Discord Desktop', 'Slack Desktop', 'Zoom Desktop',
          'Teams Desktop', 'Outlook'
        ]
      }
    };
  }

  /**
   * Search for an app
   */
  searchApp(query) {
    const available = this.getAvailableApps();
    const allApps = [...available.apps.web, ...available.apps.desktop];

    const results = allApps.filter(app =>
      app.toLowerCase().includes(query.toLowerCase())
    );

    return {
      success: true,
      message: `Found ${results.length} app${results.length !== 1 ? 's' : ''} matching "${query}"`,
      results: results,
      count: results.length
    };
  }
}

const appLaunchService = new AppLaunchService();
export default appLaunchService;
