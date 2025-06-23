const { db } = require('../config/firebase');
const embeddingService = require('./embeddingService');
const vectorService = require('./vectorService');
const logger = require('../utils/logger');

// Helper untuk slugify nama produk
function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

// Default struktur produk future-proof
const defaultProduct = {
    slug: '',
    name: '',
    description: '',
    category: [],
    tags: [],
    brand: '',
    price: 0,
    discount: { percent: 0, priceAfterDiscount: 0 },
    stock: 0,
    features: [],
    specs: [],
    variants: [],
    images: [],
    rating: { average: 0, count: 0 },
    status: 'active',
    isFeatured: false,
    warehouseLocation: '',
    createdAt: null,
    updatedAt: null
};

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

            // Gabungkan dengan default dan data lama
            const oldData = doc.data();
            const mergedData = {
                ...defaultProduct,
                ...oldData,
                ...updateData,
                updatedAt: new Date(),
                slug: updateData.slug || oldData.slug || slugify(updateData.name || oldData.name || '')
            };

            // Validasi tipe data array/object
            if (!Array.isArray(mergedData.category)) mergedData.category = [];
            if (!Array.isArray(mergedData.tags)) mergedData.tags = [];
            if (!Array.isArray(mergedData.images)) mergedData.images = [];
            if (!Array.isArray(mergedData.features)) mergedData.features = [];
            if (!Array.isArray(mergedData.specs)) mergedData.specs = [];
            if (!Array.isArray(mergedData.variants)) mergedData.variants = [];
            if (typeof mergedData.discount !== 'object') mergedData.discount = { percent: 0, priceAfterDiscount: mergedData.price };
            if (typeof mergedData.rating !== 'object') mergedData.rating = { average: 0, count: 0 };

            await docRef.update(mergedData);

            // Ambil data terbaru
            const updatedDoc = await docRef.get();
            const updatedData = { id: updatedDoc.id, ...updatedDoc.data() };

            // Cek apakah field relevan berubah
            if (updateData.name || updateData.description || updateData.category) {
                // Generate embedding baru
                const productText = `${updatedData.name} ${updatedData.description} ${updatedData.category}`;
                const embedding = await embeddingService.generateEmbedding(productText);

                // Update Pinecone
                await vectorService.upsertVectors([{
                    id: productId,
                    values: embedding,
                    metadata: {
                        name: updatedData.name,
                        category: updatedData.category,
                        price: updatedData.price,
                        description: updatedData.description?.substring(0, 200) || '',
                    }
                }]);
            }

            await logger.info('Product updated successfully', {
                source: 'Product Service',
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                details: updatedData
            });
            return updatedData;
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
            // Gabungkan dengan default
            const now = new Date();
            const mergedData = {
                ...defaultProduct,
                ...productData,
                createdAt: now,
                updatedAt: now,
                slug: productData.slug || slugify(productData.name || '')
            };

            // Validasi tipe data array/object
            if (!Array.isArray(mergedData.category)) mergedData.category = [];
            if (!Array.isArray(mergedData.tags)) mergedData.tags = [];
            if (!Array.isArray(mergedData.images)) mergedData.images = [];
            if (!Array.isArray(mergedData.features)) mergedData.features = [];
            if (!Array.isArray(mergedData.specs)) mergedData.specs = [];
            if (!Array.isArray(mergedData.variants)) mergedData.variants = [];
            if (typeof mergedData.discount !== 'object') mergedData.discount = { percent: 0, priceAfterDiscount: mergedData.price };
            if (typeof mergedData.rating !== 'object') mergedData.rating = { average: 0, count: 0 };

            // Add to Firestore
            const docRef = await this.collection.add(mergedData);

            // Generate embedding for product description
            const productText = `${mergedData.name} ${mergedData.description} ${mergedData.category}`;
            const embedding = await embeddingService.generateEmbedding(productText);

            // Add to Pinecone
            await vectorService.upsertVectors([{
                id: docRef.id,
                values: embedding,
                metadata: {
                    name: mergedData.name,
                    category: mergedData.category,
                    price: mergedData.price,
                    description: mergedData.description.substring(0, 200),
                }
            }]);

            await logger.info('Product added successfully', {
                source: 'Product Service',
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                details: { id: docRef.id, ...mergedData }
            });
            return { id: docRef.id, ...mergedData };
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