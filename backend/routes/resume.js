const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { 
  uploadResume,
  generateReview,
  getUserResumes,
  getReviewHistory,
  getReview,
  compareReviews,
  deleteResume,
  getResumeStats
} = require('../controllers/resumeController');

// Assuming you have auth middleware
// const { authenticate } = require('../middleware/auth');

// Apply authentication to all routes
// router.use(authenticate);

// Upload resume (called after file upload middleware processes the file)
router.post('/upload', isAuthenticated,upload.single('pdf'), uploadResume);

// Get all user's resumes
router.get('/resumes',isAuthenticated, getUserResumes);

// Generate review for a specific resume
router.post('/review/:pdfId', isAuthenticated, generateReview);

// Get review history (all reviews or filtered by pdfId)
router.get('/reviews', isAuthenticated, getReviewHistory);

// Get a specific review by ID
router.get('/review/:reviewId', isAuthenticated, getReview);

// Compare two reviews
router.get('/compare', isAuthenticated, compareReviews);

// Get statistics for a resume
router.get('/stats/:pdfId', isAuthenticated, getResumeStats);

// Delete a resume and its reviews
router.delete('/resume/:pdfId', isAuthenticated, deleteResume);

module.exports = router;