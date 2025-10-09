const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  filepath: {
    type: String,
    required: true
  },
  cloudinaryId: {
    type: String  // Store Cloudinary public_id for deletion
  },
  processingError: {
    type: String  // Store any processing errors
  },
  isSeeded: {
    type: Boolean,
    default: false
  },
  totalPages: {
    type: Number
  },
  // Store chunks for RAG
  chunks: [{
    text: String,
    pageNumber: Number,
    embedding: [Number] // OpenAI embeddings
  }],
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PDF', pdfSchema);