// const ChatHistory = require('../models/ChatHistory');
// const PDF = require('../models/PDF');
// const { retrieveRelevantChunks } = require('../services/ragService');
// const openai = require('../config/openai');

// // Send message and get RAG response
// const sendMessage = async (req, res) => {
//   try {
//     const { pdfIds, message } = req.body;
    
//     if (!pdfIds || !Array.isArray(pdfIds) || pdfIds.length === 0) {
//       return res.status(400).json({ error: 'Please provide at least one PDF ID' });
//     }
    
//     if (!message || !message.trim()) {
//       return res.status(400).json({ error: 'Please provide a message' });
//     }
    
//     // Verify PDFs exist and user has access
//     const pdfs = await PDF.find({
//       _id: { $in: pdfIds },
//       $or: [
//         { userId: req.user._id },
//         { isSeeded: true }
//       ]
//     });
    
//     if (pdfs.length === 0) {
//       return res.status(404).json({ error: 'No accessible PDFs found' });
//     }
    
//     // Retrieve relevant chunks using RAG
//     const relevantChunks = await retrieveRelevantChunks(message, pdfIds, 5);
    
//     if (relevantChunks.length === 0) {
//       return res.status(404).json({ 
//         error: 'No relevant content found in the selected PDFs' 
//       });
//     }
    
//     // Build context from relevant chunks
//     const context = relevantChunks.map((chunk, index) => 
//       `[${index + 1}] From page ${chunk.pageNumber}: "${chunk.text}"`
//     ).join('\n\n');
    
//     // Generate response using OpenAI
//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content: `You are a helpful educational assistant. Answer the student's question based on the provided context from their coursebook. Always cite page numbers when referencing specific information. Use format: "According to page X: [brief quote]"`
//         },
//         {
//           role: "user",
//           content: `Context from coursebook:\n${context}\n\nStudent's question: ${message}`
//         }
//       ],
//       temperature: 0.7,
//       max_tokens: 1000
//     });
    
//     const assistantMessage = completion.choices[0].message.content;
    
//     // Extract citations from relevant chunks
//     const citations = relevantChunks.map(chunk => ({
//       pageNumber: chunk.pageNumber,
//       snippet: chunk.text.slice(0, 200) + '...' // First 200 chars
//     }));
    
//     // Get or create chat history for the first PDF
//     let chatHistory = await ChatHistory.findOne({
//       userId: req.user._id,
//       pdfId: pdfIds[0]
//     });
    
//     if (!chatHistory) {
//       chatHistory = await ChatHistory.create({
//         userId: req.user._id,
//         pdfId: pdfIds[0],
//         messages: []
//       });
//     }
    
//     // Add messages to history
//     chatHistory.messages.push(
//       {
//         role: 'user',
//         content: message,
//         citations: []
//       },
//       {
//         role: 'assistant',
//         content: assistantMessage,
//         citations: citations
//       }
//     );
    
//     await chatHistory.save();
    
//     res.json({
//       response: assistantMessage,
//       citations: citations,
//       messageId: chatHistory.messages[chatHistory.messages.length - 1]._id
//     });
//   } catch (error) {
//     console.error('Chat error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };

// // Get chat history for a PDF
// const getChatHistory = async (req, res) => {
//   try {
//     const chatHistory = await ChatHistory.findOne({
//       userId: req.user._id,
//       pdfId: req.params.pdfId
//     }).populate('pdfId', 'title');
    
//     if (!chatHistory) {
//       return res.json({ messages: [] });
//     }
    
//     res.json({ 
//       messages: chatHistory.messages,
//       pdfTitle: chatHistory.pdfId.title
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Clear chat history
// const clearChatHistory = async (req, res) => {
//   try {
//     await ChatHistory.findOneAndDelete({
//       userId: req.user._id,
//       pdfId: req.params.pdfId
//     });
    
//     res.json({ message: 'Chat history cleared successfully' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// module.exports = {
//   sendMessage,
//   getChatHistory,
//   clearChatHistory
// };


const ChatHistory = require('../models/ChatHistory');
const PDF = require('../models/PDF');
const { retrieveRelevantChunks } = require('../services/ragService');
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
    
    const prompt = `You are a helpful educational assistant. Answer the student's question based on the provided context from their coursebook. Always cite page numbers when referencing specific information. Use format: "According to page X: [brief quote]"

Context from coursebook:
${context}

Student's question: ${message}`;

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
    }).populate('pdfId', 'title');
    
    if (!chatHistory) {
      return res.json({ messages: [] });
    }
    
    res.json({ 
      messages: chatHistory.messages,
      pdfTitle: chatHistory.pdfId.title
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

module.exports = {
  sendMessage,
  getChatHistory,
  clearChatHistory
};