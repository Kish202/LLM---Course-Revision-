import { useState, useEffect } from 'react';
import { progressAPI, quizAPI } from '../services/api';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  BookOpen, 
  CheckCircle2, 
  Calendar
} from 'lucide-react';

const UserProgress = () => {
  const [dashboard, setDashboard] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, analysisRes] = await Promise.all([
        progressAPI.getDashboard(),
        progressAPI.getAnalysis()
      ]);

      setDashboard(dashboardRes.data);
      setAnalysis(analysisRes.data);
      setRecentAttempts(dashboardRes.data.recentAttempts || []);
    } catch (err) {
      setError('Failed to fetch progress data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your progress...</p>
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

  if (!dashboard || dashboard.totalAttempts === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="h-10 w-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-slate-900">No Progress Yet</h2>
        <p className="text-slate-600">Take your first quiz to start tracking your progress</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Attempts</p>
                <p className="text-3xl font-bold text-slate-900">{dashboard.totalAttempts}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center border">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Average Score</p>
                <p className="text-3xl font-bold text-slate-900">{dashboard.averageScore}%</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center border">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Questions Answered</p>
                <p className="text-3xl font-bold text-slate-900">{dashboard.totalQuestions}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center border">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Performance</p>
                <Badge 
                  variant={dashboard.averageScore >= 70 ? 'default' : 'destructive'}
                  className="text-sm px-3 py-1 mt-1"
                >
                  {dashboard.averageScore >= 80 ? 'Excellent' : 
                   dashboard.averageScore >= 70 ? 'Good' :
                   dashboard.averageScore >= 50 ? 'Average' : 'Needs Work'}
                </Badge>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center border">
                {dashboard.averageScore >= 70 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for detailed view */}
        <Tabs defaultValue="history">
          <TabsList className="border border-slate-200">  
            <TabsTrigger value="history">Quiz History</TabsTrigger>
            <TabsTrigger value="pdfs">By Coursebook</TabsTrigger>
            <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
          </TabsList>

          {/* Quiz History Tab - TABLE FORMAT */}
          <TabsContent value="history">
            <div className="rounded-xl border overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Recent Quiz Attempts</h3>
                <p className="text-sm text-slate-600 mt-1">Your last 10 quiz attempts</p>
              </div>
              {recentAttempts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Coursebook
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="text-center px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Questions
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Score
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {recentAttempts.map((attempt) => (
                        <tr key={attempt.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <BookOpen className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="font-medium text-slate-900">{attempt.pdfTitle}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2 text-sm text-slate-600">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(attempt.completedAt).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm text-slate-900">{attempt.totalQuestions}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Badge 
                              variant={attempt.score >= 70 ? 'outline' : attempt.score >= 50 ? 'secondary' : 'destructive'}
                            >
                              {attempt.score}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-slate-500 py-12">No quiz attempts yet</p>
              )}
            </div>
          </TabsContent>

          {/* Performance by PDF Tab - TABLE FORMAT */}
          <TabsContent value="pdfs">
            <div className="rounded-xl border overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Performance by Coursebook</h3>
                <p className="text-sm text-slate-600 mt-1">How you're doing across different PDFs</p>
              </div>
              {dashboard.performanceByPDF && dashboard.performanceByPDF.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Coursebook
                        </th>
                        <th className="text-center px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Attempts
                        </th>
                        <th className="text-center px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Questions
                        </th>
                        <th className="text-center px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Avg Score
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Progress
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {dashboard.performanceByPDF.map((pdf, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <BookOpen className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="font-medium text-slate-900">{pdf.pdfTitle}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm text-slate-900">{pdf.attempts}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm text-slate-900">{pdf.totalQuestions}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant={pdf.averageScore >= 70 ? 'outline' : 'secondary'}>
                              {pdf.averageScore}%
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <Progress value={pdf.averageScore} className="flex-1 h-2" />
                              <span className="text-xs text-slate-600 whitespace-nowrap">
                                {pdf.averageScore}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-slate-500 py-12">No PDF performance data yet</p>
              )}
            </div>
          </TabsContent>

           {/* Performance Analysis Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="rounded-xl border p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center border">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Strengths</h3>
                    <p className="text-sm text-slate-600">Areas where you excel (≥70%)</p>
                  </div>
                </div>
                {analysis && analysis.strengths && analysis.strengths.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.strengths.map((strength, index) => (
                      <Badge key={index} variant="default" className="bg-green-100 text-green-700 hover:bg-green-200">
                        {strength === 'MCQ' ? 'Multiple Choice' :
                         strength === 'SAQ' ? 'Short Answer' :
                         strength === 'LAQ' ? 'Long Answer' : strength}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Keep practicing to identify your strengths</p>
                )}
              </div>

              {/* Weaknesses */}
              <div className="rounded-xl border p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center border">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Areas to Improve</h3>
                    <p className="text-sm text-slate-600">Topics needing practice (&lt;50%)</p>
                  </div>
                </div>
                {analysis && analysis.weaknesses && analysis.weaknesses.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.weaknesses.map((weakness, index) => (
                      <Badge key={index} variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200">
                        {weakness === 'MCQ' ? 'Multiple Choice' :
                         weakness === 'SAQ' ? 'Short Answer' :
                         weakness === 'LAQ' ? 'Long Answer' : weakness}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Great! No major weaknesses identified</p>
                )}
              </div>
            </div>

            {/* Question Type Performance */}
            <div className="rounded-xl border p-6">
              <h3 className="font-semibold text-slate-900 mb-2">Performance by Question Type</h3>
              <p className="text-sm text-slate-600 mb-6">Your accuracy across different question formats</p>
              {analysis && analysis.topicPerformance && analysis.topicPerformance.length > 0 ? (
                <div className="space-y-5">
                  {analysis.topicPerformance.map((topic, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-900">
                          {topic.type === 'MCQ' ? 'Multiple Choice Questions' :
                           topic.type === 'SAQ' ? 'Short Answer Questions' :
                           topic.type === 'LAQ' ? 'Long Answer Questions' : topic.type}
                        </span>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-slate-600">
                            {topic.correctAnswers}/{topic.totalQuestions}
                          </span>
                          <Badge variant={topic.accuracy >= 70 ? 'outline' : topic.accuracy >= 50 ? 'secondary' : 'destructive'}>
                            {topic.accuracy}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={topic.accuracy} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">No performance data available yet</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProgress;