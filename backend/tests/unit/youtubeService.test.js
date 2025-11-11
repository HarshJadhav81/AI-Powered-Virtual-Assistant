/**
 * Unit Tests for youtubeService
 */

import youtubeService from '../../services/youtubeService.js';

describe('YoutubeService', () => {
  describe('isConfigured', () => {
    test('should return false when API key is missing', () => {
      const originalKey = process.env.YOUTUBE_API_KEY;
      delete process.env.YOUTUBE_API_KEY;
      
      const result = youtubeService.isConfigured();
      
      expect(result).toBe(false);
      
      // Restore
      process.env.YOUTUBE_API_KEY = originalKey;
    });

    test('should return true when API key is present', () => {
      process.env.YOUTUBE_API_KEY = 'test-api-key';
      
      const result = youtubeService.isConfigured();
      
      expect(result).toBe(true);
    });
  });

  describe('parseDuration', () => {
    test('should parse ISO 8601 duration correctly', () => {
      const testCases = [
        { input: 'PT1H2M3S', expected: '1:02:03' },
        { input: 'PT15M30S', expected: '15:30' },
        { input: 'PT45S', expected: '0:45' },
        { input: 'PT1H', expected: '1:00:00' },
        { input: 'PT2M', expected: '2:00' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = youtubeService.parseDuration(input);
        expect(result).toBe(expected);
      });
    });

    test('should handle invalid duration format', () => {
      const result = youtubeService.parseDuration('invalid');
      expect(result).toBe('0:00');
    });
  });

  describe('formatViewCount', () => {
    test('should format view counts correctly', () => {
      const testCases = [
        { input: 1234, expected: '1.2K' },
        { input: 1234567, expected: '1.2M' },
        { input: 1234567890, expected: '1.2B' },
        { input: 999, expected: '999' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = youtubeService.formatViewCount(input);
        expect(result).toBe(expected);
      });
    });

    test('should handle zero views', () => {
      const result = youtubeService.formatViewCount(0);
      expect(result).toBe('0');
    });
  });

  describe('formatNumber', () => {
    test('should format numbers with commas', () => {
      const testCases = [
        { input: 1000, expected: '1,000' },
        { input: 1234567, expected: '1,234,567' },
        { input: 999, expected: '999' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = youtubeService.formatNumber(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('getFallbackUrl', () => {
    test('should generate correct fallback URL for search', () => {
      const url = youtubeService.getFallbackUrl('search', 'test video');
      
      expect(url).toContain('youtube.com/results');
      expect(url).toContain('search_query=test+video');
    });

    test('should generate correct fallback URL for watch', () => {
      const url = youtubeService.getFallbackUrl('watch', 'dQw4w9WgXcQ');
      
      expect(url).toContain('youtube.com/watch');
      expect(url).toContain('v=dQw4w9WgXcQ');
    });

    test('should handle missing query parameter', () => {
      const url = youtubeService.getFallbackUrl('home');
      
      expect(url).toBe('https://www.youtube.com');
    });
  });

  describe('searchVideos', () => {
    test('should return fallback when not configured', async () => {
      delete process.env.YOUTUBE_API_KEY;
      
      const result = await youtubeService.searchVideos('test query', 5);
      
      expect(result.success).toBe(false);
      expect(result.fallbackUrl).toBeDefined();
      expect(result.fallbackUrl).toContain('youtube.com/results');
    });

    test('should handle empty query', async () => {
      process.env.YOUTUBE_API_KEY = 'test-api-key';
      
      const result = await youtubeService.searchVideos('', 5);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
