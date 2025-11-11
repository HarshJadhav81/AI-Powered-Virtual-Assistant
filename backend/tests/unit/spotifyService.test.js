/**
 * Unit Tests for spotifyService
 */

import spotifyService from '../../services/spotifyService.js';

describe('SpotifyService', () => {
  describe('isConfigured', () => {
    test('should return false when credentials are missing', () => {
      const originalId = process.env.SPOTIFY_CLIENT_ID;
      const originalSecret = process.env.SPOTIFY_CLIENT_SECRET;
      
      delete process.env.SPOTIFY_CLIENT_ID;
      delete process.env.SPOTIFY_CLIENT_SECRET;
      
      const result = spotifyService.isConfigured();
      
      expect(result).toBe(false);
      
      // Restore
      process.env.SPOTIFY_CLIENT_ID = originalId;
      process.env.SPOTIFY_CLIENT_SECRET = originalSecret;
    });

    test('should return true when credentials are present', () => {
      process.env.SPOTIFY_CLIENT_ID = 'test-client-id';
      process.env.SPOTIFY_CLIENT_SECRET = 'test-client-secret';
      
      const result = spotifyService.isConfigured();
      
      expect(result).toBe(true);
    });
  });

  describe('getAuthUrl', () => {
    test('should generate auth URL with correct parameters', () => {
      process.env.SPOTIFY_CLIENT_ID = 'test-client-id';
      process.env.SPOTIFY_REDIRECT_URI = 'http://localhost:8000/callback';
      
      const result = spotifyService.getAuthUrl();
      
      expect(result.success).toBe(true);
      expect(result.authUrl).toContain('accounts.spotify.com/authorize');
      expect(result.authUrl).toContain('test-client-id');
      expect(result.authUrl).toContain('response_type=code');
    });

    test('should return fallback when not configured', () => {
      delete process.env.SPOTIFY_CLIENT_ID;
      
      const result = spotifyService.getAuthUrl();
      
      expect(result.success).toBe(false);
      expect(result.fallbackUrl).toContain('spotify.com');
    });
  });

  describe('searchTrack', () => {
    test('should return fallback when not configured', async () => {
      delete process.env.SPOTIFY_CLIENT_ID;
      
      const result = await spotifyService.searchTrack('test song');
      
      expect(result.success).toBe(false);
      expect(result.fallbackUrl).toBeDefined();
      expect(result.fallbackUrl).toContain('open.spotify.com');
    });

    test('should handle empty query', async () => {
      process.env.SPOTIFY_CLIENT_ID = 'test-client-id';
      
      const result = await spotifyService.searchTrack('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getFallbackUrl', () => {
    test('should generate correct fallback URL for search', () => {
      const url = spotifyService.getFallbackUrl('search', 'test song');
      
      expect(url).toContain('open.spotify.com/search');
      expect(url).toContain('test%20song');
    });

    test('should generate correct fallback URL for play', () => {
      const url = spotifyService.getFallbackUrl('play', 'album name');
      
      expect(url).toContain('open.spotify.com/search');
    });

    test('should handle missing query parameter', () => {
      const url = spotifyService.getFallbackUrl('search');
      
      expect(url).toContain('open.spotify.com');
    });
  });
});
