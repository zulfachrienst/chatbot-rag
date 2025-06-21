const { admin } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

async function uploadImageBuffer(buffer, mimetype, productId) {
    const bucket = admin.storage().bucket();
    const filename = `products/${productId}/${uuidv4()}`;
    const file = bucket.file(filename);

    // Generate token
    const token = uuidv4();

    await file.save(buffer, {
        metadata: {
            contentType: mimetype,
            metadata: { firebaseStorageDownloadTokens: token }
        }
    });

    // Generate public URL with token
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media&token=${token}`;
    return url;
}

module.exports = { uploadImageBuffer };