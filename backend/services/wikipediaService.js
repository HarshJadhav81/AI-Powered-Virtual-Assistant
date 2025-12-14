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
   * Get comprehensive article data (enhanced for full information)
   */
  async getSummary(title) {
    try {
      console.info('[WIKIPEDIA-SERVICE]', `Getting comprehensive data for: ${title}`);

      // Get summary data
      const summaryResponse = await axios.get(`${this.baseUrl}/page/summary/${encodeURIComponent(title)}`, {
        headers: this.headers
      });
      const summaryData = summaryResponse.data;

      // Get full page content with all sections
      let fullContent = summaryData.extract;
      let sections = [];
      let images = summaryData.thumbnail ? [summaryData.thumbnail.source] : [];

      try {
        // Fetch full article content using MediaWiki API
        const contentResponse = await axios.get(this.apiUrl, {
          params: {
            action: 'query',
            prop: 'extracts|pageimages|images',
            exintro: false, // Get full article, not just intro
            explaintext: true, // Plain text format
            piprop: 'thumbnail|original',
            pithumbsize: 500,
            titles: title,
            format: 'json',
            imlimit: 10 // Get up to 10 images
          },
          headers: this.headers
        });

        const pages = contentResponse.data.query.pages;
        const pageId = Object.keys(pages)[0];
        const pageData = pages[pageId];

        if (pageData && pageData.extract) {
          fullContent = pageData.extract;
        }

        // Get additional images
        if (pageData && pageData.thumbnail) {
          images.push(pageData.thumbnail.source);
        }
        if (pageData && pageData.original) {
          images.push(pageData.original.source);
        }

        // Fetch all images from the article
        if (pageData && pageData.images) {
          for (const img of pageData.images.slice(0, 5)) {
            try {
              const imgResponse = await axios.get(this.apiUrl, {
                params: {
                  action: 'query',
                  titles: img.title,
                  prop: 'imageinfo',
                  iiprop: 'url',
                  format: 'json'
                },
                headers: this.headers
              });
              const imgPages = imgResponse.data.query.pages;
              const imgPageId = Object.keys(imgPages)[0];
              if (imgPages[imgPageId].imageinfo && imgPages[imgPageId].imageinfo[0]) {
                images.push(imgPages[imgPageId].imageinfo[0].url);
              }
            } catch (imgError) {
              // Skip failed images
            }
          }
        }

        // Get article sections
        try {
          const sectionsResponse = await axios.get(this.apiUrl, {
            params: {
              action: 'parse',
              page: title,
              prop: 'sections',
              format: 'json'
            },
            headers: this.headers
          });

          if (sectionsResponse.data.parse && sectionsResponse.data.parse.sections) {
            sections = sectionsResponse.data.parse.sections.map(s => ({
              title: s.line,
              level: s.level,
              index: s.index
            }));
          }
        } catch (sectionError) {
          console.warn('[WIKIPEDIA] Could not fetch sections:', sectionError.message);
        }

      } catch (contentError) {
        console.warn('[WIKIPEDIA] Could not fetch full content, using summary:', contentError.message);
      }

      // Extract concise summary for voice (first 3 sentences)
      const voiceSummary = this.createVoiceSummary(summaryData.extract, 3);

      // Remove duplicate images
      images = [...new Set(images)];

      return {
        title: summaryData.title,
        summary: summaryData.extract, // Short summary for card header
        fullContent: fullContent, // Complete article text
        description: summaryData.description,
        thumbnail: summaryData.thumbnail?.source || null,
        images: images, // All available images
        sections: sections, // Article sections
        url: summaryData.content_urls?.desktop?.page || '',
        voiceResponse: `${summaryData.title}: ${voiceSummary}`,
        fullText: fullContent,
        // Additional metadata
        type: summaryData.type,
        lang: summaryData.lang || 'en',
        coordinates: summaryData.coordinates || null
      };
    } catch (error) {
      console.error(`[WIKIPEDIA-ERROR] Summary failed for ${title}:`, error.message);
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

    // Use Intl.Segmenter for robust sentence splitting (handles abbreviations like Mr., U.S., J.A.R.V.I.S. correctly)
    const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
    const segments = Array.from(segmenter.segment(text));

    // Take first N sentences and clean them
    const summary = segments
      .slice(0, sentences)
      .map(s => s.segment.trim())
      .join(' ');

    // Limit to ~250 characters for voice (slightly increased)
    if (summary.length > 250) {
      // Find last space before limit to avoid cutting words
      const cut = summary.substring(0, 250);
      return cut.substring(0, cut.lastIndexOf(' ')) + '...';
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
