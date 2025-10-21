import { useState, useEffect } from 'react';
import { resumeAPI, chatAPI } from '../services/api';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  AlertCircle,
  Zap,
  BarChart3,
  MessageSquare,
  Upload,
  Trash2,
  Eye,
  Calendar,
  Award,
  Briefcase,
  Code,
  ListChecks,
  Sparkles,
  History,
  ArrowRight,
  Download
} from 'lucide-react';

const ResumeReview = () => {
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [currentReview, setCurrentReview] = useState(null);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({
    targetRole: '',
    industry: '',
    yearsOfExperience: '',
    additionalContext: ''
  });

  useEffect(() => {
    fetchResumes();
  }, []);

  useEffect(() => {
    if (selectedResume) {
      fetchResumeData(selectedResume);
    }
  }, [selectedResume]);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const response = await resumeAPI.getUserResumes();
      setResumes(response.data.resumes);
      
      if (response.data.resumes.length > 0) {
        setSelectedResume(response.data.resumes[0].id);
      }
    } catch (err) {
      setError('Failed to fetch resumes');
    } finally {
      setLoading(false);
    }
  };

  const fetchResumeData = async (resumeId) => {
    try {
      const [historyRes, statsRes, chatHistoryRes, suggestionsRes] = await Promise.all([
        resumeAPI.getReviewHistory(resumeId),
        resumeAPI.getResumeStats(resumeId),
        chatAPI.getChatHistory(resumeId),
        chatAPI.getSuggestedQuestions(resumeId)
      ]);

      setReviewHistory(historyRes.data.reviews);
      setStats(statsRes.data.stats);
      setChatMessages(chatHistoryRes.data.messages || []);
      setSuggestedQuestions(suggestionsRes.data.suggestions || []);
      
      if (historyRes.data.reviews.length > 0) {
        setCurrentReview(historyRes.data.reviews[0]);
      }
    } catch (err) {
      console.error('Failed to fetch resume data:', err);
    }
  };

  const handleGenerateReview = async () => {
    if (!selectedResume) return;
    
    setGenerating(true);
    try {
      const response = await resumeAPI.generateReview(selectedResume, uploadData);
      setCurrentReview(response.data.review);
      await fetchResumeData(selectedResume);
    } catch (err) {
      setError('Failed to generate review');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendMessage = async (message = chatInput) => {
    if (!message.trim() || !selectedResume) return;

    setChatLoading(true);
    const userMessage = { role: 'user', content: message };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    try {
      const response = await chatAPI.sendMessage({
        pdfIds: [selectedResume],
        message: message
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        citations: response.data.citations
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setChatLoading(false);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!confirm('Are you sure you want to delete this resume and all its reviews?')) return;
    
    try {
      await resumeAPI.deleteResume(resumeId);
      await fetchResumes();
      setSelectedResume(null);
      setCurrentReview(null);
    } catch (err) {
      setError('Failed to delete resume');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your resumes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-10 w-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-slate-900">No Resumes Yet</h2>
        <p className="text-slate-600 mb-6">Upload your first resume to get expert feedback</p>
        <Button onClick={() => setShowUpload(true)} className="bg-blue-600 hover:bg-blue-700">
          <Upload className="h-4 w-4 mr-2" />
          Upload Resume
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Resume Review</h1>
          <p className="text-slate-600 mt-1">Get AI-powered feedback to improve your resume</p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="bg-blue-600 hover:bg-blue-700">
          <Upload className="h-4 w-4 mr-2" />
          Upload New Resume
        </Button>
      </div>

      {/* Resume Selector */}
      <div className="flex items-center space-x-3 overflow-x-auto pb-2">
        {resumes.map((resume) => (
          <button
            key={resume.id}
            onClick={() => setSelectedResume(resume.id)}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl border transition-all whitespace-nowrap ${
              selectedResume === resume.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              selectedResume === resume.id ? 'bg-blue-100' : 'bg-slate-100'
            }`}>
              <FileText className={`h-5 w-5 ${
                selectedResume === resume.id ? 'text-blue-600' : 'text-slate-600'
              }`} />
            </div>
            <div className="text-left">
              <p className="font-medium text-slate-900">{resume.title}</p>
              <p className="text-xs text-slate-500">
                {resume.reviewCount} {resume.reviewCount === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </button>
        ))}
      </div>

      {currentReview ? (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Overall Score</p>
                  <p className="text-3xl font-bold text-slate-900">{currentReview.overallScore}</p>
                  <p className="text-xs text-slate-500 mt-1">out of 100</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center border">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">ATS Score</p>
                  <p className="text-3xl font-bold text-slate-900">{currentReview.atsCompatibility.score}</p>
                  <Badge 
                    variant={currentReview.atsCompatibility.score >= 70 ? 'default' : 'destructive'}
                    className="mt-2"
                  >
                    {currentReview.atsCompatibility.score >= 80 ? 'Excellent' : 
                     currentReview.atsCompatibility.score >= 70 ? 'Good' : 'Needs Work'}
                  </Badge>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center border">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Content Quality</p>
                  <p className="text-3xl font-bold text-slate-900">{currentReview.contentQuality.score}</p>
                  <p className="text-xs text-slate-500 mt-1">{currentReview.contentQuality.clarity}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center border">
                  <ListChecks className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Formatting</p>
                  <p className="text-3xl font-bold text-slate-900">{currentReview.formatting.score}</p>
                  <p className="text-xs text-slate-500 mt-1">{currentReview.formatting.readability}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center border">
                  <Code className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="border border-slate-200">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="chat">AI Assistant</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Quick Wins */}
              <div className="rounded-xl border p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-yellow-100">
                    <Zap className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Quick Wins</h3>
                    <p className="text-sm text-slate-600">Easy improvements with high impact</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {currentReview.quickWins.map((win, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <Sparkles className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-700">{win}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths and Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Strengths */}
                <div className="rounded-xl border p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Top Strengths</h3>
                      <p className="text-sm text-slate-600">What's working well</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {currentReview.topStrengths.map((strength, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-700">{strength}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Critical Improvements */}
                <div className="rounded-xl border p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-100">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Critical Improvements</h3>
                      <p className="text-sm text-slate-600">Priority areas to address</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {currentReview.criticalImprovements.map((improvement, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-700">{improvement}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ATS Compatibility Details */}
              <div className="rounded-xl border p-6">
                <h3 className="font-semibold text-slate-900 mb-4">ATS Compatibility Details</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">ATS Score</span>
                      <Badge variant={currentReview.atsCompatibility.score >= 70 ? 'default' : 'destructive'}>
                        {currentReview.atsCompatibility.score}/100
                      </Badge>
                    </div>
                    <Progress value={currentReview.atsCompatibility.score} className="h-2" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">Format Issues</p>
                      <div className="space-y-1">
                        {currentReview.atsCompatibility.formatIssues.map((issue, index) => (
                          <div key={index} className="text-sm text-slate-600 flex items-start space-x-2">
                            <span className="text-red-500">•</span>
                            <span>{issue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">Recommendations</p>
                      <div className="space-y-1">
                        {currentReview.atsCompatibility.recommendations.map((rec, index) => (
                          <div key={index} className="text-sm text-slate-600 flex items-start space-x-2">
                            <span className="text-green-500">•</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Detailed Analysis Tab */}
            <TabsContent value="detailed" className="space-y-4">
              {/* Section-by-Section Breakdown */}
              <div className="rounded-xl border overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900">Section-by-Section Analysis</h3>
                  <p className="text-sm text-slate-600 mt-1">Detailed feedback for each resume section</p>
                </div>
                <div className="divide-y divide-slate-200">
                  {currentReview.sections.map((section, index) => (
                    <div key={index} className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            section.present ? 'bg-blue-100' : 'bg-slate-100'
                          }`}>
                            <FileText className={`h-5 w-5 ${
                              section.present ? 'text-blue-600' : 'text-slate-400'
                            }`} />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900">{section.name}</h4>
                            {!section.present && (
                              <Badge variant="secondary" className="mt-1">Missing</Badge>
                            )}
                          </div>
                        </div>
                        {section.present && (
                          <Badge variant={section.score >= 70 ? 'default' : 'secondary'}>
                            {section.score}/100
                          </Badge>
                        )}
                      </div>

                      {section.present && (
                        <>
                          <p className="text-sm text-slate-600 mb-4">{section.feedback}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {section.strengths.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-green-700 mb-2">Strengths</p>
                                <div className="space-y-1">
                                  {section.strengths.map((strength, idx) => (
                                    <div key={idx} className="text-sm text-slate-600 flex items-start space-x-2">
                                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                      <span>{strength}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {section.improvements.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-red-700 mb-2">Improvements</p>
                                <div className="space-y-1">
                                  {section.improvements.map((improvement, idx) => (
                                    <div key={idx} className="text-sm text-slate-600 flex items-start space-x-2">
                                      <ArrowRight className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                      <span>{improvement}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Quality & Formatting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Content Quality</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Overall Score</span>
                        <Badge>{currentReview.contentQuality.score}/100</Badge>
                      </div>
                      <Progress value={currentReview.contentQuality.score} className="h-2 mb-4" />
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Quantifiable Achievements</span>
                        <Badge variant={currentReview.contentQuality.hasQuantifiableAchievements ? 'default' : 'secondary'}>
                          {currentReview.contentQuality.hasQuantifiableAchievements ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Action Verb Usage</span>
                        <Badge variant="outline">{currentReview.contentQuality.actionVerbUsage}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Clarity</span>
                        <Badge variant="outline">{currentReview.contentQuality.clarity}</Badge>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-700">{currentReview.contentQuality.feedback}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Formatting</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Overall Score</span>
                        <Badge>{currentReview.formatting.score}/100</Badge>
                      </div>
                      <Progress value={currentReview.formatting.score} className="h-2 mb-4" />
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Consistency</span>
                        <Badge variant="outline">{currentReview.formatting.consistency}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Readability</span>
                        <Badge variant="outline">{currentReview.formatting.readability}</Badge>
                      </div>
                    </div>

                    {currentReview.formatting.issues.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-slate-700 mb-2">Issues</p>
                        <div className="space-y-1">
                          {currentReview.formatting.issues.map((issue, idx) => (
                            <div key={idx} className="text-sm text-slate-600 flex items-start space-x-2">
                              <span className="text-red-500">•</span>
                              <span>{issue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed Feedback */}
              <div className="rounded-xl border p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Comprehensive Feedback</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-slate-700 whitespace-pre-line">{currentReview.detailedFeedback}</p>
                </div>
              </div>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Technical Skills */}
                <div className="rounded-xl border p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Code className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-slate-900">Technical Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentReview.skillsAnalysis.technicalSkills.map((skill, index) => (
                      <Badge key={index} variant="default" className="bg-blue-100 text-blue-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Soft Skills */}
                <div className="rounded-xl border p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Briefcase className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-slate-900">Soft Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentReview.skillsAnalysis.softSkills.map((skill, index) => (
                      <Badge key={index} variant="default" className="bg-purple-100 text-purple-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="rounded-xl border p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-slate-900">Missing Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentReview.skillsAnalysis.missingSkills.map((skill, index) => (
                      <Badge key={index} variant="destructive" className="bg-red-100 text-red-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Recommended Skills */}
                <div className="rounded-xl border p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Sparkles className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-semibold text-slate-900">Recommended Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentReview.skillsAnalysis.recommendedSkills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-yellow-100 text-yellow-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Skills Match Score */}
              <div className="rounded-xl border p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Skills Match for Target Role</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      How well your skills match {currentReview.targetRole || 'target role'}
                    </span>
                    <Badge variant={currentReview.skillsAnalysis.skillsMatchScore >= 70 ? 'default' : 'secondary'}>
                      {currentReview.skillsAnalysis.skillsMatchScore}/100
                    </Badge>
                  </div>
                  <Progress value={currentReview.skillsAnalysis.skillsMatchScore} className="h-3" />
                </div>
              </div>
            </TabsContent>

        // ... continuing from previous TabsContent for Progress

            {/* Progress Tab */}
            <TabsContent value="progress" className="space-y-4">
              {stats ? (
                <>
                  {/* Score Progress Over Time */}
                  <div className="rounded-xl border p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Score Progress Over Time</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 rounded-lg bg-blue-50">
                        <p className="text-sm text-slate-600 mb-1">Overall Score</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {stats.currentScores.overall}
                        </p>
                        <div className="flex items-center justify-center space-x-1 mt-1">
                          {stats.improvement.overall >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm ${stats.improvement.overall >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stats.improvement.overall >= 0 ? '+' : ''}{stats.improvement.overall}
                          </span>
                        </div>
                      </div>

                      <div className="text-center p-4 rounded-lg bg-green-50">
                        <p className="text-sm text-slate-600 mb-1">ATS Score</p>
                        <p className="text-2xl font-bold text-green-600">
                          {stats.currentScores.ats}
                        </p>
                        <div className="flex items-center justify-center space-x-1 mt-1">
                          {stats.improvement.ats >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm ${stats.improvement.ats >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stats.improvement.ats >= 0 ? '+' : ''}{stats.improvement.ats}
                          </span>
                        </div>
                      </div>

                      <div className="text-center p-4 rounded-lg bg-purple-50">
                        <p className="text-sm text-slate-600 mb-1">Content</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {stats.currentScores.content}
                        </p>
                        <div className="flex items-center justify-center space-x-1 mt-1">
                          {stats.improvement.content >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm ${stats.improvement.content >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stats.improvement.content >= 0 ? '+' : ''}{stats.improvement.content}
                          </span>
                        </div>
                      </div>

                      <div className="text-center p-4 rounded-lg bg-yellow-50">
                        <p className="text-sm text-slate-600 mb-1">Formatting</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {stats.currentScores.formatting}
                        </p>
                        <div className="flex items-center justify-center space-x-1 mt-1">
                          {stats.improvement.formatting >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm ${stats.improvement.formatting >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stats.improvement.formatting >= 0 ? '+' : ''}{stats.improvement.formatting}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Overall Score Trend</p>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                            style={{ width: `${stats.currentScores.overall}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">ATS Compatibility Trend</p>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-400 to-green-600"
                            style={{ width: `${stats.currentScores.ats}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Review History Timeline */}
                  <div className="rounded-xl border p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <History className="h-5 w-5 text-slate-600" />
                      <h3 className="font-semibold text-slate-900">Review History</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                      Total Reviews: {stats.totalReviews} | 
                      First Review: {new Date(stats.firstReview).toLocaleDateString()} | 
                      Latest: {new Date(stats.latestReview).toLocaleDateString()}
                    </p>

                    {reviewHistory.length > 0 ? (
                      <div className="space-y-3">
                        {reviewHistory.slice(0, 5).map((review) => (
                          <div 
                            key={review._id} 
                            className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 cursor-pointer"
                            onClick={() => setCurrentReview(review)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-bold text-blue-600">
                                  {review.overallScore}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {review.targetRole || 'General Review'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {new Date(review.reviewedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">
                                ATS: {review.atsCompatibility.score}
                              </Badge>
                              <Eye className="h-4 w-4 text-slate-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-slate-500 py-8">No review history yet</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">Generate a review to see progress tracking</p>
                </div>
              )}
            </TabsContent>

            {/* Chat Tab */}
            <TabsContent value="chat" className="space-y-4">
              <div className="rounded-xl border overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-slate-900">AI Career Coach</h3>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    Get personalized advice based on your resume and review
                  </p>
                </div>

                {/* Suggested Questions */}
                {suggestedQuestions.length > 0 && chatMessages.length === 0 && (
                  <div className="p-4 border-b border-slate-200 bg-blue-50">
                    <p className="text-sm font-medium text-slate-700 mb-3">Suggested questions:</p>
                    <div className="space-y-2">
                      {suggestedQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleSendMessage(question)}
                          className="w-full text-left px-4 py-2 rounded-lg bg-white border border-blue-200 hover:border-blue-400 text-sm text-slate-700 transition-colors"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Messages */}
                <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="text-slate-600 mb-2">Start a conversation</p>
                      <p className="text-sm text-slate-500">
                        Ask questions about improving your resume
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line">{message.content}</p>
                          {message.citations && message.citations.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-300">
                              <p className="text-xs text-slate-600 mb-1">References:</p>
                              {message.citations.map((citation, idx) => (
                                <p key={idx} className="text-xs text-slate-500">
                                  Page {citation.pageNumber}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 rounded-lg p-4">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-slate-200">
                  <div className="flex space-x-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="Ask about your resume..."
                      className="flex-1"
                      disabled={chatLoading}
                    />
                    <Button
                      onClick={() => handleSendMessage()}
                      disabled={!chatInput.trim() || chatLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        /* No Review Yet - Generate First Review */
        <div className="text-center py-16 rounded-xl border">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-slate-900">Generate Your First Review</h2>
          <p className="text-slate-600 mb-6">Get AI-powered feedback on your resume in seconds</p>
          
          <div className="max-w-md mx-auto space-y-4 mb-6">
            <Input
              placeholder="Target Role (e.g., Senior Software Engineer)"
              value={uploadData.targetRole}
              onChange={(e) => setUploadData({...uploadData, targetRole: e.target.value})}
            />
            <Input
              placeholder="Industry (e.g., Technology, Finance)"
              value={uploadData.industry}
              onChange={(e) => setUploadData({...uploadData, industry: e.target.value})}
            />
            <Input
              type="number"
              placeholder="Years of Experience"
              value={uploadData.yearsOfExperience}
              onChange={(e) => setUploadData({...uploadData, yearsOfExperience: e.target.value})}
            />
            <Textarea
              placeholder="Additional context (optional)"
              value={uploadData.additionalContext}
              onChange={(e) => setUploadData({...uploadData, additionalContext: e.target.value})}
              rows={3}
            />
          </div>

          <Button
            onClick={handleGenerateReview}
            disabled={generating}
            className="bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing Resume...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Review
              </>
            )}
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      {currentReview && (
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleGenerateReview}
            disabled={generating}
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            {generating ? 'Generating...' : 'Generate New Review'}
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                const resume = resumes.find(r => r.id === selectedResume);
                if (resume) {
                  window.open(pdfAPI.getFileUrl(selectedResume), '_blank');
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              View Resume
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteResume(selectedResume)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Resume
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeReview;