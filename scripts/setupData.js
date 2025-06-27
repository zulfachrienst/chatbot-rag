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
            {
                name: "Warna",
                options: [
                    {
                        value: "Hitam",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2F1dagw4o0eAzjeIBxUBvk%2F8c4ca3be-3b8d-4e87-86c4-d73d5941510b?alt=media&token=e8fbefb1-fd12-4a09-9af0-9cb53fb08f6a"
                        ]
                    },
                    {
                        value: "Biru",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2F1dagw4o0eAzjeIBxUBvk%2F8c4ca3be-3b8d-4e87-86c4-d73d5941510b?alt=media&token=e8fbefb1-fd12-4a09-9af0-9cb53fb08f6a"
                        ]
                    },
                    {
                        value: "Silver",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2F1dagw4o0eAzjeIBxUBvk%2F8c4ca3be-3b8d-4e87-86c4-d73d5941510b?alt=media&token=e8fbefb1-fd12-4a09-9af0-9cb53fb08f6a"
                        ]
                    }
                ]
            }
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
            {
                name: "Warna",
                options: [
                    {
                        value: "Biru",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2F1fNNAvi7dhnPYVzo5di6%2F8771164c-3fc2-4365-8534-89c3bc9349f2?alt=media&token=0ad71a82-3e3b-4b61-8227-d683b3377bc7"
                        ]
                    },
                    {
                        value: "Hitam",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2F1fNNAvi7dhnPYVzo5di6%2F8771164c-3fc2-4365-8534-89c3bc9349f2?alt=media&token=0ad71a82-3e3b-4b61-8227-d683b3377bc7"
                        ]
                    }
                ]
            }
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
            {
                name: "Warna",
                options: [
                    {
                        value: "Gradien Biru",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2F6GSbtcNb4VRyTkyzhyYD%2F3397d12b-beb7-414a-9082-320af818cf8d?alt=media&token=aaefa2ed-3314-4328-8341-fc1e632d4371"
                        ]
                    },
                    {
                        value: "Hitam",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2F6GSbtcNb4VRyTkyzhyYD%2F3397d12b-beb7-414a-9082-320af818cf8d?alt=media&token=aaefa2ed-3314-4328-8341-fc1e632d4371"
                        ]
                    }
                ]
            }
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
            {
                name: "Warna",
                options: [
                    {
                        value: "Biru",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2F8MbIzMYRHre3tTvWi2EP%2F9c95c1dc-f60e-4e63-9f3f-625be2dc0b74?alt=media&token=a0f0f72c-f8ec-457f-b5af-c219446cf8e6"
                        ]
                    },
                    {
                        value: "Hitam",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2F8MbIzMYRHre3tTvWi2EP%2F9c95c1dc-f60e-4e63-9f3f-625be2dc0b74?alt=media&token=a0f0f72c-f8ec-457f-b5af-c219446cf8e6"
                        ]
                    },
                    {
                        value: "Putih",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2F8MbIzMYRHre3tTvWi2EP%2F9c95c1dc-f60e-4e63-9f3f-625be2dc0b74?alt=media&token=a0f0f72c-f8ec-457f-b5af-c219446cf8e6"
                        ]
                    }
                ]
            }
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
            {
                name: "Warna",
                options: [
                    {
                        value: "Mint",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2F8f9716V89jYjkChh5LW3%2F5a657aa5-c78f-44a1-b317-b04461f348e7?alt=media&token=20f30e2a-639b-401d-b9fa-683f1521b4b3"
                        ]
                    },
                    {
                        value: "Hitam",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2F8f9716V89jYjkChh5LW3%2F5a657aa5-c78f-44a1-b317-b04461f348e7?alt=media&token=20f30e2a-639b-401d-b9fa-683f1521b4b3"
                        ]
                    },
                    {
                        value: "Biru",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2F8f9716V89jYjkChh5LW3%2F5a657aa5-c78f-44a1-b317-b04461f348e7?alt=media&token=20f30e2a-639b-401d-b9fa-683f1521b4b3"
                        ]
                    }
                ]
            }
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
            {
                name: "Warna",
                options: [
                    {
                        value: "Hitam",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2FCI1GhRVVq9DRVfsFTFfj%2Feddf8af4-9f74-4971-a4d0-1a0162cc2ae8?alt=media&token=ef1c11fb-356e-4f51-9b48-403753fe33a8"
                        ]
                    },
                    {
                        value: "Biru",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2FCI1GhRVVq9DRVfsFTFfj%2Feddf8af4-9f74-4971-a4d0-1a0162cc2ae8?alt=media&token=ef1c11fb-356e-4f51-9b48-403753fe33a8"
                        ]
                    },
                    {
                        value: "Gold",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2FCI1GhRVVq9DRVfsFTFfj%2Feddf8af4-9f74-4971-a4d0-1a0162cc2ae8?alt=media&token=ef1c11fb-356e-4f51-9b48-403753fe33a8"
                        ]
                    }
                ]
            }
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
            {
                name: "Warna",
                options: [
                    {
                        value: "Phantom Black",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2FDac8XZmoVWUhAMKAyJsZ%2F795df427-55c4-4562-975a-37d8c0c6481e?alt=media&token=315289e3-4a4c-4792-87be-e9cd6f94d9bc"
                        ]
                    },
                    {
                        value: "Phantom Silver",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2FDac8XZmoVWUhAMKAyJsZ%2F795df427-55c4-4562-975a-37d8c0c6481e?alt=media&token=315289e3-4a4c-4792-87be-e9cd6f94d9bc"
                        ]
                    },
                    {
                        value: "Phantom Green",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2FDac8XZmoVWUhAMKAyJsZ%2F795df427-55c4-4562-975a-37d8c0c6481e?alt=media&token=315289e3-4a4c-4792-87be-e9cd6f94d9bc"
                        ]
                    }
                ]
            }
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
            {
                name: "Warna",
                options: [
                    {
                        value: "Gradien Purple",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2FImzgCBvpz4SbKWSwuyaC%2F23dc0f37-7db2-4769-b330-72932f465756?alt=media&token=06a3c507-eccd-41f4-b783-f80f60e364fe"
                        ]
                    },
                    {
                        value: "Hitam",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2FImzgCBvpz4SbKWSwuyaC%2F23dc0f37-7db2-4769-b330-72932f465756?alt=media&token=06a3c507-eccd-41f4-b783-f80f60e364fe"
                        ]
                    }
                ]
            }
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
            {
                name: "Warna",
                options: [
                    {
                        value: "Hitam",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2FLwCez9ngAfd8hiAPMWGO%2Fae67ebb3-db42-473e-98dc-7fca2806a90e?alt=media&token=f3293e9a-22e1-403d-a3bb-c043db620f1a"
                        ]
                    },
                    {
                        value: "Biru",
                        images: [
                            "https://firebasestorage.googleapis.com/v0/b/chatbot-rag-development.firebasestorage.app/o/products%2FLwCez9ngAfd8hiAPMWGO%2Fae67ebb3-db42-473e-98dc-7fca2806a90e?alt=media&token=f3293e9a-22e1-403d-a3bb-c043db620f1a"
                        ]
                    }
                ]
            }
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