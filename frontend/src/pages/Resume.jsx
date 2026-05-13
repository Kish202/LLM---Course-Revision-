import React, { useState, useEffect } from 'react';
import { Upload, FileText, TrendingUp, Eye, Trash2, BarChart3, GitCompare, Plus, RefreshCw, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// API Configuration
const API_BASE_URL = 'https://llm-course-revision-1.onrender.com/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export const resumeAPI = {
  uploadResume: (formData) => api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAllResumes: () => api.get('/resume/resumes'),
  generateReview: (pdfId, data) => api.post(`/resume/review/${pdfId}`, data),
  getReviewHistory: (pdfId = null) => api.get('/resume/reviews', { params: pdfId ? { pdfId } : {} }),
  getReview: (reviewId) => api.get(`/resume/review/${reviewId}`),
  compareReviews: (reviewId1, reviewId2) => api.get('/resume/compare', { params: { reviewId1, reviewId2 } }),
  getResumeStats: (pdfId) => api.get(`/resume/stats/${pdfId}`),
  deleteResume: (pdfId) => api.delete(`/resume/resume/${pdfId}`),
};

// ── Modal (kept from original) ───────────────────────────────────────────────
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
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">{children}</div>
      </div>
    </div>
  );
};

// ── Score badge helper ────────────────────────────────────────────────────────
const scoreBadgeVariant = (score) =>
  score >= 80 ? 'default' : score >= 60 ? 'secondary' : 'destructive';

const scoreLabel = (score) =>
  score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Needs Work';

// ── Main Component ────────────────────────────────────────────────────────────
const ResumeReview = () => {
  const [resumes, setResumes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [stats, setStats] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [error, setError] = useState('');

  const [uploadForm, setUploadForm] = useState({
    file: null, title: '', targetRole: '', industry: '', yearsOfExperience: '', additionalContext: '',
  });
  const [compareForm, setCompareForm] = useState({ reviewId1: '', reviewId2: '' });

  useEffect(() => {
    loadResumes();
    loadReviews();
  }, []);

  const loadResumes = async () => {
    setLoading(p => ({ ...p, resumes: true }));
    try {
      const res = await resumeAPI.getAllResumes();
      setResumes(res.data.resumes);
    } catch {
      setError('Failed to load resumes');
    } finally {
      setLoading(p => ({ ...p, resumes: false }));
    }
  };

  const loadReviews = async (pdfId = null) => {
    setLoading(p => ({ ...p, reviews: true }));
    try {
      const res = await resumeAPI.getReviewHistory(pdfId);
      setReviews(res.data.reviews);
    } catch {
      // silently fail
    } finally {
      setLoading(p => ({ ...p, reviews: false }));
    }
  };

  const handleUploadResume = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) { alert('Please select a PDF file'); return; }
    setLoading(p => ({ ...p, upload: true }));
    try {
      const formData = new FormData();
      Object.entries(uploadForm).forEach(([k, v]) => { if (v) formData.append(k === 'file' ? 'pdf' : k, v); });
      const res = await resumeAPI.uploadResume(formData);
      alert(res.data.message);
      setShowUploadModal(false);
      setUploadForm({ file: null, title: '', targetRole: '', industry: '', yearsOfExperience: '', additionalContext: '' });
      loadResumes();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload resume');
    } finally {
      setLoading(p => ({ ...p, upload: false }));
    }
  };

  const handleGenerateReview = async (pdfId) => {
    setLoading(p => ({ ...p, [`review_${pdfId}`]: true }));
    try {
      const res = await resumeAPI.generateReview(pdfId, {});
      setSelectedReview(res.data.review);
      setShowReviewModal(true);
      loadReviews();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate review');
    } finally {
      setLoading(p => ({ ...p, [`review_${pdfId}`]: false }));
    }
  };

  const handleViewReview = (reviewId) => {
    setSelectedReview(null);
    setShowReviewModal(true);
    setLoading(p => ({ ...p, viewReview: true }));
    resumeAPI.getReview(reviewId)
      .then(res => setSelectedReview(res.data.review))
      .catch(() => alert('Failed to load review'))
      .finally(() => setLoading(p => ({ ...p, viewReview: false })));
  };

  const handleViewStats = async (pdfId) => {
    setLoading(p => ({ ...p, stats: true }));
    try {
      const res = await resumeAPI.getResumeStats(pdfId);
      setStats(res.data.stats);
      setShowStatsModal(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to load statistics');
    } finally {
      setLoading(p => ({ ...p, stats: false }));
    }
  };

  const handleCompareReviews = async () => {
    if (!compareForm.reviewId1 || !compareForm.reviewId2) { alert('Please select two reviews to compare'); return; }
    setLoading(p => ({ ...p, compare: true }));
    try {
      const res = await resumeAPI.compareReviews(compareForm.reviewId1, compareForm.reviewId2);
      setComparison(res.data.comparison);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to compare reviews');
    } finally {
      setLoading(p => ({ ...p, compare: false }));
    }
  };

  const handleDeleteResume = async (pdfId) => {
    if (!window.confirm('Are you sure you want to delete this resume and all its reviews?')) return;
    setLoading(p => ({ ...p, [`delete_${pdfId}`]: true }));
    try {
      await resumeAPI.deleteResume(pdfId);
      loadResumes(); loadReviews();
    } catch {
      alert('Failed to delete resume');
    } finally {
      setLoading(p => ({ ...p, [`delete_${pdfId}`]: false }));
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading.resumes && resumes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading your resumes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl pt-1 font-bold text-slate-900">Resume Review Dashboard</h1>
          <p className="text-slate-600 mt-1">Upload, analyze, and improve your resumes with AI-powered insights</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} /> Upload Resume
        </button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Overview Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Resumes</p>
              <p className="text-3xl font-bold text-slate-900">{resumes.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center border">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Reviews</p>
              <p className="text-3xl font-bold text-slate-900">{reviews.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center border">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Avg Overall Score</p>
              <p className="text-3xl font-bold text-slate-900">
                {reviews.length > 0
                  ? Math.round(reviews.reduce((s, r) => s + r.overallScore, 0) / reviews.length)
                  : '—'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center border">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Avg ATS Score</p>
              <p className="text-3xl font-bold text-slate-900">
                {reviews.length > 0
                  ? Math.round(reviews.reduce((s, r) => s + (r.atsCompatibility?.score ?? r.atsCompatibility ?? 0), 0) / reviews.length)
                  : '—'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center border">
              <CheckCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="resumes">
        <TabsList className="border border-slate-200">
          <TabsTrigger value="resumes"><FileText className="h-4 w-4 mr-1 inline" />My Resumes</TabsTrigger>
          <TabsTrigger value="reviews"><TrendingUp className="h-4 w-4 mr-1 inline" />Review History</TabsTrigger>
          <TabsTrigger value="compare"><GitCompare className="h-4 w-4 mr-1 inline" />Compare</TabsTrigger>
        </TabsList>

        {/* ── My Resumes Tab ─────────────────────────────────────────────── */}
        <TabsContent value="resumes">
          <div className="rounded-xl border overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Uploaded Resumes</h3>
                <p className="text-sm text-slate-600 mt-1">Manage and review your resumes</p>
              </div>
              <button
                onClick={loadResumes}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {resumes.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-slate-900">No Resumes Yet</h2>
                <p className="text-slate-600">Upload your first resume to get started!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Resume</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Target Role</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Industry</th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Reviews</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Uploaded</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {resumes.map((resume) => (
                      <tr key={resume.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-slate-900">{resume.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {resume.metadata?.targetRole || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {resume.metadata?.industry || '—'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="secondary">{resume.reviewCount}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(resume.uploadedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleGenerateReview(resume.id)}
                              disabled={loading[`review_${resume.id}`]}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                              {loading[`review_${resume.id}`]
                                ? <Loader2 size={12} className="animate-spin" />
                                : <TrendingUp size={12} />}
                              Review
                            </button>
                            <button
                              onClick={() => handleViewStats(resume.id)}
                              disabled={resume.reviewCount === 0}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"
                            >
                              <BarChart3 size={12} /> Stats
                            </button>
                            <button
                              onClick={() => handleDeleteResume(resume.id)}
                              disabled={loading[`delete_${resume.id}`]}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                            >
                              {loading[`delete_${resume.id}`]
                                ? <Loader2 size={12} className="animate-spin" />
                                : <Trash2 size={12} />}
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Review History Tab ─────────────────────────────────────────── */}
        <TabsContent value="reviews">
          <div className="rounded-xl border overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Review History</h3>
                <p className="text-sm text-slate-600 mt-1">All AI-generated resume reviews</p>
              </div>
              <button
                onClick={() => loadReviews()}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {loading.reviews ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin text-blue-600" size={28} />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-slate-900">No Reviews Yet</h2>
                <p className="text-slate-600">Generate your first review to see it here!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Resume</th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Overall</th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">ATS</th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Content</th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Format</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Date</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {reviews.map((review) => {
                      const ats = review.atsCompatibility?.score ?? review.atsCompatibility;
                      const content = review.contentQuality?.score ?? review.contentQuality;
                      const format = review.formatting?.score ?? review.formatting;
                      return (
                        <tr key={review._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <span className="font-medium text-slate-900">{review.pdfId?.title || 'Untitled Resume'}</span>
                                {review.targetRole && (
                                  <p className="text-xs text-slate-500">{review.targetRole}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant={scoreBadgeVariant(review.overallScore)}>
                              {review.overallScore}%
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-slate-900">{ats}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-slate-900">{content}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-slate-900">{format}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {new Date(review.reviewedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleViewReview(review._id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors ml-auto"
                            >
                              <Eye size={12} /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Compare Tab ────────────────────────────────────────────────── */}
        <TabsContent value="compare" className="space-y-4">
          <div className="rounded-xl border p-6">
            <h3 className="font-semibold text-slate-900 mb-1">Compare Two Reviews</h3>
            <p className="text-sm text-slate-600 mb-6">Select two reviews to see how your resume has improved</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">First Review</label>
                <select
                  value={compareForm.reviewId1}
                  onChange={(e) => setCompareForm({ ...compareForm, reviewId1: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a review</option>
                  {reviews.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.pdfId?.title} — {new Date(r.reviewedAt).toLocaleDateString()} (Score: {r.overallScore})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Second Review</label>
                <select
                  value={compareForm.reviewId2}
                  onChange={(e) => setCompareForm({ ...compareForm, reviewId2: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a review</option>
                  {reviews.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.pdfId?.title} — {new Date(r.reviewedAt).toLocaleDateString()} (Score: {r.overallScore})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleCompareReviews}
              disabled={loading.compare || !compareForm.reviewId1 || !compareForm.reviewId2}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {loading.compare ? <Loader2 size={14} className="animate-spin" /> : <GitCompare size={14} />}
              Compare Reviews
            </button>
          </div>

          {comparison && (
            <div className="space-y-4">
              {/* Side-by-side scores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Review 1', data: comparison.review1, scores: { Overall: comparison.review1.overallScore, ATS: comparison.review1.atsScore, Content: comparison.review1.contentScore, Format: comparison.review1.formattingScore } },
                  { label: 'Review 2', data: comparison.review2, scores: { Overall: comparison.review2.overallScore, ATS: comparison.review2.atsScore, Content: comparison.review2.contentScore, Format: comparison.review2.formattingScore } },
                ].map(({ label, data, scores }) => (
                  <div key={label} className="rounded-xl border p-6">
                    <h4 className="font-semibold text-slate-900 mb-1">{label}: {data.resumeTitle}</h4>
                    <p className="text-sm text-slate-500 mb-4">{new Date(data.reviewedAt).toLocaleDateString()}</p>
                    <div className="space-y-3">
                      {Object.entries(scores).map(([name, val]) => (
                        <div key={name}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-slate-600">{name}</span>
                            <Badge variant={scoreBadgeVariant(val)}>{val}%</Badge>
                          </div>
                          <Progress value={val} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Improvements */}
              <div className="rounded-xl border overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900">Score Changes</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Metric</th>
                        <th className="text-center px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Change</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {Object.entries(comparison.improvements).map(([key, value]) => (
                        <tr key={key} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant={value >= 0 ? 'default' : 'destructive'}>
                              {value >= 0 ? '+' : ''}{value}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <Progress
                                value={Math.max(0, Math.min(100, 50 + value))}
                                className="flex-1 h-2"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resolved issues & new strengths */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comparison.resolvedIssues?.length > 0 && (
                  <div className="rounded-xl border p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center border">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">Resolved Issues</h3>
                        <p className="text-sm text-slate-600">Problems fixed in the latest version</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {comparison.resolvedIssues.map((issue, i) => (
                        <Badge key={i} variant="default" className="bg-green-100 text-green-700">{issue}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {comparison.newStrengths?.length > 0 && (
                  <div className="rounded-xl border p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center border">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">New Strengths</h3>
                        <p className="text-sm text-slate-600">Newly identified strong points</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {comparison.newStrengths.map((s, i) => (
                        <Badge key={i} variant="default" className="bg-blue-100 text-blue-700">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Upload Modal ───────────────────────────────────────────────────── */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Resume">
        <form onSubmit={handleUploadResume} className="p-6 space-y-4">
          {[
            { label: 'PDF File *', key: 'file', type: 'file', accept: '.pdf', required: true },
            { label: 'Resume Title', key: 'title', type: 'text', placeholder: 'e.g., Software Engineer Resume 2025' },
            { label: 'Target Role', key: 'targetRole', type: 'text', placeholder: 'e.g., Senior Software Engineer' },
            { label: 'Industry', key: 'industry', type: 'text', placeholder: 'e.g., Technology, Healthcare' },
            { label: 'Years of Experience', key: 'yearsOfExperience', type: 'number', placeholder: 'e.g., 5' },
          ].map(({ label, key, type, accept, placeholder, required }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input
                type={type}
                accept={accept}
                placeholder={placeholder}
                required={required}
                value={key !== 'file' ? uploadForm[key] : undefined}
                onChange={(e) => setUploadForm({ ...uploadForm, [key]: key === 'file' ? e.target.files[0] : e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Additional Context</label>
            <textarea
              value={uploadForm.additionalContext}
              onChange={(e) => setUploadForm({ ...uploadForm, additionalContext: e.target.value })}
              placeholder="Any additional information to help with the review..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading.upload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {loading.upload ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {loading.upload ? 'Uploading...' : 'Upload Resume'}
            </button>
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Review Detail Modal ────────────────────────────────────────────── */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => { setShowReviewModal(false); setSelectedReview(null); }}
        title="Review Details"
      >
        {loading.viewReview ? (
          /* ── Skeleton ── */
          <div className="p-8 space-y-8">
            {/* score strip skeleton */}
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-slate-100 animate-pulse" />
                  <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
            <div className="h-px bg-slate-100" />
            {[1,2,3].map(i => (
              <div key={i} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-slate-100 animate-pulse" />
                  <div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="space-y-2 pl-6">
                  {[1,2].map(j => (
                    <div key={j} className="h-3 bg-slate-100 rounded animate-pulse" style={{width: `${70 + j*10}%`}} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : selectedReview && (
          /* ── Content ── */
          <div>
            {/* Score strip */}
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100">
              <div className="grid grid-cols-4 gap-6">
                {[
                  { label: 'Overall',  val: selectedReview.overallScore,                                                               color: 'text-blue-600',   ring: 'ring-blue-200',   bg: 'bg-blue-50' },
                  { label: 'ATS',      val: selectedReview.atsCompatibility?.score  ?? selectedReview.atsCompatibility,                color: 'text-emerald-600', ring: 'ring-emerald-200', bg: 'bg-emerald-50' },
                  { label: 'Content',  val: selectedReview.contentQuality?.score    ?? selectedReview.contentQuality,                  color: 'text-violet-600', ring: 'ring-violet-200', bg: 'bg-violet-50' },
                  { label: 'Format',   val: selectedReview.formatting?.score        ?? selectedReview.formatting,                       color: 'text-amber-600',  ring: 'ring-amber-200',  bg: 'bg-amber-50' },
                ].map(({ label, val, color, ring, bg }) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div className={`w-16 h-16 rounded-full ${bg} ring-2 ${ring} flex items-center justify-center`}>
                      <span className={`text-xl font-bold ${color}`}>{val}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
                    <Progress value={val} className="h-1 w-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-6 space-y-7">

              {/* Strengths */}
              {selectedReview.topStrengths?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Top Strengths</h4>
                  </div>
                  <ul className="space-y-2 pl-6">
                    {selectedReview.topStrengths.map((s, i) => (
                      <li key={i} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedReview.topStrengths?.length > 0 && selectedReview.criticalImprovements?.length > 0 && (
                <div className="h-px bg-slate-100" />
              )}

              {/* Critical Improvements */}
              {selectedReview.criticalImprovements?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                    <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Critical Improvements</h4>
                  </div>
                  <ul className="space-y-2 pl-6">
                    {selectedReview.criticalImprovements.map((item, i) => (
                      <li key={i} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedReview.criticalImprovements?.length > 0 && selectedReview.quickWins?.length > 0 && (
                <div className="h-px bg-slate-100" />
              )}

              {/* Quick Wins */}
              {selectedReview.quickWins?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-blue-400 shrink-0" />
                    <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Quick Wins</h4>
                  </div>
                  <ol className="space-y-2 pl-6">
                    {selectedReview.quickWins.map((w, i) => (
                      <li key={i} className="text-sm text-slate-600 leading-relaxed flex items-start gap-3">
                        <span className="mt-0.5 text-xs font-bold text-blue-400 w-4 shrink-0">{i + 1}.</span>
                        {w}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Detailed Feedback */}
              {selectedReview.detailedFeedback && (
                <>
                  <div className="h-px bg-slate-100" />
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                      <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Detailed Feedback</h4>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed pl-6">
                      {selectedReview.detailedFeedback}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Stats Modal ────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => { setShowStatsModal(false); setStats(null); }}
        title="Resume Statistics"
      >
        {stats && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Reviews', val: stats.totalReviews, color: 'text-blue-600' },
                { label: 'Overall Score', val: stats.currentScores.overall, color: 'text-green-600' },
                { label: 'ATS Score', val: stats.currentScores.ats, color: 'text-purple-600' },
                { label: 'Content Score', val: stats.currentScores.content, color: 'text-orange-600' },
              ].map(({ label, val, color }) => (
                <div key={label} className="rounded-xl border p-4">
                  <p className="text-sm text-slate-600 mb-1">{label}</p>
                  <p className={`text-3xl font-bold ${color}`}>{val}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Overall Improvement</h3>
              </div>
              <div className="p-6 space-y-4">
                {Object.entries(stats.improvement).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <Badge variant={value >= 0 ? 'default' : 'destructive'}>
                        {value >= 0 ? '+' : ''}{value}
                      </Badge>
                    </div>
                    <Progress value={Math.max(0, Math.min(100, 50 + value))} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            <div className="text-sm text-slate-500 space-y-1">
              <p>First Review: {new Date(stats.firstReview).toLocaleDateString()}</p>
              <p>Latest Review: {new Date(stats.latestReview).toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ResumeReview;