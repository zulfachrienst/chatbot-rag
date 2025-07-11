const express = require('express');
const chatService = require('../services/chatService');
const productService = require('../services/productService');
const logger = require('../utils/logger');
const historyService = require('../services/historyService');
const { authenticate, authorizeAdmin, authorizeSelfOrAdmin } = require('../middleware/auth');
const healthMonitor = require('../services/healthMonitorService');
const db = require('../config/firebase').db; // Pastikan kamu sudah mengatur Firebase di config/firebase.js
const upload = require('../middleware/upload');
const { uploadImageBuffer } = require('../utils/firebaseStorage');

const router = express.Router();

// Konfigurasi limit gambar
const MAX_MAIN_IMAGES = 8;         // Maksimal gambar utama produk
const MAX_VARIANT_IMAGES = 3;      // Maksimal gambar per varian option
const MAX_TOTAL_IMAGES = 40;       // (Opsional) Limit total gambar per produk

// Helper untuk hitung total gambar (utama + semua varian)
function countTotalImages(images, variants) {
    let total = Array.isArray(images) ? images.length : 0;
    if (Array.isArray(variants)) {
        for (const variant of variants) {
            if (Array.isArray(variant.options)) {
                for (const option of variant.options) {
                    if (Array.isArray(option.images)) {
                        total += option.images.length;
                    }
                }
            }
        }
    }
    return total;
}

// Test route
router.get('/test', (req, res) => {
    res.json({
        message: 'Chat routes are working!',
        timestamp: new Date().toISOString()
    });
});

// Chat endpoint
// ...existing code...

router.post('/chat', async (req, res) => {
    const startTime = Date.now();
    const endpoint = '/api/chat';
    const request_id = logger.generateRequestId();
    try {
        const { message, userId } = req.body;

        if (!message || typeof message !== 'string') {
            await logger.warn('Invalid message input', {
                source: 'Chat Routes',
                user_id: userId || null,
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                message: 'Message is required and must be a string',
                details: req.body
            });
            return res.status(400).json({
                error: 'Message is required and must be a string',
                request_id
            });
        }
        if (!userId || typeof userId !== 'string') {
            await logger.warn('Invalid userId input', {
                source: 'Chat Routes',
                user_id: userId || null,
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                message: 'userId is required and must be a string',
                details: req.body
            });
            return res.status(400).json({
                error: 'userId is required and must be a string',
                request_id
            });
        }

        await logger.info('Received chat request', {
            source: 'Chat Routes',
            user_id: userId,
            request_id,
            endpoint,
            details: req.body
        });

        const result = await chatService.processMessage(userId, message);

        await logger.info('Chat processed successfully', {
            source: 'Chat Routes',
            user_id: userId,
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            details: { result }
        });

        res.json({
            success: true,
            data: result,
            request_id
        });
    } catch (error) {
        await logger.error('Chat controller error', {
            source: 'Chat Routes',
            user_id: req.body?.userId || null,
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: error.message,
            details: error.stack || error
        });
        res.status(500).json({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
            request_id
        });
    }
});

// ...existing code...

// Get all products endpoint
router.get('/products', async (req, res) => {
    const startTime = Date.now();
    const endpoint = '/api/products';
    const request_id = logger.generateRequestId();
    try {
        const products = await productService.getAllProducts();
        await logger.info('Fetched all products', {
            source: 'Chat Routes',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            details: { count: products.length }
        });
        res.json({
            success: true,
            data: products,
            request_id
        });
    } catch (error) {
        await logger.error('Get products error', {
            source: 'Chat Routes',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: error.message,
            details: error.stack || error
        });
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            request_id
        });
    }
});

// Add product endpoint
router.post('/products', authenticate, authorizeAdmin, upload.any(), async (req, res) => {
    const startTime = Date.now();
    const endpoint = '/api/products';
    const request_id = logger.generateRequestId();

    try {
        console.log('=== ADD PRODUCT REQUEST ===');
        console.log('Files received:', req.files?.length || 0);
        console.log('Body data:', req.body.data ? 'Present' : 'Missing');

        if (!req.body.data) {
            return res.status(400).json({
                success: false,
                error: 'Product data is required',
                request_id
            });
        }

        const productData = JSON.parse(req.body.data);
        console.log('Product data parsed:', {
            name: productData.name,
            variants: productData.variants?.length || 0
        });

        // Validasi data produk
        if (!productData.name || !productData.description || !productData.brand) {
            return res.status(400).json({
                success: false,
                error: 'Name, description, and brand are required',
                request_id
            });
        }

        // Validasi total gambar
        const totalFiles = req.files?.length || 0;
        if (totalFiles > MAX_TOTAL_IMAGES) {
            return res.status(400).json({
                success: false,
                error: `Maximum ${MAX_TOTAL_IMAGES} images allowed in total`,
                request_id
            });
        }

        // Validasi struktur variants
        if (productData.variants && !Array.isArray(productData.variants)) {
            return res.status(400).json({
                success: false,
                error: 'Variants must be an array',
                request_id
            });
        }

        // Buat produk dulu tanpa gambar
        const product = await productService.addProduct({
            ...productData,
            images: [],
            variants: productData.variants || []
        });

        console.log('Product created with ID:', product.id);

        // Upload gambar utama
        const mainImages = req.files?.filter(f => f.fieldname === 'images') || [];
        console.log('Main images to upload:', mainImages.length);

        if (mainImages.length > MAX_MAIN_IMAGES) {
            return res.status(400).json({
                success: false,
                error: `Maximum ${MAX_MAIN_IMAGES} main images allowed`,
                request_id
            });
        }

        const imageUrls = [];
        for (const file of mainImages) {
            try {
                const url = await uploadImageBuffer(file.buffer, file.mimetype, product.id);
                imageUrls.push(url);
                console.log('Main image uploaded:', url);
            } catch (uploadError) {
                console.error('Error uploading main image:', uploadError);
            }
        }

        // PERBAIKAN: Handle variant images dengan format frontend
        const variantImageMap = {};

        console.log('=== PROCESSING VARIANT IMAGES ===');
        for (const file of req.files || []) {
            console.log('Processing file:', file.fieldname);

            // REGEX PATTERN YANG DIPERBAIKI: variant_{vIdx}_{oIdx}_images
            const match = file.fieldname.match(/^variant_(\d+)_(\d+)_images$/);
            if (match) {
                const vIdx = parseInt(match[1]);
                const oIdx = parseInt(match[2]);

                console.log(`Found variant image: variant_${vIdx}_${oIdx}_images`);

                try {
                    const url = await uploadImageBuffer(file.buffer, file.mimetype, product.id);

                    // Buat struktur nested untuk variant dan option
                    if (!variantImageMap[vIdx]) {
                        variantImageMap[vIdx] = {};
                    }
                    if (!variantImageMap[vIdx][oIdx]) {
                        variantImageMap[vIdx][oIdx] = [];
                    }

                    variantImageMap[vIdx][oIdx].push(url);
                    console.log(`✅ BERHASIL UPLOAD GAMBAR VARIANT: variant_${vIdx}_${oIdx}_images -> ${url}`);

                } catch (uploadError) {
                    console.error(`❌ Error uploading variant image variant_${vIdx}_${oIdx}_images:`, uploadError);
                }
            } else if (file.fieldname !== 'images') {
                console.log(`⚠️ TIDAK DITEMUKAN DATA VARIANT GAMBAR untuk fieldname: ${file.fieldname}`);
            }
        }

        // PERBAIKAN: Inject gambar ke setiap option dalam variant
        console.log('=== INJECTING IMAGES TO VARIANTS ===');
        if (productData.variants && Array.isArray(productData.variants)) {
            productData.variants.forEach((variant, vIdx) => {
                console.log(`Processing variant ${vIdx}:`, variant.name);

                if (Array.isArray(variant.options)) {
                    variant.options.forEach((option, oIdx) => {
                        console.log(`  Processing option ${oIdx}:`, option.value);

                        // Inject gambar ke option yang sesuai
                        if (variantImageMap[vIdx] && variantImageMap[vIdx][oIdx]) {
                            const existingImages = option.images || [];
                            const newImages = variantImageMap[vIdx][oIdx];
                            option.images = [...existingImages, ...newImages];

                            console.log(`    ✅ Injected ${newImages.length} images to option ${option.value}`);
                            console.log(`    Total images for this option: ${option.images.length}`);
                        } else {
                            console.log(`    ⚠️ No images found for variant ${vIdx} option ${oIdx}`);
                        }
                    });
                } else {
                    console.log(`  ⚠️ Variant ${vIdx} has no options array`);
                }
            });
        }

        // Update produk dengan gambar dan variants yang sudah diproses
        const updatedProduct = await productService.updateProduct(product.id, {
            images: imageUrls,
            variants: productData.variants || []
        });

        console.log('=== FINAL RESULT ===');
        console.log('Main images:', imageUrls.length);
        console.log('Variants processed:', productData.variants?.length || 0);
        console.log('Variant image map:', Object.keys(variantImageMap).length, 'variants');

        await logger.info('Add product success', {
            source: 'Product Routes',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            product_id: product.id,
            main_images: imageUrls.length,
            variant_images: Object.keys(variantImageMap).length
        });

        res.json({
            success: true,
            data: {
                ...updatedProduct,
                images: imageUrls,
                variants: productData.variants || []
            },
            request_id
        });

    } catch (error) {
        console.error('=== ADD PRODUCT ERROR ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);

        await logger.error('Add product error', {
            source: 'Product Routes',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: error.message,
            details: error.stack || error
        });

        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            request_id
        });
    }
});

// PUT /api/products/:id - Update produk
router.put('/products/:id', authenticate, authorizeAdmin, upload.any(), async (req, res) => {
    const startTime = Date.now();
    const endpoint = '/api/products/:id';
    const request_id = logger.generateRequestId();

    try {
        const productId = req.params.id;

        console.log('=== UPDATE PRODUCT REQUEST ===');
        console.log('Product ID:', productId);
        console.log('Files received:', req.files?.length || 0);
        console.log('Body data:', req.body.data ? 'Present' : 'Missing');

        if (!req.body.data) {
            return res.status(400).json({
                success: false,
                error: 'Product data is required',
                request_id
            });
        }

        const updateData = JSON.parse(req.body.data);
        console.log('Update data parsed:', {
            name: updateData.name,
            variants: updateData.variants?.length || 0
        });

        // Validasi struktur variants
        if (updateData.variants && !Array.isArray(updateData.variants)) {
            return res.status(400).json({
                success: false,
                error: 'Variants must be an array',
                request_id
            });
        }

        // Ambil produk yang ada
        const existingProduct = await productService.getProduct(productId);
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                error: 'Product not found',
                request_id
            });
        }

        // Upload gambar utama baru
        const mainImages = req.files?.filter(f => f.fieldname === 'images') || [];
        console.log('New main images to upload:', mainImages.length);

        const newImageUrls = [];
        for (const file of mainImages) {
            try {
                const url = await uploadImageBuffer(file.buffer, file.mimetype, productId);
                newImageUrls.push(url);
                console.log('New main image uploaded:', url);
            } catch (uploadError) {
                console.error('Error uploading main image:', uploadError);
            }
        }

        // Gabungkan gambar lama dengan gambar baru
        const existingImages = updateData.images || existingProduct.images || [];
        const allMainImages = [...existingImages, ...newImageUrls];

        if (allMainImages.length > MAX_MAIN_IMAGES) {
            return res.status(400).json({
                success: false,
                error: `Maximum ${MAX_MAIN_IMAGES} main images allowed`,
                request_id
            });
        }

        // PERBAIKAN: Handle variant images dengan format frontend
        const variantImageMap = {};

        console.log('=== PROCESSING VARIANT IMAGES FOR UPDATE ===');
        for (const file of req.files || []) {
            console.log('Processing file:', file.fieldname);

            // REGEX PATTERN YANG DIPERBAIKI: variant_{vIdx}_{oIdx}_images
            const match = file.fieldname.match(/^variant_(\d+)_(\d+)_images$/);
            if (match) {
                const vIdx = parseInt(match[1]);
                const oIdx = parseInt(match[2]);

                console.log(`Found variant image: variant_${vIdx}_${oIdx}_images`);

                try {
                    const url = await uploadImageBuffer(file.buffer, file.mimetype, productId);

                    // Buat struktur nested untuk variant dan option
                    if (!variantImageMap[vIdx]) {
                        variantImageMap[vIdx] = {};
                    }
                    if (!variantImageMap[vIdx][oIdx]) {
                        variantImageMap[vIdx][oIdx] = [];
                    }

                    variantImageMap[vIdx][oIdx].push(url);
                    console.log(`✅ BERHASIL UPLOAD GAMBAR VARIANT: variant_${vIdx}_${oIdx}_images -> ${url}`);

                } catch (uploadError) {
                    console.error(`❌ Error uploading variant image variant_${vIdx}_${oIdx}_images:`, uploadError);
                }
            } else if (file.fieldname !== 'images') {
                console.log(`⚠️ TIDAK DITEMUKAN DATA VARIANT GAMBAR untuk fieldname: ${file.fieldname}`);
            }
        }

        // PERBAIKAN: Inject gambar ke setiap option dalam variant
        console.log('=== INJECTING IMAGES TO VARIANTS FOR UPDATE ===');
        if (updateData.variants && Array.isArray(updateData.variants)) {
            updateData.variants.forEach((variant, vIdx) => {
                console.log(`Processing variant ${vIdx}:`, variant.name);

                if (Array.isArray(variant.options)) {
                    variant.options.forEach((option, oIdx) => {
                        console.log(`  Processing option ${oIdx}:`, option.value);

                        // Inject gambar baru ke option yang sesuai
                        if (variantImageMap[vIdx] && variantImageMap[vIdx][oIdx]) {
                            const existingImages = option.images || [];
                            const newImages = variantImageMap[vIdx][oIdx];
                            option.images = [...existingImages, ...newImages];

                            console.log(`    ✅ Injected ${newImages.length} new images to option ${option.value}`);
                            console.log(`    Total images for this option: ${option.images.length}`);
                        } else {
                            console.log(`    ⚠️ No new images found for variant ${vIdx} option ${oIdx}`);
                        }
                    });
                } else {
                    console.log(`  ⚠️ Variant ${vIdx} has no options array`);
                }
            });
        }

        // Update produk
        const finalUpdateData = {
            ...updateData,
            images: allMainImages,
            variants: updateData.variants || []
        };

        const updatedProduct = await productService.updateProduct(productId, finalUpdateData);

        console.log('=== UPDATE FINAL RESULT ===');
        console.log('Total main images:', allMainImages.length);
        console.log('Variants processed:', updateData.variants?.length || 0);
        console.log('Variant image map:', Object.keys(variantImageMap).length, 'variants');

        await logger.info('Update product success', {
            source: 'Product Routes',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            product_id: productId,
            main_images: allMainImages.length,
            variant_images: Object.keys(variantImageMap).length
        });

        res.json({
            success: true,
            data: updatedProduct,
            request_id
        });

    } catch (error) {
        console.error('=== UPDATE PRODUCT ERROR ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);

        await logger.error('Update product error', {
            source: 'Product Routes',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: error.message,
            details: error.stack || error
        });

        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            request_id
        });
    }
});


// Delete product endpoint
router.delete('/products/:id', authenticate, authorizeAdmin, async (req, res) => {
    const startTime = Date.now();
    const endpoint = '/api/products/:id';
    const request_id = logger.generateRequestId();
    try {
        const productId = req.params.id;
        const deleted = await productService.deleteProduct(productId);
        if (!deleted) {
            await logger.warn('Product not found for delete', {
                source: 'Chat Routes',
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                message: 'Product not found',
                details: { productId }
            });
            return res.status(404).json({ error: 'Product not found', request_id });
        }
        await logger.info('Product deleted successfully', {
            source: 'Chat Routes',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            details: { deleted }
        });
        res.json({ success: true, data: deleted, request_id });
    } catch (error) {
        await logger.error('Delete product error', {
            source: 'Chat Routes',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: error.message,
            details: error.stack || error
        });
        res.status(500).json({ error: 'Internal server error', message: error.message, request_id });
    }
});

router.get('/users', authenticate, authorizeAdmin, async (req, res) => {
    const startTime = Date.now();
    const endpoint = '/api/users';
    const request_id = logger.generateRequestId();
    try {
        const users = await historyService.listUsers();
        await logger.info('Fetched user list', {
            source: 'Chat Routes',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            details: { count: users.length }
        });
        res.json({ success: true, data: users, request_id });
    } catch (error) {
        await logger.error('List users error', {
            source: 'Chat Routes',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: error.message,
            details: error.stack || error
        });
        res.status(500).json({ error: 'Internal server error', message: error.message, request_id });
    }
});

// Get chat history for a user (admin or self)
router.get('/users/:userId/history', authenticate, authorizeSelfOrAdmin, async (req, res) => {
    const startTime = Date.now();
    const endpoint = '/api/users/:userId/history';
    const request_id = logger.generateRequestId();
    try {
        const userId = req.params.userId;
        const history = await historyService.getHistory(userId);
        await logger.info('Fetched user chat history', {
            source: 'Chat Routes',
            user_id: userId,
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            details: { count: history.length }
        });
        res.json({ success: true, data: history, request_id });
    } catch (error) {
        await logger.error('Get user history error', {
            source: 'Chat Routes',
            user_id: req.params.userId,
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: error.message,
            details: error.stack || error
        });
        res.status(500).json({ error: 'Internal server error', message: error.message, request_id });
    }
});

// Delete chat history for a user (admin or self)
router.delete('/users/:userId/history', authenticate, authorizeSelfOrAdmin, async (req, res) => {
    const startTime = Date.now();
    const endpoint = '/users/:userId/history';
    const request_id = logger.generateRequestId();
    try {
        const userId = req.params.userId;
        await historyService.deleteHistory(userId);
        await logger.info('Deleted user chat history', {
            source: 'Chat Routes',
            user_id: userId,
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            details: { userId }
        });
        res.json({ success: true, request_id });
    } catch (error) {
        await logger.error('Delete user history error', {
            source: 'Chat Routes',
            user_id: req.params.userId,
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: error.message,
            details: error.stack || error
        });
        res.status(500).json({ error: 'Internal server error', message: error.message, request_id });
    }
});

router.get('/stats', async (req, res) => {
    const startTime = Date.now();
    const endpoint = '/api/stats';
    const request_id = logger.generateRequestId();
    try {
        const [products, users] = await Promise.all([
            productService.getAllProducts(),
            historyService.listUsers()
        ]);
        await logger.info('Fetched stats', {
            source: 'Chat Routes',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            details: {
                totalProducts: products.length,
                totalUsers: users.length
            }
        });
        res.json({
            success: true,
            data: {
                totalProducts: products.length,
                totalUsers: users.length
            },
            request_id
        });
    } catch (error) {
        await logger.error('Stats error', {
            source: 'Chat Routes',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: error.message,
            details: error.stack || error
        });
        res.status(500).json({ error: 'Internal server error', message: error.message, request_id });
    }
});

router.post('/health/test/:service', async (req, res) => {
    const startTime = Date.now();
    const endpoint = `/api/health/test/${req.params.service}`;
    const request_id = logger.generateRequestId();
    try {
        const service = req.params.service;
        const fnMap = {
            huggingface: healthMonitor.testHuggingFaceOnce,
            groq: healthMonitor.testGroqOnce,
            pinecone: healthMonitor.testPineconeOnce,
            firebase: healthMonitor.testFirebaseOnce
        };
        const fn = fnMap[service];
        if (!fn) {
            await logger.warn('Unknown health service', {
                source: 'Chat Routes',
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                message: 'Unknown service',
                details: { service }
            });
            return res.status(400).json({ error: 'Unknown service', request_id });
        }

        await healthMonitor.saveHealthResult(service, { status: 'in-progress', lastTested: new Date() });

        const result = await healthMonitor.testWithRetry(fn, service, 5);

        await healthMonitor.saveHealthResult(service, { ...result, status: 'done', lastTested: new Date() });

        await logger.info('Health check completed', {
            source: 'Chat Routes',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            details: { service, result }
        });

        res.json({ success: true, data: result, request_id });
    } catch (err) {
        await healthMonitor.saveHealthResult(req.params.service, { status: 'error', lastTested: new Date(), error: err.message });
        await logger.error('Health check error', {
            source: 'Chat Routes',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: err.message,
            details: err.stack || err
        });
        res.status(500).json({ error: err.message, request_id });
    }
});

// Get health status (from Firestore)
router.get('/health/status', async (req, res) => {
    const startTime = Date.now();
    const endpoint = '/api/health/status';
    const request_id = logger.generateRequestId();
    try {
        const snapshot = await db.collection('serviceHealth').get();
        const data = {};
        snapshot.forEach(doc => {
            data[doc.id] = doc.data();
        });
        await logger.info('Fetched health status', {
            source: 'Chat Routes',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            details: { serviceCount: Object.keys(data).length }
        });
        res.json({ success: true, data, request_id });
    } catch (err) {
        await logger.error('Get health status error', {
            source: 'Chat Routes',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: err.message,
            details: err.stack || err
        });
        res.status(500).json({ error: err.message, request_id });
    }
});

router.get('/error-logs', authenticate, authorizeAdmin, async (req, res) => {
    const startTime = Date.now();
    const endpoint = '/api/error-logs';
    const request_id = logger.generateRequestId();
    try {
        const ref = db.collection('errorLogs').doc('main');
        const doc = await ref.get();
        let logs = [];
        if (doc.exists && Array.isArray(doc.data().logs)) {
            logs = doc.data().logs.slice().reverse();
        }
        await logger.info('Fetched error logs', {
            source: 'Chat Routes',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            details: { count: logs.length }
        });
        res.json({
            success: true,
            data: logs,
            request_id
        });
    } catch (error) {
        await logger.error('Get error logs error', {
            source: 'Chat Routes',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: error.message,
            details: error.stack || error
        });
        res.status(500).json({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
            request_id
        });
    }
});

router.get('/system-logs', authenticate, authorizeAdmin, async (req, res) => {
    const startTime = Date.now();
    const endpoint = '/api/system-logs';
    const request_id = logger.generateRequestId();
    try {
        // Ambil limit dari query, default 100, maksimal 500
        let limit = parseInt(req.query.limit, 10);
        if (isNaN(limit) || limit < 1) limit = 100;
        if (limit > 500) limit = 500;

        let query = db.collection('systemLogs').orderBy('timestamp', 'desc');
        if (req.query.startAfter) {
            // startAfter harus berupa ISO string atau Firestore Timestamp
            query = query.startAfter(new Date(req.query.startAfter));
        }
        const snapshot = await query.limit(limit).get();

        const logs = [];
        snapshot.forEach(doc => {
            logs.push({ id: doc.id, ...doc.data() });
        });

        // Kirim nextPageToken (timestamp terakhir) untuk pagination
        const nextPageToken = logs.length > 0 ? logs[logs.length - 1].timestamp : null;

        await logger.info('Fetched system logs with pagination', {
            source: 'Chat Routes',
            user_id: req.user?.userId || req.user?._id || req.user?.id || null,
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            details: { count: logs.length }
        });

        res.json({
            success: true,
            data: logs,
            nextPageToken, // gunakan ini untuk startAfter di request berikutnya
            request_id
        });
    } catch (error) {
        await logger.error('Get system logs error', {
            source: 'Chat Routes',
            user_id: req.user?.userId || req.user?._id || req.user?.id || null,
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: error.message,
            details: error.stack || error
        });
        res.status(500).json({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
            request_id
        });
    }
});

router.delete('/clear-logs', authenticate, authorizeAdmin, async (req, res) => {
    const startTime = Date.now();
    const endpoint = '/clear-logs';
    const request_id = logger.generateRequestId();

    try {
        // Ambil parameter dari request body - sekarang support olderThanHours
        const { olderThanHours = 168, level = "ALL" } = req.body; // 168 hours = 7 days default

        // Hitung cutoff date berdasarkan olderThanHours
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

        const { Timestamp } = require('firebase-admin').firestore;
        const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

        let deletedCount = 0;

        // Hapus array rolling log di errorLogs/main jika level adalah ERROR atau ALL
        if (level === 'ERROR' || level === 'ALL') {
            await db.collection('errorLogs').doc('main').set({ logs: [] }, { merge: true });
            deletedCount += 1;
        }

        // Query systemLogs dengan timestamp filter
        let query = db.collection('systemLogs').where('timestamp', '<', cutoffTimestamp);

        // Filter berdasarkan level jika level bukan ALL
        if (level && level !== 'ALL') {
            query = query.where('level', '==', level);
        }

        // Batch delete dengan optimasi
        const batchSize = 500;
        let totalDeleted = 0;

        while (true) {
            const snapshot = await query.limit(batchSize).get();
            if (snapshot.empty) break;

            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            totalDeleted += snapshot.size;

            // Break jika jumlah dokumen kurang dari batchSize
            if (snapshot.size < batchSize) break;
        }

        deletedCount += totalDeleted;

        // Format time text untuk response yang lebih user-friendly
        const formatTimeText = (hours) => {
            if (hours < 24) {
                return `${hours} hour${hours !== 1 ? 's' : ''}`;
            } else {
                const days = Math.floor(hours / 24);
                const remainingHours = hours % 24;
                if (remainingHours === 0) {
                    return `${days} day${days !== 1 ? 's' : ''}`;
                } else {
                    return `${days} day${days !== 1 ? 's' : ''} and ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
                }
            }
        };

        const timeText = formatTimeText(olderThanHours);
        const levelText = level === 'ALL' ? 'all levels' : `level ${level}`;

        // Log aktivitas dengan detail yang lengkap
        await logger.info('Cleared logs', {
            source: 'Admin Routes',
            user_id: req.user?.userId || req.user?._id || req.user?.id || null,
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: `Cleared ${deletedCount} logs older than ${timeText} with ${levelText}`,
            details: {
                olderThanHours,
                level,
                deletedCount,
                cutoffDate,
                cutoffTimestamp,
                timeText,
                levelText
            }
        });

        // Response yang lebih informatif
        res.json({
            success: true,
            message: `Successfully cleared ${deletedCount} logs older than ${timeText} with ${levelText}`,
            deletedCount,
            timeText,
            levelText,
            olderThanHours,
            level,
            request_id
        });

    } catch (error) {
        await logger.error('Clear log error', {
            source: 'Admin Routes',
            user_id: req.user?.userId || req.user?._id || req.user?.id || null,
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: error.message,
            details: {
                error: error.stack || error,
                requestBody: req.body
            }
        });

        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
            request_id
        });
    }
});

router.get('/stats/popular-products', async (req, res) => {
    const startTime = Date.now();
    const endpoint = '/api/stats/popular-products';
    const request_id = logger.generateRequestId();
    try {
        // Query Firestore collection 'productInquiries', order by 'count' descending
        const snapshot = await db.collection('productInquiries')
            .orderBy('count', 'desc')
            .limit(20)
            .get();

        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });

        await logger.info('Fetched popular products from productInquiries', {
            source: 'Chat Routes',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            details: { count: products.length }
        });

        res.json({
            success: true,
            data: products,
            request_id
        });
    } catch (error) {
        await logger.error('Get popular products error', {
            source: 'Chat Routes',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: error.message,
            details: error.stack || error
        });
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            request_id
        });
    }
});

module.exports = router;