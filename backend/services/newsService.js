/**
 * News Service - NewsData.io Integration
 * [COPILOT-UPGRADE]: Free news API for top headlines and category-based news
 * API Docs: https://newsdata.io/documentation
 */

import axios from 'axios';

class NewsService {
  constructor() {
    this.apiKey = process.env.NEWSDATA_API_KEY || '';
    this.baseUrl = 'https://newsdata.io/api/1';
  }

  /**
   * Get top headlines
   */
  async getTopHeadlines(country = 'in', limit = 5) {
    try {
      console.info('[NEWS-SERVICE]', `Fetching top headlines for: ${country}`);
      
      const response = await axios.get(`${this.baseUrl}/news`, {
        params: {
          apikey: this.apiKey,
          country: country,
          language: 'en',
          size: limit
        }
      });

      return this.formatNews(response.data.results, 'headlines');
    } catch (error) {
      console.error('[NEWS-ERROR]:', error.response?.data || error.message);
      throw new Error('Unable to fetch news headlines');
    }
  }

  /**
   * Get news by category
   */
  async getNewsByCategory(category, country = 'in', limit = 5) {
    try {
      console.info('[NEWS-SERVICE]', `Fetching ${category} news`);
      
      const response = await axios.get(`${this.baseUrl}/news`, {
        params: {
          apikey: this.apiKey,
          country: country,
          language: 'en',
          category: category, // business, entertainment, environment, food, health, politics, science, sports, technology, top, tourism, world
          size: limit
        }
      });

      return this.formatNews(response.data.results, category);
    } catch (error) {
      console.error('[NEWS-ERROR]:', error.response?.data || error.message);
      throw new Error(`Unable to fetch ${category} news`);
    }
  }

  /**
   * Search news by keyword
   */
  async searchNews(query, limit = 5) {
    try {
      console.info('[NEWS-SERVICE]', `Searching news for: ${query}`);
      
      const response = await axios.get(`${this.baseUrl}/news`, {
        params: {
          apikey: this.apiKey,
          q: query,
          language: 'en',
          size: limit
        }
      });

      return this.formatNews(response.data.results, query);
    } catch (error) {
      console.error('[NEWS-ERROR]:', error.response?.data || error.message);
      throw new Error(`Unable to search news for ${query}`);
    }
  }

  /**
   * Format news response
   */
  formatNews(articles, context) {
    if (!articles || articles.length === 0) {
      return {
        articles: [],
        voiceResponse: `No news found for ${context}.`
      };
    }

    const formattedArticles = articles.map(article => ({
      title: article.title,
      description: article.description || 'No description available',
      source: article.source_id,
      url: article.link,
      image: article.image_url || null,
      publishedAt: new Date(article.pubDate).toLocaleString(),
      category: article.category?.[0] || 'general'
    }));

    // Create voice response with top 3 headlines
    let voiceResponse = `Here are the top ${context} news: `;
    formattedArticles.slice(0, 3).forEach((article, index) => {
      voiceResponse += `${index + 1}. ${article.title}. `;
    });

    return {
      articles: formattedArticles,
      voiceResponse,
      count: formattedArticles.length
    };
  }

  /**
   * Get news categories
   */
  getAvailableCategories() {
    return [
      'business',
      'entertainment',
      'environment',
      'food',
      'health',
      'politics',
      'science',
      'sports',
      'technology',
      'tourism',
      'world'
    ];
  }

  /**
   * Check if API key is configured
   */
  isConfigured() {
    return !!this.apiKey && this.apiKey !== '';
  }
}

// Export singleton instance
const newsService = new NewsService();
export default newsService;
