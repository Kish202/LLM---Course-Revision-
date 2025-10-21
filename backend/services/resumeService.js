const OpenAI = require('openai');
const PDF = require('../models/PDF');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Analyze resume and generate comprehensive review
 */
const analyzeResume = async (pdfId, userContext) => {
  try {
    // Fetch the resume PDF
    const pdf = await PDF.findById(pdfId);
    
    if (!pdf) {
      throw new Error('Resume PDF not found');
    }
    
    if (!pdf.isResume) {
      throw new Error('This PDF is not marked as a resume');
    }
    
    // Combine all chunks to get full resume text
    const fullResumeText = pdf.chunks
      .sort((a, b) => a.pageNumber - b.pageNumber)
      .map(chunk => chunk.text)
      .join('\n\n');
    
    // Construct the analysis prompt
    const prompt = constructResumeAnalysisPrompt(fullResumeText, userContext);
    
    // Call OpenAI for analysis
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert resume reviewer and career coach with extensive experience in ATS systems, recruitment, and professional development. You provide detailed, actionable feedback on resumes."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const reviewData = JSON.parse(completion.choices[0].message.content);
    
    return reviewData;
    
  } catch (error) {
    console.error('Resume analysis error:', error);
    throw new Error(`Failed to analyze resume: ${error.message}`);
  }
};

/**
 * Construct detailed prompt for resume analysis
 */
const constructResumeAnalysisPrompt = (resumeText, userContext) => {
  const { targetRole, industry, yearsOfExperience, additionalContext } = userContext;
  
  return `
Analyze the following resume in extreme detail and provide a comprehensive review. 

**Candidate Context:**
- Target Role: ${targetRole || 'Not specified'}
- Industry: ${industry || 'Not specified'}
- Years of Experience: ${yearsOfExperience || 'Not specified'}
- Additional Context: ${additionalContext || 'None'}

**Resume Text:**
${resumeText}

Please analyze this resume across the following dimensions and return a JSON object with this EXACT structure:

{
  "overallScore": <number 0-100>,
  "atsCompatibility": {
    "score": <number 0-100>,
    "hasStandardSections": <boolean>,
    "keywordDensity": "<Low|Medium|High>",
    "formatIssues": [<array of specific formatting issues that hurt ATS parsing>],
    "recommendations": [<array of specific recommendations to improve ATS compatibility>]
  },
  "contentQuality": {
    "score": <number 0-100>,
    "hasQuantifiableAchievements": <boolean>,
    "actionVerbUsage": "<Weak|Good|Excellent>",
    "clarity": "<Needs Improvement|Good|Excellent>",
    "feedback": "<detailed paragraph about content quality>"
  },
  "formatting": {
    "score": <number 0-100>,
    "consistency": "<Inconsistent|Mostly Consistent|Consistent>",
    "readability": "<Poor|Fair|Good|Excellent>",
    "visualHierarchy": "<string describing the visual hierarchy>",
    "issues": [<array of formatting problems>],
    "suggestions": [<array of specific formatting improvements>]
  },
  "sections": [
    {
      "name": "<section name like Summary, Experience, Education, Skills, etc>",
      "present": <boolean>,
      "score": <number 0-100>,
      "feedback": "<detailed feedback for this section>",
      "strengths": [<array of strengths in this section>],
      "improvements": [<array of specific improvements needed>]
    }
  ],
  "skillsAnalysis": {
    "technicalSkills": [<array of technical skills found>],
    "softSkills": [<array of soft skills found>],
    "missingSkills": [<array of important skills missing for the target role>],
    "recommendedSkills": [<array of skills to add based on target role and industry>],
    "skillsMatchScore": <number 0-100 indicating how well skills match target role>
  },
  "topStrengths": [<array of 3-5 top strengths>],
  "criticalImprovements": [<array of 3-5 most critical improvements needed>],
  "quickWins": [<array of 3-5 easy fixes that would have high impact>],
  "detailedFeedback": "<comprehensive narrative feedback covering all aspects>",
  "experienceAnalysis": {
    "relevanceScore": <number 0-100>,
    "careerProgression": "<Unclear|Lateral|Upward>",
    "gapsIdentified": <boolean>,
    "gapExplanation": "<explanation of any employment gaps if found>"
  }
}

**Analysis Guidelines:**
1. **ATS Compatibility**: Check for standard section headers, keyword optimization, simple formatting, no tables/columns that confuse ATS
2. **Content Quality**: Look for STAR method (Situation, Task, Action, Result), quantifiable achievements, strong action verbs, impact statements
3. **Formatting**: Assess consistency in fonts, spacing, bullet points, dates, overall readability
4. **Sections**: Evaluate each section individually - Summary/Objective, Work Experience, Education, Skills, Certifications, etc.
5. **Skills**: Match skills against the target role requirements
6. **Experience**: Check relevance to target role, career progression clarity, achievement focus

Be specific, actionable, and constructive in all feedback. Focus on what will help the candidate land interviews.
`;
};

/**
 * Generate embeddings for resume text (for chat context)
 */
const generateResumeEmbedding = async (text) => {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw error;
  }
};

module.exports = {
  analyzeResume,
  generateResumeEmbedding,
  constructResumeAnalysisPrompt
};