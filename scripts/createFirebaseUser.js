const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

async function createUser(email, password, role = 'user') {
    try {
        const userRecord = await admin.auth().createUser({
            email,
            password,
        });
        // Set custom claim role
        await admin.auth().setCustomUserClaims(userRecord.uid, { role });
        console.log(`User created: ${userRecord.uid} (${email}) with role: ${role}`);
    } catch (err) {
        console.error('Error creating user:', err.message);
    }
}

// Contoh penggunaan: node scripts/createFirebaseUser.js email password role
const [,, email, password, role] = process.argv;
if (!email || !password) {
    console.log('Usage: node scripts/createFirebaseUser.js <email> <password> [role]');
    process.exit(1);
}
createUser(email, password, role);