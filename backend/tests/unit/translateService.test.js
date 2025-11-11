/**
 * Unit Tests for translateService
 */

import translateService from '../../services/translateService.js';

describe('TranslateService', () => {
  describe('isConfigured', () => {
    test('should return false when API key is missing', () => {
      const originalKey = process.env.GOOGLE_TRANSLATE_API_KEY;
      delete process.env.GOOGLE_TRANSLATE_API_KEY;
      
      const result = translateService.isConfigured();
      
      expect(result).toBe(false);
      
      // Restore
      process.env.GOOGLE_TRANSLATE_API_KEY = originalKey;
    });

    test('should return true when API key is present', () => {
      process.env.GOOGLE_TRANSLATE_API_KEY = 'test-api-key';
      
      const result = translateService.isConfigured();
      
      expect(result).toBe(true);
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
      expect(result).toBe('unknown');
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
      const url = translateService.getFallbackUrl('Hello', 'es', 'en');
      
      expect(url).toContain('translate.google.com');
      expect(url).toContain('sl=en');
      expect(url).toContain('tl=es');
      expect(url).toContain('text=Hello');
    });

    test('should handle auto-detect source language', () => {
      const url = translateService.getFallbackUrl('Hello', 'es');
      
      expect(url).toContain('sl=auto');
    });
  });

  describe('translate', () => {
    test('should return fallback when not configured', async () => {
      delete process.env.GOOGLE_TRANSLATE_API_KEY;
      
      const result = await translateService.translate('Hello', 'es');
      
      expect(result.success).toBe(false);
      expect(result.fallbackUrl).toBeDefined();
      expect(result.fallbackUrl).toContain('translate.google.com');
    });

    test('should handle empty text', async () => {
      process.env.GOOGLE_TRANSLATE_API_KEY = 'test-api-key';
      
      const result = await translateService.translate('', 'es');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle missing target language', async () => {
      process.env.GOOGLE_TRANSLATE_API_KEY = 'test-api-key';
      
      const result = await translateService.translate('Hello');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getSupportedLanguages', () => {
    test('should return common languages when not configured', async () => {
      delete process.env.GOOGLE_TRANSLATE_API_KEY;
      
      const result = await translateService.getSupportedLanguages();
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.languages)).toBe(true);
      expect(result.languages.length).toBe(20); // Common languages count
    });
  });
});
