/**
 * Response Cache Service
 * Intelligent caching system for AI responses
 * Uses LRU (Least Recently Used) cache strategy
 * 
 * Performance: <10ms for cached queries
 */

class ResponseCacheService {
    constructor(options = {}) {
        this.maxSize = options.maxSize || 1000; // Maximum cache entries
        this.ttl = options.ttl || 3600000; // Time to live: 1 hour
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            evictions: 0
        };
    }

    /**
     * Normalize query for cache key
     */
    normalizeKey(query) {
        return query
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, '') // Remove special characters
            .replace(/\s+/g, ' '); // Normalize whitespace
    }

    /**
     * Generate cache key
     */
    getCacheKey(query, userId = 'default') {
        const normalized = this.normalizeKey(query);
        return `${userId}:${normalized}`;
    }

    /**
     * Get cached response
     */
    get(query, userId = 'default') {
        const key = this.getCacheKey(query, userId);
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // Check if expired
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            this.stats.misses++;
            this.stats.evictions++;
            return null;
        }

        // Update access time for LRU
        entry.lastAccessed = Date.now();
        this.stats.hits++;

        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);

        console.log(`[CACHE-HIT] Query: "${query}" (${this.getHitRate()}% hit rate)`);
        return entry.data;
    }

    /**
     * Set cache entry
     */
    set(query, data, userId = 'default') {
        const key = this.getCacheKey(query, userId);

        // Evict oldest entry if cache is full
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
            this.stats.evictions++;
        }

        const entry = {
            data,
            timestamp: Date.now(),
            lastAccessed: Date.now(),
            query: query
        };

        this.cache.set(key, entry);
        this.stats.sets++;

        console.log(`[CACHE-SET] Query: "${query}" (Cache size: ${this.cache.size}/${this.maxSize})`);
    }

    /**
     * Check if query is cached
     */
    has(query, userId = 'default') {
        const key = this.getCacheKey(query, userId);
        const entry = this.cache.get(key);

        if (!entry) return false;

        // Check if expired
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Clear cache
     */
    clear() {
        this.cache.clear();
        console.log('[CACHE] Cache cleared');
    }

    /**
     * Clear expired entries
     */
    clearExpired() {
        const now = Date.now();
        let cleared = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.ttl) {
                this.cache.delete(key);
                cleared++;
            }
        }

        if (cleared > 0) {
            console.log(`[CACHE] Cleared ${cleared} expired entries`);
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            ...this.stats,
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: this.getHitRate(),
            memoryUsage: this.getMemoryUsage()
        };
    }

    /**
     * Get cache hit rate percentage
     */
    getHitRate() {
        const total = this.stats.hits + this.stats.misses;
        if (total === 0) return 0;
        return ((this.stats.hits / total) * 100).toFixed(2);
    }

    /**
     * Estimate memory usage
     */
    getMemoryUsage() {
        let bytes = 0;
        for (const [key, entry] of this.cache.entries()) {
            bytes += key.length * 2; // Approximate string size
            bytes += JSON.stringify(entry.data).length * 2;
        }
        return {
            bytes,
            kb: (bytes / 1024).toFixed(2),
            mb: (bytes / (1024 * 1024)).toFixed(2)
        };
    }

    /**
     * Remove specific entry
     */
    delete(query, userId = 'default') {
        const key = this.getCacheKey(query, userId);
        return this.cache.delete(key);
    }

    /**
     * Get all cache keys
     */
    getKeys() {
        return Array.from(this.cache.keys());
    }

    /**
     * Should cache this query?
     */
    shouldCache(query, intentType) {
        // Don't cache very short queries
        if (query.length < 3) return false;

        // Don't cache personal/time-sensitive queries
        const noCacheIntents = [
            'get-time',
            'get-date',
            'weather-show', // Weather changes
            'read-news', // News changes
            'gmail-check',
            'gmail-read',
            'calendar-today'
        ];

        if (noCacheIntents.includes(intentType)) {
            return false;
        }

        return true;
    }
}

// Export singleton instance with default config
const responseCacheService = new ResponseCacheService({
    maxSize: 1000,
    ttl: 3600000 // 1 hour
});

// Clear expired entries every 5 minutes
setInterval(() => {
    responseCacheService.clearExpired();
}, 300000);

export default responseCacheService;
