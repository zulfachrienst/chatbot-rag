const { db } = require('../config/firebase');

function generateRequestId() {
    // 16 hex digit random
    return 'req_' + [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

const MAX_LOGS = 20;

async function saveLogToDb(level, logObj) {
    try {
        await db.collection('systemLogs').add(logObj);
    } catch (err) {
        console.error('[LOGGER ERROR] Gagal simpan log ke Firestore:', err);
    }
}

const logger = {
    // Severity levels
    SEVERITY: {
        HIGH: 'HIGH',
        MEDIUM: 'MEDIUM',
        LOW: 'LOW'
    },

    generateRequestId,

    info: async (message, {
        source = 'application',
        user_id = null,
        endpoint = null,
        response_time = null,
        details = null
    } = {}) => {
        const request_id = generateRequestId();
        const logObj = {
            timestamp: new Date(),
            source,
            user_id,
            request_id,
            endpoint,
            response_time,
            message,
            details,
            level: 'INFO'
        };
        console.log(`[INFO] [${request_id}] ${logObj.timestamp.toISOString()}: ${message}`, details);
        await saveLogToDb('INFO', logObj);
        return request_id;
    },

    warn: async (message, {
        source = 'application',
        user_id = null,
        endpoint = null,
        response_time = null,
        details = null
    } = {}) => {
        const request_id = generateRequestId();
        const logObj = {
            timestamp: new Date(),
            source,
            user_id,
            request_id,
            endpoint,
            response_time,
            message,
            details,
            level: 'WARN'
        };
        console.warn(`[WARN] [${request_id}] ${logObj.timestamp.toISOString()}: ${message}`, details);
        await saveLogToDb('WARN', logObj);
        return request_id;
        },

        error: async (message, errorObj = {}, severity = null) => {
        const detectedSeverity = severity || logger._detectSeverity(errorObj, message);

        console.error(`[ERROR-${detectedSeverity}] ${new Date().toISOString()}: ${message}`, errorObj);

        try {
            const errorLog = {
            severity: detectedSeverity,
            message: errorObj.message || String(message),
            code: errorObj.code || null,
            stack: errorObj.stack || null,
            timestamp: new Date(),
            source: logger._detectSource(errorObj),
            httpStatus: errorObj.status || errorObj.statusCode || null,
            userId: errorObj.userId || null,
            requestId: errorObj.requestId || null,
            endpoint: errorObj.endpoint || null,
            userAgent: errorObj.userAgent || null,
            ip: errorObj.ip || null,
            additionalContext: errorObj.context || {}
            };

            // Simpan ke errorLogs (array rolling)
            const ref = db.collection('errorLogs').doc('main');
            const doc = await ref.get();
            let logs = [];
            if (doc.exists && Array.isArray(doc.data().logs)) {
            logs = doc.data().logs;
            }
            logs.push(errorLog);
            if (logs.length > MAX_LOGS) {
            logs.shift(); // Hapus log paling lama
            }
            await ref.set({ logs }, { merge: true });

            // Simpan juga ke log terpusat (systemLogs)
            await saveLogToDb('ERROR', {
            ...errorLog,
            level: 'ERROR'
            });

            // (Opsional) alert untuk HIGH severity
            if (detectedSeverity === logger.SEVERITY.HIGH) {
            await logger._sendAlert(errorLog);
            }
        } catch (dbErr) {
            console.error(`[LOGGER ERROR] Gagal simpan error ke Firestore:`, dbErr);
        }
        },

    // Method untuk logging dengan severity eksplisit
    errorHigh: async (message, errorObj = {}) => {
        await logger.error(message, errorObj, logger.SEVERITY.HIGH);
    },

    errorMedium: async (message, errorObj = {}) => {
        await logger.error(message, errorObj, logger.SEVERITY.MEDIUM);
    },

    errorLow: async (message, errorObj = {}) => {
        await logger.error(message, errorObj, logger.SEVERITY.LOW);
    },

    // Auto-detect severity berdasarkan error characteristics
    _detectSeverity: (errorObj, message) => {
        const errorMessage = (errorObj.message || message || '').toLowerCase();
        const errorCode = errorObj.code;
        const httpStatus = errorObj.status || errorObj.statusCode;

        // HIGH SEVERITY CONDITIONS

        // Database & Authentication Critical Errors
        if (errorCode === 'permission-denied' ||
            errorCode === 'unauthenticated' ||
            errorMessage.includes('database connection') ||
            errorMessage.includes('firestore') && errorMessage.includes('permission') ||
            errorMessage.includes('firebase auth') && errorMessage.includes('invalid')) {
            return logger.SEVERITY.HIGH;
        }

        // HTTP Critical Errors
        if (httpStatus >= 500 || httpStatus === 401 || httpStatus === 403) {
            return logger.SEVERITY.HIGH;
        }

        // AI API Critical Errors
        if (errorMessage.includes('groq') && (
            errorMessage.includes('quota exceeded') ||
            errorMessage.includes('api key') ||
            errorMessage.includes('authentication')
        )) {
            return logger.SEVERITY.HIGH;
        }

        if (errorMessage.includes('huggingface') && (
            errorMessage.includes('model not found') ||
            errorMessage.includes('quota') ||
            errorMessage.includes('rate limit')
        )) {
            return logger.SEVERITY.HIGH;
        }

        // Pinecone Critical Errors
        if (errorMessage.includes('pinecone') && (
            errorMessage.includes('index not found') ||
            errorMessage.includes('connection') ||
            errorMessage.includes('api key')
        )) {
            return logger.SEVERITY.HIGH;
        }

        // Security & Data Issues
        if (errorMessage.includes('security') ||
            errorMessage.includes('injection') ||
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('data corruption') ||
            errorMessage.includes('memory leak')) {
            return logger.SEVERITY.HIGH;
        }

        // MEDIUM SEVERITY CONDITIONS

        // Client Errors yang bisa di-handle
        if (httpStatus >= 400 && httpStatus < 500 && httpStatus !== 401 && httpStatus !== 403) {
            return logger.SEVERITY.MEDIUM;
        }

        // AI API Non-critical Issues
        if (errorMessage.includes('timeout') ||
            errorMessage.includes('retry') ||
            errorMessage.includes('temporary')) {
            return logger.SEVERITY.MEDIUM;
        }

        // Validation Errors
        if (errorMessage.includes('validation') ||
            errorMessage.includes('invalid input') ||
            errorMessage.includes('missing required')) {
            return logger.SEVERITY.MEDIUM;
        }

        // Business Logic Errors
        if (errorMessage.includes('not found') ||
            errorMessage.includes('already exists') ||
            errorMessage.includes('duplicate')) {
            return logger.SEVERITY.MEDIUM;
        }

        // DEFAULT: LOW SEVERITY
        return logger.SEVERITY.LOW;
    },

    // Detect error source berdasarkan stack trace atau context
    _detectSource: (errorObj) => {
        if (!errorObj.stack) return 'unknown';

        const stack = errorObj.stack.toLowerCase();

        if (stack.includes('firebase') || stack.includes('firestore')) return 'firebase';
        if (stack.includes('groq')) return 'groq-api';
        if (stack.includes('huggingface')) return 'huggingface-api';
        if (stack.includes('pinecone')) return 'pinecone';
        if (stack.includes('express') || stack.includes('router')) return 'express';
        if (stack.includes('auth')) return 'authentication';

        return 'application';
    },

    // Send alert untuk HIGH severity errors (opsional)
    _sendAlert: async (errorLog) => {
        try {
            // Implementasi alert system (email, Slack, Discord, etc.)
            console.log(`🚨 HIGH SEVERITY ALERT: ${errorLog.message}`);

            // Contoh: simpan ke collection khusus untuk alerts
            await db.collection('criticalAlerts').add({
                ...errorLog,
                alertSent: new Date(),
                resolved: false
            });
        } catch (alertErr) {
            console.error('Failed to send alert:', alertErr);
        }
    }
};

module.exports = logger;