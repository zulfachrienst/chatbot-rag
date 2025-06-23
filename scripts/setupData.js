require('dotenv').config();
const productService = require('../src/services/productService');
const logger = require('../src/utils/logger');

const sampleProducts = [
    {
        name: "Infinix Note 50",
        slug: "infinix-note-50",
        description: "Smartphone dengan baterai besar dan performa handal.",
        category: ["Elektronik", "Smartphone"],
        tags: ["android", "infinix", "layar besar", "hemat baterai"],
        brand: "Infinix",
        price: 2625000,
        discount: { percent: 10, priceAfterDiscount: 2362500 },
        stock: 25,
        features: ["Baterai 5000mAh", "Layar 6,78 inci", "Helio G99"],
        specs: [
            { key: "RAM", value: "8GB" },
            { key: "ROM", value: "128GB" },
            { key: "Kamera", value: "64MP" }
        ],
        variants: [
            { name: "Warna", options: ["Hitam", "Biru"] }
        ],
        images: [
            "https://firebasestorage.googleapis.com/your-bucket/o/products%2Fsample1.jpg?alt=media&token=xxx"
        ],
        rating: { average: 4.6, count: 87 },
        status: "active",
        isFeatured: true,
        warehouseLocation: "Jakarta",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        name: "Xiaomi 15",
        slug: "xiaomi-15",
        description: "Flagship Xiaomi dengan performa tinggi dan kamera canggih.",
        category: ["Elektronik", "Smartphone"],
        tags: ["android", "xiaomi", "flagship", "kamera"],
        brand: "Xiaomi",
        price: 8999000,
        discount: { percent: 5, priceAfterDiscount: 8549050 },
        stock: 12,
        features: ["Snapdragon 8 Gen 3", "Kamera 200MP", "Layar AMOLED 120Hz"],
        specs: [
            { key: "RAM", value: "12GB" },
            { key: "ROM", value: "256GB" },
            { key: "Kamera", value: "200MP" }
        ],
        variants: [
            { name: "Warna", options: ["Putih", "Hitam", "Hijau"] }
        ],
        images: [
            "https://firebasestorage.googleapis.com/your-bucket/o/products%2Fsample2.jpg?alt=media&token=yyy"
        ],
        rating: { average: 4.8, count: 150 },
        status: "active",
        isFeatured: true,
        warehouseLocation: "Bandung",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
    // Tambahkan produk lain sesuai kebutuhan
];

async function setupData() {
    try {
        logger.info('🚀 Starting data setup...');

        // Check if products already exist
        const existingProducts = await productService.getAllProducts();
        if (existingProducts.length > 0) {
            logger.warn(`Found ${existingProducts.length} existing products. Skipping data setup.`);
            logger.info('If you want to reset data, manually delete products from Firebase and Pinecone first.');
            return;
        }

        logger.info(`Adding ${sampleProducts.length} sample products...`);

        for (let i = 0; i < sampleProducts.length; i++) {
            const product = sampleProducts[i];
            logger.info(`Adding product ${i + 1}/${sampleProducts.length}: ${product.name}`);

            await productService.addProduct(product);

            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        logger.info('✅ Data setup completed successfully!');
        logger.info('🎉 You can now test the chatbot with queries like:');
        logger.info('   - "Saya butuh smartphone dengan kamera bagus"');
        logger.info('   - "Laptop untuk gaming budget 20 juta"');
        logger.info('   - "Headphone wireless terbaik"');

        process.exit(0);
    } catch (error) {
        logger.error('❌ Error during data setup:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

setupData();