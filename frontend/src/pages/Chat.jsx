import { useState, useEffect, useRef } from 'react';
import { pdfAPI, chatAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, FileText, BookOpen, User, Bot, ChevronLeft, ChevronRight, Brain } from 'lucide-react';

const Chat = () => {
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdfIds, setSelectedPdfIds] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPdfForViewer, setSelectedPdfForViewer] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchPDFs();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchPDFs = async () => {
    try {
      const response = await pdfAPI.getAll();
      setPdfs(response.data.pdfs);
    } catch (err) {
      setError('Failed to fetch PDFs');
    }
  };

  const loadChatHistory = async (pdfId) => {
    try {
      const response = await chatAPI.getHistory(pdfId);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Failed to load chat history');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const togglePdfSelection = (pdfId) => {
    if (selectedPdfIds.includes(pdfId)) {
      setSelectedPdfIds(selectedPdfIds.filter(id => id !== pdfId));
    } else {
      setSelectedPdfIds([...selectedPdfIds, pdfId]);
      // Load chat history for the first selected PDF
      if (selectedPdfIds.length === 0) {
        loadChatHistory(pdfId);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || selectedPdfIds.length === 0) {
      setError('Please select at least one PDF and enter a message');
      return;
    }

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await chatAPI.sendMessage({
        pdfIds: selectedPdfIds,
        message: input
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        citations: response.data.citations,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
      // Remove the user message if request failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear chat history?')) {
      return;
    }

    try {
      if (selectedPdfIds.length > 0) {
        await chatAPI.clearHistory(selectedPdfIds[0]);
        setMessages([]);
      }
    } catch (err) {
      setError('Failed to clear history');
    }
  };

  return (
    <div className="h-[80vh] max-w-full">
      <Tabs defaultValue="chat" className="h-full flex flex-col">
        <TabsList className="w-fit">
          <TabsTrigger value="chat" className="px-4 sm:px-6 text-sm">Chat</TabsTrigger>
          <TabsTrigger value="pdf" className="px-4 sm:px-6 text-sm">PDF Viewer</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 mt-0">
          <div className="flex gap-2 sm:gap-4 h-full">
            {/* PDF Selection Sidebar */}
            <div className={`bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col transition-all duration-300 ${
              sidebarCollapsed ? 'w-14 sm:w-18' : 'w-64 sm:w-80'
            }`}>
              {!sidebarCollapsed ? (
                <>
                  <div className="p-3 sm:p-4 border-b border-slate-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-slate-900 text-sm sm:text-base">Select PDFs</h2>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {pdfs.length}
                        </Badge>
                        <button
                          onClick={() => setSidebarCollapsed(true)}
                          className="p-1 hover:bg-slate-100 rounded transition-colors"
                          title="Collapse sidebar"
                        >
                          <ChevronLeft className="h-4 w-4 text-slate-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <ScrollArea className='h-[calc(75vh-128px)] p-3 sm:p-4'>
                    <div className="space-y-2">
                      {pdfs.map(pdf => (
                        <div
                          key={pdf._id}
                          onClick={() => togglePdfSelection(pdf._id)}
                          className={`p-2 sm:p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                            selectedPdfIds.includes(pdf._id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            <FileText className={`h-4 w-4 mt-1 flex-shrink-0 ${
                              selectedPdfIds.includes(pdf._id) ? 'text-blue-600' : 'text-slate-400'
                            }`} />
                            <div className="flex-1 min-w-0 flex justify-between items-center">
                              <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">
                                {pdf.title?.length > 20 ? pdf.title.slice(0, 24) : pdf.title}{pdf.title?.length > 20 ? '...' : ''}
                              </p>
                              <p className="text-xs text-slate-500 ml-2 whitespace-nowrap">
                                {pdf.totalPages ? `${pdf.totalPages}p` : '...'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <ScrollArea className='h-[calc(75vh-128px)] flex flex-col items-center py-3 sm:py-4 px-2 sm:px-4'>
                  <button
                    onClick={() => setSidebarCollapsed(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors mb-2 flex-shrink-0"
                    title="Expand sidebar"
                  >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                  </button>
                  <div className="flex flex-col gap-2 items-center">
                    {selectedPdfIds.map((id) => (
                      <div
                        key={id}
                        className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0"
                        title={pdfs.find(p => p._id === id)?.title}
                      >
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-w-0">
              {/* Chat Header */}
              <div className="p-3 sm:p-4 border-b border-slate-200 flex-shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900 truncate">Conversation</h2>
                  {selectedPdfIds.length > 0 && (
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {selectedPdfIds.length} PDF{selectedPdfIds.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className='h-[calc(75vh-128px)] p-2 sm:p-4'>
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center p-4 sm:p-8">
                    <div>
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border">
                        <Brain className="h-6 w-6 sm:h-8 sm:w-8" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">No messages yet</h3>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Select PDFs and ask your first question
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`flex gap-2 sm:gap-3 w-full sm:max-w-[85%] ${
                            message.role === 'user' ? 'flex-row-reverse' : ''
                          }`}
                        >
                          <div
                            className={`flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center ${
                              message.role === 'user' ? 'bg-blue-600' : 'bg-slate-200'
                            }`}
                          >
                            {message.role === 'user' ? (
                              <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                            ) : (
                              <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-slate-700" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
                                message.role === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-900'
                              }`}
                            >
                              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            </div>

                            {message.citations && message.citations.length > 0 && (
                              <div className="mt-2 sm:mt-3 space-y-2">
                                <p className="text-xs font-medium text-slate-600 px-2">Citations:</p>
                                {message.citations.map((citation, i) => (
                                  <div
                                    key={i}
                                    className="bg-slate-50 border border-slate-200 rounded-lg p-2 sm:p-3"
                                  >
                                    <p className="text-xs font-medium text-slate-700 mb-1">
                                      Page {citation.pageNumber}
                                    </p>
                                    <p className="text-xs text-slate-600 italic leading-relaxed break-words">
                                      "{citation.snippet}"
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            <p className="text-[10px] text-slate-500 mt-1 sm:mt-2 px-2">
                              {new Date(message.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
              {/* Error Message */}
              {error && (
                <div className="px-3 sm:px-4 pb-2 flex-shrink-0">
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t border-slate-200 p-3 sm:p-4 flex-shrink-0">
                <div className="relative">
                  <Textarea
                    placeholder={
                      selectedPdfIds.length === 0
                        ? 'Select PDFs first...'
                        : 'Ask a question...'
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={selectedPdfIds.length === 0 || loading}
                    rows={2}
                    className="resize-none pr-12 bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || selectedPdfIds.length === 0 || loading}
                    size="icon"
                    className="absolute bottom-2 right-2 h-7 w-7 sm:h-8 sm:w-8 bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pdf" className="flex-1 mt-0">
          <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
            {/* PDF Viewer Header */}
            <div className="p-3 sm:p-4 border-b border-slate-200 flex-shrink-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900">PDF Viewer</h2>
                <Select value={selectedPdfForViewer || ''} onValueChange={setSelectedPdfForViewer}>
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Select a PDF to view" />
                  </SelectTrigger>
                  <SelectContent>
                    {pdfs.map(pdf => (
                      <SelectItem key={pdf._id} value={pdf._id}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-500" />
                          <span className="truncate text-sm">{pdf.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* PDF Content */}
            <div className="flex-1 p-3 sm:p-6 overflow-hidden">
              {selectedPdfForViewer ? (
                <div className="w-full h-full flex flex-col">
                  <iframe
                    src={`${pdfAPI.getFileUrl(selectedPdfForViewer)}#toolbar=0&navpanes=0`}
                    className="w-full flex-1 border border-slate-200 rounded-lg"
                    title="PDF Viewer"
                    allow="fullscreen"
                  />
                  <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-center flex-shrink-0">
                    <a
                      href={pdfAPI.getFileUrl(selectedPdfForViewer)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                    >
                      Open in new tab ↗
                    </a>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center px-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Select a PDF to view</h3>
                    <p className="text-slate-600 text-xs sm:text-sm">Choose a document from the dropdown above</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Chat;