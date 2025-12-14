/**
 * Perplexity-Style Web Search Service
 * Aggregates results from multiple free sources
 * 100% FREE - Uses public APIs and web scraping
 */

import axios from 'axios';

class PerplexitySearchService {
    constructor() {
        this.sources = {
            wikipedia: true,
            duckduckgo: true,
            google: false, // Requires API key
            news: true
        };
    }

    /**
     * Main search function - Perplexity style
     * Searches multiple sources and aggregates results
     */
    async search(query, options = {}) {
        const startTime = Date.now();
        console.info('[PERPLEXITY-SEARCH] Query:', query);

        try {
            // Search multiple sources in parallel
            const searchPromises = [];

            if (this.sources.wikipedia) {
                searchPromises.push(this.searchWikipedia(query));
            }

            if (this.sources.duckduckgo) {
                searchPromises.push(this.searchDuckDuckGo(query));
            }

            if (this.sources.news) {
                searchPromises.push(this.searchNews(query));
            }

            // Wait for all searches to complete
            const results = await Promise.allSettled(searchPromises);

            // Aggregate and rank results
            const aggregatedResults = this.aggregateResults(results);

            // Generate summary
            const summary = this.generateSummary(aggregatedResults, query);

            const latency = Date.now() - startTime;
            console.info('[PERPLEXITY-SEARCH] Completed in', latency, 'ms');

            return {
                success: true,
                query,
                summary: summary.text,
                answer: summary.answer,
                sources: aggregatedResults.sources,
                results: aggregatedResults.items,
                latency,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('[PERPLEXITY-SEARCH] Error:', error);
            return {
                success: false,
                query,
                error: error.message,
                summary: 'I encountered an error while searching. Please try again.',
                sources: []
            };
        }
    }

    /**
     * Search Wikipedia
     */
    async searchWikipedia(query) {
        try {
            const response = await axios.get('https://en.wikipedia.org/w/api.php', {
                params: {
                    action: 'query',
                    list: 'search',
                    srsearch: query,
                    format: 'json',
                    origin: '*',
                    srlimit: 3
                },
                timeout: 3000
            });

            const results = response.data.query.search.map(item => ({
                title: item.title,
                snippet: item.snippet.replace(/<[^>]*>/g, ''), // Remove HTML tags
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
                source: 'Wikipedia',
                score: item.wordcount || 0
            }));

            return { source: 'wikipedia', results };
        } catch (error) {
            console.error('[PERPLEXITY-SEARCH] Wikipedia error:', error.message);
            return { source: 'wikipedia', results: [] };
        }
    }

    /**
     * Search DuckDuckGo Instant Answer API
     */
    async searchDuckDuckGo(query) {
        try {
            const response = await axios.get('https://api.duckduckgo.com/', {
                params: {
                    q: query,
                    format: 'json',
                    no_html: 1,
                    skip_disambig: 1
                },
                timeout: 3000
            });

            const data = response.data;
            const results = [];

            // Abstract (main answer)
            if (data.Abstract) {
                results.push({
                    title: data.Heading || query,
                    snippet: data.Abstract,
                    url: data.AbstractURL,
                    source: 'DuckDuckGo',
                    score: 100
                });
            }

            // Related topics
            if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                data.RelatedTopics.slice(0, 3).forEach(topic => {
                    if (topic.Text) {
                        results.push({
                            title: topic.Text.split(' - ')[0],
                            snippet: topic.Text,
                            url: topic.FirstURL,
                            source: 'DuckDuckGo',
                            score: 50
                        });
                    }
                });
            }

            return { source: 'duckduckgo', results };
        } catch (error) {
            console.error('[PERPLEXITY-SEARCH] DuckDuckGo error:', error.message);
            return { source: 'duckduckgo', results: [] };
        }
    }

    /**
     * Search news (using free news APIs)
     */
    async searchNews(query) {
        try {
            // Using NewsAPI free tier (requires API key in .env)
            // Alternative: Use RSS feeds or public news sources

            // For now, return empty - can be enhanced with NewsAPI key
            return { source: 'news', results: [] };
        } catch (error) {
            console.error('[PERPLEXITY-SEARCH] News error:', error.message);
            return { source: 'news', results: [] };
        }
    }

    /**
     * Aggregate results from multiple sources
     */
    aggregateResults(searchResults) {
        const allResults = [];
        const sources = [];

        searchResults.forEach(result => {
            if (result.status === 'fulfilled' && result.value.results.length > 0) {
                allResults.push(...result.value.results);
                sources.push(result.value.source);
            }
        });

        // Sort by score (descending)
        allResults.sort((a, b) => b.score - a.score);

        // Remove duplicates based on URL
        const uniqueResults = [];
        const seenUrls = new Set();

        allResults.forEach(item => {
            if (item.url && !seenUrls.has(item.url)) {
                seenUrls.add(item.url);
                uniqueResults.push(item);
            }
        });

        return {
            items: uniqueResults.slice(0, 5), // Top 5 results
            sources: [...new Set(sources)]
        };
    }

    /**
     * Generate Perplexity-style summary
     */
    generateSummary(aggregatedResults, query) {
        if (aggregatedResults.items.length === 0) {
            return {
                text: `I couldn't find specific information about "${query}". Please try rephrasing your question.`,
                answer: null
            };
        }

        // Get top result for main answer
        const topResult = aggregatedResults.items[0];

        // Create concise answer
        let answer = topResult.snippet;

        // Limit answer length
        if (answer.length > 300) {
            answer = answer.substring(0, 297) + '...';
        }

        // Format summary with sources
        const sourcesList = aggregatedResults.items.slice(0, 3).map((item, index) =>
            `${index + 1}. [${item.source}] ${item.title} - ${item.url}`
        ).join('\n');

        const summary = `${answer}\n\nSources:\n${sourcesList}`;

        return {
            text: summary,
            answer: answer
        };
    }

    /**
     * Quick fact lookup (optimized for speed)
     */
    async quickFact(query) {
        try {
            // Try DuckDuckGo instant answer first (fastest)
            const ddgResult = await this.searchDuckDuckGo(query);

            if (ddgResult.results.length > 0 && ddgResult.results[0].snippet) {
                return {
                    success: true,
                    answer: ddgResult.results[0].snippet,
                    source: ddgResult.results[0].url,
                    sourceName: 'DuckDuckGo'
                };
            }

            // Fallback to Wikipedia
            const wikiResult = await this.searchWikipedia(query);

            if (wikiResult.results.length > 0) {
                return {
                    success: true,
                    answer: wikiResult.results[0].snippet,
                    source: wikiResult.results[0].url,
                    sourceName: 'Wikipedia'
                };
            }

            return {
                success: false,
                answer: `I couldn't find a quick answer for "${query}".`
            };
        } catch (error) {
            console.error('[PERPLEXITY-SEARCH] Quick fact error:', error);
            return {
                success: false,
                answer: 'An error occurred while searching.'
            };
        }
    }

    /**
     * Stream search results (for real-time display)
     */
    async *searchStream(query) {
        yield { type: 'start', query };

        // Search Wikipedia first (usually fastest)
        const wikiResults = await this.searchWikipedia(query);
        if (wikiResults.results.length > 0) {
            yield { type: 'result', source: 'wikipedia', data: wikiResults.results[0] };
        }

        // Then DuckDuckGo
        const ddgResults = await this.searchDuckDuckGo(query);
        if (ddgResults.results.length > 0) {
            yield { type: 'result', source: 'duckduckgo', data: ddgResults.results[0] };
        }

        yield { type: 'end' };
    }
}

// Export singleton instance
const perplexitySearchService = new PerplexitySearchService();
export default perplexitySearchService;
