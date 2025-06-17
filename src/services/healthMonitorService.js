const { db } = require('../config/firebase');
const logger = require('../utils/logger');

// --- Service Test Functions ---

async function testHuggingFaceOnce() {
    const startTime = Date.now();
    const endpoint = '/healthMonitorService/testHuggingFaceOnce';
    const request_id = logger.generateRequestId();
    try {
        const { HfInference } = require('@huggingface/inference');
        const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
        const result = await hf.featureExtraction({
            provider: "hf-inference",
            model: 'sentence-transformers/all-MiniLM-L6-v2',
            inputs: 'test embedding'
        });
        await logger.info('HuggingFace test success', {
            source: 'Health Monitor Service',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: 'HuggingFace test success',
            details: { result }
        });
        return Array.isArray(result);
    } catch (error) {
        await logger.error('HuggingFace test error', {
            source: 'Health Monitor Service',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: error.message,
            details: error.stack || error
        });
        return false;
    }
}

async function testGroqOnce() {
    const startTime = Date.now();
    const endpoint = 'testGroqOnce';
    const request_id = logger.generateRequestId();
    try {
        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: "Hello" }],
            model: "llama3-70b-8192",
            max_tokens: 10
        });
        await logger.info('GROQ test success', {
            source: 'Health Monitor Service',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: 'GROQ test success',
            details: { completion }
        });
        return !!completion.choices[0]?.message?.content;
    } catch (error) {
        await logger.error('GROQ test error', {
            source: 'Health Monitor Service',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: error.message,
            details: error.stack || error
        });
        return false;
    }
}

async function testPineconeOnce() {
    const startTime = Date.now();
    const endpoint = '/healthMonitorService/testPineconeOnce';
    const request_id = logger.generateRequestId();
    try {
        const { Pinecone } = require('@pinecone-database/pinecone');
        const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        const indexes = await pinecone.listIndexes();
        await logger.info('Pinecone test success', {
            source: 'Health Monitor Service',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: 'Pinecone test success',
            details: { indexes }
        });
        return Array.isArray(indexes.indexes);
    } catch (error) {
        await logger.error('Pinecone test error', {
            source: 'Health Monitor Service',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: error.message,
            details: error.stack || error
        });
        return false;
    }
}

async function testFirebaseOnce() {
    const startTime = Date.now();
    const endpoint = '/healthMonitorService/testFirebaseOnce';
    const request_id = logger.generateRequestId();
    try {
        // Cek koneksi Firestore dengan operasi sederhana
        const testRef = db.collection('serviceHealth').doc('firebase-test');
        await testRef.set({ testedAt: new Date() }, { merge: true });
        const doc = await testRef.get();
        await logger.info('Firebase test success', {
            source: 'Health Monitor Service',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: 'Firebase test success',
            details: { exists: doc.exists }
        });
        return doc.exists;
    } catch (error) {
        await logger.error('Firebase test error', {
            source: 'Health Monitor Service',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: error.message,
            details: error.stack || error
        });
        return false;
    }
}

// --- Test With Retry ---

async function testWithRetry(fn, name, maxRetries = 5) {
    let successCount = 0;
    let totalTime = 0;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const start = Date.now();
        try {
            const result = await fn();
            const elapsed = Date.now() - start;
            if (result) {
                successCount++;
                totalTime += elapsed;
                await logger.info(`✅ ${name} OK on attempt ${attempt} (${elapsed} ms)`, {
                    source: 'Health Monitor Service',
                    endpoint: `/healthMonitorService/testWithRetry/${name}`,
                    response_time: elapsed,
                    message: `${name} OK on attempt ${attempt}`,
                    details: { attempt }
                });
            } else {
                await logger.warn(`❌ ${name} failed on attempt ${attempt} (${elapsed} ms)`, {
                    source: 'Health Monitor Service',
                    endpoint: `/healthMonitorService/testWithRetry/${name}`,
                    response_time: elapsed,
                    message: `${name} failed on attempt ${attempt}`,
                    details: { attempt }
                });
            }
        } catch (err) {
            const elapsed = Date.now() - start;
            await logger.error(`❌ ${name} error on attempt ${attempt} (${elapsed} ms): ${err.message}`, {
                source: 'Health Monitor Service',
                endpoint: `/healthMonitorService/testWithRetry/${name}`,
                response_time: elapsed,
                message: err.message,
                details: err.stack || err
            });
        }
        await new Promise(res => setTimeout(res, 500));
    }
    const uptime = (successCount / maxRetries) * 100;
    const avgResponse = successCount ? Math.round(totalTime / successCount) : 0;
    return { uptime, avgResponse, successCount, maxRetries };
}

// --- Save Result to Firestore ---

async function saveHealthResult(service, result) {
    const ref = db.collection('serviceHealth').doc(service);
    const startTime = Date.now();
    try {
        await ref.set({
            ...result,
            lastTested: new Date(),
        }, { merge: true });
        const elapsed = Date.now() - startTime;
        await logger.info('Health result saved', {
            source: 'Health Monitor Service',
            endpoint: `/healthMonitorService/saveHealthResult/${service}`,
            response_time: elapsed,
            message: `Health result for ${service} saved successfully`,
            details: { service, result }
        });
    } catch (error) {
        const elapsed = Date.now() - startTime;
        await logger.error('Failed to save health result', {
            source: 'Health Monitor Service',
            endpoint: `/healthMonitorService/saveHealthResult/${service}`,
            response_time: elapsed,
            message: `Failed to save health result for ${service}`,
            details: { service, error: error.stack || error }
        });
        throw error;
    }
}

// --- Exported API ---

module.exports = {
    testWithRetry,
    testHuggingFaceOnce,
    testGroqOnce,
    testPineconeOnce,
    testFirebaseOnce,
    saveHealthResult
};