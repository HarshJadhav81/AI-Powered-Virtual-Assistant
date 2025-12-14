/**
 * Messaging Service
 * Handles WhatsApp and SMS automation
 */

class MessagingService {
  constructor() {
    this.platform = this.detectPlatform();
  }

  /**
   * Detect the operating system platform
   */
  detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    if (userAgent.includes('win')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';
    
    return 'unknown';
  }

  /**
   * Send WhatsApp message
   */
  sendWhatsAppMessage(phoneNumber, message) {
    try {
      // Remove all non-digit characters from phone number
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      
      if (!cleanNumber) {
        return {
          success: false,
          message: 'Invalid phone number'
        };
      }

      // WhatsApp API URL format
      // For mobile: whatsapp://send?phone=...
      // For desktop/web: https://wa.me/...
      const isMobile = this.platform === 'android' || this.platform === 'ios';
      
      let url;
      if (isMobile) {
        url = `whatsapp://send?phone=${cleanNumber}${message ? `&text=${encodeURIComponent(message)}` : ''}`;
      } else {
        url = `https://wa.me/${cleanNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
      }

      window.open(url, '_blank');

      return {
        success: true,
        message: `Opening WhatsApp to send message${message ? `: "${message.substring(0, 30)}..."` : ''}`,
        platform: isMobile ? 'mobile' : 'web',
        recipient: phoneNumber
      };
    } catch (error) {
      console.error('[MESSAGING-ERROR] WhatsApp send failed:', error);
      return {
        success: false,
        message: 'Failed to open WhatsApp',
        error: error.message
      };
    }
  }

  /**
   * Open WhatsApp chat with contact
   */
  openWhatsAppChat(phoneNumber) {
    return this.sendWhatsAppMessage(phoneNumber, '');
  }

  /**
   * Send WhatsApp message to group
   */
  sendWhatsAppGroupMessage(groupInviteCode, message) {
    try {
      const url = `https://chat.whatsapp.com/${groupInviteCode}`;
      window.open(url, '_blank');

      return {
        success: true,
        message: 'Opening WhatsApp group',
        groupCode: groupInviteCode
      };
    } catch (error) {
      console.error('[MESSAGING-ERROR] WhatsApp group open failed:', error);
      return {
        success: false,
        message: 'Failed to open WhatsApp group',
        error: error.message
      };
    }
  }

  /**
   * Send SMS message (mobile only)
   */
  sendSMS(phoneNumber, message) {
    try {
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      
      if (!cleanNumber) {
        return {
          success: false,
          message: 'Invalid phone number'
        };
      }

      // SMS URI format
      const url = `sms:${cleanNumber}${message ? `?body=${encodeURIComponent(message)}` : ''}`;
      
      window.location.href = url;

      return {
        success: true,
        message: `Opening SMS to send message to ${phoneNumber}`,
        recipient: phoneNumber,
        platform: this.platform
      };
    } catch (error) {
      console.error('[MESSAGING-ERROR] SMS send failed:', error);
      return {
        success: false,
        message: 'Failed to open SMS app',
        error: error.message
      };
    }
  }

  /**
   * Send Telegram message
   */
  sendTelegramMessage(username, message) {
    try {
      const isMobile = this.platform === 'android' || this.platform === 'ios';
      
      let url;
      if (isMobile) {
        // Telegram mobile deep link
        url = `tg://msg?to=${username}${message ? `&text=${encodeURIComponent(message)}` : ''}`;
      } else {
        // Telegram web
        url = `https://t.me/${username}`;
      }

      window.open(url, '_blank');

      return {
        success: true,
        message: `Opening Telegram to message @${username}`,
        platform: isMobile ? 'mobile' : 'web',
        recipient: username
      };
    } catch (error) {
      console.error('[MESSAGING-ERROR] Telegram send failed:', error);
      return {
        success: false,
        message: 'Failed to open Telegram',
        error: error.message
      };
    }
  }

  /**
   * Open Telegram chat
   */
  openTelegramChat(username) {
    return this.sendTelegramMessage(username, '');
  }

  /**
   * Send email (opens default email client)
   */
  sendEmail(to, subject = '', body = '') {
    try {
      const params = new URLSearchParams();
      if (subject) params.append('subject', subject);
      if (body) params.append('body', body);
      
      const url = `mailto:${to}${params.toString() ? '?' + params.toString() : ''}`;
      window.location.href = url;

      return {
        success: true,
        message: `Opening email client to send to ${to}`,
        recipient: to
      };
    } catch (error) {
      console.error('[MESSAGING-ERROR] Email send failed:', error);
      return {
        success: false,
        message: 'Failed to open email client',
        error: error.message
      };
    }
  }

  /**
   * Make a phone call (mobile only)
   */
  makeCall(phoneNumber) {
    try {
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      
      if (!cleanNumber) {
        return {
          success: false,
          message: 'Invalid phone number'
        };
      }

      const url = `tel:${cleanNumber}`;
      window.location.href = url;

      return {
        success: true,
        message: `Calling ${phoneNumber}`,
        recipient: phoneNumber
      };
    } catch (error) {
      console.error('[MESSAGING-ERROR] Call failed:', error);
      return {
        success: false,
        message: 'Failed to initiate call',
        error: error.message
      };
    }
  }

  /**
   * Open messaging app
   */
  openMessagingApp(appName) {
    const apps = {
      'whatsapp': () => {
        const isMobile = this.platform === 'android' || this.platform === 'ios';
        const url = isMobile ? 'whatsapp://' : 'https://web.whatsapp.com';
        window.open(url, '_blank');
        return { success: true, message: 'Opening WhatsApp' };
      },
      'telegram': () => {
        const isMobile = this.platform === 'android' || this.platform === 'ios';
        const url = isMobile ? 'tg://' : 'https://web.telegram.org';
        window.open(url, '_blank');
        return { success: true, message: 'Opening Telegram' };
      },
      'messenger': () => {
        window.open('https://www.messenger.com', '_blank');
        return { success: true, message: 'Opening Messenger' };
      },
      'signal': () => {
        window.open('https://signal.org', '_blank');
        return { success: true, message: 'Opening Signal' };
      },
      'slack': () => {
        window.open('https://slack.com', '_blank');
        return { success: true, message: 'Opening Slack' };
      },
      'discord': () => {
        window.open('https://discord.com/app', '_blank');
        return { success: true, message: 'Opening Discord' };
      }
    };

    const normalizedName = appName.toLowerCase();
    const appHandler = apps[normalizedName];

    if (!appHandler) {
      return {
        success: false,
        message: `Messaging app "${appName}" not supported`,
        availableApps: Object.keys(apps)
      };
    }

    try {
      return appHandler();
    } catch (error) {
      console.error('[MESSAGING-ERROR] Failed to open app:', error);
      return {
        success: false,
        message: `Failed to open ${appName}`,
        error: error.message
      };
    }
  }

  /**
   * Schedule a message (requires backend integration)
   */
  scheduleMessage(platform, recipient, message, scheduledTime) {
    // This would require backend integration for actual scheduling
    // For now, return a mock response
    return {
      success: true,
      message: `Message scheduled to ${recipient} via ${platform} at ${new Date(scheduledTime).toLocaleString()}`,
      scheduled: true,
      platform: platform,
      recipient: recipient,
      scheduledTime: scheduledTime,
      note: 'Note: Message scheduling requires backend integration'
    };
  }

  /**
   * Broadcast message to multiple recipients (mock)
   */
  broadcastMessage(platform, recipients, message) {
    return {
      success: true,
      message: `Broadcasting message to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''} via ${platform}`,
      platform: platform,
      recipientCount: recipients.length,
      note: 'Note: Broadcast requires backend API integration'
    };
  }

  /**
   * Get supported messaging platforms
   */
  getSupportedPlatforms() {
    return {
      success: true,
      platforms: [
        { id: 'whatsapp', name: 'WhatsApp', supported: true, features: ['text', 'media', 'groups'] },
        { id: 'telegram', name: 'Telegram', supported: true, features: ['text', 'media', 'bots'] },
        { id: 'sms', name: 'SMS', supported: this.platform === 'android' || this.platform === 'ios', features: ['text'] },
        { id: 'email', name: 'Email', supported: true, features: ['text', 'attachments'] },
        { id: 'messenger', name: 'Messenger', supported: true, features: ['text', 'media'] },
        { id: 'signal', name: 'Signal', supported: true, features: ['text', 'media', 'encrypted'] },
        { id: 'slack', name: 'Slack', supported: true, features: ['text', 'media', 'channels'] },
        { id: 'discord', name: 'Discord', supported: true, features: ['text', 'media', 'servers'] }
      ]
    };
  }

  /**
   * Parse phone number for messaging
   */
  parsePhoneNumber(input) {
    // Remove all non-digit characters except +
    let cleaned = input.replace(/[^\d+]/g, '');
    
    // If starts with +, keep it
    if (cleaned.startsWith('+')) {
      return {
        success: true,
        formatted: cleaned,
        international: true
      };
    }

    // If doesn't start with country code, it's local
    return {
      success: true,
      formatted: cleaned,
      international: false,
      note: 'Add country code for international numbers (e.g., +1 for US)'
    };
  }
}

const messagingService = new MessagingService();
export default messagingService;
