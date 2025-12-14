/**
 * Unit Tests for translateService
 */

import translateService from '../../services/translateService.js';

describe('TranslateService', () => {
  describe('isConfigured', () => {
    test('should return false when API key is missing', () => {
      const originalKey = translateService.apiKey;
      translateService.apiKey = '';

      const result = translateService.isConfigured();

      expect(result).toBe(false);

      // Restore
      translateService.apiKey = originalKey;
    });

    test('should return true when API key is present', () => {
      const originalKey = translateService.apiKey;
      translateService.apiKey = 'test-api-key';

      const result = translateService.isConfigured();

      expect(result).toBe(true);

      // Restore
      translateService.apiKey = originalKey;
    });
  });

  describe('getLanguageName', () => {
    test('should return correct language name for valid code', () => {
      const testCases = [
        { code: 'en', expected: 'English' },
        { code: 'es', expected: 'Spanish' },
        { code: 'fr', expected: 'French' },
        { code: 'de', expected: 'German' }
      ];

      testCases.forEach(({ code, expected }) => {
        const result = translateService.getLanguageName(code);
        expect(result).toBe(expected);
      });
    });

    test('should return code itself for unknown language', () => {
      const result = translateService.getLanguageName('unknown');
      expect(result).toBe('UNKNOWN');
    });
  });

  describe('getCommonLanguages', () => {
    test('should return array of common languages', () => {
      const result = translateService.getCommonLanguages();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('code');
      expect(result[0]).toHaveProperty('name');
    });

    test('should include English in common languages', () => {
      const result = translateService.getCommonLanguages();
      const english = result.find(lang => lang.code === 'en');

      expect(english).toBeDefined();
      expect(english.name).toBe('English');
    });
  });

  describe('getFallbackUrl', () => {
    test('should generate correct fallback URL', () => {
      const result = translateService.getFallbackUrl('Hello', 'es', 'en');

      expect(result.url).toContain('translate.google.com');
      expect(result.url).toContain('sl=en');
      expect(result.url).toContain('tl=es');
      expect(result.url).toContain('text=Hello');
    });

    test('should handle auto-detect source language', () => {
      const result = translateService.getFallbackUrl('Hello', 'es');

      expect(result.url).toContain('sl=auto');
    });
  });

  describe('translate', () => {
    test('should return fallback when not configured', async () => {
      const originalKey = translateService.apiKey;
      translateService.apiKey = '';

      const result = await translateService.translate('Hello', 'es');

      expect(result.success).toBe(false);
      expect(result.fallbackUrl).toBeDefined();
      expect(result.fallbackUrl).toContain('translate.google.com');

      // Restore
      translateService.apiKey = originalKey;
    });

    test('should handle empty text', async () => {
      const originalKey = translateService.apiKey;
      translateService.apiKey = 'test-api-key';

      const result = await translateService.translate('', 'es');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Restore
      translateService.apiKey = originalKey;
    });

    test('should handle missing target language', async () => {
      const originalKey = translateService.apiKey;
      translateService.apiKey = 'test-api-key';

      const result = await translateService.translate('Hello');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Restore
      translateService.apiKey = originalKey;
    });
  });

  describe('getSupportedLanguages', () => {
    test('should return common languages when not configured', async () => {
      const originalKey = translateService.apiKey;
      translateService.apiKey = '';

      const result = await translateService.getSupportedLanguages();

      expect(result.success).toBe(false); // It returns false success but provides languages in fallback
      expect(Array.isArray(result.languages)).toBe(true);
      expect(result.languages.length).toBe(20); // Common languages count

      // Restore
      translateService.apiKey = originalKey;
    });
  });
});
