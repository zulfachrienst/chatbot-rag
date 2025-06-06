require('dotenv').config();
const productService = require('../src/services/productService');
const logger = require('../src/utils/logger');

const sampleProducts = [
    {
        name: "iPhone 15 Pro",
        description: "Smartphone flagship Apple dengan chip A17 Pro, kamera 48MP, dan layar Super Retina XDR 6.1 inci. Dilengkapi dengan Action Button dan USB-C. Tahan air IP68 dan mendukung 5G.",
        category: "Smartphone",
        price: "Rp 18.999.000",
        stock: 25,
        brand: "Apple",
        features: ["Chip A17 Pro", "Kamera 48MP", "Action Button", "USB-C", "5G"]
    },
    {
        name: "Samsung Galaxy S24 Ultra",
        description: "Smartphone Android premium dengan S Pen built-in, kamera 200MP dengan zoom 100x, layar Dynamic AMOLED 6.8 inci. AI features dan Galaxy AI integration.",
        category: "Smartphone",
        price: "Rp 19.999.000",
        stock: 15,
        brand: "Samsung",
        features: ["S Pen", "Kamera 200MP", "Zoom 100x", "Galaxy AI", "Dynamic AMOLED"]
    },
    {
        name: "MacBook Air M3",
        description: "Laptop ultrabook dengan chip M3 Apple Silicon, layar Liquid Retina 13 inci, battery life hingga 18 jam. Sangat ringan dan tipis, perfect untuk productivity dan creative work.",
        category: "Laptop",
        price: "Rp 16.999.000",
        stock: 10,
        brand: "Apple",
        features: ["Chip M3", "18 jam battery", "Liquid Retina", "Ultrabook", "Fanless"]
    },
    {
        name: "Dell XPS 13 Plus",
        description: "Laptop premium dengan Intel Core i7 Gen 12, RAM 16GB LPDDR5, SSD 512GB, layar InfinityEdge 13.4 inci 4K OLED. Design modern dengan zero-lattice keyboard.",
        category: "Laptop",
        price: "Rp 24.999.000",
        stock: 8,
        brand: "Dell",
        features: ["Core i7 Gen 12", "16GB LPDDR5", "4K OLED", "Zero-lattice keyboard"]
    },
    {
        name: "Sony WH-1000XM5",
        description: "Headphone wireless premium dengan noise cancelling industry-leading, kualitas suara Hi-Res Audio, battery life 30 jam. Comfortable untuk long listening sessions.",
        category: "Audio",
        price: "Rp 4.999.000",
        stock: 20,
        brand: "Sony",
        features: ["Noise Cancelling", "Hi-Res Audio", "30 jam battery", "Wireless", "Comfortable"]
    },
    {
        name: "iPad Pro 12.9 M2",
        description: "Tablet professional dengan chip M2, layar Liquid Retina XDR 12.9 inci, support Apple Pencil 2nd gen dan Magic Keyboard. Perfect untuk digital art dan productivity.",
        category: "Tablet",
        price: "Rp 15.999.000",
        stock: 12,
        brand: "Apple",
        features: ["Chip M2", "Liquid Retina XDR", "Apple Pencil support", "Magic Keyboard"]
    },
    {
        name: "ASUS ROG Zephyrus G14",
        description: "Gaming laptop dengan AMD Ryzen 9, RTX 4060, RAM 16GB, layar 14 inci 120Hz. Compact gaming powerhouse dengan excellent battery life untuk non-gaming tasks.",
        category: "Gaming Laptop",
        price: "Rp 22.999.000",
        stock: 6,
        brand: "ASUS",
        features: ["Ryzen 9", "RTX 4060", "120Hz display", "Compact", "RGB lighting"]
    }
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