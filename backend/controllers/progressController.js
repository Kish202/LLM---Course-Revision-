const QuizAttempt = require('../models/QuizAttempt');
const PDF = require('../models/PDF');

// Get user's overall progress dashboard
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all quiz attempts
    const attempts = await QuizAttempt.find({ userId })
      .populate('pdfId', 'title')
      .sort({ completedAt: -1 });
    
    if (attempts.length === 0) {
      return res.json({
        totalAttempts: 0,
        averageScore: 0,
        totalQuestions: 0,
        recentAttempts: [],
        performanceByPDF: []
      });
    }
    
    // Calculate overall statistics
    const totalAttempts = attempts.length;
    const averageScore = Math.round(
      attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts
    );
    const totalQuestions = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);
    
    // Performance by PDF
    const pdfStats = {};
    attempts.forEach(attempt => {
      const pdfId = attempt.pdfId._id.toString();
      if (!pdfStats[pdfId]) {
        pdfStats[pdfId] = {
          pdfTitle: attempt.pdfId.title,
          attempts: 0,
          totalScore: 0,
          totalQuestions: 0
        };
      }
      pdfStats[pdfId].attempts++;
      pdfStats[pdfId].totalScore += attempt.score;
      pdfStats[pdfId].totalQuestions += attempt.totalQuestions;
    });
    
    const performanceByPDF = Object.values(pdfStats).map(stat => ({
      pdfTitle: stat.pdfTitle,
      attempts: stat.attempts,
      averageScore: Math.round(stat.totalScore / stat.attempts),
      totalQuestions: stat.totalQuestions
    }));
    
    // Recent attempts (last 10)
    const recentAttempts = attempts.slice(0, 10).map(a => ({
      id: a._id,
      pdfTitle: a.pdfId.title,
      score: a.score,
      totalQuestions: a.totalQuestions,
      completedAt: a.completedAt
    }));
    
    res.json({
      totalAttempts,
      averageScore,
      totalQuestions,
      recentAttempts,
      performanceByPDF
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get strengths and weaknesses analysis
const getAnalysis = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all quiz attempts with questions
    const attempts = await QuizAttempt.find({ userId });
    
    if (attempts.length === 0) {
      return res.json({
        strengths: [],
        weaknesses: [],
        topicPerformance: []
      });
    }
    
    // Analyze question types performance
    const typeStats = {
      MCQ: { correct: 0, total: 0 },
      SAQ: { correct: 0, total: 0 },
      LAQ: { correct: 0, total: 0 }
    };
    
    attempts.forEach(attempt => {
      attempt.questions.forEach(q => {
        if (typeStats[q.type]) {
          typeStats[q.type].total++;
          if (q.isCorrect) {
            typeStats[q.type].correct++;
          }
        }
      });
    });
    
    // Calculate accuracy for each type
    const topicPerformance = Object.entries(typeStats).map(([type, stats]) => {
      const accuracy = stats.total > 0 
        ? Math.round((stats.correct / stats.total) * 100) 
        : 0;
      
      return {
        type,
        accuracy,
        totalQuestions: stats.total,
        correctAnswers: stats.correct
      };
    }).filter(item => item.totalQuestions > 0);
    
    // Identify strengths (> 70% accuracy) and weaknesses (< 50% accuracy)
    const strengths = topicPerformance
      .filter(item => item.accuracy >= 70)
      .map(item => item.type);
    
    const weaknesses = topicPerformance
      .filter(item => item.accuracy < 50)
      .map(item => item.type);
    
    res.json({
      strengths,
      weaknesses,
      topicPerformance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDashboard,
  getAnalysis
};