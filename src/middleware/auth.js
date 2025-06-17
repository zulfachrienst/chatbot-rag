const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const SECRET = process.env.JWT_SECRET || 'your-secret';

// Autentikasi dengan logger detail
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    const endpoint = req.originalUrl || req.url;
    const request_id = logger.generateRequestId();

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn('Missing or invalid token', {
            source: 'Auth Middleware',
            user_id: null,
            request_id,
            endpoint,
            message: 'Missing or invalid token',
            details: { headers: req.headers }
        });
        return res.status(401).json({ error: 'Missing or invalid token', request_id });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, SECRET);
        req.user = payload;
        logger.info('Authenticated user', {
            source: 'Auth Middleware',
            user_id: payload.userId || payload._id || payload.id || null,
            request_id,
            endpoint,
            details: { user: payload }
        });
        next();
    } catch (err) {
        logger.warn('JWT verification failed', {
            source: 'Auth Middleware',
            user_id: null,
            request_id,
            endpoint,
            message: err.message,
            details: { error: err }
        });
        return res.status(401).json({ error: 'Invalid or expired token', request_id });
    }
}

// Otorisasi untuk admin saja
function authorizeAdmin(req, res, next) {
    const endpoint = req.originalUrl || req.url;
    const request_id = logger.generateRequestId();
    if (req.user && req.user.role === 'admin') return next();

    logger.warn('Forbidden: Admins only', {
        source: 'Auth Middleware',
        user_id: req.user?.userId || req.user?._id || req.user?.id || null,
        request_id,
        endpoint,
        message: 'Forbidden: Admins only',
        details: { user: req.user }
    });
    return res.status(403).json({ error: 'Forbidden: Admins only', request_id });
}

// Otorisasi untuk user pemilik resource atau admin
function authorizeSelfOrAdmin(req, res, next) {
    const paramUserId = req.params.userId;
    const tokenUserId = req.user.userId || req.user._id || req.user.id;
    const endpoint = req.originalUrl || req.url;
    const request_id = logger.generateRequestId();

    if (req.user.role === 'admin' || tokenUserId === paramUserId) {
        return next();
    }

    logger.warn('Forbidden: Access denied', {
        source: 'Auth Middleware',
        user_id: tokenUserId,
        request_id,
        endpoint,
        message: 'Forbidden: Access denied',
        details: { user: req.user, paramUserId }
    });
    return res.status(403).json({ error: 'Forbidden: Access denied', request_id });
}

module.exports = { authenticate, authorizeAdmin, authorizeSelfOrAdmin };