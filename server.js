const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import routes and middleware
const chatRoutes = require('./src/routes/chatRoutes');
const errorHandler = require('./src/middleware/errorHandler');
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (should be first)
app.get('/', (req, res) => {
    const startTime = Date.now();
    const request_id = logger.generateRequestId();
    logger.info('Root health check accessed', {
        source: 'Server',
        request_id,
        endpoint: '/',
        message: 'Root health check accessed',
        details: { ip: req.ip }
    });
    res.json({
        message: 'Product Chatbot API',
        status: 'OK',
        timestamp: new Date().toISOString(),
        request_id
    });
    logger.info('Root health check response sent', {
        source: 'Server',
        request_id,
        endpoint: '/',
        response_time: Date.now() - startTime,
        message: 'Root health check response sent',
        details: {}
    });
});

app.get('/health', (req, res) => {
    const startTime = Date.now();
    const request_id = logger.generateRequestId();
    logger.info('Health endpoint accessed', {
        source: 'Server',
        request_id,
        endpoint: '/health',
        message: 'Health endpoint accessed',
        details: { ip: req.ip }
    });
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        request_id
    });
    logger.info('Health endpoint response sent', {
        source: 'Server',
        request_id,
        endpoint: '/health',
        response_time: Date.now() - startTime,
        message: 'Health endpoint response sent',
        details: {}
    });
});

// API routes
app.use('/api', chatRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler (must be last)
app.use((req, res) => {
    const startTime = Date.now();
    const request_id = logger.generateRequestId();
    logger.warn('Route not found', {
        source: 'Server',
        request_id,
        endpoint: req.path,
        message: 'Route not found',
        details: { method: req.method }
    });
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method,
        request_id
    });
    logger.warn('404 response sent', {
        source: 'Server',
        request_id,
        endpoint: req.path,
        response_time: Date.now() - startTime,
        message: '404 response sent',
        details: { method: req.method }
    });
});

// Graceful error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
    const request_id = logger.generateRequestId();
    logger.error('Unhandled Rejection at:', {
        source: 'Server',
        request_id,
        endpoint: 'process.on.unhandledRejection',
        message: 'Unhandled Rejection',
        details: { reason, promise }
    });
});

process.on('uncaughtException', (error) => {
    const request_id = logger.generateRequestId();
    logger.error('Uncaught Exception:', {
        source: 'Server',
        request_id,
        endpoint: 'process.on.uncaughtException',
        message: error.message,
        details: error.stack || error
    });
    process.exit(1);
});

app.listen(PORT, () => {
    const request_id = logger.generateRequestId();
    logger.info(`🚀 Server running on port ${PORT}`, {
        source: 'Server',
        request_id,
        endpoint: 'listen',
        message: `Server running on port ${PORT}`,
        details: { port: PORT }
    });
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`, {
        source: 'Server',
        request_id,
        endpoint: 'listen',
        message: `Environment: ${process.env.NODE_ENV || 'development'}`,
        details: {}
    });
    logger.info(`🌐 Health check: http://localhost:${PORT}/health`, {
        source: 'Server',
        request_id,
        endpoint: 'listen',
        message: `Health check: http://localhost:${PORT}/health`,
        details: {}
    });
    logger.info(`💬 Chat API: http://localhost:${PORT}/api/chat`, {
        source: 'Server',
        request_id,
        endpoint: 'listen',
        message: `Chat API: http://localhost:${PORT}/api/chat`,
        details: {}
    });
});

module.exports = app;