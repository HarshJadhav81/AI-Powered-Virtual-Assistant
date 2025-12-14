/**
 * Spotify Service - Music Integration
 * Handles Spotify Web API for music playback and control
 * API Docs: https://developer.spotify.com/documentation/web-api
 */

import axios from 'axios';

class SpotifyService {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID || '';
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:8000/api/music/spotify/callback';
    this.refreshToken = process.env.SPOTIFY_REFRESH_TOKEN || '';
    this.baseUrl = 'https://api.spotify.com/v1';
    this.authUrl = 'https://accounts.spotify.com/api/token';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Check if Spotify is configured
   */
  isConfigured() {
    return !!(this.clientId && this.clientSecret);
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthUrl() {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Spotify API is not configured. Please add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to .env file',
        configRequired: true
      };
    }

    const scopes = [
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'streaming',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-library-read',
      'user-library-modify'
    ];

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      show_dialog: 'true'
    });

    return {
      success: true,
      url: `https://accounts.spotify.com/authorize?${params.toString()}`,
      message: 'Please authorize the application'
    };
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Spotify API not configured');
      }

      const response = await axios.post(
        this.authUrl,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
          }
        }
      );

      return {
        success: true,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        message: 'Successfully authenticated with Spotify'
      };
    } catch (error) {
      console.error('[SPOTIFY-AUTH-ERROR]:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to authenticate with Spotify',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(
        this.authUrl,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

      return {
        success: true,
        accessToken: this.accessToken
      };
    } catch (error) {
      console.error('[SPOTIFY-REFRESH-ERROR]:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to refresh token',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Ensure valid access token
   */
  async ensureValidToken(userAccessToken = null) {
    // Use user-provided token if available
    if (userAccessToken) {
      return userAccessToken;
    }

    // Check if token needs refresh
    if (!this.accessToken || (this.tokenExpiry && Date.now() >= this.tokenExpiry)) {
      const result = await this.refreshAccessToken();
      if (!result.success) {
        throw new Error('Token refresh failed');
      }
    }

    return this.accessToken;
  }

  /**
   * Search for tracks
   */
  async searchTrack(query, accessToken = null) {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Spotify API not configured',
          fallback: true,
          fallbackUrl: `https://open.spotify.com/search/${encodeURIComponent(query)}`
        };
      }

      const token = await this.ensureValidToken(accessToken);

      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          q: query,
          type: 'track',
          limit: 10
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const tracks = response.data.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map(a => a.name).join(', '),
        album: track.album.name,
        duration: Math.floor(track.duration_ms / 1000),
        uri: track.uri,
        url: track.external_urls.spotify
      }));

      return {
        success: true,
        tracks,
        count: tracks.length,
        voiceResponse: tracks.length > 0
          ? `Found ${tracks.length} songs. Top result: ${tracks[0].name} by ${tracks[0].artists}`
          : 'No songs found'
      };
    } catch (error) {
      console.error('[SPOTIFY-SEARCH-ERROR]:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to search tracks',
        error: error.response?.data?.error?.message || error.message,
        fallback: true,
        fallbackUrl: `https://open.spotify.com/search/${encodeURIComponent(query)}`
      };
    }
  }

  /**
   * Play a track
   */
  async playTrack(trackUri, accessToken = null) {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Spotify API not configured',
          fallback: true
        };
      }

      const token = await this.ensureValidToken(accessToken);

      await axios.put(
        `${this.baseUrl}/me/player/play`,
        {
          uris: [trackUri]
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        message: 'Playing track on Spotify',
        voiceResponse: 'Playing song on Spotify'
      };
    } catch (error) {
      console.error('[SPOTIFY-PLAY-ERROR]:', error.response?.data || error.message);

      // Check if no active device
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'No active Spotify device found. Please open Spotify on your device first.',
          voiceResponse: 'Please open Spotify on your device first',
          requiresDevice: true
        };
      }

      return {
        success: false,
        message: 'Failed to play track',
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Pause playback
   */
  async pause(accessToken = null) {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Spotify API not configured'
        };
      }

      const token = await this.ensureValidToken(accessToken);

      await axios.put(
        `${this.baseUrl}/me/player/pause`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        message: 'Playback paused',
        voiceResponse: 'Paused'
      };
    } catch (error) {
      console.error('[SPOTIFY-PAUSE-ERROR]:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to pause playback',
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Resume playback
   */
  async resume(accessToken = null) {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Spotify API not configured'
        };
      }

      const token = await this.ensureValidToken(accessToken);

      await axios.put(
        `${this.baseUrl}/me/player/play`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        message: 'Playback resumed',
        voiceResponse: 'Resumed'
      };
    } catch (error) {
      console.error('[SPOTIFY-RESUME-ERROR]:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to resume playback',
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Skip to next track
   */
  async next(accessToken = null) {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Spotify API not configured'
        };
      }

      const token = await this.ensureValidToken(accessToken);

      await axios.post(
        `${this.baseUrl}/me/player/next`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        message: 'Skipped to next track',
        voiceResponse: 'Next song'
      };
    } catch (error) {
      console.error('[SPOTIFY-NEXT-ERROR]:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to skip track',
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Skip to previous track
   */
  async previous(accessToken = null) {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Spotify API not configured'
        };
      }

      const token = await this.ensureValidToken(accessToken);

      await axios.post(
        `${this.baseUrl}/me/player/previous`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        message: 'Skipped to previous track',
        voiceResponse: 'Previous song'
      };
    } catch (error) {
      console.error('[SPOTIFY-PREVIOUS-ERROR]:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to go to previous track',
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Set volume
   */
  async setVolume(volumePercent, accessToken = null) {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Spotify API not configured'
        };
      }

      const token = await this.ensureValidToken(accessToken);

      await axios.put(
        `${this.baseUrl}/me/player/volume`,
        null,
        {
          params: {
            volume_percent: volumePercent
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        message: `Volume set to ${volumePercent}%`,
        voiceResponse: `Volume set to ${volumePercent} percent`
      };
    } catch (error) {
      console.error('[SPOTIFY-VOLUME-ERROR]:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to set volume',
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Get currently playing track
   */
  async getCurrentlyPlaying(accessToken = null) {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Spotify API not configured'
        };
      }

      const token = await this.ensureValidToken(accessToken);

      const response = await axios.get(
        `${this.baseUrl}/me/player/currently-playing`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.data || !response.data.item) {
        return {
          success: true,
          isPlaying: false,
          message: 'Nothing is currently playing'
        };
      }

      const track = response.data.item;
      return {
        success: true,
        isPlaying: response.data.is_playing,
        track: {
          name: track.name,
          artists: track.artists.map(a => a.name).join(', '),
          album: track.album.name,
          duration: Math.floor(track.duration_ms / 1000),
          progress: Math.floor(response.data.progress_ms / 1000)
        },
        voiceResponse: `Currently playing: ${track.name} by ${track.artists.map(a => a.name).join(', ')}`
      };
    } catch (error) {
      console.error('[SPOTIFY-CURRENT-ERROR]:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to get current track',
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Get available devices
   */
  async getDevices(accessToken = null) {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Spotify API not configured'
        };
      }

      const token = await this.ensureValidToken(accessToken);

      const response = await axios.get(
        `${this.baseUrl}/me/player/devices`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        devices: response.data.devices.map(device => ({
          id: device.id,
          name: device.name,
          type: device.type,
          isActive: device.is_active,
          volumePercent: device.volume_percent
        })),
        count: response.data.devices.length
      };
    } catch (error) {
      console.error('[SPOTIFY-DEVICES-ERROR]:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to get devices',
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Get fallback URL for opening Spotify web
   */
  getFallbackUrl(query = '') {
    if (query) {
      return {
        success: true,
        url: `https://open.spotify.com/search/${encodeURIComponent(query)}`,
        message: 'Opening Spotify web player'
      };
    }
    return {
      success: true,
      url: 'https://open.spotify.com',
      message: 'Opening Spotify web player'
    };
  }
  /**
   * Search and play a track
   */
  async play(query, accessToken = null) {
    // 1. Search for the track
    const searchResult = await this.searchTrack(query, accessToken);

    if (!searchResult.success || searchResult.tracks.length === 0) {
      return {
        success: false,
        message: 'No tracks found',
        voiceResponse: 'I couldn\'t find that song on Spotify.'
      };
    }

    const track = searchResult.tracks[0];

    // 2. Play the track
    const playResult = await this.playTrack(track.uri, accessToken);

    if (!playResult.success) {
      return playResult;
    }

    return {
      success: true,
      track: track.name,
      artist: track.artists,
      uri: track.uri,
      voiceResponse: `Playing ${track.name} by ${track.artists} on Spotify`
    };
  }
}

// Export singleton instance
const spotifyService = new SpotifyService();
export default spotifyService;
