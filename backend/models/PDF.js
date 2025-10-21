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
    type: String
  },
  processingError: {
    type: String
  },
  isSeeded: {
    type: Boolean,
    default: false
  },
  // NEW: Resume flag
  isResume: {
    type: Boolean,
    default: false
  },
  // NEW: Resume metadata
  resumeMetadata: {
    targetRole: String,
    industry: String,
    yearsOfExperience: Number,
    additionalContext: String
  },
  totalPages: {
    type: Number
  },
  chunks: [{
    text: String,
    pageNumber: Number,
    embedding: [Number]
  }],
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PDF', pdfSchema);