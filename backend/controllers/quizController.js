const QuizAttempt = require('../models/QuizAttempt');
const PDF = require('../models/PDF');
const { generateQuizFromPDF, evaluateAnswer, calculateScore } = require('../services/quizService');

// Generate a new quiz
const generateQuiz = async (req, res) => {
  try {
    const { pdfIds, questionTypes, numberOfQuestions } = req.body;
    
    if (!pdfIds || !Array.isArray(pdfIds) || pdfIds.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one PDF ID' });
    }
    
    if (!questionTypes || !Array.isArray(questionTypes) || questionTypes.length === 0) {
      return res.status(400).json({ error: 'Please provide question types (MCQ, SAQ, LAQ)' });
    }
    
    // Verify PDFs exist and user has access
    const pdfs = await PDF.find({
      _id: { $in: pdfIds },
      $or: [
        { userId: req.user._id },
        { isSeeded: true }
      ]
    });
    
    if (pdfs.length === 0) {
      return res.status(404).json({ error: 'No accessible PDFs found' });
    }
    
    // Generate quiz questions
    const questions = await generateQuizFromPDF(
      pdfIds,
      questionTypes,
      numberOfQuestions || 10
    );
    
    // Remove correct answers before sending to frontend
    const questionsForUser = questions.map(q => ({
      type: q.type,
      question: q.question,
      options: q.options || null,
      pageReference: q.pageReference
    }));
    
    // Store questions temporarily in session or return with quiz ID
    res.json({
      questions: questionsForUser,
      quizData: questions, // Full data including answers (for submission)
      pdfTitles: pdfs.map(p => p.title)
    });
  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Submit quiz and get score
const submitQuiz = async (req, res) => {
  try {
    const { pdfId, questions, userAnswers } = req.body;
    
    if (!questions || !userAnswers) {
      return res.status(400).json({ error: 'Missing quiz data' });
    }
    
    // Evaluate each answer
    const evaluatedQuestions = questions.map((q, index) => {
      const userAnswer = userAnswers[index];
      const evaluation = evaluateAnswer(q, userAnswer);
      
      return {
        type: q.type,
        question: q.question,
        options: q.options || null,
        correctAnswer: q.correctAnswer,
        userAnswer: userAnswer,
        isCorrect: evaluation.isCorrect,
        explanation: evaluation.explanation,
        pageReference: q.pageReference
      };
    });
    
    // Calculate score
    const score = calculateScore(evaluatedQuestions);
    
    // Save quiz attempt
    const quizAttempt = await QuizAttempt.create({
      userId: req.user._id,
      pdfId: pdfId,
      questions: evaluatedQuestions,
      score: score,
      totalQuestions: questions.length
    });
    
    res.json({
      attemptId: quizAttempt._id,
      score: score,
      totalQuestions: questions.length,
      correctAnswers: evaluatedQuestions.filter(q => q.isCorrect).length,
      questions: evaluatedQuestions
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get quiz history
const getQuizHistory = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ userId: req.user._id })
      .populate('pdfId', 'title')
      .select('-questions')
      .sort({ completedAt: -1 })
      .limit(50);
    
    res.json({ attempts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get specific quiz attempt
const getQuizAttempt = async (req, res) => {
  try {
    const attempt = await QuizAttempt.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('pdfId', 'title');
    
    if (!attempt) {
      return res.status(404).json({ error: 'Quiz attempt not found' });
    }
    
    res.json({ attempt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  generateQuiz,
  submitQuiz,
  getQuizHistory,
  getQuizAttempt
};