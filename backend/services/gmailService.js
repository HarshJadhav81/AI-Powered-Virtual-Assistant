/**
 * Gmail Service
 * Handles email operations using Gmail API
 */

class GmailService {
  constructor() {
    this.apiKey = process.env.GMAIL_API_KEY || '';
    this.clientId = process.env.GMAIL_CLIENT_ID || '';
    this.clientSecret = process.env.GMAIL_CLIENT_SECRET || '';
    this.redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:8000/api/gmail/callback';
  }

  /**
   * Get unread email count
   */
  async getUnreadCount(accessToken) {
    try {
      if (!accessToken) {
        return {
          success: false,
          message: 'Please authenticate with Gmail first',
          action: 'auth-required'
        };
      }

      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=UNREAD&maxResults=1',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      const data = await response.json();
      const count = data.resultSizeEstimate || 0;

      return {
        success: true,
        message: count === 0 ? 'You have no unread emails' : `You have ${count} unread email${count > 1 ? 's' : ''}`,
        count: count
      };
    } catch (error) {
      console.error('[GMAIL-ERROR] Failed to get unread count:', error);
      return {
        success: false,
        message: 'Failed to check emails',
        error: error.message
      };
    }
  }

  /**
   * Get recent emails
   */
  async getRecentEmails(accessToken, maxResults = 5) {
    try {
      if (!accessToken) {
        return {
          success: false,
          message: 'Please authenticate with Gmail first',
          action: 'auth-required'
        };
      }

      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recent emails');
      }

      const data = await response.json();
      const messages = data.messages || [];

      // Fetch details for each message
      const emailDetails = await Promise.all(
        messages.slice(0, 3).map(async (msg) => {
          const detailResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (detailResponse.ok) {
            const detail = await detailResponse.json();
            const headers = detail.payload.headers;
            const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
            const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
            return { from, subject };
          }
          return null;
        })
      );

      const validEmails = emailDetails.filter(e => e !== null);
      const summary = validEmails.map(e => `${e.subject} from ${e.from}`).join(', ');

      return {
        success: true,
        message: `Your recent emails: ${summary}`,
        emails: validEmails,
        count: messages.length
      };
    } catch (error) {
      console.error('[GMAIL-ERROR] Failed to get recent emails:', error);
      return {
        success: false,
        message: 'Failed to retrieve emails',
        error: error.message
      };
    }
  }

  /**
   * Search emails
   */
  async searchEmails(accessToken, query) {
    try {
      if (!accessToken) {
        return {
          success: false,
          message: 'Please authenticate with Gmail first',
          action: 'auth-required'
        };
      }

      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=5`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search emails');
      }

      const data = await response.json();
      const messages = data.messages || [];

      return {
        success: true,
        message: `Found ${messages.length} email${messages.length !== 1 ? 's' : ''} matching "${query}"`,
        emails: messages,
        count: messages.length
      };
    } catch (error) {
      console.error('[GMAIL-ERROR] Failed to search emails:', error);
      return {
        success: false,
        message: 'Failed to search emails',
        error: error.message
      };
    }
  }

  /**
   * Send an email
   */
  async sendEmail(accessToken, emailData) {
    try {
      if (!accessToken) {
        return {
          success: false,
          message: 'Please authenticate with Gmail first',
          action: 'auth-required'
        };
      }

      const { to, subject, body, cc, bcc } = emailData;

      // Create RFC 2822 formatted email
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        cc ? `Cc: ${cc}` : '',
        bcc ? `Bcc: ${bcc}` : '',
        '',
        body
      ].filter(line => line !== '').join('\r\n');

      // Base64url encode the email
      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            raw: encodedEmail
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      const result = await response.json();

      return {
        success: true,
        message: `Email sent successfully to ${to}`,
        messageId: result.id
      };
    } catch (error) {
      console.error('[GMAIL-ERROR] Failed to send email:', error);
      return {
        success: false,
        message: 'Failed to send email',
        error: error.message
      };
    }
  }

  /**
   * Mark email as read
   */
  async markAsRead(accessToken, messageId) {
    try {
      if (!accessToken) {
        return {
          success: false,
          message: 'Please authenticate with Gmail first',
          action: 'auth-required'
        };
      }

      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            removeLabelIds: ['UNREAD']
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to mark email as read');
      }

      return {
        success: true,
        message: 'Email marked as read'
      };
    } catch (error) {
      console.error('[GMAIL-ERROR] Failed to mark as read:', error);
      return {
        success: false,
        message: 'Failed to mark email as read',
        error: error.message
      };
    }
  }

  /**
   * Delete an email
   */
  async deleteEmail(accessToken, messageId) {
    try {
      if (!accessToken) {
        return {
          success: false,
          message: 'Please authenticate with Gmail first',
          action: 'auth-required'
        };
      }

      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete email');
      }

      return {
        success: true,
        message: 'Email moved to trash'
      };
    } catch (error) {
      console.error('[GMAIL-ERROR] Failed to delete email:', error);
      return {
        success: false,
        message: 'Failed to delete email',
        error: error.message
      };
    }
  }

  /**
   * Generate OAuth URL for user authentication
   */
  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify'
    ].join(' ');

    const authUrl = 
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${this.clientId}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent`;

    return {
      success: true,
      authUrl: authUrl,
      message: 'Please authorize Gmail access'
    };
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          code: code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const tokens = await response.json();

      return {
        success: true,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in
      };
    } catch (error) {
      console.error('[GMAIL-ERROR] Failed to exchange code:', error);
      return {
        success: false,
        message: 'Failed to authenticate with Gmail',
        error: error.message
      };
    }
  }

  /**
   * Fallback: Open Gmail in browser
   */
  getFallbackUrl() {
    return {
      success: true,
      url: 'https://mail.google.com',
      message: 'Opening Gmail in browser'
    };
  }
}

const gmailService = new GmailService();
export default gmailService;
