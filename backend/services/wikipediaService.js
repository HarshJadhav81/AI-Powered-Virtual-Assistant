/**
 * Wikipedia Service - Quick Facts & Summaries
 * [COPILOT-UPGRADE]: Wikipedia REST API integration for voice queries
 * API Docs: https://www.mediawiki.org/wiki/API:Main_page
 */

import axios from 'axios';

class WikipediaService {
  constructor() {
    this.baseUrl = 'https://en.wikipedia.org/api/rest_v1';
    this.apiUrl = 'https://en.wikipedia.org/w/api.php';
    this.headers = {
      'User-Agent': 'AI-Assistant/1.0 (mailto:your-email@example.com)'
    };
  }

  /**
   * Search Wikipedia articles
   */
  async search(query, limit = 5) {
    try {
      console.info('[WIKIPEDIA-SERVICE]', `Searching for: ${query}`);

      const response = await axios.get(this.apiUrl, {
        params: {
          action: 'opensearch',
          search: query,
          limit: limit,
          namespace: 0,
          format: 'json'
        },
        headers: this.headers
      });

      // OpenSearch returns: [query, [titles], [descriptions], [urls]]
      const [searchTerm, titles, descriptions, urls] = response.data;

      if (titles.length === 0) {
        return {
          found: false,
          voiceResponse: `No Wikipedia article found for ${query}.`
        };
      }

      const results = titles.map((title, index) => ({
        title,
        description: descriptions[index],
        url: urls[index]
      }));

      return {
        found: true,
        query: searchTerm,
        results,
        voiceResponse: `Found ${titles.length} results for ${query}. Top result: ${titles[0]}.`
      };
    } catch (error) {
      console.error('[WIKIPEDIA-ERROR] Search failed:', error.message);
      console.error('[WIKIPEDIA-ERROR] Full error:', error.response?.data || error);
      throw new Error(`Failed to search Wikipedia: ${error.message}`);
    }
  }

  /**
   * Get article summary
   */
  async getSummary(title) {
    try {
      console.info('[WIKIPEDIA-SERVICE]', `Getting summary for: ${title}`);

      const response = await axios.get(`${this.baseUrl}/page/summary/${encodeURIComponent(title)}`, {
        headers: this.headers
      });
      const data = response.data;

      // Extract concise summary for voice
      const voiceSummary = this.createVoiceSummary(data.extract, 3);

      return {
        title: data.title,
        summary: data.extract,
        description: data.description,
        thumbnail: data.thumbnail?.source || null,
        url: data.content_urls?.desktop?.page || '',
        voiceResponse: `${data.title}: ${voiceSummary}`,
        fullText: data.extract
      };
    } catch (error) {
      console.error('[WIKIPEDIA-ERROR] Summary failed for ${title}:', error.message);
      console.error('[WIKIPEDIA-ERROR] Full error:', error.response?.data || error);
      throw new Error(`Failed to get summary for ${title}: ${error.message}`);
    }
  }

  /**
   * Quick fact lookup (search + summary)
   */
  async quickFact(query) {
    try {
      // First search for the article
      const searchResults = await this.search(query, 1);

      if (!searchResults.found || searchResults.results.length === 0) {
        return {
          found: false,
          voiceResponse: `I couldn't find information about ${query} on Wikipedia.`
        };
      }

      // Get summary of top result
      const topResult = searchResults.results[0];
      const summary = await this.getSummary(topResult.title);

      return {
        found: true,
        query,
        ...summary
      };
    } catch (error) {
      console.error('[WIKIPEDIA-ERROR] QuickFact failed for "${query}":', error.message);
      console.error('[WIKIPEDIA-ERROR] Stack:', error.stack);
      console.error('[WIKIPEDIA-ERROR] Response:', error.response?.data);
      return {
        found: false,
        voiceResponse: `Sorry, I encountered an error looking up ${query}.`,
        error: error.message
      };
    }
  }

  /**
   * Get random article
   */
  async getRandomArticle() {
    try {
      const response = await axios.get(`${this.baseUrl}/page/random/summary`, {
        headers: this.headers
      });
      const data = response.data;

      const voiceSummary = this.createVoiceSummary(data.extract, 2);

      return {
        title: data.title,
        summary: data.extract,
        thumbnail: data.thumbnail?.source || null,
        url: data.content_urls?.desktop?.page || '',
        voiceResponse: `Here's a random fact: ${data.title}. ${voiceSummary}`
      };
    } catch (error) {
      console.error('[WIKIPEDIA-ERROR]:', error.message);
      throw new Error('Failed to get random article');
    }
  }

  /**
   * Create concise voice summary
   */
  createVoiceSummary(text, sentences = 3) {
    if (!text) return '';

    // Split into sentences
    const sentenceArray = text.match(/[^.!?]+[.!?]+/g) || [text];

    // Take first N sentences
    const summary = sentenceArray.slice(0, sentences).join(' ');

    // Limit to ~200 characters for voice
    if (summary.length > 200) {
      return summary.substring(0, 197) + '...';
    }

    return summary;
  }

  /**
   * Get article by exact title
   */
  async getArticle(title) {
    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          action: 'query',
          titles: title,
          prop: 'extracts',
          exintro: true,
          explaintext: true,
          format: 'json'
        },
        headers: this.headers
      });

      const pages = response.data.query.pages;
      const pageId = Object.keys(pages)[0];
      const page = pages[pageId];

      if (pageId === '-1') {
        return {
          found: false,
          voiceResponse: `Article "${title}" not found on Wikipedia.`
        };
      }

      const voiceSummary = this.createVoiceSummary(page.extract, 3);

      return {
        found: true,
        title: page.title,
        content: page.extract,
        pageId: page.pageid,
        voiceResponse: `${page.title}: ${voiceSummary}`,
        url: `https://en.wikipedia.org/?curid=${page.pageid}`
      };
    } catch (error) {
      console.error('[WIKIPEDIA-ERROR]:', error.message);
      throw new Error('Failed to get article');
    }
  }

  /**
   * Get on this day events
   */
  async getOnThisDay() {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();

      const response = await axios.get(
        `${this.baseUrl}/feed/onthisday/events/${month}/${day}`,
        { headers: this.headers }
      );

      const events = response.data.events.slice(0, 3);

      let voiceResponse = `On this day in history: `;
      events.forEach((event, index) => {
        voiceResponse += `In ${event.year}, ${event.text}. `;
      });

      return {
        date: `${month}/${day}`,
        events: events.map(e => ({
          year: e.year,
          text: e.text
        })),
        voiceResponse
      };
    } catch (error) {
      console.error('[WIKIPEDIA-ERROR]:', error.message);
      throw new Error('Failed to get on this day events');
    }
  }
}

// Export singleton instance
const wikipediaService = new WikipediaService();
export default wikipediaService;
