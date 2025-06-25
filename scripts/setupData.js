require('dotenv').config();
const productService = require('../src/services/productService');
const logger = require('../src/utils/logger');

const sampleProducts = [
    {
        name: "Infinix Note 50",
        slug: "infinix-note-50",
        description: "Smartphone dengan baterai besar dan performa handal.",
        category: ["Elektronik", "Smartphone"],
        tags: ["android", "infinix", "baterai besar", "hemat baterai"],
        brand: "Infinix",
        price: 2625000,
        discount: { percent: 15, priceAfterDiscount: 2231250 },
        stock: 25,
        features: ["Baterai 5000mAh", "Layar 6,78 inci", "Android 13"],
        specs: [
            { key: "RAM", value: "8GB" },
            { key: "ROM", value: "128GB" },
            { key: "Kamera", value: "50MP" },
            { key: "Baterai", value: "5000mAh" }
        ],
        variants: [
            { name: "Warna", options: ["Hitam", "Biru", "Silver"] }
        ],
        images: [
            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2F1dagw4o0eAzjeIBxUBvk%2F8c4ca3be-3b8d-4e87-86c4-d73d5941510b?alt=media&token=e8fbefb1-fd12-4a09-9af0-9cb53fb08f6a"
        ],
        rating: { average: 4.5, count: 123 },
        status: "active",
        isFeatured: true,
        warehouseLocation: "Jakarta",
        createdAt: new Date("2025-06-15").toISOString(),
        updatedAt: new Date("2025-06-20").toISOString()
    },
    {
        name: "Realme 14 5G",
        slug: "realme-14-5g",
        description: "Smartphone 5G dengan desain elegan.",
        category: ["Elektronik", "Smartphone"],
        tags: ["android", "realme", "5g", "gaming"],
        brand: "Realme",
        price: 4100000,
        discount: { percent: 8, priceAfterDiscount: 3772000 },
        stock: 15,
        features: ["Prosesor Dimensity 6100+", "Layar 6,6 inci", "5G Ready"],
        specs: [
            { key: "RAM", value: "6GB" },
            { key: "ROM", value: "128GB" },
            { key: "Prosesor", value: "Dimensity 6100+" },
            { key: "Layar", value: "6.6 inci" }
        ],
        variants: [
            { name: "Warna", options: ["Biru", "Hitam"] }
        ],
        images: [
            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2F1fNNAvi7dhnPYVzo5di6%2F8771164c-3fc2-4365-8534-89c3bc9349f2?alt=media&token=0ad71a82-3e3b-4b61-8227-d683b3377bc7"
        ],
        rating: { average: 4.3, count: 87 },
        status: "active",
        isFeatured: false,
        warehouseLocation: "Surabaya",
        createdAt: new Date("2025-06-10").toISOString(),
        updatedAt: new Date("2025-06-18").toISOString()
    },
    {
        name: "OPPO A5 Pro 5G",
        slug: "oppo-a5-pro-5g",
        description: "Smartphone 5G dengan harga terjangkau.",
        category: ["Elektronik", "Smartphone"],
        tags: ["android", "oppo", "5g", "terjangkau"],
        brand: "OPPO",
        price: 3499000,
        discount: { percent: 12, priceAfterDiscount: 3079120 },
        stock: 20,
        features: ["Prosesor Dimensity 700", "Layar 6,5 inci", "Fast Charging"],
        specs: [
            { key: "RAM", value: "6GB" },
            { key: "ROM", value: "128GB" },
            { key: "Prosesor", value: "Dimensity 700" },
            { key: "Layar", value: "6.5 inci" }
        ],
        variants: [
            { name: "Warna", options: ["Gradien Biru", "Hitam"] }
        ],
        images: [
            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2F6GSbtcNb4VRyTkyzhyYD%2F3397d12b-beb7-414a-9082-320af818cf8d?alt=media&token=aaefa2ed-3314-4328-8341-fc1e632d4371"
        ],
        rating: { average: 4.2, count: 156 },
        status: "active",
        isFeatured: false,
        warehouseLocation: "Bandung",
        createdAt: new Date("2025-06-12").toISOString(),
        updatedAt: new Date("2025-06-19").toISOString()
    },
    {
        name: "Samsung Galaxy A26",
        slug: "samsung-galaxy-a26",
        description: "Smartphone kelas menengah dengan layar 6,5 inci dan baterai 5000mAh.",
        category: ["Elektronik", "Smartphone"],
        tags: ["android", "samsung", "galaxy", "baterai awet"],
        brand: "Samsung",
        price: 3100000,
        discount: { percent: 10, priceAfterDiscount: 2790000 },
        stock: 10,
        features: ["Layar 6,5 inci", "Baterai 5000mAh", "One UI"],
        specs: [
            { key: "RAM", value: "4GB" },
            { key: "ROM", value: "128GB" },
            { key: "Layar", value: "6.5 inci" },
            { key: "Baterai", value: "5000mAh" }
        ],
        variants: [
            { name: "Warna", options: ["Biru", "Hitam", "Putih"] }
        ],
        images: [
            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2F8MbIzMYRHre3tTvWi2EP%2F9c95c1dc-f60e-4e63-9f3f-625be2dc0b74?alt=media&token=a0f0f72c-f8ec-457f-b5af-c219446cf8e6"
        ],
        rating: { average: 4.1, count: 95 },
        status: "active",
        isFeatured: false,
        warehouseLocation: "Jakarta",
        createdAt: new Date("2025-06-08").toISOString(),
        updatedAt: new Date("2025-06-21").toISOString()
    },
    {
        name: "Samsung Galaxy A36",
        slug: "samsung-galaxy-a36",
        description: "Smartphone dengan desain stylish dan performa handal.",
        category: ["Elektronik", "Smartphone"],
        tags: ["android", "samsung", "stylish", "kamera"],
        brand: "Samsung",
        price: 4550000,
        discount: { percent: 7, priceAfterDiscount: 4231500 },
        stock: 15,
        features: ["Kamera 50MP", "Layar 6,4 inci", "Super AMOLED"],
        specs: [
            { key: "RAM", value: "6GB" },
            { key: "ROM", value: "128GB" },
            { key: "Kamera", value: "50MP" },
            { key: "Layar", value: "6.4 inci" }
        ],
        variants: [
            { name: "Warna", options: ["Mint", "Hitam", "Biru"] }
        ],
        images: [
            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2F8f9716V89jYjkChh5LW3%2F5a657aa5-c78f-44a1-b317-b04461f348e7?alt=media&token=20f30e2a-639b-401d-b9fa-683f1521b4b3"
        ],
        rating: { average: 4.4, count: 78 },
        status: "active",
        isFeatured: true,
        warehouseLocation: "Medan",
        createdAt: new Date("2025-06-14").toISOString(),
        updatedAt: new Date("2025-06-22").toISOString()
    },
    {
        name: "Infinix Note 30 5G",
        slug: "infinix-note-30-5g",
        description: "Smartphone 5G dengan harga terjangkau.",
        category: ["Elektronik", "Smartphone"],
        tags: ["android", "infinix", "5g", "murah"],
        brand: "Infinix",
        price: 2499000,
        discount: { percent: 13, priceAfterDiscount: 2174130 },
        stock: 14,
        features: ["Layar 6,78 inci", "Baterai 5000mAh", "5G Ready"],
        specs: [
            { key: "RAM", value: "8GB" },
            { key: "ROM", value: "128GB" },
            { key: "Layar", value: "6.78 inci" },
            { key: "Baterai", value: "5000mAh" }
        ],
        variants: [
            { name: "Warna", options: ["Hitam", "Biru", "Gold"] }
        ],
        images: [
            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2FCI1GhRVVq9DRVfsFTFfj%2Feddf8af4-9f74-4971-a4d0-1a0162cc2ae8?alt=media&token=ef1c11fb-356e-4f51-9b48-403753fe33a8"
        ],
        rating: { average: 4.3, count: 134 },
        status: "active",
        isFeatured: false,
        warehouseLocation: "Surabaya",
        createdAt: new Date("2025-06-11").toISOString(),
        updatedAt: new Date("2025-06-20").toISOString()
    },
    {
        name: "Samsung Galaxy S25 Edge",
        slug: "samsung-galaxy-s25-edge",
        description: "Smartphone flagship dengan desain premium.",
        category: ["Elektronik", "Smartphone"],
        tags: ["android", "samsung", "flagship", "premium"],
        brand: "Samsung",
        price: 19499000,
        discount: { percent: 5, priceAfterDiscount: 18524050 },
        stock: 26,
        features: ["Kamera 200MP", "Layar AMOLED", "Snapdragon 8 Gen 3"],
        specs: [
            { key: "RAM", value: "12GB" },
            { key: "ROM", value: "256GB" },
            { key: "Kamera", value: "200MP" },
            { key: "Layar", value: "AMOLED 6.8 inci" }
        ],
        variants: [
            { name: "Warna", options: ["Phantom Black", "Phantom Silver", "Phantom Green"] }
        ],
        images: [
            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2FDac8XZmoVWUhAMKAyJsZ%2F795df427-55c4-4562-975a-37d8c0c6481e?alt=media&token=315289e3-4a4c-4792-87be-e9cd6f94d9bc"
        ],
        rating: { average: 4.9, count: 45 },
        status: "active",
        isFeatured: true,
        warehouseLocation: "Jakarta",
        createdAt: new Date("2025-06-16").toISOString(),
        updatedAt: new Date("2025-06-23").toISOString()
    },
    {
        name: "OPPO A5 Pro",
        slug: "oppo-a5-pro",
        description: "Smartphone dengan desain stylish dan performa handal.",
        category: ["Elektronik", "Smartphone"],
        tags: ["android", "oppo", "stylish", "kamera"],
        brand: "OPPO",
        price: 2749000,
        discount: { percent: 11, priceAfterDiscount: 2446610 },
        stock: 20,
        features: ["Kamera 50MP", "Layar 6,5 inci", "ColorOS"],
        specs: [
            { key: "RAM", value: "6GB" },
            { key: "ROM", value: "128GB" },
            { key: "Kamera", value: "50MP" },
            { key: "Layar", value: "6.5 inci" }
        ],
        variants: [
            { name: "Warna", options: ["Gradien Purple", "Hitam"] }
        ],
        images: [
            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2FImzgCBvpz4SbKWSwuyaC%2F23dc0f37-7db2-4769-b330-72932f465756?alt=media&token=06a3c507-eccd-41f4-b783-f80f60e364fe"
        ],
        rating: { average: 4.2, count: 112 },
        status: "active",
        isFeatured: false,
        warehouseLocation: "Bandung",
        createdAt: new Date("2025-06-13").toISOString(),
        updatedAt: new Date("2025-06-22").toISOString()
    },
    {
        name: "Xiaomi Redmi A5",
        slug: "xiaomi-redmi-a5",
        description: "Smartphone entry-level dengan fitur lengkap.",
        category: ["Elektronik", "Smartphone"],
        tags: ["android", "xiaomi", "entry-level", "murah"],
        brand: "Xiaomi",
        price: 1140000,
        discount: { percent: 18, priceAfterDiscount: 934800 },
        stock: 20,
        features: ["Baterai 5000mAh", "Layar 6,52 inci", "MIUI"],
        specs: [
            { key: "RAM", value: "3GB" },
            { key: "ROM", value: "32GB" },
            { key: "Baterai", value: "5000mAh" },
            { key: "Layar", value: "6.52 inci" }
        ],
        variants: [
            { name: "Warna", options: ["Hitam", "Biru"] }
        ],
        images: [
            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2FLwCez9ngAfd8hiAPMWGO%2Fae67ebb3-db42-473e-98dc-7fca2806a90e?alt=media&token=f3293e9a-22e1-403d-a3bb-c043db620f1a"
        ],
        rating: { average: 4.0, count: 203 },
        status: "active",
        isFeatured: false,
        warehouseLocation: "Jakarta",
        createdAt: new Date("2025-06-05").toISOString(),
        updatedAt: new Date("2025-06-21").toISOString()
    },
    {
        name: "Infinix Hot 40 Pro",
        slug: "infinix-hot-40-pro",
        description: "Smartphone dengan kamera AI dan performa gaming.",
        category: ["Elektronik", "Smartphone"],
        tags: ["android", "infinix", "gaming", "kamera ai"],
        brand: "Infinix",
        price: 1883000,
        discount: { percent: 14, priceAfterDiscount: 1619380 },
        stock: 18,
        features: ["Kamera 50MP", "RAM 8GB", "Gaming Mode"],
        specs: [
            { key: "RAM", value: "8GB" },
            { key: "ROM", value: "128GB" },
            { key: "Kamera", value: "50MP" },
            { key: "Prosesor", value: "Helio G99" }
        ],
        variants: [
            { name: "Warna", options: ["Gradient Blue", "Hitam"] }
        ],
        images: [
            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2FPOmCllhSB5G66cyEK3c2%2F49df99a7-5cb0-4d85-9bfc-50e005f1e5b5?alt=media&token=6de98132-8c7c-4b3e-b1d5-e58b0c125d54"
        ],
        rating: { average: 4.3, count: 167 },
        status: "active",
        isFeatured: false,
        warehouseLocation: "Medan",
        createdAt: new Date("2025-06-09").toISOString(),
        updatedAt: new Date("2025-06-22").toISOString()
    },
    {
        name: "Realme C75x",
        slug: "realme-c75x",
        description: "Smartphone entry-level dengan performa handal.",
        category: ["Elektronik", "Smartphone"],
        tags: ["android", "realme", "entry-level", "handal"],
        brand: "Realme",
        price: 1925000,
        discount: { percent: 9, priceAfterDiscount: 1751750 },
        stock: 25,
        features: ["Baterai 5000mAh", "Layar 6,5 inci", "Realme UI"],
        specs: [
            { key: "RAM", value: "4GB" },
            { key: "ROM", value: "128GB" },
            { key: "Baterai", value: "5000mAh" },
            { key: "Layar", value: "6.5 inci" }
        ],
        variants: [
            { name: "Warna", options: ["Hitam", "Biru", "Gold"] }
        ],
        images: [
            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2FWHJcscWqyLEIF5U0hjHM%2Fe39aff09-0e19-4372-b431-83de27a15a92?alt=media&token=57c19a7d-6fc7-4d1c-a142-2d01b97272e5"
        ],
        rating: { average: 4.1, count: 145 },
        status: "active",
        isFeatured: false,
        warehouseLocation: "Surabaya",
        createdAt: new Date("2025-06-07").toISOString(),
        updatedAt: new Date("2025-06-23").toISOString()
    },
    {
        name: "Motorola Edge 60 Fusion",
        slug: "motorola-edge-60-fusion",
        description: "Smartphone dengan desain premium dan kamera canggih.",
        category: ["Elektronik", "Smartphone"],
        tags: ["android", "motorola", "premium", "kamera canggih"],
        brand: "Motorola",
        price: 5354000,
        discount: { percent: 6, priceAfterDiscount: 5032760 },
        stock: 9,
        features: ["Kamera 64MP", "Layar OLED", "Snapdragon 7s Gen 2"],
        specs: [
            { key: "RAM", value: "8GB" },
            { key: "ROM", value: "256GB" },
            { key: "Kamera", value: "64MP" },
            { key: "Layar", value: "OLED 6.5 inci" }
        ],
        variants: [
            { name: "Warna", options: ["Smoky Blue", "Charcoal Gray"] }
        ],
        images: [
            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2Fb1XO1OUo6P7JcyWVf2hW%2F9a1da8a5-9347-4837-9e80-3ea7fdf5e5ec?alt=media&token=1f58e041-6d22-483b-b3b2-e36152c671e0"
        ],
        rating: { average: 4.5, count: 62 },
        status: "active",
        isFeatured: true,
        warehouseLocation: "Jakarta",
        createdAt: new Date("2025-06-17").toISOString(),
        updatedAt: new Date("2025-06-23").toISOString()
    },
    {
        name: "OPPO Find N5",
        slug: "oppo-find-n5",
        description: "Smartphone lipat dengan teknologi terbaru.",
        category: ["Elektronik", "Smartphone"],
        tags: ["android", "oppo", "foldable", "flagship"],
        brand: "OPPO",
        price: 27999000,
        discount: { percent: 3, priceAfterDiscount: 27159030 },
        stock: 4,
        features: ["Layar lipat", "Kamera 50MP", "Snapdragon 8 Gen 3"],
        specs: [
            { key: "RAM", value: "16GB" },
            { key: "ROM", value: "512GB" },
            { key: "Kamera", value: "50MP" },
            { key: "Layar", value: "Foldable AMOLED" }
        ],
        variants: [
            { name: "Warna", options: ["Champagne Gold", "Obsidian Black"] }
        ],
        images: [
            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2Fbn1IowMrOsbK6WvubJeq%2Fffd59214-26bf-41d1-a4bd-2631c80a2aee?alt=media&token=63d95932-202f-43d0-ae16-1dad386659d8"
        ],
        rating: { average: 4.8, count: 23 },
        status: "active",
        isFeatured: true,
        warehouseLocation: "Jakarta",
        createdAt: new Date("2025-06-18").toISOString(),
        updatedAt: new Date("2025-06-23").toISOString()
    },
    {
        name: "Realme C53",
        slug: "realme-c53",
        description: "Smartphone dengan baterai besar dan harga terjangkau.",
        category: ["Elektronik", "Smartphone"],
        tags: ["android", "realme", "baterai besar", "terjangkau"],
        brand: "Realme",
        price: 1420000,
        discount: { percent: 16, priceAfterDiscount: 1192800 },
        stock: 25,
        features: ["Baterai 5000mAh", "RAM 4GB", "Realme UI 4.0"],
        specs: [
            { key: "RAM", value: "4GB" },
            { key: "ROM", value: "64GB" },
            { key: "Baterai", value: "5000mAh" },
            { key: "Layar", value: "6.74 inci" }
        ],
        variants: [
            { name: "Warna", options: ["Champion Gold", "Mighty Black"] }
        ],
        images: [
            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2FbpjfxmkRmDfp9aeNEg8c%2F07c4373e-be00-4eaf-9015-8785c8f0ea58?alt=media&token=305d8e72-9c3a-4f1d-8930-aeacafa553e1"
        ],
        rating: { average: 4.0, count: 189 },
        status: "active",
        isFeatured: false,
        warehouseLocation: "Bandung",
        createdAt: new Date("2025-06-06").toISOString(),
        updatedAt: new Date("2025-06-22").toISOString()
    },
    {
        name: "Xiaomi 15",
        slug: "xiaomi-15",
        description: "Smartphone flagship dengan kamera canggih dan performa tinggi.",
        category: ["Elektronik", "Smartphone"],
        tags: ["android", "xiaomi", "flagship", "kamera canggih"],
        brand: "Xiaomi",
        price: 11680000,
        discount: { percent: 4, priceAfterDiscount: 11212800 },
        stock: 8,
        features: ["Kamera 108MP", "Layar AMOLED", "Snapdragon 8 Gen 3"],
        specs: [
            { key: "RAM", value: "12GB" },
            { key: "ROM", value: "256GB" },
            { key: "Kamera", value: "108MP" },
            { key: "Layar", value: "AMOLED 6.67 inci" }
        ],
        variants: [
            { name: "Warna", options: ["Titanium Black", "Titanium Blue", "Titanium Gray"] }
        ],
        images: [
            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2Fd4M4ToR4km0sE5hAC2R8%2F65b3dd92-4a97-4cb0-b8db-e3619c9d53f9?alt=media&token=00f67c4d-578d-4ca9-b20a-f8df6450598e"
        ],
        rating: { average: 4.7, count: 98 },
        status: "active",
        isFeatured: true,
        warehouseLocation: "Jakarta",
        createdAt: new Date("2025-06-19").toISOString(),
        updatedAt: new Date("2025-06-23").toISOString()
    },
    {
        name: "Infinix Note 50 Pro",
        slug: "infinix-note-50-pro",
        description: "Smartphone dengan performa tinggi dan harga terjangkau.",
        category: ["Elektronik", "Smartphone"],
        tags: ["android", "infinix", "performa tinggi", "terjangkau"],
        brand: "Infinix",
        price: 2769000,
        discount: { percent: 12, priceAfterDiscount: 2436720 },
        stock: 20,
        features: ["Prosesor Helio G99", "Layar 6,78 inci", "Fast Charging"],
        specs: [
            { key: "RAM", value: "8GB" },
            { key: "ROM", value: "128GB" },
            { key: "Prosesor", value: "Helio G99" },
            { key: "Layar", value: "6.78 inci" }
        ],
        variants: [
            { name: "Warna", options: ["Forest Green", "Sunset Gold"] }
        ],
        images: [
            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2FgOEcnqMP1v8JYtbfhNhq%2F591cd7c2-8461-4f22-9096-6b5ec0217326?alt=media&token=55e937fc-df0a-4fb0-bf92-24e213c18b26"
        ],
        rating: { average: 4.4, count: 178 },
        status: "active",
        isFeatured: false,
        warehouseLocation: "Surabaya",
        createdAt: new Date("2025-06-10").toISOString(),
        updatedAt: new Date("2025-06-23").toISOString()
    }
]

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