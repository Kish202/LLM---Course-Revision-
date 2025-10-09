const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// Send a message and get RAG response with citations
router.post('/message', isAuthenticated, chatController.sendMessage);

// Get chat history for a PDF
router.get('/history/:pdfId', isAuthenticated, chatController.getChatHistory);

// Clear chat history
router.delete('/history/:pdfId', isAuthenticated, chatController.clearChatHistory);

module.exports = router;