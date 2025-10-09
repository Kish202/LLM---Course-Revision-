
const PDF = require('../models/PDF');
const { processPDF } = require('../services/ragService');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Get all PDFs for current user
const getAllPDFs = async (req, res) => {
  try {
    const pdfs = await PDF.find({ 
      $or: [
        { userId: req.user._id },
        { isSeeded: true }
      ]
    }).select('-chunks').sort({ uploadedAt: -1 });
    
    res.json({ pdfs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload a new PDF to Cloudinary
const uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Uploading to Cloudinary...');

    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'quiz-app-pdfs'
          // Don't specify public_id, let Cloudinary generate it
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload success:', result.secure_url);
            resolve(result);
          }
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    const cloudinaryResult = await uploadPromise;
    
    // Create PDF record
    const pdf = await PDF.create({
      userId: req.user._id,
      title: req.body.title || req.file.originalname,
      filename: cloudinaryResult.public_id,
      filepath: cloudinaryResult.secure_url,
      cloudinaryId: cloudinaryResult.public_id,
      isSeeded: false
    });
    
    console.log('PDF record created:', pdf._id);
    console.log('Starting background processing...');
    
    // Process PDF in background
    processPDF(pdf._id, cloudinaryResult.secure_url, req.file.buffer)
      .then(() => console.log(`PDF ${pdf._id} processed successfully`))
      .catch(err => console.error(`Error processing PDF ${pdf._id}:`, err));
    
    res.status(201).json({ 
      message: 'PDF uploaded successfully. Processing in background.',
      pdf: {
        id: pdf._id,
        title: pdf.title,
        filename: pdf.filename,
        uploadedAt: pdf.uploadedAt
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get specific PDF details
const getPDFById = async (req, res) => {
  try {
    const pdf = await PDF.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user._id },
        { isSeeded: true }
      ]
    }).select('-chunks.embedding');
    
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    
    res.json({ pdf });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a PDF
const deletePDF = async (req, res) => {
  try {
    const pdf = await PDF.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    
    if (pdf.isSeeded) {
      return res.status(403).json({ error: 'Cannot delete seeded PDFs' });
    }
    
    // Delete from Cloudinary
    if (pdf.cloudinaryId) {
      await cloudinary.uploader.destroy(pdf.cloudinaryId, { resource_type: 'raw' });
    }
    
    // Delete from database
    await PDF.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'PDF deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Serve PDF file (proxy for Cloudinary)
const servePDFFile = async (req, res) => {
  try {
    const pdf = await PDF.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user._id },
        { isSeeded: true }
      ]
    });
    
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    
    // For Cloudinary URLs, proxy the request
    if (pdf.filepath.includes('cloudinary.com')) {
      const axios = require('axios');
      
      try {
        const response = await axios.get(pdf.filepath, {
          responseType: 'stream'
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${pdf.title}.pdf"`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        response.data.pipe(res);
      } catch (err) {
        console.error('Error fetching from Cloudinary:', err);
        // Fallback: redirect to Cloudinary
        res.redirect(pdf.filepath);
      }
    } else {
      // For local files (if any remain)
      const fs = require('fs');
      if (fs.existsSync(pdf.filepath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${pdf.filename}"`);
        
        const fileStream = fs.createReadStream(pdf.filepath);
        fileStream.pipe(res);
      } else {
        res.status(404).json({ error: 'PDF file not found' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllPDFs,
  uploadPDF,
  getPDFById,
  deletePDF,
  servePDFFile
};