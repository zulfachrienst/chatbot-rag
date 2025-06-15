const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

const COLLECTION = 'chatHistory';
const MAX_HISTORY = 20;

/**
 * Menyimpan pesan ke riwayat chat user.
 * @param {string} userId
 * @param {'user'|'assistant'} role
 * @param {string} content
 */
async function addMessage(userId, role, content) {
    const ref = db.collection(COLLECTION).doc(userId);
    const doc = await ref.get();
    let history = doc.exists ? doc.data().history : [];
    history.push({ role, content, timestamp: Date.now() });
    if (history.length > MAX_HISTORY) history.shift();
    await ref.set({ history });
}

/**
 * Mengambil riwayat chat user (array of {role, content, timestamp})
 * @param {string} userId
 * @returns {Promise<Array>}
 */

async function getHistory(userId) {
    try {
        const ref = db.collection(COLLECTION).doc(userId);
        const doc = await ref.get();
        if (!doc.exists) return [];
        const data = doc.data();
        return Array.isArray(data.history) ? data.history : [];
    } catch (err) {
        // Jika error (misal, data belum ada), kembalikan array kosong
        return [];
    }
}

/**
 * Mendapatkan daftar userId yang punya riwayat chat
 * @returns {Promise<Array<string>>}
 */
async function listUsers() {
    const snapshot = await db.collection(COLLECTION).get();
    return snapshot.docs.map(doc => doc.id);
}

/**
 * Menghapus seluruh riwayat chat user
 * @param {string} userId
 */
async function deleteHistory(userId) {
    await db.collection(COLLECTION).doc(userId).delete();
}

module.exports = { addMessage, getHistory, listUsers, deleteHistory };