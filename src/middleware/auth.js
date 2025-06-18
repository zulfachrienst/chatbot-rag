const admin = require('firebase-admin');
const logger = require('../utils/logger');

// Autentikasi dengan Firebase ID Token
async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    const endpoint = req.originalUrl || req.url;
    const request_id = logger.generateRequestId();

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        await logger.warn('Missing or invalid token', {
            source: 'Auth Middleware',
            user_id: null,
            request_id,
            endpoint,
            message: 'Missing or invalid token',
            details: { headers: req.headers }
        });
        return res.status(401).json({ error: 'Missing or invalid token', request_id });
    }

    const idToken = authHeader.split(' ')[1];

    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        req.user = decoded;
        await logger.info('Authenticated user (Firebase)', {
            source: 'Auth Middleware',
            user_id: decoded.uid,
            request_id,
            endpoint,
            details: { user: decoded }
        });
        next();
    } catch (err) {
        await logger.warn('Firebase token verification failed', {
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

// Otorisasi untuk admin saja (cek custom claim role)
function authorizeAdmin(req, res, next) {
    const endpoint = req.originalUrl || req.url;
    const request_id = logger.generateRequestId();
    if (req.user && req.user.role === 'admin') return next();

    logger.warn('Forbidden: Admins only', {
        source: 'Auth Middleware',
        user_id: req.user?.uid || null,
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
    const tokenUserId = req.user.uid;
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