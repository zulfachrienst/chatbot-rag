const chatService = require('../services/chatService');
const logger = require('../utils/logger');

class ChatController {
    /**
     * Handle chat message
     */
    async chat(req, res) {
        const startTime = Date.now();
        const endpoint = '/api/chat';
        let request_id = logger.generateRequestId();
        try {
            const { message, userId } = req.body;

            if (!message || typeof message !== 'string') {
                await logger.warn('Invalid message input', {
                    source: 'Chat Controller',
                    user_id: userId || null,
                    request_id,
                    endpoint,
                    response_time: Date.now() - startTime,
                    message: 'Message is required and must be a string',
                    details: req.body
                });
                return res.status(400).json({
                    error: 'Message is required and must be a string',
                    request_id
                });
            }

            await logger.info('Received chat request', {
                source: 'Chat Controller',
                user_id: userId || null,
                request_id,
                endpoint,
                details: req.body
            });

            const result = await chatService.processMessage(userId, message);

            await logger.info('Chat processed successfully', {
                source: 'Chat Controller',
                user_id: userId || null,
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                details: { result }
            });

            res.json({
                success: true,
                data: result,
                request_id
            });
        } catch (error) {
            await logger.error('Chat controller error', {
                source: 'Chat Controller',
                user_id: req.body?.userId || null,
                request_id,
                endpoint,
                response_time: Date.now() - startTime,
                message: error.message,
                details: error.stack || error
            });
            res.status(500).json({
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
                request_id
            });
        }
    }
}

module.exports = new ChatController();