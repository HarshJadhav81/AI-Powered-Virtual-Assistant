/**
 * YouTube Service - Video Search & Information
 * Handles YouTube Data API v3 for video search and details
 * API Docs: https://developers.google.com/youtube/v3
 */

import axios from 'axios';

class YouTubeService {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  /**
   * Check if YouTube API is configured
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Search for videos
   */
  async searchVideos(query, maxResults = 10) {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'YouTube API is not configured. Please add YOUTUBE_API_KEY to .env file',
          configRequired: true,
          fallback: true,
          fallbackUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
        };
      }

      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: maxResults,
          key: this.apiKey,
          safeSearch: 'moderate',
          relevanceLanguage: 'en'
        }
      });

      const videos = response.data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails.medium.url,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`
      }));

      return {
        success: true,
        videos,
        count: videos.length,
        query: query,
        voiceResponse: videos.length > 0
          ? `Found ${videos.length} videos. Top result: ${videos[0].title} by ${videos[0].channelTitle}`
          : 'No videos found'
      };
    } catch (error) {
      console.error('[YOUTUBE-SEARCH-ERROR]:', error.response?.data || error.message);

      // Check if API key is invalid
      if (error.response?.status === 400 || error.response?.status === 403) {
        return {
          success: false,
          message: 'YouTube API key is invalid or quota exceeded',
          error: error.response?.data?.error?.message || error.message,
          configRequired: true,
          fallback: true,
          fallbackUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
        };
      }

      return {
        success: false,
        message: 'Failed to search YouTube videos',
        error: error.response?.data?.error?.message || error.message,
        fallback: true,
        fallbackUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
      };
    }
  }

  /**
   * Get video details by ID
   */
  async getVideoDetails(videoId) {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'YouTube API not configured',
          fallback: true,
          fallbackUrl: `https://www.youtube.com/watch?v=${videoId}`
        };
      }

      const response = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoId,
          key: this.apiKey
        }
      });

      if (response.data.items.length === 0) {
        return {
          success: false,
          message: 'Video not found'
        };
      }

      const video = response.data.items[0];

      return {
        success: true,
        video: {
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          channelTitle: video.snippet.channelTitle,
          channelId: video.snippet.channelId,
          publishedAt: video.snippet.publishedAt,
          thumbnail: video.snippet.thumbnails.high.url,
          duration: this.parseDuration(video.contentDetails.duration),
          viewCount: parseInt(video.statistics.viewCount),
          likeCount: parseInt(video.statistics.likeCount),
          commentCount: parseInt(video.statistics.commentCount),
          url: `https://www.youtube.com/watch?v=${video.id}`
        },
        voiceResponse: `${video.snippet.title} by ${video.snippet.channelTitle}. ${this.formatViewCount(video.statistics.viewCount)} views.`
      };
    } catch (error) {
      console.error('[YOUTUBE-DETAILS-ERROR]:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to get video details',
        error: error.response?.data?.error?.message || error.message,
        fallback: true,
        fallbackUrl: `https://www.youtube.com/watch?v=${videoId}`
      };
    }
  }

  /**
   * Get channel information
   */
  async getChannelInfo(channelId) {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'YouTube API not configured',
          fallback: true,
          fallbackUrl: `https://www.youtube.com/channel/${channelId}`
        };
      }

      const response = await axios.get(`${this.baseUrl}/channels`, {
        params: {
          part: 'snippet,statistics,contentDetails',
          id: channelId,
          key: this.apiKey
        }
      });

      if (response.data.items.length === 0) {
        return {
          success: false,
          message: 'Channel not found'
        };
      }

      const channel = response.data.items[0];

      return {
        success: true,
        channel: {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          customUrl: channel.snippet.customUrl,
          publishedAt: channel.snippet.publishedAt,
          thumbnail: channel.snippet.thumbnails.high.url,
          subscriberCount: parseInt(channel.statistics.subscriberCount),
          videoCount: parseInt(channel.statistics.videoCount),
          viewCount: parseInt(channel.statistics.viewCount),
          url: `https://www.youtube.com/channel/${channel.id}`
        },
        voiceResponse: `${channel.snippet.title}. ${this.formatNumber(channel.statistics.subscriberCount)} subscribers. ${this.formatNumber(channel.statistics.videoCount)} videos.`
      };
    } catch (error) {
      console.error('[YOUTUBE-CHANNEL-ERROR]:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to get channel information',
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Search for channels
   */
  async searchChannels(query, maxResults = 10) {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'YouTube API not configured',
          fallback: true,
          fallbackUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAg%253D%253D`
        };
      }

      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          q: query,
          type: 'channel',
          maxResults: maxResults,
          key: this.apiKey
        }
      });

      const channels = response.data.items.map(item => ({
        id: item.id.channelId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium.url,
        url: `https://www.youtube.com/channel/${item.id.channelId}`
      }));

      return {
        success: true,
        channels,
        count: channels.length,
        voiceResponse: channels.length > 0
          ? `Found ${channels.length} channels. Top result: ${channels[0].title}`
          : 'No channels found'
      };
    } catch (error) {
      console.error('[YOUTUBE-CHANNEL-SEARCH-ERROR]:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to search channels',
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Get trending videos
   */
  async getTrendingVideos(maxResults = 10, regionCode = 'US') {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'YouTube API not configured',
          fallback: true,
          fallbackUrl: 'https://www.youtube.com/feed/trending'
        };
      }

      const response = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          part: 'snippet,statistics',
          chart: 'mostPopular',
          regionCode: regionCode,
          maxResults: maxResults,
          key: this.apiKey
        }
      });

      const videos = response.data.items.map(item => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails.medium.url,
        viewCount: parseInt(item.statistics.viewCount),
        likeCount: parseInt(item.statistics.likeCount),
        url: `https://www.youtube.com/watch?v=${item.id}`
      }));

      return {
        success: true,
        videos,
        count: videos.length,
        voiceResponse: `Here are the top ${videos.length} trending videos`
      };
    } catch (error) {
      console.error('[YOUTUBE-TRENDING-ERROR]:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to get trending videos',
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Parse ISO 8601 duration to seconds
   */
  parseDuration(isoDuration) {
    const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

    if (!match) {
      return {
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        formatted: '0:00'
      };
    }

    const hours = (match[1] || '0H').replace('H', '');
    const minutes = (match[2] || '0M').replace('M', '');
    const seconds = (match[3] || '0S').replace('S', '');

    return {
      hours: parseInt(hours),
      minutes: parseInt(minutes),
      seconds: parseInt(seconds),
      totalSeconds: parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds),
      formatted: `${hours !== '0' ? hours + ':' + minutes.toString().padStart(2, '0') : minutes}:${seconds.toString().padStart(2, '0')}`
    };
  }

  /**
   * Format view count
   */
  formatViewCount(count) {
    const num = parseInt(count);
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(1)}B`;
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }

  /**
   * Format number with commas
   */
  formatNumber(num) {
    return parseInt(num).toLocaleString('en-US');
  }

  /**
   * Get fallback URL for YouTube
   */
  getFallbackUrl(query = '') {
    if (query) {
      return {
        success: true,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        message: 'Opening YouTube search'
      };
    }
    return {
      success: true,
      url: 'https://www.youtube.com',
      message: 'Opening YouTube'
    };
  }
}

// Export singleton instance
const youtubeService = new YouTubeService();
export default youtubeService;
