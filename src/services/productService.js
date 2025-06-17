const { db } = require('../config/firebase');
const embeddingService = require('./embeddingService');
const vectorService = require('./vectorService');
const logger = require('../utils/logger');

class ProductService {
    constructor() {
        this.collection = db.collection('products');
    }

    /**
     * Update product by ID in Firestore
     * @param {string} productId
     * @param {Object} updateData
     */
    async updateProduct(productId, updateData) {
        const startTime = Date.now();
        const endpoint = '/productService/updateProduct';
        const request_id = logger.generateRequestId();
        try {
            const docRef = this.collection.doc(productId);
            const doc = await docRef.get();
            if (!doc.exists) {
                await logger.warn('Product not found for update', {
                    source: 'Product Service',
                    request_id,
                    endpoint,
                    response_time: Date.now() - startTime,
                    message: 'Product not found',
                    details: { productId }
                });
                return null;
            }

            await docRef.update({
                ...updateData,
                updatedAt: new Date(),
            });

            // (Opsional) Update embedding & Pinecone jika description/name/category berubah
            // (Implementasi sesuai kebutuhan)

            const updatedDoc = await docRef.get();
            await logger.info('Product updated successfully', {
                source: 'Product Service',
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                details: { id: updatedDoc.id, ...updatedDoc.data() }
            });
            return { id: updatedDoc.id, ...updatedDoc.data() };
        } catch (error) {
            await logger.error('Error updating product', {
                source: 'Product Service',
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
     * Delete product by ID from Firestore and Pinecone
     * @param {string} productId
     */
    async deleteProduct(productId) {
        const startTime = Date.now();
        const endpoint = '/productService/deleteProduct';
        const request_id = logger.generateRequestId();
        try {
            const docRef = this.collection.doc(productId);
            const doc = await docRef.get();
            if (!doc.exists) {
                await logger.warn('Product not found for delete', {
                    source: 'Product Service',
                    request_id,
                    endpoint,
                    response_time: Date.now() - startTime,
                    message: 'Product not found',
                    details: { productId }
                });
                return null;
            }

            await docRef.delete();

            // Hapus dari Pinecone juga
            await vectorService.deleteVectors([productId]);

            await logger.info('Product deleted successfully', {
                source: 'Product Service',
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                details: { id: productId }
            });
            return { id: productId };
        } catch (error) {
            await logger.error('Error deleting product', {
                source: 'Product Service',
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
     * Add new product to Firestore and Pinecone
     * @param {Object} productData - Product information
     */
    async addProduct(productData) {
        const startTime = Date.now();
        const endpoint = '/productService/addProduct';
        const request_id = logger.generateRequestId();
        try {
            // Add to Firestore
            const docRef = await this.collection.add({
                ...productData,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // Generate embedding for product description
            const productText = `${productData.name} ${productData.description} ${productData.category}`;
            const embedding = await embeddingService.generateEmbedding(productText);

            // Add to Pinecone
            await vectorService.upsertVectors([{
                id: docRef.id,
                values: embedding,
                metadata: {
                    name: productData.name,
                    category: productData.category,
                    price: productData.price,
                    description: productData.description.substring(0, 200), // Limit metadata size
                }
            }]);

            await logger.info('Product added successfully', {
                source: 'Product Service',
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                details: { id: docRef.id, ...productData }
            });
            return { id: docRef.id, ...productData };
        } catch (error) {
            await logger.error('Error adding product', {
                source: 'Product Service',
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
     * Get product by ID from Firestore
     * @param {string} productId - Product ID
     */
    async getProduct(productId) {
        const startTime = Date.now();
        const endpoint = '/productService/getProduct';
        const request_id = logger.generateRequestId();
        try {
            const doc = await this.collection.doc(productId).get();
            if (!doc.exists) {
                await logger.warn('Product not found', {
                    source: 'Product Service',
                    request_id,
                    endpoint,
                    response_time: Date.now() - startTime,
                    message: 'Product not found',
                    details: { productId }
                });
                return null;
            }
            await logger.info('Fetched product by ID', {
                source: 'Product Service',
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                details: { id: doc.id, ...doc.data() }
            });
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            await logger.error('Error getting product', {
                source: 'Product Service',
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
     * Search products by similarity
     * @param {string} query - Search query
     * @param {number} limit - Number of results
     */
    async searchProducts(query, limit = 5) {
        const startTime = Date.now();
        const endpoint = '/productService/searchProducts';
        const request_id = logger.generateRequestId();
        try {
            // Generate embedding for query
            const queryEmbedding = await embeddingService.generateEmbedding(query);

            // Search in Pinecone
            const searchResults = await vectorService.searchSimilar(queryEmbedding, limit);

            // Get full product details from Firestore
            const products = await Promise.all(
                searchResults.matches.map(async (match) => {
                    const product = await this.getProduct(match.id);
                    return {
                        ...product,
                        similarity: match.score,
                    };
                })
            );

            await logger.info('Searched products by similarity', {
                source: 'Product Service',
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                details: { query, limit, resultCount: products.length }
            });

            return products.filter(product => product !== null);
        } catch (error) {
            await logger.error('Error searching products', {
                source: 'Product Service',
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
     * Get all products from Firestore
     */
    async getAllProducts() {
        const startTime = Date.now();
        const endpoint = '/productService/getAllProducts';
        const request_id = logger.generateRequestId();
        try {
            const snapshot = await this.collection.get();
            const products = [];
            snapshot.forEach(doc => {
                products.push({ id: doc.id, ...doc.data() });
            });
            await logger.info('Fetched all products', {
                source: 'Product Service',
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                details: { count: products.length }
            });
            return products;
        } catch (error) {
            await logger.error('Error getting all products', {
                source: 'Product Service',
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

module.exports = new ProductService();