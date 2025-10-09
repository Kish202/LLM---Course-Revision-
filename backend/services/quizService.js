const openai = require('../config/openai');
const PDF = require('../models/PDF');

// Generate quiz questions from PDF content
const generateQuizFromPDF = async (pdfIds, questionTypes, numberOfQuestions = 10) => {
  try {
    // Get PDFs and their content
    const pdfs = await PDF.find({ _id: { $in: pdfIds } });
    
    if (!pdfs.length) {
      throw new Error('No PDFs found');
    }
    
    // Collect text from chunks
    let contentText = '';
    for (const pdf of pdfs) {
      const pdfText = pdf.chunks.map(chunk => chunk.text).join('\n');
      contentText += `\n\n--- ${pdf.title} ---\n${pdfText}`;
    }
    
    // Limit content to avoid token limits (take first 10000 characters)
    if (contentText.length > 10000) {
      contentText = contentText.slice(0, 10000);
    }
    
    // Build prompt based on question types
    const questionTypesList = questionTypes.join(', ');
    
    const prompt = `Based on the following educational content, generate ${numberOfQuestions} quiz questions.

Question types to generate: ${questionTypesList}
- MCQ = Multiple Choice Questions (with 4 options)
- SAQ = Short Answer Questions
- LAQ = Long Answer Questions

Content:
${contentText}

Generate the questions in the following JSON format:
{
  "questions": [
    {
      "type": "MCQ",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why this is correct",
      "pageReference": 1
    },
    {
      "type": "SAQ",
      "question": "Question text",
      "correctAnswer": "Expected answer",
      "explanation": "Explanation",
      "pageReference": 2
    }
  ]
}

Make sure questions are educational, clear, and test understanding of key concepts.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator. Generate high-quality quiz questions that test understanding. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    const quizData = JSON.parse(response.choices[0].message.content);
    return quizData.questions || [];
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
};

// Evaluate user's answer
const evaluateAnswer = (question, userAnswer) => {
  if (question.type === 'MCQ') {
    return {
      isCorrect: userAnswer === question.correctAnswer,
      explanation: question.explanation
    };
  } else {
    // For SAQ and LAQ, use simple string matching (can be improved with AI)
    const correctLower = question.correctAnswer.toLowerCase().trim();
    const userLower = userAnswer.toLowerCase().trim();
    
    // Simple check - contains key terms
    const isCorrect = correctLower.includes(userLower) || userLower.includes(correctLower);
    
    return {
      isCorrect: isCorrect,
      explanation: question.explanation
    };
  }
};

// Calculate quiz score
const calculateScore = (questions) => {
  const correctAnswers = questions.filter(q => q.isCorrect).length;
  return Math.round((correctAnswers / questions.length) * 100);
};

module.exports = {
  generateQuizFromPDF,
  evaluateAnswer,
  calculateScore
};