const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const progressController = require('../controllers/progressController');

// Get user's overall progress dashboard
router.get('/dashboard', isAuthenticated, progressController.getDashboard);

// Get strengths and weaknesses analysis
router.get('/analysis', isAuthenticated, progressController.getAnalysis);

module.exports = router;