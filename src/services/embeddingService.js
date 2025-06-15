const hf = require('../config/huggingface');
const logger = require('../utils/logger');

class EmbeddingService {
    /**
     * Generate embeddings using HuggingFace sentence-transformers
     * @param {string} text - Text to embed
     * @param {number} retries - Jumlah percobaan ulang jika gagal (default 2)
     * @returns {Promise<number[]>} - Embedding vector
     */
    async generateEmbedding(text, retries = 5) {
        let lastError;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await hf.featureExtraction({
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

                logger.info(`Generated embedding for text: "${text.substring(0, 50)}..."`);
                return embedding;
            } catch (error) {
                lastError = error;
                // Cek apakah error karena fetch/timeout
                const isTimeout =
                    error.code === 'ETIMEDOUT' ||
                    error.code === 'UND_ERR_CONNECT_TIMEOUT' || // tambahkan ini
                    error.message?.includes('fetch failed') ||
                    error.message?.toLowerCase().includes('timeout');
                if (isTimeout && attempt < retries) {
                    logger.warn(`Embedding fetch failed (attempt ${attempt + 1}), retrying...`);
                    await new Promise(res => setTimeout(res, 1000 * (attempt + 1))); // Exponential backoff
                    continue;
                }
                logger.error('Error generating embedding:', error);
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
        try {
            const embeddings = await Promise.all(
                texts.map(text => this.generateEmbedding(text))
            );
            return embeddings;
        } catch (error) {
            logger.error('Error generating batch embeddings:', error);
            throw error;
        }
    }
}

module.exports = new EmbeddingService();