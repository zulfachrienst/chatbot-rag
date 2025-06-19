const { admin } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

async function uploadImageBuffer(buffer, mimetype, productId) {
    const bucket = admin.storage().bucket();
    const filename = `products/${productId}/${uuidv4()}`;
    const file = bucket.file(filename);

    await file.save(buffer, {
        metadata: {
            contentType: mimetype,
            metadata: { firebaseStorageDownloadTokens: uuidv4() }
        }
    });

    // Generate public URL
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media`;
    return url;
}

module.exports = { uploadImageBuffer };