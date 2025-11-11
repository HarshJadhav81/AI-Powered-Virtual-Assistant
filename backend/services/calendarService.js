/**
 * Google Calendar Service
 * Handles calendar operations using Google Calendar API
 */

class CalendarService {
  constructor() {
    this.apiKey = process.env.GOOGLE_CALENDAR_API_KEY || '';
    this.clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '';
    this.redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'http://localhost:8000/api/calendar/callback';
  }

  /**
   * Get today's events
   */
  async getTodayEvents(accessToken) {
    try {
      if (!accessToken) {
        return {
          success: false,
          message: 'Please authenticate with Google Calendar first',
          action: 'auth-required'
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${today.toISOString()}&` +
        `timeMax=${tomorrow.toISOString()}&` +
        `orderBy=startTime&` +
        `singleEvents=true`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      const data = await response.json();
      const events = data.items || [];

      if (events.length === 0) {
        return {
          success: true,
          message: 'You have no events scheduled for today',
          events: []
        };
      }

      const eventSummary = events.map(event => {
        const startTime = new Date(event.start.dateTime || event.start.date);
        return `${event.summary} at ${startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      }).join(', ');

      return {
        success: true,
        message: `You have ${events.length} event${events.length > 1 ? 's' : ''} today: ${eventSummary}`,
        events: events,
        count: events.length
      };
    } catch (error) {
      console.error('[CALENDAR-ERROR] Failed to get today\'s events:', error);
      return {
        success: false,
        message: 'Failed to retrieve calendar events',
        error: error.message
      };
    }
  }

  /**
   * Get upcoming events (next 7 days)
   */
  async getUpcomingEvents(accessToken, days = 7) {
    try {
      if (!accessToken) {
        return {
          success: false,
          message: 'Please authenticate with Google Calendar first',
          action: 'auth-required'
        };
      }

      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + days);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${now.toISOString()}&` +
        `timeMax=${future.toISOString()}&` +
        `orderBy=startTime&` +
        `singleEvents=true&` +
        `maxResults=10`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch upcoming events');
      }

      const data = await response.json();
      const events = data.items || [];

      return {
        success: true,
        message: `You have ${events.length} upcoming event${events.length !== 1 ? 's' : ''}`,
        events: events,
        count: events.length
      };
    } catch (error) {
      console.error('[CALENDAR-ERROR] Failed to get upcoming events:', error);
      return {
        success: false,
        message: 'Failed to retrieve upcoming events',
        error: error.message
      };
    }
  }

  /**
   * Create a new calendar event
   */
  async createEvent(accessToken, eventDetails) {
    try {
      if (!accessToken) {
        return {
          success: false,
          message: 'Please authenticate with Google Calendar first',
          action: 'auth-required'
        };
      }

      const { title, startTime, endTime, description, location } = eventDetails;

      const event = {
        summary: title,
        description: description || '',
        location: location || '',
        start: {
          dateTime: startTime,
          timeZone: 'UTC'
        },
        end: {
          dateTime: endTime || new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: 'UTC'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 10 }
          ]
        }
      };

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create calendar event');
      }

      const createdEvent = await response.json();

      return {
        success: true,
        message: `Event "${title}" created successfully`,
        event: createdEvent,
        htmlLink: createdEvent.htmlLink
      };
    } catch (error) {
      console.error('[CALENDAR-ERROR] Failed to create event:', error);
      return {
        success: false,
        message: 'Failed to create calendar event',
        error: error.message
      };
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(accessToken, eventId) {
    try {
      if (!accessToken) {
        return {
          success: false,
          message: 'Please authenticate with Google Calendar first',
          action: 'auth-required'
        };
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok && response.status !== 204) {
        throw new Error('Failed to delete event');
      }

      return {
        success: true,
        message: 'Event deleted successfully'
      };
    } catch (error) {
      console.error('[CALENDAR-ERROR] Failed to delete event:', error);
      return {
        success: false,
        message: 'Failed to delete event',
        error: error.message
      };
    }
  }

  /**
   * Search calendar events
   */
  async searchEvents(accessToken, query) {
    try {
      if (!accessToken) {
        return {
          success: false,
          message: 'Please authenticate with Google Calendar first',
          action: 'auth-required'
        };
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?q=${encodeURIComponent(query)}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search events');
      }

      const data = await response.json();
      const events = data.items || [];

      return {
        success: true,
        message: `Found ${events.length} event${events.length !== 1 ? 's' : ''} matching "${query}"`,
        events: events,
        count: events.length
      };
    } catch (error) {
      console.error('[CALENDAR-ERROR] Failed to search events:', error);
      return {
        success: false,
        message: 'Failed to search calendar events',
        error: error.message
      };
    }
  }

  /**
   * Generate OAuth URL for user authentication
   */
  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
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
      message: 'Please authorize Google Calendar access'
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
      console.error('[CALENDAR-ERROR] Failed to exchange code:', error);
      return {
        success: false,
        message: 'Failed to authenticate with Google Calendar',
        error: error.message
      };
    }
  }

  /**
   * Fallback: Open Google Calendar in browser
   */
  getFallbackUrl() {
    return {
      success: true,
      url: 'https://calendar.google.com',
      message: 'Opening Google Calendar in browser'
    };
  }
}

const calendarService = new CalendarService();
export default calendarService;
