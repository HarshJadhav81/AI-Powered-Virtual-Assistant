
import { commonKnowledge } from '../data/offlineKnowledge.js';

class MetadataService {
    constructor() {
        this.knowledgeBase = commonKnowledge;
    }

    /**
     * Search for a fact in the local knowledge base
     * @param {string} query 
     */
    search(query) {
        const normalizedQuery = query.toLowerCase();

        // Simple keyword matching 
        // A match occurs if ALL keywords in a definition are found in the query
        // OR if a significant number of keywords match.

        for (const item of this.knowledgeBase) {
            // Check if all keywords are present in the query
            // We use 'every' for strict matching to avoid false positives
            // e.g. "capital of india" should match ['capital', 'india']
            const allKeywordsMatch = item.keywords.every(keyword =>
                normalizedQuery.includes(keyword)
            );

            if (allKeywordsMatch) {
                return {
                    found: true,
                    response: item.answer,
                    confidence: 0.95
                };
            }
        }

        return { found: false };
    }
}

const metadataService = new MetadataService();
export default metadataService;
