const groq = require('../config/groq');
const { db } = require('../config/firebase');
const productService = require('./productService');
const logger = require('../utils/logger');
const historyService = require('./historyService');
const admin = require('firebase-admin');

class ChatService {
    /**
     * Detect if user wants to see all products using a small LLM
     * @param {string} message - User message
     * @returns {Promise<boolean>}
     */
    async detectShowAllIntent(message) {
        const prompt = `User message: "${message}"
Apakah user ingin melihat semua produk yang tersedia? Jawab hanya "yes" atau "no".`;
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "Kamu adalah detektor intent. Jawab hanya 'yes' atau 'no'." },
                { role: "user", content: prompt }
            ],
            model: "llama3-8b-8192", // Model kecil, cepat, dan murah
            temperature: 0,
            max_tokens: 3
        });

        const answer = completion.choices[0]?.message?.content?.toLowerCase().trim();
        return answer === 'yes';
    }

    /**
     * Generate AI response using GROQ with product context and chat history
     * @param {string} userMessage - User's message
     * @param {Array} relatedProducts - Related products from search
     * @param {Array} chatHistory - Array of previous messages [{role, content}]
     * @param {number} retries - Jumlah percobaan ulang jika gagal (default 5)
     */
    async generateResponse(userMessage, relatedProducts = [], chatHistory = [], retries = 5) {
        let lastError;
        const endpoint = '/chatService/generateResponse';
        const startTime = Date.now();
        const request_id = logger.generateRequestId();
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                // Build context string dari related products/products
                let productContext = '';
                if (relatedProducts.length > 0) {
                    productContext = relatedProducts.map(product => {
                        let imagesText = '';
                        if (product.images && product.images.length > 0) {
                            imagesText = `\nGambar utama: ${product.images.join(', ')}`;
                        }
                        // Future-proof: tampilkan fitur, spesifikasi, diskon, rating, dsb jika ada
                        let featuresText = '';
                        if (product.features && product.features.length > 0) {
                            featuresText = `\nFitur: ${product.features.join(', ')}`;
                        }
                        let specsText = '';
                        if (product.specs && product.specs.length > 0) {
                            specsText = `\nSpesifikasi: ${product.specs.map(s => `${s.key}: ${s.value}`).join(', ')}`;
                        }
                        let discountText = '';
                        if (product.discount && product.discount.percent > 0) {
                            discountText = `\nDiskon: ${product.discount.percent}% (Harga setelah diskon: ${product.discount.priceAfterDiscount})`;
                        }
                        let ratingText = '';
                        if (product.rating && product.rating.count > 0) {
                            ratingText = `\nRating: ${product.rating.average} (${product.rating.count} ulasan)`;
                        }
                        // --- VARIANTS: tampilkan gambar per option jika ada ---
                        let variantsText = '';
                        if (product.variants && product.variants.length > 0) {
                            variantsText = `\nVarian: ` + product.variants.map((v, vIdx) => {
                                // Jika option adalah array of object { value, images }
                                if (v.options && typeof v.options[0] === 'object') {
                                    return `${v.name}: ` + v.options.map((opt, oIdx) => {
                                        let optText = opt.value || opt;
                                        if (opt.images && opt.images.length > 0) {
                                            optText += ` [gambar: ${opt.images.join(', ')}]`;
                                        }
                                        return optText;
                                    }).join(', ');
                                }
                                // Jika option masih array string
                                return `${v.name}: ${v.options.join(', ')}`;
                            }).join('; ');
                        }
                        let stockText = '';
                        if (typeof product.stock === 'number') {
                            stockText = `\nStok: ${product.stock}`;
                        }
                        let warehouseText = '';
                        if (product.warehouseLocation) {
                            warehouseText = `\nLokasi Gudang: ${product.warehouseLocation}`;
                        }
                        let statusText = '';
                        if (product.status) {
                            statusText = `\nStatus: ${product.status}`;
                        }
                        let isFeaturedText = '';
                        if (product.isFeatured) {
                            isFeaturedText = `\nProduk Unggulan`;
                        }
                        let priceText = '';
                        if (product.discount && product.discount.percent > 0 && product.discount.priceAfterDiscount) {
                            priceText = `(Harga: ~${product.price}~ ${product.discount.priceAfterDiscount})`;
                        } else {
                            priceText = `(Harga: ${product.price})`;
                        }
                        return `- ${product.name}: ${product.description} ${priceText}${discountText}${featuresText}${specsText}${variantsText}${ratingText}${stockText}${warehouseText}${statusText}${isFeaturedText}${imagesText}`;
                    }).join('\n');
                }

                const systemPrompt = `You are a friendly and helpful virtual sales assistant.

Your job is to help users make smart purchasing decisions using the product information below:

${productContext || '[No relevant products found in the database]'}

Instructions:
- Always respond in the same language the user used (English or Bahasa Indonesia).
- If a product has image URLs (including images per variant/option), you may include them in your reply if the user asks for images, photos, or a specific variant/option.
- If the user requests a specific variant or option (e.g. "warna biru", "RAM 8GB", "128GB", dsb), and that variant/option has its own image(s), prioritize showing the image(s) for that option.
- If the user mixes a few English words into an otherwise Bahasa Indonesia message, **keep using Bahasa Indonesia** as the primary language in your response.
- If user requests all products, show the list clearly and concisely.
- If relevant products are available, suggest the best option(s) clearly, highlighting key features and price.
- If no product fits, give honest advice and politely ask clarifying questions (e.g., "What's your budget?" or "What features are you looking for?").
- Avoid overly generic replies. Respond directly and helpfully.
- Be brief but clear, helpful, and human-like.
- Do not invent products or specs that aren't in the list.
- If there is a price after a discount, and the user wants to ask for the total price of the item, calculate using the discount price, not the original price.

Formatting rules for WhatsApp:
- Use *asterisks* for bold (*bold*).
- Use _underscores_ for italic (_italic_).
- Use ~tildes~ for strikethrough (~strikethrough~).
- These styles can be mixed (e.g., *_bold italic_*).
- Users may also use these styles, so feel free to match their formatting.
- For numbered lists, use this format:
  1. First item
  2. Second item
- For bullet points, **never use asterisks '*' at the beginning of lines**. Instead, use:
  • bullet symbol (preferred)
  - dash symbol (alternative)

- If the platform supports emoji (✅ llama3-70b-8192 supports it), feel free to use friendly, relevant emojis to make the tone warmer and more engaging (e.g., 😊📦💡).
- Always sound like a kind assistant who truly wants to help the customer find the right product.`;

                // Gabungkan chat history ke dalam messages
                const messages = [
                    { role: "system", content: systemPrompt },
                    ...chatHistory.map(h => ({ role: h.role, content: h.content })),
                    { role: "user", content: userMessage }
                ];

                const completion = await groq.chat.completions.create({
                    messages,
                    model: "llama3-70b-8192",
                    temperature: 0.7,
                    max_tokens: 1000
                });

                const response = completion.choices[0]?.message?.content?.trim();

                if (!response) {
                    await logger.warn(`AI response empty for: ${userMessage}`, {
                        source: 'Chat Service',
                        request_id,
                        endpoint,
                        response_time: Date.now() - startTime,
                        message: `AI response empty for: ${userMessage}`,
                        details: { userMessage, relatedProducts, chatHistory }
                    });
                    return 'Sorry, I couldn’t find the right answer for you at the moment.';
                }

                await logger.info(`Generated response for query: "${userMessage.substring(0, 50)}..."`, {
                    source: 'Chat Service',
                    request_id,
                    endpoint,
                    response_time: Date.now() - startTime,
                    message: `Generated response for query: "${userMessage.substring(0, 50)}..."`,
                    details: { userMessage, relatedProducts, chatHistory, response }
                });
                return response;

            } catch (error) {
                lastError = error;
                // Cek apakah error karena timeout atau connection error
                const isTimeout =
                    error.code === 'ETIMEDOUT' ||
                    error.errno === 'ETIMEDOUT' ||
                    error.code === 'UND_ERR_CONNECT_TIMEOUT' ||
                    error.name === 'APIConnectionError' ||
                    error.name === 'FetchError' ||
                    (error.message && (
                        error.message.toLowerCase().includes('timeout') ||
                        error.message.toLowerCase().includes('connection error') ||
                        error.message.toLowerCase().includes('fetcherror')
                    ));
                if (isTimeout && attempt < retries) {
                    await logger.warn(`GROQ fetch failed (attempt ${attempt + 1}), retrying...`, {
                        source: 'Chat Service',
                        request_id,
                        endpoint,
                        response_time: Date.now() - startTime,
                        message: `GROQ fetch failed (attempt ${attempt + 1}), retrying...`,
                        details: { error, attempt }
                    });
                    await new Promise(res => setTimeout(res, 1000 * (attempt + 1))); // Exponential backoff
                    continue;
                }
                await logger.error('Error generating response', {
                    source: 'Chat Service',
                    request_id,
                    endpoint,
                    response_time: Date.now() - startTime,
                    message: error.message,
                    details: error.stack || error
                });
                break;
            }
        }
        throw new Error('Failed to generate AI response');
    }

    /**
     * Process chat message with product search and chat history
     * @param {string} userId - User ID (nomor WhatsApp)
     * @param {string} message - User message
     */
    async processMessage(userId, message) {
        const endpoint = '/chatService/processMessage';
        const startTime = Date.now();
        const request_id = logger.generateRequestId();
        try {
            // Ambil riwayat chat user
            const chatHistory = await historyService.getHistory(userId) || [];

            // Intent detection otomatis
            let limit = 3;
            if (await this.detectShowAllIntent(message)) {
                limit = 50; // Atau jumlah produk maksimal yang kamu inginkan
            }

            // Search for related products
            const relatedProducts = await productService.searchProducts(message, limit);

            // Generate AI response dengan context & chat history
            const response = await this.generateResponse(message, relatedProducts, chatHistory);

            // --- PATCH: Increment inquiry counter untuk setiap produk yang direkomendasikan ---
            if (Array.isArray(relatedProducts) && relatedProducts.length > 0) {
                const batch = db.batch();
                relatedProducts.forEach(product => {
                    if (!product || !product.id) return;
                    const ref = db.collection('productInquiries').doc(product.id);
                    batch.set(ref, {
                        productName: product.name || '',
                        category: Array.isArray(product.category) ? product.category[0] : (product.category || ''),
                        lastInquiryAt: new Date(),
                        count: admin.firestore.FieldValue.increment(1)
                    }, { merge: true });
                });
                await batch.commit();
            }
            // --- END PATCH ---

            // Simpan pesan user & balasan AI ke history
            await historyService.addMessage(userId, 'user', message);
            await historyService.addMessage(userId, 'assistant', response);

            await logger.info('Processed chat message', {
                source: 'Chat Service',
                user_id: userId,
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                message: 'Processed chat message',
                details: { userId, message, relatedProducts, response }
            });

            return {
                response,
                relatedProducts,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            await logger.error('Error processing message', {
                source: 'Chat Service',
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
}

module.exports = new ChatService();