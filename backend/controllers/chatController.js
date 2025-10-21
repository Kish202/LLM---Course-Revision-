const ChatHistory = require('../models/ChatHistory');
const PDF = require('../models/PDF');
const { retrieveRelevantChunks, getLatestResumeReview } = require('../services/ragService');
const genAI = require('../config/gemini');

// Send message and get RAG response
const sendMessage = async (req, res) => {
  try {
    const { pdfIds, message } = req.body;
    
    if (!pdfIds || !Array.isArray(pdfIds) || pdfIds.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one PDF ID' });
    }
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Please provide a message' });
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
    
    // Check if any PDF is a resume
    const isResumeChat = pdfs.some(pdf => pdf.isResume);
    
    // Retrieve relevant chunks using RAG
    const relevantChunks = await retrieveRelevantChunks(message, pdfIds, 5);
    
    if (relevantChunks.length === 0) {
      return res.status(404).json({ 
        error: 'No relevant content found in the selected PDFs' 
      });
    }
    
    // Build context from relevant chunks
    const context = relevantChunks.map((chunk, index) => 
      `[${index + 1}] From page ${chunk.pageNumber}: "${chunk.text}"`
    ).join('\n\n');
    
    // Generate response using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    let prompt;
    
    // Different prompts for resume vs course material
    if (isResumeChat) {
      // Get latest review if available
      const latestReview = await getLatestResumeReview(pdfIds[0], req.user._id);
      
      let reviewContext = '';
      if (latestReview) {
        reviewContext = `

**Latest Resume Review Summary:**
- Overall Score: ${latestReview.overallScore}/100
- ATS Compatibility: ${latestReview.atsCompatibility.score}/100
- Content Quality: ${latestReview.contentQuality.score}/100
- Top Strengths: ${latestReview.topStrengths.join(', ')}
- Critical Improvements: ${latestReview.criticalImprovements.join(', ')}
- Target Role: ${latestReview.targetRole || 'Not specified'}
- Industry: ${latestReview.industry || 'Not specified'}
`;
      }
      
      prompt = `You are an expert career coach and resume advisor. You're helping the user improve their resume and answer career-related questions.

You have access to the user's resume content and their latest review feedback.
${reviewContext}

**Resume Context:**
${context}

**User's Question:** ${message}

**Instructions:**
- Provide specific, actionable advice based on the resume content
- Reference specific sections or points from their resume when relevant (cite page numbers)
- If they ask about improvements, refer to the review feedback
- Help them with tailoring their resume for specific roles
- Assist with interview preparation based on their experience
- Be encouraging and constructive
- Format your response clearly with bullet points where appropriate
- When referencing specific content, cite the page number in format "According to page X: [brief quote]"

Always be professional, supportive, and focused on helping them succeed in their job search.`;
    } else {
      // Course material prompt (your existing one)
      prompt = `You are a helpful educational assistant. Answer the student's question based on the provided context from their coursebook. Always cite page numbers when referencing specific information. Use format: "According to page X: [brief quote]"

Context from coursebook:
${context}

Student's question: ${message}`;
    }

    const result = await model.generateContent(prompt);
    const assistantMessage = result.response.text();
    
    // Extract citations from relevant chunks
    const citations = relevantChunks.map(chunk => ({
      pageNumber: chunk.pageNumber,
      snippet: chunk.text.slice(0, 200) + '...' // First 200 chars
    }));
    
    // Get or create chat history for the first PDF
    let chatHistory = await ChatHistory.findOne({
      userId: req.user._id,
      pdfId: pdfIds[0]
    });
    
    if (!chatHistory) {
      chatHistory = await ChatHistory.create({
        userId: req.user._id,
        pdfId: pdfIds[0],
        messages: []
      });
    }
    
    // Add messages to history
    chatHistory.messages.push(
      {
        role: 'user',
        content: message,
        citations: []
      },
      {
        role: 'assistant',
        content: assistantMessage,
        citations: citations
      }
    );
    
    await chatHistory.save();
    
    res.json({
      response: assistantMessage,
      citations: citations,
      isResumeChat: isResumeChat,
      messageId: chatHistory.messages[chatHistory.messages.length - 1]._id
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get chat history for a PDF
const getChatHistory = async (req, res) => {
  try {
    const chatHistory = await ChatHistory.findOne({
      userId: req.user._id,
      pdfId: req.params.pdfId
    }).populate('pdfId', 'title isResume');
    
    if (!chatHistory) {
      return res.json({ messages: [], isResume: false });
    }
    
    res.json({ 
      messages: chatHistory.messages,
      pdfTitle: chatHistory.pdfId.title,
      isResume: chatHistory.pdfId.isResume || false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Clear chat history
const clearChatHistory = async (req, res) => {
  try {
    await ChatHistory.findOneAndDelete({
      userId: req.user._id,
      pdfId: req.params.pdfId
    });
    
    res.json({ message: 'Chat history cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// NEW: Get suggested questions for resume chat
const getSuggestedQuestions = async (req, res) => {
  try {
    const { pdfId } = req.params;
    
    const pdf = await PDF.findOne({
      _id: pdfId,
      userId: req.user._id
    });
    
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    
    const suggestions = [];
    
    if (pdf.isResume) {
      // Resume-specific suggestions
      const review = await getLatestResumeReview(pdfId, req.user._id);
      
      if (review) {
        if (review.criticalImprovements.length > 0) {
          suggestions.push(`How can I improve: ${review.criticalImprovements[0]}?`);
        }
        
        if (review.skillsAnalysis.missingSkills.length > 0) {
          suggestions.push(`How should I add ${review.skillsAnalysis.missingSkills[0]} to my resume?`);
        }
        
        if (review.atsCompatibility.score < 70) {
          suggestions.push("How can I make my resume more ATS-friendly?");
        }
        
        if (review.targetRole) {
          suggestions.push(`How can I better tailor my resume for ${review.targetRole} roles?`);
        }
      }
      
      suggestions.push(
        "What are my strongest qualifications?",
        "How can I better quantify my achievements?",
        "What keywords should I add for my target role?",
        "How can I improve my professional summary?",
        "Help me prepare for interview questions based on my resume"
      );
    } else {
      // Course material suggestions
      suggestions.push(
        "Can you summarize the key concepts?",
        "Explain this topic in simpler terms",
        "What are the most important points to remember?",
        "Can you give me examples of this concept?",
        "What practice questions can you create?"
      );
    }
    
    // Return first 5 unique suggestions
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, 5);
    
    res.json({ 
      suggestions: uniqueSuggestions,
      isResume: pdf.isResume || false
    });
    
  } catch (error) {
    console.error('Get suggested questions error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
  clearChatHistory,
  getSuggestedQuestions
};