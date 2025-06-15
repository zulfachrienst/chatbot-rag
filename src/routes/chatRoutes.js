const express = require('express');
const chatService = require('../services/chatService');
const productService = require('../services/productService');
const logger = require('../utils/logger');

const router = express.Router();

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
    try {
        logger.info('Received chat request:', req.body);
        const { message, userId } = req.body; // Ambil userId dari body

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                error: 'Message is required and must be a string'
            });
        }
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({
                error: 'userId is required and must be a string'
            });
        }

        const result = await chatService.processMessage(userId, message); // Kirim userId ke chatService

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Chat controller error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// ...existing code...

// Get all products endpoint
router.get('/products', async (req, res) => {
    try {
        const products = await productService.getAllProducts();
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        logger.error('Get products error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Add product endpoint
router.post('/products', async (req, res) => {
    try {
        const productData = req.body;

        // Basic validation
        if (!productData.name || !productData.description) {
            return res.status(400).json({
                error: 'Name and description are required'
            });
        }

        // Cek apakah produk dengan nama sama sudah ada
        const existingProducts = await productService.getAllProducts();
        const isDuplicate = existingProducts.some(
            p => p.name.trim().toLowerCase() === productData.name.trim().toLowerCase()
        );
        if (isDuplicate) {
            return res.status(409).json({
                error: 'Product with the same name already exists'
            });
        }

        const product = await productService.addProduct(productData);
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        logger.error('Add product error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

module.exports = router;