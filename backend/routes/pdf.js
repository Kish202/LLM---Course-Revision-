const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const upload = require('../middleware/upload');
const pdfController = require('../controllers/pdfController');

// Get all PDFs for current user
router.get('/', isAuthenticated, pdfController.getAllPDFs);

// Upload a new PDF
router.post('/upload', isAuthenticated, upload.single('pdf'), pdfController.uploadPDF);

// Get specific PDF details
router.get('/:id', isAuthenticated, pdfController.getPDFById);

// Delete a PDF
router.delete('/:id', isAuthenticated, pdfController.deletePDF);

// Serve PDF file
router.get('/:id/file', isAuthenticated, pdfController.servePDFFile);

module.exports = router;