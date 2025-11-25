import { jest } from '@jest/globals';
import searchService from '../../services/searchService.js';

describe('search Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct base URL', () => {
      expect(searchService.baseUrl).toBe('https://www.googleapis.com/customsearch/v1');
    });

    it('should check if API is configured', () => {
      const result = searchService.isConfigured();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('fallback functionality', () => {
    it('should provide fallback web search URL', () => {
      const result = searchService.getFallbackResults('test query');
      
      expect(result.fallback).toBe(true);
      expect(result.url).toContain('google.com/search');
      expect(result.url).toContain('test%20query');
      expect(result.voiceResponse).toContain('test query');
    });

    it('should provide fallback image search URL', () => {
      const result = searchService.getFallbackResults('cats', 'images');
      
      expect(result.fallback).toBe(true);
      expect(result.url).toContain('tbm=isch');
      expect(result.voiceResponse).toContain('images');
    });

    it('should provide fallback news search URL', () => {
      const result = searchService.getFallbackResults('technology', 'news');
      
      expect(result.fallback).toBe(true);
      expect(result.url).toContain('tbm=nws');
      expect(result.voiceResponse).toContain('news');
    });
  });

  describe('data formatting', () => {
    it('should format search results correctly', () => {
      const mockData = {
        items: [
          {
            title: 'Test Result 1',
            snippet: 'This is a test snippet',
            link: 'https://example.com/1',
            displayLink: 'example.com'
          },
          {
            title: 'Test Result 2',
            snippet: 'Another test snippet',
            link: 'https://example.com/2',
            displayLink: 'example.com'
          }
        ],
        searchInformation: { totalResults: '100' }
      };

      const result = searchService.formatResults(mockData, 'test query');
      
      expect(result.results).toHaveLength(2);
      expect(result.results[0].title).toBe('Test Result 1');
      expect(result.voiceResponse).toContain('test query');
      expect(result.fallback).toBe(false);
    });

    it('should format image results correctly', () => {
      const mockData = {
        items: [
          {
            title: 'Image 1',
            link: 'https://example.com/img1.jpg',
            image: {
              thumbnailLink: 'https://example.com/thumb1.jpg',
              contextLink: 'https://example.com/page1'
            }
          }
        ]
      };

      const result = searchService.formatImageResults(mockData, 'test images');
      
      expect(result.images).toHaveLength(1);
      expect(result.images[0].url).toBe('https://example.com/img1.jpg');
      expect(result.voiceResponse).toContain('Found 1 images');
      expect(result.fallback).toBe(false);
    });

    it('should handle empty search results', () => {
      const mockData = { items: [] };
      
      const result = searchService.formatResults(mockData, 'test query');
      
      expect(result.results).toHaveLength(0);
      expect(result.fallback).toBe(true);
      expect(result.voiceResponse).toContain('No web results found');
    });
  });

  describe('error handling', () => {
    it('should return fallback on search error', async () => {
      if (searchService.isConfigured()) {
        // Only test if API is configured
        const result = await searchService.search('test');
        expect(result).toBeDefined();
      } else {
        // Should return fallback
        const result = await searchService.search('test');
        expect(result.fallback).toBe(true);
      }
    });
  });

  describe('quick answer feature', () => {
    it('should provide quick answer structure', async () => {
      const result = await searchService.getQuickAnswer('what is nodejs');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('found');
      expect(result).toHaveProperty('voiceResponse');
    });
  });
});
