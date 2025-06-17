const { getFirestore } = require('firebase-admin/firestore');
const logger = require('../utils/logger');
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
    const startTime = Date.now();
    const endpoint = '/historyService/addMessage';
    const request_id = logger.generateRequestId();
    try {
        const ref = db.collection(COLLECTION).doc(userId);
        const doc = await ref.get();
        let history = doc.exists ? doc.data().history : [];
        history.push({ role, content, timestamp: Date.now() });
        if (history.length > MAX_HISTORY) history.shift();
        await ref.set({ history });

        await logger.info('Added message to chat history', {
            source: 'History Service',
            user_id: userId,
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: `Added message for user ${userId}`,
            details: { role, content }
        });
    } catch (error) {
        await logger.error('Error adding message to chat history', {
            source: 'History Service',
            user_id: userId,
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: error.message,
            details: error.stack || error
        });
        throw error;
    }
}

/**
 * Mengambil riwayat chat user (array of {role, content, timestamp})
 * @param {string} userId
 * @returns {Promise<Array>}
 */
async function getHistory(userId) {
    const startTime = Date.now();
    const endpoint = '/historyService/getHistory';
    const request_id = logger.generateRequestId();
    try {
        const ref = db.collection(COLLECTION).doc(userId);
        const doc = await ref.get();
        if (!doc.exists) {
            await logger.info('No chat history found', {
                source: 'History Service',
                user_id: userId,
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                message: `No chat history for user ${userId}`,
                details: {}
            });
            return [];
        }
        const data = doc.data();
        await logger.info('Fetched chat history', {
            source: 'History Service',
            user_id: userId,
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: `Fetched chat history for user ${userId}`,
            details: { count: Array.isArray(data.history) ? data.history.length : 0 }
        });
        return Array.isArray(data.history) ? data.history : [];
    } catch (err) {
        await logger.error('Error fetching chat history', {
            source: 'History Service',
            user_id: userId,
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: err.message,
            details: err.stack || err
        });
        return [];
    }
}

/**
 * Mendapatkan daftar userId yang punya riwayat chat
 * @returns {Promise<Array<string>>}
 */
async function listUsers() {
    const startTime = Date.now();
    const endpoint = '/historyService/listUsers';
    const request_id = logger.generateRequestId();
    try {
        const snapshot = await db.collection(COLLECTION).get();
        const users = snapshot.docs.map(doc => ({
            userId: doc.id,
            ...doc.data()
        }));
        await logger.info('Fetched user list from chat history', {
            source: 'History Service',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: 'Fetched user list from chat history',
            details: { count: users.length }
        });
        return users;
    } catch (error) {
        await logger.error('Error fetching user list from chat history', {
            source: 'History Service',
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: error.message,
            details: error.stack || error
        });
        return [];
    }
}

/**
 * Menghapus seluruh riwayat chat user
 * @param {string} userId
 */
async function deleteHistory(userId) {
    const startTime = Date.now();
    const endpoint = '/historyService/deleteHistory';
    const request_id = logger.generateRequestId();
    try {
        await db.collection(COLLECTION).doc(userId).delete();
        await logger.info('Deleted chat history', {
            source: 'History Service',
            user_id: userId,
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: `Deleted chat history for user ${userId}`,
            details: {}
        });
    } catch (error) {
        await logger.error('Error deleting chat history', {
            source: 'History Service',
            user_id: userId,
            request_id,
            endpoint,
            response_time: Date.now() - startTime,
            message: error.message,
            details: error.stack || error
        });
        throw error;
    }
}

module.exports = { addMessage, getHistory, listUsers, deleteHistory };