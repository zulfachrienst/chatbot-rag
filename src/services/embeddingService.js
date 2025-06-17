const hf = require('../config/huggingface');
const logger = require('../utils/logger');

class EmbeddingService {
    /**
     * Generate embeddings using HuggingFace sentence-transformers
     * @param {string} text - Text to embed
     * @param {number} retries - Jumlah percobaan ulang jika gagal (default 5)
     * @returns {Promise<number[]>} - Embedding vector
     */
    async generateEmbedding(text, retries = 5) {
        let lastError;
        const endpoint = '/embeddingService/generateEmbedding';
        const startTime = Date.now();
        const request_id = logger.generateRequestId();
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await hf.featureExtraction({
                    provider: "hf-inference",
                    model: 'sentence-transformers/all-MiniLM-L6-v2',
                    inputs: text,
                });

                // Handle different response formats
                let embedding;
                if (Array.isArray(response) && Array.isArray(response[0])) {
                    embedding = response[0];
                } else if (Array.isArray(response)) {
                    embedding = response;
                } else {
                    throw new Error('Unexpected embedding format');
                }

                await logger.info(`Generated embedding for text: "${text.substring(0, 50)}..."`, {
                    source: 'Embedding Service',
                    request_id,
                    endpoint,
                    response_time: Date.now() - startTime,
                    message: `Generated embedding for text: "${text.substring(0, 50)}..."`,
                    details: { text }
                });
                return embedding;
            } catch (error) {
                lastError = error;
                // Cek apakah error karena fetch/timeout
                const isTimeout =
                    error.code === 'ETIMEDOUT' ||
                    error.code === 'UND_ERR_CONNECT_TIMEOUT' ||
                    error.message?.includes('fetch failed') ||
                    error.message?.toLowerCase().includes('timeout');
                if (isTimeout && attempt < retries) {
                    await logger.warn(`Embedding fetch failed (attempt ${attempt + 1}), retrying...`, {
                        source: 'Embedding Service',
                        request_id,
                        endpoint,
                        response_time: Date.now() - startTime,
                        message: `Embedding fetch failed (attempt ${attempt + 1}), retrying...`,
                        details: { error, attempt }
                    });
                    await new Promise(res => setTimeout(res, 1000 * (attempt + 1))); // Exponential backoff
                    continue;
                }
                await logger.error('Error generating embedding', {
                    source: 'Embedding Service',
                    request_id,
                    endpoint,
                    response_time: Date.now() - startTime,
                    message: error.message,
                    details: error.stack || error
                });
                break;
            }
        }
        throw new Error('Failed to generate embedding');
    }

    /**
     * Generate embeddings for multiple texts
     * @param {string[]} texts - Array of texts to embed
     * @returns {Promise<number[][]>} - Array of embedding vectors
     */
    async generateBatchEmbeddings(texts) {
        const endpoint = '/embeddingService/generateBatchEmbeddings';
        const startTime = Date.now();
        const request_id = logger.generateRequestId();
        try {
            const embeddings = await Promise.all(
                texts.map(text => this.generateEmbedding(text))
            );
            await logger.info('Generated batch embeddings', {
                source: 'Embedding Service',
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                message: 'Generated batch embeddings',
                details: { count: texts.length }
            });
            return embeddings;
        } catch (error) {
            await logger.error('Error generating batch embeddings', {
                source: 'Embedding Service',
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

module.exports = new EmbeddingService();