const { admin } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

/**
 * Mengunggah buffer gambar ke Firebase Storage dalam folder berdasarkan productId
 */
async function uploadImageBuffer(buffer, mimetype, productId) {
    const bucket = admin.storage().bucket();
    const filename = `products/${productId}/${uuidv4()}`;
    const file = bucket.file(filename);

    // Generate token untuk akses publik
    const token = uuidv4();

    await file.save(buffer, {
        metadata: {
            contentType: mimetype,
            metadata: { firebaseStorageDownloadTokens: token }
        }
    });

    // Buat URL publik
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media&token=${token}`;
    return url;
}

/**
 * Menghapus satu file dari Firebase Storage berdasarkan URL download.
 */
async function deleteFileByUrl(url) {
    if (!url) return;
    const match = url.match(/\/o\/(.+)\?alt=media/);
    if (!match) return;
    const filePath = decodeURIComponent(match[1]);
    const bucket = admin.storage().bucket();
    await bucket.file(filePath).delete().catch(() => {});
}

/**
 * Menghapus semua file dalam "folder" (prefix) tertentu di Firebase Storage.
 */
async function deleteAllFilesByPrefix(prefix) {
    const bucket = admin.storage().bucket(); // ✅ diperbaiki dari getStorage() ke admin.storage()
    const [files] = await bucket.getFiles({ prefix });

    if (files.length === 0) {
        console.log('Tidak ada file yang ditemukan di folder:', prefix);
        return;
    }

    await Promise.all(files.map(file => file.delete()));
    console.log('Semua file berhasil dihapus dari folder:', prefix);
}

module.exports = {
    uploadImageBuffer,
    deleteFileByUrl,
    deleteAllFilesByPrefix
};
