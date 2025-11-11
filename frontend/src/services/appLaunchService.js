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
      window.open(url, '_blank');
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
   * Launch a desktop application using protocol handlers
   */
  launchDesktopApp(appName) {
    const desktopApps = {
      // Windows apps
      'notepad': { windows: 'ms-settings:apps', fallback: null },
      'calculator': { windows: 'calculator:', fallback: null },
      'paint': { windows: 'ms-paint:', fallback: null },
      'settings': { 
        windows: 'ms-settings:',
        macos: 'x-apple.systempreferences:',
        linux: null,
        fallback: null
      },
      
      // Cross-platform apps
      'vscode': { 
        windows: 'vscode:',
        macos: 'vscode:',
        linux: 'vscode:',
        fallback: 'https://vscode.dev'
      },
      'chrome': { 
        windows: 'chrome:',
        macos: 'googlechrome:',
        linux: 'chrome:',
        fallback: 'https://www.google.com/chrome'
      },
      'edge': { 
        windows: 'microsoft-edge:',
        macos: 'microsoft-edge:',
        linux: null,
        fallback: 'https://www.microsoft.com/edge'
      },
      'firefox': { 
        windows: 'firefox:',
        macos: 'firefox:',
        linux: 'firefox:',
        fallback: 'https://www.mozilla.org/firefox'
      },
      'spotify-desktop': { 
        windows: 'spotify:',
        macos: 'spotify:',
        linux: 'spotify:',
        fallback: 'https://open.spotify.com'
      },
      'discord-desktop': { 
        windows: 'discord:',
        macos: 'discord:',
        linux: 'discord:',
        fallback: 'https://discord.com/app'
      },
      'slack-desktop': { 
        windows: 'slack:',
        macos: 'slack:',
        linux: 'slack:',
        fallback: 'https://slack.com'
      },
      'zoom-desktop': { 
        windows: 'zoommtg:',
        macos: 'zoommtg:',
        linux: null,
        fallback: 'https://zoom.us'
      },
      'teams-desktop': { 
        windows: 'msteams:',
        macos: 'msteams:',
        linux: null,
        fallback: 'https://teams.microsoft.com'
      },
      'outlook': { 
        windows: 'mailto:',
        macos: 'mailto:',
        linux: 'mailto:',
        fallback: 'https://outlook.com'
      }
    };

    const normalizedName = appName.toLowerCase().replace(/\s+/g, '-');
    const app = desktopApps[normalizedName];

    if (!app) {
      // Try as web app if not found in desktop apps
      return this.launchWebApp(appName);
    }

    const protocol = app[this.platform];
    
    if (!protocol) {
      // Use fallback if available
      if (app.fallback) {
        window.open(app.fallback, '_blank');
        return {
          success: true,
          message: `Opening ${appName} in browser (desktop version not available)`,
          url: app.fallback,
          platform: 'web'
        };
      }

      return {
        success: false,
        message: `${appName} is not available on ${this.platform}`,
        platform: this.platform
      };
    }

    try {
      // Create invisible link to trigger protocol
      const link = document.createElement('a');
      link.href = protocol;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return {
        success: true,
        message: `Launching ${appName}`,
        protocol: protocol,
        platform: this.platform
      };
    } catch (error) {
      console.error('[APP-LAUNCH-ERROR] Failed to launch desktop app:', error);
      
      // Try fallback on error
      if (app.fallback) {
        window.open(app.fallback, '_blank');
        return {
          success: true,
          message: `Opening ${appName} in browser`,
          url: app.fallback,
          platform: 'web'
        };
      }

      return {
        success: false,
        message: `Failed to launch ${appName}`,
        error: error.message
      };
    }
  }

  /**
   * Launch any application (auto-detect web vs desktop)
   */
  launchApp(appName) {
    console.log('[APP-LAUNCH] Attempting to launch:', appName);
    
    // First try desktop app
    const result = this.launchDesktopApp(appName);
    
    // If desktop app not found and no fallback was used, try web app
    if (!result.success && !result.url) {
      return this.launchWebApp(appName);
    }

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
