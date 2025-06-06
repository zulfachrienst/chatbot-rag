const chatService = require('../services/chatService');
const logger = require('../utils/logger');

class ChatController {
    /**
     * Handle chat message
     */
    async chat(req, res) {
        try {
            const { message } = req.body;

            if (!message || typeof message !== 'string') {
                return res.status(400).json({
                    error: 'Message is required and must be a string'
                });
            }

            const result = await chatService.processMessage(message);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Chat controller error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    }
}

module.exports = new ChatController();