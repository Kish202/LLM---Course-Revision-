// const pdfParse = require('pdf-parse');
// const axios = require('axios');
// const openai = require('../config/openai');
// const PDF = require('../models/PDF');

// // Chunk text into smaller pieces
// const chunkText = (text, chunkSize = 1000, overlap = 200) => {
//   const chunks = [];
//   let start = 0;
  
//   while (start < text.length) {
//     const end = start + chunkSize;
//     chunks.push(text.slice(start, end));
//     start = end - overlap;
//   }
  
//   return chunks;
// };

// // Process PDF and create embeddings
// const processPDF = async (pdfId, filepath, buffer = null) => {
//   try {
//     console.log(`Processing PDF ${pdfId}...`);
//     console.log(`Filepath: ${filepath}`);
    
//     let dataBuffer;
    
//     // If buffer provided (from upload), use it directly
//     if (buffer) {
//       console.log('Using provided buffer');
//       dataBuffer = buffer;
//     } else if (filepath.startsWith('http')) {
//       // Download from Cloudinary
//       console.log('Downloading from Cloudinary...');
//       const response = await axios.get(filepath, { responseType: 'arraybuffer' });
//       dataBuffer = Buffer.from(response.data);
//       console.log('Download complete');
//     } else {
//       // This shouldn't happen with Cloudinary, but keeping for compatibility
//       const fs = require('fs');
//       dataBuffer = fs.readFileSync(filepath);
//     }
    
//     console.log('Parsing PDF...');
//     const pdfData = await pdfParse(dataBuffer);
    
//     const text = pdfData.text;
//     const totalPages = pdfData.numpages;
    
//     console.log(`PDF parsed: ${totalPages} pages, ${text.length} characters`);
    
//     if (!text || text.trim().length === 0) {
//       throw new Error('PDF contains no extractable text');
//     }
    
//     // Split text by pages (approximate)
//     const textPerPage = text.length / totalPages;
//     const pageChunks = [];
    
//     console.log('Creating chunks...');
    
//     for (let i = 0; i < totalPages; i++) {
//       const start = Math.floor(i * textPerPage);
//       const end = Math.floor((i + 1) * textPerPage);
//       const pageText = text.slice(start, end);
      
//       if (pageText.trim()) {
//         // Chunk each page
//         const chunks = chunkText(pageText, 800, 100);
        
//         for (const chunk of chunks) {
//           if (chunk.trim().length > 50) { // Only process meaningful chunks
//             pageChunks.push({
//               text: chunk.trim(),
//               pageNumber: i + 1
//             });
//           }
//         }
//       }
//     }
    
//     console.log(`Created ${pageChunks.length} chunks`);
    
//     // Generate embeddings for chunks
//     const chunksWithEmbeddings = [];
//     let processedCount = 0;
    
//     console.log('Generating embeddings...');
    
//     // Process in batches to avoid rate limits
//     const batchSize = 5;
//     for (let i = 0; i < pageChunks.length; i += batchSize) {
//       const batch = pageChunks.slice(i, i + batchSize);
      
//       const batchPromises = batch.map(async (chunk) => {
//         try {
//           const embeddingResponse = await openai.embeddings.create({
//             model: "text-embedding-3-small",
//             input: chunk.text
//           });
          
//           processedCount++;
//           if (processedCount % 10 === 0) {
//             console.log(`Processed ${processedCount}/${pageChunks.length} embeddings`);
//           }
          
//           return {
//             text: chunk.text,
//             pageNumber: chunk.pageNumber,
//             embedding: embeddingResponse.data[0].embedding
//           };
//         } catch (error) {
//           console.error('Error generating embedding:', error.message);
//           return null;
//         }
//       });
      
//       const batchResults = await Promise.all(batchPromises);
//       chunksWithEmbeddings.push(...batchResults.filter(r => r !== null));
      
//       // Small delay between batches to respect rate limits
//       if (i + batchSize < pageChunks.length) {
//         await new Promise(resolve => setTimeout(resolve, 100));
//       }
//     }
    
//     console.log(`Generated ${chunksWithEmbeddings.length} embeddings`);
    
//     if (chunksWithEmbeddings.length === 0) {
//       console.log('Failed to generate any embeddings');
//     }
    
//     // Update PDF document with chunks
//     console.log('Saving to database...');
//     await PDF.findByIdAndUpdate(pdfId, {
//       chunks: chunksWithEmbeddings,
//       totalPages: totalPages
//     });
    
//     console.log(`PDF ${pdfId} processing complete! ${chunksWithEmbeddings.length} chunks stored.`);
    
//     return { success: true, chunksCount: chunksWithEmbeddings.length };
//   } catch (error) {
//     console.error('Error processing PDF:', error);
//     console.error('Error stack:', error.stack);
    
//     // Update PDF with error status
//     try {
//       await PDF.findByIdAndUpdate(pdfId, {
//         processingError: error.message
//       });
//     } catch (updateError) {
//       console.error('Failed to update error status:', updateError);
//     }
    
//     throw error;
//   }
// };

// // Calculate cosine similarity
// const cosineSimilarity = (vecA, vecB) => {
//   const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
//   const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
//   const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
//   return dotProduct / (magnitudeA * magnitudeB);
// };

// // Retrieve relevant chunks for a query
// const retrieveRelevantChunks = async (query, pdfIds, topK = 5) => {
//   try {
//     // Generate embedding for query
//     const queryEmbedding = await openai.embeddings.create({
//       model: "text-embedding-3-small",
//       input: query
//     });
    
//     const queryVector = queryEmbedding.data[0].embedding;
    
//     // Get all PDFs with their chunks
//     const pdfs = await PDF.find({ _id: { $in: pdfIds } });
    
//     // Calculate similarity for all chunks
//     const allChunks = [];
    
//     for (const pdf of pdfs) {
//       if (!pdf.chunks || pdf.chunks.length === 0) {
//         console.warn(`PDF ${pdf._id} has no chunks. Please wait for processing to complete.`);
//         continue;
//       }
      
//       for (const chunk of pdf.chunks) {
//         if (!chunk.embedding || chunk.embedding.length === 0) {
//           continue;
//         }
        
//         const similarity = cosineSimilarity(queryVector, chunk.embedding);
//         allChunks.push({
//           text: chunk.text,
//           pageNumber: chunk.pageNumber,
//           pdfTitle: pdf.title,
//           similarity: similarity
//         });
//       }
//     }
    
//     if (allChunks.length === 0) {
//       throw new Error('No processed chunks available. Please wait for PDF processing to complete.');
//     }
    
//     // Sort by similarity and return top K
//     allChunks.sort((a, b) => b.similarity - a.similarity);
//     return allChunks.slice(0, topK);
//   } catch (error) {
//     console.error('Error retrieving chunks:', error);
//     throw error;
//   }
// };

// module.exports = {
//   processPDF,
//   retrieveRelevantChunks
// };


const pdfParse = require('pdf-parse');
const axios = require('axios');
const genAI = require('../config/gemini');
const PDF = require('../models/PDF');

// Generate embedding using Gemini
const generateEmbedding = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Gemini embedding error:', error);
    throw error;
  }
};

// Chunk text into smaller pieces
const chunkText = (text, chunkSize = 1000, overlap = 200) => {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = start + chunkSize;
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }
  
  return chunks;
};

// Process PDF and create embeddings
const processPDF = async (pdfId, filepath, buffer = null) => {
  try {
    console.log(`Processing PDF ${pdfId}...`);
    console.log(`Filepath: ${filepath}`);
    
    let dataBuffer;
    
    // If buffer provided (from upload), use it directly
    if (buffer) {
      console.log('Using provided buffer');
      dataBuffer = buffer;
    } else if (filepath.startsWith('http')) {
      // Download from Cloudinary
      console.log('Downloading from Cloudinary...');
      const response = await axios.get(filepath, { responseType: 'arraybuffer' });
      dataBuffer = Buffer.from(response.data);
      console.log('Download complete');
    } else {
      // This shouldn't happen with Cloudinary, but keeping for compatibility
      const fs = require('fs');
      dataBuffer = fs.readFileSync(filepath);
    }
    
    console.log('Parsing PDF...');
    const pdfData = await pdfParse(dataBuffer);
    
    const text = pdfData.text;
    const totalPages = pdfData.numpages;
    
    console.log(`PDF parsed: ${totalPages} pages, ${text.length} characters`);
    
    if (!text || text.trim().length === 0) {
      throw new Error('PDF contains no extractable text');
    }
    
    // Split text by pages (approximate)
    const textPerPage = text.length / totalPages;
    const pageChunks = [];
    
    console.log('Creating chunks...');
    
    for (let i = 0; i < totalPages; i++) {
      const start = Math.floor(i * textPerPage);
      const end = Math.floor((i + 1) * textPerPage);
      const pageText = text.slice(start, end);
      
      if (pageText.trim()) {
        // Chunk each page
        const chunks = chunkText(pageText, 800, 100);
        
        for (const chunk of chunks) {
          if (chunk.trim().length > 50) { // Only process meaningful chunks
            pageChunks.push({
              text: chunk.trim(),
              pageNumber: i + 1
            });
          }
        }
      }
    }
    
    console.log(`Created ${pageChunks.length} chunks`);
    
    // Generate embeddings for chunks
    const chunksWithEmbeddings = [];
    let processedCount = 0;
    
    console.log('Generating embeddings...');
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < pageChunks.length; i += batchSize) {
      const batch = pageChunks.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (chunk) => {
        try {
          const embedding = await generateEmbedding(chunk.text);
          
          processedCount++;
          if (processedCount % 10 === 0) {
            console.log(`Processed ${processedCount}/${pageChunks.length} embeddings`);
          }
          
          return {
            text: chunk.text,
            pageNumber: chunk.pageNumber,
            embedding: embedding
          };
        } catch (error) {
          console.error('Error generating embedding:', error.message);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      chunksWithEmbeddings.push(...batchResults.filter(r => r !== null));
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < pageChunks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Generated ${chunksWithEmbeddings.length} embeddings`);
    
    if (chunksWithEmbeddings.length === 0) {
      console.log('Failed to generate any embeddings');
    }
    
    // Update PDF document with chunks
    console.log('Saving to database...');
    await PDF.findByIdAndUpdate(pdfId, {
      chunks: chunksWithEmbeddings,
      totalPages: totalPages
    });
    
    console.log(`PDF ${pdfId} processing complete! ${chunksWithEmbeddings.length} chunks stored.`);
    
    return { success: true, chunksCount: chunksWithEmbeddings.length };
  } catch (error) {
    console.error('Error processing PDF:', error);
    console.error('Error stack:', error.stack);
    
    // Update PDF with error status
    try {
      await PDF.findByIdAndUpdate(pdfId, {
        processingError: error.message
      });
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }
    
    throw error;
  }
};

// Calculate cosine similarity
const cosineSimilarity = (vecA, vecB) => {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};

// Retrieve relevant chunks for a query
const retrieveRelevantChunks = async (query, pdfIds, topK = 5) => {
  try {
    // Generate embedding for query
    const queryVector = await generateEmbedding(query);
    
    // Get all PDFs with their chunks
    const pdfs = await PDF.find({ _id: { $in: pdfIds } });
    
    // Calculate similarity for all chunks
    const allChunks = [];
    
    for (const pdf of pdfs) {
      if (!pdf.chunks || pdf.chunks.length === 0) {
        console.warn(`PDF ${pdf._id} has no chunks. Please wait for processing to complete.`);
        continue;
      }
      
      for (const chunk of pdf.chunks) {
        if (!chunk.embedding || chunk.embedding.length === 0) {
          continue;
        }
        
        const similarity = cosineSimilarity(queryVector, chunk.embedding);
        allChunks.push({
          text: chunk.text,
          pageNumber: chunk.pageNumber,
          pdfTitle: pdf.title,
          similarity: similarity
        });
      }
    }
    
    if (allChunks.length === 0) {
      throw new Error('No processed chunks available. Please wait for PDF processing to complete.');
    }
    
    // Sort by similarity and return top K
    allChunks.sort((a, b) => b.similarity - a.similarity);
    return allChunks.slice(0, topK);
  } catch (error) {
    console.error('Error retrieving chunks:', error);
    throw error;
  }
};

module.exports = {
  processPDF,
  retrieveRelevantChunks
};