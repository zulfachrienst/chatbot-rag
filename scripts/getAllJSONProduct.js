const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Tambahkan baris ini!
const { db } = require('../src/config/firebase');

async function exportAllProducts() {
    try {
        const snapshot = await db.collection('products').get();
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });

        // Buat folder ./json jika belum ada
        const jsonDir = path.join(__dirname, 'json');
        if (!fs.existsSync(jsonDir)) {
            fs.mkdirSync(jsonDir);
        }

        // Nama file dengan waktu ISO
        const now = new Date();
        const fileName = `${now.toISOString().replace(/[:.]/g, '-')}.json`;
        const filePath = path.join(jsonDir, fileName);

        fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf-8');
        console.log(`✅ Exported ${products.length} products to ${filePath}`);
    } catch (err) {
        console.error('❌ Failed to export products:', err);
    }
}

exportAllProducts();