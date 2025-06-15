const express = require('express');
const chatService = require('../services/chatService');
const productService = require('../services/productService');
const logger = require('../utils/logger');
const historyService = require('../services/historyService');

const jwt = require('jsonwebtoken');
const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'your-secret';

// Test route
router.get('/test', (req, res) => {
    res.json({
        message: 'Chat routes are working!',
        timestamp: new Date().toISOString()
    });
});

// Chat endpoint
// ...existing code...

const DUMMY_ADMIN = {
    _id: '123456',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
};

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

// Edit product endpoint
router.put('/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const updateData = req.body;
        const updated = await productService.updateProduct(productId, updateData);
        if (!updated) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ success: true, data: updated });
    } catch (error) {
        logger.error('Update product error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Delete product endpoint
router.delete('/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const deleted = await productService.deleteProduct(productId);
        if (!deleted) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ success: true, data: deleted });
    } catch (error) {
        logger.error('Delete product error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// List all users with chat history
router.get('/users', async (req, res) => {
    try {
        const users = await historyService.listUsers();
        res.json({ success: true, data: users });
    } catch (error) {
        logger.error('List users error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Get chat history for a user
router.get('/users/:userId/history', async (req, res) => {
    try {
        const userId = req.params.userId;
        const history = await historyService.getHistory(userId);
        res.json({ success: true, data: history });
    } catch (error) {
        logger.error('Get user history error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Delete chat history for a user
router.delete('/users/:userId/history', async (req, res) => {
    try {
        const userId = req.params.userId;
        await historyService.deleteHistory(userId);
        res.json({ success: true });
    } catch (error) {
        logger.error('Delete user history error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

router.get('/stats', async (req, res) => {
    try {
        const [products, users] = await Promise.all([
            productService.getAllProducts(),
            historyService.listUsers()
        ]);
        res.json({
            success: true,
            data: {
                totalProducts: products.length,
                totalUsers: users.length
            }
        });
    } catch (error) {
        logger.error('Stats error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Simple check - gunakan hash password dan DB di produksi
    if (email === DUMMY_ADMIN.email && password === DUMMY_ADMIN.password) {
        const payload = {
            userId: DUMMY_ADMIN._id,
            role: DUMMY_ADMIN.role,
        };

        const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });
        logger.info(`User ${DUMMY_ADMIN.email} logged in successfully`);

        return res.json({
            success: true,
            token,
            user: payload,
        });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
});

module.exports = router;