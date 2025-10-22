const PDF = require('../models/PDF');
const ResumeReview = require('../models/ResumeReview');
const { analyzeResume } = require('../services/resumeService');
const { processPDF } = require('../services/ragService');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Upload resume
 */
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { targetRole, industry, yearsOfExperience, additionalContext } = req.body;

    console.log('Uploading resume to Cloudinary...');

    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'resumes'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload success:', result.secure_url);
            resolve(result);
          }
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    const cloudinaryResult = await uploadPromise;
    
    const resume = await PDF.create({
      userId: req.user._id,
      title: req.body.title || req.file.originalname.replace('.pdf', ''),
      filename: cloudinaryResult.public_id,
      filepath: cloudinaryResult.secure_url,
      cloudinaryId: cloudinaryResult.public_id,
      isSeeded: false,
      isResume: true,
      resumeMetadata: {
        targetRole: targetRole || '',
        industry: industry || '',
        yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
        additionalContext: additionalContext || ''
      }
    });
    
    console.log('Resume record created:', resume._id);
    console.log('Starting background processing...');
    
    processPDF(resume._id, cloudinaryResult.secure_url, req.file.buffer)
      .then(() => console.log(`Resume ${resume._id} processed successfully`))
      .catch(err => console.error(`Error processing resume ${resume._id}:`, err));
    
    res.status(201).json({ 
      message: 'Resume uploaded successfully. Processing in background.',
      resume: {
        id: resume._id,
        title: resume.title,
        filename: resume.filename,
        uploadedAt: resume.uploadedAt
      }
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate review for a resume
 */
const generateReview = async (req, res) => {
  try {
    const { pdfId } = req.params;
    const { targetRole, industry, yearsOfExperience, additionalContext } = req.body;
    
    const pdf = await PDF.findOne({
      _id: pdfId,
      userId: req.user._id,
      isResume: true
    });
    
    if (!pdf) {
      return res.status(404).json({ error: 'Resume not found or not accessible' });
    }
    
    if (!pdf.chunks || pdf.chunks.length === 0) {
      return res.status(400).json({ 
        error: 'Resume content not processed yet. Please wait a moment and try again.' 
      });
    }
    
    const userContext = {
      targetRole: targetRole || pdf.resumeMetadata?.targetRole || '',
      industry: industry || pdf.resumeMetadata?.industry || '',
      yearsOfExperience: yearsOfExperience || pdf.resumeMetadata?.yearsOfExperience || null,
      additionalContext: additionalContext || pdf.resumeMetadata?.additionalContext || ''
    };
    
    if (targetRole || industry || yearsOfExperience || additionalContext) {
      pdf.resumeMetadata = {
        ...pdf.resumeMetadata,
        ...userContext
      };
      await pdf.save();
    }
    
    const reviewData = await analyzeResume(pdfId, userContext);
    
    const review = await ResumeReview.create({
      userId: req.user._id,
      pdfId: pdfId,
      targetRole: userContext.targetRole,
      industry: userContext.industry,
      yearsOfExperience: userContext.yearsOfExperience,
      additionalContext: userContext.additionalContext,
      overallScore: reviewData.overallScore,
      atsCompatibility: reviewData.atsCompatibility,
      contentQuality: reviewData.contentQuality,
      formatting: reviewData.formatting,
      sections: reviewData.sections,
      skillsAnalysis: reviewData.skillsAnalysis,
      topStrengths: reviewData.topStrengths,
      criticalImprovements: reviewData.criticalImprovements,
      quickWins: reviewData.quickWins,
      detailedFeedback: reviewData.detailedFeedback,
      experienceAnalysis: reviewData.experienceAnalysis,
      reviewedAt: new Date()
    });
    
    res.json({
      message: 'Review generated successfully',
      reviewId: review._id,
      review: {
        overallScore: review.overallScore,
        atsCompatibility: review.atsCompatibility,
        contentQuality: review.contentQuality,
        formatting: review.formatting,
        sections: review.sections,
        skillsAnalysis: review.skillsAnalysis,
        topStrengths: review.topStrengths,
        criticalImprovements: review.criticalImprovements,
        quickWins: review.quickWins,
        detailedFeedback: review.detailedFeedback,
        experienceAnalysis: review.experienceAnalysis,
        reviewedAt: review.reviewedAt
      }
    });
    
  } catch (error) {
    console.error('Generate review error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all resumes for current user
 */
const getUserResumes = async (req, res) => {
  try {
    const resumes = await PDF.find({
      userId: req.user._id,
      isResume: true
    })
    .select('title filename uploadedAt resumeMetadata totalPages')
    .sort({ uploadedAt: -1 });
    
    const resumesWithReviewCount = await Promise.all(
      resumes.map(async (resume) => {
        const reviewCount = await ResumeReview.countDocuments({
          pdfId: resume._id
        });
        
        return {
          id: resume._id,
          title: resume.title,
          filename: resume.filename,
          uploadedAt: resume.uploadedAt,
          metadata: resume.resumeMetadata,
          totalPages: resume.totalPages,
          reviewCount
        };
      })
    );
    
    res.json({ resumes: resumesWithReviewCount });
    
  } catch (error) {
    console.error('Get user resumes error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get review history
 */
const getReviewHistory = async (req, res) => {
  try {
    const { pdfId } = req.query;
    
    const filter = { userId: req.user._id };
    if (pdfId) {
      filter.pdfId = pdfId;
    }
    
    const reviews = await ResumeReview.find(filter)
      .populate('pdfId', 'title filename')
      .select('-detailedFeedback -sections')
      .sort({ reviewedAt: -1 })
      .limit(50);
    
    res.json({ reviews });
    
  } catch (error) {
    console.error('Get review history error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get specific review
 */
const getReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await ResumeReview.findOne({
      _id: reviewId,
      userId: req.user._id
    }).populate('pdfId', 'title filename filepath uploadedAt resumeMetadata');
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json({ review });
    
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Compare two reviews
 */
const compareReviews = async (req, res) => {
  try {
    const { reviewId1, reviewId2 } = req.query;
    
    if (!reviewId1 || !reviewId2) {
      return res.status(400).json({ error: 'Please provide two review IDs to compare' });
    }
    
    const [review1, review2] = await Promise.all([
      ResumeReview.findOne({ _id: reviewId1, userId: req.user._id })
        .populate('pdfId', 'title uploadedAt'),
      ResumeReview.findOne({ _id: reviewId2, userId: req.user._id })
        .populate('pdfId', 'title uploadedAt')
    ]);
    
    if (!review1 || !review2) {
      return res.status(404).json({ error: 'One or both reviews not found' });
    }
    
    const comparison = {
      review1: {
        id: review1._id,
        resumeTitle: review1.pdfId.title,
        reviewedAt: review1.reviewedAt,
        overallScore: review1.overallScore,
        atsScore: review1.atsCompatibility.score,
        contentScore: review1.contentQuality.score,
        formattingScore: review1.formatting.score
      },
      review2: {
        id: review2._id,
        resumeTitle: review2.pdfId.title,
        reviewedAt: review2.reviewedAt,
        overallScore: review2.overallScore,
        atsScore: review2.atsCompatibility.score,
        contentScore: review2.contentQuality.score,
        formattingScore: review2.formatting.score
      },
      improvements: {
        overallScore: review2.overallScore - review1.overallScore,
        atsScore: review2.atsCompatibility.score - review1.atsCompatibility.score,
        contentScore: review2.contentQuality.score - review1.contentQuality.score,
        formattingScore: review2.formatting.score - review1.formatting.score
      },
      resolvedIssues: review1.criticalImprovements.filter(
        issue => !review2.criticalImprovements.includes(issue)
      ),
      newStrengths: review2.topStrengths.filter(
        strength => !review1.topStrengths.includes(strength)
      )
    };
    
    res.json({ comparison });
    
  } catch (error) {
    console.error('Compare reviews error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete resume
 */
const deleteResume = async (req, res) => {
  try {
    const { pdfId } = req.params;
    
    const pdf = await PDF.findOne({
      _id: pdfId,
      userId: req.user._id,
      isResume: true
    });
    
    if (!pdf) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    // Delete all reviews
    await ResumeReview.deleteMany({ pdfId: pdfId });
    
    // Delete from Cloudinary
    if (pdf.cloudinaryId) {
      await cloudinary.uploader.destroy(pdf.cloudinaryId, { resource_type: 'raw' });
    }
    
    // Delete PDF document
    await PDF.deleteOne({ _id: pdfId });
    
    res.json({ message: 'Resume and associated reviews deleted successfully' });
    
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get resume statistics
 */
const getResumeStats = async (req, res) => {
  try {
    const { pdfId } = req.params;
    
    const reviews = await ResumeReview.find({
      userId: req.user._id,
      pdfId: pdfId
    }).sort({ reviewedAt: 1 });
    
    if (reviews.length === 0) {
      return res.status(404).json({ error: 'No reviews found for this resume' });
    }
    
    const stats = {
      totalReviews: reviews.length,
      firstReview: reviews[0].reviewedAt,
      latestReview: reviews[reviews.length - 1].reviewedAt,
      scoreProgress: {
        overall: reviews.map(r => ({ date: r.reviewedAt, score: r.overallScore })),
        ats: reviews.map(r => ({ date: r.reviewedAt, score: r.atsCompatibility.score })),
        content: reviews.map(r => ({ date: r.reviewedAt, score: r.contentQuality.score })),
        formatting: reviews.map(r => ({ date: r.reviewedAt, score: r.formatting.score }))
      },
      improvement: {
        overall: reviews[reviews.length - 1].overallScore - reviews[0].overallScore,
        ats: reviews[reviews.length - 1].atsCompatibility.score - reviews[0].atsCompatibility.score,
        content: reviews[reviews.length - 1].contentQuality.score - reviews[0].contentQuality.score,
        formatting: reviews[reviews.length - 1].formatting.score - reviews[0].formatting.score
      },
      currentScores: {
        overall: reviews[reviews.length - 1].overallScore,
        ats: reviews[reviews.length - 1].atsCompatibility.score,
        content: reviews[reviews.length - 1].contentQuality.score,
        formatting: reviews[reviews.length - 1].formatting.score
      }
    };
    
    res.json({ stats });
    
  } catch (error) {
    console.error('Get resume stats error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadResume,
  generateReview,
  getUserResumes,
  getReviewHistory,
  getReview,
  compareReviews,
  deleteResume,
  getResumeStats
};