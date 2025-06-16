require('dotenv').config();

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
                console.log(`✅ ${name} OK on attempt ${attempt} (${elapsed} ms)`);
            } else {
                console.log(`❌ ${name} failed on attempt ${attempt} (${elapsed} ms)`);
            }
        } catch (err) {
            const elapsed = Date.now() - start;
            console.log(`❌ ${name} error on attempt ${attempt} (${elapsed} ms):`, err.message);
        }
        await new Promise(res => setTimeout(res, 500)); // Sedikit jeda antar percobaan
    }
    const uptime = (successCount / maxRetries) * 100;
    const avgResponse = successCount ? Math.round(totalTime / successCount) : 0;
    return { uptime, avgResponse, successCount, maxRetries };
}

async function testHuggingFaceOnce() {
    const { HfInference } = require('@huggingface/inference');
    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    const result = await hf.featureExtraction({
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
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
        const serviceAccount = {
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
        };
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID,
        });
    }
    const db = admin.firestore();
    const testDoc = await db.collection('test').limit(1).get();
    return !!testDoc;
}

async function runAllTests() {
    console.log('🚀 Starting Service Tests (5x per service)...\n');

    const huggingface = await testWithRetry(testHuggingFaceOnce, 'HuggingFace', 5);
    const groq = await testWithRetry(testGroqOnce, 'GROQ', 5);
    const pinecone = await testWithRetry(testPineconeOnce, 'Pinecone', 5);
    const firebase = await testWithRetry(testFirebaseOnce, 'Firebase', 5);

    console.log('\n📊 Test Results (Uptime & Avg Response Time):');
    console.log(`HuggingFace: Uptime ${huggingface.uptime}% | Avg Response ${huggingface.avgResponse} ms`);
    console.log(`GROQ:        Uptime ${groq.uptime}% | Avg Response ${groq.avgResponse} ms`);
    console.log(`Pinecone:    Uptime ${pinecone.uptime}% | Avg Response ${pinecone.avgResponse} ms`);
    console.log(`Firebase:    Uptime ${firebase.uptime}% | Avg Response ${firebase.avgResponse} ms`);

    const allPassed = [huggingface, groq, pinecone, firebase].every(r => r.successCount > 0);
    console.log('\n' + (allPassed ? '🎉 All services reachable at least once!' : '⚠️  Some services unreachable after 5 tries'));

    if (!allPassed) {
        console.log('\n💡 Tips:');
        console.log('- Check your API keys in .env file');
        console.log('- Make sure all services are properly configured');
        console.log('- Verify your internet connection');
    }
}

runAllTests().catch(console.error);