/**
 * Search Service - Google Custom Search API
 * [COPILOT-UPGRADE]: Intelligent web search with voice results
 * API Docs: https://developers.google.com/custom-search
 */

import axios from 'axios';

class SearchService {
  constructor() {
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
    this.baseUrl = 'https://www.googleapis.com/customsearch/v1';
  }

  /**
   * Perform web search
   */
  async search(query, options = {}) {
    try {
      console.info('[SEARCH-SERVICE]', `Searching for: ${query}`);

      if (!this.isConfigured()) {
        // Fallback to Google search URL
        return this.getFallbackResults(query);
      }

      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: query,
          num: options.limit || 5,
          safe: options.safeSearch || 'active',
          lr: options.language || 'lang_en',
          ...options.params
        }
      });

      return this.formatResults(response.data, query);
    } catch (error) {
      console.error('[SEARCH-ERROR]:', error.response?.data || error.message);
      return this.getFallbackResults(query);
    }
  }

  /**
   * Image search
   */
  async searchImages(query, limit = 5) {
    try {
      console.info('[SEARCH-SERVICE]', `Image search for: ${query}`);

      if (!this.isConfigured()) {
        return this.getFallbackResults(query, 'images');
      }

      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: query,
          searchType: 'image',
          num: limit,
          safe: 'active'
        }
      });

      return this.formatImageResults(response.data, query);
    } catch (error) {
      console.error('[SEARCH-ERROR]:', error.response?.data || error.message);
      return this.getFallbackResults(query, 'images');
    }
  }

  /**
   * News search
   */
  async searchNews(query, limit = 5) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: query,
          num: limit,
          safe: 'active',
          sort: 'date' // Sort by date for news
        }
      });

      return this.formatResults(response.data, query, 'news');
    } catch (error) {
      console.error('[SEARCH-ERROR]:', error.response?.data || error.message);
      return this.getFallbackResults(query, 'news');
    }
  }

  /**
   * Format search results
   */
  formatResults(data, query, type = 'web') {
    if (!data.items || data.items.length === 0) {
      return {
        results: [],
        voiceResponse: `No ${type} results found for ${query}.`,
        fallback: true,
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`
      };
    }

    const results = data.items.map(item => ({
      title: item.title,
      snippet: item.snippet,
      url: item.link,
      displayUrl: item.displayLink
    }));

    // Create voice response with top 3 results
    let voiceResponse = `Here are the top results for ${query}: `;
    results.slice(0, 3).forEach((result, index) => {
      voiceResponse += `${index + 1}. ${result.title}. ${result.snippet}. `;
    });

    return {
      query,
      results,
      totalResults: data.searchInformation?.totalResults || 0,
      voiceResponse,
      fallback: false
    };
  }

  /**
   * Format image results
   */
  formatImageResults(data, query) {
    if (!data.items || data.items.length === 0) {
      return {
        images: [],
        voiceResponse: `No images found for ${query}.`,
        fallback: true,
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`
      };
    }

    const images = data.items.map(item => ({
      title: item.title,
      url: item.link,
      thumbnail: item.image?.thumbnailLink,
      contextLink: item.image?.contextLink
    }));

    return {
      query,
      images,
      count: images.length,
      voiceResponse: `Found ${images.length} images for ${query}.`,
      fallback: false
    };
  }

  /**
   * Get fallback results when API not configured
   */
  getFallbackResults(query, type = 'web') {
    const urls = {
      web: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      images: `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`,
      news: `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=nws`
    };

    return {
      results: [],
      voiceResponse: `Opening Google ${type} search for ${query}.`,
      fallback: true,
      url: urls[type] || urls.web,
      query
    };
  }

  /**
   * Quick answer (featured snippet simulation)
   */
  async getQuickAnswer(query) {
    try {
      const searchResults = await this.search(query, { limit: 1 });

      if (searchResults.fallback || searchResults.results.length === 0) {
        return {
          found: false,
          voiceResponse: `I don't have a quick answer for ${query}. Let me search Google.`,
          url: searchResults.url
        };
      }

      const topResult = searchResults.results[0];

      return {
        found: true,
        answer: topResult.snippet,
        source: topResult.title,
        url: topResult.url,
        voiceResponse: `According to ${topResult.displayUrl}: ${topResult.snippet}`
      };
    } catch (error) {
      return {
        found: false,
        voiceResponse: `Unable to find answer for ${query}.`
      };
    }
  }

  /**
   * Check if API is configured
   */
  isConfigured() {
    return !!this.apiKey && !!this.searchEngineId;
  }
}

// Export singleton instance
const searchService = new SearchService();
export default searchService;
