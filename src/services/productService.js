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
        try {
            const docRef = this.collection.doc(productId);
            const doc = await docRef.get();
            if (!doc.exists) return null;

            await docRef.update({
                ...updateData,
                updatedAt: new Date(),
            });

            // (Opsional) Update embedding & Pinecone jika description/name/category berubah
            // (Implementasi sesuai kebutuhan)

            const updatedDoc = await docRef.get();
            return { id: updatedDoc.id, ...updatedDoc.data() };
        } catch (error) {
            logger.error('Error updating product:', error);
            throw error;
        }
    }

    /**
     * Delete product by ID from Firestore and Pinecone
     * @param {string} productId
     */
    async deleteProduct(productId) {
        try {
            const docRef = this.collection.doc(productId);
            const doc = await docRef.get();
            if (!doc.exists) return null;

            await docRef.delete();

            // Hapus dari Pinecone juga
            await vectorService.deleteVectors([productId]);

            logger.info(`Deleted product with ID: ${productId}`);
            return { id: productId };
        } catch (error) {
            logger.error('Error deleting product:', error);
            throw error;
        }
    }

    /**
     * Add new product to Firestore and Pinecone
     * @param {Object} productData - Product information
     */
    async addProduct(productData) {
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

            logger.info(`Added product: ${productData.name} with ID: ${docRef.id}`);
            return { id: docRef.id, ...productData };
        } catch (error) {
            logger.error('Error adding product:', error);
            throw error;
        }
    }

    /**
     * Get product by ID from Firestore
     * @param {string} productId - Product ID
     */
    async getProduct(productId) {
        try {
            const doc = await this.collection.doc(productId).get();
            if (!doc.exists) {
                return null;
            }
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            logger.error('Error getting product:', error);
            throw error;
        }
    }

    /**
     * Search products by similarity
     * @param {string} query - Search query
     * @param {number} limit - Number of results
     */
    async searchProducts(query, limit = 5) {
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

            return products.filter(product => product !== null);
        } catch (error) {
            logger.error('Error searching products:', error);
            throw error;
        }
    }

    /**
     * Get all products from Firestore
     */
    async getAllProducts() {
        try {
            const snapshot = await this.collection.get();
            const products = [];
            snapshot.forEach(doc => {
                products.push({ id: doc.id, ...doc.data() });
            });
            return products;
        } catch (error) {
            logger.error('Error getting all products:', error);
            throw error;
        }
    }
}

module.exports = new ProductService();