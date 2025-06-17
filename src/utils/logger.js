const logger = {
    // Severity levels
    SEVERITY: {
        HIGH: 'HIGH',
        MEDIUM: 'MEDIUM', 
        LOW: 'LOW'
    },

    info: (message, ...args) => {
        console.log(`[INFO] ${new Date().toISOString()}: ${message}`, ...args);
    },

    warn: (message, ...args) => {
        console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, ...args);
    },

    error: async (message, errorObj = {}, severity = null) => {
        // Auto-detect severity jika tidak diberikan
        const detectedSeverity = severity || logger._detectSeverity(errorObj, message);
        
        console.error(`[ERROR-${detectedSeverity}] ${new Date().toISOString()}: ${message}`, errorObj);

        // Simpan error ke Firestore dengan informasi lebih lengkap
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

            await db.collection('errorLogs').add(errorLog);

            // Kirim alert untuk HIGH severity errors
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