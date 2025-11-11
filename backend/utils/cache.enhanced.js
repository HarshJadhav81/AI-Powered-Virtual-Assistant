/**
 * Enhanced Caching Utility with Redis Support
 * Provides in-memory and Redis caching with TTL and cache invalidation
 */

import Redis from 'ioredis';
import logger from './logger.enhanced.js';

/**
 * Cache Manager Class
 */
class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.redis = null;
    this.isRedisConnected = false;
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  initializeRedis() {
    // Skip Redis initialization if explicitly disabled
    if (process.env.REDIS_ENABLED === 'false') {
      logger.info('Redis caching disabled, using memory cache only');
      return;
    }

    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB) || 0,
        retryStrategy: (times) => {
          // Stop retrying after 3 attempts
          if (times > 3) {
            logger.info('Redis unavailable, using memory cache only');
            return null;
          }
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false
      };

      this.redis = new Redis(redisConfig);

      this.redis.on('connect', () => {
        this.isRedisConnected = true;
        logger.info('Redis connected successfully');
      });

      this.redis.on('error', (err) => {
        this.isRedisConnected = false;
        // Only log first error, not repeated connection failures
        if (err.message && !err.message.includes('ECONNREFUSED')) {
          logger.warn('Redis connection error, falling back to memory cache', {
            error: err.message
          });
        }
      });

      this.redis.on('close', () => {
        this.isRedisConnected = false;
        logger.debug('Redis connection closed');
      });

    } catch (error) {
      logger.info('Redis not available, using memory cache only', {
        error: error.message
      });
    }
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    try {
      // Try Redis first if connected
      if (this.isRedisConnected) {
        const value = await this.redis.get(key);
        if (value) {
          logger.debug(`Cache HIT (Redis): ${key}`);
          return JSON.parse(value);
        }
      }

      // Fallback to memory cache
      const memoryCacheEntry = this.memoryCache.get(key);
      if (memoryCacheEntry) {
        const { value, expires } = memoryCacheEntry;
        if (!expires || expires > Date.now()) {
          logger.debug(`Cache HIT (Memory): ${key}`);
          return value;
        }
        // Remove expired entry
        this.memoryCache.delete(key);
      }

      logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = 3600) {
    try {
      const serialized = JSON.stringify(value);

      // Set in Redis if connected
      if (this.isRedisConnected) {
        await this.redis.setex(key, ttl, serialized);
        logger.debug(`Cache SET (Redis): ${key}, TTL: ${ttl}s`);
      }

      // Also set in memory cache
      this.memoryCache.set(key, {
        value,
        expires: Date.now() + (ttl * 1000)
      });
      logger.debug(`Cache SET (Memory): ${key}, TTL: ${ttl}s`);

      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async delete(key) {
    try {
      if (this.isRedisConnected) {
        await this.redis.del(key);
      }
      this.memoryCache.delete(key);
      logger.debug(`Cache DELETE: ${key}`);
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Delete all keys matching pattern
   * @param {string} pattern - Key pattern (e.g., 'weather:*')
   * @returns {Promise<number>} Number of keys deleted
   */
  async deletePattern(pattern) {
    try {
      let count = 0;

      // Delete from Redis
      if (this.isRedisConnected) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          count += await this.redis.del(...keys);
        }
      }

      // Delete from memory cache
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
          count++;
        }
      }

      logger.debug(`Cache DELETE PATTERN: ${pattern}, deleted ${count} keys`);
      return count;
    } catch (error) {
      logger.error('Cache delete pattern error', { pattern, error: error.message });
      return 0;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>}
   */
  async has(key) {
    try {
      if (this.isRedisConnected) {
        return await this.redis.exists(key) === 1;
      }
      return this.memoryCache.has(key);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get or set cache with callback
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch data if not cached
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<any>}
   */
  async getOrSet(key, fetchFn, ttl = 3600) {
    try {
      // Try to get from cache
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Fetch data
      const data = await fetchFn();
      
      // Store in cache
      await this.set(key, data, ttl);
      
      return data;
    } catch (error) {
      logger.error('Cache getOrSet error', { key, error: error.message });
      // If cache fails, still try to fetch data
      return await fetchFn();
    }
  }

  /**
   * Clear all cache
   * @returns {Promise<boolean>}
   */
  async clear() {
    try {
      if (this.isRedisConnected) {
        await this.redis.flushdb();
      }
      this.memoryCache.clear();
      logger.info('Cache cleared');
      return true;
    } catch (error) {
      logger.error('Cache clear error', { error: error.message });
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<object>}
   */
  async getStats() {
    const stats = {
      memorySize: this.memoryCache.size,
      redisConnected: this.isRedisConnected
    };

    if (this.isRedisConnected) {
      try {
        const info = await this.redis.info('stats');
        const keyspace = await this.redis.info('keyspace');
        stats.redis = {
          info,
          keyspace
        };
      } catch (error) {
        stats.redisError = error.message;
      }
    }

    return stats;
  }

  /**
   * Close connections
   */
  async close() {
    if (this.redis) {
      await this.redis.quit();
    }
    this.memoryCache.clear();
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

/**
 * Predefined cache keys with TTL
 */
export const CACHE_KEYS = {
  WEATHER: {
    prefix: 'weather',
    ttl: 900, // 15 minutes
    getKey: (location) => `weather:${location.toLowerCase()}`
  },
  NEWS: {
    prefix: 'news',
    ttl: 600, // 10 minutes
    getKey: (category = 'general') => `news:${category}`
  },
  YOUTUBE: {
    prefix: 'youtube',
    ttl: 600, // 10 minutes
    getKey: (query) => `youtube:search:${query.toLowerCase()}`
  },
  TRANSLATION: {
    prefix: 'translation',
    ttl: 86400, // 24 hours (translations don't change)
    getKey: (text, target) => `translation:${target}:${text.substring(0, 50)}`
  },
  SPOTIFY: {
    prefix: 'spotify',
    ttl: 300, // 5 minutes
    getKey: (query) => `spotify:search:${query.toLowerCase()}`
  },
  USER: {
    prefix: 'user',
    ttl: 3600, // 1 hour
    getKey: (userId) => `user:${userId}`
  },
  CONVERSATION: {
    prefix: 'conversation',
    ttl: 7200, // 2 hours
    getKey: (userId) => `conversation:${userId}`
  }
};

/**
 * Cache middleware for Express routes
 */
export const cacheMiddleware = (keyFn, ttl = 600) => {
  return async (req, res, next) => {
    try {
      const key = keyFn(req);
      const cached = await cacheManager.get(key);

      if (cached) {
        logger.debug(`Route cache HIT: ${req.path}`);
        return res.json(cached);
      }

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json
      res.json = (data) => {
        // Cache the response
        cacheManager.set(key, data, ttl);
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { error: error.message });
      next();
    }
  };
};

/**
 * Helper functions for common caching patterns
 */
export const cacheHelpers = {
  /**
   * Cache weather data
   */
  weather: async (location, fetchFn) => {
    const key = CACHE_KEYS.WEATHER.getKey(location);
    return await cacheManager.getOrSet(key, fetchFn, CACHE_KEYS.WEATHER.ttl);
  },

  /**
   * Cache news data
   */
  news: async (category, fetchFn) => {
    const key = CACHE_KEYS.NEWS.getKey(category);
    return await cacheManager.getOrSet(key, fetchFn, CACHE_KEYS.NEWS.ttl);
  },

  /**
   * Cache YouTube search
   */
  youtube: async (query, fetchFn) => {
    const key = CACHE_KEYS.YOUTUBE.getKey(query);
    return await cacheManager.getOrSet(key, fetchFn, CACHE_KEYS.YOUTUBE.ttl);
  },

  /**
   * Cache translations
   */
  translation: async (text, target, fetchFn) => {
    const key = CACHE_KEYS.TRANSLATION.getKey(text, target);
    return await cacheManager.getOrSet(key, fetchFn, CACHE_KEYS.TRANSLATION.ttl);
  },

  /**
   * Cache Spotify search
   */
  spotify: async (query, fetchFn) => {
    const key = CACHE_KEYS.SPOTIFY.getKey(query);
    return await cacheManager.getOrSet(key, fetchFn, CACHE_KEYS.SPOTIFY.ttl);
  },

  /**
   * Invalidate user cache
   */
  invalidateUser: async (userId) => {
    await cacheManager.delete(CACHE_KEYS.USER.getKey(userId));
    await cacheManager.delete(CACHE_KEYS.CONVERSATION.getKey(userId));
  }
};

export default cacheManager;
export { cacheManager };
