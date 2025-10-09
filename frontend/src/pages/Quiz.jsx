import { useState, useEffect } from 'react';
import { pdfAPI, quizAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckCircle2, XCircle, RefreshCw, FileText, Loader2 } from 'lucide-react';

const Quiz = () => {
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdfIds, setSelectedPdfIds] = useState([]);
  const [questionTypes, setQuestionTypes] = useState(['MCQ']);
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPDFs();
  }, []);

  const fetchPDFs = async () => {
    try {
      const response = await pdfAPI.getAll();
      setPdfs(response.data.pdfs);
    } catch (err) {
      setError('Failed to fetch PDFs');
    }
  };

  const handleGenerateQuiz = async () => {
    if (selectedPdfIds.length === 0) {
      setError('Please select at least one PDF');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await quizAPI.generate({
        pdfIds: selectedPdfIds,
        questionTypes,
        numberOfQuestions: parseInt(numberOfQuestions)
      });

      setQuiz(response.data.questions);
      setQuizData(response.data.quizData);
      setUserAnswers({});
      setCurrentQuestion(0);
      setSubmitted(false);
      setResult(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (value) => {
    setUserAnswers({
      ...userAnswers,
      [currentQuestion]: value
    });
  };

  const handleNext = () => {
    if (currentQuestion < quiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(userAnswers).length < quiz.length) {
      if (!window.confirm('You have not answered all questions. Submit anyway?')) {
        return;
      }
    }

    setLoading(true);
    try {
      const answersArray = quiz.map((_, index) => userAnswers[index] || '');

      const response = await quizAPI.submit({
        pdfId: selectedPdfIds[0],
        questions: quizData,
        userAnswers: answersArray
      });

      setResult(response.data);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuiz(null);
    setQuizData(null);
    setUserAnswers({});
    setCurrentQuestion(0);
    setSubmitted(false);
    setResult(null);
  };

  const toggleQuestionType = (type) => {
    if (questionTypes.includes(type)) {
      setQuestionTypes(questionTypes.filter(t => t !== type));
    } else {
      setQuestionTypes([...questionTypes, type]);
    }
  };

  const togglePdfSelection = (pdfId) => {
    if (selectedPdfIds.includes(pdfId)) {
      setSelectedPdfIds(selectedPdfIds.filter(id => id !== pdfId));
    } else {
      setSelectedPdfIds([...selectedPdfIds, pdfId]);
    }
  };

  if (!quiz) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Select Coursebooks</CardTitle>
            <CardDescription>Choose one or more PDFs to generate questions from</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
              {pdfs.map(pdf => (
                <label
                  key={pdf._id}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedPdfIds.includes(pdf._id)
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPdfIds.includes(pdf._id)}
                    onChange={() => togglePdfSelection(pdf._id)}
                    className="accent-blue-600 h-4 w-4"
                  />
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-800">{pdf.title}</span>
                  </div>
                </label>
              ))}
            </div>

          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            {/* Question Types Section */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-700">Question Types</h4>
              <div className="flex flex-wrap gap-2">
                {['MCQ', 'SAQ', 'LAQ'].map(type => (
                  <Badge
                    key={type}
                    variant={questionTypes.includes(type) ? 'default' : 'outline'}
                    className={`cursor-pointer transition ${questionTypes.includes(type)
                        ? 'bg-blue-600 text-primary-foreground hover:bg-blue-600/90'
                        : 'hover:bg-gray-50'
                      }`}
                    onClick={() => toggleQuestionType(type)}
                  >
                    {type === 'MCQ' && 'Multiple Choice'}
                    {type === 'SAQ' && 'Short Answer'}
                    {type === 'LAQ' && 'Long Answer'}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100" />

            {/* Number of Questions Section */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-700">Number of Questions</h4>
              <Select
                value={numberOfQuestions.toString()}
                onValueChange={setNumberOfQuestions}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Select number" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} Questions
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>



        <Button
          onClick={handleGenerateQuiz}
          variant="blue_btn"
          disabled={loading || selectedPdfIds.length === 0 || questionTypes.length === 0}
          className="w-full"
          size="lg"
        >
          {loading ? <><Loader2 className='h-4 w-4 animate-spin'/> Generating...</> : 'Generate Quiz'}
        </Button>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Results</CardTitle>
            <CardDescription>Your performance summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-6">
              <div className="text-6xl font-bold text-primary mb-2">
                {result.score}%
              </div>
              <p className="text-gray-600">
                {result.correctAnswers} out of {result.totalQuestions} correct
              </p>
            </div>

            <div className="space-y-4">
              {result.questions.map((q, index) => (
                <Card key={index} className={q.isCorrect ? 'border-green-200' : 'border-red-200'}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">{q.type}</Badge>
                          {q.isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <CardTitle className="text-base">{q.question}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {q.type === 'MCQ' && q.options && (
                      <div className="space-y-2">
                        {q.options.map((option, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded ${option === q.correctAnswer
                              ? 'bg-green-50 border border-green-200'
                              : option === q.userAnswer && !q.isCorrect
                                ? 'bg-red-50 border border-red-200'
                                : 'bg-gray-50'
                              }`}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type !== 'MCQ' && (
                      <div className="space-y-2">
                        <div>
                          <Label>Your Answer:</Label>
                          <p className="text-sm mt-1 p-2 bg-gray-50 rounded">{q.userAnswer || 'Not answered'}</p>
                        </div>
                        <div>
                          <Label>Expected Answer:</Label>
                          <p className="text-sm mt-1 p-2 bg-green-50 rounded">{q.correctAnswer}</p>
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 p-3 rounded">
                      <Label className="text-blue-900">Explanation:</Label>
                      <p className="text-sm text-blue-800 mt-1">{q.explanation}</p>
                      {q.pageReference && (
                        <p className="text-xs text-blue-600 mt-1">Reference: Page {q.pageReference}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleReset} className="flex-1 cursor-pointer" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate New Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = quiz[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quiz in Progress</h1>
          <p className="text-gray-600">Question {currentQuestion + 1} of {quiz.length}</p>
        </div>
        <Badge variant="outline">
          {Object.keys(userAnswers).length}/{quiz.length} Answered
        </Badge>
      </div>

      {/* <Progress value={progress} /> */}

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2 mb-2">
            <Badge className="bg-blue-600 text-white">{question.type}</Badge>
            {question.pageReference && (
              <Badge variant="outline">Page {question.pageReference}</Badge>
            )}
          </div>
          <CardTitle>{question.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {question.type === 'MCQ' && question.options && (
            <RadioGroup
              value={userAnswers[currentQuestion] || ''}
              onValueChange={handleAnswerChange}
            >
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {question.type === 'SAQ' && (
            <Textarea
              placeholder="Type your answer here..."
              value={userAnswers[currentQuestion] || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              rows={3}
            />
          )}

          {question.type === 'LAQ' && (
            <Textarea
              placeholder="Write your detailed answer here..."
              value={userAnswers[currentQuestion] || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              rows={6}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>

        <div className="flex space-x-2">
          {currentQuestion === quiz.length - 1 ? (
            <Button variant="blue_btn" className="cursor-pointer" onClick={handleSubmitQuiz} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          ) : (
            <Button onClick={handleNext} variant="blue_btn" className="cursor-pointer">
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;