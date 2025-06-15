const jwt = require('jsonwebtoken');
const logger = require('../utils/logger'); // Optional: jika kamu gunakan winston atau logger lainnya

const SECRET = process.env.JWT_SECRET || 'your-secret';

// Autentikasi dengan pesan error yang lebih deskriptif dan aman
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, SECRET);
        // Hindari log informasi sensitif
        // logger.info(`Authenticated user: ${payload.userId}`); // Gunakan jika perlu
        req.user = payload;
        next();
    } catch (err) {
        // Tidak mencetak token atau payload ke log
        logger.warn('JWT verification failed:', err.message); // Log error dengan aman
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// Otorisasi untuk admin saja
function authorizeAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') return next();
    return res.status(403).json({ error: 'Forbidden: Admins only' });
}

// Otorisasi untuk user pemilik resource atau admin
function authorizeSelfOrAdmin(req, res, next) {
    const paramUserId = req.params.userId;
    const tokenUserId = req.user.userId || req.user._id || req.user.id;

    if (req.user.role === 'admin' || tokenUserId === paramUserId) {
        return next();
    }

    return res.status(403).json({ error: 'Forbidden: Access denied' });
}

module.exports = { authenticate, authorizeAdmin, authorizeSelfOrAdmin };
