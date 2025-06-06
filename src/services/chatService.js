const groq = require('../config/groq');
const productService = require('./productService');
const logger = require('../utils/logger');

class ChatService {
    /**
     * Generate AI response using GROQ with product context
     * @param {string} userMessage - User's message
     * @param {Array} relatedProducts - Related products from search
     */
    async generateResponse(userMessage, relatedProducts = []) {
        try {
            // Build context string dari related products
            let productContext = '';
            if (relatedProducts.length > 0) {
                productContext = relatedProducts.map(product =>
                    `- ${product.name}: ${product.description} (Price: ${product.price})`
                ).join('\n');
            }

            // Prompt sistem dalam bahasa Inggris, tapi mendukung auto-responsif ke bahasa user
            const systemPrompt = `You are a friendly and helpful virtual sales assistant.

Your job is to help users make smart purchasing decisions using the product information below:

${productContext || '[No relevant products found in the database]'}

Instructions:
- Always respond in the same language the user used (English or Bahasa Indonesia).
- If relevant products are available, suggest the best option(s) clearly, highlighting key features and price.
- If no product fits, give honest advice and politely ask clarifying questions (e.g., "What's your budget?" or "What features are you looking for?").
- Avoid overly generic replies. Respond directly and helpfully.
- Be brief but clear, helpful, and human-like.
- Do not invent products or specs that aren't in the list.

Always sound like a kind assistant who truly wants to help the customer find the right product.`;

            // Buat completion dari Groq LLM
            const completion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ],
                model: "llama3-8b-8192",
                temperature: 0.7,
                max_tokens: 1000
            });

            const response = completion.choices[0]?.message?.content?.trim();

            if (!response) {
                logger.warn(`⚠️ AI response empty for: ${userMessage}`);
                return 'Sorry, I couldn’t find the right answer for you at the moment.';
            }

            logger.info(`✅ Generated response for query: "${userMessage.substring(0, 50)}..."`);
            return response;

        } catch (error) {
            logger.error('❌ Error generating response:', error);
            throw new Error('Failed to generate AI response');
        }
    }


    /**
     * Process chat message with product search
     * @param {string} message - User message
     */
    async processMessage(message) {
        try {
            // Search for related products
            const relatedProducts = await productService.searchProducts(message, 3);

            // Generate AI response with context
            const response = await this.generateResponse(message, relatedProducts);

            return {
                response,
                relatedProducts,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            logger.error('Error processing message:', error);
            throw error;
        }
    }
}

module.exports = new ChatService();