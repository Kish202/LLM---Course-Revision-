const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const quizController = require('../controllers/quizController');

// Generate a new quiz from PDF(s)
router.post('/generate', isAuthenticated, quizController.generateQuiz);

// Submit quiz answers and get score
router.post('/submit', isAuthenticated, quizController.submitQuiz);

// Get user's quiz history
router.get('/history', isAuthenticated, quizController.getQuizHistory);

// Get specific quiz attempt
router.get('/:id', isAuthenticated, quizController.getQuizAttempt);

module.exports = router;