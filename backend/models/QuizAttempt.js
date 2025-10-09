const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pdfId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PDF',
    required: true
  },
  questions: [{
    type: {
      type: String,
      enum: ['MCQ', 'SAQ', 'LAQ'],
      required: true
    },
    question: String,
    options: [String], // For MCQs
    correctAnswer: String,
    userAnswer: String,
    isCorrect: Boolean,
    explanation: String,
    pageReference: Number
  }],
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);