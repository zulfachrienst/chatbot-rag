const { db } = require('../config/firebase');
const logger = require('../utils/logger');

// --- Service Test Functions ---

async function testHuggingFaceOnce() {
    const { HfInference } = require('@huggingface/inference');
    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    const result = await hf.featureExtraction({
        provider: "hf-inference",
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: 'test embedding'
    });
    return Array.isArray(result);
}

async function testGroqOnce() {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: "Hello" }],
        model: "llama3-70b-8192",
        max_tokens: 10
    });
    return !!completion.choices[0]?.message?.content;
}

async function testPineconeOnce() {
    const { Pinecone } = require('@pinecone-database/pinecone');
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const indexes = await pinecone.listIndexes();
    return Array.isArray(indexes.indexes);
}

async function testFirebaseOnce() {
    // Cek koneksi Firestore dengan operasi sederhana
    const testRef = db.collection('serviceHealth').doc('firebase-test');
    await testRef.set({ testedAt: new Date() }, { merge: true });
    const doc = await testRef.get();
    return doc.exists;
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
                logger.info(`✅ ${name} OK on attempt ${attempt} (${elapsed} ms)`);
            } else {
                logger.warn(`❌ ${name} failed on attempt ${attempt} (${elapsed} ms)`);
            }
        } catch (err) {
            const elapsed = Date.now() - start;
            logger.warn(`❌ ${name} error on attempt ${attempt} (${elapsed} ms): ${err.message}`);
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
    await ref.set({
        ...result,
        lastTested: new Date(),
    }, { merge: true });
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