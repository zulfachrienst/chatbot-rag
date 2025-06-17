const { index } = require('../config/pinecone');
const logger = require('../utils/logger');

class VectorService {
    /**
     * Upsert vectors to Pinecone
     * @param {Array} vectors - Array of {id, values, metadata}
     */
    async upsertVectors(vectors) {
        const startTime = Date.now();
        const endpoint = '/vectorService/upsertVectors';
        const request_id = logger.generateRequestId();
        try {
            await index.upsert(vectors);
            await logger.info(`Upserted ${vectors.length} vectors to Pinecone`, {
                source: 'Vector Service',
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                message: `Upserted ${vectors.length} vectors to Pinecone`,
                details: { vectors }
            });
        } catch (error) {
            await logger.error('Error upserting vectors', {
                source: 'Vector Service',
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                message: error.message,
                details: error.stack || error
            });
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
        const startTime = Date.now();
        const endpoint = '/vectorService/searchSimilar';
        const request_id = logger.generateRequestId();
        try {
            const results = await index.query({
                vector: queryVector,
                topK,
                includeMetadata: true,
                includeValues: false,
            });

            await logger.info(`Found ${results.matches.length} similar vectors`, {
                source: 'Vector Service',
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                message: `Found ${results.matches.length} similar vectors`,
                details: { topK, matches: results.matches }
            });
            return results;
        } catch (error) {
            await logger.error('Error searching vectors', {
                source: 'Vector Service',
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                message: error.message,
                details: error.stack || error
            });
            throw error;
        }
    }

    /**
     * Delete vectors by IDs
     * @param {string[]} ids - Array of vector IDs to delete
     */
    async deleteVectors(ids) {
        const startTime = Date.now();
        const endpoint = '/vectorService/deleteVectors';
        const request_id = logger.generateRequestId();
        try {
            await index.deleteMany(ids);
            await logger.info(`Deleted ${ids.length} vectors from Pinecone`, {
                source: 'Vector Service',
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                message: `Deleted ${ids.length} vectors from Pinecone`,
                details: { ids }
            });
        } catch (error) {
            await logger.error('Error deleting vectors', {
                source: 'Vector Service',
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                message: error.message,
                details: error.stack || error
            });
            throw error;
        }
    }
}

module.exports = new VectorService();