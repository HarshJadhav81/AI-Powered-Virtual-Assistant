/**
 * Unit Tests for spotifyService
 */

import spotifyService from '../../services/spotifyService.js';

describe('SpotifyService', () => {
  describe('isConfigured', () => {
    test('should return false when credentials are missing', () => {
      const originalId = spotifyService.clientId;
      const originalSecret = spotifyService.clientSecret;

      spotifyService.clientId = '';
      spotifyService.clientSecret = '';

      const result = spotifyService.isConfigured();

      expect(result).toBe(false);

      // Restore
      spotifyService.clientId = originalId;
      spotifyService.clientSecret = originalSecret;
    });

    test('should return true when credentials are present', () => {
      const originalId = spotifyService.clientId;
      const originalSecret = spotifyService.clientSecret;

      spotifyService.clientId = 'test-client-id';
      spotifyService.clientSecret = 'test-client-secret';

      const result = spotifyService.isConfigured();

      expect(result).toBe(true);

      // Restore
      spotifyService.clientId = originalId;
      spotifyService.clientSecret = originalSecret;
    });
  });

  describe('getAuthUrl', () => {
    test('should generate auth URL with correct parameters', () => {
      const originalId = spotifyService.clientId;
      const originalRedirect = spotifyService.redirectUri;

      spotifyService.clientId = 'test-client-id';
      spotifyService.redirectUri = 'http://localhost:8000/callback';

      const result = spotifyService.getAuthUrl();

      expect(result.success).toBe(true);
      expect(result.url).toContain('accounts.spotify.com/authorize');
      expect(result.url).toContain('test-client-id');
      expect(result.url).toContain('response_type=code');

      // Restore
      spotifyService.clientId = originalId;
      spotifyService.redirectUri = originalRedirect;
    });

    test('should return fallback when not configured', () => {
      const originalId = spotifyService.clientId;
      spotifyService.clientId = '';

      const result = spotifyService.getAuthUrl();

      expect(result.success).toBe(false);

      // Restore
      spotifyService.clientId = originalId;
    });
  });

  describe('searchTrack', () => {
    test('should return fallback when not configured', async () => {
      const originalId = spotifyService.clientId;
      spotifyService.clientId = '';

      const result = await spotifyService.searchTrack('test song');

      expect(result.success).toBe(false);
      expect(result.fallbackUrl).toBeDefined();
      expect(result.fallbackUrl).toContain('open.spotify.com');

      // Restore
      spotifyService.clientId = originalId;
    });

    test('should handle empty query', async () => {
      const originalId = spotifyService.clientId;
      spotifyService.clientId = 'test-client-id';

      const result = await spotifyService.searchTrack('');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Restore
      spotifyService.clientId = originalId;
    });
  });

  describe('getFallbackUrl', () => {
    test('should generate correct fallback URL for search', () => {
      const result = spotifyService.getFallbackUrl('test song');

      expect(result.url).toContain('open.spotify.com/search');
      expect(result.url).toContain('test%20song');
    });

    test('should generate correct fallback URL for play', () => {
      const result = spotifyService.getFallbackUrl('album name');

      expect(result.url).toContain('open.spotify.com/search');
    });

    test('should handle missing query parameter', () => {
      const result = spotifyService.getFallbackUrl();

      expect(result.url).toContain('open.spotify.com');
    });
  });
});
