import React, { useState, useEffect } from 'react';
import { Upload, FileText, TrendingUp, Eye, Trash2, BarChart3, GitCompare, Plus, RefreshCw, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

// API Configuration
const API_BASE_URL = 'https://llm-course-revision-1.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Resume APIs
export const resumeAPI = {
  uploadResume: (formData) => api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAllResumes: () => api.get('/resume/resumes'),
  generateReview: (pdfId, data) => api.post(`/resume/review/${pdfId}`, data),
  getReviewHistory: (pdfId = null) => api.get('/resume/reviews', { params: pdfId ? { pdfId } : {} }),
  getReview: (reviewId) => api.get(`/resume/review/${reviewId}`),
  compareReviews: (reviewId1, reviewId2) => api.get('/resume/compare', { 
    params: { reviewId1, reviewId2 } 
  }),
  getResumeStats: (pdfId) => api.get(`/resume/stats/${pdfId}`),
  deleteResume: (pdfId) => api.delete(`/resume/resume/${pdfId}`),
};

// Shadcn-style Components
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`p-6 pb-4 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = "primary", disabled = false, className = "", icon: Icon, type = "button" }) => {
  const baseClasses = "px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-gray-700 hover:bg-gray-100",
  };
  
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const Badge = ({ children, variant = "default" }) => {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

const ScoreCircle = ({ score, size = "md" }) => {
  const sizes = {
    sm: { circle: "w-16 h-16", text: "text-lg" },
    md: { circle: "w-24 h-24", text: "text-2xl" },
    lg: { circle: "w-32 h-32", text: "text-3xl" },
  };
  
  const getColor = (score) => {
    if (score >= 80) return "text-green-600 border-green-600";
    if (score >= 60) return "text-yellow-600 border-yellow-600";
    return "text-red-600 border-red-600";
  };
  
  return (
    <div className={`${sizes[size].circle} rounded-full border-4 ${getColor(score)} flex items-center justify-center`}>
      <span className={`${sizes[size].text} font-bold`}>{score}</span>
    </div>
  );
};

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const ResumeReview = () => {
  const [resumes, setResumes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [stats, setStats] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState({});
  const [activeTab, setActiveTab] = useState('resumes');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    file: null,
    title: '',
    targetRole: '',
    industry: '',
    yearsOfExperience: '',
    additionalContext: '',
  });

  // Compare form
  const [compareForm, setCompareForm] = useState({
    reviewId1: '',
    reviewId2: '',
  });

  useEffect(() => {
    loadResumes();
    loadReviews();
  }, []);

  const loadResumes = async () => {
    setLoading(prev => ({ ...prev, resumes: true }));
    try {
      const response = await resumeAPI.getAllResumes();
      setResumes(response.data.resumes);
    } catch (error) {
      console.error('Error loading resumes:', error);
      alert('Failed to load resumes');
    } finally {
      setLoading(prev => ({ ...prev, resumes: false }));
    }
  };

  const loadReviews = async (pdfId = null) => {
    setLoading(prev => ({ ...prev, reviews: true }));
    try {
      const response = await resumeAPI.getReviewHistory(pdfId);
      setReviews(response.data.reviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(prev => ({ ...prev, reviews: false }));
    }
  };

  const handleUploadResume = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) {
      alert('Please select a PDF file');
      return;
    }

    setLoading(prev => ({ ...prev, upload: true }));
    try {
      const formData = new FormData();
      formData.append('pdf', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('targetRole', uploadForm.targetRole);
      formData.append('industry', uploadForm.industry);
      formData.append('yearsOfExperience', uploadForm.yearsOfExperience);
      formData.append('additionalContext', uploadForm.additionalContext);

      const response = await resumeAPI.uploadResume(formData);
      alert(response.data.message);
      setShowUploadModal(false);
      setUploadForm({
        file: null,
        title: '',
        targetRole: '',
        industry: '',
        yearsOfExperience: '',
        additionalContext: '',
      });
      loadResumes();
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert(error.response?.data?.error || 'Failed to upload resume');
    } finally {
      setLoading(prev => ({ ...prev, upload: false }));
    }
  };

  const handleGenerateReview = async (pdfId) => {
    setLoading(prev => ({ ...prev, [`review_${pdfId}`]: true }));
    try {
      const response = await resumeAPI.generateReview(pdfId, {});
      alert('Review generated successfully!');
      setSelectedReview(response.data.review);
      setShowReviewModal(true);
      loadReviews();
    } catch (error) {
      console.error('Error generating review:', error);
      alert(error.response?.data?.error || 'Failed to generate review');
    } finally {
      setLoading(prev => ({ ...prev, [`review_${pdfId}`]: false }));
    }
  };

  const handleViewReview = async (reviewId) => {
    setLoading(prev => ({ ...prev, viewReview: true }));
    try {
      const response = await resumeAPI.getReview(reviewId);
      setSelectedReview(response.data.review);
      setShowReviewModal(true);
    } catch (error) {
      console.error('Error loading review:', error);
      alert('Failed to load review');
    } finally {
      setLoading(prev => ({ ...prev, viewReview: false }));
    }
  };

  const handleViewStats = async (pdfId) => {
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      const response = await resumeAPI.getResumeStats(pdfId);
      setStats(response.data.stats);
      setShowStatsModal(true);
    } catch (error) {
      console.error('Error loading stats:', error);
      alert(error.response?.data?.error || 'Failed to load statistics');
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  const handleCompareReviews = async () => {
    if (!compareForm.reviewId1 || !compareForm.reviewId2) {
      alert('Please select two reviews to compare');
      return;
    }

    setLoading(prev => ({ ...prev, compare: true }));
    try {
      const response = await resumeAPI.compareReviews(compareForm.reviewId1, compareForm.reviewId2);
      setComparison(response.data.comparison);
    } catch (error) {
      console.error('Error comparing reviews:', error);
      alert(error.response?.data?.error || 'Failed to compare reviews');
    } finally {
      setLoading(prev => ({ ...prev, compare: false }));
    }
  };

  const handleDeleteResume = async (pdfId) => {
    if (!window.confirm('Are you sure you want to delete this resume and all its reviews?')) {
      return;
    }

    setLoading(prev => ({ ...prev, [`delete_${pdfId}`]: true }));
    try {
      await resumeAPI.deleteResume(pdfId);
      alert('Resume deleted successfully');
      loadResumes();
      loadReviews();
    } catch (error) {
      console.error('Error deleting resume:', error);
      alert('Failed to delete resume');
    } finally {
      setLoading(prev => ({ ...prev, [`delete_${pdfId}`]: false }));
    }
  };

  // Render Functions
  const renderResumesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Resumes</h2>
        <Button onClick={() => setShowUploadModal(true)} icon={Plus}>
          Upload Resume
        </Button>
      </div>

      {loading.resumes ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : resumes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No resumes uploaded yet. Upload your first resume to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((resume) => (
            <Card key={resume.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="text-blue-600" size={32} />
                  <Badge>{resume.reviewCount} reviews</Badge>
                </div>
                <CardTitle className="mt-3">{resume.title}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(resume.uploadedAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                {resume.metadata && (
                  <div className="space-y-2 mb-4 text-sm">
                    {resume.metadata.targetRole && (
                      <p><span className="font-medium">Role:</span> {resume.metadata.targetRole}</p>
                    )}
                    {resume.metadata.industry && (
                      <p><span className="font-medium">Industry:</span> {resume.metadata.industry}</p>
                    )}
                    {resume.metadata.yearsOfExperience && (
                      <p><span className="font-medium">Experience:</span> {resume.metadata.yearsOfExperience} years</p>
                    )}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    onClick={() => handleGenerateReview(resume.id)}
                    disabled={loading[`review_${resume.id}`]}
                    className="flex-1"
                  >
                    {loading[`review_${resume.id}`] ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <TrendingUp size={16} />
                    )}
                    Review
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={() => handleViewStats(resume.id)}
                    disabled={resume.reviewCount === 0}
                  >
                    <BarChart3 size={16} />
                  </Button>
                  
                  <Button
                    variant="danger"
                    onClick={() => handleDeleteResume(resume.id)}
                    disabled={loading[`delete_${resume.id}`]}
                  >
                    {loading[`delete_${resume.id}`] ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderReviewsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Review History</h2>
        <Button onClick={() => loadReviews()} icon={RefreshCw}>
          Refresh
        </Button>
      </div>

      {loading.reviews ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <TrendingUp size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No reviews yet. Generate your first review to see it here!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">
                      {review.pdfId?.title || 'Untitled Resume'}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Overall</p>
                        <p className="text-2xl font-bold text-blue-600">{review.overallScore}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">ATS</p>
                        <p className="text-2xl font-bold text-green-600">{review.atsCompatibility?.score || review.atsCompatibility}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Content</p>
                        <p className="text-2xl font-bold text-purple-600">{review.contentQuality?.score || review.contentQuality}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Format</p>
                        <p className="text-2xl font-bold text-orange-600">{review.formatting?.score || review.formatting}</p>
                      </div>
                    </div>
                    
                    {review.targetRole && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="info">{review.targetRole}</Badge>
                        {review.industry && <Badge variant="default">{review.industry}</Badge>}
                        {review.yearsOfExperience && (
                          <Badge variant="default">{review.yearsOfExperience} years</Badge>
                        )}
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-500">
                      {new Date(review.reviewedAt).toLocaleString()}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    onClick={() => handleViewReview(review._id)}
                    icon={Eye}
                  >
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderCompareTab = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Compare Reviews</h2>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Review</label>
              <select
                value={compareForm.reviewId1}
                onChange={(e) => setCompareForm({ ...compareForm, reviewId1: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a review</option>
                {reviews.map((review) => (
                  <option key={review._id} value={review._id}>
                    {review.pdfId?.title} - {new Date(review.reviewedAt).toLocaleDateString()} (Score: {review.overallScore})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Second Review</label>
              <select
                value={compareForm.reviewId2}
                onChange={(e) => setCompareForm({ ...compareForm, reviewId2: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a review</option>
                {reviews.map((review) => (
                  <option key={review._id} value={review._id}>
                    {review.pdfId?.title} - {new Date(review.reviewedAt).toLocaleDateString()} (Score: {review.overallScore})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={handleCompareReviews}
            disabled={loading.compare || !compareForm.reviewId1 || !compareForm.reviewId2}
            icon={GitCompare}
            className="w-full"
          >
            {loading.compare ? 'Comparing...' : 'Compare Reviews'}
          </Button>
        </CardContent>
      </Card>

      {comparison && (
        <Card>
          <CardHeader>
            <CardTitle>Comparison Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold mb-3">Review 1: {comparison.review1.resumeTitle}</h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {new Date(comparison.review1.reviewedAt).toLocaleDateString()}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-500">Overall</p>
                      <p className="text-xl font-bold">{comparison.review1.overallScore}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-500">ATS</p>
                      <p className="text-xl font-bold">{comparison.review1.atsScore}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-500">Content</p>
                      <p className="text-xl font-bold">{comparison.review1.contentScore}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-500">Format</p>
                      <p className="text-xl font-bold">{comparison.review1.formattingScore}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Review 2: {comparison.review2.resumeTitle}</h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {new Date(comparison.review2.reviewedAt).toLocaleDateString()}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-500">Overall</p>
                      <p className="text-xl font-bold">{comparison.review2.overallScore}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-500">ATS</p>
                      <p className="text-xl font-bold">{comparison.review2.atsScore}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-500">Content</p>
                      <p className="text-xl font-bold">{comparison.review2.contentScore}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-500">Format</p>
                      <p className="text-xl font-bold">{comparison.review2.formattingScore}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="text-green-600" />
                Improvements
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {Object.entries(comparison.improvements).map(([key, value]) => (
                  <div key={key} className={`p-3 rounded ${value >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className="text-xs text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className={`text-2xl font-bold ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {value >= 0 ? '+' : ''}{value}
                    </p>
                  </div>
                ))}
              </div>

              {comparison.resolvedIssues && comparison.resolvedIssues.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="text-green-600" size={18} />
                    Resolved Issues
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {comparison.resolvedIssues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {comparison.newStrengths && comparison.newStrengths.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="text-blue-600" size={18} />
                    New Strengths
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {comparison.newStrengths.map((strength, idx) => (
                      <li key={idx}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Resume Review Dashboard</h1>
          <p className="text-gray-600">Upload, analyze, and improve your resumes with AI-powered insights</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            {[
              { id: 'resumes', label: 'My Resumes', icon: FileText },
              { id: 'reviews', label: 'Review History', icon: TrendingUp },
              { id: 'compare', label: 'Compare', icon: GitCompare },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 font-medium'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'resumes' && renderResumesTab()}
        {activeTab === 'reviews' && renderReviewsTab()}
        {activeTab === 'compare' && renderCompareTab()}

        {/* Upload Modal */}
        <Modal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Upload Resume"
        >
          <form onSubmit={handleUploadResume} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">PDF File *</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Resume Title</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="e.g., Software Engineer Resume 2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target Role</label>
                <input
                  type="text"
                  value={uploadForm.targetRole}
                  onChange={(e) => setUploadForm({ ...uploadForm, targetRole: e.target.value })}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Industry</label>
                <input
                  type="text"
                  value={uploadForm.industry}
                  onChange={(e) => setUploadForm({ ...uploadForm, industry: e.target.value })}
                  placeholder="e.g., Technology, Healthcare, Finance"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Years of Experience</label>
                <input
                  type="number"
                  value={uploadForm.yearsOfExperience}
                  onChange={(e) => setUploadForm({ ...uploadForm, yearsOfExperience: e.target.value })}
                  placeholder="e.g., 5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Additional Context</label>
                <textarea
                  value={uploadForm.additionalContext}
                  onChange={(e) => setUploadForm({ ...uploadForm, additionalContext: e.target.value })}
                  placeholder="Any additional information to help with the review..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading.upload} className="flex-1">
                  {loading.upload ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Upload Resume
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </Modal>

        {/* Review Detail Modal */}
        <Modal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedReview(null);
          }}
          title="Review Details"
        >
          {selectedReview && (
            <div className="p-6 space-y-6">
              {/* Scores Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <ScoreCircle score={selectedReview.overallScore} size="md" />
                  <p className="mt-2 font-medium">Overall</p>
                </div>
                <div className="text-center">
                  <ScoreCircle score={selectedReview.atsCompatibility?.score || selectedReview.atsCompatibility} size="sm" />
                  <p className="mt-2 text-sm font-medium">ATS</p>
                </div>
                <div className="text-center">
                  <ScoreCircle score={selectedReview.contentQuality?.score || selectedReview.contentQuality} size="sm" />
                  <p className="mt-2 text-sm font-medium">Content</p>
                </div>
                <div className="text-center">
                  <ScoreCircle score={selectedReview.formatting?.score || selectedReview.formatting} size="sm" />
                  <p className="mt-2 text-sm font-medium">Format</p>
                </div>
              </div>

              {/* Top Strengths */}
              {selectedReview.topStrengths && selectedReview.topStrengths.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="text-green-600" />
                    Top Strengths
                  </h3>
                  <ul className="space-y-2">
                    {selectedReview.topStrengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="text-green-600 mt-0.5 flex-shrink-0" size={16} />
                        <span className="text-gray-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Critical Improvements */}
              {selectedReview.criticalImprovements && selectedReview.criticalImprovements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="text-red-600" />
                    Critical Improvements
                  </h3>
                  <ul className="space-y-2">
                    {selectedReview.criticalImprovements.map((improvement, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={16} />
                        <span className="text-gray-700">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quick Wins */}
              {selectedReview.quickWins && selectedReview.quickWins.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="text-blue-600" />
                    Quick Wins
                  </h3>
                  <ul className="space-y-2">
                    {selectedReview.quickWins.map((win, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                          {idx + 1}
                        </div>
                        <span className="text-gray-700">{win}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Detailed Feedback */}
              {selectedReview.detailedFeedback && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Detailed Feedback</h3>
                  <p className="text-gray-700 whitespace-pre-line">{selectedReview.detailedFeedback}</p>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Stats Modal */}
        <Modal
          isOpen={showStatsModal}
          onClose={() => {
            setShowStatsModal(false);
            setStats(null);
          }}
          title="Resume Statistics"
        >
          {stats && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalReviews}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Overall Score</p>
                  <p className="text-3xl font-bold text-green-600">{stats.currentScores.overall}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">ATS Score</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.currentScores.ats}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Content Score</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.currentScores.content}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Overall Improvement</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(stats.improvement).map(([key, value]) => (
                    <div key={key} className={`p-3 rounded ${value >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className="text-xs text-gray-600 capitalize mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className={`text-2xl font-bold ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {value >= 0 ? '+' : ''}{value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-sm text-gray-500">
                <p>First Review: {new Date(stats.firstReview).toLocaleDateString()}</p>
                <p>Latest Review: {new Date(stats.latestReview).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default ResumeReview;