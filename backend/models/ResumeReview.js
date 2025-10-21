const mongoose = require('mongoose');

const resumeReviewSchema = new mongoose.Schema({
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
  
  // User context at time of review
  targetRole: String,
  industry: String,
  yearsOfExperience: Number,
  additionalContext: String,
  
  // Overall metrics
  overallScore: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // ATS Compatibility Analysis
  atsCompatibility: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    hasStandardSections: Boolean,
    keywordDensity: String, // "Low", "Medium", "High"
    formatIssues: [String],
    recommendations: [String]
  },
  
  // Content Quality Analysis
  contentQuality: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    hasQuantifiableAchievements: Boolean,
    actionVerbUsage: String, // "Weak", "Good", "Excellent"
    clarity: String, // "Needs Improvement", "Good", "Excellent"
    feedback: String
  },
  
  // Formatting Analysis
  formatting: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    consistency: String, // "Inconsistent", "Mostly Consistent", "Consistent"
    readability: String, // "Poor", "Fair", "Good", "Excellent"
    visualHierarchy: String,
    issues: [String],
    suggestions: [String]
  },
  
  // Section-by-section breakdown
  sections: [{
    name: String, // "Summary/Objective", "Experience", "Education", "Skills", etc.
    present: Boolean,
    score: Number,
    feedback: String,
    strengths: [String],
    improvements: [String]
  }],
  
  // Skills Analysis
  skillsAnalysis: {
    technicalSkills: [String],
    softSkills: [String],
    missingSkills: [String], // Based on target role
    recommendedSkills: [String],
    skillsMatchScore: Number // How well skills match the target role
  },
  
  // Key Highlights
  topStrengths: [String],
  criticalImprovements: [String],
  quickWins: [String], // Easy fixes that can make big impact
  
  // Detailed narrative feedback
  detailedFeedback: String,
  
  // Experience Analysis
  experienceAnalysis: {
    relevanceScore: Number,
    careerProgression: String, // "Unclear", "Lateral", "Upward"
    gapsIdentified: Boolean,
    gapExplanation: String
  },
  
  reviewedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
resumeReviewSchema.index({ userId: 1, reviewedAt: -1 });
resumeReviewSchema.index({ pdfId: 1 });

module.exports = mongoose.model('ResumeReview', resumeReviewSchema);