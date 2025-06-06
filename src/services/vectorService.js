const { index } = require('../config/pinecone');
const logger = require('../utils/logger');

class VectorService {
    /**
     * Upsert vectors to Pinecone
     * @param {Array} vectors - Array of {id, values, metadata}
     */
    async upsertVectors(vectors) {
        try {
            await index.upsert(vectors);
            logger.info(`Upserted ${vectors.length} vectors to Pinecone`);
        } catch (error) {
            logger.error('Error upserting vectors:', error);
            throw error;
        }
    }

    /**
     * Search similar vectors
     * @param {number[]} queryVector - Query embedding
     * @param {number} topK - Number of results to return
     * @returns {Promise<Object>} - Search results
     */
    async searchSimilar(queryVector, topK = 5) {
        try {
            const results = await index.query({
                vector: queryVector,
                topK,
                includeMetadata: true,
                includeValues: false,
            });

            logger.info(`Found ${results.matches.length} similar vectors`);
            return results;
        } catch (error) {
            logger.error('Error searching vectors:', error);
            throw error;
        }
    }

    /**
     * Delete vectors by IDs
     * @param {string[]} ids - Array of vector IDs to delete
     */
    async deleteVectors(ids) {
        try {
            await index.deleteMany(ids);
            logger.info(`Deleted ${ids.length} vectors from Pinecone`);
        } catch (error) {
            logger.error('Error deleting vectors:', error);
            throw error;
        }
    }
}

module.exports = new VectorService();