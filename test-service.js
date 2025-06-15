// test-services.js
require('dotenv').config();

async function testHuggingFace() {
    try {
        console.log('🧪 Testing HuggingFace...');
        const { HfInference } = require('@huggingface/inference');
        const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

        const result = await hf.featureExtraction({
            model: 'sentence-transformers/all-MiniLM-L6-v2',
            inputs: 'test embedding'
        });

        console.log('✅ HuggingFace OK - Embedding length:', result.length);
        return true;
    } catch (error) {
        console.error('❌ HuggingFace Error:', error.message);
        return false;
    }
}

async function testGroq() {
    try {
        console.log('🧪 Testing GROQ...');
        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: "Hello" }],
            model: "llama3-70b-8192",
            max_tokens: 10
        });

        console.log('✅ GROQ OK - Response:', completion.choices[0]?.message?.content);
        return true;
    } catch (error) {
        console.error('❌ GROQ Error:', error.message);
        return false;
    }
}

async function testPinecone() {
    try {
        console.log('🧪 Testing Pinecone...');
        const { Pinecone } = require('@pinecone-database/pinecone');
        const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

        // Test connection
        const indexes = await pinecone.listIndexes();
        console.log('✅ Pinecone OK - Available indexes:', indexes.indexes?.map(i => i.name));
        return true;
    } catch (error) {
        console.error('❌ Pinecone Error:', error.message);
        return false;
    }
}

async function testFirebase() {
    try {
        console.log('🧪 Testing Firebase...');
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
        console.log('✅ Firebase OK - Connection successful');
        return true;
    } catch (error) {
        console.error('❌ Firebase Error:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting Service Tests...\n');

    const results = {
        huggingface: await testHuggingFace(),
        groq: await testGroq(),
        pinecone: await testPinecone(),
        firebase: await testFirebase()
    };

    console.log('\n📊 Test Results:');
    console.log('HuggingFace:', results.huggingface ? '✅' : '❌');
    console.log('GROQ:', results.groq ? '✅' : '❌');
    console.log('Pinecone:', results.pinecone ? '✅' : '❌');
    console.log('Firebase:', results.firebase ? '✅' : '❌');

    const allPassed = Object.values(results).every(r => r);
    console.log('\n' + (allPassed ? '🎉 All tests passed!' : '⚠️  Some tests failed'));

    if (!allPassed) {
        console.log('\n💡 Tips:');
        console.log('- Check your API keys in .env file');
        console.log('- Make sure all services are properly configured');
        console.log('- Verify your internet connection');
    }
}

runAllTests().catch(console.error);